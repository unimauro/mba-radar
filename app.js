'use strict';
/* MBA Radar — dashboard de costos y retorno del MBA por país.
   Datos: data/paises/index.json (países), data/paises/<code>.json (país), data/global.json (evidencia mundial). */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = u => { try { const p = new URL(u); return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : '#'; } catch { return '#'; } };
const $ = id => document.getElementById(id);
const nf0 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 1});
const SEG_COLOR = {'Escuela de negocios con acreditación internacional': '#257de0', 'Universidad privada': '#f47230', 'Universidad pública': '#00b894'};
const SEG_ORDER = Object.keys(SEG_COLOR);
const SIGNO_TXT = {positivo: 'Retorno positivo', negativo: 'Retorno negativo / riesgo', mixto: 'Mixto', neutral: 'Contexto'};

let P = null, G = null, SIM = '';           // país, global, símbolo moneda
const state = {modalidad: 'todas', q: '', pick: null, base: 2};
const charts = {};
let REFS = [];                              // referencias numeradas [{key,txt,url}]

const money = (v, s = SIM) => v == null ? '—' : `${s} ${nf0.format(Math.round(v))}`;
const short = v => v >= 1e6 ? `${nf1.format(v / 1e6)} M` : v >= 1e3 ? `${nf0.format(v / 1e3)} mil` : nf0.format(v);
function ref(key, txt, url) {
  let i = REFS.findIndex(r => r.key === key);
  if (i < 0) { REFS.push({key, txt, url}); i = REFS.length - 1; }
  return `<sup class="ref"><a href="#ref-${i + 1}" title="${esc(txt)}">[${i + 1}]</a></sup>`;
}

async function getJSON(u) { const r = await fetch(u, {cache: 'no-cache'}); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }

async function init() {
  const idx = await getJSON('data/paises/index.json');
  G = await getJSON('data/global.json');
  const want = (location.hash.match(/pais=([a-z]{2})/) || [])[1] || idx.default;
  $('paises').innerHTML = idx.paises.map(p => `<button data-c="${esc(p.code)}" ${p.listo ? '' : 'disabled title="Próximamente"'} aria-pressed="${p.code === want}">${esc(p.bandera || '')} ${esc(p.nombre)}</button>`).join('');
  $('paises').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) loadPais(b.dataset.c); };
  if (window.Chart) { Chart.defaults.font.family = "'Atkinson Hyperlegible', system-ui, sans-serif"; Chart.defaults.color = '#5b5650'; Chart.defaults.borderColor = '#eee9e1'; }
  await loadPais(want);
}

