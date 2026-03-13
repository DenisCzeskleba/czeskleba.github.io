---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen-diffusion-database/contribute/
---

# Contribution Form

Help expand the hydrogen diffusivity dataset by submitting peer-reviewed, open-access sources. We manually review every entry before merging into the upstream repo.

## Submission Checklist

1. Publication metadata: title, authors, journal, year, DOI/URL.
2. Model definitions: specify `single_point`, `arrhenius`, or `power` parameters, including valid temperature ranges.
3. Supporting material: provide links to figures, tables, or supplementary spreadsheets if available.
4. Contact info: email + affiliation for follow-up questions.

## Submission Flow

- **Validation:** the form checks ranges and required parameters before sending.
- **Queue:** submissions are emailed to maintainers for manual verification; no automatic publishing.
- **Status updates:** contributors receive confirmation after review.

## Submit a Contribution

Please fill in the form below. We manually review every submission before updating the database.

<style>
  main {
    max-width: 1100px;
  }

  .hdd-contrib-form {
    margin: 1.5rem auto 0;
    max-width: 1000px;
    text-align: left;
    display: grid;
    gap: 18px;
  }
  .hdd-contrib-form fieldset {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .hdd-contrib-form legend {
    font-weight: 600;
    padding: 0 6px;
  }
  .hdd-contrib-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .hdd-contrib-form label {
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
  }
  .hdd-contrib-form input,
  .hdd-contrib-form textarea,
  .hdd-contrib-form select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
  .hdd-contrib-form textarea {
    min-height: 140px;
    resize: vertical;
  }
  .hdd-contrib-form .hdd-contrib-note {
    font-size: 0.9rem;
    color: color-mix(in srgb, var(--text) 60%, var(--bg));
  }
  .hdd-contrib-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  .hdd-contrib-table th,
  .hdd-contrib-table td {
    border-bottom: 1px solid var(--border);
    padding: 8px;
    vertical-align: top;
  }
  .hdd-contrib-table th {
    text-align: left;
    font-weight: 600;
    background: color-mix(in srgb, var(--bg) 92%, var(--text));
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .hdd-contrib-table input,
  .hdd-contrib-table select,
  .hdd-contrib-table textarea {
    width: 100%;
    min-width: 120px;
  }
  .hdd-contrib-table textarea {
    min-height: 60px;
  }
  .hdd-contrib-row-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 10px;
  }
  .hdd-contrib-row-actions button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }
  .hdd-contrib-row-actions button.primary {
    background: #1f2937;
    color: #fff;
    border-color: transparent;
  }
  .hdd-contrib-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .hdd-contrib-actions button {
    padding: 12px 16px;
    border-radius: 10px;
    border: none;
    background: #1f2937;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .hdd-contrib-status {
    font-size: 0.95rem;
  }
  .hdd-contrib-local {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .hdd-contrib-local button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }
  .hdd-contrib-preview {
    width: 100%;
    min-height: 180px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
</style>

<form class="hdd-contrib-form" id="hydrogen-contribution-form" action="https://formspree.io/f/xjgawgej" method="POST" novalidate>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Hydrogen Diffusivity Contribution" />
  <textarea name="submission_json" id="hdd-submission-json" style="display:none"></textarea>

  <fieldset>
    <legend>Contact</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-name">Name</label>
        <input id="contrib-name" name="name" required />
      </div>
      <div>
        <label for="contrib-email">Email</label>
        <input id="contrib-email" name="email" type="email" required />
      </div>
      <div>
        <label for="contrib-affiliation">Affiliation</label>
        <input id="contrib-affiliation" name="affiliation" required />
      </div>
      <div>
        <label for="contrib-orcid">ORCID (optional)</label>
        <input id="contrib-orcid" name="orcid" placeholder="0000-0000-0000-0000" />
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Publication</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-title">Title</label>
        <input id="contrib-title" name="paper_title" required />
      </div>
      <div>
        <label for="contrib-authors">Authors</label>
        <input id="contrib-authors" name="authors" required />
      </div>
      <div>
        <label for="contrib-journal">Journal / Venue</label>
        <input id="contrib-journal" name="journal" required />
      </div>
      <div>
        <label for="contrib-year">Year</label>
        <input id="contrib-year" name="year" placeholder="YYYY" required />
      </div>
      <div>
        <label for="contrib-doi">DOI</label>
        <input id="contrib-doi" name="doi" required />
      </div>
      <div>
        <label for="contrib-oa">Open-access URL</label>
        <input id="contrib-oa" name="oa_url" type="url" required />
      </div>
    </div>
    <div>
      <label for="contrib-notes">Paper notes (optional)</label>
      <textarea id="contrib-notes" name="paper_notes" placeholder="Context, special handling, or clarifications."></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Defaults (apply to all rows unless overridden)</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-material-class">Material class</label>
        <input id="default-material-class" name="default_material_class" placeholder="e.g., Low Alloy Steel" />
      </div>
      <div>
        <label for="default-material-grade">Material grade</label>
        <input id="default-material-grade" name="default_material_grade" placeholder="e.g., 2.25Cr-1Mo steel" />
      </div>
      <div>
        <label for="default-material-microstructure">Microstructure</label>
        <input id="default-material-microstructure" name="default_material_microstructure" placeholder="Base material, weld metal" />
      </div>
      <div>
        <label for="default-material-phase">Phase</label>
        <input id="default-material-phase" name="default_material_phase" placeholder="Ferritic, Austenitic, etc." />
      </div>
      <div>
        <label for="default-material-processing">Processing (comma-separated)</label>
        <input id="default-material-processing" name="default_material_processing" placeholder="Tempered, quenched, welded" />
      </div>
      <div>
        <label for="default-material-tags">Tags (comma-separated)</label>
        <input id="default-material-tags" name="default_material_tags" placeholder="Structural steel, microalloyed" />
      </div>
    </div>
    <div>
      <label for="default-material-notes">Material notes (optional)</label>
      <textarea id="default-material-notes" name="default_material_notes" placeholder="Specimen geometry, preparation, or other notes."></textarea>
    </div>
    <div>
      <label for="default-material-composition">Composition (optional)</label>
      <textarea id="default-material-composition" name="default_material_composition" placeholder="Chemical composition, wt% or at%"></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Defaults (conditions & metadata)</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-method">Measurement method</label>
        <input id="default-method" name="default_measurement_method" placeholder="Electrochemical permeation, CGHE, etc." />
      </div>
      <div>
        <label for="default-charging">Charging method</label>
        <input id="default-charging" name="default_charging_method" placeholder="electrochemical, gas, not_reported" />
      </div>
      <div>
        <label for="default-thickness">Specimen thickness (mm)</label>
        <input id="default-thickness" name="default_specimen_thickness_mm" type="number" step="any" />
      </div>
      <div>
        <label for="default-reported-as">Reported as</label>
        <input id="default-reported-as" name="default_reported_as" placeholder="effective, lattice, apparent" />
      </div>
      <div>
        <label for="default-studied-effects">Studied effects (comma-separated)</label>
        <input id="default-studied-effects" name="default_studied_effects" placeholder="Alloying elements, trapping, etc." />
      </div>
      <div>
        <label for="default-units-diff">Diffusivity unit</label>
        <input id="default-units-diff" name="default_diffusivity_unit" value="mm^2/s" />
      </div>
      <div>
        <label for="default-units-temp">Temperature unit</label>
        <select id="default-units-temp" name="default_temperature_unit">
          <option value="K">K</option>
          <option value="C">C</option>
        </select>
      </div>
    </div>
    <div>
      <label for="default-conditions-notes">Conditions notes (optional)</label>
      <textarea id="default-conditions-notes" name="default_conditions_notes" placeholder="Electrolyte, current density, or other test details."></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Data rows (one row per model or single point)</legend>
    <p class="hdd-contrib-note">
      Required columns: group + series name, model type, Tmin, Tmax. Use the Overrides (JSON) column to override
      any default field for a specific row.
    </p>
    <div style="overflow:auto;">
      <table class="hdd-contrib-table" aria-label="Contribution rows">
        <thead>
          <tr>
            <th>Group name</th>
            <th>Series name</th>
            <th>Model type</th>
            <th>Tmin</th>
            <th>Tmax</th>
            <th>Single point T</th>
            <th>Single point D</th>
            <th>Arrhenius D0</th>
            <th>Arrhenius Q</th>
            <th>Arrhenius R</th>
            <th>Power A</th>
            <th>Power n</th>
            <th>Power input</th>
            <th>Overrides (JSON)</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody id="hdd-contrib-rows"></tbody>
      </table>
    </div>
    <div class="hdd-contrib-row-actions">
      <button type="button" id="hdd-add-row" class="primary">Add row</button>
      <button type="button" id="hdd-clear-rows">Clear rows</button>
      <span class="hdd-contrib-note">Example override: {"material": {"grade": "AISI 4340"}, "conditions": {"measurement_method": "Permeation"}}</span>
    </div>
  </fieldset>

  <fieldset>
    <legend>Supporting Links</legend>
    <label for="contrib-links">Figures / tables / supplemental data (optional)</label>
    <textarea id="contrib-links" name="supporting_links" placeholder="Paste URLs to figures, tables, or spreadsheets"></textarea>
  </fieldset>

  <fieldset>
    <legend>Confirmations</legend>
    <label><input type="checkbox" name="confirm_peer_reviewed" required /> This source is peer-reviewed and open-access.</label>
    <label><input type="checkbox" name="confirm_bounds" required /> The parameters are within the stated temperature bounds (no extrapolation).</label>
    <label><input type="checkbox" name="confirm_rights" required /> I have the right to share these parameters and links for review.</label>
  </fieldset>

  <div class="hdd-contrib-actions">
    <button type="submit">Submit for Review</button>
    <span class="hdd-contrib-status" id="hdd-contrib-status"></span>
  </div>
  <div class="hdd-contrib-local">
    <label><input type="checkbox" id="hdd-local-mode" /> Local test mode (do not submit)</label>
    <button type="button" id="hdd-show-json">Preview JSON</button>
    <button type="button" id="hdd-copy-json">Copy JSON</button>
    <button type="button" id="hdd-download-json">Download JSON</button>
  </div>
  <textarea id="hdd-json-preview" class="hdd-contrib-preview" readonly placeholder="JSON preview will appear here."></textarea>
</form>
<script src="/hdd/hdd-contribution.js" defer></script>
