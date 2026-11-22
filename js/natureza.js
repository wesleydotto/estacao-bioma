// Arquivo: natureza.js — árvores, arbustos, pedras e plantinhas com os modelos 3D da Quaternius
// ("Stylized Nature MegaKit", licença CC0). O pacote js/modelos/natureza.glb é montado pelo
// script scripts/montar-natureza.py (veja o LEIA-ME de js/modelos/).
//
// COMO FUNCIONA (para não pesar):
//  - O vegetacao.js continua sorteando ONDE fica cada árvore, arbusto, pedra e flor (gerador com semente)
//    e desenha versões simples (bolinhas). Ele guarda os lugares na lista "vegetacao".
//  - Aqui, os modelos bonitos aparecem só PERTO do jogador (raio "natureza" em qualidade.js).
//    Quando um modelo aparece, a versão simples daquele lugar some, e vice-versa.
//  - As plantinhas novas (samambaias, cogumelos, pedrinhas da trilha, capim da margem) usam um
//    gerador PRÓPRIO (mulberry32), então não mudam a posição de nada do resto do mapa.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import urlNatureza from './modelos/natureza.glb?inline';   // ?inline = vai dentro do código (funciona no arquivo único)
import { scene, camera } from './cena.js';
import { animated, circles } from './construcao.js';
import { vegetacao, grassTime } from './vegetacao.js';
import { qualidade } from './qualidade.js';
import { mulberry32 } from './utils.js';
import { LAB, WORLD_R, LAKE, lakeNorm, lakeR, distToPath, onPier, groundHeight, distToPref, onPrefWalk, distToFazenda, PONTO_MATA, PIPE_M, PIPE_DIR, P0 } from './mapa.js';

const RAIO = qualidade.natureza;          // metros: até onde aparecem os modelos novos
const RAIO_PEQ = Math.min(RAIO, 45);      // plantinhas e flores somem antes (são pequenas)

const pecas = {};     // nome do modelo -> [{ geometry, material }]
const alturas = {};   // nome do modelo -> altura em metros (sem escala)
const grupos = [];    // grupos de itens que aparecem perto do jogador