async function loadPais(code) {
  P = await getJSON(`data/paises/${code}.json`);
  SIM = P.pais.simbolo || 'S/';
  REFS = [];
  document.querySelectorAll('#paises button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === code));
  $('hero-eyebrow').textContent = `${P.pais.nombre} · datos a ${P.pais.fecha_texto || P.pais.fecha}`;
  state.modalidad = 'todas'; state.q = ''; $('q').value = '';
  renderKPIs(); renderFiltros(); renderCostos(); renderSegmentos(); renderBE(); setupCalc();
  renderRetorno(); renderRiesgos(); renderMundo(); renderFuentes();
}

/* ---------- KPIs ---------- */
function conCosto() { return P.programas.filter(p => p.costo_soles > 0); }
function renderShock() {
  const cc = conCosto().sort((a, b) => a.costo_soles - b.costo_soles);
  const max = cc[cc.length - 1], min = cc[0];
  if (max) $('hero-max').textContent = `${SIM} ${nf0.format(Math.round(max.costo_soles / 1000))} mil`;
  const bajo = P.alertas?.find(a => a.id === 'enaho_bajo_mediana');
  const pct = bajo ? +(bajo.hallazgo_clave.match(/(\d+) %/) || [])[1] : null;
  const ofe = P.oferta;
  const items = [
    pct ? {b: `1 de cada ${Math.round(100 / pct)}`, r: 1, s: `con maestría o doctorado gana menos que un universitario típico (INEI, ENAHO 2024)`} : null,
    max && min ? {b: `×${nf0.format(max.costo_soles / min.costo_soles)}`, s: `entre el MBA más caro (${max.siglas || max.universidad}) y el más barato (${min.siglas || min.universidad}). ¿Te pagan ${nf0.format(max.costo_soles / min.costo_soles)} veces más?`}
      : ofe ? {b: ofe.titulo.split(' ')[0], s: `maestrías ofrecidas en el Perú (SUNEDU). Oferta masiva, calidad dispareja.`} : null,
    P.enaho_resumen ? {b: `+${nf0.format(P.enaho_resumen.prima_pct)} %`, s: 'gana en promedio quien tiene posgrado… pero buena parte ya ganaba más antes de estudiarlo'} : null,
    {b: '< 0', r: 1, s: 'retorno promedio de los MBA de programas no rankeados (Altonji y Zhu, EE.UU.)'},
  ].filter(Boolean);
  $('shock').innerHTML = items.map(x => `<div><b class="${x.r ? 'r' : ''}">${esc(x.b)}</b><span>${esc(x.s)}</span></div>`).join('');
}
function renderKPIs() {
  renderShock();
  const cc = conCosto().sort((a, b) => a.costo_soles - b.costo_soles);
  const min = cc[0], max = cc[cc.length - 1];
  const e = P.enaho_resumen;
  if (!cc.length) { $('kpis').innerHTML = e ? `<div class="kpi"><b>+${nf0.format(e.prima_pct)} %</b><span>${esc(e.etiqueta)}</span><small>${esc(e.detalle)}</small></div><div class="kpi"><b>…</b><span>precios por universidad</span><small>relevamiento en curso</small></div>` : ''; return; }
  const k = [
    {b: money(min?.costo_soles), s: `el MBA más barato encontrado`, m: `${min?.siglas || min?.universidad} · ${min?.programa}`},
    {b: money(max?.costo_soles), s: `el más caro`, m: `${max?.siglas || max?.universidad} · ${max?.programa}`},
    {b: `×${nf0.format(max.costo_soles / min.costo_soles)}`, s: 'diferencia entre el más caro y el más barato', m: `${cc.length} programas con precio de ${P.programas.length} relevados`},
    e ? {b: `${e.prima_pct >= 0 ? '+' : ''}${nf0.format(e.prima_pct)} %`, s: e.etiqueta, m: e.detalle} : {b: '—', s: 'prima salarial del posgrado', m: 'pendiente'}
  ];
  $('kpis').innerHTML = k.map(x => `<div class="kpi"><b>${esc(x.b)}</b><span>${esc(x.s)}</span><small>${esc(x.m)}</small></div>`).join('');
}

/* ---------- Costos ---------- */
function renderFiltros() {
  const mods = ['todas', ...new Set(P.programas.map(p => p.modalidad_grupo).filter(Boolean))];
  $('f-modalidad').innerHTML = mods.map(m => `<button data-m="${esc(m)}" aria-pressed="${m === state.modalidad}">${esc(m === 'todas' ? 'Todas las modalidades' : m)}</button>`).join('');
  $('f-modalidad').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.modalidad = b.dataset.m; renderFiltros(); renderCostos(); renderBE(); };
  combo($('q'), $('q-list'), () => P.programas.map(p => ({label: `${p.siglas || p.universidad} — ${p.programa}`, sub: `${p.universidad} · ${money(p.costo_soles)}`, val: p})), it => { state.q = (it.val.siglas || it.val.universidad); $('q').value = state.q; renderCostos(); renderBE(); }, txt => { state.q = txt; renderCostos(); renderBE(); });
  $('leg-costos').innerHTML = SEG_ORDER.map(s => `<span><i style="background:${SEG_COLOR[s]}"></i>${esc(s)}</span>`).join('');
}
function filtrados() {
  const q = state.q.trim().toLowerCase();
  return P.programas.filter(p => (state.modalidad === 'todas' || p.modalidad_grupo === state.modalidad) &&
    (!q || `${p.universidad} ${p.siglas} ${p.programa}`.toLowerCase().includes(q)));
}
function renderCostos() {
  const rows = filtrados();
  const data = rows.filter(p => p.costo_soles > 0).sort((a, b) => b.costo_soles - a.costo_soles);
  const box = $('box-costos');
  box.hidden = !data.length;
  box.style.height = Math.max(160, data.length * 24 + 50) + 'px';
  charts.costos?.destroy();
  if (window.Chart) charts.costos = new Chart($('ch-costos'), {
    type: 'bar',
    data: {labels: data.map(p => `${p.siglas || p.universidad} · ${p.programa_corto || p.programa}`),
      datasets: [{data: data.map(p => p.costo_soles), backgroundColor: data.map(p => SEG_COLOR[p.segmento] || '#999'), borderRadius: 4, barThickness: 14}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
      plugins: {legend: {display: false}, tooltip: {callbacks: {
        title: it => data[it[0].dataIndex].universidad,
        label: it => { const p = data[it.dataIndex]; return [p.programa, `${money(p.costo_soles)}${p.moneda_original === 'USD' ? ` (US$ ${nf0.format(p.costo_usd)})` : ''}`, `${p.modalidad || ''} · ${p.duracion_meses || '?'} meses`, `Confianza del dato: ${p.confianza}`]; }}}},
      scales: {x: {ticks: {callback: v => `${SIM} ${short(v)}`}, grid: {color: '#eee9e1'}}, y: {grid: {display: false}, ticks: {autoSkip: false, font: {size: 11}, callback(v) { const l = this.getLabelForValue(v); return l.length > 42 ? l.slice(0, 41) + '…' : l; }}}},
      onClick: (e, els) => { if (els[0]) pickPrograma(data[els[0].index]); document.getElementById('calculadora').scrollIntoView(); }}
  });
  const sin = rows.filter(p => !(p.costo_soles > 0));
  $('costos-nota').innerHTML = !P.programas.length ? 'Relevamiento de precios en curso: esta sección se actualiza en las próximas horas.' : `${data.length} programas con precio. ${sin.length ? `${sin.length} sin precio público (en la tabla). ` : ''}Precios en dólares convertidos a ${esc(SIM)} ${esc(P.pais.tc_usd)} por US$ ${ref('tc', P.pais.tc_fuente || 'Tipo de cambio', P.pais.tc_url)}. Toca una barra para simularla en la calculadora.`;
  const conf = c => `<span class="conf ${esc(c)}">${esc(c)}</span>`;
  $('tb-costos').innerHTML = `<thead><tr><th>Universidad</th><th>Programa</th><th>Modalidad</th><th>Meses</th><th>Costo total</th><th>Acreditación / ranking</th><th>Año</th><th>Dato</th><th>Fuente</th></tr></thead><tbody>` +
    [...rows].sort((a, b) => (b.costo_soles || 0) - (a.costo_soles || 0)).map(p => `<tr><td>${esc(p.universidad)}</td><td>${esc(p.programa)}${p.nota ? `<br><small class="empty">${esc(p.nota)}</small>` : ''}</td><td>${esc(p.modalidad || '—')}</td><td class="num">${esc(p.duracion_meses ?? '—')}</td><td class="num">${money(p.costo_soles)}${p.moneda_original === 'USD' && p.costo_usd ? `<br><small>US$ ${nf0.format(p.costo_usd)}</small>` : ''}</td><td>${esc([p.acreditaciones, p.ranking].filter(Boolean).join(' · ') || '—')}</td><td>${esc(p.anio_precio ?? '—')}</td><td>${conf(p.confianza || 'baja')}</td><td>${p.fuente_url ? `<a href="${esc(safeUrl(p.fuente_url))}" target="_blank" rel="noopener">ver</a>` : '—'}</td></tr>`).join('') + '</tbody>';
}
function renderSegmentos() {
  const cc = conCosto();
  $('segmentos').innerHTML = SEG_ORDER.map(s => {
    const v = cc.filter(p => p.segmento === s).map(p => p.costo_soles).sort((a, b) => a - b);
    if (!v.length) return '';
    const med = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
    return `<div class="card" style="border-top:4px solid ${SEG_COLOR[s]}"><h3>${esc(s)}</h3><b class="big">${money(med)}</b><span class="note">mediana · ${v.length} programas · rango ${money(v[0])} – ${money(v[v.length - 1])}</span></div>`;
  }).join('');
}

/* ---------- Break-even por programa ---------- */
const BE_TIERS = [
  {max: 17, color: '#1f7a55', txt: 'Hasta 17 %: alcanzable según la evidencia causal'},
  {max: 61, color: '#f2a600', txt: '17–61 %: solo si te va mejor que el promedio de los posgraduados'},
  {max: Infinity, color: '#dc3c3d', txt: 'Más de 61 %: supera incluso la prima bruta del posgrado'},
];
function renderBE() {
  const refs = P.sueldos_ref || [];
  if (!refs.length || !conCosto().length) { $('be').hidden = true; return; }
  $('be').hidden = false;
  $('be-base').innerHTML = refs.map((r, i) => `<button data-i="${i}" aria-pressed="${i === state.base}">${esc(r.etiqueta)}: ${money(r.mensual)}/mes</button>`).join('');
  $('be-base').onclick = e => { const b = e.target.closest('button'); if (b) { state.base = +b.dataset.i; renderBE(); } };
  BE_TIERS[1].txt = BE_TIERS[1].txt.replace('promediode', 'promedio de');
  $('be-leg').innerHTML = BE_TIERS.map(t => `<span><i style="background:${t.color}"></i>${esc(t.txt)}</span>`).join('');
  const M = refs[state.base].mensual, S = M * 12 / 14;   // ENAHO = ingreso anual/12 → equivalente a 14 sueldos
  const rows = filtrados().filter(p => p.costo_soles > 0).map(p => {
    const D = Math.max(1, Math.round(p.duracion_meses || 18));
    const r = simular({C: p.costo_soles, D, S, ft: p.modalidad_grupo === 'Full-time', p: 0, H: 10, r: 0.08});
    return {p, v: r.pEq * 100};
  }).sort((a, b) => b.v - a.v);
  $('box-be').style.height = Math.max(160, rows.length * 24 + 50) + 'px';
  charts.be?.destroy();
  if (window.Chart) charts.be = new Chart($('ch-be'), {
    type: 'bar',
    data: {labels: rows.map(x => `${x.p.siglas || x.p.universidad} · ${x.p.programa_corto || x.p.programa}`), datasets: [{data: rows.map(x => Math.min(x.v, 400)), backgroundColor: rows.map(x => BE_TIERS.find(t => x.v <= t.max).color), borderRadius: 4, barThickness: 14}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => rows[it[0].dataIndex].p.universidad, label: it => { const x = rows[it.dataIndex]; return [`Aumento necesario: +${nf0.format(x.v)} %`, `≈ ${money(M * x.v / 100)} más al mes, durante 10 años`, `Costo ${money(x.p.costo_soles)} · ${x.p.modalidad_grupo}`]; }}}},
      scales: {x: {ticks: {callback: v => '+' + v + ' %'}, grid: {color: '#eee9e1'}}, y: {grid: {display: false}, ticks: {autoSkip: false, font: {size: 11}, callback(v) { const l = this.getLabelForValue(v); return l.length > 42 ? l.slice(0, 41) + '…' : l; }}}},
      onClick: (e, els) => { if (els[0]) { pickPrograma(rows[els[0].index].p); $('c-sueldo').value = Math.round(S); calc(); document.getElementById('calculadora').scrollIntoView(); } }}
  });
  const n = t => rows.filter(x => x.v > t).length;
  $('be-nota').innerHTML = `Con un sueldo de partida de ${money(M)} al mes, <b>${n(61)} de ${rows.length}</b> programas exigen un aumento mayor que la prima bruta promedio del posgrado (+61 %), y <b>${n(17)}</b> exigen más que el +17 % que la mejor evidencia causal atribuye al MBA. Sueldos de referencia: ENAHO 2024, universitarios completos de 25-64 años. Barras cortadas en +400 %. Toca una barra para llevarla a la calculadora.`;
}

