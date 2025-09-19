// /visualizer/lattice.js

// Fractional coordinates of base atoms for each lattice
export const BASIS = {
  SC:  [[0,0,0]],
  BCC: [[0,0,0],[0.5,0.5,0.5]],
  FCC: [[0,0,0],[0,0.5,0.5],[0.5,0,0.5],[0.5,0.5,0]],
};

// Interstitial site families (fractional) — just positions; colors are handled in the renderer
export const TETRA_SITES = {
  SC:  [[0.25,0.5,0],[0.75,0.5,0],[0.5,0.25,0],[0.5,0.75,0],[0,0.25,0.5],[0,0.75,0.5],[0.25,0,0.5],[0.75,0,0.5]],
  BCC: [[0.25,0.5,0],[0.75,0.5,0],[0.5,0.25,0],[0.5,0.75,0],[0,0.25,0.5],[0,0.75,0.5],[0.25,0,0.5],[0.75,0,0.5]],
  FCC: [[0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75]],
};

export const OCTA_SITES = {
  SC:  [[0.5,0.5,0.5],[0.5,0,0],[0,0.5,0],[0,0,0.5]],
  BCC: [[0.5,0.5,0.5],[0.5,0,0],[0,0.5,0],[0,0,0.5]],
  FCC: [[0.5,0.5,0.5],[0.5,0,0],[0,0.5,0],[0,0,0.5]],
};

// For Demo mode, how many base atoms to show per lattice
export function unitCellCounts(lat){ 
  return { SC: 8, BCC: 9, FCC: 14 }[lat]; 
}

/**
 * generateFePositions(lattice, targetCount)
 * Builds a cubic n×n×n tiling of unit cells large enough to meet/exceed `targetCount`,
 * then trims to exactly targetCount. Returns a Float32Array [x0,y0,z0, x1,y1,z1, ...]
 * in **unit-cell** coordinates (no physical units).
 */
export function generateFePositions(lat, target){
  const basis = BASIS[lat];
  if (!basis) return new Float32Array();

  const perCell = basis.length;
  const cellsNeeded = Math.max(1, Math.ceil(target / perCell));
  const n = Math.ceil(Math.cbrt(cellsNeeded)); // cells per axis

  const out = [];
  for (let ix=0; ix<n; ix++)
    for (let iy=0; iy<n; iy++)
      for (let iz=0; iz<n; iz++)
        for (const b of basis){
          out.push(ix + b[0], iy + b[1], iz + b[2]);
        }

  return new Float32Array(out); // full cube: perCell * n^3 atoms (>= target); matches Python behavior
}
