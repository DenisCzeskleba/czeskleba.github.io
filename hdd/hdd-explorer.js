/* Hydrogen Diffusion Explorer (series-aware) */
(function () {
  const R_DEFAULT = 8.314462618;
  const SAMPLES_PER_SEGMENT = 70;
  const COLORS = [
    "#111827",
    "#0f766e",
    "#2563eb",
    "#ea580c",
    "#6d28d9",
    "#059669",
    "#dc2626",
    "#0891b2",
  ];

  const mount = document.getElementById("hydrogen-explorer-app");
  if (!mount) return;

  const endpoint = mount.getAttribute("data-endpoint") || "/hdd/hdd-groups-public.json";

  const dom = {
    shell: mount.querySelector(".hdd-explorer-shell"),
    status: document.getElementById("hdd-data-status"),
    search: document.getElementById("hdd-search"),
    list: document.getElementById("hdd-series-list"),
    plotButton: document.getElementById("hdd-plot-btn"),
    chart: document.getElementById("hdd-chart"),
    summary: document.getElementById("hdd-selected-summary"),
    panelLeft: mount.querySelector(".hdd-panel-left"),
    unitButtons: document.querySelectorAll("[data-unit]"),
    scaleButtons: document.querySelectorAll("[data-scale]"),
    envelope: document.getElementById("hdd-envelope"),
    numbering: document.getElementById("hdd-numbering"),
    monochrome: document.getElementById("hdd-monochrome"),
    gridX: document.getElementById("hdd-grid-x"),
    gridY: document.getElementById("hdd-grid-y"),
    tempMin: document.getElementById("hdd-temp-min"),
    tempMax: document.getElementById("hdd-temp-max"),
    downloadButtons: document.querySelectorAll(".hdd-downloads button"),
    clearFilters: document.getElementById("hdd-clear-filters"),
    selectAll: document.getElementById("hdd-select-all"),
    deselectAll: document.getElementById("hdd-deselect-all"),
    filterSource: document.getElementById("hdd-filter-source"),
    filterClass: document.getElementById("hdd-filter-class"),
    filterGrade: document.getElementById("hdd-filter-grade"),
    filterComposition: document.getElementById("hdd-filter-composition"),
    filterReported: document.getElementById("hdd-filter-reported"),
    filterEffect: document.getElementById("hdd-filter-effect"),
    filterMethod: document.getElementById("hdd-filter-method"),
    filterModel: document.getElementById("hdd-filter-model"),
    includeUnconfirmed: document.getElementById("hdd-include-unconfirmed"),
  };

  const state = {
    dataset: null,
    seriesList: [],
    seriesById: new Map(),
    selected: new Set(),
    units: "K",
    scale: "log",
    envelope: true,
    numbering: true,
    monochrome: false,
    gridX: true,
    gridY: true,
    tempMin: null,
    tempMax: null,
    includeUnconfirmed: false,
    summaryExpanded: false,
  };

  let currentSeries = [];
  let currentCanvas = null;

  initialize();

  async function initialize() {
    setShellState("loading");
    setStatus(`Loading dataset from ${endpoint}...`, "info");

    const payload = await fetchDataset(endpoint);
    if (!payload || !Array.isArray(payload.groups)) {
      setStatus("Dataset missing or invalid.", "error");
      renderEmptyChart("Dataset missing. Export a new bundle and publish it.");
      return;
    }

    state.dataset = payload;
    const validationIssues = validateDataset(payload);
    if (validationIssues.length) {
      reportValidationIssues(validationIssues);
    }
    const { seriesList, seriesById } = normalizeDataset(payload);
    state.seriesList = seriesList;
    state.seriesById = seriesById;

    setStatus(
      `Loaded ${payload.group_count || payload.groups.length} groups · ${payload.series_count || seriesList.length} series`,
      "ok"
    );

    bindEvents();
    state.monochrome = dom.monochrome?.checked ?? false;
    state.gridX = dom.gridX?.checked ?? true;
    state.gridY = dom.gridY?.checked ?? true;
    state.includeUnconfirmed = dom.includeUnconfirmed?.checked ?? false;
    populateFilters(payload);
    applyFilters();
    selectAllVisible();
    plotSelectedSeries(true);
    updateSummary();
    if (!validationIssues.length && !state.selected.size) {
      renderEmptyChart("Select one or more series, then click Plot.");
    }
    setShellState("ready");
  }

  async function fetchDataset(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      setStatus(`Failed to load dataset (${error.message})`, "error");
      return null;
    }
  }

  function normalizeDataset(payload) {
    const sources = payload.sources || {};
    const seriesList = [];
    const seriesById = new Map();

    payload.groups.forEach((group) => {
      const source = sources[group.source_id] || {};
      const sourceTitle =
        source.clear_name || source.title || group.source_id || "Unknown source";

      (group.series || []).forEach((series, index) => {
        const seriesKeyPart = series.series_id ?? index;
        const seriesId = `${group.group_id}::${seriesKeyPart}::${index}`;
        const segments = series.segments || [];
        const meta = collectSeriesMeta(segments);
        const materialLabel = deriveMaterialLabel(meta);
        const seriesLabel = series.series_value ? String(series.series_value) : "Series";

        const entry = {
          id: seriesId,
          groupId: group.group_id,
          seriesId: series.series_id,
          label: group.label || group.group_id,
          seriesLabel,
          sourceId: group.source_id,
          sourceTitle,
          seriesKey: group.series_key,
          variantKey: group.variant_key,
          variantUnit: group.variant_unit,
          temperatureRange: group.temperature_range_K,
          segments,
          meta,
          materialLabel,
        };

        seriesList.push(entry);
        seriesById.set(seriesId, entry);
      });
    });

    return { seriesList, seriesById };
  }

  function validateDataset(payload) {
    const issues = [];
    (payload.groups || []).forEach((group) => {
      (group.series || []).forEach((series) => {
        (series.segments || []).forEach((segment) => {
          const model = segment.model || {};
          const range = segment.temperature_validity_K;
          if (!Array.isArray(range) || range.length !== 2) {
            issues.push(
              `Entry ${segment.entry_id} missing temperature_validity_K [Tmin, Tmax].`
            );
            return;
          }
          const Tmin = range[0];
          const Tmax = range[1];
          if (!isFiniteNumber(Tmin) || !isFiniteNumber(Tmax)) {
            issues.push(
              `Entry ${segment.entry_id} has invalid temperature_validity_K values.`
            );
            return;
          }

          if (model.type === "single_point") {
            if (Tmin !== Tmax) {
              issues.push(
                `Single-point entry ${segment.entry_id} has a temperature range (${Tmin}–${Tmax} K). Expected [T, T].`
              );
            }
            if (!isFiniteNumber(model.diffusivity_mm2_per_s)) {
              issues.push(
                `Single-point entry ${segment.entry_id} missing diffusivity_mm2_per_s.`
              );
            }
          } else {
            if (!(Tmax > Tmin)) {
              issues.push(
                `Entry ${segment.entry_id} has a non-positive temperature range (${Tmin}–${Tmax} K).`
              );
            }
            if (model.type === "arrhenius") {
              if (!isFiniteNumber(model.D0_mm2_per_s) || !isFiniteNumber(model.Q_J_per_mol)) {
                issues.push(
                  `Arrhenius entry ${segment.entry_id} missing D0_mm2_per_s or Q_J_per_mol.`
                );
              }
            }
            if (model.type === "power") {
              if (!isFiniteNumber(model.A_mm2_per_s) || !isFiniteNumber(model.n)) {
                issues.push(
                  `Power entry ${segment.entry_id} missing A_mm2_per_s or n.`
                );
              }
            }
          }
        });
      });
    });
    return issues;
  }

  function reportValidationIssues(issues) {
    const message = `Dataset validation failed with ${issues.length} issue(s). Check console for details.`;
    setStatus(message, "error");
    console.error("HDD dataset validation issues:", issues);
    if (dom.summary) {
      const list = issues.slice(0, 12).map((item) => `<li>${item}</li>`).join("");
      const tail = issues.length > 12 ? `<li>…and ${issues.length - 12} more.</li>` : "";
      dom.summary.innerHTML = `
        <strong>Data issues detected.</strong>
        <p>${message}</p>
        <ul>${list}${tail}</ul>
      `;
    }
    renderEmptyChart("Dataset has validation errors. Fix them before plotting.");
  }

  function collectSeriesMeta(segments) {
    const meta = {
      material_class: new Set(),
      material_grade: new Set(),
      material_microstructure: new Set(),
      material_phase: new Set(),
      material_processing: new Set(),
      material_tags: new Set(),
      chemical_composition: new Set(),
      reported_as: new Set(),
      studied_effects: new Set(),
      measurement_method: new Set(),
      model_type: new Set(),
      plotting_status: new Set(),
    };

    segments.forEach((segment) => {
      const material = segment.material || {};
      addIfPresent(meta.material_class, material.class);
      addIfPresent(meta.material_grade, material.grade);
      addIfPresent(meta.material_microstructure, material.microstructure);
      addIfPresent(meta.material_phase, material.phase);
      (material.processing || []).forEach((value) => addIfPresent(meta.material_processing, value));
      (material.tags || []).forEach((value) => addIfPresent(meta.material_tags, value));
      addIfPresent(meta.chemical_composition, formatChemicalComposition(material.chemical_composition));

      addIfPresent(meta.reported_as, segment.reported_as);
      deriveModelTypeLabels(segment).forEach((label) => addIfPresent(meta.model_type, label));
      addIfPresent(meta.plotting_status, segment.plotting?.status);

      const conditions = segment.conditions || {};
      addIfPresent(meta.measurement_method, conditions.measurement_method);

      const metadata = segment.metadata || {};
      (metadata.studied_effects || []).forEach((value) => addIfPresent(meta.studied_effects, value));
    });

    return meta;
  }

  function deriveModelTypeLabels(segment) {
    const labels = new Set();
    const modelType = segment.model?.type;
    const style = segment.plotting?.style;
    const isLineStyle = typeof style === "string" && style.toLowerCase() === "line";
    if (modelType === "arrhenius") {
      labels.add("Arrhenius");
    } else if (modelType === "single_point") {
      if (!isLineStyle) {
        labels.add("Single Points");
      }
    } else if (modelType === "power") {
      labels.add("Digitized/Series");
    } else if (modelType) {
      labels.add(String(modelType));
    }

    if (isLineStyle) {
      labels.add("Digitized/Series");
    }

    return Array.from(labels);
  }

  function deriveMaterialLabel(meta) {
    const classLabel = first(meta.material_class);
    const grade = first(meta.material_grade);
    if (classLabel && grade) return `${classLabel} · ${grade}`;
    return classLabel || grade || null;
  }

  function bindEvents() {
    dom.search?.addEventListener("input", applyFilters);
    dom.list?.addEventListener("change", handleSelectionChange);
    dom.summary?.addEventListener("click", handleSummaryToggle);
    dom.unitButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleUnits(btn))
    );
    dom.scaleButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleScale(btn))
    );
    dom.envelope?.addEventListener("change", () => {
      state.envelope = dom.envelope.checked;
      plotSelectedSeries();
    });
    dom.numbering?.addEventListener("change", () => {
      state.numbering = dom.numbering.checked;
      plotSelectedSeries();
    });
    dom.monochrome?.addEventListener("change", () => {
      state.monochrome = dom.monochrome.checked;
      plotSelectedSeries();
    });
    dom.gridX?.addEventListener("change", () => {
      state.gridX = dom.gridX.checked;
      plotSelectedSeries();
    });
    dom.gridY?.addEventListener("change", () => {
      state.gridY = dom.gridY.checked;
      plotSelectedSeries();
    });
    [dom.tempMin, dom.tempMax].forEach((input) =>
      input?.addEventListener("input", () => {
        state.tempMin = parseNumber(dom.tempMin?.value);
        state.tempMax = parseNumber(dom.tempMax?.value);
        applyFilters();
      })
    );
    dom.plotButton?.addEventListener("click", () => plotSelectedSeries(true));
    dom.downloadButtons?.forEach((button) =>
      button.addEventListener("click", () => handleDownload(button))
    );
    dom.clearFilters?.addEventListener("click", clearFilters);
    dom.selectAll?.addEventListener("click", selectAllVisible);
    dom.deselectAll?.addEventListener("click", deselectAllVisible);
    dom.includeUnconfirmed?.addEventListener("change", () => {
      state.includeUnconfirmed = dom.includeUnconfirmed.checked;
      applyFilters();
      plotSelectedSeries(true);
    });

    [
      dom.filterSource,
      dom.filterClass,
      dom.filterGrade,
      dom.filterComposition,
      dom.filterReported,
      dom.filterEffect,
      dom.filterMethod,
      dom.filterModel,
    ].forEach((listbox) => {
      if (!listbox) return;
      listbox.addEventListener("change", applyFilters);
    });
  }

  function populateFilters(payload) {
    const sources = payload.sources || {};
    const sourceOptions = Object.values(sources)
      .map((source) => ({
        value: source.source_id || "",
        label: source.clear_name || source.title || source.source_id || "Unknown source",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setSelectOptions(dom.filterSource, sourceOptions);
    setSelectOptions(dom.filterClass, toOptions(payload.filters?.material_class));
    setSelectOptions(dom.filterGrade, toOptions(payload.filters?.material_grade));
    setSelectOptions(dom.filterComposition, toOptions(collectMetaValues(state.seriesList, "chemical_composition")));
    setSelectOptions(dom.filterReported, toOptions(payload.filters?.reported_as));
    setSelectOptions(dom.filterEffect, toOptions(payload.filters?.studied_effects));
    setSelectOptions(dom.filterMethod, toOptions(payload.filters?.measurement_method));
    setSelectOptions(dom.filterModel, toOptions(collectMetaValues(state.seriesList, "model_type")));
  }

  function setSelectOptions(listbox, options) {
    if (!listbox) return;
    listbox.innerHTML = "";
    options.forEach((option) => {
      const item = document.createElement("label");
      item.className = "hdd-filter-item";
      item.dataset.value = option.value;
      item.innerHTML = `
        <input type="checkbox" value="${escapeHtml(option.value)}" />
        <span>${escapeHtml(option.label)}</span>
      `;
      listbox.appendChild(item);
    });
  }

  function toOptions(values = []) {
    return values
      .filter(Boolean)
      .map((value) => ({ value, label: String(value) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function collectMetaValues(seriesList, key) {
    const values = new Set();
    seriesList.forEach((entry) => {
      const set = entry.meta?.[key];
      if (!set) return;
      set.forEach((value) => {
        if (value == null) return;
        values.add(String(value));
      });
    });
    return Array.from(values);
  }

  function formatChemicalComposition(composition) {
    if (!composition || typeof composition !== "object") return null;
    const basis = composition.basis || "unknown";
    const values = composition.values || {};
    const parts = Object.keys(values)
      .sort()
      .map((key) => {
        const value = values[key];
        if (value == null || value === "") return null;
        const number = Number(value);
        const display = Number.isFinite(number) ? number.toPrecision(4) : String(value);
        return `${key}=${display}`;
      })
      .filter(Boolean);
    if (!parts.length) return null;
    return `${basis}: ${parts.join(", ")}`;
  }

  function clearFilters() {
    [dom.filterSource, dom.filterClass, dom.filterGrade, dom.filterComposition, dom.filterReported, dom.filterEffect, dom.filterMethod, dom.filterModel]
      .forEach((listbox) => {
        if (!listbox) return;
        listbox.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
          checkbox.checked = false;
        });
      });
    if (dom.search) dom.search.value = "";
    applyFilters();
  }

  function applyFilters() {
    const previousScrollTop = dom.panelLeft ? dom.panelLeft.scrollTop : null;
    const selectScroll = captureSelectScroll();
    const query = dom.search?.value.trim().toLowerCase() || "";
    const filters = {
      source: selectedValues(dom.filterSource),
      materialClass: selectedValues(dom.filterClass),
      materialGrade: selectedValues(dom.filterGrade),
      chemicalComposition: selectedValues(dom.filterComposition),
      reportedAs: selectedValues(dom.filterReported),
      studiedEffects: selectedValues(dom.filterEffect),
      measurementMethod: selectedValues(dom.filterMethod),
      modelType: selectedValues(dom.filterModel),
      tempMin: state.tempMin,
      tempMax: state.tempMax,
      includeUnconfirmed: state.includeUnconfirmed,
    };

    const filtered = state.seriesList.filter((entry) =>
      entryMatchesFilters(entry, filters, query)
    );

    syncSelectionToVisible(filtered);
    renderSeriesList(filtered);
    updateFilterAvailability(filters, query);
    updateSummary(currentSeries);
    restoreSelectScroll(selectScroll);
    if (dom.panelLeft && previousScrollTop != null) {
      requestAnimationFrame(() => {
        dom.panelLeft.scrollTop = previousScrollTop;
      });
    }
  }

  function captureSelectScroll() {
    const map = new Map();
    [
      dom.filterSource,
      dom.filterClass,
      dom.filterGrade,
      dom.filterComposition,
      dom.filterReported,
      dom.filterEffect,
      dom.filterMethod,
      dom.filterModel,
    ].forEach((listbox) => {
      if (!listbox) return;
      map.set(listbox, listbox.scrollTop);
    });
    return map;
  }

  function restoreSelectScroll(map) {
    if (!map) return;
    map.forEach((scrollTop, listbox) => {
      if (!listbox) return;
      requestAnimationFrame(() => {
        listbox.scrollTop = scrollTop;
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function syncSelectionToVisible(visibleList) {
    const visibleIds = new Set(visibleList.map((entry) => entry.id));
    let changed = false;
    state.selected.forEach((id) => {
      if (!visibleIds.has(id)) {
        state.selected.delete(id);
        changed = true;
      }
    });
    if (changed) {
      currentSeries = currentSeries.filter((series) => visibleIds.has(series.id));
    }
  }

  function entryMatchesFilters(entry, filters, query, ignoreKey = null) {
    if (ignoreKey !== "plottingStatus" && !isPlottingAllowed(entry, filters.includeUnconfirmed)) return false;
    if (ignoreKey !== "source" && filters.source.length && !filters.source.includes(entry.sourceId)) return false;
    if (ignoreKey !== "materialClass" && !matchesSet(filters.materialClass, entry.meta.material_class)) return false;
    if (ignoreKey !== "materialGrade" && !matchesSet(filters.materialGrade, entry.meta.material_grade)) return false;
    if (ignoreKey !== "chemicalComposition" && !matchesSet(filters.chemicalComposition, entry.meta.chemical_composition)) return false;
    if (ignoreKey !== "reportedAs" && !matchesSet(filters.reportedAs, entry.meta.reported_as)) return false;
    if (ignoreKey !== "studiedEffects" && !matchesSet(filters.studiedEffects, entry.meta.studied_effects)) return false;
    if (ignoreKey !== "measurementMethod" && !matchesSet(filters.measurementMethod, entry.meta.measurement_method)) return false;
    if (ignoreKey !== "modelType" && !matchesSet(filters.modelType, entry.meta.model_type)) return false;
    if (ignoreKey !== "tempRange" && !matchesTemperatureRange(entry, filters.tempMin, filters.tempMax)) return false;

    if (query) {
      const haystack = [
        entry.label,
        entry.groupId,
        entry.seriesLabel,
        entry.seriesKey,
        entry.sourceTitle,
        entry.materialLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  }

  function isPlottingAllowed(entry, includeUnconfirmed) {
    if (includeUnconfirmed) return true;
    const statuses = entry.meta?.plotting_status;
    if (!statuses || !statuses.size) return true;
    for (const status of statuses) {
      if (String(status).toLowerCase() !== "plot") return false;
    }
    return true;
  }

  function matchesTemperatureRange(entry, min, max) {
    if (min == null && max == null) return true;
    const segments = entry.segments || [];
    for (const segment of segments) {
      const range = segment.temperature_validity_K || [];
      if (range.length !== 2) continue;
      const segMin = Number(range[0]);
      const segMax = Number(range[1]);
      if (!Number.isFinite(segMin) || !Number.isFinite(segMax)) continue;
      if (min != null && segMax < min) continue;
      if (max != null && segMin > max) continue;
      return true;
    }
    return false;
  }

  function updateFilterAvailability(filters, query) {
    const availability = {
      source: new Set(),
      materialClass: new Set(),
      materialGrade: new Set(),
      chemicalComposition: new Set(),
      reportedAs: new Set(),
      studiedEffects: new Set(),
      measurementMethod: new Set(),
      modelType: new Set(),
    };

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "source")) return;
      if (entry.sourceId) availability.source.add(String(entry.sourceId));
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "materialClass")) return;
      entry.meta.material_class?.forEach((value) => availability.materialClass.add(String(value)));
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "materialGrade")) return;
      entry.meta.material_grade?.forEach((value) => availability.materialGrade.add(String(value)));
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "chemicalComposition")) return;
      entry.meta.chemical_composition?.forEach((value) =>
        availability.chemicalComposition.add(String(value))
      );
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "reportedAs")) return;
      entry.meta.reported_as?.forEach((value) => availability.reportedAs.add(String(value)));
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "studiedEffects")) return;
      entry.meta.studied_effects?.forEach((value) => availability.studiedEffects.add(String(value)));
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "measurementMethod")) return;
      entry.meta.measurement_method?.forEach((value) =>
        availability.measurementMethod.add(String(value))
      );
    });

    state.seriesList.forEach((entry) => {
      if (!entryMatchesFilters(entry, filters, query, "modelType")) return;
      entry.meta.model_type?.forEach((value) => availability.modelType.add(String(value)));
    });

    updateSelectAvailability(dom.filterSource, availability.source);
    updateSelectAvailability(dom.filterClass, availability.materialClass);
    updateSelectAvailability(dom.filterGrade, availability.materialGrade);
    updateSelectAvailability(dom.filterComposition, availability.chemicalComposition);
    updateSelectAvailability(dom.filterReported, availability.reportedAs);
    updateSelectAvailability(dom.filterEffect, availability.studiedEffects);
    updateSelectAvailability(dom.filterMethod, availability.measurementMethod);
    updateSelectAvailability(dom.filterModel, availability.modelType);
  }

  function updateSelectAvailability(listbox, available) {
    if (!listbox) return;
    const items = listbox.querySelectorAll(".hdd-filter-item");
    items.forEach((item) => {
      const checkbox = item.querySelector("input");
      if (!checkbox) return;
      if (checkbox.checked) {
        checkbox.disabled = false;
        item.classList.remove("is-disabled", "is-hidden");
        return;
      }
      const isAvailable = available.size ? available.has(checkbox.value) : true;
      checkbox.disabled = !isAvailable;
      item.classList.toggle("is-disabled", !isAvailable);
      item.classList.toggle("is-hidden", !isAvailable);
    });
  }

  function renderSeriesList(list) {
    if (!dom.list) return;
    dom.list.innerHTML = "";
    if (!list.length) {
      dom.list.innerHTML = '<p class="hdd-empty">No series found.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach((entry) => {
      const option = document.createElement("label");
      option.className = "hdd-group-option";
      const inputId = `hdd-series-${entry.id}`;
      option.setAttribute("for", inputId);
      option.innerHTML = `
        <input type="checkbox" id="${inputId}" value="${entry.id}" ${
        state.selected.has(entry.id) ? "checked" : ""
      } />
        <div>
          <strong>${entry.label}</strong>
          <div class="hdd-group-meta">
            ${entry.sourceTitle}
            ${entry.seriesLabel ? ` · ${entry.seriesLabel}` : ""}
            ${formatRange(entry.temperatureRange)}
            ${entry.materialLabel ? ` · ${entry.materialLabel}` : ""}
          </div>
        </div>
      `;
      fragment.appendChild(option);
    });
    dom.list.appendChild(fragment);
  }

  function selectAllVisible() {
    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
    if (!checkboxes || !checkboxes.length) return;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      state.selected.add(checkbox.value);
    });
    updateSummary();
  }

  function deselectAllVisible() {
    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
    if (checkboxes && checkboxes.length) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    }
    state.selected.clear();
    plotSelectedSeries(true);
  }

  function handleSelectionChange(event) {
    if (!event.target || !event.target.matches("input[type='checkbox']")) return;
    const id = event.target.value;
    if (event.target.checked) {
      state.selected.add(id);
    } else {
      state.selected.delete(id);
    }
    updateSummary();
  }

  function handleSummaryToggle(event) {
    const button = event.target?.closest?.(".hdd-summary-toggle");
    if (!button) return;
    event.preventDefault();
    state.summaryExpanded = !state.summaryExpanded;
    updateSummary();
  }

  function updateSummary(seriesList = null) {
    if (!dom.summary) return;
    if (!state.selected.size) {
      state.summaryExpanded = false;
      dom.summary.innerHTML =
        "<strong>No series selected.</strong><p>Use the checklist to the left to choose datasets for plotting.</p>";
      return;
    }
    const allItems = Array.from(state.selected)
      .map((id) => state.seriesById.get(id))
      .filter(Boolean);
    const plottedSeries = seriesList && seriesList.length ? seriesList : currentSeries;
    const seriesOrder = plottedSeries.length
      ? plottedSeries.map((series, index) => ({ id: series.id, index }))
      : allItems.map((series, index) => ({ id: series.id, index }));
    const orderMap = new Map(seriesOrder.map((item) => [item.id, item.index]));

    const orderedItems = allItems
      .map((series, fallbackIndex) => ({
        series,
        index: orderMap.has(series.id) ? orderMap.get(series.id) : fallbackIndex,
        fallbackIndex,
      }))
      .sort((a, b) => a.index - b.index);

    const previewLimit = 6;
    const maxPreview = state.summaryExpanded ? orderedItems.length : previewLimit;
    const previewItems = orderedItems.slice(0, maxPreview);
    const allItemLines = previewItems.map((item) => {
        const series = item.series;
        const range = formatRangeValue(series.temperatureRange) || "range unknown";
        const ordinal = orderMap.has(series.id) ? orderMap.get(series.id) + 1 : item.fallbackIndex + 1;
        return `<li><span class="hdd-ordinal">${ordinal}.</span> <strong>${seriesDisplayLabel(series)}</strong> - ${series.seriesLabel} - ${range}</li>`;
      });
    const selectedCount = allItems.length;
    const plottedCount = plottedSeries.length;
    const needsToggle = selectedCount > previewLimit;
    const toggleLabel = state.summaryExpanded ? "Show less" : `Show all (${selectedCount})`;
    const toggleButton = needsToggle
      ? `<button type="button" class="hdd-summary-toggle">${toggleLabel}</button>`
      : "";
    const statusLine =
      plottedCount && plottedCount !== selectedCount
        ? `<p>${plottedCount} plotted from current selection. Click "Plot Selected" to refresh.</p>`
        : `<p>${selectedCount} series selected.</p>`;

    dom.summary.innerHTML = `
      <div class="hdd-summary-header">
        <strong>Selected Series</strong>
        ${toggleButton}
      </div>
      ${statusLine}
      <ul>${allItemLines.join("")}</ul>
    `;
  }

  function toggleScale(button) {
    state.scale = button.dataset.scale === "linear" ? "linear" : "log";
    dom.scaleButtons.forEach((btn) =>
      btn.classList.toggle("is-active", btn === button)
    );
    plotSelectedSeries();
  }

  function plotSelectedSeries(force = false) {
    if (!state.selected.size) {
      renderEmptyChart("Select at least one series.");
      currentSeries = [];
      updateSummary();
      return;
    }
    const ids = Array.from(state.selected);
    const series = prepareSeries(ids);
    if (!series.length) {
      renderEmptyChart("No valid samples within the requested range.");
      currentSeries = [];
      updateSummary();
      return;
    }
    currentSeries = series;
    renderChart(series);
    updateSummary(series);
    if (force) setStatus("Plot refreshed.", "ok");
  }

  function prepareSeries(seriesIds) {
    const clampMin = state.tempMin;
    const clampMax = state.tempMax;
    const result = [];

    seriesIds.forEach((seriesId, index) => {
      const entry = state.seriesById.get(seriesId);
      if (!entry) return;
      const samples = sampleSeries(entry, clampMin, clampMax);
      const lineSegments = Array.isArray(samples.lineSegments) ? samples.lineSegments : [];
      const pointSamples = Array.isArray(samples.points) ? samples.points : [];
      if (!lineSegments.length && !pointSamples.length) return;

      const axisLineSegments = lineSegments.map((segment) =>
        segment.map((sample) => ({
          temperature_K: sample.temperature_K,
          temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
          diffusivity: sample.diffusivity,
        }))
      );

      const axisLine = axisLineSegments.flat();

      const axisPoints = pointSamples.map((sample) => ({
        temperature_K: sample.temperature_K,
        temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
        diffusivity: sample.diffusivity,
      }));

      const color = state.monochrome ? "#111111" : COLORS[index % COLORS.length];
      result.push({
        id: entry.id,
        label: entry.label,
        seriesLabel: entry.seriesLabel,
        color,
        axisLine,
        axisLineSegments,
        axisPoints,
        descriptor: entry,
      });
    });

    return result;
  }

  function sampleSeries(entry, clampMin, clampMax) {
    const lineSegments = [];
    const linePoints = [];
    const points = [];
    let usedSinglePointAsLine = false;

    entry.segments.forEach((segment, idx) => {
      const model = segment.model || {};
      const plottingStyle = segment.plotting?.style?.toLowerCase?.() || "";
      if (model.type === "single_point") {
        const temperature = resolveSinglePointTemperature(segment);
        if (temperature == null) return;
        if (!isWithinClamp(temperature, clampMin, clampMax)) return;
        if (plottingStyle === "line") {
          usedSinglePointAsLine = true;
        }
        const target = plottingStyle === "line" ? linePoints : points;
        target.push({ temperature_K: temperature, diffusivity: model.diffusivity_mm2_per_s });
        return;
      }

      const segMin = clampTemperature(segment.temperature_validity_K?.[0], clampMin);
      const segMax = clampTemperature(segment.temperature_validity_K?.[1], clampMax, true);
      if (!(segMax > segMin)) return;
      const steps = Math.max(2, SAMPLES_PER_SEGMENT);
      const segmentLine = [];
      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const temperature = segMin + (segMax - segMin) * ratio;
        const diffusivity = evaluateModel(model, temperature);
        if (diffusivity && diffusivity > 0) {
          segmentLine.push({ temperature_K: temperature, diffusivity });
        }
      }
      if (segmentLine.length) {
        lineSegments.push(segmentLine);
      }
    });

    if (usedSinglePointAsLine && linePoints.length > 1) {
      linePoints.sort((a, b) => a.temperature_K - b.temperature_K);
    }

    if (linePoints.length) {
      lineSegments.push(linePoints);
    }

    return { lineSegments, points };
  }

  function resolveSinglePointTemperature(segment) {
    const range = segment.temperature_validity_K;
    if (Array.isArray(range) && range.length === 2 && isFiniteNumber(range[0]) && isFiniteNumber(range[1])) {
      if (range[0] === range[1]) return range[0];
      failLoudly(
        `Single-point entry ${segment.entry_id} has a temperature range (${range[0]}–${range[1]} K). ` +
          "Expected [T, T] for single_point entries."
      );
      return null;
    }
    failLoudly(`Single-point entry ${segment.entry_id} is missing temperature_validity_K.`);
    return null;
  }

  function evaluateModel(model, temperature_K) {
    if (!model) return null;
    if (model.type === "arrhenius") {
      const D0 = model.D0_mm2_per_s;
      const Q = model.Q_J_per_mol;
      const R = model.R_J_per_molK || R_DEFAULT;
      return D0 * Math.exp(-Q / (R * temperature_K));
    }
    if (model.type === "power") {
      if (model.input !== "theta_C") return null;
      const theta_C = temperature_K - 273.15;
      return model.A_mm2_per_s * Math.pow(theta_C, model.n);
    }
    return null;
  }

  function renderEmptyChart(message) {
    if (!dom.chart) return;
    dom.chart.innerHTML = `<div>${message}</div>`;
    currentCanvas = null;
  }

  function renderChart(series) {
    if (!dom.chart) return;
    const temps = series.flatMap((s) => s.axisLine.map((p) => p.temperature_axis).concat(s.axisPoints.map((p) => p.temperature_axis)));
    const values = series.flatMap((s) => s.axisLine.map((p) => p.diffusivity).concat(s.axisPoints.map((p) => p.diffusivity)));

    if (!temps.length || !values.length) {
      renderEmptyChart("No samples available for plotting.");
      return;
    }

    const canvas = document.createElement("canvas");
    const width = 960;
    const height = 540;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    dom.chart.innerHTML = "";
    dom.chart.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    currentCanvas = canvas;
    const theme = getThemeColors();

    const axisMinX = Math.min(...temps);
    const axisMaxX = Math.max(...temps);
    const positiveValues = values.filter((v) => v > 0);
    const axisMinY = Math.min(...positiveValues);
    const axisMaxY = Math.max(...positiveValues);
    const logMin = Math.log10(axisMinY);
    const logMax = Math.log10(axisMaxY);

    const margin = { top: 30, right: 340, bottom: 70, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    function xToPx(value) {
      return (
        margin.left +
        ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotWidth
      );
    }

    function yToPx(value) {
      if (state.scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    ctx.fillStyle = theme.ink;
    ctx.font = "12px IBM Plex Sans, Arial, sans-serif";
    ctx.textAlign = "center";
    const tempUnitLabel = state.units === "C" ? "°C" : "°K";
    ctx.fillText(
      `Temperature [${tempUnitLabel}]`,
      margin.left + plotWidth / 2,
      margin.top + plotHeight + 36
    );
    ctx.save();
    ctx.translate(15, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Apparent Diffusivity [mm²/s]", 0, 0);
    ctx.restore();

    drawXTicks(ctx, axisMinX, axisMaxX, margin, plotWidth, plotHeight, xToPx, theme, state.gridX);
    drawYTicks(ctx, axisMinY, axisMaxY, logMin, logMax, margin, plotWidth, plotHeight, yToPx, theme, state.gridY);

    fillEnvelopes(series, xToPx, yToPx);

    ctx.lineWidth = 2;
    series.forEach((item, index) => {
      if (item.axisLineSegments?.length) {
        ctx.strokeStyle = item.color;
        item.axisLineSegments.forEach((segment) => {
          if (segment.length < 2) return;
          ctx.beginPath();
          segment.forEach((point, pointIndex) => {
            const x = xToPx(point.temperature_axis);
            const y = yToPx(point.diffusivity);
            if (pointIndex === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        });
      }

      if (item.axisPoints.length) {
        ctx.fillStyle = item.color;
        item.axisPoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(xToPx(point.temperature_axis), yToPx(point.diffusivity), 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (state.numbering) {
        const lastPoint = item.axisLine[item.axisLine.length - 1] || item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          ctx.fillStyle = item.color;
          ctx.font = "11px IBM Plex Sans, Arial, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`${index + 1}`, xToPx(lastPoint.temperature_axis) + 4, yToPx(lastPoint.diffusivity));
        }
      }
    });

    drawLegend(ctx, series, margin, plotWidth, theme);
  }

  function fillEnvelopes(series, xToPx, yToPx) {
    if (!state.envelope) return;
    const buckets = {};
    series.forEach((item) => {
      const band = inferBand(item.descriptor);
      if (!band) return;
      const baseId = stripBand(item.descriptor.groupId);
      const key = `${baseId}::${item.seriesLabel}`;
      buckets[key] = buckets[key] || {};
      buckets[key][band] = item;
    });

    Object.values(buckets).forEach((bucket) => {
      if (!bucket.min || !bucket.max) return;
      const overlap = computeOverlap(bucket.min, bucket.max);
      if (!overlap.temps.length) return;
      const ctx = currentCanvas.getContext("2d");
      ctx.fillStyle = "rgba(15,118,110,0.18)";
      ctx.beginPath();
      overlap.temps.forEach((temperature, idx) => {
        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
        const y = yToPx(overlap.maxVals[idx]);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      for (let i = overlap.temps.length - 1; i >= 0; i--) {
        const temperature = overlap.temps[i];
        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
        const y = yToPx(overlap.minVals[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
  }

  function computeOverlap(minSeries, maxSeries) {
    const temps = [];
    const minVals = [];
    const maxVals = [];
    const start = Math.max(
      minSeries.descriptor.temperatureRange?.[0] || -Infinity,
      maxSeries.descriptor.temperatureRange?.[0] || -Infinity
    );
    const end = Math.min(
      minSeries.descriptor.temperatureRange?.[1] || Infinity,
      maxSeries.descriptor.temperatureRange?.[1] || Infinity
    );
    if (!(end > start)) return { temps, minVals, maxVals };
    const steps = 160;
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const T = start + (end - start) * ratio;
      const minVal = evaluateSeriesAtTemp(minSeries.descriptor, T);
      const maxVal = evaluateSeriesAtTemp(maxSeries.descriptor, T);
      if (minVal && maxVal) {
        temps.push(T);
        minVals.push(minVal);
        maxVals.push(maxVal);
      }
    }
    return { temps, minVals, maxVals };
  }

  function evaluateSeriesAtTemp(descriptor, temperature) {
    for (const segment of descriptor.segments) {
      const range = segment.temperature_validity_K || [];
      if (range.length === 2 && temperature >= range[0] && temperature <= range[1]) {
        if (segment.model?.type === "single_point") return null;
        return evaluateModel(segment.model, temperature);
      }
    }
    return null;
  }

  function inferBand(descriptor) {
    const band = descriptor.segments?.[0]?.metadata?.band;
    if (band) return band;
    const match = descriptor.groupId.match(/_(mean|min|max)$/);
    return match ? match[1] : null;
  }

  function stripBand(groupId) {
    return groupId.replace(/_(mean|min|max)$/, "");
  }

  function drawXTicks(ctx, min, max, margin, width, height, xToPx, theme, drawGrid) {
    const steps = 5;
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.font = "11px IBM Plex Sans, Arial, sans-serif";
    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const x = xToPx(value);
      if (drawGrid) {
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x, margin.top + height);
      ctx.lineTo(x, margin.top + height + 5);
      ctx.stroke();
      ctx.fillText(value.toFixed(0), x, margin.top + height + 16);
    }
  }

  function drawYTicks(ctx, axisMinY, axisMaxY, logMin, logMax, margin, width, height, yToPx, theme, drawGrid) {
    ctx.textAlign = "right";
    ctx.fillStyle = theme.muted;
    ctx.font = "11px IBM Plex Sans, Arial, sans-serif";
    if (state.scale === "linear") {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        if (drawGrid) {
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(margin.left - 5, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        ctx.fillText(value.toExponential(1), margin.left - 8, y + 3);
      }
      return;
    }
    const steps = Math.max(2, Math.round(logMax - logMin));
    const decadeMin = Math.floor(logMin);
    const decadeMax = Math.ceil(logMax);
    const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let decade = decadeMin; decade <= decadeMax; decade++) {
      for (const factor of factors) {
        const value = factor * Math.pow(10, decade);
        if (value < axisMinY || value > axisMaxY) continue;
        const y = yToPx(value);
        if (drawGrid) {
          ctx.save();
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = factor === 1 ? 1.2 : 1;
          ctx.globalAlpha = factor === 1 ? 0.7 : 0.25;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
          ctx.restore();
        }
        const tickLen = factor === 1 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(margin.left - tickLen, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        if (factor === 1 || factor === 2 || factor === 5) {
          ctx.fillText(value.toExponential(1), margin.left - 8, y + 3);
        }
      }
    }
  }

  function drawLegend(ctx, series, margin, width, theme) {
    const legendX = margin.left + width + 10;
    let legendY = margin.top + 10;
    ctx.font = "11px IBM Plex Sans, Arial, sans-serif";
    ctx.textAlign = "left";
    series.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY - 8, 10, 10);
      ctx.fillStyle = theme.ink;
      const label = seriesDisplayLabel(item.descriptor);
      ctx.fillText(`${index + 1}. ${label} - ${item.seriesLabel}`, legendX + 14, legendY);
      legendY += 16;
    });
  }

  function handleDownload(button) {
    if (!currentSeries.length) {
      alert("Select and plot at least one series before downloading.");
      return;
    }
    const type = (button.dataset.download || "").toLowerCase();
    if (type === "json") {
      const payload = currentSeries.map((series) => ({
        group_id: series.descriptor.groupId,
        series_id: series.descriptor.seriesId,
        series_label: series.seriesLabel,
        samples_line: series.axisLine,
        samples_points: series.axisPoints,
      }));
      downloadBlob(
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
        "hdd-selected.json"
      );
    } else if (type === "csv") {
      const rows = ["group_id,series_id,series_label,temperature_axis,diffusivity_mm2_per_s,temperature_K,kind"];
      currentSeries.forEach((series) => {
        series.axisLine.forEach((sample) => {
          rows.push(
            [
              quote(series.descriptor.groupId),
              quote(series.descriptor.seriesId || ""),
              quote(series.seriesLabel),
              sample.temperature_axis.toFixed(2),
              sample.diffusivity.toExponential(6),
              sample.temperature_K.toFixed(2),
              "line",
            ].join(",")
          );
        });
        series.axisPoints.forEach((sample) => {
          rows.push(
            [
              quote(series.descriptor.groupId),
              quote(series.descriptor.seriesId || ""),
              quote(series.seriesLabel),
              sample.temperature_axis.toFixed(2),
              sample.diffusivity.toExponential(6),
              sample.temperature_K.toFixed(2),
              "point",
            ].join(",")
          );
        });
      });
      downloadBlob(
        new Blob([rows.join("\n")], { type: "text/csv" }),
        "hdd-selected.csv"
      );
    } else if (type === "png") {
      if (!currentCanvas) {
        alert("Plot the dataset first to export a PNG.");
        return;
      }
      currentCanvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "hdd-selected.png");
      });
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function quote(value) {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  function setStatus(message, tone = "info") {
    if (!dom.status) return;
    dom.status.textContent = message;
    dom.status.classList.remove("is-error", "is-ok");
    if (tone === "error") dom.status.classList.add("is-error");
    if (tone === "ok") dom.status.classList.add("is-ok");
  }

  function setShellState(stateValue) {
    if (dom.shell) {
      dom.shell.dataset.state = stateValue;
    }
  }

  function parseNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function selectedValues(listbox) {
    if (!listbox) return [];
    return Array.from(listbox.querySelectorAll("input[type='checkbox']:checked")).map(
      (input) => input.value
    );
  }

  function matchesSet(selected, set) {
    if (!selected.length) return true;
    for (const value of selected) {
      if (set.has(value)) return true;
    }
    return false;
  }

  function addIfPresent(set, value) {
    if (value == null) return;
    if (typeof value === "string" && !value.trim()) return;
    if (typeof value === "string" && value.toLowerCase() === "not_reported") return;
    set.add(value);
  }

  function first(set) {
    if (!set || !set.size) return null;
    return Array.from(set)[0];
  }

  function formatRange(range) {
    const value = formatRangeValue(range);
    if (!value) return "";
    return ` ? ${value}`;
  }

  function formatRangeValue(range) {
    if (!range || range.length !== 2) return "";
    if (range[0] == null || range[1] == null) return "";
    const min = Number(range[0]);
    const max = Number(range[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "";
    const minLabel = min.toFixed(0);
    const maxLabel = max.toFixed(0);
    if (minLabel === maxLabel) {
      return `${minLabel}?K`;
    }
    return `${minLabel}?${maxLabel} K`;
  }

  function seriesDisplayLabel(entry) {
    return entry?.sourceTitle || entry?.label || entry?.groupId || "Series";
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function clampTemperature(value, clamp, isMax = false) {
    if (!isFiniteNumber(value)) return null;
    if (clamp == null) return value;
    return isMax ? Math.min(value, clamp) : Math.max(value, clamp);
  }

  function isWithinClamp(value, min, max) {
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
      ink: styles.getPropertyValue("--ink").trim() || "#111827",
      muted: styles.getPropertyValue("--muted").trim() || "#6b7280",
      line: styles.getPropertyValue("--line").trim() || "#d1d5db",
      canvas: styles.getPropertyValue("--canvas").trim() || "#f9fafb",
    };
  }

  function failLoudly(message) {
    console.error(message);
    setStatus(message, "error");
    if (dom.summary) {
      dom.summary.innerHTML = `<strong>Data issue detected.</strong><p>${message}</p>`;
    }
  }
})();
