// Arquivo: boneco.js — o modelo de pessoa (feito de formas simples).
// O jogador e os NPCs usam o mesmo boneco, só mudando as cores e os acessórios.
import * as THREE from 'three';
import { std } from './construcao.js';

// Cores do pesquisador padrão (os NPCs partem daqui). Um NPC pode trocar qualquer uma.
// Use null para tirar um acessório (ex.: chapeu: null = sem chapéu).
// Os acessórios do BIÓLOGO (bone, oculos, barba...) ficam DESLIGADOS aqui de propósito:
// assim os NPCs continuam exatamente como eram.
export const CORES_PESQUISADOR = {
  pele: '#f1c27d', camisa: '#5e8c4a', calca: '#c2a878', botas: '#4a3424',
  chapeu: '#d9c08c', faixa: '#2f5d50', mochila: '#3f5a33', jaleco: '#e9ecef',
  cabelo: null,   // cor do cabelo (aparece quando não tem chapéu)
  frasco: true,   // frasquinho azul no cinto
  // ---- acessórios do Biólogo (todos desligados por padrão) ----
  bone: null,           // cor do boné (ex.: '#16181a'); null = sem boné
  oculos: false,        // óculos escuros retangulares
  barba: null,          // cor da barba e do bigode; null = sem barba
  coque: null,          // cor do cabelo preso em coque (+ cabelo atrás da cabeça); null = sem
  orelhas: false,       // orelhas (necessárias para o brinco aparecer)
  brinco: false,        // argola na orelha e piercing no nariz
  nariz: false,         // nariz (necessário para o piercing)
  bolsosCargo: false,   // bolsos laterais nas coxas (calça cargo)
  mochilaGrande: false, // mochila maior, com alças no peito e garrafa de água
  binoculo: false,      // binóculo pendurado no peito
};

// O Biólogo: o personagem principal (inspirado na ficha de personagem do Wesley).
// boné preto com logo, óculos escuros, barba, coque, camiseta preta, calça cargo verde-oliva e mochila verde.
export const CORES_BIOLOGO = {
  ...CORES_PESQUISADOR,
  pele: '#c9966b', camisa: '#1c1f22', calca: '#6d6a3a', botas: '#3b2a1f',
  chapeu: null, jaleco: null, frasco: false, cabelo: null,
  mochila: '#4f5d34',
  bone: '#16181a', oculos: true, barba: '#2e2118', coque: '#2e2118',
  orelhas: true, brinco: true, nariz: true, bolsosCargo: true, mochilaGrande: true, binoculo: true,
};

