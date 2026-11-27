// Arquivo: missoes/garimpo/minigames.js — as janelas das atividades da missão do garimpo:
// kit de campo no trapiche (Secchi, sonda e frasco), as análises no laboratório,
// o diagnóstico do mural e a tabela de resultados do caderno.
// (Os "../../" sobem duas pastas: de js/missoes/garimpo/ para js/.)
import { G, AGUA, LAGO_DA_MATA, stage, labOk } from './estado.js';
import { openPanel, closePanel, panelToken, $, holdButton, say } from '../../interface.js';
import { chime, buzz } from '../../audio.js';
import { clamp, lerp, FONT } from '../../utils.js';
import { fazerAcao, acaoAtiva } from '../../acoes.js';

const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
// Botão "Voltar" que aparece depois de um resultado
function botaoVoltar(depois, texto, acao) {
  const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = texto; bt.onclick = acao;
  bt.style.display = 'block'; bt.style.margin = '10px auto 0'; depois.after(bt);
}

// ---------- Tabela de resultados (caderno e diagnóstico): Lagoa Dourada × Lago da Mata ----------
export function resultadosHTML() {
  const linha = (n, val, mata, ideal) => `<tr><td>${n}</td><td class="${val === '—' ? '' : 'good-c'}">${val}</td><td class="bad-c">${mata}</td><td>${ideal}</td></tr>`;
  return `<table class="res"><tr><th>Análise</th><th>Lagoa Dourada</th><th>Lago da Mata (antes)</th><th>Água saudável</th></tr>
    ${linha('Transparência (Secchi)', G.secchi ? G.secchi + ' cm' : '—', LAGO_DA_MATA.secchi, 'mais de 100 cm')}
    ${linha('Oxigênio dissolvido', G.sonda ? fmt(AGUA.od) + ' mg/L' : '—', LAGO_DA_MATA.od, 'mais de 5 mg/L')}
    ${linha('pH', G.sonda ? fmt(AGUA.ph) : '—', LAGO_DA_MATA.ph, 'entre 6 e 8,5')}
    ${linha('Fósforo', G.lab.fosforo ? fmt(AGUA.fosforo, 2) + ' mg/L' : '—', LAGO_DA_MATA.fosforo, 'até 0,03 mg/L')}
    ${linha('Nitrogênio (amônia)', G.lab.nitrogenio ? fmt(AGUA.nitrogenio) + ' mg/L' : '—', LAGO_DA_MATA.nitrogenio, 'até 0,5 mg/L')}
    ${linha('Coliformes (E. coli)', G.lab.coliformes ? 'ausente' : '—', LAGO_DA_MATA.coliformes, 'ausente')}
    ${linha('Microscópio', G.lab.micro ? 'algas variadas, poucas cianobactérias' : '—', LAGO_DA_MATA.micro, 'algas variadas')}</table>`;
}

// =====================================================================
//  CAMPO: KIT NO TRAPICHE (Secchi, sonda e frasco)
// =====================================================================
export function kitLagoa() {
  openPanel('🎒 Kit de campo · Lagoa Dourada', (b) => {
    b.innerHTML = `<p class="tip">Primeira hipótese: será que a lagoa está <b>eutrofizada</b>, como o Lago da Mata estava? Use as 3 ferramentas para testar.</p><div class="tools"></div>`;
    const ferramentas = [
      ['⚫', 'Disco de Secchi', 'Mede a transparência da água.', G.secchi ? G.secchi + ' cm ✔' : '', secchiLagoa, false],
      ['📟', 'Sonda multiparâmetro', 'Lê oxigênio, pH e temperatura.', G.sonda ? 'feito ✔' : '', sondaLagoa, false],
      ['🧪', 'Frasco de coleta', 'Leva água para o laboratório (vai na caixa térmica).', G.amostra ? 'na caixa ✔' : '', coletarAgua, G.amostra],
    ];
    for (const [ic, nm, ds, st, fn, desligado] of ferramentas) {
      const d = document.createElement('div'); d.className = 'tool';
      d.innerHTML = `<div class="ic">${ic}</div><div><div class="nm">${nm}</div><div class="ds">${ds}</div></div><div class="st">${st}<br></div>`;
      const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Usar'; bt.disabled = desligado; bt.onclick = fn;
      d.querySelector('.st').appendChild(bt); $(b, '.tools').appendChild(d);
    }
  });
}

