// Arquivo: lake.js — o lago eutrofizado, o píer, o cano de esgoto, os objetos
// da restauração e a "saúde" do lago (que muda o visual aos poucos).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene } from './cena.js';
import { animated, circles, std, addBox, addCyl, makeCanvas, toTex, woodTex, solarTex, boardTex, makePostBoard } from './construcao.js';
import { LAKE, WATER_Y, PIER_Y, lakeR, U, P0, PIER_DIR, PIER_PERP, PATH, PIPE_A, PIPE_DIR, PIPE_M, groundHeight, onPier } from './mapa.js';
import { rr, clamp, lerp, FONT } from './utils.js';
import { Q } from './estado.js';

// =====================================================================
//  LAGO EUTROFIZADO
// =====================================================================
export const waterTime = { value: 0 }, waterHealth = { value: 0 };
export const lakeFx = {};   // referências do lago que mudam conforme a saúde dele (preenchido em buildLake)
export function buildLake() {
  // ---- Água com algas (shader modificado) ----
  const geo = new THREE.CircleGeometry(LAKE.r * 1.35, 96); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: '#4a6a2a', roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.97, envMapIntensity: 0.1 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = waterTime; sh.uniforms.uHealth = waterHealth;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uTime; uniform float uHealth; varying vec3 vWPos;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(h2(i), h2(i+vec2(1,0)), u.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), u.x), u.y); }
      float fb(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*n2(p); p *= 2.1; a *= 0.5; } return s; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec2 q = vWPos.xz;
      float algae = fb(q*0.09 + vec2(uTime*0.010, -uTime*0.006));
      float fine  = fb(q*0.7 - uTime*0.02);
      float dist  = length(q - vec2(${LAKE.x.toFixed(1)}, ${LAKE.z.toFixed(1)}));
      float shore = smoothstep(${(LAKE.r * 0.5).toFixed(1)}, ${(LAKE.r * 1.0).toFixed(1)}, dist);   // mais algas perto da margem
      float scum  = clamp(smoothstep(0.47, 0.62, algae + fine*0.15) + shore*0.5*fine, 0.0, 1.0);
      vec3 murky  = vec3(0.035, 0.075, 0.02);
      vec3 green  = vec3(0.10, 0.20, 0.03);
      vec3 bright = vec3(0.36, 0.58, 0.06);
      diffuseColor.rgb = mix(murky, green, smoothstep(0.3, 0.7, algae));
      diffuseColor.rgb = mix(diffuseColor.rgb, bright * (0.8 + 0.4*fine), scum);
      // lago recuperado: água azul-esverdeada e limpa
      vec3 well = mix(vec3(0.02, 0.09, 0.11), vec3(0.05, 0.19, 0.19), fine);
      diffuseColor.rgb = mix(diffuseColor.rgb, well, uHealth);
      scum *= (1.0 - uHealth);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(mix(0.55, 0.12, uHealth), 0.95, scum);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      normal = normalize(normal + (1.0 - scum) * 0.06 * vec3(sin(q.x*1.7 + uTime*1.3) + sin(q.y*2.3 - uTime), 0.0, cos(q.y*1.9 + uTime*1.1)));`);
  };
  const water = new THREE.Mesh(geo, mat);
  water.position.set(LAKE.x, WATER_Y, LAKE.z); water.receiveShadow = true;
  scene.add(water);

  // ---- Tapetes de algas / lentilha-d'água ----
  const blob = new THREE.IcosahedronGeometry(1, 1);
  const algae = new THREE.InstancedMesh(blob, std('#8cbf2a', 0.95), 260);
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < 260; i++) {
    const a = rr(0, Math.PI * 2), f = Math.sqrt(rr(0.2, 0.86));
    v.set(LAKE.x + Math.cos(a) * lakeR(a) * f, WATER_Y + 0.01, LAKE.z + Math.sin(a) * lakeR(a) * f);
    const sz = rr(0.4, 1.6); s.set(sz, 0.03, sz * rr(0.6, 1.2));
    qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rr(0, 6.28));
    algae.setMatrixAt(i, m4.compose(v, qq, s));
    algae.setColorAt(i, new THREE.Color().setHSL(rr(0.2, 0.26), 0.6, rr(0.32, 0.45)));
  }
  algae.receiveShadow = true; scene.add(algae);

  // ---- Peixes mortos boiando (efeito da falta de oxigênio) ----
  const fishGeo = (() => {
    const body = new THREE.SphereGeometry(0.2, 12, 8); body.scale(1.8, 0.35, 0.6);
    const tail = new THREE.ConeGeometry(0.14, 0.25, 4); tail.rotateZ(Math.PI / 2); tail.scale(1, 0.3, 1); tail.translate(-0.45, 0, 0);
    return mergeGeometries([body, tail]);
  })();
  const fishMat = std('#d7dde0', 0.35, 0.4);
  const fishes = [];
  for (let i = 0; i < 7; i++) {
    const a = rr(-1.5, 1.5) + Math.atan2(U.y, U.x), f = rr(0.55, 0.85);
    const fm = new THREE.Mesh(fishGeo, fishMat);
    fm.position.set(LAKE.x + Math.cos(a) * lakeR(a) * f, WATER_Y + 0.04, LAKE.z + Math.sin(a) * lakeR(a) * f);
    fm.rotation.y = rr(0, 6.28); fm.castShadow = true; scene.add(fm); fishes.push(fm);
  }
  animated.push((dt, t) => fishes.forEach((f, i) => { f.position.y = WATER_Y + 0.04 + Math.sin(t * 1.3 + i) * 0.015; }));

  // ---- Bolhas (gás da decomposição) ----
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), std('#d9f0b0', 0.2, 0, { transparent: true, opacity: 0.7 }), 30);
  const bData = [];
  for (let i = 0; i < 30; i++) { const a = rr(0, 6.28), f = Math.sqrt(rr(0, 0.7)); bData.push({ x: LAKE.x + Math.cos(a) * lakeR(a) * f, z: LAKE.z + Math.sin(a) * lakeR(a) * f, ph: rr(0, 10), sp: rr(0.4, 0.9) }); }
  scene.add(bubbles);
  animated.push((dt, t) => {
    bData.forEach((b, i) => {
      const c = (t * b.sp + b.ph) % 3; const sc = c < 1 ? c : 0.0001;
      v.set(b.x, WATER_Y + 0.02, b.z); s.set(sc, sc * 0.7, sc); qq.identity();
      bubbles.setMatrixAt(i, m4.compose(v, qq, s));
    });
    bubbles.instanceMatrix.needsUpdate = true;
  });

  // ---- Taboas na margem ----
  const reedGeo = new THREE.CylinderGeometry(0.025, 0.035, 1.8, 5); reedGeo.translate(0, 0.9, 0);
  const headGeo = new THREE.CapsuleGeometry(0.06, 0.25, 2, 6); headGeo.translate(0, 1.75, 0);
  const reeds = new THREE.InstancedMesh(reedGeo, std('#5f8f2e', 0.9), 520);
  const heads = new THREE.InstancedMesh(headGeo, std('#6b4423', 0.9), 520);
  let n = 0;
  while (n < 520) {
    const a = rr(0, 6.28), f = rr(0.93, 1.1);
    const x = LAKE.x + Math.cos(a) * lakeR(a) * f, z = LAKE.z + Math.sin(a) * lakeR(a) * f;
    if (onPier(x, z) || onPier(x + 1.5, z) || Math.hypot(x - PIPE_M.x, z - PIPE_M.y) < 3) continue;
    const y = Math.max(groundHeight(x, z), WATER_Y - 0.3), sc = rr(0.7, 1.3);
    qq.setFromEuler(new THREE.Euler(rr(-0.12, 0.12), 0, rr(-0.12, 0.12)));
    m4.compose(v.set(x, y, z), qq, s.set(1, sc, 1));
    reeds.setMatrixAt(n, m4); heads.setMatrixAt(n, m4); n++;
  }
  reeds.castShadow = heads.castShadow = true; scene.add(reeds, heads);

  // ---- Píer de madeira com ponto de coleta ----
  const pier = new THREE.Group(); pier.position.set(P0.x, 0, P0.y); pier.rotation.y = Math.atan2(PIER_DIR.x, PIER_DIR.y);
  scene.add(pier);
  const plankMat = std('#ffffff', 0.85, 0, { map: woodTex });
  for (let z = -2.4; z < 12.3; z += 0.36) { const p = addBox(pier, 2.4, 0.08, 0.32, plankMat, rr(-0.03, 0.03), PIER_Y - 0.04, z); p.rotation.y = rr(-0.02, 0.02); }
  for (let z = -2; z <= 12; z += 2) for (const x of [-1.1, 1.1]) addCyl(pier, 0.1, 0.12, 2.4, std('#5c3d22', 0.9), x, PIER_Y - 1.2, z, 8);
  for (const x of [-1.15, 1.15]) { addBox(pier, 0.08, 0.08, 4, std('#7a5230', 0.9), x, PIER_Y + 0.9, 10); for (const z of [8.2, 10, 11.8]) addBox(pier, 0.08, 0.9, 0.08, std('#7a5230', 0.9), x, PIER_Y + 0.45, z); }
  addBox(pier, 2.4, 0.08, 0.08, std('#7a5230', 0.9), 0, PIER_Y + 0.9, 12.05);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: '#3bc9db', emissive: '#3bc9db', emissiveIntensity: 1.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, PIER_Y + 0.08, 10.6); pier.add(ring);
  animated.push((dt, t) => { ring.scale.setScalar(1 + Math.sin(t * 2.5) * 0.08); ring.material.emissiveIntensity = 1.2 + Math.sin(t * 2.5) * 0.6; });
  for (const z of [8.2, 10, 11.8]) for (const x of [-1.15, 1.15]) { const w = new THREE.Vector2(x, z).rotateAround(new THREE.Vector2(), -pier.rotation.y); circles.push({ x: P0.x + w.x, z: P0.y + w.y, r: 0.12 }); }

  // Placa de monitoramento da água
  const monTex = boardTex('LAGO DA MATA', ['Oxigênio dissolvido: BAIXO', 'Algas e cianobactérias: EXCESSO', 'Nitrogênio e fósforo: ALTOS', 'Situação: EUTROFIZADO ⚠'], { accent: '#d9480f', size: 50 });
  const bp = P0.clone().addScaledVector(U, 3).addScaledVector(PIER_PERP, 3);
  const monBoard = makePostBoard(monTex, 2.2, 1.375, bp.x, bp.y, Math.atan2(U.x, U.y));
  const colTex = boardTex('PONTO DE COLETA', ['Amostras de água', 'para o laboratório'], { accent: '#1098ad', w: 800, h: 420, size: 54 });
  const cp = P0.clone().addScaledVector(U, 3).addScaledVector(PIER_PERP, -2.6);
  makePostBoard(colTex, 1.6, 0.84, cp.x, cp.y, Math.atan2(U.x, U.y));

  // ---- Cano de esgoto (uma das causas) ----
  const pipe = new THREE.Group(); pipe.position.set(PIPE_M.x, 0, PIPE_M.y); pipe.rotation.y = Math.atan2(PIPE_DIR.x, PIPE_DIR.y);
  scene.add(pipe);
  const concrete = std('#8d9290', 0.9);
  const tube = addCyl(pipe, 0.4, 0.4, 9, concrete, 0, 0.1, 4.5, 18); tube.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), std('#5b605e', 0.8)); rim.position.set(0, 0.1, 0); pipe.add(rim);
  addBox(pipe, 2, 1.5, 0.5, concrete, 0, -0.1, 0.6);
  const flow = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 1.6), std('#6b5530', 0.3, 0, { transparent: true, opacity: 0.85 }));
  flow.rotation.x = -Math.PI / 2 + 0.55; flow.position.set(0, -0.25, -0.65); pipe.add(flow);
  const [pc, pg] = makeCanvas(256, 256);
  const grd = pg.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, 'rgba(110,85,45,0.85)'); grd.addColorStop(1, 'rgba(110,85,45,0)');
  pg.fillStyle = grd; pg.fillRect(0, 0, 256, 256);
  const plume = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshStandardMaterial({ map: toTex(pc), transparent: true, depthWrite: false, roughness: 0.4 }));
  plume.rotation.x = -Math.PI / 2; plume.position.set(0, WATER_Y + 0.03, -4.2); pipe.add(plume);
  const foamMat = std('#f1f3e8', 0.9);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(0.15, 0.35), 1), foamMat); f.scale.y = 0.4; f.position.set(rr(-1.2, 1.2), WATER_Y + 0.04, rr(-3, -0.8)); pipe.add(f); }
  // Sacos de adubo abandonados (outra causa: nutrientes)
  const sackTex = (() => {
    const [c, g] = makeCanvas(256, 160); g.fillStyle = '#f3f0e4'; g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#2b8a3e'; g.fillRect(0, 0, 256, 40); g.fillStyle = '#2b8a3e'; g.font = `700 54px ${FONT}`; g.textAlign = 'center'; g.fillText('ADUBO', 128, 100); g.font = `600 32px ${FONT}`; g.fillText('N-P-K', 128, 140);
    return toTex(c);
  })();
  const sackMat = std('#ffffff', 0.9, 0, { map: sackTex }), sacks = [];
  [[0, 0, 0], [0.95, 0, 0.2], [0.45, 0.36, 0.1], [-0.9, 0, 0.6]].forEach(([x, y, r]) => { const sb = addBox(pipe, 0.9, 0.36, 0.6, sackMat, x - 2.5, groundHeight(PIPE_M.x + PIPE_DIR.x * 10, PIPE_M.y + PIPE_DIR.y * 10) + 0.18 + y, 10); sb.rotation.y = r; sacks.push(sb); });
  const sp = PIPE_M.clone().addScaledVector(PIPE_DIR, 4).addScaledVector(new THREE.Vector2(-PIPE_DIR.y, PIPE_DIR.x), 2.5);
  makePostBoard(boardTex('⚠ ATENÇÃO', ['Despejo irregular', 'de esgoto no lago'], { accent: '#c92a2a', w: 800, h: 420, size: 56 }), 1.6, 0.84, sp.x, sp.y, Math.atan2(-PIPE_DIR.x, -PIPE_DIR.y));
  for (let i = 0; i <= 9; i += 1.5) circles.push({ x: PIPE_M.x + PIPE_DIR.x * i, z: PIPE_M.y + PIPE_DIR.y * i, r: 0.7 });

  // Placa na trilha (direções)
  const mid = PATH[20], dirTex = boardTex('TRILHA', ['↑ Lago da Mata — 50 m', '↓ Estação Bioma — 50 m'], { accent: '#5c3d22', w: 900, h: 420, size: 54 });
  makePostBoard(dirTex, 1.8, 0.84, mid.x + 3, mid.y, Math.atan2(-1, 0.25));

  // =============== OBJETOS DA RESTAURAÇÃO (aparecem durante a missão) ===============
  // Biofiltro no cano + ilha flutuante de plantas (wetland)
  const bio = new THREE.Group(); bio.visible = false; pipe.add(bio);
  addBox(bio, 1.5, 1.3, 1.1, std('#2b8a3e', 0.7), 0, 0.15, 0.2);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(0.2, 0.35), 1), std('#69db7c', 0.8)); b.position.set(rr(-0.6, 0.6), 0.9, rr(-0.3, 0.6)); b.castShadow = true; bio.add(b); }
  const isl = new THREE.Group(); isl.position.set(0, WATER_Y + 0.02, -4.2); bio.add(isl);
  addCyl(isl, 1.9, 2.0, 0.18, std('#8a6a3d', 0.95), 0, 0, 0, 24);
  for (let i = 0; i < 30; i++) { const a = rr(0, 6.28), r = rr(0, 1.7), h = rr(0.6, 1.4); addCyl(isl, 0.03, 0.04, h, std(i % 4 ? '#5f9e2e' : '#94d82d', 0.8), Math.cos(a) * r, h / 2, Math.sin(a) * r, 5); }
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), std(i % 2 ? '#e599f7' : '#ffffff', 0.6)); const a = rr(0, 6.28); f.position.set(Math.cos(a) * 1.2, 1.1, Math.sin(a) * 1.2); isl.add(f); }

  // Aerador solar flutuante ao lado do fim do píer
  const pierWorld = (lx, lz) => new THREE.Vector2(P0.x + PIER_DIR.x * lz + PIER_DIR.y * lx, P0.y + PIER_DIR.y * lz - PIER_DIR.x * lx);
  const aer = new THREE.Group(); const ap = pierWorld(-3.8, 10.5); aer.position.set(ap.x, WATER_Y, ap.y); aer.visible = false; scene.add(aer);
  addCyl(aer, 0.9, 0.95, 0.25, std('#ffd43b', 0.5), 0, 0.08, 0, 24);
  addCyl(aer, 0.25, 0.25, 0.35, std('#495057', 0.4, 0.5), 0, 0.3, 0, 14);
  addCyl(aer, 0.04, 0.04, 1.2, std('#adb5bd', 0.3, 0.7), 0.55, 0.7, 0, 6);
  const sp2 = addBox(aer, 0.9, 0.04, 0.6, std('#ffffff', 0.25, 0.5, { map: solarTex }), 0.55, 1.32, 0); sp2.rotation.z = 0.4;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), std('#c5f6fa', 0.1, 0, { transparent: true, opacity: 0.8 }), 70);
  aer.add(drops);
  const dm = new THREE.Matrix4(), dv = new THREE.Vector3();
  animated.push((dt, t) => {
    if (!aer.visible) return;
    for (let i = 0; i < 70; i++) {
      const ph = (t * 0.8 + i / 70) % 1, a = i * 2.39;
      dv.set(Math.cos(a) * ph * 1.4, 0.4 + 2.4 * ph * (1 - ph), Math.sin(a) * ph * 1.4);
      drops.setMatrixAt(i, dm.makeTranslation(dv.x, dv.y, dv.z));
    }
    drops.instanceMatrix.needsUpdate = true;
  });

  // Covas para a mata ciliar (6 mudas perto de onde o adubo escorre)
  const spots = [];
  for (const off of [-0.6, -0.45, -0.3, 0.3, 0.45, 0.6]) {
    const a = PIPE_A + off, r = lakeR(a) * 1.22;
    const x = LAKE.x + Math.cos(a) * r, z = LAKE.z + Math.sin(a) * r, y = groundHeight(x, z);
    const mark = new THREE.Group(); mark.position.set(x, y, z); mark.visible = false; scene.add(mark);
    addCyl(mark, 0.5, 0.55, 0.1, std('#5c4024', 1), 0, 0.03, 0, 14);
    addCyl(mark, 0.025, 0.025, 1.1, std('#c8a46b', 0.9), 0.3, 0.55, 0, 5);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), std('#ffd43b', 0.6, 0, { side: THREE.DoubleSide, emissive: '#ffd43b', emissiveIntensity: 0.4 })); flag.position.set(0.45, 1.0, 0); mark.add(flag);
    const sap = new THREE.Group(); sap.position.set(x, y, z); sap.scale.setScalar(0.001); sap.visible = false; scene.add(sap);
    addCyl(sap, 0.06, 0.1, 1.6, std('#6b4a2f', 0.9), 0, 0.8, 0, 6);
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), std('#51cf66', 0.8)); leaf.position.y = 1.9; leaf.scale.y = 0.85; leaf.castShadow = true; sap.add(leaf);
    spots.push({ x, z, mark, sap, done: false, grow: 0 });
  }
  animated.push(dt => spots.forEach(s => { if (s.done && s.grow < 1) { s.grow = Math.min(1, s.grow + dt * 0.6); const e = 1 - Math.pow(1 - s.grow, 3); s.sap.scale.setScalar(0.15 + e * 0.95); } }));

  // Peixes vivos que pulam quando o lago melhora
  const live = [];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(fishGeo, std(i % 2 ? '#ff922b' : '#adb5bd', 0.35, 0.3)); f.visible = false; scene.add(f);
    const a = rr(0, 6.28), rf = rr(0.2, 0.6);
    live.push({ m: f, x: LAKE.x + Math.cos(a) * LAKE.r * rf, z: LAKE.z + Math.sin(a) * LAKE.r * rf, dir: rr(0, 6.28), t: rr(0, 4) });
  }

  Object.assign(lakeFx, { waterMat: mat, algae, fishes, bubbles, plume, flow, bio, aer, spots, sacks, monBoard, live, ring: pierWorld(0, 10.6), aerPos: ap });
}

// =====================================================================
//  SAÚDE DO LAGO (tudo muda conforme a restauração avança)
// =====================================================================
// Quanto o lago deve melhorar com o que já foi feito (0 a 1)
export const healthTarget = () => (Q.filter ? 0.34 : 0) + Q.plants / 6 * 0.33 + (Q.aerator ? 0.33 : 0);
export function updateLakeHealth(dt, t) {
  Q.health += clamp(healthTarget() - Q.health, -dt * 0.12, dt * 0.12);
  const h = Q.health, L = lakeFx;
  waterHealth.value = h;
  L.waterMat.envMapIntensity = lerp(0.1, 0.7, h);
  L.algae.count = Math.round(260 * Math.pow(1 - h, 1.6));
  L.bubbles.count = Math.round(30 * (1 - h));
  L.plume.material.opacity = Q.filter ? Math.max(0, L.plume.material.opacity - dt * 0.2) : 1;
  L.fishes.forEach(f => { f.visible = h < 0.45; });
  L.live.forEach(f => {
    if (h < 0.6) { f.m.visible = false; return; }
    f.t += dt;
    const k = f.t % 4;          // pula a cada 4 segundos
    if (k < 0.9) {
      const u = k / 0.9; f.m.visible = true;
      f.m.position.set(f.x + Math.sin(f.dir) * (u - 0.5) * 1.6, WATER_Y + Math.sin(Math.PI * u) * 0.9, f.z + Math.cos(f.dir) * (u - 0.5) * 1.6);
      f.m.rotation.set(0, f.dir - Math.PI / 2, (0.5 - u) * 2.2);
    } else { f.m.visible = false; if (k > 3.9) { f.dir = rr(0, 6.28); } }
  });
}
