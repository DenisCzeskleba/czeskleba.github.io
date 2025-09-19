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

  baseLayer.obj.renderOrder = 1;
  tetraLayer.obj.renderOrder = 2;
  octaLayer.obj.renderOrder = 2;
  hLayer.obj.renderOrder = 3;

  group.add(baseLayer.obj);
  group.add(tetraLayer.obj);
  group.add(octaLayer.obj);
  group.add(hLayer.obj);

  // Ensure site markers draw on top (no depth occlusion)
  tetraLayer.obj.material.depthTest = false;
  tetraLayer.obj.material.depthWrite = false;
  octaLayer.obj.material.depthTest = false;
  octaLayer.obj.material.depthWrite = false;
  // Keep base and H with depth for spatial cues
  baseLayer.obj.material.depthTest = true;
  baseLayer.obj.material.depthWrite = true;
  hLayer.obj.material.depthTest = true;
  hLayer.obj.material.depthWrite = true;

  // Old instanced-mesh approach (kept for reference / possible reuse)
  /* 
  // Base (grey)
  const baseGeom = ico(0.15);
  const baseMat  = new THREE.MeshStandardMaterial({ color: 0x888888, metalness:0.1, roughness:0.7 });
  const baseMesh = new THREE.InstancedMesh(baseGeom, baseMat, 64);
  baseMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(baseMesh);

  // Interstitial site markers
  const siteGeom = ico(0.06);
  const tetraMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 }); // green
  const octaMat  = new THREE.MeshStandardMaterial({ color: 0xff8800 }); // orange
  const tetra = new THREE.InstancedMesh(siteGeom, tetraMat, 256);
  tetra.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const octa  = new THREE.InstancedMesh(siteGeom, octaMat, 256);
  octa.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tetra);
  group.add(octa);

  // H atoms (blue)
  const hGeom = ico(0.06);
  const hMat  = new THREE.MeshStandardMaterial({ color: 0x2266ff });
  const hMesh = new THREE.InstancedMesh(hGeom, hMat, 64);
  hMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(hMesh);
  */

  function setBase(positions, feWorldRadius){
    window.__DEMO_LATTICE = window.__DEMO_LATTICE || 'SC';
    // Points: pass world radius directly
    baseLayer.setData(positions, feWorldRadius, '#888888');

    // Build Bravais-like wireframe
    (function(){
      while(wireGroup.children.length) wireGroup.remove(wireGroup.children[0]);
      if (positions.length < 3) return;
      const box = new THREE.Box3();
      const v = new THREE.Vector3();
      for(let i=0;i<positions.length;i+=3){
        v.set(positions[i], positions[i+1], positions[i+2]);
        box.expandByPoint(v);
      }
      // Clear and draw edges of the unit cube [0,1]^3
    const mat = new THREE.LineBasicMaterial({ color: 0x666666 });
    function addLines(points){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const ls = new THREE.LineSegments(g, mat);
      wireGroup.add(ls);
    }
    const E = [
      // 12 cube edges (pairs)
      0,0,0, 1,0,0,  0,1,0, 1,1,0,  0,0,1, 1,0,1,  0,1,1, 1,1,1,
      0,0,0, 0,1,0,  1,0,0, 1,1,0,  0,0,1, 0,1,1,  1,0,1, 1,1,1,
      0,0,0, 0,0,1,  1,0,0, 1,0,1,  0,1,0, 0,1,1,  1,1,0, 1,1,1
    ];
    addLines(E);

    // Lattice-specific hints
    if (window.__DEMO_LATTICE === 'BCC'){
      // body diagonals through center
      const D = [
        0,0,0, 1,1,1,  1,0,0, 0,1,1,  0,1,0, 1,0,1,  0,0,1, 1,1,0
      ];
      addLines(D);
    } else if (window.__DEMO_LATTICE === 'FCC'){
      // Face diagonals (an X on each face)
      const F = [
        // z=0 and z=1 faces
        0,0,0, 1,1,0,  1,0,0, 0,1,0,
        0,0,1, 1,1,1,  1,0,1, 0,1,1,
        // x=0 and x=1 faces
        0,0,0, 0,1,1,  0,1,0, 0,0,1,
        1,0,0, 1,1,1,  1,1,0, 1,0,1,
        // y=0 and y=1 faces
        0,0,0, 1,0,1,  1,0,0, 0,0,1,
        0,1,0, 1,1,1,  1,1,0, 0,1,1
      ];
      addLines(F);
    }
    })();
  }

  function setSites(tetraPositions, octaPositions, siteWorldRadius){
    tetraLayer.setData(tetraPositions, siteWorldRadius, '#00aa00'); // green
    octaLayer.setData(octaPositions,  siteWorldRadius, '#ff8800');  // orange
  }

  function setH(positions, hWorldRadius){
    hLayer.setData(positions, hWorldRadius, '#2266ff'); // blue
  }

  function updateProjection(camera, renderer){
    baseLayer.updateProjection(camera, renderer);
    tetraLayer.updateProjection(camera, renderer);
    octaLayer.updateProjection(camera, renderer);
    hLayer.updateProjection(camera, renderer);
  }

  return { group, setBase, setSites, setH, updateProjection };
}
