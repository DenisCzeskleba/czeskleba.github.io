---
layout: default
title: Hydrogen Diffusion Database
permalink: /hydrogen-diffusion-database/
---

# Hydrogen Diffusion Database

Browse curated diffusivity datasets, filter by material or source, and plot series directly in the browser. Export images and data, and contribute your peer-reviewed open-access results back to the database.

<link rel="stylesheet" href="/hdd/hdd-explorer.css">

<div id="hydrogen-explorer-app" data-endpoint="/hdd/hdd-groups-public.json">
  <div class="hdd-explorer-shell" data-state="loading">
    <aside class="hdd-panel hdd-panel-left">
      <div class="hdd-panel-header">
        <div>
          <h3>Explorer Controls</h3>
        </div>
      </div>

      <form class="hdd-controls" id="hdd-controls" autocomplete="off">
        <div class="hdd-control hdd-filter-grid">
          <details class="hdd-filter-block">
            <summary>Source</summary>
            <label for="hdd-filter-source" class="hdd-sr-only">Source</label>
            <div id="hdd-filter-source" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Material class</summary>
            <label for="hdd-filter-class" class="hdd-sr-only">Material class</label>
            <div id="hdd-filter-class" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Material grade</summary>
            <label for="hdd-filter-grade" class="hdd-sr-only">Material grade</label>
            <div id="hdd-filter-grade" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Chemical composition</summary>
            <label for="hdd-filter-composition" class="hdd-sr-only">Chemical composition</label>
            <div id="hdd-filter-composition" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Measurement method</summary>
            <label for="hdd-filter-method" class="hdd-sr-only">Measurement method</label>
            <div id="hdd-filter-method" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Model type</summary>
            <label for="hdd-filter-model" class="hdd-sr-only">Model type</label>
            <div id="hdd-filter-model" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Temperature window</summary>
            <label class="hdd-sr-only" for="hdd-temp-min">Temperature min</label>
            <label class="hdd-sr-only" for="hdd-temp-max">Temperature max</label>
            <div class="hdd-toggle-group">
              <input type="number" id="hdd-temp-min" placeholder="min" min="0" />
              <input type="number" id="hdd-temp-max" placeholder="max" min="0" />
            </div>
          </details>
          <details class="hdd-filter-block">
            <summary>Reported as</summary>
            <label for="hdd-filter-reported" class="hdd-sr-only">Reported as</label>
            <div id="hdd-filter-reported" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
          <details class="hdd-filter-block">
            <summary>Studied effect</summary>
            <label for="hdd-filter-effect" class="hdd-sr-only">Studied effect</label>
            <div id="hdd-filter-effect" class="hdd-filter-list" role="listbox" aria-multiselectable="true"></div>
          </details>
        </div>

        <div class="hdd-actions">
          <button type="button" id="hdd-plot-btn" class="hdd-action-primary">Plot Selected</button>
          <div class="hdd-action-row">
            <button type="button" id="hdd-select-all">Select All</button>
            <button type="button" id="hdd-clear-filters">Clear Filters</button>
            <button type="button" id="hdd-deselect-all">Deselect All</button>
          </div>
        </div>

        <div class="hdd-control">
          <label>Series</label>
          <input type="search" id="hdd-search" placeholder="Search series, sources, groups..." />
          <div id="hdd-series-list" class="hdd-group-list" aria-live="polite">
            <p class="hdd-empty">Loading series...</p>
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
          <details class="hdd-plot-options">
            <summary>Plot options</summary>
            <div class="hdd-plot-options-body">
              <div class="hdd-toggle-group" role="group" aria-label="Temperature units">
                <button type="button" data-unit="K" class="is-active">Kelvin</button>
                <button type="button" data-unit="C">&deg;C</button>
              </div>
              <div class="hdd-toggle-group" role="group" aria-label="Y-axis scale">
                <button type="button" data-scale="log" class="is-active">Log scale</button>
                <button type="button" data-scale="linear">Linear</button>
              </div>
              <label class="hdd-inline-checkbox">
                <input type="checkbox" id="hdd-envelope" checked />
                <span>Envelope fill</span>
              </label>
              <label class="hdd-inline-checkbox">
                <input type="checkbox" id="hdd-numbering" checked />
                <span>Numbered plots</span>
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
              <div class="hdd-plot-option-note">More options (grid, styling) coming soon.</div>
            </div>
          </details>
        </div>
        <div id="hdd-chart" class="hdd-chart" role="img" aria-live="polite">
          <div>
            <p>Select one or more series to preview logarithmic diffusivity curves.</p>
            <p class="hdd-muted">Arrhenius, power, and single-point data render in the same canvas.</p>
          </div>
        </div>
        <div class="hdd-downloads">
          <button type="button" data-download="png">Download PNG</button>
          <button type="button" data-download="csv">Download CSV</button>
          <button type="button" data-download="json">Download JSON</button>
        </div>
      </div>

      <div class="hdd-stage-card hdd-summary" id="hdd-selected-summary">
        <strong>No series selected.</strong>
        <p>Use the checklist to the left to choose datasets for plotting.</p>
      </div>
    </section>
  </div>
</div>

<script src="/hdd/hdd-explorer.js" defer></script>
