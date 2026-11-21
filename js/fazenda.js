// =====================================================================
//  FAZENDA BOA SAFRA (cenário da Missão 2, "De onde veio o adubo?")
//  Arquivo: fazenda.js — a lavoura de soja, a cerca, o galpão, o silo,
//  o trator, a pilha de sacos de adubo e a trilha de sacos que sai do lago.
//  Onde ela fica e o tamanho estão em FAZENDA (mapa.js).
//  O fazendeiro (Seu Geraldo) é criado pela missão (missoes/adubo/index.js).
//
//  Não usa o gerador aleatório com semente (utils.js), então pode ser
//  montada depois de tudo, sem mudar a posição das árvores.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene } from './cena.js';
import { std, addBox, addCyl, addCollider, circles, makeCanvas, toTex, corrugTex, boardTex, makePostBoard } from './construcao.js';
import { FAZENDA, PIPE_M, PIPE_DIR, PONTO_MATA, PONTO_LAVOURA, walkHeight } from './mapa.js';
import { FONT } from './utils.js';

// ---------- Lugares importantes (a missão usa estes pontos) ----------
const FX = FAZENDA.x, FZ = FAZENDA.z, X0 = FX - FAZENDA.w / 2, X1 = FX + FAZENDA.w / 2, Z0 = FZ - FAZENDA.d / 2, Z1 = FZ + FAZENDA.d / 2;
const GATE_X = -41, GATE_W = 5;                                  // o portão fica no lado do lago (z = Z0)
export const PORTAO = new THREE.Vector2(GATE_X, Z0);
export const GERALDO_POS = new THREE.Vector2(-38.5, Z0 + 6);     // onde o fazendeiro fica
export const PILHA = new THREE.Vector2(-36, 158);                // pilha de sacos de adubo
// Sacos caídos na trilha entre o lago e o portão (pistas da etapa 1)
export const SACOS_TRILHA = [new THREE.Vector2(-44.2, 126), new THREE.Vector2(-42.6, 135)];

// Pequeno gerador de números aleatórios só da fazenda (a lavoura sai sempre igual)
let semente = 77;
const aleat = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };

