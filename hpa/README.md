# Hydrogen Permeation Analyzer

Hydrogen Permeation Analyzer (HPA) is a browser-only tool for analyzing hydrogen
permeation transients. It is designed for users who want to compare the common
textbook evaluation methods and also inspect consistency against the analytical
solution to the one-dimensional Fickian membrane model.

The live tool is published at:
https://czeskleba.com/hpa/

## What HPA does

- Paste or upload a two-column transient file with time first and current second.
- Compare classical evaluation methods, inverse Fickian analysis, and global
  transient fitting.
- Inspect the plot in the browser and export PNG, SVG, or processed CSV output.

## Privacy

HPA runs in the browser. Nothing is sent to a backend during analysis.

## License

MIT

## Repository Note

This repository is maintained as the citeable HPA software mirror. The main
editing workflow currently lives in the website repository for
`czeskleba.com`, and changes under `hpa/` are mirrored here automatically.
