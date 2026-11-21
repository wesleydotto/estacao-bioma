// Arquivo: missoes/adubo/minigames.js — as janelas de cada atividade da missão do adubo:
// pontos de coleta (mata e lavoura), minhocas, infiltração, insetos, sonda de solo,
// bancada SOLO do laboratório (matéria orgânica) e a tabela de resultados do caderno.
// Cada atividade de campo exige um EQUIPAMENTO comprado na loja da prefeitura.
import { A, SOLO, SITES, moDe, campoOk, labOk } from './estado.js';
import { openPanel, panelToken, $, say } from '../../interface.js';
import { chime, blip, buzz } from '../../audio.js';
import { mulberry32 } from '../../utils.js';
import { ITENS, qtd, ganhar } from '../../economia.js';
import { bancadaFx } from './bancada.js';

export const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
// segundos → "m:ss" (ex.: 75 → "1:15")
export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// ---------- Pagamentos por etapa (adiantamentos e bônus da prefeitura) ----------
// Chamado depois de cada atividade: paga uma vez só cada item (guardado em A.pagos).
export function checarPagamentos() {
  const paga = (id, valor, motivo) => { if (!A.pagos[id]) { A.pagos[id] = true; ganhar(valor, motivo); } };
  if (campoOk()) paga('campo', 300, 'adiantamento: coleta de campo');
  if (labOk()) {
    paga('lab', 400, 'adiantamento: análise de laboratório');
    if (A.moErros === 0) paga('precisao', 100, 'bônus de precisão nos cálculos');
  }
  if (SITES.every(s => A.solo[s].sonda)) paga('sonda', 100, 'bônus: dados extras com a sonda de solo');
}

// Verifica se o jogador tem o equipamento. Se não tem, avisa e devolve false.
const tem = (id) => qtd(id) > 0;
const nomeItem = (id) => `${ITENS[id].icone} ${ITENS[id].nome}`;

// Botão "Voltar ao ponto" no fim de cada atividade
function botaoVoltar(fb, site) {
  const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Voltar ao ponto de coleta';
  bt.onclick = () => pontoPanel(site); fb.after(bt); bt.style.display = 'block'; bt.style.margin = '8px auto 0';
}

// =====================================================================
//  PONTO DE COLETA (mata ou lavoura): lista as 5 atividades
// =====================================================================
export function pontoPanel(site) {
  const S = SOLO[site], d = A.solo[site];
  openPanel(`${S.icone} Ponto de coleta · ${S.nome}`, (b) => {
    b.innerHTML = `<p class="tip">${site === 'mata' ? 'Este é o <b>solo de referência</b>: uma mata que nunca foi cortada.' : 'Este é o solo da <b>lavoura de soja</b> do Seu Geraldo.'} Faça as mesmas medidas nos dois pontos para poder <b>comparar</b>. Cada atividade pede um <b>equipamento</b> da loja da Prefeitura.</p><div class="tools"></div>`;
    const atividades = [
      ['🪏', 'Coletar amostra de solo', 'Leva um pouco de terra para analisar no laboratório.', 'pa', d.amostra, d.amostra ? 'guardada ✔' : '', () => coletarSolo(site)],
      ['🪱', 'Contar minhocas', 'Quebre os torrões de terra e conte as minhocas.', 'lupaCampo', d.minhocas !== null, d.minhocas !== null ? `${d.minhocas} minhocas ✔` : '', () => minhocasGame(site)],
      ['💧', 'Teste de infiltração', 'Quanto tempo 1 litro de água demora para sumir no solo?', 'kitInfiltracao', d.infilt !== null, d.infilt !== null ? `${mmss(d.infilt)} ✔` : '', () => infiltracaoGame(site)],
      ['🐛', 'Contar insetos', 'Conte os bichinhos em 1 m² de chão.', 'lupaCampo', d.insetos !== null, d.insetos !== null ? `${d.insetos} insetos ✔` : '', () => insetosGame(site)],
      ['🌡️', 'pH e umidade (opcional)', 'Dados extras que valem bônus.', 'sondaSolo', d.sonda, d.sonda ? 'feito ✔' : '', () => sondaGame(site)],
    ];
    for (const [ic, nm, ds, item, feito, st, fn] of atividades) {
      const ok = tem(item), el = document.createElement('div'); el.className = 'tool';
      el.innerHTML = `<div class="ic">${ic}</div><div><div class="nm">${nm}</div><div class="ds">${ok ? ds : `🔒 Precisa de: <b>${nomeItem(item)}</b> (loja da Prefeitura)`}</div></div><div class="st">${st}<br></div>`;
      const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = feito ? 'Refazer' : 'Fazer'; bt.disabled = !ok; bt.onclick = fn;
      el.querySelector('.st').appendChild(bt); $(b, '.tools').appendChild(el);
    }
  });
}

