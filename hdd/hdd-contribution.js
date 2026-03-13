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
          <label>Diffusivity type</label>
          <select data-field="reported_as" title="Type of diffusivity reported: apparent, effective, or lattice. Leave empty if not needed.">
            <option value="apparent" selected>apparent</option>
            <option value="effective">effective</option>
            <option value="lattice">lattice</option>
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
            <label>Tag</label>
            <select data-field="override_material_tags" data-clone-from="default-material-tags" title="Override tag for this row. Leave empty to use defaults."></select>
          </div>
          <div>
            <label>Material notes</label>
            <input type="text" data-field="override_material_notes" title="Override material notes for this row. Leave empty to use defaults." />
          </div>
        </div>
        <p class="hdd-contrib-note">Composition overrides (wt%) — leave blank to use defaults.</p>
        <div class="hdd-contrib-row-grid">
          <div><label>C</label><input type="number" step="0.01" data-field="override_comp_c" title="Override C in wt%. Leave empty if not needed." /></div>
          <div><label>Mn</label><input type="number" step="0.01" data-field="override_comp_mn" title="Override Mn in wt%. Leave empty if not needed." /></div>
          <div><label>Si</label><input type="number" step="0.01" data-field="override_comp_si" title="Override Si in wt%. Leave empty if not needed." /></div>
          <div><label>Cr</label><input type="number" step="0.01" data-field="override_comp_cr" title="Override Cr in wt%. Leave empty if not needed." /></div>
          <div><label>Ni</label><input type="number" step="0.01" data-field="override_comp_ni" title="Override Ni in wt%. Leave empty if not needed." /></div>
          <div><label>Mo</label><input type="number" step="0.01" data-field="override_comp_mo" title="Override Mo in wt%. Leave empty if not needed." /></div>
          <div><label>V</label><input type="number" step="0.01" data-field="override_comp_v" title="Override V in wt%. Leave empty if not needed." /></div>
          <div><label>Nb</label><input type="number" step="0.01" data-field="override_comp_nb" title="Override Nb in wt%. Leave empty if not needed." /></div>
          <div><label>Ti</label><input type="number" step="0.01" data-field="override_comp_ti" title="Override Ti in wt%. Leave empty if not needed." /></div>
          <div><label>Al</label><input type="number" step="0.01" data-field="override_comp_al" title="Override Al in wt%. Leave empty if not needed." /></div>
          <div><label>Cu</label><input type="number" step="0.01" data-field="override_comp_cu" title="Override Cu in wt%. Leave empty if not needed." /></div>
          <div><label>P</label><input type="number" step="0.01" data-field="override_comp_p" title="Override P in wt%. Leave empty if not needed." /></div>
          <div><label>S</label><input type="number" step="0.01" data-field="override_comp_s" title="Override S in wt%. Leave empty if not needed." /></div>
          <div><label>N</label><input type="number" step="0.01" data-field="override_comp_n" title="Override N in wt%. Leave empty if not needed." /></div>
        </div>
        <div>
          <label>Composition notes</label>
          <input type="text" data-field="override_material_composition_notes" title="Override composition notes for this row. Leave empty if not needed." />
        </div>
        <div class="hdd-contrib-row-grid">
          <div>
            <label>Measurement method</label>
            <input type="text" data-field="override_measurement_method" title="Override measurement method for this row. Leave empty if not needed." />
          </div>
          <div>
            <label>Charging method</label>
            <input type="text" data-field="override_charging_method" title="Override charging method for this row. Leave empty if not needed." />
          </div>
        </div>
        <div>
          <label>Conditions notes</label>
          <input type="text" data-field="override_conditions_notes" title="Override conditions notes for this row. Leave empty if not needed." />
        </div>
        <div>
          <label>Studied effects (comma-separated)</label>
          <input type="text" data-field="override_studied_effects" title="Override studied effects for this row. Leave empty if not needed." />
        </div>
      </details>
    `;

    row.querySelector(".hdd-remove-row").addEventListener("click", () => {
      row.remove();
    });

    row.querySelectorAll("[data-clone-from]").forEach((select) => {
      const sourceId = select.getAttribute("data-clone-from");
      const source = document.getElementById(sourceId);
      if (!source) return;
      select.innerHTML = source.innerHTML;
      if (select.options.length) {
        select.selectedIndex = 0;
      }
    });

    bindModelToggle(row);

    return row;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function parseCsvList(value) {
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function parseWtPercent(value) {
    return parseNumber(value);
  }

  function collectCompositionFromRow(row, prefix) {
    const values = {};
    const map = {
      C: `${prefix}_comp_c`,
      Mn: `${prefix}_comp_mn`,
      Si: `${prefix}_comp_si`,
      Cr: `${prefix}_comp_cr`,
      Ni: `${prefix}_comp_ni`,
      Mo: `${prefix}_comp_mo`,
      V: `${prefix}_comp_v`,
      Nb: `${prefix}_comp_nb`,
      Ti: `${prefix}_comp_ti`,
      Al: `${prefix}_comp_al`,
      Cu: `${prefix}_comp_cu`,
      P: `${prefix}_comp_p`,
      S: `${prefix}_comp_s`,
      N: `${prefix}_comp_n`,
    };

    Object.keys(map).forEach((element) => {
      const input = row.querySelector(`[data-field='${map[element]}']`);
      const value = input ? parseWtPercent(input.value.trim()) : null;
      if (value !== null) {
        values[element] = value;
      }
    });

    const notesInput = row.querySelector("[data-field='override_material_composition_notes']");
    const notes = notesInput ? notesInput.value.trim() : "";

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
    const metadata = {};

    const materialClass = getRowValue("override_material_class");
    const materialGrade = getRowValue("override_material_grade");
    const materialMicro = getRowValue("override_material_microstructure");
    const materialPhase = getRowValue("override_material_phase");
    const materialProcessing = getRowValue("override_material_processing");
    const materialTags = getRowValue("override_material_tags");
    const materialNotes = getRowValue("override_material_notes");

    if (materialClass) material.class = materialClass;
    if (materialGrade) material.grade = materialGrade;
    if (materialMicro) material.microstructure = materialMicro;
    if (materialPhase) material.phase = materialPhase;
    if (materialProcessing) material.processing = [materialProcessing];
    if (materialTags) material.tags = [materialTags];
    if (materialNotes) material.notes = materialNotes;

    const composition = collectCompositionFromRow(row, "override");
    if (composition) {
      material.chemical_composition = composition;
    }

    const method = getRowValue("override_measurement_method");
    const charging = getRowValue("override_charging_method");
    const conditionsNotes = getRowValue("override_conditions_notes");
    if (method) conditions.measurement_method = method;
    if (charging) conditions.charging_method = charging;
    if (conditionsNotes) conditions.notes = conditionsNotes;

    const effects = getRowValue("override_studied_effects");
    if (effects) metadata.studied_effects = parseCsvList(effects);

    if (Object.keys(material).length) overrides.material = material;
    if (Object.keys(conditions).length) overrides.conditions = conditions;
    if (Object.keys(metadata).length) overrides.metadata = metadata;

    return Object.keys(overrides).length ? overrides : null;
  }

  function collectComposition() {
    const values = {};
    const map = {
      C: "comp-c",
      Mn: "comp-mn",
      Si: "comp-si",
      Cr: "comp-cr",
      Ni: "comp-ni",
      Mo: "comp-mo",
      V: "comp-v",
      Nb: "comp-nb",
      Ti: "comp-ti",
      Al: "comp-al",
      Cu: "comp-cu",
      P: "comp-p",
      S: "comp-s",
      N: "comp-n",
    };

    Object.keys(map).forEach((element) => {
      const value = parseWtPercent(getValue(map[element]));
      if (value !== null) {
        values[element] = value;
      }
    });

    const notes = getValue("default-material-composition-notes") || null;
    if (!Object.keys(values).length && !notes) {
      return null;
    }

    return {
      basis: "wt_pct",
      values,
      notes: notes || "not_reported",
    };
  }

  function buildPayload() {
    const composition = collectComposition();
    const defaults = {
      material: {
        class: getValue("default-material-class") || null,
        grade: getValue("default-material-grade") || null,
        microstructure: getValue("default-material-microstructure") || null,
        phase: getValue("default-material-phase") || null,
        processing: getValue("default-material-processing") ? [getValue("default-material-processing")] : [],
        tags: getValue("default-material-tags") ? [getValue("default-material-tags")] : [],
        notes: getValue("default-material-notes") || null,
        chemical_composition: composition,
      },
      conditions: {
        measurement_method: getValue("default-method") || null,
        charging_method: getValue("default-charging") || null,
        notes: getValue("default-conditions-notes") || null,
      },
      metadata: {
        studied_effects: parseCsvList(getValue("default-studied-effects")),
      },
    };

    const source = {
      title: getValue("contrib-title"),
      authors: getValue("contrib-authors"),
      journal: getValue("contrib-journal"),
      year: getValue("contrib-year"),
      doi: getValue("contrib-doi"),
      oa_url: getValue("contrib-oa"),
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

      const rowData = {
        group_name: getRowValue("group_name"),
        series_name: getRowValue("series_name"),
        model_type: getRowValue("model_type"),
        reported_as: getRowValue("reported_as") || "apparent",
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
        overrides: buildRowOverrides(row, getRowValue),
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
})();
