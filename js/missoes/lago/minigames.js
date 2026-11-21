// Arquivo: missoes/lago/minigames.js — as janelas de cada atividade da missão do lago:
// kit de campo (Secchi, sonda, frasco), laboratório (microscópio, química,
// coliformes), diagnóstico, vitória e a tabela de resultados do caderno.
// (Os "../../" sobem duas pastas: de js/missoes/lago/ para js/.)
import { Q, stage, SAMPLE_TIME, INCUB_TIME } from './estado.js';
import { openPanel, closePanel, panelToken, $, holdButton, mixHex, say } from '../../interface.js';
import { chime, blip, buzz, tone } from '../../audio.js';
import { clamp, lerp, rr, rand, mulberry32, FONT } from '../../utils.js';
import { lakeFx } from '../../lake.js';
import { boardTex } from '../../construcao.js';

// Leituras da sonda (pioram/melhoram com a saúde do lago)
export const probeValues = (h) => ({ od: lerp(2.1, 7.6, h), ph: lerp(8.9, 7.3, h), temp: lerp(27, 25, h) });
export const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');

// ---------- Tabela de resultados (usada no caderno e no diagnóstico) ----------
export function resultsHTML() {
  const v = probeValues(0);
  const row = (n, val, ideal, bad) => `<tr><td>${n}</td><td class="${val === '—' ? '' : bad ? 'bad-c' : 'good-c'}">${val}</td><td>${ideal}</td></tr>`;
  return `<table class="res"><tr><th>Análise</th><th>Resultado</th><th>Lago saudável</th></tr>
    ${row('Transparência (Secchi)', Q.secchi ? Q.secchi + ' cm' : '—', 'mais de 100 cm', true)}
    ${row('Oxigênio dissolvido', Q.probe ? fmt(v.od) + ' mg/L' : '—', 'mais de 5 mg/L', true)}
    ${row('pH', Q.probe ? fmt(v.ph) : '—', 'entre 6 e 8,5', true)}
    ${row('Microscópio', Q.micro ? 'muitas cianobactérias' : '—', 'algas variadas', true)}
    ${row('Fósforo', Q.chemP ? 'ALTO · 0,25 mg/L' : '—', 'até 0,03 mg/L', true)}
    ${row('Nitrogênio (amônia)', Q.chemN ? 'ALTO · 3,5 mg/L' : '—', 'até 0,5 mg/L', true)}
    ${row('Coliformes (E. coli)', Q.coli === 3 ? 'PRESENTE' : '—', 'ausente', true)}</table>`;
}

// =====================================================================
//  CAMPO: KIT (Secchi, sonda, frasco)
// =====================================================================
export function openKit() {
  openPanel('🎒 Kit de campo', (b) => {
    const final = stage() === 6;
    b.innerHTML = `<p class="tip">${final ? 'O lago foi tratado! Use a <b>sonda</b> para medir o oxigênio de novo.' : 'Use as 3 ferramentas para investigar a água. A ordem você escolhe!'}</p><div class="tools"></div>`;
    const tools = [
      ['⚫', 'Disco de Secchi', 'Mede a transparência: até onde a luz entra.', Q.secchi ? Q.secchi + ' cm ✔' : '', secchiGame, final],
      ['📟', 'Sonda multiparâmetro', 'Lê oxigênio, pH e temperatura.', Q.probe && !final ? 'feito ✔' : '', probeGame, false],
      ['🧪', 'Frasco de coleta', 'Leva água para o laboratório.', Q.stored ? 'no lab ✔' : Q.sample ? 'na mochila ✔' : '', collectGame, Q.sample || Q.stored || final],
    ];
    for (const [ic, nm, ds, st, fn, dis] of tools) {
      const d = document.createElement('div'); d.className = 'tool';
      d.innerHTML = `<div class="ic">${ic}</div><div><div class="nm">${nm}</div><div class="ds">${ds}</div></div><div class="st">${st}<br></div>`;
      const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Usar'; bt.disabled = dis; bt.onclick = fn;
      d.querySelector('.st').appendChild(bt); $(b, '.tools').appendChild(d);
    }
  });
}

