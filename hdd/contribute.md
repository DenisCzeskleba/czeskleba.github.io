---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen-diffusion-database/contribute/
---

# Contribution Form

Help expand the hydrogen diffusivity dataset by submitting peer-reviewed, open-access sources. We review every entry before adding it to the public database.

## Submission Checklist

1. Publication metadata: title, authors, journal, year, DOI, and open-access URL.
2. Model definitions: single-point, Arrhenius, or power-law parameters (with valid temperature ranges).
3. Contact info: name + email for follow-up.

## Submission Flow

- **Validation:** the form checks ranges and required parameters before sending.
- **Queue:** submissions are emailed for manual verification; no automatic publishing.
- **Additions:** verified submissions are added to the public database.

## Submit a Contribution

Please fill in the form below. Optional fields can be left empty if not needed. Hover each field for a quick tip.

<style>
  main {
    max-width: 1100px;
    text-align: left;
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  .hdd-contrib-rows {
    display: grid;
    gap: 16px;
  }
  .hdd-contrib-row {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
    background: color-mix(in srgb, var(--bg) 95%, var(--text));
  }
  .hdd-contrib-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .hdd-contrib-row-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  .hdd-contrib-row button {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }
  .hdd-contrib-row button.primary {
    background: #1f2937;
    color: #fff;
    border-color: transparent;
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
        <input id="contrib-name" name="name" required title="Required for submission. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-email">Email</label>
        <input id="contrib-email" name="email" type="email" required title="Required for submission. Leave empty if not needed and explain in notes." />
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Publication</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-title">Title</label>
        <input id="contrib-title" name="paper_title" required title="Paper title. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-authors">Authors</label>
        <input id="contrib-authors" name="authors" required title="Comma-separated author list. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-journal">Journal / Venue</label>
        <input id="contrib-journal" name="journal" required title="Journal or venue name. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-year">Year</label>
        <input id="contrib-year" name="year" placeholder="YYYY" required title="Publication year. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-doi">DOI</label>
        <input id="contrib-doi" name="doi" title="DOI string if available. Leave empty if not needed." />
      </div>
      <div>
        <label for="contrib-oa">Open-access URL</label>
        <input id="contrib-oa" name="oa_url" type="url" required title="Open-access link to the paper. Leave empty if not needed and explain in notes." />
      </div>
    </div>
    <div>
      <label for="contrib-notes">Paper notes (optional)</label>
      <textarea id="contrib-notes" name="paper_notes" placeholder="Context, special handling, or clarifications. Leave empty if not needed." title="Optional notes about the paper. Leave empty if not needed."></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Defaults (apply to all rows unless overridden)</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-material-class">Material class</label>
        <select id="default-material-class" name="default_material_class" title="Pick the closest material class. Leave empty if not needed.">
          <option value="">Select a class</option>
          <option value="Carbon Steel">Carbon Steel</option>
          <option value="Creep Resistant Steel">Creep Resistant Steel</option>
          <option value="HSLA">HSLA</option>
          <option value="Iron-Nickel Alloy">Iron-Nickel Alloy</option>
          <option value="Low Alloy Steel">Low Alloy Steel</option>
          <option value="Martensitic or AHSS">Martensitic or AHSS</option>
          <option value="Nickel-Based Alloy">Nickel-Based Alloy</option>
          <option value="Pearlitic Steel">Pearlitic Steel</option>
          <option value="Pipeline Steel">Pipeline Steel</option>
          <option value="Pure Iron">Pure Iron</option>
          <option value="Stainless Steel">Stainless Steel</option>
          <option value="Structural Steel">Structural Steel</option>
          <option value="Unspecified Steel">Unspecified Steel</option>
          <option value="Other">Other (specify below)</option>
        </select>
      </div>
      <div>
        <label for="default-material-class-other">Material class (other)</label>
        <input id="default-material-class-other" name="default_material_class_other" placeholder="Specify if Other" title="Only needed if you chose Other. Leave empty if not needed." />
      </div>
      <div>
        <label for="default-material-grade">Material grade</label>
        <input id="default-material-grade" name="default_material_grade" placeholder="e.g., 2.25Cr-1Mo steel" title="Specific grade or alloy name. Leave empty if not needed." />
      </div>
      <div>
        <label for="default-material-microstructure">Microstructure</label>
        <input id="default-material-microstructure" name="default_material_microstructure" placeholder="Base material, weld metal" title="Use Base Material for non-welding cases, or leave empty if not needed." />
      </div>
      <div>
        <label for="default-material-phase">Phase</label>
        <input id="default-material-phase" name="default_material_phase" placeholder="Ferritic, Austenitic, etc." title="Phase if reported. Leave empty if not needed." />
      </div>
      <div>
        <label for="default-material-processing">Processing (comma-separated)</label>
        <input id="default-material-processing" name="default_material_processing" placeholder="Tempered, quenched, welded" title="Comma-separated processing steps. Leave empty if not needed." />
      </div>
      <div>
        <label for="default-material-tags">Tags (comma-separated)</label>
        <input id="default-material-tags" name="default_material_tags" placeholder="Structural steel, microalloyed" title="Comma-separated tags. Leave empty if not needed." />
      </div>
    </div>
    <div>
      <label for="default-material-notes">Material notes (optional)</label>
      <textarea id="default-material-notes" name="default_material_notes" placeholder="Specimen geometry, preparation, or other notes. Leave empty if not needed." title="Optional material notes. Leave empty if not needed."></textarea>
    </div>
    <div>
      <label for="default-material-composition-notes">Composition notes (optional)</label>
      <textarea id="default-material-composition-notes" name="default_material_composition_notes" placeholder="Any extra composition context. Leave empty if not needed." title="Optional composition notes. Leave empty if not needed."></textarea>
    </div>
    <div class="hdd-contrib-grid">
      <div>
        <label for="comp-c">C (wt%)</label>
        <input id="comp-c" name="comp_c" type="number" step="any" title="Carbon in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-mn">Mn (wt%)</label>
        <input id="comp-mn" name="comp_mn" type="number" step="any" title="Manganese in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-si">Si (wt%)</label>
        <input id="comp-si" name="comp_si" type="number" step="any" title="Silicon in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-cr">Cr (wt%)</label>
        <input id="comp-cr" name="comp_cr" type="number" step="any" title="Chromium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-ni">Ni (wt%)</label>
        <input id="comp-ni" name="comp_ni" type="number" step="any" title="Nickel in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-mo">Mo (wt%)</label>
        <input id="comp-mo" name="comp_mo" type="number" step="any" title="Molybdenum in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-v">V (wt%)</label>
        <input id="comp-v" name="comp_v" type="number" step="any" title="Vanadium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-nb">Nb (wt%)</label>
        <input id="comp-nb" name="comp_nb" type="number" step="any" title="Niobium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-ti">Ti (wt%)</label>
        <input id="comp-ti" name="comp_ti" type="number" step="any" title="Titanium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-al">Al (wt%)</label>
        <input id="comp-al" name="comp_al" type="number" step="any" title="Aluminum in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-cu">Cu (wt%)</label>
        <input id="comp-cu" name="comp_cu" type="number" step="any" title="Copper in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-p">P (wt%)</label>
        <input id="comp-p" name="comp_p" type="number" step="any" title="Phosphorus in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-s">S (wt%)</label>
        <input id="comp-s" name="comp_s" type="number" step="any" title="Sulfur in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
      <div>
        <label for="comp-n">N (wt%)</label>
        <input id="comp-n" name="comp_n" type="number" step="any" title="Nitrogen in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." />
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Conditions</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-method">Measurement method</label>
        <input id="default-method" name="default_measurement_method" placeholder="Electrochemical permeation, CGHE, etc." title="Measurement method. Leave empty if not needed." />
      </div>
      <div>
        <label for="default-charging">Charging method</label>
        <input id="default-charging" name="default_charging_method" placeholder="electrochemical, gas, not_reported" title="Charging method. Leave empty if not needed." />
      </div>
    </div>
    <div>
      <label for="default-conditions-notes">Conditions notes (optional)</label>
      <textarea id="default-conditions-notes" name="default_conditions_notes" placeholder="Electrolyte, current density, or other test details. Leave empty if not needed." title="Optional conditions notes. Leave empty if not needed."></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Metadata</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-studied-effects">Studied effects (comma-separated)</label>
        <input id="default-studied-effects" name="default_studied_effects" placeholder="Alloying elements, trapping, etc." title="Comma-separated effects. Leave empty if not needed." />
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Data rows (one row per model or single point)</legend>
    <p class="hdd-contrib-note">
      Required columns: group + series name, model type, Tmin, Tmax.
    </p>
    <div id="hdd-contrib-rows" class="hdd-contrib-rows"></div>
    <div class="hdd-contrib-row-actions">
      <button type="button" id="hdd-add-row" class="primary">Add row</button>
    </div>
  </fieldset>

  <fieldset>
    <legend>Confirmations</legend>
    <label><input type="checkbox" name="confirm_peer_reviewed" required title="Required. Leave empty if not needed." /> This source is peer-reviewed and open-access.</label>
    <label><input type="checkbox" name="confirm_rights" required title="Required. Leave empty if not needed." /> I have the right to share these parameters and links for review.</label>
  </fieldset>

  <div class="hdd-contrib-actions">
    <button type="submit">Submit for Review</button>
    <span class="hdd-contrib-status" id="hdd-contrib-status"></span>
  </div>
  <div class="hdd-contrib-local">
    <label><input type="checkbox" id="hdd-local-mode" title="Generate JSON locally without sending a submission. Leave empty if not needed." /> Local test mode (do not submit)</label>
    <button type="button" id="hdd-show-json">Preview JSON</button>
    <button type="button" id="hdd-copy-json">Copy JSON</button>
    <button type="button" id="hdd-download-json">Download JSON</button>
  </div>
  <textarea id="hdd-json-preview" class="hdd-contrib-preview" readonly placeholder="JSON preview will appear here." title="Local JSON preview. Leave empty if not needed."></textarea>
</form>
<script src="/hdd/hdd-contribution.js" defer></script>
