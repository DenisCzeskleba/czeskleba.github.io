---
layout: default
title: Hydrogen Diffusion Database
permalink: /hydrogen-diffusion-database/
---

# Hydrogen Diffusion Database

Browse curated diffusivity datasets, filter by material or source, and plot series directly in the browser. The explorer below mirrors the database plot grouping rules (`group_id`, `variant_*`, `series_*`) and lets you export PNG/CSV/JSON.

<link rel="stylesheet" href="/hdd/hdd-explorer.css">

<div id="hydrogen-explorer-app" data-endpoint="/hdd/hdd-groups-public.json">
  <div class="hdd-explorer-shell" data-state="loading">
    <aside class="hdd-panel">
      <div class="hdd-panel-header">
        <div>
          <p class="hdd-eyebrow">Hydrogen Diffusion</p>
          <h3>Explorer Controls</h3>
        </div>
        <span id="hdd-data-status" class="hdd-data-status">Waiting for dataset...</span>
      </div>

      <form class="hdd-controls" id="hdd-controls" autocomplete="off">
        <div class="hdd-control">
          <label for="hdd-search">Search sources, groups, or series</label>
          <input type="search" id="hdd-search" placeholder="e.g., Boellinghaus, CrMoV, weld" />
        </div>

        <div class="hdd-control">
          <label>Temperature units</label>
          <div class="hdd-toggle-group" role="group" aria-label="Temperature units">
            <button type="button" data-unit="K" class="is-active">Kelvin</button>
            <button type="button" data-unit="C">&deg;C</button>
          </div>
        </div>

        <div class="hdd-control hdd-toggle-row">
          <label>Plot options</label>
          <label class="hdd-inline-checkbox">
            <input type="checkbox" id="hdd-envelope" checked />
            <span>Envelope fill</span>
          </label>
          <label class="hdd-inline-checkbox">
            <input type="checkbox" id="hdd-numbering" checked />
            <span>Numbered legend</span>
          </label>
        </div>

        <div class="hdd-control">
          <label>Temperature window (K)</label>
          <div class="hdd-toggle-group">
            <input type="number" id="hdd-temp-min" placeholder="min" min="0" />
            <input type="number" id="hdd-temp-max" placeholder="max" min="0" />
          </div>
          <small>Optional clamp; leaving blank uses each segment's `[Tmin, Tmax]`.</small>
        </div>

        <div class="hdd-divider"></div>

        <div class="hdd-control hdd-filter-grid">
          <div>
            <label for="hdd-filter-source">Source</label>
            <select id="hdd-filter-source" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-class">Material class</label>
            <select id="hdd-filter-class" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-grade">Material grade</label>
            <select id="hdd-filter-grade" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-reported">Reported as</label>
            <select id="hdd-filter-reported" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-series">Series key</label>
            <select id="hdd-filter-series" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-effect">Studied effect</label>
            <select id="hdd-filter-effect" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-method">Measurement method</label>
            <select id="hdd-filter-method" multiple></select>
          </div>
          <div>
            <label for="hdd-filter-model">Model type</label>
            <select id="hdd-filter-model" multiple></select>
          </div>
        </div>

        <button type="button" id="hdd-clear-filters">Clear filters</button>

        <div class="hdd-control">
          <label>Series</label>
          <div id="hdd-series-list" class="hdd-group-list" aria-live="polite">
            <p class="hdd-empty">Loading series...</p>
          </div>
        </div>

        <button type="button" id="hdd-select-all">Select all listed series</button>
        <button type="button" id="hdd-plot-btn">Plot selected series</button>
      </form>
    </aside>

    <section class="hdd-stage">
      <div class="hdd-stage-card">
        <div class="hdd-stage-header">
          <h3>Plot Preview</h3>
          <span class="hdd-stage-note">Log-scale diffusivity vs temperature</span>
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
