'use strict';
/* MBA Radar — dashboard de costos y retorno del MBA por país.
   Datos: data/paises/index.json (países), data/paises/<code>.json (país), data/global.json (evidencia mundial).
   Estilos de componentes creados aquí (prefijo cx-): charts.css. */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = u => { try { const p = new URL(u); return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : '#'; } catch { return '#'; } };
const $ = id => document.getElementById(id);
const nf0 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 1});
const SEG_COLOR = {'Escuela de negocios con acreditación internacional': '#257de0', 'Universidad privada': '#f47230', 'Universidad pública': '#00b894'};
const SEG_ORDER = Object.keys(SEG_COLOR);
const SEG_KEY = {'Escuela de negocios con acreditación internacional': 'escuela', 'Universidad privada': 'privada', 'Universidad pública': 'publica'};
const SEG_CORTO = {escuela: 'Escuela de negocios', privada: 'Universidad privada', publica: 'Universidad pública'};
const SIGNO_TXT = {positivo: 'Retorno positivo', negativo: 'Retorno negativo / riesgo', mixto: 'Mixto', neutral: 'Contexto'};
const ORD = {caro: 'Más caro', barato: 'Más barato', corto: 'Más corto', aumento: 'Mayor aumento necesario'};
const ACR_RE = /AACSB|AMBA|EQUIS|BGA|ACBSP|IACBE/i;
const TOP_N = 15;
const INK = '#1c1a17', INK2 = '#5b5650', GRID = '#eee9e1';

let P = null, G = null, SIM = '';           // país, global, símbolo moneda
const state = {modalidad: '', seg: '', rng: '', acr: '', sede: '', ord: 'caro', q: '', pick: null, base: 2, H: 10,
  open: {costos: false, be: false}, det: {costos: null, be: null}, fpOpen: false};
const charts = {};
let REFS = [];                              // referencias numeradas [{key,txt,url}]
let EXT = {min: null, max: null};           // ids del programa más barato / más caro
const BEC = new Map();                      // caché de aumento necesario por base|id
const STF = {};                             // filtros de estudios por bloque

const MQ = window.matchMedia('(max-width: 639px)');
const isMob = () => MQ.matches;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const money = (v, s = SIM) => v == null ? '—' : `${s} ${nf0.format(Math.round(v))}`;
const short = v => v >= 1e6 ? `${nf1.format(v / 1e6)} M` : v >= 1e3 ? `${nf0.format(v / 1e3)} mil` : nf0.format(v);
function ref(key, txt, url) {
  let i = REFS.findIndex(r => r.key === key);
  if (i < 0) { REFS.push({key, txt, url}); i = REFS.length - 1; }
  return `<sup class="ref"><a href="#ref-${i + 1}" title="${esc(txt)}">[${i + 1}]</a></sup>`;
}
/* Texto plegado (sin tildes, minúsculas) con mapa de posiciones al original, para buscar y resaltar. */
function fold(s) {
  s = String(s ?? ''); let f = ''; const map = [];
  for (let i = 0; i < s.length; i++) { const c = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); f += c; for (let k = 0; k < c.length; k++) map.push(i); }
  return {f, map};
}
const norm = s => fold(s).f;
const terms = q => norm(q).split(/\s+/).filter(Boolean);
const matchAll = (txt, ts) => { const f = norm(txt); return ts.every(t => f.includes(t)); };
function hl(txt, ts) {
  txt = String(txt ?? '');
  if (!ts.length) return esc(txt);
  const {f, map} = fold(txt), on = new Array(txt.length).fill(false);
  ts.forEach(t => { let i = f.indexOf(t); while (i >= 0 && t) { for (let k = i; k < i + t.length; k++) on[map[k]] = true; i = f.indexOf(t, i + t.length); } });
  let out = '', open = false;
  for (let i = 0; i < txt.length; i++) { if (on[i] !== open) { out += on[i] ? '<mark>' : '</mark>'; open = on[i]; } out += esc(txt[i]); }
  return out + (open ? '</mark>' : '');
}

async function getJSON(u) { const r = await fetch(u, {cache: 'no-cache'}); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }

async function init() {
  const idx = await getJSON('data/paises/index.json');
  G = await getJSON('data/global.json');
  const want = (location.hash.match(/pais=([a-z]{2})/) || [])[1] || idx.default;
  $('paises').innerHTML = idx.paises.map(p => `<button data-c="${esc(p.code)}" ${p.listo ? '' : 'disabled title="Próximamente"'} aria-pressed="${p.code === want}">${esc(p.bandera || '')} ${esc(p.nombre)}</button>`).join('');
  $('paises').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) loadPais(b.dataset.c, false); };
  if (window.Chart) { Chart.defaults.font.family = "'Atkinson Hyperlegible', system-ui, sans-serif"; Chart.defaults.color = INK2; Chart.defaults.borderColor = GRID; setFonts(); }
  MQ.addEventListener?.('change', debounce(onBreakpoint, 150));
  await loadPais(want, true);
}
function setFonts() { if (window.Chart) Chart.defaults.font.size = isMob() ? 11 : 12; }
/* Al girar el teléfono y cruzar 640 px: fuentes, alturas y etiquetas cambian → recrear solo los charts de canvas. */
function onBreakpoint() {
  if (!P) return;
  setFonts(); renderRetorno(); renderRiesgos(); renderMundo();
  charts.calc?.destroy(); charts.calc = null; calc();
}

