---
layout: default
title: Hydrogen Diffusion Docs
permalink: /hydrogen-diffusion-database/docs/
---

# Documentation & FAQ

Welcome to the Hydrogen Diffusion Database. This site is built for researchers who want to compare, visualize, and reuse hydrogen diffusivity data without losing context. If you are validating models, comparing materials, or just trying to find reliable numbers fast, the Explorer is meant to get you there with a few clicks.

## What You Can Do

- Browse, filter, and plot diffusion datasets in the Explorer.
- Export plots as PNG and download filtered data as CSV or JSON.
- Download the full public database for independent analysis.
- Contribute new peer-reviewed, open-access sources to expand coverage.

## License & Usage

The images, data, and full database are free to use under the project license. The public database is archived on Zenodo under Creative Commons Attribution 4.0 (CC BY 4.0). See `https://doi.org/10.5281/zenodo.18980188` for license details.

If you use this resource, please cite the database or website, and also cite the original publications where appropriate. Companion papers will be added as they become available. We provide open-access DOIs wherever possible to make attribution easy.

## Contributions

We welcome contributions of your own peer-reviewed, open-access papers and data. Use the [contribution form](/hydrogen-diffusion-database/contribute/) to submit publication metadata and model parameters. Submissions are reviewed before they appear in the public database. If you have a dataset that is hard to interpret, include a short note and we will follow up. You can also email me directly, but the preferred format for new data is the form because it automatically sorts, prepares, and formats submissions for the website.

To keep the database trustworthy and reusable, we follow a few strict rules. They are meant to protect provenance and avoid a "trust me bro" situation where nobody can verify the original source.

- Only peer-reviewed, open-access sources are accepted, with DOI or source links attached directly to each dataset to keep provenance transparent and easy to verify.
- Outliers or suspicious values are flagged for follow-up (for example, orders-of-magnitude deviations that suggest unit or typo issues).

If you are the author and send data directly, please be explicit about the valid temperature range. That single line of clarity makes a big difference. For example, some papers mention a temperature in the experimental methods section but never say the validity range for the Arrhenius fit itself. In those cases we cannot use the data when all we have is the paper but when you as an author provide the range directly (via the form), we can include it with confidence.

### No Extrapolation (By Us)

This is the most important rule on the site. We do not extrapolate. We plot only the valid temperature ranges stated by the original paper. Papers may extrapolate in their own analysis, but we do not extend beyond what they explicitly declare as valid.

If a paper does not state a temperature range, we may apply obvious assumptions. Example: a permeation experiment with no stated temperature is assumed to be room temperature if the paper clearly implies room temperature measurements. A negative example from the initial database build: a paper reported an Arrhenius formula but only mentioned a method temperature (such as 150 °C) in the experimental section without stating a validity range for the model, so the paper was excluded.

## Contact and Corrections

If you spot an error, missing context, or a citation problem, please email `Denis@Czeskleba.com`. Direct email is preferred and helps avoid contact-form limits.

## FAQ

**Can I use the data and images freely?**  
Yes. Use the database under CC BY 4.0 and cite the database or website, plus the original sources where relevant.

**Can I submit my own data?**  
Yes. Use the [contribution form](/hydrogen-diffusion-database/contribute/) and include full publication details and model parameters.

**Do you accept non-open-access papers?**  
No. We only accept peer-reviewed open-access sources to keep provenance clear and verifiable, and to avoid copyright issues.

**I found an error or have a suggestion. How do I report it?**  
Please email `Denis@Czeskleba.com`. Direct email is preferred and helps avoid contact-form limits.

