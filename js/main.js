// =====================================================================
//  ESTAÇÃO BIOMA — protótipo 3D (Three.js)
//  Arquivo: main.js — o "maestro". Ele chama os outros arquivos para montar
//  o mundo e depois roda o jogo, quadro a quadro (uns 60 por segundo).
//
//  Mapa dos arquivos (pasta js/):
//    utils.js       matemática e números aleatórios
//    mapa.js        onde fica cada coisa + altura do chão
//    cena.js        renderizador, câmera, sol e céu
//    construcao.js  ferramentas para criar objetos e texturas
//    terreno.js     o chão
//    lab.js         o laboratório e a porta automática
//    lake.js        o lago, o píer, o cano e a saúde do lago
//    vegetacao.js   árvores, grama, flores, nuvens
//    player.js      personagem, movimento, colisão e câmera
//    audio.js       sons
//    controles.js   teclado, mouse e toque
//    interface.js   textos na tela, mini-mapa, diálogos e janelas
//    estado.js      progresso da missão (Q), etapa (stage) e teclas
//    minigames.js   as atividades da missão (Secchi, sonda, microscópio…)
//    quest.js       interações com E, marcador amarelo e rastreador
// =====================================================================
import * as THREE from 'three';
import { renderer, scene, camera } from './cena.js';
import { animated } from './construcao.js';
import { LAB, lakeNorm } from './mapa.js';
import { rr, isTouch } from './utils.js';
import { Q, stage, input, cam } from './estado.js';
import { buildTerrain } from './terreno.js';
import { buildLab, updateDoor } from './lab.js';
import { buildLake, updateLakeHealth, waterTime } from './lake.js';
import { buildVegetation, grassTime } from './vegetacao.js';
import { player, buildPlayer, updatePlayer, updateCamera, tickWaterWarn } from './player.js';
import { initAudio, audioReady, bird, frog } from './audio.js';
import { buildMapBg, drawMap, setZone, updateHud, panelOpen, dlgOpen, closePanel, promptEl, btnE } from './interface.js';
import { openKit, microGame, chemGame, muralPanel, amostrasBench, winPanel } from './minigames.js';
import { setupInteractions, updateInteract, updateQuest, startMission, objTarget } from './quest.js';
import './controles.js';   // só de importar, os controles já começam a "ouvir" o teclado e o mouse

// Espera a fonte carregar (para os letreiros desenhados em canvas ficarem bonitos)
try { await Promise.race([document.fonts.load('700 80px "Fredoka"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}

// =====================================================================
//  MONTAR O MUNDO
//  Atenção: a ORDEM importa! O gerador aleatório tem "semente", então
//  trocar a ordem muda a posição das árvores, das algas etc.
// =====================================================================
buildTerrain();
buildLab();
buildLake();
buildVegetation();
buildMapBg();
const rig = buildPlayer();
setupInteractions();
window.__game = { player, Q, stage, openKit, microGame, chemGame, muralPanel, amostrasBench, winPanel, closePanel, cam: (y, p) => { cam.yaw = y; cam.pitch = p; } };   // atalho para testes no console
cam.yaw = 0;                          // câmera atrás do jogador, olhando para o laboratório
player.yaw = Math.PI;

// ---------- Tela inicial: botão "Explorar" ----------
document.getElementById('loading').style.display = 'none';
const playBtn = document.getElementById('playBtn'); playBtn.style.display = 'inline-block';
playBtn.addEventListener('click', () => {
  initAudio(); input.started = true;
  document.getElementById('start').style.display = 'none';
  const cvs = renderer.domElement;
  if (!isTouch) { try { const p = cvs.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  setZone('🏢 Praça da Estação');
  startMission();
});

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ---------- Ambiente: nome da zona e sons de bichos ----------
let birdT = 2;   // segundos até o próximo canto de pássaro/sapo
function updateWorld(dt) {
  const p = player.pos;
  const inLab = Math.abs(p.x) < LAB.w / 2 && Math.abs(p.z) < LAB.d / 2;
  const nearLake = lakeNorm(p.x, p.z) < 1.7;
  const zone = inLab ? '🔬 Laboratório · Estação Bioma' : nearLake ? (Q.health > 0.9 ? '💧 Lago da Mata (em recuperação)' : '🦠 Lago da Mata (eutrofizado)') : (Math.hypot(p.x, p.z) < 30 ? '🏢 Praça da Estação' : '🌳 Floresta');
  setZone(zone);
  updateHud(dt);
  tickWaterWarn(dt);
  if (audioReady() && !inLab && (birdT -= dt) <= 0) { nearLake ? frog() : bird(); birdT = rr(2, 6); }
}

// =====================================================================
//  LAÇO PRINCIPAL (roda a cada quadro)
// =====================================================================
const clock = new THREE.Clock();
let elapsed = 0;   // segundos desde que o jogo abriu
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;   // dt = tempo desde o último quadro
  waterTime.value = elapsed; grassTime.value = elapsed;
  if (input.started) {
    const busy = panelOpen() || dlgOpen();      // com janela aberta o personagem fica parado
    if (!busy) { updatePlayer(dt, rig); updateInteract(); }
    else { input.interactQueued = false; input.jumpQueued = false; promptEl.style.display = 'none'; btnE.style.display = 'none'; }
    updateDoor(dt, elapsed); updateWorld(dt); updateQuest(dt, elapsed);
  }
  else { rig.g.position.copy(player.pos); rig.g.rotation.y = player.yaw; cam.yaw = Math.sin(elapsed * 0.1) * 0.5; }
  updateLakeHealth(dt, elapsed);
  animated.forEach(f => f(dt, elapsed));
  updateCamera(dt);
  drawMap(player, objTarget);
  renderer.render(scene, camera);
});