// ---------- Disco de Secchi na água LIMPA: o disco demora a sumir ----------
function secchiLagoa() {
  openPanel('⚫ Disco de Secchi', (b, tok) => {
    b.innerHTML = `<p class="tip">Segure <b>⬇ Baixar</b> e observe o disco. Quando ele <b>quase sumir</b>, clique em <b>Sumiu!</b></p>
      <canvas class="mg" width="440" height="300"></canvas>
      <div class="row"><button class="btn ghost" id="up">⬆ Subir</button><button class="btn" id="dn">⬇ Baixar</button><button class="btn warn" id="ok">Sumiu!</button></div>
      <p class="fb" id="fb"></p>`;
    const cv = $(b, 'canvas'), g = cv.getContext('2d'), fb = $(b, '#fb');
    let prof = 0, dir = 0, pronto = false, antes = performance.now();
    holdButton($(b, '#dn'), on => dir = on ? 1 : (dir === 1 ? 0 : dir));
    holdButton($(b, '#up'), on => dir = on ? -1 : (dir === -1 ? 0 : dir));
    const visivel = d => Math.exp(-d / 0.8);          // água limpa: o disco some devagar
    $(b, '#ok').onclick = () => {
      if (pronto) return;
      const a = visivel(prof);
      if (a > 0.09) { fb.className = 'fb bad'; fb.textContent = 'Ainda dá pra ver o disco! Baixe mais.'; buzz(); }
      else {
        pronto = true; G.secchi = Math.round(prof * 100); chime();
        fb.className = 'fb good'; fb.innerHTML = `Transparência: <b>${G.secchi} cm</b>. No Lago da Mata o disco sumia em uns 30 cm! Aqui a água é <b>transparente</b>: não tem excesso de algas.`;
        botaoVoltar(fb, 'Voltar ao kit', kitLagoa);
      }
    };
    const PM = 110;   // pixels por metro
    const loop = () => {
      if (tok !== panelToken) return;
      const agora = performance.now(), dts = Math.min(0.1, (agora - antes) / 1000); antes = agora;
      if (!pronto) prof = clamp(prof + dir * 0.35 * dts, 0, 2.3);   // 35 cm por segundo
      const W = 440, H = 300, sy = 40;
      const grd = g.createLinearGradient(0, sy, 0, H); grd.addColorStop(0, '#5fb8b0'); grd.addColorStop(1, '#0d4f5c');
      g.fillStyle = '#cfe8f7'; g.fillRect(0, 0, W, sy); g.fillStyle = grd; g.fillRect(0, sy, W, H - sy);
      g.fillStyle = '#7a5230'; g.fillRect(120, sy - 16, 200, 10);
      for (let y = 0; y <= 2.3; y += 0.5) { g.fillStyle = 'rgba(255,255,255,.6)'; g.font = `600 13px ${FONT}`; g.fillText(Math.round(y * 100) + ' cm', 14, sy + y * PM + 4); g.fillRect(68, sy + y * PM, 12, 2); }
      const dy = sy + prof * PM;
      g.strokeStyle = '#f1e3c4'; g.lineWidth = 2; g.beginPath(); g.moveTo(220, sy - 8); g.lineTo(220, dy); g.stroke();
      g.globalAlpha = visivel(prof);
      g.save(); g.translate(220, dy + 6); g.scale(1, 0.35);
      for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#111' : '#fff'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 46, k * Math.PI / 2, (k + 1) * Math.PI / 2); g.fill(); }
      g.restore(); g.globalAlpha = 1;
      // peixinhos passando (água limpa!)
      for (let i = 0; i < 4; i++) { const x = (i * 130 + performance.now() * 0.03 * (1 + i % 2)) % (W + 40) - 20, y = sy + 40 + i * 55; g.fillStyle = 'rgba(255,190,90,.8)'; g.beginPath(); g.ellipse(x, y, 12, 5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x - 18, y - 6); g.lineTo(x - 18, y + 6); g.fill(); }
      g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.fillText(`Profundidade: ${Math.round(prof * 100)} cm`, 270, H - 14);
      requestAnimationFrame(loop);
    };
    loop();
  });
}

