// =====================================================================
//  MISSÃO: DE ONDE VEIO O ADUBO?  (monocultura e solo)
//  Arquivo: missoes/adubo/index.js — o "pacote" da missão (mesmo formato do
//  lago; veja o comentário de js/missoes/index.js).
//
//  FATIA A (pronta): fazenda, Seu Geraldo, trilha de sacos e conversa.
//  FATIA B (pronta): campo (mata × lavoura, com equipamentos pagos) e
//                    laboratório (bancada SOLO), com adiantamentos de verba.
//  FATIA C (pronta): diagnóstico no mural, conversa com argumentos, restauração
//                    (faixa de mata + adubação verde), esperar 30 dias, medir de novo
//                    e relatório com 1 a 3 estrelas (paga de R$ 1.200 a R$ 2.000).
// =====================================================================
import * as THREE from 'three';
import { A, SITES, SOLO, VERBA_ESTRELAS, estrelas, stage, STAGES } from './estado.js';
import { pontoPanel, bancadaSoloPanel, resultadosHTML, diagnosticoSoloPanel, convencerPanel, passarTempo, vitoriaPanel } from './minigames.js';
import { montarBancadaSolo, atualizarBancadaSolo, BANCADA_X } from './bancada.js';
import { stage as stageLago } from '../lago/estado.js';
import { say, showToast, openPanel, closePanel } from '../../interface.js';
import { addNPC } from '../../npc.js';
import { addLote } from '../../construir.js';
import { GERALDO_POS, SACOS_TRILHA } from '../../fazenda.js';
import { walkHeight, FLOOR_Y, PONTO_MATA, PONTO_LAVOURA } from '../../mapa.js';
import { BALCAO } from '../../prefeitura.js';
import { eco, qtd, ITENS } from '../../economia.js';
import { chime } from '../../audio.js';

const ETAPA_LAGO_FINAL = 7;   // stage() do lago === 7 quer dizer "lago concluído"
const PONTOS = { mata: PONTO_MATA, lavoura: PONTO_LAVOURA };
const BANCADA = new THREE.Vector2(BANCADA_X, -2.4);   // onde o jogador aperta E na bancada SOLO

// Lotes de restauração (criados em montar()): faixa de mata entre a lavoura e o lago, e adubação verde na borda da lavoura
const lotesMata = [], lotesVerde = [];
const lotesRest = () => [...lotesMata, ...lotesVerde];

