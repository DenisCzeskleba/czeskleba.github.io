---
layout: default
title: Hydrogen Permeation Analyzer
permalink: /hpa/
---

<link rel="stylesheet" href="/hpa/hpa.css" />

<div id="hpa-app" class="hpa-app">
  <div class="hpa-workspace">
    <aside class="hpa-panel">
        <div class="hpa-panel-header">
          <div>
            <h2>Input</h2>
          </div>
        <div class="hpa-intro-actions">
          <button type="button" class="hpa-button is-secondary" id="hpa-clear" title="Clear pasted data and reset the preview.">Clear</button>
          <button type="button" class="hpa-button is-secondary" id="hpa-upload-trigger" title="Upload a CSV or TXT file into the same parser.">File Upload</button>
          <button type="button" class="hpa-button is-accent hpa-help-open" data-action="open-help" title="Open the short usage guide.">Help</button>
        </div>
      </div>

      <div class="hpa-panel-body">
        <section class="hpa-section">
          <textarea
            id="hpa-input"
            class="hpa-textarea"
            spellcheck="false"
            autocomplete="off"
            placeholder="Paste data here&#10;0.0 1.2e-9&#10;0.5 1.5e-9&#10;1.0 1.7e-9"
            title="Paste the measurement data here."
          ></textarea>
          <details class="hpa-inline-details">
            <summary>Decimal separator</summary>
            <div class="hpa-inline-details-body">
              <div class="hpa-control hpa-inline-control">
                <select id="hpa-decimal" class="hpa-select" title="Decimal separator is detected from new input and can be overridden manually.">
                  <option value="." selected>Dot</option>
                  <option value=",">Comma</option>
                </select>
              </div>
            </div>
          </details>
        </section>

        <section class="hpa-section">
          <h3>Experiment</h3>
          <div class="hpa-control-grid">
            <div class="hpa-control">
              <label for="hpa-current-unit" title="Choose the unit of the measured current or signal.">Current unit</label>
              <select id="hpa-current-unit" class="hpa-select" title="Choose the unit of the measured current or signal.">
                <option value="A" selected>A</option>
                <option value="mA">mA</option>
                <option value="uA">&mu;A</option>
                <option value="nA">nA</option>
                <option value="pA">pA</option>
              </select>
            </div>
            <div class="hpa-control">
              <label for="hpa-thickness" title="Enter the membrane thickness.">Membrane Thickness [mm]</label>
            <input id="hpa-thickness" class="hpa-number" type="text" inputmode="decimal" lang="en-US" value="0.50" placeholder="0.50" title="Enter the membrane thickness in millimeters." />
            </div>
          </div>
          <div class="hpa-control" style="margin-top:0.75rem;">
            <label for="hpa-t0-offset" title="Set the start time offset. Negative values remove early time; positive values prepend baseline time.">Start Time Offset (t<sub>0</sub>)</label>
            <input id="hpa-t0-offset" type="range" min="-180" max="180" step="0.1" value="0" title="Set the start time offset. Negative values remove early time; positive values prepend baseline time." />
            <div class="hpa-slider-value" id="hpa-t0-offset-value">0.0 s</div>
          </div>
        </section>

        <input
          id="hpa-file"
          class="hpa-file"
          hidden
          type="file"
          accept=".csv,.txt,.tsv,text/plain,text/csv"
          title="Upload a CSV or TXT file into the same parser."
        />
      </div>

      <div class="hpa-status" id="hpa-status" role="status" aria-live="polite">Paste data to begin.</div>
      <div class="hpa-status-detail" id="hpa-status-detail" aria-live="polite"></div>
      <ul class="hpa-issues" id="hpa-issues" aria-live="polite"></ul>
    </aside>

    <section class="hpa-stage">
      <div class="hpa-stage-header">
        <div class="hpa-stage-left-actions">
          <button type="button" class="hpa-button is-accent" id="hpa-diagnostic-open" data-action="open-diagnostic" title="Experimental: Run a diagnostic self-consistency check and suggest candidate settings.">Experimental: Diagnostics</button>
        </div>
        <div class="hpa-stage-controls">
          <button type="button" class="hpa-button is-secondary" id="hpa-reset-plot" title="Reset the preview plot zoom and pan.">Reset</button>
          <details class="hpa-tool-panel is-accent">
            <summary class="hpa-button is-accent">Plot Options</summary>
            <div class="hpa-tool-panel-body">
              <div class="hpa-control">
                <label for="hpa-plot-unit" title="Choose the unit shown on the plot and data preview.">Y-axis unit</label>
              <select id="hpa-plot-unit" class="hpa-select" title="Choose the unit shown on the plot and data preview.">
                <option value="A">A</option>
                <option value="mA">mA</option>
                      <option value="uA" selected>&mu;A</option>
                <option value="pA">pA</option>
              </select>
              </div>
              <div class="hpa-control">
                <label for="hpa-low-confidence" title="Low-confidence region, where the inverse problem is poorly conditioned. Check Help. Think f(x) = 1 / (1-x); as x -> 1, it blows up.">Low Confidence Region</label>
                <select id="hpa-low-confidence" class="hpa-select" title="Low-confidence region, where the inverse problem is poorly conditioned. Check Help. Think f(x) = 1 / (1-x); as x -> 1, it blows up.">
                  <option value="normal">Normal</option>
                  <option value="shaded" selected>Shaded</option>
                  <option value="hide">Hide</option>
                </select>
              </div>
            <div class="hpa-color-grid" aria-label="Plot line colors">
              <label class="hpa-color-control" for="hpa-color-current" title="Set the measured permeation current color.">
                <span>Measurement</span>
                <input type="color" id="hpa-color-current" class="hpa-color-input" value="#2563eb" />
              </label>
              <label class="hpa-color-control" for="hpa-color-diffusion" title="Set the diffusion coefficient color.">
                <span>Diffusion Coefficient (<span style="font-style:italic;">D</span><sub>inv</sub>)</span>
                <input type="color" id="hpa-color-diffusion" class="hpa-color-input" value="#111111" />
              </label>
              <label class="hpa-color-control" for="hpa-color-diffusion-edge" title="Set the low-confidence segment color.">
                <span>Low Confidence Region</span>
                <input type="color" id="hpa-color-diffusion-edge" class="hpa-color-input" value="#acb2be" />
              </label>
              <label class="hpa-color-control" for="hpa-color-fit" title="Set the simulated measurement color.">
                <span>Simulated Measurement (<span style="font-style:italic;">D</span><sub>GTF</sub>)</span>
                <input type="color" id="hpa-color-fit" class="hpa-color-input" value="#7c3aed" />
              </label>
            </div>
            <div class="hpa-inline-checkbox-row">
              <label class="hpa-inline-checkbox" title="Toggle the plot grid lines.">
                <input type="checkbox" id="hpa-grid-toggle" checked />
                <span>Grid lines</span>
              </label>
              <label class="hpa-inline-checkbox" title="Toggle the minor grid lines.">
                <input type="checkbox" id="hpa-minor-grid-toggle" checked />
                <span>Minor</span>
              </label>
            </div>
            <label class="hpa-inline-checkbox" title="Toggle the diffusion axis between linear and logarithmic scaling.">
              <input type="checkbox" id="hpa-diffusion-scale" />
              <span>Log Diffusion Axis</span>
            </label>
          </div>
        </details>
          <details class="hpa-tool-panel">
            <summary class="hpa-button is-secondary">Baseline</summary>
            <div class="hpa-tool-panel-body">
              <div class="hpa-reference-row">
                <div class="hpa-control">
                  <label for="hpa-baseline-value" title="Enter the baseline current value.">Baseline</label>
                  <input id="hpa-baseline-value" class="hpa-number" type="number" step="any" placeholder="Auto" title="Enter the baseline current value." />
                </div>
                <button type="button" class="hpa-button is-accent hpa-reference-toggle" id="hpa-baseline-reset" title="Reset the baseline value to the auto-detected data default.">Reset</button>
                <button type="button" class="hpa-button is-secondary hpa-reference-toggle" id="hpa-baseline-toggle" aria-pressed="true" title="Hide or show the baseline marker line.">Hide</button>
              </div>
              <div class="hpa-reference-row">
                <div class="hpa-control">
                  <label for="hpa-steady-value" title="Enter the steady-state current value.">Steady State</label>
                  <input id="hpa-steady-value" class="hpa-number" type="number" step="any" placeholder="Auto" title="Enter the steady-state current value." />
                </div>
                <button type="button" class="hpa-button is-accent hpa-reference-toggle" id="hpa-steady-reset" title="Reset the steady-state value to the auto-detected data default.">Reset</button>
                <button type="button" class="hpa-button is-secondary hpa-reference-toggle" id="hpa-steady-toggle" aria-pressed="true" title="Hide or show the steady-state marker line.">Hide</button>
              </div>
            </div>
          </details>
          <details class="hpa-tool-panel">
            <summary class="hpa-button is-secondary">Export</summary>
            <div class="hpa-tool-panel-body">
              <div class="hpa-export-row">
                <button type="button" class="hpa-button is-secondary" data-download="png">PNG</button>
                <button type="button" class="hpa-button is-secondary" data-download="svg">SVG</button>
                <button type="button" class="hpa-button is-secondary" data-download="csv">Data</button>
              </div>
            </div>
          </details>
        </div>
      </div>

        <div class="hpa-plot-card">
          <div id="hpa-plot" class="hpa-plot" aria-label="Preview plot"></div>
        </div>

        <h2 class="hpa-results-heading">Apparent Diffusion Coefficients by Mathematical Model</h2>

        <div class="hpa-results-grid" aria-label="Diffusion model results">
          <article class="hpa-result-card">
            <h3>Breakthrough</h3>
            <div class="hpa-result-value" id="hpa-breakthrough-value">D<sub>b</sub> = NaN</div>
            <div class="hpa-result-meta" id="hpa-breakthrough-time">Load data to calculate breakthrough time.</div>
            <div class="hpa-result-note" id="hpa-breakthrough-note"></div>
          </article>
          <article class="hpa-result-card">
            <h3>Time lag</h3>
            <div class="hpa-result-value" id="hpa-lag-value">D<sub>lag</sub> = NaN</div>
            <div class="hpa-result-meta" id="hpa-lag-time">Load data to calculate time lag.</div>
            <div class="hpa-result-note" id="hpa-lag-note"></div>
          </article>
          <article class="hpa-result-card">
            <h3>Inflection point</h3>
            <div class="hpa-result-value" id="hpa-inflection-value">D<sub>IP</sub> = NaN</div>
            <div class="hpa-result-meta" id="hpa-inflection-time">Load data to calculate the inflection point.</div>
            <div class="hpa-result-note" id="hpa-inflection-note"></div>
          </article>
          <article class="hpa-result-card">
            <h3>Inverse Fickian</h3>
            <div class="hpa-result-value" id="hpa-inverse-value">D<sub>Inv</sub> = NaN</div>
            <div class="hpa-result-meta" id="hpa-inverse-time">Load data to estimate the stabilized inverse window.</div>
            <div class="hpa-result-note" id="hpa-inverse-note"></div>
          </article>
          <article class="hpa-result-card hpa-result-card-fit">
            <h3>Global Transient Fit</h3>
            <button type="button" class="hpa-button is-secondary hpa-fit-toggle" id="hpa-fit-toggle" aria-pressed="false" title="Show or hide the fitted permeation curve.">Show</button>
            <div class="hpa-result-value" id="hpa-fit-value">D<sub>GTF</sub> = NaN</div>
            <div class="hpa-result-meta" id="hpa-fit-time">Load data to fit D and t<sub>0</sub> together.</div>
            <div class="hpa-result-note" id="hpa-fit-note"></div>
          </article>
        </div>

        <details class="hpa-preview-details" open>
          <summary>Data preview</summary>
        <div class="hpa-preview-wrap" aria-live="polite">
          <table class="hpa-preview-table" aria-label="Parsed data preview">
            <thead>
              <tr>
                <th>#</th>
                <th>Time [s]</th>
                <th>Current</th>
                      <th>Apparent Diffusion Coefficient D<sub>app</sub> [mm&sup2;/s]</th>
              </tr>
            </thead>
            <tbody id="hpa-preview-body">
              <tr>
                <td colspan="4" class="hpa-empty">No data loaded.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  </div>
