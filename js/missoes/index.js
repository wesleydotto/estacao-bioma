// =====================================================================
//  LISTA DE MISSÕES DO JOGO
//  Para adicionar uma missão nova: crie a pasta dela em js/missoes/,
//  importe aqui e coloque na lista MISSOES (a ordem é a do mural).
//
//  Cada missão é um objeto com estas partes (veja missoes/lago/index.js):
//    id, titulo, icone, resumo   → nome e descrição (aparecem no mural)
//    iniciada(), concluida()     → true/false
//    etapa()                     → número da etapa atual
//    iniciar()                   → começa a missão (normalmente com uma fala)
//    rastreador(player)          → { numero, agora, subs } para o canto da tela
//    alvo()                      → posição do marcador amarelo (ou null)
//    falaDaEtapa(n)              → fala quando o jogador chega na etapa n
//    interacoes()                → lista de coisas que respondem à tecla E
//    rotuloMural(), acoesMural() → (opcional) atalhos no mural do laboratório
//    caderno()                   → HTML da página da missão no caderno (tecla C)
//    update(dt, t)               → roda todo quadro
//    montar()                    → (opcional) cria coisas no mundo, como NPCs (veja npc.js)
//    salvar(), carregar(dados)   → (opcional) o que guardar no save e como refazer (veja save.js)
//    relatorio: { verba, texto } → (opcional) quanto a prefeitura paga quando a missão termina
// =====================================================================
import { lago } from './lago/index.js';

export const MISSOES = [lago];

// Procura uma missão pelo id (ex.: missao('lago'))
export const missao = (id) => MISSOES.find(m => m.id === id);
