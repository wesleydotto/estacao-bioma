// =====================================================================
//  SALVAR PROGRESSO
//  Arquivo: save.js — guarda o jogo no próprio navegador (localStorage).
//  Salva sozinho a cada 5 segundos e quando a página é fechada.
//  Cada missão decide o que guardar, com salvar() e carregar(dados).
//  Obs.: o save fica só naquele navegador/computador.
// =====================================================================
import { jogo, input } from './estado.js';
import { MISSOES, missao } from './missoes/index.js';
import { player } from './player.js';

const CHAVE = 'estacao-bioma-save-v1';   // nome da "gaveta" no navegador (mude o v1 se o formato mudar)

// Já existe jogo salvo? (try/catch: alguns navegadores bloqueiam o localStorage)
export function temSave() {
  try { return !!localStorage.getItem(CHAVE); } catch (e) { return false; }
}

export function salvar() {
  const dados = {
    versao: 1,
    quando: new Date().toISOString(),
    ativa: jogo.ativa,
    player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw },
    missoes: {},
  };
  for (const m of MISSOES) if (m.salvar) dados.missoes[m.id] = m.salvar();
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* sem espaço ou bloqueado: segue sem salvar */ }
}

// Carrega o jogo salvo. Devolve true se deu certo.
export function carregar() {
  let dados;
  try { dados = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return false; }
  if (!dados || dados.versao !== 1) return false;
  if (missao(dados.ativa)) jogo.ativa = dados.ativa;
  player.pos.set(dados.player.x, dados.player.y, dados.player.z);
  player.yaw = dados.player.yaw;
  for (const m of MISSOES) if (m.carregar && dados.missoes[m.id]) m.carregar(dados.missoes[m.id]);
  return true;
}

export function apagarSave() {
  try { localStorage.removeItem(CHAVE); } catch (e) { /* nada a fazer */ }
}

// Salvamento automático (chamado todo quadro pelo main.js)
let espera = 5;
export function updateSave(dt) {
  if (!input.started) return;
  if ((espera -= dt) <= 0) { espera = 5; salvar(); }
}
addEventListener('beforeunload', () => { if (input.started) salvar(); });   // ao fechar a aba
