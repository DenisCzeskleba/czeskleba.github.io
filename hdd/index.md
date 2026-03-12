---
layout: default
title: Hydrogen Diffusion Database
permalink: /hydrogen-diffusion-database/
---

# Hydrogen Diffusion Database

Browse curated diffusivity datasets, filter by material or source, and plot series directly in the browser. Export images and data, and <a class="hdd-inline-link" href="/hydrogen-diffusion-database/contribute/">contribute</a> your peer-reviewed open-access results back to the database.

<link rel="stylesheet" href="/hdd/hdd-explorer.css">

<div id="hydrogen-explorer-app" data-endpoint="/hdd/hdd-groups-public.json">
  <div class="hdd-explorer-shell" data-state="loading">
    <aside class="hdd-panel hdd-panel-left">
      <div class="hdd-panel-header">
        <div>
          <h3>Explorer Controls</h3>
        </div>
        <label class="hdd-inline-checkbox">
          <input type="checkbox" id="hdd-include-literature" checked />
          <span>Include Literature Compilations</span>
        </label>
      </div>

      <form class="hdd-controls" id="hdd-controls" autocomplete="off">
        <div class="hdd-section">
          <div class="hdd-actions">
            <button type="button" id="hdd-plot-btn" class="hdd-action-primary">Plot Filtered</button>
            <button type="button" id="hdd-open-series" class="hdd-action-secondary">Select Series</button>
          </div>
        </div>

        <div class="hdd-section">
          <div class="hdd-section-title">Filters</div>
          <div class="hdd-control hdd-filter-grid hdd-filter-scroll">
          <details class="hdd-filter-block">
            <summary>Source</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="source" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-source-label" class="hdd-sr-only">Source</span>
            <div id="hdd-filter-source" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-source-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Material class</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="materialClass" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-class-label" class="hdd-sr-only">Material class</span>
            <div id="hdd-filter-class" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-class-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Material grade</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="materialGrade" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-grade-label" class="hdd-sr-only">Material grade</span>
            <div id="hdd-filter-grade" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-grade-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Chemical composition</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-unknown="chemicalComposition" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Include unknown</span>
            </label>
            <span id="hdd-filter-composition-label" class="hdd-sr-only">Chemical composition</span>
            <div class="hdd-filter-note">Experimental feature [wt%]</div>
            <div id="hdd-filter-composition" class="hdd-filter-composition" aria-labelledby="hdd-filter-composition-label"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Measurement method</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="measurementMethod" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-method-label" class="hdd-sr-only">Measurement method</span>
            <div id="hdd-filter-method" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-method-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Model type</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="modelType" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-model-label" class="hdd-sr-only">Model type</span>
            <div id="hdd-filter-model" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-model-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Temperature window [°C]</summary>
            <label class="hdd-sr-only" for="hdd-temp-min">Temperature min (°C)</label>
            <label class="hdd-sr-only" for="hdd-temp-max">Temperature max (°C)</label>
            <div class="hdd-toggle-group">
              <input type="number" id="hdd-temp-min" placeholder="min" />
              <input type="number" id="hdd-temp-max" placeholder="max" />
            </div>
          </details>
          <details class="hdd-filter-block">
            <summary>Reported as</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="reportedAs" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-reported-label" class="hdd-sr-only">Reported as</span>
            <div id="hdd-filter-reported" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-reported-label" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Studied effect</summary>
            <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
              <input type="checkbox" data-filter-mode="studiedEffects" />
              <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
              <span class="hdd-toggle-label">Exclude selected</span>
            </label>
            <span id="hdd-filter-effect-label" class="hdd-sr-only">Studied effect</span>
            <div id="hdd-filter-effect" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-effect-label" aria-multiselectable="true"></div>
          </details>
          </div>
          <div class="hdd-filter-actions">
            <button type="button" id="hdd-clear-filters">Clear Filters</button>
          </div>
        </div>

      </form>

      <div class="hdd-panel-footer">
        <label class="hdd-inline-checkbox hdd-footer-toggle">
          <input type="checkbox" id="hdd-include-unconfirmed" />
          <span>Include Outliers / Unconfirmed</span>
        </label>
        <span id="hdd-data-status" class="hdd-data-status">Waiting for dataset...</span>
      </div>
    </aside>

    <section class="hdd-stage">
      <div class="hdd-stage-card">
        <div class="hdd-stage-header">
          <h3>Plot Preview</h3>
          <div class="hdd-stage-controls">
            <button type="button" class="hdd-stage-button" id="hdd-refresh-plot">Refresh</button>
            <details class="hdd-plot-options">
              <summary>Plot Options</summary>
              <div class="hdd-plot-options-body">
                <div class="hdd-toggle-group" role="group" aria-label="Temperature units">
                  <button type="button" data-unit="K">Kelvin</button>
                  <button type="button" data-unit="C" class="is-active">&deg;C</button>
                </div>
                <div class="hdd-toggle-group" role="group" aria-label="Y-axis scale">
                  <button type="button" data-scale="log" class="is-active">Log scale</button>
                  <button type="button" data-scale="linear">Linear</button>
                </div>
                <div class="hdd-plot-axis">
                  <div class="hdd-axis-group">
                    <div class="hdd-axis-label">X-Axis Limits</div>
                    <div class="hdd-axis-fields">
                      <input id="hdd-axis-x-min" type="text" inputmode="decimal" placeholder="Min" aria-label="X min" />
                      <input id="hdd-axis-x-max" type="text" inputmode="decimal" placeholder="Max" aria-label="X max" />
                    </div>
                  </div>
                  <div class="hdd-axis-group">
                    <div class="hdd-axis-label">Y-Axis Limits</div>
                    <div class="hdd-axis-fields">
                      <input id="hdd-axis-y-min" type="text" inputmode="decimal" placeholder="Min" aria-label="Y min" />
                      <input id="hdd-axis-y-max" type="text" inputmode="decimal" placeholder="Max" aria-label="Y max" />
                    </div>
                  </div>
                </div>
                <div class="hdd-axis-help">Leave blank for auto.</div>
                <label class="hdd-inline-checkbox">
                  <input type="checkbox" id="hdd-envelope" checked />
                  <span>Envelope fill</span>
                </label>
                <label class="hdd-inline-checkbox">
                  <input type="checkbox" id="hdd-numbering" checked />
                  <span>Numbered plots</span>
                </label>
                <label class="hdd-inline-checkbox">
                  <input type="checkbox" id="hdd-legend-group" checked />
                  <span>Group legend by source</span>
                </label>
                <label class="hdd-inline-checkbox">
                  <input type="checkbox" id="hdd-monochrome" />
                  <span>Black &amp; white</span>
                </label>
                <div class="hdd-inline-row">
                  <label class="hdd-inline-checkbox">
                    <input type="checkbox" id="hdd-grid-x" checked />
                    <span>X grid</span>
                  </label>
                  <label class="hdd-inline-checkbox">
                    <input type="checkbox" id="hdd-grid-y" checked />
                    <span>Y grid</span>
                  </label>
                </div>
                <button type="button" id="hdd-reset-zoom">Reset zoom</button>
                <div class="hdd-plot-option-note">Drag a rectangle on the plot to zoom. Use Reset zoom to return.</div>
              </div>
            </details>
            <details class="hdd-plot-options hdd-export-panel">
              <summary>Export</summary>
              <div class="hdd-plot-options-body">
                <div class="hdd-export-note">Export Image</div>
                <div class="hdd-export-row">
                  <button type="button" data-download="png">PNG</button>
                  <button type="button" data-download="svg">SVG</button>
                </div>
                <div class="hdd-export-note">Visible Data</div>
                <div class="hdd-export-row">
                  <button type="button" data-download="csv">CSV</button>
                </div>
                <div class="hdd-export-note">Export Database</div>
                <div class="hdd-export-row">
                  <button type="button" data-download="json">JSON</button>
                </div>
              </div>
            </details>
            <details class="hdd-plot-options hdd-citation-panel" id="hdd-citation">
              <summary>Citation</summary>
              <div class="hdd-plot-options-body">
                <div class="hdd-citation-block">
                  <strong>If you use the diffusion coefficient scatter band or analysis results</strong>
                  <p id="hdd-citation-analysis">Citation information will appear once the dataset loads.</p>
                </div>
                <div class="hdd-citation-block">
                  <strong>If you use the database itself</strong>
                  <p id="hdd-citation-database">Citation information will appear once the dataset loads.</p>
                </div>
              </div>
            </details>
            <a class="hdd-link-button" href="/hydrogen-diffusion-database/contribute/">Contribute data</a>
          </div>
        </div>
        <div id="hdd-chart" class="hdd-chart" role="img" aria-live="polite">
          <div>
            <p>Select one or more series to preview logarithmic diffusivity curves.</p>
            <p class="hdd-muted">Arrhenius, power, and single-point data render in the same canvas.</p>
          </div>
        </div>
      </div>

      <div class="hdd-stage-card hdd-summary" id="hdd-selected-summary">
        <strong>No series selected.</strong>
        <p>Use the checklist to the left to choose datasets for plotting.</p>
      </div>
    </section>
  </div>
</div>

<div class="hdd-series-drawer" id="hdd-series-drawer" aria-hidden="true">
  <div class="hdd-series-backdrop" data-action="close-series"></div>
      <aside class="hdd-series-panel" role="dialog" aria-label="Select Series">
        <div class="hdd-series-header">
          <div>
            <strong>Select Series</strong>
          </div>
          <button type="button" class="hdd-series-close" data-action="close-series">Close</button>
        </div>
        <div class="hdd-series-controls">
          <input type="search" id="hdd-search" placeholder="Search series, sources, groups..." />
          <div class="hdd-series-actions">
            <button type="button" id="hdd-select-all" class="is-accent">Select All</button>
            <button type="button" id="hdd-deselect-all">Deselect All</button>
          </div>
        </div>
    <div id="hdd-series-list" class="hdd-group-list" aria-live="polite">
      <p class="hdd-empty">Loading series...</p>
    </div>
  </aside>
</div>

<script src="/hdd/hdd-explorer.js" defer></script>
