export function createDemoScene(THREE){
  const group = new THREE.Group();
  const makeIco = r=> new THREE.IcosahedronGeometry(r,0);
  const feGeom = makeIco(0.15);
  const feMat  = new THREE.MeshStandardMaterial({ color: 0x888888, metalness:0.1, roughness:0.7 });
  const feMesh = new THREE.InstancedMesh(feGeom, feMat, 64);
  feMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(feMesh);
  const siteGeom = makeIco(0.06);
  const tetraMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
  const octaMat  = new THREE.MeshStandardMaterial({ color: 0xff8800 });
  const tetra = new THREE.InstancedMesh(siteGeom, tetraMat, 256);
  const octa  = new THREE.InstancedMesh(siteGeom, octaMat, 256);
  group.add(tetra, octa);
  const hGeom = makeIco(0.08);
  const hMat  = new THREE.MeshStandardMaterial({ color: 0x2266ff });
  const hMesh = new THREE.InstancedMesh(hGeom, hMat, 64);
  group.add(hMesh);
  const tmp = new THREE.Object3D();
  function setFe(positions, size){
    const n = Math.min(Math.floor(positions.length/3), feMesh.count);
    feMesh.count = n;
    for(let i=0;i<n;i++){
      tmp.position.set(positions[3*i], positions[3*i+1], positions[3*i+2]);
      tmp.scale.setScalar(size);
      tmp.updateMatrix(); feMesh.setMatrixAt(i, tmp.matrix);
    }
    feMesh.instanceMatrix.needsUpdate = true;
  }
  function setSites(positionsT, positionsO){
    const tN = Math.min(Math.floor(positionsT.length/3), tetra.count);
    tetra.count = tN;
    for(let i=0;i<tN;i++){
      tmp.position.set(positionsT[3*i], positionsT[3*i+1], positionsT[3*i+2]);
      tmp.scale.setScalar(1); tmp.updateMatrix(); tetra.setMatrixAt(i, tmp.matrix);
    }
    tetra.instanceMatrix.needsUpdate = true;
    const oN = Math.min(Math.floor(positionsO.length/3), octa.count);
    octa.count = oN;
    for(let i=0;i<oN;i++){
      tmp.position.set(positionsO[3*i], positionsO[3*i+1], positionsO[3*i+2]);
      tmp.scale.setScalar(1); tmp.updateMatrix(); octa.setMatrixAt(i, tmp.matrix);
    }
    octa.instanceMatrix.needsUpdate = true;
  }
  function setH(positions, size){
    const n = Math.min(Math.floor(positions.length/3), hMesh.count);
    hMesh.count = n;
    for(let i=0;i<n;i++){
      tmp.position.set(positions[3*i], positions[3*i+1], positions[3*i+2]);
      tmp.scale.setScalar(size); tmp.updateMatrix(); hMesh.setMatrixAt(i, tmp.matrix);
    }
    hMesh.instanceMatrix.needsUpdate = true;
  }
  return { group, setFe, setSites, setH };
}