// ---------- Sonda multiparâmetro: tudo dentro da faixa boa ----------
function sondaLagoa() {
  openPanel('📟 Sonda multiparâmetro', (b, tok) => {
    b.innerHTML = `<p class="tip">Mergulhe o sensor e espere as leituras. As faixas <b style="color:#2b8a3e">verdes</b> mostram o ideal para a vida na água.</p>
      <canvas class="mg" width="440" height="230"></canvas><div class="row"><button class="btn" id="go">💧 Mergulhar sensor</button></div><div class="card" id="out">Aguardando leitura…</div>`;
    const g = $(b, 'canvas').getContext('2d');
    const barras = [['Oxigênio (mg/L)', AGUA.od, 0, 10, 5, 10], ['pH', AGUA.ph, 4, 11, 6, 8.5], ['Temperatura (°C)', AGUA.temp, 10, 35, 15, 30]];
    let t = 0, rodando = false;
    const desenhar = () => {
      g.fillStyle = '#1f2d27'; g.fillRect(0, 0, 440, 230);
      barras.forEach(([n, val, mn, mx, lo, hi], i) => {
        const y = 30 + i * 68, x0 = 30, w = 380, k = Math.min(1, t);
        g.fillStyle = '#e9ecef'; g.font = `600 15px ${FONT}`; g.fillText(n, x0, y - 6);
        g.fillStyle = '#3a4a42'; g.fillRect(x0, y, w, 22);
        g.fillStyle = 'rgba(64,192,87,.45)'; g.fillRect(x0 + (lo - mn) / (mx - mn) * w, y, (hi - lo) / (mx - mn) * w, 22);
        const atual = lerp(mn, val, k);
        g.fillStyle = k < 1 ? '#ffd43b' : '#51cf66'; g.fillRect(x0 + (atual - mn) / (mx - mn) * w - 3, y - 4, 6, 30);
        g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.fillText(fmt(atual), x0 + w - 40, y + 44);
      });
    };
    desenhar();
    $(b, '#go').onclick = () => {
      if (rodando) return; rodando = true; $(b, '#go').disabled = true;
      const loop = () => {
        if (tok !== panelToken) return;
        t += 1 / 90; desenhar();
        if (t < 1) return requestAnimationFrame(loop);
        chime(); G.sonda = true;
        const out = $(b, '#out');
        out.innerHTML = `✔ <b>Oxigênio ${fmt(AGUA.od)} mg/L</b>, <b>pH ${fmt(AGUA.ph)}</b> e <b>${fmt(AGUA.temp)} °C</b>: tudo dentro do normal. Peixes respiram bem aqui!`;
        botaoVoltar(out, 'Voltar ao kit', kitLagoa);
      };
      loop();
    };
  });
}

// ---------- Coletar a amostra (o Biólogo agacha e enche o frasco) ----------
function coletarAgua() {
  if (acaoAtiva()) return;
  closePanel();
  fazerAcao('coletar', () => {
    G.amostra = true; chime();
    if (!(G.secchi && G.sonda)) say(['🧪 Amostra guardada na <b>caixa térmica</b> (com gelo, ela não estraga no caminho). Termine os outros testes do kit!'], '✔ Coleta');
  });
}

