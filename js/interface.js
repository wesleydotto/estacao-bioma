// Arquivo: interface.js — tudo que aparece por cima do 3D: nome da zona,
// avisos, mini-mapa, diálogos da Dra. Iara e as janelas (painéis) dos minigames.
import { makeCanvas } from './construcao.js';
import { rand, rr, clamp, lerp, FONT } from './utils.js';
import { PATH, LAKE, lakeR, PREF, FAZENDA, LAGOA, lagoaR, GARIMPO, CORREGO } from './mapa.js';
import { keys } from './estado.js';
import { blip } from './audio.js';

// =====================================================================
//  INTERFACE (mensagens, mini-mapa)
// =====================================================================
export const zoneEl = document.getElementById('zone'), toastEl = document.getElementById('toast');
export const promptEl = document.getElementById('prompt'), promptText = document.getElementById('promptText'), btnE = document.getElementById('btnE');
let zoneTimer = 0, toastTimer = 0, currentZone = '';
export function showZone(name) { zoneEl.textContent = name; zoneEl.style.opacity = 1; zoneTimer = 3; }
export function showToast(msg, bg = 'rgba(160,50,40,.85)') { toastEl.textContent = msg; toastEl.style.background = bg; toastEl.style.opacity = 1; toastTimer = 2; }
// Mostra o nome da zona só quando o jogador entra numa zona nova
export function setZone(name) { if (name !== currentZone) { currentZone = name; showZone(name); } }
// Some com o nome da zona e com o aviso depois de alguns segundos (chamado todo quadro)
export function updateHud(dt) {
  if (zoneTimer > 0 && (zoneTimer -= dt) <= 0) zoneEl.style.opacity = 0;
  if (toastTimer > 0 && (toastTimer -= dt) <= 0) toastEl.style.opacity = 0;
}

