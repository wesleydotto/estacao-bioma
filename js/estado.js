// =====================================================================
//  ESTADO DO JOGO (o que vários arquivos precisam ler e mudar)
//  Aqui ficam: o progresso da missão (Q), as teclas apertadas e a câmera.
//  Por que um arquivo só para isso? No JavaScript com "import", um arquivo
//  não consegue trocar o valor de uma variável de outro arquivo. Mas ele
//  pode mudar as PROPRIEDADES de um objeto (ex.: cam.yaw = 1). Então
//  guardamos tudo que é compartilhado dentro de objetos.
// =====================================================================

// ---------- Entrada (teclado, toque) ----------
export const keys = {};                       // teclas apertadas agora: keys.KeyW = true
export const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 };   // joystick de toque (-1 a 1)
export const input = {
  jumpQueued: false,      // pediu para pular
  interactQueued: false,  // apertou E
  runToggle: false,       // botão "Correr" do celular ligado
  started: false,         // já clicou em "Explorar"
};

// ---------- Câmera ----------
export const cam = {
  yaw: 0,           // giro para os lados (radianos)
  pitch: 0.32,      // inclinação para cima/baixo
  dist: 7.5,        // distância suavizada até o jogador
  distTarget: 7.5,  // distância desejada (muda com a rodinha do mouse)
  distNow: 7.5,     // distância real (encurta se tiver parede no caminho)
};

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
