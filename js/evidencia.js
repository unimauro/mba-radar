/* Secciones de evidencia: Retorno (Perú), Riesgos y Contexto mundial. */
import {COLOR} from './constants.js';
import {$, cut, esc, isMob, nf0, nf1, short} from './util.js';
import {data} from './state.js';
import {ref} from './refs.js';
import {studyCard, studyFilter} from './studies.js';
import {baseOptions, boxH, destroyChart, hasChart, legendCfg, makeChart} from './charts-common.js';

const LARGO_NOMBRE = {desktop: 44, mobile: 26};

/** Nombre de universidad abreviado para ejes (sin razón social; más corto en móvil). */
function uniCorta(s) {
  s = String(s).replace(/\s+S\.?A\.?C\.?$|\s+S\.?R\.?L\.?$|\s+S\.?A\.?$/i, '');
  if (!isMob()) return cut(s, LARGO_NOMBRE.desktop);
  return cut(s.replace(/^Pontificia Universidad Católica del Perú$/, 'PUCP').replace(/^Universidad Nacional /, 'UN ').replace(/^Universidad /, 'U. '), LARGO_NOMBRE.mobile);
}

/** Alto de un gráfico de barras horizontales: n barras × alto por barra + ejes. */
const altoBarras = (n, porBarra, ejes) => n * (isMob() ? porBarra.mobile : porBarra.desktop) + ejes;

/* ---------- Retorno ---------- */
export function renderRetorno() {
  const P = data.pais;
  $('retorno-sub').textContent = P.textos?.retorno_sub || '';
  renderEnaho(P.enaho_panel);
  renderEscuelas(P.salarios_escuelas || []);
  $('estudios-local').innerHTML = (P.estudios || []).filter(s => s.signo !== 'negativo').map(studyCard).join('');
  studyFilter('local', $('estudios-local'));
}

function renderEnaho(e) {
  $('p-enaho').innerHTML = e
    ? `<h3>${esc(e.titulo)}${ref('enaho', e.fuente, e.url)}</h3><p class="bigstat">${esc(e.cifra)}</p><p>${esc(e.texto)}</p><div class="chart-box"><canvas id="ch-enaho" role="img" aria-label="Prima del posgrado por grupo"></canvas></div><p class="note">${esc(e.advertencia || '')}</p>`
    : '<h3>Prima del posgrado (ENAHO)</h3><p class="empty">Cálculo pendiente.</p>';
  destroyChart('enaho');
  if (!(e && e.cortes?.length && hasChart())) return;
  boxH('ch-enaho', altoBarras(e.cortes.length, {mobile: 30, desktop: 26}, 46));
  makeChart('enaho', 'ch-enaho', {
    type: 'bar',
    data: {labels: e.cortes.map(c => c.grupo), datasets: [{data: e.cortes.map(c => c.prima_pct), backgroundColor: e.cortes.map(c => c.prima_pct >= 0 ? COLOR.azul : COLOR.rojo), borderRadius: 4, barThickness: isMob() ? 14 : 16}]},
    options: {indexAxis: 'y', ...baseOptions(), plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => `Prima: ${nf1.format(it.raw)} %${e.cortes[it.dataIndex].n ? ` (n=${nf0.format(e.cortes[it.dataIndex].n)})` : ''}`}}},
      scales: {x: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 8, callback: v => v + ' %'}, grid: {color: COLOR.grid}}, y: {grid: {display: false}, ticks: {autoSkip: false}}}},
  });
}

const NOTA_SALARIOS_DEFAULT = 'Datos autorreportados por las escuelas a rankings: sesgo de selección (responden los egresados con mejores resultados).';

