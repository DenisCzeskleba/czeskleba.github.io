
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

  function computeBounds(positions){
    if(!positions || positions.length < 3) return null;
    let minX = positions[0], maxX = positions[0];
    let minY = positions[1], maxY = positions[1];
    let minZ = positions[2], maxZ = positions[2];
    for(let i=3;i<positions.length;i+=3){
      const x = positions[i];
      const y = positions[i+1];
      const z = positions[i+2];
      if(x < minX) minX = x;
      else if(x > maxX) maxX = x;
      if(y < minY) minY = y;
      else if(y > maxY) maxY = y;
      if(z < minZ) minZ = z;
      else if(z > maxZ) maxZ = z;
    }
    return [minX, minY, minZ, maxX, maxY, maxZ];
  }
  function setWire(lattice, bounds){
    wireGroup.clear();
    if(!bounds) return;
    const [x0,y0,z0,x1,y1,z1] = bounds;
    const mat = new THREE.LineBasicMaterial({ color: 0x222222, opacity: 0.35, transparent: true });
    const seg = (a,b)=> new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]),
      mat
    );
    const corners = [
      [x0,y0,z0],[x1,y0,z0],[x0,y1,z0],[x1,y1,z0],
      [x0,y0,z1],[x1,y0,z1],[x0,y1,z1],[x1,y1,z1],
    ];
    const addEdgeSegments = (pairs)=>{
      for(const [i,j] of pairs){
        wireGroup.add(seg(corners[i], corners[j]));
      }
    };

    addEdgeSegments([
      [0,1],[0,2],[1,3],[2,3],
      [4,5],[4,6],[5,7],[6,7],
      [0,4],[1,5],[2,6],[3,7],
    ]);

    const latticeKey = (lattice || '').toUpperCase();
    if(latticeKey === 'BCC'){
      const center = [(x0+x1)/2, (y0+y1)/2, (z0+z1)/2];
      for(const corner of corners){
        wireGroup.add(seg(center, corner));
      }
    } else if(latticeKey === 'FCC'){
      const cx = (x0+x1)/2, cy = (y0+y1)/2, cz = (z0+z1)/2;
      const faces = [
        { center: [cx, cy, z0], corners: [0,1,3,2] },
        { center: [cx, cy, z1], corners: [4,5,7,6] },
        { center: [cx, y0, cz], corners: [0,1,5,4] },
        { center: [cx, y1, cz], corners: [2,3,7,6] },
        { center: [x0, cy, cz], corners: [0,2,6,4] },
        { center: [x1, cy, cz], corners: [1,3,7,5] },
      ];
      for(const face of faces){
        for(const idx of face.corners){
          wireGroup.add(seg(face.center, corners[idx]));
        }
      }
    }
  }

  function setBase(positions, worldRadius, latticeOrOptions){
    baseLayer.setData(positions, worldRadius, '#888888'); // grey
    let lattice = latticeOrOptions;
    let bounds;
    if(Array.isArray(latticeOrOptions) || ArrayBuffer.isView(latticeOrOptions)){
      bounds = latticeOrOptions;
      lattice = undefined;
    } else if(latticeOrOptions && typeof latticeOrOptions === 'object'){
      lattice = latticeOrOptions.lattice;
      bounds = latticeOrOptions.bounds;
    }
    if(!bounds) bounds = computeBounds(positions);
    setWire(lattice, bounds);
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

