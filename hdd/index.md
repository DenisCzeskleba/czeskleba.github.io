---
layout: default
title: Hydrogen Diffusion Hub
permalink: /hydrogen/
---

# Hydrogen Diffusion Data Hub

Welcome to the future home of the hydrogen diffusivity browser for czeskleba.com. This area will surface curated datasets from the upstream `hydrogen-diffusion-database` repo, mirror the plotting flow from `plot_diffusivity_groups.py`, and document how researchers can contribute new measurements.

## Quick Navigation

- [Data Explorer](/hydrogen/explorer/) – filter datasets and render plots with Kelvin/°C toggles, envelope fills, numbered legends, and download buttons.
- [Contribute Data](/hydrogen/contribute/) – share new publications or models for manual vetting.
- [Docs & FAQ](/hydrogen/docs/) – learn how we validate sources, understand the sampling workflow, and prep submissions.

## Roadmap Highlights

1. **Data ingestion:** publish a build-time JSON bundle (or per-source manifests) sampled via `plot_diffusivity_groups.py`, keeping payloads < 20&nbsp;MB.
2. **Interactive plotting:** port the Arrhenius/Power/single-point evaluator to the browser or hydrate precomputed grids, respecting per-model temperature bounds.
3. **Submission workflow:** collect metadata + files, then forward to maintainers via email/webhook without touching the upstream dataset directly.

Bookmark this hub for updates as we bring each milestone online.