// ---------- Disco de Secchi: segure para baixar, pare quando o disco sumir ----------
export function secchiGame() {
  openPanel('⚫ Disco de Secchi', (b, tok) => {
    b.innerHTML = `<p class="tip">Segure <b>⬇ Baixar</b> e observe o disco. Quando ele <b>quase sumir</b> na água verde, clique em <b>Sumiu!</b></p>
      <canvas class="mg" width="440" height="300"></canvas>
      <div class="row"><button class="btn ghost" id="up">⬆ Subir</button><button class="btn" id="dn">⬇ Baixar</button><button class="btn warn" id="ok">Sumiu!</button></div>
      <p class="fb" id="fb"></p>`;
    const cv = $(b, 'canvas'), g = cv.getContext('2d'), fb = $(b, '#fb');
    let depth = 0, dir = 0, done = false, last = performance.now();
    holdButton($(b, '#dn'), on => dir = on ? 1 : (dir === 1 ? 0 : dir));
    holdButton($(b, '#up'), on => dir = on ? -1 : (dir === -1 ? 0 : dir));
    const alphaAt = d => Math.exp(-d / 0.09);          // água turva: o disco some rápido
    $(b, '#ok').onclick = () => {
      if (done) return;
      const a = alphaAt(depth);
      if (a > 0.09) { fb.className = 'fb bad'; fb.textContent = 'Ainda dá pra ver o disco! Baixe mais um pouco.'; buzz(); }
      else if (a < 0.012) { fb.className = 'fb bad'; fb.textContent = 'Passou do ponto: o disco já sumiu há tempo. Suba um pouco.'; buzz(); }
      else {
        done = true; Q.secchi = Math.round(depth * 100); chime();
        fb.className = 'fb good'; fb.innerHTML = `Transparência: <b>${Q.secchi} cm</b>. Num lago saudável o disco aparece a mais de 1 metro! Água tão turva = excesso de algas.`;
        const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Voltar ao kit'; bt.onclick = openKit; fb.after(bt); bt.style.display = 'block'; bt.style.margin = '8px auto 0';
      }
    };
    const loop = () => {
      if (tok !== panelToken) return;
      const now = performance.now(), dts = Math.min(0.1, (now - last) / 1000); last = now;
      if (!done) depth = clamp(depth + dir * 0.12 * dts, 0, 0.6);   // 12 cm por segundo
      const W = 440, H = 300, sy = 50, py = 380;               // py = pixels por metro
      const grd = g.createLinearGradient(0, sy, 0, H); grd.addColorStop(0, '#6f9a3a'); grd.addColorStop(1, '#22360f');
      g.fillStyle = '#cfe8f7'; g.fillRect(0, 0, W, sy); g.fillStyle = grd; g.fillRect(0, sy, W, H - sy);
      g.fillStyle = '#7a5230'; g.fillRect(120, sy - 18, 200, 10);                       // píer
      for (let y = 0; y <= 0.6; y += 0.1) { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = `600 13px ${FONT}`; g.fillText(Math.round(y * 100) + ' cm', 20, sy + y * py + 4); g.fillRect(70, sy + y * py, 12, 2); }
      const dy = sy + depth * py;
      g.strokeStyle = '#f1e3c4'; g.lineWidth = 2; g.beginPath(); g.moveTo(220, sy - 8); g.lineTo(220, dy); g.stroke();
      for (let k = 1; k * 0.05 < depth; k++) { g.fillStyle = k % 2 ? '#e03131' : '#fff'; g.fillRect(217, sy + k * 0.05 * py - 1, 6, 3); }
      g.globalAlpha = alphaAt(depth);
      g.save(); g.translate(220, dy + 6); g.scale(1, 0.35);
      for (let q = 0; q < 4; q++) { g.fillStyle = q % 2 ? '#111' : '#fff'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 46, q * Math.PI / 2, (q + 1) * Math.PI / 2); g.fill(); }
      g.restore(); g.globalAlpha = 1;
      for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(150,200,60,.35)'; g.fillRect((i * 97 + performance.now() * 0.01 * (i % 3)) % W, sy + (i * 53) % (H - sy), 3, 3); }
      g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.fillText(`Profundidade: ${Math.round(depth * 100)} cm`, 290, H - 14);
      requestAnimationFrame(loop);
    };
    loop();
  });
}

