// Arquivo: lab.js — o prédio do laboratório (por fora e por dentro) e a porta automática.
import * as THREE from 'three';
import { scene } from './cena.js';
import {
  animated, circles, std, addBox, addCyl, addCollider, makeCanvas, toTex, speckle, roundRect,
  wallMat, tileTex, concreteTex, woodTex, solarTex, corrugTex, boardTex,
} from './construcao.js';
import { LAB, FLOOR_Y, PLAZA_Y } from './mapa.js';
import { rr, clamp, FONT } from './utils.js';
import { player } from './player.js';
import { doorSound } from './audio.js';

// =====================================================================
//  LABORATÓRIO "ESTAÇÃO BIOMA"
// =====================================================================
export const door = { open: 0, target: 0, closeTimer: 0, panels: [], led: null, buttons: [] };
export const labFx = {};   // referências de objetos do lab que mudam durante a missão

export function buildLab() {
  const g = new THREE.Group(); scene.add(g);
  const W = LAB.w, D = LAB.d, H = LAB.h, T = 0.4, hw = W / 2, hd = D / 2;
  const dark = std('#353e43', 0.7), teal = std('#16a08a', 0.45), frame = std('#5f6b73', 0.35, 0.7);
  const glass = std('#a8d8ef', 0.05, 0.2, { transparent: true, opacity: 0.25, depthWrite: false });
  const winGlass = std('#1e3b4e', 0.08, 0.6, { emissive: '#0b2533' });

  // Calçada/praça de concreto (passa por baixo do prédio também)
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(43.2, 0.6, 33.6), std('#ffffff', 0.9, 0, { map: concreteTex }));
  plaza.position.set(0, PLAZA_Y - 0.3, 4.2); plaza.receiveShadow = true; g.add(plaza);

  // ---- Paredes externas ----
  addBox(g, W, H, T, wallMat(W, H), 0, H / 2, -hd + T / 2, { block: true });          // fundo
  addBox(g, T, H, D, wallMat(D, H), -hw + T / 2, H / 2, 0, { block: true });           // esquerda (oeste)
  addBox(g, T, H, D, wallMat(D, H), hw - T / 2, H / 2, 0, { block: true });            // direita (leste)
  const fs = hw - 7;                                                                   // partes sólidas da frente
  addBox(g, fs, H, T, wallMat(fs, H), -(7 + fs / 2), H / 2, hd - T / 2, { block: true });
  addBox(g, fs, H, T, wallMat(fs, H), (7 + fs / 2), H / 2, hd - T / 2, { block: true });
  addBox(g, 14, 2, T, wallMat(14, 2), 0, 8, hd - T / 2, { block: true });              // faixa acima do vidro
  addBox(g, W, 0.4, D, std('#e9ecea', 0.8), 0, H - 0.2, 0, { block: true });           // laje/teto
  addCollider(-hw, hw, -hd, -hd + T); addCollider(-hw, -hw + T, -hd, hd); addCollider(hw - T, hw, -hd, hd);
  addCollider(-hw, -7, hd - T, hd); addCollider(7, hw, hd - T, hd);

  // Platibanda (borda escura do telhado)
  addBox(g, W + 0.3, 0.7, 0.5, dark, 0, H + 0.3, -hd + 0.1, { block: true });
  addBox(g, W + 0.3, 0.7, 0.5, dark, 0, H + 0.3, hd - 0.1, { block: true });
  addBox(g, 0.5, 0.7, D, dark, -hw + 0.1, H + 0.3, 0, { block: true });
  addBox(g, 0.5, 0.7, D, dark, hw - 0.1, H + 0.3, 0, { block: true });

  // Rodapé escuro e faixa verde-azulada (identidade visual)
  for (const [y, hgt, m] of [[0.5, 1.0, dark], [6.95, 0.5, teal]]) {
    addBox(g, W + 0.16, hgt, 0.08, m, 0, y, -hd - 0.04);
    addBox(g, 0.08, hgt, D + 0.16, m, -hw - 0.04, y, 0);
    addBox(g, 0.08, hgt, D + 0.16, m, hw + 0.04, y, 0);
    addBox(g, fs + 0.08, hgt, 0.08, m, -(7 + fs / 2) - 0.04, y, hd + 0.04);
    addBox(g, fs + 0.08, hgt, 0.08, m, (7 + fs / 2) + 0.04, y, hd + 0.04);
  }

  // Janelas em fita (decorativas)
  for (let x = -15; x <= 15; x += 6) { addBox(g, 4, 1.8, 0.1, winGlass, x, 4.3, -hd - 0.05); addBox(g, 4.2, 0.12, 0.25, frame, x, 3.35, -hd - 0.1); }
  for (const z of [-7, 0]) { addBox(g, 0.1, 1.8, 4, winGlass, -hw - 0.05, 4.3, z); addBox(g, 0.25, 0.12, 4.2, frame, -hw - 0.1, 3.35, z); }
  addBox(g, 0.1, 1.8, 4, winGlass, hw + 0.05, 4.3, -7); addBox(g, 0.25, 0.12, 4.2, frame, hw + 0.1, 3.35, -7);

  // ---- Fachada de vidro + portas ----
  const gz = hd - 0.2;
  addBox(g, 5, 7, 0.05, glass, -4.5, 3.5, gz, { cast: false });
  addBox(g, 5, 7, 0.05, glass, 4.5, 3.5, gz, { cast: false });
  addBox(g, 4, 3.8, 0.05, glass, 0, 5.1, gz, { cast: false });
  for (const x of [-7, -4.5, -2, 2, 4.5, 7]) addBox(g, 0.14, 7, 0.25, frame, x, 3.5, gz);
  for (const y of [0.07, 3.2, 7]) addBox(g, 14.1, 0.14, 0.25, frame, 0, y, gz);
  addCollider(-7, -2, hd - 0.45, hd); addCollider(2, 7, hd - 0.45, hd);

  // Portas de correr estilo hospital (duas folhas)
  const frosted = std('#e4f4fb', 0.3, 0.1, { transparent: true, opacity: 0.5, depthWrite: false });
  const band = std('#f4fbff', 0.5, 0, { transparent: true, opacity: 0.88 });
  for (const side of [-1, 1]) {
    const p = new THREE.Group();
    addBox(p, 1.96, 3.06, 0.05, frosted, 0, 1.55, 0, { cast: false });
    addBox(p, 1.9, 0.55, 0.06, band, 0, 1.15, 0, { cast: false });                 // faixa jateada
    addBox(p, 1.9, 0.12, 0.065, teal, 0, 1.58, 0);                                  // faixa colorida
    addBox(p, 0.06, 3.1, 0.08, frame, -0.98, 1.55, 0); addBox(p, 0.06, 3.1, 0.08, frame, 0.98, 1.55, 0);
    addBox(p, 2.0, 0.08, 0.08, frame, 0, 3.08, 0); addBox(p, 2.0, 0.1, 0.08, frame, 0, 0.05, 0);
    addBox(p, 0.05, 0.9, 0.1, frame, -side * 0.85, 1.2, 0.03);                      // puxador
    p.position.set(side, 0.02, hd - 0.48);
    p.userData.side = side;
    g.add(p); door.panels.push(p);
  }
  addBox(g, 8.2, 0.35, 0.3, frame, 0, 3.32, hd - 0.48);                             // trilho interno
  addCollider(-2, 2, hd - 0.7, hd - 0.2, () => door.open < 0.75);                  // porta bloqueia quando fechada
  // Sensor acima da porta com LED (vermelho = fechada, verde = aberta)
  addBox(g, 0.8, 0.18, 0.16, dark, 0, 3.45, hd - 0.02);
  door.led = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), new THREE.MeshStandardMaterial({ color: '#ff3b30', emissive: '#ff3b30', emissiveIntensity: 2 }));
  door.led.position.set(0.25, 3.45, hd + 0.07); g.add(door.led);

  // Botões de acionamento (o "comando" para abrir): um fora, um dentro
  const btnTex = (() => {
    const [c, gg] = makeCanvas(128, 128);
    gg.fillStyle = '#1c6fd1'; roundRect(gg, 4, 4, 120, 120, 18); gg.fill();
    gg.strokeStyle = '#fff'; gg.lineWidth = 8; gg.strokeRect(34, 30, 60, 70);
    gg.beginPath(); gg.moveTo(64, 30); gg.lineTo(64, 100); gg.stroke();
    gg.fillStyle = '#fff'; gg.beginPath(); gg.moveTo(20, 64); gg.lineTo(30, 56); gg.lineTo(30, 72); gg.fill();
    gg.beginPath(); gg.moveTo(108, 64); gg.lineTo(98, 56); gg.lineTo(98, 72); gg.fill();
    return toTex(c);
  })();
  for (const [x, z, ry] of [[-3.2, hd + 1.3, 0], [3.2, hd - 1.6, Math.PI]]) {
    const b = new THREE.Group();
    addBox(b, 0.22, 1.1, 0.22, std('#c9d0d3', 0.4, 0.6), 0, 0.55, 0);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: btnTex, emissive: '#1c6fd1', emissiveIntensity: 0.15 }));
    plate.position.set(0, 1.0, 0.115); b.add(plate);
    b.position.set(x, PLAZA_Y, z); b.rotation.y = ry; g.add(b);
    door.buttons.push(plate);
    addCollider(x - 0.2, x + 0.2, z - 0.2, z + 0.2);
  }

  // ---- Marquise com jardim no topo ----
  addBox(g, 16, 0.35, 6, std('#f2f4f3', 0.6), 0, 4.8, hd + 3, { block: true });
  addBox(g, 15.6, 0.25, 5.6, std('#5c9e3a', 1), 0, 5.08, hd + 3);
  const leafMat = std('#4f9a35', 0.9);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(0.35, 0.6), 1), leafMat); s.position.set(rr(-7, 7), 5.3, hd + rr(0.8, 5.2)); s.castShadow = true; g.add(s); }
  for (const x of [-7.3, 7.3]) { addCyl(g, 0.2, 0.22, 4.7, std('#f2f4f3', 0.5), x, 2.35, hd + 5.4); addCollider(x - 0.3, x + 0.3, hd + 5.1, hd + 5.7); }
  const downMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff3d6', emissiveIntensity: 1.5 });
  for (let x = -6; x <= 6; x += 3) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), downMat); l.rotation.x = Math.PI / 2; l.position.set(x, 4.62, hd + 3); g.add(l); }

  // ---- Letreiro e logotipo ----
  const signTex = (() => {
    const [c, gg] = makeCanvas(2048, 256);
    gg.textBaseline = 'middle';
    gg.fillStyle = '#24302b'; gg.font = `700 150px ${FONT}`; gg.fillText('ESTAÇÃO BIOMA', 20, 100);
    const w = gg.measureText('ESTAÇÃO BIOMA').width;
    gg.fillStyle = '#16a08a'; gg.font = `600 56px ${FONT}`; gg.fillText('LABORATÓRIO DE CIÊNCIAS DE CAMPO', 26, 215);
    gg.fillStyle = '#16a08a'; gg.beginPath(); gg.arc(w + 90, 100, 34, 0, 7); gg.fill();
    return toTex(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.625), new THREE.MeshStandardMaterial({ map: signTex, transparent: true, roughness: 0.6 }));
  sign.position.set(0.4, 8, hd + 0.02); g.add(sign);

  const logoTex = (() => {
    const [c, gg] = makeCanvas(512, 512);
    gg.fillStyle = '#16a08a'; gg.beginPath(); gg.arc(256, 256, 246, 0, 7); gg.fill();
    gg.strokeStyle = '#fff'; gg.lineWidth = 16; gg.beginPath(); gg.arc(256, 256, 214, 0, 7); gg.stroke();
    // frasco de Erlenmeyer
    gg.fillStyle = '#fff';
    gg.beginPath(); gg.moveTo(222, 150); gg.lineTo(290, 150); gg.lineTo(290, 222); gg.lineTo(366, 368); gg.quadraticCurveTo(378, 398, 346, 398);
    gg.lineTo(166, 398); gg.quadraticCurveTo(134, 398, 146, 368); gg.lineTo(222, 222); gg.closePath(); gg.fill();
    gg.fillStyle = '#9ad84e'; gg.beginPath(); gg.moveTo(190, 300); gg.lineTo(322, 300); gg.lineTo(352, 372); gg.lineTo(160, 372); gg.closePath(); gg.fill();
    // folha brotando do frasco
    gg.fillStyle = '#9ad84e'; gg.beginPath(); gg.moveTo(256, 150); gg.bezierCurveTo(250, 80, 310, 50, 370, 60); gg.bezierCurveTo(360, 120, 310, 160, 256, 150); gg.fill();
    gg.strokeStyle = '#16a08a'; gg.lineWidth = 6; gg.beginPath(); gg.moveTo(262, 145); gg.quadraticCurveTo(300, 100, 355, 70); gg.stroke();
    return toTex(c);
  })();
  const logo = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.5 }));
  logo.position.set(-13.5, 4.3, hd + 0.03); g.add(logo);

  // Ripas de madeira na parte direita da fachada
  const slatMat = std('#ffffff', 0.8, 0, { map: woodTex });
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 5.6, 0.12), slatMat, 33);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 33; i++) { m4.makeTranslation(8 + i * 0.35, 3.8, hd + 0.08); slats.setMatrixAt(i, m4); }
  slats.castShadow = true; slats.receiveShadow = true; g.add(slats);

  // ---- Telhado: painéis solares, ar-condicionado, mastro meteorológico, claraboias ----
  const solar = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.05, 1.1), std('#ffffff', 0.25, 0.5, { map: solarTex }), 52);
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35), sc1 = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (const z of [-9, -7, -5, -3]) for (let i = 0; i < 13; i++) { m4.compose(new THREE.Vector3(-18 + i * 1.8, H + 0.45, z), q, sc1); solar.setMatrixAt(k++, m4); }
  solar.castShadow = true; g.add(solar);
  const metal = std('#aeb6ba', 0.4, 0.6);
  for (const z of [-6, -2.4]) {
    addBox(g, 3, 1.4, 2.2, metal, 12, H + 0.7, z);
    const fan = new THREE.Group(); fan.position.set(12, H + 1.42, z); g.add(fan);
    for (let i = 0; i < 4; i++) { const b = addBox(fan, 1.5, 0.03, 0.25, dark, 0, 0, 0); b.rotation.y = i * Math.PI / 4; }
    animated.push(dt => fan.rotation.y += dt * 6);
  }
  addCyl(g, 0.06, 0.08, 5, metal, 17, H + 2.5, -8, 8);
  const anemo = new THREE.Group(); anemo.position.set(17, H + 5.0, -8); g.add(anemo);
  for (let i = 0; i < 3; i++) {
    const arm = addBox(anemo, 0.7, 0.03, 0.03, metal, 0, 0, 0); arm.rotation.y = i * 2.094; arm.position.set(Math.cos(i * 2.094) * 0.35, 0, -Math.sin(i * 2.094) * 0.35);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), metal); cup.rotation.z = Math.PI / 2; cup.position.set(Math.cos(i * 2.094) * 0.7, 0, -Math.sin(i * 2.094) * 0.7); anemo.add(cup);
  }
  animated.push(dt => anemo.rotation.y += dt * 4);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff3b30', emissive: '#ff3b30' }));
  beacon.position.set(17, H + 5.3, -8); g.add(beacon);
  animated.push((dt, t) => beacon.material.emissiveIntensity = (Math.sin(t * 3) > 0.6) ? 3 : 0.2);
  const skyl = std('#bfe9ff', 0.1, 0.1, { emissive: '#9fd8ff', emissiveIntensity: 0.3 });
  for (const x of [-10, 2]) addBox(g, 4, 0.5, 2.6, skyl, x, H + 0.25, 4.5);

  // ---- Lado leste: porta de carga "Recebimento de amostras" ----
  addBox(g, 0.1, 4.2, 6, std('#ffffff', 0.5, 0.4, { map: corrugTex }), hw + 0.06, 2.1, 2);
  addBox(g, 0.2, 0.3, 6.4, dark, hw + 0.1, 4.3, 2);
  const recTex = boardTex('RECEBIMENTO', ['de amostras de campo', '(animais, água, solo)'], { w: 1024, h: 420, size: 64 });
  const rec = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.48), new THREE.MeshStandardMaterial({ map: recTex }));
  rec.rotation.y = Math.PI / 2; rec.position.set(hw + 0.05, 5.4, 2); g.add(rec);
  addBox(g, 1.1, 0.6, 0.7, std('#e9f1f5', 0.5), hw + 1.0, PLAZA_Y + 0.3, 6.3);       // caixa térmica
  addBox(g, 1.12, 0.12, 0.72, std('#1c6fd1', 0.5), hw + 1.0, PLAZA_Y + 0.62, 6.3);
  addCollider(hw + 0.4, hw + 1.6, 5.9, 6.7);

  // ---- Lado oeste: gaiola de cilindros de gás ----
  const cage = new THREE.Group(); cage.position.set(-hw - 0.75, PLAZA_Y, 5); g.add(cage);
  const cyColors = ['#2f9e44', '#868e96', '#1971c2', '#2f9e44', '#e8590c'];
  cyColors.forEach((cc, i) => { addCyl(cage, 0.18, 0.18, 1.5, std(cc, 0.4, 0.3), 0, 0.75, -1.2 + i * 0.6, 14); addCyl(cage, 0.08, 0.12, 0.2, std('#c9ced1', 0.3, 0.8), 0, 1.6, -1.2 + i * 0.6, 10); });
  for (const [x, z] of [[-0.5, -1.6], [0.5, -1.6], [-0.5, 1.6], [0.5, 1.6]]) addBox(cage, 0.06, 2, 0.06, frame, x, 1, z);
  addBox(cage, 1.06, 0.06, 3.26, frame, 0, 2, 0);
  addCollider(-hw - 1.35, -hw, 3.3, 6.7);

  // ---- Postes de luz e bancos na praça ----
  for (const x of [-14, 14]) {
    addCyl(g, 0.08, 0.1, 4, dark, x, 2, 19.5, 8);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.35), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe9b8', emissiveIntensity: 1.2 }));
    head.position.set(x, 4.05, 19.5); g.add(head);
    circles.push({ x, z: 19.5, r: 0.3 });
  }
  for (const x of [-10, 10]) {
    const b = new THREE.Group(); b.position.set(x, PLAZA_Y, 19.6); g.add(b);
    addBox(b, 2.2, 0.08, 0.5, slatMat, 0, 0.48, 0); addBox(b, 2.2, 0.5, 0.06, slatMat, 0, 0.8, -0.24);
    for (const lx of [-0.9, 0.9]) addBox(b, 0.08, 0.48, 0.45, dark, lx, 0.24, 0);
    addCollider(x - 1.1, x + 1.1, 19.3, 19.9);
  }

  // =================== INTERIOR ===================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.8, D - 0.8), std('#ffffff', 0.35, 0, { map: tileTex }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true; g.add(floor);
  // Luminárias no teto + luzes internas
  const panelLight = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff8ea', emissiveIntensity: 1.6 });
  for (const x of [-15, -9, -3, 3, 9, 15]) for (const z of [-6, 0, 6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.1), panelLight); l.position.set(x, H - 0.43, z); g.add(l); }
  for (const x of [-12, 0, 12]) { const pl = new THREE.PointLight('#fff4e2', 110, 34, 2); pl.position.set(x, 7.6, 0); g.add(pl); }

  // Zonas do piso (onde ficarão os equipamentos depois)
  const zones = [['QUÍMICA', '#f08c00', -12.5], ['AMOSTRAS', '#1c7ed6', 0], ['MICROSCOPIA', '#9c36b5', 12.5]];
  for (const [label, cc, x] of zones) {
    const [c, gg] = makeCanvas(640, 448);
    gg.fillStyle = cc + '2e'; roundRect(gg, 10, 10, 620, 428, 40); gg.fill();
    gg.strokeStyle = cc; gg.lineWidth = 16; gg.setLineDash([46, 24]); roundRect(gg, 10, 10, 620, 428, 40); gg.stroke();
    gg.setLineDash([]); gg.fillStyle = cc; gg.font = `700 66px ${FONT}`; gg.textAlign = 'center'; gg.fillText(label, 320, 400);
    const z = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshStandardMaterial({ map: toTex(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    z.rotation.x = -Math.PI / 2; z.position.set(x, FLOOR_Y + 0.01, -4.5); z.receiveShadow = true; g.add(z);
    // placa pendurada
    const [c2, g2] = makeCanvas(512, 128);
    g2.fillStyle = '#fff'; roundRect(g2, 0, 0, 512, 128, 24); g2.fill(); g2.fillStyle = cc; roundRect(g2, 0, 0, 40, 128, 20); g2.fill(); g2.fillRect(20, 0, 20, 128);
    g2.fillStyle = '#24302b'; g2.font = `700 62px ${FONT}`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(label, 276, 68);
    const st = toTex(c2);
    for (const side of [1, -1]) { const sp = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: st })); sp.position.set(x, 6.3, -4.5 + side * 0.03); if (side < 0) sp.rotation.y = Math.PI; g.add(sp); }
    for (const dx of [-1.3, 1.3]) addCyl(g, 0.01, 0.01, 2.0, metal, x + dx, 7.7, -4.5, 4);
  }
  // Mural de missões na parede do fundo (o desenho é feito por desenharMural, lá embaixo)
  const [mc, mg] = makeCanvas(1024, 480);
  const muralTex = toTex(mc);
  labFx.mural = { canvas: mc, ctx: mg, tex: muralTex, fundo: null };
  desenharMural([]);
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.28), new THREE.MeshStandardMaterial({ map: muralTex }));
  mural.position.set(0, 3.6, -hd + T + 0.02); g.add(mural);
  // Placa de segurança (lava-olhos) na parede oeste
  const safTex = boardTex('SEGURANÇA', ['Lava-olhos e chuveiro', 'de emergência'], { accent: '#2b8a3e', w: 800, h: 420, size: 54 });
  const saf = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.26), new THREE.MeshStandardMaterial({ map: safTex }));
  saf.rotation.y = Math.PI / 2; saf.position.set(-hw + T + 0.02, 3, -4.5); g.add(saf);
  // Balcão de recepção
  addBox(g, 6, 1.1, 1.2, std('#f4f6f5', 0.4), -11, FLOOR_Y + 0.55, 6.5);
  addBox(g, 6.05, 0.5, 0.05, teal, -11, FLOOR_Y + 0.6, 7.13);
  addBox(g, 6.3, 0.06, 1.4, std('#2f3a3f', 0.3), -11, FLOOR_Y + 1.13, 6.5);
  addCollider(-14.1, -7.9, 5.8, 7.2);

  // ---- Bancadas de análise (uma em cada zona do piso) ----
  const top = FLOOR_Y + 0.98;
  const glassM = std('#dff3fb', 0.05, 0.1, { transparent: true, opacity: 0.45 });
  for (const [, cc, x] of zones) {
    addBox(g, 6, 0.9, 1.3, std('#dfe6e3', 0.6), x, FLOOR_Y + 0.45, -3.6);
    addBox(g, 6.2, 0.08, 1.45, std('#2f3a3f', 0.3), x, FLOOR_Y + 0.94, -3.6);
    addBox(g, 6, 0.1, 0.03, std(cc, 0.5), x, FLOOR_Y + 0.8, -2.94);
    for (let dx = -2.25; dx <= 2.25; dx += 1.5) addBox(g, 0.4, 0.04, 0.03, metal, x + dx, FLOOR_Y + 0.55, -2.93);  // puxadores
    addCollider(x - 3.1, x + 3.1, -4.35, -2.85);
  }
  // Química: estante de tubos, frascos e reagentes
  {
    const x = -12.5;
    addBox(g, 1.1, 0.06, 0.32, std('#ffffff', 0.4), x - 1.6, top + 0.18, -3.6);
    ['#74c0fc', '#f783ac', '#c0eb75', '#ffd43b', '#4dabf7'].forEach((c, i) => {
      addCyl(g, 0.045, 0.045, 0.34, glassM, x - 2.0 + i * 0.2, top + 0.2, -3.6, 10);
      addCyl(g, 0.04, 0.04, 0.16, std(c, 0.2, 0, { emissive: c, emissiveIntensity: 0.25 }), x - 2.0 + i * 0.2, top + 0.1, -3.6, 10);
    });
    for (const [dx, c] of [[0.2, '#69db7c'], [0.9, '#4dabf7']]) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.24, 0.36, 18), glassM); cone.position.set(x + dx, top + 0.18, -3.5); g.add(cone);
      addCyl(g, 0.06, 0.06, 0.16, glassM, x + dx, top + 0.44, -3.5, 12);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.16, 18), std(c, 0.2, 0, { emissive: c, emissiveIntensity: 0.2 })); liq.position.set(x + dx, top + 0.08, -3.5); g.add(liq);
    }
    for (let i = 0; i < 3; i++) { addCyl(g, 0.09, 0.09, 0.28, std('#7a3e12', 0.3), x + 1.7 + i * 0.25, top + 0.14, -3.85, 12); addCyl(g, 0.05, 0.05, 0.06, std('#222', 0.5), x + 1.7 + i * 0.25, top + 0.31, -3.85, 10); }
  }
  // Amostras: geladeira + estufa com janela que brilha
  {
    const x = 0;
    addBox(g, 1.2, 1.0, 0.8, std('#f1f3f5', 0.4), x + 1.8, top + 0.5, -3.7);
    labFx.incub = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff922b', emissiveIntensity: 0.2 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), labFx.incub); win.position.set(x + 1.8, top + 0.55, -3.29); g.add(win);
    addBox(g, 1.0, 0.9, 0.75, std('#d0ebff', 0.4), x - 1.8, top + 0.45, -3.7);    // geladeira
    addBox(g, 0.05, 0.6, 0.06, metal, x - 1.35, top + 0.5, -3.3);
    for (let i = 0; i < 4; i++) addCyl(g, 0.13, 0.13, 0.03, glassM, x + 0.2, top + 0.02 + i * 0.035, -3.4, 18);
  }
  // Microscopia: microscópio + monitor
  {
    const x = 12.5, mm = std('#f8f9fa', 0.35), dk = std('#343a40', 0.4);
    addBox(g, 0.36, 0.06, 0.46, mm, x - 0.8, top + 0.03, -3.6);
    const arm = addBox(g, 0.1, 0.55, 0.12, mm, x - 0.8, top + 0.32, -3.78); arm.rotation.x = -0.15;
    addBox(g, 0.3, 0.03, 0.26, dk, x - 0.8, top + 0.28, -3.55);
    const tube = addCyl(g, 0.05, 0.055, 0.38, dk, x - 0.8, top + 0.6, -3.62, 12); tube.rotation.x = 0.35;
    addCyl(g, 0.035, 0.035, 0.12, dk, x - 0.8, top + 0.82, -3.7, 10);
    const [cv, cg] = makeCanvas(256, 160);
    cg.fillStyle = '#0d1b14'; cg.fillRect(0, 0, 256, 160);
    cg.fillStyle = '#f1edc9'; cg.beginPath(); cg.arc(128, 80, 70, 0, 7); cg.fill();
    for (let i = 0; i < 40; i++) { cg.fillStyle = i % 3 ? '#3f8f5a' : '#5cb836'; cg.beginPath(); cg.arc(100 + Math.random() * 50, 60 + Math.random() * 40, 3, 0, 7); cg.fill(); }
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), new THREE.MeshStandardMaterial({ map: toTex(cv), emissive: '#ffffff', emissiveMap: toTex(cv), emissiveIntensity: 0.5 }));
    mon.position.set(x + 1.2, top + 0.6, -3.88); g.add(mon);
    addBox(g, 1.06, 0.68, 0.04, dk, x + 1.2, top + 0.6, -3.91);
    addBox(g, 0.08, 0.3, 0.08, dk, x + 1.2, top + 0.15, -3.95);
  }
  // Tapete da entrada
  const [cm, gm] = makeCanvas(512, 256);
  gm.fillStyle = '#2f3a3f'; roundRect(gm, 0, 0, 512, 256, 30); gm.fill();
  gm.fillStyle = '#9be7c9'; gm.font = `700 58px ${FONT}`; gm.textAlign = 'center'; gm.textBaseline = 'middle'; gm.fillText('BEM-VINDO(A)!', 256, 128);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshStandardMaterial({ map: toTex(cm), polygonOffset: true, polygonOffsetFactor: -2 }));
  mat.rotation.x = -Math.PI / 2; mat.position.set(0, FLOOR_Y + 0.01, hd - 2); mat.receiveShadow = true; g.add(mat);
}

