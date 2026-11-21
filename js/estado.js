// =====================================================================
//  ESTADO DO JOGO (o que vários arquivos precisam ler e mudar)
//  Aqui ficam: as teclas apertadas, a câmera e qual missão está ativa.
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

// ---------- Missões ----------
// Qual missão o jogador está seguindo agora (o rastreador e o marcador amarelo mostram ela).
// O progresso de cada missão fica no arquivo da própria missão (pasta js/missoes/).
export const jogo = { ativa: 'lago' };