function renderEscuelas(sal) {
  const refsUnicas = [...new Set(sal.map(s => s.fuente_url ? ref(s.fuente_url, s.fuente, s.fuente_url) : ''))].join(' ');
  $('p-escuelas').innerHTML = `<h3>Sueldo antes y después del MBA, por escuela</h3>` + (sal.length
    ? `<div class="chart-box"><canvas id="ch-sal" role="img" aria-label="Salario antes y después del MBA"></canvas></div><p class="note">${refsUnicas} ${esc(data.pais.textos?.salarios_nota || NOTA_SALARIOS_DEFAULT)}</p>`
    : '<p class="empty">Sin datos públicos verificables.</p>');
  destroyChart('sal');
  if (!(sal.length && hasChart())) return;
  boxH('ch-sal', isMob() ? 280 : 260);
  // "Pacífico (2024)" → dos líneas: ["Pacífico", "2024"]
  const etiqueta = s => { const m = String(s.escuela).match(/^(.*?)\s*\((\d{4})\)$/); return m ? [m[1], m[2]] : String(s.escuela); };
  makeChart('sal', 'ch-sal', {
    type: 'bar',
    data: {labels: sal.map(etiqueta), datasets: [
      {label: 'Antes del MBA', data: sal.map(s => s.antes), backgroundColor: COLOR.naranja, borderRadius: 4},
      {label: 'Después del MBA', data: sal.map(s => s.despues), backgroundColor: COLOR.azul, borderRadius: 4}]},
    options: {...baseOptions(), interaction: {mode: 'index', intersect: false},
      plugins: {legend: legendCfg(), tooltip: {callbacks: {
        title: it => sal[it[0].dataIndex].escuela,
        label: it => `${it.dataset.label}: ${sal[it.dataIndex].moneda || 'US$'} ${nf0.format(it.raw)}`,
        afterBody: it => sal[it[0].dataIndex].var != null ? `Variación: +${nf0.format(sal[it[0].dataIndex].var)} %` : ''}}},
      scales: {y: {beginAtZero: true, ticks: {maxTicksLimit: 6, callback: v => short(v)}, grid: {color: COLOR.grid}}, x: {grid: {display: false}, ticks: {autoSkip: false, maxRotation: 0}}}},
  });
}

/* ---------- Riesgos ---------- */
export function renderRiesgos() {
  const P = data.pais, o = P.oferta;
  $('p-oferta').innerHTML = o
    ? `<h3>${esc(o.titulo)}${o.url ? ref(o.url, o.fuente, o.url) : ''}</h3><p>${esc(o.texto)}</p>${o.serie?.length ? '<div class="chart-box"><canvas id="ch-ofe" role="img" aria-label="Grados de maestría por universidad"></canvas></div>' : ''}<p class="note">${esc(o.nota || '')}</p>`
    : '<h3>Oferta masiva de maestrías</h3><p class="empty">Sin datos verificables aún.</p>';
  destroyChart('ofe');
  if (o?.serie?.length && hasChart()) {
    boxH('ch-ofe', altoBarras(o.serie.length, {mobile: 24, desktop: 22}, 40));
    makeChart('ofe', 'ch-ofe', {
      type: 'bar',
      data: {labels: o.serie.map(x => uniCorta(x[0])), datasets: [{data: o.serie.map(x => x[1]), backgroundColor: COLOR.naranja, borderRadius: 4, barThickness: isMob() ? 12 : 14}]},
      options: {indexAxis: 'y', ...baseOptions(), plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => o.serie[it[0].dataIndex][0], label: it => `${nf0.format(it.raw)} ${o.unidad || ''}`}}},
        scales: {y: {grid: {display: false}, ticks: {autoSkip: false}}, x: {beginAtZero: true, ticks: {maxTicksLimit: 5, callback: v => short(v)}, grid: {color: COLOR.grid}}}},
    });
  }
  const neg = [...(P.estudios || []).filter(s => s.signo === 'negativo'), ...(P.alertas || [])];
  $('p-negativos').innerHTML = `<h3>Señales de retorno nulo o negativo</h3>` + (neg.length ? `<div class="studies">${neg.map(studyCard).join('')}</div>` : '<p class="empty">—</p>');
  studyFilter('neg', $('p-negativos').querySelector('.studies'));
}

/* ---------- Mundo ---------- */
export function renderMundo() {
  const G = data.global, h = G.hartley, hr = ref('hartley', h.meta.referencia, h.meta.url);
  $('hallazgos').innerHTML = h.hallazgos.map(x => `<div class="hall"><b>${esc(x.cifra)}</b><h3>${esc(x.titulo)}${hr}</h3><p>${esc(x.texto)}</p></div>`).join('');
  lineChart('ch-gmat', h.series.gmat_examenes, COLOR.azul, v => short(v));
  lineChart('ch-oferta', h.series.sin_oferta_3m, COLOR.rojo, v => nf1.format(v) + ' %');
  const series = Object.fromEntries((G.internacional?.series || []).map(s => [s.id, s]));
  renderGmac(series.gmac_crs_salario_inicial_eeuu);
  renderFT(series.ft_execed_open_peru);
  const fuentes = (G.internacional?.fuentes || []).filter(x => x.id !== 'hartley2026');
  $('estudios-mundo').innerHTML = fuentes.map(s => studyCard({...s, institucion: s.editor_revista})).join('');
  studyFilter('mundo', $('estudios-mundo'));
}