/* ---------- Combobox (sin <select> nativo) ---------- */
function combo(input, list, source, onPick, onType) {
  let items = [], sel = -1;
  const close = () => { list.hidden = true; sel = -1; };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    items = source().filter(it => !q || (it.label + ' ' + it.sub).toLowerCase().includes(q)).slice(0, 40);
    list.innerHTML = items.map((it, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}">${esc(it.label)}<small>${esc(it.sub)}</small></li>`).join('') || '<li class="empty">Sin resultados</li>';
    list.hidden = false;
  };
  input.oninput = () => { sel = -1; draw(); onType && onType(input.value); };
  input.onfocus = draw;
  input.onkeydown = e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, items.length - 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter' && items[sel]) { onPick(items[sel]); close(); e.preventDefault(); }
    else if (e.key === 'Escape') close();
  };
  list.onmousedown = e => { const li = e.target.closest('li[data-i]'); if (li) { onPick(items[+li.dataset.i]); close(); } };
  input.addEventListener('blur', () => setTimeout(close, 120));
}

/* ---------- Calculadora ---------- */
function pickPrograma(p) {
  state.pick = p;
  $('c-prog').value = `${p.siglas || p.universidad} — ${p.programa}`;
  if (p.costo_soles) $('c-costo').value = Math.round(p.costo_soles);
  if (p.duracion_meses) $('c-dur').value = p.duracion_meses;
  document.querySelector(`input[name=c-ft][value="${p.modalidad_grupo === 'Full-time' ? 1 : 0}"]`).checked = true;
  calc();
}
function setupCalc() {
  combo($('c-prog'), $('c-prog-list'), () => conCosto().map(p => ({label: `${p.siglas || p.universidad} — ${p.programa}`, sub: `${money(p.costo_soles)} · ${p.duracion_meses || '?'} meses`, val: p})), it => pickPrograma(it.val));
  const presets = (P.presets_prima || []).map(x => `<button type="button" data-v="${esc(x.valor)}" title="${esc(x.fuente)}">${esc(x.etiqueta)}: ${nf0.format(x.valor)} %</button>`).join('');
  $('presets').innerHTML = presets ? `<span class="note" style="width:100%;margin:0">Primas sugeridas por la evidencia:</span>${presets}` : '';
  $('presets').onclick = e => { const b = e.target.closest('button'); if (b) { $('c-prima').value = b.dataset.v; calc(); } };
  ['c-costo', 'c-dur', 'c-sueldo', 'c-prima', 'c-hor', 'c-tasa'].forEach(id => $(id).oninput = calc);
  document.querySelectorAll('input[name=c-ft]').forEach(r => r.onchange = calc);
  const med = conCosto().map(p => p.costo_soles).sort((a, b) => a - b);
  const mid = conCosto().find(p => p.costo_soles >= med[Math.floor(med.length / 2)]);
  if (mid) pickPrograma(mid); else { $('c-costo').value = 60000; $('c-dur').value = 18; calc(); }
}
function simular({C, D, S, ft, p, H, r}) {
  const m = Math.round(H * 12), rm = Math.pow(1 + r, 1 / 12) - 1, base = S * 14 / 12;
  const flows = [];
  for (let t = 0; t < m; t++) flows.push(t < D ? -C / D - (ft ? base : 0) : base * p);
  const npvAt = rate => flows.reduce((a, f, t) => a + f / Math.pow(1 + rate, t + 1), 0);
  let acc = 0, pay = null; const anual = [0];
  flows.forEach((f, t) => { acc += f / Math.pow(1 + rm, t + 1); if (pay == null && t >= D && acc >= 0) pay = t + 1; if ((t + 1) % 12 === 0) anual.push(acc); });
  // TIR anual por bisección
  let irr = null;
  if (npvAt(0) > 0) { let lo = 0, hi = 1; if (npvAt(hi) < 0) { for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; npvAt(mid) > 0 ? lo = mid : hi = mid; } irr = Math.pow(1 + lo, 12) - 1; } else irr = Infinity; }
  // prima de equilibrio: NPV lineal en p
  const pvCost = flows.reduce((a, f, t) => a + (t < D ? (C / D + (ft ? base : 0)) / Math.pow(1 + rm, t + 1) : 0), 0);
  const pvGain = flows.reduce((a, f, t) => a + (t >= D ? base / Math.pow(1 + rm, t + 1) : 0), 0);
  return {npv: acc, pay, irr, anual, pEq: pvGain > 0 ? pvCost / pvGain : null, costoTotal: C + (ft ? base * D : 0)};
}
function calc() {
  const v = id => +$(id).value || 0;
  const inp = {C: v('c-costo'), D: Math.max(1, v('c-dur')), S: v('c-sueldo'), ft: document.querySelector('input[name=c-ft]:checked').value === '1', p: v('c-prima') / 100, H: v('c-hor'), r: v('c-tasa') / 100};
  $('o-prima').textContent = `${v('c-prima')} %`; $('o-hor').textContent = `${inp.H} años`; $('o-tasa').textContent = `${nf1.format(v('c-tasa'))} %`;
  if (inp.H * 12 <= inp.D) { $('c-res').innerHTML = '<p class="empty">El horizonte debe ser mayor que la duración del programa.</p>'; return; }
  const s = simular(inp);
  const ver = s.npv > 0 ? (s.pay && s.pay / 12 <= 5 ? ['pos', 'Se recupera en un plazo razonable con estos supuestos.'] : ['mid', 'Se recupera, pero lento: depende de que el aumento sea real y sostenido.']) : ['neg', `Con estos supuestos NO se recupera en ${inp.H} años: el MBA destruye valor para ti.`];
  $('c-res').innerHTML = `
    <div class="kpi"><b>${money(s.costoTotal)}</b><span>inversión real</span><small>${inp.ft ? 'matrícula + sueldos que dejas de ganar' : 'solo el programa'}</small></div>
    <div class="kpi"><b class="${s.npv >= 0 ? 'pos' : 'neg'}">${money(s.npv)}</b><span>valor actual neto</span><small>a ${inp.H} años, ${nf1.format(inp.r * 100)} % anual</small></div>
    <div class="kpi"><b>${s.pay ? nf1.format(s.pay / 12) + ' años' : 'nunca'}</b><span>recuperación</span><small>desde que empiezas, descontado</small></div>
    <div class="kpi"><b>${s.pEq != null ? nf1.format(s.pEq * 100) + ' %' : '—'}</b><span>aumento mínimo necesario</span><small>para no perder dinero en ${inp.H} años</small></div>
    <div class="verdict ${ver[0]}">${esc(ver[1])}${s.irr != null && isFinite(s.irr) ? ` TIR ≈ ${nf1.format(s.irr * 100)} % anual.` : ''}</div>`;
  charts.calc?.destroy();
  if (window.Chart) charts.calc = new Chart($('ch-calc'), {
    type: 'line',
    data: {labels: s.anual.map((_, i) => `Año ${i}`), datasets: [{data: s.anual, borderColor: '#b3122e', borderWidth: 2, pointRadius: 3, fill: {target: {value: 0}, above: 'rgba(31,122,85,.12)', below: 'rgba(220,60,61,.10)'}}]},
    options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false},
      plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => `Acumulado descontado: ${money(it.raw)}`}}},
      scales: {y: {ticks: {callback: v => `${SIM} ${short(Math.abs(v)) === '0' ? 0 : (v < 0 ? '−' : '') + short(Math.abs(v))}`}}, x: {grid: {display: false}}}}
  });
}