// ---------------------------------------------------------------------
//  VENTO nas folhas, flores e capim (mexe a parte de cima do modelo)
// ---------------------------------------------------------------------
function comVento(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTempo = grassTime;
    sh.vertexShader = 'uniform float uTempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);    // onde fica esta cópia no mundo
      float h = max(position.y, 0.0);                          // altura do ponto no modelo
      // balanço lento da copa inteira (cresce com a altura) + tremidinha rápida das folhas
      float balanco = sin(uTempo * 1.2 + ip.x * 0.21 + ip.z * 0.17) * 0.010 * h * h / (1.0 + h);
      float tremor = sin(uTempo * 4.0 + position.x * 3.0 + position.z * 2.0 + ip.x) * 0.02 * min(h, 1.0);
      transformed.x += balanco + tremor; transformed.z += balanco * 0.6 - tremor * 0.5;`);
  };
}

// ---------------------------------------------------------------------
//  CAMADA = um modelo com muitas cópias (uma InstancedMesh para cada peça:
//  ex.: a árvore tem a peça "casca" e a peça "folhas")
// ---------------------------------------------------------------------
function camada(nome, capacidade, sombra) {
  const malhas = pecas[nome].map(p => {
    const m = new THREE.InstancedMesh(p.geometry, p.material, Math.max(1, capacidade));
    m.count = 0; m.castShadow = sombra; m.receiveShadow = true;
    m.frustumCulled = false;   // as cópias mudam de lugar; sem isso o Three.js poderia escondê-las por engano
    scene.add(m);
    return m;
  });
  return { malhas, n: 0 };
}

// ---------------------------------------------------------------------
//  GRUPO = lista de itens { x, z, nome, m (matriz: lugar, giro e tamanho), i (índice na versão simples) }
//  raio  = distância em que o modelo aparece
//  longe = InstancedMesh(es) da versão simples (escondemos a cópia simples quando o modelo aparece)
// ---------------------------------------------------------------------
function grupo(itens, raio, { longe = [], sombra = false } = {}) {
  const conta = {};
  for (const it of itens) { conta[it.nome] = (conta[it.nome] || 0) + 1; it.perto = false; }
  const camadas = {};
  for (const nome in conta) camadas[nome] = camada(nome, conta[nome], sombra);
  // guarda as matrizes originais da versão simples, para poder devolvê-las
  const originais = longe.map(m => m.instanceMatrix.array.slice());
  grupos.push({ itens, raio, camadas, longe, originais });
}

// Esconde (zera a matriz) ou mostra de novo a cópia simples número i
function mostrarSimples(g, i, mostrar) {
  g.longe.forEach((m, k) => {
    const a = m.instanceMatrix.array, o = g.originais[k];
    for (let j = 0; j < 16; j++) a[i * 16 + j] = mostrar ? o[i * 16 + j] : 0;
  });
}

// Confere quem está perto do jogador e remonta as listas de cópias
function atualizar(px, pz) {
  for (const g of grupos) {
    let mudou = false;
    const r1 = g.raio * g.raio, r2 = (g.raio + 6) * (g.raio + 6);   // folga: não fica trocando na beirada
    for (const it of g.itens) {
      const d2 = (it.x - px) ** 2 + (it.z - pz) ** 2;
      const perto = it.perto ? d2 < r2 : d2 < r1;
      if (perto !== it.perto) {
        it.perto = perto; mudou = true;
        if (g.longe.length && it.i !== undefined) mostrarSimples(g, it.i, !perto);
      }
    }
    if (!mudou) continue;
    for (const nome in g.camadas) g.camadas[nome].n = 0;
    for (const it of g.itens) {
      if (!it.perto) continue;
      const c = g.camadas[it.nome];
      for (const m of c.malhas) m.setMatrixAt(c.n, it.m);
      c.n++;
    }
    for (const nome in g.camadas) {
      const c = g.camadas[nome];
      for (const m of c.malhas) { m.count = c.n; m.instanceMatrix.needsUpdate = true; }
    }
    for (const m of g.longe) m.instanceMatrix.needsUpdate = true;
  }
}

// Monta a matriz de um item: posição, giro em volta do eixo vertical, tamanho e inclinação
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function matriz(x, y, z, giro, escala, incl = 0) {
  _e.set(incl, giro, incl * 0.5);
  return new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e), _s.set(escala, escala, escala));
}

// Lugar livre para uma plantinha? (fora do lab, da praça, do lago, da trilha, da prefeitura,
// da fazenda e dos lugares de construir das missões)
function livre(x, z, trilha = 2.2) {
  if (Math.hypot(x, z) > WORLD_R) return false;
  const dx = Math.max(Math.abs(x) - LAB.w / 2, 0), dz = Math.max(Math.abs(z) - LAB.d / 2, 0);
  if (Math.hypot(dx, dz) < 3) return false;                          // encostado no laboratório
  if (Math.abs(x) < 24 && z > 0 && z < 30) return false;            // praça e canteiros
  if (Math.hypot(x + 26, z + 3) < 7) return false;                  // bases de energia (oeste do lab)
  if (z > 133 && z < 150 && x > -68 && x < -16) return false;       // faixa de mata e adubação verde (Missão 2)
  if (Math.hypot(x - PONTO_MATA.x, z - PONTO_MATA.z) < 6) return false;   // ponto de coleta na mata
  if (lakeNorm(x, z) < 1.1 || onPier(x, z)) return false;
  if (distToPath(x, z) < trilha) return false;
  if (distToPref(x, z) < 3 || onPrefWalk(x, z)) return false;
  if (distToFazenda(x, z) < 3) return false;
  return true;
}

// =====================================================================
//  CARREGAR E ESPALHAR (chamado no main.js depois de montar o mundo)
// =====================================================================
export async function carregarNatureza() {
  const gltf = await new GLTFLoader().loadAsync(urlNatureza);
  const materiaisVento = new Set();
  for (const no of gltf.scene.children) {
    const lista = [];
    no.traverse(o => { if (o.isMesh) lista.push({ geometry: o.geometry, material: o.material }); });
    pecas[no.name] = lista;
    const caixa = new THREE.Box3().setFromObject(no);
    alturas[no.name] = caixa.max.y;
    for (const p of lista) {
      p.material.roughness = 0.9;
      // folhas, flores e capim (têm recorte) balançam com o vento
      if (p.material.alphaTest > 0) materiaisVento.add(p.material);
    }
  }
  materiaisVento.forEach(comVento);

  // ---------------- ÁRVORES (mesmos lugares das árvores simples) ----------------
  const rnd = mulberry32(301);
  const arvores = vegetacao.arvores.map(a => {
    const k = rnd(), variante = 1 + Math.floor(rnd() * 5);
    // árvore torta (lembra o cerrado): só longe da trilha e do laboratório, porque os galhos são compridos
    const torta = k < 0.1 && distToPath(a.x, a.z) > 10 && Math.hypot(a.x, a.z) > 35;
    const nome = torta ? 'TwistedTree_3' : 'CommonTree_' + variante;
    const esc = a.altura * (torta ? 1.4 : 1.1) / alturas[nome];
    return { x: a.x, z: a.z, nome, i: a.i, m: matriz(a.x, a.y - 0.15, a.z, a.giro, esc) };
  });
  grupo(arvores, RAIO, { longe: [vegetacao.malhas.troncos, vegetacao.malhas.copas], sombra: true });

  // ---------------- ARBUSTOS ----------------
  const arbustos = vegetacao.arbustos.map(b => ({
    x: b.x, z: b.z, i: b.i,
    nome: rnd() < 0.25 ? 'Bush_Common_Flowers' : 'Bush_Common',
    m: matriz(b.x, b.y - 0.1, b.z, b.giro, b.sc * 0.85),
  }));
  grupo(arbustos, RAIO, { longe: [vegetacao.malhas.arbustos], sombra: true });

  // ---------------- PEDRAS (todas trocadas pelo modelo novo, perto ou longe) ----------------
  const pedras = vegetacao.pedras.map(p => {
    const esc = p.sc * 0.42;
    return { x: p.x, z: p.z, i: p.i, nome: 'Rock_Medium_' + (1 + Math.floor(rnd() * 3)), m: matriz(p.x, p.y - 0.2 * esc, p.z, p.giro, esc, (rnd() - 0.5) * 0.3) };
  });
  grupo(pedras, 1e9, { longe: [vegetacao.malhas.pedras], sombra: true });

  // ---------------- FLORES (perto: modelo; longe: as bolinhas coloridas de antes) ----------------
  const tiposFlor = ['Flower_3_Single', 'Flower_4_Single', 'Flower_3_Group', 'Flower_4_Group'];
  const flores = vegetacao.flores.map(f => ({
    x: f.x, z: f.z, i: f.i, nome: tiposFlor[Math.floor(rnd() * 4)],
    m: matriz(f.x, f.y - 0.03, f.z, rnd() * 6.28, 0.2 + rnd() * 0.1),
  }));
  grupo(flores, RAIO_PEQ, { longe: [vegetacao.malhas.flores] });

  // ---------------- PLANTINHAS NOVAS (gerador próprio) ----------------
  const r2 = mulberry32(4242), entre = (a, b) => a + (b - a) * r2();
  const enfeites = [];
  const por = (nome, x, z, esc, afundar = 0.03) => enfeites.push({ x, z, nome, m: matriz(x, groundHeight(x, z) - afundar, z, entre(0, 6.28), esc) });

  // sub-bosque: samambaias, folhagens e cogumelos em volta das árvores (como na mata de verdade)
  for (const a of vegetacao.arvores) {
    if (r2() < 0.55) {
      const ang = entre(0, 6.28), d = entre(1.4, 3.2), x = a.x + Math.cos(ang) * d, z = a.z + Math.sin(ang) * d, k = r2();
      if (livre(x, z)) {
        if (k < 0.45) por('Fern_1', x, z, entre(0.13, 0.2));
        else if (k < 0.8) por('Plant_1_Big', x, z, entre(0.22, 0.32));
        else por('Clover_2', x, z, entre(0.45, 0.65));
      }
    }
    if (r2() < 0.22) {   // cogumelos na base do tronco (decompositores!), às vezes em grupinho
      const ang = entre(0, 6.28), qtd = 1 + Math.floor(r2() * 3);
      for (let j = 0; j < qtd; j++) {
        const d = entre(0.5, 1.0), x = a.x + Math.cos(ang + j * 0.4) * d, z = a.z + Math.sin(ang + j * 0.4) * d;
        if (livre(x, z, 1.5)) por('Mushroom_Common', x, z, entre(0.6, 1.0), 0.01);
      }
    }
  }
  // folhagens baixas espalhadas pelo campo
  for (let k = 0; k < 700; k++) {
    const a = r2() * 6.28, r = Math.sqrt(r2()) * 135, x = -25 + Math.cos(a) * r, z = 40 + Math.sin(a) * r;
    if (!livre(x, z, 2.5)) continue;
    if (r2() < 0.6) por('Plant_7_Big', x, z, entre(1.0, 1.6)); else por('Clover_2', x, z, entre(0.4, 0.6));
  }
  // pedrinhas na beira da trilha (da praça até o píer)
  const x0 = Math.min(0, P0.x) - 6, x1 = Math.max(0, P0.x) + 6, z0 = 18, z1 = P0.y + 6;
  for (let k = 0; k < 4000; k++) {
    const x = entre(x0, x1), z = entre(z0, z1), d = distToPath(x, z);
    if (d < 1.5 || d > 3.2 || lakeNorm(x, z) < 1.15 || onPier(x, z)) continue;
    if (r2() > 0.35) continue;
    const nome = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Square_1', 'Pebble_Square_2'][Math.floor(r2() * 5)];
    por(nome, x, z, entre(0.6, 1.2), 0.02);
  }
  // capim alto na margem do lago (fora do píer, da trilha e do cano)
  for (let k = 0; k < 260; k++) {
    const a = r2() * 6.28, f = entre(1.03, 1.25), x = LAKE.x + Math.cos(a) * lakeR(a) * f, z = LAKE.z + Math.sin(a) * lakeR(a) * f;
    if (onPier(x, z) || distToPath(x, z) < 2.5 || Math.hypot(x - PIPE_M.x, z - PIPE_M.y) < 4) continue;
    por('Grass_Wispy_Tall', x, z, entre(0.6, 1.0), 0.05);
  }
  // árvores mortas perto do cano de esgoto (o esgoto e o lago doente prejudicam a vegetação da margem)
  const perp = new THREE.Vector2(-PIPE_DIR.y, PIPE_DIR.x);
  for (const lado of [-1, 1]) {
    const x = PIPE_M.x + PIPE_DIR.x * 13 + perp.x * 7 * lado, z = PIPE_M.y + PIPE_DIR.y * 13 + perp.y * 7 * lado;
    if (!livre(x, z, 4)) continue;
    enfeites.push({ x, z, nome: 'DeadTree_2', m: matriz(x, groundHeight(x, z) - 0.2, z, entre(0, 6.28), 0.75) });
    circles.push({ x, z, r: 0.4 });
    por('Mushroom_Laetiporus', x + 0.8, z + 0.4, 0.6, 0.05);   // orelha-de-pau no tronco morto
  }

  // no nível de gráficos mais leve, mostra só uma parte (sem mudar os lugares)
  const usados = enfeites.filter((e, k) => e.nome === 'DeadTree_2' || ((k * 0.6180339) % 1) < qualidade.enfeites);
  grupo(usados, RAIO_PEQ);

  // ---------------- ATUALIZAR CONFORME O JOGADOR ANDA ----------------
  let ultimoX = 1e9, ultimoZ = 1e9, espera = 0;
  animated.push((dt) => {
    espera -= dt;
    const x = camera.position.x, z = camera.position.z;
    if (espera > 0 || Math.hypot(x - ultimoX, z - ultimoZ) < 2) return;
    espera = 0.3; ultimoX = x; ultimoZ = z;
    atualizar(x, z);
  });
  atualizar(camera.position.x, camera.position.z);
}
