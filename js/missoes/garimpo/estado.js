// Arquivo: missoes/garimpo/estado.js — o progresso da missão do garimpo (objeto G),
// os resultados "verdadeiros" das análises (AGUA) e a função stage(), que diz em
// que etapa o jogador está.
// Não importa nenhum outro arquivo, então todos podem usar sem dar "nó".
//
// A ideia da missão: moradores da Lagoa Dourada passam mal depois de comer peixe.
// A 1ª hipótese (eutrofização, como no Lago da Mata) é TESTADA e DESCARTADA:
// a água está normal. O problema está no peixe (mercúrio e arsênio do garimpo).
//
// FATIA A (pronta): etapas 1 a 4 (conversa, campo, laboratório e diagnóstico).
// FATIA B (a fazer): pesca, preparo do peixe, analisador de metais, tabela periódica e biomagnificação.
// FATIA C (a fazer): mitigação (ambiental + social) e medir de novo.
//
// Etapas: 1 conversar com a Dona Rosa · 2 testar a água no trapiche · 3 analisar no laboratório ·
//         4 diagnóstico no mural · 5 (fim da fatia A) investigar os peixes.

export const G = {
  started: false,
  falouRosa: false,            // já conversou com a Dona Rosa
  pistaGarimpo: false,         // (opcional) leu a placa do garimpo
  secchi: 0,                   // transparência medida (cm); 0 = ainda não
  sonda: false,                // já usou a sonda na lagoa
  amostra: false,              // amostra de água coletada (vai numa caixa térmica: não estraga)
  lab: { fosforo: false, nitrogenio: false, coliformes: false, micro: false },   // análises feitas no laboratório
  diag: false,                 // diagnóstico do mural feito
  diagErros: 0,                // quantas respostas erradas no diagnóstico
};

// Resultados da água da Lagoa Dourada (tudo NORMAL: a água não é o problema!)
// e, para comparar, os do Lago da Mata antes da recuperação.
export const AGUA = {
  od: 7.2, ph: 7.1, temp: 26.5,                  // sonda
  fosforo: 0.02, nitrogenio: 0.2,                 // mg/L
};
export const LAGO_DA_MATA = { secchi: '≈ 30 cm', od: '2,1 mg/L', ph: '8,9', fosforo: '0,25 mg/L', nitrogenio: '3,5 mg/L', coliformes: 'PRESENTE', micro: 'muitas cianobactérias' };

// ---------- Perguntas rápidas sobre o andamento ----------
export const campoOk = () => !!G.secchi && G.sonda && G.amostra;
export const ANALISES = ['fosforo', 'nitrogenio', 'coliformes', 'micro'];
export const labOk = () => ANALISES.every(k => G.lab[k]);

// Em que etapa o jogador está (calculado a partir do que já fez)
export function stage() {
  if (!G.started) return 0;
  if (!G.falouRosa) return 1;
  if (!campoOk()) return 2;
  if (!labOk()) return 3;
  if (!G.diag) return 4;
  return 5;   // fim da fatia A (a investigação dos peixes vem na fatia B)
}

// Texto de cada etapa no rastreador (canto da tela) e no caderno
// "subs" = lista de subtarefas: [texto, já feito?]
export const STAGES = [
  { now: '—' },
  { now: 'Converse com a Dona Rosa na Lagoa Dourada', subs: () => [['Ir até a comunidade da lagoa (a leste)', false], ['Conversar com a Dona Rosa', G.falouRosa]] },
  { now: 'Teste a água da lagoa', subs: () => [['Disco de Secchi', !!G.secchi], ['Sonda multiparâmetro', G.sonda], ['Coletar amostra de água', G.amostra]] },
  { now: 'Analise a água no laboratório', subs: () => [['Fósforo (QUÍMICA, ponta esquerda)', G.lab.fosforo], ['Nitrogênio', G.lab.nitrogenio], ['Coliformes', G.lab.coliformes], ['Microscópio (algas)', G.lab.micro]] },
  { now: 'Faça o diagnóstico da lagoa', subs: () => [['Mural no fundo do laboratório', false]] },
  { now: '🚧 Continua em breve: investigar os peixes', subs: () => [['A água está normal. O problema deve estar no peixe!', true]] },
];
