export function createDemoScene(THREE){
  const group = new THREE.Group();
  const ico = r => new THREE.IcosahedronGeometry(r, 0);

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
  const octa  = new THREE.InstancedMesh(siteGeom, octaMat, 256);
  tetra.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  octa.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tetra, octa);

  // Hydrogen (blue)
  const hGeom = ico(0.08);
  const hMat  = new THREE.MeshStandardMaterial({ color: 0x2266ff });
  const hMesh = new THREE.InstancedMesh(hGeom, hMat, 64);
  hMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(hMesh);

  const tmp = new THREE.Object3D();

  function setBase(positions, size){
    const n = Math.min(Math.floor(positions.length/3), baseMesh.count);
    baseMesh.count = n;
    for(let i=0;i<n;i++){
      tmp.position.set(positions[3*i], positions[3*i+1], positions[3*i+2]);
      tmp.scale.setScalar(size);
      tmp.updateMatrix();
      baseMesh.setMatrixAt(i, tmp.matrix);
    }
    baseMesh.instanceMatrix.needsUpdate = true;
  }

  function setSites(tPositions, oPositions){
    const set = (mesh, arr)=>{
      const n = Math.min(Math.floor(arr.length/3), mesh.count);
      mesh.count = n;
      for(let i=0;i<n;i++){
        tmp.position.set(arr[3*i], arr[3*i+1], arr[3*i+2]);
        tmp.scale.setScalar(1);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    set(tetra, tPositions);
    set(octa,  oPositions);
  }

  function setH(positions, size){
    const n = Math.min(Math.floor(positions.length/3), hMesh.count);
    hMesh.count = n;
    for(let i=0;i<n;i++){
      tmp.position.set(positions[3*i], positions[3*i+1], positions[3*i+2]);
      tmp.scale.setScalar(size);
      tmp.updateMatrix();
      hMesh.setMatrixAt(i, tmp.matrix);
    }
    hMesh.instanceMatrix.needsUpdate = true;
  }

  return { group, setBase, setSites, setH };
}