</div>

<div class="hpa-help-drawer" id="hpa-help-drawer" aria-hidden="true">
  <div class="hpa-help-backdrop" data-action="close-help"></div>
  <aside class="hpa-help-panel" role="dialog" aria-modal="true" aria-label="How HPA works">
    <div class="hpa-help-header">
      <h2>How it works</h2>
      <button type="button" class="hpa-help-close" data-action="close-help">Close</button>
    </div>
    <div class="hpa-help-body">
      <p>HPA is a browser-only tool for analyzing hydrogen permeation data in the browser. It is meant for people who have a transient current trace, want to compare the common textbook evaluation methods, and also want to see whether the data are self-consistent with a simplified one-dimensional Fickian membrane model.</p>
      <p>The workflow is simple: paste or upload the data, confirm the current unit and membrane thickness, check the baseline and steady-state references, inspect the plot and results, then export what you need. Nothing is sent to a backend and the file stays in your browser.</p>

      <div>
        <h3>Quick start</h3>
        <ul class="hpa-help-list">
          <li>Paste a two-column file or use <strong>File Upload</strong>.</li>
          <li>Set the input current unit so HPA knows how to read the second column.</li>
          <li>Enter the membrane thickness in mm.</li>
          <li>Check the baseline and steady-state references, then drag them on the plot if needed.</li>
              <li>Use the results cards to compare the classical methods, the inverse Fickian solve, and the global transient fit.</li>
          <li>Export PNG, SVG, or the processed data table when you are done.</li>
        </ul>
      </div>

      <div>
        <h3>Input</h3>
        <p>HPA is strict about the input format because the analysis only makes sense when the file is unambiguous. Each row must contain exactly two numeric values: time first, current second. One sample belongs on each line, and header rows are not allowed.</p>
        <ul class="hpa-help-list">
          <li>Accepted separators are tab, semicolon, whitespace, and comma.</li>
          <li>The decimal separator can be dot or comma, but a single file should use one style consistently.</li>
          <li>Paste and file upload use the same parser, so both paths accept the same layout rules.</li>
          <li>Extra text, comments, mixed delimiters, or extra columns usually cause parsing to fail.</li>
          <li>If parsing fails, HPA reports the lines it could not understand and reminds you to keep the file to two numeric columns.</li>
        </ul>
        <p>Most failed imports come from one of three things: a header row, mixed decimal styles, or a file that contains more than just time and current values.</p>
      </div>

      <div>
        <h3>Controls and plot</h3>
        <p>The <strong>Current unit</strong> tells HPA how to interpret the uploaded current column. The <strong>Y-axis unit</strong> only changes how the plot, reference markers, and data preview are displayed. The app converts between them automatically, so you can keep the file in its original unit and still view it in a different one.</p>
        <ul class="hpa-help-list">
          <li>Supported current units are A, mA, &mu;A, nA, and pA.</li>
          <li>The membrane thickness is entered in mm. It matters because all diffusion coefficients scale with <code>L<sup>2</sup></code>, so a unit mistake changes every result by a large factor.</li>
          <li>The baseline and steady-state fields define the normalization used by the analysis. If they are left blank, HPA starts from the minimum and maximum values in the loaded data.</li>
          <li>You can type baseline and steady-state values manually, or drag the reference lines directly on the plot. The values follow the currently selected display unit.</li>
          <li>The <strong>Start Time Offset</strong> control shifts the trace before analysis. A positive offset prepends baseline time and moves the transient forward. A negative offset removes early time and shifts the remaining data back to zero.</li>
              <li>Plot Options let you change the y-axis unit, choose colors for the main lines, decide how inverse-conditioning-based low-confidence diffusion segments are drawn, turn grid lines and minor grid lines on or off, and switch the diffusion axis between linear and logarithmic scaling.</li>
          <li>The <strong>Reset</strong> button restores the default plot view. The <strong>Hide/Show</strong> buttons toggle the reference markers without deleting their values.</li>
        </ul>
        <p>The plot itself is interactive. You can zoom and pan it directly, then use <strong>Reset</strong> to return to the default view. If you drag the baseline or steady-state line, HPA updates the corresponding value and reruns the analysis.</p>
      </div>

      <div>
        <h3>Results</h3>
        <p>HPA first normalizes the measured current with</p>
        <p><code>y(t) = (I(t) - I<sub>0</sub>) / (I<sub>ss</sub> - I<sub>0</sub>)</code></p>
            <p>where <code>I<sub>0</sub></code> is the baseline current and <code>I<sub>ss</sub></code> is the steady-state current. That normalized curve is the common basis for the classical methods, the inverse solve, and the global fit.</p>
        <p><code>D<sub>app</sub>(t)</code> is an apparent coefficient, not a claim about the true lattice diffusion constant. It is the constant <code>D</code> that the simplified 1D Fickian membrane model would need in order to reproduce the measured transient at that time point.</p>
        <ul class="hpa-help-list">
          <li><strong>Breakthrough</strong> uses the first 10% crossing of the normalized curve. It is a quick textbook estimate, but it is sensitive to the early-time shape and to any baseline error.</li>
          <li><strong>Time lag</strong> uses the 63% crossing. It assumes that the transient has a clear monotonic rise and that the steady-state level is meaningful.</li>
          <li><strong>Inflection point</strong> uses the maximum-slope point of the normalized curve. It is only useful when the curve has one clear inflection and the steady-state current is valid.</li>
          <li><strong>Inverse Fickian</strong> inverts the ideal Fickian response point by point to produce <code>D<sub>app</sub>(t)</code>. HPA shades low-confidence regions where the inverse problem is poorly conditioned, then reports an average value when a stable middle window is robust enough.</li>
          <li><strong>Global Transient Fit</strong> searches for one constant <code>D</code> and one <code>t<sub>0</sub></code> shift that best reproduce the normalized curve. It is useful when you want a single self-consistent fit instead of pointwise inversion.</li>
        </ul>
        <p>The low-confidence shade is a practical proxy, not a new physics claim. A useful intuition is <code>f(x) = 1 / (1-x)</code>: as <code>x</code> approaches 1, the inverse blows up, so the flat tail is less trustworthy.</p>
        <p>The preview table shows <code>D<sub>app</sub></code> in mm&sup2;/s for readability. The CSV export writes <code>D<sub>app</sub></code> in m&sup2;/s, so the exported numbers look different even though they represent the same quantity.</p>
      </div>

      <div>
        <h3>Export</h3>
        <ul class="hpa-help-list">
          <li><strong>PNG</strong> saves the current plot as an image.</li>
          <li><strong>SVG</strong> saves the current plot as a vector graphic.</li>
          <li><strong>Data</strong> exports the processed table with time, current, and <code>D<sub>app</sub></code>.</li>
        </ul>
        <p>The export always reflects the current display settings, including the selected plot unit, reference values, and plot view. If you change the plot or the controls, export again to capture the updated state.</p>
      </div>

      <div>
        <h3>Diagnostics</h3>
        <p>The <strong>Experimental: Diagnostics</strong> drawer is a self-consistency check, not a proof of the underlying physics. It looks for candidate baseline, steady-state, and <code>t<sub>0</sub></code> settings that make the data more compatible with the simplified model.</p>
        <ul class="hpa-help-list">
          <li>The composite score is a heuristic measure of how self-consistent the selected preprocessing looks. Lower is better.</li>
          <li>Confidence is derived from that score and is meant as a convenience indicator, not as a statistical probability.</li>
          <li>The top candidates are alternate baseline, steady-state, and time-zero combinations that the diagnostic search tested against the same data.</li>
          <li><strong>Apply Best</strong> copies the best candidate into the main controls and reruns the analysis.</li>
          <li><strong>Revert</strong> restores the state that existed before diagnostics were run.</li>
        </ul>
        <p>Warnings about weak signal, non-monotonic curves, plateau drift, or time-zero sensitivity mean the data or the selected preprocessing are not strongly self-consistent. They do not identify one physical mechanism by themselves, but they do tell you when the textbook methods deserve caution.</p>
      </div>

      <div>
        <h3>Limits and caveats</h3>
        <ul class="hpa-help-list">
          <li><code>D<sub>app</sub></code> is omitted for rows where the normalized value is outside the physical interior of the curve or where the solver cannot produce a valid value.</li>
          <li>The inverse-solve values can hit the solver bounds. When that happens, HPA treats the result as unstable instead of pretending it is meaningful.</li>
          <li>The global fit needs fixed baseline and steady-state values. If those references are not usable, the fit is unavailable.</li>
          <li>The tool does not model trapping, surface kinetics, oxide layers, recombination, or other detailed transport mechanisms. It only evaluates a simplified Fickian membrane picture.</li>
          <li>HPA is local-only. Your pasted data or uploaded file is processed in the browser and is not sent to a backend service.</li>
        </ul>
        <p>Use the results as a technical guide, not as a substitute for experimental judgment. If the diagnostic warnings are strong, the best next step is usually to check the file, the unit settings, and the reference levels before trusting a single-number diffusivity.</p>
      </div>
    </div>
  </aside>
