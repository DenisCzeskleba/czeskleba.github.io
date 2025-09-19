// Unit-cell basis (fractional coords) for Base atoms
export const BASIS = {
  SC:  [[0,0,0]],
  BCC: [[0,0,0],[0.5,0.5,0.5]],
  FCC: [[0,0,0],[0,0.5,0.5],[0.5,0,0.5],[0.5,0.5,0]],
};

// Interstitial sites (fractional) — colors handled elsewhere
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

export function unitCellDemoCount(lat){ return { SC:8, BCC:9, FCC:14 }[lat]; }

// Fill a cubic region with enough cells to hit (or exceed) `target` atoms, then trim.
export function generateBasePositions(lat, target){
  const basis = BASIS[lat];
  const perCell = basis.length;
  const cellsNeeded = Math.max(1, Math.ceil(target / perCell));
  const n = Math.ceil(Math.cbrt(cellsNeeded)); // cells per axis
  const out = [];
  for(let ix=0; ix<n; ix++)
  for(let iy=0; iy<n; iy++)
  for(let iz=0; iz<n; iz++)
    for(const b of basis){ out.push(ix+b[0], iy+b[1], iz+b[2]); }
  const atoms = Math.min(target, Math.floor(out.length/3));
  return { positions: new Float32Array(out.slice(0, atoms*3)), cellsPerAxis: n, perCell };
}

// Build interstitial sites for one unit cell; optionally duplicate onto all faces.
export function interstitialSitesOneCell(lat, scope){ // 'canonical' | 'allFaces'
  const t = TETRA_SITES[lat], o = OCTA_SITES[lat];
  const allT = t.flat(), allO = o.flat();
  if (scope === 'allFaces'){
    const offs = [[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]];
    const dup = (src)=>{
      const out = [];
      for (let i=0;i<src.length;i+=3){
        const x=src[i], y=src[i+1], z=src[i+2];
        for(const d of offs){ out.push(x+d[0], y+d[1], z+d[2]); }
      }
      return out;
    };
    allT.push(...dup(allT)); allO.push(...dup(allO));
  }
  return { t: new Float32Array(allT), o: new Float32Array(allO) };
}
