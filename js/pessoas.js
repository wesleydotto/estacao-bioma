// Arquivo: pessoas.js — os NPCs em 3D (mesmo tipo de corpo com ossos do Biólogo).
//
// Como funciona:
//  - Corpos da Quaternius (licença CC0): o masculino é o mesmo do Biólogo (biologo.glb) e o
//    feminino vem do mulher.glb. Os dois têm o MESMO esqueleto, então usam as mesmas animações.
//  - A ROUPA é pintada na textura da pele quando o jogo abre, com as cores do addNPC({ cores }).
//    Para saber o que é tronco, braço, mão, perna ou pé em cada pixel, usamos o "mapa de regiões"
//    (regioes_homem.png / regioes_mulher.png), feito pelo scripts/montar-pessoas.py.
//  - Cabelo e barba (cabelos.glb) e o chapéu são "grudados" no osso da cabeça.
//
// Opções de cores aceitas (todas opcionais):
//   corpo: 'homem' | 'mulher'          pele: '#c68e5f'
//   camisa: '#1971c2'                  mangaLonga: true (manga até o pulso)
//   calca: '#343a40'                   cinto: '#2b2118'      sapato: '#3b2a1f'
//   cabelo: '#4a2c1a'                  cabeloTipo: 'curto' | 'raspado' | 'comprido' | null (careca)
//   barba: '#888888' (ou null)         chapeu: '#e0c27a' (chapéu de palha, ou null)   faixa: '#7a4b1f' (fita do chapéu)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as clonarComOssos } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { std } from './construcao.js';
import animacoesJSON from './modelos/animacoes.json';
import urlHomem from './modelos/biologo.glb?inline';
import urlMulher from './modelos/mulher.glb?inline';
import urlCabelos from './modelos/cabelos.glb?inline';
import urlPeleHomem from './modelos/pele_homem.jpg?inline';
import urlRegHomem from './modelos/regioes_homem.png?inline';
import urlRegMulher from './modelos/regioes_mulher.png?inline';

// Códigos das regiões (os mesmos do scripts/montar-pessoas.py; no PNG estão multiplicados por 20)
const PELE = 0, TRONCO = 1, MANGA_CURTA = 2, MANGA_LONGA = 3, MAO = 4, CINTO = 5, CALCA = 6, SAPATO = 7, FORA = 255;
const N = 1024;   // tamanho da textura do corpo

const base = {};      // 'homem' e 'mulher': modelo, pixels da pele, regiões, animação parada...
let cabelos = null;   // cena com os cabelos (Hair_Long, Hair_SimpleParted, Hair_Buzzed, Hair_Beard)
const pronto = { valor: false };
export const pessoasProntas = () => pronto.valor;

// Para qual corpo cada cabelo foi feito (o corpo feminino é ~5 cm mais baixo na cabeça)
const CABELO = { comprido: ['Hair_Long', 'mulher'], curto: ['Hair_SimpleParted', 'homem'], raspado: ['Hair_Buzzed', 'homem'] };

// Lê os pixels de uma imagem (url ou ImageBitmap) num tamanho N × N
async function pixels(fonte) {
  let img = fonte;
  if (typeof fonte === 'string') { img = new Image(); img.src = fonte; await img.decode(); }
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, N, N);
  return g.getImageData(0, 0, N, N);
}

// Prepara um corpo: pixels da pele, regiões, cor média da pele e a animação "parado"
async function prepararCorpo(gltf, urlPele, urlReg) {
  const cena = gltf.scene;
  let corpo = null;
  // o corpo é a malha cujo material se chama "Corpo" (no homem a malha tem outro nome)
  cena.traverse(o => { if (o.isMesh && o.material.name === 'Corpo') corpo = o; });
  const pele = await pixels(urlPele || corpo.material.map.image);
  const relevo = corpo.material.normalMap ? await pixels(corpo.material.normalMap.image) : null;   // "mapa de relevo" (músculos)
  const regRGBA = (await pixels(urlReg)).data, reg = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) { const v = regRGBA[i * 4]; reg[i] = v > 200 ? FORA : Math.round(v / 20); }
  // cor média da pele e brilho médio do corpo (para tingir e sombrear a roupa)
  const d = pele.data; let sr = 0, sg = 0, sb = 0, n = 0, lum = 0, nl = 0;
  for (let i = 0; i < N * N; i++) {
    if (reg[i] === FORA) continue;
    const l = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3; lum += l; nl++;
    if (reg[i] === PELE) { sr += d[i * 4]; sg += d[i * 4 + 1]; sb += d[i * 4 + 2]; n++; }
  }
  const head = cena.getObjectByName('Head'); cena.updateMatrixWorld(true);
  return { gltf, cena, pele, relevo, reg, mediaPele: [sr / n, sg / n, sb / n], lumMedia: lum / nl, alturaCabeca: head.getWorldPosition(new THREE.Vector3()).y };
}

