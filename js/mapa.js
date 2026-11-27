// Arquivo: mapa.js — posição de cada coisa no mundo e a altura do chão.
import * as THREE from 'three';
import { lerp, clamp, smoothstep, fbm } from './utils.js';

// =====================================================================
//  MAPA: onde fica cada coisa
// =====================================================================
export const LAB = { w: 40, d: 22, h: 9 };              // laboratório no centro (0,0), porta virada para +Z
export const LAKE = { x: -55, z: 85, r: 26 };           // lago a ~100 m do laboratório
export const WATER_Y = -0.7;                            // altura da água
export const FLOOR_Y = 0.16;                            // piso interno do laboratório
export const PLAZA_Y = 0.12;                            // calçada de concreto
export const PIER_Y = 0.12;                             // píer de madeira
export const WORLD_R = 250;                             // limite do mapa
// Prefeitura: prédio a leste da praça, porta virada para a praça (-X)
export const PREF = { x: 33, z: 18, w: 12, d: 9, h: 5 };

// Fazenda Boa Safra (Missão 2): lavoura de soja ao norte do lago. O portão fica virado para o lago (-Z).
// y = altura do chão da fazenda (o terreno é aplainado em volta, veja groundHeight)
export const FAZENDA = { x: -45, z: 160, w: 44, d: 34, y: 0.15 };
// Pontos de coleta de solo da Missão 2: fragmento de mata (a oeste da fazenda) e lavoura (entre as fileiras de soja)
export const PONTO_MATA = { x: -92, z: 158 };
export const PONTO_LAVOURA = { x: -55.7, z: 161.3 };
// Distância de um ponto até a "caixa" da fazenda (0 = dentro dela)
export function distToFazenda(x, z) {
  const dx = Math.max(Math.abs(x - FAZENDA.x) - FAZENDA.w / 2, 0), dz = Math.max(Math.abs(z - FAZENDA.z) - FAZENDA.d / 2, 0);
  return Math.hypot(dx, dz);
}

// =====================================================================
//  LAGOA DOURADA e GARIMPO ABANDONADO (missão do garimpo, a leste)
//  A lagoa fica numa baixada natural do terreno. O córrego desce do garimpo
//  (perto dos morros) até a lagoa, trazendo o sedimento da área degradada.
// =====================================================================
export const LAGOA = { x: 92, z: 66, r: 19 };
// Formato irregular da lagoa (raio muda com o ângulo), igual ao do lago
export function lagoaR(a) { return LAGOA.r + 2.5 * Math.sin(2 * a + 1.0) + 1.5 * Math.sin(5 * a + 0.3); }
// 0 = centro da lagoa, 1 = margem, >1 = fora
export function lagoaNorm(x, z) { const dx = x - LAGOA.x, dz = z - LAGOA.z; return Math.hypot(dx, dz) / lagoaR(Math.atan2(dz, dx)); }
// Garimpo: um "patamar" de terra pelada; dentro dele, a CAVA (buraco cheio de água barrenta)
export const GARIMPO = { x: 152, z: 40, r: 16, y: 4.0 };
export const CAVA = { x: 156, z: 44, r: 6, agua: GARIMPO.y - 0.9, fundo: GARIMPO.y - 2.8 };
// Trapiche (pontezinha de madeira) no lado oeste da lagoa, onde fica o ponto de coleta
export const TRAPICHE_Y = 0.12;
const TRAP_A = Math.PI + 0.12;                                     // ângulo da margem (oeste)
export const TRAP_DIR = new THREE.Vector2(-Math.cos(TRAP_A), -Math.sin(TRAP_A));   // aponta para dentro da lagoa
export const TRAP0 = new THREE.Vector2(LAGOA.x, LAGOA.z).addScaledVector(TRAP_DIR, -lagoaR(TRAP_A));   // ponto da margem
export const TRAP_FIM = TRAP0.clone().addScaledVector(TRAP_DIR, 8.5);                              // ponta (dentro da água)
export function onTrapiche(x, z) {
  const px = x - TRAP0.x, pz = z - TRAP0.y;
  const along = px * TRAP_DIR.x + pz * TRAP_DIR.y, across = px * -TRAP_DIR.y + pz * TRAP_DIR.x;
  return along > -2.5 && along < 9.4 && Math.abs(across) < 1.1;
}
// Córrego: linha de pontos do garimpo até a lagoa. "nivel" = altura da água em cada ponto
// (a água desce o morro: começa na altura da cava e termina na altura da lagoa).
export const CORREGO = [[151, 46.5], [143, 46], [135, 47.5], [127, 52], [119, 55.5], [112, 60], [106, 63]].map(([x, z]) => new THREE.Vector2(x, z));
const _compr = [0];
for (let i = 1; i < CORREGO.length; i++) _compr.push(_compr[i - 1] + CORREGO[i].distanceTo(CORREGO[i - 1]));
export const CORREGO_COMPR = _compr[_compr.length - 1];
export const nivelCorrego = (t) => lerp(CAVA.agua - 0.15, WATER_Y, smoothstep(0.08, 0.85, t));
// Distância até o córrego e "t" (0 = começo no garimpo, 1 = chegada na lagoa)
export function infoCorrego(x, z) {
  if (x < 95 || x > 160 || z < 35 || z > 75) return { d: 999, t: 0 };
  let best = 1e9, bt = 0;
  for (let i = 0; i < CORREGO.length - 1; i++) {
    const A = CORREGO[i], B = CORREGO[i + 1], abx = B.x - A.x, abz = B.y - A.y;
    const k = clamp(((x - A.x) * abx + (z - A.y) * abz) / (abx * abx + abz * abz), 0, 1);
    const d = Math.hypot(x - (A.x + abx * k), z - (A.y + abz * k));
    if (d < best) { best = d; bt = (_compr[i] + k * (_compr[i + 1] - _compr[i])) / CORREGO_COMPR; }
  }
  return { d: best, t: bt };
}
export const distGarimpo = (x, z) => Math.hypot(x - GARIMPO.x, z - GARIMPO.z);
export const distCava = (x, z) => Math.hypot(x - CAVA.x, z - CAVA.z);
// Comunidade ribeirinha (casas dos moradores), a oeste da lagoa
export const VILA_LAGOA = { x: 62, z: 64 };