</div>

<div class="hpa-diagnostic-drawer" id="hpa-diagnostic-drawer" aria-hidden="true">
  <div class="hpa-diagnostic-backdrop" data-action="close-diagnostic"></div>
  <aside class="hpa-diagnostic-panel" role="dialog" aria-modal="true" aria-label="Diagnostic mode">
    <div class="hpa-diagnostic-header">
      <div>
        <h2>Diagnostic mode</h2>
        <p id="hpa-diagnostic-summary">Paste data or load a file, then run Diagnose.</p>
      </div>
      <button type="button" class="hpa-diagnostic-close" data-action="close-diagnostic">Close</button>
    </div>
    <div class="hpa-diagnostic-body">
      <section class="hpa-diagnostic-actions-row">
        <button type="button" class="hpa-button is-accent" id="hpa-diagnostic-run">Diagnose</button>
        <button type="button" class="hpa-button is-secondary" id="hpa-diagnostic-apply" disabled>Apply Best</button>
        <button type="button" class="hpa-button is-secondary" id="hpa-diagnostic-revert" disabled>Revert</button>
      </section>

      <section class="hpa-diagnostic-grid hpa-diagnostic-section--results" aria-label="Diagnostic score summary">
        <article class="hpa-diagnostic-card">
          <span>Composite score</span>
          <strong id="hpa-diagnostic-score">—</strong>
        </article>
        <article class="hpa-diagnostic-card">
          <span>Confidence</span>
          <strong id="hpa-diagnostic-confidence">—</strong>
        </article>
        <article class="hpa-diagnostic-card">
          <span>Best t<sub>0</sub></span>
          <strong id="hpa-diagnostic-t0">—</strong>
        </article>
        <article class="hpa-diagnostic-card">
          <span>Agreement</span>
          <strong id="hpa-diagnostic-agreement">—</strong>
        </article>
      </section>

      <section class="hpa-diagnostic-block hpa-diagnostic-section--results">
        <h3>Snapshot</h3>
        <div id="hpa-diagnostic-snapshot" class="hpa-diagnostic-text">No snapshot stored yet.</div>
      </section>

      <section class="hpa-diagnostic-block hpa-diagnostic-section--results">
        <h3>Findings</h3>
        <ul id="hpa-diagnostic-findings" class="hpa-diagnostic-list"></ul>
      </section>

      <section class="hpa-diagnostic-block hpa-diagnostic-section--results">
        <h3>Top candidates</h3>
        <div id="hpa-diagnostic-candidates" class="hpa-diagnostic-candidates"></div>
      </section>

      <div class="hpa-diagnostic-busy" id="hpa-diagnostic-busy" hidden>
        <span class="hpa-diagnostic-busy-dot" aria-hidden="true"></span>
        <div>
          <strong>Diagnosing</strong>
          <div id="hpa-diagnostic-busy-text">Working through the candidate settings now.</div>
        </div>
      </div>

      <section class="hpa-diagnostic-block">
        <h3>Notes</h3>
        <div id="hpa-diagnostic-notes" class="hpa-diagnostic-text">Paste data or load a file, then run Diagnose to generate a report.</div>
      </section>
    </div>
  </aside>
</div>

<script src="/hpa/diagnostic-core.js" defer></script>
<script src="/hpa/hpa.js" defer></script>
