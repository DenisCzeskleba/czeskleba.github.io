(function () {
  const DELIMITER_CANDIDATES = [
    { id: "tab", label: "tab", split: (line) => line.split("\t") },
    { id: "semicolon", label: "semicolon", split: (line) => line.split(";") },
    { id: "whitespace", label: "whitespace", split: (line) => line.split(/\s+/) },
    { id: "comma", label: "comma", split: (line) => line.split(",") },
  ];

  const DECIMAL_OPTIONS = ["auto", ".", ","];
  const PLOT_WIDTH = 920;
  const PLOT_HEIGHT = 340;
  const PLOT_MARGINS = { top: 42, right: 88, bottom: 48, left: 72 };
  const SOLVER_POLICY = {
    minTerms: 50,
    maxTerms: 100,
    relTolerance: 1e-10,
    absTolerance: 1e-14,
    timeoutMs: 5000,
    dLower: 1e-16,
    dUpper: 1e-4,
  };

  const state = {
    parseTimer: null,
    currentFileName: null,
    currentParse: null,
    currentAnalysis: null,
    referenceVisibility: { baseline: true, steady: true },
    dragReference: null,
    dragPlot: null,
    plotViewport: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const root = document.getElementById("mda-app");
    if (!root) return;

    injectHeaderBrand();

    const dom = {
      root,
      input: document.getElementById("mda-input"),
      file: document.getElementById("mda-file"),
      uploadTrigger: document.getElementById("mda-upload-trigger"),
      currentUnit: document.getElementById("mda-current-unit"),
      baselineValue: document.getElementById("mda-baseline-value"),
      steadyValue: document.getElementById("mda-steady-value"),
      baselineToggle: document.getElementById("mda-baseline-toggle"),
      steadyToggle: document.getElementById("mda-steady-toggle"),
      thickness: document.getElementById("mda-thickness"),
      cropRange: document.getElementById("mda-crop-range"),
      decimal: document.getElementById("mda-decimal"),
      plotUnit: document.getElementById("mda-plot-unit"),
      gridToggle: document.getElementById("mda-grid-toggle"),
      resetPlot: document.getElementById("mda-reset-plot"),
      status: document.getElementById("mda-status"),
      issues: document.getElementById("mda-issues"),
      previewBody: document.getElementById("mda-preview-body"),
      plot: document.getElementById("mda-plot"),
      helpDrawer: document.getElementById("mda-help-drawer"),
      helpOpenButtons: root.querySelectorAll("[data-action='open-help']"),
      helpCloseButtons: document.querySelectorAll("[data-action='close-help']"),
      downloadButtons: root.querySelectorAll("[data-download]"),
      clearButton: document.getElementById("mda-clear"),
    };

    if (!dom.input || !dom.file || !dom.decimal || !dom.status || !dom.issues || !dom.previewBody || !dom.plot) {
      return;
    }

    dom.helpOpenButtons.forEach((button) => {
      button.addEventListener("click", () => openDrawer(dom.helpDrawer));
    });
    dom.helpCloseButtons.forEach((button) => {
      button.addEventListener("click", () => closeDrawer(dom.helpDrawer));
    });
    if (dom.helpDrawer) {
      dom.helpDrawer.addEventListener("click", (event) => {
        if (event.target === dom.helpDrawer.querySelector(".mda-help-backdrop")) {
          closeDrawer(dom.helpDrawer);
        }
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer(dom.helpDrawer);
    });

    dom.input.addEventListener("input", () => scheduleParse(dom, "paste"));
    dom.input.addEventListener("change", () => scheduleParse(dom, "paste"));
    dom.file.addEventListener("change", () => handleFileSelection(dom));
    if (dom.uploadTrigger && dom.file) {
      dom.uploadTrigger.addEventListener("click", () => dom.file.click());
    }
    dom.decimal.addEventListener("change", () => scheduleParse(dom, "selection"));

    [dom.baselineValue, dom.steadyValue, dom.thickness, dom.cropRange].forEach((element) => {
      if (!element) return;
      element.addEventListener("change", () => scheduleParse(dom, "selection"));
      element.addEventListener("input", () => scheduleParse(dom, "selection"));
    });
    if (dom.thickness) {
      dom.thickness.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        const current = parseNumberInput(dom.thickness.value);
        const next = (current != null ? current : 0) + (event.key === "ArrowUp" ? 0.05 : -0.05);
        dom.thickness.value = formatFixedNumber(Math.max(0, next), 2);
        scheduleParse(dom, "selection");
      });
      dom.thickness.addEventListener("blur", () => {
        const current = parseNumberInput(dom.thickness.value);
        if (current != null) dom.thickness.value = formatFixedNumber(current, 2);
      });
    }

    if (dom.currentUnit) {
      dom.currentUnit.addEventListener("change", () => {
        renderDerivedViews(dom);
      });
    }
    if (dom.plotUnit) {
      dom.plotUnit.addEventListener("change", () => {
        renderDerivedViews(dom);
      });
    }
    if (dom.gridToggle) {
      dom.gridToggle.addEventListener("change", () => renderDerivedViews(dom));
    }
    if (dom.resetPlot) {
      dom.resetPlot.addEventListener("click", () => {
        state.plotViewport = null;
        renderDerivedViews(dom);
      });
    }
    if (dom.downloadButtons) {
      dom.downloadButtons.forEach((button) => {
        button.addEventListener("click", () => handleDownload(dom, button.getAttribute("data-download")));
      });
    }

    if (dom.baselineToggle) {
      dom.baselineToggle.addEventListener("click", () => toggleReferenceVisibility(dom, "baseline"));
    }
    if (dom.steadyToggle) {
      dom.steadyToggle.addEventListener("click", () => toggleReferenceVisibility(dom, "steady"));
    }

    attachPlotInteractions(dom);

    if (dom.clearButton) {
      dom.clearButton.addEventListener("click", () => {
        dom.input.value = "";
        dom.file.value = "";
        state.currentFileName = null;
        state.currentParse = null;
        state.currentAnalysis = null;
        state.referenceVisibility.baseline = true;
        state.referenceVisibility.steady = true;
        state.dragReference = null;
        state.dragPlot = null;
        state.plotViewport = null;
        dom.decimal.value = "auto";
        if (dom.currentUnit) dom.currentUnit.value = "nA";
        if (dom.plotUnit) dom.plotUnit.value = "uA";
        if (dom.gridToggle) dom.gridToggle.checked = true;
        if (dom.baselineValue) dom.baselineValue.value = "";
        if (dom.steadyValue) dom.steadyValue.value = "";
        if (dom.thickness) dom.thickness.value = "0.50";
        if (dom.cropRange) dom.cropRange.value = "";
        renderEmpty(dom, "Paste data to begin.");
      });
    }

    if (dom.plotUnit) {
      dom.plotUnit.value = "uA";
    }
    renderEmpty(dom, "Paste data to begin.");
  }

  function injectHeaderBrand() {
    const header = document.querySelector("header");
    if (!header || header.querySelector(".mda-header-brand")) return;

    const actions = header.querySelector(".header-actions");
    if (!actions) return;

    const brand = document.createElement("div");
    brand.className = "mda-header-brand";
    brand.setAttribute("aria-label", "Membrane Diffusion Analyzer");
    brand.innerHTML = `
      <img class="mda-header-brand-image" src="/assets/Membrane Diffusion Analyser.png" alt="Membrane Diffusion Analyzer" decoding="async" loading="lazy" />
      <span class="mda-header-brand-text">Membrane Diffusion Analyzer</span>
    `;
    header.insertBefore(brand, actions);
  }

  function openDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function toggleReferenceVisibility(dom, kind) {
    state.referenceVisibility[kind] = !state.referenceVisibility[kind];
    syncReferenceControls(dom, state.currentAnalysis);
    renderDerivedViews(dom);
  }

  function attachPlotInteractions(dom) {
    if (!dom.plot) return;

    dom.plot.addEventListener("pointerdown", (event) => {
      const svg = getPlotSvg(dom, event);
      if (!svg) return;

      const target = event.target && event.target.closest ? event.target.closest("[data-ref-kind]") : null;
      if (target) {
        const kind = target.getAttribute("data-ref-kind");
        if (kind) {
          startReferenceDrag(dom, kind, event, svg);
          event.preventDefault();
        }
        return;
      }

      if (event.button === 0) {
        startPlotPan(dom, event, svg);
        event.preventDefault();
      }
    });

    dom.plot.addEventListener("pointermove", (event) => {
      if (!state.dragReference) return;
      if (Number.isFinite(state.dragReference.pointerId) && event.pointerId !== state.dragReference.pointerId) return;
      const svg = getPlotSvg(dom, event);
      if (!svg) return;
      updateReferenceFromPointer(dom, state.dragReference.kind, event, svg);
      event.preventDefault();
    });

    dom.plot.addEventListener("pointermove", (event) => {
      if (!state.dragPlot) return;
      if (Number.isFinite(state.dragPlot.pointerId) && event.pointerId !== state.dragPlot.pointerId) return;
      const svg = getPlotSvg(dom, event);
      if (!svg || !state.currentAnalysis) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (event.clientX - state.dragPlot.startX) / rect.width;
      const dy = (event.clientY - state.dragPlot.startY) / rect.height;
      const base = state.dragPlot.viewport || state.dragPlot.ranges;
      const xSpan = base.xMax - base.xMin;
      const ySpan = base.yMax - base.yMin;
      const diffusionYSpan = base.diffusionYMax - base.diffusionYMin;
      state.plotViewport = {
        xMin: base.xMin - dx * xSpan,
        xMax: base.xMax - dx * xSpan,
        yMin: base.yMin + dy * ySpan,
        yMax: base.yMax + dy * ySpan,
        diffusionYMin: base.diffusionYMin + dy * diffusionYSpan,
        diffusionYMax: base.diffusionYMax + dy * diffusionYSpan,
      };
      renderPlot(dom, state.currentAnalysis);
      event.preventDefault();
    });

    const finishDrag = () => {
      if (state.dragReference && state.dragReference.svg && state.dragReference.svg.releasePointerCapture) {
        try {
          state.dragReference.svg.releasePointerCapture(state.dragReference.pointerId);
        } catch (error) {
          // Ignore capture failures.
        }
      }
      state.dragReference = null;
    };
    const finishPlotDrag = () => {
      if (state.dragPlot && state.dragPlot.svg && state.dragPlot.svg.releasePointerCapture) {
        try {
          state.dragPlot.svg.releasePointerCapture(state.dragPlot.pointerId);
        } catch (error) {
          // Ignore capture failures.
        }
      }
      state.dragPlot = null;
    };
    dom.plot.addEventListener("pointerup", finishDrag);
    dom.plot.addEventListener("pointercancel", finishDrag);
    dom.plot.addEventListener("pointerleave", finishDrag);
    dom.plot.addEventListener("pointerup", finishPlotDrag);
    dom.plot.addEventListener("pointercancel", finishPlotDrag);
    dom.plot.addEventListener("pointerleave", finishPlotDrag);
    dom.plot.addEventListener(
      "wheel",
      (event) => {
        if (!state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) return;
        zoomPlot(dom, event);
      },
      { passive: false },
    );
    dom.plot.addEventListener("dblclick", (event) => {
      if (!state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) return;
      if (event.target && event.target.closest && event.target.closest("[data-ref-kind]")) return;
      state.plotViewport = null;
      renderPlot(dom, state.currentAnalysis);
    });
  }

  function getPlotSvg(dom, event) {
    const target = event && event.target ? event.target : null;
    if (!target) {
      return dom.plot ? dom.plot.querySelector("svg") : null;
    }
    if (target.tagName && target.tagName.toLowerCase() === "svg") {
      return target;
    }
    if (target.ownerSVGElement) {
      return target.ownerSVGElement;
    }
    return dom.plot ? dom.plot.querySelector("svg") : null;
  }

  function startReferenceDrag(dom, kind, event, svg) {
    state.dragReference = { kind, pointerId: event.pointerId, svg };
    if (svg && svg.setPointerCapture) {
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore capture failures.
      }
    }
    state.referenceVisibility[kind] = true;
    updateReferenceFromPointer(dom, kind, event, svg);
  }

  function startPlotPan(dom, event, svg) {
    if (!state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) return;
    const ranges = getPlotRanges(state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom));
    state.dragPlot = {
      pointerId: event.pointerId,
      svg,
      startX: event.clientX,
      startY: event.clientY,
      viewport: state.plotViewport ? { ...state.plotViewport } : null,
      ranges,
    };
    if (svg && svg.setPointerCapture) {
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore capture failures.
      }
    }
  }

  function zoomPlot(dom, event) {
    if (!state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) return;
    const svg = getPlotSvg(dom, event);
    if (!svg) return;
    const ranges = getPlotRanges(state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom));
    const point = pointerToDataPoint(event, svg, ranges);
    if (!point) return;

    const factor = event.deltaY > 0 ? 1.12 : 0.89;
    const next = scaleViewport(ranges, point, factor);
    state.plotViewport = next;
    renderPlot(dom, state.currentAnalysis);
    event.preventDefault();
  }

  function pointerToDataPoint(event, svg, ranges) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));
    const innerWidth = PLOT_WIDTH - PLOT_MARGINS.left - PLOT_MARGINS.right;
    const innerHeight = PLOT_HEIGHT - PLOT_MARGINS.top - PLOT_MARGINS.bottom;
    return {
      x: ranges.xMin + ((clampedX * PLOT_WIDTH - PLOT_MARGINS.left) / innerWidth) * (ranges.xMax - ranges.xMin),
      y: ranges.yMax - ((clampedY * PLOT_HEIGHT - PLOT_MARGINS.top) / innerHeight) * (ranges.yMax - ranges.yMin),
    };
  }

  function scaleViewport(ranges, center, scaleX) {
    const scaleY = scaleX;
    const xSpan = Math.max(ranges.xMax - ranges.xMin, Number.EPSILON);
    const ySpan = Math.max(ranges.yMax - ranges.yMin, Number.EPSILON);
    const diffusionYSpan = Math.max(ranges.diffusionYMax - ranges.diffusionYMin, Number.EPSILON);
    const nextXSpan = Math.max(xSpan * scaleX, Number.EPSILON);
    const nextYSpan = Math.max(ySpan * scaleY, Number.EPSILON);
    const nextDiffusionYSpan = Math.max(diffusionYSpan * scaleY, Number.EPSILON);
    const xRatio = xSpan ? (center.x - ranges.xMin) / xSpan : 0.5;
    const yRatio = ySpan ? (center.y - ranges.yMin) / ySpan : 0.5;
    const xMin = center.x - xRatio * nextXSpan;
    const xMax = xMin + nextXSpan;
    const yMin = center.y - yRatio * nextYSpan;
    const yMax = yMin + nextYSpan;
    const diffusionYRatio = diffusionYSpan ? (center.y - ranges.diffusionYMin) / diffusionYSpan : 0.5;
    const diffusionYMin = center.y - diffusionYRatio * nextDiffusionYSpan;
    const diffusionYMax = diffusionYMin + nextDiffusionYSpan;
    return { xMin, xMax, yMin, yMax, diffusionYMin, diffusionYMax };
  }

  function getCurrentPlotRanges(analysis, inputUnit, displayUnit) {
    const rows = analysis && analysis.rows ? analysis.rows : [];
    const points = rows
      .map((row) => ({
        x: row.time,
        y: convertCurrentValue(row.current, inputUnit || "A", displayUnit || inputUnit || "A"),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }

    const base = getBasePlotRanges(points);
    if (!state.plotViewport) return base;

    const xMin = Number.isFinite(state.plotViewport.xMin) ? state.plotViewport.xMin : base.xMin;
    const xMax = Number.isFinite(state.plotViewport.xMax) ? state.plotViewport.xMax : base.xMax;
    const yMin = Number.isFinite(state.plotViewport.yMin) ? state.plotViewport.yMin : base.yMin;
    const yMax = Number.isFinite(state.plotViewport.yMax) ? state.plotViewport.yMax : base.yMax;
    if (xMax <= xMin || yMax <= yMin) return base;
    return { xMin, xMax, yMin, yMax };
  }

  function getPlotRanges(analysis, inputUnit, displayUnit) {
    const currentRanges = getCurrentPlotRanges(analysis, inputUnit, displayUnit);
    const diffusionRanges = getDiffusionPlotRanges(analysis);
    return {
      xMin: currentRanges.xMin,
      xMax: currentRanges.xMax,
      yMin: currentRanges.yMin,
      yMax: currentRanges.yMax,
      diffusionYMin: diffusionRanges.yMin,
      diffusionYMax: diffusionRanges.yMax,
    };
  }

  function getDiffusionPlotRanges(analysis) {
    const rows = analysis && analysis.previewRows ? analysis.previewRows : [];
    const points = rows
      .map((row) => ({ x: row.time, y: row.diffusivity }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const base = getBasePlotRanges(points);
    if (!state.plotViewport) {
      return base;
    }
    const xMin = Number.isFinite(state.plotViewport.xMin) ? state.plotViewport.xMin : base.xMin;
    const xMax = Number.isFinite(state.plotViewport.xMax) ? state.plotViewport.xMax : base.xMax;
    const yMin = Number.isFinite(state.plotViewport.diffusionYMin) ? state.plotViewport.diffusionYMin : base.yMin;
    const yMax = Number.isFinite(state.plotViewport.diffusionYMax) ? state.plotViewport.diffusionYMax : base.yMax;
    if (xMax <= xMin || yMax <= yMin) {
      return base;
    }
    return { xMin, xMax, yMin, yMax };
  }

  function getBasePlotRanges(points) {
    let xMin = points[0].x;
    let xMax = points[0].x;
    let yMin = points[0].y;
    let yMax = points[0].y;
    points.forEach((point) => {
      xMin = Math.min(xMin, point.x);
      xMax = Math.max(xMax, point.x);
      yMin = Math.min(yMin, point.y);
      yMax = Math.max(yMax, point.y);
    });

    const xSpan = xMax - xMin || Math.max(1, Math.abs(xMin) || 1);
    const ySpan = yMax - yMin || Math.max(1e-12, Math.abs(yMin) || 1e-12);
    const xPad = xSpan * 0.08;
    const yPad = ySpan * 0.08;
    return {
      xMin: xMin - xPad,
      xMax: xMax + xPad,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }

  function buildNiceTicks(min, max, targetCount) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    if (min === max) return [min];
    const count = Math.max(2, targetCount || 5);
    const range = niceNumber(max - min, false);
    const step = niceNumber(range / (count - 1), true);
    const graphMin = Math.floor(min / step) * step;
    const graphMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let value = graphMin; value <= graphMax + step / 2; value += step) {
      ticks.push(Number(value.toPrecision(12)));
    }
    return ticks;
  }

  function niceNumber(range, round) {
    const exponent = Math.floor(Math.log10(Math.abs(range)));
    const fraction = Math.abs(range) / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  function updateReferenceFromPointer(dom, kind, event, svg) {
    if (!state.currentAnalysis) return;
    if (state.dragReference && Number.isFinite(state.dragReference.pointerId) && event.pointerId !== state.dragReference.pointerId) {
      return;
    }
    const y = pointerToPlotY(event, svg);
    if (y == null) return;
    const value = plotYToValue(y, svg, state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom));
    if (!Number.isFinite(value)) return;

    if (kind === "baseline" && dom.baselineValue) {
      dom.baselineValue.value = formatNumber(value);
      parseAndRender(dom, "selection");
    } else if (kind === "steady" && dom.steadyValue) {
      dom.steadyValue.value = formatNumber(value);
      parseAndRender(dom, "selection");
    }
  }

  function pointerToPlotY(event, svg) {
    const rect = svg.getBoundingClientRect();
    if (!rect.height) return null;
    const y = ((event.clientY - rect.top) / rect.height) * PLOT_HEIGHT;
    return Math.max(0, Math.min(PLOT_HEIGHT, y));
  }

  function plotYToValue(y, svg, analysis, inputUnit, displayUnit) {
    const ranges = getCurrentPlotRanges(analysis, inputUnit, displayUnit);
    if (!Number.isFinite(ranges.yMin) || !Number.isFinite(ranges.yMax) || ranges.yMax === ranges.yMin) return null;

    const innerHeight = PLOT_HEIGHT - PLOT_MARGINS.top - PLOT_MARGINS.bottom;
    const relative = (y - PLOT_MARGINS.top) / innerHeight;
    const clamped = Math.max(0, Math.min(1, relative));
    return ranges.yMax - clamped * (ranges.yMax - ranges.yMin);
  }

  function scheduleParse(dom, source) {
    if (state.parseTimer) window.clearTimeout(state.parseTimer);
    state.parseTimer = window.setTimeout(() => parseAndRender(dom, source), source === "file" ? 0 : 80);
  }

  function handleFileSelection(dom) {
    const file = dom.file.files && dom.file.files[0];
    if (!file) {
      state.currentFileName = null;
      scheduleParse(dom, "selection");
      return;
    }

    state.currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      dom.input.value = String(reader.result || "");
      dom.decimal.value = "auto";
      parseAndRender(dom, "file");
    };
    reader.onerror = () => {
      setStatus(dom, "Could not read the selected file.", "error");
      setIssues(dom, [`File read failed for ${file.name}.`]);
      renderPlotEmpty(dom);
    };
    reader.readAsText(file);
  }

  function parseAndRender(dom, source) {
    const raw = String(dom.input.value || "").trim();
    if (!raw) {
      state.currentParse = null;
      state.currentAnalysis = null;
      state.plotViewport = null;
      renderEmpty(dom, "Paste data to begin.");
      return;
    }

    const manualDecimal = dom.decimal.value;
    const forcedDecimal =
      source === "selection" && DECIMAL_OPTIONS.includes(manualDecimal) && manualDecimal !== "auto"
        ? manualDecimal
        : null;

    const parseResult = bestParse(raw, forcedDecimal);
    if (!parseResult.valid) {
      state.currentParse = null;
      state.currentAnalysis = null;
      state.plotViewport = null;
      setStatus(dom, "Could not find a clean two-column input in the pasted text.", "error");
      setIssues(dom, buildFailureMessages(raw, manualDecimal, parseResult.failure));
      renderEmptyTable(dom);
      updateSummary(dom, null);
      renderPlotEmpty(dom);
      return;
    }

    const config = parseResult.valid;
    if (source !== "selection") {
      dom.decimal.value = config.decimalSeparator;
    }

    state.currentParse = config;
    state.currentAnalysis = buildAnalysis(dom, config);
    if (source === "paste" || source === "file") {
      state.plotViewport = null;
    }
    renderParsed(dom, config, state.currentAnalysis);
  }

  function bestParse(raw, forcedDecimal) {
    const decimalCandidates = forcedDecimal ? [forcedDecimal] : [".", ","];
    let bestValid = null;
    let bestFailure = null;

    for (const decimalSeparator of decimalCandidates) {
      for (const delimiter of DELIMITER_CANDIDATES) {
        const attempt = parseWithConfig(raw, decimalSeparator, delimiter);
        if (!attempt) continue;

        if (!bestFailure || isBetterAttempt(attempt, bestFailure)) {
          bestFailure = attempt;
        }

        if (attempt.errors.length === 0 && attempt.rows.length > 0) {
          if (!bestValid || isBetterValid(attempt, bestValid)) {
            bestValid = attempt;
          }
        }
      }
    }

    return { valid: bestValid, failure: bestFailure };
  }

  function isBetterAttempt(candidate, current) {
    if (candidate.rows.length !== current.rows.length) {
      return candidate.rows.length > current.rows.length;
    }
    if (candidate.errors.length !== current.errors.length) {
      return candidate.errors.length < current.errors.length;
    }
    if (candidate.validLineCount !== current.validLineCount) {
      return candidate.validLineCount > current.validLineCount;
    }
    if (candidate.delimiter.id !== current.delimiter.id) {
      return delimiterRank(candidate.delimiter.id) < delimiterRank(current.delimiter.id);
    }
    if (candidate.decimalSeparator !== current.decimalSeparator) {
      return candidate.decimalSeparator === ".";
    }
    return false;
  }

  function isBetterValid(candidate, current) {
    if (candidate.rows.length !== current.rows.length) {
      return candidate.rows.length > current.rows.length;
    }
    if (candidate.delimiter.id !== current.delimiter.id) {
      return delimiterRank(candidate.delimiter.id) < delimiterRank(current.delimiter.id);
    }
    if (candidate.decimalSeparator !== current.decimalSeparator) {
      return candidate.decimalSeparator === ".";
    }
    return false;
  }

  function delimiterRank(id) {
    switch (id) {
      case "tab":
        return 0;
      case "semicolon":
        return 1;
      case "whitespace":
        return 2;
      case "comma":
        return 3;
      default:
        return 99;
    }
  }

  function parseWithConfig(raw, decimalSeparator, delimiter) {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return null;

    const rows = [];
    const errors = [];
    const parsedLines = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const parts = delimiter.split(line).map((part) => part.trim()).filter((part) => part.length > 0);

      if (parts.length !== 2) {
        errors.push({
          lineNumber,
          message: `Line ${lineNumber}: expected exactly 2 columns, found ${parts.length}.`,
        });
        parsedLines.push({ lineNumber, valid: false });
        return;
      }

      const time = parseStrictNumber(parts[0], decimalSeparator);
      const current = parseStrictNumber(parts[1], decimalSeparator);
      if (time == null || current == null) {
        errors.push({
          lineNumber,
          message: `Line ${lineNumber}: could not parse the time/value pair.`,
        });
        parsedLines.push({ lineNumber, valid: false });
        return;
      }

      rows.push({
        lineNumber,
        time,
        current,
      });
      parsedLines.push({ lineNumber, valid: true });
    });

    return {
      rows,
      errors,
      parsedLines,
      decimalSeparator,
      delimiter,
      validLineCount: rows.length,
      headerLikely: looksLikeHeader(lines[0]),
    };
  }

  function parseStrictNumber(raw, decimalSeparator) {
    const text = String(raw || "").trim();
    if (!text) return null;

    if (decimalSeparator === "." && text.includes(",")) return null;
    if (decimalSeparator === "," && text.includes(".")) return null;

    const normalized = decimalSeparator === "," ? text.replace(/,/g, ".") : text;
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) {
      return null;
    }

    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  function looksLikeHeader(line) {
    if (!line) return false;
    return /[A-DF-Za-df-z]/.test(line);
  }

  function buildFailureMessages(raw, decimalSeparator, attempt) {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const messages = [];

    if (attempt && attempt.headerLikely) {
      messages.push("Header rows are not allowed. Paste only the two data columns.");
    }

    if (attempt && attempt.errors && attempt.errors.length) {
      messages.push(...attempt.errors.slice(0, 3).map((entry) => entry.message));
    }

    if (!messages.length && lines.length) {
      messages.push("Could not find a clean two-column input in the pasted text.");
    }

    messages.push("Use exactly two columns: time first, value second.");

    return dedupe(messages);
  }

  function buildAnalysis(dom, config) {
    const notes = [];
    const issues = [];
    const cropRange = parseRangeSpec(dom.cropRange ? dom.cropRange.value : "");
    let rows = config.rows.slice();

    if (cropRange) {
      rows = rows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end);
      notes.push(`Crop range applied: ${formatNumber(cropRange.start)} to ${formatNumber(cropRange.end)} s.`);
    }

    if (!rows.length) {
      issues.push("No rows remain after cropping.");
      return {
        rows: [],
      previewRows: [],
      baseline: null,
      steady: null,
        thicknessMm: null,
        normalizedAvailable: false,
        issues,
        notes,
      };
    }

    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);

    const baseline = resolveReferenceRows(rows, dom.baselineValue ? dom.baselineValue.value : null, "baseline", inputUnit, displayUnit);
    const steady = resolveReferenceRows(rows, dom.steadyValue ? dom.steadyValue.value : null, "steady", inputUnit, displayUnit);
    const thicknessMm = parseNumberInput(dom.thickness ? dom.thickness.value : null);

    if (baseline.error) issues.push(baseline.error);
    if (steady.error) issues.push(steady.error);

    let normalizedAvailable = false;
    const denom = baseline.value != null && steady.value != null ? steady.value - baseline.value : null;
    if (denom != null && denom !== 0) {
      normalizedAvailable = true;
    } else if (baseline.value != null && steady.value != null) {
      issues.push("Baseline and steady-state values are identical. Normalization is undefined.");
    }

    const solveDeadline = performance.now() + SOLVER_POLICY.timeoutMs;
    const previewRows = rows.map((row) => ({
      ...row,
      currentDisplay: convertCurrentValue(row.current, inputUnit, displayUnit),
      normalized: normalizedAvailable ? (row.current - baseline.value) / denom : null,
      diffusivity:
        normalizedAvailable && thicknessMm != null
          ? solveApparentDiffusivity((row.current - baseline.value) / denom, row.time, thicknessMm / 1000, solveDeadline)
          : null,
    }));

    for (let i = 1; i < rows.length; i += 1) {
      if (rows[i].time <= rows[i - 1].time) {
        notes.push("Time is not strictly increasing. The first analysis pass expects a monotonic time axis.");
        break;
      }
    }

    if (normalizedAvailable) {
      const outsideRange = previewRows.filter(
        (row) => Number.isFinite(row.normalized) && (row.normalized < -0.25 || row.normalized > 1.25),
      );
      if (outsideRange.length) {
        notes.push("Normalized values extend outside the expected 0 to 1 range.");
      }
    }

    return {
      rows,
      previewRows,
      baseline,
      steady,
      thicknessMm,
      normalizedAvailable,
      issues,
      notes,
    };
  }

  function renderParsed(dom, config, analysis) {
    setStatus(dom, "Loaded data.", "ok");

    const warnings = [];
    if (config.headerLikely) {
      warnings.push("Header rows are not allowed. Paste only the two data columns.");
    }
    warnings.push(...analysis.notes);
    setIssues(dom, dedupe([...warnings, ...analysis.issues]).filter(Boolean));

    syncReferenceControls(dom, analysis);
    updateSummary(dom, analysis);
    renderPreview(dom, analysis);
    renderPlot(dom, analysis);
  }

  function renderDerivedViews(dom) {
    if (!state.currentAnalysis || !state.currentParse) {
      renderEmpty(dom, "Paste data to begin.");
      return;
    }
    syncReferenceControls(dom, state.currentAnalysis);
    updateSummary(dom, state.currentAnalysis);
    renderPreview(dom, state.currentAnalysis);
    renderPlot(dom, state.currentAnalysis);
  }

  function syncReferenceControls(dom, analysis) {
    const baselineValue = analysis && analysis.baseline && Number.isFinite(analysis.baseline.value) ? analysis.baseline.value : null;
    const steadyValue = analysis && analysis.steady && Number.isFinite(analysis.steady.value) ? analysis.steady.value : null;

    if (dom.baselineValue) {
      if (!String(dom.baselineValue.value || "").trim() && baselineValue != null && document.activeElement !== dom.baselineValue) {
        dom.baselineValue.value = formatNumber(baselineValue);
      }
    }
    if (dom.steadyValue) {
      if (!String(dom.steadyValue.value || "").trim() && steadyValue != null && document.activeElement !== dom.steadyValue) {
        dom.steadyValue.value = formatNumber(steadyValue);
      }
    }

    if (dom.baselineToggle) {
      dom.baselineToggle.textContent = state.referenceVisibility.baseline === false ? "Show" : "Hide";
      dom.baselineToggle.setAttribute("aria-pressed", state.referenceVisibility.baseline === false ? "false" : "true");
    }
    if (dom.steadyToggle) {
      dom.steadyToggle.textContent = state.referenceVisibility.steady === false ? "Show" : "Hide";
      dom.steadyToggle.setAttribute("aria-pressed", state.referenceVisibility.steady === false ? "false" : "true");
    }
  }

  function updateSummary(dom, analysis) {
    void dom;
    void analysis;
  }

  function renderPreview(dom, analysis) {
    const previewRows = (analysis && analysis.previewRows ? analysis.previewRows : []).slice(0, 8);
    if (!previewRows.length) {
      renderEmptyTable(dom);
      return;
    }

    const unitLabel = formatUnitLabel(getDisplayUnit(dom));
    dom.previewBody.innerHTML = previewRows
      .map((row, index) => {
        const currentCell = Number.isFinite(row.currentDisplay)
          ? formatNumber(row.currentDisplay)
          : formatNumber(convertCurrentValue(row.current, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom)));
        const diffusivityCell = Number.isFinite(row.diffusivity) ? formatPlotNumber(row.diffusivity) : "&mdash;";
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${formatNumber(row.time)}</td>
            <td>${currentCell}</td>
            <td>${diffusivityCell}</td>
          </tr>
        `;
      })
      .join("");

    const table = dom.previewBody.closest("table");
    const headerCells = table ? table.querySelectorAll("thead th") : null;
    if (headerCells && headerCells[2]) {
      headerCells[2].textContent = `Current [${unitLabel}]`;
    }
  }

  function renderPlot(dom, analysis) {
    if (!dom.plot) return;

    const rows = analysis && analysis.rows ? analysis.rows : [];
    if (!rows.length) {
      renderPlotEmpty(dom);
      return;
    }

    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);
    const currentUnitLabel = formatUnitLabel(displayUnit);
    const showGrid = !dom.gridToggle || dom.gridToggle.checked;

    const currentPoints = rows
      .map((row) => ({ x: row.time, y: convertCurrentValue(row.current, inputUnit, displayUnit) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const diffusionPoints = (analysis.previewRows || [])
      .map((row) => ({ x: row.time, y: row.diffusivity }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    if (!currentPoints.length) {
      renderPlotEmpty(dom);
      return;
    }

    const orderedCurrent = currentPoints.slice().sort((a, b) => a.x - b.x);
    const orderedDiffusion = diffusionPoints.slice().sort((a, b) => a.x - b.x);
    const currentRanges = getCurrentPlotRanges(analysis, inputUnit, displayUnit);
    const diffusionRanges = getDiffusionPlotRanges(analysis);
    const xTicks = buildNiceTicks(currentRanges.xMin, currentRanges.xMax, 5);
    const currentTicks = buildNiceTicks(currentRanges.yMin, currentRanges.yMax, 5);
    const diffusionTicks = buildNiceTicks(diffusionRanges.yMin, diffusionRanges.yMax, 5);

    const innerWidth = PLOT_WIDTH - PLOT_MARGINS.left - PLOT_MARGINS.right;
    const innerHeight = PLOT_HEIGHT - PLOT_MARGINS.top - PLOT_MARGINS.bottom;
    const scaleX = (value) => PLOT_MARGINS.left + ((value - currentRanges.xMin) / (currentRanges.xMax - currentRanges.xMin)) * innerWidth;
    const scaleCurrentY = (value) =>
      PLOT_MARGINS.top + (1 - (value - currentRanges.yMin) / (currentRanges.yMax - currentRanges.yMin)) * innerHeight;
    const scaleDiffusionY = (value) =>
      PLOT_MARGINS.top + (1 - (value - diffusionRanges.yMin) / (diffusionRanges.yMax - diffusionRanges.yMin)) * innerHeight;

    const currentPath = orderedCurrent
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleCurrentY(point.y).toFixed(2)}`)
      .join(" ");
    const diffusionPath = orderedDiffusion
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleDiffusionY(point.y).toFixed(2)}`)
      .join(" ");

    const parts = [];
    parts.push(`<svg viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" role="img" aria-label="Preview of measured permeation current and diffusion coefficient">`);
    const legendX = PLOT_MARGINS.left + 14;
    const legendY = 8;
    parts.push(`
      <g class="mda-plot-legend-group" transform="translate(${legendX} ${legendY})">
        <g class="mda-plot-legend-item mda-plot-legend-diffusion">
          <line x1="0" y1="6" x2="18" y2="6" class="mda-plot-legend-line"></line>
          <text x="26" y="10">
            <tspan x="26" dy="0">Diffusion coefficient</tspan>
            <tspan x="26" dy="11">D_app(t)</tspan>
          </text>
        </g>
        <g class="mda-plot-legend-item mda-plot-legend-current" transform="translate(0 24)">
          <line x1="0" y1="6" x2="18" y2="6" class="mda-plot-legend-line"></line>
          <text x="26" y="10">Measured permeation current I(t)</text>
        </g>
      </g>
    `);

    currentTicks.forEach((value) => {
      const y = scaleCurrentY(value);
      if (showGrid) {
        parts.push(`<line class="mda-plot-grid" x1="${PLOT_MARGINS.left}" y1="${y.toFixed(2)}" x2="${PLOT_WIDTH - PLOT_MARGINS.right}" y2="${y.toFixed(2)}"></line>`);
      }
      parts.push(
        `<text class="mda-plot-value mda-plot-value-current" x="${PLOT_WIDTH - PLOT_MARGINS.right + 8}" y="${(y + 4).toFixed(2)}" text-anchor="start">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });

    diffusionTicks.forEach((value) => {
      const y = scaleDiffusionY(value);
      parts.push(
        `<text class="mda-plot-value mda-plot-value-diffusion" x="${PLOT_MARGINS.left - 8}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(formatScientificTick(value))}</text>`,
      );
    });

    xTicks.forEach((value) => {
      const x = scaleX(value);
      if (showGrid) {
        parts.push(`<line class="mda-plot-grid" x1="${x.toFixed(2)}" y1="${PLOT_MARGINS.top}" x2="${x.toFixed(2)}" y2="${PLOT_HEIGHT - PLOT_MARGINS.bottom}"></line>`);
      }
      parts.push(
        `<text class="mda-plot-value" x="${x.toFixed(2)}" y="${PLOT_HEIGHT - 14}" text-anchor="middle">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });

    if (diffusionPath) parts.push(`<path class="mda-plot-line mda-plot-line-diffusion" d="${diffusionPath}"></path>`);
    if (currentPath) parts.push(`<path class="mda-plot-line mda-plot-line-current" d="${currentPath}"></path>`);

    const references = [
      { kind: "baseline", ref: analysis.baseline, label: "Baseline", className: "mda-plot-ref-baseline" },
      { kind: "steady", ref: analysis.steady, label: "Steady State", className: "mda-plot-ref-steady" },
    ];
    references.forEach((entry) => {
      if (!entry.ref || !Number.isFinite(entry.ref.value)) return;
      if (state.referenceVisibility[entry.kind] === false) return;
      const refValue = convertCurrentValue(entry.ref.value, inputUnit, displayUnit);
      const y = scaleCurrentY(refValue);
      const handleX = PLOT_WIDTH - PLOT_MARGINS.right - 6;
      const lineColorClass = entry.kind === "baseline" ? "mda-plot-ref-baseline" : "mda-plot-ref-steady";
      parts.push(`<line class="mda-plot-ref-line ${lineColorClass}" data-ref-kind="${entry.kind}" x1="${PLOT_MARGINS.left}" y1="${y.toFixed(2)}" x2="${PLOT_WIDTH - PLOT_MARGINS.right}" y2="${y.toFixed(2)}"></line>`);
      parts.push(`<text class="mda-plot-ref-label ${lineColorClass}" x="${handleX - 8}" y="${Math.max(18, y - 7).toFixed(2)}" text-anchor="end">${escapeHtml(entry.label)}</text>`);
    });

    parts.push(`
      <text class="mda-plot-axis-label mda-plot-axis-left" transform="translate(18 ${PLOT_HEIGHT / 2}) rotate(-90)" text-anchor="middle">
        <tspan>Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan> (t) [mm</tspan><tspan baseline-shift="super" font-size="8">2</tspan><tspan>/s]</tspan>
      </text>
    `);
    parts.push(`
      <text class="mda-plot-axis-label mda-plot-axis-right" transform="translate(${PLOT_WIDTH - 18} ${PLOT_HEIGHT / 2}) rotate(270)" text-anchor="middle">
        <tspan>Permeation current I(t) [${currentUnitLabel}]</tspan>
      </text>
    `);
    parts.push(`<text class="mda-plot-axis-label mda-plot-axis-x" x="${PLOT_WIDTH / 2}" y="${PLOT_HEIGHT - 6}" text-anchor="middle">Time [s]</text>`);
    parts.push("</svg>");

    dom.plot.innerHTML = parts.join("");
  }

  function renderPlotEmpty(dom) {
    if (dom.plot) {
      dom.plot.innerHTML = `<div class="mda-plot-empty">Paste data to see the preview plot.</div>`;
    }
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const text = Number(value.toPrecision(12)).toString();
    return text;
  }

  function formatFixedNumber(value, digits) {
    if (!Number.isFinite(value)) return "";
    return Number(value).toFixed(digits);
  }

  function formatPlotNumber(value) {
    if (!Number.isFinite(value)) return "";
    const abs = Math.abs(value);
    if (abs >= 10000 || (abs > 0 && abs < 0.001)) {
      return Number(value.toExponential(2)).toString();
    }
    return Number(value.toPrecision(4)).toString();
  }

  function formatAxisTick(value) {
    if (!Number.isFinite(value)) return "";
    const abs = Math.abs(value);
    if (abs === 0) return "0";
    if (abs >= 10000 || abs < 1e-4) {
      return Number(value.toExponential(2)).toString();
    }
    if (abs >= 1000) return Number(value.toFixed(0)).toString();
    if (abs >= 100) return Number(value.toFixed(1)).toString();
    if (abs >= 10) return Number(value.toFixed(2)).toString();
    if (abs >= 1) return Number(value.toFixed(3)).toString();
    if (abs >= 0.1) return Number(value.toFixed(4)).toString();
    return Number(value.toFixed(5)).toString();
  }

  function formatScientificTick(value) {
    if (!Number.isFinite(value)) return "";
    if (value === 0) return "0";
    const parts = Number(value).toExponential(2).split("e");
    const mantissa = parts[0];
    const exponent = Number(parts[1]);
    return `${mantissa}×10${exponent < 0 ? "⁻" : ""}${Math.abs(exponent)}`;
  }

  function setStatus(dom, message, tone) {
    dom.status.textContent = message;
    dom.status.classList.remove("is-error", "is-ok");
    if (tone === "error") dom.status.classList.add("is-error");
    if (tone === "ok") dom.status.classList.add("is-ok");
  }

  function setIssues(dom, messages) {
    const items = Array.isArray(messages) ? messages : [String(messages)];
    const filtered = items.filter(Boolean);
    dom.issues.innerHTML = filtered.map((message) => `<li>${escapeHtml(message)}</li>`).join("");
  }

  function getCurrentFactor(unit) {
    switch (unit) {
      case "A":
        return 1;
      case "mA":
        return 1e-3;
      case "uA":
        return 1e-6;
      case "nA":
        return 1e-9;
      case "pA":
        return 1e-12;
      default:
        return 1;
    }
  }

  function getDisplayUnit(dom) {
    if (dom && dom.plotUnit && dom.plotUnit.value) return dom.plotUnit.value;
    if (dom && dom.currentUnit && dom.currentUnit.value) return dom.currentUnit.value;
    return "A";
  }

  function convertCurrentValue(value, fromUnit, toUnit) {
    if (!Number.isFinite(value)) return null;
    return (value * getCurrentFactor(fromUnit)) / getCurrentFactor(toUnit);
  }

  function solveApparentDiffusivity(normalized, timeSeconds, thicknessMeters, deadline) {
    if (!Number.isFinite(normalized) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (timeSeconds <= 0 || thicknessMeters <= 0) return null;

    const target = clamp(normalized, 1e-12, 1 - 1e-12);
    let lower = SOLVER_POLICY.dLower;
    let upper = SOLVER_POLICY.dUpper;
    let lowerValue = evaluateFickResponse(lower, timeSeconds, thicknessMeters);
    let upperValue = evaluateFickResponse(upper, timeSeconds, thicknessMeters);
    if (!Number.isFinite(lowerValue) || !Number.isFinite(upperValue)) return null;

    if (target <= lowerValue) return lower;
    if (target >= upperValue) return upper;

    const solveDeadline = Number.isFinite(deadline) ? deadline : performance.now() + SOLVER_POLICY.timeoutMs;
    let best = null;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const mid = Math.sqrt(lower * upper);
      const midValue = evaluateFickResponse(mid, timeSeconds, thicknessMeters, solveDeadline);
      if (!Number.isFinite(midValue)) return best;
      best = mid;
      const error = midValue - target;
      const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(target)));
      if (Math.abs(error) <= tolerance) return mid;
      if (midValue < target) {
        lower = mid;
        lowerValue = midValue;
      } else {
        upper = mid;
        upperValue = midValue;
      }
      if (upper / lower <= 1 + 1e-12) return mid;
    }
    return best;
  }

  function evaluateFickResponse(diffusivity, timeSeconds, thicknessMeters, deadline) {
    if (!Number.isFinite(diffusivity) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (diffusivity <= 0 || timeSeconds <= 0 || thicknessMeters <= 0) return 0;

    const factor = (Math.PI * Math.PI * diffusivity * timeSeconds) / (thicknessMeters * thicknessMeters);
    let sum = 0;
    let stableCount = 0;
    let previousValue = null;

    for (let n = 1; n <= SOLVER_POLICY.maxTerms; n += 1) {
      if (deadline && performance.now() > deadline) return null;
      const sign = n % 2 === 0 ? 1 : -1;
      const term = sign * Math.exp(-(n * n) * factor);
      sum += term;

      const value = 1 + 2 * sum;
      if (n >= SOLVER_POLICY.minTerms) {
        const delta = previousValue == null ? Math.abs(term) : Math.abs(value - previousValue);
        const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(value)));
        if (delta <= tolerance) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        if (stableCount >= 3) return clamp(value, 0, 1);
      }
      previousValue = value;
    }

    return clamp(1 + 2 * sum, 0, 1);
  }

  function renderEmpty(dom, message) {
    setStatus(dom, message, "");
    renderEmptyTable(dom);
    setIssues(dom, []);
    renderPlotEmpty(dom);
  }

  function renderEmptyTable(dom) {
    dom.previewBody.innerHTML = `<tr><td colspan="4" class="mda-empty">No valid rows parsed yet.</td></tr>`;
  }

  function parseRangeSpec(raw) {
    const text = String(raw || "").trim();
    if (!text) return null;
    const match = text.match(
      /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?)\s*(?:-|\.\.|to|,)\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?)\s*$/i,
    );
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return start <= end ? { start, end } : { start: end, end: start };
  }

  function parseNumberInput(raw) {
    const text = String(raw || "").trim();
    if (!text) return null;
    const normalized = text.replace(/,/g, ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  function normalizeThicknessUnit(unit) {
    switch (unit) {
      case "m":
        return { label: "m", factor: 1 };
      case "um":
        return { label: "\u00b5m", factor: 1e-6 };
      case "mm":
      default:
        return { label: "mm", factor: 1e-3 };
    }
  }

  function resolveReferenceRows(rows, valueRaw, kind, inputUnit, displayUnit) {
    const parsed = parseNumberInput(valueRaw);
    if (parsed != null) {
      return {
        value: convertCurrentValue(parsed, displayUnit, inputUnit),
      };
    }

    const count = Math.max(1, Math.min(rows.length, Math.max(3, Math.ceil(rows.length * 0.1))));
    const half = Math.max(1, Math.floor(rows.length / 2));
    const segment = Math.min(count, half);
    const subset = kind === "baseline" ? rows.slice(0, segment) : rows.slice(rows.length - segment);
    return {
      value: average(subset.map((row) => row.current)),
    };
  }

  function average(values) {
    const filtered = values.filter((value) => Number.isFinite(value));
    if (!filtered.length) return null;
    return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  }

  function formatUnitLabel(value) {
    switch (value) {
      case "uA":
        return "\u00b5A";
      case "um":
        return "\u00b5m";
      default:
        return value || "";
    }
  }

  function formatCurrentWithUnit(value, unit) {
    if (!Number.isFinite(value)) return "Auto";
    return `${formatNumber(value)} ${formatUnitLabel(unit)}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function handleDownload(dom, type) {
    const analysis = state.currentAnalysis;
    if (!analysis || !analysis.rows || !analysis.rows.length) {
      alert("Load data first.");
      return;
    }

    if (type === "csv") {
      const csv = buildExportCsv(dom, analysis);
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "mda-data.csv");
      return;
    }

    if (type === "svg") {
      const svg = buildExportSvg(dom, analysis);
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "mda-plot.svg");
      return;
    }

    if (type === "png") {
      const svg = buildExportSvg(dom, analysis);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = PLOT_WIDTH;
        canvas.height = PLOT_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          alert("PNG export is not available in this browser.");
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((output) => {
          URL.revokeObjectURL(url);
          if (output) downloadBlob(output, "mda-plot.png");
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        alert("Could not export the plot as PNG.");
      };
      image.src = url;
      return;
    }
  }

  function buildExportCsv(dom, analysis) {
    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);
    const rows = [
      ["Time [s]", `Current [${formatUnitLabel(displayUnit)}]`, "D_app [m^2/s]"],
      ...analysis.rows.map((row) => {
        const current = convertCurrentValue(row.current, inputUnit, displayUnit);
        const diffusivity = Number.isFinite(row.diffusivity) ? row.diffusivity : null;
        return [row.time, current, diffusivity];
      }),
    ];
    return rows
      .map((row) => row.map((value) => csvCell(value)).join(","))
      .join("\n");
  }

  function buildExportSvg(dom, analysis) {
    const svg = dom.plot ? dom.plot.querySelector("svg") : null;
    if (!svg) {
      return "";
    }
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.setAttribute("version", "1.1");

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    const rootStyle = getComputedStyle(document.documentElement);
    const accent = rootStyle.getPropertyValue("--accent").trim() || "#31c1b5";
    const currentColor = "#2563eb";
    const diffusionColor = "#111111";
    const bg = "#ffffff";
    const ink = "#111827";
    const muted = "#4b5563";
    const grid = "#e2e8f0";
    const border = "#cfd8e3";
    style.textContent = `
      .mda-plot-grid{stroke:${grid};stroke-width:0.75}
      .mda-plot-line{fill:none;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:butt}
      .mda-plot-line-current{stroke:${currentColor}}
      .mda-plot-line-diffusion{stroke:${diffusionColor}}
      .mda-plot-point{stroke:${bg};stroke-width:2}
      .mda-plot-point-current{fill:${currentColor}}
      .mda-plot-point-diffusion{fill:${diffusionColor}}
      .mda-plot-axis-label,.mda-plot-value,.mda-plot-note,.mda-plot-ref-label,.mda-plot-legend-group{font-family:Arial,"Segoe UI",sans-serif}
      .mda-plot-axis-label,.mda-plot-value,.mda-plot-note{font-size:11px;font-weight:400}
      .mda-plot-axis-label tspan{font-family:inherit}
      .mda-plot-legend-group{font-size:10.5px;font-weight:400}
      .mda-plot-legend-group text{font-weight:400}
      .mda-plot-axis-left,.mda-plot-value-diffusion{fill:${diffusionColor}}
      .mda-plot-axis-right,.mda-plot-value-current{fill:${currentColor}}
      .mda-plot-note{fill:${muted}}
      .mda-plot-ref-line,.mda-plot-ref-handle,.mda-plot-ref-label{stroke:${ink};fill:${ink}}
      .mda-plot-ref-line{stroke-width:2;stroke-linecap:butt}
      .mda-plot-ref-handle{stroke:${bg};stroke-width:2}
      .mda-plot-ref-label{font-size:10px;font-weight:400;paint-order:normal;stroke:none}
    `;
    clone.insertBefore(style, clone.firstChild);
    return new XMLSerializer().serializeToString(clone);
  }

  function csvCell(value) {
    if (value == null || value === "") return "";
    const text = String(Number.isFinite(value) ? Number(value) : value);
    if (/[,"\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function dedupe(values) {
    const seen = new Set();
    const output = [];
    values.forEach((value) => {
      const text = String(value);
      if (seen.has(text)) return;
      seen.add(text);
      output.push(value);
    });
    return output;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function capitalize(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
})();

