// =====================================================================
//  GERAR O ARQUIVO ÚNICO DO JOGO  (rode com:  npm run unico)
//  Monta o jogo e junta tudo num ÚNICO arquivo .html, que abre com duplo
//  clique no navegador (sem servidor). Cria 2 arquivos na pasta dist-unico/:
//    estacao-bioma.html        → o jogo normal (começa do zero)
//    estacao-bioma-teste.html  → o mesmo jogo, com um SAVE pronto para testar
//                                 a Missão 2: lago concluído, relatório entregue
//                                 e R$ 1.500 de verba. Usa uma "gaveta" de save
//                                 própria, então não mexe no seu jogo normal.
//  (A fonte do Google precisa de internet; sem ela o jogo roda com outra letra.)
// =====================================================================
import { build } from 'vite';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PASTA = 'dist-unico';
mkdirSync(PASTA, { recursive: true });
// 1) monta o jogo numa pasta temporária
await build({ logLevel: 'warn', build: { outDir: join(PASTA, '_tmp'), emptyOutDir: true } });

// 2) cola o JavaScript dentro do HTML
const tmp = join(PASTA, '_tmp');
let html = readFileSync(join(tmp, 'index.html'), 'utf8');
const arquivoJs = readdirSync(join(tmp, 'assets')).find(f => f.endsWith('.js'));
const js = readFileSync(join(tmp, 'assets', arquivoJs), 'utf8').replaceAll('</script', '<\\/script');   // evita fechar o <script> sem querer
html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>/, '');
// (usa uma função no replace: assim símbolos como $& dentro do código do jogo NÃO são interpretados)
const comJs = (base, antes = '') => base.replace('</body>', () => `${antes}<script type="module">\n${js}\n</script>\n</body>`);
writeFileSync(join(PASTA, 'estacao-bioma.html'), comJs(html));

// 3) versão de TESTE: save pronto "depois da missão do lago"
const SAVE_TESTE = {
  versao: 1, quando: new Date().toISOString(), ativa: 'lago',
  player: { x: 0, y: 0.2, z: 15, yaw: Math.PI },
  missoes: {
    lago: {
      Q: { started: true, secchi: 30, probe: true, sample: false, sampleT: 0, stored: true, micro: true, chemP: true, chemN: true, coli: 3, coliT: 0, diag: true, filter: true, plants: 6, aerator: true, won: true, health: 1 },
      mudas: [true, true, true, true, true, true],
    },
  },
  eco: { verba: 1500, inv: {}, relatorios: { lago: true } },
  lotes: [],
};
const CHAVE_TESTE = 'estacao-bioma-teste-v1';
const injecao = `<script>
(function () {
  var CHAVE = '${CHAVE_TESTE}', SAVE = ${JSON.stringify(SAVE_TESTE)};
  window.__SAVE_KEY = CHAVE;
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(SAVE)); } catch (e) {} }
  try { if (!localStorage.getItem(CHAVE)) gravar(); } catch (e) {}
  // botão na tela inicial para voltar ao começo do teste (lago concluído, R$ 1.500)
  addEventListener('DOMContentLoaded', function () {
    var card = document.querySelector('#start .card'); if (!card) return;
    var b = document.createElement('button'); b.textContent = '🧪 Reiniciar o teste (depois do lago)';
    b.style.cssText = 'margin-top:14px;padding:8px 14px;border:none;border-radius:10px;background:#dee2e6;cursor:pointer;font:inherit';
    b.onclick = function () { gravar(); location.reload(); };
    card.appendChild(b);
  });
})();
</script>
`;
writeFileSync(join(PASTA, 'estacao-bioma-teste.html'), comJs(html, injecao));
console.log('Pronto! Arquivos em', PASTA + '/:\n  estacao-bioma.html (jogo normal)\n  estacao-bioma-teste.html (save depois do lago)');
