// =====================================================================
//  AÇÕES DO PERSONAGEM: plantar, regar, coletar e usar o binóculo
//  Arquivo: acoes.js — animações do Biólogo (feitas girando braços e pernas do boneco).
//
//  Como usar (em qualquer arquivo):
//    fazerAcao('plantar', () => { ...o que acontece quando a animação termina... });
//    Tipos: 'plantar' (agacha e cava), 'regar' (derrama água da garrafa), 'coletar' (agacha e pega uma amostra).
//    Para encadear: fazerAcao('plantar', () => fazerAcao('regar'));
//  Enquanto a ação roda, o personagem fica parado e a tecla E é ignorada.
//
//  Binóculo: segurar a tecla B (ou o botão 🔭 no celular). O personagem levanta o binóculo
//  e a câmera dá zoom. Soltou, volta ao normal.
// =====================================================================
import * as THREE from 'three';
import { scene, camera } from './cena.js';
import { keys } from './estado.js';
import { player } from './player.js';
import { panelOpen, dlgOpen } from './interface.js';
import { clamp, lerp } from './utils.js';

const DURACAO = { plantar: 1.1, regar: 1.3, coletar: 1.4 };   // em segundos
const FOV_NORMAL = 60, FOV_BINOCULO = 24;                      // zoom da câmera

let atual = null;        // ação em andamento: { tipo, t, dur, aoFim }
let binoculo = false;    // segurando o binóculo?
export const acaoAtiva = () => !!atual;
export const binoculoLigado = () => binoculo;
export const estadoAcao = () => atual ? { tipo: atual.tipo, t: atual.t } : null;   // (usado nos testes)

// Começa uma ação. Devolve false se já tem uma rodando. aoFim (opcional) roda quando a animação acaba.
export function fazerAcao(tipo, aoFim = null) {
  if (atual) return false;
  atual = { tipo, t: 0, dur: DURACAO[tipo], aoFim };
  player.vel.set(0, 0, 0);   // para de andar
  return true;
}

// ---------- Moldura escura do binóculo (aparece na tela enquanto está levantado) ----------
const moldura = document.createElement('div');
moldura.style.cssText = 'position:fixed;inset:0;pointer-events:none;display:none;z-index:4;background:radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 26vmin, rgba(0,0,0,.35) 30vmin, rgba(0,0,0,.92) 36vmin)';
document.body.appendChild(moldura);

// ---------- Gotinhas de água (da garrafa, ao regar) ----------
const gotas = Array.from({ length: 10 }, () => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#74c0fc' }));
  m.visible = false; scene.add(m); return { m, v: new THREE.Vector3(), vida: 0 };
});
let proxGota = 0;
const tmp = new THREE.Vector3();
function soltarGota(rig) {
  const g = gotas.find(x => x.vida <= 0); if (!g) return;
  rig.g.updateMatrixWorld(true);
  rig.itemMao.garrafa.localToWorld(g.m.position.set(0, -0.12, 0));   // sai da boca da garrafa
  const f = player.yaw;
  g.v.set(Math.sin(f) * 0.9, -0.3, Math.cos(f) * 0.9); g.vida = 0.9; g.m.visible = true;
}
function atualizarGotas(dt) {
  for (const g of gotas) {
    if (g.vida <= 0) continue;
    g.vida -= dt; g.v.y -= 9.8 * dt; g.m.position.addScaledVector(g.v, dt);
    if (g.vida <= 0 || g.m.position.y < player.pos.y) { g.vida = 0; g.m.visible = false; }
  }
}

// Abaixa/levanta o boneco inteiro (usa o mesmo "baseY" que o balanço do player.js)
function baixar(rig, dy) {
  rig.g.children.forEach(c => { if (c.userData.baseY === undefined) c.userData.baseY = c.position.y; c.position.y = c.userData.baseY + dy; });
}
// Esconde os objetos de mão e devolve o binóculo para o peito
function limparItens(rig) {
  if (rig.itemMao) { rig.itemMao.garrafa.visible = false; rig.itemMao.frasco.visible = false; }
  if (rig.binOlhos) { rig.binOlhos.visible = false; rig.binPeito.visible = true; }
}