/* ---------- Retorno local ---------- */
function studyCard(s) {
  const r = s.url ? ref(s.id || s.url, `${s.autores || ''} (${s.anio || ''}). ${s.titulo || ''}`, s.url) : '';
  return `<article class="study ${esc(s.signo)}"><span class="tag ${esc(s.signo)}">${esc(SIGNO_TXT[s.signo] || s.signo || '')}</span><h4>${esc(s.titulo)}${r}</h4><p>${esc(s.hallazgo_clave)}${s.cifra_clave ? ` <b>${esc(s.cifra_clave)}</b>` : ''}</p><div class="meta">${esc(s.autores || '')}${s.anio ? ' · ' + esc(s.anio) : ''}${s.institucion ? ' · ' + esc(s.institucion) : ''}${s.tipo ? ' · ' + esc(s.tipo) : ''}</div></article>`;
}
function renderRetorno() {
  $('retorno-sub').textContent = P.textos?.retorno_sub || '';
  const e = P.enaho_panel;
  $('p-enaho').innerHTML = e ? `<h3>${esc(e.titulo)}${ref('enaho', e.fuente, e.url)}</h3><p class="bigstat">${esc(e.cifra)}</p><p>${esc(e.texto)}</p><div class="chart-box"><canvas id="ch-enaho" role="img" aria-label="Prima del posgrado por grupo"></canvas></div><p class="note">${esc(e.advertencia || '')}</p>` : '<h3>Prima del posgrado (ENAHO)</h3><p class="empty">Cálculo pendiente.</p>';
  charts.enaho?.destroy();
  if (e && e.cortes?.length && window.Chart) charts.enaho = new Chart($('ch-enaho'), {
    type: 'bar', data: {labels: e.cortes.map(c => c.grupo), datasets: [{data: e.cortes.map(c => c.prima_pct), backgroundColor: e.cortes.map(c => c.prima_pct >= 0 ? '#257de0' : '#dc3c3d'), borderRadius: 4, barThickness: 16}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => `Prima: ${nf1.format(it.raw)} %${e.cortes[it.dataIndex].n ? ` (n=${nf0.format(e.cortes[it.dataIndex].n)})` : ''}`}}}, scales: {x: {ticks: {callback: v => v + ' %'}}, y: {grid: {display: false}}}}
  });
  const sal = P.salarios_escuelas || [];
  $('p-escuelas').innerHTML = `<h3>Sueldo antes y después del MBA, por escuela</h3>` + (sal.length ? `<div class="chart-box"><canvas id="ch-sal" role="img" aria-label="Salario antes y después del MBA"></canvas></div><p class="note">${sal.map(s => s.fuente_url ? ref(s.fuente_url, s.fuente, s.fuente_url) : '').filter((x, i, a) => a.indexOf(x) === i).join(' ')} ${esc(P.textos?.salarios_nota || 'Datos autorreportados por las escuelas a rankings: sesgo de selección (responden los egresados con mejores resultados).')}</p>` : '<p class="empty">Sin datos públicos verificables.</p>');
  charts.sal?.destroy();
  if (sal.length && window.Chart) charts.sal = new Chart($('ch-sal'), {
    type: 'bar', data: {labels: sal.map(s => s.escuela), datasets: [
      {label: 'Antes del MBA', data: sal.map(s => s.antes), backgroundColor: '#f47230', borderRadius: 4},
      {label: 'Después del MBA', data: sal.map(s => s.despues), backgroundColor: '#257de0', borderRadius: 4}]},
    options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {position: 'top', align: 'start'}, tooltip: {callbacks: {label: it => `${it.dataset.label}: ${sal[it.dataIndex].moneda || 'US$'} ${nf0.format(it.raw)}${sal[it.dataIndex].anio ? ' (' + sal[it.dataIndex].anio + ')' : ''}`}}}, scales: {y: {ticks: {callback: v => short(v)}}, x: {grid: {display: false}}}}
  });
  $('estudios-local').innerHTML = (P.estudios || []).filter(s => s.signo !== 'negativo').map(studyCard).join('');
}

