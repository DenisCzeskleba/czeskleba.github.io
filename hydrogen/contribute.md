---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen/contribute/
---

# Contribution Form

Help expand the hydrogen diffusivity dataset by submitting peer-reviewed, open-access sources. We manually review every entry before merging into the upstream repo.

## Submission Checklist

1. Publication metadata: title, authors, journal, year, DOI/URL.
2. Model definitions: specify `single_point`, `arrhenius`, or `power` parameters, including valid temperature ranges.
3. Supporting files: upload figures, tables, or supplementary spreadsheets if available.
4. Contact info: email + affiliation for follow-up questions.

## Planned Workflow

- **Validation:** automated linting ensures parameters, units, and ranges conform to the upstream JSON schema.
- **Queue:** submissions are emailed/webhooked to maintainers for manual verification; no automatic publishing to `hydrogen-diffusion-database`.
- **Status updates:** contributors receive confirmation plus a link to track review progress.

## UI Placeholder

```html
<form id="hydrogen-contribution-form" novalidate>
  <fieldset>
    <legend>Publication</legend>
    <label>Title <input name="title" required /></label>
    <label>DOI / URL <input name="doi" type="url" required /></label>
    <label>Contact Email <input name="email" type="email" required /></label>
  </fieldset>

  <fieldset>
    <legend>Model Parameters</legend>
    <textarea name="models" placeholder="Paste Arrhenius/Power definitions or upload JSON"></textarea>
    <label>Attach Files <input name="attachments" type="file" multiple /></label>
  </fieldset>

  <button type="submit">Submit for Review</button>
</form>
<script src="/assets/js/hydrogen-contribution.js" defer></script>
```

We will wire this form to the real email/webhook endpoint once stakeholders confirm the preferred review pipeline.
