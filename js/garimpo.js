// =====================================================================
//  LAGOA DOURADA e GARIMPO ABANDONADO (cenário da missão do garimpo)
//  Arquivo: garimpo.js — a lagoa (água limpa), o trapiche com o ponto de coleta,
//  a comunidade ribeirinha (casas, canoa, redes), o córrego que desce do
//  garimpo e o próprio garimpo: terra pelada, cava cheia de água barrenta,
//  montes de rejeito, calha de madeira, motor velho, tambores e a placa.
//  Onde fica cada coisa: LAGOA, GARIMPO, CAVA, CORREGO e TRAP... em mapa.js.
//  A moradora (Dona Rosa) é criada pela missão (missoes/garimpo/index.js).
//
//  Não usa o gerador aleatório com semente (utils.js): tem o gerador próprio,
//  então pode ser montado depois de tudo, sem mudar a posição das árvores.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, SUN_DIR, HORIZON } from './cena.js';
import { std, addBox, addCyl, addCollider, circles, makeCanvas, toTex, woodTex, boardTex, makePostBoard } from './construcao.js';
import {
  LAGOA, lagoaR, GARIMPO, CAVA, CORREGO, CORREGO_COMPR, nivelCorrego, WATER_Y, TRAPICHE_Y, TRAP0, TRAP_DIR, TRAP_FIM,
  VILA_LAGOA, groundHeight, walkHeight,
} from './mapa.js';
import { waterTime } from './lake.js';
import { FONT } from './utils.js';

// ---------- Lugares importantes (a missão usa estes pontos) ----------
export const ROSA_POS = new THREE.Vector2(VILA_LAGOA.x + 6.5, VILA_LAGOA.z + 1.5);    // onde a Dona Rosa fica (entre as casas e o trapiche)
export const PONTO_AGUA = TRAP_FIM.clone().addScaledVector(TRAP_DIR, -1.2);          // ponto de coleta: na ponta do trapiche
export const PLACA_GARIMPO = new THREE.Vector2(GARIMPO.x - GARIMPO.r - 1, GARIMPO.z + 2);   // placa na entrada do garimpo
export const garimpoFx = {};   // referências que a missão pode usar (ex.: a caixa do kit)

// Pequeno gerador de números aleatórios só deste cenário (sai sempre igual)
let semente = 4242;
const aleat = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
const entre = (a, b) => a + (b - a) * aleat();

