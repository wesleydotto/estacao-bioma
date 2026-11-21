// =====================================================================
//  CONSTRUIR: lugares marcados no mundo onde o jogador usa itens do inventário
//  Arquivo: construir.js
//  Cada LOTE tem uma posição, um tipo e a lista de itens que aceita.
//  Chegando perto e apertando E, o item sai do inventário e aparece no mundo.
//
//  Para criar lotes novos (ex.: numa missão): addLote({ nome, x, z, tipo, aceita })
//    tipo: 'canteiro' (terra, para plantar) ou 'energia' (base de concreto)
// =====================================================================
import * as THREE from 'three';
import { scene } from './cena.js';
import { std, addBox, addCyl, circles, animated, solarTex } from './construcao.js';
import { walkHeight } from './mapa.js';
import { say } from './interface.js';
import { chime, buzz } from './audio.js';
import { ITENS, qtd, usarItem } from './economia.js';

export const lotes = [];
export const lotesInteracoes = [];   // o motor de missões (quest.js) lê esta lista

// ---------- Modelos 3D de cada item construído ----------
const MODELOS = {
  muda() {
    const g = new THREE.Group();
    addCyl(g, 0.06, 0.1, 1.6, std('#6b4a2f', 0.9), 0, 0.8, 0, 6);
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), std('#f2c94c', 0.8));   // ipê-amarelo!
    copa.position.y = 1.9; copa.scale.y = 0.85; copa.castShadow = true; g.add(copa);
    return g;
  },
  sementes() {
    const g = new THREE.Group(), folha = std('#69a83a', 0.85);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, r = i ? 0.45 : 0; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), folha); b.position.set(Math.cos(a) * r, 0.22, Math.sin(a) * r); b.scale.y = 0.7; b.castShadow = true; g.add(b); }
    return g;
  },
  placa() {
    const g = new THREE.Group(), metal = std('#aeb6ba', 0.4, 0.6);
    addBox(g, 0.1, 1.0, 0.1, metal, -0.6, 0.5, 0.3); addBox(g, 0.1, 1.0, 0.1, metal, 0.6, 0.5, 0.3);
    addBox(g, 0.1, 0.5, 0.1, metal, -0.6, 0.25, -0.3); addBox(g, 0.1, 0.5, 0.1, metal, 0.6, 0.25, -0.3);
    const p = addBox(g, 1.7, 0.05, 1.1, std('#ffffff', 0.25, 0.5, { map: solarTex }), 0, 0.85, 0); p.rotation.x = -0.45;
    return g;
  },
  catavento() {
    const g = new THREE.Group(), branco = std('#f1f3f5', 0.4);
    addCyl(g, 0.08, 0.14, 6, branco, 0, 3, 0, 10);
    addBox(g, 0.3, 0.3, 0.7, branco, 0, 6.1, 0.1);
    const rotor = new THREE.Group(); rotor.position.set(0, 6.1, 0.5); g.add(rotor);
    for (let i = 0; i < 3; i++) { const piv = new THREE.Group(); piv.rotation.z = i * 2.094; rotor.add(piv); addBox(piv, 0.14, 1.8, 0.04, branco, 0, 0.9, 0); }   // 3 pás, a 120° uma da outra
    animated.push(dt => { rotor.rotation.z += dt * 3; });   // gira com o vento
    return g;
  },
};

