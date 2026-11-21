// Arquivo: cena.js — o "palco" 3D: renderizador, cena, câmera, sol e céu.
import * as THREE from 'three';
import { isTouch } from './utils.js';

// =====================================================================
//  RENDERIZADOR, CENA, CÂMERA, LUZES
// =====================================================================
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('game').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const HORIZON = new THREE.Color('#cfe8f7');
scene.fog = new THREE.Fog(HORIZON, 70, 430);
export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1600);

export const SUN_DIR = new THREE.Vector3(0.55, 0.72, 0.42).normalize();
export const hemi = new THREE.HemisphereLight('#d6ecff', '#5f7d3c', 0.55);
scene.add(hemi);
export const sun = new THREE.DirectionalLight('#fff0d4', 2.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 320 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);

// ---------- Céu (degradê feito em shader) ----------
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#3b8fe0') }, horizon: { value: HORIZON.clone() }, ground: { value: new THREE.Color('#a7c9a2') }, sunDir: { value: SUN_DIR } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top, horizon, ground, sunDir; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.5)) : mix(horizon, ground, pow(-h, 0.4));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        col += vec3(1.0,0.9,0.7) * pow(s, 400.0) * 4.0 + vec3(1.0,0.85,0.6) * pow(s, 10.0) * 0.25;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
}
export const sky = makeSky();
scene.add(sky);
// Ambiente refletido (deixa os materiais com luz suave estilo "anime/Palworld")
{
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(makeSky());
  scene.environment = pm.fromScene(envScene, 0.04, 0.1, 1000).texture;
  scene.environmentIntensity = 0.55;
}
