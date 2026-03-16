---
layout: default
title: Hydrogen Diffusion Database
permalink: /hydrogen-diffusion-database/
---

<div class="hdd-page-hero">
  <img class="hdd-hero-logo" src="/assets/HDD.B%20Logo.png" alt="HDD.B logo" decoding="async" loading="lazy" />
  <div class="hdd-hero-text">
    <h1>Hydrogen Diffusion Database</h1>
    <p>Browse curated diffusivity datasets, filter by material or source, and plot series directly in the browser. Export images and data, and <a class="hdd-inline-link" href="/hydrogen-diffusion-database/contribute/">contribute</a> your peer-reviewed open-access results back to the database.</p>
  </div>
</div>

<link rel="stylesheet" href="/hdd/hdd-explorer.css">

<div id="hydrogen-explorer-app" data-endpoint="/hdd/hdd-groups-public.json">
  <div class="hdd-explorer-shell" data-state="loading">
    <aside class="hdd-panel hdd-panel-left">
      <div class="hdd-panel-header"></div>

      <form class="hdd-controls" id="hdd-controls" autocomplete="off">
        <div class="hdd-controls-top">
          <div class="hdd-actions">
            <button type="button" id="hdd-plot-btn" class="hdd-action-primary" title="Plot all series that match the current filters.">Plot Filtered</button>
            <div class="hdd-action-row">
              <button type="button" id="hdd-clear-filters" class="hdd-action-secondary" title="Reset every filter and selection.">Clear Filters</button>
              <button type="button" id="hdd-open-series" class="hdd-action-secondary" title="Manually choose specific series before plotting.">Select Series</button>
            </div>
          </div>
        </div>

        <div class="hdd-controls-middle">
  <div class="hdd-section-title">Filters</div>
  <div class="hdd-control hdd-filter-grid hdd-filter-scroll">
    <details class="hdd-filter-block">
      <summary>Literature Compilations</summary>
      <label class="hdd-inline-select" for="hdd-literature-mode" title="Include or exclude literature compilation sources.">
        <select id="hdd-literature-mode" title="Include or exclude literature compilation sources.">
          <option value="include" selected>Include</option>
          <option value="only">Only</option>
          <option value="exclude">Exclude</option>
        </select>
      </label>
    </details>
    <details class="hdd-filter-block">
      <summary>Material Class</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="materialClass" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-class-label" class="hdd-sr-only">Material Class</span>
      <div id="hdd-filter-class" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-class-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Material Grade</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="materialGrade" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-grade-label" class="hdd-sr-only">Material Grade</span>
      <div id="hdd-filter-grade" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-grade-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Temperature Window [&deg;C]</summary>
      <label class="hdd-sr-only" for="hdd-temp-min">Temperature min (C)</label>
      <label class="hdd-sr-only" for="hdd-temp-max">Temperature max (C)</label>
      <div class="hdd-toggle-group">
        <input type="number" id="hdd-temp-min" placeholder="min" />
        <input type="number" id="hdd-temp-max" placeholder="max" />
      </div>
    </details>
    <details class="hdd-filter-block">
  <summary>Year</summary>
  <label class="hdd-sr-only" for="hdd-year-min">Year min</label>
  <label class="hdd-sr-only" for="hdd-year-max">Year max</label>
  <div class="hdd-toggle-group">
    <input type="number" id="hdd-year-min" title="Type a minimum year" placeholder="min" />
    <input type="number" id="hdd-year-max" title="Type a maximum year" placeholder="max" />
  </div>
  <div class="hdd-range-dual" title="Drag handles to set a year range" data-range="year">
    <div class="hdd-range-track"></div>
    <div class="hdd-range-fill" id="hdd-year-range-fill"></div>
    <button type="button" class="hdd-range-handle hdd-range-handle-min" id="hdd-year-handle-min" aria-label="Year minimum"></button>
    <button type="button" class="hdd-range-handle hdd-range-handle-max" id="hdd-year-handle-max" aria-label="Year maximum"></button>
  </div>
</details><details class="hdd-filter-block">
      <summary>Model Type</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="modelType" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-model-label" class="hdd-sr-only">Model Type</span>
      <div id="hdd-filter-model" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-model-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Measurement Method</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="measurementMethod" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-method-label" class="hdd-sr-only">Measurement Method</span>
      <div id="hdd-filter-method" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-method-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Chemical Composition</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-unknown="chemicalComposition" />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Include unknown</span>
      </label>
      <span id="hdd-filter-composition-label" class="hdd-sr-only">Chemical Composition</span>
      <div class="hdd-filter-note">Experimental feature [wt%]</div>
      <div id="hdd-filter-composition" class="hdd-filter-composition" aria-labelledby="hdd-filter-composition-label"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Reported As</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="reportedAs" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-reported-label" class="hdd-sr-only">Reported As</span>
      <div id="hdd-filter-reported" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-reported-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Studied Effect</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="studiedEffects" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-effect-label" class="hdd-sr-only">Studied Effect</span>
      <div id="hdd-filter-effect" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-effect-label" aria-multiselectable="true"></div>
    </details>
    <details class="hdd-filter-block">
      <summary>Source</summary>
      <label class="hdd-filter-toggle is-inline hdd-toggle-switch hdd-filter-toggle-header">
        <input type="checkbox" data-filter-mode="source" checked />
        <span class="hdd-toggle-track"><span class="hdd-toggle-thumb"></span></span>
        <span class="hdd-toggle-label">Exclude selected</span>
      </label>
      <span id="hdd-filter-source-label" class="hdd-sr-only">Source</span>
      <div id="hdd-filter-source" class="hdd-filter-list" role="listbox" aria-labelledby="hdd-filter-source-label" aria-multiselectable="true"></div>
    </details>
  </div>
