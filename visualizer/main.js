import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Local modules
import { bindControls } from './controls.js';
import { DEFAULTS } from './params.js';
import { BASIS, unitCellCounts, generateFePositions, tetraSites, octaSites } from './lattice.js';
import { createPointsLayer } from './render_points.js';
import { createDemoScene } from './render_demo.js';

// Lattice-correct metallic radii (in units of the lattice parameter a)
// SC: atoms touch along edges:     2r = a       => r = 0.5 a
// BCC: atoms touch along body diag: 4r = √3 a   => r = √3/4 a ≈ 0.4330127 a
// FCC: atoms touch along face diag: 4r = √2 a   => r = √2/4 a ≈ 0.3535534 a
function baseAtomicRadius(lattice){
  switch(lattice){
    case 'SC':  return 0.5;
    case 'BCC': return Math.sqrt(3)/4;
    case 'FCC': return Math.sqrt(2)/4;
    default:    return Math.sqrt(3)/4; // default to BCC
  }
}
// Map a world-relative size factor to a point-size in pixels
function toPixelSize(worldFactor){ return 2 + worldFactor * 12; } // slightly larger scale for clarity

// tiny seeded RNG
function makeRand(seed){ let s=(seed>>>0)||1; return ()=>{ s=(1664525*s+1013904223)>>>0; return ((s>>>8)/0x01000000); }; }

// renderer / scene / camera
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
camera.position.set(6,3,6);
const controls = new OrbitControls(camera, renderer.domElement);

const legendEl = document.getElementById('legend');
function updateLegend(mode){
  if(!legendEl) return;
  if (mode === 'demo') {
    // Demo mode: use full crystallographic phrases
    const rows = [
      ['Base (Fe)',      '#888888'],
      ['Subst A', '#000'],
      ['Subst B',   '#c00'],
      ['Tetrahedral site',    'rgba(0,170,0,0.6)'],
      ['Octahedral site',     'rgba(255,136,0,0.6)'],
      ['Interstitial (H)',    '#26f'],
    ];
    legendEl.innerHTML = rows.map(([label,color])=>
      `<div class="legend-row"><span class="legend-dot" style="background:${color}"></span>${label}</div>`
    ).join('');
    legendEl.classList.add('legend--visible');
    legendEl.setAttribute('aria-hidden', 'false');
  } else {
    legendEl.classList.remove('legend--visible');
    legendEl.setAttribute('aria-hidden', 'true');
  }
}

renderer.setClearColor(0xffffff, 1);

// Frame the current content given a Float32Array of positions [x,y,z,...]

