// Arquivo: quest.js — a missão rodando: o que acontece ao apertar E perto
// de cada coisa, o marcador amarelo, o rastreador de objetivos e as falas
// quando muda de etapa. (O progresso em si, Q e stage(), fica em estado.js.)
import * as THREE from 'three';
import { scene } from './cena.js';
import { Q, stage, STAGES, input } from './estado.js';
import { openKit, chemGame, microGame, muralPanel, amostrasBench, benchNeedsSample } from './minigames.js';
import { say, showToast, panelOpen, dlgOpen, promptEl, promptText, btnE } from './interface.js';
import { door, labFx, DOOR_POS } from './lab.js';
import { lakeFx } from './lake.js';
import { LAB, FLOOR_Y, PIER_Y, PIPE_M, PIPE_DIR, groundHeight } from './mapa.js';
import { player } from './player.js';
import { chime, buzz, doorSound } from './audio.js';
import { isTouch } from './utils.js';

// Posição de cada bancada do laboratório (onde o jogador aperta E)
export const BENCH = { chem: new THREE.Vector3(-12.5, FLOOR_Y, -2.4), amostras: new THREE.Vector3(0, FLOOR_Y, -2.4), micro: new THREE.Vector3(12.5, FLOOR_Y, -2.4), mural: new THREE.Vector3(0, FLOOR_Y, -9.3) };


