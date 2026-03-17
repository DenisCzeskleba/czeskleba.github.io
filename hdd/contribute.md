---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen-diffusion-database/contribute/
---

<h1>Contribution Form</h1>

<p>Help expand the hydrogen diffusivity database for structural steels and related materials. Submit peer-reviewed, open-access sources. We review every entry before adding it to the public dataset. This form is still experimental; please send suggestions to Denis@Czeskleba.com and we will make sure your data is added with the text, info, and tags you need.</p>

<h2>Submission Flow</h2>

<p><strong>Fill out the form below with:</strong></p>
<ol>
  <li>Publication metadata: title, authors, journal, year, DOI, open-access URL, abstract, volume/issue/pages, language, and keywords.</li>
  <li>Model definitions: single-point, Arrhenius, or power-law parameters (with valid temperature ranges).</li>
  <li>Contact info: name + email for follow-up.</li>
</ol>

<ul>
  <li><strong>Validation:</strong> the form checks ranges and required parameters before sending.</li>
  <li><strong>Queue:</strong> submissions are emailed for manual verification; no automatic publishing.</li>
  <li><strong>Additions:</strong> verified submissions are added to the public database.</li>
</ul>

<h2>Submit a Contribution</h2>

<p>Please fill in the form below. Optional fields can be left empty if not needed. Hover each field for a quick tip.</p>

<style>
  main {
    max-width: 1280px;
    text-align: left;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hdd-contrib-form {
    margin: 1.5rem auto 0;
    max-width: 1280px;
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
  .hdd-contrib-grid > * {
    min-width: 0;
  }
  .hdd-contrib-form label {
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
  }
  .hdd-contrib-form .hdd-required {
    color: #b91c1c;
    margin-left: 4px;
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
  .hdd-contrib-form input,
  .hdd-contrib-form select {
    height: 42px;
  }
  .hdd-contrib-form select[multiple] {
    height: auto;
    min-height: 120px;
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
  .hdd-contrib-override {
    margin-top: 12px;
    border: 1px dashed var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    background: color-mix(in srgb, var(--bg) 97%, var(--text));
  }
  .hdd-contrib-override summary {
    cursor: pointer;
    font-weight: 600;
    margin-bottom: 8px;
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
  .hdd-comp-grid {
    display: grid;
    gap: 2px;
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }
  .hdd-comp-item {
    padding: 4px 2px;
  }
  .hdd-comp-item input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
  .hdd-comp-element {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
    justify-content: center;
  }
  .hdd-comp-element input {
    font-weight: 600;
    text-align: center;
    border: none;
    background: transparent;
    padding: 0;
    height: auto;
    box-shadow: none;
  }
  .hdd-comp-actions {
    margin-top: 12px;
    margin-bottom: 6px;
  }
  .hdd-comp-actions button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }
  .hdd-comp-remove {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0;
  }
  .hdd-comp-notes {
    margin-top: 12px;
  }
  .hdd-comp-details {
    margin-top: 12px;
  }
  .hdd-tag-details {
    margin-top: 12px;
  }
  .hdd-data-notes {
    margin-top: 12px;
  }
  .hdd-conditions-notes {
    margin-top: 12px;
  }
  .hdd-surface-notes {
    margin-top: 12px;
  }
  .hdd-conditional {
    display: none;
  }
  .hdd-conditional.is-active {
    display: block;
  }
  .hdd-simple-table {
    width: 100%;
    border-collapse: collapse;
  }
  .hdd-simple-table th,
  .hdd-simple-table td {
    border: none;
    padding: 6px 8px;
    text-align: left;
  }
  .hdd-simple-table th {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text);
  }
  .hdd-simple-table input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
  .hdd-simple-actions {
    margin-top: 8px;
  }
  .hdd-simple-actions button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }
  .hdd-author-remove {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    white-space: nowrap;
  }
  .hdd-authors-table th:last-child,
  .hdd-authors-table td:last-child {
    width: 1%;
    white-space: nowrap;
  }
  .hdd-keywords-block {
    margin-top: 8px;
  }
  .hdd-contrib-form textarea.hdd-title-input {
    min-height: 44px;
    height: auto;
    resize: none;
    padding: 4px 8px;
    line-height: 1.1;
    overflow: hidden;
  }
  .hdd-grid-span {
    grid-column: 1 / -1;
  }
  .hdd-authors-table {
    margin-top: 6px;
    margin-left: -8px;
  }
  .hdd-authors-table tbody tr td {
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .hdd-contrib-form details > summary {
    font-weight: 600;
    font-size: 1rem;
  }
  .hdd-section-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }
  .hdd-section-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
    font-weight: 600;
  }
  .hdd-section-heading::before,
  .hdd-section-heading::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--border);
  }
  .hdd-contrib-inline-selects {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    margin-top: 6px;
  }
  .hdd-contrib-inline-selects input {
    width: 100%;
  }
  .hdd-tag-grid {
    display: grid;
    gap: 8px 12px;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    margin-top: 8px;
  }
  .hdd-tag-grid label {
    font-weight: 500;
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 0;
  }
  .hdd-tag-grid input[type="checkbox"] {
    width: auto;
    height: auto;
    margin: 0;
  }
  .hdd-contrib-form input,
  .hdd-contrib-form select {
    height: 32px;
    padding: 6px 10px;
  }
</style>

