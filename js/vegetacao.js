// Arquivo: vegetacao.js — árvores, buritis, arbustos, pedras, grama, flores e nuvens.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene } from './cena.js';
import { std, circles, animated } from './construcao.js';
import { LAB, LAKE, WORLD_R, lakeR, lakeNorm, distToPath, onPier, groundHeight, P0, PIPE_M, PIPE_DIR, distToPref, onPrefWalk, distToFazenda, PONTO_MATA } from './mapa.js';
import { rand, rr, smoothstep, isTouch } from './utils.js';

// =====================================================================
//  VEGETAÇÃO (árvores, palmeiras buriti, arbustos, grama, flores, pedras)
// =====================================================================
export const grassTime = { value: 0 };
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
    q.setFromAxisAngle(up, rr(0, 6.28));
    trunks.setMatrixAt(n, m4.compose(v.set(x, y - 0.2, z), q, s.set(sc, tall * sc, sc)));
    crowns.setMatrixAt(n, m4.compose(v.set(x, y + tall * sc + 0.6 * sc, z), q, s.set(sc, sc * tilt, sc)));
    crowns.setColorAt(n, new THREE.Color().setHSL(rr(0.22, 0.32), rr(0.45, 0.65), rr(0.28, 0.42)));
    circles.push({ x, z, r: 0.35 * sc });
    n++;
  }
  trunks.count = crowns.count = n;
  trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true;
  scene.add(trunks, crowns);

  // ---- Buritis (palmeiras das veredas) perto do lago ----
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
    circles.push({ x, z, r: 0.35 });
    n++;
  }
  pT.count = pL.count = n; pT.castShadow = pL.castShadow = true;
  scene.add(pT, pL);

  // ---- Arbustos ----
  const BN = 500;
  const bushes = new THREE.InstancedMesh(blobGeo(0.8, 7, 0.25), std('#ffffff', 0.9), BN);
  n = 0;
  while (n < BN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * WORLD_R, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!canSpawnTree(x, z) && !(lakeNorm(x, z) > 1.15 && lakeNorm(x, z) < 1.5 && !onPier(x, z) && distToPath(x, z) > 3)) continue;
    const sc = rr(0.6, 1.4);
    q.setFromAxisAngle(up, rr(0, 6.28));
    bushes.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + 0.2 * sc, z), q, s.set(sc, sc * 0.8, sc)));
    bushes.setColorAt(n, new THREE.Color().setHSL(rr(0.24, 0.33), 0.55, rr(0.25, 0.36)));
    n++;
  }
  bushes.castShadow = bushes.receiveShadow = true; scene.add(bushes);

  // ---- Pedras ----
  const RN = 170;
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.6, 0), std('#9a9d92', 0.9), RN);
  n = 0;
  while (n < RN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * WORLD_R, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!canSpawnTree(x, z)) continue;
    const sc = rr(0.4, 1.8);
    q.setFromEuler(new THREE.Euler(rr(0, 3), rr(0, 3), rr(0, 3)));
    rocks.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + 0.1, z), q, s.set(sc, sc * rr(0.5, 0.9), sc)));
    if (sc > 1) circles.push({ x, z, r: 0.5 * sc });
    n++;
  }
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);

  // ---- Grama que balança com o vento ----
  const tuft = (() => {
    const parts = [];
    // 6 folhinhas finas e levemente inclinadas, com frente e verso (normal sempre para cima = sem lado escuro)
    for (let i = 0; i < 6; i++) {
      const g = new THREE.BufferGeometry();
      const lean = rr(0.05, 0.16), hgt = rr(0.32, 0.5);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.045, 0, 0, 0.045, 0, 0, 0, hgt, lean, 0.045, 0, 0, -0.045, 0, 0, 0, hgt, lean], 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute([0.2, 0.4, 0.1, 0.2, 0.4, 0.1, 0.62, 0.85, 0.3, 0.2, 0.4, 0.1, 0.2, 0.4, 0.1, 0.62, 0.85, 0.3], 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
      g.translate(rr(-0.12, 0.12), 0, rr(-0.12, 0.12));
      g.rotateY(i * Math.PI / 3 + rr(0, 0.5)); parts.push(g);
    }
    return mergeGeometries(parts);
  })();
  const grassMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  grassMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = grassTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float sway = sin(uTime*1.8 + ip.x*0.35 + ip.z*0.27)*0.13 + sin(uTime*3.3 + ip.x*0.9)*0.04;
      transformed.x += sway * position.y; transformed.z += sway * 0.6 * position.y;`);
  };
  const GN = isTouch ? 18000 : 34000;
  const grass = new THREE.InstancedMesh(tuft, grassMat, GN);
  n = 0;
  while (n < GN) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * 135, x = -25 + Math.cos(a) * r, z = 40 + Math.sin(a) * r;
    if (x > -21.8 && x < 21.8 && z > -12.8 && z < 21.2) continue;
    const ld = lakeNorm(x, z); if (ld < 1.03 || onPier(x, z)) continue;
    if (distToPref(x, z) < 0.3 || onPrefWalk(x, z)) continue;     // sem grama dentro da prefeitura e na calçada
    if (distToFazenda(x, z) < 1) continue;                        // sem grama dentro da fazenda (é terra de lavoura)
    if (distToPath(x, z) < 1.4 && rand() < 0.9) continue;
    const sc = rr(0.7, 1.5);
    q.setFromAxisAngle(up, rr(0, 6.28));
    grass.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) - 0.03, z), q, s.set(sc, sc * rr(0.8, 1.4), sc)));
    grass.setColorAt(n, new THREE.Color().setHSL(rr(0.2, 0.28), 0.5, rr(0.75, 1.0)));
    n++;
  }
  grass.receiveShadow = true; scene.add(grass);

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
    flowers.setMatrixAt(n, m4.compose(v.set(x, groundHeight(x, z) + rr(0.25, 0.45), z), q.identity(), s.set(1, 1, 1)));
    flowers.setColorAt(n, new THREE.Color(pal[Math.floor(rand() * pal.length)]));
    n++;
  }
  scene.add(flowers);

  // ---- Nuvens ----
  const cloudMat = std('#ffffff', 1, 0, { emissive: '#ffffff', emissiveIntensity: 0.35 });
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(6, 11), 1), cloudMat); b.position.set(rr(-14, 14), rr(-2, 3), rr(-6, 6)); b.scale.y = 0.6; c.add(b); }
    c.position.set(rr(-500, 500), rr(110, 150), rr(-500, 500)); scene.add(c); clouds.push(c);
  }
  animated.push(dt => clouds.forEach(c => { c.position.x += dt * 2.5; if (c.position.x > 520) c.position.x = -520; }));
}