// Água funda de verdade (onde o jogador não pode entrar): só dentro do lago, da lagoa e da cava.
// Antes, qualquer baixada do terreno virava "água" invisível (o jogador batia numa parede no meio do mato).
export function aguaFunda(x, z) {
  if (lakeNorm(x, z) < 1.3 || lagoaNorm(x, z) < 1.3) return groundHeight(x, z) < WATER_Y - 0.45;
  if (distCava(x, z) < CAVA.r * 1.3) return groundHeight(x, z) < CAVA.agua - 0.45;
  return false;
}

// Distância de um ponto até a "caixa" da prefeitura (0 = dentro dela)
export function distToPref(x, z) {
  const dx = Math.max(Math.abs(x - PREF.x) - PREF.w / 2, 0), dz = Math.max(Math.abs(z - PREF.z) - PREF.d / 2, 0);
  return Math.hypot(dx, dz);
}
// Calçada entre a praça e a porta da prefeitura
export const onPrefWalk = (x, z) => x > 21 && x < PREF.x - PREF.w / 2 + 0.5 && Math.abs(z - PREF.z) < 1.6;

// Formato irregular do lago (raio muda com o ângulo)
export function lakeR(a) { return LAKE.r + 3.5 * Math.sin(3 * a + 0.5) + 2 * Math.sin(5 * a + 2.0); }
// 0 = centro do lago, 1 = margem, >1 = fora
export function lakeNorm(x, z) { const dx = x - LAKE.x, dz = z - LAKE.z; return Math.hypot(dx, dz) / lakeR(Math.atan2(dz, dx)); }

// Direção lago -> laboratório (o píer e a trilha ficam desse lado)
export const U = new THREE.Vector2(-LAKE.x, -LAKE.z).normalize();
export const P0 = new THREE.Vector2(LAKE.x, LAKE.z).addScaledVector(U, lakeR(Math.atan2(U.y, U.x)));  // ponto da margem
export const PIER_DIR = U.clone().negate();                      // o píer entra no lago
export const PIER_PERP = new THREE.Vector2(-PIER_DIR.y, PIER_DIR.x);

// Trilha de terra (curva de Bézier) da calçada até a margem do lago
export const PATH = [];
{
  const a = new THREE.Vector2(0, 22), c = new THREE.Vector2(-6, 50), b = P0.clone().addScaledVector(U, 1.5);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, m = 1 - t;
    PATH.push(new THREE.Vector2(m * m * a.x + 2 * m * t * c.x + t * t * b.x, m * m * a.y + 2 * m * t * c.y + t * t * b.y));
  }
}
export function distToPath(x, z) {
  if (x < -70 || x > 20 || z < 10 || z > 80) return 999;
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const A = PATH[i], B = PATH[i + 1];
    const abx = B.x - A.x, abz = B.y - A.y;
    const t = clamp(((x - A.x) * abx + (z - A.y) * abz) / (abx * abx + abz * abz), 0, 1);
    best = Math.min(best, Math.hypot(x - (A.x + abx * t), z - (A.y + abz * t)));
  }
  return best;
}

