---
layout: default
title: How the Hydrogen Diffusion Database works
permalink: /hydrogen-diffusion-database/docs/
---

<style>
  .hdd-docs {
    text-align: left;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1rem 2.5rem;
  }

  .hdd-docs-hero {
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.10), rgba(37, 99, 235, 0.06));
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.7rem 1.9rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    margin-bottom: 1.25rem;
  }

  .hdd-docs-hero h1 {
    margin: 0 0 0.45rem;
    font-size: 1.85rem;
    line-height: 1.2;
  }

  .hdd-docs-hero p {
    margin: 0.45rem 0 0;
    font-size: 1rem;
    color: color-mix(in srgb, var(--text) 88%, var(--bg));
  }

  .hdd-docs-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.15rem;
  }

  .hdd-docs-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.58rem 0.95rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    background: var(--button-bg);
    color: var(--button-text) !important;
    border: 1px solid transparent;
  }

  .hdd-docs-button.secondary {
    background: transparent;
    color: var(--text) !important;
    border: 1px solid var(--border);
  }

  .hdd-docs-toc {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.95rem;
    align-items: center;
    padding: 0.75rem 0.95rem;
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg) 88%, var(--text));
    border: 1px solid var(--border);
    margin: 0 0 1.5rem;
    font-size: 0.96rem;
  }

  .hdd-docs-toc a {
    text-decoration: none;
    color: inherit;
    border-bottom: 1px dashed transparent;
  }

  .hdd-docs-toc a:hover {
    border-bottom-color: currentColor;
  }

  .hdd-docs-section {
    margin-top: 2.2rem;
  }

  .hdd-docs-section h2 {
    margin-bottom: 0.5rem;
  }

  .hdd-docs-section p {
    color: color-mix(in srgb, var(--text) 90%, var(--bg));
  }

  .hdd-docs-steps {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    margin-top: 1rem;
  }

  .hdd-docs-step {
    background: color-mix(in srgb, var(--bg) 92%, var(--text));
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.1rem;
  }

  .hdd-docs-step h3 {
    margin-top: 0;
    margin-bottom: 0.45rem;
    font-size: 1rem;
  }

  .hdd-docs-list {
    margin: 0.75rem 0 0;
    padding-left: 1.15rem;
  }

  .hdd-docs-callout {
    border-left: 4px solid #0f766e;
    background: color-mix(in srgb, #0f766e 10%, var(--bg));
    padding: 1rem 1.15rem;
    border-radius: 12px;
    margin-top: 1rem;
  }

  .hdd-docs-linkline {
    margin-top: 1rem;
  }
</style>

<div class="hdd-docs">
  <div class="hdd-docs-hero">
    <h1>How the Hydrogen Diffusion Database works</h1>
    <p>
      The Hydrogen Diffusion Database is an interactive tool for exploring hydrogen diffusivity data from the literature.
      You can filter datasets by material, method, or temperature range, compare series directly in the browser,
      and export plots or data for your own work.
    </p>
    <div class="hdd-docs-cta">
      <a class="hdd-docs-button" href="/hydrogen-diffusion-database/">Open Explorer</a>
      <a class="hdd-docs-button secondary" href="/hydrogen-diffusion-database/contribute/">Contribute Data</a>
    </div>
  </div>

  <div class="hdd-docs-toc">
    <strong>On this page:</strong>
    <a href="#overview">Overview</a>
    <a href="#explorer">Using the explorer</a>
    <a href="#quality">Data quality and scope</a>
    <a href="#contributing">Contributing data</a>
    <a href="#citation">Citation and contact</a>
  </div>

  <section class="hdd-docs-section" id="overview">
    <h2>Overview</h2>
    <p>
      This database collects hydrogen diffusivity data from the literature and makes it easier to compare,
      visualize, and reuse. It is designed for quick exploration in the browser, but also for more serious use
      in modeling, validation, and research workflows.
    </p>
    <p>
      Instead of digging through many separate papers just to compare a few values, you can filter the database,
      inspect the plotted series, and export the result in a form that is easy to cite and reuse.
    </p>
  </section>

  <section class="hdd-docs-section" id="explorer">
    <h2>Using the explorer</h2>
    <p>
      The main workflow is intentionally simple: choose what you want to see, plot it, adjust the display if needed,
      and export the result.
    </p>

    <div class="hdd-docs-steps">
      <div class="hdd-docs-step">
        <h3>1. Filter or select series</h3>
        <p>
          Use the filter panel to narrow the dataset by source, material, method, or temperature window. If you
          already know what you want, you can also select series directly.
        </p>
      </div>

      <div class="hdd-docs-step">
        <h3>2. Plot the result</h3>
        <p>
          Press <strong>Plot Filtered</strong> to generate the plot. This gives you a clean view of the currently
          selected datasets and makes comparison much easier.
        </p>
      </div>

      <div class="hdd-docs-step">
        <h3>3. Adjust the display</h3>
        <p>
          Use the plot options to change units, scale, grid lines, labeling, monochrome mode, or axis limits,
          depending on whether you want a quick inspection or a publication-ready figure.
        </p>
      </div>

      <div class="hdd-docs-step">
        <h3>4. Export image or data</h3>
        <p>
          Export figures for reports and presentations, or download the filtered data for your own analysis.
          PNG is practical for images, while CSV or JSON is better for downstream work.
        </p>
      </div>
    </div>

    <p class="hdd-docs-linkline">
      For first-time use, the quickest route is simply: filter → plot → export.
    </p>
  </section>

  <section class="hdd-docs-section" id="quality">
    <h2>Data quality and scope</h2>
    <p>
      The database is built to be useful, but also traceable. Each dataset is tied back to its literature source
      so that the provenance stays visible and easy to verify.
    </p>

    <ul class="hdd-docs-list">
      <li>Only peer-reviewed, open-access sources are included.</li>
      <li>Original source links or DOI references are kept wherever possible.</li>
      <li>Flagged outliers or unconfirmed values can be shown separately if you want to inspect them.</li>
      <li>The database does not extend Arrhenius fits beyond the valid range stated by the original source.</li>
    </ul>

    <div class="hdd-docs-callout">
      <strong>No extrapolation by the database.</strong>
      Curves are plotted only within the temperature range that is explicitly supported by the original source.
      If a publication does not state a valid range clearly enough, that dataset may be excluded or handled
      conservatively.
    </div>
  </section>

  <section class="hdd-docs-section" id="contributing">
    <h2>Contributing data</h2>
    <p>
      Contributions are welcome. The preferred route is the
      <a href="/hydrogen-diffusion-database/contribute/">contribution form</a>, because it keeps submissions
      structured and makes later verification easier.
    </p>
    <p>
      To keep the database trustworthy and reusable, submissions should come from peer-reviewed open-access sources
      and include clear publication metadata, model parameters, and the valid temperature range whenever possible.
    </p>
  </section>

  <section class="hdd-docs-section" id="citation">
    <h2>Citation and contact</h2>
    <p>
      If you use the database in your own work, please cite the database or website and also cite the original
      publications behind the datasets you use.
    </p>
    <p>
      The public database archive is available on Zenodo under CC BY 4.0:
      <code>https://doi.org/10.5281/zenodo.18980188</code>
    </p>
    <p>
      If you spot an error, missing context, or a citation issue, please contact
      <code>Denis@Czeskleba.com</code>.
    </p>
  </section>
</div>