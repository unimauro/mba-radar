/* Filtros del listado de costos (panel cx-fp), buscador y su reflejo en el hash de la URL. */
import {DEBOUNCE_MS, MAX_QUERY, ORDEN, ORDEN_DEFAULT, SEG_COLOR, SEG_CORTO, SEG_KEY, SEG_ORDER} from './constants.js';
import {$, debounce, esc, matchAll, terms} from './util.js';
import {data, FILTER_KEYS, money, resetBarState, resetFilters, ui} from './state.js';
import {nombreCorto, tieneCosto} from './data.js';
import {aumentoNecesario} from './aumento.js';
import {combo} from './combo.js';
import {initialParams, setParams} from './router.js';

/* Parámetros del hash (#/precios?seg=publica&precio=0-20000&q=…): ver route.js. */
const HASH_KEY = {modalidad: 'mod', seg: 'seg', rng: 'precio', acr: 'acr', sede: 'sede', ord: 'orden'};
const PAIS_RE = /^[a-z]{2}$/;

/** Grupos del panel: [clave, título, etiqueta "todos" (null = sin opción vacía)]. */
const GRUPOS = [['modalidad', 'Modalidad', 'Todas'], ['seg', 'Tipo de institución', 'Todas'], ['rng', 'Precio total', 'Cualquiera'],
  ['acr', 'Acreditación', 'Todas'], ['sede', 'Ciudad / sede', 'Todas'], ['ord', 'Ordenar por', null]];

const rangosPrecio = () => {
  const s = data.simbolo;
  return [
    {k: '0-20000', t: `Menos de ${s} 20 mil`, a: 0, b: 20000},
    {k: '20000-60000', t: `${s} 20–60 mil`, a: 20000, b: 60000},
    {k: '60000-100000', t: `${s} 60–100 mil`, a: 60000, b: 100000},
    {k: '100000-', t: `Más de ${s} 100 mil`, a: 100000, b: Infinity},
  ];
};

/** Valores distintos, del más frecuente al menos frecuente. */
function porFrecuencia(values) {
  const m = new Map();
  values.filter(Boolean).forEach(v => m.set(v, (m.get(v) || 0) + 1));
  return [...m].sort((a, b) => b[1] - a[1]).map(([v]) => [v, v]);
}

/** Opciones disponibles de cada grupo: {grupo: [[valor, etiqueta], …]}. */
function opciones() {
  const progs = data.pais.programas;
  return {
    modalidad: porFrecuencia(progs.map(p => p.modalidad_grupo)),
    seg: SEG_ORDER.filter(s => progs.some(p => p.segmento === s)).map(s => [SEG_KEY[s], SEG_CORTO[SEG_KEY[s]]]),
    rng: rangosPrecio().map(x => [x.k, x.t]),
    acr: [['si', 'Con acreditación internacional'], ['no', 'Sin acreditación internacional']],
    sede: porFrecuencia(progs.map(p => p._sede)),
    ord: Object.entries(ORDEN),
  };
}

/** País pedido en el hash inicial (#/…?pais=xx o el formato antiguo #pais=xx). */
export const paisEnHash = () => { const p = initialParams().pais; return PAIS_RE.test(p || '') ? p : null; };

/** Restablece los filtros y toma los válidos de `params` (objeto del hash). */
export function readHash(params = {}) {
  resetFilters();
  const op = opciones();
  FILTER_KEYS.forEach(k => { const v = params[HASH_KEY[k]]; if (v && op[k].some(o => o[0] === v)) ui[k] = v; });
  const o = params[HASH_KEY.ord];
  if (o && ORDEN[o]) ui.ord = o;
  ui.q = String(params.q || '').slice(0, MAX_QUERY);
  $('q').value = ui.q;
  $('q').dispatchEvent(new Event('cx-sync'));
}

/** Parámetros del hash que reflejan el país y los filtros actuales. */
export function filterParams() {
  const hp = {};
  const code = data.pais?.pais?.code;
  if (code && code !== data.paisDefault) hp.pais = code;
  if (ui.q.trim()) hp.q = ui.q.trim();
  FILTER_KEYS.forEach(k => { if (ui[k]) hp[HASH_KEY[k]] = ui[k]; });
  if (ui.ord !== ORDEN_DEFAULT) hp[HASH_KEY.ord] = ui.ord;
  return hp;
}

/** ¿Trae `params` algún filtro? */
export const tieneFiltros = params => Boolean(params.q) || Object.values(HASH_KEY).some(k => params[k]);

const mismoFiltro = params => JSON.stringify(Object.entries(filterParams()).filter(([k]) => k !== 'pais').sort()) ===
  JSON.stringify(Object.entries(params).filter(([k]) => k !== 'pais').sort());

/**
 * Al entrar a #/precios: si el hash trae filtros distintos de los vigentes, se aplican (true = hay que redibujar);
 * si no trae ninguno, se conservan los vigentes.
 */
export function syncFiltros(params) {
  if (!tieneFiltros(params) || mismoFiltro(params)) return false;
  readHash(params);
  resetBarState();
  paintFiltros();
  return true;
}

function writeHash() { setParams(filterParams(), 'precios'); }

const nFiltros = () => FILTER_KEYS.filter(k => ui[k]).length;

/** Programas que pasan los filtros y la búsqueda. */
export function filtrados() {
  const ts = terms(ui.q), rango = rangosPrecio().find(x => x.k === ui.rng);
  return data.pais.programas.filter(p => (!ui.modalidad || p.modalidad_grupo === ui.modalidad) &&
    (!ui.seg || SEG_KEY[p.segmento] === ui.seg) &&
    (!rango || (tieneCosto(p) && p.costo_soles >= rango.a && p.costo_soles < rango.b)) &&
    (!ui.acr || (ui.acr === 'si') === p._acr) &&
    (!ui.sede || p._sede === ui.sede) &&
    (!ts.length || matchAll(`${p.universidad} ${p.siglas || ''} ${p.programa} ${p.sede || ''}`, ts)));
}

