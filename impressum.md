---
layout: default
title: Impressum
permalink: /impressum.html
---

## Impressum

**Angaben gemäß § 5 TMG**  
Bundesanstalt für Materialforschung und -prüfung (BAM)
Denis Czeskleba (Fachbereich 9.4)
Unter den Eichen 87
12205 Berlin

**Kontakt:**  
E-Mail: Denis@Czeskleba.com  

## Contact

<form class="hdd-contrib-form" id="impressum-contact-form" action="https://formspree.io/f/mbdzovzk" method="POST" novalidate>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Website Contact (Impressum)" />

  <fieldset>
    <div class="hdd-contrib-grid">
      <div>
        <label for="contact-name">Name</label>
        <input id="contact-name" name="name" required />
      </div>
      <div>
        <label for="contact-email">E-Mail</label>
        <input id="contact-email" name="email" type="email" required />
      </div>
    </div>
    <div>
      <label for="contact-message">Message</label>
      <textarea id="contact-message" name="message" rows="6" required></textarea>
    </div>
  </fieldset>

  <div class="hdd-contrib-actions">
    <button type="submit">Send message</button>
    <span class="hdd-contrib-status" id="impressum-contact-status"></span>
  </div>
</form>

<script>
  (function () {
    const form = document.getElementById("impressum-contact-form");
    if (!form) return;
    const status = document.getElementById("impressum-contact-status");
    const submitButton = form.querySelector("button[type='submit']");

    function setStatus(message, tone) {
      if (!status) return;
      status.textContent = message;
      status.style.color = tone === "error" ? "#b91c1c" : "var(--text)";
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) {
        setStatus("Please fill in the required fields.", "error");
        return;
      }
      if (submitButton) submitButton.disabled = true;
      setStatus("Sending...", "info");

      const data = new FormData(form);
      fetch(form.action, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            form.reset();
            setStatus("Thanks! Your message has been sent.", "ok");
            return;
          }
          return response.json().then((payload) => {
            const message =
              payload && payload.errors
                ? payload.errors.map((err) => err.message).join(" ")
                : "Something went wrong. Please try again.";
            throw new Error(message);
          });
        })
        .catch((error) => {
          setStatus(error.message || "Submission failed.", "error");
        })
        .finally(() => {
          if (submitButton) submitButton.disabled = false;
        });
    });
  })();
</script>

**Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:**  
Denis Czeskleba, Adresse wie oben
