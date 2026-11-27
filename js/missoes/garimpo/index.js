// =====================================================================
//  MISSÃO: O PEIXE QUE FAZ MAL  (garimpo, mercúrio e biomagnificação)
//  Arquivo: missoes/garimpo/index.js — o "pacote" da missão (mesmo formato do
//  lago; veja o comentário de js/missoes/index.js).
//
//  FATIA A (pronta): Lagoa Dourada a leste, Dona Rosa, teste da água no
//                    trapiche, análises no laboratório e diagnóstico no mural.
//                    A água dá NORMAL: a hipótese da eutrofização é descartada.
//  FATIA B (a fazer): ligação no celular, vara de pesca, pesca de 3 espécies,
//                    preparo do peixe, analisador de metais (Fe, Al normais;
//                    Hg e As altos), tabela periódica 3D, biomagnificação e relatório.
//  FATIA C (a fazer): mitigação em duas frentes (ambiental e social) e medir de novo.
//  O cenário (lagoa, córrego, garimpo e casas) fica em js/garimpo.js.
// =====================================================================
import * as THREE from 'three';
import { G, stage, STAGES } from './estado.js';
import { kitLagoa, labLagoa, diagnosticoLagoaPanel, resultadosHTML } from './minigames.js';
import { stage as stageAdubo } from '../adubo/estado.js';
import { say } from '../../interface.js';
import { addNPC } from '../../npc.js';
import { ROSA_POS, PONTO_AGUA, PLACA_GARIMPO, garimpoFx } from '../../garimpo.js';
import { FLOOR_Y, TRAPICHE_Y, walkHeight } from '../../mapa.js';
import { chime } from '../../audio.js';

const ETAPA_ADUBO_FINAL = 8;   // stage() da Missão 2 === 8 quer dizer "concluída"
// Ponto da bancada QUÍMICA usado por esta missão: a PONTA ESQUERDA da bancada
// (a análise do Lago da Mata fica no meio dela, em x = -12,5)
const LAB_PONTO = new THREE.Vector2(-15.3, -2.3);
const MURAL = new THREE.Vector3(0, FLOOR_Y, -9.3);
const v3 = (x, z) => new THREE.Vector3(x, walkHeight(x, z), z);

