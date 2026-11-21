// Arquivo: missoes/adubo/bancada.js — a bancada SOLO do laboratório.
// A mesa já está lá, mas cada equipamento só APARECE depois de comprado na loja
// da prefeitura (o laboratório vai "crescendo" com as conquistas do aluno).
import * as THREE from 'three';
import { scene } from '../../cena.js';
import { std, addBox, addCyl, addCollider, makeCanvas, toTex } from '../../construcao.js';
import { FLOOR_Y } from '../../mapa.js';
import { FONT } from '../../utils.js';
import { qtd } from '../../economia.js';

export const BANCADA_X = 6.25;                 // fica entre a bancada AMOSTRAS e o microscópio
export const bancadaFx = { ativo: false };     // ativo = true enquanto a estufa de solo está ligada (o forno brilha)
const props = {};                              // id do item → objeto 3D que aparece quando o jogador compra
let forno = null;

export function montarBancadaSolo() {
  const g = new THREE.Group(); scene.add(g);
  const top = FLOOR_Y + 0.98, x = BANCADA_X;
  // mesa (mesmo estilo das outras bancadas, só que mais curta) com a faixa cor de terra
  addBox(g, 2.8, 0.9, 1.3, std('#dfe6e3', 0.6), x, FLOOR_Y + 0.45, -3.6);
  addBox(g, 3.0, 0.08, 1.45, std('#2f3a3f', 0.3), x, FLOOR_Y + 0.94, -3.6);
  addBox(g, 2.8, 0.1, 0.03, std('#a4533a', 0.5), x, FLOOR_Y + 0.8, -2.94);
  addCollider(x - 1.5, x + 1.5, -4.35, -2.85);
  // plaquinha "SOLO" na frente
  const [c, cg] = makeCanvas(256, 80);
  cg.fillStyle = '#a4533a'; cg.fillRect(0, 0, 256, 80); cg.fillStyle = '#fff'; cg.font = `700 52px ${FONT}`; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText('SOLO', 128, 42);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshStandardMaterial({ map: toTex(c) })); placa.position.set(x, FLOOR_Y + 0.6, -2.92); g.add(placa);

  // --- balança de precisão ---
  const balanca = new THREE.Group(); balanca.position.set(x - 0.7, top, -3.6); g.add(balanca); props.balancaSolo = balanca;
  addBox(balanca, 0.5, 0.08, 0.4, std('#f1f3f5', 0.4), 0, 0.04, 0);
  addCyl(balanca, 0.17, 0.17, 0.02, std('#aeb6ba', 0.3, 0.7), 0, 0.1, 0, 20);
  addBox(balanca, 0.2, 0.06, 0.02, std('#0d1b14', 0.3), 0, 0.05, 0.21);
  // --- estufa / forno de solo (a janela brilha quando está ligada) ---
  const estufa = new THREE.Group(); estufa.position.set(x + 0.55, top, -3.6); g.add(estufa); props.balancaSolo2 = estufa;
  addBox(estufa, 0.8, 0.6, 0.55, std('#868e96', 0.4, 0.4), 0, 0.3, 0);
  forno = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff922b', emissiveIntensity: 0.15 });
  const janela = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), forno); janela.position.set(0, 0.32, 0.28); estufa.add(janela);
  // --- kit de infiltração: anel de metal e cronômetro ---
  const kit = new THREE.Group(); kit.position.set(x - 1.1, top, -3.35); g.add(kit); props.kitInfiltracao = kit;
  const anel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 18, 1, true), std('#aeb6ba', 0.3, 0.7, { side: THREE.DoubleSide })); anel.position.y = 0.07; kit.add(anel);
  addCyl(kit, 0.05, 0.05, 0.03, std('#e03131', 0.4), 0.28, 0.02, 0, 12);
  // --- lupa de campo ---
  const lupa = new THREE.Group(); lupa.position.set(x + 1.15, top, -3.3); g.add(lupa); props.lupaCampo = lupa;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 8, 18), std('#343a40', 0.4)); aro.position.set(0, 0.03, 0); aro.rotation.x = Math.PI / 2; lupa.add(aro);
  addBox(lupa, 0.03, 0.02, 0.18, std('#343a40', 0.4), 0, 0.03, 0.19);
  // --- sonda de solo ---
  const sonda = new THREE.Group(); sonda.position.set(x + 0.1, top, -3.1); g.add(sonda); props.sondaSolo = sonda;
  addCyl(sonda, 0.015, 0.015, 0.3, std('#ced4da', 0.3, 0.6), 0, 0.02, 0, 6).rotation.z = Math.PI / 2;
  addBox(sonda, 0.07, 0.04, 0.1, std('#2b8a3e', 0.5), -0.17, 0.03, 0);
  for (const p of Object.values(props)) p.visible = false;
}

// Roda todo quadro: mostra só o que o jogador já comprou e faz o forno brilhar quando ligado
export function atualizarBancadaSolo(t) {
  if (!forno) return;
  for (const id of ['kitInfiltracao', 'lupaCampo', 'sondaSolo']) props[id].visible = qtd(id) > 0;
  props.balancaSolo.visible = props.balancaSolo2.visible = qtd('balancaSolo') > 0;
  forno.emissiveIntensity = bancadaFx.ativo ? 0.9 + Math.sin(t * 8) * 0.3 : 0.15;
}
