(function () {
  const DELIMITER_CANDIDATES = [
    { id: "tab", label: "tab", split: (line) => line.split("\t") },
    { id: "semicolon", label: "semicolon", split: (line) => line.split(";") },
    { id: "whitespace", label: "whitespace", split: (line) => line.split(/\s+/) },
    { id: "comma", label: "comma", split: (line) => line.split(",") },
  ];

  const DECIMAL_OPTIONS = [".", ","];
  const PLOT_WIDTH = 920;
  const PLOT_HEIGHT = 340;
  const PLOT_MARGINS = { top: 42, right: 88, bottom: 48, left: 72 };
  const SOLVER_POLICY = {
    minTerms: 3,
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
    plotDiffusionScale: "linear",
    dragReference: null,
    dragReferenceFrame: null,
    dragReferencePending: null,
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
      baselineReset: document.getElementById("mda-baseline-reset"),
      baselineToggle: document.getElementById("mda-baseline-toggle"),
      steadyReset: document.getElementById("mda-steady-reset"),
      steadyToggle: document.getElementById("mda-steady-toggle"),
      thickness: document.getElementById("mda-thickness"),
      t0Offset: document.getElementById("mda-t0-offset"),
      t0OffsetValue: document.getElementById("mda-t0-offset-value"),
      minorGridToggle: document.getElementById("mda-minor-grid-toggle"),
      cropRange: document.getElementById("mda-crop-range"),
      decimal: document.getElementById("mda-decimal"),
      plotUnit: document.getElementById("mda-plot-unit"),
      diffusionScale: document.getElementById("mda-diffusion-scale"),
      gridToggle: document.getElementById("mda-grid-toggle"),
      resetPlot: document.getElementById("mda-reset-plot"),
      status: document.getElementById("mda-status"),
      statusDetail: document.getElementById("mda-status-detail"),
        issues: document.getElementById("mda-issues"),
        previewBody: document.getElementById("mda-preview-body"),
        plot: document.getElementById("mda-plot"),
        breakthroughValue: document.getElementById("mda-breakthrough-value"),
        breakthroughTime: document.getElementById("mda-breakthrough-time"),
        breakthroughNote: document.getElementById("mda-breakthrough-note"),
        lagValue: document.getElementById("mda-lag-value"),
        lagTime: document.getElementById("mda-lag-time"),
        lagNote: document.getElementById("mda-lag-note"),
        inflectionValue: document.getElementById("mda-inflection-value"),
        inflectionTime: document.getElementById("mda-inflection-time"),
        inflectionNote: document.getElementById("mda-inflection-note"),
        plateauValue: document.getElementById("mda-plateau-value"),
        plateauTime: document.getElementById("mda-plateau-time"),
        plateauNote: document.getElementById("mda-plateau-note"),
        helpDrawer: document.getElementById("mda-help-drawer"),
        helpOpenButtons: root.querySelectorAll("[data-action='open-help']"),
        helpCloseButtons: document.querySelectorAll("[data-action='close-help']"),
        downloadButtons: root.querySelectorAll("[data-download]"),
        clearButton: document.getElementById("mda-clear"),
    };

    if (!dom.input || !dom.file || !dom.decimal || !dom.status || !dom.issues || !dom.previewBody || !dom.plot) {
      return;
    }

    state.plotDiffusionScale = dom.diffusionScale && dom.diffusionScale.checked ? "log" : "linear";

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

    [dom.baselineValue, dom.steadyValue].forEach((element) => {
      if (!element) return;
      element.addEventListener("input", () => {
        markReferenceManual(element);
        scheduleParse(dom, "selection");
      });
      element.addEventListener("change", () => {
        markReferenceManual(element);
        scheduleParse(dom, "selection");
      });
    });

    [dom.thickness, dom.cropRange].forEach((element) => {
      if (!element) return;
      element.addEventListener("change", () => scheduleParse(dom, "selection"));
      element.addEventListener("input", () => scheduleParse(dom, "selection"));
    });
    if (dom.t0Offset) {
      dom.t0Offset.addEventListener("input", () => {
        syncT0OffsetDisplay(dom);
        scheduleParse(dom, "selection");
      });
      dom.t0Offset.addEventListener("change", () => {
        syncT0OffsetDisplay(dom);
        scheduleParse(dom, "selection");
      });
      syncT0OffsetDisplay(dom);
    }
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
    if (dom.minorGridToggle) {
      dom.minorGridToggle.addEventListener("change", () => renderDerivedViews(dom));
    }
    if (dom.diffusionScale) {
      dom.diffusionScale.addEventListener("change", () => {
        state.plotDiffusionScale = dom.diffusionScale.checked ? "log" : "linear";
        state.plotViewport = null;
        renderDerivedViews(dom);
      });
    }
    if (dom.resetPlot) {
      dom.resetPlot.addEventListener("click", () => {
        state.plotViewport = null;
        renderDerivedViews(dom);
      });
    }
      const stagePanels = root.querySelectorAll(".mda-stage-controls .mda-tool-panel");
      stagePanels.forEach((panel) => {
        const summary = panel.querySelector("summary");
        if (summary) {
          const setHover = (value) => panel.classList.toggle("is-hovered", value);
          summary.addEventListener("pointerenter", () => setHover(true));
          summary.addEventListener("pointerleave", () => setHover(false));
          summary.addEventListener("focus", () => setHover(true));
          summary.addEventListener("blur", () => setHover(false));
        }
        panel.addEventListener("toggle", () => {
          if (!panel.open) return;
          stagePanels.forEach((other) => {
            if (other !== panel) other.open = false;
          });
        requestAnimationFrame(() => positionStagePanels(dom));
      });
    });
    window.addEventListener("resize", () => positionStagePanels(dom));
    if (dom.downloadButtons) {
      dom.downloadButtons.forEach((button) => {
        button.addEventListener("click", () => handleDownload(dom, button.getAttribute("data-download")));
      });
    }

    if (dom.baselineToggle) {
      dom.baselineToggle.addEventListener("click", () => toggleReferenceVisibility(dom, "baseline"));
    }
    if (dom.baselineReset) {
      dom.baselineReset.addEventListener("click", () => resetReferenceField(dom, dom.baselineValue));
    }
    if (dom.steadyToggle) {
      dom.steadyToggle.addEventListener("click", () => toggleReferenceVisibility(dom, "steady"));
    }
    if (dom.steadyReset) {
      dom.steadyReset.addEventListener("click", () => resetReferenceField(dom, dom.steadyValue));
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
        state.dragReferenceFrame = null;
        state.dragReferencePending = null;
        state.dragPlot = null;
        state.plotViewport = null;
        dom.decimal.value = ".";
        if (dom.currentUnit) dom.currentUnit.value = "A";
        if (dom.plotUnit) dom.plotUnit.value = "uA";
        if (dom.gridToggle) dom.gridToggle.checked = true;
        if (dom.minorGridToggle) dom.minorGridToggle.checked = true;
        state.plotDiffusionScale = "linear";
        if (dom.diffusionScale) dom.diffusionScale.checked = false;
        clearReferenceAuto(dom.baselineValue);
        clearReferenceAuto(dom.steadyValue);
        if (dom.baselineValue) dom.baselineValue.value = "";
        if (dom.steadyValue) dom.steadyValue.value = "";
        if (dom.thickness) dom.thickness.value = "0.50";
        if (dom.t0Offset) dom.t0Offset.value = "0";
        syncT0OffsetDisplay(dom);
        if (dom.cropRange) dom.cropRange.value = "";
        renderEmpty(dom, "Paste data to begin.");
      });
    }

    if (dom.plotUnit) {
      dom.plotUnit.value = "uA";
    }
    syncT0OffsetDisplay(dom);
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

  function isReferenceAuto(element) {
    return element && element.dataset && element.dataset.mdaReferenceMode === "auto";
  }

  function isReferenceManual(element) {
    return element && element.dataset && element.dataset.mdaReferenceMode === "manual";
  }

  function clearReferenceAuto(element) {
    if (!element || !element.dataset) return;
    delete element.dataset.mdaReferenceMode;
    delete element.dataset.mdaReferenceSourceUnit;
    delete element.dataset.mdaReferenceRawValue;
  }

  function markReferenceManual(element) {
    if (!element || !element.dataset) return;
    element.dataset.mdaReferenceMode = "manual";
    delete element.dataset.mdaReferenceSourceUnit;
    delete element.dataset.mdaReferenceRawValue;
  }

  function setReferenceAutoValue(element, rawValue, sourceUnit, displayUnit) {
    if (!element || !Number.isFinite(rawValue)) return;
    const nextValue = convertCurrentValue(rawValue, sourceUnit, displayUnit);
    if (!Number.isFinite(nextValue)) return;
    element.value = formatNumber(nextValue);
    element.dataset.mdaReferenceMode = "auto";
    element.dataset.mdaReferenceSourceUnit = sourceUnit;
    element.dataset.mdaReferenceRawValue = String(rawValue);
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
      queueReferenceDragUpdate(dom, state.dragReference.kind, event, svg);
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
      if (state.dragReferenceFrame != null) {
        window.cancelAnimationFrame(state.dragReferenceFrame);
        state.dragReferenceFrame = null;
      }
      state.dragReferencePending = null;
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
    queueReferenceDragUpdate(dom, kind, event, svg);
  }

  function queueReferenceDragUpdate(dom, kind, event, svg) {
    state.dragReferencePending = {
      kind,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      svg,
    };
    if (state.dragReferenceFrame != null) return;
    state.dragReferenceFrame = window.requestAnimationFrame(() => {
      state.dragReferenceFrame = null;
      const pending = state.dragReferencePending;
      if (!pending || !state.dragReference) return;
      if (Number.isFinite(state.dragReference.pointerId) && pending.pointerId !== state.dragReference.pointerId) return;
      updateReferenceFromPointer(dom, pending.kind, pending.clientX, pending.clientY, pending.svg);
    });
  }

  function startPlotPan(dom, event, svg) {
    if (!state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) return;
    const ranges = getPlotRanges(state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom), state.plotDiffusionScale);
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
    const ranges = getPlotRanges(state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom), state.plotDiffusionScale);
    const point = pointerToPlotFractions(event, svg);
    if (!point) return;

    const factor = event.deltaY > 0 ? 1.12 : 0.89;
    const next = scaleViewport(ranges, point, factor);
    state.plotViewport = next;
    renderPlot(dom, state.currentAnalysis);
    event.preventDefault();
  }

  function pointerToPlotFractions(event, svg) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const innerWidth = PLOT_WIDTH - PLOT_MARGINS.left - PLOT_MARGINS.right;
    const innerHeight = PLOT_HEIGHT - PLOT_MARGINS.top - PLOT_MARGINS.bottom;
    const plotX = (x * PLOT_WIDTH - PLOT_MARGINS.left) / innerWidth;
    const plotY = (y * PLOT_HEIGHT - PLOT_MARGINS.top) / innerHeight;
    return {
      xRatio: Math.max(0, Math.min(1, plotX)),
      yRatio: Math.max(0, Math.min(1, plotY)),
    };
  }

  function scaleViewport(ranges, fractions, scaleX) {
    const xSpan = Math.max(ranges.xMax - ranges.xMin, Number.EPSILON);
    const ySpan = Math.max(ranges.yMax - ranges.yMin, Number.EPSILON);
    const diffusionYSpan = Math.max(ranges.diffusionYMax - ranges.diffusionYMin, Number.EPSILON);
    const nextXSpan = Math.max(xSpan * scaleX, Number.EPSILON);
    const nextYSpan = Math.max(ySpan * scaleX, Number.EPSILON);
    const nextDiffusionYSpan = Math.max(diffusionYSpan * scaleX, Number.EPSILON);
    const xRatio = fractions && Number.isFinite(fractions.xRatio) ? fractions.xRatio : 0.5;
    const yRatio = fractions && Number.isFinite(fractions.yRatio) ? fractions.yRatio : 0.5;
    const xCenter = ranges.xMin + xRatio * xSpan;
    const yCenter = ranges.yMax - yRatio * ySpan;
    const diffusionYCenter = ranges.diffusionYMax - yRatio * diffusionYSpan;
    const xMin = xCenter - xRatio * nextXSpan;
    const xMax = xMin + nextXSpan;
    const yMin = yCenter - (1 - yRatio) * nextYSpan;
    const yMax = yMin + nextYSpan;
    const diffusionYRatio = yRatio;
    const diffusionYMin = diffusionYCenter - (1 - diffusionYRatio) * nextDiffusionYSpan;
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

  function getPlotRanges(analysis, inputUnit, displayUnit, diffusionScaleMode) {
    const currentRanges = getCurrentPlotRanges(analysis, inputUnit, displayUnit);
    const diffusionBaseRanges = getDiffusionBaseRanges(analysis);
    const diffusionAxis = getDiffusionAxisScale(diffusionBaseRanges);
    const diffusionRanges = getDiffusionPlotRanges(analysis, diffusionScaleMode, diffusionAxis.factor);
    return {
      xMin: currentRanges.xMin,
      xMax: currentRanges.xMax,
      yMin: currentRanges.yMin,
      yMax: currentRanges.yMax,
      diffusionYMin: diffusionRanges.yMin,
      diffusionYMax: diffusionRanges.yMax,
    };
  }

  function getDiffusionBaseRanges(analysis, factor) {
    const rows = analysis && analysis.previewRows ? analysis.previewRows : [];
    const points = rows
      .map((row) => ({ x: row.time, y: convertDiffusivityToDisplay(row.diffusivity) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const safeFactor = Number.isFinite(factor) && factor !== 0 ? factor : 1;
    const scaledPoints = points.map((point) => ({ x: point.x, y: point.y / safeFactor }));
    return getBasePlotRanges(scaledPoints);
  }

  function getDiffusionPlotRanges(analysis, scaleMode, factor) {
    const rows = analysis && analysis.previewRows ? analysis.previewRows : [];
    const points = rows
      .map((row) => ({ x: row.time, y: convertDiffusivityToDisplay(row.diffusivity) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const safeFactor = Number.isFinite(factor) && factor !== 0 ? factor : 1;
    const scaledPoints = points.map((point) => ({ x: point.x, y: point.y / safeFactor }));
    const preparedPoints =
      scaleMode === "log"
        ? scaledPoints.filter((point) => point.y > 0).map((point) => ({ x: point.x, y: Math.log10(point.y) }))
        : scaledPoints;
    if (!preparedPoints.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const base = getBasePlotRanges(preparedPoints);
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

  function getDiffusionAxisScale(ranges) {
    const maxAbs = Math.max(Math.abs(ranges.yMin || 0), Math.abs(ranges.yMax || 0));
    if (!Number.isFinite(maxAbs) || maxAbs === 0) {
      return { exponent: 0, factor: 1 };
    }
    const exponent = Math.floor(Math.log10(maxAbs));
    return {
      exponent,
      factor: Math.pow(10, exponent),
    };
  }

  function scaleDiffusionRanges(ranges, factor) {
    const safeFactor = Number.isFinite(factor) && factor !== 0 ? factor : 1;
    return {
      xMin: ranges.xMin,
      xMax: ranges.xMax,
      yMin: ranges.yMin / safeFactor,
      yMax: ranges.yMax / safeFactor,
    };
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
    const xPad = xSpan * 0.01;
    const yPad = ySpan * 0.01;
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

  function buildLinearMinorTicks(min, max, majorTicks, subdivisions) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    const parts = [];
    const segments = Math.max(1, Math.floor(subdivisions || 4));
    const ticks = Array.isArray(majorTicks) && majorTicks.length >= 2 ? majorTicks : [min, max];
    for (let i = 0; i < ticks.length - 1; i += 1) {
      const start = ticks[i];
      const end = ticks[i + 1];
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const step = (end - start) / (segments + 1);
      for (let j = 1; j <= segments; j += 1) {
        const value = start + step * j;
        if (value > min && value < max) parts.push(value);
      }
    }
    if (!parts.length && max > min) {
      const step = (max - min) / (segments + 1);
      for (let j = 1; j <= segments; j += 1) {
        parts.push(min + step * j);
      }
    }
    return parts;
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

  function updateReferenceFromPointer(dom, kind, clientX, clientY, svg) {
    if (!state.currentAnalysis) return;
    const y = pointerToPlotY(clientY, svg);
    if (y == null) return;
    const value = plotYToValue(y, svg, state.currentAnalysis, dom.currentUnit ? dom.currentUnit.value : "A", getDisplayUnit(dom));
    if (!Number.isFinite(value)) return;

    if (kind === "baseline" && dom.baselineValue) {
      dom.baselineValue.value = formatNumber(value);
      markReferenceManual(dom.baselineValue);
      parseAndRender(dom, "selection");
    } else if (kind === "steady" && dom.steadyValue) {
      dom.steadyValue.value = formatNumber(value);
      markReferenceManual(dom.steadyValue);
      parseAndRender(dom, "selection");
    }
  }

  function pointerToPlotY(event, svg) {
    if (event == null) return null;
    if (typeof event === "number") {
      return pointerToPlotYFromClientY(event, svg);
    }
    return pointerToPlotYFromClientY(event.clientY, svg);
  }

  function pointerToPlotYFromClientY(clientY, svg) {
    const rect = svg.getBoundingClientRect();
    if (!rect.height) return null;
    const y = ((clientY - rect.top) / rect.height) * PLOT_HEIGHT;
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
      dom.decimal.value = ".";
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
    const forcedDecimal = source === "selection" && DECIMAL_OPTIONS.includes(manualDecimal) ? manualDecimal : null;

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

    if (source === "paste" || source === "file") {
      clearReferenceAuto(dom.baselineValue);
      clearReferenceAuto(dom.steadyValue);
      if (dom.baselineValue) dom.baselineValue.value = "";
      if (dom.steadyValue) dom.steadyValue.value = "";
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
    const diagnostics = {
      rowsSolved: 0,
      totalTermsUsed: 0,
      maxTermsUsed: 0,
      lastTermsUsed: null,
      lastTermContribution: null,
      lastSolveMethod: null,
      lastDelta: null,
      lastTolerance: null,
    };
    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);
    const t0Offset = parseNumberInput(dom.t0Offset ? dom.t0Offset.value : null) || 0;
    const cropRange = parseRangeSpec(dom.cropRange ? dom.cropRange.value : "");
    const sourceRows = config.rows.slice();
    const baseline = resolveReferenceRows(sourceRows, dom.baselineValue ? dom.baselineValue.value : null, "baseline", inputUnit, displayUnit);
    const steady = resolveReferenceRows(sourceRows, dom.steadyValue ? dom.steadyValue.value : null, "steady", inputUnit, displayUnit);
    let rows = applyTimeOffsetRows(sourceRows, t0Offset, baseline);

    if (t0Offset !== 0) {
      notes.push(
        t0Offset > 0
          ? `t0 offset applied: removed the first ${formatNumber(t0Offset)} s of data and shifted the remaining times back to zero.`
          : `t0 offset applied: prepended ${formatNumber(Math.abs(t0Offset))} s of baseline time and shifted the data forward.`,
      );
    }

    if (cropRange) {
      rows = rows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end);
      notes.push(`Crop range applied: ${formatNumber(cropRange.start)} to ${formatNumber(cropRange.end)} s.`);
    }

    if (!rows.length) {
      issues.push("No rows remain after cropping.");
      return {
        rows: [],
        previewRows: [],
        baseline,
        steady,
        thicknessMm: null,
        normalizedAvailable: false,
        diagnostics,
        issues,
        notes,
      };
    }
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
    let outOfRangeCount = 0;
    const normalizedEpsilon = 1e-9;
    const previewRows = rows.map((row) => {
      const normalized = normalizedAvailable ? (row.current - baseline.value) / denom : null;
      const normalizedInRange =
        Number.isFinite(normalized) && normalized > normalizedEpsilon && normalized < 1 - normalizedEpsilon;
      const diffusivity =
        !row.synthetic && normalizedAvailable && thicknessMm != null && normalizedInRange
          ? solveApparentDiffusivity(normalized, row.time, thicknessMm / 1000, solveDeadline, diagnostics)
          : null;
      if (normalizedAvailable && Number.isFinite(normalized) && !normalizedInRange) {
        outOfRangeCount += 1;
      }
      return {
        ...row,
        currentDisplay: convertCurrentValue(row.current, inputUnit, displayUnit),
        normalized,
        diffusivity,
      };
    });

    const classical = normalizedAvailable && thicknessMm != null ? buildClassicalResults(previewRows, thicknessMm) : buildEmptyClassicalResults();

    for (let i = 1; i < rows.length; i += 1) {
      if (rows[i].time <= rows[i - 1].time) {
        notes.push("Time is not strictly increasing. The first analysis pass expects a monotonic time axis.");
        break;
      }
    }

    if (normalizedAvailable) {
      if (outOfRangeCount) {
        notes.push("Some normalized values fall outside the physical 0 to 1 range. D_app is omitted for those rows.");
      } else {
        const outsideRange = previewRows.filter(
          (row) => Number.isFinite(row.normalized) && (row.normalized < -0.25 || row.normalized > 1.25),
        );
        if (outsideRange.length) {
          notes.push("Normalized values extend outside the expected 0 to 1 range.");
        }
      }
    }

    return {
      rows,
      previewRows,
        baseline,
        steady,
        thicknessMm,
        normalizedAvailable,
        diagnostics,
        classical,
        issues,
        notes,
      };
    }

  function recordSolverDiagnostics(diagnostics, evalResult) {
    if (!diagnostics || !evalResult) return;
    const termsUsed = Number.isFinite(evalResult.termsUsed) ? evalResult.termsUsed : null;
    if (termsUsed != null) {
      diagnostics.rowsSolved += 1;
      diagnostics.totalTermsUsed += termsUsed;
      diagnostics.maxTermsUsed = Math.max(diagnostics.maxTermsUsed || 0, termsUsed);
      diagnostics.lastTermsUsed = termsUsed;
    }
    if (Number.isFinite(evalResult.lastTermContribution)) {
      diagnostics.lastTermContribution = evalResult.lastTermContribution;
    }
    if (Number.isFinite(evalResult.lastDelta)) {
      diagnostics.lastDelta = evalResult.lastDelta;
    }
    if (Number.isFinite(evalResult.tolerance)) {
      diagnostics.lastTolerance = evalResult.tolerance;
    }
    if (evalResult.method) {
      diagnostics.lastSolveMethod = evalResult.method;
    }
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
      renderDiagnostics(dom, analysis);
      renderResults(dom, analysis);
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
      renderDiagnostics(dom, state.currentAnalysis);
      renderResults(dom, state.currentAnalysis);
      renderPreview(dom, state.currentAnalysis);
      renderPlot(dom, state.currentAnalysis);
    }

  function syncReferenceControls(dom, analysis) {
    const baselineValue = analysis && analysis.baseline && Number.isFinite(analysis.baseline.value) ? analysis.baseline.value : null;
    const steadyValue = analysis && analysis.steady && Number.isFinite(analysis.steady.value) ? analysis.steady.value : null;
    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);

    if (dom.baselineValue) {
      if (isReferenceAuto(dom.baselineValue)) {
        if (baselineValue != null && document.activeElement !== dom.baselineValue) {
          setReferenceAutoValue(dom.baselineValue, baselineValue, inputUnit, displayUnit);
        }
      } else if (!isReferenceManual(dom.baselineValue) && !String(dom.baselineValue.value || "").trim() && baselineValue != null && document.activeElement !== dom.baselineValue) {
        setReferenceAutoValue(dom.baselineValue, baselineValue, inputUnit, displayUnit);
      }
    }
    if (dom.steadyValue) {
      if (isReferenceAuto(dom.steadyValue)) {
        if (steadyValue != null && document.activeElement !== dom.steadyValue) {
          setReferenceAutoValue(dom.steadyValue, steadyValue, inputUnit, displayUnit);
        }
      } else if (!isReferenceManual(dom.steadyValue) && !String(dom.steadyValue.value || "").trim() && steadyValue != null && document.activeElement !== dom.steadyValue) {
        setReferenceAutoValue(dom.steadyValue, steadyValue, inputUnit, displayUnit);
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

  function resetReferenceField(dom, element) {
    if (!element) return;
    clearReferenceAuto(element);
    element.value = "";
    scheduleParse(dom, "selection");
  }

  function buildLogTicks(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    if (min === max) return [min];
    const minExp = Math.floor(min);
    const maxExp = Math.ceil(max);
    const ticks = [];
    for (let exponent = minExp; exponent <= maxExp; exponent += 1) {
      ticks.push(exponent);
    }
    return ticks;
  }

  function buildLogMinorTicks(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    if (min === max) return [];
    const ticks = [];
    const startExp = Math.floor(min);
    const endExp = Math.ceil(max);
    for (let exponent = startExp; exponent <= endExp; exponent += 1) {
      for (let mantissa = 2; mantissa < 10; mantissa += 1) {
        const value = Math.log10(mantissa) + exponent;
        if (value > min && value < max) ticks.push(value);
      }
    }
    return ticks;
  }

  function renderResults(dom, analysis) {
    const empty = buildEmptyClassicalResults();
    const classical = analysis && analysis.classical ? analysis.classical : empty;

    setResultCard(dom.breakthroughValue, dom.breakthroughTime, dom.breakthroughNote, classical.breakthrough, "Breakthrough");
    setResultCard(dom.lagValue, dom.lagTime, dom.lagNote, classical.timeLag, "Time lag");
    setResultCard(dom.inflectionValue, dom.inflectionTime, dom.inflectionNote, classical.inflection, "Inflection");
    setResultCard(dom.plateauValue, dom.plateauTime, dom.plateauNote, classical.plateau, "Plateau");
  }

  function setResultCard(valueNode, timeNode, noteNode, result, label) {
    if (!valueNode || !timeNode || !noteNode) return;
    if (!result || !result.available) {
      valueNode.textContent = "—";
      timeNode.textContent = "No stable value";
      noteNode.textContent = result && result.note ? result.note : `Unable to compute ${label.toLowerCase()}.`;
      return;
    }

    valueNode.innerHTML = `${escapeHtml(formatDiffusivity(result.diffusivity))} <span class="mda-result-unit">mm&sup2;/s</span>`;
    timeNode.textContent = result.timeText || "—";
    noteNode.textContent = result.note || "";
  }

  function renderPreview(dom, analysis) {
    const previewRows = analysis && analysis.previewRows ? analysis.previewRows : [];
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
        const diffusivityCell = Number.isFinite(row.diffusivity) ? formatDiffusivity(row.diffusivity) : "&mdash;";
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

    function buildClassicalResults(previewRows, thicknessMm) {
      const thicknessMeters = thicknessMm / 1000;
      const rows = (previewRows || [])
        .map((row) => ({
          time: row.time,
          normalized: row.normalized,
          diffusivity: row.diffusivity,
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized))
        .sort((a, b) => a.time - b.time);

      const breakthrough = solveThresholdMethod(rows, thicknessMeters, 0.1, 15.3, "Breakthrough (10%)");
      const timeLag = solveThresholdMethod(rows, thicknessMeters, 0.63, 6, "Time lag (63%)");
      const inflection = solveInflectionMethod(rows, thicknessMeters);
      const plateau = solveDiffusionPlateau(previewRows, thicknessMeters);

      return { breakthrough, timeLag, inflection, plateau };
    }

    function buildEmptyClassicalResults() {
      return {
        breakthrough: { available: false, note: "Load data to calculate breakthrough time." },
        timeLag: { available: false, note: "Load data to calculate time lag." },
        inflection: { available: false, note: "Load data to calculate the inflection point." },
        plateau: { available: false, note: "Load data to estimate the stabilized inverse plateau." },
      };
    }

    function solveThresholdMethod(rows, thicknessMeters, threshold, coefficient, label) {
      const crossing = findCrossingTime(rows, threshold);
      if (!crossing) {
        return {
          available: false,
          note: `${label} not found in the normalized curve.`,
        };
      }
      const diffusivity = (thicknessMeters * thicknessMeters) / (coefficient * crossing.time);
      return {
        available: Number.isFinite(diffusivity) && diffusivity > 0,
        diffusivity,
        timeText: `${label}: t = ${formatNumber(crossing.time)} s`,
        note: `${label} threshold ${Math.round(threshold * 100)}%.`,
      };
    }

    function solveInflectionMethod(rows, thicknessMeters) {
      const inflection = findInflectionTime(rows);
      if (!inflection) {
        return {
          available: false,
          note: "No clear inflection point could be detected.",
        };
      }
      const diffusivity = (0.924 * thicknessMeters * thicknessMeters) / (Math.PI * Math.PI * inflection.time);
      return {
        available: Number.isFinite(diffusivity) && diffusivity > 0,
        diffusivity,
        timeText: `t = ${formatNumber(inflection.time)} s`,
        note: "Inflection-point estimate from the maximum slope of the normalized curve.",
      };
    }

    function solveDiffusionPlateau(previewRows, thicknessMeters) {
      const points = (previewRows || [])
        .map((row) => ({ time: row.time, diffusivity: row.diffusivity, normalized: row.normalized }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.diffusivity) && Number.isFinite(row.normalized))
        .sort((a, b) => a.time - b.time);
      if (points.length < 5) {
        return { available: false, note: "Not enough inverse-solve points to judge a plateau." };
      }

      const window = chooseStableWindow(points);
      if (!window) {
        return { available: false, note: "No stable inverse-solve plateau found." };
      }

      const values = window.points.map((point) => point.diffusivity);
      const medianValue = median(values);
      if (!Number.isFinite(medianValue) || medianValue <= SOLVER_POLICY.dLower * 10 || medianValue >= SOLVER_POLICY.dUpper / 10) {
        return {
          available: false,
          note: "Inverse-solve values are pinned near the numerical bounds, so no stable plateau is reported.",
        };
      }
      const note = `Stable window from ${formatNumber(window.points[0].time)} to ${formatNumber(window.points[window.points.length - 1].time)} s.`;
      void thicknessMeters;
      return {
        available: true,
        diffusivity: medianValue,
        timeText: `${window.points.length} points`,
        note,
      };
    }

    function chooseStableWindow(points) {
      let best = null;
      for (let windowSize = Math.min(points.length, 12); windowSize >= 5; windowSize -= 1) {
        for (let start = 0; start <= points.length - windowSize; start += 1) {
          const candidate = points.slice(start, start + windowSize);
          const values = candidate.map((point) => point.diffusivity).filter((value) => Number.isFinite(value));
          if (values.length < windowSize) continue;
          const normalizedMedian = median(candidate.map((point) => point.normalized));
          if (!Number.isFinite(normalizedMedian) || normalizedMedian <= 0.02 || normalizedMedian >= 0.98) {
            continue;
          }
          const center = median(values);
          const spread = iqr(values) / Math.max(Math.abs(center), Number.EPSILON);
          const slope = Math.abs(linearSlope(candidate)) * Math.max(candidate[candidate.length - 1].time - candidate[0].time, 1) / Math.max(Math.abs(center), Number.EPSILON);
          if (spread > 0.12 || slope > 0.12) continue;
          const score = spread + slope + Math.abs(normalizedMedian - 0.5) * 0.15;
          if (!best || score < best.score) {
            best = { points: candidate, score };
          }
        }
      }
      return best;
    }

    function findCrossingTime(rows, threshold) {
      if (!rows.length) return null;
      const first = rows[0];
      if (Number.isFinite(first.normalized) && first.normalized >= threshold) {
        return { time: first.time, normalized: first.normalized };
      }
      for (let i = 1; i < rows.length; i += 1) {
        const prev = rows[i - 1];
        const curr = rows[i];
        if (!Number.isFinite(prev.normalized) || !Number.isFinite(curr.normalized)) continue;
        if (prev.normalized === threshold) return { time: prev.time, normalized: prev.normalized };
        if ((prev.normalized < threshold && curr.normalized >= threshold) || (prev.normalized > threshold && curr.normalized <= threshold)) {
          const span = curr.normalized - prev.normalized;
          if (span === 0) return { time: curr.time, normalized: curr.normalized };
          const ratio = (threshold - prev.normalized) / span;
          const time = prev.time + ratio * (curr.time - prev.time);
          return { time, normalized: threshold };
        }
      }
      return null;
    }

    function findInflectionTime(rows) {
      if (rows.length < 3) return null;
      let best = null;
      for (let i = 1; i < rows.length - 1; i += 1) {
        const prev = rows[i - 1];
        const curr = rows[i];
        const next = rows[i + 1];
        const span = next.time - prev.time;
        if (!Number.isFinite(prev.normalized) || !Number.isFinite(curr.normalized) || !Number.isFinite(next.normalized) || span <= 0) {
          continue;
        }
        const slope = (next.normalized - prev.normalized) / span;
        if (!best || slope > best.slope) {
          best = { index: i, slope, time: curr.time };
        }
      }
      if (!best) return null;
      return { time: best.time, slope: best.slope };
    }

    function median(values) {
      const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      if (!filtered.length) return null;
      const mid = Math.floor(filtered.length / 2);
      return filtered.length % 2 ? filtered[mid] : (filtered[mid - 1] + filtered[mid]) / 2;
    }

    function iqr(values) {
      const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      if (filtered.length < 4) return 0;
      const q1 = filtered[Math.floor((filtered.length - 1) * 0.25)];
      const q3 = filtered[Math.floor((filtered.length - 1) * 0.75)];
      return q3 - q1;
    }

    function linearSlope(points) {
      const filtered = points.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.diffusivity));
      if (filtered.length < 2) return 0;
      const n = filtered.length;
      const meanX = filtered.reduce((sum, point) => sum + point.time, 0) / n;
      const meanY = filtered.reduce((sum, point) => sum + point.diffusivity, 0) / n;
      let numerator = 0;
      let denominator = 0;
      filtered.forEach((point) => {
        const dx = point.time - meanX;
        numerator += dx * (point.diffusivity - meanY);
        denominator += dx * dx;
      });
      return denominator === 0 ? 0 : numerator / denominator;
    }

  function formatDiffusivity(value) {
    if (!Number.isFinite(value)) return "—";
    const mm2PerS = convertDiffusivityToDisplay(value);
    const abs = Math.abs(mm2PerS);
    if (abs >= 1000 || (abs > 0 && abs < 0.001)) {
      return formatScientificTick(mm2PerS);
    }
    return formatNumber(mm2PerS);
  }

  function convertDiffusivityToDisplay(value) {
    if (!Number.isFinite(value)) return null;
    return value * 1e6;
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
    const showMinorGrid = !dom.minorGridToggle || dom.minorGridToggle.checked;
    const diffusionScaleMode = dom.diffusionScale && dom.diffusionScale.checked ? "log" : "linear";

    const currentPoints = rows
      .map((row) => ({ x: row.time, y: convertCurrentValue(row.current, inputUnit, displayUnit) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const diffusionPoints = (analysis.previewRows || [])
      .map((row) => ({ x: row.time, y: convertDiffusivityToDisplay(row.diffusivity) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    if (!currentPoints.length) {
      renderPlotEmpty(dom);
      return;
    }

    const orderedCurrent = currentPoints.slice().sort((a, b) => a.x - b.x);
    const orderedDiffusion = diffusionPoints.slice().sort((a, b) => a.x - b.x);
    const currentRanges = getCurrentPlotRanges(analysis, inputUnit, displayUnit);
    const diffusionBaseRanges = getDiffusionBaseRanges(analysis);
    const diffusionAxis = getDiffusionAxisScale(diffusionBaseRanges);
    const diffusionRanges = getDiffusionPlotRanges(analysis, diffusionScaleMode, diffusionAxis.factor);
    const orderedScaledDiffusion = orderedDiffusion
      .map((point) => ({ x: point.x, y: point.y / diffusionAxis.factor }))
      .filter((point) => diffusionScaleMode !== "log" || point.y > 0);
    const diffusionPlotPoints =
      diffusionScaleMode === "log"
        ? orderedScaledDiffusion.map((point) => ({ x: point.x, y: Math.log10(point.y) }))
        : orderedScaledDiffusion;
    const xTicks = buildNiceTicks(currentRanges.xMin, currentRanges.xMax, 5);
    const xMinorTicks = buildLinearMinorTicks(currentRanges.xMin, currentRanges.xMax, xTicks, 4);
    const currentTicks = buildNiceTicks(currentRanges.yMin, currentRanges.yMax, 5);
    const diffusionMajorTicks =
      diffusionScaleMode === "log"
        ? buildLogTicks(diffusionRanges.yMin, diffusionRanges.yMax)
        : buildNiceTicks(diffusionRanges.yMin, diffusionRanges.yMax, 5);
    const diffusionMinorTicks =
      diffusionScaleMode === "log"
        ? buildLogMinorTicks(diffusionRanges.yMin, diffusionRanges.yMax)
        : buildLinearMinorTicks(diffusionRanges.yMin, diffusionRanges.yMax, diffusionMajorTicks, 4);

    const innerWidth = PLOT_WIDTH - PLOT_MARGINS.left - PLOT_MARGINS.right;
    const innerHeight = PLOT_HEIGHT - PLOT_MARGINS.top - PLOT_MARGINS.bottom;
    const scaleX = (value) => PLOT_MARGINS.left + ((value - currentRanges.xMin) / (currentRanges.xMax - currentRanges.xMin)) * innerWidth;
    const scaleCurrentY = (value) =>
      PLOT_MARGINS.top + (1 - (value - currentRanges.yMin) / (currentRanges.yMax - currentRanges.yMin)) * innerHeight;
    const scaleDiffusionY =
      diffusionScaleMode === "log"
        ? (value) =>
            PLOT_MARGINS.top +
            (1 - (value - diffusionRanges.yMin) / (diffusionRanges.yMax - diffusionRanges.yMin)) * innerHeight
        : (value) =>
            PLOT_MARGINS.top +
            (1 - (value - diffusionRanges.yMin) / (diffusionRanges.yMax - diffusionRanges.yMin)) * innerHeight;
    const yGridTicks = diffusionMajorTicks;
    const yGridScale = scaleDiffusionY;
    const currentPath = orderedCurrent
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleCurrentY(point.y).toFixed(2)}`)
      .join(" ");
    const diffusionPath = diffusionPlotPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleDiffusionY(point.y).toFixed(2)}`)
      .join(" ");

    const parts = [];
    const chartClipId = "mda-plot-clip";
    const chartX = PLOT_MARGINS.left;
    const chartY = PLOT_MARGINS.top;
    const chartWidth = innerWidth;
    const chartHeight = innerHeight;
    const yGridParts = [];
    parts.push(`<svg viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" role="img" aria-label="Preview of measured permeation current and diffusion coefficient">`);
    parts.push(`
      <defs>
        <clipPath id="${chartClipId}">
          <rect x="${chartX}" y="${chartY}" width="${chartWidth}" height="${chartHeight}"></rect>
        </clipPath>
      </defs>
    `);
    parts.push(`<rect class="mda-plot-frame" x="${chartX}" y="${chartY}" width="${chartWidth}" height="${chartHeight}"></rect>`);
    const legendGap = 60;
    const legendLineWidth = 18;
    const legendTextGap = 12;
    const legendFontSize = 10.5;
    const diffusionLegendText = "Apparent Diffusion Coefficient Dapp(t)";
    const currentLegendText = "Measured permeation current I(t)";
    const diffusionLegendWidth = legendLineWidth + legendTextGap + measureTextWidth(diffusionLegendText, legendFontSize);
    const currentLegendWidth = legendLineWidth + legendTextGap + measureTextWidth(currentLegendText, legendFontSize);
    const legendTotalWidth = diffusionLegendWidth + legendGap + currentLegendWidth;
    const legendX = Math.max(0, (PLOT_WIDTH - legendTotalWidth) / 2);
    const legendY = 8;
    parts.push(`
      <g class="mda-plot-legend-group" transform="translate(${legendX} ${legendY})">
        <g class="mda-plot-legend-item mda-plot-legend-diffusion">
          <line x1="0" y1="6" x2="18" y2="6" class="mda-plot-legend-line"></line>
          <text x="26" y="10">
            <tspan x="26" dy="0">Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan>(t)</tspan>
          </text>
        </g>
        <g class="mda-plot-legend-item mda-plot-legend-current" transform="translate(${diffusionLegendWidth + legendGap} 0)">
          <line x1="0" y1="6" x2="18" y2="6" class="mda-plot-legend-line"></line>
          <text x="26" y="10">Measured permeation current I(t)</text>
        </g>
      </g>
    `);

    const references = [
      { kind: "baseline", ref: analysis.baseline, label: "Baseline", className: "mda-plot-ref-baseline" },
      { kind: "steady", ref: analysis.steady, label: "Steady State", className: "mda-plot-ref-steady" },
    ];

    parts.push(`<g class="mda-plot-chart" clip-path="url(#${chartClipId})">`);
    if (showGrid) {
      yGridTicks.forEach((value) => {
        const y = yGridScale(value);
        yGridParts.push(
          `<line class="mda-plot-grid mda-plot-grid-major" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`,
        );
      });
      xTicks.forEach((value) => {
        const x = scaleX(value);
        yGridParts.push(
          `<line class="mda-plot-grid mda-plot-grid-major" x1="${x.toFixed(2)}" y1="${chartY}" x2="${x.toFixed(2)}" y2="${chartY + chartHeight}"></line>`,
        );
      });
    }
    if (showMinorGrid) {
      diffusionMinorTicks.forEach((value) => {
        const y = scaleDiffusionY(value);
        yGridParts.push(
          `<line class="mda-plot-grid mda-plot-grid-minor" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`,
        );
      });
      xMinorTicks.forEach((value) => {
        const x = scaleX(value);
        yGridParts.push(
          `<line class="mda-plot-grid mda-plot-grid-minor" x1="${x.toFixed(2)}" y1="${chartY}" x2="${x.toFixed(2)}" y2="${chartY + chartHeight}"></line>`,
        );
      });
    }
    if (diffusionPath) parts.push(`<path class="mda-plot-line mda-plot-line-diffusion" d="${diffusionPath}"></path>`);
    if (currentPath) parts.push(`<path class="mda-plot-line mda-plot-line-current" d="${currentPath}"></path>`);
    parts.push(...yGridParts);
    references.forEach((entry) => {
      if (!entry.ref || !Number.isFinite(entry.ref.value)) return;
      if (state.referenceVisibility[entry.kind] === false) return;
      const refValue = convertCurrentValue(entry.ref.value, inputUnit, displayUnit);
      const y = scaleCurrentY(refValue);
      const lineColorClass = entry.kind === "baseline" ? "mda-plot-ref-baseline" : "mda-plot-ref-steady";
      parts.push(`<line class="mda-plot-ref-hitline" data-ref-kind="${entry.kind}" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`);
      parts.push(`<line class="mda-plot-ref-line ${lineColorClass}" data-ref-kind="${entry.kind}" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`);
    });
    parts.push(`</g>`);

    currentTicks.forEach((value) => {
      const y = scaleCurrentY(value);
      parts.push(
        `<line class="mda-plot-axis-tick mda-plot-axis-tick-right" x1="${PLOT_WIDTH - PLOT_MARGINS.right}" y1="${y.toFixed(2)}" x2="${PLOT_WIDTH - PLOT_MARGINS.right + 7}" y2="${y.toFixed(2)}"></line>`,
        `<text class="mda-plot-value mda-plot-value-current" x="${PLOT_WIDTH - PLOT_MARGINS.right + 8}" y="${(y + 4).toFixed(2)}" text-anchor="start">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });

    diffusionMinorTicks.forEach((value) => {
      const y = scaleDiffusionY(value);
      parts.push(`<line class="mda-plot-axis-tick mda-plot-axis-tick-left mda-plot-axis-tick-minor" x1="${PLOT_MARGINS.left - 4}" y1="${y.toFixed(2)}" x2="${PLOT_MARGINS.left}" y2="${y.toFixed(2)}"></line>`);
    });

    diffusionMajorTicks.forEach((value) => {
      const y = scaleDiffusionY(value);
      const tickClass = "mda-plot-axis-tick mda-plot-axis-tick-left";
      parts.push(`<line class="${tickClass}" x1="${PLOT_MARGINS.left - 8}" y1="${y.toFixed(2)}" x2="${PLOT_MARGINS.left}" y2="${y.toFixed(2)}"></line>`);
      parts.push(
        `<text class="mda-plot-value mda-plot-value-diffusion" x="${PLOT_MARGINS.left - 8}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(
          diffusionScaleMode === "log"
            ? formatLogTick(Math.pow(10, value) * diffusionAxis.factor)
            : formatAxisTick(value),
        )}</text>`,
      );
    });

    if (xMinorTicks.length) {
      xMinorTicks.forEach((value) => {
        const x = scaleX(value);
        parts.push(
          `<line class="mda-plot-axis-tick mda-plot-axis-tick-bottom mda-plot-axis-tick-minor" x1="${x.toFixed(2)}" y1="${PLOT_HEIGHT - PLOT_MARGINS.bottom}" x2="${x.toFixed(2)}" y2="${PLOT_HEIGHT - PLOT_MARGINS.bottom + 5}"></line>`,
        );
      });
    }

    xTicks.forEach((value) => {
      const x = scaleX(value);
      parts.push(
        `<line class="mda-plot-axis-tick mda-plot-axis-tick-bottom" x1="${x.toFixed(2)}" y1="${PLOT_HEIGHT - PLOT_MARGINS.bottom}" x2="${x.toFixed(2)}" y2="${PLOT_HEIGHT - PLOT_MARGINS.bottom + 8}"></line>`,
      );
      parts.push(
        `<text class="mda-plot-value" x="${x.toFixed(2)}" y="${PLOT_HEIGHT - 14}" text-anchor="middle">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });
    references.forEach((entry) => {
      if (!entry.ref || !Number.isFinite(entry.ref.value)) return;
      if (state.referenceVisibility[entry.kind] === false) return;
      const refValue = convertCurrentValue(entry.ref.value, inputUnit, displayUnit);
      const y = scaleCurrentY(refValue);
      const handleX = PLOT_WIDTH - PLOT_MARGINS.right - 6;
      const lineColorClass = entry.kind === "baseline" ? "mda-plot-ref-baseline" : "mda-plot-ref-steady";
      parts.push(`<text class="mda-plot-ref-label ${lineColorClass}" x="${handleX - 8}" y="${Math.max(18, y - 7).toFixed(2)}" text-anchor="end">${escapeHtml(entry.label)}</text>`);
    });

    parts.push(
      diffusionScaleMode === "log"
        ? `
      <text class="mda-plot-axis-label mda-plot-axis-left" transform="translate(18 ${PLOT_HEIGHT / 2}) rotate(-90)" text-anchor="middle">
        <tspan>Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan>(t) [mm²/s]</tspan>
      </text>
    `
        : `
      <text class="mda-plot-axis-label mda-plot-axis-left" transform="translate(18 ${PLOT_HEIGHT / 2}) rotate(-90)" text-anchor="middle">
        <tspan>Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan>(t) [10</tspan><tspan baseline-shift="super" font-size="8">${diffusionAxis.exponent}</tspan><tspan> mm²/s]</tspan>
      </text>
    `,
    );
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

  function formatDiagnosticNumber(value) {
    if (!Number.isFinite(value)) return "";
    const abs = Math.abs(value);
    if (abs === 0) return "0";
    if (abs >= 1000 || abs < 0.001) {
      return Number(value.toExponential(3)).toString();
    }
    return Number(value.toPrecision(6)).toString();
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

  function formatLogTick(value) {
    if (!Number.isFinite(value) || value <= 0) return "";
    const exponent = Math.round(Math.log10(value));
    const rounded = Math.pow(10, exponent);
    if (Math.abs(value - rounded) / rounded > 1e-6) {
      return formatScientificTick(value);
    }
    return `10${toSuperscript(exponent)}`;
  }

  function toSuperscript(value) {
    const digits = String(Math.trunc(value));
    const map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return digits
      .split("")
      .map((char) => map[char] || "")
      .join("");
  }

  const textMeasureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const textMeasureContext = textMeasureCanvas ? textMeasureCanvas.getContext("2d") : null;

  function measureTextWidth(text, fontSize) {
    if (!textMeasureContext) return String(text || "").length * fontSize * 0.56;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim() || 'Arial, "Segoe UI", sans-serif';
    textMeasureContext.font = `${fontSize}px ${family}`;
    return textMeasureContext.measureText(String(text || "")).width;
  }

  function setStatus(dom, message, tone) {
    dom.status.textContent = message;
    dom.status.classList.remove("is-error", "is-ok");
    if (tone === "error") dom.status.classList.add("is-error");
    if (tone === "ok") dom.status.classList.add("is-ok");
  }

  function renderDiagnostics(dom, analysis) {
    if (!dom.statusDetail) return;
    if (!analysis || !analysis.diagnostics || !analysis.previewRows || !analysis.previewRows.length) {
      dom.statusDetail.textContent = "Diagnostics appear after data is parsed.";
      return;
    }

    const diagnostics = analysis.diagnostics;
    const rowsSolved = Number.isFinite(diagnostics.rowsSolved) ? diagnostics.rowsSolved : 0;
    const avgTerms = rowsSolved > 0 ? diagnostics.totalTermsUsed / rowsSolved : null;
    const maxTerms = Number.isFinite(diagnostics.maxTermsUsed) ? diagnostics.maxTermsUsed : null;
    const lastTerms = Number.isFinite(diagnostics.lastTermsUsed) ? diagnostics.lastTermsUsed : null;
    const lastContribution = Number.isFinite(diagnostics.lastTermContribution) ? diagnostics.lastTermContribution : null;
    const lastDelta = Number.isFinite(diagnostics.lastDelta) ? diagnostics.lastDelta : null;
    const lastTolerance = Number.isFinite(diagnostics.lastTolerance) ? diagnostics.lastTolerance : null;
    const parts = [];

    if (rowsSolved > 0) {
      parts.push(`${rowsSolved} inverse solves`);
    }
    if (avgTerms != null) {
      parts.push(`avg ${formatNumber(avgTerms)} terms`);
    }
    if (maxTerms != null) {
      parts.push(`max ${maxTerms} terms`);
    }
    if (lastTerms != null) {
      parts.push(`last ${lastTerms} terms`);
    }
    if (lastContribution != null) {
      parts.push(`last term ${formatDiagnosticNumber(lastContribution)}`);
    }
    if (lastDelta != null && lastTolerance != null) {
      parts.push(`last Δ ${formatDiagnosticNumber(lastDelta)} / tol ${formatDiagnosticNumber(lastTolerance)}`);
    }

    dom.statusDetail.textContent = parts.length
      ? `Diagnostics: ${parts.join(" · ")}.`
      : "Diagnostics are unavailable for this dataset.";
  }

  function syncT0OffsetDisplay(dom) {
    if (!dom || !dom.t0OffsetValue) return;
    const offset = parseNumberInput(dom.t0Offset ? dom.t0Offset.value : null) || 0;
    const prefix = offset > 0 ? "+" : "";
    dom.t0OffsetValue.textContent = `${prefix}${formatNumber(offset)} s`;
  }

  function positionStagePanels(dom) {
    const stageControls = dom?.root?.querySelector(".mda-stage-controls");
    if (!stageControls) return;
    const exportButton = stageControls.querySelector('[data-download="csv"]')?.closest(".mda-tool-panel") || stageControls.lastElementChild;
    const controlsRect = stageControls.getBoundingClientRect();
    const limitRight = exportButton ? exportButton.getBoundingClientRect().right : controlsRect.right;

    stageControls.querySelectorAll(".mda-tool-panel[open]").forEach((panel) => {
      const body = panel.querySelector(".mda-tool-panel-body");
      if (!body) return;
      body.style.left = "0px";
      body.style.right = "auto";
      body.style.visibility = "hidden";
      body.style.display = "grid";
      const panelRect = panel.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      const shift = Math.min(0, limitRight - panelRect.left - bodyRect.width);
      body.style.left = `${Math.round(shift)}px`;
      body.style.visibility = "";
    });
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

  function solveApparentDiffusivity(normalized, timeSeconds, thicknessMeters, deadline, diagnostics) {
    if (!Number.isFinite(normalized) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (timeSeconds <= 0 || thicknessMeters <= 0) return null;
    if (normalized < -1e-9 || normalized > 1 + 1e-9) return null;

    const target = clamp(normalized, 1e-12, 1 - 1e-12);
    let lower = SOLVER_POLICY.dLower;
    let upper = SOLVER_POLICY.dUpper;
    let lowerEval = evaluateFickResponseDetailed(lower, timeSeconds, thicknessMeters);
    let upperEval = evaluateFickResponseDetailed(upper, timeSeconds, thicknessMeters);
    if (!lowerEval || !upperEval || !Number.isFinite(lowerEval.value) || !Number.isFinite(upperEval.value)) return null;

    if (target <= lowerEval.value) {
      if (diagnostics) recordSolverDiagnostics(diagnostics, lowerEval);
      return lower;
    }
    if (target >= upperEval.value) {
      if (diagnostics) recordSolverDiagnostics(diagnostics, upperEval);
      return upper;
    }

    const solveDeadline = Number.isFinite(deadline) ? deadline : performance.now() + SOLVER_POLICY.timeoutMs;
    let best = null;
    let bestEval = null;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const mid = Math.sqrt(lower * upper);
      const midEval = evaluateFickResponseDetailed(mid, timeSeconds, thicknessMeters, solveDeadline);
      if (!midEval || !Number.isFinite(midEval.value)) return best;
      best = mid;
      bestEval = midEval;
      const error = midEval.value - target;
      const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(target)));
      if (diagnostics) recordSolverDiagnostics(diagnostics, midEval);
      if (Math.abs(error) <= tolerance) return mid;
      if (midEval.value < target) {
        lower = mid;
        lowerEval = midEval;
      } else {
        upper = mid;
        upperEval = midEval;
      }
      if (upper / lower <= 1 + 1e-12) return mid;
    }
    if (diagnostics && bestEval) recordSolverDiagnostics(diagnostics, bestEval);
    return best;
  }

  function evaluateFickResponseDetailed(diffusivity, timeSeconds, thicknessMeters, deadline) {
    if (!Number.isFinite(diffusivity) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (diffusivity <= 0 || timeSeconds <= 0 || thicknessMeters <= 0) return 0;

    const factor = (Math.PI * Math.PI * diffusivity * timeSeconds) / (thicknessMeters * thicknessMeters);
    if (factor < 1.6) {
      return evaluateFickResponseThetaDetailed(factor, deadline);
    }

    return evaluateFickResponseDirectDetailed(factor, deadline);
  }

  function evaluateFickResponseDirectDetailed(factor, deadline) {
    let sum = 0;
    let stableCount = 0;
    let previousValue = null;
    let lastTerm = 0;

    for (let n = 1; n <= SOLVER_POLICY.maxTerms; n += 1) {
      if (deadline && performance.now() > deadline) return null;
      const sign = n % 2 === 0 ? 1 : -1;
      const term = sign * Math.exp(-(n * n) * factor);
      sum += term;
      lastTerm = term;

      const value = 1 + 2 * sum;
      if (n >= SOLVER_POLICY.minTerms) {
        const delta = previousValue == null ? Math.abs(term) : Math.abs(value - previousValue);
        const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(value)));
        if (delta <= tolerance) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        if (stableCount >= 3) {
          return {
            value: clamp(value, 0, 1),
            termsUsed: n,
            lastTermContribution: 2 * term,
            lastDelta: delta,
            tolerance,
            method: "direct",
          };
        }
      }
      previousValue = value;
    }

    return {
      value: clamp(1 + 2 * sum, 0, 1),
      termsUsed: SOLVER_POLICY.maxTerms,
      lastTermContribution: 2 * lastTerm,
      lastDelta: previousValue == null ? Math.abs(lastTerm) : Math.abs((1 + 2 * sum) - previousValue),
      tolerance: Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(1 + 2 * sum))),
      method: "direct",
    };
  }

  function evaluateFickResponseThetaDetailed(factor, deadline) {
    if (!(factor > 0)) {
      return {
        value: 0,
        termsUsed: 0,
        lastTermContribution: 0,
        method: "theta",
      };
    }
    let sum = 0;
    let stableCount = 0;
    let previousValue = null;
    const root = Math.sqrt(Math.PI / factor);
    let lastTerm = 0;

    for (let m = 0; m <= SOLVER_POLICY.maxTerms; m += 1) {
      if (deadline && performance.now() > deadline) return null;
      const k = 2 * m + 1;
      const term = Math.exp(-((k * k) * Math.PI * Math.PI) / (4 * factor));
      sum += term;
      lastTerm = term;

      const value = 2 * root * sum;
      if (m + 1 >= SOLVER_POLICY.minTerms) {
        const delta = previousValue == null ? Math.abs(term) : Math.abs(value - previousValue);
        const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(value)));
        if (delta <= tolerance) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        if (stableCount >= 3) {
          return {
            value: clamp(value, 0, 1),
            termsUsed: m + 1,
            lastTermContribution: 2 * root * term,
            lastDelta: delta,
            tolerance,
            method: "theta",
          };
        }
      }
      previousValue = value;
    }

    return {
      value: clamp(2 * root * sum, 0, 1),
      termsUsed: SOLVER_POLICY.maxTerms + 1,
      lastTermContribution: 2 * root * lastTerm,
      lastDelta: previousValue == null ? Math.abs(2 * root * lastTerm) : Math.abs((2 * root * sum) - previousValue),
      tolerance: Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(2 * root * sum))),
      method: "theta",
    };
  }

  function renderEmpty(dom, message) {
    setStatus(dom, message, "");
    renderDiagnostics(dom, null);
    renderEmptyTable(dom);
    setIssues(dom, []);
    renderResults(dom, null);
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

    const values = rows.map((row) => row.current).filter((value) => Number.isFinite(value));
    if (!values.length) {
      return { value: null };
    }

    const value = kind === "baseline" ? Math.min(...values) : Math.max(...values);
    return {
      value,
    };
  }

  function applyTimeOffsetRows(rows, t0Offset, baseline) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    if (!sourceRows.length || !Number.isFinite(t0Offset) || t0Offset === 0) {
      return sourceRows.map((row) => ({ ...row }));
    }

    if (t0Offset > 0) {
      return sourceRows
        .filter((row) => Number.isFinite(row.time) && row.time >= t0Offset)
        .map((row) => ({ ...row, time: row.time - t0Offset }));
    }

    const shift = Math.abs(t0Offset);
    const firstCurrentRow = sourceRows.find((row) => Number.isFinite(row.current));
    const baselineValue = baseline && Number.isFinite(baseline.value) ? baseline.value : firstCurrentRow ? firstCurrentRow.current : null;

    const shiftedRows = sourceRows
      .filter((row) => Number.isFinite(row.time))
      .map((row) => ({ ...row, time: row.time + shift }));

    if (!Number.isFinite(baselineValue)) {
      return shiftedRows;
    }

    const syntheticRows = [
      { lineNumber: 0, time: 0, current: baselineValue, synthetic: true },
      { lineNumber: 0, time: shift, current: baselineValue, synthetic: true },
    ];
    return syntheticRows.concat(shiftedRows);
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
    const exportRows = Array.isArray(analysis.previewRows) && analysis.previewRows.length ? analysis.previewRows : analysis.rows;
    const rows = [
      ["Time [s]", `Current [${formatUnitLabel(displayUnit)}]`, "D_app [m^2/s]"],
      ...exportRows.map((row) => {
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
      .mda-plot-grid{stroke:${grid};stroke-linecap:butt;fill:none}
      .mda-plot-grid-major{stroke-width:0.6;opacity:0.85}
      .mda-plot-grid-minor{stroke-width:0.4;opacity:0.45;stroke-dasharray:2 4}
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
      .mda-plot-legend-group text{fill:${ink};font-weight:400}
      .mda-plot-legend-diffusion .mda-plot-legend-line{stroke:${diffusionColor}}
      .mda-plot-legend-current .mda-plot-legend-line{stroke:${currentColor}}
      .mda-plot-ref-hitline{stroke:transparent;stroke-width:14;fill:none}
      .mda-plot-axis-left,.mda-plot-value-diffusion{fill:${diffusionColor}}
      .mda-plot-axis-right,.mda-plot-value-current{fill:${currentColor}}
      .mda-plot-note{fill:${muted}}
      .mda-plot-ref-line{stroke:${ink};fill:none}
      .mda-plot-ref-label{fill:${ink}}
      .mda-plot-ref-line{stroke-width:2;stroke-linecap:butt}
      .mda-plot-ref-handle{stroke:${bg};stroke-width:2}
      .mda-plot-ref-label{font-size:10px;font-weight:400;paint-order:normal;stroke:none}
      .mda-plot-frame{fill:${bg};stroke:${border};stroke-width:0.8;pointer-events:none}
      .mda-plot-axis-tick{stroke:${muted};stroke-width:1;fill:none}
      .mda-plot-axis-tick-minor{stroke-width:0.75;opacity:0.8}
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