// =====================================================================
//  LABORATÓRIO: as 4 análises da água da lagoa (bancada QUÍMICA, ponta esquerda)
// =====================================================================
const TESTES = [
  ['fosforo', '🧪', 'Fósforo', 'Reagente que fica azul quando tem fósforo.', () => `<b>${fmt(AGUA.fosforo, 2)} mg/L</b> · azul bem clarinho: normal (até 0,03).`, '#cfe3f7'],
  ['nitrogenio', '🧪', 'Nitrogênio (amônia)', 'Reagente que fica amarelo-escuro com amônia.', () => `<b>${fmt(AGUA.nitrogenio)} mg/L</b> · amarelo fraco: normal (até 0,5).`, '#f7efc4'],
  ['coliformes', '🧫', 'Coliformes (E. coli)', 'Placa de cultura na estufa: pontinhos = bactérias de esgoto.', () => '<b>Ausente</b> · a placa ficou limpa: não tem esgoto chegando na lagoa.', '#f3f0e4'],
  ['micro', '🔬', 'Microscópio', 'Olhar uma gota e ver quais algas aparecem.', () => '<b>Algas variadas</b>, poucas cianobactérias: equilíbrio normal.', '#d8f5d0'],
];
export function labLagoa() {
  openPanel('🔬 Análise da água · Lagoa Dourada', (b, tok) => {
    b.innerHTML = `<p class="tip">Faça as <b>mesmas análises</b> do Lago da Mata. Assim dá para <b>comparar</b> as duas águas.</p><div class="tools"></div>
      <p class="fb" id="fb"></p>`;
    const caixa = $(b, '.tools'), fb = $(b, '#fb');
    const fimDeTudo = () => {
      if (!labOk()) return;
      fb.className = 'fb good'; fb.innerHTML = 'Todas as análises prontas! Leve os resultados ao <b>mural</b> (fundo do laboratório) para o diagnóstico.';
    };
    for (const [id, ic, nm, ds, resultado, cor] of TESTES) {
      const d = document.createElement('div'); d.className = 'tool';
      d.innerHTML = `<div class="ic">${ic}</div><div style="flex:1"><div class="nm">${nm}</div><div class="ds">${ds}</div>
        <div class="ds res-${id}" style="margin-top:4px">${G.lab[id] ? '✔ ' + resultado() : ''}</div>
        <div style="height:8px;border-radius:6px;background:#e3e6e2;margin-top:6px;overflow:hidden;display:${G.lab[id] ? 'none' : 'block'}"><div class="barra" style="height:100%;width:0;background:${cor === '#f3f0e4' ? '#adb5bd' : '#16a08a'}"></div></div></div><div class="st"></div>`;
      const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = G.lab[id] ? 'Feito ✔' : 'Analisar'; bt.disabled = G.lab[id];
      bt.onclick = () => {
        bt.disabled = true; bt.textContent = '…';
        const barra = d.querySelector('.barra'), inicio = performance.now(), dur = 1600;
        const anima = () => {
          if (tok !== panelToken) return;
          const k = Math.min(1, (performance.now() - inicio) / dur);
          barra.style.width = (k * 100) + '%';
          if (k < 1) return requestAnimationFrame(anima);
          G.lab[id] = true; chime(); bt.textContent = 'Feito ✔';
          d.querySelector('.res-' + id).innerHTML = '✔ ' + resultado();
          barra.parentElement.style.display = 'none';
          fimDeTudo();
        };
        anima();
      };
      d.querySelector('.st').appendChild(bt); caixa.appendChild(d);
    }
    fimDeTudo();
  });
}

