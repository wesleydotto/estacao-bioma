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
//    boneco.js      o modelo de pessoa (jogador e NPCs)
//    npc.js         personagens que conversam com o jogador (addNPC)
//    save.js        salvar e carregar o progresso (localStorage)
//    economia.js    verba (R$), inventário, loja e relatórios
//    prefeitura.js  o prédio da prefeitura e a secretária
//    fazenda.js     a Fazenda Boa Safra (lavoura, cerca, galpão e sacos de adubo)
//    construir.js   lugares marcados onde se usa o que foi comprado
//    audio.js       sons
//    controles.js   teclado, mouse e toque
//    interface.js   textos na tela, mini-mapa, diálogos e janelas
//    estado.js      teclas, câmera e qual missão está ativa
//    quest.js       motor de missões: interações com E, marcador, rastreador,
//                   mural e caderno
//    missoes/       uma pasta para cada missão (lista em missoes/index.js)
//      lago/        "Salvar o Lago da Mata": estado.js (Q e stage),
//                   minigames.js (atividades) e index.js (o pacote da missão)
//      adubo/       "De onde veio o adubo?" (monocultura e solo), em construção
// =====================================================================
import * as THREE from 'three';
import { renderer, scene, camera } from './cena.js';
import { renderizar, redimensionar } from './graficos.js';
import { NIVEIS, nivelAtual, trocarNivel } from './qualidade.js';
import { animated } from './construcao.js';
import { LAB, lakeNorm, distToFazenda } from './mapa.js';
import { rr, isTouch } from './utils.js';
import { input, cam, jogo } from './estado.js';
import { Q, stage } from './missoes/lago/estado.js';
import { A } from './missoes/adubo/estado.js';
import { buildTerrain } from './terreno.js';
import { buildLab, updateDoor } from './lab.js';
import { buildLake, waterTime, lakeFx } from './lake.js';
import { buildVegetation, grassTime } from './vegetacao.js';
import { player, buildPlayer, updatePlayer, updateCamera, tickWaterWarn } from './player.js';
import { initAudio, audioReady, bird, frog } from './audio.js';
import { buildMapBg, drawMap, setZone, updateHud, panelOpen, dlgOpen, closePanel, promptEl, btnE } from './interface.js';
import { openKit, microGame, chemGame, diagnosticoPanel, amostrasBench, winPanel } from './missoes/lago/minigames.js';
import { ativa, setupInteractions, montarMissoes, updateInteract, updateQuest, updateMissoes, novoJogo, muralPanel, notebook, objTarget } from './quest.js';
import { addNPC, updateNPCs } from './npc.js';
import { updateAcoes, acaoAtiva, binoculoLigado, fazerAcao, estadoAcao } from './acoes.js';
import { buildPrefeitura } from './prefeitura.js';
import { buildFazenda } from './fazenda.js';
import { montarLotes, lotes } from './construir.js';
import { eco, atualizarHudVerba } from './economia.js';
import { temSave, salvar, carregar, apagarSave, updateSave } from './save.js';
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
buildPrefeitura();   // não usa o gerador com semente, então pode vir depois
buildFazenda();      // idem (tem o gerador próprio, só da fazenda)
montarLotes();
buildMapBg();
atualizarHudVerba();
const rig = buildPlayer();
montarMissoes();
setupInteractions();
window.__game = { player, Q, A, lotes, fazerAcao, estadoAcao, camera, stage, openKit, microGame, chemGame, diagnosticoPanel, muralPanel, notebook, addNPC, eco, salvar, carregar, apagarSave, jogo, lakeFx, amostrasBench, winPanel, closePanel, cam: (y, p) => { cam.yaw = y; cam.pitch = p; } };   // atalho para testes no console
cam.yaw = 0;                          // câmera atrás do jogador, olhando para o laboratório
player.yaw = Math.PI;

// ---------- Tela inicial: "Explorar" (ou "Continuar" e "Novo jogo" se tiver save) ----------
document.getElementById('loading').style.display = 'none';
const playBtn = document.getElementById('playBtn'), continueBtn = document.getElementById('continueBtn');
playBtn.style.display = 'inline-block';
if (temSave()) {
  continueBtn.style.display = 'inline-block';
  playBtn.textContent = 'Novo jogo'; playBtn.className = 'sec';
}
// ---------- Seletor de gráficos (Alta, Média, Baixa) na tela inicial ----------
{
  const box = document.getElementById('graficosBtns');
  for (const [id, n] of Object.entries(NIVEIS)) {
    const b = document.createElement('button');
    b.textContent = n.nome; b.className = 'gq' + (id === nivelAtual ? ' on' : '');
    b.addEventListener('click', () => { if (id !== nivelAtual) trocarNivel(id); });   // troca e recarrega a página
    box.appendChild(b);
  }
}
function comecar() {
  initAudio(); input.started = true;
  document.getElementById('start').style.display = 'none';
  const cvs = renderer.domElement;
  if (!isTouch) { try { const p = cvs.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
}
playBtn.addEventListener('click', () => {
  if (temSave() && !confirm('Começar do zero? O progresso salvo será apagado.')) return;
  apagarSave();
  comecar();
  setZone('🏢 Praça da Estação');
  novoJogo();
});
continueBtn.addEventListener('click', () => {
  if (!carregar()) { apagarSave(); location.reload(); return; }   // save estragado: começa de novo
  comecar();
  // se a missão ativa ainda nem tinha começado (fechou na conversa de abertura), mostra a conversa
  if (!ativa().iniciada()) novoJogo();
});

addEventListener('resize', redimensionar);

// ---------- Ambiente: nome da zona e sons de bichos ----------
let birdT = 2;   // segundos até o próximo canto de pássaro/sapo
function updateWorld(dt) {
  const p = player.pos;
  const inLab = Math.abs(p.x) < LAB.w / 2 && Math.abs(p.z) < LAB.d / 2;
  const nearLake = lakeNorm(p.x, p.z) < 1.7;
  const naFazenda = distToFazenda(p.x, p.z) < 2;
  const zone = naFazenda ? '🌾 Fazenda Boa Safra' : inLab ? '🔬 Laboratório · Estação Bioma' : nearLake ? (Q.health > 0.9 ? '💧 Lago da Mata (em recuperação)' : '🦠 Lago da Mata (eutrofizado)') : (Math.hypot(p.x, p.z) < 30 ? '🏢 Praça da Estação' : '🌳 Floresta');
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
    const busy = panelOpen() || dlgOpen() || acaoAtiva() || binoculoLigado();   // com janela aberta, animação ou binóculo o personagem fica parado
    if (!busy) { updatePlayer(dt, rig); updateInteract(); }
    else { input.interactQueued = false; input.jumpQueued = false; promptEl.style.display = 'none'; btnE.style.display = 'none'; }
    updateAcoes(dt, elapsed, rig);   // animações: plantar, regar, coletar e binóculo (tecla B)
    updateDoor(dt, elapsed); updateWorld(dt); updateQuest(dt, elapsed);
  }
  else { rig.g.position.copy(player.pos); rig.g.rotation.y = player.yaw; cam.yaw = Math.sin(elapsed * 0.1) * 0.5; }
  updateMissoes(dt, elapsed);
  updateNPCs(dt, elapsed);
  updateSave(dt);
  animated.forEach(f => f(dt, elapsed));
  updateCamera(dt);
  drawMap(player, objTarget);
  renderizar();   // desenha a cena (com o acabamento do graficos.js)
});
