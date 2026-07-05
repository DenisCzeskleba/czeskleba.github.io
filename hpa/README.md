# Hydrogen Permeation Analyzer <a href="https://doi.org/10.5281/zenodo.21204365"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.21204365.svg" alt="DOI"></a>

Hydrogen Permeation Analyzer (HPA) is a browser-only tool for analyzing hydrogen
permeation transients. It is designed for users who want to compare the common
textbook evaluation methods and also inspect consistency against the analytical
solution to the one-dimensional Fickian membrane model.

The live tool is published at:
https://czeskleba.com/hpa/

## Repository Note

This repository is maintained as the citeable HPA software mirror.

- Day-to-day editing happens in the `czeskleba.com` website repository under `hpa/`.
- Changes are mirrored here automatically by GitHub Actions.
- GitHub releases in this repository are the releases intended for Zenodo archiving and DOI-based citation.

## What HPA does

- Paste or upload a two-column transient file with time first and current second.
- Compare classical evaluation methods, inverse Fickian analysis, and global
  transient fitting.
- Inspect the plot in the browser and export PNG, SVG, or processed CSV output.

## How to cite

If you use HPA, cite the specific released version you used.

**Current citeable release: v1.0.0**  
DOI: https://doi.org/10.5281/zenodo.21204365

The Zenodo record provides ready-to-import citation formats, and the live website
also exposes BibTeX, RIS, and plain-text citation downloads through the `Cite`
panel.

## Privacy

HPA runs in the browser. Nothing is sent to a backend during analysis.

## License

This software is released under the MIT License. See `LICENSE` for the full text.