// Cria o boneco. Devolve o grupo (g) e as "juntas" dos braços e pernas para animar.
export function criarBoneco(cores = {}) {
  const c = { ...CORES_PESQUISADOR, ...cores };
  const g = new THREE.Group();
  const skin = std(c.pele, 0.7), shirt = std(c.camisa, 0.8), pants = std(c.calca, 0.85), boots = std(c.botas, 0.8), dark = std('#222', 0.5);
  const partes = [];   // tudo que balança junto com o corpo
  const add = (m) => { g.add(m); partes.push(m); return m; };
  // ajudante: cria uma malha, posiciona e já coloca no boneco
  const peca = (geo, mat, x, y, z) => { const m = add(new THREE.Mesh(geo, mat)); m.position.set(x, y, z); return m; };

  const body = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 4, 12), shirt)); body.position.y = 1.08;
  if (c.jaleco) { const vest = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.315, 0.3, 4, 12), std(c.jaleco, 0.7))); vest.position.y = 1.15; vest.scale.set(1, 1, 0.92); }
  const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), skin)); head.position.y = 1.68;
  // olhinhos (com óculos escuros eles ficam escondidos)
  if (!c.oculos) for (const x of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), dark); e.position.set(x, 1.71, 0.245); g.add(e); }

  if (c.chapeu) {
    const hat = std(c.chapeu, 0.85);
    const brim = add(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.035, 24), hat)); brim.position.y = 1.86;
    const crownH = add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.2, 20), hat)); crownH.position.y = 1.97;
    const bandH = add(new THREE.Mesh(new THREE.CylinderGeometry(0.272, 0.272, 0.05, 20), std(c.faixa, 0.7))); bandH.position.y = 1.9;
  } else if (c.cabelo) {
    // cabelo: meia esfera um pouco maior que a cabeça
    const hair = add(new THREE.Mesh(new THREE.SphereGeometry(0.285, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), std(c.cabelo, 0.9)));
    hair.position.set(0, 1.7, -0.02); hair.rotation.x = -0.25;
  }

  // ---------- Acessórios do Biólogo ----------
  // Boné: cúpula (meia esfera) + aba curva na frente + plaquinha clara do logo
  if (c.bone) {
    const boneMat = std(c.bone, 0.8);
    const cupula = peca(new THREE.SphereGeometry(0.29, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), boneMat, 0, 1.76, -0.005); cupula.scale.y = 0.85;
    const aba = peca(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, -Math.PI / 2, Math.PI), boneMat, 0, 1.775, 0.2); aba.rotation.x = 0.14;   // meio disco virado para a frente
    const logo = peca(new THREE.BoxGeometry(0.13, 0.06, 0.012), std('#cfd4d8', 0.6), 0, 1.85, 0.272); logo.rotation.x = -0.32;
  }
  // Óculos escuros retangulares: duas lentes, ponte e hastes até as orelhas
  if (c.oculos) {
    const lente = std('#0b0d0f', 0.2, 0.3);
    for (const s of [-1, 1]) {
      peca(new THREE.BoxGeometry(0.125, 0.075, 0.03), lente, s * 0.09, 1.71, 0.252);
      const haste = peca(new THREE.BoxGeometry(0.015, 0.015, 0.26), lente, s * 0.21, 1.72, 0.125); haste.rotation.y = -s * 0.45;
    }
    peca(new THREE.BoxGeometry(0.06, 0.012, 0.02), lente, 0, 1.725, 0.262);
  }
  // Nariz, orelhas e brincos
  if (c.nariz) peca(new THREE.SphereGeometry(0.045, 10, 8), skin, 0, 1.668, 0.262);
  if (c.orelhas) for (const s of [-1, 1]) peca(new THREE.SphereGeometry(0.045, 10, 8), skin, s * 0.265, 1.67, 0.0).scale.set(0.5, 1, 0.8);
  if (c.brinco) {
    const prata = std('#d9dee3', 0.3, 0.7);
    const argola = peca(new THREE.TorusGeometry(0.035, 0.008, 6, 14), prata, -0.272, 1.635, 0.0); argola.rotation.y = Math.PI / 2;   // brinco de argola na orelha esquerda
    peca(new THREE.TorusGeometry(0.02, 0.006, 6, 12), prata, 0, 1.637, 0.282);   // piercing no nariz (septo)
  }
  // Barba (elipsoide na parte de baixo do rosto) e bigode
  if (c.barba) {
    const pelo = std(c.barba, 0.95);
    peca(new THREE.SphereGeometry(0.265, 18, 12), pelo, 0, 1.585, 0.05).scale.set(0.98, 0.6, 0.9);
    peca(new THREE.BoxGeometry(0.17, 0.035, 0.05), pelo, 0, 1.612, 0.262);
  }
  // Coque: cabelo preso (bolinha no alto, atrás) + cabelo atrás da cabeça, aparecendo debaixo do boné
  if (c.coque) {
    const cabelo = std(c.coque, 0.9);
    peca(new THREE.SphereGeometry(0.11, 14, 10), cabelo, 0, 1.9, -0.2);
    peca(new THREE.SphereGeometry(0.27, 16, 10), cabelo, 0, 1.66, -0.12).scale.set(0.95, 0.8, 0.7);
  }
  // Mochila: a do pesquisador padrão (com rolinho) ou a grande do Biólogo (com alças e garrafa de água)
  if (c.mochila) {
    const gr = c.mochilaGrande;
    const bp = add(new THREE.Mesh(new THREE.BoxGeometry(gr ? 0.5 : 0.46, gr ? 0.62 : 0.52, gr ? 0.28 : 0.24), std(c.mochila, 0.8)));
    bp.position.set(0, gr ? 1.17 : 1.15, gr ? -0.34 : -0.32);
    if (gr) {
      for (const s of [-1, 1]) peca(new THREE.BoxGeometry(0.06, 0.5, 0.03), std('#3a4527', 0.85), s * 0.17, 1.2, 0.262);   // alças no peito
      const garrafa = peca(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 10), std('#d9e3d0', 0.5), 0.31, 1.0, -0.34);
      peca(new THREE.CylinderGeometry(0.058, 0.058, 0.04, 10), std('#2b8a3e', 0.6), 0.31, 1.14, -0.34);   // tampa
      garrafa.castShadow = true;
    } else {
      const roll = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), std('#a5672f', 0.8))); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.47, -0.32);
    }
  }
  // Binóculo pendurado no peito
  if (c.binoculo) {
    const bin = std('#2a2d30', 0.5, 0.2);
    for (const s of [-1, 1]) { const tubo = peca(new THREE.CylinderGeometry(0.05, 0.055, 0.13, 10), bin, s * 0.058, 1.02, 0.33); tubo.rotation.x = Math.PI / 2; }
    peca(new THREE.BoxGeometry(0.07, 0.03, 0.05), bin, 0, 1.03, 0.31);
  }
  if (c.frasco) { const vial = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), std('#74c0fc', 0.1, 0, { emissive: '#1c7ed6', emissiveIntensity: 0.5 }))); vial.position.set(0.25, 0.92, 0.2); }
  // braços e pernas: um "pivô" no ombro/quadril para girar
  const limb = (r, len, mat, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat); m.position.y = -len / 2 - r * 0.5; m.castShadow = true; pv.add(m); g.add(pv); return pv; };
  const armL = limb(0.08, 0.42, shirt, -0.4, 1.36), armR = limb(0.08, 0.42, shirt, 0.4, 1.36);
  const legL = limb(0.11, 0.42, pants, -0.15, 0.72), legR = limb(0.11, 0.42, pants, 0.15, 0.72);
  for (const leg of [legL, legR]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.3), boots); b.position.set(0, -0.68, 0.05); b.castShadow = true; leg.add(b); }
  // bolsos da calça cargo: ficam presos à perna, então balançam junto ao andar
  if (c.bolsosCargo) for (const [leg, s] of [[legL, -1], [legR, 1]]) {
    const bolso = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.12), std('#5f5c33', 0.9)); bolso.position.set(s * 0.115, -0.3, 0.02); bolso.castShadow = true; leg.add(bolso);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, armL, armR, legL, legR, body: partes };
}
