# Hydrogen Diffusion Visualization Website — Agent Guide

This repository (`F:\100_WebSite and Hosted Projects\Github`) hosts the public website for the hydrogen diffusivity project described in the upstream data/tooling repo at `F:\100_WebSite and Hosted Projects\hydrogen-diffusion-database`. Use this document for quick handovers between assistants or when spinning up new workflows.

## Project Purpose
- Publish a static site (currently Jekyll-style Markdown, HTML, and custom JS under `visualizer/`) that mirrors the plotting/evaluation capabilities of `plot_diffusivity_groups.py`.
- Let researchers browse, filter, and visualize diffusion datasets, then download PNG/CSV/JSON outputs.
- Provide a controlled submission flow so new contributions queue for manual review rather than writing to the upstream dataset.

## Repository Snapshot
- Top-level Markdown (`index.md`, `docs.md`, `weldcraft.md`, `impressum.md`) feed the static site’s pages. `_config.yml` and `_layouts/` indicate a Jekyll build, though no site generator config beyond defaults is present yet.
- `visualizer/` contains the current interactive prototype. Key files:
  - `main.js`, `controls.js`, `lattice.js`, `render_demo.js`, `render_points.js`, `params.js`, `rng.js`, `styles.css`, and `index.html`.
  - The prototype likely predates the hydrogen dataset scope; expect to extend or replace with the real plotting logic.
- `assets/` and `.github/` exist but weren’t inspected; check for shared images/workflows before publishing.

## Upstream Data & Tooling
- Source of truth: `hydrogen-diffusion-database` repo. Every JSON entry includes `entry_id`, `source_id`, optional `group_id`, temperature validity bounds, and model definitions (`single_point`, `arrhenius`, `power`).
- Plotting utility: `plot_diffusivity_groups.py` with config file `plotting.config.json`. It:
  - Loads all entries, groups by `group_id`.
  - Samples piecewise segments, applies envelope fill, temperature unit toggle, numbering, annotations.
  - CLI example: `python plot_diffusivity_groups.py --source-id boellinghaus_1995_scatterband --output boellinghaus.png`.
- Website must either:
  1. Import a consolidated JSON bundle generated from the Python sampler at build time, or
  2. Fetch per-source bundles / future API at runtime.

## Required Site Features
1. **Home** – summarize mission, highlight data coverage, link back to upstream repo.
2. **Explorer** – filter datasets (source, material, temperature range, groups). Show interactive plot with:
   - Kelvin/°C toggle
   - Envelope fill toggle
   - Numbered legend matching upstream plots
   - Export buttons (PNG/CSV/JSON).
3. **Contribution Form** – capture publication metadata, model parameters, attachments, and send to manual review (email/webhook). No automatic dataset writes.
4. **Docs/FAQ** – explain contribution workflow, validation rules (peer-reviewed, open-access only), and analysis assumptions (no extrapolation outside `[Tmin, Tmax]`).

## Current Priorities / Next Steps
1. Scaffold the static site routes/pages above (plain HTML/JS or lightweight framework). Ensure routing works with GitHub Pages.
2. Decide ingestion format (single JSON payload vs. per-source) and document the contract. If generating sampled grids, extend `plot_diffusivity_groups.py` to emit them.
3. Port evaluator logic to the client or ship precomputed samples to keep browser rendering light. Respect Arrhenius / Power formulas exactly; forbid extrapolation.
4. Build the plotting UI with toggles that mirror `plotting.config.json` options so UX stays in sync with the Python tool.
5. Implement submission flow: form validation, optional file upload, and backend hook (email/webhook/queue). Keep submissions small and auditable.

## Collaboration Tips
- Check for `SKILL.md` instructions when users mention skills (none are required so far but stay alert for future sessions).
- Maintain ASCII files unless non-ASCII already present. Keep comments concise; favor readable code.
- Git tree may already contain user changes. Never revert work you didn’t do.
- If commands need to write outside the sandbox, request escalation per the CLI rules.
- When adding data logic, treat `hydrogen-diffusion-database` as immutable unless instructed otherwise.

## Open Questions to Confirm With Stakeholders
- Preferred deployment target (GitHub Pages vs. other hosting) and build pipeline.
- Exact data bundle format expected by the Explorer (raw models vs. pre-sampled grid points).
- Submission handling endpoint (email address, webhook URL, etc.).
- Whether to reuse the existing `visualizer/` prototype or rebuild with a plotting library (e.g., D3, Plotly, Observable Plot).

Update this document whenever onboarding steps change or major architectural decisions land.
