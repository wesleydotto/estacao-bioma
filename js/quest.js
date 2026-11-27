// =====================================================================
//  MOTOR DE MISSÕES
//  Arquivo: quest.js — roda QUALQUER missão da lista (js/missoes/index.js):
//  - interações com a tecla E (porta, mural e as de cada missão)
//  - rastreador no canto da tela e marcador amarelo (da missão ativa)
//  - falas quando o jogador avança de etapa
//  - mural de missões e caderno de campo (tecla C)
//  As regras de cada missão ficam na pasta dela (ex.: js/missoes/lago/).
// =====================================================================
import * as THREE from 'three';
import { scene } from './cena.js';
import { input, jogo } from './estado.js';
import { MISSOES, missao } from './missoes/index.js';
import { openPanel, closePanel, panelOpen, dlgOpen, promptEl, promptText, btnE } from './interface.js';
import { door, DOOR_POS, desenharMural } from './lab.js';
import { LAB } from './mapa.js';
import { player } from './player.js';
import { doorSound, chime } from './audio.js';
import { isTouch } from './utils.js';
import { npcInteracoes } from './npc.js';
import { lotesInteracoes } from './construir.js';
import { eco } from './economia.js';
import { BALCAO } from './prefeitura.js';

// Missão que o jogador está seguindo agora
export const ativa = () => missao(jogo.ativa);
// Posição do mural de missões (parede do fundo do laboratório)
const MURAL_POS = new THREE.Vector2(0, -9.3);

// =====================================================================
//  INTERAÇÕES NO MUNDO (aparece "[E] ..." quando você chega perto)
// =====================================================================
export const interactables = [];
export const addInteract = (pos, r, label, act) => interactables.push({ pos, r, label, act });
let currentInteract = null;
// Deixa cada missão montar o que precisa no mundo (ex.: criar NPCs). Chamado uma vez, no começo.
export function montarMissoes() {
  for (const m of MISSOES) m.montar?.();
}
export function setupInteractions() {
  // porta automática do laboratório
  addInteract(() => DOOR_POS, 4.8, () => door.target ? 'Fechar porta' : 'Abrir porta', () => { door.target = door.target ? 0 : 1; doorSound(door.target === 1); door.closeTimer = 0; });
  // mural de missões (a missão ativa pode trocar o texto, ex.: "fazer o diagnóstico")
  addInteract(() => MURAL_POS, 3.2, () => ativa().rotuloMural?.() || 'Mural de missões', muralPanel);
  // interações de cada missão
  for (const m of MISSOES) for (const it of m.interacoes()) addInteract(it.pos, it.r, it.label, it.act);
}
export function updateInteract() {
  const p = player.pos; currentInteract = null; let best = 1e9;
  for (const it of [...interactables, ...npcInteracoes, ...lotesInteracoes]) {   // inclui NPCs e lugares de construir
    const q = it.pos(), d = Math.hypot(p.x - q.x, p.z - q.y);
    if (d < it.r && d < best) { const l = it.label(); if (l) { best = d; currentInteract = { it, l }; } }
  }
  if (currentInteract) { promptText.textContent = currentInteract.l; promptEl.style.display = isTouch ? 'none' : 'block'; btnE.style.display = isTouch ? 'block' : 'none'; }
  else { promptEl.style.display = 'none'; btnE.style.display = 'none'; }
  if (input.interactQueued && currentInteract) currentInteract.it.act();
  input.interactQueued = false;
}

// =====================================================================
//  OBJETIVOS, MARCADOR E RASTREADOR
// =====================================================================
// Marcador amarelo flutuante + feixe de luz (dá pra ver de longe)
export const marker = new THREE.Group(); scene.add(marker);
{
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: '#ffd43b', emissive: '#ffb703', emissiveIntensity: 1.2 }));
  gem.scale.y = 1.4; gem.position.y = 2.6; marker.add(gem); marker.userData.gem = gem;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.22, depthWrite: false, fog: false }));
  beam.position.y = 22; marker.add(beam); marker.userData.beam = beam;
}
marker.visible = false;
export const questEl = document.getElementById('quest');
let questTick = 0;
export let objTarget = null;          // posição do objetivo atual (o mini-mapa também usa)
const ultimaEtapa = {};               // última etapa já "falada" de cada missão (por id)

// Roda todo quadro, mesmo antes de clicar em "Explorar" (ex.: a saúde do lago)
export function updateMissoes(dt, t) {
  for (const m of MISSOES) m.update?.(dt, t);
}

