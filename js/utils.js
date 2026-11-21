// Arquivo: utils.js — funções de matemática usadas no jogo todo.
// Não depende de nenhum outro arquivo.

// =====================================================================
//  UTILIDADES (números aleatórios, ruído, funções matemáticas)
// =====================================================================
// Gerador aleatório com "semente": o mundo sai sempre igual
export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const rand = mulberry32(2026);
export const rr = (a, b) => a + (b - a) * rand();          // número aleatório entre a e b
export const lerp = (a, b, t) => a + (b - a) * t;          // mistura linear
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

// Ruído suave 2D (usado para o relevo do terreno)
export function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v) * 2 - 1;
}
export function fbm(x, z) { let s = 0, a = 1, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f, z * f); a *= 0.5; f *= 2.03; } return s; }

export const FONT = '"Fredoka", "Trebuchet MS", sans-serif';
export const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
