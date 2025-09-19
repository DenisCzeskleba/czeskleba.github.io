import { BASIS, unitCellDemoCount, generateBasePositions, interstitialSitesOneCell } from './lattice.js';
import { makeRand } from './rng.js';
import { createPointsLayer } from './render_points.js';
import { createDemoScene } from './render_demo.js';
import { bindControls } from './controls.js';
import { DEFAULTS } from './params.js';

const { THREE, OrbitControls } = window;

// Renderer / scene / camera
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
camera.position.set(6,3,6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(1.5,1.5,1.5);
controls.update();

// Lights
scene.add(new THREE.DirectionalLight(0xffffff, 1.0).position.set(3,4,2));
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

// Groups/layers
const demo = createDemoScene(THREE);
const groupDemo = new THREE.Group(); groupDemo.add(demo.group);
const layers = {
  base: createPointsLayer(THREE),
  A:    createPointsLayer(THREE),
  B:    createPointsLayer(THREE),
  H:    createPointsLayer(THREE),
};
const groupPoints = new THREE.Group();
groupPoints.add(layers.base.obj, layers.A.obj, layers.B.obj, layers.H.obj);
scene.add(groupDemo, groupPoints);

// Sizing helpers
function toPixelSize(base){ return 2 + base*6; } // simple visual scale
function resize(){
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.clientWidth, h = rect.height || canvas.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// MAIN UPDATE
function update(p){
  const isDemo = p.mode === 'demo';
  groupDemo.visible = isDemo;
  groupPoints.visible = !isDemo;

  const rand = makeRand(p.seed);

  if (isDemo){
    // Fixed counts per lattice (8 / 9 / 14)
    const n = unitCellDemoCount(p.lattice);
    const { positions: base } = generateBasePositions(p.lattice, n);
    demo.setBase(base, p.feSize);

    const sites = interstitialSitesOneCell(p.lattice, p.siteScope);
    demo.setSites(sites.t, sites.o);

    // H: pick up to H count sites (from those currently shown) and place blue spheres there
    const allSites = new Float32Array([...sites.t, ...sites.o]);
    const hN = Math.min(p.hCount, Math.floor(allSites.length/3));
    const chosen = new Set();
    const h = new Float32Array(hN*3);
    for(let i=0;i<hN;i++){
      let idx; do { idx = Math.floor(rand()*(allSites.length/3)); } while (chosen.has(idx));
      chosen.add(idx);
      h[3*i]   = allSites[3*idx];
      h[3*i+1] = allSites[3*idx+1];
      h[3*i+2] = allSites[3*idx+2];
    }
    demo.setH(h, p.hSize);

    setBadge(`Fe: ${n} | C: 0 | V: 0 | H: ${hN}`);
    return;
  }

  // LATTICE MODE — generate lots of base atoms
  const target = Math.max(100, Math.min(1_000_000, p.feCount));
  const { positions: base, cellsPerAxis, perCell } = generateBasePositions(p.lattice, target);
  const total = Math.floor(base.length/3);

  // Random index permutation for substitutionals
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
    if (k < aCount){ aPos[ai++]=base[s]; aPos[ai++]=base[s+1]; aPos[ai++]=base[s+2]; }
    else if (k < aCount+bCount){ bPos[bbi++]=base[s]; bPos[bbi++]=base[s+1]; bPos[bbi++]=base[s+2]; }
    else { basePos[bi++]=base[s]; basePos[bi++]=base[s+1]; basePos[bi++]=base[s+2]; }
  }

  // Interstitial H: pick from canonical sites, then tile them across the n×n×n domain
  const sites = interstitialSitesOneCell(p.lattice, 'canonical');
  const allSites = new Float32Array([...sites.t, ...sites.o]);
  const n = cellsPerAxis; // tiles per axis
  const hN = p.hCount;
  const hPos = new Float32Array(hN*3);
  for(let i=0;i<hN;i++){
    const j = Math.floor(rand()*(allSites.length/3))*3;
    // random integer offset within tiling [0..n-1]
    const ox = Math.floor(rand()*n), oy = Math.floor(rand()*n), oz = Math.floor(rand()*n);
    hPos[3*i]   = allSites[j] + ox;
    hPos[3*i+1] = allSites[j+1] + oy;
    hPos[3*i+2] = allSites[j+2] + oz;
  }

  // Push to GPU layers — sizes are visual (Base scaled by feSize; A/B/H relative to Base)
  layers.base.setData(basePos, toPixelSize(p.feSize), '#888888');    // Base (grey)
  layers.A.setData(aPos,       toPixelSize(p.cSize * p.feSize), '#000000'); // A (black)
  layers.B.setData(bPos,       toPixelSize(p.vSize * p.feSize), '#cc0000'); // B (red)
  layers.H.setData(hPos,       toPixelSize(p.hSize * p.feSize), '#2266ff'); // H (blue)

  setBadge(`Fe: ${basePos.length/3} | C: ${aCount} | V: ${bCount} | H: ${hN}`);
}

// Badge + animate loop
const { setBadge, push, shotBtn } = bindControls(update);
function animate(){ requestAnimationFrame(animate); renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); renderer.render(scene, camera); }
animate();
push();

// Screenshot
shotBtn.addEventListener('click', ()=>{
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'lattice.png'; a.click();
});
