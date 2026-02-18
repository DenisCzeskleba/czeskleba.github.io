/* Placeholder submission handler. Replace with email/webhook integration once ready. */
(function () {
  const form = document.getElementById("hydrogen-contribution-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert(
      "Thanks for your interest! The real submission pipeline is not live yet.\nPlease email your dataset to denis@czeskleba.com."
    );
  });
})();