// Roda todo quadro depois que o jogo começou
export function updateQuest(dt, t) {
  // falas quando alguma missão muda de etapa (espera fechar janelas e diálogos)
  if (!panelOpen() && !dlgOpen()) {
    for (const m of MISSOES) {
      if (!m.iniciada()) continue;
      const s = m.etapa();
      if (ultimaEtapa[m.id] === undefined) ultimaEtapa[m.id] = s;      // acabou de começar: não fala nada
      else if (s !== ultimaEtapa[m.id]) { if (s > ultimaEtapa[m.id]) m.falaDaEtapa?.(s); ultimaEtapa[m.id] = s; }
    }
  }
  const m = ativa(), on = m.iniciada();
  questEl.style.display = on ? 'block' : 'none';
  // rastreador na tela e mural 3D (atualizam 4x por segundo)
  if ((questTick -= dt) <= 0) { questTick = 0.25; atualizarMural3D(); }
  if (questTick === 0.25 && on) {
    const { numero, agora, subs } = m.rastreador(player);
    if (m.relatorio && m.concluida()) subs.unshift(['Entregar o relatório na Prefeitura', !!eco.relatorios[m.id]]);
    const dist = objTarget ? Math.round(Math.hypot(player.pos.x - objTarget.x, player.pos.z - objTarget.z)) : 0;
    questEl.innerHTML = `<h3>MISSÃO · ${m.titulo.toUpperCase()}</h3><div class="now">${numero !== null ? numero + '. ' : ''}${agora}${objTarget && dist > 3 ? ` <small style="color:#fff;opacity:.7">· ${dist} m</small>` : ''}</div>` +
      subs.map(([txt, ok]) => `<div class="sub ${ok ? 'ok' : ''}">${ok ? '✔' : '•'} ${txt}</div>`).join('');
  }
  // marcador
  // missão concluída com relatório pendente: o marcador leva até o balcão da prefeitura
  objTarget = !on ? null : (m.relatorio && m.concluida() && !eco.relatorios[m.id]) ? BALCAO : m.alvo();
  marker.visible = !!objTarget;
  if (objTarget) {
    marker.position.copy(objTarget);
    marker.userData.gem.position.y = 2.6 + Math.sin(t * 3) * 0.2; marker.userData.gem.rotation.y = t * 2;
    const inLab = Math.abs(objTarget.x) < LAB.w / 2 && Math.abs(objTarget.z) < LAB.d / 2;
    marker.userData.beam.visible = !inLab;
  }
}

// =====================================================================
//  MURAL DE MISSÕES (parede do fundo do laboratório)
// =====================================================================
// Situação de uma missão, em texto e cor
export function situacao(m) {
  if (m.concluida()) return { txt: '✔ Concluída', cor: '#2b8a3e' };
  if (m.iniciada()) return { txt: m.id === jogo.ativa ? '▶ Seguindo agora' : '… Em andamento', cor: '#f08c00' };
  const trava = m.bloqueada?.(); if (trava) return { txt: '🔒 Bloqueada', cor: '#868e96', trava };   // trava = motivo (aparece no painel do mural)
  return { txt: '★ Disponível', cor: '#1c7ed6' };
}
// Redesenha o mural da parede só quando a situação de alguma missão muda
let muralAntes = '';
function atualizarMural3D() {
  const itens = MISSOES.map(m => { const s = situacao(m); return { icone: m.icone, titulo: m.titulo, situacao: s.txt, cor: s.cor }; });
  const chave = JSON.stringify(itens);
  if (chave !== muralAntes) { muralAntes = chave; desenharMural(itens); }
}

export function muralPanel() {
  openPanel('📋 Mural de missões', (b) => {
    b.innerHTML = `<p class="tip">Escolha qual missão seguir. O <b>marcador amarelo</b> e o quadro no canto da tela mostram a missão escolhida.</p><div class="tools"></div>`;
    const box = b.querySelector('.tools');
    for (const m of MISSOES) {
      const sit = situacao(m);
      const d = document.createElement('div'); d.className = 'tool';
      d.innerHTML = `<div class="ic">${m.icone}</div><div><div class="nm">${m.titulo}</div><div class="ds">${m.resumo}</div><div class="ds" style="color:${sit.cor};font-weight:700;margin-top:4px">${sit.txt}</div>${sit.trava ? `<div class="ds">${sit.trava}</div>` : ''}</div><div class="st"></div>`;
      const st = d.querySelector('.st');
      const botao = (texto, acao, ghost = false) => { const bt = document.createElement('button'); bt.className = ghost ? 'btn ghost' : 'btn'; bt.textContent = texto; bt.onclick = acao; bt.style.margin = '3px 0'; st.appendChild(bt); st.appendChild(document.createElement('br')); };
      // botões extras da própria missão (ex.: diagnóstico do lago)
      for (const a of (m.acoesMural?.() || [])) botao(a.texto, a.acao, !a.destaque);
      if (!m.iniciada() && !sit.trava) botao('Começar', () => { jogo.ativa = m.id; closePanel(); m.iniciar(); });
      // (só missões já começadas: uma bloqueada não pode virar a missão seguida)
      else if (m.iniciada() && !m.concluida() && m.id !== jogo.ativa) botao('Seguir esta', () => { jogo.ativa = m.id; chime(); muralPanel(); });
      box.appendChild(d);
    }
  });
}

// =====================================================================
//  CADERNO DE CAMPO (tecla C): uma página para cada missão já começada
// =====================================================================
export const cadernoDisponivel = () => MISSOES.some(m => m.iniciada());
export function notebook(id = jogo.ativa) {
  const lista = MISSOES.filter(m => m.iniciada());
  if (!lista.length) return;
  if (!lista.some(m => m.id === id)) id = lista[0].id;
  openPanel('📓 Caderno de campo', (b) => {
    // abas (só aparecem quando há mais de uma missão começada)
    const abas = lista.length > 1 ? `<div class="row" style="justify-content:flex-start">${lista.map(m => `<button class="btn ${m.id === id ? '' : 'ghost'}" data-id="${m.id}">${m.icone} ${m.titulo}</button>`).join('')}</div>` : '';
    b.innerHTML = abas + missao(id).caderno();
    b.querySelectorAll('[data-id]').forEach(bt => bt.onclick = () => notebook(bt.dataset.id));
  });
}

// ---------- Começo do jogo (chamado quando o jogador clica em "Explorar") ----------
export function novoJogo() {
  setTimeout(() => ativa().iniciar(), 1200);
}
