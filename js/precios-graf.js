/* Vista Precios, gráficos adicionales:
   - "¿Cuántos sueldos cuesta tu MBA?" (barras HTML: costo / sueldo mensual de referencia)
   - Precio vs duración (dispersión por tipo de institución)
   - Costo por mes de clase (puntos por tipo de institución + mediana) */
import {COLOR, SEG_COLOR, SEG_CORTO, SEG_KEY, SEG_ORDER} from './constants.js';
import {$, esc, isMob, lowerMedian, nf0, nf1, short} from './util.js';
import {data, money, ui} from './state.js';
import {nombreCorto, programasConCosto, tieneCosto, unicos} from './data.js';
import {filtrados, ordenar} from './filters.js';
import {barList, detalleHTML} from './bars.js';
import {extremoDe} from './costos.js';
import {simularPrograma} from './calc.js';
import {goToSection} from './navigation.js';
import {ref} from './refs.js';
import {baseOptions, boxH, destroyChart, hasChart, makeChart} from './charts-common.js';

const MESES_ANIO = 12;
const JITTER_X = 0.8;          // ancho (meses) en que se reparten los puntos con la misma duración
const JITTER_Y = 0.5;          // alto (filas) del reparto vertical en el gráfico de costo por mes

export function renderPreciosGraf() {
  renderMeses();
  renderDispersion();
  renderCostoMes();
}

/* ---------- ¿Cuántos sueldos cuesta tu MBA? ---------- */
function refSueldos() {
  const P = data.pais, e = P.enaho_panel;
  const ae = (P.salarios_escuelas || []).filter(s => /América ?Econom/i.test(s.fuente || '') && s.fuente_url).at(-1);
  return (e ? ref('enaho', e.fuente, e.url) : '') + (ae ? ref(ae.fuente_url, ae.fuente, ae.fuente_url) : '');
}

