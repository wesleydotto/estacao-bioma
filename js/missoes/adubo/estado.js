// Arquivo: missoes/adubo/estado.js — o progresso da missão "De onde veio o adubo?"
// (objeto A) e a função stage(), que diz em que etapa o jogador está.
// Não importa nenhum outro arquivo, então todos podem usar sem dar "nó".
//
// Ciclo da missão (mesmo do lago): pista → campo → laboratório → diagnóstico → agir → medir de novo.
// ETAPAS PRONTAS: 1 (pista e conversa). As outras entram nas próximas fatias do desenvolvimento.
export const A = {
  started: false,
  sacos: [false, false],   // quais sacos da trilha já foram examinados
  falou: false,            // já conversou com o Seu Geraldo
};

// Em que etapa o jogador está (calculado a partir do que já fez)
export function stage() {
  if (!A.started) return 0;
  if (!A.falou) return 1;
  return 2;   // por enquanto a missão para aqui (campo: em construção)
}

// Texto de cada etapa no rastreador (canto da tela) e no caderno
// "subs" = lista de subtarefas: [texto, já feito?]
export const STAGES = [
  { now: '—' },
  { now: 'Siga a trilha de adubo até a fazenda', subs: () => [[`Examinar os sacos na trilha (${A.sacos.filter(Boolean).length}/${A.sacos.length})`, A.sacos.every(Boolean)], ['Conversar com o Seu Geraldo', A.falou]] },
  { now: '🚧 Comparar o solo da mata com o da lavoura (em construção)', subs: () => [['Esta etapa chega na próxima atualização', false]] },
];