// Textura do saco de adubo, com a marca da fazenda
const sacoTex = (() => {
  const [c, g] = makeCanvas(256, 160);
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 256, 160);
  g.fillStyle = '#2b8a3e'; g.fillRect(0, 0, 256, 34);
  g.fillStyle = '#fff'; g.font = `700 24px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BOA SAFRA', 128, 18);
  g.fillStyle = '#24302b'; g.font = `700 44px ${FONT}`; g.fillText('ADUBO', 128, 76);
  g.font = `600 30px ${FONT}`; g.fillText('N-P-K  10-10-10', 128, 120);
  return toTex(c);
})();

// Um saco de adubo caído ou empilhado (dentro de um grupo)
function saco(grupo, x, y, z, rot = 0) {
  const sb = addBox(grupo, 0.9, 0.36, 0.6, std('#ffffff', 0.9, 0, { map: sacoTex }), x, y, z);
  sb.rotation.y = rot; return sb;
}

// Bandeirinha de ponto de coleta (estaca + bandeira colorida)
function marcador(g, x, z, cor) {
  const y = walkHeight(x, z), m = new THREE.Group(); m.position.set(x, y, z); g.add(m);
  addCyl(m, 0.03, 0.03, 1.6, std('#c8a46b', 0.9), 0, 0.8, 0, 5);
  const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), std(cor, 0.6, 0, { side: THREE.DoubleSide, emissive: cor, emissiveIntensity: 0.4 }));
  bandeira.position.set(0.27, 1.45, 0); m.add(bandeira);
  addCyl(m, 0.7, 0.75, 0.06, std('#6b4a2f', 1), 0, 0.03, 0, 16);   // terra remexida
}

// Fragmento de mata nativa (o "solo de referência" da missão): árvores, folhas no chão e a bandeira do ponto
function buildMata(g) {
  const tronco = std('#6b4a2f', 0.95);
  for (let i = 0; i < 20; i++) {
    const a = aleat() * Math.PI * 2, r = 3.5 + aleat() * 8, x = PONTO_MATA.x + Math.cos(a) * r, z = PONTO_MATA.z + Math.sin(a) * r;
    const y = walkHeight(x, z), h = 4 + aleat() * 3, sc = 0.9 + aleat() * 0.5;
    addCyl(g, 0.18 * sc, 0.3 * sc, h, tronco, x, y + h / 2 - 0.2, z, 7);
    for (const [dx, dy, dz, rr2] of [[0, h + 0.4, 0, 2.0], [0.9, h - 0.2, 0.4, 1.5], [-0.8, h - 0.1, -0.5, 1.5]]) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(rr2 * sc, 1), std(new THREE.Color().setHSL(0.24 + aleat() * 0.08, 0.5, 0.28 + aleat() * 0.1), 0.85));
      c.position.set(x + dx * sc, y + dy * sc, z + dz * sc); c.scale.y = 0.85; c.castShadow = true; g.add(c);
    }
    circles.push({ x, z, r: 0.4 * sc });
  }
  // serapilheira: camada de folhas caídas no chão da mata
  const folhas = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), std('#4a3a1e', 1));
  folhas.rotation.x = -Math.PI / 2; folhas.position.set(PONTO_MATA.x, walkHeight(PONTO_MATA.x, PONTO_MATA.z) + 0.06, PONTO_MATA.z); g.add(folhas);
  marcador(g, PONTO_MATA.x, PONTO_MATA.z, '#2b8a3e');
}

export function buildFazenda() {
  const g = new THREE.Group(); scene.add(g);
  const y0 = FAZENDA.y;
  const madeira = std('#8a5a33', 0.9), vermelho = std('#a93226', 0.8), branco = std('#f1f3f5', 0.5), metal = std('#aeb6ba', 0.4, 0.6);

  // ---- Terra batida em volta do portão e caminho até o galpão ----
  const terra = std('#7a4a30', 1);
  addBox(g, 4, 0.04, 26, terra, GATE_X, y0 + 0.02, Z0 + 12, { cast: false });

  // ---- Lavoura de soja: sulcos escuros e fileiras de plantinhas ----
  const campo = { x0: -65, x1: -46, z0: Z0 + 5, z1: Z1 - 2 };
  const linhas = [];
  for (let z = campo.z0; z <= campo.z1; z += 1.4) linhas.push(z);
  const sulco = std('#6d3a24', 1);
  for (const z of linhas) addBox(g, campo.x1 - campo.x0, 0.08, 0.55, sulco, (campo.x0 + campo.x1) / 2, y0 + 0.04, z, { cast: false });
  const porLinha = Math.floor((campo.x1 - campo.x0) / 0.9);
  // a plantinha: um caule fino e dois andares de folhas achatadas (trifólio, como a soja de verdade)
  const partes = [];
  const caule = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 5); caule.translate(0, 0.2, 0); partes.push(caule.toNonIndexed());
  for (const [altura, giro] of [[0.22, 0], [0.38, 1]]) for (let i = 0; i < 3; i++) {
    const folha = new THREE.SphereGeometry(0.15, 6, 4); folha.scale(1, 0.22, 1.5); folha.translate(0.14, altura, 0);
    folha.rotateY(i * 2.094 + giro); partes.push(folha.toNonIndexed());
  }
  const sojaGeo = mergeGeometries(partes);
  const soja = new THREE.InstancedMesh(sojaGeo, std('#ffffff', 0.85), linhas.length * porLinha);
  const m4 = new THREE.Matrix4(), cor = new THREE.Color();
  let n = 0;
  for (const z of linhas) for (let i = 0; i < porLinha; i++) {
    const s = 0.8 + aleat() * 0.5;
    m4.compose(new THREE.Vector3(campo.x0 + 0.5 + i * 0.9, y0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * 6.28), new THREE.Vector3(s, s, s));
    soja.setMatrixAt(n, m4);
    soja.setColorAt(n, cor.setHSL(0.22 + aleat() * 0.06, 0.55, 0.32 + aleat() * 0.1));
    n++;
  }
  soja.castShadow = true; soja.receiveShadow = true; g.add(soja);

  // ---- Cerca de madeira em volta de tudo (com o portão aberto no lado do lago) ----
  const postes = [];
  const lado = (ax, az, bx, bz) => {   // poste a cada ~3 m, de (ax,az) até (bx,bz)
    const len = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= k; i++) postes.push([ax + (bx - ax) * i / k, az + (bz - az) * i / k]);
  };
  lado(X0, Z0, GATE_X - GATE_W / 2, Z0); lado(GATE_X + GATE_W / 2, Z0, X1, Z0);
  lado(X1, Z0, X1, Z1); lado(X1, Z1, X0, Z1); lado(X0, Z1, X0, Z0);
  const posteGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 6); posteGeo.translate(0, 0.75, 0);
  const cercas = new THREE.InstancedMesh(posteGeo, madeira, postes.length);
  postes.forEach(([x, z], i) => { m4.makeTranslation(x, y0 - 0.1, z); cercas.setMatrixAt(i, m4); });
  cercas.castShadow = true; g.add(cercas);
  const trilho = (ax, az, bx, bz) => {   // 2 tábuas horizontais entre dois pontos
    const len = Math.hypot(bx - ax, bz - az);
    for (const h of [0.55, 1.05]) { const t = addBox(g, len, 0.09, 0.05, madeira, (ax + bx) / 2, y0 + h, (az + bz) / 2, { cast: false }); t.rotation.y = -Math.atan2(bz - az, bx - ax); }
  };
  trilho(X0, Z0, GATE_X - GATE_W / 2, Z0); trilho(GATE_X + GATE_W / 2, Z0, X1, Z0);
  trilho(X1, Z0, X1, Z1); trilho(X1, Z1, X0, Z1); trilho(X0, Z1, X0, Z0);
  // a cerca bloqueia o jogador (menos no portão)
  addCollider(X0, GATE_X - GATE_W / 2, Z0 - 0.2, Z0 + 0.2); addCollider(GATE_X + GATE_W / 2, X1, Z0 - 0.2, Z0 + 0.2);
  addCollider(X1 - 0.2, X1 + 0.2, Z0, Z1); addCollider(X0, X1, Z1 - 0.2, Z1 + 0.2); addCollider(X0 - 0.2, X0 + 0.2, Z0, Z1);

  // ---- Placa na entrada ----
  const placa = boardTex('FAZENDA BOA SAFRA', ['Soja · desde 1998', 'Visitas: falar com o Geraldo'], { accent: '#2b8a3e', size: 54 });
  makePostBoard(placa, 2.8, 1.75, GATE_X - 5, Z0 - 2.5, Math.PI);

  // ---- Galpão (paredes vermelhas, telhado de zinco de duas águas) ----
  const gx = -30, gz = 166, gw = 11, gd = 8, gh = 4;
  addBox(g, gw, gh, gd, vermelho, gx, y0 + gh / 2, gz, { block: true });
  addBox(g, 3.4, 3, 0.1, std('#2b2118', 0.9), gx, y0 + 1.5, gz - gd / 2 - 0.03);               // portão do galpão
  addBox(g, 3.6, 0.15, 0.14, branco, gx, y0 + 3.05, gz - gd / 2 - 0.04);
  const tri = new THREE.Shape(); tri.moveTo(-gd / 2 - 0.5, 0); tri.lineTo(gd / 2 + 0.5, 0); tri.lineTo(0, 1.8); tri.closePath();
  const telhadoGeo = new THREE.ExtrudeGeometry(tri, { depth: gw + 1, bevelEnabled: false });
  telhadoGeo.rotateY(Math.PI / 2); telhadoGeo.translate(-(gw + 1) / 2, 0, 0);
  const telhado = new THREE.Mesh(telhadoGeo, std('#b9c0c4', 0.5, 0.4, { map: corrugTex })); telhado.position.set(gx, y0 + gh, gz); telhado.castShadow = true; g.add(telhado);
  addCollider(gx - gw / 2, gx + gw / 2, gz - gd / 2, gz + gd / 2);

  // ---- Silo de grãos ----
  const sx = -26, sz = 152;
  addCyl(g, 1.7, 1.7, 7, metal, sx, y0 + 3.5, sz, 20);
  const topo = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.3, 20), std('#c9ced1', 0.4, 0.5)); topo.position.set(sx, y0 + 7.65, sz); topo.castShadow = true; g.add(topo);
  circles.push({ x: sx, z: sz, r: 1.9 });

  // ---- Trator (verde, formas simples) ----
  const tx = -38, tz = 172, verde = std('#2f9e44', 0.6), pneu = std('#1f2326', 0.95);
  const trator = new THREE.Group(); trator.position.set(tx, y0, tz); trator.rotation.y = 0.5; g.add(trator);
  addBox(trator, 2.2, 0.8, 1.2, verde, 0, 0.9, 0);                         // corpo
  addBox(trator, 1.0, 0.9, 1.1, verde, -0.5, 1.7, 0);                      // cabine
  addBox(trator, 1.1, 0.7, 0.2, std('#9ccbe0', 0.1, 0.3), -0.5, 1.75, 0.58);
  for (const [px, r, pz] of [[0.9, 0.5, 0.75], [0.9, 0.5, -0.75], [-0.8, 0.75, 0.8], [-0.8, 0.75, -0.8]]) {
    const w = addCyl(trator, r, r, 0.35, pneu, px, r, pz, 14); w.rotation.x = Math.PI / 2;
  }
  circles.push({ x: tx, z: tz, r: 1.5 });

  // ---- Pilha de sacos de adubo (ao lado do galpão) ----
  const pilha = new THREE.Group(); pilha.position.set(PILHA.x, y0, PILHA.y); g.add(pilha);
  [[-0.5, 0], [0.5, 0], [-0.5, 0.7], [0.5, 0.7]].forEach(([x, z], i) => saco(pilha, x, 0.18, z, i * 0.1));
  [[0, 0.1], [0, 0.8]].forEach(([x, z], i) => saco(pilha, x, 0.54, z, 0.15 - i * 0.1));
  saco(pilha, 0, 0.9, 0.45, 0.05);
  circles.push({ x: PILHA.x, z: PILHA.y, r: 1.0 });

  // ---- Sacos caídos na trilha, do lago até o portão (as pistas) ----
  SACOS_TRILHA.forEach((p, i) => {
    const t = new THREE.Group(); t.position.set(p.x, walkHeight(p.x, p.y), p.y); g.add(t);
    saco(t, 0, 0.18, 0, 0.4 + i); saco(t, 0.8, 0.18, 0.35, -0.3);
    if (i === 0) saco(t, 0.35, 0.54, 0.15, 0.8);
  });
  // rastro de adubo no chão (pontinhos brancos) até o lago
  const rastro = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 5, 4), std('#f5f0e1', 0.9), 60);
  for (let i = 0; i < 60; i++) {
    const f = i / 59, bx = PIPE_M.x + PIPE_DIR.x * (14 + f * 22) + (aleat() - 0.5) * 3, bz = PIPE_M.y + PIPE_DIR.y * (14 + f * 22) + (aleat() - 0.5) * 3;
    m4.makeTranslation(bx, walkHeight(bx, bz) + 0.05, bz); rastro.setMatrixAt(i, m4);
  }
  g.add(rastro);

  // ---- Pontos de coleta de solo (Missão 2) ----
  buildMata(g);
  marcador(g, PONTO_LAVOURA.x, PONTO_LAVOURA.z, '#ffd43b');
}
