// =====================================================================
//  MISSÃO: SALVAR O LAGO DA MATA
//  Arquivo: missoes/lago/index.js — o "pacote" da missão. Ele diz ao motor
//  de missões (js/quest.js) tudo que essa missão tem: etapas, objetivos,
//  interações com a tecla E, falas e o que aparece no caderno e no mural.
//
//  Para criar uma missão nova: copie esta pasta, troque o conteúdo e
//  adicione a missão na lista de js/missoes/index.js.
// =====================================================================
import * as THREE from 'three';
import { Q, stage, STAGES } from './estado.js';
import {
  openKit, chemGame, microGame, amostrasBench, benchNeedsSample, diagnosticoPanel, resultsHTML, placaRecuperada,
} from './minigames.js';
import { say, showToast } from '../../interface.js';
import { labFx } from '../../lab.js';
import { lakeFx, updateLakeVisual } from '../../lake.js';
import { FLOOR_Y, PIER_Y, PIPE_M, PIPE_DIR, groundHeight } from '../../mapa.js';
import { chime, buzz } from '../../audio.js';
import { clamp } from '../../utils.js';
import { fazerAcao, acaoAtiva } from '../../acoes.js';

// Posição de cada bancada do laboratório (onde o jogador aperta E)
export const BENCH = { chem: new THREE.Vector3(-12.5, FLOOR_Y, -2.4), amostras: new THREE.Vector3(0, FLOOR_Y, -2.4), micro: new THREE.Vector3(12.5, FLOOR_Y, -2.4), mural: new THREE.Vector3(0, FLOOR_Y, -9.3) };
// Lugares das pistas perto do lago
export const PIPE_SPOT = () => PIPE_M.clone().addScaledVector(PIPE_DIR, 2.5);
export const SACK_SPOT = () => PIPE_M.clone().addScaledVector(PIPE_DIR, 10).addScaledVector(new THREE.Vector2(PIPE_DIR.y, -PIPE_DIR.x), -2.5);

// Quanto o lago deve melhorar com o que já foi feito (0 a 1)
const healthTarget = () => (Q.filter ? 0.34 : 0) + Q.plants / 6 * 0.33 + (Q.aerator ? 0.33 : 0);

const ETAPA_FINAL = 7;   // stage() === 7 quer dizer missão concluída

