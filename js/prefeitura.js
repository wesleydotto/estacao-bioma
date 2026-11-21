// =====================================================================
//  PREFEITURA (Secretaria de Meio Ambiente)
//  Arquivo: prefeitura.js — o prédio a leste da praça, com a secretária
//  no balcão. Falando com ela: entregar relatórios e comprar na loja.
//  Posição e tamanho ficam em PREF (mapa.js).
// =====================================================================
import * as THREE from 'three';
import { scene } from './cena.js';
import { std, addBox, addCyl, addCollider, circles, animated, makeCanvas, toTex, roundRect, concreteTex } from './construcao.js';
import { PREF, FLOOR_Y, PLAZA_Y } from './mapa.js';
import { FONT } from './utils.js';
import { addNPC } from './npc.js';
import { prefeituraPanel, relatoriosPendentes } from './economia.js';

// Onde fica o balcão (o marcador amarelo aponta para cá quando há relatório para entregar)
export const BALCAO = new THREE.Vector3(PREF.x + 0.5, FLOOR_Y, PREF.z);

export function buildPrefeitura() {
  const g = new THREE.Group(); scene.add(g);
  const { x: cx, z: cz, w: W, d: D, h: H } = PREF, T = 0.3;
  const x0 = cx - W / 2, x1 = cx + W / 2, z0 = cz - D / 2, z1 = cz + D / 2;   // cantos do prédio
  const parede = std('#f3e3c3', 0.75), branco = std('#fbfaf6', 0.5), telhado = std('#b5533c', 0.8), madeira = std('#8a5a33', 0.7), verde = std('#2b8a3e', 0.6);
  const PORTA = 3;   // largura da porta (metros)

  // ---- Piso, calçada e varanda ----
  const piso = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), std('#ffffff', 0.5, 0, { map: concreteTex }));
  piso.position.set(cx, FLOOR_Y - 0.15, cz); piso.receiveShadow = true; g.add(piso);
  const calc = new THREE.Mesh(new THREE.BoxGeometry(x0 - 21, 0.3, 3.2), std('#ffffff', 0.9, 0, { map: concreteTex }));
  calc.position.set((21 + x0) / 2, PLAZA_Y - 0.15, cz); calc.receiveShadow = true; g.add(calc);

  // ---- Paredes (a da frente, virada para a praça, tem a porta) ----
  addBox(g, T, H, D, parede, x1 - T / 2, H / 2, cz, { block: true });                 // fundo (leste)
  addBox(g, W, H, T, parede, cx, H / 2, z0 + T / 2, { block: true });                 // sul
  addBox(g, W, H, T, parede, cx, H / 2, z1 - T / 2, { block: true });                 // norte
  const lado = (D - PORTA) / 2;
  addBox(g, T, H, lado, parede, x0 + T / 2, H / 2, z0 + lado / 2, { block: true });    // frente, lado sul da porta
  addBox(g, T, H, lado, parede, x0 + T / 2, H / 2, z1 - lado / 2, { block: true });    // frente, lado norte da porta
  addBox(g, T, H - 3.2, PORTA, parede, x0 + T / 2, 3.2 + (H - 3.2) / 2, cz, { block: true });   // em cima da porta
  addBox(g, W + 0.2, 0.4, D + 0.2, branco, cx, H + 0.2, cz, { block: true });         // laje
  addCollider(x1 - T, x1, z0, z1); addCollider(x0, x1, z0, z0 + T); addCollider(x0, x1, z1 - T, z1);
  addCollider(x0, x0 + T, z0, cz - PORTA / 2); addCollider(x0, x0 + T, cz + PORTA / 2, z1);
  // rodapé verde e janelas
  for (const zz of [z0 - 0.02, z1 + 0.02]) addBox(g, W, 0.6, 0.06, verde, cx, 0.3, zz);
  const vidro = std('#9ccbe0', 0.1, 0.3, { emissive: '#1f4a5e', emissiveIntensity: 0.3 });
  for (const xx of [cx - 3, cx + 1.5]) for (const zz of [z0 - 0.03, z1 + 0.03]) { addBox(g, 2, 1.6, 0.06, vidro, xx, 2.6, zz); addBox(g, 2.2, 0.12, 0.2, branco, xx, 1.75, zz); }

  // ---- Telhado de duas águas (telhas) ----
  const tri = new THREE.Shape(); tri.moveTo(-D / 2 - 0.6, 0); tri.lineTo(D / 2 + 0.6, 0); tri.lineTo(0, 2.2); tri.closePath();
  const telhadoGeo = new THREE.ExtrudeGeometry(tri, { depth: W + 1.2, bevelEnabled: false });
  telhadoGeo.rotateY(Math.PI / 2); telhadoGeo.translate(-(W + 1.2) / 2, 0, 0);
  const tel = new THREE.Mesh(telhadoGeo, telhado); tel.position.set(cx, H + 0.4, cz); tel.castShadow = true; g.add(tel);

  // ---- Varanda com colunas na frente ----
  const vx = x0 - 1.6;
  addBox(g, 3.2, 0.25, D + 0.6, branco, x0 - 1.4, H - 0.6, cz);                       // teto da varanda
  for (const zz of [z0 + 0.6, cz - 2.2, cz + 2.2, z1 - 0.6]) { addCyl(g, 0.2, 0.24, H - 0.7, branco, vx, (H - 0.7) / 2, zz, 14); circles.push({ x: vx, z: zz, r: 0.3 }); }

  // ---- Letreiro ----
  const placa = (() => {
    const [c, gg] = makeCanvas(1024, 256);
    gg.fillStyle = '#fbfaf6'; roundRect(gg, 0, 0, 1024, 256, 30); gg.fill();
    gg.fillStyle = '#2b8a3e'; roundRect(gg, 0, 0, 1024, 70, 30); gg.fill(); gg.fillRect(0, 40, 1024, 30);
    gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillStyle = '#fff'; gg.font = `600 40px ${FONT}`; gg.fillText('SECRETARIA DE MEIO AMBIENTE', 512, 38);
    gg.fillStyle = '#24302b'; gg.font = `700 120px ${FONT}`; gg.fillText('PREFEITURA', 512, 162);
    return toTex(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshStandardMaterial({ map: placa }));
  sign.rotation.y = -Math.PI / 2; sign.position.set(x0 - 3.05, H + 0.25, cz); g.add(sign);
  addBox(g, 0.1, 1.6, 6.1, branco, x0 - 2.98, H + 0.25, cz);

  // ---- Mastro com bandeira (balança com o vento) ----
  addCyl(g, 0.06, 0.08, 8, std('#c9ced1', 0.3, 0.8), x0 - 4, 4, z1 + 1.5, 8);
  circles.push({ x: x0 - 4, z: z1 + 1.5, r: 0.2 });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1, 8, 1), std('#2b8a3e', 0.7, 0, { side: THREE.DoubleSide }));
  flag.position.set(x0 - 4, 7.3, z1 + 2.3); flag.rotation.y = Math.PI / 2; g.add(flag);
  const fp = flag.geometry.attributes.position, base = Array.from(fp.array);
  animated.push((dt, t) => { for (let i = 0; i < fp.count; i++) { const u = 0.8 - base[i * 3]; /* u: 0 no mastro, 1,6 na ponta solta */ fp.setZ(i, Math.sin(t * 4 + u * 3) * 0.12 * u); } fp.needsUpdate = true; });

  // ---- Interior: luz, balcão, banco e quadro ----
  const lamp = new THREE.PointLight('#fff4e2', 40, 16, 2); lamp.position.set(cx, H - 0.6, cz); g.add(lamp);
  addBox(g, 0.8, 1.1, 5, madeira, BALCAO.x + 0.9, FLOOR_Y + 0.55, cz);                // balcão
  addBox(g, 0.95, 0.08, 5.2, std('#2f3a3f', 0.3), BALCAO.x + 0.9, FLOOR_Y + 1.12, cz);
  addCollider(BALCAO.x + 0.5, BALCAO.x + 1.3, cz - 2.5, cz + 2.5);
  addBox(g, 0.5, 0.1, 2.4, madeira, x0 + 1, FLOOR_Y + 0.45, z1 - 1.2);                // banco de espera
  addCollider(x0 + 0.7, x0 + 1.3, z1 - 2.4, z1);
  const quadroTex = (() => {
    const [c, gg] = makeCanvas(512, 320);
    gg.fillStyle = '#2f5d50'; gg.fillRect(0, 0, 512, 320);
    gg.fillStyle = '#fff'; gg.textAlign = 'center'; gg.font = `700 40px ${FONT}`; gg.fillText('VERBA PARA A CIÊNCIA', 256, 70);
    gg.font = `500 30px ${FONT}`; ['Entregue os relatórios', 'das missões e receba', 'verba para construir!'].forEach((l, i) => gg.fillText(l, 256, 140 + i * 50));
    return toTex(c);
  })();
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshStandardMaterial({ map: quadroTex }));
  quadro.rotation.y = -Math.PI / 2; quadro.position.set(x1 - T - 0.02, 2.6, cz); g.add(quadro);

  // ---- A secretária (NPC) atrás do balcão ----
  addNPC({
    nome: 'Secretária Lúcia', x: BALCAO.x + 1.9, z: cz, olhaPara: -Math.PI / 2, alcance: 3,
    cores: { camisa: '#1971c2', calca: '#343a40', chapeu: null, cabelo: '#4a2c1a', pele: '#c68e5f' },
    aoFalar: () => prefeituraPanel(),
    temMissao: () => relatoriosPendentes().length > 0,
  });
}
