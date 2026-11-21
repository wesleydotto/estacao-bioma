// Arquivo: controles.js — teclado, mouse e toque. Só "anota" o que o jogador
// quer fazer (em keys, input e cam); quem age é o resto do jogo.
import { renderer } from './cena.js';
import { isTouch, clamp } from './utils.js';
import { keys, joy, input, cam, Q } from './estado.js';
import { initAudio, toggleMute } from './audio.js';
import { dlgOpen, nextLine, panelOpen, closePanel, showToast } from './interface.js';
import { notebook } from './minigames.js';

// =====================================================================
//  ENTRADA (teclado, mouse, toque)
// =====================================================================
addEventListener('keydown', e => {
  // com diálogo aberto, E / Enter / Espaço avançam a conversa
  if (dlgOpen() && ['KeyE', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); if (!e.repeat) nextLine(); return; }
  // com painel aberto, Esc (ou C) fecha; o resto do teclado fica com o painel
  if (panelOpen()) { if (e.code === 'Escape' || e.code === 'KeyC') closePanel(); return; }
  if (e.code === 'KeyC' && Q.started) { notebook(); return; }
  keys[e.code] = true;
  if (e.code === 'Space') { input.jumpQueued = true; e.preventDefault(); }
  if (e.code === 'KeyE') input.interactQueued = true;
  if (e.code === 'KeyM') { const m = toggleMute(); if (m !== null) showToast(m ? 'Som desligado' : 'Som ligado', '#2f3a3f'); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cvs = renderer.domElement;
let dragging = false;
cvs.addEventListener('mousedown', () => {
  dragging = true;
  if (input.started && !isTouch && document.pointerLockElement !== cvs) { try { const p = cvs.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
});
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', e => {
  if (document.pointerLockElement === cvs || dragging) { cam.yaw -= e.movementX * 0.0028; cam.pitch = clamp(cam.pitch + e.movementY * 0.0022, -0.15, 1.25); }
});
addEventListener('wheel', e => { cam.distTarget = clamp(cam.distTarget + Math.sign(e.deltaY) * 0.8, 3, 14); }, { passive: true });

// Toque: joystick à esquerda, arrastar à direita gira a câmera
// (o objeto "joy" com a direção do joystick fica em estado.js)
let lookId = null, lx = 0, ly = 0;
const joyBase = document.getElementById('joyBase'), joyKnob = document.getElementById('joyKnob');
if (isTouch) {
  const layer = document.getElementById('touch');
  layer.style.display = 'block'; document.getElementById('help').style.display = 'none';
  ['btnJump', 'btnRun'].forEach(id => document.getElementById(id).style.display = 'block');
  layer.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth * 0.45 && joy.id === null) { joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joyBase.style.display = 'block'; joyBase.style.left = (t.clientX - 60) + 'px'; joyBase.style.top = (t.clientY - 60) + 'px'; }
      else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }
    e.preventDefault();
  }, { passive: false });
  layer.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const L = Math.hypot(dx, dy); if (L > 50) { dx *= 50 / L; dy *= 50 / L; }
        joy.x = dx / 50; joy.y = dy / 50; joyKnob.style.left = (33 + dx) + 'px'; joyKnob.style.top = (33 + dy) + 'px';
      } else if (t.identifier === lookId) {
        cam.yaw -= (t.clientX - lx) * 0.006; cam.pitch = clamp(cam.pitch + (t.clientY - ly) * 0.004, -0.15, 1.25); lx = t.clientX; ly = t.clientY;
      }
    }
    e.preventDefault();
  }, { passive: false });
  const end = e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; joyBase.style.display = 'none'; joyKnob.style.left = joyKnob.style.top = '33px'; } if (t.identifier === lookId) lookId = null; } };
  layer.addEventListener('touchend', end); layer.addEventListener('touchcancel', end);
  const tap = (id, fn) => document.getElementById(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); initAudio(); fn(); }, { passive: false });
  tap('btnE', () => { if (dlgOpen()) nextLine(); else input.interactQueued = true; });
  tap('btnJump', () => input.jumpQueued = true);
  tap('btnRun', () => { input.runToggle = !input.runToggle; document.getElementById('btnRun').classList.toggle('on', input.runToggle); });
}
