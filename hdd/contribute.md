---
layout: default
title: Contribute Hydrogen Data
permalink: /hydrogen-diffusion-database/contribute/
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

## How to Submit Today

Submissions are collected through GitHub Issues to keep the workflow transparent and fully manual.
Use the contribution template and fill in as many structured fields as possible:

- Submit here: https://github.com/DenisCzeskleba/hydrogen-diffusion-database/issues/new?template=contribution.yml

If you need to attach large tables or figures, include a public link in the issue body.
