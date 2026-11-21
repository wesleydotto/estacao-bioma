// =====================================================================
//  MISSÃO: DE ONDE VEIO O ADUBO?  (monocultura e solo)
//  Arquivo: missoes/adubo/index.js — o "pacote" da missão (mesmo formato do
//  lago; veja o comentário de js/missoes/index.js).
//
//  FATIA A (pronta): fazenda, Seu Geraldo, trilha de sacos e conversa.
//  Próximas fatias: campo e laboratório (equipamentos pagos), diagnóstico,
//  convencer o fazendeiro com dados, restauração e medir de novo.
// =====================================================================
import * as THREE from 'three';
import { A, stage, STAGES } from './estado.js';
import { stage as stageLago } from '../lago/estado.js';
import { say, showToast } from '../../interface.js';
import { addNPC } from '../../npc.js';
import { GERALDO_POS, SACOS_TRILHA } from '../../fazenda.js';
import { walkHeight } from '../../mapa.js';
import { eco } from '../../economia.js';
import { chime } from '../../audio.js';

const ETAPA_LAGO_FINAL = 7;   // stage() do lago === 7 quer dizer "lago concluído"

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
    const s = stage(), st = STAGES[s];
    return { numero: s, agora: st.now, subs: st.subs ? st.subs() : [] };
  },

  // ---------- Para onde o marcador amarelo aponta ----------
  alvo() {
    if (stage() === 1) {
      const i = A.sacos.findIndex(f => !f);   // próximo saco ainda não examinado
      const p = i >= 0 ? SACOS_TRILHA[i] : GERALDO_POS;
      return new THREE.Vector3(p.x, walkHeight(p.x, p.y), p.y);
    }
    return null;
  },

  // ---------- Fala da Dra. Iara quando o jogador avança de etapa ----------
  falaDaEtapa(s) {
    if (s === 2) say([
      'O Seu Geraldo topou deixar a gente medir o solo! 🤝 Vamos <b>comparar a mata com a lavoura</b>: minhocas, infiltração da água e matéria orgânica.',
      'Só que isso pede <b>equipamentos novos</b> no laboratório: 🥤 <b>kit de infiltração</b>, 🔍 <b>lupa de campo</b> e ⚖️ <b>balança com estufa de solo</b>. Veja os preços na <b>loja da Prefeitura</b> e planeje a sua verba!',
      '🚧 <i>(Aviso do desenvolvimento: a parte de medir o solo chega na próxima atualização do jogo.)</i>',
    ]);
  },

  // ---------- Coisas que respondem à tecla E ----------
  interacoes() {
    const lista = SACOS_TRILHA.map((p, i) => ({
      pos: () => p, r: 2.4, label: () => 'Examinar os sacos',
      act: () => {
        if (i === 0) say(['Mais <b>sacos de adubo</b> pelo caminho, com um rastro de grânulos brancos no chão… 🔎', 'Dá pra ler a marca: <b>BOA SAFRA · N-P-K 10-10-10</b>. N = nitrogênio, P = fósforo, K = potássio. A trilha continua para o norte!'], '🔎 Pista');
        else say(['Outro saco caído, bem perto da <b>cerca de uma fazenda</b>. 🌾', 'O rastro de adubo vem do lago até aqui. Vale conversar com o dono, sem acusar ninguém: primeiro a gente <b>coleta dados</b>.'], '🔎 Pista');
        if (!A.sacos[i]) { A.sacos[i] = true; chime(); if (A.started) showToast(`🔎 Pista ${A.sacos.filter(Boolean).length}/${A.sacos.length}`, '#2b8a3e'); }
      },
    }));
    return lista;
  },

  // ---------- Caderno de campo (tecla C) ----------
  caderno: () => `<p class="tip"><b>Objetivo agora:</b> ${STAGES[stage()].now}</p>
    <div class="card"><b>Pistas até agora</b><br>• Sacos de adubo <b>BOA SAFRA</b> no lago e na trilha.<br>${A.falou ? '• Seu Geraldo (Fazenda Boa Safra): "sem adubo, o solo não dá mais nada".' : '• Ainda falta conversar com o dono da fazenda.'}</div>`,

  // ---------- Salvar e carregar (veja js/save.js) ----------
  salvar: () => ({ A: { ...A, sacos: [...A.sacos] } }),
  carregar(d) { Object.assign(A, d.A); },

  // ---------- Cria o Seu Geraldo no mundo (chamado uma vez, no começo) ----------
  montar() {
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
        } else {
          say(['Quando tiver os equipamentos, pode medir à vontade, tanto na mata quanto na lavoura. Eu quero ver esses números! 📊'], '💬 Seu Geraldo');
        }
      },
    });
  },
};
