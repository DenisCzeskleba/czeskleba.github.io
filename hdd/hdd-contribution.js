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

  function bindCompositionTable(root) {
    if (!root) return;
    const table = root.querySelector(".hdd-comp-table");
    const addButton = root.querySelector(".hdd-comp-add");
    if (!table || !addButton) return;
    addButton.addEventListener("click", () => addCustomCompositionRow(table));
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
        <table class="hdd-contrib-comp-table hdd-comp-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>wt%</th>
            </tr>
          </thead>
          <tbody>
            <tr data-comp-row data-element="C"><td>C</td><td><input type="number" step="0.01" data-comp-value title="Override C in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Mn"><td>Mn</td><td><input type="number" step="0.01" data-comp-value title="Override Mn in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Si"><td>Si</td><td><input type="number" step="0.01" data-comp-value title="Override Si in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Cr"><td>Cr</td><td><input type="number" step="0.01" data-comp-value title="Override Cr in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Ni"><td>Ni</td><td><input type="number" step="0.01" data-comp-value title="Override Ni in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Mo"><td>Mo</td><td><input type="number" step="0.01" data-comp-value title="Override Mo in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="V"><td>V</td><td><input type="number" step="0.01" data-comp-value title="Override V in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Nb"><td>Nb</td><td><input type="number" step="0.01" data-comp-value title="Override Nb in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Ti"><td>Ti</td><td><input type="number" step="0.01" data-comp-value title="Override Ti in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Al"><td>Al</td><td><input type="number" step="0.01" data-comp-value title="Override Al in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="Cu"><td>Cu</td><td><input type="number" step="0.01" data-comp-value title="Override Cu in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="P"><td>P</td><td><input type="number" step="0.01" data-comp-value title="Override P in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="S"><td>S</td><td><input type="number" step="0.01" data-comp-value title="Override S in wt%. Leave empty if not needed." /></td></tr>
            <tr data-comp-row data-element="N"><td>N</td><td><input type="number" step="0.01" data-comp-value title="Override N in wt%. Leave empty if not needed." /></td></tr>
          </tbody>
        </table>
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
          <label>Studied effects</label>
          <select data-field="override_studied_effects" title="If you had to say which effects on the diffusion coefficients did you study?">
            <option value="">Select an effect</option>
            <option value="Alloying Elements">Alloying Elements</option>
            <option value="Coatings">Coatings</option>
            <option value="Cold Work and Applied Stresses">Cold Work and Applied Stresses</option>
            <option value="Grain Boundaries and Particle-Matrix Interfaces">Grain Boundaries and Particle-Matrix Interfaces</option>
            <option value="HAZ-Specific effects">HAZ-Specific effects</option>
            <option value="Inner Effects (Trapping)">Inner Effects (Trapping)</option>
            <option value="Lattice Imperfections">Lattice Imperfections</option>
            <option value="Liquidus">Liquidus</option>
            <option value="Microstructure Influence">Microstructure Influence</option>
            <option value="Microvoids and nonmetallic inclusions">Microvoids and nonmetallic inclusions</option>
            <option value="Oxide and other Passivators">Oxide and other Passivators</option>
            <option value="Porosity">Porosity</option>
            <option value="Surface Effects">Surface Effects</option>
            <option value="Surface Mass Transfer">Surface Mass Transfer</option>
            <option value="Surface State and Reactions">Surface State and Reactions</option>
            <option value="Weld-Metal-Specific Effects">Weld-Metal-Specific Effects</option>
          </select>
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
    bindCompositionTable(row);

    return row;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function parseStudiedEffect(value) {
    return value ? [value] : [];
  }

  function parseKeywords(value) {
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

  function addCustomCompositionRow(table) {
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const row = document.createElement("tr");
    row.setAttribute("data-comp-row", "");
    row.innerHTML = `
      <td><input type="text" data-comp-element placeholder="Element" title="Element symbol or name. Leave empty if not needed." /></td>
      <td><input type="number" step="0.01" data-comp-value title="Element in wt%. Leave empty if not needed." /></td>
    `;
    tbody.appendChild(row);
  }

  function addAuthorRow(table) {
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const row = document.createElement("tr");
    row.setAttribute("data-author-row", "");
    row.innerHTML = `
      <td><input type="text" data-author-first required title="Author first name." /></td>
      <td><input type="text" data-author-last required title="Author last name." /></td>
      <td><input type="text" data-author-orcid title="ORCID (optional)." /></td>
    `;
    tbody.appendChild(row);
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

  function collectCompositionFromTable(table, notesValue) {
    const values = {};
    if (table) {
      table.querySelectorAll("tr[data-comp-row]").forEach((row) => {
        const elementAttr = row.getAttribute("data-element");
        const elementInput = row.querySelector("[data-comp-element]");
        const element = elementAttr || (elementInput ? elementInput.value.trim() : "");
        const valueInput = row.querySelector("[data-comp-value]");
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

    const overrideTable = row.querySelector(".hdd-comp-table");
    const notesInput = row.querySelector("[data-field='override_material_composition_notes']");
    const composition = collectCompositionFromTable(overrideTable, notesInput ? notesInput.value : "");
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
    if (effects) metadata.studied_effects = parseStudiedEffect(effects);

    if (Object.keys(material).length) overrides.material = material;
    if (Object.keys(conditions).length) overrides.conditions = conditions;
    if (Object.keys(metadata).length) overrides.metadata = metadata;

    return Object.keys(overrides).length ? overrides : null;
  }

  function collectComposition() {
    const table = document.getElementById("hdd-comp-table");
    const notes = getValue("default-material-composition-notes") || "";
    return collectCompositionFromTable(table, notes);
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
        studied_effects: parseStudiedEffect(getValue("default-studied-effects")),
      },
    };

    const source = {
      title: getValue("contrib-title"),
      authors: collectAuthors(authorTable),
      journal: getValue("contrib-journal"),
      year: getValue("contrib-year"),
      doi: getValue("contrib-doi"),
      oa_url: getValue("contrib-oa"),
      abstract: getValue("contrib-abstract"),
      keywords: parseKeywords(getValue("contrib-keywords")),
      publication_type: getValue("contrib-pubtype"),
      volume: getValue("contrib-volume"),
      issue: getValue("contrib-issue"),
      pages: getValue("contrib-pages"),
      language: getValue("contrib-language"),
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

    if (!payload.source.authors.length) {
      return "Please add at least one author.";
    }

    for (let i = 0; i < payload.source.authors.length; i += 1) {
      const author = payload.source.authors[i];
      if (!author.first_name || !author.last_name) {
        return "Each author must include first and last name.";
      }
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

  const defaultCompTable = document.getElementById("hdd-comp-table");
  const defaultCompAdd = document.getElementById("hdd-comp-add");
  if (defaultCompTable && defaultCompAdd) {
    defaultCompAdd.addEventListener("click", () => addCustomCompositionRow(defaultCompTable));
  }

  if (authorTable && authorAddButton) {
    authorAddButton.addEventListener("click", () => addAuthorRow(authorTable));
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
})();
