// Arquivo: vegetacao.js — árvores, arbustos, pedras, grama, flores e nuvens.
import * as THREE from 'three';
import { qualidade } from './qualidade.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene } from './cena.js';
import { std, circles, animated } from './construcao.js';
import { LAB, LAKE, WORLD_R, lakeR, lakeNorm, distToPath, onPier, groundHeight, P0, PIPE_M, PIPE_DIR, distToPref, onPrefWalk, distToFazenda, PONTO_MATA, lagoaNorm, distGarimpo, infoCorrego, onTrapiche, GARIMPO, VILA_LAGOA } from './mapa.js';
import { rand, rr, smoothstep, isTouch, mulberry32 } from './utils.js';

// =====================================================================
//  VEGETAÇÃO (árvores, arbustos, grama, flores, pedras)
// =====================================================================
export const grassTime = { value: 0 };

// Onde ficou cada planta e pedra. O natureza.js usa esta lista para pôr os
// modelos 3D novos (Quaternius) nos MESMOS lugares, sem sortear nada de novo.
// "malhas" guarda as versões simples (bolinhas), que continuam sendo usadas de longe.
export const vegetacao = { arvores: [], arbustos: [], pedras: [], flores: [], malhas: {} };
export function blobGeo(r, seed, amp = 0.2) {
  let g = new THREE.IcosahedronGeometry(r, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 2.1 + seed) * Math.sin(y * 1.7 + seed * 0.5) * Math.sin(z * 1.9) + 0.5 * Math.sin(x * 4.3 + y * 3.1 + z * 2.7 + seed);
    const s = 1 + amp * n; p.setXYZ(i, x * s, y * s * 0.85, z * s);
  }
  g.computeVertexNormals(); return g;
}
export function canSpawnTree(x, z) {
  const d = Math.hypot(x, z); if (d > WORLD_R + 20) return false;
  const dx = Math.max(Math.abs(x) - LAB.w / 2, 0), dz = Math.max(Math.abs(z) - LAB.d / 2, 0);
  if (Math.hypot(dx, dz) < 14 || (Math.abs(x) < 24 && z > 0 && z < 30)) return false;
  if (distToPath(x, z) < 4.5 || lakeNorm(x, z) < 1.35) return false;
  if (distToPref(x, z) < 9) return false;                 // clareira da prefeitura
  if (distToFazenda(x, z) < 5) return false;              // clareira da fazenda
  if (Math.hypot(x - PONTO_MATA.x, z - PONTO_MATA.z) < 13) return false;   // o fragmento de mata é desenhado em fazenda.js
  if (Math.hypot(x - (PIPE_M.x + PIPE_DIR.x * 8), z - (PIPE_M.y + PIPE_DIR.y * 8)) < 10) return false;
  // Lagoa Dourada, comunidade ribeirinha, córrego e garimpo (área degradada: sem árvores)
  if (lagoaNorm(x, z) < 1.3 || Math.hypot(x - VILA_LAGOA.x, z - VILA_LAGOA.z) < 13) return false;
  if (distGarimpo(x, z) < GARIMPO.r + 8 || infoCorrego(x, z).d < 4) return false;
  return true;
}
export function buildVegetation() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  // ---- Árvores folhosas ----
  const crown = mergeGeometries([blobGeo(1.6, 1).translate(0, 0, 0), blobGeo(1.2, 2).translate(1.1, -0.3, 0.4), blobGeo(1.25, 3).translate(-1, -0.25, -0.5), blobGeo(1.0, 4).translate(0.1, 0.8, -0.2)]);
  const trunkGeo = new THREE.CylinderGeometry(0.17, 0.3, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const N = 1100;
  const trunks = new THREE.InstancedMesh(trunkGeo, std('#6b4a2f', 0.95), N);
  const crowns = new THREE.InstancedMesh(crown, std('#ffffff', 0.85), N);
  let n = 0, tries = 0;
  while (n < N && tries < 30000) {
    tries++;
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (WORLD_R + 15);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!canSpawnTree(x, z)) continue;
    const dx = Math.max(Math.abs(x) - LAB.w / 2, 0), dz = Math.max(Math.abs(z) - LAB.d / 2, 0);
    if (rand() > smoothstep(12, 50, Math.hypot(dx, dz)) * 0.9 + 0.1) continue;   // clareira perto do lab
    const y = groundHeight(x, z), sc = rr(0.8, 1.5), tall = rr(2.6, 4.2), tilt = rr(0.85, 1.3);
    const giro = rr(0, 6.28);   // (sorteado na mesma ordem de antes)
    q.setFromAxisAngle(up, giro);
    // altura total da árvore simples (tronco + copa), para o modelo novo ficar do mesmo tamanho
    vegetacao.arvores.push({ x, y, z, giro, altura: (tall + 2.2) * sc, i: n });
    trunks.setMatrixAt(n, m4.compose(v.set(x, y - 0.2, z), q, s.set(sc, tall * sc, sc)));
    crowns.setMatrixAt(n, m4.compose(v.set(x, y + tall * sc + 0.6 * sc, z), q, s.set(sc, sc * tilt, sc)));
    // cor da copa simples (vista de longe): verde-oliva mais escuro, parecido com as folhas dos modelos novos
    // (mudar só os números não muda o sorteio: cada rr() continua gastando um número do gerador)
    crowns.setColorAt(n, new THREE.Color().setHSL(rr(0.21, 0.28), rr(0.5, 0.65), rr(0.22, 0.32)));
    circles.push({ x, z, r: 0.35 * sc });
    n++;
  }
  trunks.count = crowns.count = n;
  trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true;
  scene.add(trunks, crowns);
  vegetacao.malhas.troncos = trunks; vegetacao.malhas.copas = crowns;

  // ---- Palmeiras (REMOVIDAS a pedido do Wesley: não combinam com a mata do jogo) ----
  // O código continua aqui só para gastar os MESMOS números do gerador com semente
  // (senão todas as árvores, arbustos e a grama mudariam de lugar). Elas não entram
  // na cena e não têm colisão.
  const palmTrunk = new THREE.CylinderGeometry(0.22, 0.3, 1, 8); palmTrunk.translate(0, 0.5, 0);
  const leaves = [];
  for (let i = 0; i < 12; i++) {
    const l = new THREE.ConeGeometry(0.45, 3.2, 4); l.scale(1, 1, 0.12); l.rotateX(Math.PI / 2); l.translate(0, 0, 1.6);
    l.rotateX(rr(0.25, 0.7)); l.rotateY(i * Math.PI / 6 + rr(-0.1, 0.1)); leaves.push(l);
  }
  const fan = mergeGeometries(leaves.map(g => g.index ? g.toNonIndexed() : g));
  fan.computeVertexNormals();
  const PN = 18;
  const pT = new THREE.InstancedMesh(palmTrunk, std('#8a7a63', 0.95), PN);
  const pL = new THREE.InstancedMesh(fan, std('#5e9e3a', 0.8, 0, { side: THREE.DoubleSide }), PN);
  n = 0; tries = 0;
  while (n < PN && tries < 2000) {
    tries++;
    const a = rr(0, 6.28), f = rr(1.12, 1.5);
    const x = LAKE.x + Math.cos(a) * lakeR(a) * f, z = LAKE.z + Math.sin(a) * lakeR(a) * f;
    if (distToPath(x, z) < 4 || Math.hypot(x - P0.x, z - P0.y) < 6 || Math.hypot(x - PIPE_M.x, z - PIPE_M.y) < 8) continue;
    const y = groundHeight(x, z), hgt = rr(6, 9);
    q.setFromAxisAngle(up, rr(0, 6.28));
    pT.setMatrixAt(n, m4.compose(v.set(x, y - 0.2, z), q, s.set(1, hgt, 1)));
    pL.setMatrixAt(n, m4.compose(v.set(x, y + hgt - 0.3, z), q, s.set(1, 1, 1)));
    n++;
  }
  pT.count = pL.count = n;

  // ---- Arbustos ----
  const BN = 500;
  const bushes = new THREE.InstancedMesh(blobGeo(0.8, 7, 0.25), std('#ffffff', 0.9), BN);
  n = 0;
  while (n < BN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * WORLD_R, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!canSpawnTree(x, z) && !(lakeNorm(x, z) > 1.15 && lakeNorm(x, z) < 1.5 && !onPier(x, z) && distToPath(x, z) > 3)) continue;
    const sc = rr(0.6, 1.4);
    const giro = rr(0, 6.28);
    q.setFromAxisAngle(up, giro);
    vegetacao.arbustos.push({ x, y: groundHeight(x, z), z, giro, sc, i: n });
    bushes.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + 0.2 * sc, z), q, s.set(sc, sc * 0.8, sc)));
    bushes.setColorAt(n, new THREE.Color().setHSL(rr(0.22, 0.28), 0.55, rr(0.22, 0.3)));
    n++;
  }
  bushes.castShadow = bushes.receiveShadow = true; scene.add(bushes);
  vegetacao.malhas.arbustos = bushes;

  // ---- Pedras ----
  const RN = 170;
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.6, 0), std('#9a9d92', 0.9), RN);
  n = 0;
  while (n < RN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * WORLD_R, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!canSpawnTree(x, z)) continue;
    const sc = rr(0.4, 1.8);
    const e = new THREE.Euler(rr(0, 3), rr(0, 3), rr(0, 3));
    q.setFromEuler(e);
    vegetacao.pedras.push({ x, y: groundHeight(x, z), z, giro: e.y * 2, sc, i: n });
    rocks.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + 0.1, z), q, s.set(sc, sc * rr(0.5, 0.9), sc)));
    if (sc > 1) circles.push({ x, z, r: 0.5 * sc });
    n++;
  }
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
  vegetacao.malhas.pedras = rocks;

  // ---- Grama que balança com o vento ----
  const tuft = (() => {
    const parts = [];
    // 6 folhinhas finas e levemente inclinadas, com frente e verso (normal sempre para cima = sem lado escuro)
    for (let i = 0; i < 6; i++) {
      const g = new THREE.BufferGeometry();
      const lean = rr(0.05, 0.16), hgt = rr(0.32, 0.5);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.045, 0, 0, 0.045, 0, 0, 0, hgt, lean, 0.045, 0, 0, -0.045, 0, 0, 0, hgt, lean], 3));
      // cor da raiz (escura, quase a cor do chão) e da ponta (clara): o degradê vai de uma para a outra
      const R = [0.12, 0.28, 0.05], P = [0.62, 0.88, 0.26];
      g.setAttribute('color', new THREE.Float32BufferAttribute([...R, ...R, ...P, ...R, ...R, ...P], 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
      g.translate(rr(-0.12, 0.12), 0, rr(-0.12, 0.12));
      g.rotateY(i * Math.PI / 3 + rr(0, 0.5)); parts.push(g);
    }
    return mergeGeometries(parts);
  })();
  const grassMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  grassMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = grassTime;
    // VÉRTICE: balanço de cada tufo + "ondas" de vento que atravessam o campo
    sh.vertexShader = 'uniform float uTime;\nvarying float vRajada; varying float vAltura;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      // onda grande: anda na direção do vento (de sudoeste para nordeste), como rajadas num campo
      float onda = sin(dot(ip.xz, vec2(0.07, 0.05)) - uTime * 1.6);
      float rajada = smoothstep(0.2, 1.0, onda);
      // balanço pequeno de cada tufo (o que já existia), mais forte quando a rajada passa
      float sway = sin(uTime*1.8 + ip.x*0.35 + ip.z*0.27)*0.10 + sin(uTime*3.3 + ip.x*0.9)*0.035 + rajada * 0.16;
      transformed.x += sway * position.y; transformed.z += sway * 0.7 * position.y;
      vRajada = rajada; vAltura = clamp(position.y / 0.5, 0.0, 1.0);`);
    // FRAGMENTO: a ponta fica um pouco mais clara quando a rajada passa (brilho do vento na grama)
    sh.fragmentShader = 'varying float vRajada; varying float vAltura;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= 1.0 + vRajada * vAltura * 0.22;`);
  };

  // Sorteia um lugar para um tufo de grama usando o gerador "rnd".
  // Devolve true se o tufo foi posto. A ORDEM dos sorteios é a mesma de antes,
  // porque com o gerador do jogo (rand) isso decide onde fica tudo o que vem depois.
  function porTufo(malha, i, rnd) {
    const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 135, x = -25 + Math.cos(a) * r, z = 40 + Math.sin(a) * r;
    if (x > -21.8 && x < 21.8 && z > -12.8 && z < 21.2) return false;
    const ld = lakeNorm(x, z); if (ld < 1.03 || onPier(x, z)) return false;
    if (distToPref(x, z) < 0.3 || onPrefWalk(x, z)) return false;     // sem grama dentro da prefeitura e na calçada
    if (distToFazenda(x, z) < 1) return false;                        // sem grama dentro da fazenda (é terra de lavoura)
    if (lagoaNorm(x, z) < 1.03 || onTrapiche(x, z) || infoCorrego(x, z).d < 1.6 || distGarimpo(x, z) < GARIMPO.r + 3) return false;   // sem grama na água e no garimpo
    if (distToPath(x, z) < 1.4 && rnd() < 0.9) return false;
    const entre = (lo, hi) => lo + (hi - lo) * rnd();
    const sc = entre(0.7, 1.5);
    q.setFromAxisAngle(up, entre(0, 6.28));
    malha.setMatrixAt(i, m4.compose(v.set(x, groundHeight(x, z) - 0.03, z), q, s.set(sc, sc * entre(0.8, 1.4), sc)));
    // cor de cada tufo: verde vivo, variando um pouco entre amarelado e azulado
    malha.setColorAt(i, new THREE.Color().setHSL(entre(0.23, 0.30), 0.6, entre(0.72, 0.95)));
    return true;
  }

  const GN = isTouch ? 18000 : 34000;
  const grass = new THREE.InstancedMesh(tuft, grassMat, GN);
  n = 0;
  while (n < GN) { if (porTufo(grass, n, rand)) n++; }
  // No nível de gráficos mais leve, mostra só uma parte da grama (a ordem é aleatória,
  // então cortar o fim da lista tira tufos espalhados). Não mexe no gerador com semente.
  grass.count = Math.floor(GN * qualidade.grama);
  grass.receiveShadow = true; scene.add(grass);

  // Grama EXTRA (só no nível Alto): usa um gerador PRÓPRIO (semente 7),
  // então não muda a posição de nada do resto do mapa.
  const extra = Math.floor(GN * (qualidade.gramaExtra - 1));
  if (extra > 0) {
    const rnd2 = mulberry32(7);
    const grass2 = new THREE.InstancedMesh(tuft, grassMat, extra);
    for (let i = 0; i < extra;) { if (porTufo(grass2, i, rnd2)) i++; }
    grass2.receiveShadow = true; scene.add(grass2);
  }

  // ---- Flores ----
  const FN = 900;
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.08, 0), std('#ffffff', 0.6, 0, { emissive: '#222222' }), FN);
  const pal = ['#ffd43b', '#ffffff', '#cc5de8', '#ff8787', '#74c0fc'];
  n = 0;
  while (n < FN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * 130, x = -25 + Math.cos(a) * r, z = 40 + Math.sin(a) * r;
    if (x > -21.8 && x < 21.8 && z > -12.8 && z < 21.2) continue;
    if (lakeNorm(x, z) < 1.25 || distToPath(x, z) < 2) continue;
    if (distToPref(x, z) < 1 || onPrefWalk(x, z) || distToFazenda(x, z) < 1) continue;
    if (lagoaNorm(x, z) < 1.2 || infoCorrego(x, z).d < 2) continue;
    flowers.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + rr(0.25, 0.45), z), q.identity(), s.set(1, 1, 1)));
    flowers.setColorAt(n, new THREE.Color(pal[Math.floor(rand() * pal.length)]));
    vegetacao.flores.push({ x, y: groundHeight(x, z), z, i: n });
    n++;
  }
  scene.add(flowers);
  vegetacao.malhas.flores = flowers;

  // ---- Nuvens ----
  const cloudMat = std('#ffffff', 1, 0, { emissive: '#ffffff', emissiveIntensity: 0.35 });
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(6, 11), 1), cloudMat); b.position.set(rr(-14, 14), rr(-2, 3), rr(-6, 6)); b.scale.y = 0.6; c.add(b); }
    c.position.set(rr(-500, 500), rr(110, 150), rr(-500, 500)); clouds.push(c);
    // As nuvens agora são desenhadas no céu (cena.js). Estas continuam sendo criadas só para
    // não mudar a sequência do gerador aleatório, mas não entram na cena.
  }
}