// Animação "parado": no corpo feminino, corrige a pequena diferença da pose de descanso dos ossos
// (novo giro = giro da animação × descanso do homem⁻¹ × descanso da mulher)
function clipeParado(corpo, homem) {
  const clip = THREE.AnimationClip.parse(animacoesJSON.find(c => c.name === 'idle'));
  if (corpo === homem) return clip;
  const q = new THREE.Quaternion(), dq = new THREE.Quaternion();
  for (const t of clip.tracks) {
    const [osso, prop] = t.name.split('.');
    const oh = homem.cena.getObjectByName(osso), om = corpo.cena.getObjectByName(osso);
    if (!oh || !om) continue;
    if (prop === 'quaternion') {
      dq.copy(oh.quaternion).invert().multiply(om.quaternion);
      for (let i = 0; i < t.values.length; i += 4) { q.fromArray(t.values, i).multiply(dq).toArray(t.values, i); }
    } else if (prop === 'position') {
      for (let i = 0; i < t.values.length; i += 3) for (let k = 0; k < 3; k++) t.values[i + k] += om.position.getComponent(k) - oh.position.getComponent(k);
    }
  }
  return clip;
}

// =====================================================================
//  CARREGAR (uma vez, no main.js)
// =====================================================================
export async function carregarPessoas() {
  const loader = new GLTFLoader();
  const [gh, gm, gc] = await Promise.all([loader.loadAsync(urlHomem), loader.loadAsync(urlMulher), loader.loadAsync(urlCabelos)]);
  base.homem = await prepararCorpo(gh, urlPeleHomem, urlRegHomem);
  base.mulher = await prepararCorpo(gm, null, urlRegMulher);
  base.homem.clipe = clipeParado(base.homem, base.homem);
  base.mulher.clipe = clipeParado(base.mulher, base.homem);
  cabelos = gc.scene;
  pronto.valor = true;
}

