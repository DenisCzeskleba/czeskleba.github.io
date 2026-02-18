/* Hydrogen Diffusion Explorer
 * Loads the exported HDD bundle, lets users select groups, and renders curves
 * directly in the browser (Arrhenius/power/single-point models evaluated on
 * the fly). This keeps the public payload small and mirrors the Python tooling.
 */
(function () {
  const R_DEFAULT = 8.314462618; // J/(mol*K)
  const SAMPLES_PER_SEGMENT = 60;
  const FILL_SAMPLES = 180;
  const COLORS = [
    "#111827",
    "#dc2626",
    "#0d9488",
    "#2563eb",
    "#d97706",
    "#6d28d9",
    "#059669",
    "#ea580c",
  ];

  const mount = document.getElementById("hydrogen-explorer-app");
  if (!mount) return;

  const endpoint =
    mount.getAttribute("data-endpoint") || "/hdd/hdd-groups.json";

  const dom = {
    shell: mount.querySelector(".hdd-explorer-shell"),
    status: document.getElementById("hdd-data-status"),
    list: document.getElementById("hdd-group-list"),
    search: document.getElementById("hdd-search"),
    plotButton: document.getElementById("hdd-plot-btn"),
    chart: document.getElementById("hdd-chart"),
    summary: document.getElementById("hdd-selected-summary"),
    unitButtons: document.querySelectorAll("[data-unit]"),
    envelope: document.getElementById("hdd-envelope"),
    numbering: document.getElementById("hdd-numbering"),
    tempMin: document.getElementById("hdd-temp-min"),
    tempMax: document.getElementById("hdd-temp-max"),
    downloadButtons: document.querySelectorAll(".hdd-downloads button"),
  };

  const state = {
    summaries: [],
    groupsById: new Map(),
    selected: new Set(),
    units: "K",
    envelope: true,
    numbering: true,
    tempMin: null,
    tempMax: null,
  };

  let currentSeries = [];
  let currentCanvas = null;

  initialize();

  async function initialize() {
    setShellState("loading");
    setStatus(`Loading dataset from ${endpoint}...`, "info");

    const payload = await fetchDataset(endpoint);
    const normalized = normalizeDataset(payload);

    if (!normalized.summaries.length) {
      setStatus(
        "No groups available. Ensure hdd-groups.json is published.",
        "error"
      );
      renderEmptyChart(
        "Dataset missing. Export a bundle from the private repo and copy it here."
      );
      return;
    }

    state.summaries = normalized.summaries;
    state.groupsById = normalized.groupsById;
    setStatus(
      `Loaded ${state.summaries.length} groups · generated ${payload.generated_at || "n/a"}`,
      "ok"
    );

    dom.search?.addEventListener("input", applyFilter);
    dom.list?.addEventListener("change", handleSelectionChange);
    dom.unitButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleUnits(btn))
    );
    dom.envelope?.addEventListener("change", () => {
      state.envelope = dom.envelope.checked;
      plotSelectedGroups();
    });
    dom.numbering?.addEventListener("change", () => {
      state.numbering = dom.numbering.checked;
      plotSelectedGroups();
    });
    [dom.tempMin, dom.tempMax].forEach((input) =>
      input?.addEventListener("input", () => {
        state.tempMin = parseNumber(dom.tempMin?.value);
        state.tempMax = parseNumber(dom.tempMax?.value);
      })
    );
    dom.plotButton?.addEventListener("click", () => plotSelectedGroups(true));
    dom.downloadButtons?.forEach((button) =>
      button.addEventListener("click", () => handleDownload(button))
    );

    renderGroupList(state.summaries);
    updateSummary();
    renderEmptyChart("Select one or more groups, then click Plot.");
    setShellState("ready");
  }

  async function fetchDataset(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      setStatus(`Failed to load dataset (${error.message})`, "error");
      return { groups: [] };
    }
  }

  function normalizeDataset(payload) {
    if (!payload || !Array.isArray(payload.groups)) {
      return { summaries: [], groupsById: new Map() };
    }
    const summaries = [];
    const groupsById = new Map();
    const sources = payload.sources || {};

    payload.groups.forEach((group, index) => {
      const id = group.group_id || group.id || `group-${index + 1}`;
      const segments = (group.segments || [])
        .map((segment) => ({
          entryId: segment.entry_id,
          model: segment.model,
          Tmin: safeNumber(segment.temperature_validity_K?.[0]),
          Tmax: safeNumber(segment.temperature_validity_K?.[1]),
          metadata: segment.metadata || {},
          material: segment.material,
          reportedAs: segment.reported_as,
          conditions: segment.conditions,
        }))
        .filter((segment) =>
          Number.isFinite(segment.Tmin) && Number.isFinite(segment.Tmax)
        )
        .sort((a, b) => a.Tmin - b.Tmin);

      const sourceId = group.source_id;
      const sourceTitle = sources[sourceId]?.title || sourceId || payload.source_repo || "Unknown source";
      const materialLabel = deriveMaterialLabel(segments);
      const range = (group.temperature_range_K && group.temperature_range_K.length === 2)
        ? group.temperature_range_K
        : deriveRangeFromSegments(segments);
      const descriptor = {
        id,
        label: group.label || id,
        sourceId,
        sourceTitle,
        temperatureRange: range,
        segments,
        bandType: inferBandType(id, segments),
      };

      summaries.push({
        id,
        label: descriptor.label,
        source: sourceTitle,
        material: materialLabel,
        temperature_range_K: range,
        sampleCount: segments.length,
      });
      groupsById.set(id, descriptor);
    });

    return { summaries, groupsById };
  }

  function deriveMaterialLabel(segments) {
    const material = segments?.[0]?.material;
    if (!material) return null;
    return material.designation || material.family || null;
  }

  function deriveRangeFromSegments(segments) {
    if (!segments.length) return [null, null];
    const Tmin = Math.min(...segments.map((s) => s.Tmin));
    const Tmax = Math.max(...segments.map((s) => s.Tmax));
    return [Tmin, Tmax];
  }

  function inferBandType(groupId, segments) {
    const metaBand = segments.find((segment) => segment.metadata.band)?.metadata.band;
    if (metaBand) return metaBand;
    const suffixMatch = groupId.match(/_(mean|min|max)$/);
    return suffixMatch ? suffixMatch[1] : null;
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

  function toggleUnits(button) {
    state.units = button.dataset.unit === "C" ? "C" : "K";
    dom.unitButtons.forEach((btn) =>
      btn.classList.toggle("is-active", btn === button)
    );
    plotSelectedGroups();
  }

  function applyFilter() {
    const query = dom.search?.value.trim().toLowerCase() || "";
    if (!query) {
      renderGroupList(state.summaries);
      return;
    }
    const filtered = state.summaries.filter((group) => {
      const haystack = [group.label, group.id, group.source, group.material]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
    renderGroupList(filtered);
  }

  function renderGroupList(groups) {
    if (!dom.list) return;
    dom.list.innerHTML = "";
    if (!groups.length) {
      dom.list.innerHTML = '<p class="hdd-empty">No groups found.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    groups.forEach((group) => {
      const option = document.createElement("label");
      option.className = "hdd-group-option";
      const inputId = `hdd-group-${group.id}`;
      option.setAttribute("for", inputId);
      option.innerHTML = `
        <input type="checkbox" id="${inputId}" value="${group.id}" ${
        state.selected.has(group.id) ? "checked" : ""
      } />
        <div>
          <strong>${group.label}</strong>
          <div class="hdd-group-meta">
            ${group.source || "Unknown source"}
            ${formatRange(group.temperature_range_K)}
            ${group.material ? ` · ${group.material}` : ""}
            ${group.sampleCount ? ` · ${group.sampleCount} segment(s)` : ""}
          </div>
        </div>
      `;
      fragment.appendChild(option);
    });
    dom.list.appendChild(fragment);
  }

  function formatRange(range) {
    if (!range || range.length !== 2 || range[0] == null || range[1] == null) return "";
    return ` · ${range[0].toFixed(0)}–${range[1].toFixed(0)} K`;
  }

  function updateSummary(seriesList = null) {
    if (!dom.summary) return;
    if (!state.selected.size) {
      dom.summary.innerHTML =
        "<strong>No groups selected.</strong><p>Use the checklist to the left to choose datasets for plotting.</p>";
      return;
    }
    const items = Array.from(state.selected)
      .map((id) => state.groupsById.get(id))
      .filter(Boolean)
      .map((group) => {
        const range = group.temperatureRange?.length === 2
          ? `${group.temperatureRange[0].toFixed(0)}–${group.temperatureRange[1].toFixed(0)} K`
          : "range unknown";
        return `<li><strong>${group.label}</strong> · ${range} · ${group.segments.length} segment(s)</li>`;
      })
      .join("\n");

    const plottedText = seriesList && seriesList.length
      ? `Currently plotting ${seriesList.length} group${seriesList.length > 1 ? "s" : ""}.`
      : "Hit Plot selected curves to render.";

    dom.summary.innerHTML = `
      <strong>${state.selected.size} group${state.selected.size > 1 ? "s" : ""} selected.</strong>
      <p>${plottedText}</p>
      <ul>${items}</ul>
    `;
  }

  function plotSelectedGroups(force = false) {
    if (!state.selected.size) {
      renderEmptyChart("Select at least one group.");
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

  function prepareSeries(groupIds) {
    const clampMin = state.tempMin;
    const clampMax = state.tempMax;
    const result = [];
    groupIds.forEach((groupId, index) => {
      const descriptor = state.groupsById.get(groupId);
      if (!descriptor) return;
      const samples = sampleGroup(descriptor, clampMin, clampMax);
      if (!samples.length) return;
      const axisSamples = samples.map((sample) => ({
        temperature_K: sample.temperature_K,
        temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
        diffusivity: sample.diffusivity,
      }));
      result.push({
        groupId,
        label: descriptor.label,
        color: COLORS[index % COLORS.length],
        axisSamples,
        descriptor,
      });
    });
    return result;
  }

  function sampleGroup(descriptor, clampMin, clampMax) {
    const samples = [];
    const segments = descriptor.segments;
    segments.forEach((segment, idx) => {
      const segMin = Math.max(segment.Tmin, clampMin || segment.Tmin);
      const segMax = Math.min(segment.Tmax, clampMax || segment.Tmax);
      if (!(segMax > segMin)) return;
      const steps = Math.max(2, SAMPLES_PER_SEGMENT);
      for (let i = 0; i < steps; i++) {
        if (idx > 0 && i === 0) continue; // avoid duplicate boundaries
        const ratio = i / (steps - 1);
        const temperature = segMin + (segMax - segMin) * ratio;
        const diffusivity = evaluateModel(segment.model, temperature);
        if (diffusivity && diffusivity > 0) {
          samples.push({ temperature_K: temperature, diffusivity });
        }
      }
    });
    return samples;
  }

  function evaluateModel(model, temperature_K) {
    if (!model) return null;
    const type = model.type;
    if (type === "single_point") {
      return model.diffusivity_mm2_per_s;
    }
    if (type === "arrhenius") {
      const D0 = model.D0_mm2_per_s;
      const Q = model.Q_J_per_mol;
      const R = model.R_J_per_molK || R_DEFAULT;
      return D0 * Math.exp(-Q / (R * temperature_K));
    }
    if (type === "power") {
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
    const temps = series.flatMap((s) => s.axisSamples.map((p) => p.temperature_axis));
    const values = series.flatMap((s) => s.axisSamples.map((p) => p.diffusivity));
    if (!temps.length || !values.length) {
      renderEmptyChart("No samples available for plotting.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 920;
    canvas.height = 520;
    dom.chart.innerHTML = "";
    dom.chart.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    currentCanvas = canvas;

    const axisMinX = Math.min(...temps);
    const axisMaxX = Math.max(...temps);
    const positiveValues = values.filter((v) => v > 0);
    const axisMinY = Math.min(...positiveValues);
    const axisMaxY = Math.max(...positiveValues);
    const logMin = Math.log10(axisMinY);
    const logMax = Math.log10(axisMaxY);

    const margin = { top: 30, right: 40, bottom: 50, left: 80 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;

    function xToPx(value) {
      return (
        margin.left +
        ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * width
      );
    }

    function yToPx(value) {
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.stroke();

    ctx.fillStyle = "#4b5563";
    ctx.font = "12px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Temperature [${state.units === "C" ? "°C" : "K"}]`,
      margin.left + width / 2,
      canvas.height - 10
    );
    ctx.save();
    ctx.translate(15, margin.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Diffusivity [mm²/s] (log scale)", 0, 0);
    ctx.restore();

    drawXTicks(ctx, axisMinX, axisMaxX, margin, width, height, xToPx);
    drawYTicks(ctx, logMin, logMax, margin, height, yToPx);

    const seriesMap = new Map(series.map((s) => [s.groupId, s]));
    fillEnvelopes(seriesMap, ctx, xToPx, yToPx);

    ctx.lineWidth = 2;
    series.forEach((item, index) => {
      ctx.strokeStyle = item.color;
      ctx.beginPath();
      item.axisSamples.forEach((point, pointIndex) => {
        const x = xToPx(point.temperature_axis);
        const y = yToPx(point.diffusivity);
        if (pointIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      if (state.numbering && item.axisSamples.length) {
        const lastPoint = item.axisSamples[item.axisSamples.length - 1];
        ctx.fillStyle = item.color;
        ctx.font = "11px Inter, Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${index + 1}`, xToPx(lastPoint.temperature_axis) + 4, yToPx(lastPoint.diffusivity));
      }
    });

    drawLegend(ctx, series, margin, width);
  }

  function drawXTicks(ctx, min, max, margin, width, height, xToPx) {
    const steps = 5;
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.font = "11px Inter, Arial, sans-serif";
    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const x = xToPx(value);
      ctx.beginPath();
      ctx.moveTo(x, margin.top + height);
      ctx.lineTo(x, margin.top + height + 5);
      ctx.stroke();
      ctx.fillText(value.toFixed(0), x, margin.top + height + 16);
    }
  }

  function drawYTicks(ctx, logMin, logMax, margin, height, yToPx) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Inter, Arial, sans-serif";
    const steps = Math.max(2, Math.round(logMax - logMin));
    for (let i = 0; i <= steps; i++) {
      const logValue = logMin + ((logMax - logMin) / steps) * i;
      const value = Math.pow(10, logValue);
      const y = yToPx(value);
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
      ctx.fillText(value.toExponential(1), margin.left - 8, y + 3);
    }
  }

  function drawLegend(ctx, series, margin, width) {
    const legendX = margin.left + width - 10;
    let legendY = margin.top + 10;
    ctx.font = "11px Inter, Arial, sans-serif";
    ctx.textAlign = "right";
    series.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX - 12, legendY - 8, 10, 10);
      ctx.fillStyle = "#111827";
      ctx.fillText(`${index + 1}. ${item.label}`, legendX - 16, legendY);
      legendY += 16;
    });
  }

  function fillEnvelopes(seriesMap, ctx, xToPx, yToPx) {
    if (!state.envelope) return;
    const buckets = {};
    seriesMap.forEach((series) => {
      const { baseId, band } = splitBand(series.groupId, series.descriptor.bandType);
      if (!band) return;
      buckets[baseId] = buckets[baseId] || {};
      buckets[baseId][band] = series;
    });

    Object.values(buckets).forEach((bucket) => {
      if (!bucket.min || !bucket.max) return;
      const overlap = computeOverlap(bucket.min.descriptor, bucket.max.descriptor);
      if (!overlap.temps.length) return;
      ctx.fillStyle = "rgba(59,130,246,0.15)";
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

  function computeOverlap(minDescriptor, maxDescriptor) {
    const start = Math.max(minDescriptor.segments[0].Tmin, maxDescriptor.segments[0].Tmin);
    const end = Math.min(
      minDescriptor.segments[minDescriptor.segments.length - 1].Tmax,
      maxDescriptor.segments[maxDescriptor.segments.length - 1].Tmax
    );
    const temps = [];
    const minVals = [];
    const maxVals = [];
    if (!(end > start)) return { temps, minVals, maxVals };
    for (let i = 0; i < FILL_SAMPLES; i++) {
      const ratio = i / (FILL_SAMPLES - 1);
      const T = start + (end - start) * ratio;
      const minVal = evaluateDescriptor(minDescriptor, T);
      const maxVal = evaluateDescriptor(maxDescriptor, T);
      if (minVal && maxVal) {
        temps.push(T);
        minVals.push(minVal);
        maxVals.push(maxVal);
      }
    }
    return { temps, minVals, maxVals };
  }

  function evaluateDescriptor(descriptor, temperature) {
    for (const segment of descriptor.segments) {
      if (temperature >= segment.Tmin && temperature <= segment.Tmax) {
        return evaluateModel(segment.model, temperature);
      }
    }
    return null;
  }

  function splitBand(groupId, descriptorBand) {
    if (descriptorBand) {
      return { baseId: groupId.replace(new RegExp(`_${descriptorBand}$`), ""), band: descriptorBand };
    }
    const match = groupId.match(/^(.*)_(mean|min|max)$/);
    if (!match) return { baseId: groupId, band: null };
    return { baseId: match[1], band: match[2] };
  }

  function handleDownload(button) {
    if (!currentSeries.length) {
      alert("Select and plot at least one group before downloading.");
      return;
    }
    const type = (button.dataset.download || "").toLowerCase();
    if (type === "json") {
      const payload = currentSeries.map((series) => ({
        group_id: series.groupId,
        label: series.label,
        samples: series.axisSamples,
      }));
      downloadBlob(
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
        "hdd-selected.json"
      );
    } else if (type === "csv") {
      const rows = ["group_id,label,temperature_axis,diffusivity_mm2_per_s,temperature_K"];
      currentSeries.forEach((series) => {
        series.axisSamples.forEach((sample) => {
          rows.push(
            [
              quote(series.groupId),
              quote(series.label),
              sample.temperature_axis.toFixed(2),
              sample.diffusivity.toExponential(6),
              sample.temperature_K.toFixed(2),
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

  function quote(value) {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function safeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function setStatus(message, tone = "info") {
    if (!dom.status) return;
    dom.status.textContent = message;
    dom.status.classList.remove("is-warn", "is-error", "is-ok");
    if (tone === "warn") dom.status.classList.add("is-warn");
    if (tone === "error") dom.status.classList.add("is-error");
    if (tone === "ok") dom.status.classList.add("is-ok");
  }

  function setShellState(stateValue) {
    if (dom.shell) {
      dom.shell.dataset.state = stateValue;
    }
  }
})();