// =====================================================================
//  ÁGUA: uma função só para a lagoa e para a cava
//  - prof(x, z): quantos metros de água tem naquele ponto (para a margem ficar suave)
//  - corRasa / corFunda: cor da água; reflexo: quanto ela espelha o céu (0 a 1)
// =====================================================================
function criarAgua({ nome, cx, cz, raio, y, corRasa, corFunda, reflexo, brilho, aspera = 0.1, espuma = 0.5 }) {
  const geo = new THREE.CircleGeometry(raio, 80); geo.rotateX(-Math.PI / 2);
  // mapa de profundidade (como no lago): 0 a 2 m de água viram 0 a 255
  const NP = 96, prof = new Uint8Array(NP * NP * 4);
  for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++) {
    const x = cx - raio + (i + 0.5) / NP * raio * 2, z = cz - raio + (j + 0.5) / NP * raio * 2;
    const d = y - groundHeight(x, z);
    prof[(j * NP + i) * 4] = Math.round(Math.min(Math.max(d / 2, 0), 1) * 255);
  }
  const tex = new THREE.DataTexture(prof, NP, NP); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  // aspera: 0.1 = lisa como espelho (lagoa limpa); perto de 1 = fosca (água barrenta, quase não reflete)
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: aspera, transparent: true, envMapIntensity: aspera > 0.5 ? 0 : 0.1 });
  // IMPORTANTE: cada água precisa de uma "chave" própria. Sem isso, o Three.js acha que a lagoa e a cava
  // usam o mesmo shader (o texto do onBeforeCompile é igual) e reaproveita o 1º que compilou:
  // a lagoa ficava com as medidas da cava e sumia.
  mat.customProgramCacheKey = () => 'agua-' + nome;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uTime: waterTime, tProf: { value: tex }, uSol: { value: SUN_DIR }, uCeuH: { value: HORIZON }, uCeuT: { value: new THREE.Color('#1c6fe6') },
      uRasa: { value: new THREE.Color(corRasa) }, uFunda: { value: new THREE.Color(corFunda) },
    });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uTime; uniform sampler2D tProf; uniform vec3 uSol, uCeuH, uCeuT, uRasa, uFunda; varying vec3 vWPos;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec2 q = vWPos.xz;
      vec2 uvP = (q - vec2(${(cx - raio).toFixed(2)}, ${(cz - raio).toFixed(2)})) / ${(raio * 2).toFixed(2)};
      float prof = texture2D(tProf, uvP).r * 2.0;                       // metros de água
      // cor: rasa perto da margem, funda no meio
      diffuseColor.rgb = mix(uRasa, uFunda, smoothstep(0.1, 1.6, prof));
      // espuma clarinha bem na beirada
      float esp = smoothstep(0.02, 0.06, prof) * (1.0 - smoothstep(0.08, 0.2 + 0.04*sin(uTime*0.8 + q.x*0.4), prof));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.95, 0.92), esp * ${espuma.toFixed(2)});
      // água rasa fica transparente (dá para ver o fundo); some de vez onde não tem água
      diffuseColor.a = mix(0.35, 0.95, smoothstep(0.0, 0.9, prof)) * smoothstep(0.0, 0.03, prof);`)
      .replace('#include <opaque_fragment>', `
      {
        // ondinhas que andam + reflexo do céu (fresnel) + brilho do sol
        vec3 Nw = normalize(vec3(0.07 * (sin(q.x*1.7 + uTime*1.3) + sin(q.y*2.3 - uTime) + 0.5*sin(q.x*4.1 - uTime*2.0)), 1.0,
                                 0.07 * (cos(q.y*1.9 + uTime*1.1) + 0.5*cos(q.x*3.7 + uTime*1.7))));
        vec3 V = normalize(cameraPosition - vWPos);
        float fres = pow(clamp(1.0 - dot(Nw, V), 0.0, 1.0), 3.0);   // (clamp: pow de número negativo quebra a cor)
        vec3 R = reflect(-V, Nw);
        vec3 ceu = mix(uCeuH, uCeuT, smoothstep(0.0, 0.6, R.y));
        outgoingLight = mix(outgoingLight, ceu, clamp(fres * ${reflexo.toFixed(2)}, 0.0, 1.0));
        outgoingLight += vec3(1.0, 0.93, 0.78) * pow(max(dot(R, uSol), 0.0), 200.0) * ${brilho.toFixed(2)};
        diffuseColor.a = max(diffuseColor.a, fres * ${reflexo.toFixed(2)} * smoothstep(0.0, 0.03, prof));
      }
      #include <opaque_fragment>`);
  };
  // (sem receiveShadow: em água transparente a sombra fazia a água sumir no gráfico Médio)
  const m = new THREE.Mesh(geo, mat); m.position.set(cx, y, cz); m.name = nome;
  scene.add(m); return m;
}

