
import { createPointsLayer } from './render_points.js';

export function createDemoScene(THREE){
  const group = new THREE.Group();
  const ico = r => new THREE.IcosahedronGeometry(r, 0);

  // Wireframe helper to visualize the lattice bounds (AABB of base atoms)
  const wireGroup = new THREE.Group();
  group.add(wireGroup);

  // Point-sprite layers (same shader pipeline as lattice)
  const baseLayer  = createPointsLayer(THREE);
  const tetraLayer = createPointsLayer(THREE);
  const octaLayer  = createPointsLayer(THREE);
  const hLayer     = createPointsLayer(THREE);

  group.add(baseLayer.obj, hLayer.obj, tetraLayer.obj, octaLayer.obj);

  function setWire(bounds){ // bounds: [minX,minY,minZ,maxX,maxY,maxZ]
    wireGroup.clear();
    if(!bounds) return;
    const [x0,y0,z0,x1,y1,z1] = bounds;
    const mat = new THREE.LineBasicMaterial({ color: 0x222222, opacity: 0.35, transparent: true });
    const seg = (a,b)=> new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]),
      mat
    );
    const edges = [
      [[x0,y0,z0],[x1,y0,z0]], [[x0,y1,z0],[x1,y1,z0]],
      [[x0,y0,z1],[x1,y0,z1]], [[x0,y1,z1],[x1,y1,z1]],
      [[x0,y0,z0],[x0,y1,z0]], [[x1,y0,z0],[x1,y1,z0]],
      [[x0,y0,z1],[x0,y1,z1]], [[x1,y0,z1],[x1,y1,z1]],
      [[x0,y0,z0],[x0,y0,z1]], [[x1,y0,z0],[x1,y0,z1]],
      [[x0,y1,z0],[x0,y1,z1]], [[x1,y1,z0],[x1,y1,z1]],
    ];
    for(const [a,b] of edges) wireGroup.add(seg(a,b));
  }

  function setBase(positions, worldRadius, bounds){
    baseLayer.setData(positions, worldRadius, '#888888'); // grey
    setWire(bounds);
  }

  // --- Demo "replace marker when H is placed" state ---
  const state = {
    tetraRaw: null,
    octaRaw: null,
    siteRadius: 0,
    hPos: null,
    hRadius: 0
  };

  function key(x,y,z, eps=1e-6){
    // quantize for robust equality (sites & H come from the same catalogs, so exact match is expected)
    const q = (v)=> Math.round(v/eps);
    return q(x)+','+q(y)+','+q(z);
  }

  function filterSites(tetra, octa, h){
    if(!h || h.length===0) return { tetraOut: tetra, octaOut: octa };
    const H = new Set();
    for(let i=0;i<h.length;i+=3) H.add(key(h[i],h[i+1],h[i+2]));
    const filt = (arr)=>{
      const out = new Float32Array(arr.length); let j=0;
      for(let i=0;i<arr.length;i+=3){
        if(!H.has(key(arr[i],arr[i+1],arr[i+2]))){
          out[j++] = arr[i]; out[j++] = arr[i+1]; out[j++] = arr[i+2];
        }
      }
      return out.slice(0,j);
    };
    return { tetraOut: filt(tetra), octaOut: filt(octa) };
  }

  function applySites(){
    if(!state.tetraRaw || !state.octaRaw) return;
    const { tetraOut, octaOut } = filterSites(state.tetraRaw, state.octaRaw, state.hPos);
    tetraLayer.setData(tetraOut, state.siteRadius, '#00aa00', state.siteAlpha); // green
    octaLayer.setData(octaOut,  state.siteRadius, '#ff8800', state.siteAlpha); // orange
  }

  function setSites(tetra, octa, siteWorldRadius, siteAlpha){
    state.tetraRaw = tetra;
    state.octaRaw  = octa;
    state.siteRadius = siteWorldRadius;
    state.siteAlpha = siteAlpha ?? 0.6;
    applySites();
  }

  function setH(positions, hWorldRadius){
    state.hPos = positions;
    state.hRadius = hWorldRadius;
    hLayer.setData(positions, hWorldRadius, '#2266ff'); // blue
    // re-apply site layers with filtering (so markers at H positions are hidden)
    applySites();
  }

  function updateProjection(camera, renderer){
    baseLayer.updateProjection(camera, renderer);
    tetraLayer.updateProjection(camera, renderer);
    octaLayer.updateProjection(camera, renderer);
    hLayer.updateProjection(camera, renderer);
  }

  return { group, setBase, setSites, setH, updateProjection };
}