/* ---------- Riesgos ---------- */
function renderRiesgos() {
  const o = P.oferta;
  $('p-oferta').innerHTML = o ? `<h3>${esc(o.titulo)}${o.url ? ref(o.url, o.fuente, o.url) : ''}</h3><p>${esc(o.texto)}</p>${o.serie?.length ? '<div class="chart-box"><canvas id="ch-ofe" role="img" aria-label="Grados de maestría por universidad"></canvas></div>' : ''}<p class="note">${esc(o.nota || '')}</p>` : '<h3>Oferta masiva de maestrías</h3><p class="empty">Sin datos verificables aún.</p>';
  charts.ofe?.destroy();
  if (o?.serie?.length && window.Chart) charts.ofe = new Chart($('ch-ofe'), {
    type: 'bar', data: {labels: o.serie.map(x => x[0]), datasets: [{data: o.serie.map(x => x[1]), backgroundColor: '#f47230', borderRadius: 4, barThickness: 14}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => `${nf0.format(it.raw)} ${o.unidad || ''}`}}}, scales: {y: {grid: {display: false}}, x: {ticks: {callback: v => short(v)}}}}
  });
  const neg = [...(P.estudios || []).filter(s => s.signo === 'negativo'), ...(P.alertas || [])];
  $('p-negativos').innerHTML = `<h3>Señales de retorno nulo o negativo</h3>` + (neg.length ? `<div class="studies">${neg.map(studyCard).join('')}</div>` : '<p class="empty">—</p>');
}