// =====================================================================
//  CÓRREGO: uma "fita" de água que acompanha a linha do córrego e desce o morro
// =====================================================================
function criarCorrego() {
  const pos = [], uv = [], idx = [];
  const PASSO = 0.8, LARG = 1.8, n = Math.ceil(CORREGO_COMPR / PASSO);
  // anda pela linha do córrego, ponto a ponto
  const ponto = (s) => {
    let resto = s;
    for (let i = 0; i < CORREGO.length - 1; i++) {
      const A = CORREGO[i], B = CORREGO[i + 1], L = A.distanceTo(B);
      if (resto <= L || i === CORREGO.length - 2) { const k = Math.min(resto / L, 1); return { p: A.clone().lerp(B, k), dir: B.clone().sub(A).normalize() }; }
      resto -= L;
    }
  };
  for (let i = 0; i <= n; i++) {
    const s = Math.min(i * PASSO, CORREGO_COMPR), { p, dir } = ponto(s), t = s / CORREGO_COMPR;
    const lado = new THREE.Vector2(-dir.y, dir.x), y = nivelCorrego(t) + 0.04;
    const larg = LARG * (0.85 + 0.25 * Math.sin(s * 0.4));           // largura muda um pouco
    for (const k of [-1, 1]) { pos.push(p.x + lado.x * larg * k, y, p.y + lado.y * larg * k); uv.push((k + 1) / 2, s); }
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  // material fosco (Lambert, sem reflexo): o reflexo do céu deixava o córrego branco como neve
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = waterTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvC;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvC = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; varying vec2 vUvC;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      // listras claras que "correm" para a lagoa (a água descendo) e as bordas mais transparentes
      float corre = sin(vUvC.y * 2.2 - uTime * 3.0 + sin(vUvC.x * 6.0) * 1.5) * 0.5 + 0.5;
      diffuseColor.rgb = mix(vec3(0.07, 0.10, 0.07), vec3(0.14, 0.19, 0.14), corre * 0.5);   // escura e um pouco barrenta (cores "lineares": bem mais escuras que no CSS)
      diffuseColor.a *= smoothstep(0.0, 0.25, vUvC.x) * (1.0 - smoothstep(0.75, 1.0, vUvC.x));   // (o 1º número do smoothstep tem que ser o menor)`);
  };
  // (sem receiveShadow: em água transparente a sombra quebrava a cor no gráfico Médio)
  const m = new THREE.Mesh(geo, mat); m.name = 'corrego'; scene.add(m);
}

// =====================================================================
//  COMUNIDADE RIBEIRINHA: casas de madeira, varal, canoa, redes de pesca
// =====================================================================
function casa(g, x, z, corParede, corTelhado, viradaX) {
  const y = walkHeight(x, z), W = 4.2, D = 3.6, H = 2.5, base = y + 0.6;
  const madeira = std('#ffffff', 0.9, 0, { map: woodTex }), parede = std(corParede, 0.85);
  // estacas (a casa fica um pouco acima do chão por causa das cheias da lagoa)
  for (const dx of [-W / 2 + 0.2, W / 2 - 0.2]) for (const dz of [-D / 2 + 0.2, D / 2 - 0.2]) addCyl(g, 0.1, 0.12, 1.2, madeira, x + dx, y, z + dz, 6);
  addBox(g, W + 0.4, 0.15, D + 0.4, madeira, x, base, z);                                          // assoalho
  addBox(g, W, H, D, parede, x, base + H / 2, z, { block: true });                                 // paredes
  // telhado de duas águas (duas placas inclinadas)
  const telhado = std(corTelhado, 0.8);
  for (const k of [-1, 1]) {
    const t = addBox(g, W + 0.8, 0.12, D / 2 + 0.6, telhado, x, base + H + 0.55, z + k * (D / 4 + 0.1));
    t.rotation.x = k * 0.5;
  }
  addBox(g, W, 0.9, 0.1, parede, x, base + H + 0.3, z, { cast: false });                          // "triângulo" do telhado (simplificado)
  // porta e janela viradas para a lagoa (+X)
  const lado = viradaX ? 1 : -1;
  addBox(g, 0.06, 1.8, 0.9, std('#5a3a22', 0.8), x + lado * W / 2, base + 0.95, z + 0.6);
  addBox(g, 0.06, 0.8, 0.9, std('#3d5a6b', 0.3), x + lado * W / 2, base + 1.5, z - 0.9);
  // degrau de madeira até a porta
  addBox(g, 0.6, 0.12, 0.9, madeira, x + lado * (W / 2 + 0.35), y + 0.3, z + 0.6);
  addCollider(x - W / 2 - 0.2, x + W / 2 + 0.2, z - D / 2 - 0.2, z + D / 2 + 0.2);
}

