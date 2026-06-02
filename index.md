---
layout: default
title: Home
---

# Welcome!

Have a look at the following:

<style>
  main {
    max-width: 1200px;
  }

  .site-tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.15rem;
    margin-top: 1.4rem;
    align-items: stretch;
  }

  .site-tool-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 1rem 1.1rem;
    text-align: center;
    text-decoration: none;
    color: inherit !important;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg) 90%, var(--text));
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .site-tool-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--border) 60%, var(--text));
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
  }

  .site-tool-card img {
    display: block;
    width: 100%;
    max-width: 250px;
    height: auto;
    object-fit: contain;
  }

  .site-tool-card strong {
    font-size: 1rem;
    line-height: 1.2;
  }
</style>

<div class="site-tool-grid">
  <a href="/weldcraft/" class="site-tool-card">
    <img src="/assets/WeldCraft.png" alt="WeldCraft" />
    <strong>WeldCraft</strong>
  </a>

  <a href="/visualizer/" class="site-tool-card">
    <img src="/assets/Visualizer.png" alt="Lattice Visualizer" />
    <strong>Lattice Visualizer</strong>
  </a>

  <a href="/mda/" class="site-tool-card">
    <img src="/assets/Membrane Diffusion Analyser.png" alt="Membrane Diffusion Analyzer" />
    <strong>Membrane Diffusion Analyzer</strong>
  </a>

  <a href="/hydrogen-diffusion-database/" class="site-tool-card">
    <img src="/assets/HDD.B%20Logo.png" alt="Hydrogen Diffusion Database" />
    <strong>Hydrogen Diffusion Database</strong>
  </a>
</div>