async function loadPais(code, fromHash) {
  P = await getJSON(`data/paises/${code}.json`);
  SIM = P.pais.simbolo || 'S/';
  REFS = []; BEC.clear();
  await addSedes(code);
  P.programas.forEach(p => { p._sede = sedeGrupo(p.sede); p._acr = ACR_RE.test(p.acreditaciones || ''); });
  const cc = conCosto().sort((a, b) => a.costo_soles - b.costo_soles);
  EXT = {min: cc[0]?.id ?? null, max: cc.at(-1)?.id ?? null};
  document.querySelectorAll('#paises button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === code));
  $('hero-eyebrow').textContent = `${P.pais.nombre} · datos a ${P.pais.fecha_texto || P.pais.fecha}`;
  readHash(fromHash);
  state.open = {costos: false, be: false}; state.det = {costos: null, be: null};
  renderKPIs(); renderFiltros(); renderCostos(); renderSegmentos(); renderBE(); setupCalc();
  renderRetorno(); renderRiesgos(); renderMundo(); renderFuentes();
}
/* La sede no viaja en pe.json: se toma de data/costos/programas.json (mismo orden y mismos nombres). */
async function addSedes(code) {
  if (code !== 'pe' || P.programas.some(p => p.sede)) return;
  try {
    const src = (await getJSON('data/costos/programas.json')).programas || [];
    const k = p => norm(p.universidad) + '|' + norm(p.programa);
    const byKey = new Map(src.map(p => [k(p), p]));
    P.programas.forEach((p, i) => { const s = byKey.get(k(p)) || (src[i] && norm(src[i].programa) === norm(p.programa) ? src[i] : null); if (s?.sede) p.sede = s.sede; });
  } catch (e) { console.warn('sin sedes', e); }
}
function sedeGrupo(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (/^(online|regiones|virtual)/i.test(t)) return 'Online';
  if (/^sedes\b/i.test(t)) return 'Varias sedes';
  return t.split(/\s*[(/+]\s*/)[0].trim();
}

/* ---------- KPIs ---------- */
function conCosto() { return P.programas.filter(p => p.costo_soles > 0); }
function renderShock() {
  const cc = conCosto().sort((a, b) => a.costo_soles - b.costo_soles);
  const max = cc[cc.length - 1], min = cc[0];
  if (max) $('hero-max').textContent = `${SIM} ${nf0.format(Math.round(max.costo_soles / 1000))} mil`;
  const bajo = P.alertas?.find(a => a.id === 'enaho_bajo_mediana');
  const pct = bajo?.pct_misma_edad ?? bajo?.pct ?? null;
  const med = s => { const v = cc.filter(p => p.segmento === s).map(p => p.costo_soles).sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
  const mAcr = med('Escuela de negocios con acreditación internacional'), mPub = med('Universidad pública');
  const ofe = P.oferta;
  const items = [
    pct ? {b: `1 de cada ${Math.round(100 / pct)}`, r: 1, s: `con maestría o doctorado gana menos que el universitario típico de su misma edad (INEI, ENAHO 2024)`} : null,
    max && min ? {b: `×${nf0.format(max.costo_soles / min.costo_soles)}`, s: `entre el MBA más caro (${max.siglas || max.universidad}, doble grado internacional) y el más barato (${min.siglas || min.universidad}, virtual). ¿Te pagarán ${nf0.format(max.costo_soles / min.costo_soles)} veces más?`}
      : ofe ? {b: ofe.titulo.split(' ')[0], s: `maestrías ofrecidas en el Perú (SUNEDU). Oferta masiva, calidad dispareja.`} : null,
    P.enaho_resumen ? {b: `+${nf0.format(P.enaho_resumen.prima_pct)} %`, s: 'gana en promedio quien tiene posgrado… pero buena parte ya ganaba más antes de estudiarlo'} : null,
    mAcr && mPub ? {b: `×${nf0.format(mAcr / mPub)}`, r: 1, s: `cuesta, en mediana, un MBA de escuela acreditada frente a uno de universidad pública. La evidencia: el retorno es menor en programas peor rankeados y part-time.`} : null,
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

/* ---------- Filtros (panel cx-fp) + estado en el hash ---------- */
const PRECIOS = () => [
  {k: '0-20000', t: `Menos de ${SIM} 20 mil`, a: 0, b: 20000},
  {k: '20000-60000', t: `${SIM} 20–60 mil`, a: 20000, b: 60000},
  {k: '60000-100000', t: `${SIM} 60–100 mil`, a: 60000, b: 100000},
  {k: '100000-', t: `Más de ${SIM} 100 mil`, a: 100000, b: Infinity},
];
const opciones = () => {
  const cnt = arr => { const m = new Map(); arr.filter(Boolean).forEach(v => m.set(v, (m.get(v) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]); };
  return {
    modalidad: cnt(P.programas.map(p => p.modalidad_grupo)).map(([v]) => [v, v]),
    seg: SEG_ORDER.filter(s => P.programas.some(p => p.segmento === s)).map(s => [SEG_KEY[s], SEG_CORTO[SEG_KEY[s]]]),
    rng: PRECIOS().map(x => [x.k, x.t]),
    acr: [['si', 'Con acreditación internacional'], ['no', 'Sin acreditación internacional']],
    sede: cnt(P.programas.map(p => p._sede)).map(([v]) => [v, v]),
    ord: Object.entries(ORD),
  };
};
const GRUPOS = [['modalidad', 'Modalidad', 'Todas'], ['seg', 'Tipo de institución', 'Todas'], ['rng', 'Precio total', 'Cualquiera'], ['acr', 'Acreditación', 'Todas'], ['sede', 'Ciudad / sede', 'Todas'], ['ord', 'Ordenar por', null]];
const FKEYS = ['modalidad', 'seg', 'rng', 'acr', 'sede'];
const HKEY = {q: 'q', modalidad: 'mod', seg: 'seg', rng: 'precio', acr: 'acr', sede: 'sede', ord: 'orden'};

function readHash(fromHash) {
  FKEYS.forEach(k => state[k] = ''); state.q = ''; state.ord = 'caro';
  if (fromHash) {
    const hp = new URLSearchParams(location.hash.slice(1)), op = opciones();
    FKEYS.forEach(k => { const v = hp.get(HKEY[k]); if (v && op[k].some(o => o[0] === v)) state[k] = v; });
    const o = hp.get('orden'); if (o && ORD[o]) state.ord = o;
    state.q = (hp.get('q') || '').slice(0, 80);
  }
  $('q').value = state.q;
}
function writeHash() {
  const hp = new URLSearchParams({pais: P.pais.code || (location.hash.match(/pais=([a-z]{2})/) || [])[1] || 'pe'});
  if (state.q.trim()) hp.set('q', state.q.trim());
  FKEYS.forEach(k => state[k] && hp.set(HKEY[k], state[k]));
  if (state.ord !== 'caro') hp.set('orden', state.ord);
  try { history.replaceState(null, '', '#' + hp.toString()); } catch { /* file:// u otros */ }
}
const nFiltros = () => FKEYS.filter(k => state[k]).length;

function renderFiltros() {
  const filt = document.querySelector('#costos .filters');
  let fp = $('cx-fp');
  if (!fp && filt) {
    fp = document.createElement('div'); fp.id = 'cx-fp'; fp.className = 'cx-fp';
    fp.innerHTML = `<div class="cx-fp-row"><div class="cx-fp-q"></div><button type="button" class="cx-fp-tog" aria-expanded="false" aria-controls="cx-fp-body"><span>Filtros</span><b class="cx-fp-n" hidden></b></button></div>
      <div class="cx-fp-body" id="cx-fp-body"></div>
      <div class="cx-fp-foot"><span class="cx-count" aria-live="polite"></span><button type="button" class="cx-clear-all">Limpiar filtros</button></div>`;
    filt.appendChild(fp);
    if ($('buscador')) fp.querySelector('.cx-fp-q').appendChild($('buscador'));
    fp.onclick = e => {
      const b = e.target.closest('button'); if (!b || !fp.contains(b)) return;
      if (b.classList.contains('cx-fp-tog')) { state.fpOpen = !state.fpOpen; paintFiltros(); return; }
      if (b.classList.contains('cx-clear-all')) { FKEYS.forEach(k => state[k] = ''); state.q = ''; $('q').value = ''; $('q').dispatchEvent(new Event('cx-sync')); state.ord = 'caro'; return aplicar(); }
      const g = b.closest('[data-f]'); if (!g || b.dataset.v == null) return;
      const f = g.dataset.f, v = b.dataset.v;
      state[f] = f === 'ord' ? v : (state[f] === v ? '' : v);
      aplicar();
    };
  }
  const fm = $('f-modalidad'); if (fm) fm.hidden = true;     // reemplazado por el grupo "Modalidad" del panel
  if (fp) {
    const op = opciones();
    fp.querySelector('.cx-fp-body').innerHTML = GRUPOS.filter(([k]) => op[k].length > (k === 'ord' ? 0 : 1)).map(([k, t, todos]) =>
      `<div class="cx-fg"><span class="cx-fg-t" id="cx-fg-${k}">${esc(t)}</span><div class="cx-chips" role="group" aria-labelledby="cx-fg-${k}" data-f="${k}">${todos ? `<button type="button" data-v="">${esc(todos)}</button>` : ''}${op[k].map(([v, l]) => `<button type="button" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div></div>`).join('');
    paintFiltros();
  }
  combo($('q'), $('q-list'), {
    source: () => P.programas.map(p => ({label: `${p.siglas || p.universidad} — ${p.programa}`, sub: `${p.universidad} · ${money(p.costo_soles)}${p.sede ? ' · ' + p.sede : ''}`, val: p})),
    onPick: it => { state.q = (it.val.siglas || it.val.universidad); $('q').value = state.q; aplicar(); },
    onType: debounce(txt => { state.q = txt; aplicar(); }, 180),
  });
  $('leg-costos').innerHTML = SEG_ORDER.map(s => `<span><i style="background:${SEG_COLOR[s]}"></i>${esc(s)}</span>`).join('');
}
function paintFiltros() {
  const fp = $('cx-fp'); if (!fp) return;
  fp.querySelectorAll('[data-f]').forEach(g => g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(state[g.dataset.f] === b.dataset.v))));
  const n = nFiltros(), rows = filtrados();
  fp.classList.toggle('cx-open', state.fpOpen);
  const tog = fp.querySelector('.cx-fp-tog'); tog.setAttribute('aria-expanded', String(state.fpOpen));
  const nb = fp.querySelector('.cx-fp-n'); nb.hidden = !n; nb.textContent = n;
  fp.querySelector('.cx-count').innerHTML = `<b>${rows.length}</b> de ${P.programas.length} programas · ${rows.filter(p => p.costo_soles > 0).length} con precio`;
  fp.querySelector('.cx-clear-all').hidden = !(n || state.q.trim() || state.ord !== 'caro');
}
function aplicar() {
  state.open = {costos: false, be: false}; state.det = {costos: null, be: null};
  writeHash(); paintFiltros(); renderCostos(); renderBE();
}
function filtrados() {
  const ts = terms(state.q), pr = PRECIOS().find(x => x.k === state.rng);
  return P.programas.filter(p => (!state.modalidad || p.modalidad_grupo === state.modalidad) &&
    (!state.seg || SEG_KEY[p.segmento] === state.seg) &&
    (!pr || (p.costo_soles > 0 && p.costo_soles >= pr.a && p.costo_soles < pr.b)) &&
    (!state.acr || (state.acr === 'si') === p._acr) &&
    (!state.sede || p._sede === state.sede) &&
    (!ts.length || matchAll(`${p.universidad} ${p.siglas || ''} ${p.programa} ${p.sede || ''}`, ts)));
}
/* Aumento salarial bruto necesario (%) para no perder dinero en el horizonte elegido, con la base ENAHO elegida. */
const BE_TASA = 0.08, BE_IMP = 0.14, BE_HORIZONTES = [10, 20, 30];
function beV(p) {
  const refs = P.sueldos_ref || [];
  if (!refs.length || !(p.costo_soles > 0)) return null;
  const k = `${state.base}|${state.H}|${p.id}`;
  if (!BEC.has(k)) {
    const S = refs[state.base].mensual * 12 / 14;   // ENAHO = ingreso anual/12 → equivalente a 14 sueldos
    const r = simular({C: p.costo_soles, D: Math.max(1, Math.round(p.duracion_meses || 18)), S, ft: p.modalidad_grupo === 'Full-time', p: 0, H: state.H, r: BE_TASA, t: BE_IMP});
    BEC.set(k, r.pEq == null ? null : r.pEq * 100);
  }
  return BEC.get(k);
}
function ordenar(arr) {
  const nz = v => v == null || !(v > 0);
  const by = {
    caro: (a, b) => (nz(a.costo_soles) - nz(b.costo_soles)) || (b.costo_soles || 0) - (a.costo_soles || 0),
    barato: (a, b) => (nz(a.costo_soles) - nz(b.costo_soles)) || (a.costo_soles || 0) - (b.costo_soles || 0),
    corto: (a, b) => (nz(a.duracion_meses) - nz(b.duracion_meses)) || (a.duracion_meses || 0) - (b.duracion_meses || 0) || (a.costo_soles || 0) - (b.costo_soles || 0),
    aumento: (a, b) => (beV(b) ?? -1) - (beV(a) ?? -1),
  }[state.ord] || (() => 0);
  return [...arr].sort(by);
}

/* ---------- Lista de barras HTML (legible en móvil: etiqueta encima, valor al final, Top 15 + ver todos, detalle inline) ---------- */
function barList(key, box, canvas, rows, o) {
  charts[key]?.destroy(); charts[key] = null;
  if (canvas) canvas.hidden = true;
  box.style.height = '';
  let host = box.querySelector('.cx-bars-host');
  if (!host) {
    host = document.createElement('div'); host.className = 'cx-bars-host'; box.appendChild(host);
    host.addEventListener('click', e => {
      const c = host._cx; if (!c) return;
      const act = e.target.closest('[data-act]');
      if (act) {
        if (act.dataset.act === 'more') { state.open[key] = !state.open[key]; c.redraw(); if (!state.open[key]) box.scrollIntoView({block: 'start'}); }
        else if (act.dataset.act === 'close') { const id = state.det[key]; state.det[key] = null; c.redraw(); host.querySelector(`.cx-bar[data-k="${CSS.escape(String(id))}"]`)?.focus(); }
        else if (act.dataset.act === 'sim') { const r = c.rows.find(x => String(x.p.id) === String(state.det[key])); if (r) c.onSim(r); }
        return;
      }
      const b = e.target.closest('.cx-bar'); if (!b) return;
      state.det[key] = String(state.det[key]) === b.dataset.k ? null : b.dataset.k;
      c.redraw();
      const d = host.querySelector('.cx-det'); if (d) { d.scrollIntoView({block: 'nearest'}); }
    });
  }
  host._cx = {rows, onSim: o.onSim, redraw: o.redraw};
  if (!rows.length) { host.innerHTML = `<p class="empty cx-none">Ningún programa coincide con los filtros.</p>`; return; }
  const cap = o.cap || Infinity, vmax = Math.max(...rows.map(r => Math.min(r.v, cap))) || 1;
  const many = rows.length > TOP_N + 3, open = state.open[key] || !many;
  let shown = open ? rows : rows.slice(0, TOP_N);
  const pinned = open ? [] : rows.slice(TOP_N).filter(r => r.hl || String(r.p.id) === String(state.det[key]));
  const li = r => {
    const p = r.p, id = String(p.id), on = String(state.det[key]) === id;
    const badge = r.hl === 'min' ? '<em class="cx-badge cx-b-min">Más barato</em>' : r.hl === 'max' ? '<em class="cx-badge cx-b-max">Más caro</em>' : '';
    const w = Math.max(0.006, Math.min(r.v, cap) / vmax);
    return `<li class="cx-row${r.hl ? ' cx-hl-' + r.hl : ''}${on ? ' cx-on' : ''}"><button type="button" class="cx-bar" data-k="${esc(id)}" aria-expanded="${on}" aria-label="${esc(`${p.siglas || p.universidad}, ${p.programa}: ${r.txt}`)}">
      <span class="cx-lab"><b>${esc(p.siglas || p.universidad)}</b> <span>${esc(p.programa_corto || p.programa)}</span>${badge}</span>
      <span class="cx-trk"><span class="cx-fill" style="--w:${w.toFixed(4)};background:${r.color}"></span><span class="cx-val">${esc(r.txt)}${r.v > cap ? ' ›' : ''}</span></span></button></li>` +
      (on ? `<li class="cx-det" role="region" aria-label="Detalle del programa">${o.detail(r)}</li>` : '');
  };
  host.innerHTML = `<ol class="cx-bars" aria-label="${esc(o.aria)}">${shown.map(li).join('')}${pinned.length ? `<li class="cx-gap" aria-hidden="true">· · · ${rows.length - TOP_N - pinned.length} programas más · · ·</li>${pinned.map(li).join('')}` : ''}</ol>` +
    (many ? `<button type="button" class="cx-more" data-act="more" aria-expanded="${state.open[key]}">${state.open[key] ? `Mostrar solo los ${TOP_N} primeros` : `Ver los ${rows.length} programas`}</button>` : '');
}
function detalleHTML(p, extra = '') {
  const conf = p.confianza || 'baja';
  const dd = (t, v) => v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : '';
  return `<div class="cx-det-in">
    <div class="cx-det-h"><b>${esc(p.universidad)}</b><button type="button" class="cx-x" data-act="close" aria-label="Cerrar detalle">×</button></div>
    <p class="cx-det-p">${esc(p.programa)}</p>
    <dl class="cx-dl">${extra}
      ${dd('Costo total', `${esc(money(p.costo_soles))}${p.moneda_original === 'USD' && p.costo_usd ? ` <small>(US$ ${esc(nf0.format(p.costo_usd))})</small>` : ''}`)}
      ${dd('Modalidad', esc(p.modalidad || p.modalidad_grupo || '—'))}
      ${dd('Duración', p.duracion_meses ? `${esc(nf0.format(p.duracion_meses))} meses` : '—')}
      ${dd('Sede', p.sede ? esc(p.sede) : '')}
      ${dd('Confianza del dato', `<span class="conf ${esc(conf)}">${esc(conf)}</span>`)}
      ${dd('Acreditación', esc([p.acreditaciones, p.ranking].filter(Boolean).join(' · ')))}
    </dl>
    <div class="cx-det-a"><button type="button" class="cx-sim" data-act="sim">Simular en la calculadora</button>${p.fuente_url ? `<a href="${esc(safeUrl(p.fuente_url))}" target="_blank" rel="noopener">Ver fuente del precio</a>` : ''}</div></div>`;
}
function irACalc() { document.getElementById('calculadora').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }
const hlOf = p => p.id === EXT.min ? 'min' : p.id === EXT.max ? 'max' : '';

/* ---------- Costos ---------- */
function renderCostos() {
  const rows = ordenar(filtrados());
  const data = rows.filter(p => p.costo_soles > 0);
  const box = $('box-costos');
  box.hidden = !P.programas.length;
  barList('costos', box, $('ch-costos'), data.map(p => ({p, v: p.costo_soles, txt: money(p.costo_soles), color: SEG_COLOR[p.segmento] || '#8a847c', hl: hlOf(p)})), {
    aria: 'Costo total de programas MBA', redraw: renderCostos, detail: r => detalleHTML(r.p),
    onSim: r => { pickPrograma(r.p); irACalc(); },
  });
  const sin = rows.filter(p => !(p.costo_soles > 0));
  $('costos-nota').innerHTML = !P.programas.length ? 'Relevamiento de precios en curso: esta sección se actualiza en las próximas horas.' : `${data.length} programas con precio. ${sin.length ? `${sin.length} sin precio público (en la tabla). ` : ''}Precios en dólares convertidos a ${esc(SIM)} ${esc(P.pais.tc_usd)} por US$ ${ref('tc', P.pais.tc_fuente || 'Tipo de cambio', P.pais.tc_url)}. Toca una barra para ver el detalle y simularla.`;
  const conf = c => `<span class="conf ${esc(c)}">${esc(c)}</span>`;
  $('tb-costos').innerHTML = `<thead><tr><th>Universidad</th><th>Programa</th><th>Modalidad</th><th>Sede</th><th>Meses</th><th>Costo total</th><th>Acreditación / ranking</th><th>Año</th><th>Dato</th><th>Fuente</th></tr></thead><tbody>` +
    rows.map(p => `<tr><td>${esc(p.universidad)}</td><td>${esc(p.programa)}${p.nota ? `<br><small class="empty">${esc(p.nota)}</small>` : ''}</td><td>${esc(p.modalidad || '—')}</td><td>${esc(p.sede || '—')}</td><td class="num">${esc(p.duracion_meses ?? '—')}</td><td class="num">${money(p.costo_soles)}${p.moneda_original === 'USD' && p.costo_usd ? `<br><small>US$ ${nf0.format(p.costo_usd)}</small>` : ''}</td><td>${esc([p.acreditaciones, p.ranking].filter(Boolean).join(' · ') || '—')}</td><td>${esc(p.anio_precio ?? '—')}</td><td>${conf(p.confianza || 'baja')}</td><td>${p.fuente_url ? `<a href="${esc(safeUrl(p.fuente_url))}" target="_blank" rel="noopener">ver</a>` : '—'}</td></tr>`).join('') + '</tbody>';
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
  {max: 17, color: '#1f7a55', txt: 'Hasta 17 %: dentro del efecto estimado del MBA en EE.UU.'},
  {max: 61, color: '#f2a600', txt: '17–61 %: más que ese efecto; dentro de la diferencia observada en Perú (que incluye selección)'},
  {max: Infinity, color: '#dc3c3d', txt: 'Más de 61 %: más que la diferencia promedio entre posgraduados y universitarios (ENAHO)'},
];
function renderBE() {
  const refs = P.sueldos_ref || [];
  if (!refs.length || !conCosto().length) { $('be').hidden = true; return; }
  $('be').hidden = false;
  $('be-base').innerHTML = refs.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="${i === state.base}">${esc(r.etiqueta)}: ${money(r.mensual)}/mes</button>`).join('');
  $('be-base').onclick = e => { const b = e.target.closest('button'); if (b) { state.base = +b.dataset.i; if (state.ord === 'aumento') aplicar(); else renderBE(); } };
  let hz = $('be-hor');
  if (!hz) { hz = document.createElement('div'); hz.id = 'be-hor'; hz.className = 'chips'; hz.setAttribute('role', 'group'); hz.setAttribute('aria-label', 'Horizonte'); $('be-base').after(hz); }
  hz.innerHTML = '<span class="note" style="align-self:center;margin:0">El aumento dura:</span>' + BE_HORIZONTES.map(h => `<button type="button" data-h="${h}" aria-pressed="${h === state.H}">${h} años</button>`).join('');
  hz.onclick = e => { const b = e.target.closest('button'); if (b) { state.H = +b.dataset.h; if (state.ord === 'aumento') aplicar(); else renderBE(); } };
  $('be-leg').innerHTML = BE_TIERS.map(t => `<span><i style="background:${t.color}"></i>${esc(t.txt)}</span>`).join('');
  const M = refs[state.base].mensual, S = M * 12 / 14;
  const base = ordenar(filtrados().filter(p => p.costo_soles > 0));
  const rows = (state.ord === 'caro' ? [...base].sort((a, b) => (beV(b) ?? -1) - (beV(a) ?? -1)) : base)
    .map(p => ({p, v: beV(p) ?? 0})).map(x => ({...x, txt: `+${nf0.format(x.v)} %`, color: BE_TIERS.find(t => x.v <= t.max).color, hl: hlOf(x.p)}));
  barList('be', $('box-be'), $('ch-be'), rows, {
    aria: 'Aumento salarial mínimo para recuperar cada MBA', cap: 400, redraw: renderBE,
    detail: r => detalleHTML(r.p, `<div class="cx-dl-hi"><dt>Aumento necesario</dt><dd><b>+${esc(nf0.format(r.v))} %</b> ≈ ${esc(money(M * r.v / 100))} más al mes (bruto), durante ${state.H} años</dd></div>`),
    onSim: r => { pickPrograma(r.p, false); setNum('c-sueldo', Math.round(S)); calc(); irACalc(); },
  });
  const n = t => rows.filter(x => x.v > t).length;
  $('be-nota').innerHTML = rows.length ? `Con un sueldo de partida de ${money(M)} al mes, <b>${n(61)} de ${rows.length}</b> programas exigen un aumento mayor que la diferencia promedio de sueldos entre posgraduados y universitarios en el Perú (+61 %, ENAHO), y <b>${n(17)}</b> exigen más que el +17 % estimado para el MBA en EE.UU. Supuestos: el aumento dura ${state.H} años, descuento ${Math.round(BE_TASA * 100)} % anual, impuesto marginal ${Math.round(BE_IMP * 100)} %. Sueldos de referencia: ENAHO 2024 (universitarios completos de 25-64 años) y AméricaEconomía (sueldo previo de postulantes a Pacífico). Barras cortadas en +400 % (›). ${state.ord === 'caro' ? 'Ordenado por aumento necesario. ' : ''}Toca una barra para ver el detalle.` : '';
}

/* ---------- Combobox (sin <select> nativo; táctil: click + cierre al tocar fuera; resaltado; botón limpiar) ---------- */
function combo(input, list, cfg) {
  input._cx = cfg;
  if (input._cxInit) return;
  input._cxInit = true;
  const wrap = input.closest('.combo') || input.parentNode;
  wrap.classList.add('cx-combo');
  const clr = document.createElement('button');
  clr.type = 'button'; clr.className = 'cx-clear'; clr.setAttribute('aria-label', 'Limpiar búsqueda'); clr.textContent = '×';
  wrap.appendChild(clr);
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false');
  if (list.id) input.setAttribute('aria-controls', list.id);
  let items = [], sel = -1;
  const sync = () => { clr.hidden = !input.value; };
  const close = () => { list.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const draw = () => {
    const ts = terms(input.value);
    items = input._cx.source().filter(it => !ts.length || matchAll(it.label + ' ' + it.sub, ts)).slice(0, 40);
    list.innerHTML = items.map((it, i) => `<li role="option" id="${esc(list.id)}-o${i}" data-i="${i}" aria-selected="${i === sel}">${hl(it.label, ts)}<small>${hl(it.sub, ts)}</small></li>`).join('') || '<li class="empty">Sin resultados</li>';
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
    if (sel >= 0) { input.setAttribute('aria-activedescendant', `${list.id}-o${sel}`); list.children[sel]?.scrollIntoView({block: 'nearest'}); }
  };
  input.addEventListener('input', () => { sel = -1; sync(); draw(); input._cx.onType?.(input.value); });
  input.addEventListener('cx-sync', () => { sync(); close(); });
  input.addEventListener('focus', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, items.length - 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { if (items[sel]) input._cx.onPick(items[sel]); close(); sync(); e.preventDefault(); if (isMob()) input.blur(); }
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('mousedown', e => e.preventDefault());           // no robar el foco en escritorio
  list.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) { input._cx.onPick(items[+li.dataset.i]); close(); sync(); if (isMob()) input.blur(); } });
  clr.addEventListener('click', () => { input.value = ''; sync(); close(); input._cx.onType?.(''); input._cx.onClear?.(); input.focus(); });
  document.addEventListener('pointerdown', e => { if (!list.hidden && !wrap.contains(e.target)) close(); }, {passive: true});
  input.addEventListener('focusout', e => { if (e.relatedTarget && !wrap.contains(e.relatedTarget)) close(); });
  sync();
}

/* ---------- Calculadora ---------- */
const MONEY_IN = ['c-costo', 'c-sueldo'];
const numVal = id => { const el = $(id); return MONEY_IN.includes(id) ? +String(el.value).replace(/\D/g, '') || 0 : +el.value || 0; };
function setNum(id, v) { const el = $(id); el.value = MONEY_IN.includes(id) ? (v ? nf0.format(Math.round(v)) : '') : v; }
function fmtMoneyInput(el) {
  const raw = el.value, pos = el.selectionStart ?? raw.length;
  const before = raw.slice(0, pos).replace(/\D/g, '').length;
  const d = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
  el.value = d ? nf0.format(+d) : '';
  let i = 0, c = 0; while (i < el.value.length && c < before) { if (/\d/.test(el.value[i])) c++; i++; }
  try { el.setSelectionRange(i, i); } catch { /* sin foco */ }
}
/* Envuelve un input con − / + (y prefijo S/ para montos). Se hace una sola vez. */
function stepper(id, step, isMoney) {
  const el = $(id); if (!el || el.dataset.cx) return;
  el.dataset.cx = '1';
  const min = +el.min || 0, max = el.max ? +el.max : Infinity;
  if (isMoney) { el.type = 'text'; el.inputMode = 'numeric'; el.autocomplete = 'off'; el.removeAttribute('min'); el.removeAttribute('step'); }
  const lab = el.closest('label'); if (lab) lab.htmlFor = id;      // los botones no deben robar la etiqueta
  const w = document.createElement('div'); w.className = 'cx-step' + (isMoney ? ' cx-money' : '');
  el.parentNode.insertBefore(w, el);
  const mk = (d, t, a) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cx-sb'; b.textContent = t; b.setAttribute('aria-label', a); b.onclick = () => { setNum(id, Math.min(max, Math.max(min, numVal(id) + d * step))); calcSoon.now(); }; return b; };
  const f = document.createElement('span'); f.className = 'cx-field';
  if (isMoney) { const pre = document.createElement('span'); pre.className = 'cx-pre'; pre.textContent = SIM || 'S/'; f.appendChild(pre); }
  f.appendChild(el);
  w.append(mk(-1, '−', `Restar ${nf0.format(step)}`), f, mk(1, '+', `Sumar ${nf0.format(step)}`));
}
const calcSoon = (() => { const d = debounce(() => calc(), 120); d.now = () => calc(); return d; })();

function pickPrograma(p, run = true) {
  state.pick = p;
  $('c-prog').value = `${p.siglas || p.universidad} — ${p.programa}`;
  $('c-prog').dispatchEvent(new Event('cx-sync'));
  if (p.costo_soles) setNum('c-costo', p.costo_soles);
  setNum('c-dur', p.duracion_meses || 18);   // sin duración publicada: se asumen 18 meses (igual que el gráfico de aumento)
  document.querySelector(`input[name=c-ft][value="${p.modalidad_grupo === 'Full-time' ? 1 : 0}"]`).checked = true;
  if (run) calc();
}
function setupCalc() {
  combo($('c-prog'), $('c-prog-list'), {source: () => conCosto().map(p => ({label: `${p.siglas || p.universidad} — ${p.programa}`, sub: `${money(p.costo_soles)} · ${p.duracion_meses || '?'} meses`, val: p})), onPick: it => pickPrograma(it.val)});
  stepper('c-costo', 1000, true); stepper('c-sueldo', 100, true); stepper('c-dur', 1, false);
  document.querySelectorAll('.cx-pre').forEach(x => x.textContent = SIM);
  if (!$('c-sueldo').value) setNum('c-sueldo', 6000); else setNum('c-sueldo', numVal('c-sueldo'));
  const presets = (P.presets_prima || []).map(x => `<button type="button" data-v="${esc(x.valor)}" title="${esc(x.fuente)}">${esc(x.etiqueta)}: ${nf0.format(x.valor)} %</button>`).join('');
  $('presets').innerHTML = presets ? `<span class="note" style="width:100%;margin:0">Referencias (las dos últimas son techos, no efectos del MBA):</span>${presets}` : '';
  $('presets').onclick = e => { const b = e.target.closest('button'); if (b) { $('c-prima').value = b.dataset.v; calc(); } };
  MONEY_IN.forEach(id => $(id).oninput = () => { fmtMoneyInput($(id)); calcSoon(); });
  $('c-dur').oninput = calcSoon;
  ['c-prima', 'c-hor', 'c-tasa', 'c-imp'].forEach(id => $(id).oninput = () => calc());      // sliders: en vivo (cálculo barato, chart se actualiza en sitio)
  document.querySelectorAll('input[name=c-ft]').forEach(r => r.onchange = () => calc());
  const med = conCosto().map(p => p.costo_soles).sort((a, b) => a - b);
  const mid = conCosto().find(p => p.costo_soles >= med[Math.floor(med.length / 2)]);
  if (mid) pickPrograma(mid); else { setNum('c-costo', 60000); setNum('c-dur', 18); calc(); }
  setupDock();
}
/* Flujo mensual descontado. t = tasa marginal de impuesto: grava el aumento, no la matrícula (que ya se paga con dinero neto). */
function simular({C, D, S, ft, p, H, r, t = 0}) {
  const tax = t;
  const m = Math.round(H * 12), rm = Math.pow(1 + r, 1 / 12) - 1, base = S * 14 / 12;
  const flows = [];
  for (let t = 0; t < m; t++) flows.push(t < D ? -C / D - (ft ? base * (1 - tax) : 0) : base * p * (1 - tax));
  const npvAt = rate => flows.reduce((a, f, t) => a + f / Math.pow(1 + rate, t + 1), 0);
  let acc = 0, pay = null; const anual = [0];
  flows.forEach((f, t) => { acc += f / Math.pow(1 + rm, t + 1); if (pay == null && t >= D && acc >= 0) pay = t + 1; if ((t + 1) % 12 === 0) anual.push(acc); });
  // TIR anual por bisección
  let irr = null;
  if (npvAt(0) > 0) { let lo = 0, hi = 1; if (npvAt(hi) < 0) { for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; npvAt(mid) > 0 ? lo = mid : hi = mid; } irr = Math.pow(1 + lo, 12) - 1; } else irr = Infinity; }
  // prima de equilibrio: NPV lineal en p
  const pvCost = flows.reduce((a, f, t) => a + (t < D ? (C / D + (ft ? base * (1 - tax) : 0)) / Math.pow(1 + rm, t + 1) : 0), 0);
  const pvGain = flows.reduce((a, f, t) => a + (t >= D ? base * (1 - tax) / Math.pow(1 + rm, t + 1) : 0), 0);
  return {npv: acc, pay, irr, anual, pEq: pvGain > 0 ? pvCost / pvGain : null, costoTotal: C + (ft ? base * D : 0)};
}
/* Anotaciones del gráfico de la calculadora: línea de cero marcada y año de recuperación. */
const payPlugin = {
  id: 'cxPay',
  afterDatasetsDraw(ch) {
    const a = ch.$cx; if (!a) return;
    const {ctx, chartArea: ca, scales: {x, y}} = ch, fs = isMob() ? 11 : 12;
    ctx.save();
    const y0 = y.getPixelForValue(0);
    if (y0 >= ca.top && y0 <= ca.bottom) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ca.left, y0); ctx.lineTo(ca.right, y0); ctx.stroke();
      ctx.font = `700 ${fs - 1}px 'Atkinson Hyperlegible', system-ui, sans-serif`; ctx.fillStyle = INK2; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Punto de equilibrio', ca.left + 4, y0 - 3);
    }
    ctx.font = `700 ${fs}px 'Atkinson Hyperlegible', system-ui, sans-serif`; ctx.textBaseline = 'top';
    const tag = (txt, px, color) => {
      const w = ctx.measureText(txt).width + 12, h = fs + 10;
      let tx = px + 8; if (tx + w > ca.right) tx = Math.max(ca.left, px - 8 - w);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(tx, ca.top + 2, w, h);
      ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(txt, tx + 6, ca.top + 7);
    };
    if (a.pay) {
      const px = x.getPixelForValue(a.pay / 12);
      ctx.strokeStyle = '#1f7a55'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, ca.top); ctx.lineTo(px, ca.bottom); ctx.stroke(); ctx.setLineDash([]);
      if (y0 >= ca.top && y0 <= ca.bottom) { ctx.beginPath(); ctx.arc(px, y0, 5, 0, Math.PI * 2); ctx.fillStyle = '#1f7a55'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      tag(`Recuperas en el año ${Math.ceil(a.pay / 12)}`, px, '#14583b');
    } else tag(`No se recupera en ${a.H} años`, ca.right, '#8f1d1e');
    ctx.restore();
  }
};
function calc() {
  const inp = {C: numVal('c-costo'), D: Math.max(1, numVal('c-dur')), S: numVal('c-sueldo'), ft: document.querySelector('input[name=c-ft]:checked').value === '1', p: numVal('c-prima') / 100, H: numVal('c-hor'), r: numVal('c-tasa') / 100, t: numVal('c-imp') / 100};
  $('o-prima').textContent = `${numVal('c-prima')} %`; $('o-hor').textContent = `${inp.H} años`; $('o-tasa').textContent = `${nf1.format(numVal('c-tasa'))} %`; $('o-imp').textContent = `${numVal('c-imp')} %`;
  if (inp.H * 12 <= inp.D) { $('c-res').innerHTML = '<p class="empty">El horizonte debe ser mayor que la duración del programa.</p>'; setDock(null); return; }
  const s = simular(inp);
  const anio = s.pay ? Math.ceil(s.pay / 12) : null;
  const ver = s.npv < 0 || !s.pay
    ? ['neg', `Con estos números pierdes ${money(Math.abs(s.npv))} en ${inp.H} años (en soles de hoy).${s.pEq != null ? ` Para no perder, el MBA tendría que subirte el sueldo al menos ${nf1.format(s.pEq * 100)} %, y de forma permanente.` : ''}`]
    : s.pay / 12 <= 5
      ? ['pos', `Recuperas tu inversión en el año ${anio}. A ${inp.H} años terminas ${money(s.npv)} arriba, en soles de hoy.`]
      : ['mid', `Recuperas tu inversión recién en el año ${anio}: es lento y depende de que el aumento sea real y se mantenga. A ${inp.H} años terminas ${money(s.npv)} arriba.`];
  $('c-res').innerHTML = `
    <div class="kpi"><b>${money(s.costoTotal)}</b><span>inversión real</span><small>${inp.ft ? 'matrícula + sueldos que dejas de ganar' : 'solo el programa'}</small></div>
    <div class="kpi"><b class="${s.npv >= 0 ? 'pos' : 'neg'}">${money(s.npv)}</b><span>valor actual neto</span><small>a ${inp.H} años, ${nf1.format(inp.r * 100)} % anual</small></div>
    <div class="kpi"><b>${s.pay ? 'año ' + anio : 'nunca'}</b><span>recuperación</span><small>${s.pay ? `≈ ${nf1.format(s.pay / 12)} años desde que empiezas` : `en ${inp.H} años`}</small></div>
    <div class="kpi"><b>${s.pEq != null ? nf1.format(s.pEq * 100) + ' %' : '—'}</b><span>aumento bruto mínimo necesario</span><small>para no perder dinero en ${inp.H} años, tras impuestos</small></div>
    <div class="verdict ${ver[0]}">${esc(ver[1])}${s.irr != null && isFinite(s.irr) ? ` TIR ≈ ${nf1.format(s.irr * 100)} % anual.` : ''}</div>`;
  setDock(ver[0], s.npv < 0 || !s.pay ? `Pierdes ${money(Math.abs(s.npv))} en ${inp.H} años` : `Recuperas en el año ${anio} · +${money(s.npv)}`);
  if (!window.Chart) return;
  const pts = s.anual.map((y, i) => ({x: i, y}));
  const meta = {pay: s.pay, H: inp.H};
  const c = charts.calc;
  if (c && c.canvas === $('ch-calc')) {
    c.data.datasets[0].data = pts; c.$cx = meta;
    c.options.scales.x.max = inp.H; c.options.scales.x.ticks.stepSize = inp.H > 12 ? 2 : 1;
    c.update('none'); return;
  }
  charts.calc = new Chart($('ch-calc'), {
    type: 'line', plugins: [payPlugin],
    data: {datasets: [{data: pts, borderColor: '#b3122e', borderWidth: 2, pointRadius: isMob() ? 2 : 3, pointHoverRadius: 6, pointHitRadius: 14, fill: {target: {value: 0}, above: 'rgba(31,122,85,.12)', below: 'rgba(220,60,61,.10)'}}]},
    options: {responsive: true, maintainAspectRatio: false, animation: false, parsing: false, interaction: {mode: 'index', intersect: false},
      layout: {padding: {top: 4, right: 6}},
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => it[0].raw.x === 0 ? 'Hoy' : `Año ${it[0].raw.x}`, label: it => `Acumulado (soles de hoy): ${money(it.raw.y)}`}}},
      scales: {
        y: {grace: '8%', ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: v => v === 0 ? `${SIM} 0` : `${v < 0 ? '−' : ''}${SIM} ${short(Math.abs(v))}`}, grid: {color: GRID}},
        x: {type: 'linear', min: 0, max: inp.H, grid: {display: false}, title: {display: true, text: 'Años desde que empiezas'}, ticks: {stepSize: inp.H > 12 ? 2 : 1, callback: v => v === 0 ? 'Hoy' : String(v)}}}}
  });
  charts.calc.$cx = meta; charts.calc.update('none');
}
/* Mini-resultado fijo en móvil (#calc-dock, si existe): visible mientras se editan los datos y el resultado no está en pantalla. */
let dockObs = null;
function setDock(kind, txt) {
  const d = $('calc-dock'); if (!d) return;
  d.dataset.kind = kind || ''; d.textContent = txt || '';
}
function setupDock() {
  const d = $('calc-dock'); if (!d || dockObs || !('IntersectionObserver' in window)) return;
  const vis = {form: false, res: false};
  const upd = () => { d.hidden = !(isMob() && vis.form && !vis.res && d.textContent); };
  dockObs = new IntersectionObserver(es => { es.forEach(e => { vis[e.target.id === 'c-res' ? 'res' : 'form'] = e.isIntersecting; }); upd(); });
  dockObs.observe($('calc')); dockObs.observe($('c-res'));
  d.addEventListener('click', e => { e.preventDefault(); $('c-res').scrollIntoView({block: 'center'}); });
}