/* Comparadores: los programas sin el dato (o con 0) van al final. */
const sinDato = v => v == null || !(v > 0);
const COMPARADORES = {
  caro: (a, b) => (sinDato(a.costo_soles) - sinDato(b.costo_soles)) || (b.costo_soles || 0) - (a.costo_soles || 0),
  barato: (a, b) => (sinDato(a.costo_soles) - sinDato(b.costo_soles)) || (a.costo_soles || 0) - (b.costo_soles || 0),
  corto: (a, b) => (sinDato(a.duracion_meses) - sinDato(b.duracion_meses)) || (a.duracion_meses || 0) - (b.duracion_meses || 0) || (a.costo_soles || 0) - (b.costo_soles || 0),
  aumento: (a, b) => (aumentoNecesario(b) ?? -1) - (aumentoNecesario(a) ?? -1),
};
export const ordenar = arr => [...arr].sort(COMPARADORES[ui.ord] || (() => 0));

let onChange = () => {};

/** Un filtro cambió: cerrar detalles, guardar en el hash y redibujar. */
export function aplicar() {
  resetBarState();
  writeHash(); paintFiltros(); onChange();
}

/** Monta (una vez) el panel de filtros y redibuja sus opciones. `cb` se llama cuando cambian los filtros. */
export function renderFiltros(cb) {
  onChange = cb;
  const fp = $('cx-fp') || mountPanel();
  const fm = $('f-modalidad'); if (fm) fm.hidden = true;     // reemplazado por el grupo "Modalidad" del panel
  if (fp) {
    const op = opciones();
    fp.querySelector('.cx-fp-body').innerHTML = GRUPOS.filter(([k]) => op[k].length > (k === 'ord' ? 0 : 1)).map(([k, t, todos]) =>
      `<div class="cx-fg"><span class="cx-fg-t" id="cx-fg-${k}">${esc(t)}</span><div class="cx-chips" role="group" aria-labelledby="cx-fg-${k}" data-f="${k}">${todos ? `<button type="button" data-v="">${esc(todos)}</button>` : ''}${op[k].map(([v, l]) => `<button type="button" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div></div>`).join('');
    paintFiltros();
  }
  combo($('q'), $('q-list'), {
    source: () => data.pais.programas.map(p => ({label: `${nombreCorto(p)} — ${p.programa}`, sub: `${p.universidad} · ${money(p.costo_soles)}${p.sede ? ' · ' + p.sede : ''}`, val: p})),
    onPick: it => { ui.q = nombreCorto(it.val); $('q').value = ui.q; aplicar(); },
    onType: debounce(txt => { ui.q = txt; aplicar(); }, DEBOUNCE_MS.busqueda),
  });
  $('leg-costos').innerHTML = SEG_ORDER.map(s => `<span><i style="background:${SEG_COLOR[s]}"></i>${esc(s)}</span>`).join('');
}

function mountPanel() {
  const filt = document.querySelector('#costos .filters');
  if (!filt) return null;
  const fp = document.createElement('div');
  fp.id = 'cx-fp'; fp.className = 'cx-fp';
  fp.innerHTML = `<div class="cx-fp-row"><div class="cx-fp-q"></div><button type="button" class="cx-fp-tog" aria-expanded="false" aria-controls="cx-fp-body"><span>Filtros</span><b class="cx-fp-n" hidden></b></button></div>
      <div class="cx-fp-body" id="cx-fp-body"></div>
      <div class="cx-fp-foot"><span class="cx-count" aria-live="polite"></span><button type="button" class="cx-clear-all">Limpiar filtros</button></div>`;
  filt.appendChild(fp);
  if ($('buscador')) fp.querySelector('.cx-fp-q').appendChild($('buscador'));
  fp.onclick = e => onPanelClick(fp, e);
  return fp;
}

function onPanelClick(fp, e) {
  const b = e.target.closest('button');
  if (!b || !fp.contains(b)) return;
  if (b.classList.contains('cx-fp-tog')) { ui.fpOpen = !ui.fpOpen; paintFiltros(); return; }
  if (b.classList.contains('cx-clear-all')) {
    resetFilters();
    $('q').value = ''; $('q').dispatchEvent(new Event('cx-sync'));
    aplicar(); return;
  }
  const g = b.closest('[data-f]');
  if (!g || b.dataset.v == null) return;
  const f = g.dataset.f, v = b.dataset.v;
  ui[f] = f === 'ord' ? v : (ui[f] === v ? '' : v);
  aplicar();
}

/** Estado visual del panel: chips activos, contador, botón limpiar. */
function paintFiltros() {
  const fp = $('cx-fp'); if (!fp) return;
  fp.querySelectorAll('[data-f]').forEach(g => g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(ui[g.dataset.f] === b.dataset.v))));
  const n = nFiltros(), rows = filtrados();
  fp.classList.toggle('cx-open', ui.fpOpen);
  fp.querySelector('.cx-fp-tog').setAttribute('aria-expanded', String(ui.fpOpen));
  const badge = fp.querySelector('.cx-fp-n'); badge.hidden = !n; badge.textContent = n;
  fp.querySelector('.cx-count').innerHTML = `<b>${rows.length}</b> de ${data.pais.programas.length} programas · ${rows.filter(tieneCosto).length} con precio`;
  fp.querySelector('.cx-clear-all').hidden = !(n || ui.q.trim() || ui.ord !== ORDEN_DEFAULT);
}
