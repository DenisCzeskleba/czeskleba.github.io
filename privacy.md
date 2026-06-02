---
layout: default
title: Privacy
permalink: /privacy.html
---

<style>
  main {
    max-width: 920px;
    text-align: left;
  }

  .privacy-page {
    max-width: 760px;
    margin: 0 auto;
    display: grid;
    gap: 1rem;
  }

  .privacy-page h1 {
    margin-bottom: 0.25rem;
  }

  .privacy-page p {
    margin: 0;
    line-height: 1.6;
  }

  .privacy-page a {
    color: inherit;
  }
</style>

<div class="privacy-page">
  <h1>Privacy</h1>

  <p>This site does not use analytics, ads, tracking pixels, newsletter popups, or other machinery designed to figure out who you are and why you clicked on something at <span id="current-time">23:47</span>.</p>

  <p>Some tools on this site let you open measurement files, for example CSV files. Those files are processed locally in your browser. They are not uploaded to me, not stored by me, and not inspected by me. Please keep your raw data, personal data, emotional support spreadsheets, and questionable file names on your own computer. I have enough of my own.</p>

  <p>This site does not intentionally use cookies for tracking, advertising, analytics, or profiling. That is why there is no cookie banner. There is nothing useful to accept, reject, configure, or pretend to understand.</p>

  <p>In fact, this is a static site. There is no backend waiting for your files. I simply cannot receive them unless you deliberately use the contribution form to send me an email.</p>

  <p>The site still has to be delivered somehow. The hosting provider may process standard technical access data such as IP address, browser type, time of access, and requested page. That is basic web plumbing. I do not use this for visitor statistics, advertising, or profiling.</p>

  <p>This site links to external services such as GitHub or Buy Me a Coffee. If you follow those links, their rules apply.</p>

  <p>If you contact me by email or through a form, I receive what you send: usually your name, email address, and message. I use that to reply. If you send data for the Hydrogen Diffusion Database, I use it for that purpose. There is a decent chance we already met near a conference poster anyway.</p>

  <p>Contact details are listed in the <a href="/impressum.html">Impressum</a>.</p>
</div>

<script>
  (function () {
    const el = document.getElementById("current-time");
    if (!el) return;
    const now = new Date();
    el.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  })();
</script>
