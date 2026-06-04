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
  const PLOT_MARGINS = { top: 24, right: 40, bottom: 36, left: 50 };
  const SOLVER_POLICY = {
    minTerms: 3,
    maxTerms: 100,
    relTolerance: 1e-10,
    absTolerance: 1e-14,
    timeoutMs: 5000,
    dLower: 1e-16,
    dUpper: 1e-4,
  };
  const DEFAULT_PLOT_COLORS = {
    current: "#2563eb",
    diffusion: "#111111",
    diffusionEdge: "#acb2be",
    fit: "#7c3aed",
  };

  const state = {
    parseTimer: null,
    currentFileName: null,
    currentParse: null,
    currentAnalysis: null,
    diagnosticSnapshot: null,
    diagnosticReport: null,
    diagnosticBusy: false,
    diagnosticBusyTimer: null,
    diagnosticBusyStartedAt: 0,
    referenceVisibility: { baseline: true, steady: true },
    plotDiffusionScale: "linear",
    plotLowConfidenceMode: "shaded",
    plotColors: { ...DEFAULT_PLOT_COLORS },
    fitOverlayVisible: false,
    dragReference: null,
    dragReferenceFrame: null,
    dragReferencePending: null,
    dragPlot: null,
    plotViewport: null,
    plotHoverCache: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const root = document.getElementById("hpa-app");
    if (!root) return;
    const diagnosticCore = window.HPADiagnosticCore || (typeof globalThis !== "undefined" ? globalThis.HPADiagnosticCore : null);

    injectHeaderBrand();

    const dom = {
      root,
      input: document.getElementById("hpa-input"),
      file: document.getElementById("hpa-file"),
      uploadTrigger: document.getElementById("hpa-upload-trigger"),
      currentUnit: document.getElementById("hpa-current-unit"),
      baselineValue: document.getElementById("hpa-baseline-value"),
      steadyValue: document.getElementById("hpa-steady-value"),
      baselineReset: document.getElementById("hpa-baseline-reset"),
      baselineToggle: document.getElementById("hpa-baseline-toggle"),
      steadyReset: document.getElementById("hpa-steady-reset"),
      steadyToggle: document.getElementById("hpa-steady-toggle"),
      thickness: document.getElementById("hpa-thickness"),
      t0Offset: document.getElementById("hpa-t0-offset"),
      t0OffsetValue: document.getElementById("hpa-t0-offset-value"),
      minorGridToggle: document.getElementById("hpa-minor-grid-toggle"),
      cropRange: document.getElementById("hpa-crop-range"),
      decimal: document.getElementById("hpa-decimal"),
      plotUnit: document.getElementById("hpa-plot-unit"),
      lowConfidence: document.getElementById("hpa-low-confidence"),
      currentColor: document.getElementById("hpa-color-current"),
      diffusionColor: document.getElementById("hpa-color-diffusion"),
      diffusionEdgeColor: document.getElementById("hpa-color-diffusion-edge"),
      fitColor: document.getElementById("hpa-color-fit"),
      diffusionScale: document.getElementById("hpa-diffusion-scale"),
      gridToggle: document.getElementById("hpa-grid-toggle"),
      resetPlot: document.getElementById("hpa-reset-plot"),
      fitToggle: document.getElementById("hpa-fit-toggle"),
      status: document.getElementById("hpa-status"),
      statusDetail: document.getElementById("hpa-status-detail"),
        issues: document.getElementById("hpa-issues"),
        previewBody: document.getElementById("hpa-preview-body"),
        plot: document.getElementById("hpa-plot"),
        breakthroughValue: document.getElementById("hpa-breakthrough-value"),
        breakthroughTime: document.getElementById("hpa-breakthrough-time"),
        breakthroughNote: document.getElementById("hpa-breakthrough-note"),
        lagValue: document.getElementById("hpa-lag-value"),
        lagTime: document.getElementById("hpa-lag-time"),
        lagNote: document.getElementById("hpa-lag-note"),
        inflectionValue: document.getElementById("hpa-inflection-value"),
        inflectionTime: document.getElementById("hpa-inflection-time"),
        inflectionNote: document.getElementById("hpa-inflection-note"),
        inverseValue: document.getElementById("hpa-inverse-value"),
        inverseTime: document.getElementById("hpa-inverse-time"),
        inverseNote: document.getElementById("hpa-inverse-note"),
        fitValue: document.getElementById("hpa-fit-value"),
        fitTime: document.getElementById("hpa-fit-time"),
        fitNote: document.getElementById("hpa-fit-note"),
        helpDrawer: document.getElementById("hpa-help-drawer"),
        diagnosticDrawer: document.getElementById("hpa-diagnostic-drawer"),
        helpOpenButtons: root.querySelectorAll("[data-action='open-help']"),
        diagnosticOpenButtons: root.querySelectorAll("[data-action='open-diagnostic']"),
        helpCloseButtons: document.querySelectorAll("[data-action='close-help']"),
        diagnosticCloseButtons: document.querySelectorAll("[data-action='close-diagnostic']"),
        diagnosticRunButton: document.getElementById("hpa-diagnostic-run"),
        diagnosticApplyButton: document.getElementById("hpa-diagnostic-apply"),
        diagnosticRevertButton: document.getElementById("hpa-diagnostic-revert"),
        diagnosticSummary: document.getElementById("hpa-diagnostic-summary"),
        diagnosticBusyBanner: document.getElementById("hpa-diagnostic-busy"),
        diagnosticBusyText: document.getElementById("hpa-diagnostic-busy-text"),
        diagnosticScore: document.getElementById("hpa-diagnostic-score"),
        diagnosticConfidence: document.getElementById("hpa-diagnostic-confidence"),
        diagnosticT0: document.getElementById("hpa-diagnostic-t0"),
        diagnosticAgreement: document.getElementById("hpa-diagnostic-agreement"),
        diagnosticSnapshot: document.getElementById("hpa-diagnostic-snapshot"),
        diagnosticFindings: document.getElementById("hpa-diagnostic-findings"),
        diagnosticCandidates: document.getElementById("hpa-diagnostic-candidates"),
        diagnosticNotes: document.getElementById("hpa-diagnostic-notes"),
        downloadButtons: root.querySelectorAll("[data-download]"),
        clearButton: document.getElementById("hpa-clear"),
    };

    if (!dom.input || !dom.file || !dom.decimal || !dom.status || !dom.issues || !dom.previewBody || !dom.plot) {
      return;
    }

    if (!diagnosticCore) {
      console.warn("Diagnostic core failed to load.");
      if (dom.diagnosticRunButton) dom.diagnosticRunButton.disabled = true;
    }

    state.plotDiffusionScale = dom.diffusionScale && dom.diffusionScale.checked ? "log" : "linear";
    state.plotLowConfidenceMode = dom.lowConfidence && dom.lowConfidence.value ? dom.lowConfidence.value : "shaded";
    state.plotColors = readPlotColors(dom);
    state.fitOverlayVisible = false;

    dom.helpOpenButtons.forEach((button) => {
      button.addEventListener("click", () => openDrawer(dom.helpDrawer));
    });
    dom.diagnosticOpenButtons.forEach((button) => {
      button.addEventListener("click", () => {
        openDrawer(dom.diagnosticDrawer, dom.helpDrawer);
        renderDiagnosticDrawer(dom, state.diagnosticReport);
      });
    });
    dom.helpCloseButtons.forEach((button) => {
      button.addEventListener("click", () => closeDrawer(dom.helpDrawer));
    });
    dom.diagnosticCloseButtons.forEach((button) => {
      button.addEventListener("click", () => closeDrawer(dom.diagnosticDrawer));
    });
    if (dom.helpDrawer) {
      dom.helpDrawer.addEventListener("click", (event) => {
        if (event.target === dom.helpDrawer.querySelector(".hpa-help-backdrop")) {
          closeDrawer(dom.helpDrawer);
        }
      });
    }
    if (dom.diagnosticDrawer) {
      dom.diagnosticDrawer.addEventListener("click", (event) => {
        if (event.target === dom.diagnosticDrawer.querySelector(".hpa-diagnostic-backdrop")) {
          closeDrawer(dom.diagnosticDrawer);
        }
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer(dom.helpDrawer);
        closeDrawer(dom.diagnosticDrawer);
      }
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
      dom.t0Offset.addEventListener("dblclick", () => {
        dom.t0Offset.value = "0";
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
    if (dom.lowConfidence) {
      dom.lowConfidence.addEventListener("change", () => {
        state.plotLowConfidenceMode = dom.lowConfidence.value || "shaded";
        renderDerivedViews(dom);
      });
    }
    [dom.currentColor, dom.diffusionColor, dom.diffusionEdgeColor, dom.fitColor].forEach((element) => {
      if (!element) return;
      const updatePlotColors = () => {
        state.plotColors = readPlotColors(dom);
        applyPlotColorVars(dom);
      };
      element.addEventListener("input", updatePlotColors);
      element.addEventListener("change", updatePlotColors);
    });
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
    if (dom.fitToggle) {
      dom.fitToggle.addEventListener("click", () => {
        if (!state.currentAnalysis || !state.currentAnalysis.fit || !state.currentAnalysis.fit.available) return;
        state.fitOverlayVisible = !state.fitOverlayVisible;
        syncFitToggle(dom, state.currentAnalysis.fit);
        renderDerivedViews(dom);
      });
    }
      const stagePanels = root.querySelectorAll(".hpa-stage-controls .hpa-tool-panel");
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

    if (dom.diagnosticRunButton) {
      dom.diagnosticRunButton.addEventListener("click", () => runDiagnosticAnalysis(dom));
    }
    if (dom.diagnosticApplyButton) {
      dom.diagnosticApplyButton.addEventListener("click", () => applyDiagnosticBest(dom));
    }
    if (dom.diagnosticRevertButton) {
      dom.diagnosticRevertButton.addEventListener("click", () => revertDiagnosticSnapshot(dom));
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
    ensurePlotTooltip();

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
        state.plotLowConfidenceMode = "shaded";
        if (dom.lowConfidence) dom.lowConfidence.value = "shaded";
        state.plotColors = { ...DEFAULT_PLOT_COLORS };
        syncPlotColorControls(dom, state.plotColors);
        applyPlotColorVars(dom);
        clearReferenceAuto(dom.baselineValue);
        clearReferenceAuto(dom.steadyValue);
        if (dom.baselineValue) dom.baselineValue.value = "";
        if (dom.steadyValue) dom.steadyValue.value = "";
        if (dom.thickness) dom.thickness.value = "0.50";
        if (dom.t0Offset) dom.t0Offset.value = "0";
        syncT0OffsetDisplay(dom);
        if (dom.cropRange) dom.cropRange.value = "";
        state.fitOverlayVisible = false;
        state.diagnosticSnapshot = null;
        state.diagnosticReport = null;
        renderDiagnosticDrawer(dom, null);
        renderEmpty(dom, "Paste data to begin.");
      });
    }

    if (dom.plotUnit) {
      dom.plotUnit.value = "uA";
    }
    if (dom.lowConfidence) {
      dom.lowConfidence.value = "shaded";
    }
    syncPlotColorControls(dom, state.plotColors);
    applyPlotColorVars(dom);
    syncT0OffsetDisplay(dom);
    renderDiagnosticDrawer(dom, null);
    renderEmpty(dom, "Paste data to begin.");
    loadDebugDefaultInput(dom);
  }

  function injectHeaderBrand() {
    const header = document.querySelector("header");
    if (!header || header.querySelector(".hpa-header-brand")) return;

    const actions = header.querySelector(".header-actions");
    if (!actions) return;

    const brand = document.createElement("div");
    brand.className = "hpa-header-brand";
    brand.setAttribute("aria-label", "Hydrogen Permeation Analyzer");
    brand.innerHTML = `
      <img class="hpa-header-brand-image" src="/assets/Membrane Diffusion Analyser.png" alt="Hydrogen Permeation Analyzer" decoding="async" loading="lazy" />
      <span class="hpa-header-brand-text">Hydrogen Permeation Analyzer</span>
    `;
    header.insertBefore(brand, actions);
  }

  function openDrawer(drawer, otherDrawer) {
    if (!drawer) return;
    if (otherDrawer) closeDrawer(otherDrawer);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function closeAllDrawers(dom) {
    closeDrawer(dom && dom.helpDrawer);
    closeDrawer(dom && dom.diagnosticDrawer);
  }

  function toggleReferenceVisibility(dom, kind) {
    state.referenceVisibility[kind] = !state.referenceVisibility[kind];
    syncReferenceControls(dom, state.currentAnalysis);
    renderDerivedViews(dom);
  }

  function isReferenceAuto(element) {
    return element && element.dataset && element.dataset.hpaReferenceMode === "auto";
  }

  function isReferenceManual(element) {
    return element && element.dataset && element.dataset.hpaReferenceMode === "manual";
  }

  function clearReferenceAuto(element) {
    if (!element || !element.dataset) return;
    delete element.dataset.hpaReferenceMode;
    delete element.dataset.hpaReferenceSourceUnit;
    delete element.dataset.hpaReferenceRawValue;
  }

  function markReferenceManual(element) {
    if (!element || !element.dataset) return;
    element.dataset.hpaReferenceMode = "manual";
    delete element.dataset.hpaReferenceSourceUnit;
    delete element.dataset.hpaReferenceRawValue;
  }

  function setReferenceAutoValue(element, rawValue, sourceUnit, displayUnit) {
    if (!element || !Number.isFinite(rawValue)) return;
    const nextValue = convertCurrentValue(rawValue, sourceUnit, displayUnit);
    if (!Number.isFinite(nextValue)) return;
    element.value = formatNumber(nextValue);
    element.dataset.hpaReferenceMode = "auto";
    element.dataset.hpaReferenceSourceUnit = sourceUnit;
    element.dataset.hpaReferenceRawValue = String(rawValue);
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
    dom.plot.addEventListener("pointermove", (event) => {
      if (state.dragReference || state.dragPlot) {
        hidePlotTooltip();
        return;
      }
      updatePlotTooltip(dom, event);
    });
    dom.plot.addEventListener("mouseleave", hidePlotTooltip);
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

  function ensurePlotTooltip() {
    let tooltip = document.getElementById("hpa-plot-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "hpa-plot-tooltip";
      tooltip.className = "hpa-plot-tooltip";
      tooltip.setAttribute("aria-hidden", "true");
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function hidePlotTooltip() {
    const tooltip = document.getElementById("hpa-plot-tooltip");
    if (!tooltip) return;
    tooltip.style.opacity = "0";
    tooltip.setAttribute("aria-hidden", "true");
  }

  function updatePlotTooltip(dom, event) {
    const tooltip = ensurePlotTooltip();
    const cache = state.plotHoverCache;
    const svg = getPlotSvg(dom, event);
    if (!cache || !svg || !state.currentAnalysis || !state.currentAnalysis.rows || !state.currentAnalysis.rows.length) {
      hidePlotTooltip();
      return;
    }

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      hidePlotTooltip();
      return;
    }

    const x = ((event.clientX - rect.left) / rect.width) * PLOT_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * PLOT_HEIGHT;
    if (x < cache.chartX || x > cache.chartX + cache.chartWidth || y < cache.chartY || y > cache.chartY + cache.chartHeight) {
      hidePlotTooltip();
      return;
    }

    const best = findNearestPlotHoverTarget(cache, x, y);
    if (!best) {
      hidePlotTooltip();
      return;
    }

    tooltip.innerHTML = renderPlotTooltipContent(best);
    tooltip.style.opacity = "1";
    tooltip.setAttribute("aria-hidden", "false");
    const offset = 16;
    const gap = 8;
    const pageLeft = window.scrollX;
    const pageTop = window.scrollY;
    const viewportRight = pageLeft + window.innerWidth;
    const viewportBottom = pageTop + window.innerHeight;
    let left = event.clientX + window.scrollX + offset;
    let top = event.clientY + window.scrollY + offset;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    if (left + tooltipWidth + gap > viewportRight) {
      left = event.clientX + window.scrollX - tooltipWidth - offset;
    }
    if (top + tooltipHeight + gap > viewportBottom) {
      top = event.clientY + window.scrollY - tooltipHeight - offset;
    }

    left = Math.max(pageLeft + gap, Math.min(left, viewportRight - tooltipWidth - gap));
    top = Math.max(pageTop + gap, Math.min(top, viewportBottom - tooltipHeight - gap));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function renderPlotTooltipContent(target) {
    if (!target) return "";
    if (target.kind === "current") {
      const unit = target.unitLabel || "";
      return `
        <strong>Measured Permeation Current I(t)</strong>
        <div>t = ${escapeHtml(formatAxisTick(target.x))} s</div>
        <div>I = ${escapeHtml(formatAxisTick(target.displayValue))} ${escapeHtml(unit)}</div>
      `;
    }
    if (target.kind === "diffusion") {
      return `
        <strong>Apparent diffusion coefficient D<sub>app</sub>(t)</strong>
        <div>t = ${escapeHtml(formatAxisTick(target.x))} s</div>
        <div>D = ${escapeHtml(formatScientificTick(target.displayValue))} mm²/s</div>
        ${target.lowConfidence ? "<div>Low-confidence region: inverse problem is poorly conditioned.</div>" : ""}
      `;
    }
    return `
      <strong>${escapeHtml(target.label || "Reference")}</strong>
      <div>I = ${escapeHtml(formatAxisTick(target.displayValue))} ${escapeHtml(target.unitLabel || "")}</div>
    `;
  }

  function findNearestPlotHoverTarget(cache, x, y) {
    const lineThreshold = 10;
    const refThreshold = 8;
    let best = null;
    let bestDistSq = lineThreshold * lineThreshold;

    const consider = (candidate, distSq, anchorX, anchorY) => {
      if (!candidate || !Number.isFinite(distSq) || distSq > bestDistSq) return;
      bestDistSq = distSq;
      best = { ...candidate, anchorX, anchorY };
    };

    const scanPolyline = (points, kind, label, unitLabel, displayFn, extraFn) => {
      if (!Array.isArray(points) || points.length < 1) return;
      if (points.length === 1) {
        const point = points[0];
        const dx = x - point.px;
        const dy = y - point.py;
        consider(
          {
            kind,
            label,
            x: point.x,
            displayValue: displayFn(point, point, 0),
            unitLabel,
          },
          dx * dx + dy * dy,
          point.px,
          point.py,
        );
        return;
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const a = points[index];
        const b = points[index + 1];
        const projection = pointToSegmentProjection(x, y, a.px, a.py, b.px, b.py);
        if (projection.distSq > bestDistSq) continue;
        const t = projection.t;
        const px = projection.px;
        const py = projection.py;
        const interpX = a.x + (b.x - a.x) * t;
        const interpValue = displayFn(a, b, t, projection);
        const extra = extraFn ? extraFn(a, b, t, projection) : null;
        consider(
          {
            kind,
            label,
            x: interpX,
            displayValue: interpValue,
            unitLabel,
            ...(extra || {}),
          },
          projection.distSq,
          px,
          py,
        );
      }
    };

    scanPolyline(
      cache.currentPoints,
      "current",
      "Measured Permeation Current I(t)",
      cache.currentUnitLabel || "",
      (a, b, t) => a.y + (b.y - a.y) * t,
    );

    scanPolyline(
      cache.diffusionPoints,
      "diffusion",
      "Apparent diffusion coefficient Dapp(t)",
      "mm²/s",
      (a, b, t) => {
        const value = a.displayY + (b.displayY - a.displayY) * t;
        return Number.isFinite(value) ? value : null;
      },
      (a, b) => ({
        lowConfidence: !!(a.lowConfidence || b.lowConfidence),
      }),
    );

    if (Array.isArray(cache.referenceItems)) {
      cache.referenceItems.forEach((item) => {
        const dx = x - item.px;
        const dy = y - item.py;
        consider(
          {
            kind: "reference",
            label: item.label,
            displayValue: item.displayValue,
            unitLabel: item.currentUnitLabel || "",
          },
          dy * dy,
          item.px,
          item.py,
        );
      });
    }

    return best;
  }

  function pointToSegmentProjection(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) {
      const rx = px - ax;
      const ry = py - ay;
      return {
        px: ax,
        py: ay,
        t: 0,
        distSq: rx * rx + ry * ry,
      };
    }
    const lengthSq = dx * dx + dy * dy;
    const rawT = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
    const t = Math.max(0, Math.min(1, rawT));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const rx = px - projX;
    const ry = py - projY;
    return {
      px: projX,
      py: projY,
      t,
      distSq: rx * rx + ry * ry,
    };
  }

  function buildPolylinePath(points, scaleX, scaleY) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleY(point.y).toFixed(2)}`)
      .join(" ");
  }

  function buildSegmentedPolylinePaths(points, scaleX, scaleY, classifySegment) {
    if (!Array.isArray(points) || points.length < 2) return [];
    const projectX = typeof scaleX === "function" ? scaleX : (value) => value;
    const projectY = typeof scaleY === "function" ? scaleY : (value) => value;
    const classify = typeof classifySegment === "function" ? classifySegment : () => false;
    const segments = [];
    let currentState = Boolean(classify(points[0], points[1], 0));
    let segmentPoints = [points[0], points[1]];

    const pushSegment = () => {
      if (segmentPoints.length < 2) return;
      segments.push({
        lowConfidence: currentState,
        d: segmentPoints
          .map((point, index) => `${index === 0 ? "M" : "L"} ${projectX(point.x).toFixed(2)} ${projectY(point.y).toFixed(2)}`)
          .join(" "),
      });
    };

    for (let index = 2; index < points.length; index += 1) {
      const nextState = Boolean(classify(points[index - 1], points[index], index - 1));
      if (nextState === currentState) {
        segmentPoints.push(points[index]);
      } else {
        pushSegment();
        currentState = nextState;
        segmentPoints = [points[index - 1], points[index]];
      }
    }

    pushSegment();
    return segments;
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
    const xPad = xSpan * 0.00;
    const yPad = ySpan * 0.05;
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
        t0Offset < 0
          ? `Start time applied: removed the first ${formatNumber(Math.abs(t0Offset))} s of data and shifted the remaining times back to zero.`
          : `Start time applied: prepended ${formatNumber(t0Offset)} s of baseline time and shifted the data forward.`,
      );
    }

    if (cropRange) {
      rows = rows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end);
      notes.push(`Crop range applied: ${formatNumber(cropRange.start)} to ${formatNumber(cropRange.end)} s.`);
    }

    const fitRows = cropRange
      ? sourceRows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end)
      : sourceRows.slice();

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
        inverseSensitivity: null,
        lowConfidence: false,
      };
    });

    const inverseConfidence =
      normalizedAvailable && thicknessMm != null
        ? classifyInverseConfidence(previewRows, thicknessMm / 1000, solveDeadline)
        : { available: false, threshold: null };

    const classical = normalizedAvailable && thicknessMm != null ? buildClassicalResults(previewRows, thicknessMm, denom) : buildEmptyClassicalResults();
    const fit = normalizedAvailable && thicknessMm != null ? buildFitResult(fitRows, thicknessMm, baseline.value, steady.value) : buildEmptyFitResult();

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
      inverseConfidence,
        baseline,
        steady,
        thicknessMm,
        normalizedAvailable,
        diagnostics,
        classical,
        fit,
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
      renderDiagnosticDrawer(dom, state.diagnosticReport);
      renderResults(dom, analysis);
      syncFitToggle(dom, analysis.fit);
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
      renderDiagnosticDrawer(dom, state.diagnosticReport);
      renderResults(dom, state.currentAnalysis);
      syncFitToggle(dom, state.currentAnalysis.fit);
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

  function readPlotColors(dom) {
    return {
      current: normalizePlotColor(dom && dom.currentColor ? dom.currentColor.value : null, DEFAULT_PLOT_COLORS.current),
      diffusion: normalizePlotColor(dom && dom.diffusionColor ? dom.diffusionColor.value : null, DEFAULT_PLOT_COLORS.diffusion),
      diffusionEdge: normalizePlotColor(dom && dom.diffusionEdgeColor ? dom.diffusionEdgeColor.value : null, DEFAULT_PLOT_COLORS.diffusionEdge),
      fit: normalizePlotColor(dom && dom.fitColor ? dom.fitColor.value : null, DEFAULT_PLOT_COLORS.fit),
    };
  }

  function syncPlotColorControls(dom, colors) {
    if (!dom) return;
    const next = colors || DEFAULT_PLOT_COLORS;
    if (dom.currentColor) dom.currentColor.value = next.current || DEFAULT_PLOT_COLORS.current;
    if (dom.diffusionColor) dom.diffusionColor.value = next.diffusion || DEFAULT_PLOT_COLORS.diffusion;
    if (dom.diffusionEdgeColor) dom.diffusionEdgeColor.value = next.diffusionEdge || DEFAULT_PLOT_COLORS.diffusionEdge;
    if (dom.fitColor) dom.fitColor.value = next.fit || DEFAULT_PLOT_COLORS.fit;
  }

  function applyPlotColorVars(dom) {
    if (!dom || !dom.plot) return;
    const colors = state.plotColors || DEFAULT_PLOT_COLORS;
    dom.plot.style.setProperty("--hpa-plot-current-color", colors.current || DEFAULT_PLOT_COLORS.current);
    dom.plot.style.setProperty("--hpa-plot-diffusion-color", colors.diffusion || DEFAULT_PLOT_COLORS.diffusion);
    dom.plot.style.setProperty("--hpa-plot-diffusion-edge-color", colors.diffusionEdge || DEFAULT_PLOT_COLORS.diffusionEdge);
    dom.plot.style.setProperty("--hpa-plot-fit-color", colors.fit || DEFAULT_PLOT_COLORS.fit);
  }

  function syncFitToggle(dom, fit) {
    if (!dom || !dom.fitToggle) return;
    const available = !!(fit && fit.available);
    const visible = available && !!state.fitOverlayVisible;
    dom.fitToggle.disabled = !available;
    dom.fitToggle.textContent = visible ? "Hide" : "Show";
    dom.fitToggle.setAttribute("aria-pressed", visible ? "true" : "false");
    dom.fitToggle.title = available
      ? "Show or hide the fitted permeation curve."
      : "No global transient fit is available for the current data.";
  }

  function normalizePlotColor(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function buildFitOverlayPoints(analysis, fit, inputUnit, displayUnit, timeOffset, currentRanges) {
    if (!analysis || !fit || !fit.available || !Number.isFinite(fit.diffusivity)) return [];
    const thicknessMm = Number.isFinite(analysis.thicknessMm) ? analysis.thicknessMm : null;
    if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) return [];
    const thicknessMeters = thicknessMm / 1000;
    const baselineValue = analysis.baseline && Number.isFinite(analysis.baseline.value) ? analysis.baseline.value : null;
    const steadyValue = analysis.steady && Number.isFinite(analysis.steady.value) ? analysis.steady.value : null;
    const baselineDisplay = Number.isFinite(baselineValue) ? convertCurrentValue(baselineValue, inputUnit, displayUnit) : null;
    const steadyDisplay = Number.isFinite(steadyValue) ? convertCurrentValue(steadyValue, inputUnit, displayUnit) : null;
    if (!Number.isFinite(baselineDisplay) || !Number.isFinite(steadyDisplay)) return [];
    const span = Number.isFinite(currentRanges && currentRanges.xMax) && Number.isFinite(currentRanges && currentRanges.xMin)
      ? currentRanges.xMax - currentRanges.xMin
      : 0;
    const minX = Number.isFinite(currentRanges && currentRanges.xMin) ? currentRanges.xMin : 0;
    const sampleCount = span > 0 ? Math.min(240, Math.max(80, Math.round(Math.max((analysis.rows && analysis.rows.length) || 80, 40) * 1.5))) : 1;
    const offset = Number.isFinite(timeOffset) ? timeOffset : 0;
    const fitOffset = Number.isFinite(fit.timeOffset) ? fit.timeOffset : Number.isFinite(fit.t0Offset) ? fit.t0Offset : 0;
    const denom = steadyDisplay - baselineDisplay;
    if (!Number.isFinite(denom) || denom === 0) return [];
    const points = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const x = sampleCount === 1 ? minX : minX + (span * index) / (sampleCount - 1);
      const modelTime = x - offset + fitOffset;
      const response = evaluateFickResponseDetailed(fit.diffusivity, modelTime, thicknessMeters);
      const normalized = typeof response === "number" ? response : response && response.value;
      if (!Number.isFinite(normalized)) continue;
      points.push({ x, y: baselineDisplay + normalized * denom });
    }

    return points;
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
    const classical = analysis && analysis.classical ? analysis.classical : buildEmptyClassicalResults();
    const fit = analysis && analysis.fit ? analysis.fit : buildEmptyFitResult();

    setResultCard(dom.breakthroughValue, dom.breakthroughTime, dom.breakthroughNote, classical.breakthrough, "Breakthrough", "D<sub>b</sub>");
    setResultCard(dom.lagValue, dom.lagTime, dom.lagNote, classical.timeLag, "Time lag", "D<sub>lag</sub>");
    setResultCard(dom.inflectionValue, dom.inflectionTime, dom.inflectionNote, classical.inflection, "Inflection", "D<sub>IP</sub>");
    setResultCard(dom.inverseValue, dom.inverseTime, dom.inverseNote, classical.inverseFickian, "Inverse Fickian", "D<sub>Inv</sub>");
    setResultCard(dom.fitValue, dom.fitTime, dom.fitNote, fit, "Global Transient Fit", "D<sub>GTF</sub>");
  }

  function setResultCard(valueNode, timeNode, noteNode, result, label, symbolHtml) {
    if (!valueNode || !timeNode || !noteNode) return;
    const symbol = symbolHtml || "D";
    if (!result || !result.available) {
      valueNode.innerHTML = `${symbol} = <span class="hpa-missing-value" title="This value could not be computed because it is outside the baseline-to-steady-state interval. It shows as NaN here, but exports as an empty CSV cell for Excel-friendly import.">NaN</span>`;
      timeNode.textContent = "No stable value";
      noteNode.textContent = result && result.note ? result.note : `Unable to compute ${label.toLowerCase()}.`;
      return;
    }

    valueNode.innerHTML = `${symbol} = ${escapeHtml(formatDiffusivity(result.diffusivity))} <span class="hpa-result-unit">mm&sup2;/s</span>`;
    if (result.timeHtml) {
      timeNode.innerHTML = result.timeHtml;
    } else {
      timeNode.textContent = result.timeText || "—";
    }
    if (result.noteHtml) {
      noteNode.innerHTML = result.noteHtml;
    } else {
      noteNode.textContent = result.note || "";
    }
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
        const diffusivityCell = Number.isFinite(row.diffusivity)
          ? formatDiffusivity(row.diffusivity)
          : '<span class="hpa-missing-value" title="This value could not be computed because it is outside the baseline-to-steady-state interval. It shows as NaN here, but exports as an empty CSV cell for Excel-friendly import.">NaN</span>';
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

    function buildClassicalResults(previewRows, thicknessMm, iMax) {
      const thicknessMeters = thicknessMm / 1000;
      const rows = (previewRows || [])
        .map((row) => ({
          time: row.time,
          current: row.current,
          normalized: row.normalized,
          diffusivity: row.diffusivity,
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized) && Number.isFinite(row.current))
        .sort((a, b) => a.time - b.time);

      const breakthrough = solveThresholdMethod(rows, thicknessMeters, 0.1, 15.3, "Breakthrough (10%)", "D = L<sup>2</sup> / (15.3 t<sub>b</sub>)");
      const timeLag = solveThresholdMethod(rows, thicknessMeters, 0.63, 6, "Time lag (63%)", "D = L<sup>2</sup> / (6 t<sub>lag</sub>)");
      const inflection = solveInflectionMethod(rows, thicknessMeters, iMax);
      const inverseFickian = solveInverseFickianWindow(previewRows, thicknessMeters);

      return { breakthrough, timeLag, inflection, inverseFickian };
    }

    function buildEmptyClassicalResults() {
      return {
        breakthrough: { available: false, note: "Load data to calculate breakthrough time." },
        timeLag: { available: false, note: "Load data to calculate time lag." },
        inflection: { available: false, note: "Load data to calculate the inflection point." },
        inverseFickian: { available: false, note: "Load data to estimate the inverse Fickian window." },
      };
    }

    function buildEmptyFitResult() {
    return {
      available: false,
      note: "Load data to fit D and t0 together.",
    };
    }

    function solveThresholdMethod(rows, thicknessMeters, threshold, coefficient, label, formulaHtml) {
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
        noteHtml: formulaHtml || `${label} threshold ${Math.round(threshold * 100)}%.`,
      };
    }

    function solveInflectionMethod(rows, thicknessMeters, iMax) {
      const inflection = findInflectionPoint(rows, 0.2442);
      if (!inflection) {
        return {
          available: false,
          note: "No clear inflection point could be detected.",
        };
      }
      if (!Number.isFinite(iMax) || iMax <= 0) {
        return {
          available: false,
          note: "Inflection-point method requires a valid steady-state current.",
        };
      }
      const diffusivity = (0.04124 * thicknessMeters * thicknessMeters * inflection.slope) / (0.2442 * iMax);
      return {
        available: Number.isFinite(diffusivity) && diffusivity > 0,
        diffusivity,
        timeText: `t = ${formatNumber(inflection.time)} s`,
        noteHtml: "Inflection-point estimate (ideal solution) at I/I<sub>max</sub> ≈ 0.2442",
      };
    }

    function solveInverseFickianWindow(previewRows, thicknessMeters) {
      const points = (previewRows || [])
        .map((row) => ({ time: row.time, diffusivity: row.diffusivity, normalized: row.normalized }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.diffusivity) && Number.isFinite(row.normalized))
        .sort((a, b) => a.time - b.time);
      const sampledPoints = sampleEvenly(points, 120);
      if (sampledPoints.length < 8) {
        return { available: false, note: "Not enough inverse-solve points to judge an inverse Fickian window." };
      }

      const window = chooseStableWindow(sampledPoints);
      if (!window) {
        return { available: false, note: "No stable inverse Fickian window found." };
      }

      const values = window.points.map((point) => point.diffusivity);
      const robustValue = trimmedMean(values);
      if (!Number.isFinite(robustValue) || robustValue <= SOLVER_POLICY.dLower * 10 || robustValue >= SOLVER_POLICY.dUpper / 10) {
        return {
          available: false,
          note: "Inverse-solve values are pinned near the numerical bounds, so no stable inverse window is reported.",
        };
      }
      const span = window.points[window.points.length - 1].time - window.points[0].time;
      const note = `Robust inverse window from ${formatNumber(window.points[0].time)} to ${formatNumber(window.points[window.points.length - 1].time)} s`;
      void thicknessMeters;
      return {
        available: true,
        diffusivity: robustValue,
        timeText: Number.isFinite(span)
          ? `Average over ${window.points.length} points / ${formatNumber(span)} s`
          : `Average over ${window.points.length} points`,
        note,
      };
    }

    function chooseStableWindow(points) {
      return chooseStableWindowWithMinSize(points, Math.max(8, Math.ceil(points.length * 0.3))) || chooseStableWindowWithMinSize(points, 8);
    }

    function chooseStableWindowWithMinSize(points, minWindowSize) {
      let best = null;
      const maxWindowSize = Math.min(points.length, Math.max(minWindowSize, Math.ceil(points.length * 0.8)));
      const totalSpan = Math.max(points[points.length - 1].time - points[0].time, Number.EPSILON);
      for (let windowSize = maxWindowSize; windowSize >= minWindowSize; windowSize -= 1) {
        for (let start = 0; start <= points.length - windowSize; start += 1) {
          const candidate = points.slice(start, start + windowSize);
          const values = candidate.map((point) => point.diffusivity).filter((value) => Number.isFinite(value));
          if (values.length < windowSize) continue;
          const normalizedMedian = median(candidate.map((point) => point.normalized));
          if (!Number.isFinite(normalizedMedian) || normalizedMedian <= 0.02 || normalizedMedian >= 0.98) {
            continue;
          }
          const center = trimmedMean(values);
          const spread = iqr(values) / Math.max(Math.abs(center), Number.EPSILON);
          const slope = Math.abs(linearSlope(candidate)) * Math.max(candidate[candidate.length - 1].time - candidate[0].time, 1) / Math.max(Math.abs(center), Number.EPSILON);
          if (!Number.isFinite(center) || spread > 0.18 || slope > 0.18) continue;
          const candidateSpan = Math.max(candidate[candidate.length - 1].time - candidate[0].time, 0);
          const spanFraction = candidateSpan / totalSpan;
          const countFraction = candidate.length / points.length;
          const midpointFraction = ((candidate[0].time + candidate[candidate.length - 1].time) / 2 - points[0].time) / totalSpan;
          const score =
            spread * 1.4 +
            slope * 1.15 +
            Math.abs(normalizedMedian - 0.5) * 0.12 +
            (1 - countFraction) * 0.45 +
            (1 - spanFraction) * 0.45 +
            Math.abs(midpointFraction - 0.5) * 0.08;
          if (!best || score < best.score || (Math.abs(score - best.score) < 0.003 && (windowSize > best.points.length || candidateSpan > best.span))) {
            best = { points: candidate, score, span: candidateSpan };
          }
        }
      }
      return best;
    }

    function buildFitResult(fitRows, thicknessMm, baselineValue, steadyValue) {
      const thicknessMeters = thicknessMm / 1000;
      const rows = (fitRows || [])
        .map((row) => ({
          time: row.time,
          current: row.current,
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current))
        .sort((a, b) => a.time - b.time);

      if (rows.length < 4) {
        return { available: false, note: "Not enough points to fit D and t0 together." };
      }
      if (!Number.isFinite(baselineValue) || !Number.isFinite(steadyValue)) {
        return { available: false, note: "The fit requires fixed baseline and steady-state values." };
      }
      const denom = steadyValue - baselineValue;
      if (!Number.isFinite(denom) || denom <= 0) {
        return { available: false, note: "The fit requires a positive baseline-to-steady-state span." };
      }

      const normalizedRows = rows
        .map((row) => ({
          time: row.time,
          normalized: (row.current - baselineValue) / denom,
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized));

      if (normalizedRows.length < 4) {
        return { available: false, note: "Not enough normalized points to fit D and t0 together." };
      }

      const sampledRows = sampleEvenly(normalizedRows, 160);
      const deadline = performance.now() + SOLVER_POLICY.timeoutMs;
      const seed = estimateFitSeed(sampledRows, thicknessMeters);
      const best = optimizeFitSearch(sampledRows, thicknessMeters, seed, deadline);
      if (!best) {
        return { available: false, note: "No stable D and t0 fit could be found." };
      }

      const rmse = Math.sqrt(best.sse / Math.max(best.count, 1));
      const noteParts = [];
      if (Number.isFinite(rmse)) {
        noteParts.push(`Error (RMSE) over ${best.count} points: ${formatFitRmsePercent(rmse)} (${describeFitQuality(rmse)})`);
      }
      const lastNormalized = normalizedRows[normalizedRows.length - 1]?.normalized;
      if (Number.isFinite(lastNormalized) && lastNormalized < 0.9) {
        noteParts.push("Steady state is not fully reached, so the fit extrapolates the asymptote from the fixed references.");
      }

      return {
        available: true,
        diffusivity: best.diffusivity,
        timeOffset: best.timeOffset,
        t0Offset: best.timeOffset,
        timeHtml: `Best combined single fit: D<sub>app</sub> for t<sub>0</sub> = ${escapeHtml(formatFitOffset(best.timeOffset))} s`,
        note: noteParts.join(" "),
      };
    }

    function optimizeFitSearch(rows, thicknessMeters, seed, deadline) {
      if (!rows.length || !Number.isFinite(thicknessMeters) || thicknessMeters <= 0) return null;

      const minLog = Math.log10(SOLVER_POLICY.dLower);
      const maxLog = Math.log10(SOLVER_POLICY.dUpper);
      const timeMin = rows[0].time;
      const timeMax = rows[rows.length - 1].time;
      const timeSpan = Math.max(1, timeMax - timeMin);
      const timeLower = timeMin - timeSpan;
      const timeUpper = timeMax + timeSpan;

      let logCenter = seed && Number.isFinite(seed.diffusivity) ? Math.log10(clamp(seed.diffusivity, SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper)) : (minLog + maxLog) / 2;
      let timeCenter = seed && Number.isFinite(seed.timeOffset) ? seed.timeOffset : timeMin;
      let logHalfRange = seed && Number.isFinite(seed.diffusivity) ? 1.0 : (maxLog - minLog) / 2;
      let timeHalfRange = seed && Number.isFinite(seed.timeOffset) ? Math.max(timeSpan * 0.5, 1) : Math.max(timeSpan, 1);
      let best = null;

      const stages = [
        { logSteps: 13, timeSteps: 13 },
        { logSteps: 11, timeSteps: 11 },
        { logSteps: 9, timeSteps: 9 },
      ];

      for (const stage of stages) {
        const stageLogLower = clamp(logCenter - logHalfRange, minLog, maxLog);
        const stageLogUpper = clamp(logCenter + logHalfRange, minLog, maxLog);
        const stageTimeLower = clamp(timeCenter - timeHalfRange, timeLower, timeUpper);
        const stageTimeUpper = clamp(timeCenter + timeHalfRange, timeLower, timeUpper);
        let stageBest = null;

        for (let i = 0; i < stage.logSteps; i += 1) {
          if (deadline && performance.now() > deadline) return best || stageBest;
          const logD = stage.logSteps === 1 ? logCenter : stageLogLower + ((stageLogUpper - stageLogLower) * i) / (stage.logSteps - 1);
          const diffusivity = Math.pow(10, logD);
          for (let j = 0; j < stage.timeSteps; j += 1) {
            if (deadline && performance.now() > deadline) return best || stageBest;
            const timeOffset = stage.timeSteps === 1 ? timeCenter : stageTimeLower + ((stageTimeUpper - stageTimeLower) * j) / (stage.timeSteps - 1);
            const candidate = scoreFitCandidate(rows, thicknessMeters, diffusivity, timeOffset, deadline);
            if (!candidate) continue;
            if (!stageBest || candidate.score < stageBest.score) {
              stageBest = candidate;
            }
          }
        }

        if (!stageBest) break;
        best = stageBest;
        logCenter = Math.log10(stageBest.diffusivity);
        timeCenter = stageBest.timeOffset;
        logHalfRange = Math.max(logHalfRange * 0.35, 0.03);
        timeHalfRange = Math.max(timeHalfRange * 0.35, timeSpan * 0.01, 0.05);
      }

      return best;
    }

    function scoreFitCandidate(rows, thicknessMeters, diffusivity, timeOffset, deadline) {
      if (!Number.isFinite(diffusivity) || diffusivity <= 0 || !Number.isFinite(timeOffset)) return null;
      let sumSquares = 0;
      let count = 0;
      for (const row of rows) {
        if (deadline && performance.now() > deadline) return null;
        const model = evaluateFickResponseDetailed(diffusivity, row.time + timeOffset, thicknessMeters, deadline);
        const predicted = typeof model === "number" ? model : model && model.value;
        if (!Number.isFinite(predicted) || !Number.isFinite(row.normalized)) return null;
        const residual = predicted - row.normalized;
        sumSquares += residual * residual;
        count += 1;
      }
      if (count < 4) return null;
      return {
        diffusivity,
        timeOffset,
        count,
        sse: sumSquares,
        score: Math.sqrt(sumSquares / count),
      };
    }

    function estimateFitSeed(rows, thicknessMeters) {
      if (!rows.length || !Number.isFinite(thicknessMeters) || thicknessMeters <= 0) return null;
      const breakthrough = findCrossingTime(rows, 0.1);
      const timeLag = findCrossingTime(rows, 0.63);
      if (!breakthrough || !timeLag || !Number.isFinite(breakthrough.time) || !Number.isFinite(timeLag.time) || timeLag.time <= breakthrough.time) {
        return null;
      }

      const span = timeLag.time - breakthrough.time;
      const coefficient = (1 / 6) - (1 / 15.3);
      const diffusivity = (thicknessMeters * thicknessMeters * coefficient) / span;
      if (!Number.isFinite(diffusivity) || diffusivity <= 0) return null;
      const timeOffset = (thicknessMeters * thicknessMeters) / (6 * diffusivity) - timeLag.time;
      if (!Number.isFinite(timeOffset)) return null;

      return {
        diffusivity: clamp(diffusivity, SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper),
        timeOffset,
      };
    }

    function sampleEvenly(points, maxPoints) {
      if (!Array.isArray(points) || !points.length) return [];
      if (!Number.isFinite(maxPoints) || maxPoints <= 0 || points.length <= maxPoints) {
        return points.slice();
      }
      const sampled = [];
      const lastIndex = points.length - 1;
      for (let i = 0; i < maxPoints; i += 1) {
        const index = Math.round((i * lastIndex) / (maxPoints - 1));
        const point = points[index];
        if (!point) continue;
        if (sampled.length && sampled[sampled.length - 1].time === point.time) continue;
        sampled.push(point);
      }
      return sampled;
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

    function findInflectionPoint(rows, target) {
      if (rows.length < 3 || !Number.isFinite(target)) return null;
      const sorted = rows
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized) && Number.isFinite(row.current))
        .sort((a, b) => a.time - b.time);
      if (sorted.length < 3) return null;

      let leftIndex = -1;
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (prev.normalized === target) {
          leftIndex = i - 1;
          break;
        }
        if ((prev.normalized < target && curr.normalized >= target) || (prev.normalized > target && curr.normalized <= target)) {
          leftIndex = i - 1;
          break;
        }
      }

      if (leftIndex < 0) {
        let closest = 0;
        let closestDelta = Math.abs(sorted[0].normalized - target);
        for (let i = 1; i < sorted.length; i += 1) {
          const delta = Math.abs(sorted[i].normalized - target);
          if (delta < closestDelta) {
            closest = i;
            closestDelta = delta;
          }
        }
        leftIndex = Math.max(0, closest - 1);
      }

      const rightIndex = Math.min(sorted.length - 1, leftIndex + 1);
      const left = sorted[leftIndex];
      const right = sorted[rightIndex];
      const span = right.normalized - left.normalized;
      const ratio = span === 0 ? 0 : (target - left.normalized) / span;
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const time = left.time + (right.time - left.time) * clampedRatio;

      const windowStart = Math.max(0, leftIndex - 2);
      const windowEnd = Math.min(sorted.length, rightIndex + 3);
      const window = sorted.slice(windowStart, windowEnd);
      const slope = linearSlope(window.map((row) => ({ time: row.time, diffusivity: row.current })));
      if (!Number.isFinite(slope)) return null;

      return { time, slope };
    }

    function median(values) {
      const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      if (!filtered.length) return null;
      const mid = Math.floor(filtered.length / 2);
      return filtered.length % 2 ? filtered[mid] : (filtered[mid - 1] + filtered[mid]) / 2;
    }

    function trimmedMean(values) {
      const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      if (!filtered.length) return null;
      if (filtered.length < 6) {
        return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
      }
      const cut = Math.floor(filtered.length * 0.2);
      const trimmed = filtered.slice(cut, filtered.length - cut);
      if (!trimmed.length) return median(filtered);
      return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
    }

    function formatFitOffset(value) {
      if (!Number.isFinite(value)) return "—";
      const rounded = Math.round(value * 10) / 10;
      return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}`;
    }

    function formatFitRmsePercent(rmse) {
      if (!Number.isFinite(rmse)) return "—";
      return `${(rmse * 100).toFixed(1)}%`;
    }

    function describeFitQuality(rmse) {
      const percent = rmse * 100;
      if (!Number.isFinite(percent)) return "Unknown fit";
      if (percent < 1.5) return "Excellent fit";
      if (percent < 3) return "Good fit";
      if (percent < 5) return "Acceptable fit";
      if (percent < 8) return "Questionable fit";
      if (percent < 12) return "Poor fit";
      if (percent < 20) return "Unreliable fit";
      return "Invalid fit";
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
    applyPlotColorVars(dom);

    const rows = analysis && analysis.rows ? analysis.rows : [];
    if (!rows.length) {
      renderPlotEmpty(dom);
      return;
    }

    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);
    const currentUnitLabel = formatUnitLabel(displayUnit);
    const plotColors = state.plotColors || DEFAULT_PLOT_COLORS;
    const showGrid = !dom.gridToggle || dom.gridToggle.checked;
    const showMinorGrid = !dom.minorGridToggle || dom.minorGridToggle.checked;
    const diffusionScaleMode = dom.diffusionScale && dom.diffusionScale.checked ? "log" : "linear";

    const currentPoints = rows
      .map((row) => ({ x: row.time, y: convertCurrentValue(row.current, inputUnit, displayUnit) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const diffusionPoints = (analysis.previewRows || [])
      .map((row) => ({
        x: row.time,
        y: convertDiffusivityToDisplay(row.diffusivity),
        lowConfidence: !!row.lowConfidence,
        inverseSensitivity: row.inverseSensitivity,
      }))
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
      .map((point) => ({
        x: point.x,
        y: point.y / diffusionAxis.factor,
        lowConfidence: !!point.lowConfidence,
        inverseSensitivity: point.inverseSensitivity,
      }))
      .filter((point) => diffusionScaleMode !== "log" || point.y > 0);
    const diffusionPlotPoints =
      diffusionScaleMode === "log"
        ? orderedScaledDiffusion.map((point) => ({
            x: point.x,
            y: Math.log10(point.y),
            lowConfidence: point.lowConfidence,
            inverseSensitivity: point.inverseSensitivity,
          }))
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
    const within = (value, min, max) => Number.isFinite(value) && value >= min - 1e-9 && value <= max + 1e-9;
    const xTicksVisible = xTicks.filter((value) => within(value, currentRanges.xMin, currentRanges.xMax));
    const xMinorTicksVisible = xMinorTicks.filter((value) => within(value, currentRanges.xMin, currentRanges.xMax));
    const currentTicksVisible = currentTicks.filter((value) => within(value, currentRanges.yMin, currentRanges.yMax));
    const diffusionMajorTicksVisible = diffusionMajorTicks.filter((value) => within(value, diffusionRanges.yMin, diffusionRanges.yMax));
    const diffusionMinorTicksVisible = diffusionMinorTicks.filter((value) => within(value, diffusionRanges.yMin, diffusionRanges.yMax));

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
    const lowConfidenceMode = dom.lowConfidence && dom.lowConfidence.value ? dom.lowConfidence.value : state.plotLowConfidenceMode;
    state.plotLowConfidenceMode = lowConfidenceMode || "shaded";
    const diffusionConfidencePaths =
      lowConfidenceMode === "normal"
        ? []
        : buildSegmentedPolylinePaths(diffusionPlotPoints, scaleX, scaleDiffusionY, (a, b) => Boolean(a.lowConfidence || b.lowConfidence));
    const diffusionPath = diffusionPlotPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleDiffusionY(point.y).toFixed(2)}`)
      .join(" ");
    const fit = analysis.fit;
    const fitVisible = !!(fit && fit.available && state.fitOverlayVisible);
    syncFitToggle(dom, fit);
    const fitOverlayPoints = fitVisible
      ? buildFitOverlayPoints(analysis, fit, inputUnit, displayUnit, dom.t0Offset ? parseNumberInput(dom.t0Offset.value) || 0 : 0, currentRanges)
      : [];
    const fitPath = fitOverlayPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x).toFixed(2)} ${scaleCurrentY(point.y).toFixed(2)}`)
      .join(" ");

    const parts = [];
    const chartClipId = "hpa-plot-clip";
    const chartX = PLOT_MARGINS.left;
    const chartY = PLOT_MARGINS.top;
    const chartWidth = innerWidth;
    const chartHeight = innerHeight;
    const axisLabelInsetLeft = Math.max(15, PLOT_MARGINS.left - 31);
    const axisLabelInsetRight = Math.max(-3, PLOT_MARGINS.right - 31);
    const yGridParts = [];
    parts.push(`<svg viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" role="img" aria-label="Preview of measured permeation current and diffusion coefficient">`);
    parts.push(`
      <defs>
        <clipPath id="${chartClipId}">
          <rect x="${chartX}" y="${chartY}" width="${chartWidth}" height="${chartHeight}"></rect>
        </clipPath>
      </defs>
    `);
    parts.push(`<rect class="hpa-plot-frame" x="${chartX}" y="${chartY}" width="${chartWidth}" height="${chartHeight}"></rect>`);
    const legendGap = 60;
    const legendLineWidth = 18;
    const legendTextGap = 12;
    const legendFontSize = 10.5;
    const lowConfidenceLegendText = "Low Confidence";
    const diffusionPlotLegendText = "Apparent Diffusion Coefficient Dapp(t)";
    const currentLegendText = "Measured Permeation Current I(t)";
    const fitLegendText = "Global Transient Fit";
    const showLowConfidenceLegend = lowConfidenceMode === "shaded";
    const showFitLegend = fitVisible && !!fitPath;
    const lowConfidenceLegendWidth = showLowConfidenceLegend
      ? legendLineWidth + legendTextGap + measureTextWidth(lowConfidenceLegendText, legendFontSize)
      : 0;
    const diffusionLegendWidth = legendLineWidth + legendTextGap + measureTextWidth(diffusionPlotLegendText, legendFontSize);
    const currentLegendWidth = legendLineWidth + legendTextGap + measureTextWidth(currentLegendText, legendFontSize);
    const fitLegendWidth = showFitLegend ? legendLineWidth + legendTextGap + measureTextWidth(fitLegendText, legendFontSize) : 0;
    const legendTotalWidth =
      (showLowConfidenceLegend ? lowConfidenceLegendWidth + legendGap : 0) +
      diffusionLegendWidth +
      legendGap +
      currentLegendWidth +
      (showFitLegend ? legendGap + fitLegendWidth : 0);
    const legendX = Math.max(0, (PLOT_WIDTH - legendTotalWidth) / 2);
    const legendY = chartY - 20;
    parts.push(`
      <g class="hpa-plot-legend-group" transform="translate(${legendX} ${legendY})">
        ${showLowConfidenceLegend ? `
        <g class="hpa-plot-legend-item hpa-plot-legend-low-confidence">
          <line x1="0" y1="6" x2="18" y2="6" class="hpa-plot-legend-line hpa-plot-legend-low-confidence-line"></line>
          <text x="26" y="10">${lowConfidenceLegendText}</text>
        </g>` : ""}
        <g class="hpa-plot-legend-item hpa-plot-legend-diffusion" transform="translate(${(showLowConfidenceLegend ? lowConfidenceLegendWidth + legendGap : 0)} 0)">
          <line x1="0" y1="6" x2="18" y2="6" class="hpa-plot-legend-line"></line>
          <text x="26" y="10">
            <tspan x="26" dy="0">Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">inv</tspan><tspan>(t)</tspan>
          </text>
        </g>
        <g class="hpa-plot-legend-item hpa-plot-legend-current" transform="translate(${(showLowConfidenceLegend ? lowConfidenceLegendWidth + legendGap : 0) + diffusionLegendWidth + legendGap} 0)">
          <line x1="0" y1="6" x2="18" y2="6" class="hpa-plot-legend-line"></line>
          <text x="26" y="10">Measured Permeation Current I(t)</text>
        </g>
        ${showFitLegend ? `
        <g class="hpa-plot-legend-item hpa-plot-legend-fit" transform="translate(${(showLowConfidenceLegend ? lowConfidenceLegendWidth + legendGap : 0) + diffusionLegendWidth + legendGap + currentLegendWidth + legendGap} 0)">
          <line x1="0" y1="6" x2="18" y2="6" class="hpa-plot-legend-line"></line>
          <text x="26" y="10">${fitLegendText}</text>
        </g>` : ""}
      </g>
    `);

    const references = [
      { kind: "baseline", ref: analysis.baseline, label: "Baseline", className: "hpa-plot-ref-baseline" },
      { kind: "steady", ref: analysis.steady, label: "Steady State", className: "hpa-plot-ref-steady" },
    ];
    const currentHoverPoints = orderedCurrent.map((point) => ({
      x: point.x,
      y: point.y,
      px: scaleX(point.x),
      py: scaleCurrentY(point.y),
    }));
    const diffusionHoverPoints = diffusionPlotPoints.map((point, index) => ({
      x: point.x,
      y: point.y,
      px: scaleX(point.x),
      py: scaleDiffusionY(point.y),
      displayY: Number.isFinite(orderedDiffusion[index]?.y) ? orderedDiffusion[index].y : null,
      lowConfidence: !!point.lowConfidence,
      inverseSensitivity: point.inverseSensitivity,
    }));
    const referenceHoverItems = references
      .filter((entry) => entry.ref && Number.isFinite(entry.ref.value) && state.referenceVisibility[entry.kind] !== false)
      .map((entry) => {
        const refValue = convertCurrentValue(entry.ref.value, inputUnit, displayUnit);
        const y = scaleCurrentY(refValue);
        return {
          kind: entry.kind,
          label: entry.label,
          displayValue: refValue,
          px: PLOT_WIDTH - PLOT_MARGINS.right,
          py: y,
          currentUnitLabel,
        };
      });
    state.plotHoverCache = {
      chartX,
      chartY,
      chartWidth,
      chartHeight,
      currentUnitLabel,
      displayUnit,
      diffusionScaleMode,
      diffusionAxis,
      currentPoints: currentHoverPoints,
      diffusionPoints: diffusionHoverPoints,
      referenceItems: referenceHoverItems,
    };

    parts.push(`<g class="hpa-plot-chart" clip-path="url(#${chartClipId})">`);
    if (showGrid) {
      yGridTicks.forEach((value) => {
        const y = yGridScale(value);
        yGridParts.push(
          `<line class="hpa-plot-grid hpa-plot-grid-major" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`,
        );
      });
      xTicks.forEach((value) => {
        const x = scaleX(value);
        yGridParts.push(
          `<line class="hpa-plot-grid hpa-plot-grid-major" x1="${x.toFixed(2)}" y1="${chartY}" x2="${x.toFixed(2)}" y2="${chartY + chartHeight}"></line>`,
        );
      });
    }
    if (showMinorGrid) {
      diffusionMinorTicks.forEach((value) => {
        const y = scaleDiffusionY(value);
        yGridParts.push(
          `<line class="hpa-plot-grid hpa-plot-grid-minor" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`,
        );
      });
      xMinorTicks.forEach((value) => {
        const x = scaleX(value);
        yGridParts.push(
          `<line class="hpa-plot-grid hpa-plot-grid-minor" x1="${x.toFixed(2)}" y1="${chartY}" x2="${x.toFixed(2)}" y2="${chartY + chartHeight}"></line>`,
        );
      });
    }
    parts.push(...yGridParts);
    if (diffusionConfidencePaths.length) {
      diffusionConfidencePaths.forEach((segment) => {
        const segmentClass = segment.lowConfidence
          ? lowConfidenceMode === "hide"
            ? "hpa-plot-line-diffusion-hidden"
            : "hpa-plot-line-diffusion-edge"
          : "hpa-plot-line-diffusion";
        parts.push(`<path class="hpa-plot-line ${segmentClass}" d="${segment.d}"></path>`);
      });
    } else if (diffusionPath) {
      parts.push(`<path class="hpa-plot-line hpa-plot-line-diffusion" d="${diffusionPath}"></path>`);
    }
    if (currentPath) parts.push(`<path class="hpa-plot-line hpa-plot-line-current" d="${currentPath}"></path>`);
    if (fitVisible && fitPath) {
      parts.push(`<path class="hpa-plot-line hpa-plot-line-fit" d="${fitPath}"></path>`);
    }
    references.forEach((entry) => {
      if (!entry.ref || !Number.isFinite(entry.ref.value)) return;
      if (state.referenceVisibility[entry.kind] === false) return;
      const refValue = convertCurrentValue(entry.ref.value, inputUnit, displayUnit);
      const y = scaleCurrentY(refValue);
      const lineColorClass = entry.kind === "baseline" ? "hpa-plot-ref-baseline" : "hpa-plot-ref-steady";
      parts.push(`<line class="hpa-plot-ref-hitline" data-ref-kind="${entry.kind}" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`);
      parts.push(`<line class="hpa-plot-ref-line ${lineColorClass}" data-ref-kind="${entry.kind}" x1="${chartX}" y1="${y.toFixed(2)}" x2="${chartX + chartWidth}" y2="${y.toFixed(2)}"></line>`);
    });
    parts.push(`</g>`);

    currentTicksVisible.forEach((value) => {
      const y = scaleCurrentY(value);
      parts.push(
        `<line class="hpa-plot-axis-tick hpa-plot-axis-tick-right" x1="${PLOT_WIDTH - PLOT_MARGINS.right}" y1="${y.toFixed(2)}" x2="${PLOT_WIDTH - PLOT_MARGINS.right + 4}" y2="${y.toFixed(2)}"></line>`,
        `<text class="hpa-plot-value hpa-plot-value-current" x="${PLOT_WIDTH - PLOT_MARGINS.right + 4}" y="${(y + 3).toFixed(2)}" text-anchor="start">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });

    diffusionMinorTicksVisible.forEach((value) => {
      const y = scaleDiffusionY(value);
      parts.push(`<line class="hpa-plot-axis-tick hpa-plot-axis-tick-left hpa-plot-axis-tick-minor" x1="${PLOT_MARGINS.left - 3}" y1="${y.toFixed(2)}" x2="${PLOT_MARGINS.left}" y2="${y.toFixed(2)}"></line>`);
    });

    diffusionMajorTicksVisible.forEach((value) => {
      const y = scaleDiffusionY(value);
      const tickClass = "hpa-plot-axis-tick hpa-plot-axis-tick-left";
      parts.push(`<line class="${tickClass}" x1="${PLOT_MARGINS.left - 4}" y1="${y.toFixed(2)}" x2="${PLOT_MARGINS.left}" y2="${y.toFixed(2)}"></line>`);
      parts.push(
        `<text class="hpa-plot-value hpa-plot-value-diffusion" x="${PLOT_MARGINS.left - 4}" y="${(y + 3).toFixed(2)}" text-anchor="end">${escapeHtml(
          diffusionScaleMode === "log"
            ? formatLogTick(Math.pow(10, value) * diffusionAxis.factor)
            : formatAxisTick(value),
        )}</text>`,
      );
    });

    if (xMinorTicksVisible.length) {
      xMinorTicksVisible.forEach((value) => {
        const x = scaleX(value);
        parts.push(
          `<line class="hpa-plot-axis-tick hpa-plot-axis-tick-bottom hpa-plot-axis-tick-minor" x1="${x.toFixed(2)}" y1="${PLOT_HEIGHT - PLOT_MARGINS.bottom}" x2="${x.toFixed(2)}" y2="${PLOT_HEIGHT - PLOT_MARGINS.bottom + 4}"></line>`,
        );
      });
    }

    xTicksVisible.forEach((value) => {
      const x = scaleX(value);
      parts.push(
        `<line class="hpa-plot-axis-tick hpa-plot-axis-tick-bottom" x1="${x.toFixed(2)}" y1="${PLOT_HEIGHT - PLOT_MARGINS.bottom}" x2="${x.toFixed(2)}" y2="${PLOT_HEIGHT - PLOT_MARGINS.bottom + 6}"></line>`,
      );
      parts.push(
        `<text class="hpa-plot-value" x="${x.toFixed(2)}" y="${PLOT_HEIGHT - 18}" text-anchor="middle">${escapeHtml(formatAxisTick(value))}</text>`,
      );
    });
    parts.push(
      diffusionScaleMode === "log"
        ? `
      <text class="hpa-plot-axis-label hpa-plot-axis-left" transform="translate(${axisLabelInsetLeft} ${PLOT_HEIGHT / 2}) rotate(-90)" text-anchor="middle">
        <tspan>Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan>(t) [mm²/s]</tspan>
      </text>
    `
        : `
      <text class="hpa-plot-axis-label hpa-plot-axis-left" transform="translate(${axisLabelInsetLeft} ${PLOT_HEIGHT / 2}) rotate(-90)" text-anchor="middle">
        <tspan>Apparent Diffusion Coefficient </tspan><tspan font-style="italic">D</tspan><tspan baseline-shift="sub" font-size="8">app</tspan><tspan>(t) [10</tspan><tspan baseline-shift="super" font-size="8">${diffusionAxis.exponent}</tspan><tspan> mm²/s]</tspan>
      </text>
    `,
    );
    parts.push(`
      <text class="hpa-plot-axis-label hpa-plot-axis-right" transform="translate(${PLOT_WIDTH - axisLabelInsetRight} ${PLOT_HEIGHT / 2}) rotate(270)" text-anchor="middle">
        <tspan>Permeation current I(t) [${currentUnitLabel}]</tspan>
      </text>
    `);
    parts.push(`<text class="hpa-plot-axis-label hpa-plot-axis-x" x="${PLOT_WIDTH / 2}" y="${PLOT_HEIGHT - 5}" text-anchor="middle">Time [s]</text>`);
    parts.push("</svg>");

    dom.plot.innerHTML = parts.join("");
    hidePlotTooltip();
  }

  function renderPlotEmpty(dom) {
    if (dom.plot) {
      dom.plot.innerHTML = `<div class="hpa-plot-empty">Paste data to see the preview plot.</div>`;
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

  function readStyleValue(element, property, fallback) {
    if (!element) return fallback;
    const value = getComputedStyle(element).getPropertyValue(property).trim();
    return value || fallback;
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

  function getDiagnosticCore() {
    if (typeof window === "undefined") return null;
    return window.HPADiagnosticCore || null;
  }

  function captureReferenceSnapshot(element) {
    if (!element) return null;
    return {
      value: element.value,
      mode: element.dataset ? element.dataset.hpaReferenceMode || null : null,
      sourceUnit: element.dataset ? element.dataset.hpaReferenceSourceUnit || null : null,
      rawValue: element.dataset ? element.dataset.hpaReferenceRawValue || null : null,
    };
  }

  function restoreReferenceSnapshot(element, snapshot) {
    if (!element || !snapshot) return;
    element.value = snapshot.value != null ? snapshot.value : "";
    if (snapshot.mode === "auto") {
      if (snapshot.sourceUnit && snapshot.rawValue != null && Number.isFinite(Number(snapshot.rawValue))) {
        element.dataset.hpaReferenceMode = "auto";
        element.dataset.hpaReferenceSourceUnit = snapshot.sourceUnit;
        element.dataset.hpaReferenceRawValue = String(snapshot.rawValue);
      } else {
        clearReferenceAuto(element);
      }
      return;
    }
    if (snapshot.mode === "manual") {
      markReferenceManual(element);
      return;
    }
    clearReferenceAuto(element);
  }

  function captureDiagnosticSnapshot(dom) {
    return {
      inputValue: dom.input ? dom.input.value : "",
      currentFileName: state.currentFileName,
      currentUnit: dom.currentUnit ? dom.currentUnit.value : "A",
      plotUnit: dom.plotUnit ? dom.plotUnit.value : "uA",
      thickness: dom.thickness ? dom.thickness.value : "",
      t0Offset: dom.t0Offset ? dom.t0Offset.value : "0",
      decimal: dom.decimal ? dom.decimal.value : ".",
      cropRange: dom.cropRange ? dom.cropRange.value : "",
      currentUnitIndex: dom.currentUnit ? dom.currentUnit.selectedIndex : 0,
      plotUnitIndex: dom.plotUnit ? dom.plotUnit.selectedIndex : 0,
      lowConfidence: dom.lowConfidence ? dom.lowConfidence.value : "shaded",
      plotColors: { ...state.plotColors },
      diffusionScale: dom.diffusionScale ? dom.diffusionScale.checked : false,
      gridToggle: dom.gridToggle ? dom.gridToggle.checked : true,
      minorGridToggle: dom.minorGridToggle ? dom.minorGridToggle.checked : true,
      baseline: captureReferenceSnapshot(dom.baselineValue),
      steady: captureReferenceSnapshot(dom.steadyValue),
      referenceVisibility: { ...state.referenceVisibility },
      fitOverlayVisible: state.fitOverlayVisible,
      plotViewport: state.plotViewport ? { ...state.plotViewport } : null,
      plotLowConfidenceMode: state.plotLowConfidenceMode,
      plotDiffusionScale: state.plotDiffusionScale,
    };
  }

  function restoreDiagnosticSnapshot(dom, snapshot) {
    if (!snapshot) return;
    if (dom.input) dom.input.value = snapshot.inputValue != null ? snapshot.inputValue : "";
    if (dom.file) dom.file.value = "";
    state.currentFileName = snapshot.currentFileName || null;
    if (dom.currentUnit && snapshot.currentUnit) dom.currentUnit.value = snapshot.currentUnit;
    if (dom.plotUnit && snapshot.plotUnit) dom.plotUnit.value = snapshot.plotUnit;
    if (dom.thickness && snapshot.thickness != null) dom.thickness.value = snapshot.thickness;
    if (dom.t0Offset && snapshot.t0Offset != null) dom.t0Offset.value = snapshot.t0Offset;
    if (dom.decimal && snapshot.decimal) dom.decimal.value = snapshot.decimal;
    if (dom.cropRange) dom.cropRange.value = snapshot.cropRange || "";
    if (dom.lowConfidence && snapshot.lowConfidence) dom.lowConfidence.value = snapshot.lowConfidence;
    state.plotColors = snapshot.plotColors ? { ...DEFAULT_PLOT_COLORS, ...snapshot.plotColors } : { ...DEFAULT_PLOT_COLORS };
    syncPlotColorControls(dom, state.plotColors);
    applyPlotColorVars(dom);
    if (dom.diffusionScale) dom.diffusionScale.checked = !!snapshot.diffusionScale;
    if (dom.gridToggle) dom.gridToggle.checked = snapshot.gridToggle !== false;
    if (dom.minorGridToggle) dom.minorGridToggle.checked = snapshot.minorGridToggle !== false;
    restoreReferenceSnapshot(dom.baselineValue, snapshot.baseline);
    restoreReferenceSnapshot(dom.steadyValue, snapshot.steady);
    state.referenceVisibility = snapshot.referenceVisibility ? { ...snapshot.referenceVisibility } : { baseline: true, steady: true };
    state.fitOverlayVisible = !!snapshot.fitOverlayVisible;
    state.plotViewport = snapshot.plotViewport ? { ...snapshot.plotViewport } : null;
    state.plotLowConfidenceMode = snapshot.plotLowConfidenceMode || "shaded";
    state.plotDiffusionScale = snapshot.plotDiffusionScale || (dom.diffusionScale && dom.diffusionScale.checked ? "log" : "linear");
    syncT0OffsetDisplay(dom);
    scheduleParse(dom, "selection");
  }

  function applyDiagnosticBest(dom) {
    const report = state.diagnosticReport;
    if (!report || !report.best) return;
    const inputUnit = dom.currentUnit ? dom.currentUnit.value : "A";
    const displayUnit = getDisplayUnit(dom);
    if (dom.baselineValue && Number.isFinite(report.best.baselineValue)) {
      setReferenceAutoValue(dom.baselineValue, report.best.baselineValue, inputUnit, displayUnit);
    }
    if (dom.steadyValue && Number.isFinite(report.best.steadyValue)) {
      setReferenceAutoValue(dom.steadyValue, report.best.steadyValue, inputUnit, displayUnit);
    }
    if (dom.t0Offset && Number.isFinite(report.best.t0Offset)) {
      dom.t0Offset.value = String(report.best.t0Offset);
      syncT0OffsetDisplay(dom);
    }
    setStatus(dom, "Applied the best diagnostic candidate.", "ok");
    scheduleParse(dom, "selection");
    renderDiagnosticDrawer(dom, state.diagnosticReport);
  }

  function revertDiagnosticSnapshot(dom) {
    if (!state.diagnosticSnapshot) return;
    restoreDiagnosticSnapshot(dom, state.diagnosticSnapshot);
    state.plotViewport = null;
    if (dom.t0Offset) dom.t0Offset.value = "0";
    syncT0OffsetDisplay(dom);
    resetReferenceField(dom, dom.baselineValue);
    resetReferenceField(dom, dom.steadyValue);
    setStatus(dom, "Restored the pre-diagnostic snapshot.", "ok");
    renderDiagnosticDrawer(dom, state.diagnosticReport);
  }

  function runDiagnosticAnalysis(dom) {
    const core = getDiagnosticCore();
    if (!core) {
      setStatus(dom, "Diagnostic core is unavailable.", "error");
      return null;
    }
    if (state.diagnosticBusy) {
      return state.diagnosticReport;
    }
    const snapshot = captureDiagnosticSnapshot(dom);
    state.diagnosticSnapshot = snapshot;
    state.diagnosticReport = null;
    state.diagnosticBusy = true;
    state.diagnosticBusyStartedAt = Date.now();
    if (state.diagnosticBusyTimer) {
      window.clearTimeout(state.diagnosticBusyTimer);
      state.diagnosticBusyTimer = null;
    }
    renderDiagnosticDrawer(dom, null);
    setStatus(dom, "Running diagnostics...", "info");

    window.requestAnimationFrame(() => {
      state.diagnosticBusyTimer = window.setTimeout(() => {
        const finish = (report, tone, message) => {
          const complete = () => {
            state.diagnosticReport = report;
            state.diagnosticBusy = false;
            state.diagnosticBusyTimer = null;
            renderDiagnosticDrawer(dom, report);
            setStatus(dom, message, tone);
          };
          const elapsed = Math.max(0, Date.now() - (state.diagnosticBusyStartedAt || Date.now()));
          const remaining = Math.max(0, 250 - elapsed);
          if (remaining > 0) {
            window.setTimeout(complete, remaining);
          } else {
            complete();
          }
        };

        try {
          parseAndRender(dom, "selection");
          if (!state.currentParse || !state.currentParse.rows || !state.currentParse.rows.length) {
            state.diagnosticBusy = false;
            state.diagnosticBusyTimer = null;
            renderDiagnosticDrawer(dom, null);
            setStatus(dom, "Load data before running diagnostics.", "error");
            return;
          }
          const baseline = state.currentAnalysis && state.currentAnalysis.baseline ? state.currentAnalysis.baseline.value : null;
          const steady = state.currentAnalysis && state.currentAnalysis.steady ? state.currentAnalysis.steady.value : null;
          const report = core.analyzeDiagnostic({
            rows: state.currentParse.rows,
            thicknessMm: parseNumberInput(dom.thickness ? dom.thickness.value : null),
            baselineValue: baseline,
            steadyValue: steady,
            t0Offset: parseNumberInput(dom.t0Offset ? dom.t0Offset.value : null) || 0,
            cropRange: parseRangeSpec(dom.cropRange ? dom.cropRange.value : ""),
          });
          finish(report, report && report.best ? "ok" : "error", report && report.best ? "Diagnostic complete." : "Diagnostic complete with limited confidence.");
        } catch (error) {
          console.error(error);
          finish(null, "error", "Diagnostic failed.");
        }
      }, 0);
    });

    return null;
  }

  function formatDiagnosticNumber(value) {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 1000 || (abs > 0 && abs < 0.001)) {
      return value.toExponential(3);
    }
    return formatNumber(value);
  }

  function formatDiagnosticScore(value) {
    if (!Number.isFinite(value)) return "—";
    return formatNumber(value);
  }

  function renderDiagnosticDrawer(dom, report) {
    if (!dom) return;
    const busy = !!state.diagnosticBusy;
    if (dom.diagnosticDrawer) dom.diagnosticDrawer.setAttribute("aria-busy", busy ? "true" : "false");
    if (dom.diagnosticDrawer) dom.diagnosticDrawer.classList.toggle("has-report", !!report && !busy);
    if (dom.diagnosticBusyBanner) dom.diagnosticBusyBanner.hidden = !busy;
    if (dom.diagnosticBusyText) {
      dom.diagnosticBusyText.textContent = busy
        ? "Working through the candidate settings now."
        : "Ready.";
    }
    if (dom.diagnosticRunButton) {
      if (!dom.diagnosticRunButton.dataset.labelDefault) {
        dom.diagnosticRunButton.dataset.labelDefault = dom.diagnosticRunButton.textContent || "Diagnose";
      }
      dom.diagnosticRunButton.disabled = busy;
      dom.diagnosticRunButton.textContent = busy ? "Running..." : dom.diagnosticRunButton.dataset.labelDefault;
    }
    if (dom.diagnosticOpenButtons) {
      dom.diagnosticOpenButtons.forEach((button) => {
        button.disabled = busy;
      });
    }
    if (dom.diagnosticApplyButton) dom.diagnosticApplyButton.disabled = !(report && report.best);
    if (dom.diagnosticRevertButton) dom.diagnosticRevertButton.disabled = !state.diagnosticSnapshot;

    if (busy) {
      if (dom.diagnosticSummary) dom.diagnosticSummary.textContent = "Diagnostics are running. Please wait while the candidate settings are being evaluated.";
      if (dom.diagnosticScore) dom.diagnosticScore.textContent = "…";
      if (dom.diagnosticConfidence) dom.diagnosticConfidence.textContent = "…";
      if (dom.diagnosticT0) dom.diagnosticT0.textContent = "…";
      if (dom.diagnosticAgreement) dom.diagnosticAgreement.textContent = "…";
      if (dom.diagnosticSnapshot) {
        dom.diagnosticSnapshot.textContent = state.diagnosticSnapshot ? "Snapshot stored. The diagnostic is currently analyzing the data." : "Capturing snapshot and analyzing the data.";
      }
      if (dom.diagnosticNotes) dom.diagnosticNotes.textContent = "This can take a moment on larger datasets. The window is still working.";
      if (dom.diagnosticFindings) dom.diagnosticFindings.innerHTML = "";
      if (dom.diagnosticCandidates) dom.diagnosticCandidates.innerHTML = "";
      return;
    }

    if (!report) {
      if (dom.diagnosticSummary) dom.diagnosticSummary.textContent = "Ready to analyze the pasted data.";
      if (dom.diagnosticScore) dom.diagnosticScore.textContent = "—";
      if (dom.diagnosticConfidence) dom.diagnosticConfidence.textContent = "—";
      if (dom.diagnosticT0) dom.diagnosticT0.textContent = "—";
      if (dom.diagnosticAgreement) dom.diagnosticAgreement.textContent = "—";
      if (dom.diagnosticSnapshot) dom.diagnosticSnapshot.textContent = "No snapshot stored yet.";
      if (dom.diagnosticNotes) dom.diagnosticNotes.textContent = "Paste data or load a file, then run Diagnose to generate the score and candidate settings.";
      if (dom.diagnosticFindings) dom.diagnosticFindings.innerHTML = "";
      if (dom.diagnosticCandidates) dom.diagnosticCandidates.innerHTML = "";
      return;
    }

    const best = report.best || null;
    const current = report.current || null;
    if (dom.diagnosticSummary) dom.diagnosticSummary.textContent = report.summary || "Diagnostic complete.";
    if (dom.diagnosticScore) dom.diagnosticScore.textContent = formatDiagnosticScore(best && best.score);
    if (dom.diagnosticConfidence) dom.diagnosticConfidence.textContent = best && Number.isFinite(best.confidence) ? `${Math.round(best.confidence)}%` : "—";
    if (dom.diagnosticT0) dom.diagnosticT0.textContent = best ? `${best.t0Offset > 0 ? "+" : ""}${formatDiagnosticNumber(best.t0Offset)} s` : "—";
    if (dom.diagnosticAgreement) {
      dom.diagnosticAgreement.textContent = best && Number.isFinite(best.methodSpread) ? `log spread ${formatDiagnosticScore(best.methodSpread)}` : "—";
    }

    if (dom.diagnosticSnapshot) {
      const parts = [];
      if (state.diagnosticSnapshot) {
        parts.push(`Input rows: ${state.currentParse && state.currentParse.rows ? state.currentParse.rows.length : 0}.`);
        parts.push(`t0: ${state.diagnosticSnapshot.t0Offset || "0"} s.`);
        parts.push(`Thickness: ${state.diagnosticSnapshot.thickness || "—"} mm.`);
        parts.push(`Baseline: ${describeReferenceSnapshot(state.diagnosticSnapshot.baseline)}.`);
        parts.push(`Steady state: ${describeReferenceSnapshot(state.diagnosticSnapshot.steady)}.`);
      } else {
        parts.push("No snapshot stored yet.");
      }
      dom.diagnosticSnapshot.textContent = parts.join(" ");
    }

    if (dom.diagnosticNotes) {
      const notes = [];
      if (best && best.flatnessWindow) {
        notes.push(`Central flatness window: ${formatDiagnosticNumber(best.flatnessWindow.low * 100)}% to ${formatDiagnosticNumber(best.flatnessWindow.high * 100)}% of normalized signal.`);
      }
      if (report.comparison && Number.isFinite(report.comparison.t0Delta) && Math.abs(report.comparison.t0Delta) > 0.5) {
        notes.push(`Best time-zero shift relative to the current setup: ${report.comparison.t0Delta > 0 ? "+" : ""}${formatDiagnosticNumber(report.comparison.t0Delta)} s.`);
      }
      if (report.recommendations && report.recommendations.length) {
        notes.push(report.recommendations.join(" "));
      }
      if (report.rawChecks && report.rawChecks.gapNote) {
        notes.push(report.rawChecks.gapNote);
      }
      if (current && Number.isFinite(current.score)) {
        notes.push(`Current setup score: ${formatDiagnosticScore(current.score)}.`);
      }
      dom.diagnosticNotes.textContent = notes.length ? notes.join(" ") : "No additional notes.";
    }

    if (dom.diagnosticFindings) {
      dom.diagnosticFindings.innerHTML = (report.findings || [])
        .map((finding) => renderDiagnosticFinding(finding))
        .join("");
    }

    if (dom.diagnosticCandidates) {
      dom.diagnosticCandidates.innerHTML = (report.topCandidates || [])
        .map((candidate, index) => renderDiagnosticCandidate(candidate, index === 0))
        .join("");
    }
  }

  function describeReferenceSnapshot(snapshot) {
    if (!snapshot) return "—";
    if (snapshot.mode === "auto") {
      return `auto (${snapshot.value || "—"})`;
    }
    if (snapshot.mode === "manual") {
      return `manual (${snapshot.value || "—"})`;
    }
    return snapshot.value || "—";
  }

  function renderDiagnosticFinding(finding) {
    if (!finding) return "";
    const severity = finding.severity || "warning";
    return `
      <li class="hpa-diagnostic-finding is-${escapeHtml(severity)}">
        <span class="hpa-diagnostic-finding-title">${escapeHtml(finding.title || "Finding")}</span>
        <div>${escapeHtml(finding.text || "")}</div>
      </li>
    `;
  }

  function renderDiagnosticCandidate(candidate, isBest) {
    if (!candidate) return "";
    const prefix = isBest ? "Best" : candidate.label || "Candidate";
    const t0Text = Number.isFinite(candidate.t0Offset) ? `${candidate.t0Offset > 0 ? "+" : ""}${formatDiagnosticNumber(candidate.t0Offset)} s` : "—";
    const scoreText = Number.isFinite(candidate.score) ? formatDiagnosticScore(candidate.score) : "—";
    const flatnessText = Number.isFinite(candidate.flatnessScore) ? formatDiagnosticScore(candidate.flatnessScore) : "—";
    const agreementText = Number.isFinite(candidate.methodSpread) ? formatDiagnosticScore(candidate.methodSpread) : "—";
    return `
      <article class="hpa-diagnostic-candidate${isBest ? " is-best" : ""}">
        <strong>${escapeHtml(prefix)} candidate</strong>
        <span>t<sub>0</sub>: ${escapeHtml(t0Text)}</span>
        <span>Score: ${escapeHtml(scoreText)} | Agreement: ${escapeHtml(agreementText)} | Flatness: ${escapeHtml(flatnessText)}</span>
        <span>Baseline: ${escapeHtml(formatDiagnosticNumber(candidate.baselineValue))} | Steady: ${escapeHtml(formatDiagnosticNumber(candidate.steadyValue))}</span>
      </article>
    `;
  }

  function syncT0OffsetDisplay(dom) {
    if (!dom || !dom.t0OffsetValue) return;
    const offset = parseNumberInput(dom.t0Offset ? dom.t0Offset.value : null) || 0;
    const prefix = offset > 0 ? "+" : "";
    dom.t0OffsetValue.textContent = `${prefix}${formatNumber(offset)} s`;
  }

  function positionStagePanels(dom) {
    const stageControls = dom?.root?.querySelector(".hpa-stage-controls");
    if (!stageControls) return;
    const exportButton = stageControls.querySelector('[data-download="csv"]')?.closest(".hpa-tool-panel") || stageControls.lastElementChild;
    const controlsRect = stageControls.getBoundingClientRect();
    const limitRight = exportButton ? exportButton.getBoundingClientRect().right : controlsRect.right;

    stageControls.querySelectorAll(".hpa-tool-panel[open]").forEach((panel) => {
      const body = panel.querySelector(".hpa-tool-panel-body");
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

  function computeInverseSensitivity(normalized, timeSeconds, thicknessMeters, diffusivity, deadline) {
    if (!Number.isFinite(normalized) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters) || !Number.isFinite(diffusivity)) {
      return null;
    }
    if (timeSeconds <= 0 || thicknessMeters <= 0 || diffusivity <= 0) return null;
    if (diffusivity <= SOLVER_POLICY.dLower * 1.001 || diffusivity >= SOLVER_POLICY.dUpper / 1.001) {
      return Number.POSITIVE_INFINITY;
    }

    const delta = 0.08;
    const lowerDiffusivity = clamp(diffusivity / Math.exp(delta), SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper);
    const upperDiffusivity = clamp(diffusivity * Math.exp(delta), SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper);
    const lowerEval = evaluateFickResponseDetailed(lowerDiffusivity, timeSeconds, thicknessMeters, deadline);
    const upperEval = evaluateFickResponseDetailed(upperDiffusivity, timeSeconds, thicknessMeters, deadline);
    if (!lowerEval || !upperEval || !Number.isFinite(lowerEval.value) || !Number.isFinite(upperEval.value)) return null;

    const lowerLog = Math.log(lowerDiffusivity);
    const upperLog = Math.log(upperDiffusivity);
    const logSpan = upperLog - lowerLog;
    if (!Number.isFinite(logSpan) || logSpan <= 0) return null;

    const slope = (upperEval.value - lowerEval.value) / logSpan;
    const absSlope = Math.abs(slope);
    if (!Number.isFinite(absSlope) || absSlope <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    return 1 / absSlope;
  }

  function classifyInverseConfidence(rows, thicknessMeters, deadline) {
    const validRows = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row || row.synthetic || !Number.isFinite(row.time) || !Number.isFinite(row.normalized) || !Number.isFinite(row.diffusivity)) {
        if (row) {
          row.inverseSensitivity = null;
          row.lowConfidence = false;
        }
        continue;
      }
      const inverseSensitivity = computeInverseSensitivity(row.normalized, row.time, thicknessMeters, row.diffusivity, deadline);
      row.inverseSensitivity = inverseSensitivity;
      row.lowConfidence = !Number.isFinite(inverseSensitivity) || inverseSensitivity <= 0;
      if (Number.isFinite(inverseSensitivity) && inverseSensitivity > 0) {
        validRows.push(row);
      }
    }

    const values = validRows.map((row) => row.inverseSensitivity);
    if (values.length < 3) {
      validRows.forEach((row) => {
        row.lowConfidence = !Number.isFinite(row.inverseSensitivity) || row.inverseSensitivity <= 0;
      });
      return { available: false, threshold: null };
    }

    const logValues = values.map((value) => Math.log10(Math.max(value, Number.EPSILON)));
    const thresholdLog = median(logValues) + Math.max(iqr(logValues) * 0.35, 0.1);
    const threshold = Math.pow(10, thresholdLog);

    validRows.forEach((row) => {
      row.lowConfidence = !Number.isFinite(row.inverseSensitivity) || row.inverseSensitivity >= threshold;
    });

    return {
      available: true,
      threshold,
      median: Math.pow(10, median(logValues)),
      iqr: iqr(logValues),
    };
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
    syncFitToggle(dom, null);
    renderPlotEmpty(dom);
    state.plotHoverCache = null;
    hidePlotTooltip();
  }

  async function loadDebugDefaultInput(dom) {
    if (!dom || !dom.input || String(dom.input.value || "").trim()) return;
    try {
      const response = await fetch(encodeURI("./default val for debug.md"), { cache: "no-store" });
      if (!response.ok) return;
      const text = await response.text();
      const trimmed = text.trimEnd();
      if (!trimmed || String(dom.input.value || "").trim()) return;
      dom.input.value = trimmed;
      scheduleParse(dom, "paste");
    } catch {
      // Optional debug seed only.
    }
  }

  function renderEmptyTable(dom) {
    dom.previewBody.innerHTML = `<tr><td colspan="4" class="hpa-empty">No valid rows parsed yet.</td></tr>`;
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

    if (t0Offset < 0) {
      const shift = Math.abs(t0Offset);
      return sourceRows
        .filter((row) => Number.isFinite(row.time) && row.time >= shift)
        .map((row) => ({ ...row, time: row.time - shift }));
    }

    const shift = t0Offset;
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
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "hpa-data.csv");
      return;
    }

    if (type === "svg") {
      const svg = buildExportSvg(dom, analysis);
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "hpa-plot.svg");
      return;
    }

    if (type === "png") {
      const svg = buildExportSvg(dom, analysis);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const exportScale = Math.max(300 / 96, window.devicePixelRatio || 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(PLOT_WIDTH * exportScale);
        canvas.height = Math.round(PLOT_HEIGHT * exportScale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          alert("PNG export is not available in this browser.");
          return;
        }
        if ("imageSmoothingEnabled" in ctx) ctx.imageSmoothingEnabled = true;
        if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((output) => {
          URL.revokeObjectURL(url);
          if (output) downloadBlob(output, "hpa-plot.png");
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
    const liveGridMajor = dom.plot ? dom.plot.querySelector(".hpa-plot-grid-major") : null;
    const liveGridMinor = dom.plot ? dom.plot.querySelector(".hpa-plot-grid-minor") : null;
    const liveCurrentLine = dom.plot ? dom.plot.querySelector(".hpa-plot-line-current") : null;
    const liveDiffusionLine = dom.plot ? dom.plot.querySelector(".hpa-plot-line-diffusion") : null;
    const liveFitLine = dom.plot ? dom.plot.querySelector(".hpa-plot-line-fit") : null;
    const liveAxisLabel = dom.plot ? dom.plot.querySelector(".hpa-plot-axis-label") : null;
    const liveAxisTick = dom.plot ? dom.plot.querySelector(".hpa-plot-axis-tick") : null;
    const liveFrame = dom.plot ? dom.plot.querySelector(".hpa-plot-frame") : null;
    const liveLegendText = dom.plot ? dom.plot.querySelector(".hpa-plot-legend-group text") : null;
    const liveRefLine = dom.plot ? dom.plot.querySelector(".hpa-plot-ref-line") : null;
    const liveLowConfidenceLine = dom.plot ? dom.plot.querySelector(".hpa-plot-line-diffusion-edge, .hpa-plot-line-diffusion-hidden") : null;
    const lowConfidenceMode = dom.lowConfidence && dom.lowConfidence.value ? dom.lowConfidence.value : state.plotLowConfidenceMode;
    const rootStyle = getComputedStyle(document.documentElement);
    const bg = readStyleValue(liveFrame, "fill", rootStyle.getPropertyValue("--hpa-plot-bg").trim() || "#ffffff");
    const border = readStyleValue(liveFrame, "stroke", rootStyle.getPropertyValue("--hpa-plot-border").trim() || "#cfd8e3");
    const grid = readStyleValue(liveGridMajor || liveGridMinor, "stroke", rootStyle.getPropertyValue("--hpa-plot-grid").trim() || "#e2e8f0");
    const currentColor = readStyleValue(liveCurrentLine, "stroke", "#2563eb");
    const diffusionColor = readStyleValue(liveDiffusionLine, "stroke", "#111111");
    const diffusionEdgeColor = readStyleValue(liveLowConfidenceLine, "stroke", rootStyle.getPropertyValue("--hpa-plot-diffusion-edge-color").trim() || "#6b7280");
    const fitColor = readStyleValue(liveFitLine, "stroke", rootStyle.getPropertyValue("--hpa-plot-fit-color").trim() || "#7c3aed");
    const ink = readStyleValue(liveLegendText || liveAxisLabel, "fill", rootStyle.getPropertyValue("--hpa-plot-ink").trim() || "#111827");
    const muted = readStyleValue(liveAxisTick, "stroke", rootStyle.getPropertyValue("--hpa-plot-muted").trim() || "#4b5563");
    const gridMajorWidth = readStyleValue(liveGridMajor, "stroke-width", "0.8");
    const gridMajorOpacity = readStyleValue(liveGridMajor, "opacity", "0.95");
    const gridMinorWidth = readStyleValue(liveGridMinor, "stroke-width", "0.6");
    const gridMinorOpacity = readStyleValue(liveGridMinor, "opacity", "0.7");
    const gridMinorDasharray = readStyleValue(liveGridMinor, "stroke-dasharray", "");
    const lineWidth = readStyleValue(liveCurrentLine, "stroke-width", "2.4");
    const refLineWidth = readStyleValue(liveRefLine, "stroke-width", "1");
    const frameWidth = readStyleValue(liveFrame, "stroke-width", "0.5");
    style.textContent = `
      .hpa-plot-grid{stroke:${grid};stroke-linecap:butt;fill:none;shape-rendering:crispEdges}
      .hpa-plot-grid-major{stroke-width:${gridMajorWidth};opacity:${gridMajorOpacity}}
      .hpa-plot-grid-minor{stroke-width:${gridMinorWidth};opacity:${gridMinorOpacity}${gridMinorDasharray ? `;stroke-dasharray:${gridMinorDasharray}` : ""}}
      .hpa-plot-line{fill:none;stroke-width:${lineWidth};stroke-linejoin:round;stroke-linecap:butt}
      .hpa-plot-line-current{stroke:${currentColor}}
      .hpa-plot-line-diffusion{stroke:${diffusionColor}}
      .hpa-plot-line-fit{stroke:${fitColor}}
      .hpa-plot-line-diffusion-edge{stroke:${diffusionEdgeColor};opacity:1}
      .hpa-plot-line-diffusion-hidden{stroke:${diffusionEdgeColor};opacity:0}
      .hpa-plot-point{stroke:${bg};stroke-width:2}
      .hpa-plot-point-current{fill:${currentColor}}
      .hpa-plot-point-diffusion{fill:${diffusionColor}}
      .hpa-plot-axis-label,.hpa-plot-value,.hpa-plot-note,.hpa-plot-ref-label,.hpa-plot-legend-group{font-family:Arial,"Segoe UI",sans-serif}
      .hpa-plot-axis-label,.hpa-plot-value,.hpa-plot-note{font-size:11px;font-weight:400}
      .hpa-plot-axis-label tspan{font-family:inherit}
      .hpa-plot-legend-group{font-size:10.5px;font-weight:400}
      .hpa-plot-legend-group text{fill:${ink};font-weight:400}
      .hpa-plot-legend-low-confidence-line{stroke:${diffusionEdgeColor};opacity:1}
      .hpa-plot-legend-diffusion .hpa-plot-legend-line{stroke:${diffusionColor}}
      .hpa-plot-legend-current .hpa-plot-legend-line{stroke:${currentColor}}
      .hpa-plot-legend-fit .hpa-plot-legend-line{stroke:${fitColor}}
      .hpa-plot-ref-hitline{stroke:transparent;stroke-width:14;fill:none}
      .hpa-plot-axis-left,.hpa-plot-value-diffusion{fill:${diffusionColor}}
      .hpa-plot-axis-right,.hpa-plot-value-current{fill:${currentColor}}
      .hpa-plot-note{fill:${muted}}
      .hpa-plot-ref-line{stroke:${ink};fill:none}
      .hpa-plot-ref-label{fill:${ink}}
      .hpa-plot-ref-line{stroke-width:${refLineWidth};stroke-linecap:butt}
      .hpa-plot-ref-handle{stroke:${bg};stroke-width:2}
      .hpa-plot-ref-label{font-size:10px;font-weight:400;paint-order:normal;stroke:none}
      .hpa-plot-frame{fill:${bg};stroke:${border};stroke-width:${frameWidth};pointer-events:none}
      .hpa-plot-axis-tick{stroke:${muted};stroke-width:1;fill:none;shape-rendering:crispEdges}
      .hpa-plot-axis-tick-minor{stroke-width:0.75;opacity:0.8}
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
