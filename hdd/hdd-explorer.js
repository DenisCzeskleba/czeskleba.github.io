/* Placeholder bootstrapper for the Hydrogen Diffusion Explorer.
 * The final implementation will fetch sampled groups produced by
 * plot_diffusivity_groups.py and render them with an interactive
 * chart (log scale, unit toggles, envelope fill, numbered legend).
 */
(function () {
  const mount = document.getElementById("hydrogen-explorer-app");
  if (!mount) return;

  const endpoint =
    mount.getAttribute("data-endpoint") ||
    "/data/hydrogen-diffusivity-groups.json";

  mount.innerHTML = `
    <p>Loading dataset from <code>${endpoint}</code>…</p>
    <p>This is a placeholder stub. Replace this script with the real explorer UI.</p>
  `;
})();