/* ---------- Evidencia: utilidades comunes ---------- */
const boxH = (id, h) => { const c = $(id); if (c?.parentNode) c.parentNode.style.height = Math.round(h) + 'px'; };
const legendCfg = () => ({position: isMob() ? 'bottom' : 'top', align: 'start', labels: {boxWidth: 10, boxHeight: 10, padding: isMob() ? 10 : 14, usePointStyle: false}});
const cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
function uniCorta(s) {
  s = String(s).replace(/\s+S\.?A\.?C\.?$|\s+S\.?R\.?L\.?$|\s+S\.?A\.?$/i, '');
  if (!isMob()) return cut(s, 44);
  return cut(s.replace(/^Pontificia Universidad Católica del Perú$/, 'PUCP').replace(/^Universidad Nacional /, 'UN ').replace(/^Universidad /, 'U. '), 26);
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
  charts.enaho?.destroy(); charts.enaho = null;
  if (e && e.cortes?.length && window.Chart) {
    boxH('ch-enaho', e.cortes.length * (isMob() ? 30 : 26) + 46);
    charts.enaho = new Chart($('ch-enaho'), {
      type: 'bar', data: {labels: e.cortes.map(c => c.grupo), datasets: [{data: e.cortes.map(c => c.prima_pct), backgroundColor: e.cortes.map(c => c.prima_pct >= 0 ? '#257de0' : '#dc3c3d'), borderRadius: 4, barThickness: isMob() ? 14 : 16}]},
      options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => `Prima: ${nf1.format(it.raw)} %${e.cortes[it.dataIndex].n ? ` (n=${nf0.format(e.cortes[it.dataIndex].n)})` : ''}`}}},
        scales: {x: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 8, callback: v => v + ' %'}, grid: {color: GRID}}, y: {grid: {display: false}, ticks: {autoSkip: false}}}}
    });
  }
  const sal = P.salarios_escuelas || [];
  $('p-escuelas').innerHTML = `<h3>Sueldo antes y después del MBA, por escuela</h3>` + (sal.length ? `<div class="chart-box"><canvas id="ch-sal" role="img" aria-label="Salario antes y después del MBA"></canvas></div><p class="note">${sal.map(s => s.fuente_url ? ref(s.fuente_url, s.fuente, s.fuente_url) : '').filter((x, i, a) => a.indexOf(x) === i).join(' ')} ${esc(P.textos?.salarios_nota || 'Datos autorreportados por las escuelas a rankings: sesgo de selección (responden los egresados con mejores resultados).')}</p>` : '<p class="empty">Sin datos públicos verificables.</p>');
  charts.sal?.destroy(); charts.sal = null;
  if (sal.length && window.Chart) {
    boxH('ch-sal', isMob() ? 280 : 260);
    const lab = s => { const m = String(s.escuela).match(/^(.*?)\s*\((\d{4})\)$/); return m ? [m[1], m[2]] : String(s.escuela); };
    charts.sal = new Chart($('ch-sal'), {
      type: 'bar', data: {labels: sal.map(lab), datasets: [
        {label: 'Antes del MBA', data: sal.map(s => s.antes), backgroundColor: '#f47230', borderRadius: 4},
        {label: 'Después del MBA', data: sal.map(s => s.despues), backgroundColor: '#257de0', borderRadius: 4}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false}, plugins: {legend: legendCfg(), tooltip: {callbacks: {title: it => sal[it[0].dataIndex].escuela, label: it => `${it.dataset.label}: ${sal[it.dataIndex].moneda || 'US$'} ${nf0.format(it.raw)}`, afterBody: it => sal[it[0].dataIndex].var != null ? `Variación: +${nf0.format(sal[it[0].dataIndex].var)} %` : ''}}},
        scales: {y: {beginAtZero: true, ticks: {maxTicksLimit: 6, callback: v => short(v)}, grid: {color: GRID}}, x: {grid: {display: false}, ticks: {autoSkip: false, maxRotation: 0}}}}
    });
  }
  $('estudios-local').innerHTML = (P.estudios || []).filter(s => s.signo !== 'negativo').map(studyCard).join('');
  studyFilter('local', $('estudios-local'));
}

