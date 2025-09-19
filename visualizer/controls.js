import { DEFAULTS, clampParams } from './params.js';

export function bindControls(onChange){
  const $ = id => document.getElementById(id);

  const state = { ...DEFAULTS };

  const ui = {
    mode: $('mode'),
    lattice: $('lattice'),
    feCount: $('feCount'),
    feSize: $('feSize'), feSizeVal: $('feSizeVal'),
    cFrac: $('cFrac'), cFracVal: $('cFracVal'),
    cSize: $('cSize'), cSizeVal: $('cSizeVal'),
    vFrac: $('vFrac'), vFracVal: $('vFracVal'),
    vSize: $('vSize'), vSizeVal: $('vSizeVal'),
    hCount: $('hCount'),
    hSize: $('hSize'), hSizeVal: $('hSizeVal'),
    siteScope: $('siteScope'),
    seed: $('seed'),
    reset: $('reset'),
    shot: $('shot'),
    badge: $('badge'),
  };

  function updateVisibility(){
    // Show/hide any element with [data-for="lattice"] or [data-for="demo"]
    document.querySelectorAll('[data-for]').forEach(el=>{
      const wants = el.getAttribute('data-for');
      el.style.display = (wants === state.mode) ? '' : 'none';
    });
  }

  function reflect(){
    const p = clampParams(state);
    // write state -> UI
    ui.feCount.value = String(p.feCount);
    ui.feSize.value  = String(p.feSize);
    ui.cFrac.value   = String(p.cFrac);
    ui.cSize.value   = String(p.cSize);
    ui.vFrac.value   = String(p.vFrac);
    ui.vSize.value   = String(p.vSize);
    ui.hCount.value  = String(p.hCount);
    ui.hSize.value   = String(p.hSize);
    ui.siteScope.value = p.siteScope;
    ui.seed.value    = String(p.seed);

    // update the live labels
    ui.feSizeVal.textContent = p.feSize.toFixed(2);
    ui.cFracVal.textContent  = p.cFrac.toFixed(3);
    ui.cSizeVal.textContent  = p.cSize.toFixed(2);
    ui.vFracVal.textContent  = p.vFrac.toFixed(3);
    ui.vSizeVal.textContent  = p.vSize.toFixed(2);
    ui.hSizeVal.textContent  = p.hSize.toFixed(2);

    updateVisibility();
    onChange(p);
  }

  // listeners
  ui.mode.addEventListener('input', ()=>{ state.mode = ui.mode.value; reflect(); });
  ui.mode.addEventListener('change', ()=>{ state.mode = ui.mode.value; reflect(); });
  });
  ui.lattice.addEventListener('input', ()=>{ state.lattice = ui.lattice.value; reflect(); });
  ui.lattice.addEventListener('change', ()=>{ state.lattice = ui.lattice.value; reflect(); });
  });

  ui.feCount.addEventListener('input',  ()=>{ state.feCount = parseInt(ui.feCount.value||'0',10); reflect(); });
  ui.feCount.addEventListener('change',  ()=>{ state.feCount = parseInt(ui.feCount.value||'0',10); reflect(); });
  reflect(); });

  ui.feSize.addEventListener('input',  ()=>{ state.feSize = parseFloat(ui.feSize.value||'1'); ui.feSizeVal.textContent = state.feSize.toFixed(2); reflect(); });
  ui.feSize.addEventListener('change',  ()=>{ state.feSize = parseFloat(ui.feSize.value||'1'); ui.feSizeVal.textContent = state.feSize.toFixed(2); reflect(); });
  ui.feSizeVal.textContent = state.feSize.toFixed(2); onChange(clampParams(state)); });
  ui.cFrac.addEventListener('input',  ()=>{ state.cFrac = parseFloat(ui.cFrac.value||'0'); ui.cFracVal.textContent = state.cFrac.toFixed(3); reflect(); });
  ui.cFrac.addEventListener('change',  ()=>{ state.cFrac = parseFloat(ui.cFrac.value||'0'); ui.cFracVal.textContent = state.cFrac.toFixed(3); reflect(); });
  ui.cFracVal.textContent = state.cFrac.toFixed(3); onChange(clampParams(state)); });
  ui.cSize.addEventListener('input',  ()=>{ state.cSize = parseFloat(ui.cSize.value||'1'); ui.cSizeVal.textContent = state.cSize.toFixed(2); reflect(); });
  ui.cSize.addEventListener('change',  ()=>{ state.cSize = parseFloat(ui.cSize.value||'1'); ui.cSizeVal.textContent = state.cSize.toFixed(2); reflect(); });
  ui.cSizeVal.textContent = state.cSize.toFixed(2); onChange(clampParams(state)); });
  ui.vFrac.addEventListener('input',  ()=>{ state.vFrac = parseFloat(ui.vFrac.value||'0'); ui.vFracVal.textContent = state.vFrac.toFixed(3); reflect(); });
  ui.vFrac.addEventListener('change',  ()=>{ state.vFrac = parseFloat(ui.vFrac.value||'0'); ui.vFracVal.textContent = state.vFrac.toFixed(3); reflect(); });
  ui.vFracVal.textContent = state.vFrac.toFixed(3); onChange(clampParams(state)); });
  ui.vSize.addEventListener('input',  ()=>{ state.vSize = parseFloat(ui.vSize.value||'1'); ui.vSizeVal.textContent = state.vSize.toFixed(2); reflect(); });
  ui.vSize.addEventListener('change',  ()=>{ state.vSize = parseFloat(ui.vSize.value||'1'); ui.vSizeVal.textContent = state.vSize.toFixed(2); reflect(); });
  ui.vSizeVal.textContent = state.vSize.toFixed(2); onChange(clampParams(state)); });
  ui.hCount.addEventListener('input',  ()=>{ state.hCount = parseInt(ui.hCount.value||'0',10); reflect(); });
  ui.hCount.addEventListener('change',  ()=>{ state.hCount = parseInt(ui.hCount.value||'0',10); reflect(); });
  reflect(); });
  ui.hSize.addEventListener('input',  ()=>{ state.hSize = parseFloat(ui.hSize.value||'0.5'); ui.hSizeVal.textContent = state.hSize.toFixed(2); reflect(); });
  ui.hSize.addEventListener('change',  ()=>{ state.hSize = parseFloat(ui.hSize.value||'0.5'); ui.hSizeVal.textContent = state.hSize.toFixed(2); reflect(); });
  ui.hSizeVal.textContent = state.hSize.toFixed(2); onChange(clampParams(state)); });

  ui.siteScope.addEventListener('change', ()=>{ state.siteScope = ui.siteScope.value; reflect(); });
  ui.seed.addEventListener('input',  ()=>{ state.seed = parseInt(ui.seed.value||'0',10); reflect(); });
  ui.seed.addEventListener('change',  ()=>{ state.seed = parseInt(ui.seed.value||'0',10); reflect(); });
  reflect(); });

  ui.reset.addEventListener('click', ()=>{
    Object.assign(state, DEFAULTS);
    ui.mode.value = state.mode;
    ui.lattice.value = state.lattice;
    reflect();
  });

  // initial sync
  reflect();
  return { controls: ui, setBadge: (t)=> ui.badge.textContent = t, push: reflect, shotBtn: ui.shot };
}
