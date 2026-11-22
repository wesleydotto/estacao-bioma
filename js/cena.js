// Arquivo: cena.js — o "palco" 3D: renderizador, cena, câmera, sol e céu.
import * as THREE from 'three';
import { qualidade } from './qualidade.js';

// =====================================================================
//  RENDERIZADOR, CENA, CÂMERA, LUZES
// =====================================================================
// Com pós-processamento (níveis Alta e Média), a suavização das bordas é feita no graficos.js.
export const renderer = new THREE.WebGLRenderer({ antialias: qualidade.msaa === 0, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, qualidade.pixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('game').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const HORIZON = new THREE.Color('#cfe8f7');
scene.fog = new THREE.Fog(HORIZON, 70, 430);
export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1600);

export const SUN_DIR = new THREE.Vector3(0.55, 0.72, 0.42).normalize();
// Luz do céu: azulada de cima e esverdeada de baixo (reflexo da grama)
export const hemi = new THREE.HemisphereLight('#cfe6ff', '#56733a', 0.6);
scene.add(hemi);
// Sol: luz amarelada e forte, que faz as sombras
export const sun = new THREE.DirectionalLight('#fff0d4', 2.9);
sun.castShadow = true;
const ALC = qualidade.sombraAlc;   // metros de sombra para cada lado do jogador
sun.shadow.mapSize.set(qualidade.sombraMapa, qualidade.sombraMapa);
Object.assign(sun.shadow.camera, { left: -ALC, right: ALC, top: ALC, bottom: -ALC, near: 1, far: 320 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// O sol "segue" o jogador para as sombras estarem sempre por perto.
// Ele anda em passos do tamanho de 1 pixel da sombra: assim as bordas das sombras
// não ficam "tremendo" quando o jogador se mexe.
const _luzZ = SUN_DIR.clone().negate();                                   // para onde o sol aponta
const _luzX = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), _luzZ).normalize();
const _luzY = new THREE.Vector3().crossVectors(_luzZ, _luzX);
const _centro = new THREE.Vector3();
export function seguirSol(pos) {
  const pixel = (2 * ALC) / qualidade.sombraMapa;                         // tamanho de 1 pixel da sombra, em metros
  const a = Math.round(pos.dot(_luzX) / pixel) * pixel;
  const b = Math.round(pos.dot(_luzY) / pixel) * pixel;
  _centro.copy(_luzX).multiplyScalar(a).addScaledVector(_luzY, b).addScaledVector(_luzZ, pos.dot(_luzZ));
  sun.target.position.copy(_centro);
  sun.position.copy(_centro).addScaledVector(SUN_DIR, 140);
}

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