// ---------- Sonda multiparâmetro ----------
export function probeGame() {
  openPanel('📟 Sonda multiparâmetro', (b, tok) => {
    const final = stage() === 6, v = probeValues(final ? 1 : Q.health);
    b.innerHTML = `<p class="tip">Mergulhe o sensor e espere as leituras. As faixas <b style="color:#2b8a3e">verdes</b> mostram o ideal para a vida no lago.</p>
      <canvas class="mg" width="440" height="230"></canvas><div class="row"><button class="btn" id="go">💧 Mergulhar sensor</button></div><div class="card" id="out">Aguardando leitura…</div>`;
    const g = $(b, 'canvas').getContext('2d');
    const bars = [['Oxigênio (mg/L)', v.od, 0, 10, 5, 10], ['pH', v.ph, 4, 11, 6, 8.5], ['Temperatura (°C)', v.temp, 10, 35, 15, 30]];
    let t = 0, running = false;
    const draw = () => {
      g.fillStyle = '#1f2d27'; g.fillRect(0, 0, 440, 230);
      bars.forEach(([n, val, mn, mx, lo, hi], i) => {
        const y = 30 + i * 68, x0 = 30, w = 380, k = Math.min(1, t);
        g.fillStyle = '#e9ecef'; g.font = `600 15px ${FONT}`; g.fillText(n, x0, y - 6);
        g.fillStyle = '#3a4a42'; g.fillRect(x0, y, w, 22);
        g.fillStyle = 'rgba(64,192,87,.45)'; g.fillRect(x0 + (lo - mn) / (mx - mn) * w, y, (hi - lo) / (mx - mn) * w, 22);
        const cur = lerp(mn, val, k), ok = val >= lo && val <= hi;
        g.fillStyle = k < 1 ? '#ffd43b' : ok ? '#51cf66' : '#ff6b6b'; g.fillRect(x0 + (cur - mn) / (mx - mn) * w - 3, y - 4, 6, 30);
        g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.fillText(fmt(cur), x0 + w - 40, y + 44);
      });
    };
    draw();
    $(b, '#go').onclick = () => {
      if (running) return; running = true; $(b, '#go').disabled = true;
      const loop = () => {
        if (tok !== panelToken) return;
        t += 1 / 90; draw();
        if (t < 1) return requestAnimationFrame(loop);
        chime(); Q.probe = true;
        const out = $(b, '#out');
        if (final) {
          Q.won = true;
          out.innerHTML = `<b>Oxigênio: ${fmt(v.od)} mg/L</b> — os peixes conseguem respirar de novo! 🐟 O lago está se recuperando.`;
          const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = '🏆 Ver resultado'; bt.onclick = winPanel; out.after(bt); bt.style.margin = '10px auto 0'; bt.style.display = 'block';
        } else {
          out.className = 'card alert';
          out.innerHTML = `⚠ <b>Oxigênio muito baixo (${fmt(v.od)} mg/L)</b>: os peixes sufocam. <b>pH alto (${fmt(v.ph)})</b>: sinal de algas demais fazendo fotossíntese. A temperatura está normal.`;
          const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Voltar ao kit'; bt.onclick = openKit; out.after(bt); bt.style.margin = '10px auto 0'; bt.style.display = 'block';
        }
      };
      loop();
    };
  });
}

// ---------- Coleta da amostra ----------
export function collectGame() {
  openPanel('🧪 Coletar amostra', (b, tok) => {
    b.innerHTML = `<p class="tip">Encha o frasco com água da superfície (uns 30 cm de profundidade).</p>
      <div class="row"><div class="tube" style="width:70px;height:170px"><div class="liq" style="height:0%;background:#7aa83a"></div></div></div>
      <div class="row"><button class="btn" id="go">Encher frasco</button></div><p class="fb" id="fb"></p>`;
    $(b, '#go').onclick = () => {
      $(b, '#go').disabled = true; $(b, '.liq').style.transition = 'height 1.4s'; $(b, '.liq').style.height = '80%';
      setTimeout(() => {
        if (tok !== panelToken) return;
        Q.sample = true; Q.sampleT = SAMPLE_TIME; chime();
        $(b, '#fb').className = 'fb good';
        $(b, '#fb').innerHTML = 'Amostra coletada! ⏱ Ela dura <b>3 minutos</b> fora da geladeira — depois as bactérias mudam o resultado.';
        const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Voltar ao kit'; bt.onclick = openKit; $(b, '#fb').after(bt); bt.style.margin = '8px auto 0'; bt.style.display = 'block';
      }, 1500);
    };
  });
}

