---
layout: default
title: Hydrogen Diffusion Explorer
permalink: /hydrogen/explorer/
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

## UI Mount Point

```html
<section data-state="loading">
  <div id="hydrogen-explorer-app" data-endpoint="/data/hydrogen-diffusivity-groups.json"></div>
</section>
<script src="/assets/js/hydrogen-explorer.js" defer></script>
```

The script will hydrate this container once we implement the evaluator or wire in precomputed samples.
