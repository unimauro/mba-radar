/* Gráficos adicionales de las vistas Retorno y Mundo:
   - Prima ENAHO 2019-2024 (línea)
   - Distribución de ingresos posgrado vs universitario (p25 / mediana / p75, barras HTML de rango)
   - Mundo: postulaciones otoño 2026, matrícula HBS, CEOs Fortune 100 con MBA, ratio MBA/bachiller,
     interés en IA, y cifras del FT Global MBA. Un solo eje por gráfico, un color por rol. */
import {COLOR} from './constants.js';
import {$, esc, isMob, nf0, nf1, short} from './util.js';
import {data, ui} from './state.js';
import {ref} from './refs.js';
import {baseOptions, boxH, destroyChart, fontSize, FONT_FAMILY, hasChart, makeChart} from './charts-common.js';

const PORCENTAJE = 100;
const MARGEN_ESCALA = 1.08;

/* Valor escrito al final de cada barra (pocas barras: etiqueta directa en vez de leyenda). */
const valueLabels = fmt => ({
  id: 'cxVal',
  afterDatasetsDraw(ch) {
    const {ctx} = ch, horiz = ch.options.indexAxis === 'y', fs = fontSize();
    ctx.save();
    ctx.font = `700 ${fs}px ${FONT_FAMILY}`; ctx.fillStyle = COLOR.ink;
    ch.getDatasetMeta(0).data.forEach((bar, i) => {
      const v = ch.data.datasets[0].data[i];
      if (v == null) return;
      const t = fmt(v);
      if (horiz) {
        ctx.textBaseline = 'middle';
        // Negativas: la etiqueta va a la derecha del cero (no choca con los nombres del eje).
        ctx.textAlign = 'left';
        ctx.fillText(t, (v < 0 ? bar.base : bar.x) + 5, bar.y);
      } else {
        ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
        ctx.fillText(t, bar.x, bar.y - 4);
      }
    });
    ctx.restore();
  },
});

/* ---------- Retorno: prima ENAHO en el tiempo ---------- */
export function renderTendencia() {
  const e = data.pais.enaho_panel, t = e?.tendencia;
  destroyChart('tend');
  const pts = t ? Object.entries(t).map(([a, v]) => ({x: +a, y: v})).sort((a, b) => a.x - b.x) : [];
  if (!pts.length) { $('p-tend').hidden = true; return; }
  $('p-tend').hidden = false;
  const huecos = pts.slice(1).some((p, i) => p.x - pts[i].x > 1);
  $('p-tend').innerHTML = `<h3>La prima del posgrado casi no cambió desde ${pts[0].x}</h3>
    <p class="sub sub-s">Cuánto más gana quien tiene maestría o doctorado frente a un universitario completo de su mismo sexo, edad y zona.</p>
    <div class="chart-box"><canvas id="ch-tend" role="img" aria-label="Prima salarial del posgrado por año: ${esc(pts.map(p => `${p.x} ${nf0.format(p.y)} %`).join(', '))}"></canvas></div>
    <p class="note">${huecos ? 'Línea punteada: años sin cálculo (no se procesaron esas encuestas). ' : ''}Fuente: cálculo propio con microdatos ${ref('enaho', e.fuente, e.url)}. Es una correlación, no el efecto causal del posgrado.</p>`;
  if (!hasChart()) return;
  boxH('ch-tend', isMob() ? 210 : 230);
  makeChart('tend', 'ch-tend', {
    type: 'line',
    data: {datasets: [{data: pts, borderColor: COLOR.azul, backgroundColor: COLOR.azul, borderWidth: 2, pointRadius: isMob() ? 4 : 5, pointHoverRadius: 7, pointHitRadius: 14,
      pointBorderColor: '#fff', pointBorderWidth: 1.5,
      segment: {borderDash: c => (c.p1.parsed.x - c.p0.parsed.x > 1 ? [4, 4] : undefined)}}]},
    options: {...baseOptions(), parsing: false, layout: {padding: {top: 18, right: 10}}, interaction: {mode: 'nearest', axis: 'x', intersect: false},
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => String(it[0].raw.x), label: it => `Prima: +${nf1.format(it.raw.y)} %`}}},
      scales: {x: {type: 'linear', min: pts[0].x - 0.4, max: pts.at(-1).x + 0.4, grid: {display: false},
          afterBuildTicks: ax => { ax.ticks = pts.map(p => ({value: p.x})); }, ticks: {callback: v => String(v)}},
        y: {beginAtZero: true, suggestedMax: 80, ticks: {maxTicksLimit: 5, callback: v => `+${v} %`}, grid: {color: COLOR.grid}}}},
    plugins: [{id: 'cxLast', afterDatasetsDraw(ch) {
      const pt = ch.getDatasetMeta(0).data.at(-1), v = pts.at(-1).y, {ctx} = ch;
      ctx.save(); ctx.font = `700 ${fontSize()}px ${FONT_FAMILY}`; ctx.fillStyle = COLOR.ink; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`+${nf0.format(v)} %`, pt.x + 4, pt.y - 8); ctx.restore();
    }}],
  });
}

