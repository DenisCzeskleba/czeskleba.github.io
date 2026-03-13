---
layout: default
title: Impressum![1773305241066](image/impressum/1773305241066.png)![1773305244149](image/impressum/1773305244149.png)
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
Please consider sending a direct e-mail as the contact form has a monthly limit.  
Bitte bevorzugen Sie eine direkte E-Mail. Das Kontaktformular hat ein monatliches Limit und kann schnell voll sein.  

## Contact


<style>
  .impressum-form {
    margin: 1.5rem auto 0;
    max-width: 720px;
    text-align: left;
    display: grid;
    gap: 16px;
  }
  .impressum-form fieldset {
    border: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
  }
  .impressum-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .impressum-form label {
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
  }
  .impressum-form input,
  .impressum-form textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    font: inherit;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }
  .impressum-form textarea {
    min-height: 160px;
    resize: vertical;
  }
  .impressum-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .impressum-actions button {
    padding: 12px 16px;
    border-radius: 10px;
    border: none;
    background: #1f2937;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .impressum-status {
    font-size: 0.95rem;
  }
</style>

<form class="impressum-form" id="impressum-contact-form" action="https://formspree.io/f/mbdzovzk" method="POST" novalidate>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Website Contact (Impressum)" />

  <fieldset>
    <div class="impressum-grid">
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

  <div class="impressum-actions">
    <button type="submit">Send message</button>
    <span class="impressum-status" id="impressum-contact-status"></span>
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
