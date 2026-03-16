---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen-diffusion-database/contribute/
---

<h1>Contribution Form</h1>

<p>Help expand the hydrogen diffusivity database for structural steels and related materials. Submit peer-reviewed, open-access sources. We review every entry before adding it to the public dataset.</p>

<h2>Submission Flow</h2>

<p><strong>Fill out the form below with:</strong></p>
<ol>
  <li>Publication metadata: title, authors, journal, year, DOI, open-access URL, abstract, publication type, volume/issue/pages, language, and keywords.</li>
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
  .hdd-contrib-form input,
  .hdd-contrib-form select {
    height: 42px;
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
  .hdd-contrib-comp-table {
    width: 100%;
    border-collapse: collapse;
  }
  .hdd-contrib-comp-table th,
  .hdd-contrib-comp-table td {
    border: 1px solid var(--border);
    padding: 8px 10px;
    text-align: left;
  }
  .hdd-contrib-comp-table th {
    font-weight: 600;
    background: color-mix(in srgb, var(--bg) 95%, var(--text));
  }
  .hdd-contrib-comp-table input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
  .hdd-comp-actions {
    margin-top: 8px;
  }
  .hdd-comp-actions button {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
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
  .hdd-authors-help {
    font-size: 0.85rem;
    color: color-mix(in srgb, var(--text) 70%, var(--bg));
    margin-top: 6px;
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
        <label for="contrib-title">Title</label>
        <textarea id="contrib-title" name="paper_title" required rows="1" title="Paper title." class="hdd-title-input"></textarea>
      </div>
      <div class="hdd-grid-span">
        <label>Authors</label>
        <table class="hdd-simple-table hdd-authors-table" id="hdd-authors-table">
          <thead>
            <tr>
              <th>First name</th>
              <th>Last name</th>
              <th>ORCID (optional)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr data-author-row>
              <td><input type="text" data-author-first required title="Author first name." /></td>
              <td><input type="text" data-author-last required title="Author last name." /></td>
              <td><input type="text" data-author-orcid title="ORCID (optional)." /></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="hdd-simple-actions">
          <button type="button" id="hdd-author-add">Add author</button>
        </div>
      </div>
      <div>
        <label for="contrib-journal">Journal / Venue</label>
        <input id="contrib-journal" name="journal" required title="Journal or venue name." />
      </div>
      <div>
        <label for="contrib-volume">Volume (optional)</label>
        <input id="contrib-volume" name="volume" title="Journal volume (optional)." />
      </div>
      <div>
        <label for="contrib-issue">Issue (optional)</label>
        <input id="contrib-issue" name="issue" title="Journal issue (optional)." />
      </div>
      <div>
        <label for="contrib-pages">Pages (optional)</label>
        <input id="contrib-pages" name="pages" title="Page range (optional)." />
      </div>
      <div>
        <label for="contrib-year">Year</label>
        <input id="contrib-year" name="year" required title="Publication year." />
      </div>
      <div>
        <label for="contrib-doi">DOI</label>
        <input id="contrib-doi" name="doi" required title="DOI string." />
      </div>
      <div>
        <label for="contrib-oa">Open-access URL</label>
        <input id="contrib-oa" name="oa_url" type="url" required title="Open-access link to the paper." />
      </div>
      <div>
        <label for="contrib-language">Language</label>
        <select id="contrib-language" name="language" required title="Publication language.">
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
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
    <div class="hdd-contrib-grid">
      <div class="hdd-grid-span hdd-keywords-block">
        <label for="contrib-keywords">Keywords</label>
        <input id="contrib-keywords" name="keywords" placeholder="hydrogen diffusion, welding, permeation, steel" title="Comma-separated keywords." />
      </div>
      <div class="hdd-grid-span">
        <details>
          <summary>Abstract</summary>
          <textarea id="contrib-abstract" name="abstract" placeholder="Optional: Abstract text." title="Optional abstract text."></textarea>
        </details>
      </div>
      <div class="hdd-grid-span">
        <details>
          <summary>Additional notes</summary>
          <textarea id="contrib-notes" name="paper_notes" placeholder="Optional: Additional information you would like us to know." title="Optional notes about the paper."></textarea>
        </details>
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>Defaults (apply to all rows unless overridden)</legend>
    <div class="hdd-contrib-grid">
      <div>
        <label for="default-material-class">Material class</label>
        <select id="default-material-class" name="default_material_class" title="Pick the closest material class. If not listed, choose Other and specify in Material notes.">
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
        <label for="default-material-grade">Material grade</label>
        <select id="default-material-grade" name="default_material_grade" title="Pick the closest grade. If not listed, choose Other and specify in Material notes.">
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
        <label for="default-material-microstructure">Microstructure</label>
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
          <option value="Cold worked">Cold worked</option>
          <option value="Normalized">Normalized</option>
          <option value="PWHT">PWHT</option>
          <option value="Q&T">Q&amp;T</option>
          <option value="Quenched">Quenched</option>
          <option value="Stress relief">Stress relief</option>
          <option value="Subzero Treated">Subzero Treated</option>
          <option value="Surface treated">Surface treated</option>
          <option value="TMCP">TMCP</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
      <div>
        <label for="default-material-tags">Tag</label>
        <select id="default-material-tags" name="default_material_tags" title="Pick the closest tag. If not listed, choose Other and specify in Material notes.">
          <option value="">Select a tag</option>
          <option value="AHSS">AHSS</option>
          <option value="Austenitic">Austenitic</option>
          <option value="Creep resistant">Creep resistant</option>
          <option value="Cr-Mo">Cr-Mo</option>
          <option value="Dual phase">Dual phase</option>
          <option value="Ferritic-martensitic">Ferritic-martensitic</option>
          <option value="High strength">High strength</option>
          <option value="Low carbon">Low carbon</option>
          <option value="Martensitic">Martensitic</option>
          <option value="Microalloyed">Microalloyed</option>
          <option value="Nickel alloyed">Nickel alloyed</option>
          <option value="Pearlitic">Pearlitic</option>
          <option value="Pipeline">Pipeline</option>
          <option value="speculative">speculative</option>
          <option value="Structural Steel">Structural Steel</option>
          <option value="Tempered martensite">Tempered martensite</option>
          <option value="Welded">Welded</option>
          <option value="Other">Other (specify in notes)</option>
        </select>
      </div>
    </div>
    <div>
      <label for="default-material-notes">Material notes (optional)</label>
      <textarea id="default-material-notes" name="default_material_notes" placeholder="Specimen geometry, preparation, or other notes. Leave empty if not needed." title="Optional material notes. Leave empty if not needed."></textarea>
    </div>
    <p class="hdd-contrib-note">Composition (wt%).</p>
    <table class="hdd-contrib-comp-table" id="hdd-comp-table">
      <thead>
        <tr>
          <th>Element</th>
          <th>wt%</th>
        </tr>
      </thead>
      <tbody>
        <tr data-comp-row data-element="C"><td>C</td><td><input type="number" step="0.01" data-comp-value title="Carbon in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Mn"><td>Mn</td><td><input type="number" step="0.01" data-comp-value title="Manganese in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Si"><td>Si</td><td><input type="number" step="0.01" data-comp-value title="Silicon in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Cr"><td>Cr</td><td><input type="number" step="0.01" data-comp-value title="Chromium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Ni"><td>Ni</td><td><input type="number" step="0.01" data-comp-value title="Nickel in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Mo"><td>Mo</td><td><input type="number" step="0.01" data-comp-value title="Molybdenum in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="V"><td>V</td><td><input type="number" step="0.01" data-comp-value title="Vanadium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Nb"><td>Nb</td><td><input type="number" step="0.01" data-comp-value title="Niobium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Ti"><td>Ti</td><td><input type="number" step="0.01" data-comp-value title="Titanium in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Al"><td>Al</td><td><input type="number" step="0.01" data-comp-value title="Aluminum in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="Cu"><td>Cu</td><td><input type="number" step="0.01" data-comp-value title="Copper in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="P"><td>P</td><td><input type="number" step="0.01" data-comp-value title="Phosphorus in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="S"><td>S</td><td><input type="number" step="0.01" data-comp-value title="Sulfur in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
        <tr data-comp-row data-element="N"><td>N</td><td><input type="number" step="0.01" data-comp-value title="Nitrogen in wt% (e.g., 0.2 for 0.2%). Leave empty if not needed." /></td></tr>
      </tbody>
    </table>
    <div class="hdd-comp-actions">
      <button type="button" id="hdd-comp-add">Add element</button>
    </div>
    <div>
      <label for="default-material-composition-notes">Composition notes (optional)</label>
      <textarea id="default-material-composition-notes" name="default_material_composition_notes" placeholder="Any extra composition context. Leave empty if not needed." title="Optional composition notes. Leave empty if not needed."></textarea>
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
        <label for="default-studied-effects">Studied effects</label>
        <select
          id="default-studied-effects"
          name="default_studied_effects"
          title="If you had to say which effects on the diffusion coefficients did you study?"
        >
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
        <label for="contrib-name">Name</label>
        <input id="contrib-name" name="name" required title="Required for submission. Leave empty if not needed and explain in notes." />
      </div>
      <div>
        <label for="contrib-email">Email</label>
        <input id="contrib-email" name="email" type="email" required title="Required for submission. Leave empty if not needed and explain in notes." />
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