/* ---------- Retorno: distribución de ingresos ---------- */
const GRUPOS_DIST = [
  {k: 'universitaria_completa', t: 'Universitario completo', color: COLOR.naranja},
  {k: 'posgrado', t: 'Maestría o doctorado', color: COLOR.azul},
];

export function renderDistribucion() {
  const d = data.dist, host = $('p-dist');
  const anios = d ? Object.keys(d).sort() : [];
  if (!anios.length) { host.hidden = true; return; }
  host.hidden = false;
  if (!anios.includes(String(ui.anioDist))) ui.anioDist = anios.at(-1);
  const r = d[ui.anioDist];
  const max = Math.max(...anios.flatMap(a => GRUPOS_DIST.map(g => d[a][g.k].p75))) * MARGEN_ESCALA;
  const pct = v => (v / max * PORCENTAJE).toFixed(2) + '%';
  const s = data.simbolo;
  const paso = max > 6000 ? 2000 : 1000;
  const ticks = [];
  for (let v = 0; v <= max; v += paso) ticks.push(v);
  const uni = r.universitaria_completa, pos = r.posgrado;
  const fila = g => {
    const x = r[g.k];
    const aria = `${g.t}: la mitad gana entre ${s} ${nf0.format(x.p25)} y ${s} ${nf0.format(x.p75)}; mediana ${s} ${nf0.format(x.mediana)}`;
    return `<li class="cx-rng" title="${esc(aria)}" aria-label="${esc(aria)}">
      <span class="cx-rng-t"><i style="background:${g.color}"></i>${esc(g.t)}${x.n ? ` <small>n = ${esc(nf0.format(x.n))}</small>` : ''}</span>
      <span class="cx-rng-trk">
        <span class="cx-rng-box" style="left:${pct(x.p25)};width:${pct(x.p75 - x.p25)};background:${g.color}"></span>
        <span class="cx-rng-med" style="left:${pct(x.mediana)}"><b>${esc(s)} ${esc(nf0.format(x.mediana))}</b></span>
      </span>
      <span class="cx-rng-v"><span>25 %: ${esc(s)} ${esc(nf0.format(x.p25))}</span><span>75 %: ${esc(s)} ${esc(nf0.format(x.p75))}</span></span></li>`;
  };
  host.innerHTML = `<h3>No todos los posgraduados ganan más</h3>
    <p class="sub sub-s">Ingreso laboral mensual. La barra va del 25 % que menos gana al 25 % que más gana (la mitad del medio); la raya es la mediana.</p>
    ${anios.length > 1 ? `<div class="chips" role="group" aria-label="Año de la encuesta">${anios.map(a => `<button type="button" data-a="${esc(a)}" aria-pressed="${a === String(ui.anioDist)}">${esc(a)}</button>`).join('')}</div>` : ''}
    <ul class="cx-rngs">${GRUPOS_DIST.map(fila).join('')}</ul>
    <div class="cx-rng-axis" aria-hidden="true">${ticks.map(v => `<span style="left:${pct(v)}">${esc(short(v))}</span>`).join('')}</div>
    <p class="cx-rng-hl">${pos.p25 < uni.p75
      ? `Uno de cada cuatro posgraduados gana menos de <b>${esc(s)} ${esc(nf0.format(pos.p25))}</b> al mes, por debajo de lo que gana el 25 % mejor pagado de los universitarios sin posgrado (más de ${esc(s)} ${esc(nf0.format(uni.p75))}).`
      : ''}</p>
    <p class="note">Ocupados de 25 a 64 años, ingreso de todas las ocupaciones (${esc(ui.anioDist)}). Fuente: cálculo propio con microdatos ${ref('enaho', data.pais.enaho_panel?.fuente || 'INEI, ENAHO', data.pais.enaho_panel?.url || 'https://proyectos.inei.gob.pe/microdatos/')}. No distingue MBA de otras maestrías.</p>`;
  host.querySelector('.chips')?.addEventListener('click', e => {
    const b = e.target.closest('button[data-a]');
    if (b) { ui.anioDist = b.dataset.a; renderDistribucion(); host.querySelector(`button[data-a="${CSS.escape(b.dataset.a)}"]`)?.focus(); }
  });
}

