param(
  [string]$Source = "hdd\index.md",
  [string]$Output = "hdd\dev.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($Output -ne "hdd\dev.html") {
  throw "Refusing to write to output other than hdd\dev.html"
}

$layout = Get-Content -Raw "_layouts\default.html"
if ($layout -notmatch "<style>([\s\S]*?)</style>") {
  throw "Failed to extract <style> from _layouts/default.html"
}
$styleBlock = $Matches[1]

if ($layout -notmatch "<footer>([\s\S]*?)</footer>") {
  throw "Failed to extract <footer> from _layouts/default.html"
}
$footerBlock = $Matches[1]

if ($layout -notmatch "<script>([\s\S]*?)</script>") {
  throw "Failed to extract <script> from _layouts/default.html"
}
$themeScript = $Matches[1]

$md = Get-Content -Raw $Source
if ($md -notmatch "^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$") {
  throw "Failed to find content after front matter in $Source"
}

$content = $Matches[1]
# Remove the in-content stylesheet link (we add it in the head for dev preview)
$content = $content -replace '<link rel="stylesheet" href="/hdd/hdd-explorer.css"\s*>\s*', ''
# Use local data endpoint for dev preview
$content = $content -replace 'data-endpoint="/hdd/public_hdd_database.json"', 'data-endpoint="./public_hdd_database.json"'

$html = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hydrogen Diffusion Database</title>
    <style>
$styleBlock
    </style>
    <link rel="stylesheet" href="./hdd-explorer.css" />
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
        <span class="header-sep">·</span>
        <a href="/hydrogen-diffusion-database/docs/">How it works</a>
        <span class="header-sep">·</span>
        <a href="/hydrogen-diffusion-database/contribute/">Contribute Data</a>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle" onclick="toggleTheme()">🌗 Mode</button>
      </div>
    </header>
    <main>
$content
    </main>
    <footer>
$footerBlock
    </footer>
    <script>
$themeScript
    </script>
    <script src="./hdd-explorer.js" defer></script>
  </body>
</html>
"@

Set-Content -Path $Output -Value $html -Encoding UTF8
Write-Host "Wrote $Output"