// ---------- Mural de missões: desenha um "post-it" para cada missão ----------
// itens = [{ icone, titulo, situacao, cor }] (até 3 cabem no mural)
export function desenharMural(itens) {
  const { ctx: g, tex } = labFx.mural;
  // fundo de cortiça: desenhado uma vez só e guardado (as pintinhas são aleatórias)
  if (!labFx.mural.fundo) {
    const [fc, fg] = makeCanvas(1024, 480);
    fg.fillStyle = '#c89b63'; fg.fillRect(0, 0, 1024, 480); speckle(fg, 1024, 480, 6000, 0.12);
    fg.strokeStyle = '#6e4b26'; fg.lineWidth = 26; fg.strokeRect(0, 0, 1024, 480);
    fg.fillStyle = '#fff'; fg.font = `700 64px ${FONT}`; fg.textAlign = 'center'; fg.fillText('MURAL DE MISSÕES', 512, 95);
    labFx.mural.fundo = fc;
  }
  g.drawImage(labFx.mural.fundo, 0, 0);
  g.textAlign = 'center';
  // lista vazia: o bilhete antigo
  const notas = itens.length ? itens.slice(0, 3) : [{ icone: '', titulo: 'Nenhuma missão ainda.', situacao: '', cor: '#3b3b3b' }];
  const W = notas.length === 1 ? 460 : 290, gap = 26, total = notas.length * W + (notas.length - 1) * gap;
  notas.forEach((n, i) => {
    const x = 512 - total / 2 + i * (W + gap) + W / 2;
    g.save(); g.translate(x, 290); g.rotate([-0.03, 0.025, -0.015][i]);
    g.fillStyle = '#fff59d'; g.fillRect(-W / 2, -110, W, 220);                      // papel
    g.fillStyle = '#e03131'; g.beginPath(); g.arc(0, -96, 12, 0, 7); g.fill();       // alfinete
    g.fillStyle = '#3b3b3b';
    if (n.icone) { g.font = `600 52px ${FONT}`; g.fillText(n.icone, 0, -30); }
    // título em até 2 linhas
    g.font = `700 ${notas.length === 1 ? 44 : 30}px ${FONT}`;
    const palavras = n.titulo.split(' '), linhas = [''];
    for (const p of palavras) { const t = (linhas[linhas.length - 1] + ' ' + p).trim(); if (g.measureText(t).width > W - 30 && linhas[linhas.length - 1]) linhas.push(p); else linhas[linhas.length - 1] = t; }
    linhas.slice(0, 2).forEach((l, k) => g.fillText(l, 0, (n.icone ? 22 : 0) + k * 38));
    if (n.situacao) { g.fillStyle = n.cor; g.font = `700 28px ${FONT}`; g.fillText(n.situacao, 0, 96); }
    g.restore();
  });
  tex.needsUpdate = true;   // avisa o Three.js que o desenho mudou
}