<form class="hdd-contrib-form" id="hydrogen-contribution-form" action="https://formspree.io/f/xjgawgej" method="POST" novalidate>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Hydrogen Diffusivity Contribution" />
  <textarea name="submission_json" id="hdd-submission-json" style="display:none"></textarea>

  <fieldset>
    <legend>Publication</legend>
    <div class="hdd-contrib-grid">
      <div class="hdd-grid-span">
        <label for="contrib-title">Title<span class="hdd-required" aria-hidden="true">*</span></label>
        <textarea
          id="contrib-title"
          name="paper_title"
          required
          rows="1"
          class="hdd-title-input"
          autocomplete="off"
        ></textarea>
      </div>
      <div class="hdd-grid-span">
        <label>Authors</label>
        <table class="hdd-simple-table hdd-authors-table" id="hdd-authors-table">
          <thead>
            <tr>
              <th>First name<span class="hdd-required" aria-hidden="true">*</span></th>
              <th>Last name<span class="hdd-required" aria-hidden="true">*</span></th>
              <th>ORCID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr data-author-row>
              <td><input type="text" name="author_first[]" data-author-first required autocomplete="given-name" /></td>
              <td><input type="text" name="author_last[]" data-author-last required autocomplete="family-name" /></td>
              <td><input type="text" name="author_orcid[]" data-author-orcid autocomplete="off" pattern="^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$" /></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="hdd-simple-actions">
          <button type="button" id="hdd-author-add">Add author</button>
        </div>
      </div>
      <div>
        <label for="contrib-journal">Journal / Venue<span class="hdd-required" aria-hidden="true">*</span></label>
        <input id="contrib-journal" name="journal" required autocomplete="organization" />
      </div>
      <div>
        <label for="contrib-volume">Volume</label>
        <input id="contrib-volume" name="volume" autocomplete="off" />
      </div>
      <div>
        <label for="contrib-issue">Issue</label>
        <input id="contrib-issue" name="issue" autocomplete="off" />
      </div>
      <div>
        <label for="contrib-pages">Pages</label>
        <input id="contrib-pages" name="pages" autocomplete="off" />
      </div>
      <div>
        <label for="contrib-year">Year<span class="hdd-required" aria-hidden="true">*</span></label>
        <input
          id="contrib-year"
          name="year"
          type="number"
          inputmode="numeric"
          min="1800"
          max="2100"
          required
          autocomplete="off"
        />
      </div>
      <div>
        <label for="contrib-doi">DOI<span class="hdd-required" aria-hidden="true">*</span></label>
        <input id="contrib-doi" name="doi" required autocomplete="off" />
      </div>
      <div>
        <label for="contrib-oa">Open-access URL<span class="hdd-required" aria-hidden="true">*</span></label>
        <input id="contrib-oa" name="oa_url" type="url" required autocomplete="url" />
      </div>
      <div>
        <label for="contrib-language">Language<span class="hdd-required" aria-hidden="true">*</span></label>
        <select id="contrib-language" name="language" required autocomplete="off">
          <option value="">Select language</option>
          <option value="Arabic">Arabic</option>
          <option value="Bengali">Bengali</option>
          <option value="Bulgarian">Bulgarian</option>
          <option value="Chinese">Chinese</option>
          <option value="Croatian">Croatian</option>
          <option value="Czech">Czech</option>
          <option value="Danish">Danish</option>
          <option value="Dutch">Dutch</option>
          <option value="English">English</option>
          <option value="Estonian">Estonian</option>
          <option value="Finnish">Finnish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Greek">Greek</option>
          <option value="Hebrew">Hebrew</option>
          <option value="Hindi">Hindi</option>
          <option value="Hungarian">Hungarian</option>
          <option value="Indonesian">Indonesian</option>
          <option value="Italian">Italian</option>
          <option value="Japanese">Japanese</option>
          <option value="Korean">Korean</option>
          <option value="Latvian">Latvian</option>
          <option value="Lithuanian">Lithuanian</option>
          <option value="Malay">Malay</option>
          <option value="Norwegian">Norwegian</option>
          <option value="Persian">Persian</option>
          <option value="Polish">Polish</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Romanian">Romanian</option>
          <option value="Russian">Russian</option>
          <option value="Serbian">Serbian</option>
          <option value="Slovak">Slovak</option>
          <option value="Slovenian">Slovenian</option>
          <option value="Spanish">Spanish</option>
          <option value="Swedish">Swedish</option>
          <option value="Thai">Thai</option>
          <option value="Turkish">Turkish</option>
          <option value="Ukrainian">Ukrainian</option>
          <option value="Urdu">Urdu</option>
          <option value="Vietnamese">Vietnamese</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
    </div>
    <div class="hdd-contrib-grid">
      <div class="hdd-grid-span">
        <label>Research focus<span class="hdd-required" aria-hidden="true">*</span></label>
        <p class="hdd-contrib-note">
          Select the diffusion mechanisms or material features investigated in the publication that may influence hydrogen diffusion (e.g., microstructure, alloying elements, trapping, surface effects).
          Papers may address multiple effects, and precise classification is not required. These tags are used for literature discovery and statistical grouping.
        </p>
        <div class="hdd-contrib-inline-selects">
          <select name="studied_effects[]" data-studied-effect>
            <option value="">Select focus</option>
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
            <option value="Propose new (specify in notes)">Propose new (specify in notes)</option>
          </select>
          <select name="studied_effects[]" data-studied-effect>
            <option value="">Select focus</option>
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
            <option value="Propose new (specify in notes)">Propose new (specify in notes)</option>
          </select>
          <select name="studied_effects[]" data-studied-effect>
            <option value="">Select focus</option>
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
            <option value="Propose new (specify in notes)">Propose new (specify in notes)</option>
          </select>
        </div>
      </div>
      <div class="hdd-grid-span">
        <details>
          <summary>Abstract</summary>
          <textarea
            id="contrib-abstract"
            name="abstract"
            placeholder="Abstract text."
            autocomplete="off"
          ></textarea>
        </details>
      </div>
      <div class="hdd-grid-span">
        <details>
          <summary>Additional notes</summary>
          <textarea
            id="contrib-notes"
            name="paper_notes"
            placeholder="Additional context that helps place the paper and its results."
            autocomplete="off"
          ></textarea>
        </details>
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Experimental Setup</legend>
    <p class="hdd-contrib-note">
      Use these defaults to describe the general parameters of the diffusion measurements. If you varied one of these in your study, keep the default here and specify the variation per data row below. Most studies will only have one material but if you have multiple different ones, pick one here and then adjust the variations on a per data-series level below. For example if you worked with X65 and CrMoV in one study for some reason, class/grade etc. varies, so adjust this in the data section.
    </p>
    <p class="hdd-contrib-note">Examples:</p>
    <ul class="hdd-contrib-note">
      <li>
        You measured diffusion as part of other experiments on as-received X80 pipeline steel. You might choose base
        material (no welding), leave phase blank, and add a Microalloys tag. If you varied V across multiple samples
        (e.g., 0.01-0.05 wt.%), set it to 0.01 wt.% here and change wt.% per series below.
      </li>
      <li>
        If the material is HSLA S690 and you varied the processing route (quenched vs. thermomechanically rolled),
        pick one route here and set the other on the specific data row.
      </li>
    </ul>
    <div class="hdd-section-heading">Data origin</div>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-data-origin">Data source<span class="hdd-required" aria-hidden="true">*</span></label>
        <p class="hdd-contrib-note">
          Select whether you directly measured diffusion coefficients or calculated/simulated them. "Extracted from graph"
          and "Literature review" should mostly be legacy options, but feel free to provide additional info below.
        </p>
        <select id="contrib-data-origin" name="data_origin" required>
          <option value="Direct measurement" selected>Direct measurement</option>
          <option value="Calculated / Simulation">Calculated / Simulation</option>
          <option value="Extracted from graph">Extracted from graph</option>
          <option value="Literature review">Literature review</option>
          <option value="Other (specify in notes)">Other (specify in notes)</option>
        </select>
      </div>
    </div>
    <div class="hdd-grid-span hdd-data-notes">
      <details>
        <summary>Data notes</summary>
        <textarea
          id="contrib-data-notes"
          name="data_notes"
          placeholder="Additional context about where the data came from and any caveats."
          autocomplete="off"
        ></textarea>
      </details>
    </div>
    <div class="hdd-section-heading">Materials</div>
    <p class="hdd-contrib-note">
      Select the material class and grade that best match the paper. Add microstructure, phase, processing, and tags to
      capture the key material context. Chemical composition is optional but highly recommended.
    </p>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-material-class">Material class<span class="hdd-required" aria-hidden="true">*</span></label>
        <select id="default-material-class" name="default_material_class" required title="Pick the closest material class. If not listed, choose Other and specify in Material notes.">
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
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-material-grade">Material grade<span class="hdd-required" aria-hidden="true">*</span></label>
        <select id="default-material-grade" name="default_material_grade" required title="Pick the closest grade. If not listed, choose Other and specify in Material notes.">
          <option value="">Select a grade</option>
          <option value="10G2 steel">10G2 steel</option>
          <option value="15G2ANb">15G2ANb</option>
          <option value="17-4 PH">17-4 PH</option>
          <option value="17HMBVA">17HMBVA</option>
          <option value="1Cr21Ni5Ti">1Cr21Ni5Ti</option>
          <option value="2.25Cr-1Mo steel">2.25Cr-1Mo steel</option>
          <option value="25Kh2NMFA steel">25Kh2NMFA steel</option>
          <option value="304 stainless steel">304 stainless steel</option>
          <option value="32MnB5">32MnB5</option>
          <option value="3Cr-1Mo steel">3Cr-1Mo steel</option>
          <option value="40Kh steel">40Kh steel</option>
          <option value="42CrMo4">42CrMo4</option>
          <option value="9Cr-1Mo steel">9Cr-1Mo steel</option>
          <option value="A508 Class 3">A508 Class 3</option>
          <option value="AISI 1090">AISI 1090</option>
          <option value="AISI 4120">AISI 4120</option>
          <option value="AISI 4130">AISI 4130</option>
          <option value="AISI 4140">AISI 4140</option>
          <option value="AISI 4340">AISI 4340</option>
          <option value="Alloy 625">Alloy 625</option>
          <option value="API 2W Grade 60">API 2W Grade 60</option>
          <option value="API X100">API X100</option>
          <option value="API X120">API X120</option>
          <option value="API X42">API X42</option>
          <option value="API X52">API X52</option>
          <option value="API X65">API X65</option>
          <option value="API X70">API X70</option>
          <option value="API X80">API X80</option>
          <option value="ASTM A106 Grade B">ASTM A106 Grade B</option>
          <option value="ASTM A516 Grade 60">ASTM A516 Grade 60</option>
          <option value="En 8">En 8</option>
          <option value="EN42">EN42</option>
          <option value="HSLA-100">HSLA-100</option>
          <option value="HSLA-80">HSLA-80</option>
          <option value="JIS SCM435">JIS SCM435</option>
          <option value="P91">P91</option>
          <option value="P92">P92</option>
          <option value="Pure iron">Pure iron</option>
          <option value="Q235">Q235</option>
          <option value="REX 539">REX 539</option>
          <option value="S15C">S15C</option>
          <option value="S355">S355</option>
          <option value="S420">S420</option>
          <option value="S45C">S45C</option>
          <option value="S690">S690</option>
          <option value="S890">S890</option>
          <option value="SAE 1010">SAE 1010</option>
          <option value="SAE 1020">SAE 1020</option>
          <option value="SAE 1035">SAE 1035</option>
          <option value="SAE 1050">SAE 1050</option>
          <option value="SAE 1065">SAE 1065</option>
          <option value="SAE 1095">SAE 1095</option>
          <option value="SCM3">SCM3</option>
          <option value="SCM4">SCM4</option>
          <option value="SCr2">SCr2</option>
          <option value="SCr3">SCr3</option>
          <option value="SCr4">SCr4</option>
          <option value="SK3">SK3</option>
          <option value="SK5">SK5</option>
          <option value="SK7">SK7</option>
          <option value="SNC2">SNC2</option>
          <option value="SNC3">SNC3</option>
          <option value="SNCM2">SNCM2</option>
          <option value="SNCM5">SNCM5</option>
          <option value="SNCM6">SNCM6</option>
          <option value="SNCM7">SNCM7</option>
          <option value="SNCM8">SNCM8</option>
          <option value="St 1303">St 1303</option>
          <option value="St41">St41</option>
          <option value="T10">T10</option>
          <option value="T24">T24</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-microstructure-enabled">Welded</label>
        <select id="default-microstructure-enabled" name="default_microstructure_enabled" title="Set to yes for welded material.">
          <option value="no" selected>No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div data-microstructure-block>
        <label for="default-material-microstructure">Microstructure<span class="hdd-required" aria-hidden="true">*</span></label>
        <select id="default-material-microstructure" name="default_material_microstructure" title="Use Base Material for non-welding cases. If not listed, choose Other and specify in Material notes.">
          <option value="">Select microstructure</option>
          <option value="Base Material">Base Material</option>
          <option value="CGHAZ">CGHAZ</option>
          <option value="FGHAZ">FGHAZ</option>
          <option value="HAZ">HAZ</option>
          <option value="ICHAZ">ICHAZ</option>
          <option value="Weld Metal">Weld Metal</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-material-phase">Phase</label>
        <select id="default-material-phase" name="default_material_phase" title="Phase if reported. If not listed, choose Other and specify in Material notes.">
          <option value="">Select phase</option>
          <option value="Austenitic">Austenitic</option>
          <option value="Bainitic/Pearlitic">Bainitic/Pearlitic</option>
          <option value="Ferritic">Ferritic</option>
          <option value="Martensitic">Martensitic</option>
          <option value="Multiphase">Multiphase</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-material-processing">Processing</label>
        <select id="default-material-processing" name="default_material_processing" title="Primary processing step. If not listed, choose Other and specify in Material notes.">
          <option value="">Select processing</option>
          <option value="Aged">Aged</option>
          <option value="Annealed">Annealed</option>
          <option value="As received">As received</option>
          <option value="As welded">As welded</option>
          <option value="Normalized">Normalized</option>
          <option value="PWHT">PWHT</option>
          <option value="Q&T">Q&amp;T</option>
          <option value="Quenched">Quenched</option>
          <option value="Stress relief">Stress relief</option>
          <option value="Subzero Treated">Subzero Treated</option>
          <option value="TMCP">TMCP</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
      </div>
    </div>
    <details class="hdd-tag-details hdd-grid-span">
      <summary>Additional Material Tags</summary>
      <p class="hdd-contrib-note">
        Add additional tags to your material for future filtering. For example, an X65 could be a pipeline steel,
        structural steel, HSLA, or low alloyed.
      </p>
      <div class="hdd-tag-grid" id="default-material-tags">
        <label><input type="checkbox" name="default_material_tags[]" value="Carbon Steel" /> Carbon Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Creep Resistant Steel" /> Creep Resistant Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="HSLA" /> HSLA</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Iron-Nickel Alloy" /> Iron-Nickel Alloy</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Low Alloy Steel" /> Low Alloy Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Martensitic or AHSS" /> Martensitic or AHSS</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Nickel-Based Alloy" /> Nickel-Based Alloy</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Pearlitic Steel" /> Pearlitic Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Pipeline Steel" /> Pipeline Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Pure Iron" /> Pure Iron</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Stainless Steel" /> Stainless Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Structural Steel" /> Structural Steel</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Base Material" /> Base Material</label>
        <label><input type="checkbox" name="default_material_tags[]" value="CGHAZ" /> CGHAZ</label>
        <label><input type="checkbox" name="default_material_tags[]" value="FGHAZ" /> FGHAZ</label>
        <label><input type="checkbox" name="default_material_tags[]" value="HAZ" /> HAZ</label>
        <label><input type="checkbox" name="default_material_tags[]" value="ICHAZ" /> ICHAZ</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Weld Metal" /> Weld Metal</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Austenitic" /> Austenitic</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Bainitic/Pearlitic" /> Bainitic/Pearlitic</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Ferritic" /> Ferritic</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Martensitic" /> Martensitic</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Multiphase" /> Multiphase</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Aged" /> Aged</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Annealed" /> Annealed</label>
        <label><input type="checkbox" name="default_material_tags[]" value="As received" /> As received</label>
        <label><input type="checkbox" name="default_material_tags[]" value="As welded" /> As welded</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Cold worked" /> Cold worked</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Normalized" /> Normalized</label>
        <label><input type="checkbox" name="default_material_tags[]" value="PWHT" /> PWHT</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Q&T" /> Q&amp;T</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Quenched" /> Quenched</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Stress relief" /> Stress relief</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Subzero Treated" /> Subzero Treated</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Surface treated" /> Surface treated</label>
        <label><input type="checkbox" name="default_material_tags[]" value="TMCP" /> TMCP</label>
        <label><input type="checkbox" name="default_material_tags[]" value="Other (specify in notes)" /> Other (specify in notes)</label>
      </div>
    </details>
    <details class="hdd-comp-details">
      <summary>Chemical composition</summary>
      <p class="hdd-contrib-note">Use 0.02 or &lt;0.1 in wt.% | Remainder is assumed Fe | Leave empty if not applicable</p>
      <div class="hdd-comp-grid" id="hdd-comp-grid">
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="C" readonly /></div>
        <input type="text" data-comp-value title="Carbon in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Mn" readonly /></div>
        <input type="text" data-comp-value title="Manganese in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Si" readonly /></div>
        <input type="text" data-comp-value title="Silicon in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Cr" readonly /></div>
        <input type="text" data-comp-value title="Chromium in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Ni" readonly /></div>
        <input type="text" data-comp-value title="Nickel in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Mo" readonly /></div>
        <input type="text" data-comp-value title="Molybdenum in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="V" readonly /></div>
        <input type="text" data-comp-value title="Vanadium in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Nb" readonly /></div>
        <input type="text" data-comp-value title="Niobium in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Ti" readonly /></div>
        <input type="text" data-comp-value title="Titanium in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Al" readonly /></div>
        <input type="text" data-comp-value title="Aluminum in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="Cu" readonly /></div>
        <input type="text" data-comp-value title="Copper in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="P" readonly /></div>
        <input type="text" data-comp-value title="Phosphorus in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="S" readonly /></div>
        <input type="text" data-comp-value title="Sulfur in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      <div class="hdd-comp-item" data-comp-item>
        <div class="hdd-comp-element"><input type="text" data-comp-element value="N" readonly /></div>
        <input type="text" data-comp-value title="Nitrogen in wt% (e.g., 0.2 or <0.1). Leave empty if not needed." />
      </div>
      </div>
      <div class="hdd-comp-actions">
        <button type="button" id="hdd-comp-add">Add element</button>
      </div>
    </details>
    <div class="hdd-comp-notes">
      <details>
        <summary>Material notes</summary>
        <textarea id="default-material-notes" name="default_material_notes" placeholder="Any extra material context. Leave empty if not needed." title="Any extra material context. Leave empty if not needed."></textarea>
      </details>
    </div>
    <div data-welding-section>
      <div class="hdd-section-heading">Welding Parameters</div>
      <div class="hdd-contrib-grid">
        <div>
          <label for="default-welding-process">Welding process<span class="hdd-required" aria-hidden="true">*</span></label>
          <select id="default-welding-process" name="default_welding_process">
            <option value="">Select process</option>
            <option value="SMAW">SMAW (Stick)</option>
            <option value="GMAW">GMAW (MIG/MAG)</option>
            <option value="GTAW">GTAW (TIG)</option>
            <option value="SAW">SAW</option>
            <option value="FCAW">FCAW</option>
            <option value="Laser">Laser</option>
            <option value="Electron Beam">Electron Beam</option>
            <option value="Other (specify in notes)">Other (specify in notes)</option>
          </select>
        </div>
        <div>
          <label for="default-welding-layer">Layering<span class="hdd-required" aria-hidden="true">*</span></label>
          <select id="default-welding-layer" name="default_welding_layer">
            <option value="">Select</option>
            <option value="single_layer">Single layer</option>
            <option value="multi_layer">Multi-layer</option>
          </select>
        </div>
        <div>
          <label for="default-welding-t85">t<sub>8/5</sub> (s)<span class="hdd-required" aria-hidden="true">*</span></label>
          <input id="default-welding-t85" name="default_welding_t85" type="number" step="any" placeholder="e.g., 12" />
        </div>
      </div>
      <div class="hdd-comp-notes">
        <details>
          <summary>Welding notes</summary>
          <textarea id="default-welding-notes" name="default_welding_notes" placeholder="Any extra welding context. Leave empty if not needed."></textarea>
        </details>
      </div>
    </div>
    <div class="hdd-section-heading">Hydrogen Measurement</div>
    <p class="hdd-contrib-note">
      Please choose the measurement method and calculation model that best match your paper. If you need an option that
      is not listed, propose it in the measurement notes.
    </p>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-method">Measurement method<span class="hdd-required" aria-hidden="true">*</span></label>
        <select id="default-method" name="default_measurement_method" title="Measurement method. Leave empty if not needed.">
          <option value="">Select method</option>
          <option value="Deflection method">Deflection method</option>
          <option value="Electrical resistance">Electrical resistance</option>
          <option value="Electrochemical permeation">Electrochemical permeation</option>
          <option value="Gas permeation">Gas permeation</option>
          <option value="Hot extraction (CGHE / GC)">Hot extraction (CGHE / GC)</option>
          <option value="Isothermal effusion / degassing">Isothermal effusion / degassing</option>
          <option value="Literature compilation">Literature compilation</option>
          <option value="SIMS">SIMS</option>
          <option value="Thermal desorption (TDA / TDS)">Thermal desorption (TDA / TDS)</option>
          <option value="other_explain">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-charging">Charging method</label>
        <select id="default-charging" name="default_charging_method" title="Charging method. Leave empty if not needed.">
          <option value="">Select method</option>
          <option value="cathodic">Cathodic</option>
          <option value="electrochemical">Electrochemical</option>
          <option value="devanathan_stachursky_cell">Devanathan-Stachursky cell (electrochemical)</option>
          <option value="galvanostatic">Galvanostatic</option>
          <option value="gas_phase">Gas phase</option>
          <option value="high_pressure_hydrogen">High-pressure hydrogen</option>
          <option value="immersion_in_distilled_water">Immersion in distilled water</option>
          <option value="low_pressure_hydrogen">Low-pressure hydrogen</option>
          <option value="other_explain">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-charging-duration">Charging duration [h]</label>
        <input id="default-charging-duration" name="default_charging_duration_h" type="number" step="any" placeholder="e.g., 24" />
      </div>
      <div>
        <label for="default-charging-temperature">Charging temperature [&deg;C]</label>
        <input id="default-charging-temperature" name="default_charging_temperature_c" type="number" step="any" placeholder="e.g., 25" />
      </div>
      <div>
        <label for="default-calculation-model">Calculation model</label>
        <select id="default-calculation-model" name="default_calculation_model" title="Calculation model used to extract diffusivity. Choose Other and explain in notes if needed.">
          <option value="">Select model</option>
          <option value="time_lag_method">Time-lag method</option>
          <option value="breakthrough_time">Breakthrough time</option>
          <option value="inflection_point">Inflection point</option>
          <option value="numerical_fit">Numerical fit</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-reported-as">Diffusivity type</label>
        <select id="default-reported-as" name="default_reported_as" title="Lattice: diffusion in the crystal lattice without trapping. Apparent: measured diffusion including trapping effects. Effective: diffusion when trapping and release reach equilibrium. Note: terminology is sometimes ambiguous in the literature. If unsure, use Apparent.">
          <option value="apparent" selected>Apparent</option>
          <option value="effective">Effective</option>
          <option value="lattice">Lattice</option>
        </select>
      </div>
      <div>
        <label for="default-sample-geometry">Sample geometry</label>
        <select id="default-sample-geometry" name="default_sample_geometry" title="Sample geometry. Leave empty if not needed.">
          <option value="">Select geometry</option>
          <option value="membrane">Membrane</option>
          <option value="plate">Plate</option>
          <option value="sheet">Sheet</option>
          <option value="wire">Wire</option>
          <option value="rod">Rod</option>
          <option value="cylinder">Cylinder</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-characteristic-length">Characteristic length [mm]</label>
        <input id="default-characteristic-length" name="default_characteristic_length" type="number" step="any" placeholder="e.g., 1.2" title="Use the diffusion path length used in the analysis. For flat membranes or plates, this is usually the thickness." />
      </div>
      <div class="hdd-conditional" data-charging="devanathan_stachursky_cell">
        <label for="cond-devanathan-entry-electrolyte">Electrolyte (entry side)</label>
        <select id="cond-devanathan-entry-electrolyte">
          <option value="">Select electrolyte</option>
          <option value="naoh">NaOH</option>
          <option value="h2so4">H2SO4</option>
          <option value="nacl">NaCl</option>
          <option value="borate">Borate</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="devanathan_stachursky_cell">
        <label for="cond-devanathan-exit-electrolyte">Electrolyte (exit side)</label>
        <select id="cond-devanathan-exit-electrolyte">
          <option value="">Select electrolyte</option>
          <option value="naoh">NaOH</option>
          <option value="h2so4">H2SO4</option>
          <option value="nacl">NaCl</option>
          <option value="borate">Borate</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="devanathan_stachursky_cell">
        <label for="cond-devanathan-current-density">Current density [mA/mm&sup2;]</label>
        <input id="cond-devanathan-current-density" type="number" step="any" placeholder="e.g., 0.5" />
      </div>
      <div class="hdd-conditional" data-charging="devanathan_stachursky_cell">
        <label for="cond-devanathan-poison">Poison additive</label>
        <select id="cond-devanathan-poison">
          <option value="">Select additive</option>
          <option value="none">None</option>
          <option value="thiourea">Thiourea</option>
          <option value="as2o3">As2O3</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="high_pressure_hydrogen">
        <label for="cond-high-pressure">Pressure [bar]</label>
        <input id="cond-high-pressure" type="number" step="any" placeholder="e.g., 100" />
      </div>
      <div class="hdd-conditional" data-charging="high_pressure_hydrogen">
        <label for="cond-high-gas">Gas composition</label>
        <input id="cond-high-gas" type="text" placeholder="e.g., H2" />
      </div>
      <div class="hdd-conditional" data-charging="cathodic">
        <label for="cond-cathodic-electrolyte">Electrolyte</label>
        <select id="cond-cathodic-electrolyte">
          <option value="">Select electrolyte</option>
          <option value="naoh">NaOH</option>
          <option value="h2so4">H2SO4</option>
          <option value="nacl">NaCl</option>
          <option value="borate">Borate</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="cathodic">
        <label for="cond-cathodic-current">Current density [mA/cm&sup2;]</label>
        <input id="cond-cathodic-current" type="number" step="any" placeholder="e.g., 5" />
      </div>
      <div class="hdd-conditional" data-charging="cathodic">
        <label for="cond-cathodic-poison">Poison additive</label>
        <select id="cond-cathodic-poison">
          <option value="">Select additive</option>
          <option value="none">None</option>
          <option value="thiourea">Thiourea</option>
          <option value="as2o3">As2O3</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="electrochemical">
        <label for="cond-electrochemical-electrolyte">Electrolyte</label>
        <select id="cond-electrochemical-electrolyte">
          <option value="">Select electrolyte</option>
          <option value="naoh">NaOH</option>
          <option value="h2so4">H2SO4</option>
          <option value="nacl">NaCl</option>
          <option value="borate">Borate</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="electrochemical">
        <label for="cond-electrochemical-control">Control mode</label>
        <select id="cond-electrochemical-control">
          <option value="">Select mode</option>
          <option value="galvanostatic">Galvanostatic</option>
          <option value="potentiostatic">Potentiostatic</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="electrochemical">
        <label for="cond-electrochemical-current">Current density [mA/cm&sup2;]</label>
        <input id="cond-electrochemical-current" type="number" step="any" placeholder="e.g., 5" />
      </div>
      <div class="hdd-conditional" data-charging="electrochemical">
        <label for="cond-electrochemical-potential">Applied potential [V]</label>
        <input id="cond-electrochemical-potential" type="number" step="any" placeholder="e.g., -1.0" />
      </div>
      <div class="hdd-conditional" data-charging="electrochemical">
        <label for="cond-electrochemical-poison">Poison additive</label>
        <select id="cond-electrochemical-poison">
          <option value="">Select additive</option>
          <option value="none">None</option>
          <option value="thiourea">Thiourea</option>
          <option value="as2o3">As2O3</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-charging="gas_phase">
        <label for="cond-gas-phase-composition">Gas composition</label>
        <input id="cond-gas-phase-composition" type="text" placeholder="e.g., H2 + Ar" />
      </div>
      <div class="hdd-conditional" data-charging="gas_phase">
        <label for="cond-gas-phase-pressure">Pressure [bar]</label>
        <input id="cond-gas-phase-pressure" type="number" step="any" placeholder="e.g., 1" />
      </div>
      <div class="hdd-conditional" data-charging="gas_phase">
        <label for="cond-gas-phase-purity">Gas purity</label>
        <input id="cond-gas-phase-purity" type="text" placeholder="e.g., 99.999%" />
      </div>
      <div class="hdd-conditional" data-charging="low_pressure_hydrogen">
        <label for="cond-low-pressure">Pressure [bar]</label>
        <input id="cond-low-pressure" type="number" step="any" placeholder="e.g., 1" />
      </div>
      <div class="hdd-conditional" data-charging="low_pressure_hydrogen">
        <label for="cond-low-gas">Gas composition</label>
        <input id="cond-low-gas" type="text" placeholder="e.g., H2" />
      </div>
      <div class="hdd-conditional" data-charging="immersion_in_distilled_water">
        <label for="cond-distilled-water-notes">Solution notes</label>
        <textarea id="cond-distilled-water-notes" rows="3" placeholder="e.g., distilled water with additives"></textarea>
      </div>
      <div class="hdd-conditional" data-method="Thermal desorption (TDA / TDS)">
        <label for="cond-tda-heating-rate">Heating rate [&deg;C/min]</label>
        <input id="cond-tda-heating-rate" type="number" step="any" placeholder="e.g., 10" />
      </div>
      <div class="hdd-conditional" data-method="Thermal desorption (TDA / TDS)">
        <label for="cond-tda-peak-method">Peak analysis method</label>
        <select id="cond-tda-peak-method">
          <option value="">Select method</option>
          <option value="kissinger">Kissinger</option>
          <option value="peak_fitting">Peak fitting</option>
          <option value="direct_peak_assignment">Direct peak assignment</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-method="Gas permeation">
        <label for="cond-gas-detection">Gas detection mode</label>
        <select id="cond-gas-detection">
          <option value="">Select mode</option>
          <option value="pressure_decay">Pressure decay</option>
          <option value="gas_chromatography">Gas chromatography</option>
          <option value="mass_spectrometry">Mass spectrometry</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-method="SIMS">
        <label for="cond-sims-type">SIMS type</label>
        <select id="cond-sims-type">
          <option value="">Select type</option>
          <option value="tof_sims">TOF-SIMS</option>
          <option value="dynamic_sims">Dynamic SIMS</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-method="Hot extraction (CGHE / GC)">
        <label for="cond-hot-extraction-temp">Extraction temperature [&deg;C]</label>
        <input id="cond-hot-extraction-temp" type="number" step="any" placeholder="e.g., 400" />
      </div>
      <div class="hdd-conditional" data-method="Isothermal effusion / degassing">
        <label for="cond-degassing-temp">Degassing temperature [&deg;C]</label>
        <input id="cond-degassing-temp" type="number" step="any" placeholder="e.g., 200" />
      </div>
    </div>
    <div class="hdd-conditions-notes">
      <details>
        <summary>Measurement notes</summary>
        <textarea id="default-conditions-notes" name="default_conditions_notes" placeholder="Electrolyte, current density, or other test details. Leave empty if not needed." title="Optional conditions notes. Leave empty if not needed."></textarea>
      </details>
    </div>
    <div class="hdd-section-heading">Surface Condition</div>
    <p class="hdd-contrib-note">
      Surface state can strongly affect charging, entry, passivation, and permeability. Please select the appropriate
      surface condition.
    </p>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-surface-condition">Surface condition</label>
        <select id="default-surface-condition" name="default_surface_condition">
          <option value="">Select condition</option>
          <option value="as_received">As received</option>
          <option value="ground">Ground</option>
          <option value="polished">Polished</option>
          <option value="electropolished">Electropolished</option>
          <option value="pickled">Pickled</option>
          <option value="oxidized">Oxidized</option>
          <option value="coated">Coated</option>
          <option value="plated">Plated</option>
          <option value="passivated">Passivated</option>
          <option value="etched">Etched</option>
          <option value="surface_treated">Surface treated</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-surface-finish">Surface finish detail</label>
        <select id="default-surface-finish" name="default_surface_finish_detail">
          <option value="">Select finish</option>
          <option value="grit_240">Grit 240</option>
          <option value="grit_600">Grit 600</option>
          <option value="grit_1200">Grit 1200</option>
          <option value="mirror_polished">Mirror polished</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-surface-coated">Coated</label>
        <select id="default-surface-coated" name="default_surface_coated">
          <option value="no" selected>No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div class="hdd-conditional" data-surface-coated="yes">
        <label for="default-coating-type">Coating type</label>
        <select id="default-coating-type" name="default_coating_type">
          <option value="">Select coating</option>
          <option value="zinc">Zinc</option>
          <option value="nickel">Nickel</option>
          <option value="chromium">Chromium</option>
          <option value="copper">Copper</option>
          <option value="aluminum">Aluminum</option>
          <option value="oxide">Oxide</option>
          <option value="phosphate">Phosphate</option>
          <option value="paint_polymer">Paint / polymer</option>
          <option value="conversion_coating">Conversion coating</option>
          <option value="inhibitor_film">Inhibitor film</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-surface-coated="yes">
        <label for="default-coating-thickness">Coating thickness [&micro;m]</label>
        <input id="default-coating-thickness" name="default_coating_thickness_um" type="number" step="any" placeholder="e.g., 5" />
      </div>
    </div>
    <div class="hdd-surface-notes">
      <details>
        <summary>Surface condition notes</summary>
        <textarea id="default-coating-notes" name="default_coating_notes" rows="3" placeholder="Any surface condition details. Leave empty if not needed."></textarea>
      </details>
    </div>
    <div class="hdd-section-heading">Cold Work and Applied Stresses</div>
    <p class="hdd-contrib-note">
      Plastic deformation and applied stresses can alter trap density, diffusion pathways, and effective diffusivity.
      Please select the options that best match the experimental setup.
    </p>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-deformation-history">Deformation history</label>
        <select id="default-deformation-history" name="default_deformation_history">
          <option value="">Select history</option>
          <option value="cold_worked">Cold worked</option>
          <option value="pre_strained">Pre-strained</option>
          <option value="plastically_deformed">Plastically deformed</option>
          <option value="fatigue_preloaded">Fatigue preloaded</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-deformation="pre_strained" data-deformation-alt="plastically_deformed">
        <label for="default-pre-strain">Pre-strain [%]</label>
        <input id="default-pre-strain" name="default_pre_strain_percent" type="number" step="any" placeholder="e.g., 2" />
      </div>
      <div class="hdd-conditional" data-deformation="cold_worked">
        <label for="default-cold-reduction">Cold reduction [%]</label>
        <input id="default-cold-reduction" name="default_cold_reduction_percent" type="number" step="any" placeholder="e.g., 10" />
      </div>
      <div>
        <label for="default-mechanical-loading">Mechanical loading during test</label>
        <select id="default-mechanical-loading" name="default_mechanical_loading">
          <option value="">Select loading</option>
          <option value="constant_tension">Constant tension</option>
          <option value="constant_compression">Constant compression</option>
          <option value="constant_strain">Constant strain</option>
          <option value="cyclic_loading">Cyclic loading</option>
          <option value="fatigue_loading">Fatigue loading</option>
          <option value="slow_strain_rate">Slow strain rate</option>
          <option value="residual_stress_only">Residual stress only</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-loading="constant_tension" data-loading-alt="constant_compression" data-loading-alt2="constant_strain" data-loading-alt3="cyclic_loading" data-loading-alt4="fatigue_loading" data-loading-alt5="slow_strain_rate" data-loading-alt6="residual_stress_only">
        <label for="default-loading-regime">Loading regime</label>
        <select id="default-loading-regime" name="default_loading_regime">
          <option value="">Select regime</option>
          <option value="elastic">Elastic</option>
          <option value="elastic_plastic">Elastic-plastic</option>
          <option value="plastic">Plastic</option>
          <option value="other">Other (specify in notes)</option>
        </select>
      </div>
      <div class="hdd-conditional" data-loading="constant_tension" data-loading-alt="constant_compression" data-loading-alt2="constant_strain" data-loading-alt3="cyclic_loading" data-loading-alt4="fatigue_loading" data-loading-alt5="slow_strain_rate" data-loading-alt6="residual_stress_only">
        <label for="default-applied-stress">Applied stress [MPa]</label>
        <input id="default-applied-stress" name="default_applied_stress_mpa" type="number" step="any" placeholder="e.g., 400" />
      </div>
      <div class="hdd-conditional" data-loading="constant_tension" data-loading-alt="constant_compression" data-loading-alt2="constant_strain" data-loading-alt3="cyclic_loading" data-loading-alt4="fatigue_loading" data-loading-alt5="slow_strain_rate" data-loading-alt6="residual_stress_only">
        <label for="default-applied-strain">Applied strain [%]</label>
        <input id="default-applied-strain" name="default_applied_strain_percent" type="number" step="any" placeholder="e.g., 1" />
      </div>
    </div>
    <div class="hdd-conditions-notes">
      <details>
        <summary>Cold work and stress notes</summary>
        <textarea id="default-stress-notes" name="default_stress_notes" placeholder="Any extra deformation or loading details. Leave empty if not needed."></textarea>
      </details>
    </div>
  </fieldset>

  <fieldset>
    <legend>Data rows (one row per model or single point)</legend>
    <p class="hdd-contrib-note">
      Required columns: group + series name, model type, Tmin, Tmax.
      Think of <strong>group</strong> as the comparison set (what is being varied), and <strong>series</strong> as the
      specific variant inside that set. Example: Group = "Vanadium content", Series = "V=0.1", "V=0.2", "V=0.3".
      The fields below update based on the model type you select.
      If a specific row needs different material or composition, open "Override defaults for this row."
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
  <fieldset>
    <legend>Contact</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contrib-name">Name<span class="hdd-required" aria-hidden="true">*</span></label>
        <input id="contrib-name" name="name" required autocomplete="name" />
      </div>
      <div>
        <label for="contrib-email">Email<span class="hdd-required" aria-hidden="true">*</span></label>
        <input id="contrib-email" name="email" type="email" required autocomplete="email" />
      </div>
    </div>
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
