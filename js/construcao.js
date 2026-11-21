// Arquivo: construcao.js — ferramentas para montar objetos (caixas, cilindros,
// placas) e as texturas desenhadas no código. Também guarda as listas de
// colisão e de animações que o resto do jogo usa.
import * as THREE from 'three';
import { renderer, scene } from './cena.js';
import { FONT } from './utils.js';
import { LAB, WATER_Y, groundHeight } from './mapa.js';

// =====================================================================
//  AJUDANTES PARA CRIAR OBJETOS E TEXTURAS
// =====================================================================
export const camBlockers = [];   // objetos que a câmera não atravessa
export const colliders = [];     // caixas que o jogador não atravessa {minX,maxX,minZ,maxZ,enabled}
export const circles = [];       // colisores redondos (árvores, postes...) {x,z,r}
export const animated = [];      // funções chamadas todo quadro

export const std = (color, roughness = 0.8, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
export function addBox(parent, w, h, d, mat, x, y, z, { cast = true, receive = true, block = false } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive;
  parent.add(m); if (block) camBlockers.push(m); return m;
}
export function addCyl(parent, rt, rb, h, mat, x, y, z, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
export const addCollider = (minX, maxX, minZ, maxZ, enabled = null) => colliders.push({ minX, maxX, minZ, maxZ, enabled });

export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function toTex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}
export function speckle(g, w, h, n, alpha) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * alpha})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- Texturas desenhadas no código (visual original) ----------
// Painel branco da fachada, com juntas e parafusos
export const panelTex = (() => {
  const [c, g] = makeCanvas(256, 192);
  g.fillStyle = '#eef2ef'; g.fillRect(0, 0, 256, 192); speckle(g, 256, 192, 1400, 0.035);
  g.strokeStyle = '#b8c2be'; g.lineWidth = 4; g.strokeRect(2, 2, 252, 188);
  g.fillStyle = '#9fa9a5';
  for (const [x, y] of [[12, 12], [244, 12], [12, 180], [244, 180]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
  return toTex(c);
})();
export function wallMat(w, h) { const t = panelTex.clone(); t.repeat.set(w / 2.6, h / 1.95); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }); }

export const tileTex = (() => {
  const [c, g] = makeCanvas(256, 256);
  g.fillStyle = '#dfe4e1'; g.fillRect(0, 0, 256, 256); speckle(g, 256, 256, 2500, 0.04);
  g.fillStyle = '#b9c1bd'; g.fillRect(0, 0, 256, 3); g.fillRect(0, 128, 256, 3); g.fillRect(0, 0, 3, 256); g.fillRect(128, 0, 3, 256);
  return toTex(c, (LAB.w - 0.8) / 2, (LAB.d - 0.8) / 2);
})();
export const concreteTex = (() => {
  const [c, g] = makeCanvas(256, 256);
  g.fillStyle = '#cfcabf'; g.fillRect(0, 0, 256, 256); speckle(g, 256, 256, 4000, 0.06);
  g.fillStyle = '#aaa597'; g.fillRect(0, 0, 256, 4); g.fillRect(0, 0, 4, 256);
  return toTex(c, 43.2 / 3, 33.6 / 3);
})();
export const woodTex = (() => {
  const [c, g] = makeCanvas(64, 256);
  g.fillStyle = '#a8703f'; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${60 + Math.random() * 40},${30 + Math.random() * 20},10,${0.15 + Math.random() * 0.2})`; g.fillRect(Math.random() * 64, 0, 1 + Math.random() * 3, 256); }
  return toTex(c);
})();
export const solarTex = (() => {
  const [c, g] = makeCanvas(256, 160);
  g.fillStyle = '#1c3463'; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = 'rgba(170,200,255,.45)'; g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); }
  for (let y = 0; y <= 160; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.strokeStyle = '#d9dee6'; g.lineWidth = 8; g.strokeRect(0, 0, 256, 160);
  return toTex(c);
})();
export const corrugTex = (() => {
  const [c, g] = makeCanvas(64, 64);
  for (let y = 0; y < 64; y += 8) { g.fillStyle = '#9aa4aa'; g.fillRect(0, y, 64, 4); g.fillStyle = '#7d878e'; g.fillRect(0, y + 4, 64, 4); }
  return toTex(c, 1, 6);
})();

// Placa/quadro com título e linhas de texto
export function boardTex(title, lines, { bg = '#f7f3e8', fg = '#24302b', accent = '#16a08a', w = 1024, h = 640, size = 52 } = {}) {
  const [c, g] = makeCanvas(w, h);
  g.fillStyle = bg; roundRect(g, 0, 0, w, h, 40); g.fill();
  g.fillStyle = accent; roundRect(g, 0, 0, w, 150, 40); g.fill(); g.fillRect(0, 100, w, 50);
  g.fillStyle = '#fff'; g.font = `700 ${Math.round(size * 1.35)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(title, w / 2, 78);
  g.fillStyle = fg; g.font = `600 ${size}px ${FONT}`; g.textAlign = 'left';
  lines.forEach((l, i) => g.fillText(l, 60, 230 + i * size * 1.45));
  return toTex(c);
}
// Placa sobre postes de madeira, colocada no chão
export function makePostBoard(tex, w, h, x, z, rotY) {
  const g = new THREE.Group();
  const wood = std('#7a5230', 0.9);
  const gy = groundHeight(x, z);
  addCyl(g, 0.07, 0.08, h + 1.2, wood, -w / 2 + 0.15, (h + 1.2) / 2, 0, 8);
  addCyl(g, 0.07, 0.08, h + 1.2, wood, w / 2 - 0.15, (h + 1.2) / 2, 0, 8);
  addBox(g, w + 0.12, h + 0.12, 0.08, wood, 0, 1.0 + h / 2, 0);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', 0.8, 0, { map: tex }));
  face.position.set(0, 1.0 + h / 2, 0.045); g.add(face);
  g.userData.face = face;
  g.position.set(x, Math.max(gy, WATER_Y + 0.2), z); g.rotation.y = rotY;
  scene.add(g);
  circles.push({ x, z, r: w / 2 });
  return g;
}