/* ---------- Riesgos ---------- */
function renderRiesgos() {
  const o = P.oferta;
  $('p-oferta').innerHTML = o ? `<h3>${esc(o.titulo)}${o.url ? ref(o.url, o.fuente, o.url) : ''}</h3><p>${esc(o.texto)}</p>${o.serie?.length ? '<div class="chart-box"><canvas id="ch-ofe" role="img" aria-label="Grados de maestría por universidad"></canvas></div>' : ''}<p class="note">${esc(o.nota || '')}</p>` : '<h3>Oferta masiva de maestrías</h3><p class="empty">Sin datos verificables aún.</p>';
  charts.ofe?.destroy(); charts.ofe = null;
  if (o?.serie?.length && window.Chart) {
    boxH('ch-ofe', o.serie.length * (isMob() ? 24 : 22) + 40);
    charts.ofe = new Chart($('ch-ofe'), {
      type: 'bar', data: {labels: o.serie.map(x => uniCorta(x[0])), datasets: [{data: o.serie.map(x => x[1]), backgroundColor: '#f47230', borderRadius: 4, barThickness: isMob() ? 12 : 14}]},
      options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => o.serie[it[0].dataIndex][0], label: it => `${nf0.format(it.raw)} ${o.unidad || ''}`}}},
        scales: {y: {grid: {display: false}, ticks: {autoSkip: false}}, x: {beginAtZero: true, ticks: {maxTicksLimit: 5, callback: v => short(v)}, grid: {color: GRID}}}}
    });
  }
  const neg = [...(P.estudios || []).filter(s => s.signo === 'negativo'), ...(P.alertas || [])];
  $('p-negativos').innerHTML = `<h3>Señales de retorno nulo o negativo</h3>` + (neg.length ? `<div class="studies">${neg.map(studyCard).join('')}</div>` : '<p class="empty">—</p>');
  const box = $('p-negativos').querySelector('.studies'); if (box) studyFilter('neg', box);
}