// =====================================================================
//  DIAGNÓSTICO (no mural): descartar a eutrofização e achar a nova pista
// =====================================================================
export function diagnosticoLagoaPanel() {
  if (stage() < 4) { say(['O diagnóstico da Lagoa Dourada abre quando <b>todas as análises</b> da água estiverem prontas.'], '📋 Mural de missões'); return; }
  openPanel('📋 Diagnóstico da Lagoa Dourada', (b) => {
    if (G.diag) {
      b.innerHTML = resultadosHTML() + '<p class="tip">✔ A água está <b>normal</b>: a lagoa <b>não</b> está eutrofizada. O que os doentes têm em comum é <b>comer peixe</b> da lagoa. Próxima pista: o peixe!</p>';
      return;
    }
    // 1ª pergunta: é eutrofização?
    const pergunta1 = () => {
      b.innerHTML = `<p class="tip">Compare a <b>Lagoa Dourada</b> com o <b>Lago da Mata</b> (que estava eutrofizado).</p>${resultadosHTML()}
        <p style="margin:6px 0"><b>1. A Lagoa Dourada está eutrofizada?</b></p><div id="opts"></div><p class="fb" id="fb"></p>`;
      const ops = [
        ['Sim: tem nutrientes demais e explosão de algas.', false, 'Olhe de novo a tabela: fósforo e nitrogênio estão baixos, e a água é transparente. Os números não mostram eutrofização.'],
        ['Não: a água está dentro do normal.', true, ''],
        ['Não dá para saber com esses testes.', false, 'Dá, sim! São exatamente os testes que mostraram a eutrofização no Lago da Mata. Aqui, todos deram normais.'],
      ];
      opcoes(b, ops, pergunta2);
    };
    // 2ª pergunta: então o que explica as pessoas passando mal?
    const pergunta2 = () => {
      b.innerHTML = `<p class="tip">✔ Isso! <b>Hipótese descartada</b>: não é eutrofização. Descartar uma hipótese também é um resultado científico!</p>
        <div class="card">📝 <b>Anotações da conversa com a Dona Rosa:</b> formigamento nas mãos, tremedeira e vista embaçada. Quem mais passa mal é quem <b>come peixe quase todo dia</b>. Alguns peixes nadam meio tontos.</div>
        <p style="margin:10px 0 6px"><b>2. O que pode explicar as pessoas passando mal?</b></p><div id="opts"></div><p class="fb" id="fb"></p>`;
      const ops = [
        ['Esgoto na água da lagoa.', false, 'O teste de coliformes deu ausente: não tem esgoto chegando na lagoa.'],
        ['Foi só coincidência.', false, 'Vários moradores com os mesmos sintomas, e todos comem o peixe da lagoa: isso é um padrão, não coincidência.'],
        ['Alguma coisa que está no peixe, e não na água.', true, ''],
      ];
      opcoes(b, ops, fim);
    };
    const fim = () => {
      G.diag = true; chime();
      b.innerHTML = `<p class="tip">✔ <b>Diagnóstico parcial correto!</b></p>
        <div class="chain"><span>Água normal</span><b>→</b><span>não é eutrofização</span><b>→</b><span>quem passa mal come peixe</span><b>→</b><span>investigar o peixe</span></div>
        <p class="tip">Algumas substâncias quase não ficam na água: elas se escondem no <b>fundo da lagoa</b> e vão se <b>acumulando nos seres vivos</b>. Por isso a água pode dar normal e o peixe, não.</p>
        <div class="row"><button class="btn" id="go">Entendi!</button></div>`;
      $(b, '#go').onclick = closePanel;
    };
    pergunta1();
  });
}
// Lista de alternativas (só avança quando acertar; cada erro mostra a explicação)
function opcoes(b, ops, aoAcertar) {
  const box = $(b, '#opts'), fb = $(b, '#fb');
  ops.forEach(([txt, certa, explica]) => {
    const o = document.createElement('button'); o.className = 'opt'; o.style.width = '100%'; o.style.border = 'none'; o.style.fontFamily = 'inherit'; o.textContent = txt;
    o.onclick = () => {
      if (certa) { chime(); aoAcertar(); return; }
      G.diagErros++; buzz(); fb.className = 'fb bad'; fb.textContent = explica;
    };
    box.appendChild(o);
  });
}