export function renderMeses() {
  const refs = data.pais.sueldos_ref || [];
  const box = $('box-meses');
  if (!box) return;
  $('meses').hidden = !(refs.length && programasConCosto().length);
  if ($('meses').hidden) return;
  if (ui.baseMeses >= refs.length) ui.baseMeses = 0;
  $('meses-base').innerHTML = refs.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="${i === ui.baseMeses}">${esc(r.etiqueta)}: ${money(r.mensual)}</button>`).join('');
  $('meses-base').onclick = e => { const b = e.target.closest('button'); if (b) { ui.baseMeses = +b.dataset.i; renderMeses(); } };
  const mensual = refs[ui.baseMeses].mensual;
  const rows = ordenar(filtrados().filter(tieneCosto)).map(p => {
    const v = p.costo_soles / mensual;
    return {p, v, txt: `${nf0.format(v)} sueldos`, color: SEG_COLOR[p.segmento] || COLOR.gris, hl: extremoDe(p)};
  });
  barList('meses', box, null, rows, {
    aria: 'Costo de cada MBA en sueldos mensuales', redraw: renderMeses,
    detail: r => detalleHTML(r.p, `<div class="cx-dl-hi"><dt>Equivale a</dt><dd><b>${esc(nf1.format(r.v))} sueldos</b> de ${esc(money(mensual))} (≈ ${esc(nf1.format(r.v / MESES_ANIO))} años de sueldo bruto íntegro)</dd></div>`),
    onSim: r => { simularPrograma(r.p, {sueldo: Math.round(mensual)}); goToSection('calculadora'); },
  });
  const u = unicos(rows.map(r => r.p));
  const med = lowerMedian(u.map(p => p.costo_soles).sort((a, b) => a - b));
  $('meses-hl').innerHTML = med
    ? `Con <b>${esc(money(mensual))}</b> al mes, el MBA mediano${rows.length < programasConCosto().length ? ' de tu selección' : ''} (${esc(money(med))}) cuesta <b>${esc(nf0.format(med / mensual))} sueldos</b>: casi ${esc(nf1.format(med / mensual / MESES_ANIO))} años de sueldo bruto sin gastar nada.`
    : '';
  $('meses-nota').innerHTML = rows.length
    ? `Sueldo bruto mensual de referencia ${refSueldos()}. No incluye gratificaciones, impuestos ni gastos: con lo que realmente puedes ahorrar al mes, la cifra es varias veces mayor. Toca una barra para ver el detalle y simularla.`
    : '';
}

/* ---------- Precio vs duración ---------- */
const conDuracion = () => unicos(programasConCosto()).filter(p => p.duracion_meses > 0);

/** Reparte horizontalmente los puntos que comparten la misma duración (el tooltip muestra el valor real). */
function jitterX(progs) {
  const grupos = new Map();
  progs.forEach(p => { const k = p.duracion_meses; grupos.set(k, [...(grupos.get(k) || []), p]); });
  const off = new Map();
  grupos.forEach(g => g.sort((a, b) => a.costo_soles - b.costo_soles).forEach((p, i) => off.set(p.id, g.length > 1 ? (i / (g.length - 1) - 0.5) * JITTER_X : 0)));
  return off;
}

const tooltipPrograma = extra => ({callbacks: {
  title: it => { const p = it[0].raw.p; return p ? `${nombreCorto(p)} — ${p.programa_corto || p.programa}` : ''; },
  label: it => extra(it.raw),
}});

function renderDispersion() {
  destroyChart('disp');
  const progs = conDuracion();
  $('leg-disp').innerHTML = SEG_ORDER.filter(s => progs.some(p => p.segmento === s)).map(s => `<span><i style="background:${SEG_COLOR[s]}"></i>${esc(SEG_CORTO[SEG_KEY[s]])}</span>`).join('');
  $('disp-nota').innerHTML = progs.length
    ? `${progs.length} programas únicos con precio y duración publicados (la fuente de cada precio está en la tabla). Precios en dólares convertidos a soles ${ref('tc', data.pais.pais.tc_fuente || 'Tipo de cambio', data.pais.pais.tc_url)}. Los puntos con la misma duración se separan un poco para que se vean todos.`
    : '';
  if (!(progs.length && hasChart())) return;
  const off = jitterX(progs), r = isMob() ? 4 : 5;
  boxH('ch-disp', isMob() ? 260 : 280);
  makeChart('disp', 'ch-disp', {
    type: 'scatter',
    data: {datasets: SEG_ORDER.map(s => ({
      label: SEG_CORTO[SEG_KEY[s]],
      data: progs.filter(p => p.segmento === s).map(p => ({x: p.duracion_meses + off.get(p.id), y: p.costo_soles, p})),
      backgroundColor: SEG_COLOR[s], borderColor: '#fff', borderWidth: 1, pointRadius: r, pointHoverRadius: r + 3, pointHitRadius: 8,
    }))},
    options: {...baseOptions(), parsing: false,
      plugins: {legend: {display: false}, tooltip: tooltipPrograma(d => `${money(d.y)} · ${nf0.format(d.p.duracion_meses)} meses`)},
      scales: {
        x: {type: 'linear', title: {display: true, text: 'Duración (meses)'}, ticks: {stepSize: 6, callback: v => String(v)}, grid: {display: false}},
        y: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: v => `${data.simbolo} ${short(v)}`}, grid: {color: COLOR.grid}}}},
  });
}

/* ---------- Costo por mes de clase ---------- */
/** "Universidad privada" → ["Universidad", "privada"] en móvil (dos líneas). */
const etiquetaSeg = s => { const t = SEG_CORTO[SEG_KEY[s]]; if (!isMob()) return t; const i = t.indexOf(' '); return i > 0 ? [t.slice(0, i), t.slice(i + 1)] : t; };

function renderCostoMes() {
  destroyChart('cmes');
  const progs = conDuracion();
  const segs = SEG_ORDER.filter(s => progs.some(p => p.segmento === s));
  const porMes = p => p.costo_soles / p.duracion_meses;
  const meds = segs.map(s => lowerMedian(progs.filter(p => p.segmento === s).map(porMes).sort((a, b) => a - b)));
  $('cmes-nota').innerHTML = segs.length
    ? `Medianas: ${segs.map((s, i) => `${esc(SEG_CORTO[SEG_KEY[s]].toLowerCase())} ${esc(money(meds[i]))}`).join(' · ')} por mes. Mismos ${progs.length} programas del gráfico de la izquierda ${ref('tc', data.pais.pais.tc_fuente || 'Tipo de cambio', data.pais.pais.tc_url)}.`
    : '';
  if (!(segs.length && hasChart())) return;
  const r = isMob() ? 4 : 5;
  // Reparto vertical determinista dentro de cada fila (no aleatorio: el gráfico no "salta" al redibujar).
  const jy = i => (((i * 37) % 11) / 10 - 0.5) * JITTER_Y;
  boxH('ch-cmes', isMob() ? 220 : 240);
  makeChart('cmes', 'ch-cmes', {
    type: 'scatter',
    data: {datasets: [
      ...segs.map((s, k) => ({
        label: SEG_CORTO[SEG_KEY[s]],
        data: progs.filter(p => p.segmento === s).map((p, i) => ({x: porMes(p), y: k + jy(i), p})),
        backgroundColor: SEG_COLOR[s], borderColor: '#fff', borderWidth: 1, pointRadius: r, pointHoverRadius: r + 3, pointHitRadius: 8,
      })),
      {label: 'Mediana', data: segs.map((s, k) => ({x: meds[k], y: k, med: true, seg: SEG_CORTO[SEG_KEY[s]]})),
        pointStyle: 'line', rotation: 90, pointRadius: isMob() ? 13 : 15, pointHoverRadius: 16, borderWidth: 3, borderColor: COLOR.ink, backgroundColor: COLOR.ink, pointHitRadius: 10},
    ]},
    options: {...baseOptions(), parsing: false,
      plugins: {legend: {display: false}, tooltip: {callbacks: {
        title: it => { const d = it[0].raw; return d.med ? `Mediana · ${d.seg}` : `${nombreCorto(d.p)} — ${d.p.programa_corto || d.p.programa}`; },
        label: it => { const d = it.raw; return d.med ? `${money(d.x)} por mes` : `${money(d.x)} por mes · ${money(d.p.costo_soles)} en ${nf0.format(d.p.duracion_meses)} meses`; }}}},
      scales: {
        x: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: v => `${data.simbolo} ${short(v)}`}, grid: {color: COLOR.grid}, title: {display: true, text: 'Costo por mes de clase'}},
        y: {type: 'linear', reverse: true, min: -0.6, max: segs.length - 0.4, grid: {display: false},
          afterBuildTicks: ax => { ax.ticks = segs.map((_, k) => ({value: k})); },
          ticks: {callback: v => (Number.isInteger(v) && segs[v] ? etiquetaSeg(segs[v]) : '')}}}},
  });
}
