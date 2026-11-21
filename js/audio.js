// Arquivo: audio.js — todos os sons, criados pelo código (sem arquivos de áudio).
import { rr } from './utils.js';

// =====================================================================
//  ÁUDIO (sintetizado, sem arquivos)
// =====================================================================
let actx = null, master = null, muted = false;
export function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0.6; master.connect(actx.destination);
    // vento de fundo (ruído filtrado)
    const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const gn = actx.createGain(); gn.gain.value = 0.035;
    src.connect(lp).connect(gn).connect(master); src.start();
  } catch (e) { actx = null; }
}
// Liga/desliga o som (tecla M). Devolve true se ficou mudo, ou null se o áudio ainda não começou.
export function toggleMute() {
  if (!master) return null;
  muted = !muted; master.gain.value = muted ? 0 : 0.6;
  return muted;
}
// O áudio já foi iniciado? (só começa depois do primeiro clique, regra dos navegadores)
export const audioReady = () => !!actx;

export function tone(freq, dur, { type = 'sine', vol = 0.12, when = 0, slide = 0 } = {}) {
  if (!actx) return;
  const t0 = actx.currentTime + when, o = actx.createOscillator(), gn = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
export function whoosh() {
  if (!actx) return;
  const len = actx.sampleRate * 0.7, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
  const s = actx.createBufferSource(); s.buffer = buf;
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(400, actx.currentTime); bp.frequency.exponentialRampToValueAtTime(1600, actx.currentTime + 0.6);
  const gn = actx.createGain(); gn.gain.value = 0.25;
  s.connect(bp).connect(gn).connect(master); s.start();
}
export const doorSound = (opening) => { tone(opening ? 880 : 660, 0.12, { vol: 0.1 }); tone(opening ? 1320 : 440, 0.16, { vol: 0.1, when: 0.12 }); whoosh(); };
export const bird = () => { const f = rr(2200, 3600); for (let i = 0; i < 3; i++) tone(f * rr(0.9, 1.1), 0.09, { vol: 0.03, when: i * 0.13, slide: rr(1.2, 1.5) }); };
export const frog = () => { tone(rr(110, 150), 0.18, { type: 'square', vol: 0.025 }); tone(rr(110, 150), 0.18, { type: 'square', vol: 0.025, when: 0.25 }); };

// ---------- Sons de feedback ----------
export const chime = () => { tone(784, 0.12, { vol: 0.08 }); tone(1047, 0.12, { vol: 0.08, when: 0.1 }); tone(1319, 0.2, { vol: 0.08, when: 0.2 }); };
export const blip = () => tone(660, 0.05, { vol: 0.04, type: 'triangle' });
export const buzz = () => tone(180, 0.18, { vol: 0.06, type: 'sawtooth' });