// Cano de esgoto: do lado norte do lago
export const PIPE_A = Math.atan2(U.y, U.x) + 2.3;
export const PIPE_DIR = new THREE.Vector2(Math.cos(PIPE_A), Math.sin(PIPE_A));
export const PIPE_M = new THREE.Vector2(LAKE.x, LAKE.z).addScaledVector(PIPE_DIR, lakeR(PIPE_A) * 1.0); // boca do cano

// ---------- Altura do terreno em qualquer ponto (x,z) ----------
export function groundHeight(x, z) {
  let h = fbm(x * 0.012, z * 0.012) * 6 + fbm(x * 0.05 + 10, z * 0.05) * 1.1;
  const d = Math.hypot(x, z);
  h += Math.pow(Math.max(0, d - 185) / 55, 2) * 10;               // morros na borda do mapa
  // achata em volta do laboratório
  const dx = Math.max(Math.abs(x) - LAB.w / 2, 0), dz = Math.max(Math.abs(z) - LAB.d / 2, 0);
  h = lerp(0, h, smoothstep(8, 26, Math.hypot(dx, dz)));
  // achata em volta da prefeitura
  h = lerp(0, h, smoothstep(4, 16, distToPref(x, z)));
  // achata a fazenda (o chão fica reto para a lavoura e vai subindo/descendo suave em volta)
  h = lerp(FAZENDA.y, h, smoothstep(0, 14, distToFazenda(x, z)));
  // suaviza a trilha
  h = lerp(h * 0.35, h, smoothstep(2, 12, distToPath(x, z)));
  // ---- Leste: lagoa, córrego e garimpo ----
  const dLagoa = Math.hypot(x - LAGOA.x, z - LAGOA.z);
  if (dLagoa < 140) {
    // a baixada em volta da lagoa vira um campo quase plano (sem buracos mais fundos que a água)
    const piso = h > 0 ? h : -0.4 * (1 - Math.exp(h / 0.4));
    h = lerp(piso, h, smoothstep(55, 80, dLagoa));
    // patamar do garimpo (terra aplainada pelas máquinas) e a cava (buraco que encheu de água)
    const dg = distGarimpo(x, z);
    h = lerp(GARIMPO.y, h, smoothstep(GARIMPO.r * 0.7, GARIMPO.r + 10, dg));
    h = lerp(h, CAVA.fundo, smoothstep(CAVA.r * 1.15, CAVA.r * 0.35, distCava(x, z)));
    // bacia da lagoa (igual à do lago)
    const lg = lagoaNorm(x, z);
    h *= smoothstep(1.0, 1.8, lg);
    h -= 3.0 * smoothstep(1.15, 0.5, lg);
    // córrego (depois da bacia, para a lagoa não "levantar" o leito perto da foz):
    // margens um pouco acima da água (só fora da lagoa) e o leito cavado no meio (só cava, nunca levanta)
    const c = infoCorrego(x, z);
    if (c.d < 10) {
      const nv = nivelCorrego(c.t);
      h = lerp(h, Math.max(h, nv + 0.35), (1 - smoothstep(5, 10, c.d)) * smoothstep(0.95, 1.2, lg));   // margens
      h = lerp(h, Math.min(h, nv - 0.45), 1 - smoothstep(2.0, 5.0, c.d));                             // leito
    }
  }
  // margem plana + bacia do lago
  const ld = lakeNorm(x, z);
  h *= smoothstep(1.0, 1.8, ld);
  h -= 3.2 * smoothstep(1.15, 0.5, ld);
  return h;
}
export function onPier(x, z) {
  const px = x - P0.x, pz = z - P0.y;
  const along = px * PIER_DIR.x + pz * PIER_DIR.y, across = px * PIER_PERP.x + pz * PIER_PERP.y;
  return along > -2.5 && along < 12.4 && Math.abs(across) < 1.25;
}
// Altura onde o personagem pisa (terreno + pisos construídos)
export function walkHeight(x, z) {
  if (Math.abs(x) < LAB.w / 2 && Math.abs(z) < LAB.d / 2) return FLOOR_Y;
  if (x > -21.6 && x < 21.6 && z > -12.6 && z < 21) return PLAZA_Y;
  if (onPier(x, z)) return PIER_Y;
  if (onTrapiche(x, z)) return TRAPICHE_Y;                // trapiche da Lagoa Dourada
  if (distToPref(x, z) === 0) return FLOOR_Y;            // piso da prefeitura
  if (onPrefWalk(x, z)) return PLAZA_Y;                  // calçada até a prefeitura
  return groundHeight(x, z);
}