function comunidade(g) {
  const { x, z } = VILA_LAGOA;
  casa(g, x - 3, z - 6, '#e9d8a6', '#b5533c', true);
  casa(g, x - 4, z + 6.5, '#a5d8dd', '#8a5a33', true);
  const madeira = std('#7a5230', 0.9);
  // varal de roupas entre dois postes
  const vx = x + 1.5, vz = z - 11;
  for (const dz of [-2.5, 2.5]) addCyl(g, 0.05, 0.06, 2, madeira, vx, walkHeight(vx, vz + dz) + 1, vz + dz, 6);
  addCyl(g, 0.01, 0.01, 5, std('#dddddd', 0.6), vx, walkHeight(vx, vz) + 1.85, vz, 4).rotation.x = Math.PI / 2;
  ['#e03131', '#1c7ed6', '#fab005', '#f8f9fa'].forEach((cor, i) => {
    const roupa = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), std(cor, 0.9, 0, { side: THREE.DoubleSide }));
    roupa.position.set(vx, walkHeight(vx, vz) + 1.45, vz - 1.6 + i * 1.05); roupa.rotation.y = Math.PI / 2; g.add(roupa);
  });
  // rede de pesca pendurada para secar (textura de malha)
  const [c, gg] = makeCanvas(128, 128);
  gg.strokeStyle = 'rgba(240,235,220,.9)'; gg.lineWidth = 2;
  for (let i = 0; i <= 128; i += 12) { gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i, 128); gg.stroke(); gg.beginPath(); gg.moveTo(0, i); gg.lineTo(128, i); gg.stroke(); }
  const malha = toTex(c, 3, 2);
  const rx = x + 2.5, rz = z + 11;
  for (const dx of [-2, 2]) addCyl(g, 0.05, 0.06, 2.2, madeira, rx + dx, walkHeight(rx + dx, rz) + 1.1, rz, 6);
  const rede = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshStandardMaterial({ map: malha, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
  rede.position.set(rx, walkHeight(rx, rz) + 1.3, rz); g.add(rede);
  // canoa de madeira virada na margem (meio cilindro achatado)
  const canoaGeo = new THREE.CylinderGeometry(0.5, 0.5, 4.2, 12, 1, false, 0, Math.PI);
  canoaGeo.rotateZ(Math.PI / 2); canoaGeo.scale(1, 0.7, 1);
  const canoa = new THREE.Mesh(canoaGeo, std('#8a5a33', 0.8, 0, { side: THREE.DoubleSide }));
  const cp = TRAP0.clone().addScaledVector(TRAP_DIR, -0.5).add(new THREE.Vector2(0, 4));
  canoa.position.set(cp.x, walkHeight(cp.x, cp.y) + 0.05, cp.y); canoa.rotation.y = 0.4; canoa.rotation.x = Math.PI;
  canoa.castShadow = true; g.add(canoa); circles.push({ x: cp.x, z: cp.y, r: 0.7 });
  // remo encostado
  const remo = addBox(g, 0.08, 0.04, 1.8, madeira, cp.x + 1.2, walkHeight(cp.x, cp.y) + 0.1, cp.y + 0.8); remo.rotation.y = 0.9;
  // fogueira apagada (pedras em roda e lenha)
  const fx = x + 3, fz = z - 1;
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), std('#8d8f86', 0.9)); p.position.set(fx + Math.cos(a) * 0.55, walkHeight(fx, fz) + 0.08, fz + Math.sin(a) * 0.55); g.add(p); }
  for (let i = 0; i < 3; i++) { const l = addCyl(g, 0.05, 0.05, 0.8, std('#4a3426', 0.9), fx, walkHeight(fx, fz) + 0.1, fz, 6); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.05; }
}

