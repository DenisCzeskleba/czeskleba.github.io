---
layout: default
title: Hydrogen Diffusion Docs
permalink: /hydrogen/docs/
---

# Documentation & FAQ

This section explains how the website mirrors the upstream tooling, what validation rules apply, and how to collaborate safely.

## Workflow Overview

1. **Sampling:** `plot_diffusivity_groups.py` ingests the upstream JSON entries, groups by `group_id`, enforces `[Tmin, Tmax]`, and samples piecewise curves.
2. **Bundling:** A build step exports sampled grids plus metadata to `/data/hydrogen-diffusivity-groups.json`.
3. **Rendering:** The Explorer UI loads that bundle, reconstructs Arrhenius/power labels, and applies envelope fills + numbering consistent with the Python config (`plotting.config.json`).
4. **Submissions:** Contributions are collected via the form, linted, and queued for human review before upstream inclusion.

## Validation Rules

- Accept only peer-reviewed, open-access sources.
- Require explicit temperature bounds (Kelvin) and forbid extrapolation outside `[Tmin, Tmax]`.
- Ensure models include their uncertainty context (e.g., scatter bands) when applicable.
- Keep payload sizes manageable (< 20&nbsp;MB total) to support client-side filtering.

## FAQ

**Can I upload raw experimental logs?**  
Yes, but mark them as supplemental files; we will extract structured parameters manually.

**Does the site auto-publish my submission?**  
No. All contributions are manually vetted before appearing in the upstream dataset or Explorer.

**How do I cite the data?**  
Reference the original publication plus the `hydrogen-diffusion-database` repo. We will add formal citation text once the Explorer ships.

## Next Steps

- Document the JSON schema for bundled samples.
- Publish developer notes on extending `plot_diffusivity_groups.py` with export hooks.
- Add tutorial gifs/screenshots once the Explorer UI is functional.
