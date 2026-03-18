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

  function stampInitialValues(container) {
    if (!container) return;
    container.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.matches("input[type='checkbox'], input[type='radio']")) {
        el.dataset.initialChecked = el.checked ? "1" : "0";
        return;
      }
      el.dataset.initialValue = el.value;
    });
  }

  function elementHasUserValue(el) {
    if (!el) return false;
    if (el.matches("input[type='checkbox'], input[type='radio']")) {
      if (el.dataset.initialChecked !== undefined) {
        return el.checked !== (el.dataset.initialChecked === "1");
      }
      return el.checked;
    }
    if (el.matches("textarea, input")) {
      if (el.dataset.initialValue !== undefined) {
        return el.value !== el.dataset.initialValue;
      }
      return el.value.trim() !== "";
    }
    if (el.matches("select")) {
      if (el.dataset.initialValue !== undefined) {
        return el.value !== el.dataset.initialValue;
      }
      const sourceId = el.getAttribute("data-default-from") || el.getAttribute("data-clone-from");
      if (sourceId) {
        const source = document.getElementById(sourceId);
        if (source) {
          return el.value !== source.value;
        }
      }
      const field = el.getAttribute("data-field");
      if (field === "model_type" || field === "diffusivity_unit" || field === "temperature_unit") {
        return false;
      }
      return el.value !== "";
    }
    return false;
  }

  function containerHasUserData(container) {
    if (!container) return false;
    const elements = container.querySelectorAll("input, textarea, select");
    return Array.from(elements).some((el) => elementHasUserValue(el));
  }

  function confirmIfHasData(container, message) {
    if (!containerHasUserData(container)) return true;
    return window.confirm(message);
  }

  const overrideFieldDefs = [
    { key: "override_material_class", label: "Material class", cat: "Material", sub: "Class & grade", selector: "[data-field='override_material_class']" },
    { key: "override_material_grade", label: "Material grade", cat: "Material", sub: "Class & grade", selector: "[data-field='override_material_grade']" },
    { key: "override_microstructure_enabled", label: "Welded", cat: "Material", sub: "Microstructure", selector: "[data-field='override_microstructure_enabled']" },
    { key: "override_material_microstructure", label: "Microstructure", cat: "Material", sub: "Microstructure", selector: "[data-field='override_material_microstructure']", depends: ["override_microstructure_enabled"] },
    { key: "override_material_phase", label: "Phase", cat: "Material", sub: "Phase & processing", selector: "[data-field='override_material_phase']" },
    { key: "override_material_processing", label: "Processing", cat: "Material", sub: "Phase & processing", selector: "[data-field='override_material_processing']" },
    { key: "override_material_tags", label: "Additional Material Tags", cat: "Material", sub: "Tags", selector: "[data-field='override_material_tags']" },
    { key: "override_composition_values", label: "Chemical composition", cat: "Material", sub: "Composition", getWrapper: "composition" },
    { key: "override_material_composition_notes", label: "Composition notes", cat: "Material", sub: "Composition", selector: "[data-field='override_material_composition_notes']" },
    { key: "override_material_notes", label: "Material notes", cat: "Material", sub: "Notes", selector: "[data-field='override_material_notes']" },
    { key: "override_row_notes", label: "Row notes", cat: "Row notes", sub: "General", create: { type: "textarea", field: "override_row_notes", rows: 3 } },
    { key: "override_measurement_method", label: "Measurement method", cat: "Hydrogen measurement", sub: "Method", selector: "[data-field='override_measurement_method']" },
    { key: "override_charging_method", label: "Charging method", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_charging_method", sourceId: "default-charging" } },
    { key: "override_charging_duration", label: "Charging duration [h]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_charging_duration", defaultFrom: "default-charging-duration" } },
    { key: "override_charging_temperature", label: "Charging temperature [°C]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_charging_temperature", defaultFrom: "default-charging-temperature" } },
    { key: "override_calculation_model", label: "Calculation model", cat: "Hydrogen measurement", sub: "Calculation", selector: "[data-field='override_calculation_model']" },
    { key: "override_reported_as", label: "Diffusivity type", cat: "Hydrogen measurement", sub: "Calculation", selector: "[data-field='override_reported_as']" },
    { key: "override_sample_geometry", label: "Sample geometry", cat: "Hydrogen measurement", sub: "Geometry", selector: "[data-field='override_sample_geometry']" },
    { key: "override_characteristic_length", label: "Characteristic length [mm]", cat: "Hydrogen measurement", sub: "Geometry", selector: "[data-field='override_characteristic_length']" },
    { key: "override_conditions_notes", label: "Measurement notes", cat: "Hydrogen measurement", sub: "Notes", selector: "[data-field='override_conditions_notes']" },
    { key: "override_cond_tda_heating_rate", label: "Heating rate [°C/min]", cat: "Hydrogen measurement", sub: "Method details", create: { type: "number", field: "override_cond_tda_heating_rate" }, depends: ["override_measurement_method"] },
    { key: "override_cond_tda_peak_method", label: "Peak analysis method", cat: "Hydrogen measurement", sub: "Method details", create: { type: "select", field: "override_cond_tda_peak_method", sourceId: "cond-tda-peak-method" }, depends: ["override_measurement_method"] },
    { key: "override_cond_gas_detection", label: "Gas detection mode", cat: "Hydrogen measurement", sub: "Method details", create: { type: "select", field: "override_cond_gas_detection", sourceId: "cond-gas-detection" }, depends: ["override_measurement_method"] },
    { key: "override_cond_sims_type", label: "SIMS type", cat: "Hydrogen measurement", sub: "Method details", create: { type: "select", field: "override_cond_sims_type", sourceId: "cond-sims-type" }, depends: ["override_measurement_method"] },
    { key: "override_cond_hot_extraction_temp", label: "Extraction temperature [°C]", cat: "Hydrogen measurement", sub: "Method details", create: { type: "number", field: "override_cond_hot_extraction_temp" }, depends: ["override_measurement_method"] },
    { key: "override_cond_degassing_temp", label: "Degassing temperature [°C]", cat: "Hydrogen measurement", sub: "Method details", create: { type: "number", field: "override_cond_degassing_temp" }, depends: ["override_measurement_method"] },
    { key: "override_cond_dev_entry_electrolyte", label: "Electrolyte (entry side)", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_dev_entry_electrolyte", sourceId: "cond-devanathan-entry-electrolyte" }, depends: ["override_charging_method"] },
    { key: "override_cond_dev_exit_electrolyte", label: "Electrolyte (exit side)", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_dev_exit_electrolyte", sourceId: "cond-devanathan-exit-electrolyte" }, depends: ["override_charging_method"] },
    { key: "override_cond_dev_current_density", label: "Current density [mA/mm²]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_dev_current_density" }, depends: ["override_charging_method"] },
    { key: "override_cond_dev_poison", label: "Poison additive", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_dev_poison", sourceId: "cond-devanathan-poison" }, depends: ["override_charging_method"] },
    { key: "override_cond_cathodic_electrolyte", label: "Electrolyte", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_cathodic_electrolyte", sourceId: "cond-cathodic-electrolyte" }, depends: ["override_charging_method"] },
    { key: "override_cond_cathodic_current", label: "Current density [mA/cm²]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_cathodic_current" }, depends: ["override_charging_method"] },
    { key: "override_cond_cathodic_poison", label: "Poison additive", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_cathodic_poison", sourceId: "cond-cathodic-poison" }, depends: ["override_charging_method"] },
    { key: "override_cond_electrochemical_electrolyte", label: "Electrolyte", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_electrochemical_electrolyte", sourceId: "cond-electrochemical-electrolyte" }, depends: ["override_charging_method"] },
    { key: "override_cond_electrochemical_control", label: "Control mode", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_electrochemical_control", sourceId: "cond-electrochemical-control" }, depends: ["override_charging_method"] },
    { key: "override_cond_electrochemical_current", label: "Current density [mA/cm²]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_electrochemical_current" }, depends: ["override_charging_method"] },
    { key: "override_cond_electrochemical_potential", label: "Applied potential [V]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_electrochemical_potential" }, depends: ["override_charging_method"] },
    { key: "override_cond_electrochemical_poison", label: "Poison additive", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "select", field: "override_cond_electrochemical_poison", sourceId: "cond-electrochemical-poison" }, depends: ["override_charging_method"] },
    { key: "override_cond_high_pressure", label: "Pressure [bar]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_high_pressure" }, depends: ["override_charging_method"] },
    { key: "override_cond_high_gas", label: "Gas composition", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "text", field: "override_cond_high_gas" }, depends: ["override_charging_method"] },
    { key: "override_cond_gas_phase_composition", label: "Gas composition", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "text", field: "override_cond_gas_phase_composition" }, depends: ["override_charging_method"] },
    { key: "override_cond_gas_phase_pressure", label: "Pressure [bar]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_gas_phase_pressure" }, depends: ["override_charging_method"] },
    { key: "override_cond_gas_phase_purity", label: "Gas purity", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "text", field: "override_cond_gas_phase_purity" }, depends: ["override_charging_method"] },
    { key: "override_cond_low_pressure", label: "Pressure [bar]", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "number", field: "override_cond_low_pressure" }, depends: ["override_charging_method"] },
    { key: "override_cond_low_gas", label: "Gas composition", cat: "Hydrogen measurement", sub: "Charging details", create: { type: "text", field: "override_cond_low_gas" }, depends: ["override_charging_method"] },
    { key: "override_surface_condition", label: "Surface condition", cat: "Surface condition", sub: "Condition", create: { type: "select", field: "override_surface_condition", sourceId: "default-surface-condition" } },
    { key: "override_surface_finish_detail", label: "Surface finish detail", cat: "Surface condition", sub: "Condition", create: { type: "select", field: "override_surface_finish_detail", sourceId: "default-surface-finish" } },
    { key: "override_surface_coated", label: "Coated", cat: "Surface condition", sub: "Coating", create: { type: "select", field: "override_surface_coated", defaultFrom: "default-surface-coated", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] } },
    { key: "override_coating_type", label: "Coating type", cat: "Surface condition", sub: "Coating", create: { type: "select", field: "override_coating_type", sourceId: "default-coating-type" }, depends: ["override_surface_coated"] },
    { key: "override_coating_thickness", label: "Coating thickness [µm]", cat: "Surface condition", sub: "Coating", create: { type: "number", field: "override_coating_thickness", defaultFrom: "default-coating-thickness" }, depends: ["override_surface_coated"] },
    { key: "override_coating_notes", label: "Surface condition notes", cat: "Surface condition", sub: "Coating", create: { type: "textarea", field: "override_coating_notes", rows: 3, defaultFrom: "default-coating-notes" }, depends: ["override_surface_coated"] },
    { key: "override_deformation_history", label: "Deformation history", cat: "Cold work and applied stresses", sub: "Deformation", create: { type: "select", field: "override_deformation_history", sourceId: "default-deformation-history" } },
    { key: "override_pre_strain", label: "Pre-strain [%]", cat: "Cold work and applied stresses", sub: "Deformation", create: { type: "number", field: "override_pre_strain", defaultFrom: "default-pre-strain" }, depends: ["override_deformation_history"] },
    { key: "override_cold_reduction", label: "Cold reduction [%]", cat: "Cold work and applied stresses", sub: "Deformation", create: { type: "number", field: "override_cold_reduction", defaultFrom: "default-cold-reduction" }, depends: ["override_deformation_history"] },
    { key: "override_mechanical_loading", label: "Mechanical loading during test", cat: "Cold work and applied stresses", sub: "Loading", create: { type: "select", field: "override_mechanical_loading", sourceId: "default-mechanical-loading" } },
    { key: "override_loading_regime", label: "Loading regime", cat: "Cold work and applied stresses", sub: "Loading", create: { type: "select", field: "override_loading_regime", sourceId: "default-loading-regime" }, depends: ["override_mechanical_loading"] },
    { key: "override_applied_stress", label: "Applied stress [MPa]", cat: "Cold work and applied stresses", sub: "Loading", create: { type: "number", field: "override_applied_stress", defaultFrom: "default-applied-stress" }, depends: ["override_mechanical_loading"] },
    { key: "override_applied_strain", label: "Applied strain [%]", cat: "Cold work and applied stresses", sub: "Loading", create: { type: "number", field: "override_applied_strain", defaultFrom: "default-applied-strain" }, depends: ["override_mechanical_loading"] },
    { key: "override_stress_notes", label: "Cold work and stress notes", cat: "Cold work and applied stresses", sub: "Loading", create: { type: "textarea", field: "override_stress_notes", rows: 3, defaultFrom: "default-stress-notes" }, depends: ["override_mechanical_loading"] },
    { key: "override_welding_process", label: "Welding process", cat: "Welding", sub: "Process", create: { type: "select", field: "override_welding_process", sourceId: "default-welding-process" }, depends: ["override_microstructure_enabled"] },
    { key: "override_welding_layer", label: "Layering", cat: "Welding", sub: "Process", create: { type: "select", field: "override_welding_layer", sourceId: "default-welding-layer" }, depends: ["override_microstructure_enabled"] },
    { key: "override_welding_t85", label: "t8/5 (s)", cat: "Welding", sub: "Process", create: { type: "number", field: "override_welding_t85", defaultFrom: "default-welding-t85" }, depends: ["override_microstructure_enabled"] },
    { key: "override_welding_notes", label: "Welding notes", cat: "Welding", sub: "Process", create: { type: "textarea", field: "override_welding_notes", rows: 3, defaultFrom: "default-welding-notes" }, depends: ["override_microstructure_enabled"] },
  ];

  function createOverrideField(def) {
    const wrapper = document.createElement("div");
    wrapper.className = "hdd-override-field";
    wrapper.dataset.overrideKey = def.key;
    wrapper.dataset.overrideCat = def.cat;
    wrapper.dataset.overrideSub = def.sub;
    wrapper.dataset.overrideLabel = def.label;
    if (def.depends && def.depends.length) {
      wrapper.dataset.overrideDepends = def.depends.join(",");
    }

    if (def.create) {
      const label = document.createElement("label");
      label.textContent = def.label;
      wrapper.appendChild(label);

      if (def.create.type === "select") {
        const select = document.createElement("select");
        select.setAttribute("data-field", def.create.field);
        if (def.create.sourceId) {
          const source = document.getElementById(def.create.sourceId);
          if (source) {
            select.innerHTML = source.innerHTML;
            if (source.value) select.value = source.value;
          }
        }
        if (def.create.options) {
          select.innerHTML = def.create.options
            .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
            .join("");
        }
        if (def.create.defaultFrom) {
          select.setAttribute("data-default-from", def.create.defaultFrom);
          const source = document.getElementById(def.create.defaultFrom);
          if (source && source.value) select.value = source.value;
        }
        wrapper.appendChild(select);
      } else if (def.create.type === "textarea") {
        const textarea = document.createElement("textarea");
        textarea.setAttribute("data-field", def.create.field);
        if (def.create.rows) textarea.rows = def.create.rows;
        if (def.create.defaultFrom) {
          textarea.setAttribute("data-default-from", def.create.defaultFrom);
          const source = document.getElementById(def.create.defaultFrom);
          if (source && source.value) textarea.value = source.value;
        }
        wrapper.appendChild(textarea);
      } else {
        const input = document.createElement("input");
        input.type = def.create.type === "number" ? "number" : "text";
        if (def.create.type === "number") input.step = "any";
        input.setAttribute("data-field", def.create.field);
        if (def.create.defaultFrom) {
          input.setAttribute("data-default-from", def.create.defaultFrom);
          const source = document.getElementById(def.create.defaultFrom);
          if (source && source.value) input.value = source.value;
        }
        wrapper.appendChild(input);
      }
    }

    return wrapper;
  }

  function ensureCompositionWrapper(row) {
    const existing = row.querySelector("[data-override-key='override_composition_values']");
    if (existing) return existing;
    const notes = Array.from(row.querySelectorAll(".hdd-contrib-override .hdd-contrib-note"))
      .find((el) => el.textContent && el.textContent.includes("Composition overrides"));
    const compScroll = row.querySelector(".hdd-contrib-override .hdd-comp-scroll");
    const compActions = row.querySelector(".hdd-contrib-override .hdd-comp-actions");
    if (!compScroll) return null;
    const wrapper = document.createElement("div");
    wrapper.className = "hdd-override-field";
    wrapper.dataset.overrideKey = "override_composition_values";
    wrapper.dataset.overrideCat = "Material";
    wrapper.dataset.overrideSub = "Composition";
    wrapper.dataset.overrideLabel = "Chemical composition";
    const parent = notes ? notes.parentElement : compScroll.parentElement;
    parent.insertBefore(wrapper, notes);
    if (notes) wrapper.appendChild(notes);
    wrapper.appendChild(compScroll);
    if (compActions) wrapper.appendChild(compActions);
    return wrapper;
  }

  function buildOverrideFields(row) {
    const details = row.querySelector(".hdd-contrib-override");
    if (!details) return;
    let injected = details.querySelector("[data-override-injected]");
    if (!injected) {
      injected = document.createElement("div");
      injected.className = "hdd-override-injected";
      injected.dataset.overrideInjected = "true";
      const firstGrid = details.querySelector(".hdd-contrib-row-grid");
      if (firstGrid) {
        details.insertBefore(injected, firstGrid);
      } else {
        details.appendChild(injected);
      }
    }

    overrideFieldDefs.forEach((def) => {
      let wrapper = null;
      if (def.getWrapper === "composition") {
        wrapper = ensureCompositionWrapper(row);
      } else if (def.selector) {
        const el = row.querySelector(def.selector);
        if (el) {
          wrapper =
            el.closest(".hdd-override-field") ||
            el.closest(".hdd-contrib-row-grid > div") ||
            el.closest("div") ||
            el.parentElement;
        }
      } else if (def.create) {
        wrapper = createOverrideField(def);
        injected.appendChild(wrapper);
      }
      if (!wrapper) return;
      wrapper.classList.add("hdd-override-field");
      wrapper.dataset.overrideKey = def.key;
      wrapper.dataset.overrideCat = def.cat;
      wrapper.dataset.overrideSub = def.sub;
      wrapper.dataset.overrideLabel = def.label;
      if (def.depends && def.depends.length) {
        wrapper.dataset.overrideDepends = def.depends.join(",");
      }
      if (def.key === "override_composition_values") {
        bindCompositionGrid(wrapper);
      }
    });
  }

  function initOverridePicker(row) {
    const details = row.querySelector(".hdd-contrib-override");
    if (!details) return;
    const picker = details.querySelector("[data-override-picker]");
    if (!picker) return;
    const catList = picker.querySelector("[data-override-categories]");
    const subList = picker.querySelector("[data-override-subcategories]");
    const fieldList = picker.querySelector("[data-override-fields]");
    const selectedList = picker.querySelector("[data-override-selected]");
    if (!catList || !subList || !fieldList || !selectedList) return;

    const fieldEls = Array.from(details.querySelectorAll("[data-override-key]"));
    const fields = fieldEls.map((el) => ({
      key: el.dataset.overrideKey,
      label: el.dataset.overrideLabel || el.dataset.overrideKey,
      cat: el.dataset.overrideCat || "Other",
      sub: el.dataset.overrideSub || "General",
      depends: el.dataset.overrideDepends ? el.dataset.overrideDepends.split(",") : [],
      el,
    }));

    const categoryOrder = [
      "Material",
      "Hydrogen measurement",
      "Surface condition",
      "Cold work and applied stresses",
      "Welding",
      "Row notes",
    ];
    const subcategoryOrder = {
      Material: [
        "Class & grade",
        "Microstructure",
        "Phase & processing",
        "Tags",
        "Composition",
        "Notes",
      ],
      "Hydrogen measurement": [
        "Method",
        "Charging details",
        "Method details",
        "Calculation",
        "Geometry",
        "Notes",
      ],
      "Surface condition": ["Condition", "Coating"],
      "Cold work and applied stresses": ["Deformation", "Loading"],
      Welding: ["Process"],
      "Row notes": ["General"],
    };
    const categories = categoryOrder.filter((cat) => fields.some((f) => f.cat === cat));
    let activeCat = categories[0] || null;
    let activeSub = null;
    const activeFieldOrder = [];
    const defOrder = new Map();
    overrideFieldDefs.forEach((def, idx) => defOrder.set(def.key, idx));
    const fieldOrder = (field) =>
      defOrder.has(field.key) ? defOrder.get(field.key) : Number.MAX_SAFE_INTEGER;

    const initialFieldOrder = fields
      .slice()
      .sort((a, b) => fieldOrder(a) - fieldOrder(b))
      .map((field) => field.key);

    const injected = details.querySelector("[data-override-injected]");
    if (injected) {
      fields.forEach((field) => {
        if (field.el.parentElement !== injected) injected.appendChild(field.el);
      });
    }

    function renderButtons(container, items, activeItem, onClick) {
      container.innerHTML = "";
      items.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item;
        if (item === activeItem) button.classList.add("is-active");
        button.addEventListener("click", () => onClick(item));
        container.appendChild(button);
      });
    }

    function updateSelected() {
      selectedList.innerHTML = "";
      activeFieldOrder.forEach((key) => {
        const field = fields.find((f) => f.key === key);
        if (!field) return;
        const chip = document.createElement("span");
        chip.className = "hdd-override-chip";
        const label = document.createElement("span");
        label.textContent = field.label;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.addEventListener("click", () =>
          hideField(field.key, { source: "chip", force: true, reset: true })
        );
        chip.appendChild(label);
        chip.appendChild(remove);
        selectedList.appendChild(chip);
      });
    }

    function reorderFields() {
      if (!injected) return;
      const orderedKeys = activeFieldOrder.concat(
        initialFieldOrder.filter((key) => !activeFieldOrder.includes(key))
      );
      orderedKeys.forEach((key) => {
        const field = fields.find((f) => f.key === key);
        if (field && field.el.parentElement === injected) {
          injected.appendChild(field.el);
        }
      });
    }

    function fieldHasUserValue(field) {
      const inputs = field.el.querySelectorAll("input, textarea, select");
      return Array.from(inputs).some((input) => elementHasUserValue(input));
    }

    function showField(key, skipDeps, pinned, source) {
      const field = fields.find((f) => f.key === key);
      if (!field) return;
      if (!skipDeps && field.depends && field.depends.length) {
        field.depends.forEach((dep) => showField(dep, true, false, "dependency"));
      }
      field.el.classList.add("is-active");
      if (!activeFieldOrder.includes(key)) {
        activeFieldOrder.push(key);
      }
      if (pinned) field.el.dataset.overridePinned = "true";
      reorderFields();
      updateSelected();
    }

    function resetElementToInitial(el) {
      if (!el) return;
      if (el.matches("input[type='checkbox'], input[type='radio']")) {
        if (el.dataset.initialChecked !== undefined) {
          el.checked = el.dataset.initialChecked === "1";
        } else {
          el.checked = false;
        }
        return;
      }
      if (el.dataset.initialValue !== undefined) {
        el.value = el.dataset.initialValue;
      } else if (el.matches("select")) {
        const sourceId = el.getAttribute("data-default-from") || el.getAttribute("data-clone-from");
        const source = sourceId ? document.getElementById(sourceId) : null;
        if (source) {
          el.value = source.value;
        } else if (el.options.length) {
          el.selectedIndex = 0;
        } else {
          el.value = "";
        }
      } else {
        el.value = "";
      }
      if (el.matches("select")) {
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function resetFieldInputs(field) {
      if (!field) return;
      if (field.key === "override_composition_values") {
        const items = field.el.querySelectorAll("[data-comp-item]");
        items.forEach((item) => {
          if (item.dataset.added === "true") {
            item.remove();
          } else {
            item.querySelectorAll("input, textarea, select").forEach((el) => {
              resetElementToInitial(el);
            });
          }
        });
        return;
      }
      field.el.querySelectorAll("input, textarea, select").forEach((el) => {
        resetElementToInitial(el);
      });
    }

    function hideField(key, options = {}) {
      const field = fields.find((f) => f.key === key);
      if (!field) return;
      const { force = false, reset = false } = options;
      if (reset) resetFieldInputs(field);
      if (!force && fieldHasUserValue(field)) {
        return;
      }
      field.el.classList.remove("is-active");
      const idx = activeFieldOrder.indexOf(key);
      if (idx >= 0) activeFieldOrder.splice(idx, 1);
      delete field.el.dataset.overridePinned;
      fields
        .filter((f) => f.depends && f.depends.includes(key))
        .forEach((dependent) => hideField(dependent.key, { force: true, reset: reset }));
      reorderFields();
      updateSelected();
    }

    function setCategory(cat) {
      activeCat = cat;
      const subs = [];
      fields
        .filter((f) => f.cat === cat)
        .sort((a, b) => fieldOrder(a) - fieldOrder(b))
        .forEach((f) => {
          if (!subs.includes(f.sub)) subs.push(f.sub);
        });
      const ordered = subcategoryOrder[cat];
      if (ordered) {
        subs.sort((a, b) => {
          const aIdx = ordered.indexOf(a);
          const bIdx = ordered.indexOf(b);
          if (aIdx === -1 && bIdx === -1) return 0;
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });
      }
      activeSub = subs[0] || null;
      renderButtons(catList, categories, activeCat, setCategory);
      renderButtons(subList, subs, activeSub, setSubcategory);
      renderFields();
    }

    function setSubcategory(sub) {
      activeSub = sub;
      const subs = [];
      fields
        .filter((f) => f.cat === activeCat)
        .sort((a, b) => fieldOrder(a) - fieldOrder(b))
        .forEach((f) => {
          if (!subs.includes(f.sub)) subs.push(f.sub);
        });
      const ordered = subcategoryOrder[activeCat];
      if (ordered) {
        subs.sort((a, b) => {
          const aIdx = ordered.indexOf(a);
          const bIdx = ordered.indexOf(b);
          if (aIdx === -1 && bIdx === -1) return 0;
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });
      }
      renderButtons(subList, subs, activeSub, setSubcategory);
      renderFields();
    }

    function renderFields() {
      const list = fields
        .filter((f) => f.cat === activeCat && f.sub === activeSub)
        .sort((a, b) => fieldOrder(a) - fieldOrder(b));
      fieldList.innerHTML = "";
      list.forEach((field) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = field.label;
        if (activeFieldOrder.includes(field.key)) button.classList.add("is-active");
        button.addEventListener("click", () => {
          if (activeFieldOrder.includes(field.key)) {
            hideField(field.key, { source: "picker", force: true, reset: true });
          } else {
            showField(field.key, false, true, "picker");
          }
          renderFields();
        });
        fieldList.appendChild(button);
      });
      updateSelected();
    }

    setCategory(activeCat);

    const weldedSelect = row.querySelector("[data-field='override_microstructure_enabled']");
    if (weldedSelect) {
      weldedSelect.addEventListener("change", () => {
        if (weldedSelect.value !== "yes") {
          hideField("override_material_microstructure", { force: true, reset: true });
          hideField("override_welding_process", { force: true, reset: true });
          hideField("override_welding_layer", { force: true, reset: true });
          hideField("override_welding_t85", { force: true, reset: true });
          hideField("override_welding_notes", { force: true, reset: true });
        }
      });
    }

    fields.forEach((field) => {
      const inputs = field.el.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        input.addEventListener("change", () => {
          const hasDiff = elementHasUserValue(input);
          if (hasDiff) {
            showField(field.key, false, false, "input");
          } else if (!field.el.dataset.overridePinned) {
            hideField(field.key, { source: "input" });
          }
        });
      });
    });
  }

  function bindModelToggle(row) {
    const modelSelect = row.querySelector("[data-field='model_type']");
    if (!modelSelect) return;
    const toggleFields = () => {
      const value = modelSelect.value;
      row.querySelectorAll("[data-model]").forEach((field) => {
        const model = field.dataset.model;
        const showRange = model === "range" && value !== "single_point" && value !== "list_of_values";
        field.style.display = model === value || showRange ? "block" : "none";
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
      if (!item) return;
      if (!confirmIfHasData(item, "This composition entry has data. Remove it?")) return;
      item.remove();
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
          <label>Display name</label>
          <input
            type="text"
            data-field="display_name"
            required
            placeholder="Short but meaningful"
            title="Shown in the legend. Last name + year are added automatically. Keep it short, for example S690 HAZ, Vanadium 0.1 wt.%, 5% Cr, or 5um Pd coated exit side."
          />
        </div>
        <div>
          <label>Model type</label>
          <select data-field="model_type" required title="Pick the model for this row. Fields below update based on this choice.">
            <option value="single_point">Single point</option>
            <option value="arrhenius">Arrhenius</option>
            <option value="power">Power law</option>
            <option value="list_of_values">List of values</option>
          </select>
        </div>
        <div>
          <label>Diffusivity unit</label>
          <select data-field="diffusivity_unit" title="Diffusivity units.">
            <option value="mm^2/s" selected>mm²/s</option>
            <option value="cm^2/s">cm²/s</option>
            <option value="m^2/s">m²/s</option>
          </select>
        </div>
        <div>
          <label>Temperature [°]</label>
          <select data-field="temperature_unit" title="Temperature units for this row.">
            <option value="K" selected>K</option>
            <option value="C">C</option>
          </select>
        </div>
        <div data-model="range">
          <label>Valid Temperature (min)</label>
          <input type="number" step="any" data-field="tmin" required title="Minimum valid temperature." />
        </div>
        <div data-model="range">
          <label>Valid Temperature (max)</label>
          <input type="number" step="any" data-field="tmax" required title="Maximum valid temperature." />
        </div>
        <div data-model="single_point">
          <label>Single point T</label>
          <input type="number" step="any" data-field="single_point_temperature" title="Single-point temperature." />
        </div>
        <div data-model="single_point">
          <label>Single point D</label>
          <input
            type="text"
            inputmode="decimal"
            data-field="single_point_diffusivity"
            placeholder="1.234e-2"
            title="Single-point diffusivity. Scientific notation is allowed (e.g., 1.234e-2)."
          />
        </div>
        <div data-model="arrhenius">
          <label>Arrhenius D<sub>0</sub></label>
          <input type="number" step="any" data-field="arrhenius_d0" title="Arrhenius prefactor D0 in D = D0 * exp(-Q/RT)." />
        </div>
        <div data-model="arrhenius">
          <label>Arrhenius Q</label>
          <input type="number" step="any" data-field="arrhenius_q" title="Arrhenius activation energy Q in D = D0 * exp(-Q/RT)." />
        </div>
        <div data-model="power">
          <label>Power A</label>
          <input type="number" step="any" data-field="power_a" title="Power-law prefactor A in D = A * T^n (temperature in the unit selected above)." />
        </div>
        <div data-model="power">
          <label>Power n</label>
          <input type="number" step="any" data-field="power_n" title="Power-law exponent n in D = A * T^n (temperature in the unit selected above)." />
        </div>
        <div data-model="list_of_values">
          <label>List of values (two columns)</label>
          <textarea
            data-field="list_values"
            rows="6"
            placeholder="300,1.2e-3&#10;350,2.1e-3"
            title="Paste two columns: temperature and diffusivity. Use comma or tab separators only, no headers. Temperatures must match the unit selected above."
          ></textarea>
        </div>
      </div>
      <details class="hdd-contrib-override">
        <summary>Changes from defaults (this row only)</summary>
        <div class="hdd-override-picker" data-override-picker>
          <div class="hdd-override-columns">
            <div class="hdd-override-column">
              <div class="hdd-override-column-title">Category</div>
              <div class="hdd-override-list" data-override-categories></div>
            </div>
            <div class="hdd-override-column">
              <div class="hdd-override-column-title">Section</div>
              <div class="hdd-override-list" data-override-subcategories></div>
            </div>
            <div class="hdd-override-column">
              <div class="hdd-override-column-title">Field</div>
              <div class="hdd-override-list" data-override-fields></div>
            </div>
          </div>
          <div class="hdd-override-selected" data-override-selected></div>
        </div>
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
            <div
              class="hdd-tag-grid hdd-tag-grid--compact"
              data-field="override_material_tags"
              data-clone-from="default-material-tags"
            ></div>
          </div>
          <div>
            <label>Material notes</label>
            <input type="text" data-field="override_material_notes" data-default-from="default-material-notes" title="Override material notes for this row. Leave empty to use defaults." />
          </div>
          <div>
            <label>Row notes</label>
            <textarea
              data-field="override_row_notes"
              rows="3"
              title="Use this if the overrides above still do not capture the row-specific context."
            ></textarea>
          </div>
        </div>
        <p class="hdd-contrib-note">Composition overrides (wt%) - leave blank to use defaults.</p>
        <div class="hdd-comp-scroll">
        <div class="hdd-comp-grid">
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="C" readonly /></div>
            <input type="text" data-comp-value title="Override C in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Mn" readonly /></div>
            <input type="text" data-comp-value title="Override Mn in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Si" readonly /></div>
            <input type="text" data-comp-value title="Override Si in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Cr" readonly /></div>
            <input type="text" data-comp-value title="Override Cr in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Ni" readonly /></div>
            <input type="text" data-comp-value title="Override Ni in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Mo" readonly /></div>
            <input type="text" data-comp-value title="Override Mo in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="V" readonly /></div>
            <input type="text" data-comp-value title="Override V in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Nb" readonly /></div>
            <input type="text" data-comp-value title="Override Nb in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Ti" readonly /></div>
            <input type="text" data-comp-value title="Override Ti in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Al" readonly /></div>
            <input type="text" data-comp-value title="Override Al in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="Cu" readonly /></div>
            <input type="text" data-comp-value title="Override Cu in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="P" readonly /></div>
            <input type="text" data-comp-value title="Override P in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="S" readonly /></div>
            <input type="text" data-comp-value title="Override S in wt%." />
          </div>
          <div class="hdd-comp-item" data-comp-item>
            <div class="hdd-comp-element"><input type="text" data-comp-element value="N" readonly /></div>
            <input type="text" data-comp-value title="Override N in wt%." />
          </div>
        </div>
        <div class="hdd-comp-actions">
          <button type="button" class="hdd-comp-add">Add element</button>
        </div>
        <div>
          <label>Composition notes</label>
          <input type="text" data-field="override_material_composition_notes" title="Override composition notes for this row." />
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
            <label>Characteristic length [mm]</label>
            <input type="number" step="any" data-field="override_characteristic_length" data-default-from="default-characteristic-length" title="Override characteristic length in mm for this row. Leave empty to use defaults." />
          </div>
        </div>
        <div>
          <label>Measurement notes</label>
          <input type="text" data-field="override_conditions_notes" data-default-from="default-conditions-notes" title="Override Measurement notes for this row. Leave empty to use defaults." />
        </div>
      </details>
    `;

    buildOverrideFields(row);
    initOverridePicker(row);

    row.querySelector(".hdd-remove-row").addEventListener("click", () => {
      if (!confirmIfHasData(row, "This row contains data. Remove it?")) return;
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

    stampInitialValues(row);
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

  function bindDeformationConditionals() {
    const deformationSelect = document.getElementById("default-deformation-history");
    const sections = Array.from(document.querySelectorAll("[data-deformation]"));
    if (!deformationSelect || !sections.length) return;

    const update = () => {
      const value = deformationSelect.value;
      sections.forEach((section) => {
        const match =
          section.dataset.deformation === value || section.dataset.deformationAlt === value;
        if (match) {
          section.classList.add("is-active");
        } else {
          section.classList.remove("is-active");
        }
      });
    };

    deformationSelect.addEventListener("change", update);
    update();
  }

  function bindLoadingConditionals() {
    const loadingSelect = document.getElementById("default-mechanical-loading");
    const sections = Array.from(document.querySelectorAll("[data-loading]"));
    if (!loadingSelect || !sections.length) return;

    const update = () => {
      const value = loadingSelect.value;
      sections.forEach((section) => {
        const match =
          section.dataset.loading === value ||
          section.dataset.loadingAlt === value ||
          section.dataset.loadingAlt2 === value ||
          section.dataset.loadingAlt3 === value ||
          section.dataset.loadingAlt4 === value ||
          section.dataset.loadingAlt5 === value ||
          section.dataset.loadingAlt6 === value;
        if (match) {
          section.classList.add("is-active");
        } else {
          section.classList.remove("is-active");
        }
      });
    };

    loadingSelect.addEventListener("change", update);
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
      addIfAny("immersion_in_distilled_water", {});
    }

    return Object.keys(fields).length ? fields : null;
  }

  function collectConditionalFieldsFrom(getFieldValue, method, charging) {
    if (!method) return null;
    const fields = {};
    const addIfAny = (key, values) => {
      const hasValue = Object.values(values).some((val) => val !== null && val !== "");
      if (hasValue) fields[key] = values;
    };

    if (method === "Thermal desorption (TDA / TDS)") {
      addIfAny("thermal_desorption_tda_tds", {
        heating_rate_k_per_min: parseNumber(getFieldValue("override_cond_tda_heating_rate")),
        peak_analysis_method: getFieldValue("override_cond_tda_peak_method") || null,
      });
    }
    if (method === "Gas permeation") {
      addIfAny("gas_permeation", {
        gas_detection_mode: getFieldValue("override_cond_gas_detection") || null,
      });
    }
    if (method === "SIMS") {
      addIfAny("sims", {
        sims_type: getFieldValue("override_cond_sims_type") || null,
      });
    }
    if (method === "Hot extraction (CGHE / GC)") {
      addIfAny("hot_extraction_cghe_gc", {
        extraction_temperature_c: parseNumber(getFieldValue("override_cond_hot_extraction_temp")),
      });
    }
    if (method === "Isothermal effusion / degassing") {
      addIfAny("isothermal_effusion_degassing", {
        degassing_temperature_c: parseNumber(getFieldValue("override_cond_degassing_temp")),
      });
    }

    if (charging === "devanathan_stachursky_cell") {
      addIfAny("electrochemical_devanathan_stachursky_cell", {
        electrolyte_entry_side: getFieldValue("override_cond_dev_entry_electrolyte") || null,
        electrolyte_exit_side: getFieldValue("override_cond_dev_exit_electrolyte") || null,
        current_density_mA_per_mm2: parseNumber(getFieldValue("override_cond_dev_current_density")),
        poison_additive: getFieldValue("override_cond_dev_poison") || null,
      });
    }
    if (charging === "cathodic") {
      addIfAny("cathodic", {
        electrolyte: getFieldValue("override_cond_cathodic_electrolyte") || null,
        current_density_mA_per_cm2: parseNumber(getFieldValue("override_cond_cathodic_current")),
        poison_additive: getFieldValue("override_cond_cathodic_poison") || null,
      });
    }
    if (charging === "electrochemical") {
      addIfAny("electrochemical", {
        electrolyte: getFieldValue("override_cond_electrochemical_electrolyte") || null,
        control_mode: getFieldValue("override_cond_electrochemical_control") || null,
        current_density_mA_per_cm2: parseNumber(getFieldValue("override_cond_electrochemical_current")),
        applied_potential_v: parseNumber(getFieldValue("override_cond_electrochemical_potential")),
        poison_additive: getFieldValue("override_cond_electrochemical_poison") || null,
      });
    }
    if (charging === "high_pressure_hydrogen") {
      addIfAny("high_pressure_hydrogen", {
        pressure_bar: parseNumber(getFieldValue("override_cond_high_pressure")),
        gas_composition: getFieldValue("override_cond_high_gas") || null,
      });
    }
    if (charging === "gas_phase") {
      addIfAny("gas_phase", {
        gas_composition: getFieldValue("override_cond_gas_phase_composition") || null,
        pressure_bar: parseNumber(getFieldValue("override_cond_gas_phase_pressure")),
        gas_purity: getFieldValue("override_cond_gas_phase_purity") || null,
      });
    }
    if (charging === "low_pressure_hydrogen") {
      addIfAny("low_pressure_hydrogen", {
        pressure_bar: parseNumber(getFieldValue("override_cond_low_pressure")),
        gas_composition: getFieldValue("override_cond_low_gas") || null,
      });
    }
    if (charging === "immersion_in_distilled_water") {
      addIfAny("immersion_in_distilled_water", {});
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
    if (removable) item.dataset.added = "true";
    item.innerHTML = `
      <div class="hdd-comp-element">
        <input type="text" data-comp-element placeholder="New" title="Element symbol or name." />
        ${
          removable
            ? '<button type="button" class="hdd-comp-remove" aria-label="Remove element">×</button>'
            : ""
        }
      </div>
      <input type="text" data-comp-value title="Element in wt% (e.g., 0.2 or <0.1)." />
    `;
    stampInitialValues(item);
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
      removeButton.addEventListener("click", () => {
        if (!confirmIfHasData(row, "This author entry has data. Remove it?")) return;
        row.remove();
      });
    }
    stampInitialValues(row);
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
      surface_condition: getValue("default-surface-condition"),
      surface_finish_detail: getValue("default-surface-finish"),
      coated: getValue("default-surface-coated") === "yes",
      coating_type: getValue("default-coating-type"),
      coating_thickness_um: parseNumber(getValue("default-coating-thickness")),
      coating_notes: getValue("default-coating-notes"),
      deformation_history: getValue("default-deformation-history"),
      pre_strain_percent: parseNumber(getValue("default-pre-strain")),
      cold_reduction_percent: parseNumber(getValue("default-cold-reduction")),
      mechanical_loading_during_test: getValue("default-mechanical-loading"),
      loading_regime: getValue("default-loading-regime"),
      applied_stress_mpa: parseNumber(getValue("default-applied-stress")),
      applied_strain_percent: parseNumber(getValue("default-applied-strain")),
      stress_notes: getValue("default-stress-notes"),
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
    const rowNotes = getRowValue("override_row_notes");

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
    const chargingDuration = parseNumber(getRowValue("override_charging_duration"));
    const chargingTemperature = parseNumber(getRowValue("override_charging_temperature"));
    const calculationModel = getRowValue("override_calculation_model");
    const reportedAs = getRowValue("override_reported_as");
    const geometry = getRowValue("override_sample_geometry");
    const characteristicLength = parseNumber(getRowValue("override_characteristic_length"));
    const conditionsNotes = getRowValue("override_conditions_notes");
    if (method && method !== defaults.measurement_method) conditions.measurement_method = method;
    if (charging && charging !== defaults.charging_method) conditions.charging_method = charging;
    if (chargingDuration !== null && chargingDuration !== defaults.charging_duration_h) {
      conditions.charging_duration_h = chargingDuration;
    }
    if (chargingTemperature !== null && chargingTemperature !== defaults.charging_temperature_c) {
      conditions.charging_temperature_c = chargingTemperature;
    }
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

    const surfaceCondition = getRowValue("override_surface_condition");
    const surfaceFinish = getRowValue("override_surface_finish_detail");
    const surfaceCoated = getRowValue("override_surface_coated");
    const coatingType = getRowValue("override_coating_type");
    const coatingThickness = parseNumber(getRowValue("override_coating_thickness"));
    const coatingNotes = getRowValue("override_coating_notes");
    if (surfaceCondition && surfaceCondition !== defaults.surface_condition) {
      conditions.surface_condition = surfaceCondition;
    }
    if (surfaceFinish && surfaceFinish !== defaults.surface_finish_detail) {
      conditions.surface_finish_detail = surfaceFinish;
    }
    if (surfaceCoated) {
      const coatedValue = surfaceCoated === "yes";
      if (coatedValue !== defaults.coated) conditions.coated = coatedValue;
    }
    if (coatingType && coatingType !== defaults.coating_type) conditions.coating_type = coatingType;
    if (coatingThickness !== null && coatingThickness !== defaults.coating_thickness_um) {
      conditions.coating_thickness_um = coatingThickness;
    }
    if (coatingNotes && coatingNotes !== defaults.coating_notes) conditions.coating_notes = coatingNotes;

    const deformationHistory = getRowValue("override_deformation_history");
    const preStrain = parseNumber(getRowValue("override_pre_strain"));
    const coldReduction = parseNumber(getRowValue("override_cold_reduction"));
    const mechanicalLoading = getRowValue("override_mechanical_loading");
    const loadingRegime = getRowValue("override_loading_regime");
    const appliedStress = parseNumber(getRowValue("override_applied_stress"));
    const appliedStrain = parseNumber(getRowValue("override_applied_strain"));
    const stressNotes = getRowValue("override_stress_notes");
    if (deformationHistory && deformationHistory !== defaults.deformation_history) {
      conditions.deformation_history = deformationHistory;
    }
    if (preStrain !== null && preStrain !== defaults.pre_strain_percent) {
      conditions.pre_strain_percent = preStrain;
    }
    if (coldReduction !== null && coldReduction !== defaults.cold_reduction_percent) {
      conditions.cold_reduction_percent = coldReduction;
    }
    if (mechanicalLoading && mechanicalLoading !== defaults.mechanical_loading_during_test) {
      conditions.mechanical_loading_during_test = mechanicalLoading;
    }
    if (loadingRegime && loadingRegime !== defaults.loading_regime) {
      conditions.loading_regime = loadingRegime;
    }
    if (appliedStress !== null && appliedStress !== defaults.applied_stress_mpa) {
      conditions.applied_stress_mpa = appliedStress;
    }
    if (appliedStrain !== null && appliedStrain !== defaults.applied_strain_percent) {
      conditions.applied_strain_percent = appliedStrain;
    }
    if (stressNotes && stressNotes !== defaults.stress_notes) conditions.stress_notes = stressNotes;

    const weldingProcess = getRowValue("override_welding_process");
    const weldingLayer = getRowValue("override_welding_layer");
    const weldingT85 = parseNumber(getRowValue("override_welding_t85"));
    const weldingNotes = getRowValue("override_welding_notes");
    if (weldingProcess || weldingLayer || weldingT85 !== null || weldingNotes) {
      if (!material.welded) material.welded = { enabled: defaults.welded };
      if (weldingProcess && weldingProcess !== defaults.welding_process) {
        material.welded.process = weldingProcess;
      }
      if (weldingLayer && weldingLayer !== defaults.welding_layer) {
        material.welded.layer = weldingLayer;
      }
      if (weldingT85 !== null && weldingT85 !== defaults.welding_t85) {
        material.welded.t85 = weldingT85;
      }
      if (weldingNotes && weldingNotes !== defaults.welding_notes) {
        material.welded.notes = weldingNotes;
      }
    }

    const methodValue = method || defaults.measurement_method;
    const chargingValue = charging || defaults.charging_method;
    const conditionalOverride = collectConditionalFieldsFrom(
      (field) => getRowValue(field),
      methodValue,
      chargingValue
    );
    if (conditionalOverride) {
      conditions.conditional_fields = conditionalOverride;
    }

    if (Object.keys(material).length) overrides.material = material;
    if (Object.keys(conditions).length) overrides.conditions = conditions;
    if (rowNotes) overrides.notes = rowNotes;

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
        deformation_history: getValue("default-deformation-history") || null,
        pre_strain_percent: parseNumber(getValue("default-pre-strain")),
        cold_reduction_percent: parseNumber(getValue("default-cold-reduction")),
        mechanical_loading_during_test: getValue("default-mechanical-loading") || null,
        loading_regime: getValue("default-loading-regime") || null,
        applied_stress_mpa: parseNumber(getValue("default-applied-stress")),
        applied_strain_percent: parseNumber(getValue("default-applied-strain")),
        stress_notes: getValue("default-stress-notes") || null,
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
        display_name: getRowValue("display_name"),
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
            input: getRowValue("temperature_unit") === "C" ? "theta_C" : "temperature_K",
          },
          list_of_values: {
            raw: getRowValue("list_values") || null,
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

      if (!row.display_name || !row.model_type) {
        return `${rowLabel}: display name and model type are required.`;
      }

      if (row.model_type !== "single_point" && row.model_type !== "list_of_values") {
        if (row.temperature_validity.min === null || row.temperature_validity.max === null) {
          return `${rowLabel}: minimum and maximum temperature are required.`;
        }
        if (row.temperature_validity.min > row.temperature_validity.max) {
          return `${rowLabel}: minimum temperature must be <= maximum temperature.`;
        }
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

      if (row.model_type === "list_of_values") {
        if (!row.model.list_of_values || !row.model.list_of_values.raw) {
          return `${rowLabel}: list of values requires pasted data.`;
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

  if (addRowButton && !addRowButton.dataset.bound) {
    addRowButton.dataset.bound = "true";
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
  stampInitialValues(form);

  if (authorTable && authorAddButton) {
    if (!authorAddButton.dataset.bound) {
      authorAddButton.dataset.bound = "true";
      authorAddButton.addEventListener("click", () => addAuthorRow(authorTable));
    }
    authorTable.querySelectorAll(".hdd-author-remove").forEach((button) => {
      button.addEventListener("click", (event) => {
        const row = event.target.closest("[data-author-row]");
        if (!row) return;
        if (!confirmIfHasData(row, "This author entry has data. Remove it?")) return;
        row.remove();
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
  bindDeformationConditionals();
  bindLoadingConditionals();
})();



