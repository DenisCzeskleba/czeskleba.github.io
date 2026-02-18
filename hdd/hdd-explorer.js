/* Hydrogen Diffusion Explorer scaffold
 * - Fetches (or mocks) grouped diffusivity data
 * - Provides sidebar filtering + plotting toggles
 * - Updates the chart placeholder + summary to mirror selections
 *
 * Replace SAMPLE_DATA + renderChartPlaceholder with the real evaluator
 * once the JSON bundle from plot_diffusivity_groups.py is available.
 */
(function () {
  const mount = document.getElementById("hydrogen-explorer-app");
  if (!mount) return;

  const endpoint =
    mount.getAttribute("data-endpoint") ||
    "/data/hydrogen-diffusivity-groups.json";

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

  const SAMPLE_DATA = {
    generated_at: new Date().toISOString(),
    groups: [
      {
        id: "boellinghaus_1995_scatterband",
        label: "Boellinghaus 1995 scatter band",
        source: "Boellinghaus et al., 1995",
        material: "X70 steel",
        temperature_range_K: [850, 1200],
        sampleCount: 3,
      },
      {
        id: "darken_1948_alpha_iron",
        label: "Darken 1948 alpha-Fe",
        source: "Darken & Smith, 1948",
        material: "Alpha iron",
        temperature_range_K: [600, 900],
        sampleCount: 2,
      },
      {
        id: "kiuchi_1983_bcc",
        label: "Kiuchi 1983 BCC single point",
        source: "Kiuchi & McLellan, 1983",
        material: "BCC Fe",
        temperature_range_K: [300, 400],
        sampleCount: 1,
      },
    ],
  };

  const state = {
    groups: [],
    selected: new Set(),
    units: "K",
    envelope: true,
    numbering: true,
    tempMin: null,
    tempMax: null,
  };

  initialize();

  async function initialize() {
    setShellState("loading");
    setStatus(`Loading dataset from ${endpoint}...`, "info");

    const payload = await fetchDataset(endpoint);
    const normalized = normalizeGroups(payload);

    if (!normalized.length) {
      state.groups = SAMPLE_DATA.groups;
      setStatus(
        "Using placeholder dataset – publish /data/hydrogen-diffusivity-groups.json to replace this stub.",
        "warn"
      );
    } else {
      state.groups = normalized;
      const repoLabel = payload?.source_repo
        ? ` · ${payload.source_repo}`
        : "";
      setStatus(`Loaded ${state.groups.length} groups${repoLabel}.`, "ok");
    }

    dom.search?.addEventListener("input", applyFilter);

    dom.list?.addEventListener("change", (event) => {
      if (event.target && event.target.matches("input[type='checkbox']")) {
        const id = event.target.value;
        if (event.target.checked) {
          state.selected.add(id);
        } else {
          state.selected.delete(id);
        }
      }
      updateSummary();
    });

    dom.unitButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.units = btn.dataset.unit === "C" ? "C" : "K";
        dom.unitButtons.forEach((b) =>
          b.classList.toggle("is-active", b === btn)
        );
        updateChartPlaceholder();
      });
    });

    dom.envelope?.addEventListener("change", () => {
      state.envelope = dom.envelope.checked;
      updateChartPlaceholder();
    });

    dom.numbering?.addEventListener("change", () => {
      state.numbering = dom.numbering.checked;
      updateChartPlaceholder();
    });

    [dom.tempMin, dom.tempMax].forEach((input) => {
      input?.addEventListener("input", () => {
        state.tempMin = parseNumber(dom.tempMin?.value);
        state.tempMax = parseNumber(dom.tempMax?.value);
        updateChartPlaceholder();
      });
    });

    dom.plotButton?.addEventListener("click", () => {
      updateChartPlaceholder(true);
    });

    dom.downloadButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.download?.toUpperCase();
        alert(
          `Download placeholder: ${target || "file"}. Wire this button to the real export once the evaluator ships.`
        );
      });
    });

    renderGroupList(state.groups);
    updateSummary();
    updateChartPlaceholder();
    setShellState("ready");
  }

  async function fetchDataset(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("HDD explorer: falling back to sample data.", error);
      return null;
    }
  }

  function normalizeGroups(payload) {
    if (!payload || !Array.isArray(payload.groups)) return [];
    return payload.groups.map((group, index) => {
      const range =
        group.temperature_range_K ||
        group.temperature_range ||
        group.valid_temperature_K ||
        [];
      const [minK, maxK] = normalizeRange(range);
      const sampleCount = Array.isArray(group.samples)
        ? group.samples.length
        : group.sampleCount || group.curves?.length || 0;
      return {
        id: group.group_id || group.id || `group-${index + 1}`,
        label: group.label || group.name || group.group_id || `Group ${index}`,
        source:
          group.source ||
          group.source_id ||
          group.entry_id ||
          payload.source_repo ||
          "Unspecified source",
        material: group.material || group.materials?.join(", "),
        temperature_range_K: [minK, maxK].filter((v) => typeof v === "number"),
        sampleCount,
      };
    });
  }

  function normalizeRange(range) {
    if (!Array.isArray(range) || range.length === 0) return [null, null];
    if (range.length === 2) return range.map(parseNumber);
    return [parseNumber(range[0]), parseNumber(range[range.length - 1])];
  }

  function parseNumber(value) {
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

  function applyFilter() {
    const query = dom.search?.value.trim().toLowerCase() || "";
    if (!dom.list) return;
    if (!query) {
      renderGroupList(state.groups);
      return;
    }
    const filtered = state.groups.filter((group) => {
      const haystack = [
        group.label,
        group.id,
        group.source,
        group.material,
      ]
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
      dom.list.innerHTML =
        '<p class="hdd-empty">No groups match this filter.</p>';
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
            ${
              group.temperature_range_K?.length === 2
                ? ` · ${group.temperature_range_K[0]}–${group.temperature_range_K[1]} K`
                : ""
            }
            ${
              group.material
                ? ` · ${group.material.replace(/,+/g, ", ")}`
                : ""
            }
            ${group.sampleCount ? ` · ${group.sampleCount} curve(s)` : ""}
          </div>
        </div>
      `;
      fragment.appendChild(option);
    });
    dom.list.appendChild(fragment);
  }

  function updateSummary() {
    if (!dom.summary) return;
    if (!state.selected.size) {
      dom.summary.innerHTML =
        "<strong>No groups selected.</strong><p>Use the checklist to the left to choose datasets for plotting.</p>";
      return;
    }
    const selectedGroups = state.groups.filter((group) =>
      state.selected.has(group.id)
    );
    const items = selectedGroups
      .map((group) => {
        const range =
          group.temperature_range_K?.length === 2
            ? `${group.temperature_range_K[0]}–${group.temperature_range_K[1]} K`
            : "range unknown";
        return `<li><strong>${group.label}</strong> · ${range} · ${
          group.sampleCount || 0
        } sample(s)</li>`;
      })
      .join("");
    dom.summary.innerHTML = `
      <strong>${state.selected.size} group${
      state.selected.size > 1 ? "s" : ""
    } selected.</strong>
      <ul>${items}</ul>
    `;
  }

  function updateChartPlaceholder(force) {
    if (!dom.chart) return;
    if (!state.selected.size) {
      dom.chart.innerHTML = `
        <div>
          <p>Select one or more groups to preview logarithmic diffusivity curves.</p>
          <p style="font-size:0.9rem;color:#777;">Arrhenius / power samples will render here with Kelvin/°C toggles and envelope shading.</p>
        </div>
      `;
      return;
    }
    const unitsLabel = state.units === "C" ? "degrees Celsius" : "Kelvin";
    const envelopeLabel = state.envelope ? "with" : "without";
    const numberingLabel = state.numbering ? "showing" : "hiding";
    const tempClamp =
      state.tempMin || state.tempMax
        ? `Clamped to ${
            state.tempMin ? `${state.tempMin} K` : "dataset min"
          } – ${state.tempMax ? `${state.tempMax} K` : "dataset max"}.`
        : "Using each model’s native range.";
    const selectedGroups = state.groups.filter((group) =>
      state.selected.has(group.id)
    );
    const items = selectedGroups
      .map((group) => {
        const range =
          group.temperature_range_K?.length === 2
            ? `${group.temperature_range_K[0]}–${group.temperature_range_K[1]} K`
            : "range unknown";
        return `<li>${group.label} (${range})</li>`;
      })
      .join("");
    dom.chart.innerHTML = `
      <div>
        <p>Preparing ${state.selected.size} group${
      state.selected.size > 1 ? "s" : ""
    } in ${unitsLabel}, ${envelopeLabel} envelope fill and ${numberingLabel} numbered labels.</p>
        <p style="font-size:0.9rem;color:#777;">${tempClamp}</p>
        <ul>${items}</ul>
        <p style="font-size:0.85rem;color:#999;">${
          force
            ? "Rendering soon..."
            : 'Press "Plot selected curves" to refresh the preview once you are happy with the selection.'
        }</p>
      </div>
    `;
  }

})();