/* ---------- Mundo ---------- */
/** Panel pequeño con un gráfico. Devuelve el HTML; el chart se crea después con miniChart(). */
const miniPanel = (id, titulo, nota, aria) => `<div class="panel mini"><h3>${esc(titulo)}</h3><div class="chart-box"><canvas id="${id}" role="img" aria-label="${esc(aria)}"></canvas></div><p class="note">${nota}</p></div>`;

function barMini(id, labels, values, color, fmt, {horizontal = false, h} = {}) {
  destroyChart(id);
  if (!hasChart() || !$(id)) return;
  boxH(id, h ?? (isMob() ? 200 : 210));
  const lim = Math.max(...values.map(Math.abs));
  makeChart(id, id, {
    type: 'bar',
    data: {labels, datasets: [{data: values, backgroundColor: color, borderRadius: 4, maxBarThickness: horizontal ? 18 : 44}]},
    options: {indexAxis: horizontal ? 'y' : 'x', ...baseOptions(),
      layout: {padding: horizontal ? {right: 4} : {top: 18}},
      plugins: {legend: {display: false}, tooltip: {callbacks: {label: it => fmt(it.raw)}}},
      scales: horizontal
        ? {x: {min: Math.min(0, -lim * 1.05), max: Math.max(...values) > 0 ? lim * 1.25 : lim * 0.45, ticks: {maxTicksLimit: 5, callback: v => (v > 0 && Math.max(...values) <= 0 ? '' : fmt(v))}, grid: {color: COLOR.grid}},
          y: {grid: {display: false}, ticks: {autoSkip: false}}}
        : {y: {beginAtZero: true, suggestedMax: lim * 1.12, ticks: {maxTicksLimit: 5, callback: v => fmt(v)}, grid: {color: COLOR.grid}},
          x: {grid: {display: false}}}},
    plugins: [valueLabels(fmt)],
  });
}

function lineMini(id, pts, color, fmt) {
  destroyChart(id);
  if (!hasChart() || !$(id)) return;
  boxH(id, isMob() ? 200 : 210);
  makeChart(id, id, {
    type: 'line',
    data: {datasets: [{data: pts.map(p => ({x: p[0], y: p[1]})), borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, pointHitRadius: 14, pointBorderColor: '#fff', pointBorderWidth: 1.5}]},
    options: {...baseOptions(), parsing: false, layout: {padding: {top: 18, right: 12}}, interaction: {mode: 'nearest', axis: 'x', intersect: false},
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => String(it[0].raw.x), label: it => fmt(it.raw.y)}}},
      scales: {x: {type: 'linear', ticks: {maxTicksLimit: isMob() ? 4 : 6, callback: v => String(v)}, grid: {display: false}},
        y: {beginAtZero: true, ticks: {maxTicksLimit: 5, callback: fmt}, grid: {color: COLOR.grid}}}},
    plugins: [{id: 'cxEnds', afterDatasetsDraw(ch) {
      const els = ch.getDatasetMeta(0).data, {ctx} = ch;
      ctx.save(); ctx.font = `700 ${fontSize()}px ${FONT_FAMILY}`; ctx.fillStyle = COLOR.ink; ctx.textBaseline = 'bottom';
      [[0, 'left'], [els.length - 1, 'right']].forEach(([i, al]) => { const e = els[i]; if (!e) return; ctx.textAlign = al; ctx.fillText(fmt(pts[i][1]), e.x + (al === 'left' ? -4 : 4), e.y - 7); });
      ctx.restore();
    }}],
  });
}

const signo = v => `${v < 0 ? '−' : '+'}${nf0.format(Math.abs(v))} %`;

