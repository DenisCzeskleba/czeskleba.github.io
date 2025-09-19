export const BASIS = {
  SC:  [[0,0,0]],
  BCC: [[0,0,0],[0.5,0.5,0.5]],
  FCC: [[0,0,0],[0,0.5,0.5],[0.5,0,0.5],[0.5,0.5,0]],
};
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
export function unitCellCounts(lat){ return { SC:8, BCC:9, FCC:14 }[lat]; }
export function generateFePositions(lat, target){
  const basis = BASIS[lat];
  const perCell = basis.length;
  const cellsNeeded = Math.max(1, Math.ceil(target / perCell));
  const n = Math.ceil(Math.cbrt(cellsNeeded));
  const out = [];
  for(let ix=0; ix<n; ix++)
  for(let iy=0; iy<n; iy++)
  for(let iz=0; iz<n; iz++)
    for(const b of basis){ out.push(ix+b[0], iy+b[1], iz+b[2]); }
  const atoms = Math.min(target, Math.floor(out.length/3));
  return new Float32Array(out.slice(0, atoms*3));
}