// =====================================================================
//  LABORATÓRIO
// =====================================================================
// ---------- Microscópio: foco + encontrar 3 colônias de cianobactérias ----------
export const BESTIARY = {
  cyano: ['Cianobactéria (Microcystis)', 'Colônias de células minúsculas dentro de uma "gelatina". Em excesso, deixam a água verde e podem produzir <b>toxinas</b>. ⚠ Sinal de eutrofização!', true],
  alga: ['Alga verde (Scenedesmus)', 'Algas em grupinhos de 4 células. Fazem fotossíntese e são comuns em lagos — o problema é quando há demais.', false],
  diatom: ['Diatomácea', 'Alga com uma "casca" de vidro (sílica). Comum em águas mais saudáveis.', false],
  param: ['Paramécio (protozoário)', 'Come bactérias. Muitos paramécios indicam <b>matéria orgânica</b> se decompondo.', false],
};
export function microGame() {
  openPanel('🔬 Microscópio', (b, tok) => {
    b.innerHTML = `<p class="tip">1) Ajuste o <b>foco</b> até a imagem ficar nítida. 2) Clique em <b>3 colônias de cianobactérias</b>. Clicar nos outros seres mostra o que eles são!</p>
      <canvas class="mg" width="420" height="420" style="width:min(380px,80vw)"></canvas>
      <div class="row"><span>🔎 Foco</span><input type="range" id="fc" min="0" max="100" value="12"><b id="cnt">0/3</b></div>
      <div class="card" id="info">Clique num ser vivo para ver o que é.</div>`;
    const cv = $(b, 'canvas'), g = cv.getContext('2d'), fc = $(b, '#fc'), info = $(b, '#info');
    const SHARP = 64, orgs = [];
    const add = (type, n, size, speed) => { for (let i = 0; i < n; i++) { const o = { type, size, x: rr(70, 350), y: rr(70, 350), vx: rr(-1, 1) * speed, vy: rr(-1, 1) * speed, rot: rr(0, 6.28), vr: rr(-0.01, 0.01), found: false, dots: [] }; if (type === 'cyano') for (let k = 0; k < 34; k++) { const a = rr(0, 6.28), r = Math.sqrt(rand()) * 26; o.dots.push([Math.cos(a) * r * 1.2, Math.sin(a) * r]); } orgs.push(o); } };
    add('cyano', 5, 34, 0.12); add('alga', 4, 22, 0.2); add('diatom', 3, 24, 0.25); add('param', 2, 24, 0.7);
    let found = 0;
    const defocus = () => Math.abs(fc.value - SHARP) / 40;
    function drawOrg(o) {
      g.save(); g.translate(o.x, o.y); g.rotate(o.rot);
      if (o.type === 'cyano') { g.fillStyle = 'rgba(150,200,160,.35)'; g.beginPath(); g.ellipse(0, 0, 36, 30, 0, 0, 7); g.fill(); for (const [dx, dy] of o.dots) { g.fillStyle = '#2f7d5d'; g.beginPath(); g.arc(dx, dy, 3, 0, 7); g.fill(); } }
      else if (o.type === 'alga') { for (let i = 0; i < 4; i++) { g.fillStyle = '#5cb836'; g.strokeStyle = '#2b6a12'; g.beginPath(); g.ellipse(-12 + i * 8, 0, 4, 12, 0, 0, 7); g.fill(); g.stroke(); } g.strokeStyle = '#2b6a12'; g.beginPath(); g.moveTo(-12, -12); g.lineTo(-18, -22); g.moveTo(12, -12); g.lineTo(18, -22); g.stroke(); }
      else if (o.type === 'diatom') { g.fillStyle = '#d4a72c'; g.strokeStyle = '#8a6a12'; g.beginPath(); g.ellipse(0, 0, 26, 7, 0, 0, 7); g.fill(); g.stroke(); for (let i = -20; i <= 20; i += 5) { g.beginPath(); g.moveTo(i, -5); g.lineTo(i, 5); g.stroke(); } }
      else { g.fillStyle = 'rgba(200,215,225,.8)'; g.strokeStyle = '#6c8a99'; g.beginPath(); g.ellipse(0, 0, 24, 11, 0, 0, 7); g.fill(); g.stroke(); for (let i = 0; i < 20; i++) { const a = i / 20 * 6.28; g.beginPath(); g.moveTo(Math.cos(a) * 24, Math.sin(a) * 11); g.lineTo(Math.cos(a) * 28, Math.sin(a) * 14); g.stroke(); } g.fillStyle = '#6c8a99'; g.beginPath(); g.arc(4, 0, 4, 0, 7); g.fill(); }
      g.restore();
      if (o.found) { g.strokeStyle = '#40c057'; g.lineWidth = 3; g.beginPath(); g.arc(o.x, o.y, 42, 0, 7); g.stroke(); g.lineWidth = 1; }
    }
    const loop = () => {
      if (tok !== panelToken) return;
      for (const o of orgs) { o.x += o.vx; o.y += o.vy; o.rot += o.vr; if (Math.hypot(o.x - 210, o.y - 210) > 170) { o.vx *= -1; o.vy *= -1; } }
      g.clearRect(0, 0, 420, 420);
      g.save(); g.beginPath(); g.arc(210, 210, 205, 0, 7); g.clip();
      const bg = g.createRadialGradient(210, 210, 20, 210, 210, 210); bg.addColorStop(0, '#fbf8e4'); bg.addColorStop(1, '#d8d0a2'); g.fillStyle = bg; g.fillRect(0, 0, 420, 420);
      const d = defocus(), copies = 1 + Math.round(Math.min(d, 1) * 6);     // "desfoque" desenhando cópias deslocadas
      for (let k = 0; k < copies; k++) {
        g.globalAlpha = 1 / copies + (copies > 1 ? 0.05 : 0);
        g.save(); g.translate(Math.cos(k * 2.4) * d * 14, Math.sin(k * 2.4) * d * 14); orgs.forEach(drawOrg); g.restore();
      }
      g.globalAlpha = 1; g.restore();
      g.strokeStyle = '#111'; g.lineWidth = 14; g.beginPath(); g.arc(210, 210, 208, 0, 7); g.stroke(); g.lineWidth = 1;
      requestAnimationFrame(loop);
    };
    loop();
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 420 / r.width, y = (e.clientY - r.top) * 420 / r.height;
      if (defocus() > 0.25) { info.className = 'card'; info.innerHTML = '🌫 Está tudo embaçado! Mexa no <b>foco</b> até as bordas ficarem nítidas.'; buzz(); return; }
      const o = orgs.find(o => Math.hypot(o.x - x, o.y - y) < o.size + 6); if (!o) return;
      const [nm, ds, alert] = BESTIARY[o.type];
      info.className = alert ? 'card alert' : 'card'; info.innerHTML = `<b>${nm}</b><br>${ds}`;
      if (o.type === 'cyano' && !o.found && found < 3) {
        o.found = true; found++; $(b, '#cnt').textContent = found + '/3'; chime();
        if (found === 3) {
          Q.micro = true;
          info.innerHTML += '<br><br>✔ <b>Resultado: muitas cianobactérias.</b> O lago tem nutrientes demais.';
          const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Concluir'; bt.onclick = closePanel; info.after(bt); bt.style.margin = '10px auto 0'; bt.style.display = 'block';
        }
      } else blip();
    });
  });
}