export const garimpo = {
  id: 'garimpo',
  titulo: 'O peixe que faz mal',
  icone: '🎣',
  resumo: 'Moradores da Lagoa Dourada estão passando mal depois de comer peixe. Investigue a água, o peixe e o garimpo abandonado.',

  // ---------- Trava: só abre depois da Missão 2 ----------
  bloqueada: () => stageAdubo() < ETAPA_ADUBO_FINAL ? 'Conclua "De onde veio o adubo?" primeiro.' : null,

  // ---------- Situação da missão ----------
  iniciada: () => G.started,
  concluida: () => false,   // a missão só termina na fatia C
  etapa: stage,

  // ---------- Começo: conversa de abertura pelo rádio ----------
  iniciar() {
    say([
      'Pesquisador(a), é a <b>Dra. Iara</b>. Chamado novo, e esse é sério! 📻',
      'A agente de saúde do posto ligou: moradores da <b>Lagoa Dourada</b>, a <b>leste</b> do laboratório, estão com <b>formigamento nas mãos, tremedeira e vista embaçada</b>. E dizem que tem uns <b>peixes estranhos</b> por lá.',
      'Vá até a comunidade e converse com a <b>Dona Rosa</b>, uma pescadora antiga. Siga o <b>marcador amarelo</b>. E lembre: primeiro a gente escuta e coleta dados!',
    ], '📻 Dra. Iara · rádio', () => { G.started = true; });
  },

  // ---------- Rastreador (canto da tela) ----------
  rastreador(player) {
    const s = stage(), st = STAGES[s], subs = st.subs ? st.subs() : [];
    if (s === 1 && Math.hypot(player.pos.x - ROSA_POS.x, player.pos.z - ROSA_POS.y) < 25) subs[0][1] = true;
    return { numero: s < 5 ? s : null, agora: st.now, subs };
  },

  // ---------- Para onde o marcador amarelo aponta ----------
  alvo() {
    const s = stage();
    if (s === 1) return v3(ROSA_POS.x, ROSA_POS.y);
    if (s === 2) return new THREE.Vector3(PONTO_AGUA.x, TRAPICHE_Y, PONTO_AGUA.y);
    if (s === 3) return new THREE.Vector3(LAB_PONTO.x, FLOOR_Y, LAB_PONTO.y);
    if (s === 4) return MURAL;
    return null;
  },

  // ---------- Fala da Dra. Iara quando o jogador avança de etapa ----------
  falaDaEtapa(s) {
    if (s === 2) say([
      'Sintomas no corpo todo e peixes estranhos… 🤔 Vamos começar pela hipótese mais comum: será que a lagoa está <b>eutrofizada</b>, como o Lago da Mata estava?',
      'No fim do <b>trapiche</b> tem um <b>kit de campo</b>: disco de Secchi, sonda e frasco. Teste a água e colete uma amostra.',
    ]);
    if (s === 3) say([
      'Amostra na caixa térmica! ❄️ Leve ao laboratório, na <b>ponta esquerda da bancada QUÍMICA</b>.',
      'Faça as mesmas análises do Lago da Mata: <b>fósforo, nitrogênio, coliformes e microscópio</b>. Assim dá para comparar as duas águas.',
    ]);
    if (s === 4) say(['Resultados prontos! 📊 Vá ao <b>mural</b> do laboratório e compare com o Lago da Mata. A lagoa está eutrofizada ou não?']);
    if (s === 5) say([
      'Então a água está boa… mas as pessoas continuam passando mal. 🤔 Isso quer dizer que a gente precisa <b>mudar de hipótese</b>.',
      'O que todos os doentes têm em comum? <b>Comem o peixe da lagoa</b>. A próxima pista está no peixe!',
      '🚧 <b>Continua em breve:</b> a pescaria, a análise do peixe e o mistério do garimpo.',
    ]);
  },

  // ---------- Coisas que respondem à tecla E ----------
  interacoes() {
    return [
      // kit de campo na ponta do trapiche
      { pos: () => PONTO_AGUA, r: 2.2, label: () => G.falouRosa ? 'Kit de campo da lagoa' : null, act: kitLagoa },
      // ponta esquerda da bancada QUÍMICA
      { pos: () => LAB_PONTO, r: 1.7, label: () => stage() === 3 ? 'Analisar a água da Lagoa Dourada' : null, act: labLagoa },
      // placa do garimpo (pista opcional, aparece no caderno)
      { pos: () => PLACA_GARIMPO, r: 3, label: () => 'Ler a placa', act: () => {
        say([
          'Um <b>garimpo de ouro abandonado</b>. A terra ficou pelada, cheia de montes de areia e uma <b>cava</b> com água barrenta. ⛏️',
          'Os tambores enferrujados têm um rótulo quase apagado… dá pra ler só "<b>…ÚRIO</b>". E o <b>córrego</b> que sai daqui desce direto para a Lagoa Dourada.',
        ], '🔎 Pista');
        if (!G.pistaGarimpo) { G.pistaGarimpo = true; chime(); }
      } },
    ];
  },

  // ---------- Mural de missões ----------
  rotuloMural: () => stage() === 4 ? 'Mural: diagnóstico da Lagoa Dourada' : null,
  acoesMural: () => stage() >= 4 ? [{ texto: stage() === 4 ? '📋 Fazer o diagnóstico' : '📋 Ver diagnóstico', destaque: stage() === 4, acao: diagnosticoLagoaPanel }] : [],

  // ---------- Caderno de campo (tecla C) ----------
  caderno: () => `<p class="tip"><b>Objetivo agora:</b> ${STAGES[stage()].now}</p>
    <div class="card"><b>O que já sabemos</b><br>
      ${G.falouRosa ? '• Dona Rosa: formigamento nas mãos, tremedeira e vista embaçada. Quem mais passa mal come peixe quase todo dia.<br>• Alguns peixes nadam meio tontos.' : '• Ainda falta conversar com a Dona Rosa.'}
      ${G.pistaGarimpo ? '<br>• Garimpo abandonado rio acima. Tambores com rótulo "…ÚRIO". O córrego desce para a lagoa.' : ''}
      ${G.diag ? '<br>• A água está normal: <b>não é eutrofização</b>. Próxima pista: o peixe.' : ''}</div>
    ${G.falouRosa ? `<p style="margin:12px 0 0"><b>Análises da água</b></p>${resultadosHTML()}` : ''}`,

  // ---------- Salvar e carregar (veja js/save.js) ----------
  salvar: () => ({ G: JSON.parse(JSON.stringify(G)) }),
  carregar(d) { Object.assign(G, d.G); G.lab = { ...G.lab, ...(d.G.lab || {}) }; },

  // ---------- Roda todo quadro: a argola do kit pisca enquanto falta testar a água ----------
  update(dt, t) {
    if (garimpoFx.anel) { garimpoFx.anel.visible = G.falouRosa && stage() === 2; garimpoFx.anel.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.5; }
  },

  // ---------- Cria a Dona Rosa (chamado uma vez, no começo) ----------
  montar() {
    addNPC({
      nome: 'Dona Rosa', x: ROSA_POS.x, z: ROSA_POS.y, olhaPara: Math.PI / 2,
      cores: { corpo: 'mulher', camisa: '#e8590c', calca: '#5c4a3a', sapato: '#3b2a1f', cabelo: '#d0d0d0', cabeloTipo: 'comprido', pele: '#8d5a3b', chapeu: '#e0c27a', faixa: '#c92a2a' },
      temMissao: () => G.started && !G.falouRosa,
      aoFalar: () => {
        if (!G.started) {
          say(['Boa tarde! Aqui é a <b>comunidade da Lagoa Dourada</b>. A gente vive da pesca há muitos anos. 🎣', 'Ultimamente o pessoal anda meio adoentado… se a Estação Bioma puder ajudar, venha conversar.'], '💬 Dona Rosa');
        } else if (!G.falouRosa) {
          say([
            'Ah, você é da Estação Bioma! Graças a Deus. Sou a <b>Rosa</b>, pescadora desde menina. 👵',
            'Faz um tempo que o pessoal daqui sente <b>formigamento nas mãos e nos pés</b>, <b>tremedeira</b> e a <b>vista embaçada</b>. Meu neto anda esquecido, sem conseguir prestar atenção na escola…',
            'E a gente come peixe <b>quase todo dia</b>, viu? Traíra, tucunaré, lambari… Uns peixes andam esquisitos, <b>nadando meio tontos</b>.',
            'Mas a água é <b>limpinha</b>! A gente toma banho, lava roupa… Não é como aquele lago verde do outro lado.',
            'Ah, e lá pra cima do <b>córrego</b>, perto dos morros, tinha um <b>garimpo de ouro</b>. Fechou faz uns dez anos, largaram tudo lá.',
          ], '💬 Dona Rosa', () => { G.falouRosa = true; chime(); });
        } else {
          const s = stage();
          if (s === 2) say(['O kit da Estação está lá na ponta do trapiche. Pode medir à vontade, a água é transparente! 💧'], '💬 Dona Rosa');
          else if (s <= 4) say(['E aí, a água tem algum problema? Fico aflita esperando o resultado…'], '💬 Dona Rosa');
          else say(['A água está boa? Então o que está fazendo a gente passar mal? 😟', 'Se precisar de peixe pra estudar, é só falar. Aqui não falta!'], '💬 Dona Rosa');
        }
      },
    });
  },
};
