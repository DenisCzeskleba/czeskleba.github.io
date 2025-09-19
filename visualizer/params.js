export const DEFAULTS = {
  mode: 'lattice',
  lattice: 'BCC',
  feCount: 100000,
  feSize: 1.0,
  cFrac: 0.0,
  cSize: 1.0,
  vFrac: 0.0,
  vSize: 1.0,
  hCount: 0,
  hSize: 0.5,
  siteScope: 'canonical',
  seed: 1337,
};
export function clampParams(p){
  const clamp = (v,lo,hi)=> Math.min(hi, Math.max(lo, v));
  return {
    ...p,
    feCount: Math.round(clamp(p.feCount, 100, 1000000)),
    feSize:  clamp(p.feSize, 0.01, 1.0),
    cFrac:   clamp(p.cFrac, 0, 0.05),
    cSize:   clamp(p.cSize, 0.01, 5.0),
    vFrac:   clamp(p.vFrac, 0, 0.05),
    vSize:   clamp(p.vSize, 0.01, 5.0),
    hCount:  Math.round(clamp(p.hCount, 0, 30)),
    hSize:   clamp(p.hSize, 0.01, 1.0),
  };
}