/* ---------- Mundo ---------- */
function renderMundo() {
  const h = G.hartley, hr = ref('hartley', h.meta.referencia, h.meta.url);
  $('hallazgos').innerHTML = h.hallazgos.map(x => `<div class="hall"><b>${esc(x.cifra)}</b><h3>${esc(x.titulo)}${hr}</h3><p>${esc(x.texto)}</p></div>`).join('');
  const line = (id, s, color, fmt) => {
    charts[id]?.destroy();
    if (!window.Chart) return;
    charts[id] = new Chart($(id), {type: 'line', data: {datasets: [{data: s.puntos.map(p => ({x: p[0], y: p[1], n: p[2]})), borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 4, spanGaps: true}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, parsing: false, plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => String(it[0].raw.x), label: it => fmt(it.raw.y) + (it.raw.n ? ` (${it.raw.n})` : '')}}},
        scales: {x: {type: 'linear', ticks: {callback: v => String(v), stepSize: 5}, grid: {display: false}}, y: {beginAtZero: true, ticks: {callback: fmt}}}}});
  };
  line('ch-gmat', h.series.gmat_examenes, '#257de0', v => short(v));
  line('ch-oferta', h.series.sin_oferta_3m, '#dc3c3d', v => nf1.format(v) + ' %');
  const S = Object.fromEntries((G.internacional?.series || []).map(s => [s.id, s]));
  const g = S.gmac_crs_salario_inicial_eeuu;
  charts.gmac?.destroy();
  if (g && window.Chart) {
    const rows = g.datos.filter(d => !d.version || d.version.startsWith('recalc'));
    charts.gmac = new Chart($('ch-gmac'), {type: 'bar', data: {labels: rows.map(d => d.anio), datasets: [
      {label: 'MBA', data: rows.map(d => d.mba), backgroundColor: '#257de0', borderRadius: 4},
      {label: 'Bachiller', data: rows.map(d => d.bachelor), backgroundColor: '#f47230', borderRadius: 4}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {position: 'top', align: 'start'}, tooltip: {callbacks: {afterBody: it => `MBA / bachiller: ×${nf1.format(rows[it[0].dataIndex].mba / rows[it[0].dataIndex].bachelor)}`}}}, scales: {y: {ticks: {callback: v => short(v)}}, x: {grid: {display: false}}}}});
    $('gmac-nota').innerHTML = `Mediana proyectada, GMAC Corporate Recruiters Survey ${ref(g.datos.at(-1).fuente, 'GMAC, Corporate Recruiters Survey', g.datos.at(-1).url)}. ${esc(g.nota || '')}`;
  }
  const ft = S.ft_execed_open_peru;
  const yrs = ft ? [...new Set(ft.datos.flatMap(d => Object.keys(d).filter(k => /^\d{4}$/.test(k))))].sort() : [];
  $('p-ft').innerHTML = ft ? `<h3>${esc(ft.titulo)}${ref('ft_open', 'Financial Times, Executive Education (Open) Rankings 2026', ft.url)}</h3><div class="scroll"><table><thead><tr><th>Escuela</th>${yrs.map(a => `<th>${a}</th>`).join('')}</tr></thead><tbody>${ft.datos.map(d => `<tr><td>${esc(d.escuela)}</td>${yrs.map(a => `<td class="num">${esc(d[a] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">Menor = mejor. Es educación ejecutiva (cursos abiertos), no MBA. Ninguna escuela peruana ni latinoamericana está en el top 100 del FT Global MBA 2025-2026.</p>` : '';
  const f = (G.internacional?.fuentes || []).filter(x => x.id !== 'hartley2026');
  $('estudios-mundo').innerHTML = f.map(s => studyCard({...s, institucion: s.editor_revista})).join('');
}

/* ---------- Fuentes ---------- */
function renderFuentes() {
  $('metodo').innerHTML = (P.metodologia || []).map(m => `<p>${esc(m)}</p>`).join('');
  $('refs').innerHTML = REFS.map((r, i) => `<li id="ref-${i + 1}">${esc(r.txt)} ${r.url ? `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">${esc(r.url)}</a>` : ''}</li>`).join('');
}

document.addEventListener('DOMContentLoaded', () => init().catch(err => { console.error(err); document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="wrap empty">No se pudieron cargar los datos (${esc(err.message)}).</p>`); }));
