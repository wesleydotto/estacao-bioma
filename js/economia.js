// =====================================================================
//  ECONOMIA: verba, inventário, loja e relatórios para a prefeitura
//  Arquivo: economia.js
//  - Cada missão concluída gera um RELATÓRIO. Entregando na prefeitura,
//    o jogador ganha VERBA (R$).
//  - Com a verba, compra ITENS na loja da prefeitura.
//  - Os itens ficam no INVENTÁRIO (tecla I) e podem ser usados para
//    construir nos lugares marcados (veja construir.js).
// =====================================================================
import { MISSOES } from './missoes/index.js';
import { openPanel, showToast } from './interface.js';
import { chime, buzz, tone } from './audio.js';

// ---------- Estado da economia (é salvo junto com o jogo) ----------
export const eco = {
  verba: 0,            // dinheiro em reais
  inv: {},             // inventário: { muda: 3, pa: 1 }
  relatorios: {},      // relatórios já entregues: { lago: true }
};

// ---------- Catálogo da loja ----------
// tipo: 'construir' = vai para um lugar marcado no mundo; 'ferramenta' = fica com você
export const ITENS = {
  muda:      { nome: 'Muda nativa (ipê)', icone: '🌱', preco: 40, tipo: 'construir', desc: 'Árvore nativa do Cerrado. Planta num canteiro marcado. Precisa de pá.' },
  sementes:  { nome: 'Sementes de adubação verde', icone: '🫘', preco: 25, tipo: 'construir', desc: 'Feijão-de-porco: cobre o solo e devolve nitrogênio a ele. Precisa de pá.' },
  placa:     { nome: 'Placa solar', icone: '☀️', preco: 600, tipo: 'construir', desc: 'Transforma a luz do Sol em eletricidade. Vai numa base de energia.' },
  catavento: { nome: 'Cata-vento (turbina eólica)', icone: '🌬️', preco: 450, tipo: 'construir', desc: 'Transforma o vento em eletricidade. Vai numa base de energia.' },
  pa:        { nome: 'Pá', icone: '🪏', preco: 60, tipo: 'ferramenta', desc: 'Ferramenta para cavar e plantar. Compre uma vez e use sempre.' },
  reagentes: { nome: 'Kit de reagentes', icone: '🧪', preco: 120, tipo: 'ferramenta', desc: 'Reagentes extras para análises. Vai servir nas próximas missões.' },
};

// Formata dinheiro: 1500 → "R$ 1.500"
export const reais = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

// ---------- Mostrador de verba na tela ----------
const verbaEl = document.getElementById('verba');
export function atualizarHudVerba() { verbaEl.textContent = '💰 ' + reais(eco.verba); }

export function ganhar(valor, motivo) {
  eco.verba += valor; atualizarHudVerba();
  showToast(`+ ${reais(valor)} · ${motivo}`, '#2b8a3e');
  tone(880, 0.1, { vol: 0.08 }); tone(1320, 0.15, { vol: 0.08, when: 0.1 });   // som de moeda
}

// ---------- Inventário ----------
export const qtd = (id) => eco.inv[id] || 0;
export function addItem(id, n = 1) { eco.inv[id] = qtd(id) + n; }
export function usarItem(id) {
  if (!qtd(id)) return false;
  eco.inv[id]--; if (!eco.inv[id]) delete eco.inv[id];
  return true;
}

export function inventarioPanel() {
  openPanel('🎒 Inventário', (b) => {
    const ids = Object.keys(eco.inv);
    b.innerHTML = `<p class="tip">Verba: <b>${reais(eco.verba)}</b>. ${ids.length ? 'Itens de <b>construir</b> são usados nos lugares marcados no mundo (chegue perto e aperte <b>E</b>).' : 'Sua mochila está vazia. Compre itens na <b>loja da prefeitura</b>, ao lado da praça.'}</p>
      <div class="inv">${ids.map(id => { const it = ITENS[id]; return `<div class="slot" title="${it.desc}"><div class="ic">${it.icone}</div><div class="nm">${it.nome}</div><div class="q">× ${qtd(id)}</div></div>`; }).join('')}</div>`;
  });
}

// ---------- Relatórios ----------
// Missão concluída cujo relatório ainda não foi entregue
export const relatoriosPendentes = () => MISSOES.filter(m => m.relatorio && m.concluida() && !eco.relatorios[m.id]);

