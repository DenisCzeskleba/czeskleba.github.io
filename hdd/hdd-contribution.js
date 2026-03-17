/* Formspree submission handler with inline status updates. */
(function () {
  const form = document.getElementById("hydrogen-contribution-form");
  if (!form) return;

  const status = document.getElementById("hdd-contrib-status");
  const submitButton = form.querySelector("button[type='submit']");
  const rowsBody = document.getElementById("hdd-contrib-rows");
  const addRowButton = document.getElementById("hdd-add-row");
  const jsonField = document.getElementById("hdd-submission-json");
  const localModeToggle = document.getElementById("hdd-local-mode");
  const showJsonButton = document.getElementById("hdd-show-json");
  const copyJsonButton = document.getElementById("hdd-copy-json");
  const downloadJsonButton = document.getElementById("hdd-download-json");
  const jsonPreview = document.getElementById("hdd-json-preview");
  const authorTable = document.getElementById("hdd-authors-table");
  const authorAddButton = document.getElementById("hdd-author-add");
  const titleField = document.getElementById("contrib-title");

  function setStatus(message, tone) {
    if (!status) return;
    status.textContent = message;
    status.style.color = tone === "error" ? "#b91c1c" : "var(--text)";
  }

  function bindModelToggle(row) {
    const modelSelect = row.querySelector("[data-field='model_type']");
    if (!modelSelect) return;
    const toggleFields = () => {
      const value = modelSelect.value;
      row.querySelectorAll("[data-model]").forEach((field) => {
        field.style.display = field.dataset.model === value ? "block" : "none";
      });
    };
    modelSelect.addEventListener("change", toggleFields);
    toggleFields();
  }

  function setupCompositionGrid(grid, addButton) {
    if (!grid || !addButton) return;
    if (addButton.dataset.bound) return;
    addButton.dataset.bound = "true";
    addButton.addEventListener("click", () => addCompositionItem(grid, true));
    grid.addEventListener("click", (event) => {
      const removeButton = event.target.closest(".hdd-comp-remove");
      if (!removeButton) return;
      const item = removeButton.closest("[data-comp-item]");
      if (item) item.remove();
    });
  }

  function bindMicrostructureToggle(container, enabledSelector, microBlockSelector) {
    const enabled = container.querySelector(enabledSelector);
    const microBlock = container.querySelector(microBlockSelector);
    const microSelect = microBlock ? microBlock.querySelector("select") : null;
    const weldingSection = container.querySelector("[data-welding-section]");
    if (!enabled || !microBlock || !microSelect) return;
    const toggle = () => {
      const isYes = enabled.value === "yes";
      microBlock.style.display = isYes ? "block" : "none";
      if (weldingSection) {
        weldingSection.style.display = isYes ? "block" : "none";
        if (!isYes) {
          const weldingSelect = weldingSection.querySelector("#default-welding-process");
          if (weldingSelect) {
            weldingSelect.value = "";
            weldingSelect.required = false;
          }
          const weldingLayer = weldingSection.querySelector("#default-welding-layer");
          if (weldingLayer) {
            weldingLayer.value = "";
            weldingLayer.required = false;
          }
          const weldingT85 = weldingSection.querySelector("#default-welding-t85");
          if (weldingT85) {
            weldingT85.value = "";
            weldingT85.required = false;
          }
          const weldingNotes = weldingSection.querySelector("#default-welding-notes");
          if (weldingNotes) weldingNotes.value = "";
        } else {
          const weldingSelect = weldingSection.querySelector("#default-welding-process");
          if (weldingSelect) weldingSelect.required = true;
          const weldingLayer = weldingSection.querySelector("#default-welding-layer");
          if (weldingLayer) weldingLayer.required = true;
          const weldingT85 = weldingSection.querySelector("#default-welding-t85");
          if (weldingT85) weldingT85.required = true;
        }
      }
      microSelect.required = isYes;
      if (!isYes) {
        if (Array.from(microSelect.options).some((opt) => opt.value === "Base Material")) {
          microSelect.value = "Base Material";
        } else {
          microSelect.value = "";
        }
      }
    };
    enabled.addEventListener("change", toggle);
    toggle();
  }

  function bindCompositionGrid(root) {
    if (!root) return;
    const grid = root.querySelector(".hdd-comp-grid");
    const addButton = root.querySelector(".hdd-comp-add");
    setupCompositionGrid(grid, addButton);
  }

  function createRow() {
    const row = document.createElement("div");
    row.className = "hdd-contrib-row";
    row.innerHTML = `
      <div class="hdd-contrib-row-header">
        <strong>Data row</strong>
        <button type="button" class="hdd-remove-row primary">Remove row</button>
      </div>
      <div class="hdd-contrib-row-grid">
        <div>
          <label>Group name</label>
          <input type="text" data-field="group_name" required title="Comparison set (what varies). Example: Vanadium content. Leave empty if not needed." />
        </div>
        <div>
          <label>Series name</label>
          <input type="text" data-field="series_name" required title="Specific variant within the group. Example: V=0.1. Leave empty if not needed." />
        </div>
        <div>
          <label>Model type</label>
          <select data-field="model_type" required title="Pick the model for this row. Fields below update based on this choice. Leave empty if not needed.">
            <option value="single_point">Single point</option>
            <option value="arrhenius">Arrhenius</option>
            <option value="power">Power law</option>
          </select>
        </div>
        <div>
          <label>Diffusivity unit</label>
          <select data-field="diffusivity_unit" title="Diffusivity units. Leave empty if not needed.">
            <option value="mm^2/s" selected>mm²/s</option>
            <option value="cm^2/s">cm²/s</option>
            <option value="m^2/s">m²/s</option>
          </select>
        </div>
        <div>
          <label>Temperature unit</label>
          <select data-field="temperature_unit" title="Temperature units for this row. Leave empty if not needed.">
            <option value="K" selected>K</option>
            <option value="C">C</option>
          </select>
        </div>
        <div>
          <label>Tmin</label>
          <input type="number" step="any" data-field="tmin" required title="Minimum valid temperature. Leave empty if not needed." />
        </div>
        <div>
          <label>Tmax</label>
          <input type="number" step="any" data-field="tmax" required title="Maximum valid temperature. Leave empty if not needed." />
        </div>
        <div data-model="single_point">
          <label>Single point T</label>
          <input type="number" step="any" data-field="single_point_temperature" title="Single-point temperature. Leave empty if not needed." />
        </div>
        <div data-model="single_point">
          <label>Single point D</label>
          <input type="number" step="any" data-field="single_point_diffusivity" title="Single-point diffusivity. Leave empty if not needed." />
        </div>
        <div data-model="arrhenius">
          <label>Arrhenius D0</label>
          <input type="number" step="any" data-field="arrhenius_d0" title="Arrhenius D0. Leave empty if not needed." />
        </div>
        <div data-model="arrhenius">
          <label>Arrhenius Q</label>
          <input type="number" step="any" data-field="arrhenius_q" title="Arrhenius activation energy Q. Leave empty if not needed." />
        </div>
        <div data-model="power">
          <label>Power A</label>
          <input type="number" step="any" data-field="power_a" title="Power-law A. Leave empty if not needed." />
        </div>
        <div data-model="power">
          <label>Power n</label>
          <input type="number" step="any" data-field="power_n" title="Power-law exponent n. Leave empty if not needed." />
        </div>
        <div data-model="power">
          <label>Power input</label>
          <select data-field="power_input" title="Power-law input variable. Leave empty if not needed.">
            <option value="theta_C">theta_C</option>
            <option value="temperature_K">temperature_K</option>
          </select>
        </div>
      </div>
      <details class="hdd-contrib-override">
        <summary>Override defaults for this row (optional)</summary>
        <div class="hdd-contrib-row-grid">
          <div>
            <label>Material class</label>
            <select data-field="override_material_class" data-clone-from="default-material-class" title="Override material class for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Material grade</label>
            <select data-field="override_material_grade" data-clone-from="default-material-grade" title="Override material grade for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Welded</label>
            <select data-field="override_microstructure_enabled" data-default-from="default-microstructure-enabled" title="Set to yes for welded material.">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div data-microstructure-block>
            <label>Microstructure</label>
            <select data-field="override_material_microstructure" data-clone-from="default-material-microstructure" title="Override microstructure for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Phase</label>
            <select data-field="override_material_phase" data-clone-from="default-material-phase" title="Override phase for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Processing</label>
            <select data-field="override_material_processing" data-clone-from="default-material-processing" title="Override processing for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Additional Material Tags</label>
            <div data-field="override_material_tags" data-clone-from="default-material-tags"></div>
          </div>
          <div>
            <label>Material notes</label>
            <input type="text" data-field="override_material_notes" data-default-from="default-material-notes" title="Override material notes for this row. Leave empty to use defaults." />
          </div>
        </div>
        <p class="hdd-contrib-note">Composition overrides (wt%) - leave blank to use defaults.</p>
        <div class="hdd-comp-scroll">
        <div class="hdd-comp-grid">
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="C" readonly /></div>
            <input type="text" data-comp-value title="Override C in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Mn" readonly /></div>
            <input type="text" data-comp-value title="Override Mn in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Si" readonly /></div>
            <input type="text" data-comp-value title="Override Si in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Cr" readonly /></div>
            <input type="text" data-comp-value title="Override Cr in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Ni" readonly /></div>
            <input type="text" data-comp-value title="Override Ni in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Mo" readonly /></div>
            <input type="text" data-comp-value title="Override Mo in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="V" readonly /></div>
            <input type="text" data-comp-value title="Override V in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Nb" readonly /></div>
            <input type="text" data-comp-value title="Override Nb in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Ti" readonly /></div>
            <input type="text" data-comp-value title="Override Ti in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Al" readonly /></div>
            <input type="text" data-comp-value title="Override Al in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Cu" readonly /></div>
            <input type="text" data-comp-value title="Override Cu in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="P" readonly /></div>
            <input type="text" data-comp-value title="Override P in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="S" readonly /></div>
            <input type="text" data-comp-value title="Override S in wt%. Leave empty if not needed." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="N" readonly /></div>
            <input type="text" data-comp-value title="Override N in wt%. Leave empty if not needed." />
          </div>
        </div>
        <div class="hdd-comp-actions">
          <button type="button" class="hdd-comp-add">Add element</button>
        </div>
        <div>
          <label>Composition notes</label>
          <input type="text" data-field="override_material_composition_notes" title="Override composition notes for this row. Leave empty if not needed." />
        </div>
        <div class="hdd-contrib-row-grid">
          <div>
            <label>Measurement method</label>
            <select data-field="override_measurement_method" data-clone-from="default-method" title="Override measurement method for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Charging method</label>
            <select data-field="override_charging_method" data-clone-from="default-charging" title="Override charging method for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Calculation model</label>
            <select data-field="override_calculation_model" data-clone-from="default-calculation-model" title="Override calculation model for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Diffusivity type</label>
            <select data-field="override_reported_as" data-clone-from="default-reported-as" title="Override diffusivity type for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Sample geometry</label>
            <select data-field="override_sample_geometry" data-clone-from="default-sample-geometry" title="Override sample geometry for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Characteristic length (mm)</label>
            <input type="number" step="any" data-field="override_characteristic_length" data-default-from="default-characteristic-length" title="Override characteristic length in mm for this row. Leave empty to use defaults." />
          </div>
        </div>
        <div>
          <label>Conditions notes</label>
          <input type="text" data-field="override_conditions_notes" data-default-from="default-conditions-notes" title="Override conditions notes for this row. Leave empty to use defaults." />
        </div>
      </details>
    `;

    row.querySelector(".hdd-remove-row").addEventListener("click", () => {
      row.remove();
    });

    row.querySelectorAll("[data-clone-from]").forEach((field) => {
      const sourceId = field.getAttribute("data-clone-from");
      const source = document.getElementById(sourceId);
      if (!source) return;
      field.innerHTML = source.innerHTML;
      if (field.matches("select")) {
        if (source.value) {
          field.value = source.value;
        } else if (field.options.length) {
          field.selectedIndex = 0;
        }
      }
    });
    row.querySelectorAll("[data-default-from]").forEach((field) => {
      const sourceId = field.getAttribute("data-default-from");
      const source = document.getElementById(sourceId);
      if (!source) return;
      if (source.value) {
        field.value = source.value;
      }
    });

    bindModelToggle(row);
    bindCompositionGrid(row);
    bindMicrostructureToggle(
      row,
      "[data-field='override_microstructure_enabled']",
      "[data-microstructure-block]"
    );

    return row;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function applyDataOriginToMethods() {
    const origin = getValue("contrib-data-origin");
    const methodSelect = document.getElementById("default-method");
    if (!methodSelect) return;
    if (origin === "Literature review") {
      methodSelect.value = "Literature compilation";
      methodSelect.dispatchEvent(new Event("change"));
    }
  }

  function bindMethodChargingDefaults() {
    const methodSelect = document.getElementById("default-method");
    const chargingSelect = document.getElementById("default-charging");
    if (!methodSelect || !chargingSelect) return;

    const update = () => {
      if (methodSelect.value === "Electrochemical permeation") {
        chargingSelect.value = "devanathan_stachursky_cell";
        chargingSelect.dispatchEvent(new Event("change"));
      }
    };

    methodSelect.addEventListener("change", update);
    update();
  }

  function bindMeasurementConditionals() {
    const methodSelect = document.getElementById("default-method");
    const sections = Array.from(document.querySelectorAll("[data-method]"));
    if (!methodSelect || !sections.length) return;

    const update = () => {
      const method = methodSelect.value;
      sections.forEach((section) => {
        if (section.dataset.method === method) {
          section.classList.add("is-active");
        } else {
          section.classList.remove("is-active");
        }
      });
    };

    methodSelect.addEventListener("change", update);
    update();
  }

  function bindChargingConditionals() {
    const chargingSelect = document.getElementById("default-charging");
    const sections = Array.from(document.querySelectorAll("[data-charging]"));
    if (!chargingSelect || !sections.length) return;

    const update = () => {
      const method = chargingSelect.value;
      sections.forEach((section) => {
        if (section.dataset.charging === method) {
          section.classList.add("is-active");
        } else {
          section.classList.remove("is-active");
        }
      });
    };

    chargingSelect.addEventListener("change", update);
    update();
  }

  function bindSurfaceConditionals() {
    const coatedSelect = document.getElementById("default-surface-coated");
    const sections = Array.from(document.querySelectorAll("[data-surface-coated]"));
    if (!coatedSelect || !sections.length) return;

    const update = () => {
      const value = coatedSelect.value;
      sections.forEach((section) => {
        if (section.dataset.surfaceCoated === value) {
          section.classList.add("is-active");
        } else {
          section.classList.remove("is-active");
        }
      });
    };

    coatedSelect.addEventListener("change", update);
    update();
  }

  function getSelectedValues(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    if (el.matches("select")) {
      return Array.from(el.selectedOptions).map((opt) => opt.value).filter(Boolean);
    }
    return Array.from(el.querySelectorAll("input[type='checkbox']:checked"))
      .map((input) => input.value)
      .filter(Boolean);
  }

  function collectStudiedEffects() {
    const selects = Array.from(document.querySelectorAll("[data-studied-effect]"));
    const values = selects.map((select) => select.value).filter(Boolean);
    return Array.from(new Set(values));
  }

  function collectConditionalFields() {
    const method = getValue("default-method");
    if (!method) return null;

    const fields = {};
    const addIfAny = (key, values) => {
      const hasValue = Object.values(values).some((val) => val !== null && val !== "");
      if (hasValue) fields[key] = values;
    };

    if (method === "Thermal desorption (TDA / TDS)") {
      addIfAny("thermal_desorption_tda_tds", {
        heating_rate_k_per_min: parseNumber(getValue("cond-tda-heating-rate")),
        peak_analysis_method: getValue("cond-tda-peak-method") || null,
      });
    }

    if (method === "Gas permeation") {
      addIfAny("gas_permeation", {
        gas_detection_mode: getValue("cond-gas-detection") || null,
      });
    }

    if (method === "SIMS") {
      addIfAny("sims", {
        sims_type: getValue("cond-sims-type") || null,
      });
    }

    if (method === "Hot extraction (CGHE / GC)") {
      addIfAny("hot_extraction_cghe_gc", {
        extraction_temperature_c: parseNumber(getValue("cond-hot-extraction-temp")),
      });
    }

    if (method === "Isothermal effusion / degassing") {
      addIfAny("isothermal_effusion_degassing", {
        degassing_temperature_c: parseNumber(getValue("cond-degassing-temp")),
      });
    }

    const charging = getValue("default-charging");
    if (charging === "devanathan_stachursky_cell") {
      addIfAny("electrochemical_devanathan_stachursky_cell", {
        electrolyte_entry_side: getValue("cond-devanathan-entry-electrolyte") || null,
        electrolyte_exit_side: getValue("cond-devanathan-exit-electrolyte") || null,
        current_density_mA_per_mm2: parseNumber(getValue("cond-devanathan-current-density")),
        poison_additive: getValue("cond-devanathan-poison") || null,
      });
    }
    if (charging === "cathodic") {
      addIfAny("cathodic", {
        electrolyte: getValue("cond-cathodic-electrolyte") || null,
        current_density_mA_per_cm2: parseNumber(getValue("cond-cathodic-current")),
        poison_additive: getValue("cond-cathodic-poison") || null,
      });
    }
    if (charging === "electrochemical") {
      addIfAny("electrochemical", {
        electrolyte: getValue("cond-electrochemical-electrolyte") || null,
        control_mode: getValue("cond-electrochemical-control") || null,
        current_density_mA_per_cm2: parseNumber(getValue("cond-electrochemical-current")),
        applied_potential_v: parseNumber(getValue("cond-electrochemical-potential")),
        poison_additive: getValue("cond-electrochemical-poison") || null,
      });
    }
    if (charging === "high_pressure_hydrogen") {
      addIfAny("high_pressure_hydrogen", {
        pressure_bar: parseNumber(getValue("cond-high-pressure")),
        gas_composition: getValue("cond-high-gas") || null,
      });
    }
    if (charging === "gas_phase") {
      addIfAny("gas_phase", {
        gas_composition: getValue("cond-gas-phase-composition") || null,
        pressure_bar: parseNumber(getValue("cond-gas-phase-pressure")),
        gas_purity: getValue("cond-gas-phase-purity") || null,
      });
    }
    if (charging === "low_pressure_hydrogen") {
      addIfAny("low_pressure_hydrogen", {
        pressure_bar: parseNumber(getValue("cond-low-pressure")),
        gas_composition: getValue("cond-low-gas") || null,
      });
    }
    if (charging === "immersion_in_distilled_water") {
      addIfAny("immersion_in_distilled_water", {
        solution_notes: getValue("cond-distilled-water-notes") || null,
      });
    }

    return Object.keys(fields).length ? fields : null;
  }

  function parseNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function parseWtPercent(value) {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }

  function addCompositionItem(grid, removable) {
    if (!grid) return;
    const item = document.createElement("div");
    item.className = "hdd-comp-item";
    item.setAttribute("data-comp-item", "");
    item.innerHTML = `
      <div class="hdd-comp-element">
        <input type="text" data-comp-element placeholder="New" title="Element symbol or name. Leave empty if not needed." />
        ${
          removable
            ? '<button type="button" class="hdd-comp-remove" aria-label="Remove element">×</button>'
            : ""
        }
      </div>
      <input type="text" data-comp-value title="Element in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
    `;
    grid.appendChild(item);
  }

  function addAuthorRow(table) {
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const row = document.createElement("tr");
    row.setAttribute("data-author-row", "");
    row.innerHTML = `
      <td><input type="text" name="author_first[]" data-author-first required autocomplete="given-name" /></td>
      <td><input type="text" name="author_last[]" data-author-last required autocomplete="family-name" /></td>
      <td><input type="text" name="author_orcid[]" data-author-orcid autocomplete="off" pattern="^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$" /></td>
      <td><button type="button" class="hdd-author-remove" aria-label="Remove author">Remove</button></td>
    `;
    const removeButton = row.querySelector(".hdd-author-remove");
    if (removeButton) {
      removeButton.addEventListener("click", () => row.remove());
    }
    tbody.appendChild(row);
  }

  function autoGrowTextarea(textarea) {
    if (!textarea) return;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener("input", resize);
    window.addEventListener("resize", resize);
    resize();
  }

  function collectAuthors(table) {
    const authors = [];
    if (!table) return authors;
    table.querySelectorAll("[data-author-row]").forEach((row) => {
      const first = row.querySelector("[data-author-first]");
      const last = row.querySelector("[data-author-last]");
      const orcid = row.querySelector("[data-author-orcid]");
      const firstName = first ? first.value.trim() : "";
      const lastName = last ? last.value.trim() : "";
      const orcidValue = orcid ? orcid.value.trim() : "";
      if (!firstName && !lastName && !orcidValue) return;
      authors.push({
        first_name: firstName,
        last_name: lastName,
        orcid: orcidValue || null,
      });
    });
    return authors;
  }

  function collectCompositionFromTable(grid, notesValue) {
    const values = {};
    if (grid) {
      grid.querySelectorAll("[data-comp-item]").forEach((item) => {
        const elementInput = item.querySelector("[data-comp-element]");
        const valueInput = item.querySelector("[data-comp-value]");
        const element = elementInput ? elementInput.value.trim() : "";
        const value = valueInput ? parseWtPercent(valueInput.value.trim()) : null;
        if (element && value !== null) {
          values[element] = value;
        }
      });
    }

    const notes = notesValue ? notesValue.trim() : "";
    if (!Object.keys(values).length && !notes) {
      return null;
    }

    return {
      basis: "wt_pct",
      values,
      notes: notes || "not_reported",
    };
  }

  function buildRowOverrides(row, getRowValue) {
    const overrides = {};
    const material = {};
    const conditions = {};

    const defaults = {
      material_class: getValue("default-material-class"),
      material_grade: getValue("default-material-grade"),
      material_micro: getValue("default-microstructure-enabled") === "yes"
        ? getValue("default-material-microstructure")
        : "Base Material",
      micro_enabled: getValue("default-microstructure-enabled"),
      welded: getValue("default-microstructure-enabled") === "yes",
      material_phase: getValue("default-material-phase"),
      material_processing: getValue("default-material-processing"),
      material_tags: getSelectedValues("default-material-tags"),
      material_notes: getValue("default-material-notes"),
      measurement_method: getValue("default-method"),
      charging_method: getValue("default-charging"),
      charging_duration_h: parseNumber(getValue("default-charging-duration")),
      charging_temperature_c: parseNumber(getValue("default-charging-temperature")),
      calculation_model: getValue("default-calculation-model"),
      reported_as: getValue("default-reported-as"),
      sample_geometry: getValue("default-sample-geometry"),
      characteristic_length_mm: parseNumber(getValue("default-characteristic-length")),
      conditions_notes: getValue("default-conditions-notes"),
      welding_process: getValue("default-welding-process"),
      welding_layer: getValue("default-welding-layer"),
      welding_t85: getValue("default-welding-t85"),
      welding_notes: getValue("default-welding-notes"),
    };

    const materialClass = getRowValue("override_material_class");
    const materialGrade = getRowValue("override_material_grade");
    const microEnabled = getRowValue("override_microstructure_enabled");
    const materialMicro = getRowValue("override_material_microstructure");
    const materialPhase = getRowValue("override_material_phase");
    const materialProcessing = getRowValue("override_material_processing");
    const materialTags = getRowValue("override_material_tags");
    const materialNotes = getRowValue("override_material_notes");

    if (materialClass && materialClass !== defaults.material_class) material.class = materialClass;
    if (materialGrade && materialGrade !== defaults.material_grade) material.grade = materialGrade;
    if (microEnabled && (microEnabled === "yes") !== defaults.welded) {
      material.welded = { enabled: microEnabled === "yes" };
    }
    if (microEnabled === "yes") {
      if (materialMicro && materialMicro !== defaults.material_micro) {
        material.microstructure = materialMicro;
      }
    } else if (microEnabled === "no" && defaults.material_micro !== "Base Material") {
      material.microstructure = "Base Material";
    }
    if (materialPhase && materialPhase !== defaults.material_phase) material.phase = materialPhase;
    if (materialProcessing && materialProcessing !== defaults.material_processing) {
      material.processing = [materialProcessing];
    }
    if (materialTags.length) {
      const a = [...materialTags].sort();
      const b = [...defaults.material_tags].sort();
      const same = a.length === b.length && a.every((val, idx) => val === b[idx]);
      if (!same) material.tags = materialTags;
    }
    if (materialNotes && materialNotes !== defaults.material_notes) material.notes = materialNotes;

    const overrideTable = row.querySelector(".hdd-comp-grid");
    const notesInput = row.querySelector("[data-field='override_material_composition_notes']");
    const composition = collectCompositionFromTable(overrideTable, notesInput ? notesInput.value : "");
    if (composition) {
      material.chemical_composition = composition;
    }

    const method = getRowValue("override_measurement_method");
    const charging = getRowValue("override_charging_method");
    const calculationModel = getRowValue("override_calculation_model");
    const reportedAs = getRowValue("override_reported_as");
    const geometry = getRowValue("override_sample_geometry");
    const characteristicLength = parseNumber(getRowValue("override_characteristic_length"));
    const conditionsNotes = getRowValue("override_conditions_notes");
    if (method && method !== defaults.measurement_method) conditions.measurement_method = method;
    if (charging && charging !== defaults.charging_method) conditions.charging_method = charging;
    if (calculationModel && calculationModel !== defaults.calculation_model) {
      conditions.calculation_model = calculationModel;
    }
    if (reportedAs && reportedAs !== defaults.reported_as) {
      conditions.reported_as = reportedAs;
    }
    if (geometry && geometry !== defaults.sample_geometry) conditions.sample_geometry = geometry;
    if (characteristicLength !== null && characteristicLength !== defaults.characteristic_length_mm) {
      conditions.characteristic_length_mm = characteristicLength;
    }
    if (conditionsNotes && conditionsNotes !== defaults.conditions_notes) conditions.notes = conditionsNotes;

    if (Object.keys(material).length) overrides.material = material;
    if (Object.keys(conditions).length) overrides.conditions = conditions;

    return Object.keys(overrides).length ? overrides : null;
  }

  function collectComposition() {
    const table = document.getElementById("hdd-comp-grid");
    return collectCompositionFromTable(table, "");
  }

  function buildPayload() {
    const composition = collectComposition();
    const origin = getValue("contrib-data-origin");
    const measurementMethod =
      origin === "Literature review" ? "Literature compilation" : getValue("default-method");
    const conditionalFields = collectConditionalFields();
    const defaults = {
      material: {
        class: getValue("default-material-class") || null,
        grade: getValue("default-material-grade") || null,
        welded: null,
        microstructure: null,
        phase: getValue("default-material-phase") || null,
        processing: getValue("default-material-processing") ? [getValue("default-material-processing")] : [],
        tags: getSelectedValues("default-material-tags"),
        notes: getValue("default-material-notes") || null,
        chemical_composition: composition,
      },
      conditions: {
        measurement_method: measurementMethod || null,
        charging_method: getValue("default-charging") || null,
        charging_duration_h: parseNumber(getValue("default-charging-duration")),
        charging_temperature_c: parseNumber(getValue("default-charging-temperature")),
        calculation_model: getValue("default-calculation-model") || null,
        reported_as: getValue("default-reported-as") || "apparent",
        sample_geometry: getValue("default-sample-geometry") || null,
        characteristic_length_mm: parseNumber(getValue("default-characteristic-length")),
        conditional_fields: conditionalFields,
        surface_condition: getValue("default-surface-condition") || null,
        surface_finish_detail: getValue("default-surface-finish") || null,
        coated: getValue("default-surface-coated") === "yes",
        coating_type: getValue("default-coating-type") || null,
        coating_thickness_um: parseNumber(getValue("default-coating-thickness")),
        coating_notes: getValue("default-coating-notes") || null,
        notes: getValue("default-conditions-notes") || null,
      },
    };

    const microEnabled = getValue("default-microstructure-enabled") === "yes";
    defaults.material.microstructure = microEnabled
      ? getValue("default-material-microstructure") || null
      : "Base Material";
    defaults.material.welded = {
      enabled: microEnabled,
      process: getValue("default-welding-process") || null,
      layer: getValue("default-welding-layer") || null,
      t85: parseNumber(getValue("default-welding-t85")),
      notes: getValue("default-welding-notes") || null,
    };

    const source = {
      data_origin: getValue("contrib-data-origin"),
      data_notes: getValue("contrib-data-notes") || null,
      title: getValue("contrib-title"),
      authors: collectAuthors(authorTable),
      journal: getValue("contrib-journal"),
      year: getValue("contrib-year"),
      doi: getValue("contrib-doi"),
      oa_url: getValue("contrib-oa"),
      abstract: getValue("contrib-abstract"),
      volume: getValue("contrib-volume"),
      issue: getValue("contrib-issue"),
      pages: getValue("contrib-pages"),
      language: getValue("contrib-language"),
      studied_effects: collectStudiedEffects(),
      notes: getValue("contrib-notes") || null,
      contact: {
        name: getValue("contrib-name"),
        email: getValue("contrib-email"),
      },
    };

    const rows = [];
    rowsBody.querySelectorAll(".hdd-contrib-row").forEach((row) => {
      const getRowValue = (field) => {
        const input = row.querySelector(`[data-field='${field}']`);
        return input ? input.value.trim() : "";
      };
      const getRowSelected = (field) => {
        const input = row.querySelector(`[data-field='${field}']`);
        if (!input) return [];
        return Array.from(input.querySelectorAll("input[type='checkbox']:checked"))
          .map((cb) => cb.value)
          .filter(Boolean);
      };

      const rowData = {
        group_name: getRowValue("group_name"),
        series_name: getRowValue("series_name"),
        model_type: getRowValue("model_type"),
        reported_as: getRowValue("override_reported_as") || getValue("default-reported-as") || "apparent",
        diffusivity_unit: getRowValue("diffusivity_unit") || "mm^2/s",
        temperature_unit: getRowValue("temperature_unit") || "K",
        temperature_validity: {
          min: parseNumber(getRowValue("tmin")),
          max: parseNumber(getRowValue("tmax")),
        },
        model: {
          single_point: {
            temperature: parseNumber(getRowValue("single_point_temperature")),
            diffusivity: parseNumber(getRowValue("single_point_diffusivity")),
          },
          arrhenius: {
            D0: parseNumber(getRowValue("arrhenius_d0")),
            Q: parseNumber(getRowValue("arrhenius_q")),
          },
          power: {
            A: parseNumber(getRowValue("power_a")),
            n: parseNumber(getRowValue("power_n")),
            input: getRowValue("power_input") || "theta_C",
          },
        },
        overrides: buildRowOverrides(row, (field) => {
          if (field === "override_material_tags") {
            return getRowSelected(field);
          }
          return getRowValue(field);
        }),
      };

      rows.push(rowData);
    });

    return {
      source,
      defaults,
      rows,
    };
  }

  function validateRows(payload) {
    if (!payload.rows.length) {
      return "Please add at least one data row.";
    }

    if (!payload.source.authors.length) {
      return "Please add at least one author.";
    }

    for (let i = 0; i < payload.source.authors.length; i += 1) {
      const author = payload.source.authors[i];
      if (!author.first_name || !author.last_name) {
        return "Each author must include first and last name.";
      }
    }

    if (!payload.source.studied_effects || payload.source.studied_effects.length === 0) {
      return "Research focus: please select at least one item.";
    }

    if (payload.source.studied_effects.length > 3) {
      return "Research focus: please select up to 3 items.";
    }

    for (let i = 0; i < payload.rows.length; i += 1) {
      const row = payload.rows[i];
      const rowLabel = `Row ${i + 1}`;

      if (!row.group_name || !row.series_name || !row.model_type) {
        return `${rowLabel}: group name, series name, and model type are required.`;
      }

      if (row.temperature_validity.min === null || row.temperature_validity.max === null) {
        return `${rowLabel}: Tmin and Tmax are required.`;
      }

      if (row.temperature_validity.min > row.temperature_validity.max) {
        return `${rowLabel}: Tmin must be <= Tmax.`;
      }

      if (row.model_type === "single_point") {
        if (row.model.single_point.temperature === null || row.model.single_point.diffusivity === null) {
          return `${rowLabel}: single_point requires temperature and diffusivity.`;
        }
      }

      if (row.model_type === "arrhenius") {
        if (row.model.arrhenius.D0 === null || row.model.arrhenius.Q === null) {
          return `${rowLabel}: arrhenius requires D0 and Q.`;
        }
      }

      if (row.model_type === "power") {
        if (row.model.power.A === null || row.model.power.n === null) {
          return `${rowLabel}: power requires A and n.`;
        }
      }
    }

    return null;
  }

  function updateJsonPreview() {
    const payload = buildPayload();
    const rowError = validateRows(payload);
    if (rowError) {
      setStatus(rowError, "error");
      return null;
    }
    const jsonText = JSON.stringify(payload, null, 2);
    if (jsonField) {
      jsonField.value = jsonText;
    }
    if (jsonPreview) {
      jsonPreview.value = jsonText;
    }
    return jsonText;
  }

  function ensureInitialRow() {
    if (!rowsBody) return;
    if (!rowsBody.children.length) {
      rowsBody.appendChild(createRow());
    }
  }

  if (addRowButton) {
    addRowButton.addEventListener("click", () => {
      rowsBody.appendChild(createRow());
    });
  }

  ensureInitialRow();

  autoGrowTextarea(titleField);
  bindMicrostructureToggle(
    document,
    "#default-microstructure-enabled",
    "[data-microstructure-block]"
  );

  const defaultCompTable = document.getElementById("hdd-comp-grid");
  const defaultCompAdd = document.getElementById("hdd-comp-add");
  setupCompositionGrid(defaultCompTable, defaultCompAdd);

  if (authorTable && authorAddButton) {
    if (!authorAddButton.dataset.bound) {
      authorAddButton.dataset.bound = "true";
      authorAddButton.addEventListener("click", () => addAuthorRow(authorTable));
    }
    authorTable.querySelectorAll(".hdd-author-remove").forEach((button) => {
      button.addEventListener("click", (event) => {
        const row = event.target.closest("[data-author-row]");
        if (row) row.remove();
      });
    });
  }

  if (showJsonButton) {
    showJsonButton.addEventListener("click", () => {
      const jsonText = updateJsonPreview();
      if (jsonText) {
        setStatus("JSON preview updated.", "ok");
      }
    });
  }

  if (copyJsonButton) {
    copyJsonButton.addEventListener("click", async () => {
      const jsonText = updateJsonPreview();
      if (!jsonText) return;
      try {
        await navigator.clipboard.writeText(jsonText);
        setStatus("JSON copied to clipboard.", "ok");
      } catch (error) {
        setStatus("Copy failed. Please copy from the preview box.", "error");
      }
    });
  }

  if (downloadJsonButton) {
    downloadJsonButton.addEventListener("click", () => {
      const jsonText = updateJsonPreview();
      if (!jsonText) return;
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hdd-contribution.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus("JSON downloaded.", "ok");
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus("Please fill in the required fields.", "error");
      return;
    }

    const jsonText = updateJsonPreview();
    if (!jsonText) return;

    if (localModeToggle && localModeToggle.checked) {
      setStatus("Local test mode: JSON generated, no submission sent.", "ok");
      return;
    }

    if (submitButton) submitButton.disabled = true;
    setStatus("Sending...", "info");

    const data = new FormData(form);

    fetch(form.action, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          form.reset();
          setStatus("Thanks! Your submission has been received.", "ok");
          return;
        }
        return response.json().then((payload) => {
          const message =
            payload && payload.errors
              ? payload.errors.map((err) => err.message).join(" ")
              : "Something went wrong. Please try again.";
          throw new Error(message);
        });
      })
      .catch((error) => {
        setStatus(error.message || "Submission failed.", "error");
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });

  const dataOrigin = document.getElementById("contrib-data-origin");
  if (dataOrigin) {
    dataOrigin.addEventListener("change", applyDataOriginToMethods);
    applyDataOriginToMethods();
  }

  bindMethodChargingDefaults();
  bindMeasurementConditionals();
  bindChargingConditionals();
  bindSurfaceConditionals();
})();
