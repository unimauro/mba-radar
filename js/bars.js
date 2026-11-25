/* Lista de barras en HTML (legible en móvil): etiqueta encima, valor al final, Top N + "ver todos",
   detalle inline al tocar una barra. La usan Costos y el gráfico de aumento necesario. */
import {TOP_N, TOP_N_HOLGURA} from './constants.js';
import {esc, nf0, safeUrl} from './util.js';
import {money, ui} from './state.js';
import {advertencias, nombreCorto} from './data.js';
import {destroyChart} from './charts-common.js';

const ANCHO_MIN_BARRA = 0.006;           // fracción mínima visible de una barra

/**
 * @param {string} key   'costos' | 'be' (clave en ui.open / ui.det)
 * @param {HTMLElement} box contenedor .chart-box
 * @param {HTMLCanvasElement} canvas canvas que la lista reemplaza (se oculta)
 * @param {Array<{p, v, txt, color, hl}>} rows filas ya ordenadas
 * @param {{aria, redraw, detail(row), onSim(row), cap?}} o
 */
export function barList(key, box, canvas, rows, o) {
  destroyChart(key);
  if (canvas) canvas.hidden = true;
  box.style.height = '';
  const host = box.querySelector('.cx-bars-host') || mountHost(key, box);
  host._cx = {rows, onSim: o.onSim, redraw: o.redraw};
  if (!rows.length) { host.innerHTML = `<p class="empty cx-none">Ningún programa coincide con los filtros.</p>`; return; }

  const cap = o.cap || Infinity, vmax = Math.max(...rows.map(r => Math.min(r.v, cap))) || 1;
  const many = rows.length > TOP_N + TOP_N_HOLGURA, open = ui.open[key] || !many;
  const shown = open ? rows : rows.slice(0, TOP_N);
  const pinned = open ? [] : rows.slice(TOP_N).filter(r => r.hl || String(r.p.id) === String(ui.det[key]));
  const item = r => barItem(key, r, cap, vmax, o.detail);
  const gap = pinned.length ? `<li class="cx-gap" aria-hidden="true">· · · ${rows.length - TOP_N - pinned.length} programas más · · ·</li>${pinned.map(item).join('')}` : '';
  const more = many ? `<button type="button" class="cx-more" data-act="more" aria-expanded="${ui.open[key]}">${ui.open[key] ? `Mostrar solo los ${TOP_N} primeros` : `Ver los ${rows.length} programas`}</button>` : '';
  host.innerHTML = `<ol class="cx-bars" aria-label="${esc(o.aria)}">${shown.map(item).join('')}${gap}</ol>` + more;
}

function barItem(key, r, cap, vmax, detail) {
  const p = r.p, id = String(p.id), on = String(ui.det[key]) === id;
  const badge = r.hl === 'min' ? '<em class="cx-badge cx-b-min">Más barato</em>' : r.hl === 'max' ? '<em class="cx-badge cx-b-max">Más caro</em>' : '';
  const w = Math.max(ANCHO_MIN_BARRA, Math.min(r.v, cap) / vmax);
  return `<li class="cx-row${r.hl ? ' cx-hl-' + r.hl : ''}${on ? ' cx-on' : ''}"><button type="button" class="cx-bar" data-k="${esc(id)}" aria-expanded="${on}" aria-label="${esc([`${nombreCorto(p)}, ${p.programa}: ${r.txt}`, ...advertencias(p)].join('; '))}">
      <span class="cx-lab"><b>${esc(nombreCorto(p))}</b> <span>${esc(p.programa_corto || p.programa)}</span>${badge}</span>
      <span class="cx-trk"><span class="cx-fill" style="--w:${w.toFixed(4)};background:${r.color}"></span><span class="cx-val">${esc(r.txt)}${r.v > cap ? ' ›' : ''}</span></span></button></li>` +
    (on ? `<li class="cx-det" role="region" aria-label="Detalle del programa">${detail(r)}</li>` : '');
}

/** Crea el contenedor de la lista y delega los clics (barra, ver más, cerrar, simular). */
function mountHost(key, box) {
  const host = document.createElement('div');
  host.className = 'cx-bars-host';
  box.appendChild(host);
  host.addEventListener('click', e => {
    const c = host._cx; if (!c) return;
    const act = e.target.closest('[data-act]');
    if (act) return onAction(key, box, host, c, act.dataset.act);
    const b = e.target.closest('.cx-bar'); if (!b) return;
    ui.det[key] = String(ui.det[key]) === b.dataset.k ? null : b.dataset.k;
    c.redraw();
    host.querySelector('.cx-det')?.scrollIntoView({block: 'nearest'});
  });
  return host;
}

function onAction(key, box, host, c, act) {
  if (act === 'more') {
    ui.open[key] = !ui.open[key];
    c.redraw();
    if (!ui.open[key]) box.scrollIntoView({block: 'start'});
  } else if (act === 'close') {
    const id = ui.det[key];
    ui.det[key] = null;
    c.redraw();
    host.querySelector(`.cx-bar[data-k="${CSS.escape(String(id))}"]`)?.focus();
  } else if (act === 'sim') {
    const r = c.rows.find(x => String(x.p.id) === String(ui.det[key]));
    if (r) c.onSim(r);
  }
}

/** Ficha del programa dentro de la lista. `extra` = filas <div><dt/><dd/></div> adicionales (HTML ya escapado). */
export function detalleHTML(p, extra = '') {
  const conf = p.confianza || 'baja';
  const dd = (t, v) => v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : '';
  return `<div class="cx-det-in">
    <div class="cx-det-h"><b>${esc(p.universidad)}</b><button type="button" class="cx-x" data-act="close" aria-label="Cerrar detalle">×</button></div>
    <p class="cx-det-p">${esc(p.programa)}</p>
    <dl class="cx-dl">${extra}
      ${dd('Costo total', `${esc(money(p.costo_soles))}${usdNota(p, ' <small>(US$ ', ')</small>')}`)}
      ${dd('Modalidad', esc(p.modalidad || p.modalidad_grupo || '—'))}
      ${dd('Duración', p.duracion_meses ? `${esc(nf0.format(p.duracion_meses))} meses` : '—')}
      ${dd('Sede', p.sede ? esc(p.sede) : '')}
      ${dd('Confianza del dato', confBadge(conf))}
      ${dd('Acreditación', esc(acreditacionTxt(p)))}
      ${dd('Ojo', esc(advertencias(p).join(' · ')))}
    </dl>
    <div class="cx-det-a"><button type="button" class="cx-sim" data-act="sim">Simular en la calculadora</button>${p.fuente_url ? `<a href="${esc(safeUrl(p.fuente_url))}" target="_blank" rel="noopener">Ver fuente del precio</a>` : ''}</div></div>`;
}

export const confBadge = c => `<span class="conf ${esc(c)}">${esc(c)}</span>`;
export const acreditacionTxt = p => [p.acreditaciones, p.ranking].filter(Boolean).join(' · ');

/** Precio original en dólares, si el programa se publicó en US$. */
export const usdNota = (p, pre, post = '') => p.moneda_original === 'USD' && p.costo_usd ? `${pre}${esc(nf0.format(p.costo_usd))}${post}` : '';
