---
layout: default
title: Membrane Diffusion Analyzer
permalink: /mda/
---

<link rel="stylesheet" href="/mda/mda.css" />

<div id="mda-app" class="mda-app">
  <div class="mda-workspace">
    <aside class="mda-panel">
      <div class="mda-panel-header">
        <div>
          <h2>Input</h2>
        </div>
        <div class="mda-intro-actions">
          <button type="button" class="mda-button is-secondary" id="mda-clear" title="Clear pasted data and reset the preview.">Clear</button>
          <button type="button" class="mda-button mda-help-open" data-action="open-help" title="Open the short usage guide.">Help</button>
        </div>
      </div>

      <div class="mda-field">
        <label for="mda-input" title="Paste exactly two numeric columns, one sample per line, with no header row.">Cleaned data</label>
        <textarea
          id="mda-input"
          class="mda-textarea"
          spellcheck="false"
          autocomplete="off"
          placeholder="0.0 1.2e-9&#10;10.0 1.5e-9&#10;20.0 1.7e-9"
          title="Paste exactly two numeric columns, one sample per line, with no header row."
        ></textarea>
        <div class="mda-hint">Use only clean data lines. Tabs, semicolons, commas, or spaces between columns are detected automatically.</div>
      </div>

      <div class="mda-control-grid">
        <div class="mda-control">
          <label for="mda-decimal" title="Auto-detect the decimal separator or force dot/comma manually.">Decimal separator</label>
          <select id="mda-decimal" class="mda-select" title="Auto-detect the decimal separator or force dot/comma manually.">
            <option value="auto">Auto</option>
            <option value=".">Dot</option>
            <option value=",">Comma</option>
          </select>
        </div>
        <div class="mda-control">
          <label for="mda-file" title="Upload a CSV or TXT file. It will be parsed into the same cleaned two-column format as paste input.">File upload</label>
          <input
            id="mda-file"
            class="mda-file"
            type="file"
            accept=".csv,.txt,.tsv,text/plain,text/csv"
            title="Upload a CSV or TXT file. It will be parsed into the same cleaned two-column format as paste input."
          />
        </div>
      </div>

      <div class="mda-status" id="mda-status" role="status" aria-live="polite">Paste or upload cleaned data to begin.</div>
      <ul class="mda-issues" id="mda-issues" aria-live="polite"></ul>
    </aside>

    <section class="mda-stage">
      <div class="mda-stage-header">
        <div>
          <h2>Parsed output</h2>
          <p>Preview, detection summary, and quality checks for the normalized table.</p>
        </div>
      </div>

      <div class="mda-summary-grid">
        <div class="mda-summary-card">
          <h3>Rows</h3>
          <div class="mda-summary-value" id="mda-row-card">0 rows</div>
          <p>Valid rows in the cleaned table.</p>
        </div>
        <div class="mda-summary-card">
          <h3>Decimal</h3>
          <div class="mda-summary-value" id="mda-decimal-card">Not detected</div>
          <p>Dot or comma, autodetected first.</p>
        </div>
        <div class="mda-summary-card">
          <h3>Split</h3>
          <div class="mda-summary-value" id="mda-delimiter-card">Not detected</div>
          <p>Internal column split used by the parser.</p>
        </div>
        <div class="mda-summary-card">
          <h3>Quality</h3>
          <div class="mda-summary-value" id="mda-quality-card">Not checked</div>
          <p>Quick format and monotonicity warnings.</p>
        </div>
      </div>

      <div class="mda-preview-card">
        <div class="mda-preview-head">
          <h3>Preview</h3>
          <span id="mda-row-count">0 rows</span>
        </div>
        <div class="mda-preview-wrap" aria-live="polite">
          <table class="mda-preview-table" aria-label="Parsed data preview">
            <thead>
              <tr>
                <th>#</th>
                <th>Time [s]</th>
                <th>Signal / current</th>
              </tr>
            </thead>
            <tbody id="mda-preview-body">
              <tr>
                <td colspan="3" class="mda-empty">No data loaded.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</div>

<div class="mda-help-drawer" id="mda-help-drawer" aria-hidden="true">
  <div class="mda-help-backdrop" data-action="close-help"></div>
  <aside class="mda-help-panel" role="dialog" aria-modal="true" aria-label="How MDA works">
    <div class="mda-help-header">
      <h2>How it works</h2>
      <button type="button" class="mda-help-close" data-action="close-help">Close</button>
    </div>
    <div class="mda-help-body">
      <p>MDA starts from one cleaned two-column table: time in seconds first, signal or current second. The parser is deliberately strict so the analysis layer does not have to guess what your spreadsheet meant. New input is autodetected for decimal separators and then normalized into one internal format. Uploads will use the same path as pasted data so the tool stays predictable.</p>

      <div>
        <h3>Input rules</h3>
        <ul class="mda-help-list">
          <li>No header row.</li>
          <li>Exactly two numeric values per line.</li>
          <li>One sample per line.</li>
          <li>Dot or comma decimals are accepted, but only one style should be used in a table.</li>
        </ul>
      </div>

      <div>
        <h3>What you get</h3>
        <ul class="mda-help-list">
          <li>A normalized two-column dataset.</li>
          <li>Validation messages for obvious formatting problems.</li>
          <li>A preview table and quick quality checks.</li>
          <li>A stable internal shape for the later diffusion analysis.</li>
        </ul>
      </div>

      <div>
        <h3>Caveats</h3>
        <ul class="mda-help-list">
          <li>Header rows are not allowed in this first version.</li>
          <li>If autodetection gets the decimal separator wrong, use the dropdown to override it.</li>
          <li>The tool is local-first; the file contents stay in your browser.</li>
        </ul>
      </div>
    </div>
  </aside>
</div>

<script src="/mda/mda.js" defer></script>