// =====================================================================
//  PINTAR A ROUPA na textura da pele
// =====================================================================
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r * 255, c.g * 255, c.b * 255]; };   // cor do jeito que aparece na tela (sRGB)
function pintarRoupa(b, cores) {
  // (devolve duas texturas: a cor com a roupa e o relevo, alisado onde tem roupa)
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N), d = img.data, o = b.pele.data, reg = b.reg;
  // tom de pele: multiplica a pele original para chegar perto da cor pedida
  const alvo = rgb(cores.pele || '#c68e5f'), fator = alvo.map((v, k) => THREE.MathUtils.clamp(v / b.mediaPele[k], 0.35, 1.8));
  const camisa = rgb(cores.camisa || '#4dabf7'), calca = rgb(cores.calca || '#495057');
  const cinto = rgb(cores.cinto || '#2b2118'), sapato = rgb(cores.sapato || '#3b2a1f');
  const roupa = { [TRONCO]: camisa, [MANGA_CURTA]: camisa, [MANGA_LONGA]: cores.mangaLonga ? camisa : null, [CINTO]: cinto, [CALCA]: calca, [SAPATO]: sapato };
  for (let i = 0; i < N * N; i++) {
    const p = i * 4, r = reg[i], cor = roupa[r];
    if (cor) {
      // sombra leve vinda da textura original (dobras), sem "desenhar músculos" na roupa
      const l = (o[p] + o[p + 1] + o[p + 2]) / 3;
      const s = THREE.MathUtils.clamp(1 + 0.2 * (l / b.lumMedia - 1), 0.85, 1.1);
      d[p] = cor[0] * s; d[p + 1] = cor[1] * s; d[p + 2] = cor[2] * s;
    } else {
      d[p] = o[p] * fator[0]; d[p + 1] = o[p + 1] * fator[1]; d[p + 2] = o[p + 2] * fator[2];
    }
    d[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;                       // texturas de .glb não são viradas de cabeça para baixo
  t.colorSpace = THREE.SRGBColorSpace;

  // RELEVO: o corpo base é de "super-herói" (bem musculoso). Onde tem roupa, deixamos o relevo
  // quase liso (85% "plano"), senão a roupa parece pintada na pele.
  let tRelevo = null;
  if (b.relevo) {
    const c2 = document.createElement('canvas'); c2.width = c2.height = N;
    const g2 = c2.getContext('2d'), img2 = g2.createImageData(N, N), d2 = img2.data, o2 = b.relevo.data;
    const PLANO = [128, 128, 255];
    for (let i = 0; i < N * N; i++) {
      const p = i * 4, k = roupa[reg[i]] ? 0.15 : 1;   // 0.15 = sobra só 15% do relevo original
      for (let j = 0; j < 3; j++) d2[p + j] = PLANO[j] + (o2[p + j] - PLANO[j]) * k;
      d2[p + 3] = 255;
    }
    g2.putImageData(img2, 0, 0);
    tRelevo = new THREE.CanvasTexture(c2); tRelevo.flipY = false; tRelevo.colorSpace = THREE.NoColorSpace;
  }
  return { cor: t, relevo: tRelevo };
}

// =====================================================================
//  CRIAR UMA PESSOA (chamado pelo npc.js)
//  Devolve um "rig" com g (o grupo que se move e gira) e atualizar(dt).
// =====================================================================
export function criarPessoa(cores = {}) {
  const tipo = cores.corpo === 'mulher' ? 'mulher' : 'homem', b = base[tipo];
  const modelo = clonarComOssos(b.cena);
  const g = new THREE.Group(); g.add(modelo);
  const mapa = pintarRoupa(b, cores);
  modelo.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    if (o.material.name === 'Corpo') {
      o.material = o.material.clone(); o.material.map = mapa.cor;
      if (mapa.relevo) o.material.normalMap = mapa.relevo;
      o.material.needsUpdate = true;
    }
  });

  // ---- Acessórios presos no osso da cabeça ----
  modelo.updateMatrixWorld(true);
  const cabeca = modelo.getObjectByName('Head');
  const prender = (obj) => { modelo.add(obj); obj.updateMatrixWorld(true); cabeca.attach(obj); obj.traverse(m => { if (m.isMesh) { m.castShadow = true; } }); return obj; };
  const doPacote = (nome, feitoPara, cor) => {
    const m = cabelos.getObjectByName(nome).clone();
    m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(cor); } });
    m.position.y = b.alturaCabeca - base[feitoPara].alturaCabeca;   // ajusta a altura para o outro corpo
    return prender(m);
  };
  const tipoCabelo = cores.cabeloTipo === undefined ? (tipo === 'mulher' ? 'comprido' : 'curto') : cores.cabeloTipo;
  if (tipoCabelo && CABELO[tipoCabelo]) doPacote(CABELO[tipoCabelo][0], CABELO[tipoCabelo][1], cores.cabelo || '#3b2a1a');
  if (cores.barba) doPacote('Hair_Beard', 'homem', cores.barba);
  if (cores.chapeu) {
    // chapéu de palha: aba larga, copa e fita
    const ch = new THREE.Group(), palha = std(cores.chapeu, 0.9), y = b.alturaCabeca + 0.155;
    const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.015, 24), palha); aba.position.y = y; ch.add(aba);
    const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.115, 0.11, 18), palha); copa.position.y = y + 0.06; ch.add(copa);
    const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.03, 18), std(cores.faixa || '#7a4b1f', 0.8)); fita.position.y = y + 0.025; ch.add(fita);
    ch.position.z = -0.01; prender(ch);
  }

  // ---- Animação "parado" (cada pessoa começa num ponto diferente, para não ficarem iguais) ----
  const mixer = new THREE.AnimationMixer(modelo);
  const acao = mixer.clipAction(b.clipe); acao.play(); acao.time = Math.random() * b.clipe.duration;

  return {
    g, esqueleto: true,
    atualizar(dt) { mixer.update(dt); },
  };
}
