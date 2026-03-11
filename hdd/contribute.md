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

## Planned Workflow

- **Validation:** automated linting ensures parameters, units, and ranges conform to the upstream JSON schema.
- **Queue:** submissions are emailed/webhooked to maintainers for manual verification; no automatic publishing to `hydrogen-diffusion-database`.
- **Status updates:** contributors receive confirmation plus a link to track review progress.

## Submit a Contribution

Please fill in the form below. We manually review every submission before updating the database.

<style>
  .hdd-contrib-form {
    margin: 1.5rem auto 0;
    max-width: 820px;
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
</style>

<form class="hdd-contrib-form" id="hydrogen-contribution-form" action="https://formspree.io/f/xjgawgej" method="POST" novalidate>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Hydrogen Diffusivity Contribution" />

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
  </fieldset>

  <fieldset>
    <legend>Material</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-material">Material name</label>
        <input id="contrib-material" name="material_name" required />
      </div>
      <div>
        <label for="contrib-specimen">Specimen form (optional)</label>
        <input id="contrib-specimen" name="specimen_form" placeholder="Sheet, wire, sphere, weldment" />
      </div>
    </div>
    <div>
      <label for="contrib-composition">Composition (optional)</label>
      <textarea id="contrib-composition" name="material_composition" placeholder="Chemical composition, wt% or at%"></textarea>
    </div>
  </fieldset>

  <fieldset>
    <legend>Models & Parameters</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-model-types">Model types</label>
        <select id="contrib-model-types" name="model_types" multiple required>
          <option value="single_point">single_point</option>
          <option value="arrhenius">arrhenius</option>
          <option value="power">power</option>
        </select>
        <div class="hdd-contrib-note">Hold Ctrl/Cmd to select multiple.</div>
      </div>
      <div>
        <label for="contrib-temps">Temperature bounds</label>
        <input id="contrib-temps" name="temperature_bounds" placeholder="Tmin, Tmax (e.g., 300, 900)" required />
      </div>
      <div>
        <label for="contrib-temp-units">Temperature units</label>
        <input id="contrib-temp-units" name="temperature_units" placeholder="K (preferred)" required />
      </div>
    </div>
    <div>
      <label for="contrib-params">Parameters (one block per series)</label>
      <textarea id="contrib-params" name="model_parameters" placeholder="series_id: my_series_1&#10;model: arrhenius&#10;D0: <value>&#10;Q: <value>&#10;units: D0 [m^2/s], Q [kJ/mol]&#10;Tmin: <value>&#10;Tmax: <value>&#10;notes: <optional>" required></textarea>
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
</form>
<script src="/hdd/hdd-contribution.js" defer></script>
