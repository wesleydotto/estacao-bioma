// =====================================================================
//  MISSÃO: DE ONDE VEIO O ADUBO?  (monocultura e solo)
//  Arquivo: missoes/adubo/index.js — o "pacote" da missão (mesmo formato do
//  lago; veja o comentário de js/missoes/index.js).
//
//  FATIA A (pronta): fazenda, Seu Geraldo, trilha de sacos e conversa.
//  FATIA B (pronta): campo (mata × lavoura, com equipamentos pagos) e
//                    laboratório (bancada SOLO), com adiantamentos de verba.
//  Próxima fatia: diagnóstico, convencer o fazendeiro com dados, restauração,
//  medir de novo e relatório com estrelas.
// =====================================================================
import * as THREE from 'three';
import { A, SITES, SOLO, stage, STAGES } from './estado.js';
import { pontoPanel, bancadaSoloPanel, resultadosHTML } from './minigames.js';
import { montarBancadaSolo, atualizarBancadaSolo, BANCADA_X } from './bancada.js';
import { stage as stageLago } from '../lago/estado.js';
import { say, showToast } from '../../interface.js';
import { addNPC } from '../../npc.js';
import { GERALDO_POS, SACOS_TRILHA } from '../../fazenda.js';
import { walkHeight, FLOOR_Y, PONTO_MATA, PONTO_LAVOURA } from '../../mapa.js';
import { BALCAO } from '../../prefeitura.js';
import { eco, qtd, ITENS } from '../../economia.js';
import { chime } from '../../audio.js';

const ETAPA_LAGO_FINAL = 7;   // stage() do lago === 7 quer dizer "lago concluído"
const PONTOS = { mata: PONTO_MATA, lavoura: PONTO_LAVOURA };
const BANCADA = new THREE.Vector2(BANCADA_X, -2.4);   // onde o jogador aperta E na bancada SOLO

// Equipamentos que AINDA faltam para o que o jogador precisa fazer agora (a lista muda conforme o progresso)
function equipamentosFaltando() {
  const falta = new Set(), s = stage();
  if (s === 2) {
    for (const site of SITES) {
      const d = A.solo[site];
      if (!d.amostra) falta.add('pa');
      if (d.minhocas === null || d.insetos === null) falta.add('lupaCampo');
      if (d.infilt === null) falta.add('kitInfiltracao');
    }
  }
  if (s === 3) falta.add('balancaSolo');
  return [...falta].filter(id => qtd(id) === 0);
}
const nomes = (ids) => ids.map(id => `${ITENS[id].icone} ${ITENS[id].nome.split(' (')[0].toLowerCase()}`).join(', ');
const v3 = (x, z) => new THREE.Vector3(x, walkHeight(x, z), z);

