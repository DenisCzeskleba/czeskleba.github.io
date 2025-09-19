import { bindControls } from './controls.js';
import { DEFAULTS } from './params.js';
import { BASIS, TETRA_SITES, OCTA_SITES, generateFePositions, unitCellCounts } from './lattice.js';
import { createPointsLayer } from './render_points.js';
import { createDemoScene } from './render_demo.js';

const { THREE, OrbitControls } = window;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f9fb);
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
camera.position.set(6,3,6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(1.5,1.5,1.5);
controls.update();

const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
light1.position.set(3,4,2);
const light2 = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(light1, light2);

const layers = {
  fe: createPointsLayer(THREE),
  c:  createPointsLayer(THREE),
  v:  createPointsLayer(THREE),
  h:  createPointsLayer(THREE),
};
const demo = createDemoScene(THREE);
const groupPoints = new THREE.Group(); groupPoints.add(layers.fe.obj, layers.c.obj, layers.v.obj, layers.h.obj);
const groupDemo = new THREE.Group(); groupDemo.add(demo.group);
scene.add(groupPoints, groupDemo);

function resize(){
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.clientWidth, h = rect.height || canvas.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

function toPixelSize(base){ return 2 + base*6; }

function seededRand(seed){
  let s = seed>>>0;
  return ()=>{ s = (1664525*s + 1013904223)>>>0; return ((s>>>8) / 0x01000000); };
}

function makeInterstitialPositions(lat, scope){
  // build tetra/octa positions in a single unit cell; duplicate on faces if requested
  const t = TETRA_SITES[lat], o = OCTA_SITES[lat];
  const allT = t.flat(); const allO = o.flat();
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
    const t2 = dup(allT), o2 = dup(allO);
    allT.push(...t2); allO.push(...o2);
  }
  return { t: new Float32Array(allT), o: new Float32Array(allO) };
}

function update(p){
  const isDemo = p.mode === 'demo';
  groupDemo.visible = isDemo;
  groupPoints.visible = !isDemo;

  if (isDemo){
    const n = unitCellCounts(p.lattice);
    const fe = generateFePositions(p.lattice, n);
    demo.setFe(fe, p.feSize);

    const sites = makeInterstitialPositions(p.lattice, p.siteScope);
    demo.setSites(sites.t, sites.o);

    // place blue H on top of some sites (up to hCount), replacing the marker visually
    const rand = seededRand(p.seed);
    const allSites = new Float32Array([...sites.t, ...sites.o]);
    const pickN = Math.min(p.hCount, Math.floor(allSites.length/3));
    const chosen = new Set();
    const h = new Float32Array(pickN*3);
    for(let i=0;i<pickN;i++){
      let idx;
      do { idx = Math.floor(rand()*(allSites.length/3)); } while (chosen.has(idx));
      chosen.add(idx);
      h[3*i]   = allSites[3*idx];
      h[3*i+1] = allSites[3*idx+1];
      h[3*i+2] = allSites[3*idx+2];
    }
    demo.setH(h, p.hSize);

    setBadge(`Fe: ${n} | C: 0 | V: 0 | H: ${p.hCount}`);
  } else {
    // Lattice mode: points
    const fe = generateFePositions(p.lattice, p.feCount);
    const total = Math.floor(fe.length/3);
    const rand = seededRand(p.seed);
    const idx = Array.from({length: total}, (_,i)=>i);
    for(let i=idx.length-1;i>0;i--){ const j = Math.floor(rand()*(i+1)); const t=idx[i]; idx[i]=idx[j]; idx[j]=t; }
    const cCount = Math.min(total, Math.floor(total * p.cFrac));
    const vCount = Math.min(total - cCount, Math.floor(total * p.vFrac));
    const fePos = new Float32Array((total - cCount - vCount)*3);
    const cPos  = new Float32Array(cCount*3);
    const vPos  = new Float32Array(vCount*3);
    let fi=0, ci=0, vi=0;
    for (let k=0;k<total;k++){
      const src = idx[k]*3;
      if (k < cCount) { cPos[ci++]=fe[src]; cPos[ci++]=fe[src+1]; cPos[ci++]=fe[src+2]; }
      else if (k < cCount+vCount) { vPos[vi++]=fe[src]; vPos[vi++]=fe[src+1]; vPos[vi++]=fe[src+2]; }
      else { fePos[fi++]=fe[src]; fePos[fi++]=fe[src+1]; fePos[fi++]=fe[src+2]; }
    }
    layers.fe.setData(fePos, toPixelSize(p.feSize), '#888888');
    layers.c.setData(cPos, toPixelSize(p.cSize * p.feSize), '#000000');
    layers.v.setData(vPos, toPixelSize(p.vSize * p.feSize), '#cc0000');

    // H from interstitial families: pick p.hCount random sites within the domain bounds
    const sites = makeInterstitialPositions(p.lattice, 'canonical'); // keep small set
    const allSites = new Float32Array([...sites.t, ...sites.o]);
    const hN = p.hCount;
    const hPos = new Float32Array(hN*3);
    for(let i=0;i<hN;i++){
      const j = Math.floor(rand()*(allSites.length/3))*3;
      // tile site within the domain bounds by adding random integer offsets within n
      const n = Math.ceil(Math.cbrt(Math.max(1, total / BASIS[p.lattice].length)));
      const ox = Math.floor(rand()*n), oy = Math.floor(rand()*n), oz = Math.floor(rand()*n);
      hPos[3*i]   = allSites[j] + ox;
      hPos[3*i+1] = allSites[j+1] + oy;
      hPos[3*i+2] = allSites[j+2] + oz;
    }
    layers.h.setData(hPos, toPixelSize(p.hSize * p.feSize), '#2266ff');
    setBadge(`Fe: ${fePos.length/3} | C: ${cCount} | V: ${vCount} | H: ${hN}`);
  }
}

const { setBadge, push, shotBtn } = bindControls(update);

function animate(){
  requestAnimationFrame(animate);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.render(scene, camera);
}
animate(); push();

shotBtn.addEventListener('click', ()=>{
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'lattice.png'; a.click();
});
