export function createPointsLayer(THREE){
  const geom = new THREE.BufferGeometry();
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: `
      uniform float uWorldRadius; // radius in world units
      uniform float uProjScale;   // viewportHeight / (2 * tan(fov/2))
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // convert world-space radius to pixels: 2 * projScale * r / -mv.z
        float px = (2.0 * uProjScale * uWorldRadius) / (-mv.z);
        gl_PointSize = max(1.0, px);
      }`,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uColor;
      uniform float uAlpha;
      void main(){
        vec2 uv = gl_PointCoord*2.0-1.0;
        float r2 = dot(uv,uv);
        if(r2>1.0) discard;
        // cheap lambert-ish shading for a spherical look
        float ndotl = clamp(0.6 + 0.4*uv.y, 0.0, 1.0);
        gl_FragColor = vec4(uColor * (0.4 + 0.6*ndotl), uAlpha);
      }`,
    uniforms: {
      uWorldRadius: { value: 0.1 },
      uProjScale:   { value: 300.0 },
      uColor:       { value: new THREE.Color('white') },
      uAlpha:       { value: 1.0 }
    },
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(geom, mat);
  function setData(pos, worldRadius, color, alpha = 1.0){
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    mat.uniforms.uWorldRadius.value = worldRadius;
    mat.uniforms.uColor.value = new THREE.Color(color);
    mat.uniforms.uAlpha.value = alpha;
    geom.computeBoundingSphere();
  }
  function updateProjection(camera, renderer){
    const size = renderer.getSize(new THREE.Vector2());
    const h = size.y * renderer.getPixelRatio();
    const fovRad = (camera.fov || 60) * Math.PI/180.0;
    const projScale = h / (2.0 * Math.tan(fovRad/2.0));
    mat.uniforms.uProjScale.value = projScale;
  }
  return { obj: pts, setData, updateProjection };
}