export const adubo = {
  id: 'adubo',
  titulo: 'De onde veio o adubo?',
  icone: '🌾',
  resumo: 'Os sacos de adubo do lago têm a marca de uma fazenda. Descubra por que usam tanto adubo e como o solo se relaciona com o lago.',

  // ---------- Trava: só abre depois do Lago (e do relatório entregue, para a verba já estar na mão) ----------
  bloqueada: () => stageLago() < ETAPA_LAGO_FINAL ? 'Conclua "Salvar o Lago da Mata" primeiro.'
    : !eco.relatorios.lago ? 'Entregue o relatório do lago na Prefeitura primeiro (você vai precisar da verba).' : null,

  // ---------- Situação da missão ----------
  iniciada: () => A.started,
  concluida: () => false,   // (as etapas finais chegam nas próximas fatias)
  etapa: stage,

  // ---------- Começo: conversa de abertura pelo rádio ----------
  iniciar() {
    say([
      'Pesquisador(a), a <b>Dra. Iara</b> de novo! 📻',
      'Lembra dos <b>sacos de adubo</b> rasgados perto do cano do lago? Eles têm a marca <b>BOA SAFRA</b>. Existe uma fazenda de soja com esse nome ao norte do lago.',
      'Será que o adubo veio de lá? E por que usam tanto? Siga o <b>marcador amarelo</b> pela <b>trilha de sacos</b>. Mas lembre: a gente investiga com <b>dados</b>, sem acusar ninguém antes da hora!',
    ], '📻 Dra. Iara · rádio', () => { A.started = true; });
  },

  // ---------- Rastreador (canto da tela) ----------
  rastreador() {
    const s = stage(), st = STAGES[s], subs = st.subs ? st.subs() : [];
    const falta = equipamentosFaltando();
    if (falta.length) subs.push([`🛒 Compre na Prefeitura: ${nomes(falta)}`, false]);
    return { numero: s, agora: st.now, subs };
  },

  // ---------- Para onde o marcador amarelo aponta ----------
  alvo() {
    const s = stage();
    if (s === 1) {
      const i = A.sacos.findIndex(f => !f);   // próximo saco ainda não examinado
      const p = i >= 0 ? SACOS_TRILHA[i] : GERALDO_POS;
      return v3(p.x, p.y);
    }
    // faltou equipamento? o marcador leva até a loja da Prefeitura
    if ((s === 2 || s === 3) && equipamentosFaltando().length) return BALCAO;
    if (s === 2) {
      const site = SITES.find(x => A.solo[x].amostra === false || A.solo[x].minhocas === null || A.solo[x].infilt === null || A.solo[x].insetos === null);
      return v3(PONTOS[site].x, PONTOS[site].z);
    }
    if (s === 3) return new THREE.Vector3(BANCADA.x, FLOOR_Y, BANCADA.y);
    return null;
  },

  // ---------- Fala da Dra. Iara quando o jogador avança de etapa ----------
  falaDaEtapa(s) {
    if (s === 2) say([
      'O Seu Geraldo topou deixar a gente medir o solo! 🤝 Vamos <b>comparar a mata com a lavoura</b>.',
      'São <b>dois pontos de coleta</b> (bandeirinhas): o <b>fragmento de mata</b>, a oeste da fazenda, e a <b>lavoura</b>. Em cada um: coletar terra, contar minhocas, teste de infiltração e contar insetos.',
      'Isso pede <b>equipamentos</b>: 🪏 <b>pá</b>, 🔍 <b>lupa de campo</b> e 🥤 <b>kit de infiltração</b>. Veja os preços na <b>loja da Prefeitura</b>, e planeje a sua verba! A 🌡️ sonda de solo é opcional, mas vale bônus.',
    ]);
    if (s === 3) say([
      'Dados de campo anotados! 📊 A prefeitura mandou um <b>adiantamento</b> pelo seu trabalho.',
      'Agora, no laboratório, a bancada <b>SOLO</b> mede a <b>matéria orgânica</b> das duas amostras. Você vai precisar da ⚖️ <b>balança com estufa de solo</b>, que também está na loja.',
    ]);
    if (s === 4) say([
      'Resultado na mesa: o solo da <b>mata</b> tem mais minhocas, absorve a água rápido e é rico em matéria orgânica. O da <b>lavoura</b> é o contrário! 🔬',
      'Abra o <b>caderno</b> (tecla <b>C</b>) para ver a tabela comparando os dois.',
      '🚧 <i>(Aviso do desenvolvimento: o diagnóstico e a conversa com o Seu Geraldo chegam na próxima atualização do jogo.)</i>',
    ]);
  },

  // ---------- Coisas que respondem à tecla E ----------
  interacoes() {
    // pistas na trilha de sacos
    const lista = SACOS_TRILHA.map((p, i) => ({
      pos: () => p, r: 2.4, label: () => 'Examinar os sacos',
      act: () => {
        if (i === 0) say(['Mais <b>sacos de adubo</b> pelo caminho, com um rastro de grânulos brancos no chão… 🔎', 'Dá pra ler a marca: <b>BOA SAFRA · N-P-K 10-10-10</b>. N = nitrogênio, P = fósforo, K = potássio. A trilha continua para o norte!'], '🔎 Pista');
        else say(['Outro saco caído, bem perto da <b>cerca de uma fazenda</b>. 🌾', 'O rastro de adubo vem do lago até aqui. Vale conversar com o dono, sem acusar ninguém: primeiro a gente <b>coleta dados</b>.'], '🔎 Pista');
        if (!A.sacos[i]) { A.sacos[i] = true; chime(); if (A.started) showToast(`🔎 Pista ${A.sacos.filter(Boolean).length}/${A.sacos.length}`, '#2b8a3e'); }
      },
    }));
    // pontos de coleta de solo (só depois de conversar com o Seu Geraldo)
    for (const site of SITES) lista.push({
      pos: () => new THREE.Vector2(PONTOS[site].x, PONTOS[site].z), r: 3,
      label: () => A.falou ? `Ponto de coleta: ${SOLO[site].nome}` : null,
      act: () => pontoPanel(site),
    });
    // bancada SOLO do laboratório
    lista.push({ pos: () => BANCADA, r: 2.2, label: () => A.falou ? 'Bancada SOLO' : null, act: () => bancadaSoloPanel() });
    return lista;
  },

  // ---------- Caderno de campo (tecla C) ----------
  caderno: () => `<p class="tip"><b>Objetivo agora:</b> ${STAGES[stage()].now}</p>
    <div class="card"><b>Pistas até agora</b><br>• Sacos de adubo <b>BOA SAFRA</b> no lago e na trilha.<br>${A.falou ? '• Seu Geraldo (Fazenda Boa Safra): "sem adubo, o solo não dá mais nada".' : '• Ainda falta conversar com o dono da fazenda.'}</div>
    ${A.falou ? `<p style="margin:12px 0 0"><b>Comparando os solos</b></p>${resultadosHTML()}` : ''}`,

  // ---------- Salvar e carregar (veja js/save.js) ----------
  salvar: () => ({ A: JSON.parse(JSON.stringify(A)) }),
  carregar(d) { Object.assign(A, d.A); },

  // ---------- Roda todo quadro: mostra na bancada o que já foi comprado ----------
  update(dt, t) { atualizarBancadaSolo(t); },

  // ---------- Cria o Seu Geraldo e a bancada SOLO (chamado uma vez, no começo) ----------
  montar() {
    montarBancadaSolo();
    addNPC({
      nome: 'Seu Geraldo', x: GERALDO_POS.x, z: GERALDO_POS.y, olhaPara: Math.PI,
      cores: { camisa: '#c92a2a', calca: '#3b5b8c', chapeu: '#e0c27a', faixa: '#7a4b1f', cabelo: '#4a4a4a', pele: '#b07a4f' },
      temMissao: () => A.started && !A.falou,
      aoFalar: () => {
        if (!A.started) {
          say(['Bom dia! Aqui é a <b>Fazenda Boa Safra</b>. Planto soja faz mais de 20 anos. 👨‍🌾', 'Se for da Estação Bioma, volte quando tiver uma missão pra mim… ou uma boa conversa sobre solo!'], '💬 Seu Geraldo');
        } else if (!A.falou) {
          say([
            'Opa, bom dia! Sou o <b>Geraldo</b>, o dono da fazenda. 👨‍🌾 Você é da Estação Bioma, né? Vi você olhando os meus sacos de adubo…',
            'Eu <b>não sou bandido</b>, viu? Quando comprei essa terra, ela dava de tudo. Hoje, sem muito adubo, <b>quase nada nasce</b>. Eu preciso colher!',
            'É verdade que, quando chove forte, a água desce o morro e leva um pouco de adubo pro lago. Mas eu não sei se o problema do lago sou eu.',
            'Se você quer saber o que está acontecendo, <b>prove com dados</b>. Deixo você medir o solo da minha lavoura e comparar com o da mata aqui perto. Combinado?',
          ], '💬 Seu Geraldo', () => { A.falou = true; chime(); });
        } else if (stage() <= 2) {
          say(['Pode medir à vontade, tanto na mata (ali a oeste) quanto na lavoura. Eu quero ver esses números! 📊'], '💬 Seu Geraldo');
        } else {
          say(['E aí, o que deu a comparação? Estou curioso… e um pouco com medo do resultado. 😅'], '💬 Seu Geraldo');
        }
      },
    });
  },
};