// O que ainda falta COMPRAR para plantar tudo (mudas, sementes e pá). Devolve ids de ITENS.
function comprasFaltando() {
  const falta = [];
  const faltamMudas = lotesMata.filter(l => !l.feito).length, faltamSem = lotesVerde.filter(l => !l.feito).length;
  if ((faltamMudas || faltamSem) && qtd('pa') === 0) falta.push('pa');
  if (qtd('muda') < faltamMudas) falta.push('muda');
  if (qtd('sementes') < faltamSem) falta.push('sementes');
  return falta;
}

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
  concluida: () => stage() === 8,
  // relatório entregue na prefeitura: a verba depende das estrelas (veja estrelas() em estado.js)
  relatorio: {
    get verba() { return VERBA_ESTRELAS[estrelas() - 1]; },
    get texto() { return `Diagnóstico e recuperação do solo da Fazenda Boa Safra (monocultura). Nota: ${'⭐'.repeat(estrelas())}`; },
  },
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
    const falta = [...equipamentosFaltando(), ...(s === 6 ? comprasFaltando() : [])];
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
    if (s === 4) return new THREE.Vector3(0, FLOOR_Y, -9.3);               // o mural do laboratório
    if (s === 5) return v3(GERALDO_POS.x, GERALDO_POS.y);                   // conversar com o Seu Geraldo
    if (s === 6) {
      if (comprasFaltando().length) return BALCAO;                          // falta comprar: vai à loja
      const l = lotesRest().find(x => !x.feito); return l ? v3(l.x, l.z) : null;
    }
    if (s === 7) return !A.dias ? v3(GERALDO_POS.x, GERALDO_POS.y) : v3(PONTOS.lavoura.x, PONTOS.lavoura.z);
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
      'Agora vá ao <b>mural</b> do laboratório e monte o <b>diagnóstico</b>: a cadeia de causas que liga a mata cortada ao lago. Se quiser rever os números, abra o <b>caderno</b> (tecla <b>C</b>).',
    ]);
    if (s === 5) say(['Diagnóstico certo! 👏 Mas só isso não adianta: precisamos que o <b>Seu Geraldo concorde</b> em mudar.', 'Converse com ele e use os <b>dados da tabela</b> para responder às dúvidas dele, sem pressão e sem ameaça. É assim que a ciência convence!']);
    if (s === 6) say([
      'Ele topou! 🤝 Vamos <b>restaurar a borda da lavoura</b>: uma <b>faixa de mata</b> (8 mudas de ipê) entre a lavoura e o lago e <b>adubação verde</b> (6 sementes de feijão-de-porco) na borda do campo.',
      `Compre na <b>loja da Prefeitura</b>: 8 mudas (R$ ${ITENS.muda.preco * 8}), 6 sementes (R$ ${ITENS.sementes.preco * 6}) e a 🪏 pá, se ainda não tiver. Depois, siga as <b>bandeirinhas amarelas</b> e aperte <b>E</b>.`,
    ]);
    if (s === 7) say(['Tudo plantado! 🌳 Mas solo não se recupera de um dia pro outro. Converse com o Seu Geraldo para <b>esperar 30 dias</b>.', 'Depois, repita na lavoura a contagem de <b>minhocas</b> e o teste de <b>infiltração</b> (com os mesmos equipamentos) e compare com os números de antes.']);
    if (s === 8) say(['Olha só a diferença! 🎉 Mais minhocas e a água entrando bem mais rápido: o solo está <b>voltando à vida</b>.', 'Leve o <b>relatório</b> à <b>Prefeitura</b>. Quanto mais estrelas você tiver (cálculos sem erro, sonda de solo e argumentos certos), <b>mais verba</b> a Estação recebe.', 'Ah, e uma coisa: os equipamentos novos do laboratório estão <b>puxando muita energia</b>. Fique de olho nas luzes, a próxima investigação pode ser sobre isso… ⚡']);
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

  // ---------- Mural de missões ----------
  rotuloMural: () => stage() === 4 ? 'Mural: fazer o diagnóstico do solo' : null,
  acoesMural: () => stage() >= 4 ? [{ texto: stage() === 4 ? '📋 Fazer o diagnóstico' : '📋 Ver diagnóstico', destaque: stage() === 4, acao: diagnosticoSoloPanel }] : [],

  // ---------- Caderno de campo (tecla C) ----------
  caderno: () => `<p class="tip"><b>Objetivo agora:</b> ${STAGES[stage()].now}</p>
    <div class="card"><b>Pistas até agora</b><br>• Sacos de adubo <b>BOA SAFRA</b> no lago e na trilha.<br>${A.falou ? '• Seu Geraldo (Fazenda Boa Safra): "sem adubo, o solo não dá mais nada".' : '• Ainda falta conversar com o dono da fazenda.'}</div>
    ${A.falou ? `<p style="margin:12px 0 0"><b>Comparando os solos</b></p>${resultadosHTML()}` : ''}
    ${A.depois.minhocas !== null || A.depois.infilt !== null ? `<p style="margin:12px 0 0"><b>Lavoura 30 dias depois</b></p><table class="res"><tr><th></th><th>Antes</th><th>Depois</th></tr><tr><td>Minhocas</td><td>${A.solo.lavoura.minhocas ?? '—'}</td><td class="good-c">${A.depois.minhocas ?? '—'}</td></tr><tr><td>Infiltração de 1 L</td><td>${A.solo.lavoura.infilt !== null ? Math.floor(A.solo.lavoura.infilt / 60) + ':' + String(A.solo.lavoura.infilt % 60).padStart(2, '0') : '—'}</td><td class="good-c">${A.depois.infilt !== null ? Math.floor(A.depois.infilt / 60) + ':' + String(A.depois.infilt % 60).padStart(2, '0') : '—'}</td></tr></table>` : ''}`,

  // ---------- Salvar e carregar (veja js/save.js) ----------
  salvar: () => ({ A: JSON.parse(JSON.stringify(A)) }),
  carregar(d) { Object.assign(A, d.A); },

  // ---------- Roda todo quadro: mostra na bancada o que já foi comprado ----------
  update(dt, t) {
    atualizarBancadaSolo(t);
    // conta o que já foi plantado e só mostra as bandeirinhas depois que o Seu Geraldo concordou
    A.mudas = lotesMata.filter(l => l.feito).length; A.sementes = lotesVerde.filter(l => l.feito).length;
    for (const l of lotesRest()) l.marca.visible = A.conv.feito && !l.feito;
  },

  // ---------- Cria o Seu Geraldo e a bancada SOLO (chamado uma vez, no começo) ----------
  montar() {
    montarBancadaSolo();
    // faixa de mata (8 mudas) a 6 m da cerca, do lado do lago, deixando livre a trilha do portão
    for (const x of [-64, -58, -52, -47, -35, -30, -25, -20]) lotesMata.push(addLote({ nome: 'Faixa de mata', x, z: 137, tipo: 'canteiro', aceita: ['muda'], ativo: () => A.conv.feito }));
    // adubação verde (6 sementes) na borda da lavoura, dentro da cerca
    for (const x of [-63, -60, -57, -54, -51, -48]) lotesVerde.push(addLote({ nome: 'Adubação verde', x, z: 146.2, tipo: 'canteiro', aceita: ['sementes'], ativo: () => A.conv.feito }));
    addNPC({
      nome: 'Seu Geraldo', x: GERALDO_POS.x, z: GERALDO_POS.y, olhaPara: Math.PI,
      cores: { camisa: '#c92a2a', mangaLonga: true, calca: '#3b5b8c', sapato: '#5a3b22', chapeu: '#e0c27a', faixa: '#7a4b1f', cabelo: '#8a8a8a', cabeloTipo: 'curto', barba: '#9a9a9a', pele: '#b07a4f' },
      temMissao: () => A.started && (!A.falou || stage() === 5 || (stage() === 7 && !A.dias)),
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
          const st = stage();
          if (st <= 3) say(['Pode medir à vontade, tanto na mata (ali a oeste) quanto na lavoura. Eu quero ver esses números! 📊'], '💬 Seu Geraldo');
          else if (st === 4) say(['Já tem resultado? Faça o seu diagnóstico lá no laboratório primeiro, e depois venha me contar. 😅'], '💬 Seu Geraldo');
          else if (st === 5) say(['Então, o que você descobriu? Vou ouvir… mas vou discutir, viu?'], '💬 Seu Geraldo', convencerPanel);
          else if (st === 6) say(['As mudas vão na faixa lá na frente da cerca, e as sementes de adubação verde na borda da lavoura. Eu ajudo a cuidar! 🌱', 'Compre tudo na prefeitura e siga as bandeirinhas amarelas.'], '💬 Seu Geraldo');
          else if (st === 7 && !A.dias) {
            openPanel('⏳ Esperar o solo se recuperar', (b) => {
              b.innerHTML = '<p class="tip">As raízes e a adubação verde precisam de tempo para melhorar o solo. Quer <b>esperar 30 dias</b> e depois medir a lavoura de novo?</p><div class="row"><button class="btn" id="go">⏳ Esperar 30 dias</button></div>';
              b.querySelector('#go').onclick = () => { closePanel(); passarTempo(() => { A.dias = true; chime(); say(['Passaram 30 dias! 🌿 As mudas já pegaram e a adubação verde cobriu o chão.', 'Vá ao <b>ponto da lavoura</b> e meça de novo as minhocas e a infiltração.'], '💬 Seu Geraldo'); }); };
            });
          }
          else if (st === 7) say(['Vai lá na lavoura e meça de novo! O mesmo teste de antes, pra gente comparar. 📏'], '💬 Seu Geraldo');
          else say(['Olha só o solo! Nunca vi tanta minhoca aqui. Fui eu que não sabia, e você me mostrou com números. Obrigado, viu? 🙏'], '💬 Seu Geraldo', vitoriaPanel);
        }
      },
    });
  },
};