// ---------- Porta automática (abre/fecha e anima as folhas) ----------
export const DOOR_POS = new THREE.Vector2(0, LAB.d / 2);
export function updateDoor(dt, t) {
  const p = player.pos, dd = Math.hypot(p.x - DOOR_POS.x, p.z - DOOR_POS.y);
  const near = dd < 4.8;   // o aviso e o comando E ficam no sistema de interação (missão)
  // fecha sozinha quando você se afasta
  if (door.target === 1 && dd > 7.5) { door.closeTimer += dt; if (door.closeTimer > 1.3) { door.target = 0; doorSound(false); } } else door.closeTimer = 0;
  // não fecha em cima do jogador
  if (door.target === 0 && Math.abs(p.x) < 2.4 && Math.abs(p.z - (LAB.d / 2 - 0.45)) < 0.9) door.target = 1;
  door.open += clamp(door.target - door.open, -dt * 1.5, dt * 1.5);
  const e = door.open < 0.5 ? 2 * door.open * door.open : 1 - Math.pow(-2 * door.open + 2, 2) / 2;   // suavização
  door.panels.forEach(pn => pn.position.x = pn.userData.side * (1 + e * 1.9));
  const c = door.open > 0.02 ? '#40c057' : '#ff3b30';
  door.led.material.color.set(c); door.led.material.emissive.set(c);
  door.buttons.forEach(b => b.material.emissiveIntensity = near ? 0.5 + Math.sin(t * 5) * 0.35 : 0.15);
}
