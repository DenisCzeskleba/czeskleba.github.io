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
          <input type="text" data-field="group_name" required title="Group label for this paper. Leave empty if not needed." />
        </div>
        <div>
          <label>Series name</label>
          <input type="text" data-field="series_name" required title="Series label within the group. Leave empty if not needed." />
        </div>
        <div>
          <label>Model type</label>
          <select data-field="model_type" required title="Model type for this row. Leave empty if not needed.">
            <option value="single_point">single_point</option>
            <option value="arrhenius">arrhenius</option>
            <option value="power">power</option>
          </select>
        </div>
        <div>
          <label>Reported as</label>
          <select data-field="reported_as" title="Reported-as label. Leave empty if not needed.">
            <option value="apparent" selected>apparent</option>
            <option value="effective">effective</option>
            <option value="lattice">lattice</option>
            <option value="not_reported">not_reported</option>
          </select>
        </div>
        <div>
          <label>Diffusivity unit</label>
          <select data-field="diffusivity_unit" title="Diffusivity units. Leave empty if not needed.">
            <option value="mm^2/s" selected>mm^2/s</option>
            <option value="m^2/s">m^2/s</option>
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
    `;

    row.querySelector(".hdd-remove-row").addEventListener("click", () => {
      row.remove();
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

  function resolveMaterialClass() {
    const selected = getValue("default-material-class");
    const other = getValue("default-material-class-other") || null;
    if (!selected || selected === "Other") {
      return other;
    }
    return selected;
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
        class: resolveMaterialClass(),
        grade: getValue("default-material-grade") || null,
        microstructure: getValue("default-material-microstructure") || null,
        phase: getValue("default-material-phase") || null,
        processing: parseCsvList(getValue("default-material-processing")),
        tags: parseCsvList(getValue("default-material-tags")),
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
