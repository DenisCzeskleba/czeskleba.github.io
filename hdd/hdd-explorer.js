/* Hydrogen Diffusion Explorer (series-aware) */
(function () {
  const R_DEFAULT = 8.314462618;
  const SAMPLES_PER_SEGMENT = 70;
  const FILTER_LIST_DEFAULT_HEIGHT = 280;
  const FILTER_LIST_MIN_HEIGHT = 150;
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
    openSeries: document.getElementById("hdd-open-series"),
    seriesDrawer: document.getElementById("hdd-series-drawer"),
    chart: document.getElementById("hdd-chart"),
      summary: document.getElementById("hdd-selected-summary"),
      summaryModal: document.getElementById("hdd-summary-modal"),
      summaryCloseButtons: document.querySelectorAll("[data-action='close-summary']"),
      panelLeft: mount.querySelector(".hdd-panel-left"),
    refreshPlot: document.getElementById("hdd-refresh-plot"),
    citationPanel: document.getElementById("hdd-citation"),
    citationLinks: document.querySelectorAll("[data-action='open-citation']"),
    citationAnalysis: document.getElementById("hdd-citation-analysis"),
    citationDatabase: document.getElementById("hdd-citation-database"),
    citationBibtex: document.getElementById("hdd-citation-bibtex"),
    citationRis: document.getElementById("hdd-citation-ris"),
    citationPlain: document.getElementById("hdd-citation-plain"),
    unitButtons: document.querySelectorAll("[data-unit]"),
    scaleButtons: document.querySelectorAll("[data-scale]"),
    envelope: document.getElementById("hdd-envelope"),
    numbering: document.getElementById("hdd-numbering"),
    legendGroup: document.getElementById("hdd-legend-group"),
    monochrome: document.getElementById("hdd-monochrome"),
    gridX: document.getElementById("hdd-grid-x"),
    gridY: document.getElementById("hdd-grid-y"),
    axisXMin: document.getElementById("hdd-axis-x-min"),
    axisXMax: document.getElementById("hdd-axis-x-max"),
    axisYMin: document.getElementById("hdd-axis-y-min"),
    axisYMax: document.getElementById("hdd-axis-y-max"),
    tempMin: document.getElementById("hdd-temp-min"),
    tempMax: document.getElementById("hdd-temp-max"),
    downloadButtons: document.querySelectorAll("[data-download]"),
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
    literatureMode: document.getElementById("hdd-literature-mode"),
    filterModeToggles: document.querySelectorAll("[data-filter-mode]"),
    filterUnknownComposition: document.querySelector("[data-filter-unknown='chemicalComposition']"),
    resetZoom: document.getElementById("hdd-reset-zoom"),
    plotOptionPanels: mount.querySelectorAll(".hdd-plot-options"),
  };

  const state = {
    dataset: null,
    seriesList: [],
    seriesById: new Map(),
    selected: new Set(),
    units: "C",
    scale: "log",
    envelope: true,
    numbering: true,
    legendBySource: true,
    monochrome: false,
    gridX: true,
    gridY: true,
    tempMin: null,
    tempMax: null,
    includeUnconfirmed: false,
    literatureMode: "include",
    includeUnknownComposition: false,
    compositionFilters: {},
    filterMode: {},
    summaryExpanded: false,
    zoom: null,
    axisInputActive: false,
    selectionMode: "filtered",
    filteredList: [],
  };

  let currentSeries = [];
  let currentCanvas = null;
  let lastPlotContext = null;
  let hoverCache = null;

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
    setSelectionMode("filtered");
    updateCitationPanel(payload);

    setStatus(
      `Loaded ${payload.group_count || payload.groups.length} groups · ${payload.series_count || seriesList.length} series`,
      "ok"
    );

    bindEvents();
    state.monochrome = dom.monochrome?.checked ?? false;
    state.gridX = dom.gridX?.checked ?? true;
    state.gridY = dom.gridY?.checked ?? true;
    state.legendBySource = dom.legendGroup?.checked ?? true;
    state.includeUnconfirmed = dom.includeUnconfirmed?.checked ?? false;
    state.literatureMode = dom.literatureMode?.value || "include";
    state.includeUnknownComposition = dom.filterUnknownComposition?.checked ?? false;
    initializeFilterModes();
    populateFilters(payload);
    applyFilters({ replot: false });
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
        const compositionRanges = computeCompositionRanges(segments);
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
          compositionRanges,
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

  function computeCompositionRanges(segments) {
    const ranges = {};
    segments.forEach((segment) => {
      const composition = segment.material?.chemical_composition;
      if (!composition || composition.basis !== "wt_pct") return;
      const values = composition.values || {};
      Object.keys(values).forEach((key) => {
        const element = normalizeElementSymbol(key);
        if (!element) return;
        const raw = values[key];
        const num = Number(raw);
        if (!Number.isFinite(num)) return;
        if (!ranges[element]) {
          ranges[element] = { min: num, max: num };
        } else {
          ranges[element].min = Math.min(ranges[element].min, num);
          ranges[element].max = Math.max(ranges[element].max, num);
        }
      });
    });
    return Object.keys(ranges).length ? ranges : null;
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
    dom.search?.addEventListener("input", () =>
      applyFilters({ preserveManual: true, replot: false })
    );
    dom.list?.addEventListener("change", handleSelectionChange);
    dom.summary?.addEventListener("click", handleSummaryToggle);
    dom.unitButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleUnits(btn))
    );
    dom.scaleButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleScale(btn))
    );
    dom.resetZoom?.addEventListener("click", resetZoom);
    dom.envelope?.addEventListener("change", () => {
      state.envelope = dom.envelope.checked;
      plotSelectedSeries();
    });
    dom.numbering?.addEventListener("change", () => {
      state.numbering = dom.numbering.checked;
      plotSelectedSeries();
    });
    dom.legendGroup?.addEventListener("change", () => {
      state.legendBySource = dom.legendGroup.checked;
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
    [dom.axisXMin, dom.axisXMax, dom.axisYMin, dom.axisYMax].forEach((input) => {
      input?.addEventListener("focus", () => {
        state.axisInputActive = true;
      });
      input?.addEventListener("blur", () => {
        state.axisInputActive = false;
        setZoomFromInputs();
        plotSelectedSeries(true);
      });
      input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          setZoomFromInputs();
          plotSelectedSeries(true);
        }
      });
    });
    dom.filterUnknownComposition?.addEventListener("change", () => {
      state.includeUnknownComposition = dom.filterUnknownComposition.checked;
      applyFilters();
    });
    dom.literatureMode?.addEventListener("change", () => {
      state.literatureMode = dom.literatureMode.value || "include";
      applyFilters();
    });
    dom.filterModeToggles?.forEach((toggle) => {
      toggle.addEventListener("click", (event) => event.stopPropagation());
      toggle.addEventListener("change", () => {
        const key = toggle.dataset.filterMode;
        if (!key) return;
        state.filterMode[key] = toggle.checked ? "exclude" : "include";
        applyFilters();
      });
    });
    [dom.tempMin, dom.tempMax].forEach((input) =>
      input?.addEventListener("input", () => {
        const minC = parseNumber(dom.tempMin?.value);
        const maxC = parseNumber(dom.tempMax?.value);
        state.tempMin = Number.isFinite(minC) ? minC + 273.15 : null;
        state.tempMax = Number.isFinite(maxC) ? maxC + 273.15 : null;
        applyFilters();
      })
    );
    dom.plotButton?.addEventListener("click", () => {
      setZoomFromInputs();
      plotSelectedSeries(true);
    });
    dom.openSeries?.addEventListener("click", () => toggleSeriesDrawer(true));
    dom.refreshPlot?.addEventListener("click", () => {
      setZoomFromInputs();
      plotSelectedSeries(true);
    });
    dom.downloadButtons?.forEach((button) =>
      button.addEventListener("click", () => handleDownload(button))
    );
    dom.plotOptionPanels?.forEach((panel) => {
      panel.addEventListener("toggle", () => {
        if (!panel.open) return;
        dom.plotOptionPanels.forEach((other) => {
          if (other !== panel) other.open = false;
        });
      });
    });
    dom.citationLinks?.forEach((button) =>
      button.addEventListener("click", () => {
        if (!dom.citationPanel) return;
        dom.citationPanel.open = true;
        dom.citationPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      })
    );
    dom.filterComposition?.addEventListener("input", handleCompositionInput);
    dom.clearFilters?.addEventListener("click", clearFilters);
    dom.selectAll?.addEventListener("click", selectAllVisible);
    dom.deselectAll?.addEventListener("click", deselectAllVisible);
      dom.includeUnconfirmed?.addEventListener("change", () => {
        state.includeUnconfirmed = dom.includeUnconfirmed.checked;
        applyFilters();
      });

      dom.summaryModal?.addEventListener("click", (event) => {
        const target = event.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-action='close-summary']") || target.classList.contains("hdd-summary-backdrop")) {
          closeSummaryModal();
        }
      });

      let resizeFrame = null;
      window.addEventListener("resize", () => {
        if (!currentSeries.length) return;
        if (resizeFrame) return;
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = null;
          renderChart(currentSeries);
        });
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
      listbox.addEventListener("change", () => applyFilters());
    });

    if (dom.seriesDrawer) {
      dom.seriesDrawer.addEventListener("click", (event) => {
        const target = event.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-action='close-series']")) {
          toggleSeriesDrawer(false);
        }
      });
    }
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
    populateCompositionFilters(state.seriesList);
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
    bindFilterListResize(listbox);
    requestAnimationFrame(() => adjustFilterListHeight(listbox));
  }

  function updateCitationPanel(payload) {
    if (!payload || !payload.citations) return;
    const analysis = payload.citations.analysis || {};
    const database = payload.citations.database || {};

    if (dom.citationAnalysis) {
      dom.citationAnalysis.innerHTML = formatCitation(analysis);
    }
    if (dom.citationDatabase) {
      dom.citationDatabase.innerHTML = "";
      dom.citationDatabase.style.display = "none";
    }
    updateCitationDownloads(database);
  }

  function formatCitation(item) {
    if (!item || typeof item !== "object") return "Citation unavailable.";
    const lines = [];
    if (item.authors && item.authors.length) lines.push(escapeHtml(item.authors.join(", ")));
    if (item.title) lines.push(escapeHtml(item.title));
    if (item.doi) lines.push(`DOI: ${escapeHtml(item.doi)}`);
    if (item.institution || item.year) {
      const tail = [item.institution, item.year].filter(Boolean).join(", ");
      if (tail) lines.push(escapeHtml(tail));
    }
    if (item.url) {
      const url = String(item.url).trim();
      const safeUrl = escapeHtml(url);
      lines.push(
        `<a class="hdd-inline-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>`
      );
    }
    return lines.filter(Boolean).join("<br/>");
  }

  function updateCitationDownloads(database) {
    if (!database || typeof database !== "object") return;
    const doi = typeof database.doi === "string" ? database.doi.trim() : "";
    const url = typeof database.url === "string" ? database.url.trim() : "";
    const authors =
      Array.isArray(database.authors) && database.authors.length ? database.authors.join(" and ") : "";
    const title = typeof database.title === "string" ? database.title.trim() : "";

    const plainText = `D. Czeskleba, Hydrogen Diffusion Database (HDD.B), ${
      doi || "[DOI]"
    }, ${url || "https://czeskleba.com/hydrogen-diffusion-database/"}`;

    const bibtexLines = [
      "@misc{hdd_b,",
      authors ? `  author = {${authors}},` : null,
      title ? `  title = {${title}},` : null,
      doi ? `  doi = {${doi}},` : null,
      url ? `  url = {${url}},` : null,
      "}",
    ].filter(Boolean);
    const bibtex = bibtexLines.join("\n");

    const risLines = [
      "TY  - DATA",
      authors
        ? authors.split(" and ").map((author) => `AU  - ${author}`).join("\n")
        : null,
      title ? `TI  - ${title}` : null,
      doi ? `DO  - ${doi}` : null,
      url ? `UR  - ${url}` : null,
      "ER  -",
    ].filter(Boolean);
    const ris = risLines.join("\n");

    setCitationDownload(dom.citationPlain, "hdd-citation.txt", "text/plain", plainText);
    setCitationDownload(dom.citationBibtex, "hdd-citation.bib", "text/x-bibtex", bibtex);
    setCitationDownload(dom.citationRis, "hdd-citation.ris", "application/x-research-info-systems", ris);
  }

  function setCitationDownload(element, filename, mimeType, content) {
    if (!element) return;
    if (element.dataset?.objectUrl) {
      URL.revokeObjectURL(element.dataset.objectUrl);
    }
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const objectUrl = URL.createObjectURL(blob);
    element.href = objectUrl;
    element.download = filename;
    element.dataset.objectUrl = objectUrl;
  }

  function getDatabaseFooterLine() {
    const database = state.dataset?.citations?.database || {};
    const doi = typeof database.doi === "string" ? database.doi.trim() : "";
    const url = typeof database.url === "string" ? database.url.trim() : "";
    let host = "";
    if (url) {
      try {
        host = new URL(url).hostname.replace(/^www\./, "");
      } catch (error) {
        host = url.replace(/^https?:\/\//, "").split("/")[0];
      }
    }
    if (!host) host = "czeskleba.com";
    if (doi) return `HDD.B — ${host} — ${doi}`;
    return `HDD.B — ${host}`;
  }

  function renderExportFooter(ctx, width, height) {
    const footerLine = getDatabaseFooterLine();
    if (!footerLine) return;
    ctx.save();
    ctx.font = "11px IBM Plex Sans, Arial, sans-serif";
    ctx.fillStyle = lastPlotContext?.theme?.muted || "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(footerLine, 12, height - 10);
    ctx.restore();
  }

  function populateCompositionFilters(seriesList) {
    if (!dom.filterComposition) return;
    const elements = new Set();
    seriesList.forEach((entry) => {
      const ranges = entry.compositionRanges;
      if (!ranges) return;
      Object.keys(ranges).forEach((element) => elements.add(normalizeElementSymbol(element)));
    });
    const priorityOrder = [
      "C",
      "Si",
      "Mn",
      "P",
      "S",
      "Cr",
      "Ni",
      "Mo",
      "V",
      "Nb",
      "Ti",
      "Al",
      "B",
      "N",
      "Cu",
    ];
    const priorityIndex = new Map(priorityOrder.map((symbol, idx) => [symbol, idx]));
    const sorted = Array.from(elements)
      .filter(Boolean)
      .sort((a, b) => {
        const aIdx = priorityIndex.has(a) ? priorityIndex.get(a) : Number.POSITIVE_INFINITY;
        const bIdx = priorityIndex.has(b) ? priorityIndex.get(b) : Number.POSITIVE_INFINITY;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.localeCompare(b);
      });
    dom.filterComposition.innerHTML = "";
    sorted.forEach((element) => {
      const row = document.createElement("div");
      row.className = "hdd-comp-row";
      row.innerHTML = `
        <label>${escapeHtml(element)}</label>
        <input type="number" data-comp-element="${escapeHtml(element)}" data-comp-bound="min" placeholder="min" step="any" />
        <input type="number" data-comp-element="${escapeHtml(element)}" data-comp-bound="max" placeholder="max" step="any" />
      `;
      dom.filterComposition.appendChild(row);
    });
    state.compositionFilters = {};
  }

  function initializeFilterModes() {
    state.filterMode = {};
    dom.filterModeToggles?.forEach((toggle) => {
      const key = toggle.dataset.filterMode;
      if (!key) return;
      state.filterMode[key] = toggle.checked ? "exclude" : "include";
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
    if (dom.filterComposition) {
      dom.filterComposition.querySelectorAll("input[type='number']").forEach((input) => {
        input.value = "";
      });
    }
    state.compositionFilters = {};
    if (dom.search) dom.search.value = "";
    if (dom.tempMin) dom.tempMin.value = "";
    if (dom.tempMax) dom.tempMax.value = "";
    state.tempMin = null;
    state.tempMax = null;
    applyFilters();
  }

  function applyFilters(options = {}) {
    const { preserveManual = false, replot = true } = options;
    const previousScrollTop = dom.panelLeft ? dom.panelLeft.scrollTop : null;
    const selectScroll = captureSelectScroll();
    const query = dom.search?.value.trim().toLowerCase() || "";
    const filters = {
      source: selectedValues(dom.filterSource),
      materialClass: selectedValues(dom.filterClass),
      materialGrade: selectedValues(dom.filterGrade),
      chemicalComposition: state.compositionFilters,
      reportedAs: selectedValues(dom.filterReported),
      studiedEffects: selectedValues(dom.filterEffect),
      measurementMethod: selectedValues(dom.filterMethod),
      modelType: selectedValues(dom.filterModel),
      tempMin: state.tempMin,
      tempMax: state.tempMax,
      includeUnconfirmed: state.includeUnconfirmed,
      literatureMode: state.literatureMode,
      includeUnknownComposition: state.includeUnknownComposition,
      mode: state.filterMode,
    };

    const filtered = state.seriesList.filter((entry) =>
      entryMatchesFilters(entry, filters, "")
    );
    const visible = query
      ? filtered.filter((entry) => entryMatchesFilters(entry, filters, query))
      : filtered;
    state.filteredList = filtered;
    if (!preserveManual) {
      setSelectionMode("filtered");
    }
    if (state.selectionMode === "filtered") {
      state.selected = new Set(filtered.map((entry) => entry.id));
    }

    syncSelectionToVisible(filtered);
    renderSeriesList(visible);
    updateFilterAvailability(filters, "");
    updateSummary(currentSeries);
    if (replot) {
      plotSelectedSeries(true);
    }
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
    const mode = filters.mode || {};
    if (ignoreKey !== "plottingStatus" && !isPlottingAllowed(entry, filters.includeUnconfirmed)) return false;
    if (filters.literatureMode === "exclude" && hasLiteratureCompilation(entry)) return false;
    if (filters.literatureMode === "only" && !hasLiteratureCompilation(entry)) return false;
    if (ignoreKey !== "source" && !matchesValue(filters.source, entry.sourceId, mode.source)) return false;
    if (ignoreKey !== "materialClass" && !matchesSet(filters.materialClass, entry.meta.material_class, mode.materialClass)) return false;
    if (ignoreKey !== "materialGrade" && !matchesSet(filters.materialGrade, entry.meta.material_grade, mode.materialGrade)) return false;
    if (ignoreKey !== "chemicalComposition" && !matchesComposition(filters.chemicalComposition, entry.compositionRanges, filters.includeUnknownComposition)) return false;
    if (ignoreKey !== "reportedAs" && !matchesSet(filters.reportedAs, entry.meta.reported_as, mode.reportedAs)) return false;
    if (ignoreKey !== "studiedEffects" && !matchesSet(filters.studiedEffects, entry.meta.studied_effects, mode.studiedEffects)) return false;
    if (ignoreKey !== "measurementMethod" && !matchesSet(filters.measurementMethod, entry.meta.measurement_method, mode.measurementMethod)) return false;
    if (ignoreKey !== "modelType" && !matchesSet(filters.modelType, entry.meta.model_type, mode.modelType)) return false;
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
    adjustFilterListHeight(listbox);
  }

  function handleCompositionInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const element = input.dataset.compElement;
    if (!element) return;
    const esc = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(element) : element.replace(/["\\]/g, "\\$&");
    const minInput = dom.filterComposition?.querySelector(
      `input[data-comp-element="${esc}"][data-comp-bound="min"]`
    );
    const maxInput = dom.filterComposition?.querySelector(
      `input[data-comp-element="${esc}"][data-comp-bound="max"]`
    );
    const minVal = parseNumber(minInput?.value);
    const maxVal = parseNumber(maxInput?.value);
    if (minVal == null && maxVal == null) {
      delete state.compositionFilters[element];
    } else {
      state.compositionFilters[element] = { min: minVal, max: maxVal };
    }
    applyFilters();
  }

  function bindFilterListResize(listbox) {
    if (!listbox || listbox.dataset.resizeBound) return;
    listbox.dataset.resizeBound = "true";
    listbox.addEventListener("pointerup", () => {
      listbox.dataset.userResized = "true";
    });
  }

  function adjustFilterListHeight(listbox) {
    if (!listbox || listbox.dataset.userResized === "true") return;
    const items = Array.from(listbox.querySelectorAll(".hdd-filter-item:not(.is-hidden)"));
    const style = getComputedStyle(listbox);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const gap = parseFloat(style.rowGap || style.gap) || 0;
    if (!items.length) {
      listbox.style.height = `${FILTER_LIST_MIN_HEIGHT}px`;
      return;
    }
    const itemHeight = items[0].getBoundingClientRect().height || 0;
    const total =
      items.length * itemHeight + Math.max(0, items.length - 1) * gap + paddingTop + paddingBottom;
    const clamped = Math.min(FILTER_LIST_DEFAULT_HEIGHT, Math.max(FILTER_LIST_MIN_HEIGHT, total));
    listbox.style.height = `${Math.round(clamped)}px`;
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
    setSelectionMode("manual");
    updateSummary();
    plotSelectedSeries(true);
  }

  function deselectAllVisible() {
    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
    if (checkboxes && checkboxes.length) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        state.selected.delete(checkbox.value);
      });
    }
    setSelectionMode("manual");
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
    if (state.selectionMode !== "manual") {
      setSelectionMode("manual");
    }
    updateSummary();
    plotSelectedSeries(true);
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
    if (state.selectionMode === "manual") {
      if (!state.selected.size) {
        state.summaryExpanded = false;
        dom.summary.innerHTML =
          "<strong>No series selected.</strong><p>Use Select Series to choose datasets for plotting.</p>";
        return;
      }
    }
    const allItems =
      state.selectionMode === "manual"
        ? Array.from(state.selected)
            .map((id) => state.seriesById.get(id))
            .filter(Boolean)
        : (state.filteredList || []);
    if (!allItems.length) {
      state.summaryExpanded = false;
      dom.summary.innerHTML =
        "<strong>No series match the filters.</strong><p>Adjust filters or use Select Series to override.</p>";
      return;
    }
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
      const sourceMeta = state.dataset?.sources?.[series.sourceId] || null;
      const citation = buildCitation(sourceMeta, series);
      const groupLabel = series.groupId || series.label || "Series";
      return `
        <li class="hdd-summary-item">
          <div class="hdd-summary-title">
            <span class="hdd-ordinal">${ordinal}.</span>
            <strong>${escapeHtml(groupLabel)}</strong>
          </div>
          <div class="hdd-summary-meta">${escapeHtml(series.seriesLabel)} - ${escapeHtml(range)}</div>
          <div class="hdd-summary-cite">${escapeHtml(cleanCsvField(citation))}</div>
        </li>
      `;
    });
    const selectedCount = allItems.length;
    const plottedCount = plottedSeries.length;
    const needsToggle = selectedCount > previewLimit;
    const toggleLabel = state.summaryExpanded ? "Show less" : `Show all (${selectedCount})`;
    const toggleButton = needsToggle
      ? `<button type="button" class="hdd-summary-toggle">${toggleLabel}</button>`
      : "";
    const modeLabel = state.selectionMode === "manual" ? "selection" : "filters";
    const actionLabel = state.selectionMode === "manual" ? "Plot Selected" : "Plot Filtered";
    const statusLine =
      plottedCount && plottedCount !== selectedCount
        ? `<p>${plottedCount} plotted from current ${modeLabel}. Click "${actionLabel}" to refresh.</p>`
        : `<p>${selectedCount} series ${
            state.selectionMode === "manual" ? "selected" : "match filters"
          }.</p>`;

    dom.summary.innerHTML = `
      <div class="hdd-summary-header">
        <strong>${state.selectionMode === "manual" ? "Selected Series" : "Filtered Series"}</strong>
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
    state.zoom = null;
    plotSelectedSeries();
  }

  function toggleUnits(button) {
    state.units = button.dataset.unit === "C" ? "C" : "K";
    dom.unitButtons.forEach((btn) =>
      btn.classList.toggle("is-active", btn === button)
    );
    state.zoom = null;
    plotSelectedSeries();
  }

  function setSelectionMode(mode) {
    state.selectionMode = mode === "manual" ? "manual" : "filtered";
    if (dom.plotButton) {
      dom.plotButton.textContent =
        state.selectionMode === "manual" ? "Plot Selected" : "Plot Filtered";
    }
  }

  function toggleSeriesDrawer(open) {
    if (!dom.seriesDrawer) return;
    dom.seriesDrawer.classList.toggle("is-open", open);
    dom.seriesDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function plotSelectedSeries(force = false) {
    const useManual = state.selectionMode === "manual";
    const ids = useManual
      ? Array.from(state.selected)
      : (state.filteredList || []).map((entry) => entry.id);
    if (!ids.length) {
      renderEmptyChart(
        useManual
          ? "Select at least one series."
          : "No series match the current filters."
      );
      currentSeries = [];
      updateSummary();
      return;
    }
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
    const legendOrder = new Map();
    let legendCount = 0;

    seriesIds.forEach((seriesId, index) => {
      const entry = state.seriesById.get(seriesId);
      if (!entry) return;
      const sourceKey = entry.sourceId || entry.sourceTitle || entry.groupId || entry.id;
      const legendKey = state.legendBySource ? sourceKey : entry.id;
      let legendIndex = legendOrder.get(legendKey);
      if (legendIndex == null) {
        legendIndex = legendCount;
        legendOrder.set(legendKey, legendCount);
        legendCount += 1;
      }
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

      const color = state.monochrome ? "#111111" : COLORS[legendIndex % COLORS.length];
      const legendLabel = state.legendBySource
        ? entry.sourceTitle || entry.label || entry.groupId || "Source"
        : `${seriesDisplayLabel(entry)} - ${entry.seriesLabel}`;
      result.push({
        id: entry.id,
        label: entry.label,
        seriesLabel: entry.seriesLabel,
        color,
        legendKey,
        legendLabel,
        legendIndex,
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
    const chartStyles = getComputedStyle(dom.chart);
    const paddingX =
      (parseFloat(chartStyles.paddingLeft) || 0) +
      (parseFloat(chartStyles.paddingRight) || 0);
    const paddingY =
      (parseFloat(chartStyles.paddingTop) || 0) +
      (parseFloat(chartStyles.paddingBottom) || 0);
    // Use clientWidth to avoid border inflation causing incremental growth.
    const containerWidth = dom.chart.clientWidth || 960;
    const width = Math.max(320, Math.round(containerWidth - paddingX));
    const isNarrow = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
    const layoutScale = Math.max(0.85, Math.min(1, width / 860));
    const baseRatio = isNarrow ? 0.75 : 0.5;
    let height = Math.round(width * baseRatio);
    const minHeight = isNarrow ? 300 : 240;
    height = Math.max(minHeight, height);
    if (isNarrow) {
      const containerHeight = dom.chart.clientHeight || 0;
      const available = Math.max(0, Math.round(containerHeight - paddingY));
      if (available > height) {
        height = available;
      }
    }
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

    const dataMinX = Math.min(...temps);
    const dataMaxX = Math.max(...temps);
    const positiveValues = values.filter((v) => v > 0);
    const dataMinY = Math.min(...positiveValues);
    const dataMaxY = Math.max(...positiveValues);

    let axisMinX = dataMinX;
    let axisMaxX = dataMaxX;
    let axisMinY = dataMinY;
    let axisMaxY = dataMaxY;

    if (state.zoom) {
      axisMinX = Number.isFinite(state.zoom.xMin) ? state.zoom.xMin : dataMinX;
      axisMaxX = Number.isFinite(state.zoom.xMax) ? state.zoom.xMax : dataMaxX;
      axisMinY = Number.isFinite(state.zoom.yMin) ? state.zoom.yMin : dataMinY;
      axisMaxY = Number.isFinite(state.zoom.yMax) ? state.zoom.yMax : dataMaxY;
      if (!(axisMaxX > axisMinX) || !(axisMaxY > axisMinY)) {
        state.zoom = null;
        axisMinX = dataMinX;
        axisMaxX = dataMaxX;
        axisMinY = dataMinY;
        axisMaxY = dataMaxY;
      }
    }
    const logMin = Math.log10(axisMinY);
    const logMax = Math.log10(axisMaxY);

    const fontAxis = Math.round(14 * layoutScale);
    const fontTick = Math.round(12 * layoutScale);
    const fontLegend = Math.round(11 * layoutScale);
    const fontLabel = Math.round(11 * layoutScale);
    const legendMaxLines = isNarrow ? 3 : null;
    const legendLineHeight = Math.round(16 * layoutScale);
    const legendHeight =
      legendMaxLines != null ? legendLineHeight * legendMaxLines + Math.round(12 * layoutScale) : 0;
    const legendWidth = isNarrow ? 0 : estimateLegendWidth(ctx, series, width, layoutScale);
    const margin = {
      top: Math.round(26 * layoutScale),
      right: isNarrow ? Math.round(14 * layoutScale) : legendWidth,
      bottom: Math.round(64 * layoutScale) + legendHeight,
      left: Math.round(70 * layoutScale),
    };
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
    ctx.font = `${fontAxis}px IBM Plex Sans, Arial, sans-serif`;
    ctx.textAlign = "center";
    const tempUnitLabel = state.units === "C" ? "°C" : "°K";
    const axisLabelOffset = Math.round(36 * layoutScale);
    const axisLabelXOffset = Math.round(15 * layoutScale);
    ctx.fillText(
      `Temperature [${tempUnitLabel}]`,
      margin.left + plotWidth / 2,
      margin.top + plotHeight + axisLabelOffset
    );
    ctx.save();
    ctx.translate(axisLabelXOffset, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Apparent Diffusivity [mm²/s]", 0, 0);
    ctx.restore();

    drawXTicks(
      ctx,
      axisMinX,
      axisMaxX,
      margin,
      plotWidth,
      plotHeight,
      xToPx,
      theme,
      state.gridX,
      fontTick,
      layoutScale
    );
    drawYTicks(
      ctx,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
      yToPx,
      theme,
      state.gridY,
      fontTick,
      layoutScale
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.clip();

    fillEnvelopes(series, xToPx, yToPx);

    ctx.lineWidth = Math.max(1.5, 2 * layoutScale);
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
        const pointRadius = Math.max(2, Math.round(3 * layoutScale));
        item.axisPoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            xToPx(point.temperature_axis),
            yToPx(point.diffusivity),
            pointRadius,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      if (state.numbering) {
        const lastPoint = item.axisLine[item.axisLine.length - 1] || item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          ctx.fillStyle = item.color;
          ctx.font = `${fontLabel}px IBM Plex Sans, Arial, sans-serif`;
          ctx.textAlign = "left";
          const labelIndex = Number.isFinite(item.legendIndex) ? item.legendIndex + 1 : index + 1;
          ctx.fillText(
            `${labelIndex}`,
            xToPx(lastPoint.temperature_axis) + Math.round(4 * layoutScale),
            yToPx(lastPoint.diffusivity)
          );
        }
      }
    });

    ctx.restore();

    const legendInfo = drawLegend(
      ctx,
      series,
      margin,
      plotWidth,
      theme,
      plotHeight,
      fontLegend,
      layoutScale,
      isNarrow ? "bottom" : "side",
      legendMaxLines,
      axisLabelOffset
    );

    hoverCache = {
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
      scale: state.scale,
      units: state.units,
      series,
      xToPx,
      yToPx,
      legendMoreRect: legendInfo?.moreRect || null,
    };

    lastPlotContext = {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      units: state.units,
      scale: state.scale,
      gridX: state.gridX,
      gridY: state.gridY,
      numbering: state.numbering,
      legendBySource: state.legendBySource,
      envelope: state.envelope,
      monochrome: state.monochrome,
      series,
    };

    if (dom.resetZoom) {
      dom.resetZoom.disabled = !state.zoom;
    }
    syncZoomInputs();
    populateAxisDefaults(axisMinX, axisMaxX, axisMinY, axisMaxY);

    setupZoomSelection(canvas, ctx, {
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
    });

    setupHoverTooltip(canvas);
  }

  function setupZoomSelection(canvas, ctx, config) {
    if (!canvas) return;
    const baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let dragStart = null;
    let dragCurrent = null;

    const plotLeft = config.margin.left;
    const plotTop = config.margin.top;
    const plotRight = plotLeft + config.plotWidth;
    const plotBottom = plotTop + config.plotHeight;

    function getOffset(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function isInsidePlot(x, y) {
      return x >= plotLeft && x <= plotRight && y >= plotTop && y <= plotBottom;
    }

    function clampPoint(x, y) {
      return {
        x: clampValue(x, plotLeft, plotRight),
        y: clampValue(y, plotTop, plotBottom),
      };
    }

    function pxToAxisX(x) {
      const ratio = (x - plotLeft) / (config.plotWidth || 1);
      return config.axisMinX + ratio * (config.axisMaxX - config.axisMinX);
    }

    function pxToAxisY(y) {
      const ratio = (y - plotTop) / (config.plotHeight || 1);
      if (state.scale === "linear") {
        return config.axisMaxY - ratio * (config.axisMaxY - config.axisMinY);
      }
      const logValue = config.logMax - ratio * (config.logMax - config.logMin);
      return Math.pow(10, logValue);
    }

    function drawSelection() {
      if (!dragStart || !dragCurrent) return;
      const start = clampPoint(dragStart.x, dragStart.y);
      const end = clampPoint(dragCurrent.x, dragCurrent.y);
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      ctx.putImageData(baseImage, 0, 0);
      ctx.save();
      ctx.strokeStyle = "#0f766e";
      ctx.fillStyle = "rgba(15,118,110,0.15)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      ctx.fillRect(x, y, width, height);
      ctx.restore();
    }

    function clearSelection() {
      ctx.putImageData(baseImage, 0, 0);
    }

    canvas.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      const start = getOffset(event);
      if (!isInsidePlot(start.x, start.y)) return;
      dragStart = { x: start.x, y: start.y };
      dragCurrent = { x: start.x, y: start.y };
      drawSelection();

      const onMouseUp = (eventUp) => {
        const endPoint = getOffset(eventUp);
        const end = clampPoint(endPoint.x, endPoint.y);
        const startPoint = clampPoint(dragStart.x, dragStart.y);
        const width = Math.abs(end.x - startPoint.x);
        const height = Math.abs(end.y - startPoint.y);
        dragStart = null;
        dragCurrent = null;

        if (width < 6 || height < 6) {
          clearSelection();
          window.removeEventListener("mouseup", onMouseUp);
          return;
        }

        const xMin = pxToAxisX(Math.min(startPoint.x, end.x));
        const xMax = pxToAxisX(Math.max(startPoint.x, end.x));
        const yMin = pxToAxisY(Math.max(startPoint.y, end.y));
        const yMax = pxToAxisY(Math.min(startPoint.y, end.y));
        state.zoom = { xMin, xMax, yMin, yMax };
        window.removeEventListener("mouseup", onMouseUp);
        plotSelectedSeries();
      };

      window.addEventListener("mouseup", onMouseUp);
    });

    canvas.addEventListener("mousemove", (event) => {
      const pos = getOffset(event);
      canvas.style.cursor = isInsidePlot(pos.x, pos.y) ? "crosshair" : "default";
      if (!dragStart) return;
      dragCurrent = { x: pos.x, y: pos.y };
      drawSelection();
    });
  }

  function resetZoom() {
    if (!state.zoom) return;
    state.zoom = null;
    plotSelectedSeries();
  }

  function setZoomFromInputs() {
    const xMin = parseNumber(dom.axisXMin?.value);
    const xMax = parseNumber(dom.axisXMax?.value);
    const yMin = parseNumber(dom.axisYMin?.value);
    const yMax = parseNumber(dom.axisYMax?.value);
    const anyValue =
      Number.isFinite(xMin) ||
      Number.isFinite(xMax) ||
      Number.isFinite(yMin) ||
      Number.isFinite(yMax);
    if (!anyValue) {
      state.zoom = null;
      return;
    }
    const invalid =
      (Number.isFinite(xMin) && Number.isFinite(xMax) && !(xMax > xMin)) ||
      (Number.isFinite(yMin) && Number.isFinite(yMax) && !(yMax > yMin));
    if (invalid) return;
    state.zoom = { xMin, xMax, yMin, yMax };
  }

  function syncZoomInputs() {
    if (state.axisInputActive) return;
    if (!dom.axisXMin || !dom.axisXMax || !dom.axisYMin || !dom.axisYMax) return;
    if (!state.zoom) {
      dom.axisXMin.value = "";
      dom.axisXMax.value = "";
      dom.axisYMin.value = "";
      dom.axisYMax.value = "";
      return;
    }
    dom.axisXMin.value = Number.isFinite(state.zoom.xMin)
      ? state.zoom.xMin.toFixed(2)
      : "";
    dom.axisXMax.value = Number.isFinite(state.zoom.xMax)
      ? state.zoom.xMax.toFixed(2)
      : "";
    dom.axisYMin.value = Number.isFinite(state.zoom.yMin)
      ? state.zoom.yMin.toExponential(3)
      : "";
    dom.axisYMax.value = Number.isFinite(state.zoom.yMax)
      ? state.zoom.yMax.toExponential(3)
      : "";
  }

  function populateAxisDefaults(axisMinX, axisMaxX, axisMinY, axisMaxY) {
    if (state.axisInputActive) return;
    if (!dom.axisXMin || !dom.axisXMax || !dom.axisYMin || !dom.axisYMax) return;
    if (state.zoom) return;
    if (
      dom.axisXMin.value ||
      dom.axisXMax.value ||
      dom.axisYMin.value ||
      dom.axisYMax.value
    ) {
      return;
    }
    dom.axisXMin.value = Number.isFinite(axisMinX) ? axisMinX.toFixed(2) : "";
    dom.axisXMax.value = Number.isFinite(axisMaxX) ? axisMaxX.toFixed(2) : "";
    dom.axisYMin.value = Number.isFinite(axisMinY) ? axisMinY.toExponential(3) : "";
    dom.axisYMax.value = Number.isFinite(axisMaxY) ? axisMaxY.toExponential(3) : "";
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
      ctx.fillStyle = state.monochrome
        ? "rgba(60, 60, 60, 0.18)"
        : "rgba(15,118,110,0.18)";
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

  function drawXTicks(
    ctx,
    min,
    max,
    margin,
    width,
    height,
    xToPx,
    theme,
    drawGrid,
    fontSize,
    scale = 1
  ) {
    const steps = 5;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.font = `${fontSize}px IBM Plex Sans, Arial, sans-serif`;
    const tickLen = Math.max(4, Math.round(5 * scale));
    const labelOffset = Math.max(12, Math.round(16 * scale));
    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const x = xToPx(value);
      if (drawGrid) {
        ctx.save();
        ctx.strokeStyle = theme.ink;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + height);
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = theme.ink;
      ctx.beginPath();
      ctx.moveTo(x, margin.top + height);
      ctx.lineTo(x, margin.top + height + tickLen);
      ctx.stroke();
      ctx.fillText(value.toFixed(0), x, margin.top + height + labelOffset);
    }
  }

  function drawYTicks(
    ctx,
    axisMinY,
    axisMaxY,
    logMin,
    logMax,
    margin,
    width,
    height,
    yToPx,
    theme,
    drawGrid,
    fontSize,
    scale = 1
  ) {
    ctx.textAlign = "right";
    ctx.fillStyle = theme.ink;
    ctx.font = `${fontSize}px IBM Plex Sans, Arial, sans-serif`;
    const tickLenMajor = Math.max(4, Math.round(6 * scale));
    const tickLenMinor = Math.max(3, Math.round(3 * scale));
    const labelOffsetX = Math.max(6, Math.round(8 * scale));
    const labelOffsetY = Math.max(2, Math.round(3 * scale));
    if (state.scale === "linear") {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        if (drawGrid) {
          ctx.save();
          ctx.strokeStyle = theme.ink;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = theme.ink;
        ctx.beginPath();
        ctx.moveTo(margin.left - tickLenMajor, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        ctx.fillText(value.toExponential(1), margin.left - labelOffsetX, y + labelOffsetY);
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
          ctx.strokeStyle = theme.ink;
          ctx.lineWidth = factor === 1 ? 1.2 : 1;
          ctx.globalAlpha = factor === 1 ? 0.7 : 0.35;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
          ctx.restore();
        }
        const tickLen = factor === 1 ? tickLenMajor : tickLenMinor;
        ctx.strokeStyle = factor === 1 ? theme.ink : theme.line;
        ctx.beginPath();
        ctx.moveTo(margin.left - tickLen, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        if (factor === 1) {
          ctx.fillText(value.toExponential(1), margin.left - labelOffsetX, y + labelOffsetY);
        }
      }
    }
  }

  function estimateLegendWidth(ctx, series, chartWidth, scale = 1) {
    if (!ctx || !Array.isArray(series) || !series.length) return 140;
    const items = buildLegendItems(series);
    if (!items.length) return 140;
    ctx.save();
    const fontSize = Math.round(11 * scale);
    ctx.font = `${fontSize}px IBM Plex Sans, Arial, sans-serif`;
    let maxLabel = 0;
    items.forEach((item) => {
      const label = `${item.index + 1}. ${item.label}`;
      const width = ctx.measureText(label).width;
      if (width > maxLabel) maxLabel = width;
    });
    ctx.restore();
    const swatch = state.monochrome ? 0 : Math.round(14 * scale);
    const padding = Math.round(28 * scale);
    const target = maxLabel + swatch + padding;
    const maxWidth = Math.min(
      Math.round(240 * scale),
      Math.round(chartWidth * (scale < 1 ? 0.35 : 0.3))
    );
    const minWidth = Math.max(90, Math.round(120 * scale));
    return Math.min(maxWidth, Math.max(minWidth, Math.round(target)));
  }

  function buildLegendItems(series) {
    const legendItems = [];
    const seen = new Set();
    series.forEach((item, index) => {
      const key = item.legendKey || item.id || String(index);
      if (state.legendBySource) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      legendItems.push({
        color: item.color,
        label: item.legendLabel || seriesDisplayLabel(item.descriptor),
        index: Number.isFinite(item.legendIndex) ? item.legendIndex : legendItems.length,
      });
    });
    return legendItems.sort((a, b) => a.index - b.index);
  }

  function setupHoverTooltip(canvas) {
    if (!canvas) return;
    const tooltip = ensureTooltip();
    const radius = 6;
    const lineRadius = 5;

    function handleMove(event) {
      if (!hoverCache) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const legendRect = hoverCache.legendMoreRect;
      if (legendRect) {
        const insideLegend =
          x >= legendRect.x &&
          x <= legendRect.x + legendRect.width &&
          y >= legendRect.y &&
          y <= legendRect.y + legendRect.height;
        if (insideLegend) {
          canvas.style.cursor = "pointer";
          tooltip.style.opacity = "0";
          return;
        }
      }
      const plotLeft = hoverCache.margin.left;
      const plotTop = hoverCache.margin.top;
      const plotRight = plotLeft + hoverCache.plotWidth;
      const plotBottom = plotTop + hoverCache.plotHeight;
      if (x < plotLeft || x > plotRight || y < plotTop || y > plotBottom) {
        canvas.style.cursor = "default";
        tooltip.style.opacity = "0";
        return;
      }

      let best = null;
      let bestDist = radius * radius;
      hoverCache.series.forEach((series) => {
        series.axisPoints.forEach((point) => {
          const px = hoverCache.xToPx(point.temperature_axis);
          const py = hoverCache.yToPx(point.diffusivity);
          const dx = px - x;
          const dy = py - y;
          const dist = dx * dx + dy * dy;
          if (dist <= bestDist) {
            bestDist = dist;
            best = { series, point, px, py };
          }
        });
        series.axisLineSegments?.forEach((segment) => {
          for (let i = 0; i < segment.length - 1; i++) {
            const a = segment[i];
            const b = segment[i + 1];
            const ax = hoverCache.xToPx(a.temperature_axis);
            const ay = hoverCache.yToPx(a.diffusivity);
            const bx = hoverCache.xToPx(b.temperature_axis);
            const by = hoverCache.yToPx(b.diffusivity);
            const dist = pointToSegmentDistanceSq(x, y, ax, ay, bx, by);
            if (dist <= lineRadius * lineRadius && dist <= bestDist) {
              bestDist = dist;
              best = { series, point: a, px: ax, py: ay };
            }
          }
        });
      });

      if (!best) {
        tooltip.style.opacity = "0";
        return;
      }

      const label = seriesDisplayLabel(best.series.descriptor);
      const seriesLabel = best.series.seriesLabel || "";
      const ordinal = Number.isFinite(best.series.legendIndex) ? best.series.legendIndex + 1 : "";
      const prefix = ordinal ? `${ordinal}. ` : "";
      tooltip.innerHTML = `<strong>${escapeHtml(prefix + label)}</strong><br/>${escapeHtml(seriesLabel)}`;
      tooltip.style.opacity = "1";
      tooltip.style.left = `${rect.left + window.scrollX + best.px + 12}px`;
      tooltip.style.top = `${rect.top + window.scrollY + best.py - 10}px`;
      canvas.style.cursor = "crosshair";
    }

    function handleLeave() {
      tooltip.style.opacity = "0";
    }

    function handleClick(event) {
      if (!hoverCache?.legendMoreRect) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const legendRect = hoverCache.legendMoreRect;
      const insideLegend =
        x >= legendRect.x &&
        x <= legendRect.x + legendRect.width &&
        y >= legendRect.y &&
        y <= legendRect.y + legendRect.height;
      if (insideLegend) {
        openSummaryModal();
      }
    }

    canvas.removeEventListener("mousemove", handleMove);
    canvas.removeEventListener("mouseleave", handleLeave);
    canvas.removeEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("click", handleClick);
  }

  function ensureTooltip() {
    let tooltip = document.getElementById("hdd-chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "hdd-chart-tooltip";
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function pointToSegmentDistanceSq(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) {
      const rx = px - ax;
      const ry = py - ay;
      return rx * rx + ry * ry;
    }
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));
    const cx = ax + clamped * dx;
    const cy = ay + clamped * dy;
    const rx = px - cx;
    const ry = py - cy;
    return rx * rx + ry * ry;
  }

  function drawLegend(
    ctx,
    series,
    margin,
    width,
    theme,
    plotHeight,
    fontSize,
    scale = 1,
    position = "side",
    maxLines = null,
    axisLabelOffset = 0
  ) {
    const isBottom = position === "bottom";
    const legendX = isBottom
      ? margin.left
      : margin.left + width + Math.round(10 * scale);
    let legendY = isBottom
      ? margin.top + plotHeight + axisLabelOffset + Math.round(16 * scale)
      : margin.top + 10;
    ctx.font = `${fontSize}px IBM Plex Sans, Arial, sans-serif`;
    ctx.textAlign = "left";
    const maxY = isBottom
      ? legendY + Math.max(0, (maxLines || 0) * Math.round(16 * scale))
      : margin.top + plotHeight - 12;
    const items = buildLegendItems(series);
    const showSwatch = !state.monochrome;
    const swatchOffset = showSwatch ? Math.round(14 * scale) : 0;
    const swatchSize = Math.max(8, Math.round(10 * scale));
    const textX = legendX + swatchOffset;
    const lineHeight = Math.round(16 * scale);
    const availableLines = Math.max(
      0,
      maxLines != null ? maxLines : Math.floor((maxY - legendY) / lineHeight)
    );
    const needsMore = items.length > availableLines;
    const displayCount = needsMore ? Math.max(0, availableLines - 1) : items.length;
    let moreRect = null;
    let i = 0;
    for (; i < items.length && i < displayCount; i++) {
      const item = items[i];
      if (showSwatch) {
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY - Math.round(8 * scale), swatchSize, swatchSize);
      }
      ctx.fillStyle = theme.ink;
      ctx.fillText(`${item.index + 1}. ${item.label}`, textX, legendY);
      legendY += lineHeight;
    }
    if (needsMore) {
      const label = `... +${items.length - i} more`;
      ctx.fillStyle = theme.accent || theme.muted;
      ctx.fillText(label, textX, legendY);
      const metrics = ctx.measureText(label);
      moreRect = {
        x: textX,
        y: legendY - lineHeight + 2,
        width: metrics.width,
        height: lineHeight,
      };
    }
    return { moreRect };
  }

  function handleDownload(button) {
    if (!currentSeries.length) {
      alert("Select and plot at least one series before downloading.");
      return;
    }
    const type = (button.dataset.download || "").toLowerCase();
    if (type === "json") {
      if (!state.dataset) {
        alert("Dataset not loaded yet.");
        return;
      }
      const version = state.dataset.database_version || "unknown";
      const filename = `hdd_public_database_${version}.json`;
      try {
        fetch(endpoint, { cache: "no-store" })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.blob();
          })
          .then((blob) => downloadBlob(blob, filename))
          .catch(() => {
            downloadBlob(
              new Blob([JSON.stringify(state.dataset, null, 2)], { type: "application/json" }),
              filename
            );
          });
      } catch {
        downloadBlob(
          new Blob([JSON.stringify(state.dataset, null, 2)], { type: "application/json" }),
          filename
        );
      }
    } else if (type === "csv") {
      const meta = getExportMetadata();
      const exportedAt = new Date().toISOString();
      const header = [
        "source",
        "source_id",
        "source_title",
        "group_id",
        "series_id",
        "series_label",
        "temperature_axis",
        "temperature_K",
        "diffusivity_mm2_per_s",
        "kind",
      ];
      const zoom = meta.zoom;
      const rows = [
        `# database_version: ${meta.database_version || ""}`,
        `# schema_version: ${meta.schema_version || ""}`,
        `# exported_at: ${exportedAt}`,
        `# filters: ${formatFiltersSummary(meta.filters)}`,
        `# zoom_x_min: ${zoom ? zoom.xMin.toFixed(2) : ""}`,
        `# zoom_x_max: ${zoom ? zoom.xMax.toFixed(2) : ""}`,
        `# zoom_y_min: ${zoom ? zoom.yMin.toExponential(6) : ""}`,
        `# zoom_y_max: ${zoom ? zoom.yMax.toExponential(6) : ""}`,
        "",
        header.join(","),
      ];
      const withinZoom = (sample) => {
        if (!zoom) return true;
        const x = sample.temperature_axis;
        const y = sample.diffusivity;
        return x >= zoom.xMin && x <= zoom.xMax && y >= zoom.yMin && y <= zoom.yMax;
      };
      currentSeries.forEach((series) => {
        const sourceMeta = state.dataset?.sources?.[series.descriptor.sourceId] || null;
        const citation = quote(cleanCsvField(buildCitation(sourceMeta, series.descriptor)));
        const seriesBase = [
          citation,
          quote(series.descriptor.sourceId || ""),
          quote(series.descriptor.sourceTitle || ""),
          quote(series.descriptor.groupId),
          quote(series.descriptor.seriesId || ""),
          quote(series.seriesLabel || ""),
        ];
        series.axisLine.forEach((sample) => {
          if (!withinZoom(sample)) return;
          rows.push(
            seriesBase
              .concat([
                sample.temperature_axis.toFixed(2),
                sample.temperature_K.toFixed(2),
                sample.diffusivity.toExponential(6),
                "line",
              ])
              .join(",")
          );
        });
        series.axisPoints.forEach((sample) => {
          if (!withinZoom(sample)) return;
          rows.push(
            seriesBase
              .concat([
                sample.temperature_axis.toFixed(2),
                sample.temperature_K.toFixed(2),
                sample.diffusivity.toExponential(6),
                "point",
              ])
              .join(",")
          );
        });
      });
      downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), "hdd-selected.csv");
    } else if (type === "png") {
      if (!currentCanvas) {
        alert("Plot the dataset first to export a PNG.");
        return;
      }
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = currentCanvas.width;
      exportCanvas.height = currentCanvas.height;
      const exportCtx = exportCanvas.getContext("2d");
      exportCtx.drawImage(currentCanvas, 0, 0);
      renderExportFooter(exportCtx, exportCanvas.width, exportCanvas.height);
      exportCanvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "hdd-selected.png");
      });
    } else if (type === "svg") {
      if (!lastPlotContext) {
        alert("Plot the dataset first to export an SVG.");
        return;
      }
      const svg = buildSvgExport(lastPlotContext);
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml" }),
        "hdd-selected.svg"
      );
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

  function openSummaryModal() {
    if (!dom.summaryModal) return;
    dom.summaryModal.classList.add("is-open");
    dom.summaryModal.setAttribute("aria-hidden", "false");
  }

  function closeSummaryModal() {
    if (!dom.summaryModal) return;
    dom.summaryModal.classList.remove("is-open");
    dom.summaryModal.setAttribute("aria-hidden", "true");
  }

  function setShellState(stateValue) {
    if (dom.shell) {
      dom.shell.dataset.state = stateValue;
    }
  }

  function parseNumber(value) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
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
    const mode = arguments.length > 2 ? arguments[2] : "include";
    if (!set || !set.size) return mode === "exclude";
    for (const value of selected) {
      if (set.has(value)) {
        return mode === "exclude" ? false : true;
      }
    }
    return mode === "exclude";
  }

  function matchesComposition(filters, ranges, includeUnknown) {
    if (!filters || !Object.keys(filters).length) return true;
    if (!ranges) return !!includeUnknown;
    for (const element of Object.keys(filters)) {
      const filter = filters[element] || {};
      const min = filter.min;
      const max = filter.max;
      if (min == null && max == null) continue;
      const range = ranges[element];
      if (!range) {
        if (includeUnknown) continue;
        return false;
      }
      if (min != null && range.max < min) return false;
      if (max != null && range.min > max) return false;
    }
    return true;
  }

  function getExportMetadata() {
    const zoom = lastPlotContext
      ? {
          xMin: lastPlotContext.axisMinX,
          xMax: lastPlotContext.axisMaxX,
          yMin: lastPlotContext.axisMinY,
          yMax: lastPlotContext.axisMaxY,
        }
      : null;
    return {
      schema_version: state.dataset?.schema_version || "",
      database_version: state.dataset?.database_version || "",
      zoom,
      filters: getActiveFiltersSummary(),
    };
  }

  function getActiveFiltersSummary() {
    const summary = {};
    const addList = (key, list) => {
      if (list && list.length) summary[key] = list;
    };
    addList("source", selectedValues(dom.filterSource));
    addList("material_class", selectedValues(dom.filterClass));
    addList("material_grade", selectedValues(dom.filterGrade));
    const compositionFilters = formatCompositionFilters(state.compositionFilters);
    if (compositionFilters.length) summary.chemical_composition = compositionFilters;
    if (state.includeUnknownComposition) summary.chemical_composition_unknown = true;
    addList("reported_as", selectedValues(dom.filterReported));
    addList("studied_effects", selectedValues(dom.filterEffect));
    addList("measurement_method", selectedValues(dom.filterMethod));
    addList("model_type", selectedValues(dom.filterModel));
    const search = dom.search?.value || "";
    if (search.trim()) summary.search = search.trim();
    if (state.tempMin != null) summary.temp_min = state.tempMin;
    if (state.tempMax != null) summary.temp_max = state.tempMax;
    if (state.includeUnconfirmed) summary.include_unconfirmed = true;
    if (state.literatureMode && state.literatureMode !== "include") {
      summary.literature_compilations = state.literatureMode;
    }
    const excludeModes = {};
    Object.keys(state.filterMode || {}).forEach((key) => {
      if (state.filterMode[key] === "exclude") excludeModes[key] = "exclude";
    });
    if (Object.keys(excludeModes).length) summary.filter_mode = excludeModes;
    return summary;
  }

  function formatFiltersSummary(filters) {
    if (!filters || !Object.keys(filters).length) return "none";
    const parts = [];
    const listToText = (value) => (Array.isArray(value) ? value.join(" | ") : String(value));
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value == null) return;
      if (typeof value === "object" && !Array.isArray(value)) {
        const inner = Object.keys(value)
          .map((innerKey) => `${innerKey}=${value[innerKey]}`)
          .join(" | ");
        if (inner) parts.push(`${key}: ${inner}`);
        return;
      }
      parts.push(`${key}: ${listToText(value)}`);
    });
    return parts.join("; ");
  }

  function normalizeElementSymbol(value) {
    if (value == null) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    const lettersOnly = raw.replace(/[^a-zA-Z]/g, "");
    if (!lettersOnly) return raw;
    if (lettersOnly.length <= 2) {
      return lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1).toLowerCase();
    }
    return lettersOnly.toUpperCase();
  }

  function formatCompositionFilters(filters) {
    if (!filters) return [];
    const parts = [];
    Object.keys(filters).forEach((element) => {
      const normalized = normalizeElementSymbol(element);
      if (!normalized) return;
      const range = filters[element] || {};
      const min = range.min;
      const max = range.max;
      if (min == null && max == null) return;
      if (min != null && max != null) {
        parts.push(`${normalized} ${min}-${max}`);
      } else if (min != null) {
        parts.push(`${normalized} >= ${min}`);
      } else if (max != null) {
        parts.push(`${normalized} <= ${max}`);
      }
    });
    return parts;
  }

  function buildCitation(sourceMeta, descriptor) {
    if (!sourceMeta) {
      return descriptor?.sourceTitle || descriptor?.sourceId || "";
    }
    const authors = Array.isArray(sourceMeta.authors) ? sourceMeta.authors : [];
    let authorText = "";
    if (authors.length > 1) {
      authorText = `${authors[0]} et al.`;
    } else if (authors.length === 1) {
      authorText = authors[0];
    }
    const title = sourceMeta.title || "";
    const year = sourceMeta.year != null ? String(sourceMeta.year) : "";
    const journal = sourceMeta.journal || "";
    const availability = sourceMeta.availability || "";
    const parts = [];
    if (authorText) parts.push(authorText);
    if (title) parts.push(title);
    if (year) parts.push(year);
    if (journal) parts.push(journal);
    if (availability) parts.push(availability);
    if (!parts.length) return descriptor?.sourceTitle || descriptor?.sourceId || "";
    return parts.join(" | ");
  }

  function cleanCsvField(value) {
    if (value == null) return "";
    let text = String(value);
    text = text.replace(/\r?\n|\r/g, " ");
    text = text.replace(/&ndash;|&mdash;/gi, "-");
    text = text.replace(/&alpha;/gi, "alpha");
    text = text.replace(/&beta;/gi, "beta");
    text = text.replace(/&gamma;/gi, "gamma");
    text = text.replace(/&delta;/gi, "delta");
    text = text.replace(/&amp;/gi, "&");
    text = text.replace(/&lt;/gi, "<");
    text = text.replace(/&gt;/gi, ">");
    text = text.replace(/&quot;/gi, "\"");
    text = text.replace(/&apos;/gi, "'");
    text = text.replace(/\u2013|\u2014|\u2212/g, "-");
    text = text.replace(/[;,]+/g, " | ");
    text = text.replace(/&[a-z]+;/gi, " ");
    return text.replace(/\s+/g, " ").trim();
  }

  function buildSvgExport(context) {
    const {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      units,
      scale,
      gridX,
      gridY,
      numbering,
      envelope,
      monochrome,
      series,
    } = context;

    const xToPx = (value) =>
      margin.left + ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotWidth;
    const yToPx = (value) => {
      if (scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    };

    const parts = [];
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    );
    parts.push(`<rect width="100%" height="100%" fill="${theme.canvas}"/>`);
    parts.push(
      `<clipPath id="plot-clip"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`
    );

    if (gridX) {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinX + ((axisMaxX - axisMinX) / steps) * i;
        const x = xToPx(value);
        parts.push(
          `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${
            margin.top + plotHeight
          }" stroke="${theme.line}" stroke-width="1" opacity="0.35"/>`
        );
      }
    }

    if (gridY) {
      if (scale === "linear") {
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
          const y = yToPx(value);
          parts.push(
            `<line x1="${margin.left}" y1="${y}" x2="${
              margin.left + plotWidth
            }" y2="${y}" stroke="${theme.line}" stroke-width="1" opacity="0.35"/>`
          );
        }
      } else {
        const decadeMin = Math.floor(logMin);
        const decadeMax = Math.ceil(logMax);
        const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let decade = decadeMin; decade <= decadeMax; decade++) {
          for (const factor of factors) {
            const value = factor * Math.pow(10, decade);
            if (value < axisMinY || value > axisMaxY) continue;
            const y = yToPx(value);
            const major = factor === 1;
            parts.push(
              `<line x1="${margin.left}" y1="${y}" x2="${
                margin.left + plotWidth
              }" y2="${y}" stroke="${theme.line}" stroke-width="${
                major ? 1.2 : 1
              }" opacity="${major ? 0.7 : 0.25}"/>`
            );
          }
        }
      }
    }

    parts.push(
      `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${
        margin.top + plotHeight
      }" stroke="${theme.line}" stroke-width="1"/>`
    );
    parts.push(
      `<line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${
        margin.left + plotWidth
      }" y2="${margin.top + plotHeight}" stroke="${theme.line}" stroke-width="1"/>`
    );

    parts.push(
      `<text x="${margin.left + plotWidth / 2}" y="${
        margin.top + plotHeight + 36
        }" fill="${theme.ink}" font-size="14" text-anchor="middle">Temperature [${
        units === "C" ? "C" : "K"
      }]</text>`
    );
    parts.push(
      `<text x="15" y="${margin.top + plotHeight / 2}" fill="${theme.ink}" font-size="14" text-anchor="middle" transform="rotate(-90 15 ${
        margin.top + plotHeight / 2
      })">Apparent Diffusivity [mm2/s]</text>`
    );

    const xticks = 6;
    for (let i = 0; i <= xticks; i++) {
      const value = axisMinX + ((axisMaxX - axisMinX) / xticks) * i;
      const x = xToPx(value);
      parts.push(
        `<line x1="${x}" y1="${margin.top + plotHeight}" x2="${x}" y2="${
          margin.top + plotHeight + 6
        }" stroke="${theme.line}" stroke-width="1"/>`
      );
      parts.push(
        `<text x="${x}" y="${margin.top + plotHeight + 22}" fill="${theme.ink}" font-size="12" text-anchor="middle">${Math.round(
          value
        )}</text>`
      );
    }

    if (scale === "linear") {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        parts.push(
          `<line x1="${margin.left - 6}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.line}" stroke-width="1"/>`
        );
        parts.push(
          `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="12" text-anchor="end">${value.toExponential(
            1
          )}</text>`
        );
      }
    } else {
      const decadeMin = Math.floor(logMin);
      const decadeMax = Math.ceil(logMax);
      const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let decade = decadeMin; decade <= decadeMax; decade++) {
        for (const factor of factors) {
          const value = factor * Math.pow(10, decade);
          if (value < axisMinY || value > axisMaxY) continue;
          const y = yToPx(value);
          const tickLen = factor === 1 ? 6 : 3;
          parts.push(
            `<line x1="${margin.left - tickLen}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.line}" stroke-width="1"/>`
          );
          if (factor === 1) {
            parts.push(
              `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="12" text-anchor="end">${value.toExponential(
                1
              )}</text>`
            );
          }
        }
      }
    }

    parts.push(`<g clip-path="url(#plot-clip)">`);
    if (envelope) {
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
        const path = [];
        overlap.temps.forEach((temperature, idx) => {
          const x = xToPx(units === "C" ? temperature - 273.15 : temperature);
          const y = yToPx(overlap.maxVals[idx]);
          path.push(`${idx === 0 ? "M" : "L"}${x} ${y}`);
        });
        for (let i = overlap.temps.length - 1; i >= 0; i--) {
          const temperature = overlap.temps[i];
          const x = xToPx(units === "C" ? temperature - 273.15 : temperature);
          const y = yToPx(overlap.minVals[i]);
          path.push(`L${x} ${y}`);
        }
        path.push("Z");
        const envelopeFill = monochrome
          ? "rgba(60, 60, 60, 0.18)"
          : "rgba(15,118,110,0.18)";
        parts.push(`<path d="${path.join(" ")}" fill="${envelopeFill}"/>`);
      });
    }

    series.forEach((item, index) => {
      if (item.axisLineSegments?.length) {
        item.axisLineSegments.forEach((segment) => {
          if (segment.length < 2) return;
          const d = segment
            .map((point, idx) => {
              const x = xToPx(point.temperature_axis);
              const y = yToPx(point.diffusivity);
              return `${idx === 0 ? "M" : "L"}${x} ${y}`;
            })
            .join(" ");
          parts.push(
            `<path d="${d}" fill="none" stroke="${item.color}" stroke-width="2"/>`
          );
        });
      }
      if (item.axisPoints.length) {
        item.axisPoints.forEach((point) => {
          const x = xToPx(point.temperature_axis);
          const y = yToPx(point.diffusivity);
          parts.push(
            `<circle cx="${x}" cy="${y}" r="3" fill="${item.color}"/>`
          );
        });
      }
      if (numbering) {
        const lastPoint =
          item.axisLine[item.axisLine.length - 1] ||
          item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          const labelIndex = Number.isFinite(item.legendIndex)
            ? item.legendIndex + 1
            : index + 1;
          parts.push(
            `<text x="${xToPx(lastPoint.temperature_axis) + 4}" y="${yToPx(
              lastPoint.diffusivity
            )}" fill="${item.color}" font-size="11" text-anchor="start">${labelIndex}</text>`
          );
        }
      }
    });
    parts.push(`</g>`);

    const legendX = margin.left + plotWidth + 10;
    let legendY = margin.top + 10;
    const maxY = margin.top + plotHeight - 12;
    const showSwatch = !monochrome;
    const textX = legendX + (showSwatch ? 14 : 0);
    const items = buildLegendItems(series);
    const lineHeight = 16;
    const availableLines = Math.max(0, Math.floor((maxY - legendY) / lineHeight));
    const needsMore = items.length > availableLines;
    const displayCount = needsMore ? Math.max(0, availableLines - 1) : items.length;
    let i = 0;
    for (; i < items.length && i < displayCount; i++) {
      const item = items[i];
      if (showSwatch) {
        parts.push(
          `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${item.color}"/>`
        );
      }
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.ink}" font-size="11" text-anchor="start">${item.index + 1}. ${
          item.label
        }</text>`
      );
      legendY += lineHeight;
    }
      if (needsMore) {
        parts.push(
          `<text x="${textX}" y="${legendY}" fill="${theme.accent || theme.muted}" font-size="11" text-anchor="start">... +${
            items.length - i
          } more</text>`
        );
      }

      const footerLine = getDatabaseFooterLine();
      if (footerLine) {
        parts.push(
          `<text x="12" y="${height - 12}" fill="${theme.muted}" font-size="11" text-anchor="start">${escapeHtml(
            footerLine
          )}</text>`
        );
      }

      parts.push(`</svg>`);
      return parts.join("");
    }

  function matchesValue(selected, value, mode = "include") {
    if (!selected.length) return true;
    const hasValue = selected.includes(value);
    return mode === "exclude" ? !hasValue : hasValue;
  }

  function hasLiteratureCompilation(entry) {
    const methods = entry.meta?.measurement_method;
    if (!methods || !methods.size) return false;
    for (const method of methods) {
      if (String(method).toLowerCase() === "literature compilation") return true;
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
    return ` - ${value}`;
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
      return `${minLabel} K`;
    }
    return `${minLabel}-${maxLabel} K`;
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

  function clampValue(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
      ink: styles.getPropertyValue("--plot-ink").trim() || "#111827",
      muted: styles.getPropertyValue("--plot-muted").trim() || "#6b7280",
      line: styles.getPropertyValue("--plot-line").trim() || "#d1d5db",
      canvas: styles.getPropertyValue("--plot-canvas").trim() || "#f9fafb",
      accent: styles.getPropertyValue("--accent").trim() || "#0f766e",
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