// Trapiche de madeira entrando na lagoa, com o kit de coleta na ponta
function trapiche(g) {
  const madeira = std('#ffffff', 0.85, 0, { map: woodTex }), poste = std('#5c3d22', 0.9);
  const giro = Math.atan2(TRAP_DIR.x, TRAP_DIR.y);
  const grupo = new THREE.Group(); grupo.position.set(TRAP0.x, 0, TRAP0.y); grupo.rotation.y = giro; g.add(grupo);
  for (let s = -2; s <= 9; s += 0.55) addBox(grupo, 2.1, 0.08, 0.48, madeira, 0, TRAPICHE_Y - 0.04, s, { cast: false });   // tábuas
  for (let s = -1.5; s <= 9; s += 2.2) for (const k of [-0.95, 0.95]) addCyl(grupo, 0.09, 0.11, 3, poste, k, TRAPICHE_Y - 1.5, s, 7);   // estacas
  // caixa do kit de campo (sonda, disco de Secchi e frasco) na ponta
  const kit = new THREE.Group(); kit.position.set(0.55, TRAPICHE_Y, 8.2); grupo.add(kit);
  addBox(kit, 0.7, 0.4, 0.45, std('#2b8a3e', 0.6), 0, 0.2, 0);
  addBox(kit, 0.72, 0.06, 0.47, std('#f1f3f5', 0.5), 0, 0.42, 0);
  // argola luminosa (como a do lago): mostra onde apertar E
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: '#3bc9db', emissive: '#3bc9db', emissiveIntensity: 1.6 }));
  anel.rotation.x = Math.PI / 2; anel.position.set(-0.3, TRAPICHE_Y + 0.05, 7.6); grupo.add(anel);
  garimpoFx.anel = anel;
  // placa da lagoa no começo do trapiche
  const placa = boardTex('LAGOA DOURADA', ['Comunidade da Lagoa', 'Pesca artesanal'], { accent: '#1098ad', w: 800, h: 420, size: 54 });
  const pp = TRAP0.clone().addScaledVector(TRAP_DIR, -3.5).addScaledVector(new THREE.Vector2(-TRAP_DIR.y, TRAP_DIR.x), -2.4);   // do lado oposto ao da Dona Rosa
  makePostBoard(placa, 1.6, 0.84, pp.x, pp.y, giro + Math.PI);
}

