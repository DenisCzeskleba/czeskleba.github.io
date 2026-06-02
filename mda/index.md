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
          <button type="button" class="mda-button is-secondary" id="mda-upload-trigger" title="Upload a CSV or TXT file into the same parser.">File Upload</button>
          <button type="button" class="mda-button is-accent mda-help-open" data-action="open-help" title="Open the short usage guide.">Help</button>
        </div>
      </div>

      <div class="mda-panel-body">
        <section class="mda-section">
          <textarea
            id="mda-input"
            class="mda-textarea"
            spellcheck="false"
            autocomplete="off"
            placeholder="Paste data here&#10;0.0 1.2e-9&#10;0.5 1.5e-9&#10;1.0 1.7e-9"
            title="Paste the measurement data here."
          ></textarea>
          <details class="mda-inline-details">
            <summary>Decimal separator</summary>
            <div class="mda-inline-details-body">
              <div class="mda-control mda-inline-control">
                <select id="mda-decimal" class="mda-select" title="Decimal separator is detected from new input and can be overridden manually.">
                  <option value="." selected>Dot</option>
                  <option value=",">Comma</option>
                </select>
              </div>
            </div>
          </details>
        </section>

        <section class="mda-section">
          <h3>Experiment</h3>
          <div class="mda-control-grid">
            <div class="mda-control">
              <label for="mda-current-unit" title="Choose the unit of the measured current or signal.">Current unit</label>
              <select id="mda-current-unit" class="mda-select" title="Choose the unit of the measured current or signal.">
                <option value="A" selected>A</option>
                <option value="mA">mA</option>
                <option value="uA">&mu;A</option>
                <option value="nA">nA</option>
                <option value="pA">pA</option>
              </select>
            </div>
            <div class="mda-control">
              <label for="mda-thickness" title="Enter the membrane thickness.">Membrane Thickness [mm]</label>
            <input id="mda-thickness" class="mda-number" type="text" inputmode="decimal" lang="en-US" value="0.50" placeholder="0.50" title="Enter the membrane thickness in millimeters." />
            </div>
          </div>
        </section>

        <input
          id="mda-file"
          class="mda-file"
          hidden
          type="file"
          accept=".csv,.txt,.tsv,text/plain,text/csv"
          title="Upload a CSV or TXT file into the same parser."
        />
      </div>

      <div class="mda-status" id="mda-status" role="status" aria-live="polite">Paste data to begin.</div>
      <ul class="mda-issues" id="mda-issues" aria-live="polite"></ul>
    </aside>

    <section class="mda-stage">
      <div class="mda-stage-header">
        <div class="mda-stage-controls">
          <button type="button" class="mda-button is-secondary" id="mda-reset-plot" title="Reset the preview plot zoom and pan.">Reset</button>
          <details class="mda-tool-panel is-accent">
            <summary>Plot Options</summary>
            <div class="mda-tool-panel-body">
              <div class="mda-control">
                <label for="mda-plot-unit" title="Choose the unit shown on the plot and data preview.">Y-axis unit</label>
              <select id="mda-plot-unit" class="mda-select" title="Choose the unit shown on the plot and data preview.">
                <option value="A">A</option>
                <option value="mA">mA</option>
                      <option value="uA" selected>&mu;A</option>
                <option value="pA">pA</option>
              </select>
              </div>
              <label class="mda-inline-checkbox" title="Toggle the plot grid lines.">
                <input type="checkbox" id="mda-grid-toggle" checked />
                <span>Grid lines</span>
              </label>
            </div>
          </details>
          <details class="mda-tool-panel">
            <summary>Reference Currents</summary>
            <div class="mda-tool-panel-body">
              <div class="mda-reference-row">
                <div class="mda-control">
                  <label for="mda-baseline-value" title="Enter the baseline current value.">Baseline</label>
                  <input id="mda-baseline-value" class="mda-number" type="number" step="any" placeholder="Auto" title="Enter the baseline current value." />
                </div>
                <button type="button" class="mda-button is-secondary mda-reference-toggle" id="mda-baseline-toggle" aria-pressed="true" title="Hide or show the baseline marker line.">Hide</button>
              </div>
              <div class="mda-reference-row">
                <div class="mda-control">
                  <label for="mda-steady-value" title="Enter the steady-state current value.">Steady State</label>
                  <input id="mda-steady-value" class="mda-number" type="number" step="any" placeholder="Auto" title="Enter the steady-state current value." />
                </div>
                <button type="button" class="mda-button is-secondary mda-reference-toggle" id="mda-steady-toggle" aria-pressed="true" title="Hide or show the steady-state marker line.">Hide</button>
              </div>
            </div>
          </details>
          <details class="mda-tool-panel">
            <summary>Export</summary>
            <div class="mda-tool-panel-body">
              <div class="mda-export-row">
                <button type="button" class="mda-button is-secondary" data-download="png">PNG</button>
                <button type="button" class="mda-button is-secondary" data-download="svg">SVG</button>
                <button type="button" class="mda-button is-secondary" data-download="csv">Data</button>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div class="mda-plot-card">
        <div id="mda-plot" class="mda-plot" aria-label="Preview plot"></div>
      </div>

      <details class="mda-preview-details">
        <summary>Data preview</summary>
        <div class="mda-preview-wrap" aria-live="polite">
          <table class="mda-preview-table" aria-label="Parsed data preview">
            <thead>
              <tr>
                <th>#</th>
                <th>Time [s]</th>
                <th>Current</th>
                      <th>Apparent Diffusion Coefficient D<sub>app</sub> [mmÂ²/s]</th>
              </tr>
            </thead>
            <tbody id="mda-preview-body">
              <tr>
                <td colspan="4" class="mda-empty">No data loaded.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
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
      <p>MDA starts from a strict two-column input: time in seconds first, measured current second. Decimal handling sits next to the paste field, and uploads use the same parser as pasted data so the tool stays predictable.</p>

      <div>
        <h3>Input rules</h3>
        <ul class="mda-help-list">
          <li>No header row.</li>
          <li>Exactly two numeric values per line.</li>
          <li>One sample per line.</li>
          <li>Dot or comma decimals are accepted, but only one style should be used in the file.</li>
          <li>Start the file at the actual experiment start. Do not include a long pre-equilibration segment unless you really want that time counted in the breakthrough analysis.</li>
        </ul>
      </div>

      <div>
        <h3>Controls</h3>
        <ul class="mda-help-list">
          <li>Use the current unit and membrane thickness controls to keep the experimental metadata attached to the file.</li>
          <li>Set the baseline and steady-state values above the plot. Use the adjacent button to show or hide each marker line, and drag the marker when it is visible.</li>
          <li>Use Plot Options to change display units or grid visibility.</li>
        </ul>
      </div>

      <div>
        <h3>What you get</h3>
        <ul class="mda-help-list">
          <li>Validation messages for obvious formatting problems.</li>
          <li>A preview plot with the measured current and calculated apparent diffusion coefficient.</li>
          <li>The normalized signal used internally for the inverse solve.</li>
          <li>Export for PNG, SVG, or plotted data.</li>
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
