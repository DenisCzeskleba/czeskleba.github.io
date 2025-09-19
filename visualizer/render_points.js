export function createPointsLayer(THREE){
  const geom = new THREE.BufferGeometry();
  const mat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute vec3 position;
      uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
      uniform float uSize;
      void main(){
        vec4 mv = viewMatrix * modelMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, uSize * (300.0 / max(1.0, -mv.z)));
      }`,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uColor;
      void main(){
        vec2 uv = gl_PointCoord*2.0-1.0;
        float r2 = dot(uv,uv);
        if (r2>1.0) discard;
        float z = sqrt(1.0 - r2);
        vec3 N = normalize(vec3(uv, z));
        vec3 L = normalize(vec3(0.4,0.5,0.75));
        float diff = max(dot(N,L),0.0);
        float shade = 0.25 + 0.75*diff;
        gl_FragColor = vec4(uColor*shade, 1.0);
      }`,
    uniforms: {
      uSize: { value: 4.0 },
      uColor: { value: new THREE.Color('white') }
    },
    transparent: true,
    depthWrite: true,
  });
  const pts = new THREE.Points(geom, mat);
  function setData(pos, sizePx, color){
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    mat.uniforms.uSize.value = sizePx;
    mat.uniforms.uColor.value = new THREE.Color(color);
    geom.computeBoundingSphere();
  }
  return { obj: pts, setData };
}
