// =====================================================================
//  GERAR O ARQUIVO ÚNICO DO JOGO  (rode com:  npm run unico)
//  Monta o jogo e junta tudo num ÚNICO arquivo .html, que abre com duplo
//  clique no navegador (sem servidor). Cria 3 arquivos na pasta dist-unico/:
//    estacao-bioma.html          → o jogo normal (começa do zero)
//    estacao-bioma-teste.html    → o mesmo jogo, com um SAVE pronto para testar
//                                   a Missão 2: lago concluído, relatório entregue
//                                   e R$ 1.500 de verba.
//    estacao-bioma-teste-garimpo.html → SAVE pronto para testar a missão do garimpo:
//                                   lago e Missão 2 concluídos, relatórios entregues.
//  Os arquivos de teste usam "gavetas" de save próprias: não mexem no seu jogo normal.
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
// Cria um arquivo de teste: grava o save numa gaveta própria e põe na tela inicial um botão para recomeçar o teste
function arquivoTeste(nomeArquivo, chave, save, rotulo) {
  const injecao = `<script>
(function () {
  var CHAVE = '${chave}', SAVE = ${JSON.stringify(save)};
  window.__SAVE_KEY = CHAVE;
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(SAVE)); } catch (e) {} }
  try { if (!localStorage.getItem(CHAVE)) gravar(); } catch (e) {}
  // botão na tela inicial para voltar ao começo do teste
  addEventListener('DOMContentLoaded', function () {
    var card = document.querySelector('#start .inicio'); if (!card) return;
    var b = document.createElement('button'); b.textContent = '🧪 Reiniciar o teste (${rotulo})';
    b.className = 'sec'; b.style.cssText = 'margin-top:14px;padding:8px 14px;font-size:14px';
    b.onclick = function () { gravar(); location.reload(); };
    card.appendChild(b);
  });
})();
</script>
`;
  writeFileSync(join(PASTA, nomeArquivo), comJs(html, injecao));
}
arquivoTeste('estacao-bioma-teste.html', 'estacao-bioma-teste-v1', SAVE_TESTE, 'depois do lago');

// 4) versão de TESTE do GARIMPO: lago e Missão 2 (adubo) concluídos, relatórios entregues
const ponto = (minhocas, infilt, insetos, tipos) => ({ amostra: true, minhocas, infilt, insetos, tipos, sonda: true });
const SAVE_GARIMPO = {
  versao: 1, quando: new Date().toISOString(), ativa: 'adubo',
  player: { x: 0, y: 0.2, z: 15, yaw: Math.PI },
  missoes: {
    lago: SAVE_TESTE.missoes.lago,
    adubo: { A: {
      started: true, sacos: [true, true], falou: true,
      solo: { mata: ponto(9, 75, 12, 5), lavoura: ponto(1, 360, 3, 1) },
      mo: { mata: 8, lavoura: 2.5 }, moErros: 0, pagos: { campo: true, lab: true, precisao: true, sonda: true },
      diag: true, conv: { feito: true, erros: 0 }, mudas: 8, sementes: 6, dias: true, depois: { minhocas: 5, infilt: 150 },
    } },
  },
  eco: { verba: 2500, inv: { pa: 1, lupaCampo: 1, kitInfiltracao: 1, balancaSolo: 1, sondaSolo: 1 }, relatorios: { lago: true, adubo: true } },
  // lotes: 4 canteiros da praça e 2 bases de energia (vazios), 8 mudas e 6 sementes da Missão 2 (plantados)
  lotes: [null, null, null, null, null, null, ...Array(8).fill('muda'), ...Array(6).fill('sementes')],
};
arquivoTeste('estacao-bioma-teste-garimpo.html', 'estacao-bioma-teste-garimpo-v1', SAVE_GARIMPO, 'antes do garimpo');
console.log('Pronto! Arquivos em', PASTA + '/:\n  estacao-bioma.html (jogo normal)\n  estacao-bioma-teste.html (save depois do lago)\n  estacao-bioma-teste-garimpo.html (save antes do garimpo)');
