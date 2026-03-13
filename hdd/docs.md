---
layout: default
title: Hydrogen Diffusion Guide
permalink: /hydrogen-diffusion-database/docs/
---

<style>
  .hdd-docs {
    text-align: left;
    max-width: 980px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
  }
  .hdd-docs-hero {
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(37, 99, 235, 0.08));
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 2rem 2.25rem;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    margin-bottom: 1.5rem;
  }
  .hdd-docs-hero h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
  }
  .hdd-docs-hero p {
    margin: 0.5rem 0 0;
    font-size: 1.05rem;
    color: color-mix(in srgb, var(--text) 85%, var(--bg));
  }
  .hdd-docs-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
  .hdd-docs-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
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
    gap: 0.6rem 1rem;
    align-items: center;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg) 85%, var(--text));
    border: 1px solid var(--border);
    margin: 0 0 1.5rem;
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
    margin-top: 2rem;
  }
  .hdd-docs-section h2 {
    margin-bottom: 0.4rem;
  }
  .hdd-docs-section p {
    color: color-mix(in srgb, var(--text) 90%, var(--bg));
  }
  .hdd-docs-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    margin-top: 1rem;
  }
  .hdd-docs-card {
    background: color-mix(in srgb, var(--bg) 92%, var(--text));
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.2rem;
  }
  .hdd-docs-callout {
    border-left: 4px solid #0f766e;
    background: color-mix(in srgb, #0f766e 12%, var(--bg));
    padding: 1rem 1.2rem;
    border-radius: 12px;
    margin-top: 1rem;
  }
  .hdd-docs-example {
    background: color-mix(in srgb, var(--bg) 88%, var(--text));
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    margin-top: 0.75rem;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 0.92rem;
  }
  .hdd-docs-list {
    margin: 0.75rem 0 0;
    padding-left: 1.1rem;
  }
</style>

<div class="hdd-docs">
  <div class="hdd-docs-hero">
    <h1>Hydrogen Diffusion Database Guide</h1>
    <p>
      A practical guide to exploring, filtering, and plotting hydrogen diffusivity data. If you want to
      compare materials, validate a model, or download data you can trust, this page will walk you through it.
    </p>
    <div class="hdd-docs-cta">
      <a class="hdd-docs-button" href="/hydrogen-diffusion-database/">Open Explorer</a>
      <a class="hdd-docs-button secondary" href="/hydrogen-diffusion-database/contribute/">Contribute Data</a>
    </div>
  </div>

  <div class="hdd-docs-toc">
    <strong>On this page:</strong>
    <a href="#quick-start">Quick start</a>
    <a href="#filters">How filters work</a>
    <a href="#plot-options">Plot options</a>
    <a href="#exporting">Exporting</a>
    <a href="#license">License and citation</a>
    <a href="#contributing">Contributing data</a>
    <a href="#contact">Contact and corrections</a>
    <a href="#faq">FAQ</a>
  </div>

  <section class="hdd-docs-section" id="quick-start">
    <h2>Quick start</h2>
    <p>Here is the shortest path from zero to a clean plot.</p>
    <ol class="hdd-docs-list">
      <li>Open the Explorer and load the dataset (it loads automatically).</li>
      <li>Pick filters (source, material, method, temperature window) or click Select Series.</li>
      <li>Press Plot Filtered, then export the image or data.</li>
    </ol>
  </section>

  <section class="hdd-docs-section" id="filters">
    <h2>How filters work</h2>
    <p>
      Filters are multi-select. Each filter panel lets you select one or more values. Most panels include a
      toggle that switches between include and exclude mode.
    </p>
    <div class="hdd-docs-grid">
      <div class="hdd-docs-card">
        <h3>Include vs. Exclude</h3>
        <p>
          Use the toggle at the top of a filter list to decide whether selected items should be included or excluded.
        </p>
        <div class="hdd-docs-example">Example: Exclude = "AISI 4340" to remove that grade from results.</div>
      </div>
      <div class="hdd-docs-card">
        <h3>Literature Compilations</h3>
        <p>
          The Literature Compilations switch lets you include, only show, or exclude compilation sources.
        </p>
      </div>
      <div class="hdd-docs-card">
        <h3>Temperature Window</h3>
        <p>
          Set a min and max temperature in C to keep only datasets whose valid range overlaps your window.
        </p>
        <div class="hdd-docs-example">Example: 20 to 400 keeps room-temperature to mid-range studies.</div>
      </div>
      <div class="hdd-docs-card">
        <h3>Outliers and Unconfirmed</h3>
        <p>
          Use "Include Outliers / Unconfirmed" if you want to see flagged values. Leave it off for conservative results.
        </p>
      </div>
    </div>
    <p>
      Tip: Hover over controls in the Explorer for quick hints. Many toggles show a tooltip.
    </p>
  </section>

  <section class="hdd-docs-section" id="plot-options">
    <h2>Plot options</h2>
    <p>Plot controls live in the Plot Options panel above the chart.</p>
    <div class="hdd-docs-grid">
      <div class="hdd-docs-card">
        <h3>Units and scale</h3>
        <p>Switch between Kelvin and C, and choose log or linear Y-scale.</p>
      </div>
      <div class="hdd-docs-card">
        <h3>Envelope fill</h3>
        <p>Shows the scatter band around each curve (useful for uncertainty ranges).</p>
      </div>
      <div class="hdd-docs-card">
        <h3>Numbered plots</h3>
        <p>Labels curves with numbers so they match the legend list.</p>
      </div>
      <div class="hdd-docs-card">
        <h3>Axis limits</h3>
        <p>Manually lock X or Y limits for consistent comparisons across multiple plots.</p>
      </div>
      <div class="hdd-docs-card">
        <h3>Monochrome</h3>
        <p>Switch to black and white for print-ready plots.</p>
      </div>
      <div class="hdd-docs-card">
        <h3>Grid lines</h3>
        <p>Toggle X and Y grid lines for easier reading.</p>
      </div>
    </div>
  </section>

  <section class="hdd-docs-section" id="exporting">
    <h2>Exporting</h2>
    <p>
      Use the Export button to download images and data. PNG is best for figures, CSV for quick analysis,
      and JSON for full fidelity and automated pipelines.
    </p>
  </section>

  <!-- TODO: Add a dedicated citation section here. -->
  <section class="hdd-docs-section" id="license">
    <h2>License and citation</h2>
    <p>
      The images, data, and full database are free to use under the project license. The public database is
      archived on Zenodo under Creative Commons Attribution 4.0 (CC BY 4.0). See
      <code>https://doi.org/10.5281/zenodo.18980188</code> for license details.
    </p>
    <p>
      Please cite the database or website when using this resource, and always cite the original publications.
      We attach DOI or source links directly to each dataset to keep provenance transparent and easy to verify.
    </p>
  </section>

  <section class="hdd-docs-section" id="contributing">
    <h2>Contributing data</h2>
    <p>
      We welcome contributions of peer-reviewed, open-access papers and data. Use the
      <a href="/hydrogen-diffusion-database/contribute/">contribution form</a> to submit publication metadata
      and model parameters. You can also email me directly, but the preferred format is the form because it
      automatically sorts, prepares, and formats submissions for the website.
    </p>
    <p>
      To keep the database trustworthy and reusable, we follow a few strict rules. They are meant to protect
      provenance and avoid a "trust me bro" situation where nobody can verify the original source.
    </p>
    <ul class="hdd-docs-list">
      <li>Only peer-reviewed, open-access sources are accepted.</li>
      <li>Outliers or suspicious values are flagged for follow-up (for example, orders-of-magnitude deviations that suggest unit or typo issues).</li>
    </ul>
    <p>
      If you are the author and send data directly, please be explicit about the valid temperature range.
      That single line of clarity makes a big difference. Some papers mention a temperature in the methods
      section but never state the validity range for the Arrhenius fit itself. In those cases we cannot use
      the data when all we have is the paper. When you provide the range directly, we can include it with confidence.
    </p>
    <div class="hdd-docs-callout">
      <strong>No extrapolation (by us).</strong>
      We plot only the valid temperature ranges stated by the original paper. Papers may extrapolate in their
      own analysis, but we do not extend beyond what they explicitly declare as valid. If a paper does not
      state a temperature range, we may apply obvious assumptions (for example, a permeation experiment with no
      stated temperature is assumed to be room temperature if the paper clearly implies room temperature measurements).
      A negative example from the initial database build: a paper reported an Arrhenius formula but only mentioned a
      method temperature (such as 150 C) in the experimental section without stating a validity range for the model,
      so the paper was excluded.
    </div>
  </section>

  <section class="hdd-docs-section" id="contact">
    <h2>Contact and corrections</h2>
    <p>
      If you spot an error, missing context, or a citation problem, please email <code>Denis@Czeskleba.com</code>.
      Direct email is preferred and helps avoid contact-form limits.
    </p>
  </section>

  <section class="hdd-docs-section" id="faq">
    <h2>FAQ</h2>
    <div class="hdd-docs-card">
      <p><strong>Can I use the data and images freely?</strong><br />
      Yes. Use the database under CC BY 4.0 and cite the database or website, plus the original sources where relevant.</p>
      <p><strong>Can I submit my own data?</strong><br />
      Yes. Use the <a href="/hydrogen-diffusion-database/contribute/">contribution form</a> and include full publication details and model parameters.</p>
      <p><strong>Do you accept non-open-access papers?</strong><br />
      No. We only accept peer-reviewed open-access sources to keep provenance clear and verifiable, and to avoid copyright issues.</p>
      <p><strong>I found an error or have a suggestion. How do I report it?</strong><br />
      Please email <code>Denis@Czeskleba.com</code>. Direct email is preferred and helps avoid contact-form limits.</p>
    </div>
  </section>
</div>