/* ---------- Buscador de estudios (texto + chips por signo) ---------- */
function studyFilter(key, list) {
  if (!list) return;
  const arts = [...list.querySelectorAll('article.study')];
  const st = STF[key] || (STF[key] = {q: '', s: ''});
  let bar = list.previousElementSibling?.classList?.contains('cx-stbar') ? list.previousElementSibling : null;
  if (!arts.length) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div'); bar.className = 'cx-stbar';
    bar.innerHTML = `<div class="cx-st-q cx-combo"><input type="search" class="cx-st-in" placeholder="Buscar en estos estudios…" aria-label="Buscar en estudios" autocomplete="off"><button type="button" class="cx-clear" aria-label="Limpiar búsqueda" hidden>×</button></div><div class="cx-chips" role="group" aria-label="Filtrar por tipo de resultado"></div><span class="cx-st-n" aria-live="polite"></span>`;
    list.parentNode.insertBefore(bar, list);
    const inp = bar.querySelector('input'), clr = bar.querySelector('.cx-clear');
    inp.addEventListener('input', debounce(() => { st.q = inp.value; clr.hidden = !inp.value; bar._apply(); }, 120));
    clr.addEventListener('click', () => { inp.value = ''; st.q = ''; clr.hidden = true; bar._apply(); inp.focus(); });
    bar.querySelector('.cx-chips').addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (b) { st.s = st.s === b.dataset.s ? '' : b.dataset.s; bar._apply(); } });
  }
  const inp = bar.querySelector('input'); inp.value = st.q; bar.querySelector('.cx-clear').hidden = !st.q;
  const cnt = {}; arts.forEach(a => { const s = ['positivo', 'negativo', 'mixto', 'neutral'].find(k => a.classList.contains(k)) || 'neutral'; cnt[s] = (cnt[s] || 0) + 1; });
  const sig = Object.keys(SIGNO_TXT).filter(k => cnt[k]);
  if (st.s && !cnt[st.s]) st.s = '';
  const chips = bar.querySelector('.cx-chips');
  chips.hidden = sig.length < 2;
  bar._apply = () => {
    const ts = terms(st.q); let n = 0;
    arts.forEach(a => { const ok = (!st.s || a.classList.contains(st.s)) && (!ts.length || matchAll(a.textContent, ts)); a.hidden = !ok; if (ok) n++; });
    chips.innerHTML = `<button type="button" data-s="" aria-pressed="${!st.s}">Todos</button>` + sig.map(k => `<button type="button" data-s="${esc(k)}" aria-pressed="${st.s === k}" class="cx-s-${esc(k)}">${esc(SIGNO_TXT[k])} <small>${cnt[k]}</small></button>`).join('');
    bar.querySelector('.cx-st-n').textContent = n === arts.length ? `${n} estudios` : n ? `${n} de ${arts.length} estudios` : 'Ningún estudio coincide';
  };
  bar._apply();
}