// ---------- Criar um lote ----------
export function addLote({ nome, x, z, tipo = 'canteiro', aceita = ['muda', 'sementes'] }) {
  const y = walkHeight(x, z);
  const marca = new THREE.Group(); marca.position.set(x, y, z); scene.add(marca);
  if (tipo === 'canteiro') {
    addCyl(marca, 0.55, 0.6, 0.1, std('#5c4024', 1), 0, 0.03, 0, 14);                         // terra fofa
    addCyl(marca, 0.025, 0.025, 1.1, std('#c8a46b', 0.9), 0.35, 0.55, 0, 5);                   // estaca
    const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), std('#ffd43b', 0.6, 0, { side: THREE.DoubleSide, emissive: '#ffd43b', emissiveIntensity: 0.4 }));
    bandeira.position.set(0.5, 1.0, 0); marca.add(bandeira);
  } else {
    addBox(marca, 2.2, 0.15, 2.2, std('#b8b3a7', 0.9), 0, 0.07, 0);                             // base de concreto
    for (const [w, d, px, pz] of [[2.2, 0.08, 0, 1.06], [2.2, 0.08, 0, -1.06], [0.08, 2.2, 1.06, 0], [0.08, 2.2, -1.06, 0]])
      addBox(marca, w, 0.02, d, std('#ffd43b', 0.6, 0, { emissive: '#ffd43b', emissiveIntensity: 0.3 }), px, 0.16, pz);   // faixa amarela
  }
  const lote = { nome, x, z, y, tipo, aceita, feito: null, marca, modelo: null };
  lotes.push(lote);
  lotesInteracoes.push({ pos: () => new THREE.Vector2(x, z), r: tipo === 'energia' ? 2.4 : 1.8, label: () => rotulo(lote), act: () => usarLote(lote) });
  return lote;
}

// Qual item do inventário dá para usar neste lote (o primeiro que o jogador tiver)
const itemDisponivel = (lote) => lote.aceita.find(id => qtd(id) > 0);
const precisaPa = (id) => id === 'muda' || id === 'sementes';
const verbo = (id) => (precisaPa(id) ? 'Plantar' : 'Instalar');

function rotulo(lote) {
  if (lote.feito) return null;
  const id = itemDisponivel(lote);
  if (!id) return `${lote.nome} (vazio)`;
  return `${verbo(id)} ${ITENS[id].nome.toLowerCase()} (você tem ${qtd(id)})`;
}

function usarLote(lote) {
  const id = itemDisponivel(lote);
  if (!id) {
    const nomes = lote.aceita.map(i => `${ITENS[i].icone} ${ITENS[i].nome}`).join(' ou ');
    say([`Este lugar aceita: <b>${nomes}</b>. Compre na <b>loja da prefeitura</b>, ao lado da praça.`], '🏗️ ' + lote.nome); return;
  }
  if (precisaPa(id) && !qtd('pa')) { buzz(); say(['Para plantar você precisa de uma <b>🪏 pá</b>. Tem na loja da prefeitura!'], '🏗️ ' + lote.nome); return; }
  usarItem(id); chime();
  construirNoLote(lote, id, true);
}

// Coloca o modelo do item no lote (animar = cresce aos poucos; ao carregar o save, aparece pronto)
function construirNoLote(lote, id, animar) {
  lote.feito = id; lote.marca.visible = false;
  const m = MODELOS[id](); m.position.set(lote.x, lote.y, lote.z); scene.add(m); lote.modelo = m;
  if (lote.tipo === 'energia') circles.push({ x: lote.x, z: lote.z, r: 0.9 });
  else if (id === 'muda') circles.push({ x: lote.x, z: lote.z, r: 0.25 });
  if (animar) {
    let k = 0; m.scale.setScalar(0.01);
    animated.push(dt => { if (k < 1) { k = Math.min(1, k + dt * 0.8); const e = 1 - Math.pow(1 - k, 3); m.scale.setScalar(Math.max(0.01, e)); } });
  }
}

// ---------- Lotes que já existem no começo do jogo ----------
export function montarLotes() {
  // canteiro na clareira em frente ao laboratório
  for (const x of [8, 11, 14, 17]) addLote({ nome: 'Canteiro da praça', x, z: 26, tipo: 'canteiro', aceita: ['muda', 'sementes'] });
  // bases de energia do lado oeste do laboratório (vão ser usadas na missão de energia)
  for (const z of [-6, 0]) addLote({ nome: 'Base de energia', x: -26, z, tipo: 'energia', aceita: ['placa', 'catavento'] });
}

// ---------- Salvar e carregar ----------
export const salvarLotes = () => lotes.map(l => l.feito);
export function carregarLotes(lista) {
  (lista || []).forEach((id, i) => { if (id && lotes[i] && !lotes[i].feito && MODELOS[id]) construirNoLote(lotes[i], id, false); });
}