// ---------- Testes químicos (colorimetria) ----------
export function chemGame() {
  const tests = [
    { k: 'chemP', name: 'Fósforo (fosfato)', cols: ['#e9f2fb', '#a9c8ee', '#4f86d6', '#1c3d94'], vals: ['0,01', '0,05', '0,25', '1,0'], why: 'O fósforo vem de <b>detergentes (esgoto)</b> e de <b>adubos</b>. Ele é "comida" para as algas.' },
    { k: 'chemN', name: 'Nitrogênio (amônia)', cols: ['#fbeff5', '#f3b5d3', '#e0589b', '#8c1457'], vals: ['0,1', '0,5', '3,5', '10'], why: 'A amônia vem do <b>esgoto</b> e dos <b>fertilizantes</b>. Também faz as algas explodirem.' },
  ];
  const t = tests.find(x => !Q[x.k]) || tests[1];
  const ANS = 2, BASE = '#e3ead0';
  openPanel('⚗️ Teste químico: ' + t.name, (b) => {
    b.innerHTML = `<p class="tip">1) Pingue <b>5 gotas</b> de reagente no tubo. 2) Compare a cor do tubo com a <b>cartela</b> e escolha a mais parecida.</p>
      <div class="row"><div class="tube"><div class="liq" style="background:${BASE}"></div></div>
      <div><button class="btn" id="drop">💧 Pingar reagente</button><div style="text-align:center;margin-top:6px" id="dc">0/5 gotas</div></div></div>
      <div class="swatches" style="opacity:.35;pointer-events:none"></div><p class="fb" id="fb"></p>`;
    let drops = 0;
    const sws = $(b, '.swatches');
    t.cols.forEach((c, i) => {
      const s = document.createElement('button'); s.className = 'sw'; s.innerHTML = `<i style="background:${c}"></i>${['Baixo', 'Médio', 'Alto', 'Muito alto'][i]}<br><small>${t.vals[i]} mg/L</small>`;
      s.onclick = () => {
        const fb = $(b, '#fb');
        if (i === ANS) {
          Q[t.k] = true; chime(); s.style.borderColor = '#2b8a3e';
          fb.className = 'fb good'; fb.innerHTML = `✔ ${t.name}: <b>ALTO (${t.vals[i]} mg/L)</b>. ${t.why}`;
          sws.style.pointerEvents = 'none';
          const next = tests.find(x => !Q[x.k]);
          const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = next ? 'Próximo teste ▶' : 'Concluir'; bt.onclick = next ? chemGame : closePanel;
          fb.after(bt); bt.style.margin = '8px auto 0'; bt.style.display = 'block';
        } else { buzz(); fb.className = 'fb bad'; fb.textContent = i < ANS ? 'Compare de novo: a cor do tubo é mais forte que essa.' : 'Compare de novo: a cor do tubo é mais clara que essa.'; }
      };
      sws.appendChild(s);
    });
    $(b, '#drop').onclick = () => {
      if (drops >= 5) return; drops++; blip();
      $(b, '.liq').style.background = mixHex(BASE, t.cols[ANS], drops / 5);
      $(b, '#dc').textContent = drops + '/5 gotas';
      if (drops === 5) { $(b, '#drop').disabled = true; sws.style.opacity = 1; sws.style.pointerEvents = 'auto'; }
    };
  });
}