// =====================================================================
//  INTERAÇÕES NO MUNDO (aparece "[E] ..." quando você chega perto)
// =====================================================================
export const interactables = [];
export const addInteract = (pos, r, label, act) => interactables.push({ pos, r, label, act });
export let currentInteract = null;
export const PIPE_SPOT = () => PIPE_M.clone().addScaledVector(PIPE_DIR, 2.5);
export const SACK_SPOT = () => PIPE_M.clone().addScaledVector(PIPE_DIR, 10).addScaledVector(new THREE.Vector2(PIPE_DIR.y, -PIPE_DIR.x), -2.5);
export function setupInteractions() {
  addInteract(() => DOOR_POS, 4.8, () => door.target ? 'Fechar porta' : 'Abrir porta', () => { door.target = door.target ? 0 : 1; doorSound(door.target === 1); door.closeTimer = 0; });
  addInteract(() => lakeFx.ring, 2.6, () => stage() === 5 && !Q.aerator ? 'Instalar aerador solar' : 'Kit de campo', () => {
    if (stage() === 5 && !Q.aerator) { Q.aerator = true; lakeFx.aer.visible = true; chime(); say(['☀️ Aerador instalado! Movido a energia solar, ele joga a água para o alto e <b>mistura ar</b> nela, devolvendo oxigênio para os peixes.'], '✔ Restauração'); }
    else openKit();
  });
  addInteract(() => new THREE.Vector2(BENCH.amostras.x, BENCH.amostras.z), 2.6, () => !Q.stored && Q.sample ? 'Guardar amostra na geladeira' : Q.coli === 1 ? `Estufa: ${Math.ceil(Q.coliT)} s` : 'Bancada AMOSTRAS', amostrasBench);
  addInteract(() => new THREE.Vector2(BENCH.chem.x, BENCH.chem.z), 2.6, () => 'Bancada QUÍMICA', () => { if (!benchNeedsSample('os testes químicos')) chemGame(); });
  addInteract(() => new THREE.Vector2(BENCH.micro.x, BENCH.micro.z), 2.6, () => 'Microscópio', () => { if (!benchNeedsSample('o microscópio')) microGame(); });
  addInteract(() => new THREE.Vector2(BENCH.mural.x, BENCH.mural.z), 3.2, () => stage() >= 4 ? 'Fazer o diagnóstico' : 'Mural de missões', muralPanel);
  addInteract(PIPE_SPOT, 3.4, () => Q.filter ? null : stage() === 5 ? 'Instalar biofiltro' : 'Examinar o cano', () => {
    if (stage() === 5) { Q.filter = true; lakeFx.bio.visible = true; lakeFx.flow.visible = false; chime(); say(['🟩 Biofiltro instalado! Pedras, areia e plantas <b>filtram o esgoto</b> antes de chegar ao lago. A ilha flutuante de plantas absorve o resto dos nutrientes.'], '✔ Restauração'); }
    else say(['Um cano despejando água escura e fedida direto no lago… 🤢 Isso parece <b>esgoto</b>! Guarde essa pista.'], '🔎 Pista');
  });
  addInteract(SACK_SPOT, 2.8, () => Q.plants >= 6 ? null : 'Examinar os sacos', () => say(['Sacos de <b>ADUBO N-P-K</b> rasgados. Quando chove, a água leva o adubo para o lago… N = nitrogênio, P = fósforo!'], '🔎 Pista'));
  lakeFx.spots.forEach(sp => addInteract(() => new THREE.Vector2(sp.x, sp.z), 1.8, () => stage() === 5 && !sp.done ? `Plantar muda (${Q.plants + 1}/6)` : null, () => {
    sp.done = true; sp.mark.visible = false; sp.sap.visible = true; Q.plants++; chime();
    if (Q.plants === 6) { lakeFx.sacks.forEach(m => m.visible = false); say(['🌳 Mata ciliar plantada! As raízes seguram o solo e <b>barram o adubo</b> que escorre com a chuva. (E os sacos de adubo foram recolhidos!)'], '✔ Restauração'); }
  }));
}
export function updateInteract() {
  const p = player.pos; currentInteract = null; let best = 1e9;
  for (const it of interactables) {
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
export function objectiveTarget() {
  const s = stage(), v3 = (v2, y = 0) => new THREE.Vector3(v2.x, y, v2.y);
  const ringY = PIER_Y;
  if (s === 1 || s === 6) return v3(lakeFx.ring, ringY);
  if (s === 2) return BENCH.amostras;
  if (s === 3) {
    if (Q.coli === 0 || Q.coli === 2) return BENCH.amostras;
    if (!Q.micro) return BENCH.micro;
    if (!(Q.chemP && Q.chemN)) return BENCH.chem;
    return BENCH.amostras;
  }
  if (s === 4) return BENCH.mural;
  if (s === 5) {
    if (!Q.filter) { const p = PIPE_SPOT(); return v3(p, groundHeight(p.x, p.y)); }
    const sp = lakeFx.spots.find(x => !x.done); if (sp) return new THREE.Vector3(sp.x, groundHeight(sp.x, sp.z), sp.z);
    return v3(lakeFx.ring, ringY);
  }
  return null;
}
// Marcador amarelo flutuante + feixe de luz (dá pra ver de longe)
export const marker = new THREE.Group(); scene.add(marker);
{
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: '#ffd43b', emissive: '#ffb703', emissiveIntensity: 1.2 }));
  gem.scale.y = 1.4; gem.position.y = 2.6; marker.add(gem); marker.userData.gem = gem;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.22, depthWrite: false, fog: false }));
  beam.position.y = 22; marker.add(beam); marker.userData.beam = beam;
}
export const questEl = document.getElementById('quest');
export let questTick = 0, lastStage = -1, objTarget = null;
export function updateQuest(dt, t) {
  // amostra estragando
  if (Q.sample && !Q.stored) { Q.sampleT -= dt; if (Q.sampleT <= 0) { Q.sample = false; buzz(); say(['Ops… a amostra passou do tempo e <b>estragou</b> (as bactérias mudaram o resultado). Volte ao píer e colete outra — dessa vez, corra! (Shift)'], '📻 Dra. Iara · rádio'); } }
  // estufa
  if (Q.coli === 1) { Q.coliT -= dt; labFx.incub.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4; if (Q.coliT <= 0) { Q.coli = 2; chime(); showToast('🧫 A placa de coliformes está pronta!', '#2b8a3e'); } }
  else labFx.incub.emissiveIntensity = Q.coli === 2 ? 1.2 : 0.2;
  // falas quando muda de etapa
  const s = stage();
  if (s !== lastStage && !panelOpen() && !dlgOpen()) {
    if (s > lastStage) {
      if (s === 2) say(['Amostra coletada! Ela vale por <b>3 minutos</b>. Siga o marcador amarelo até a bancada <b>AMOSTRAS</b> no laboratório. Dica: segure <b>Shift</b> para correr!']);
      if (s === 3) say(['Amostra guardada na geladeira. ❄️', 'Agora são 3 análises: <b>coliformes</b>, <b>microscópio</b> e <b>testes químicos</b>. Comece pelos coliformes: a placa precisa de um tempo na estufa!']);
      if (s === 4) say(['Todas as análises prontas! 🎉 Vá ao <b>mural</b> no fundo do laboratório e descubra o que está causando o problema.']);
      if (s === 5) say(['Hora de agir! Siga o marcador: <b>biofiltro</b> no cano, <b>6 mudas</b> de mata ciliar e o <b>aerador solar</b> no píer.']);
      if (s === 6) say(['Olha só, a água já está mudando de cor! 💧 Volte ao píer e meça o <b>oxigênio</b> de novo com a sonda.']);
    }
    lastStage = s;
  }
  // rastreador na tela (atualiza 4x por segundo)
  if ((questTick -= dt) <= 0 && Q.started) {
    questTick = 0.25;
    const st = STAGES[s], subs = st.subs ? st.subs() : [];
    if (s === 1 && lakeFx.ring && Math.hypot(player.pos.x - lakeFx.ring.x, player.pos.z - lakeFx.ring.y) < 4) subs[0][1] = true;
    const dist = objTarget ? Math.round(Math.hypot(player.pos.x - objTarget.x, player.pos.z - objTarget.z)) : 0;
    questEl.innerHTML = `<h3>MISSÃO · SALVAR O LAGO DA MATA</h3><div class="now">${s < 7 ? s + '. ' : ''}${st.now}${objTarget && dist > 3 ? ` <small style="color:#fff;opacity:.7">· ${dist} m</small>` : ''}</div>` +
      subs.map(([txt, ok]) => `<div class="sub ${ok ? 'ok' : ''}">${ok ? '✔' : '•'} ${txt}</div>`).join('');
  }
  // marcador
  objTarget = objectiveTarget();
  marker.visible = !!objTarget && Q.started;
  if (objTarget) {
    marker.position.copy(objTarget);
    marker.userData.gem.position.y = 2.6 + Math.sin(t * 3) * 0.2; marker.userData.gem.rotation.y = t * 2;
    const inLab = Math.abs(objTarget.x) < LAB.w / 2 && Math.abs(objTarget.z) < LAB.d / 2;
    marker.userData.beam.visible = !inLab;
  }
  // covas visíveis só na etapa de restauração
  lakeFx.spots.forEach(sp => sp.mark.visible = s === 5 && !sp.done);
}

// ---------- Começo da missão (chamado quando o jogador clica em "Explorar") ----------
export function startMission() {
  setTimeout(() => say([
    'Oi, pesquisador(a)! Aqui é a <b>Dra. Iara</b>, da Estação Bioma. 👋',
    'Moradores avisaram que o <b>Lago da Mata</b> ficou verde, com cheiro forte e peixes morrendo. Precisamos descobrir o porquê!',
    'Siga o <b>marcador amarelo</b> (e a trilha de terra) até o píer. Lá está o seu <b>kit de campo</b>. Aperte <b>E</b> para interagir.',
  ], '📻 Dra. Iara · rádio', () => { Q.started = true; questEl.style.display = 'block'; lastStage = 1; }), 1200);
}