// Build Fe positions for a single conventional unit cell (no tiling)
// SC: 8 corners; BCC: 8 corners + 1 body center; FCC: 8 corners + 6 face centers
function demoUnitCellFe(lattice){
  const pts = [];
  const push = (x,y,z)=>{ pts.push(x,y,z); };
  // corners
  const c=[0,1];
  for (let i of c) for (let j of c) for (let k of c) push(i,j,k);
  if (lattice === 'BCC'){
    push(0.5,0.5,0.5); // body center
  } else if (lattice === 'FCC'){
    // face centers
    push(0.5,0.5,0); push(0.5,0.5,1);
    push(0.5,0,0.5); push(0.5,1,0.5);
    push(0,0.5,0.5); push(1,0.5,0.5);
  }
  return new Float32Array(pts);
}
function frameContent(positions, pad=1.8){
  if(!positions || positions.length<3) return;
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for(let i=0;i<positions.length;i+=3){
    v.set(positions[i], positions[i+1], positions[i+2]);
    box.expandByPoint(v);
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = 0.5 * Math.max(size.x, size.y, size.z) * pad;

  const aspect = renderer.getSize(new THREE.Vector2()).x / Math.max(1, renderer.getSize(new THREE.Vector2()).y);
  const vFOV = (camera.fov||60) * Math.PI/180.0;
  const hFOV = 2*Math.atan(Math.tan(vFOV/2)*aspect);
  const distV = radius / Math.sin(Math.max(0.01, vFOV/2));
  const distH = radius / Math.sin(Math.max(0.01, hFOV/2));
  const dist = Math.max(distV, distH);

  controls.target.copy(center);
  const dir = new THREE.Vector3(0,0,1);
  const pos = center.clone().add(dir.multiplyScalar(dist));
  camera.position.copy(pos);

  camera.near = Math.max(0.001, dist/100);
  camera.far  = Math.max(camera.near*10, dist*10);
  camera.updateProjectionMatrix();
  controls.update();
}
controls.target.set(1.5,1.5,1.5);
controls.update();

// lights
const dir = new THREE.DirectionalLight(0xffffff, 1.0); dir.position.set(3,4,2);
scene.add(dir, new THREE.AmbientLight(0xffffff, 0.35));

// layers
// unified point-sprite layers used by Lattice (and kept available globally)
const layers = {
  base: createPointsLayer(THREE),
  A:    createPointsLayer(THREE),
  B:    createPointsLayer(THREE),
  H:    createPointsLayer(THREE),
};
const demo = createDemoScene(THREE);
const groupDemo = new THREE.Group(); groupDemo.add(demo.group);
function updateAllProj(){
  layers.base.updateProjection(camera, renderer);
  layers.A.updateProjection(camera, renderer);
  layers.B.updateProjection(camera, renderer);
  layers.H.updateProjection(camera, renderer);
}

const groupPoints = new THREE.Group();
groupPoints.add(layers.base.obj, layers.A.obj, layers.B.obj, layers.H.obj);
scene.add(groupDemo, groupPoints);

// helpers
// removed duplicate toPixelSize // legacy (unused for lattice points now)
function resize(){
  const w = Math.max(1, window.innerWidth || canvas.clientWidth || 800);
  const h = Math.max(1, window.innerHeight || canvas.clientHeight || 600);
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + 'px';
  renderer.domElement.style.height = h + 'px';
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize, { passive: true });
resize();

// interstitial positions for one cell
function interstitialOneCell(lattice, scope){
  const baseT = tetraSites(lattice) || [];
  const baseO = octaSites(lattice) || [];
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const reflectAxis = v => {
    if (v <= 0 || v >= 1){ return [clamp01(v)]; } // already on boundary
    // interior point: keep as-is
    return [v];
  };
  const reflectFaces = (x,y,z) => {
    // Produce mirrored copies on opposite faces but keep within [0,1]
    const xs = (x>0 && x<1) ? [x] : [0,1];
    const ys = (y>0 && y<1) ? [y] : [0,1];
    const zs = (z>0 && z<1) ? [z] : [0,1];
    const out=[];
    for(const X of xs) for(const Y of ys) for(const Z of zs) out.push(X,Y,Z);
    return out;
  };
  const collect = (src) => {
    const out=[];
    for(const p of src){
      const [x,y,z] = p;
      if (scope === 'allFaces') out.push(...reflectFaces(x,y,z));
      else { // canonical: keep representative in [0,1)
        const X = (x===1)?0:x, Y=(y===1)?0:y, Z=(z===1)?0:z;
        out.push(X,Y,Z);
      }
    }
    return out;
  };

  // --- PATCH: Deduplicate output positions to avoid stacking ---
  function dedupeSites(arr, eps=1e-6) {
    const keys = new Set();
    const out = [];
    for (let i=0; i<arr.length; i+=3) {
      const x = Math.round(arr[i]   / eps);
      const y = Math.round(arr[i+1] / eps);
      const z = Math.round(arr[i+2] / eps);
      const k = `${x},${y},${z}`;
      if (!keys.has(k)) {
        keys.add(k);
        out.push(arr[i], arr[i+1], arr[i+2]);
      }
    }
    return new Float32Array(out);
  }

  const rawT = new Float32Array(collect(baseT));
  const rawO = new Float32Array(collect(baseO));
  return {
    t: dedupeSites(rawT),
    o: dedupeSites(rawO),
  };
}

// main update
let __lastDemoKey=''; let __lastLatKey='';
function update(p){
  updateLegend(p.mode);
  const r0 = baseAtomicRadius(p.lattice);
  const isDemo = p.mode === 'demo';
  groupDemo.visible = isDemo;
  groupPoints.visible = !isDemo;

  const rand = makeRand(p.seed);

  if (isDemo){
    const fe = demoUnitCellFe(p.lattice);
    const feR = r0 * p.feSize;
    const interstitialR = feR * p.interstitialSize;
    const interstitialAlpha = p.interstitialAlpha;
    
    window.__DEMO_LATTICE = p.lattice; demo.setBase(fe, feR, { lattice: p.lattice });
    const demoKey = p.lattice + ':' + unitCellCounts(p.lattice);
    if(demoKey !== __lastDemoKey){ frameContent(fe); __lastDemoKey = demoKey; }

    const sites = interstitialOneCell(p.lattice, p.siteScope);
    demo.setSites(sites.t, sites.o, interstitialR, interstitialAlpha);

    const allSites = new Float32Array([...sites.t, ...sites.o]);
    const hN = Math.min(p.hCount, Math.floor(allSites.length/3));
    const chosen = new Set();
    const h = new Float32Array(hN*3);
    for(let i=0;i<hN;i++){
      let idx;
      do { idx = Math.floor(rand()*(allSites.length/3)); }
      while (chosen.has(idx));
      chosen.add(idx);
      h[3*i]   = allSites[3*idx];
      h[3*i+1] = allSites[3*idx+1];
      h[3*i+2] = allSites[3*idx+2];
    }
    demo.setH(h, feR * p.hSize);
    demo.updateProjection(camera, renderer);

    setBadge(`Base: ${(fe.length/3)|0} | A: 0 | B: 0 | H: ${hN}`);
    return;
  }

  // lattice mode
  const target = Math.max(100, Math.min(1_000_000, p.feCount));
  const fe = generateFePositions(p.lattice, target);
  const total = Math.floor(fe.length/3);
  const latKey = p.lattice + ':' + ((fe.length/3)|0);
// substitutionals: shuffle indices with rand
  const idx = Array.from({length: total}, (_,i)=>i);
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t; }

  const aCount = Math.min(total, Math.floor(total * p.cFrac));
  const bCount = Math.min(total - aCount, Math.floor(total * p.vFrac));

  const basePos = new Float32Array((total - aCount - bCount)*3);
  const aPos    = new Float32Array(aCount*3);
  const bPos    = new Float32Array(bCount*3);

  let bi=0, ai=0, bbi=0;
  for (let k=0;k<total;k++){
    const s = idx[k]*3;
    if (k < aCount){ aPos[ai++]=fe[s]; aPos[ai++]=fe[s+1]; aPos[ai++]=fe[s+2]; }
    else if (k < aCount+bCount){ bPos[bbi++]=fe[s]; bPos[bbi++]=fe[s+1]; bPos[bbi++]=fe[s+2]; }
    else { basePos[bi++]=fe[s]; basePos[bi++]=fe[s+1]; basePos[bi++]=fe[s+2]; }
  }

  // interstitial H: pick sites from one cell, then tile across domain
  const perCell = BASIS[p.lattice].length;
  const cellsNeeded = Math.max(1, Math.ceil(total / perCell));
  const n = Math.ceil(Math.cbrt(cellsNeeded)); // tiles per axis

  const sites = interstitialOneCell(p.lattice, 'canonical');
  const allSites = new Float32Array([...sites.t, ...sites.o]);
  const hN = p.hCount;
  const hPos = new Float32Array(hN*3);
  for(let i=0;i<hN;i++){
    const j = Math.floor(rand()*(allSites.length/3))*3;
    const ox = Math.floor(rand()*n), oy = Math.floor(rand()*n), oz = Math.floor(rand()*n);
    hPos[3*i]   = allSites[j] + ox;
    hPos[3*i+1] = allSites[j+1] + oy;
    hPos[3*i+2] = allSites[j+2] + oz;
  }

  // draw
  layers.base.setData(basePos, r0 * p.feSize, '#888888');
  layers.A.setData(aPos,       r0 * p.feSize * p.cSize, '#000000');
  layers.B.setData(bPos,       r0 * p.feSize * p.vSize, '#cc0000');
  layers.H.setData(hPos,       r0 * p.feSize * p.hSize, '#2266ff');
  updateAllProj();
  if(latKey !== __lastLatKey){ frameContent(basePos); __lastLatKey = latKey; }

  setBadge(`Base: ${basePos.length/3} | A: ${aCount} | B: ${bCount} | H: ${hN}`);
}

// badge + animate loop
const wired = bindControls(update);
const { setBadge, push, shotBtn } = wired;

// start render loop
function animate(){ requestAnimationFrame(animate); renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); renderer.render(scene, camera); }
animate();

// do the first reflect *after* setBadge exists
push();

// screenshot
shotBtn.addEventListener('click', ()=>{
  controls.update(); renderer.render(scene, camera); const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'lattice.png'; a.click();
});