// ---------- Bancada de amostras: guardar a amostra + teste de coliformes ----------
export function drawPetri(g, colonies) {
  g.clearRect(0, 0, 260, 260);
  g.fillStyle = '#f3e9c6'; g.beginPath(); g.arc(130, 130, 110, 0, 7); g.fill();
  g.strokeStyle = '#ced4da'; g.lineWidth = 8; g.stroke();
  if (colonies) { const r = mulberry32(7); for (let i = 0; i < 60; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 95; g.fillStyle = r() < 0.75 ? '#7048e8' : '#1c7ed6'; g.beginPath(); g.arc(130 + Math.cos(a) * d, 130 + Math.sin(a) * d, 3 + r() * 5, 0, 7); g.fill(); } }
}
export function amostrasBench() {
  if (!Q.stored) {
    if (Q.sample) { Q.stored = true; chime(); return; }
    say(['Ainda não tem amostra aqui. Pegue água do lago com o <b>kit de campo</b> no píer.'], '🧫 Bancada AMOSTRAS'); return;
  }
  openPanel('🧫 Coliformes (bactérias de esgoto)', (b, tok) => {
    const stepUI = () => {
      if (Q.coli === 0) {
        b.innerHTML = `<p class="tip">A bactéria <b>E. coli</b> vive no intestino. Se ela cresce na água do lago, é sinal de <b>esgoto</b>! Semeie a placa e leve à estufa.</p>
          <canvas class="mg" width="260" height="260"></canvas><div class="row"><button class="btn" id="a">1) Semear a placa</button><button class="btn" id="c" disabled>2) Levar à estufa</button></div>`;
        const g = $(b, 'canvas').getContext('2d'); drawPetri(g, false);
        $(b, '#a').onclick = () => { blip(); g.strokeStyle = 'rgba(120,150,60,.6)'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 9; i++) { g.moveTo(60, 70 + i * 14); g.lineTo(200, 75 + i * 14); } g.stroke(); $(b, '#a').disabled = true; $(b, '#c').disabled = false; };
        $(b, '#c').onclick = () => { Q.coli = 1; Q.coliT = INCUB_TIME; chime(); closePanel(); say([`Placa na estufa! Leva uns <b>${INCUB_TIME} segundos</b>. Enquanto isso, faça o microscópio e os testes químicos.`], '🧫 Bancada AMOSTRAS'); };
      } else if (Q.coli === 1) {
        b.innerHTML = `<p class="tip">A placa ainda está crescendo na estufa (37 °C). Faltam <b>${Math.ceil(Q.coliT)} s</b>. Enquanto isso, use as outras bancadas!</p>`;
      } else if (Q.coli === 2) {
        b.innerHTML = `<p class="tip">A placa está pronta! Observe as colônias que cresceram.</p><canvas class="mg" width="260" height="260"></canvas>
          <p style="font-weight:700;text-align:center">O que as colônias <span style="color:#7048e8">roxas/azuis</span> indicam?</p>
          <div id="opts"></div><p class="fb" id="fb"></p>`;
        drawPetri($(b, 'canvas').getContext('2d'), true);
        [['A água está limpa', 0], ['Tem E. coli → há esgoto no lago', 1], ['A água tem sal demais', 0]].forEach(([txt, ok]) => {
          const o = document.createElement('div'); o.className = 'opt'; o.textContent = txt;
          o.onclick = () => { const fb = $(b, '#fb'); if (ok) { Q.coli = 3; chime(); fb.className = 'fb good'; fb.innerHTML = '✔ <b>Coliformes presentes!</b> Alguém está jogando esgoto no lago.'; const bt = document.createElement('button'); bt.className = 'btn'; bt.textContent = 'Concluir'; bt.onclick = closePanel; fb.after(bt); bt.style.margin = '8px auto 0'; bt.style.display = 'block'; } else { buzz(); fb.className = 'fb bad'; fb.textContent = 'Não é isso. Lembre: E. coli vem do intestino…'; } };
          $(b, '#opts').appendChild(o);
        });
      } else b.innerHTML = `<p class="tip">✔ Teste concluído: <b>E. coli presente</b> (sinal de esgoto).</p>`;
    };
    stepUI();
  });
}
export function benchNeedsSample(name) {
  if (Q.stored) return false;
  say([`Para usar ${name}, primeiro guarde uma amostra do lago na bancada <b>AMOSTRAS</b>.`], '🔬 Laboratório'); return true;
}

