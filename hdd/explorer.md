layout: default
title: Hydrogen Diffusion Explorer
permalink: /hydrogen-diffusion-database/explorer/
---

# Explorer

Use this page to browse grouped diffusivity datasets, toggle rendering options, and export results. The UI mirrors `plot_diffusivity_groups.py` to keep parity with the upstream tooling.

## Planned Features

1. **Dataset browser:** filter by `source_id`, material, temperature bounds, `group_id`, and metadata tags. Search + checkbox selection will feed the plot queue.
2. **Plot controls:** toggle Kelvin/°C axes, enable/disable envelope fill, show numbered legends, annotate Arrhenius vs. power-law models, and clamp displays to `[Tmin, Tmax]`.
3. **Exports:** download the current view as PNG, CSV, or JSON for offline use or publication supplements.

## Data Ingestion Placeholder

The explorer expects a consolidated JSON bundle sampled from the upstream repo. By default we will look for `/data/hydrogen-diffusivity-groups.json`, which should have the shape:

```jsonc
{
  "generated_at": "2026-02-18T00:00:00Z",
  "source_repo": "hydrogen-diffusion-database",
  "groups": [
    {
      "group_id": "boellinghaus_1995_scatterband",
      "entry_ids": ["..."],
      "temperature_range_K": [850, 1200],
      "samples": [
        {
          "temperature_K": 900,
          "diffusivity_m2_s": 1.2e-10,
          "model": "arrhenius",
          "curve_label": "1"
        }
      ]
    }
  ]
}
```

During early development we can drop a mock dataset at `assets/sample-data/hydrogen-diffusivity-groups.json` and point the explorer there via the `data-endpoint` attribute below.

## Interactive Workspace

<link rel="stylesheet" href="/hdd/hdd-explorer.css">

<div id="hydrogen-explorer-app" data-endpoint="/data/hydrogen-diffusivity-groups.json">
  <div class="hdd-explorer-shell" data-state="loading">
    <aside class="hdd-panel">
      <h3>Dataset Controls</h3>
      <form class="hdd-controls" id="hdd-controls" autocomplete="off">
        <div class="hdd-control">
          <label for="hdd-search">Search sources or groups</label>
          <input type="search" id="hdd-search" placeholder="e.g., Boellinghaus" />
        </div>

        <div class="hdd-control">
          <label>Temperature units</label>
          <div class="hdd-toggle-group" role="group" aria-label="Temperature units">
            <button type="button" data-unit="K" class="is-active">Kelvin</button>
            <button type="button" data-unit="C">°C</button>
          </div>
          <small>Mirrors the `temperature_units` toggle in `plotting.config.json`.</small>
        </div>

        <div class="hdd-control hdd-checkbox">
          <input type="checkbox" id="hdd-envelope" checked />
          <label for="hdd-envelope">Show min/max envelope fill</label>
        </div>

        <div class="hdd-control hdd-checkbox">
          <input type="checkbox" id="hdd-numbering" checked />
          <label for="hdd-numbering">Show numbered legend</label>
        </div>

        <div class="hdd-control">
          <label>Temperature window (K)</label>
          <div class="hdd-toggle-group">
            <input type="number" id="hdd-temp-min" placeholder="min" min="0" />
            <input type="number" id="hdd-temp-max" placeholder="max" min="0" />
          </div>
          <small>Optional clamp; leaving blank uses each model’s `[Tmin, Tmax]`.</small>
        </div>

        <div class="hdd-control">
          <label>Groups</label>
          <div id="hdd-group-list" class="hdd-group-list" aria-live="polite">
            <p class="hdd-empty">Loading groups…</p>
          </div>
        </div>

        <button type="button" id="hdd-plot-btn">Plot selected curves</button>
      </form>
    </aside>

    <section class="hdd-stage">
      <div class="hdd-stage-card">
        <div class="hdd-stage-header">
          <h3>Plot Preview</h3>
          <span id="hdd-data-status" class="hdd-data-status">Waiting for dataset…</span>
        </div>
        <div id="hdd-chart" class="hdd-chart" role="img" aria-live="polite">
          <div>
            <p>Select one or more groups to preview logarithmic diffusivity curves.</p>
            <p style="font-size:0.9rem;color:#777;">Arrhenius / power samples will render here with Kelvin/°C toggles and envelope shading.</p>
          </div>
        </div>
        <div class="hdd-downloads">
          <button type="button" data-download="png">Download PNG</button>
          <button type="button" data-download="csv">Download CSV</button>
          <button type="button" data-download="json">Download JSON</button>
        </div>
      </div>

      <div class="hdd-stage-card hdd-summary" id="hdd-selected-summary">
        <strong>No groups selected.</strong>
        <p>Use the checklist to the left to choose datasets for plotting.</p>
      </div>
    </section>
  </div>
</div>

<script src="/hdd/hdd-explorer.js" defer></script>