// Poses das ações para o Biólogo 3D (personagem.js). Os giros são em radianos, nos eixos do personagem:
//  .rotation.x negativo = levanta para a FRENTE (braço/coxa); positivo = para TRÁS.
//  No joelho e no cotovelo o giro é somado ao da coxa/braço.
function poseEsqueleto(rig, tipo, tt, dur, ease) {
  if (tipo === 'plantar' || tipo === 'coletar') {
    // ajoelha numa perna só (a direita fica na frente), inclina o tronco e cava com as mãos
    const fimAgacha = tipo === 'coletar' ? dur * 0.8 : dur;
    const ag = ease(Math.min(tt / 0.25, (fimAgacha - tt) / 0.25));
    baixar(rig, -0.42 * ag);
    rig.legR.rotation.x = -1.3 * ag; rig.joelhoR.rotation.x = 1.4 * ag;    // perna da frente: coxa para frente, canela em pé
    rig.legL.rotation.x = 0.15 * ag; rig.joelhoL.rotation.x = 1.45 * ag;   // perna de trás: joelho no chão
    rig.tronco.rotation.x = 0.45 * ag;                                      // inclina para frente
    const cava = Math.sin(tt * (tipo === 'plantar' ? 14 : 8)) * 0.18;
    rig.armL.rotation.x = (-0.55 - cava) * ag; rig.armR.rotation.x = (-0.55 + cava) * ag;
    if (tipo === 'coletar' && tt > dur * 0.6) {   // levanta a amostra (frasco) na mão direita
      rig.itemMao.frasco.visible = true;
      const sobe = ease((tt - dur * 0.6) / 0.3);
      rig.armR.rotation.x = lerp(rig.armR.rotation.x, -1.0, sobe); rig.cotoveloR.rotation.x = -0.9 * sobe;
    }
  } else if (tipo === 'regar') {
    // em pé: braço direito estendido inclinando a garrafa; mão esquerda na cintura
    const e = ease(Math.min(tt / 0.25, (dur - tt) / 0.25));
    baixar(rig, 0);
    rig.armR.rotation.x = -1.35 * e; rig.tronco.rotation.x = 0.12 * e;
    rig.armL.rotation.z = 0.35 * e; rig.cotoveloL.rotation.set(-0.6 * e, 0, -1.4 * e);
    rig.itemMao.garrafa.visible = true; rig.itemMao.garrafa.rotation.z = -2.1 * e;   // vira a garrafa para a água sair
    if (tt > 0.3 && (proxGota -= dt0) <= 0) { proxGota = 0.06; soltarGota(rig); }
  }
}
// direções dos braços (eixos do personagem) segurando o binóculo nos olhos
const MIRA_BIN = { LeftArm: new THREE.Vector3(0.4, -0.25, 0.85), RightArm: new THREE.Vector3(-0.4, -0.25, 0.85), LeftForeArm: new THREE.Vector3(-0.4, 0.95, 0.1), RightForeArm: new THREE.Vector3(0.4, 0.95, 0.1) };
let dt0 = 0;   // dt do quadro atual (usado pelas gotas na pose do Biólogo 3D)

// =====================================================================
//  Roda todo quadro (depois do updatePlayer). rig = o boneco do jogador.
// =====================================================================
export function updateAcoes(dt, t, rig) {
  dt0 = dt;
  // ---- binóculo: tecla B segurada (só sem painel, diálogo ou outra ação) ----
  binoculo = !!keys.KeyB && !atual && !panelOpen() && !dlgOpen() && !!rig.binOlhos;
  moldura.style.display = binoculo ? 'block' : 'none';
  const alvoFov = binoculo ? FOV_BINOCULO : FOV_NORMAL;
  if (Math.abs(camera.fov - alvoFov) > 0.05) { camera.fov += (alvoFov - camera.fov) * (1 - Math.exp(-9 * dt)); camera.updateProjectionMatrix(); }
  atualizarGotas(dt);

  if (atual) {
    atual.t += dt;
    const { tipo, dur } = atual, tt = atual.t;
    const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
    if (rig.esqueleto) poseEsqueleto(rig, tipo, tt, dur, ease);   // Biólogo 3D (com joelhos e coluna)
    else if (tipo === 'plantar' || tipo === 'coletar') {
      // agacha (meio ajoelhado: uma perna à frente, outra para trás), estica os braços até o chão e cava
      const fimAgacha = tipo === 'coletar' ? dur * 0.8 : dur;
      const ag = ease(Math.min(tt / 0.25, (fimAgacha - tt) / 0.25));
      baixar(rig, -0.36 * ag);
      rig.legR.rotation.x = -1.15 * ag; rig.legL.rotation.x = 0.8 * ag;
      const cava = Math.sin(tt * (tipo === 'plantar' ? 14 : 8)) * 0.18;
      rig.armL.rotation.x = (-0.75 - cava) * ag; rig.armR.rotation.x = (-0.75 + cava) * ag;
      if (tipo === 'coletar' && tt > dur * 0.6) {   // levanta a amostra (frasco) na mão direita
        rig.itemMao.frasco.visible = true; rig.armR.rotation.x = lerp(rig.armR.rotation.x, -1.35, ease((tt - dur * 0.6) / 0.3));
      }
    } else if (tipo === 'regar') {
      // em pé: braço direito estendido derramando a garrafa; braço esquerdo na cintura
      const e = ease(Math.min(tt / 0.25, (dur - tt) / 0.25));
      baixar(rig, 0);
      rig.armR.rotation.x = -1.25 * e; rig.armL.rotation.x = 0.2 * e; rig.armL.rotation.z = 0.5 * e;
      rig.itemMao.garrafa.visible = true; rig.itemMao.garrafa.rotation.x = 0.9 * e;
      if (tt > 0.3 && (proxGota -= dt) <= 0) { proxGota = 0.06; soltarGota(rig); }
    }
    if (tt >= dur) { const f = atual.aoFim; atual = null; baixar(rig, 0); limparItens(rig); if (f) f(); }
  } else if (binoculo && rig.esqueleto) {
    // Biólogo 3D: braços levantados e cotovelos dobrados, segurando o binóculo nos olhos
    Object.assign(rig.mira, MIRA_BIN);
    
    rig.binPeito.visible = false; rig.binOlhos.visible = true;
  } else if (binoculo) {
    // braços dobrados à frente, segurando o binóculo diante dos olhos
    baixar(rig, 0);
    rig.armL.rotation.x = rig.armR.rotation.x = -2.2; rig.armL.rotation.z = 0.55; rig.armR.rotation.z = -0.55;
    rig.legL.rotation.x = rig.legR.rotation.x = 0;
    rig.binPeito.visible = false; rig.binOlhos.visible = true;
  } else if (rig.binOlhos && rig.binOlhos.visible) {
    limparItens(rig);   // soltou o B: o binóculo volta para o peito
  }
}
