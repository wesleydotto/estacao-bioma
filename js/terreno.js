// Arquivo: terreno.js — o chão do mundo (relevo, cores e textura).
import * as THREE from 'three';
import { scene } from './cena.js';
import { groundHeight, distToPath, lakeNorm, distToFazenda } from './mapa.js';
import { fbm, noise, smoothstep } from './utils.js';
import { makeCanvas, toTex } from './construcao.js';
import { nivelAtual } from './qualidade.js';

// =====================================================================
//  TEXTURAS DE DETALHE (desenhadas no código, em tons de cinza)
//  Elas NÃO têm cor: só deixam o chão mais claro ou mais escuro em
//  pontinhos. A cor continua vindo das "cores por vértice" lá embaixo.
//  Usam Math.random (sem semente), então não mexem na posição das árvores.
// =====================================================================

// Desenha uma marca "dando a volta" na textura: se ela passar da borda,
// aparece do outro lado. Assim a textura se repete sem emenda visível.
function emVolta(w, h, x, y, desenhar) {
  for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) desenhar(x + ox, y + oy);
}

// Textura da GRAMA: fiapos claros e escuros e manchinhas, como um gramado visto de perto.
function texGrama() {
  const S = 512, [c, g] = makeCanvas(S, S);
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S);     // cinza médio = "não muda a cor"
  // manchas grandes e suaves (partes do gramado mais claras ou mais escuras)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 20 + Math.random() * 60, v = Math.random() < 0.5 ? 0 : 255;
    emVolta(S, S, x, y, (px, py) => {
      const gr = g.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, `rgba(${v},${v},${v},0.10)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  // fiapos de grama (risquinhos curtos e tortos)
  g.lineCap = 'round';
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * S, y = Math.random() * S, L = 3 + Math.random() * 7, a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const v = Math.random() < 0.55 ? 255 : 0;
    g.strokeStyle = `rgba(${v},${v},${v},${0.10 + Math.random() * 0.22})`; g.lineWidth = 1 + Math.random() * 1.2;
    emVolta(S, S, x, y, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); g.stroke(); });
  }
  return toTex(c);
}

// Textura da TERRA: grãos, pedrinhas e rachaduras finas.
function texTerra() {
  const S = 512, [c, g] = makeCanvas(S, S);
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S);
  // grãos de areia (pontinhos)
  for (let i = 0; i < 14000; i++) {
    const v = Math.random() < 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.25})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // rachaduras (linhas finas e escuras que mudam de direção)
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.2;
  for (let i = 0; i < 25; i++) {
    let x = Math.random() * S, y = Math.random() * S, a = Math.random() * 6.28;
    const pts = [[x, y]];
    for (let k = 0; k < 6; k++) { a += (Math.random() - 0.5) * 1.5; x += Math.cos(a) * 10; y += Math.sin(a) * 10; pts.push([x, y]); }
    emVolta(S, S, 0, 0, (ox, oy) => { g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy)); g.stroke(); });
  }
  // pedrinhas (bolinhas com o lado de cima claro e sombra embaixo)
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 1.5 + Math.random() * 3.5;
    emVolta(S, S, x, y, (px, py) => {
      g.fillStyle = 'rgba(0,0,0,0.30)'; g.beginPath(); g.ellipse(px + 1, py + 1.5, r, r * 0.8, 0, 0, 6.28); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(px, py, r, r * 0.8, 0, 0, 6.28); g.fill();
    });
  }
  return toTex(c);
}

// =====================================================================
//  TERRENO
// =====================================================================
export function buildTerrain() {
  const SIZE = 620, SEG = 250;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  // "mistura" de cada vértice: 0 = textura de grama, 1 = textura de terra
  const mist = new Float32Array(pos.count);
  // cores da grama um pouco menos amarelas e saturadas (puxadas para o verde-oliva)
  const grassA = new THREE.Color('#7fb552'), grassB = new THREE.Color('#4a8a36'), dry = new THREE.Color('#a3ac5c');
  const soil = new THREE.Color('#a4533a'), dirt = new THREE.Color('#b9915b'), mud = new THREE.Color('#6b5a36'), deep = new THREE.Color('#38461f'), rock = new THREE.Color('#8f9580');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, groundHeight(x, z));
    c.copy(grassB).lerp(grassA, fbm(x * 0.03, z * 0.03) * 0.5 + 0.5);
    c.lerp(dry, smoothstep(0.35, 0.8, noise(x * 0.012 + 5, z * 0.012)) * 0.6);
    const kRock = smoothstep(200, 245, Math.hypot(x, z)) * 0.8;
    c.lerp(rock, kRock);
    const kPath = 1 - smoothstep(1.6, 3.4, distToPath(x, z));
    c.lerp(dirt, kPath);
    const kSoil = 1 - smoothstep(0, 3, distToFazenda(x, z));
    c.lerp(soil, kSoil);   // terra vermelha da lavoura
    const ld = lakeNorm(x, z);
    const kMud = smoothstep(1.3, 1.0, ld);
    c.lerp(mud, kMud);
    c.lerp(deep, smoothstep(0.95, 0.7, ld));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    // onde for trilha, lavoura, lama ou pedra, usa a textura de terra
    mist[i] = Math.max(kPath, kSoil, kMud, kRock);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('mistura', new THREE.BufferAttribute(mist, 1));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const tGrama = texGrama(), tTerra = texTerra();
  const DUAS_ESCALAS = nivelAtual !== 'baixa';   // no nível Baixo, só uma escala (mais leve)
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tGrama = { value: tGrama }; sh.uniforms.tTerra = { value: tTerra };
    // vértice: passa a posição no mundo e a "mistura" para o fragmento
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float mistura; varying float vMist; varying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMist = mistura; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    // fragmento: lê as texturas usando x e z do mundo (em metros) como coordenada
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform sampler2D tGrama; uniform sampler2D tTerra; varying float vMist; varying vec3 vWPos;
      // lê grama e terra no mesmo lugar e mistura conforme o vértice
      float detalhe(vec2 uv){ return mix(texture2D(tGrama, uv).r, texture2D(tTerra, uv).r, vMist); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float dCam = length(vWPos - cameraPosition);
        // escala fina: 1 repetição a cada 3 m (some aos poucos depois de ~45 m, para não "chiar" longe)
        float fino = detalhe(vWPos.xz / 3.0);
        float d = mix(fino, 0.5, smoothstep(25.0, 45.0, dCam));
        ${DUAS_ESCALAS ? `
        // escala grande: 1 repetição a cada 17 m, girada, para esconder que a textura se repete
        vec2 g = mat2(0.8, -0.6, 0.6, 0.8) * vWPos.xz / 17.0;
        d = d * 0.65 + detalhe(g) * 0.35;` : ''}
        // 0.5 (cinza médio) = cor normal; mais claro ou mais escuro muda até ±45%
        diffuseColor.rgb *= 1.0 + (d - 0.5) * 1.8;
      }`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}
