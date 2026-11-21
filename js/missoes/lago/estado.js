// Arquivo: missoes/lago/estado.js — o progresso da missão do lago (objeto Q)
// e a função stage(), que diz em que etapa o jogador está.
// Não importa nenhum outro arquivo, então todos podem usar sem dar "nó".

// =====================================================================
//  MISSÃO: SALVAR O LAGO DA MATA
//  Ciclo: CAMPO (medir e coletar) → LABORATÓRIO (analisar) →
//         DIAGNÓSTICO (descobrir as causas) → RESTAURAÇÃO (agir) → MEDIR DE NOVO
// =====================================================================
export const Q = {
  started: false, secchi: 0, probe: false, sample: false, sampleT: 0, stored: false,
  micro: false, chemP: false, chemN: false, coli: 0, coliT: 0,      // coli: 0 nada, 1 incubando, 2 pronta, 3 lida
  diag: false, filter: false, plants: 0, aerator: false, won: false, health: 0
};
export const SAMPLE_TIME = 180;   // segundos que a amostra aguenta fora da geladeira
export const INCUB_TIME = 25;     // segundos na estufa

// Em que etapa o jogador está (calculado a partir do que já fez)
export function stage() {
  if (!Q.started) return 0;
  if (!(Q.secchi && Q.probe && (Q.sample || Q.stored))) return 1;
  if (!Q.stored) return 2;
  if (!(Q.micro && Q.chemP && Q.chemN && Q.coli === 3)) return 3;
  if (!Q.diag) return 4;
  if (!(Q.filter && Q.plants >= 6 && Q.aerator)) return 5;
  if (!Q.won) return 6;
  return 7;
}

// Texto de cada etapa no rastreador (canto da tela) e no caderno
// "subs" = lista de subtarefas: [texto, já feito?]
export const STAGES = [
  { now: '—' },
  { now: 'Investigue o lago', subs: () => [['Ir ao ponto de coleta no píer', false], ['Disco de Secchi', !!Q.secchi], ['Sonda multiparâmetro', Q.probe], ['Coletar amostra de água', Q.sample || Q.stored]] },
  { now: 'Leve a amostra ao laboratório', subs: () => [[`Bancada AMOSTRAS · <span class="timer">⏱ ${Math.floor(Q.sampleT / 60)}:${String(Math.floor(Q.sampleT % 60)).padStart(2, '0')}</span>`, false]] },
  { now: 'Analise a amostra', subs: () => [['Coliformes (bancada AMOSTRAS)' + (Q.coli === 1 ? ` · estufa ${Math.ceil(Q.coliT)} s` : Q.coli === 2 ? ' · placa pronta!' : ''), Q.coli === 3], ['Microscópio', Q.micro], ['Fósforo (QUÍMICA)', Q.chemP], ['Nitrogênio (QUÍMICA)', Q.chemN]] },
  { now: 'Faça o diagnóstico', subs: () => [['Mural no fundo do laboratório', false]] },
  { now: 'Recupere o lago', subs: () => [['Biofiltro no cano de esgoto', Q.filter], [`Mata ciliar: mudas ${Q.plants}/6`, Q.plants >= 6], ['Aerador solar no fim do píer', Q.aerator]] },
  { now: 'Meça o oxigênio de novo', subs: () => [['Sonda no kit de campo (píer)', false]] },
  { now: '✔ Lago recuperado!', subs: () => [['Continue explorando a floresta', false]] },
];
