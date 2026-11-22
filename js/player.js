// Arquivo: player.js — o personagem: modelo 3D, movimento, colisões e a câmera que o segue.
import * as THREE from 'three';
import { scene, camera, sky, sun, SUN_DIR } from './cena.js';
import { colliders, circles, camBlockers } from './construcao.js';
import { criarBoneco, CORES_BIOLOGO } from './boneco.js';
import { LAB, PLAZA_Y, WATER_Y, WORLD_R, groundHeight, onPier, walkHeight } from './mapa.js';
import { clamp } from './utils.js';
import { keys, joy, input, cam } from './estado.js';
import { showToast } from './interface.js';

// =====================================================================
//  PERSONAGEM (o Biólogo, pesquisador de campo)
// =====================================================================
export const player = { pos: new THREE.Vector3(0, PLAZA_Y, 27), vel: new THREE.Vector3(), vy: 0, onGround: true, yaw: Math.PI, phase: 0 };
export function buildPlayer() {
  const rig = criarBoneco(CORES_BIOLOGO);   // o Biólogo: boné, óculos, barba, coque, mochila verde... (veja boneco.js)
  scene.add(rig.g);
  return rig;
}

// =====================================================================
//  LÓGICA: movimento, colisão, porta, câmera
// =====================================================================
export const PR = 0.42; // raio do jogador
export function blockedByWorld(x, z) {
  if (Math.hypot(x, z) > WORLD_R) return 'borda';
  if (!onPier(x, z) && groundHeight(x, z) < WATER_Y - 0.45 && !(Math.abs(x) < 22 && z > -13 && z < 21)) return 'agua';
  return null;
}
let waterWarnCD = 0;   // espera entre um aviso de "água poluída" e outro
export function tickWaterWarn(dt) { waterWarnCD -= dt; }
export function resolveCollisions(p) {
  for (const c of colliders) {
    if (c.enabled && !c.enabled()) continue;
    const cx = clamp(p.x, c.minX, c.maxX), cz = clamp(p.z, c.minZ, c.maxZ);
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < PR) {
      if (d > 1e-5) { p.x = cx + dx / d * PR; p.z = cz + dz / d * PR; }
      else { // dentro da caixa: empurra pelo lado mais próximo
        const opts = [[c.minX - PR - p.x, 0], [c.maxX + PR - p.x, 0], [0, c.minZ - PR - p.z], [0, c.maxZ + PR - p.z]];
        opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1])); p.x += opts[0][0]; p.z += opts[0][1];
      }
    }
  }
  for (const c of circles) {
    const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > 3 || Math.abs(dz) > 3) continue;
    const d = Math.hypot(dx, dz), min = PR + c.r;
    if (d < min && d > 1e-5) { p.x = c.x + dx / d * min; p.z = c.z + dz / d * min; }
  }
}
export function angleLerp(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; }

export function updatePlayer(dt, rig) {
  let ix = 0, iz = 0;
  if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  ix += joy.x; iz -= joy.y;
  const L = Math.hypot(ix, iz); if (L > 1) { ix /= L; iz /= L; }
  const run = keys.ShiftLeft || keys.ShiftRight || input.runToggle;
  const speed = run ? 8.5 : 4.6;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  const tx = (rx * ix + fx * iz) * speed, tz = (rz * ix + fz * iz) * speed;
  const k = 1 - Math.exp(-12 * dt);
  player.vel.x += (tx - player.vel.x) * k; player.vel.z += (tz - player.vel.z) * k;

  // tenta andar; se bater na água/borda, desliza num eixo só
  const p = player.pos, nx = p.x + player.vel.x * dt, nz = p.z + player.vel.z * dt;
  let why = blockedByWorld(nx, nz);
  if (!why) { p.x = nx; p.z = nz; }
  else if (!blockedByWorld(nx, p.z)) p.x = nx;
  else if (!blockedByWorld(p.x, nz)) p.z = nz;
  if (why === 'agua' && waterWarnCD <= 0) { showToast('🤢 Água poluída demais para entrar!'); waterWarnCD = 3; }
  resolveCollisions(p);

  // pulo e gravidade
  const gh = walkHeight(p.x, p.z);
  if (input.jumpQueued && player.onGround) { player.vy = 7.2; player.onGround = false; }
  input.jumpQueued = false;
  player.vy -= 22 * dt; p.y += player.vy * dt;
  if (p.y <= gh || (player.onGround && p.y - gh < 0.45 && player.vy <= 0)) { p.y = gh; player.vy = 0; player.onGround = true; }
  else player.onGround = false;

  // virar o personagem para onde anda + animação
  const sp = Math.hypot(player.vel.x, player.vel.z);
  if (sp > 0.3) player.yaw = angleLerp(player.yaw, Math.atan2(player.vel.x, player.vel.z), 1 - Math.exp(-12 * dt));
  rig.g.position.copy(p); rig.g.rotation.y = player.yaw;
  player.phase += dt * sp * 2.1;
  const sw = Math.min(1, sp / 4.6) * 0.75;
  if (player.onGround) {
    rig.legL.rotation.x = Math.sin(player.phase) * sw; rig.legR.rotation.x = -Math.sin(player.phase) * sw;
    rig.armL.rotation.x = -Math.sin(player.phase) * sw * 0.9; rig.armR.rotation.x = Math.sin(player.phase) * sw * 0.9;
  } else { rig.legL.rotation.x = 0.5; rig.legR.rotation.x = -0.3; rig.armL.rotation.x = rig.armR.rotation.x = -2.4; }
  rig.armL.rotation.z = 0.08; rig.armR.rotation.z = -0.08;
  const bob = player.onGround ? Math.abs(Math.sin(player.phase)) * 0.05 * sw + Math.sin(performance.now() * 0.002) * 0.01 : 0;
  rig.g.children.forEach(c => { if (c.userData.baseY === undefined) c.userData.baseY = c.position.y; c.position.y = c.userData.baseY + bob; });
}

// ---------- Câmera em terceira pessoa ----------
export const ray = new THREE.Raycaster(), camTarget = new THREE.Vector3(), camDir = new THREE.Vector3();
export function updateCamera(dt) {
  cam.dist += (cam.distTarget - cam.dist) * (1 - Math.exp(-8 * dt));
  camTarget.copy(player.pos).add(new THREE.Vector3(0, 1.55, 0));
  camDir.set(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  ray.set(camTarget, camDir); ray.far = cam.dist;
  const hit = ray.intersectObjects(camBlockers, false)[0];
  const want = hit ? Math.max(0.8, hit.distance - 0.3) : cam.dist;
  cam.distNow = want < cam.distNow ? want : cam.distNow + (want - cam.distNow) * (1 - Math.exp(-4 * dt));
  camera.position.copy(camTarget).addScaledVector(camDir, cam.distNow);
  const inside = Math.abs(camera.position.x) < LAB.w / 2 && Math.abs(camera.position.z) < LAB.d / 2;
  if (!inside) camera.position.y = Math.max(camera.position.y, walkHeight(camera.position.x, camera.position.z) + 0.4);
  camera.lookAt(camTarget);
  sky.position.copy(camera.position);
  // o sol acompanha o jogador (sombras sempre por perto)
  sun.position.copy(player.pos).addScaledVector(SUN_DIR, 140); sun.target.position.copy(player.pos);
}