export const mm = document.getElementById('minimap'), mctx = mm.getContext('2d'), mapInfo = document.getElementById('mapInfo');
export const MAP_C = { x: -2, z: 45 }, MAP_S = 340 / 320;            // centro e escala do mini-mapa (cobre do lago até o garimpo)
export const toMap = (x, z) => [170 + (x - MAP_C.x) * MAP_S, 170 + (z - MAP_C.z) * MAP_S];
let mapBg = null;
export function buildMapBg() {
  const [c, g] = makeCanvas(340, 340);
  g.fillStyle = '#3f7a32'; g.fillRect(0, 0, 340, 340);
  for (let i = 0; i < 900; i++) { const [x, y] = [rand() * 340, rand() * 340]; g.fillStyle = 'rgba(20,60,20,.35)'; g.beginPath(); g.arc(x, y, rr(2, 5), 0, 7); g.fill(); }
  g.strokeStyle = '#d9b57a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); PATH.forEach((p, i) => { const [x, y] = toMap(p.x, p.y); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#7fae36'; g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = lakeR(a); const [x, y] = toMap(LAKE.x + Math.cos(a) * r, LAKE.z + Math.sin(a) * r); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.fill(); g.strokeStyle = '#4d6b1f'; g.lineWidth = 3; g.stroke();
  const [lx0, ly0] = toMap(-21.6, -12.6); g.fillStyle = '#cfcabf'; g.fillRect(lx0, ly0, 43.2 * MAP_S, 33.6 * MAP_S);
  const [bx, by] = toMap(-20, -11); g.fillStyle = '#ffffff'; g.fillRect(bx, by, 40 * MAP_S, 22 * MAP_S);
  g.fillStyle = '#16a08a'; g.fillRect(bx, by + 22 * MAP_S - 6, 40 * MAP_S, 6);
  g.fillStyle = '#24302b'; g.font = `700 20px ${FONT}`; g.textAlign = 'center'; g.fillText('LAB', 170 + (0 - MAP_C.x) * MAP_S, 170 + (0 - MAP_C.z) * MAP_S + 7);
  g.fillStyle = '#fff'; g.fillText('LAGO', ...toMap(LAKE.x, LAKE.z + 4));
  // prefeitura (prédio com telhado de telha)
  const [px0, py0] = toMap(PREF.x - PREF.w / 2, PREF.z - PREF.d / 2); g.fillStyle = '#b5533c'; g.fillRect(px0, py0, PREF.w * MAP_S, PREF.d * MAP_S);
  g.fillStyle = '#fff'; g.font = `700 15px ${FONT}`; g.fillText('PREF.', ...toMap(PREF.x, PREF.z + 12));
  // fazenda (terra vermelha)
  const [fx0, fy0] = toMap(FAZENDA.x - FAZENDA.w / 2, FAZENDA.z - FAZENDA.d / 2); g.fillStyle = '#a4533a'; g.fillRect(fx0, fy0, FAZENDA.w * MAP_S, FAZENDA.d * MAP_S);
  g.fillStyle = '#fff'; g.font = `700 15px ${FONT}`; g.fillText('FAZENDA', ...toMap(FAZENDA.x, FAZENDA.z - 4));
  // garimpo (terra alaranjada), córrego e Lagoa Dourada
  g.fillStyle = '#c9783c'; g.beginPath(); g.arc(...toMap(GARIMPO.x, GARIMPO.z), GARIMPO.r * MAP_S, 0, 7); g.fill();
  g.strokeStyle = '#4fb3c9'; g.lineWidth = 3; g.beginPath(); CORREGO.forEach((p, i) => { const [x, y] = toMap(p.x, p.y); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#3fa6b8'; g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = lagoaR(a); const [x, y] = toMap(LAGOA.x + Math.cos(a) * r, LAGOA.z + Math.sin(a) * r); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.fill(); g.strokeStyle = '#1e6f80'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('LAGOA', ...toMap(LAGOA.x, LAGOA.z + 4));
  g.fillText('GARIMPO', ...toMap(GARIMPO.x, GARIMPO.z - GARIMPO.r - 4));
  mapBg = c;
}
// Desenha o mini-mapa: jogador (seta amarela) e objetivo atual (bolinha que pisca)
export function drawMap(player, objTarget) {
  mctx.drawImage(mapBg, 0, 0);
  const [x, y] = toMap(player.pos.x, player.pos.z);
  const px = clamp(x, 10, 330), py = clamp(y, 10, 330);
  mctx.save(); mctx.translate(px, py); mctx.rotate(-player.yaw + Math.PI);
  mctx.fillStyle = '#ffd43b'; mctx.strokeStyle = '#24302b'; mctx.lineWidth = 3;
  mctx.beginPath(); mctx.moveTo(0, -14); mctx.lineTo(10, 10); mctx.lineTo(0, 5); mctx.lineTo(-10, 10); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
  if (objTarget) {   // objetivo atual no mini-mapa (só existe com missão em andamento)
    const [ox, oy] = toMap(objTarget.x, objTarget.z), r = 7 + Math.sin(performance.now() * 0.006) * 2;
    mctx.fillStyle = '#ffd43b'; mctx.strokeStyle = '#24302b'; mctx.lineWidth = 3;
    mctx.beginPath(); mctx.arc(clamp(ox, 8, 332), clamp(oy, 8, 332), r, 0, 7); mctx.fill(); mctx.stroke();
  }
  const dl = Math.max(0, Math.hypot(player.pos.x - LAKE.x, player.pos.z - LAKE.z) - LAKE.r);
  const dlab = Math.hypot(player.pos.x, player.pos.z);
  mapInfo.textContent = `Lago: ${Math.round(dl)} m · Lab: ${Math.round(dlab)} m`;
}

// =====================================================================
//  DIÁLOGOS (mensagens da Dra. Iara pelo rádio)
// =====================================================================
export const dlg = document.getElementById('dlg'), dlgWho = dlg.querySelector('.who'), dlgTxt = dlg.querySelector('.txt');
let dlgQueue = [], dlgEnd = null;
export function say(lines, who = '📻 Dra. Iara · rádio', onEnd = null) { dlgQueue = lines.map(t => ({ who, t })); dlgEnd = onEnd; nextLine(); }
export function nextLine() {
  if (!dlgQueue.length) { dlg.style.display = 'none'; const f = dlgEnd; dlgEnd = null; if (f) f(); return; }
  const l = dlgQueue.shift(); dlgWho.textContent = l.who; dlgTxt.innerHTML = l.t; dlg.style.display = 'block'; blip();
}
export const dlgOpen = () => dlg.style.display === 'block';
dlg.addEventListener('click', nextLine);

// =====================================================================
//  PAINÉIS (janelas dos minigames)
// =====================================================================
export const panel = document.getElementById('panel'), panelTitle = document.getElementById('panelTitle'), panelBody = document.getElementById('panelBody');
export let panelToken = 0;     // muda a cada painel novo: serve para parar animações antigas
export function openPanel(title, build) {
  panelToken++; panelTitle.textContent = title; panelBody.innerHTML = ''; panel.style.display = 'flex';
  if (document.pointerLockElement) document.exitPointerLock();
  for (const k in keys) keys[k] = false;
  build(panelBody, panelToken);
}
export function closePanel() { panelToken++; panel.style.display = 'none'; }
export const panelOpen = () => panel.style.display === 'flex';
document.getElementById('panelClose').addEventListener('click', closePanel);
export const $ = (b, sel) => b.querySelector(sel);
export function holdButton(btn, onChange) {   // botão de "segurar" que funciona com mouse e toque
  const on = e => { e.preventDefault(); onChange(true); }, off = () => onChange(false);
  btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off); btn.addEventListener('pointerleave', off); btn.addEventListener('pointercancel', off);
}
export function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