/** Serie anual de Hartley [[año, valor, nota?], …] como línea. La clave del chart es el id del canvas. */
function lineChart(id, serie, color, fmt) {
  destroyChart(id);
  if (!hasChart() || !$(id)) return;
  boxH(id, isMob() ? 220 : 240);
  makeChart(id, id, {
    type: 'line',
    data: {datasets: [{data: serie.puntos.map(p => ({x: p[0], y: p[1], n: p[2]})), borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: isMob() ? 3 : 4, pointHitRadius: 14, spanGaps: true}]},
    options: {...baseOptions(), parsing: false, interaction: {mode: 'nearest', axis: 'x', intersect: false},
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => String(it[0].raw.x), label: it => fmt(it.raw.y) + (it.raw.n ? ` (${it.raw.n})` : '')}}},
      scales: {x: {type: 'linear', ticks: {callback: v => String(v), stepSize: 5, maxTicksLimit: isMob() ? 5 : 8}, grid: {display: false}}, y: {beginAtZero: true, ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: fmt}, grid: {color: COLOR.grid}}}},
  });
}

function renderGmac(g) {
  destroyChart('gmac');
  if (!(g && hasChart() && $('ch-gmac'))) return;
  const rows = g.datos.filter(d => !d.version || d.version.startsWith('recalc'));
  boxH('ch-gmac', isMob() ? 260 : 240);
  makeChart('gmac', 'ch-gmac', {
    type: 'bar',
    data: {labels: rows.map(d => d.anio), datasets: [
      {label: 'MBA', data: rows.map(d => d.mba), backgroundColor: COLOR.azul, borderRadius: 4},
      {label: 'Bachiller', data: rows.map(d => d.bachelor), backgroundColor: COLOR.naranja, borderRadius: 4}]},
    options: {...baseOptions(), interaction: {mode: 'index', intersect: false},
      plugins: {legend: legendCfg(), tooltip: {callbacks: {
        label: it => `${it.dataset.label}: US$ ${nf0.format(it.raw)}`,
        afterBody: it => `MBA / bachiller: ×${nf1.format(rows[it[0].dataIndex].mba / rows[it[0].dataIndex].bachelor)}`}}},
      scales: {y: {beginAtZero: true, ticks: {maxTicksLimit: 6, callback: v => short(v)}, grid: {color: COLOR.grid}}, x: {grid: {display: false}}}},
  });
  const ultimo = g.datos.at(-1);
  $('gmac-nota').innerHTML = `Mediana proyectada, GMAC Corporate Recruiters Survey ${ref(ultimo.fuente, 'GMAC, Corporate Recruiters Survey', ultimo.url)}. ${esc(g.nota || '')}`;
}

/** Tabla del ranking FT de educación ejecutiva (columnas = años presentes en los datos). */
function renderFT(ft) {
  if (!ft) { $('p-ft').innerHTML = ''; return; }
  const anios = [...new Set(ft.datos.flatMap(d => Object.keys(d).filter(k => /^\d{4}$/.test(k))))].sort();
  $('p-ft').innerHTML = `<h3>${esc(ft.titulo)}${ref('ft_open', 'Financial Times, Executive Education (Open) Rankings 2026', ft.url)}</h3><div class="scroll"><table><thead><tr><th>Escuela</th>${anios.map(a => `<th>${a}</th>`).join('')}</tr></thead><tbody>${ft.datos.map(d => `<tr><td>${esc(d.escuela)}</td>${anios.map(a => `<td class="num">${esc(d[a] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">Menor = mejor. Es educación ejecutiva (cursos abiertos), no MBA. Ninguna escuela peruana ni latinoamericana está en el top 100 del FT Global MBA 2025-2026.</p>`;
}

