param(
  [string]$Source = "hdd\contribute.md",
  [string]$Output = "hdd\dev-contribute.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($Output -ne "hdd\dev-contribute.html") {
  throw "Refusing to write to output other than hdd\dev-contribute.html"
}

$md = Get-Content -Raw $Source
if ($md -notmatch "^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$") {
  throw "Failed to find content after front matter in $Source"
}

$content = $Matches[1]
$html = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hydrogen Diffusion Database - Contribute</title>
    <link rel="stylesheet" href="./hdd-explorer.css" />
    <style>
      :root {
        --bg: #f6f7f9;
        --text: #1f2937;
        --button-bg: #1f2937;
        --button-text: #fff;
        --border: #d7dbe2;
      }

      body.dark {
        --bg: #15181d;
        --text: #e5e7eb;
        --button-bg: #e5e7eb;
        --button-text: #111827;
        --border: #2b313a;
      }

      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: var(--bg);
        color: var(--text);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: background-color 0.3s, color 0.3s;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
        background-color: var(--bg);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        width: 100%;
        z-index: 10;
        box-sizing: border-box;
      }

      header a.logo {
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text);
      }

      header img {
        height: 30px;
        width: 30px;
      }

      .header-links {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.95rem;
      }

      .header-links a {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--text);
        text-decoration: none;
        padding: 0.35rem 0.6rem;
        border-radius: 6px;
        border: 1px solid transparent;
      }

      .header-links a:hover {
        border-color: var(--border);
        background-color: color-mix(in srgb, var(--bg) 85%, var(--text));
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .theme-toggle {
        cursor: pointer;
        height: 30px;
        padding: 0 0.8rem;
        font-size: 0.8rem;
        background-color: var(--button-bg);
        color: var(--button-text);
        border: none;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
      }

      .header-sep {
        color: var(--muted);
        font-size: 1rem;
        margin: 0 0.2rem;
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }

      main {
        padding: 2rem 1rem;
        max-width: 820px;
        width: 100%;
        margin: 2rem auto 1.5rem;
        text-align: center;
      }

      footer {
        margin-top: 0.125rem;
        padding-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #888;
      }

      footer a {
        color: inherit;
        text-decoration: none;
      }

      footer a:hover {
        text-decoration: underline;
      }

      footer a:visited {
        color: inherit;
      }

      main a {
        color: inherit;
        text-decoration: underline;
      }

      main a:visited {
        color: inherit;
      }

      @media (max-width: 600px) {
        header {
          flex-direction: row;
          flex-wrap: wrap;
          padding: 1rem;
          gap: 0.5rem;
        }

        .header-links {
          order: 3;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .header-actions {
          margin-left: auto;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <a class="logo" href="/">
        <img src="/assets/logo.svg" alt="Home" />
      </a>
      <nav class="header-links" aria-label="HDD links">
        <a href="/hydrogen-diffusion-database/">
          <img src="/assets/HDD.B%20Logo.png" alt="HDD.B" />
          <span>HDD.B</span>
        </a>
        <span class="header-sep">&#183;</span>
        <a href="/hydrogen-diffusion-database/docs/">How it works</a>
        <span class="header-sep">&#183;</span>
        <a href="/hydrogen-diffusion-database/contribute/">Contribute Data</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle" type="button" onclick="toggleTheme()">&#127763; Mode</button>
      </div>
    </header>
    <main>
$content
    </main>
    <footer>
      <p>&copy; 2025 czeskleba.com · <a href="/impressum.html">Impressum</a></p>
    </footer>
    <script>
      function toggleTheme() {
        document.body.classList.toggle("dark");
        localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
      }

      (function () {
        const saved = localStorage.getItem("theme");
        if (saved !== "light") {
          document.body.classList.add("dark");
        }
      })();
    </script>
    <script src="./hdd-contribution.js" defer></script>
  </body>
</html>
"@

Set-Content -Path $Output -Value $html -Encoding UTF8
Write-Host "Wrote $Output"
