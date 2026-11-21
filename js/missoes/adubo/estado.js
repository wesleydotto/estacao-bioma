// Arquivo: missoes/adubo/estado.js — o progresso da missão "De onde veio o adubo?"
// (objeto A), os dados "verdadeiros" do solo (SOLO) e a função stage(), que diz
// em que etapa o jogador está.
// Não importa nenhum outro arquivo, então todos podem usar sem dar "nó".
//
// Ciclo da missão (mesmo do lago): pista → campo → laboratório → diagnóstico → agir → medir de novo.
// Etapas: 1 pista e conversa · 2 campo · 3 laboratório · 4 diagnóstico (mural) ·
//         5 convencer o Seu Geraldo · 6 restauração · 7 esperar 30 dias e medir de novo · 8 concluída.

// Um ponto de coleta (mata ou lavoura). null = ainda não medido.
const novoPonto = () => ({ amostra: false, minhocas: null, infilt: null, insetos: null, tipos: 0, sonda: false });

export const A = {
  started: false,
  sacos: [false, false],            // quais sacos da trilha já foram examinados
  falou: false,                     // já conversou com o Seu Geraldo
  solo: { mata: novoPonto(), lavoura: novoPonto() },   // resultados do campo
  mo: { mata: null, lavoura: null },                   // matéria orgânica (%) calculada no laboratório
  moErros: 0,                       // quantas vezes o aluno errou o cálculo (vale bônus se for zero)
  pagos: {},                        // pagamentos já recebidos: { campo, lab, precisao, sonda }
  diag: false,                      // diagnóstico do mural feito
  conv: { feito: false, erros: 0 }, // conversa com argumentos com o Seu Geraldo (erros contam para as estrelas)
  mudas: 0, sementes: 0,            // quantas já foram plantadas (a missão recalcula a partir dos lotes)
  dias: false,                      // já esperou os 30 dias
  depois: { minhocas: null, infilt: null },            // medidas da lavoura 30 dias depois
};

// ---------- Os valores "verdadeiros" do solo (o jogo sorteia nada: sai sempre igual) ----------
// infilt = tempo (em segundos, do relógio do jogo) para 1 litro de água sumir no solo.
// massaSeca e massaFinal = pesagens do laboratório (a matéria orgânica é o que "queima").
export const SOLO = {
  mata:    { nome: 'Mata', icone: '🌳', minhocas: 9, infilt: 75,  insetos: [['🐜', 4], ['🐞', 3], ['🦗', 2], ['🪲', 2], ['🐝', 1]], ph: 5.9, umid: 31, massaSeca: 20.0, massaFinal: 18.4 },
  lavoura: { nome: 'Lavoura', icone: '🌾', minhocas: 1, infilt: 360, insetos: [['🐛', 3]], ph: 5.0, umid: 14, massaSeca: 20.0, massaFinal: 19.5 },
};
// Matéria orgânica (%) = (massa seca − massa depois de queimar) ÷ massa seca × 100
export const moDe = (site) => (SOLO[site].massaSeca - SOLO[site].massaFinal) / SOLO[site].massaSeca * 100;   // mata 8%, lavoura 2,5%

// Lavoura 30 dias depois da restauração (valores melhores que os de antes)
export const SOLO_DEPOIS = { minhocas: 5, infilt: 150 };
// Quantos lotes de restauração existem (ficam em js/missoes/adubo/index.js)
export const TOTAL_MUDAS = 8, TOTAL_SEMENTES = 6;

// ---------- Perguntas rápidas sobre o andamento ----------
export const SITES = ['mata', 'lavoura'];
// Atividades obrigatórias do campo que já foram feitas em um ponto (de 0 a 4)
export const campoFeito = (site) => { const d = A.solo[site]; return [d.amostra, d.minhocas !== null, d.infilt !== null, d.insetos !== null].filter(Boolean).length; };
export const campoOk = () => SITES.every(s => campoFeito(s) === 4);
export const labOk = () => A.mo.mata !== null && A.mo.lavoura !== null;
export const restauradoOk = () => A.mudas >= TOTAL_MUDAS && A.sementes >= TOTAL_SEMENTES;
export const depoisOk = () => A.depois.minhocas !== null && A.depois.infilt !== null;
export const sondaOk = () => SITES.every(s => A.solo[s].sonda);

// Estrelas do relatório (1 a 3): ★ concluir · ★★ + cálculo sem erro e sonda nos 2 pontos · ★★★ + argumentos certos de primeira
export const estrelas = () => 1 + (A.moErros === 0 && sondaOk() ? 1 : 0) + (A.moErros === 0 && sondaOk() && A.conv.erros === 0 ? 1 : 0);
export const VERBA_ESTRELAS = [1200, 1600, 2000];   // quanto a prefeitura paga por 1, 2 ou 3 estrelas

// Em que etapa o jogador está (calculado a partir do que já fez)
export function stage() {
  if (!A.started) return 0;
  if (!A.falou) return 1;
  if (!campoOk()) return 2;
  if (!labOk()) return 3;
  if (!A.diag) return 4;
  if (!A.conv.feito) return 5;
  if (!restauradoOk()) return 6;
  if (!A.dias || !depoisOk()) return 7;
  return 8;   // concluída
}

// Texto de cada etapa no rastreador (canto da tela) e no caderno
// "subs" = lista de subtarefas: [texto, já feito?]
export const STAGES = [
  { now: '—' },
  { now: 'Siga a trilha de adubo até a fazenda', subs: () => [[`Examinar os sacos na trilha (${A.sacos.filter(Boolean).length}/${A.sacos.length})`, A.sacos.every(Boolean)], ['Conversar com o Seu Geraldo', A.falou]] },
  { now: 'Compare o solo da mata com o da lavoura', subs: () => [[`Ponto da MATA (${campoFeito('mata')}/4)`, campoFeito('mata') === 4], [`Ponto da LAVOURA (${campoFeito('lavoura')}/4)`, campoFeito('lavoura') === 4]] },
  { now: 'Analise o solo no laboratório', subs: () => [['Bancada SOLO: amostra da mata', A.mo.mata !== null], ['Bancada SOLO: amostra da lavoura', A.mo.lavoura !== null]] },
  { now: 'Faça o diagnóstico do solo', subs: () => [['Mural no fundo do laboratório', false]] },
  { now: 'Convença o Seu Geraldo com dados', subs: () => [['Conversar com o Seu Geraldo (use a tabela mata × lavoura)', A.conv.feito]] },
  { now: 'Restaure a borda da lavoura', subs: () => [[`Faixa de mata: mudas ${A.mudas}/${TOTAL_MUDAS}`, A.mudas >= TOTAL_MUDAS], [`Adubação verde: sementes ${A.sementes}/${TOTAL_SEMENTES}`, A.sementes >= TOTAL_SEMENTES]] },
  { now: 'Espere 30 dias e meça de novo', subs: () => [['Esperar 30 dias (falar com o Seu Geraldo)', A.dias], ['Minhocas da lavoura de novo', A.depois.minhocas !== null], ['Infiltração da lavoura de novo', A.depois.infilt !== null]] },
  { now: '✔ Solo em recuperação!', subs: () => [['Continue explorando a floresta', false]] },
];