export function renderMundoGraf() {
  const G = data.global, H = G.hartley, S = H.series;
  const hr = ref('hartley', H.meta.referencia, H.meta.url);
  const intl = Object.fromEntries((G.internacional?.series || []).map(s => [s.id, s]));
  const ia = intl.gmac_pss_interes_ia;
  const iaRefs = ia ? [...new Set(ia.datos.map(d => d.url).filter(Boolean))].map(u => ref(u, `GMAC, Prospective Students Survey (${ia.datos.filter(d => d.url === u).map(d => d.anio).join(', ')})`, u)).join('') : '';
  const post = S.postulaciones_fall2026, hbs = S.hbs_matricula, ceo = S.ceo_mba_fortune100, rat = S.ratio_mba_bachelor;
  const corto = n => String(n).replace(/^Programas full-time 2 años \(mundo, GMAC\)$/, 'MBA 2 años (GMAC)').replace(/^Posgrados de negocios en EE\.UU\. \(GMAC\)$/, 'Posgrados EE.UU.');
  const panels = [
    post && miniPanel('ch-post', 'Postulaciones para la clase de otoño 2026', `Variación frente al año anterior. ${hr}`, 'Variación de postulaciones a MBA, otoño 2026'),
    rat && miniPanel('ch-ratio', 'Salario inicial de un MBA frente al de un bachiller', `Veces el salario inicial planeado de un bachiller (empleadores de EE.UU., GMAC). La ventaja se achica. ${hr}`, 'Razón salario MBA sobre bachiller por año'),
    hbs && miniPanel('ch-hbs', 'Matrícula anual de Harvard Business School', `Dólares nominales, un año de matrícula. ${hr}`, 'Matrícula anual de Harvard Business School'),
    ceo && miniPanel('ch-ceo', 'CEOs del Fortune 100 con MBA', `Porcentaje de directores ejecutivos de las 100 mayores empresas de EE.UU. ${hr}`, 'Porcentaje de CEOs del Fortune 100 con MBA'),
    ia && miniPanel('ch-ia', 'Candidatos que quieren IA en su currículo ideal', `Porcentaje de interesados en estudiar un posgrado de negocios. ${iaRefs} ${esc(ia.nota ? ia.nota.split('.')[0] + '.' : '')}`, 'Porcentaje de candidatos que quieren IA en el currículo'),
  ].filter(Boolean);
  $('mundo-graf').innerHTML = panels.join('');
  if (post) barMini('ch-post', post.puntos.map(p => corto(p[0])), post.puntos.map(p => p[1]), COLOR.rojo, signo, {horizontal: true, h: post.puntos.length * (isMob() ? 34 : 32) + 40});
  if (rat) barMini('ch-ratio', rat.puntos.map(p => String(p[0])), rat.puntos.map(p => p[1]), COLOR.azul, v => `×${nf1.format(v)}`);
  if (hbs) lineMini('ch-hbs', hbs.puntos, COLOR.azul, v => `US$ ${short(v)}`);
  if (ceo) barMini('ch-ceo', ceo.puntos.map(p => String(p[0])), ceo.puntos.map(p => p[1]), COLOR.azul, v => `${nf0.format(v)} %`);
  if (ia) barMini('ch-ia', ia.datos.map(d => String(d.anio)), ia.datos.map(d => d.pct), COLOR.azul, v => `${nf0.format(v)} %`);
  renderFtStats(intl.ft_global_mba_mediana_top100);
}

function renderFtStats(ft) {
  const d = ft?.datos?.at(-1);
  if (!d) { $('ft-stats').innerHTML = ''; return; }
  const r = ref(d.fuente || 'ft_global', `Financial Times, Global MBA Ranking ${d.anio}`, d.url);
  $('ft-stats').innerHTML = `<h3 class="ft-h">Así se ve un MBA de élite (FT Global MBA ${esc(d.anio)}, mediana del top 100)${r}</h3>
    <div class="ft-grid">
      <div class="ft-stat"><b>US$ ${esc(nf0.format(d.mediana_salario_hoy_usd))}</b><span>salario anual promedio 3 años después del MBA (PPA)</span></div>
      <div class="ft-stat"><b>+${esc(nf0.format(d.mediana_incremento_salarial_pct))} %</b><span>aumento frente al sueldo previo al MBA</span></div>
      <div class="ft-stat"><b>${esc(nf0.format(d.escuelas_latam_top100 ?? 0))}</b><span>escuelas latinoamericanas en el top 100</span></div>
    </div>
    <p class="note">Son programas full-time de élite, con selección muy estricta: no se pueden comparar con un MBA part-time en el Perú. ${esc(ft.nota || '')}</p>`;
}
