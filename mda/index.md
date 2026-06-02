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