// =====================================================================
//  GARIMPO ABANDONADO
// =====================================================================
function garimpo(g) {
  const y = GARIMPO.y;
  const ferrugem = std('#8a4b2a', 0.7, 0.35), madeiraVelha = std('#6e5a45', 0.95), preto = std('#2b2b2b', 0.6);
  // ---- Montes de rejeito (areia e cascalho que sobraram da lavagem) ----
  const rejeitoMat = std('#a38a68', 1);
  for (const [dx, dz, r, h] of [[-8, -7, 3.2, 1.6], [-3, -10, 2.4, 1.2], [6, -8, 3.6, 2.0], [-10, 3, 2.8, 1.4], [9, 6, 2.2, 1.1]]) {
    const geo = new THREE.ConeGeometry(r, h, 14, 3);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { if (p.getY(i) < h / 2 - 0.01) { const k = 1 + (entre(-0.15, 0.15)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, rejeitoMat); m.position.set(GARIMPO.x + dx, walkHeight(GARIMPO.x + dx, GARIMPO.z + dz) + h / 2 - 0.15, GARIMPO.z + dz);
    m.castShadow = m.receiveShadow = true; g.add(m);
    circles.push({ x: GARIMPO.x + dx, z: GARIMPO.z + dz, r: r * 0.7 });
  }
  // ---- Calha de madeira inclinada (onde lavavam o cascalho para separar o ouro) ----
  {
    const cx = GARIMPO.x - 3, cz = GARIMPO.z + 4, calha = new THREE.Group();
    calha.position.set(cx, y, cz); calha.rotation.y = 0.6; g.add(calha);
    const tabuleiro = new THREE.Group(); tabuleiro.rotation.z = 0.18; tabuleiro.position.y = 0.9; calha.add(tabuleiro);
    addBox(tabuleiro, 5, 0.08, 0.9, madeiraVelha, 0, 0, 0);
    for (const k of [-0.45, 0.45]) addBox(tabuleiro, 5, 0.35, 0.06, madeiraVelha, 0, 0.17, k);
    // "tapete" verde-escuro no fundo da calha (prendia os grãos pesados)
    addBox(tabuleiro, 4.6, 0.02, 0.8, std('#3d4a32', 1), 0, 0.05, 0);
    for (const dx of [-2.2, 2.2]) for (const dz of [-0.4, 0.4]) addCyl(calha, 0.06, 0.07, dx < 0 ? 1.4 : 0.5, madeiraVelha, dx, dx < 0 ? 0.6 : 0.2, dz, 6);
    circles.push({ x: cx, z: cz, r: 1.4 }, { x: cx + 2 * Math.cos(0.6), z: cz - 2 * Math.sin(0.6), r: 1 }, { x: cx - 2 * Math.cos(0.6), z: cz + 2 * Math.sin(0.6), r: 1 });
  }
  // ---- Motor/bomba d'água velho e enferrujado, com a mangueira largada ----
  {
    const mx = GARIMPO.x + 1, mz = GARIMPO.z + 9;
    addBox(g, 1.4, 0.8, 0.9, ferrugem, mx, y + 0.4, mz);
    const volante = addCyl(g, 0.45, 0.45, 0.12, preto, mx + 0.78, y + 0.55, mz, 16); volante.rotation.z = Math.PI / 2;
    addCyl(g, 0.07, 0.07, 0.9, std('#555', 0.5, 0.6), mx - 0.4, y + 1.1, mz - 0.2, 8);   // escapamento
    // mangueira: uma fileira de pedaços pretos até a cava
    for (let i = 0; i < 10; i++) {
      const t = i / 9, px = mx + (CAVA.x - 3 - mx) * t, pz = mz + (CAVA.z + 2 - mz) * t + Math.sin(t * 6) * 0.6;
      const pedaco = addCyl(g, 0.08, 0.08, 0.9, preto, px, walkHeight(px, pz) + 0.08, pz, 6); pedaco.rotation.z = Math.PI / 2; pedaco.rotation.y = Math.atan2(CAVA.z + 2 - mz, CAVA.x - 3 - mx) + Math.cos(t * 6) * 0.4;
    }
    addCollider(mx - 0.8, mx + 1.1, mz - 0.55, mz + 0.55);
  }
  // ---- Tambores enferrujados (alguns em pé, outros caídos) com o rótulo quase apagado ----
  const [c, gg] = makeCanvas(256, 128);
  gg.fillStyle = '#7a3e22'; gg.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 300; i++) { gg.fillStyle = `rgba(${120 + aleat() * 60},${60 + aleat() * 30},20,.5)`; gg.fillRect(aleat() * 256, aleat() * 128, 3, 3); }
  gg.fillStyle = 'rgba(230,220,200,.55)'; gg.fillRect(60, 40, 136, 48);
  gg.fillStyle = 'rgba(40,30,20,.5)'; gg.font = `700 28px ${FONT}`; gg.textAlign = 'center'; gg.fillText('…ÚRIO', 128, 74);
  const tamborMat = std('#ffffff', 0.7, 0.3, { map: toTex(c) });
  for (const [dx, dz, deitado, giro] of [[4, 2, false, 0], [5, 3.1, false, 1], [4.6, 0.6, true, 0.4], [-6, 8, true, 2.1], [-5, 9.5, false, 0.3]]) {
    const px = GARIMPO.x + dx, pz = GARIMPO.z + dz;
    const t = addCyl(g, 0.38, 0.38, 1.0, tamborMat, px, walkHeight(px, pz) + (deitado ? 0.38 : 0.5), pz, 14);
    t.rotation.y = giro; if (deitado) t.rotation.z = Math.PI / 2;
    circles.push({ x: px, z: pz, r: deitado ? 0.6 : 0.42 });
  }
  // ---- Barraco de lona azul rasgada (onde os garimpeiros dormiam) ----
  {
    const bx = GARIMPO.x + 8, bz = GARIMPO.z - 2;
    for (const dx of [-1.6, 1.6]) for (const dz of [-1.3, 1.3]) addCyl(g, 0.06, 0.07, 2.2, madeiraVelha, bx + dx, walkHeight(bx + dx, bz + dz) + 1.1, bz + dz, 6);
    const lona = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.2, 6, 6), std('#3d8be0', 0.7, 0, { side: THREE.DoubleSide }));
    const p = lona.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 1.3) * 0.12 + (p.getY(i) < -1.2 ? -0.3 : 0));   // lona caída num canto
    lona.geometry.computeVertexNormals();
    lona.rotation.x = -Math.PI / 2 + 0.12; lona.position.set(bx, y + 2.15, bz); lona.castShadow = true; g.add(lona);
    addCollider(bx - 1.7, bx + 1.7, bz - 1.4, bz + 1.4);
    // bateia (prato de garimpo) largada no chão
    const bateia = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.12, 20, 1, true), std('#5a4a3a', 0.6, 0.3, { side: THREE.DoubleSide }));
    bateia.rotation.x = Math.PI; bateia.position.set(bx - 2.6, walkHeight(bx - 2.6, bz + 2) + 0.07, bz + 2); g.add(bateia);
  }
  // ---- Tocos de árvores cortadas em volta (o desmatamento do garimpo) ----
  for (let i = 0; i < 9; i++) {
    const a = entre(0, 6.28), r = GARIMPO.r + entre(1, 6), px = GARIMPO.x + Math.cos(a) * r, pz = GARIMPO.z + Math.sin(a) * r;
    addCyl(g, 0.25, 0.32, 0.45, std('#6b4a2f', 0.95), px, walkHeight(px, pz) + 0.15, pz, 8);
    circles.push({ x: px, z: pz, r: 0.35 });
  }
  // ---- Placa de aviso na entrada ----
  const aviso = boardTex('⚠ GARIMPO ABANDONADO', ['Área degradada', 'Não entre na cava: funda', 'e com lama'], { accent: '#c92a2a', w: 900, h: 520, size: 52 });
  makePostBoard(aviso, 1.7, 0.98, PLACA_GARIMPO.x, PLACA_GARIMPO.y, -Math.PI / 2);
}