export const lago = {
  id: 'lago',
  titulo: 'Salvar o Lago da Mata',
  icone: '💧',
  resumo: 'O lago ficou verde, com cheiro forte e peixes morrendo. Descubra a causa e recupere a água.',
  // relatório entregue na prefeitura quando a missão termina (veja economia.js)
  relatorio: { verba: 1500, texto: 'Diagnóstico e recuperação do Lago da Mata (eutrofização por esgoto e adubo).' },

  // ---------- Situação da missão ----------
  iniciada: () => Q.started,
  concluida: () => stage() === ETAPA_FINAL,
  etapa: stage,

  // ---------- Começo: conversa de abertura pelo rádio ----------
  iniciar() {
    say([
      'Oi, pesquisador(a)! Aqui é a <b>Dra. Iara</b>, da Estação Bioma. 👋',
      'Moradores avisaram que o <b>Lago da Mata</b> ficou verde, com cheiro forte e peixes morrendo. Precisamos descobrir o porquê!',
      'Siga o <b>marcador amarelo</b> (e a trilha de terra) até o píer. Lá está o seu <b>kit de campo</b>. Aperte <b>E</b> para interagir.',
    ], '📻 Dra. Iara · rádio', () => { Q.started = true; });
  },

  // ---------- Rastreador (canto da tela) ----------
  // Devolve: número da etapa (ou null quando acabou), texto do objetivo e subtarefas
  rastreador(player) {
    const s = stage(), st = STAGES[s], subs = st.subs ? st.subs() : [];
    if (s === 1 && lakeFx.ring && Math.hypot(player.pos.x - lakeFx.ring.x, player.pos.z - lakeFx.ring.y) < 4) subs[0][1] = true;
    return { numero: s < ETAPA_FINAL ? s : null, agora: st.now, subs };
  },

  // ---------- Para onde o marcador amarelo aponta ----------
  alvo() {
    const s = stage(), v3 = (v2, y = 0) => new THREE.Vector3(v2.x, y, v2.y);
    const ringY = PIER_Y;
    if (s === 1 || s === 6) return v3(lakeFx.ring, ringY);
    if (s === 2) return BENCH.amostras;
    if (s === 3) {
      if (Q.coli === 0 || Q.coli === 2) return BENCH.amostras;
      if (!Q.micro) return BENCH.micro;
      if (!(Q.chemP && Q.chemN)) return BENCH.chem;
      return BENCH.amostras;
    }
    if (s === 4) return BENCH.mural;
    if (s === 5) {
      if (!Q.filter) { const p = PIPE_SPOT(); return v3(p, groundHeight(p.x, p.y)); }
      const sp = lakeFx.spots.find(x => !x.done); if (sp) return new THREE.Vector3(sp.x, groundHeight(sp.x, sp.z), sp.z);
      return v3(lakeFx.ring, ringY);
    }
    return null;
  },

  // ---------- Fala da Dra. Iara quando o jogador avança de etapa ----------
  falaDaEtapa(s) {
    if (s === 2) say(['Amostra coletada! Ela vale por <b>3 minutos</b>. Siga o marcador amarelo até a bancada <b>AMOSTRAS</b> no laboratório. Dica: segure <b>Shift</b> para correr!']);
    if (s === 3) say(['Amostra guardada na geladeira. ❄️', 'Agora são 3 análises: <b>coliformes</b>, <b>microscópio</b> e <b>testes químicos</b>. Comece pelos coliformes: a placa precisa de um tempo na estufa!']);
    if (s === 4) say(['Todas as análises prontas! 🎉 Vá ao <b>mural</b> no fundo do laboratório e descubra o que está causando o problema.']);
    if (s === 5) say(['Hora de agir! Siga o marcador: <b>biofiltro</b> no cano, <b>6 mudas</b> de mata ciliar e o <b>aerador solar</b> no píer.']);
    if (s === 6) say(['Olha só, a água já está mudando de cor! 💧 Volte ao píer e meça o <b>oxigênio</b> de novo com a sonda.']);
    if (s === 7) say(['Excelente trabalho! 🎉 Leve o <b>relatório</b> à <b>Prefeitura</b>, ao lado da praça. A secretária vai liberar uma <b>verba</b> para a Estação.', 'Com a verba você compra mudas, ferramentas e equipamentos na loja de lá. Aperte <b>I</b> para ver o seu inventário.']);
  },

  // ---------- Coisas que respondem à tecla E ----------
  // Cada item: pos (onde fica), r (raio em metros), label (texto do aviso; null = escondido), act (o que faz)
  interacoes() {
    const lista = [
      { pos: () => lakeFx.ring, r: 2.6, label: () => stage() === 5 && !Q.aerator ? 'Instalar aerador solar' : 'Kit de campo', act: () => {
        if (stage() === 5 && !Q.aerator) { Q.aerator = true; lakeFx.aer.visible = true; chime(); say(['☀️ Aerador instalado! Movido a energia solar, ele joga a água para o alto e <b>mistura ar</b> nela, devolvendo oxigênio para os peixes.'], '✔ Restauração'); }
        else openKit();
      } },
      { pos: () => new THREE.Vector2(BENCH.amostras.x, BENCH.amostras.z), r: 2.6, label: () => !Q.stored && Q.sample ? 'Guardar amostra na geladeira' : Q.coli === 1 ? `Estufa: ${Math.ceil(Q.coliT)} s` : 'Bancada AMOSTRAS', act: amostrasBench },
      { pos: () => new THREE.Vector2(BENCH.chem.x, BENCH.chem.z), r: 2.6, label: () => 'Bancada QUÍMICA', act: () => { if (!benchNeedsSample('os testes químicos')) chemGame(); } },
      { pos: () => new THREE.Vector2(BENCH.micro.x, BENCH.micro.z), r: 2.6, label: () => 'Microscópio', act: () => { if (!benchNeedsSample('o microscópio')) microGame(); } },
      { pos: PIPE_SPOT, r: 3.4, label: () => Q.filter ? null : stage() === 5 ? 'Instalar biofiltro' : 'Examinar o cano', act: () => {
        if (stage() === 5) { Q.filter = true; lakeFx.bio.visible = true; lakeFx.flow.visible = false; chime(); say(['🟩 Biofiltro instalado! Pedras, areia e plantas <b>filtram o esgoto</b> antes de chegar ao lago. A ilha flutuante de plantas absorve o resto dos nutrientes.'], '✔ Restauração'); }
        else say(['Um cano despejando água escura e fedida direto no lago… 🤢 Isso parece <b>esgoto</b>! Guarde essa pista.'], '🔎 Pista');
      } },
      { pos: SACK_SPOT, r: 2.8, label: () => Q.plants >= 6 ? null : 'Examinar os sacos', act: () => say(['Sacos de <b>ADUBO N-P-K</b> rasgados. Quando chove, a água leva o adubo para o lago… N = nitrogênio, P = fósforo!'], '🔎 Pista') },
    ];
    // as 6 covas da mata ciliar
    lakeFx.spots.forEach(sp => lista.push({ pos: () => new THREE.Vector2(sp.x, sp.z), r: 1.8, label: () => stage() === 5 && !sp.done ? `Plantar muda (${Q.plants + 1}/6)` : null, act: () => {
      if (acaoAtiva()) return;
      // o personagem agacha e cava; a muda aparece no fim da animação e depois ele rega
      fazerAcao('plantar', () => {
      sp.done = true; sp.mark.visible = false; sp.sap.visible = true; Q.plants++; chime();
      if (Q.plants === 6) { lakeFx.sacks.forEach(m => m.visible = false); say(['🌳 Mata ciliar plantada! As raízes seguram o solo e <b>barram o adubo</b> que escorre com a chuva. (E os sacos de adubo foram recolhidos!)'], '✔ Restauração'); }
      fazerAcao('regar');
      });
    } }));
    return lista;
  },

  // ---------- Mural de missões ----------
  rotuloMural: () => stage() === 4 ? 'Mural: fazer o diagnóstico' : null,
  // Botões extras que aparecem no cartão desta missão, dentro do mural
  acoesMural: () => stage() >= 4 ? [{ texto: stage() === 4 ? '📋 Fazer o diagnóstico' : '📋 Ver diagnóstico', destaque: stage() === 4, acao: diagnosticoPanel }] : [],

  // ---------- Caderno de campo (tecla C) ----------
  caderno: () => `<p class="tip"><b>Objetivo agora:</b> ${STAGES[stage()].now}</p>${resultsHTML()}`,

  // ---------- Salvar e carregar (veja js/save.js) ----------
  salvar: () => ({ Q: { ...Q }, mudas: lakeFx.spots.map(s => s.done) }),
  carregar(d) {
    Object.assign(Q, d.Q);
    // refaz no mundo o que o jogador já construiu
    if (Q.filter) { lakeFx.bio.visible = true; lakeFx.flow.visible = false; lakeFx.plume.material.opacity = 0; }
    if (Q.aerator) lakeFx.aer.visible = true;
    lakeFx.spots.forEach((s, i) => {
      if (!d.mudas?.[i]) return;
      s.done = true; s.grow = 1; s.mark.visible = false; s.sap.visible = true; s.sap.scale.setScalar(1.1);   // muda já crescida
    });
    if (Q.plants >= 6) lakeFx.sacks.forEach(m => m.visible = false);
    if (Q.won) placaRecuperada();
  },

  // ---------- Roda todo quadro (mesmo com a missão parada) ----------
  update(dt, t) {
    // amostra estragando
    if (Q.sample && !Q.stored) { Q.sampleT -= dt; if (Q.sampleT <= 0) { Q.sample = false; buzz(); say(['Ops… a amostra passou do tempo e <b>estragou</b> (as bactérias mudaram o resultado). Volte ao píer e colete outra — dessa vez, corra! (Shift)'], '📻 Dra. Iara · rádio'); } }
    // estufa
    if (Q.coli === 1) { Q.coliT -= dt; labFx.incub.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4; if (Q.coliT <= 0) { Q.coli = 2; chime(); showToast('🧫 A placa de coliformes está pronta!', '#2b8a3e'); } }
    else labFx.incub.emissiveIntensity = Q.coli === 2 ? 1.2 : 0.2;
    // covas visíveis só na etapa de restauração
    lakeFx.spots.forEach(sp => sp.mark.visible = stage() === 5 && !sp.done);
    // a saúde do lago vai melhorando aos poucos até o alvo
    Q.health += clamp(healthTarget() - Q.health, -dt * 0.12, dt * 0.12);
    updateLakeVisual(dt, Q.health, Q.filter);
  },
};
