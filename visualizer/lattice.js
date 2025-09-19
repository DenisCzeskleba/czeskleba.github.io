// /visualizer/lattice.js

// Fractional coordinates of base atoms for each lattice
export const BASIS = {
  SC:  [[0,0,0]],
  BCC: [[0,0,0],[0.5,0.5,0.5]],
  FCC: [[0,0,0],[0,0.5,0.5],[0.5,0,0.5],[0.5,0.5,0]],
};

// Interstitial site families (fractional) — just positions; colors are handled in the renderer
// Interstitial site generators mirroring canonical catalogs
export function tetraSites(lattice){
  const L = lattice;
  const pts = [];
  const push=(x,y,z)=>pts.push([x,y,z]);
  if (L==='SC' || L==='BCC'){
    const q=[0.25,0.75], m=[0.5], z=[0.0,1.0];
    const patterns = [
      [q,m,z],[m,q,z],[q,z,m],[m,z,q],[z,q,m],[z,m,q]
    ];
    for (const [X,Y,Z] of patterns)
      for (const x of X) for (const y of Y) for (const z0 of Z) push(x,y,z0);
  } else if (L==='FCC'){
    for (const x of [0.25,0.75])
      for (const y of [0.25,0.75])
        for (const z0 of [0.25,0.75]) push(x,y,z0);
  }
  return pts;
}
export function octaSites(lattice){
  const L = lattice;
  const set = new Set();
  const add=(x,y,z)=>set.add(JSON.stringify([x,y,z]));
  if (L==='SC' || L==='FCC'){
    add(0.5,0.5,0.5);
    const h=0.5;
    for (let axis=0; axis<3; axis++){
      for (const u of [0,1]) for (const v of [0,1]){
        const p=[0,0,0]; p[axis]=h; p[(axis+1)%3]=u; p[(axis+2)%3]=v; add(p[0],p[1],p[2]);
      }
    }
  } else if (L==='BCC'){
    add(0.5,0.5,0.0); add(0.5,0.5,1.0);
    add(0.5,0.0,0.5); add(0.5,1.0,0.5);
    add(0.0,0.5,0.5); add(1.0,0.5,0.5);
  }
  return Array.from(set).map(s=>JSON.parse(s));
}


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
