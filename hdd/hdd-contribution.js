/* Formspree submission handler with inline status updates. */
(function () {
  const form = document.getElementById("hydrogen-contribution-form");
  if (!form) return;

  const status = document.getElementById("hdd-contrib-status");
  const submitButton = form.querySelector("button[type='submit']");
  const rowsBody = document.getElementById("hdd-contrib-rows");
  const addRowButton = document.getElementById("hdd-add-row");
  const clearRowsButton = document.getElementById("hdd-clear-rows");
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

  function createRow() {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" data-field="group_name" required></td>
      <td><input type="text" data-field="series_name" required></td>
      <td>
        <select data-field="model_type" required>
          <option value="single_point">single_point</option>
          <option value="arrhenius">arrhenius</option>
          <option value="power">power</option>
        </select>
      </td>
      <td><input type="number" step="any" data-field="tmin" required></td>
      <td><input type="number" step="any" data-field="tmax" required></td>
      <td><input type="number" step="any" data-field="single_point_temperature"></td>
      <td><input type="number" step="any" data-field="single_point_diffusivity"></td>
      <td><input type="number" step="any" data-field="arrhenius_d0"></td>
      <td><input type="number" step="any" data-field="arrhenius_q"></td>
      <td><input type="number" step="any" data-field="arrhenius_r" placeholder="8.314"></td>
      <td><input type="number" step="any" data-field="power_a"></td>
      <td><input type="number" step="any" data-field="power_n"></td>
      <td>
        <select data-field="power_input">
          <option value="theta_C">theta_C</option>
          <option value="temperature_K">temperature_K</option>
        </select>
      </td>
      <td><textarea data-field="overrides_json" placeholder="{\"material\": {\"grade\": \"AISI 4340\"}}"></textarea></td>
      <td><button type="button" class="hdd-remove-row">Remove</button></td>
    `;

    row.querySelector(".hdd-remove-row").addEventListener("click", () => {
      row.remove();
    });

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

  function parseOverrides(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return { __error: "Invalid JSON in overrides." };
    }
  }

  function buildPayload() {
    const defaults = {
      material: {
        class: getValue("default-material-class") || null,
        grade: getValue("default-material-grade") || null,
        microstructure: getValue("default-material-microstructure") || null,
        phase: getValue("default-material-phase") || null,
        processing: parseCsvList(getValue("default-material-processing")),
        tags: parseCsvList(getValue("default-material-tags")),
        notes: getValue("default-material-notes") || null,
        chemical_composition: {
          notes: getValue("default-material-composition") || null,
        },
      },
      conditions: {
        measurement_method: getValue("default-method") || null,
        charging_method: getValue("default-charging") || null,
        specimen_thickness_mm: parseNumber(getValue("default-thickness")),
        notes: getValue("default-conditions-notes") || null,
      },
      metadata: {
        studied_effects: parseCsvList(getValue("default-studied-effects")),
      },
      reported_as: getValue("default-reported-as") || null,
      diffusivity_unit: getValue("default-units-diff") || "mm^2/s",
      temperature_unit: getValue("default-units-temp") || "K",
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
        affiliation: getValue("contrib-affiliation"),
        orcid: getValue("contrib-orcid") || null,
      },
      supporting_links: getValue("contrib-links") || null,
    };

    const rows = [];
    rowsBody.querySelectorAll("tr").forEach((row) => {
      const getRowValue = (field) => {
        const input = row.querySelector(`[data-field='${field}']`);
        return input ? input.value.trim() : "";
      };

      const rowData = {
        group_name: getRowValue("group_name"),
        series_name: getRowValue("series_name"),
        model_type: getRowValue("model_type"),
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
            R: parseNumber(getRowValue("arrhenius_r")),
          },
          power: {
            A: parseNumber(getRowValue("power_a")),
            n: parseNumber(getRowValue("power_n")),
            input: getRowValue("power_input") || "theta_C",
          },
        },
        overrides: parseOverrides(getRowValue("overrides_json")),
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

      if (row.overrides && row.overrides.__error) {
        return `${rowLabel}: Overrides JSON is invalid.`;
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

  if (clearRowsButton) {
    clearRowsButton.addEventListener("click", () => {
      rowsBody.innerHTML = "";
      ensureInitialRow();
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