// =====================================================================
//  MONTA TUDO (chamado pelo main.js, depois da fazenda)
// =====================================================================
export function buildGarimpo() {
  const g = new THREE.Group(); scene.add(g);
  // água da lagoa: azul-esverdeada e limpinha (o problema não aparece a olho nu!)
  criarAgua({ nome: 'agua-lagoa', cx: LAGOA.x, cz: LAGOA.z, raio: (LAGOA.r + 5) * 1.25, y: WATER_Y, corRasa: '#3f9a8c', corFunda: '#0d4f5c', reflexo: 0.85, brilho: 2.5 });
  // água da cava: barrenta, alaranjada e parada
  criarAgua({ nome: 'agua-cava', cx: CAVA.x, cz: CAVA.z, raio: CAVA.r * 1.35, y: CAVA.agua, corRasa: '#7a5530', corFunda: '#4a3018', reflexo: 0.12, brilho: 0.2, aspera: 0.85, espuma: 0 });
  criarCorrego();
  trapiche(g);
  comunidade(g);
  garimpo(g);
  // aguapés e capim na margem da lagoa (plantinhas simples, longe do trapiche)
  const capim = std('#5f9e2e', 0.9), folhas = [];
  for (let i = 0; i < 60; i++) {
    const a = entre(0, 6.28); if (Math.abs(((a - Math.PI + 9.42) % 6.28) - 3.14) < 0.35) continue;   // deixa livre a frente do trapiche
    const r = lagoaR(a) * entre(0.97, 1.1), px = LAGOA.x + Math.cos(a) * r, pz = LAGOA.z + Math.sin(a) * r;
    // touceira: 4 folhas finas e pontudas, cada uma inclinada para um lado
    const base = Math.max(groundHeight(px, pz), WATER_Y);
    for (let k = 0; k < 4; k++) {
      const h = entre(0.5, 1.1), folha = new THREE.ConeGeometry(0.035, h, 4);
      folha.translate(0, h / 2, 0);
      folha.rotateX(entre(-0.35, 0.35)); folha.rotateZ(entre(-0.35, 0.35));
      folha.translate(px + entre(-0.15, 0.15), base - 0.05, pz + entre(-0.15, 0.15));
      folhas.push(folha);
    }
  }
  // todas as folhas viram UMA malha só (bem mais leve para desenhar)
  const touceiras = new THREE.Mesh(mergeGeometries(folhas), capim); touceiras.receiveShadow = true; g.add(touceiras);
  for (let i = 0; i < 14; i++) {   // aguapés boiando (folhas redondas)
    const a = entre(0, 6.28), r = lagoaR(a) * entre(0.72, 0.9), px = LAGOA.x + Math.cos(a) * r, pz = LAGOA.z + Math.sin(a) * r;
    const f = new THREE.Mesh(new THREE.CircleGeometry(entre(0.25, 0.45), 10), std('#4f8f2e', 0.7, 0, { side: THREE.DoubleSide }));
    f.rotation.x = -Math.PI / 2; f.position.set(px, WATER_Y + 0.02, pz); g.add(f);
  }
}