function coletarSolo(site) {
  A.solo[site].amostra = true; chime(); checarPagamentos();
  say(['🪏 Você cavou até <b>20 cm</b> de fundo e guardou a terra num saquinho etiquetado: <b>' + SOLO[site].nome.toUpperCase() + '</b>. Ela vai para a bancada <b>SOLO</b> do laboratório.'], '✔ Amostra de solo', () => pontoPanel(site));
}

// =====================================================================
//  MINHOCAS: quebre os 16 torrões e conte quantas minhocas tem
// =====================================================================
function minhocasGame(site) {
  const S = SOLO[site];
  openPanel('🪱 Contar minhocas · ' + S.nome, (b, tok) => {
    b.innerHTML = `<p class="tip">Clique em cada <b>torrão de terra</b> para quebrá-lo com a lupa. Quebre todos e conte as minhocas! 🔍</p>
      <div id="grade" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:420px;margin:0 auto"></div>
      <p class="fb" id="fb"></p>`;
    // sorteia (com semente fixa, para ser sempre igual) quais torrões têm minhoca
    const sorteio = mulberry32(site === 'mata' ? 11 : 23), ordem = Array.from({ length: 16 }, (_, i) => i);
    for (let i = 15; i > 0; i--) { const j = Math.floor(sorteio() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
    const comMinhoca = new Set(ordem.slice(0, S.minhocas));
    let quebrados = 0, achadas = 0;
    const fb = $(b, '#fb');
    for (let i = 0; i < 16; i++) {
      const t = document.createElement('button'); t.className = 'btn ghost';
      t.style.cssText = 'height:64px;font-size:30px;border-radius:50% 45% 50% 40%;background:#8a5a3a;box-shadow:0 4px 0 #5c3a22;color:#fff';
      t.textContent = '🟤'; t.title = 'Quebrar o torrão';
      t.onclick = () => {
        if (t.dataset.f) return; t.dataset.f = 1; quebrados++; blip();
        t.style.background = '#d9c5a8'; t.style.boxShadow = 'none';
        if (comMinhoca.has(i)) { achadas++; t.textContent = '🪱'; } else t.textContent = '·';
        fb.className = 'fb'; fb.textContent = `Torrões quebrados: ${quebrados}/16 · Minhocas: ${achadas}`;
        if (quebrados === 16) {
          A.solo[site].minhocas = achadas; chime(); checarPagamentos();
          fb.className = 'fb good';
          fb.innerHTML = `Contagem: <b>${achadas} minhocas</b>. ${site === 'mata' ? 'Muitas! Elas misturam a terra e deixam o solo fofo.' : 'Bem poucas… sem matéria orgânica, quase não tem o que elas comerem.'}`;
          botaoVoltar(fb, site);
        }
      };
      $(b, '#grade').appendChild(t);
    }
  });
}

// =====================================================================
//  INFILTRAÇÃO: despeje 1 litro de água e pare o cronômetro quando ela sumir
// =====================================================================
const ESCALA_TEMPO = 18.75;   // 1 segundo de verdade = 18,75 segundos no relógio do jogo (a lavoura leva 6 min = 19 s reais)
function infiltracaoGame(site) {
  const S = SOLO[site];
  openPanel('💧 Teste de infiltração · ' + S.nome, (b, tok) => {
    b.innerHTML = `<p class="tip">Cravamos um anel no chão. Clique em <b>Despejar 1 litro</b> e acompanhe a água sumir. Quando o anel <b>esvaziar</b>, clique em <b>Parar cronômetro</b>. (O relógio roda mais rápido que o real.)</p>
      <div style="display:flex;gap:18px;align-items:center;justify-content:center">
        <div style="width:90px;height:150px;border:4px solid #868e96;border-top:none;border-radius:0 0 12px 12px;position:relative;background:#e9ecef;overflow:hidden"><div id="agua" style="position:absolute;bottom:0;left:0;right:0;height:0;background:#4dabf7"></div></div>
        <div style="font-size:44px;font-weight:700" id="rel">0:00</div></div>
      <div class="row"><button class="btn" id="go">💧 Despejar 1 litro</button><button class="btn warn" id="stop" disabled>⏹ Parar cronômetro</button></div>
      <p class="fb" id="fb"></p>`;
    const fb = $(b, '#fb'), agua = $(b, '#agua'), rel = $(b, '#rel');
    let t = 0, rodando = false, last = 0;
    $(b, '#go').onclick = () => {
      if (rodando) return; rodando = true; t = 0; last = performance.now(); agua.style.height = '100%';
      $(b, '#go').disabled = true; $(b, '#stop').disabled = false; fb.textContent = '';
      const loop = () => {
        if (tok !== panelToken || !rodando) return;
        const now = performance.now(); t += (now - last) / 1000 * ESCALA_TEMPO; last = now;
        rel.textContent = mmss(t);
        agua.style.height = Math.max(0, 100 * (1 - t / S.infilt)) + '%';   // o nível desce até o tempo verdadeiro
        requestAnimationFrame(loop);
      };
      loop();
    };
    $(b, '#stop').onclick = () => {
      if (!rodando) return; rodando = false; $(b, '#stop').disabled = true;
      if (t < S.infilt * 0.85) { buzz(); fb.className = 'fb bad'; fb.textContent = `Cedo demais! Ainda tinha água no anel (${mmss(t)}). Tente de novo.`; $(b, '#go').disabled = false; agua.style.height = '0%'; return; }
      if (t > S.infilt * 1.4) { buzz(); fb.className = 'fb bad'; fb.textContent = `Você demorou para parar (${mmss(t)}): a água já tinha sumido faz tempo. Tente de novo.`; $(b, '#go').disabled = false; agua.style.height = '0%'; return; }
      A.solo[site].infilt = Math.round(t / 5) * 5; chime(); checarPagamentos();
      fb.className = 'fb good';
      fb.innerHTML = `A água levou <b>${mmss(A.solo[site].infilt)}</b> para sumir. ${site === 'mata' ? 'Rápido! O solo da mata é fofo e <b>absorve</b> a chuva.' : 'Muito devagar! O solo está <b>compactado</b>: a chuva escorre pela superfície e leva o adubo junto até o lago.'}`;
      botaoVoltar(fb, site);
    };
  });
}

// =====================================================================
//  INSETOS: conte os bichinhos que andam em 1 m² de chão (20 segundos)
// =====================================================================
function insetosGame(site) {
  const S = SOLO[site], TEMPO = 20, W = 460, H = 260;
  openPanel('🐛 Contar insetos · ' + S.nome, (b, tok) => {
    b.innerHTML = `<p class="tip">Em <b>1 m²</b> de chão, clique em cada inseto que você ver. Você tem <b>${TEMPO} segundos</b>. Eles se mexem!</p>
      <div id="arena" style="position:relative;width:${W}px;max-width:100%;height:${H}px;margin:0 auto;border-radius:14px;overflow:hidden;background:${site === 'mata' ? '#5f7f3a' : '#a4533a'};cursor:crosshair;user-select:none"></div>
      <div class="row"><span id="info" style="font-weight:700"></span><button class="btn warn" id="fim">Terminei</button></div>
      <p class="fb" id="fb"></p>`;
    const arena = $(b, '#arena'), info = $(b, '#info'), fb = $(b, '#fb');
    const rng = mulberry32(site === 'mata' ? 5 : 9);
    const bichos = [];
    for (const [emoji, n] of S.insetos) for (let k = 0; k < n; k++) {
      const el = document.createElement('span'); el.textContent = emoji; el.style.cssText = 'position:absolute;font-size:30px;line-height:1;transition:opacity .2s';
      const bicho = { el, emoji, x: rng() * (W - 40), y: rng() * (H - 40), vx: (rng() - 0.5) * 60, vy: (rng() - 0.5) * 60, marcado: false };
      el.onclick = () => { if (bicho.marcado || acabou) return; bicho.marcado = true; el.style.opacity = '0.3'; el.textContent = '✔'; blip(); atualizaInfo(); };
      arena.appendChild(el); bichos.push(bicho);
    }
    let restante = TEMPO, acabou = false, last = performance.now();
    const contados = () => bichos.filter(x => x.marcado).length;
    const atualizaInfo = () => { info.textContent = `⏱ ${Math.ceil(restante)} s · Contados: ${contados()}`; };
    function terminar() {
      if (acabou) return; acabou = true;
      const achou = contados(), total = bichos.length;
      if (achou / total < 0.7) {   // deixou escapar muitos: tenta de novo
        buzz(); fb.className = 'fb bad'; fb.textContent = 'Ainda tinha vários bichinhos que você não viu! Tente de novo, com calma.';
        const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Tentar de novo'; bt.onclick = () => insetosGame(site);
        fb.after(bt); bt.style.display = 'block'; bt.style.margin = '8px auto 0'; return;
      }
      const tipos = new Set(bichos.filter(x => x.marcado).map(x => x.emoji)).size;
      A.solo[site].insetos = achou; A.solo[site].tipos = tipos; chime(); checarPagamentos();
      fb.className = 'fb good';
      fb.innerHTML = `Você contou <b>${achou} insetos de ${tipos} ${tipos === 1 ? 'tipo' : 'tipos'}</b>. ${site === 'mata' ? 'Muita variedade: a mata sustenta uma <b>cadeia alimentar</b> diversa.' : 'Só lagartas da soja, uma <b>praga</b>. Sem diversidade, não há predadores naturais para controlá-la.'}`;
      botaoVoltar(fb, site);
    }
    $(b, '#fim').onclick = terminar;
    atualizaInfo();
    const loop = () => {
      if (tok !== panelToken || acabou) return;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; restante -= dt;
      for (const x of bichos) {
        x.x += x.vx * dt; x.y += x.vy * dt;
        if (x.x < 0 || x.x > W - 34) { x.vx *= -1; x.x = Math.max(0, Math.min(W - 34, x.x)); }
        if (x.y < 0 || x.y > H - 34) { x.vy *= -1; x.y = Math.max(0, Math.min(H - 34, x.y)); }
        x.el.style.left = x.x + 'px'; x.el.style.top = x.y + 'px';
      }
      atualizaInfo();
      if (restante <= 0) return terminar();
      requestAnimationFrame(loop);
    };
    loop();
  });
}

// =====================================================================
//  SONDA DE SOLO (opcional): pH e umidade
// =====================================================================
function sondaGame(site) {
  const S = SOLO[site];
  openPanel('🌡️ Sonda de solo · ' + S.nome, (b, tok) => {
    b.innerHTML = `<p class="tip">Espete a sonda no solo e espere a leitura.</p><div class="row"><button class="btn" id="go">🌡️ Espetar a sonda</button></div><div class="card" id="out">Aguardando leitura…</div><p class="fb" id="fb"></p>`;
    $(b, '#go').onclick = () => {
      $(b, '#go').disabled = true; $(b, '#out').textContent = 'Lendo…';
      setTimeout(() => {
        if (tok !== panelToken) return;
        A.solo[site].sonda = true; chime(); checarPagamentos();
        $(b, '#out').innerHTML = `<b>pH: ${fmt(S.ph)}</b> · <b>Umidade: ${S.umid}%</b><br>${site === 'mata' ? 'O solo da mata é bem mais <b>úmido</b>: a matéria orgânica segura água como uma esponja.' : 'Solo mais seco e mais ácido: a lavoura perdeu a "esponja" de matéria orgânica.'}`;
        botaoVoltar($(b, '#fb'), site);
      }, 1200);
    };
  });
}

// =====================================================================
//  LABORATÓRIO: bancada SOLO (balança + estufa) → matéria orgânica
// =====================================================================
const etapaLab = { mata: { seco: false, queimado: false }, lavoura: { seco: false, queimado: false } };   // só vale enquanto o jogo está aberto

export function bancadaSoloPanel(site = null) {
  if (!tem('balancaSolo')) {
    buzz(); say([`A bancada <b>SOLO</b> está vazia: falta a ${nomeItem('balancaSolo')}. Ela seca e pesa o solo para achar a matéria orgânica.`, 'Compre na <b>loja da Prefeitura</b>, ao lado da praça. Ela custa <b>R$ ' + ITENS.balancaSolo.preco + '</b>.'], '🧪 Bancada SOLO'); return;
  }
  const prontas = SITES.filter(s => A.solo[s].amostra);
  if (!prontas.length) { say(['Ainda não tem <b>amostra de solo</b> aqui. Colete a terra com a pá nos pontos da mata e da lavoura (perto da fazenda).'], '🧪 Bancada SOLO'); return; }
  if (!site || !prontas.includes(site)) site = prontas[0];
  const S = SOLO[site], e = etapaLab[site];
  openPanel('⚖️ Bancada SOLO · matéria orgânica', (b, tok) => {
    const abas = SITES.map(s => `<button class="btn ${s === site ? '' : 'ghost'}" data-s="${s}" ${A.solo[s].amostra ? '' : 'disabled'}>${SOLO[s].icone} Amostra da ${SOLO[s].nome.toLowerCase()}${A.mo[s] !== null ? ' ✔' : ''}</button>`).join('');
    b.innerHTML = `<div class="row" style="justify-content:flex-start">${abas}</div>
      <p class="tip">A <b>matéria orgânica</b> (restos de plantas e bichos) <b>queima</b> a 550 °C; os minerais não. Compare o peso antes e depois!</p>
      <div class="card"><b>1.</b> Secar a amostra na estufa (105 °C) para tirar a água.<div class="row"><button class="btn" id="b1" ${e.seco ? 'disabled' : ''}>🔥 Secar</button><span id="r1">${e.seco ? `Massa seca: <b>${fmt(S.massaSeca)} g</b>` : ''}</span></div></div>
      <div class="card"><b>2.</b> Queimar a matéria orgânica (550 °C) e pesar de novo.<div class="row"><button class="btn" id="b2" ${!e.seco || e.queimado ? 'disabled' : ''}>🔥 Queimar</button><span id="r2">${e.queimado ? `Massa final: <b>${fmt(S.massaFinal)} g</b>` : ''}</span></div></div>
      <div class="card"><b>3.</b> Calcule: que <b>porcentagem</b> da amostra era matéria orgânica?<br><small>% = (massa seca − massa final) ÷ massa seca × 100</small>
        <div class="row"><input id="resp" type="text" inputmode="decimal" placeholder="ex.: 5,5" style="font:inherit;padding:8px;width:110px;border-radius:10px;border:2px solid #adb5bd"> %<button class="btn" id="b3" ${!e.queimado || A.mo[site] !== null ? 'disabled' : ''}>Conferir</button></div></div>
      <p class="fb" id="fb">${A.mo[site] !== null ? `Resultado registrado: <b>${fmt(A.mo[site])}%</b> de matéria orgânica.` : ''}</p>`;
    b.querySelectorAll('[data-s]').forEach(bt => bt.onclick = () => bancadaSoloPanel(bt.dataset.s));
    const fb = $(b, '#fb');
    // Etapas 1 e 2: barrinha de progresso com o forno brilhando
    const processo = (btn, segundos, fim) => {
      btn.disabled = true; bancadaFx.ativo = true; let k = 0, last = performance.now();
      const loop = () => {
        if (tok !== panelToken) { bancadaFx.ativo = false; return; }
        const now = performance.now(); k += (now - last) / 1000 / segundos; last = now;
        btn.textContent = `⏳ ${Math.min(100, Math.round(k * 100))}%`;
        if (k < 1) return requestAnimationFrame(loop);
        bancadaFx.ativo = false; chime(); fim();
      };
      loop();
    };
    $(b, '#b1').onclick = (ev) => processo(ev.currentTarget, 3, () => { e.seco = true; bancadaSoloPanel(site); });
    $(b, '#b2').onclick = (ev) => processo(ev.currentTarget, 4, () => { e.queimado = true; bancadaSoloPanel(site); });
    $(b, '#b3').onclick = () => {
      const v = parseFloat($(b, '#resp').value.replace(',', '.'));
      if (Number.isNaN(v)) { buzz(); fb.className = 'fb bad'; fb.textContent = 'Digite um número (pode usar vírgula).'; return; }
      if (Math.abs(v - moDe(site)) <= 0.5) {
        A.mo[site] = moDe(site); chime(); checarPagamentos();
        fb.className = 'fb good'; fb.innerHTML = `Certo! <b>${fmt(moDe(site))}%</b> de matéria orgânica. ${site === 'mata' ? 'O solo da mata é rico em húmus.' : 'O solo da lavoura está <b>pobre</b>: foi perdendo matéria orgânica depois que a mata saiu.'}`;
        const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Continuar'; bt.onclick = () => bancadaSoloPanel(SITES.find(s => A.solo[s].amostra && A.mo[s] === null) || site);
        fb.after(bt); bt.style.display = 'block'; bt.style.margin = '8px auto 0'; $(b, '#b3').disabled = true;
      } else {
        A.moErros++; buzz(); fb.className = 'fb bad';
        fb.textContent = `Não é bem isso. Dica: ${fmt(S.massaSeca)} − ${fmt(S.massaFinal)} = ${fmt(S.massaSeca - S.massaFinal)} g de matéria orgânica. Agora divida pela massa seca e multiplique por 100.`;
      }
    };
  });
}

// =====================================================================
//  TABELA DE RESULTADOS (caderno de campo): mata × lavoura
// =====================================================================
export function resultadosHTML() {
  const m = A.solo.mata, l = A.solo.lavoura;
  const lin = (nome, a, b, nota) => `<tr><td>${nome}</td><td>${a ?? '—'}</td><td>${b ?? '—'}</td><td>${nota}</td></tr>`;
  const v = (x, f) => (x === null || x === false ? null : f ? f(x) : x);
  return `<table class="res"><tr><th>Medida</th><th>🌳 Mata</th><th>🌾 Lavoura</th><th>O que significa</th></tr>
    ${lin('Minhocas (16 torrões)', v(m.minhocas), v(l.minhocas), 'mais minhocas = solo vivo')}
    ${lin('Infiltração de 1 L', v(m.infilt, mmss), v(l.infilt, mmss), 'quanto mais lento, mais compactado')}
    ${lin('Insetos em 1 m²', v(m.insetos), v(l.insetos), 'variedade = cadeia alimentar')}
    ${lin('Tipos de inseto', m.insetos !== null ? m.tipos : null, l.insetos !== null ? l.tipos : null, 'mata: muitos; lavoura: só a praga')}
    ${lin('Matéria orgânica', v(A.mo.mata, x => fmt(x) + '%'), v(A.mo.lavoura, x => fmt(x) + '%'), 'o "alimento" do solo')}
    ${lin('pH (opcional)', m.sonda ? fmt(SOLO.mata.ph) : null, l.sonda ? fmt(SOLO.lavoura.ph) : null, 'acidez do solo')}
    ${lin('Umidade (opcional)', m.sonda ? SOLO.mata.umid + '%' : null, l.sonda ? SOLO.lavoura.umid + '%' : null, 'água retida')}</table>`;
}
