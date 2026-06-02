---
layout: default
title: Membrane Diffusion Analyzer
permalink: /mda/
---

<section class="mda-workspace" aria-label="MDA workspace scaffold">
  <aside class="mda-panel">
    <div class="mda-panel-header">
      <h2>Analysis Inputs</h2>
      <p>Placeholder controls for the first implementation pass.</p>
    </div>

    <div class="mda-card-grid">
      <div class="mda-card">
        <h3>File intake</h3>
        <p>CSV or TXT upload, local parsing, and column selection.</p>
      </div>
      <div class="mda-card">
        <h3>Normalization</h3>
        <p>Baseline, steady-state, crop range, and unit selection.</p>
      </div>
      <div class="mda-card">
        <h3>Classical values</h3>
        <p>Breakthrough, time lag, and inflection-based estimates.</p>
      </div>
      <div class="mda-card">
        <h3>Quality checks</h3>
        <p>Noise, drift, bounds hits, and insufficient-data warnings.</p>
      </div>
    </div>
  </aside>

  <section class="mda-stage">
    <div class="mda-stage-header">
      <h2>Plot and Diagnostics</h2>
      <p>Reserved for the normalized transient, D<sub>app</sub>(t), and summary output.</p>
    </div>

    <div class="mda-stage-placeholder">
      <strong>Workspace ready.</strong>
      <p>This is the shell we will fill with the browser-side analysis pipeline.</p>
    </div>

    <div class="mda-summary-grid" aria-label="Planned output panels">
      <div class="mda-summary-card">
        <h3>Transient plot</h3>
        <p>Normalized signal vs. time with analysis overlays.</p>
      </div>
      <div class="mda-summary-card">
        <h3>D<sub>app</sub>(t)</h3>
        <p>Inverse Fick solution and plateau diagnostics.</p>
      </div>
      <div class="mda-summary-card">
        <h3>Exports</h3>
        <p>Processed table, summary data, and plot images.</p>
      </div>
    </div>
  </section>
</section>

<style>
  header .mda-header-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    margin: 0 auto;
    text-decoration: none;
    color: var(--text);
    overflow: hidden;
  }

  header .mda-header-brand-image {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    object-fit: contain;
  }

  header .mda-header-brand-text {
    font-size: 1.06rem;
    font-weight: 700;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 720px) {
    header .mda-header-brand {
      gap: 0.5rem;
    }

    header .mda-header-brand-image {
      width: 32px;
      height: 32px;
    }

    header .mda-header-brand-text {
      font-size: 0.98rem;
    }
  }

  .mda-workspace {
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: 1rem;
    margin-top: 1rem;
    align-items: start;
  }

  .mda-panel,
  .mda-stage {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    box-shadow: var(--shadow);
  }

  .mda-panel,
  .mda-stage {
    padding: 1rem;
  }

  .mda-panel-header h2,
  .mda-stage-header h2,
  .mda-card h3,
  .mda-summary-card h3 {
    margin: 0;
  }

  .mda-panel-header p,
  .mda-stage-header p,
  .mda-card p,
  .mda-summary-card p,
  .mda-stage-placeholder p {
    margin: 0.35rem 0 0;
    color: var(--muted);
  }

  .mda-panel-header {
    margin-bottom: 1rem;
  }

  .mda-card-grid,
  .mda-summary-grid {
    display: grid;
    gap: 0.85rem;
  }

  .mda-card-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .mda-summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    margin-top: 1rem;
  }

  .mda-card,
  .mda-summary-card,
  .mda-stage-placeholder {
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel-strong);
    padding: 0.9rem 1rem;
  }

  .mda-stage {
    min-height: 100%;
  }

  .mda-stage-placeholder {
    min-height: 280px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    margin-top: 1rem;
  }

  @media (max-width: 920px) {
    .mda-workspace {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  (function () {
    const header = document.querySelector("header");
    if (!header) return;

    const actions = header.querySelector(".header-actions");
    if (!actions) return;

    if (header.querySelector(".mda-header-brand")) return;

    const brand = document.createElement("div");
    brand.className = "mda-header-brand";
    brand.setAttribute("aria-label", "Membrane Diffusion Analyzer");
    brand.innerHTML = `
      <img class="mda-header-brand-image" src="/assets/Membrane Diffusion Analyser.png" alt="Membrane Diffusion Analyzer" decoding="async" loading="lazy" />
      <span class="mda-header-brand-text">Membrane Diffusion Analyzer</span>
    `;

    header.insertBefore(brand, actions);
  })();
</script>