// ---------- Mural: diagnóstico ----------
export function diagnosticoPanel() {
  const s = stage();
  if (s < 4) { say(['O diagnóstico abre quando <b>todas as análises</b> estiverem prontas. Aperte <b>C</b> para ver o caderno de campo.'], '📋 Mural de missões'); return; }
  openPanel('📋 Diagnóstico do Lago da Mata', (b) => {
    if (Q.diag) { b.innerHTML = resultsHTML() + '<p class="tip">✔ Causas: <b>esgoto</b> e <b>adubo</b>. Plano: biofiltro, mata ciliar e aerador.</p>'; return; }
    b.innerHTML = `<p class="tip">Veja seus resultados e marque <b>as causas</b> do problema (pode ser mais de uma).</p>${resultsHTML()}
      <div id="opts"></div><div class="row"><button class="btn" id="ok">Confirmar diagnóstico</button></div><p class="fb" id="fb"></p>`;
    const opts = [['sew', '🚽 Esgoto despejado no lago', true, ''], ['fert', '🌾 Adubo que escorre das plantações', true, ''], ['metal', '🏭 Metais pesados de uma fábrica', false, 'Não há fábrica aqui e não testamos metais — não temos evidência disso.'], ['cold', '❄️ Frio demais na água', false, 'A temperatura estava normal (27 °C).']];
    opts.forEach(([id, txt]) => { const o = document.createElement('label'); o.className = 'opt'; o.innerHTML = `<input type="checkbox" id="${id}"> ${txt}`; $(b, '#opts').appendChild(o); });
    $(b, '#ok').onclick = () => {
      const fb = $(b, '#fb'), wrong = opts.filter(([id, , ok]) => !ok && $(b, '#' + id).checked), miss = opts.filter(([id, , ok]) => ok && !$(b, '#' + id).checked);
      if (wrong.length) { buzz(); fb.className = 'fb bad'; fb.textContent = wrong[0][3]; return; }
      if (miss.length) { buzz(); fb.className = 'fb bad'; fb.textContent = miss[0][0] === 'sew' ? 'Falta uma causa! O que os coliformes (E. coli) indicam?' : 'Falta uma causa! De onde mais vem tanto fósforo e nitrogênio? Lembra dos sacos perto do lago?'; return; }
      Q.diag = true; chime();
      b.innerHTML = `<p class="tip">✔ <b>Diagnóstico correto!</b> O lago está <b>eutrofizado</b>. Veja como aconteceu:</p>
        <div class="chain"><span>Esgoto + adubo</span><b>→</b><span>muito N e P</span><b>→</b><span>explosão de algas</span><b>→</b><span>algas morrem</span><b>→</b><span>bactérias decompõem e gastam O₂</span><b>→</b><span>peixes morrem</span></div>
        <p class="tip">Plano de recuperação:<br>🟩 <b>Biofiltro</b> no cano de esgoto<br>🌱 <b>Mata ciliar</b>: plantar 6 mudas na margem perto dos sacos de adubo<br>☀️ <b>Aerador solar</b> no fim do píer</p>
        <div class="row"><button class="btn" id="go">Mãos à obra!</button></div>`;
      $(b, '#go').onclick = closePanel;
    };
  });
}

