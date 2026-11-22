// Arquivo: graficos.js — o "acabamento" da imagem (pós-processamento).
// Em vez de desenhar a cena direto na tela, desenhamos numa imagem escondida e
// passamos ela por alguns "filtros" antes de mostrar:
//   1. RenderPass  → desenha a cena normalmente
//   2. GTAOPass    → oclusão de ambiente: escurece cantos, frestas e o contato com o chão (só na Alta)
//   3. Bloom       → brilho suave em volta do que é muito claro (Alta e Média)
//   4. OutputPass  → converte as cores para a tela (tom de cinema "ACES")
//   5. Acabamento  → cores um pouco mais vivas e bordas da tela levemente escuras (vinheta)
// No nível Baixo nada disso roda: a cena vai direto para a tela (mais leve).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { renderer, scene, camera } from './cena.js';
import { qualidade } from './qualidade.js';

const usarFiltros = qualidade.ao || qualidade.bloom;
let composer = null;

if (usarFiltros) {
  // Imagem escondida com cores "HDR" (aceita valores acima de 1) e suavização de bordas (MSAA)
  const alvo = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: qualidade.msaa });
  composer = new EffectComposer(renderer, alvo);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  if (qualidade.ao) {
    const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
    // raio em metros: até onde um objeto "escurece" o vizinho
    ao.updateGtaoMaterial({ radius: 1.6, distanceExponent: 1.4, thickness: 2.0, scale: 1.4, samples: 12 });
    ao.blendIntensity = 1.0;
    composer.addPass(ao);
  }
  if (qualidade.bloom) {
    // (tamanho, força, raio, limite): só brilha o que passa bem do branco (céu perto do sol, luzes, água)
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.5, 2.2));
  }
  composer.addPass(new OutputPass());

  // Acabamento: saturação (cores mais vivas) e vinheta (cantos um pouco mais escuros)
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, saturacao: { value: 1.06 }, vinheta: { value: 0.28 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float saturacao, vinheta; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float cinza = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        c.rgb = mix(vec3(cinza), c.rgb, saturacao);
        float d = distance(vUv, vec2(0.5));
        c.rgb *= 1.0 - vinheta * smoothstep(0.35, 0.85, d);
        gl_FragColor = c;
      }`,
  }));
}

// Desenha um quadro (chamado no fim do laço principal)
export function renderizar() {
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// Quando a janela muda de tamanho
export function redimensionar() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
}