// ---------- Painel da prefeitura (relatórios + loja) ----------
export function prefeituraPanel(aba = relatoriosPendentes().length ? 'relatorios' : 'loja') {
  openPanel('🏛️ Prefeitura · Secretaria de Meio Ambiente', (b) => {
    const abas = `<div class="row" style="justify-content:flex-start">
      <button class="btn ${aba === 'relatorios' ? '' : 'ghost'}" data-aba="relatorios">📄 Relatórios${relatoriosPendentes().length ? ' (' + relatoriosPendentes().length + ')' : ''}</button>
      <button class="btn ${aba === 'loja' ? '' : 'ghost'}" data-aba="loja">🛒 Loja</button>
      <span style="margin-left:auto;font-weight:700">Verba: ${reais(eco.verba)}</span></div>`;
    b.innerHTML = abas + '<div id="conteudo"></div>';
    b.querySelectorAll('[data-aba]').forEach(bt => bt.onclick = () => prefeituraPanel(bt.dataset.aba));
    const box = b.querySelector('#conteudo');
    if (aba === 'relatorios') mostrarRelatorios(box); else mostrarLoja(box);
  });
}

function mostrarRelatorios(box) {
  const pend = relatoriosPendentes();
  const entregues = MISSOES.filter(m => eco.relatorios[m.id]);
  box.innerHTML = `<p class="tip">Cada missão concluída vira um relatório. A prefeitura paga uma <b>verba</b> para a Estação continuar o trabalho.</p><div class="tools"></div>`;
  const lista = box.querySelector('.tools');
  if (!pend.length && !entregues.length) lista.innerHTML = '<div class="card">Nenhum relatório ainda. Conclua uma missão do <b>mural</b> do laboratório!</div>';
  for (const m of pend) {
    const d = document.createElement('div'); d.className = 'tool';
    d.innerHTML = `<div class="ic">${m.icone}</div><div><div class="nm">${m.titulo}</div><div class="ds">${m.relatorio.texto}</div></div><div class="st">${reais(m.relatorio.verba)}<br></div>`;
    const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Entregar';
    bt.onclick = () => { eco.relatorios[m.id] = true; ganhar(m.relatorio.verba, 'relatório entregue'); chime(); prefeituraPanel('relatorios'); };
    d.querySelector('.st').appendChild(bt); lista.appendChild(d);
  }
  for (const m of entregues) {
    const d = document.createElement('div'); d.className = 'tool'; d.style.opacity = 0.6;
    d.innerHTML = `<div class="ic">${m.icone}</div><div><div class="nm">${m.titulo}</div><div class="ds">Relatório entregue ✔</div></div><div class="st">${reais(m.relatorio.verba)}</div>`;
    lista.appendChild(d);
  }
}

function mostrarLoja(box) {
  box.innerHTML = `<p class="tip">Escolha o que comprar. Repare quanto de verba <b>sobra</b> depois de cada compra!</p><div class="tools"></div><p class="fb" id="fb"></p>`;
  const lista = box.querySelector('.tools'), fb = box.querySelector('#fb');
  for (const [id, it] of Object.entries(ITENS)) {
    const jaTem = it.tipo === 'ferramenta' && qtd(id) > 0;   // ferramenta: só precisa de uma
    const d = document.createElement('div'); d.className = 'tool';
    d.innerHTML = `<div class="ic">${it.icone}</div><div><div class="nm">${it.nome}</div><div class="ds">${it.desc}</div><div class="ds">Você tem: <b>${qtd(id)}</b></div></div><div class="st">${reais(it.preco)}<br></div>`;
    const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = jaTem ? 'Já tem' : 'Comprar'; bt.disabled = jaTem;
    bt.onclick = () => {
      if (eco.verba < it.preco) { buzz(); fb.className = 'fb bad'; fb.textContent = `Falta ${reais(it.preco - eco.verba)} para comprar ${it.nome}.`; return; }
      eco.verba -= it.preco; addItem(id); atualizarHudVerba(); chime();
      prefeituraPanel('loja');
      const f = document.querySelector('#panelBody #fb');
      f.className = 'fb good'; f.textContent = `Comprou ${it.nome}: ${reais(eco.verba + it.preco)} − ${reais(it.preco)} = ${reais(eco.verba)}`;
    };
    d.querySelector('.st').appendChild(bt); lista.appendChild(d);
  }
}

// ---------- Salvar e carregar ----------
export const salvarEco = () => JSON.parse(JSON.stringify(eco));
export function carregarEco(d) {
  if (!d) return;
  eco.verba = d.verba || 0; eco.inv = d.inv || {}; eco.relatorios = d.relatorios || {};
  atualizarHudVerba();
}
