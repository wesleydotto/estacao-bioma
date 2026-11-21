// Arquivo: boneco.js — o modelo de pessoa (feito de formas simples).
// O jogador e os NPCs usam o mesmo boneco, só mudando as cores e os acessórios.
import * as THREE from 'three';
import { std } from './construcao.js';

// Cores do pesquisador (jogador). Um NPC pode trocar qualquer uma.
// Use null para tirar um acessório (ex.: chapeu: null = sem chapéu).
export const CORES_PESQUISADOR = {
  pele: '#f1c27d', camisa: '#5e8c4a', calca: '#c2a878', botas: '#4a3424',
  chapeu: '#d9c08c', faixa: '#2f5d50', mochila: '#3f5a33', jaleco: '#e9ecef',
  cabelo: null,   // cor do cabelo (aparece quando não tem chapéu)
  frasco: true,   // frasquinho azul no cinto
};

// Cria o boneco. Devolve o grupo (g) e as "juntas" dos braços e pernas para animar.
export function criarBoneco(cores = {}) {
  const c = { ...CORES_PESQUISADOR, ...cores };
  const g = new THREE.Group();
  const skin = std(c.pele, 0.7), shirt = std(c.camisa, 0.8), pants = std(c.calca, 0.85), boots = std(c.botas, 0.8), dark = std('#222', 0.5);
  const partes = [];   // tudo que balança junto com o corpo
  const add = (m) => { g.add(m); partes.push(m); return m; };
  const body = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 4, 12), shirt)); body.position.y = 1.08;
  if (c.jaleco) { const vest = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.315, 0.3, 4, 12), std(c.jaleco, 0.7))); vest.position.y = 1.15; vest.scale.set(1, 1, 0.92); }
  const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), skin)); head.position.y = 1.68;
  for (const x of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), dark); e.position.set(x, 1.71, 0.245); g.add(e); }
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
  if (c.mochila) {
    const bp = add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.24), std(c.mochila, 0.8))); bp.position.set(0, 1.15, -0.32);
    const roll = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), std('#a5672f', 0.8))); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.47, -0.32);
  }
  if (c.frasco) { const vial = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), std('#74c0fc', 0.1, 0, { emissive: '#1c7ed6', emissiveIntensity: 0.5 }))); vial.position.set(0.25, 0.92, 0.2); }
  // braços e pernas: um "pivô" no ombro/quadril para girar
  const limb = (r, len, mat, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat); m.position.y = -len / 2 - r * 0.5; m.castShadow = true; pv.add(m); g.add(pv); return pv; };
  const armL = limb(0.08, 0.42, shirt, -0.4, 1.36), armR = limb(0.08, 0.42, shirt, 0.4, 1.36);
  const legL = limb(0.11, 0.42, pants, -0.15, 0.72), legR = limb(0.11, 0.42, pants, 0.15, 0.72);
  for (const leg of [legL, legR]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.3), boots); b.position.set(0, -0.68, 0.05); b.castShadow = true; leg.add(b); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, armL, armR, legL, legR, body: partes };
}