/* ---------- Mundo ---------- */
function renderMundo() {
  const h = G.hartley, hr = ref('hartley', h.meta.referencia, h.meta.url);
  $('hallazgos').innerHTML = h.hallazgos.map(x => `<div class="hall"><b>${esc(x.cifra)}</b><h3>${esc(x.titulo)}${hr}</h3><p>${esc(x.texto)}</p></div>`).join('');
  const line = (id, s, color, fmt) => {
    charts[id]?.destroy(); charts[id] = null;
    if (!window.Chart || !$(id)) return;
    boxH(id, isMob() ? 220 : 240);
    charts[id] = new Chart($(id), {type: 'line', data: {datasets: [{data: s.puntos.map(p => ({x: p[0], y: p[1], n: p[2]})), borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: isMob() ? 3 : 4, pointHitRadius: 14, spanGaps: true}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, parsing: false, interaction: {mode: 'nearest', axis: 'x', intersect: false}, plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => String(it[0].raw.x), label: it => fmt(it.raw.y) + (it.raw.n ? ` (${it.raw.n})` : '')}}},
        scales: {x: {type: 'linear', ticks: {callback: v => String(v), stepSize: 5, maxTicksLimit: isMob() ? 5 : 8}, grid: {display: false}}, y: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: fmt}, grid: {color: GRID}}}}});
  };
  line('ch-gmat', h.series.gmat_examenes, '#257de0', v => short(v));
  line('ch-oferta', h.series.sin_oferta_3m, '#dc3c3d', v => nf1.format(v) + ' %');
  const S = Object.fromEntries((G.internacional?.series || []).map(s => [s.id, s]));
  const g = S.gmac_crs_salario_inicial_eeuu;
  charts.gmac?.destroy(); charts.gmac = null;
  if (g && window.Chart && $('ch-gmac')) {
    const rows = g.datos.filter(d => !d.version || d.version.startsWith('recalc'));
    boxH('ch-gmac', isMob() ? 260 : 240);
    charts.gmac = new Chart($('ch-gmac'), {type: 'bar', data: {labels: rows.map(d => d.anio), datasets: [
      {label: 'MBA', data: rows.map(d => d.mba), backgroundColor: '#257de0', borderRadius: 4},
      {label: 'Bachiller', data: rows.map(d => d.bachelor), backgroundColor: '#f47230', borderRadius: 4}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false}, plugins: {legend: legendCfg(), tooltip: {callbacks: {label: it => `${it.dataset.label}: US$ ${nf0.format(it.raw)}`, afterBody: it => `MBA / bachiller: ×${nf1.format(rows[it[0].dataIndex].mba / rows[it[0].dataIndex].bachelor)}`}}},
        scales: {y: {beginAtZero: true, ticks: {maxTicksLimit: 6, callback: v => short(v)}, grid: {color: GRID}}, x: {grid: {display: false}}}}});
    $('gmac-nota').innerHTML = `Mediana proyectada, GMAC Corporate Recruiters Survey ${ref(g.datos.at(-1).fuente, 'GMAC, Corporate Recruiters Survey', g.datos.at(-1).url)}. ${esc(g.nota || '')}`;
  }
  const ft = S.ft_execed_open_peru;
  const yrs = ft ? [...new Set(ft.datos.flatMap(d => Object.keys(d).filter(k => /^\d{4}$/.test(k))))].sort() : [];
  $('p-ft').innerHTML = ft ? `<h3>${esc(ft.titulo)}${ref('ft_open', 'Financial Times, Executive Education (Open) Rankings 2026', ft.url)}</h3><div class="scroll"><table><thead><tr><th>Escuela</th>${yrs.map(a => `<th>${a}</th>`).join('')}</tr></thead><tbody>${ft.datos.map(d => `<tr><td>${esc(d.escuela)}</td>${yrs.map(a => `<td class="num">${esc(d[a] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">Menor = mejor. Es educación ejecutiva (cursos abiertos), no MBA. Ninguna escuela peruana ni latinoamericana está en el top 100 del FT Global MBA 2025-2026.</p>` : '';
  const f = (G.internacional?.fuentes || []).filter(x => x.id !== 'hartley2026');
  $('estudios-mundo').innerHTML = f.map(s => studyCard({...s, institucion: s.editor_revista})).join('');
  studyFilter('mundo', $('estudios-mundo'));
}

/* ---------- Fuentes ---------- */
function renderFuentes() {
  $('metodo').innerHTML = (P.metodologia || []).map(m => `<p>${esc(m)}</p>`).join('');
  $('refs').innerHTML = REFS.map((r, i) => `<li id="ref-${i + 1}">${esc(r.txt)} ${r.url ? `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">${esc(r.url)}</a>` : ''}</li>`).join('');
}

document.addEventListener('DOMContentLoaded', () => init().catch(err => { console.error(err); document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="wrap empty">No se pudieron cargar los datos (${esc(err.message)}).</p>`); }));
