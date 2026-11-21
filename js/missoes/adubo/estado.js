// Arquivo: missoes/adubo/estado.js — o progresso da missão "De onde veio o adubo?"
// (objeto A), os dados "verdadeiros" do solo (SOLO) e a função stage(), que diz
// em que etapa o jogador está.
// Não importa nenhum outro arquivo, então todos podem usar sem dar "nó".
//
// Ciclo da missão (mesmo do lago): pista → campo → laboratório → diagnóstico → agir → medir de novo.
// ETAPAS PRONTAS: 1 (pista e conversa), 2 (campo) e 3 (laboratório).
// As outras entram nas próximas fatias do desenvolvimento.

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

// ---------- Perguntas rápidas sobre o andamento ----------
export const SITES = ['mata', 'lavoura'];
// Atividades obrigatórias do campo que já foram feitas em um ponto (de 0 a 4)
export const campoFeito = (site) => { const d = A.solo[site]; return [d.amostra, d.minhocas !== null, d.infilt !== null, d.insetos !== null].filter(Boolean).length; };
export const campoOk = () => SITES.every(s => campoFeito(s) === 4);
export const labOk = () => A.mo.mata !== null && A.mo.lavoura !== null;

// Em que etapa o jogador está (calculado a partir do que já fez)
export function stage() {
  if (!A.started) return 0;
  if (!A.falou) return 1;
  if (!campoOk()) return 2;
  if (!labOk()) return 3;
  return 4;   // por enquanto a missão para aqui (diagnóstico: em construção)
}

// Texto de cada etapa no rastreador (canto da tela) e no caderno
// "subs" = lista de subtarefas: [texto, já feito?]
export const STAGES = [
  { now: '—' },
  { now: 'Siga a trilha de adubo até a fazenda', subs: () => [[`Examinar os sacos na trilha (${A.sacos.filter(Boolean).length}/${A.sacos.length})`, A.sacos.every(Boolean)], ['Conversar com o Seu Geraldo', A.falou]] },
  { now: 'Compare o solo da mata com o da lavoura', subs: () => [[`Ponto da MATA (${campoFeito('mata')}/4)`, campoFeito('mata') === 4], [`Ponto da LAVOURA (${campoFeito('lavoura')}/4)`, campoFeito('lavoura') === 4]] },
  { now: 'Analise o solo no laboratório', subs: () => [['Bancada SOLO: amostra da mata', A.mo.mata !== null], ['Bancada SOLO: amostra da lavoura', A.mo.lavoura !== null]] },
  { now: '🚧 Diagnóstico no mural (em construção)', subs: () => [['Esta etapa chega na próxima atualização', false]] },
];
