// Arquivo: qualidade.js — o nível de gráficos escolhido (Alta, Média ou Baixa).
// Fica num arquivo separado e sem dependências porque o cena.js e o vegetacao.js
// precisam saber o nível ANTES de criar o renderizador e a grama.
import { isTouch } from './utils.js';

// O que cada nível liga ou desliga:
//  pixelRatio  = nitidez da imagem (mais pixels = mais pesado)
//  sombraMapa  = resolução da sombra do sol (maior = sombra mais nítida)
//  sombraAlc   = metros ao redor do jogador que recebem sombra
//  ao          = "oclusão de ambiente": escurece cantos e o contato dos objetos com o chão
//  bloom       = brilho suave em volta das partes muito claras
//  msaa        = suavização das bordas (amostras)
//  grama       = fração da grama que aparece (1 = toda)
//  gramaExtra  = grama a mais (1.4 = 40% a mais de tufos, só no Alto; 1 = nenhuma extra)
export const NIVEIS = {
  alta:  { nome: 'Alta',  pixelRatio: 2,    sombraMapa: 4096, sombraAlc: 50, ao: true,  bloom: true,  msaa: 4, grama: 1, gramaExtra: 1.4 },
  media: { nome: 'Média', pixelRatio: 1.5,  sombraMapa: 2048, sombraAlc: 45, ao: false, bloom: true,  msaa: 4, grama: 0.7, gramaExtra: 1 },
  baixa: { nome: 'Baixa', pixelRatio: 1,    sombraMapa: 1024, sombraAlc: 40, ao: false, bloom: false, msaa: 0, grama: 0.4, gramaExtra: 1 },
};

const CHAVE = 'estacao-bioma-qualidade';

// Lê o nível salvo. Se não tiver nenhum: celular/tablet começa no Baixo, computador no Médio.
function lerNivel() {
  try { const n = localStorage.getItem(CHAVE); if (n && NIVEIS[n]) return n; } catch (e) {}
  return isTouch ? 'baixa' : 'media';
}

export const nivelAtual = lerNivel();          // 'alta' | 'media' | 'baixa'
export const qualidade = NIVEIS[nivelAtual];   // as opções do nível atual

// Troca o nível e recarrega a página (o jogo é salvo antes, a cada 5 s, pelo save.js).
export function trocarNivel(n) {
  try { localStorage.setItem(CHAVE, n); } catch (e) {}
  location.reload();
}
