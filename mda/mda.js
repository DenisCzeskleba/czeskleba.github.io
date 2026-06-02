(function () {
  const DELIMITER_CANDIDATES = [
    { id: "tab", label: "tab", regex: /\t/ },
    { id: "semicolon", label: "semicolon", regex: /;/ },
    { id: "comma", label: "comma", regex: /,/ },
    { id: "whitespace", label: "whitespace", regex: /\s+/ },
  ];

  const DECIMAL_OPTIONS = ["auto", ".", ","];

  const state = {
    parseTimer: null,
    currentFileName: null,
    currentParse: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const root = document.getElementById("mda-app");
    if (!root) return;

    const header = document.querySelector("header");
    if (header && !header.querySelector(".mda-header-brand")) {
      const actions = header.querySelector(".header-actions");
      if (actions) {
        const brand = document.createElement("div");
        brand.className = "mda-header-brand";
        brand.setAttribute("aria-label", "Membrane Diffusion Analyzer");
        brand.innerHTML = `
          <img class="mda-header-brand-image" src="/assets/Membrane Diffusion Analyser.png" alt="Membrane Diffusion Analyzer" decoding="async" loading="lazy" />
          <span class="mda-header-brand-text">Membrane Diffusion Analyzer</span>
        `;
        header.insertBefore(brand, actions);
      }
    }

    const dom = {
      root,
      input: document.getElementById("mda-input"),
      file: document.getElementById("mda-file"),
      decimal: document.getElementById("mda-decimal"),
      status: document.getElementById("mda-status"),
      issues: document.getElementById("mda-issues"),
      rowCount: document.getElementById("mda-row-count"),
      decimalCard: document.getElementById("mda-decimal-card"),
      delimiterCard: document.getElementById("mda-delimiter-card"),
      qualityCard: document.getElementById("mda-quality-card"),
      fileCard: document.getElementById("mda-file-card"),
      previewBody: document.getElementById("mda-preview-body"),
      helpDrawer: document.getElementById("mda-help-drawer"),
      helpOpenButtons: root.querySelectorAll("[data-action='open-help']"),
      helpCloseButtons: document.querySelectorAll("[data-action='close-help']"),
      clearButton: document.getElementById("mda-clear"),
    };

    if (!dom.input || !dom.file || !dom.decimal || !dom.status || !dom.issues || !dom.previewBody) {
      return;
    }

    dom.helpOpenButtons.forEach((button) => {
      button.addEventListener("click", () => openDrawer(dom.helpDrawer));
    });
    dom.helpCloseButtons.forEach((button) => {
      button.addEventListener("click", () => closeDrawer(dom.helpDrawer));
    });
    dom.helpDrawer?.addEventListener("click", (event) => {
      if (event.target === dom.helpDrawer.querySelector(".mda-help-backdrop")) {
        closeDrawer(dom.helpDrawer);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer(dom.helpDrawer);
    });

    dom.input.addEventListener("input", () => scheduleParse(dom, "paste"));
    dom.input.addEventListener("change", () => scheduleParse(dom, "paste"));
    dom.file.addEventListener("change", () => handleFileSelection(dom));
    dom.decimal.addEventListener("change", () => scheduleParse(dom, "selection"));
    dom.clearButton?.addEventListener("click", () => {
      dom.input.value = "";
      dom.file.value = "";
      state.currentFileName = null;
      state.currentParse = null;
      dom.decimal.value = "auto";
      renderEmpty(dom, "Paste or upload cleaned data to begin.");
    });

    renderEmpty(dom, "Paste or upload cleaned data to begin.");
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
    };
    reader.readAsText(file);
  }

  function parseAndRender(dom, source) {
    const raw = (dom.input.value || "").trim();
    if (!raw) {
      state.currentParse = null;
      renderEmpty(dom, "Paste or upload cleaned data to begin.");
      return;
    }

    const manualDecimal = dom.decimal.value;
    let config = null;

    if (source === "selection" && DECIMAL_OPTIONS.includes(manualDecimal) && manualDecimal !== "auto") {
      config = bestConfigForRaw(raw, manualDecimal);
    } else {
      config = bestConfigForRaw(raw, null);
    }

    if (!config) {
      state.currentParse = null;
      setStatus(dom, "No valid two-column table could be detected.", "error");
      setIssues(dom, buildFailureMessages(raw, manualDecimal));
      dom.previewBody.innerHTML = `<tr><td colspan="3" class="mda-empty">No normalized rows available yet.</td></tr>`;
      updateSummary(dom, null, null, null, 0);
      return;
    }

    if (source !== "selection") {
      dom.decimal.value = config.decimalSeparator;
    }

    state.currentParse = config;
    renderParsed(dom, config);
  }

  function bestConfigForRaw(raw, forcedDecimal) {
    const decimalCandidates = forcedDecimal ? [forcedDecimal] : [".", ","];
    let best = null;

    for (const decimalSeparator of decimalCandidates) {
      for (const delimiter of DELIMITER_CANDIDATES) {
        const attempt = parseWithConfig(raw, decimalSeparator, delimiter);
        if (!attempt) continue;
        if (!best || isBetterAttempt(attempt, best)) {
          best = attempt;
        }
      }
    }

    return best;
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

    const rows = [];
    const errors = [];
    const parsedLines = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const parts = splitLine(line, delimiter.id);
      if (parts.length !== 2) {
        errors.push({
          lineNumber,
          message: `Line ${lineNumber}: expected exactly 2 columns, found ${parts.length}.`,
        });
        parsedLines.push({ lineNumber, valid: false });
        return;
      }

      const time = parseStrictNumber(parts[0], decimalSeparator);
      const signal = parseStrictNumber(parts[1], decimalSeparator);

      if (time == null || signal == null) {
        errors.push({
          lineNumber,
          message: `Line ${lineNumber}: not a valid numeric pair for the selected decimal separator.`,
        });
        parsedLines.push({ lineNumber, valid: false });
        return;
      }

      rows.push({
        lineNumber,
        time,
        signal,
      });
      parsedLines.push({ lineNumber, valid: true });
    });

    if (!rows.length) {
      return {
        rows,
        errors,
        parsedLines,
        decimalSeparator,
        delimiter,
        validLineCount: 0,
        headerLikely: looksLikeHeader(lines[0]),
      };
    }

    return {
      rows,
      errors,
      parsedLines,
      decimalSeparator,
      delimiter,
      validLineCount: rows.length,
      headerLikely: looksLikeHeader(lines[0]) && rows.length < lines.length,
    };
  }

  function splitLine(line, delimiterId) {
    if (delimiterId === "whitespace") {
      return line.split(/\s+/).filter(Boolean);
    }
    const delimiter = DELIMITER_CANDIDATES.find((item) => item.id === delimiterId);
    return delimiter ? line.split(delimiter.regex) : [line];
  }

  function parseStrictNumber(raw, decimalSeparator) {
    const text = raw.trim();
    if (!text) return null;

    if (decimalSeparator === ".") {
      if (text.includes(",")) return null;
    } else if (decimalSeparator === ",") {
      if (text.includes(".")) return null;
    }

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

  function buildFailureMessages(raw, decimalSeparator) {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const messages = [];

    if (lines.length && looksLikeHeader(lines[0])) {
      messages.push("Header rows are not allowed. Paste only data lines.");
    }

    const separatorHint =
      decimalSeparator === "."
        ? "dot"
        : decimalSeparator === ","
          ? "comma"
          : "auto-detection";
    messages.push(`Use exactly two numeric values per line. The current decimal setting is ${separatorHint}.`);

    const sample = lines.slice(0, 3);
    sample.forEach((line, index) => {
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.includes(";")
          ? line.split(";")
          : line.split(/\s+/);
      if (parts.length > 2) {
        messages.push(`Line ${index + 1}: too many columns were found.`);
      }
    });

    if (!messages.length) {
      messages.push("Could not find a clean two-column table in the pasted text.");
    }

    return messages;
  }

  function renderParsed(dom, config) {
    setStatus(
      dom,
      `Loaded ${config.rows.length} rows. Decimal separator: ${config.decimalSeparator === "," ? "comma" : "dot"}. Column split: ${config.delimiter.label}.`,
      "ok",
    );

    const warnings = buildWarnings(config);
    setIssues(dom, warnings.length ? warnings : ["No immediate format issues detected."]);

    updateSummary(dom, config.rows.length, config.decimalSeparator, config.delimiter.label, warnings.length);
    renderPreview(dom, config.rows);
  }

  function buildWarnings(config) {
    const warnings = [];
    if (config.headerLikely) {
      warnings.push("A header row looks likely, but headers are not accepted in this first version.");
    }
    if (config.rows.length < 5) {
      warnings.push("Very few valid rows were found. Classical evaluation and plateau checks may be unstable.");
    }

    const times = config.rows.map((row) => row.time);
    for (let i = 1; i < times.length; i += 1) {
      if (times[i] <= times[i - 1]) {
        warnings.push("Time is not strictly increasing. The first analysis pass expects a monotonic time axis.");
        break;
      }
    }

    const decimalLabel = config.decimalSeparator === "," ? "comma decimals" : "dot decimals";
    warnings.push(`Detected ${decimalLabel}. If this is wrong, use the dropdown to override it.`);
    return warnings;
  }

  function updateSummary(dom, rowCount, decimalSeparator, delimiterLabel, warningCount) {
    if (dom.rowCount) {
      dom.rowCount.textContent = rowCount == null ? "0 rows" : `${rowCount} rows`;
    }

    const cards = {
      "mda-row-card": rowCount == null ? "No data" : `${rowCount} rows`,
      "mda-decimal-card": decimalSeparator == null ? "Not detected" : decimalSeparator === "," ? "Comma" : "Dot",
      "mda-delimiter-card": delimiterLabel == null ? "Not detected" : capitalize(delimiterLabel),
      "mda-quality-card": warningCount ? `${warningCount} note${warningCount === 1 ? "" : "s"}` : "OK",
    };

    Object.entries(cards).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  function renderPreview(dom, rows) {
    const previewRows = rows.slice(0, 12);
    if (!previewRows.length) {
      dom.previewBody.innerHTML = `<tr><td colspan="3" class="mda-empty">No valid rows parsed yet.</td></tr>`;
      return;
    }

    dom.previewBody.innerHTML = previewRows
      .map((row, index) => {
        const rowNo = index + 1;
        return `
          <tr>
            <td>${rowNo}</td>
            <td>${formatNumber(row.time)}</td>
            <td>${formatNumber(row.signal)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const text = Number(value.toPrecision(12)).toString();
    return text;
  }

  function setStatus(dom, message, tone) {
    dom.status.textContent = message;
    dom.status.classList.remove("is-error", "is-ok");
    if (tone === "error") dom.status.classList.add("is-error");
    if (tone === "ok") dom.status.classList.add("is-ok");
  }

  function setIssues(dom, messages) {
    const items = Array.isArray(messages) ? messages : [String(messages)];
    dom.issues.innerHTML = items
      .filter(Boolean)
      .map((message) => `<li>${escapeHtml(message)}</li>`)
      .join("");
  }

  function renderEmpty(dom, message) {
    setStatus(dom, message, "");
    dom.previewBody.innerHTML = `<tr><td colspan="3" class="mda-empty">${escapeHtml(message)}</td></tr>`;
    updateSummary(dom, 0, null, null, 0);
    setIssues(dom, []);
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
