import { DEFAULTS, clampParams } from './params.js';
export function bindControls(onChange){
  const byId = id=> document.getElementById(id);
  const state = { ...DEFAULTS };
  const controls = {
    mode: byId('mode'),
    lattice: byId('lattice'),
    feCount: byId('feCount'),
    feSize: byId('feSize'), feSizeVal: byId('feSizeVal'),
    cFrac: byId('cFrac'), cFracVal: byId('cFracVal'),
    cSize: byId('cSize'), cSizeVal: byId('cSizeVal'),
    vFrac: byId('vFrac'), vFracVal: byId('vFracVal'),
    vSize: byId('vSize'), vSizeVal: byId('vSizeVal'),
    hCount: byId('hCount'),
    hSize: byId('hSize'), hSizeVal: byId('hSizeVal'),
    siteScope: byId('siteScope'),
    seed: byId('seed'),
    reset: byId('reset'),
    shot: byId('shot'),
    badge: byId('badge'),
  };
  function updateVisibility(){
    document.querySelectorAll('[data-for]').forEach(el=>{
      const key = el.getAttribute('data-for');
      el.style.display = (key === state.mode) ? '' : 'none';
    });
  }
  function push(){
    const p = clampParams(state);
    controls.feSizeVal.textContent = p.feSize.toFixed(2);
    controls.cFracVal.textContent = p.cFrac.toFixed(3);
    controls.cSizeVal.textContent = p.cSize.toFixed(2);
    controls.vFracVal.textContent = p.vFrac.toFixed(3);
    controls.vSizeVal.textContent = p.vSize.toFixed(2);
    controls.hSizeVal.textContent = p.hSize.toFixed(2);
    updateVisibility();
    onChange(p);
  }
  function hookRange(ctrl, key){
    ctrl.addEventListener('input', ()=>{ state[key] = parseFloat(ctrl.value); push(); });
  }
  controls.mode.value = state.mode;
  controls.lattice.value = state.lattice;
  controls.feCount.value = String(state.feCount);
  controls.feSize.value = String(state.feSize);
  controls.cFrac.value = String(state.cFrac);
  controls.cSize.value = String(state.cSize);
  controls.vFrac.value = String(state.vFrac);
  controls.vSize.value = String(state.vSize);
  controls.hCount.value = String(state.hCount);
  controls.hSize.value = String(state.hSize);
  controls.siteScope.value = state.siteScope;
  controls.seed.value = String(state.seed);
  controls.mode.addEventListener('change', ()=>{ state.mode = controls.mode.value; push(); });
  controls.lattice.addEventListener('change', ()=>{ state.lattice = controls.lattice.value; push(); });
  controls.feCount.addEventListener('input', ()=>{ state.feCount = parseInt(controls.feCount.value||'0',10); push(); });
  hookRange(controls.feSize, 'feSize');
  hookRange(controls.cFrac, 'cFrac');
  hookRange(controls.cSize, 'cSize');
  hookRange(controls.vFrac, 'vFrac');
  hookRange(controls.vSize, 'vSize');
  controls.hCount.addEventListener('input', ()=>{ state.hCount = parseInt(controls.hCount.value||'0',10); push(); });
  hookRange(controls.hSize, 'hSize');
  controls.siteScope.addEventListener('change', ()=>{ state.siteScope = controls.siteScope.value; push(); });
  controls.seed.addEventListener('input', ()=>{ state.seed = parseInt(controls.seed.value||'0',10); push(); });
  controls.reset.addEventListener('click', ()=>{
    Object.assign(state, DEFAULTS);
    controls.mode.value = state.mode;
    controls.lattice.value = state.lattice;
    controls.feCount.value = String(state.feCount);
    controls.feSize.value = String(state.feSize);
    controls.cFrac.value = String(state.cFrac);
    controls.cSize.value = String(state.cSize);
    controls.vFrac.value = String(state.vFrac);
    controls.vSize.value = String(state.vSize);
    controls.hCount.value = String(state.hCount);
    controls.hSize.value = String(state.hSize);
    controls.siteScope.value = state.siteScope;
    controls.seed.value = String(state.seed);
    push();
  });
  return { controls, setBadge: t=> controls.badge.textContent = t, push, shotBtn: controls.shot };
}
