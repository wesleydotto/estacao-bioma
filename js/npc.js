// =====================================================================
//  NPCs (personagens que ficam no mundo e conversam com o jogador)
//  Arquivo: npc.js
//
//  Como criar um NPC (normalmente dentro de montar() de uma missão):
//    addNPC({
//      nome: 'Seu Jorge', x: 10, z: 30,          // onde ele fica (metros)
//      olhaPara: Math.PI,                         // para onde olha quando está sozinho
//      cores: { camisa: '#c92a2a', chapeu: null, cabelo: '#3b2a1a' },   // veja pessoas.js (e boneco.js)
//      falas: ['Oi!', 'Tudo bem?'],               // o que ele fala quando o jogador aperta E
//      // ou, no lugar de falas: aoFalar: () => { ... }  (para conversas que mudam a missão)
//      temMissao: () => true,                     // mostra um "!" em cima da cabeça
//      alcance: 2.4,                              // distância (m) para o [E] aparecer
//    });
// =====================================================================
import * as THREE from 'three';
import { scene } from './cena.js';
import { circles, makeCanvas, toTex } from './construcao.js';
import { walkHeight } from './mapa.js';
import { criarBoneco } from './boneco.js';
import { criarPessoa, pessoasProntas } from './pessoas.js';
import { player } from './player.js';
import { say } from './interface.js';
import { FONT } from './utils.js';

export const npcs = [];
// Interações com E dos NPCs (o motor de missões, quest.js, lê esta lista)
export const npcInteracoes = [];

// Plaquinha com "!" que flutua em cima de quem tem missão
const exclamTex = (() => {
  const [c, g] = makeCanvas(128, 128);
  g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.strokeStyle = '#24302b'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#24302b'; g.font = `700 88px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 70);
  return toTex(c);
})();

// Cria o corpo do NPC: o modelo 3D com ossos (pessoas.js) se já carregou; senão, o boneco antigo de formas simples
function criarCorpo(cores) {
  if (pessoasProntas()) {
    try { return criarPessoa(cores); } catch (e) { console.error('Não deu para criar o NPC em 3D:', e); }
  }
  return criarBoneco({ mochila: null, frasco: false, jaleco: null, ...cores });
}

export function addNPC({ nome, x, z, olhaPara = 0, cores = {}, falas = ['Olá!'], aoFalar = null, temMissao = () => false, alcance = 2.4 }) {
  const rig = criarCorpo(cores);
  rig.g.position.set(x, walkHeight(x, z), z);
  rig.g.rotation.y = olhaPara;
  scene.add(rig.g);
  // "!" em cima da cabeça
  const exclam = new THREE.Sprite(new THREE.SpriteMaterial({ map: exclamTex, depthTest: true }));
  exclam.scale.setScalar(0.55); exclam.position.y = 2.55; rig.g.add(exclam);
  circles.push({ x, z, r: 0.4 });   // o jogador não atravessa o NPC
  const npc = { nome, x, z, olhaPara, cores, rig, exclam, temMissao, fase: Math.random() * 6 };
  npcs.push(npc);
  npcInteracoes.push({
    pos: () => new THREE.Vector2(x, z), r: alcance,   // alcance = distância para aparecer o [E]
    label: () => `Conversar com ${nome}`,
    act: () => (aoFalar ? aoFalar(npc) : say(falas, `💬 ${nome}`)),
  });
  return npc;
}

// Troca o boneco antigo pelo modelo 3D nos NPCs criados ANTES dos modelos carregarem
// (chamado no main.js logo depois de carregarPessoas())
export function trocarNPCsPor3D() {
  for (const n of npcs) {
    if (n.rig.esqueleto) continue;
    let novo;
    try { novo = criarPessoa(n.cores); } catch (e) { console.error('Não deu para criar o NPC em 3D:', e); continue; }
    novo.g.position.copy(n.rig.g.position); novo.g.rotation.y = n.rig.g.rotation.y;
    scene.remove(n.rig.g); scene.add(novo.g);
    novo.g.add(n.exclam);
    n.rig = novo;
  }
}

// Roda todo quadro: NPC respira, vira para o jogador quando ele chega perto e mostra o "!"
export function updateNPCs(dt, t) {
  for (const n of npcs) {
    const dx = player.pos.x - n.x, dz = player.pos.z - n.z, perto = Math.hypot(dx, dz) < 6;
    const alvo = perto ? Math.atan2(dx, dz) : n.olhaPara;
    // gira pelo caminho mais curto (sem dar a volta inteira)
    let d = ((alvo - n.rig.g.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    n.rig.g.rotation.y += d * (1 - Math.exp(-5 * dt));
    if (n.rig.esqueleto) {
      n.rig.atualizar(dt);   // modelo 3D: a animação "parado" (respira e mexe os braços)
    } else {
      // boneco antigo: o corpo sobe e desce um pouquinho; os braços balançam
      const r = Math.sin(t * 2 + n.fase);
      n.rig.body.forEach(m => { if (m.userData.baseY === undefined) m.userData.baseY = m.position.y; m.position.y = m.userData.baseY + r * 0.012; });
      n.rig.armL.rotation.z = 0.08 + r * 0.03; n.rig.armR.rotation.z = -0.08 - r * 0.03;
    }
    // "!" pulando
    n.exclam.visible = !!n.temMissao();
    n.exclam.position.y = 2.55 + Math.sin(t * 3 + n.fase) * 0.08;
  }
}