// ---------- Vitória ----------
export function winPanel() {
  openPanel('🏆 Lago da Mata recuperado!', (b) => {
    const v0 = probeValues(0), v1 = probeValues(1);
    b.innerHTML = `<p class="tip">Parabéns, pesquisador(a)! Você investigou, descobriu as causas e agiu. 🐟🌿</p>
      <table class="res"><tr><th></th><th>Antes</th><th>Depois</th></tr>
      <tr><td>Transparência</td><td class="bad-c">${Q.secchi} cm</td><td class="good-c">180 cm</td></tr>
      <tr><td>Oxigênio</td><td class="bad-c">${fmt(v0.od)} mg/L</td><td class="good-c">${fmt(v1.od)} mg/L</td></tr>
      <tr><td>pH</td><td class="bad-c">${fmt(v0.ph)}</td><td class="good-c">${fmt(v1.ph)}</td></tr>
      <tr><td>Algas</td><td class="bad-c">explosão de cianobactérias</td><td class="good-c">equilibradas</td></tr>
      <tr><td>Peixes</td><td class="bad-c">morrendo</td><td class="good-c">vivos e pulando!</td></tr></table>
      <p class="tip"><b>Resumo:</b> nutrientes demais (N e P) → muitas algas → quando elas morrem, a decomposição gasta o oxigênio → peixes morrem. Cortar a fonte de nutrientes e devolver oxigênio recupera o lago.</p>
      <div class="row"><button class="btn" id="go">Continuar explorando</button></div>`;
    $(b, '#go').onclick = closePanel;
    tone(523, 0.15, { vol: 0.09 }); tone(659, 0.15, { vol: 0.09, when: 0.15 }); tone(784, 0.15, { vol: 0.09, when: 0.3 }); tone(1047, 0.4, { vol: 0.09, when: 0.45 });
    placaRecuperada();
  });
}

// Troca a placa de monitoramento do lago pela versão "recuperado"
export function placaRecuperada() {
  lakeFx.monBoard.userData.face.material.map = boardTex('LAGO DA MATA', ['Oxigênio dissolvido: BOM ✔', 'Algas: EQUILIBRADAS ✔', 'Nitrogênio e fósforo: OK ✔', 'Situação: EM RECUPERAÇÃO 🌿'], { accent: '#2b8a3e', size: 50 });
  lakeFx.monBoard.userData.face.material.needsUpdate = true;
}