</div></form>

      <div class="hdd-panel-footer">
        <label class="hdd-inline-checkbox hdd-footer-toggle" title="Include flagged or unconfirmed data in results.">
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
                  <button type="button" data-unit="K" title="Show temperature in Kelvin.">Kelvin</button>
                  <button type="button" data-unit="C" class="is-active" title="Show temperature in Celsius.">&deg;C</button>
                </div>
                <div class="hdd-toggle-group" role="group" aria-label="Y-axis scale">
                  <button type="button" data-scale="log" class="is-active" title="Use a logarithmic Y-axis.">Log scale</button>
                  <button type="button" data-scale="linear" title="Use a linear Y-axis.">Linear</button>
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
                <label class="hdd-inline-checkbox" title="Shade the uncertainty or scatter band.">
                  <input type="checkbox" id="hdd-envelope" checked />
                  <span>Envelope fill</span>
                </label>
                <label class="hdd-inline-checkbox" title="Number curves to match the legend list.">
                  <input type="checkbox" id="hdd-numbering" checked />
                  <span>Numbered plots</span>
                </label>
                <label class="hdd-inline-checkbox" title="Group legend entries by source instead of series.">
                  <input type="checkbox" id="hdd-legend-group" checked />
                  <span>Group legend by source</span>
                </label>
                <label class="hdd-inline-checkbox" title="Switch to black and white for print.">
                  <input type="checkbox" id="hdd-monochrome" />
                  <span>Black &amp; white</span>
                </label>
                <div class="hdd-inline-row">
                  <label class="hdd-inline-checkbox" title="Toggle vertical grid lines.">
                    <input type="checkbox" id="hdd-grid-x" checked />
                    <span>X grid</span>
                  </label>
                  <label class="hdd-inline-checkbox" title="Toggle horizontal grid lines.">
                    <input type="checkbox" id="hdd-grid-y" checked />
                    <span>Y grid</span>
                  </label>
                </div>
                <div class="hdd-slider-row">
                  <label for="hdd-line-thickness">Line thickness</label>
                  <input
                    id="hdd-line-thickness"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value="1"
                    aria-label="Line thickness multiplier"
                  />
                  <span class="hdd-slider-value" id="hdd-line-thickness-value">1.00×</span>
                </div>
                <button type="button" id="hdd-reset-zoom">Reset zoom</button>
              </div>
            </details>
            <details class="hdd-plot-options hdd-citation-panel" id="hdd-citation" data-order="citation">
              <summary>Citation</summary>
              <div class="hdd-plot-options-body">
                <div class="hdd-citation-block">
                  <strong>If you use the diffusion coefficient scatter band or analysis results</strong>
                  <p id="hdd-citation-analysis">Citation information will appear once the dataset loads.</p>
                </div>
                <div class="hdd-citation-block">
                  <strong>Database / Website use:</strong>
                  <p id="hdd-citation-database">Citation information will appear once the dataset loads.</p>
                  <div class="hdd-citation-actions">
                    <a class="hdd-citation-button" id="hdd-citation-bibtex" download> BibTeX </a>
                    <a class="hdd-citation-button" id="hdd-citation-ris" download> RIS </a>
                    <a class="hdd-citation-button" id="hdd-citation-plain" download> Plain Text </a>
                  </div>
                </div>
              </div>
            </details>
            <details class="hdd-plot-options hdd-export-panel" data-order="export">
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
            </div>
        </div>
        <div id="hdd-chart" class="hdd-chart" role="img" aria-live="polite">
          <div>
            <p>Select one or more series to preview logarithmic diffusivity curves.</p>
            <p class="hdd-muted">Arrhenius, power, and single-point data render in the same canvas.</p>
          </div>
        </div>
      </div>

    </section>
  </div>
</div>

<div class="hdd-summary-modal" id="hdd-summary-modal" aria-hidden="true">
  <div class="hdd-summary-backdrop" data-action="close-summary"></div>
  <div class="hdd-summary-panel" role="dialog" aria-label="Filtered Series">
    <div class="hdd-summary-panel-header">
      <span>Filtered Series</span>
      <button type="button" class="hdd-summary-close" data-action="close-summary">Close</button>
    </div>
    <div class="hdd-summary hdd-summary-panel-body" id="hdd-selected-summary">
      <strong>No series selected.</strong>
      <p>Use the checklist to the left to choose datasets for plotting.</p>
    </div>
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
















