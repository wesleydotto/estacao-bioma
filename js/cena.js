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
export const HORIZON = new THREE.Color('#c9e1f2');
// Névoa: longe, as coisas vão ganhando a cor do horizonte (dá sensação de distância)
scene.fog = new THREE.Fog(HORIZON, 60, 420);
export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1600);

export const SUN_DIR = new THREE.Vector3(0.6, 0.62, 0.45).normalize();   // direção de onde vem o sol (mais baixo = sombras mais compridas)
// Luz do céu: azulada de cima e esverdeada de baixo (reflexo da grama)
export const hemi = new THREE.HemisphereLight('#bcdcff', '#5a7a3a', 0.75);
scene.add(hemi);
// Sol: luz amarelada e forte, que faz as sombras
export const sun = new THREE.DirectionalLight('#ffe9c4', 3.0);
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

// ---------- Céu (degradê + sol + nuvens, tudo feito em shader) ----------
// As nuvens são "ruído" (manchas aleatórias suaves) projetado num teto bem alto.
// O ceuTempo faz elas andarem devagar (é atualizado no laço principal).
export const ceuTempo = { value: 0 };
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color('#2f7fd6') }, horizon: { value: HORIZON.clone() }, ground: { value: new THREE.Color('#a7c9a2') },
      sunDir: { value: SUN_DIR }, uTime: ceuTempo,
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top, horizon, ground, sunDir; uniform float uTime; varying vec3 vDir;
      // ruído suave (value noise) e fbm (várias camadas de ruído somadas)
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 17.0; a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        // degradê: horizonte claro, topo azul forte
        vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, ground, pow(-h, 0.4));
        float s = max(dot(d, sunDir), 0.0);
        // halo do sol (bem suave) e o disco do sol
        col += vec3(1.0,0.85,0.6) * pow(s, 8.0) * 0.22 + vec3(1.0,0.95,0.8) * pow(s, 60.0) * 0.5;
        col += vec3(1.0,0.95,0.85) * smoothstep(0.9993, 0.9997, s) * 6.0;
        // nuvens: só acima do horizonte
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.15) * 0.9 + vec2(uTime * 0.012, uTime * 0.004);
          float n = fbm(uv);
          float c = smoothstep(0.4, 0.62, n) * smoothstep(0.0, 0.12, h);       // forma (some perto do horizonte)
          float sombra = smoothstep(0.55, 0.95, fbm(uv + sunDir.xz * 0.08));     // parte de baixo mais escura
          vec3 nuvem = mix(vec3(1.0, 0.99, 0.96), vec3(0.72, 0.78, 0.88), sombra * 0.7);
          nuvem += vec3(1.0, 0.9, 0.7) * pow(s, 6.0) * 0.4;                    // borda dourada perto do sol
          col = mix(col, nuvem, c * 0.92);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
}
export const sky = makeSky();
scene.add(sky);
// Ambiente refletido (deixa os materiais com luz suave estilo "anime/Palworld")
{
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(makeSky());
  scene.environment = pm.fromScene(envScene, 0.04, 0.1, 1000).texture;
  scene.environmentIntensity = 0.6;
}
