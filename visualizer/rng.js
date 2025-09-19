// Tiny seeded RNG (LCG). Returns a function rand() -> [0,1)
export function makeRand(seed){
  let s = (seed>>>0) || 1;
  return ()=>{ s = (1664525*s + 1013904223)>>>0; return ((s>>>8) / 0x01000000); };
}
