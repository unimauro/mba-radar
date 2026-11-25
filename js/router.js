/* Router de vistas por hash. Todas las vistas se dibujan una vez (renderAll) y aquí solo se muestran u ocultan.
   - #/<vista>?filtros&ir=<id>  (ver route.js)
   - Hashes antiguos (#costos, #pais=pe&q=…, #ref-3) se reescriben con replaceState.
   - Atrás/adelante: hashchange. Se recuerda el scroll de cada vista para volver donde estabas.
   - Al cambiar de vista por un clic: título del documento, foco en el encabezado de la vista y scroll arriba. */
import {buildHash, DEFAULT_VIEW, parseHash, VIEWS} from './route.js';
import {prefersReducedMotion} from './util.js';
import {resizeCharts} from './charts-common.js';

const TITULO_SITIO = 'MBA Radar';
const ENTER_MS = 260;

const state = {view: null, scroll: {}, userNav: false, params: {}};
let onParams = () => {};

export const currentView = () => state.view;
export const currentParams = () => ({...state.params});

const viewEl = v => document.getElementById('v-' + v);

/** Vista que contiene el elemento con ese id (o null). */
function viewOf(id) {
  const el = document.getElementById(id);
  return el?.closest('.view')?.dataset.view || null;
}

function setTitle(v) {
  const t = viewEl(v)?.dataset.title || '';
  document.title = v === DEFAULT_VIEW ? t : `${t} · ${TITULO_SITIO}`;
}

function paintNav(v) {
  document.querySelectorAll('#secnav a[data-view]').forEach(a => {
    if (a.dataset.view === v) {
      a.setAttribute('aria-current', 'page');
      const strip = a.parentElement;
      strip.scrollLeft = a.offsetLeft - strip.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
    } else a.removeAttribute('aria-current');
  });
  document.getElementById('secnav')?.dispatchEvent(new Event('cx-nav'));
}

function scrollToEl(el) {
  el.scrollIntoView({block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
  if (el.matches('li[id^="ref-"]')) {
    el.classList.remove('cx-flash'); void el.offsetWidth; el.classList.add('cx-flash');
  }
}

/** Muestra la vista `v`. opts: {anchor, focus, restore} */
function show(v, {anchor = null, focus = false, restore = false} = {}) {
  const prev = state.view;
  if (prev && prev !== v) state.scroll[prev] = window.scrollY;
  if (prev !== v) {
    VIEWS.forEach(x => { const el = viewEl(x); if (el) el.hidden = x !== v; });
    const el = viewEl(v);
    if (el && prev && !prefersReducedMotion()) {
      el.classList.remove('view-enter'); void el.offsetWidth; el.classList.add('view-enter');
      setTimeout(() => el.classList.remove('view-enter'), ENTER_MS);
    }
    state.view = v;
    setTitle(v); paintNav(v);
    resizeCharts();
    if (prev) window.dataLayer?.push({event: 'virtual_pageview', page_path: location.pathname + '#/' + v, page_title: document.title});
  }
  const target = anchor && document.getElementById(anchor);
  if (target && viewOf(anchor) === v) {
    requestAnimationFrame(() => scrollToEl(target));
    if (focus) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true}); }
  } else if (prev !== v) {
    window.scrollTo(0, restore ? (state.scroll[v] || 0) : 0);
    if (focus) viewEl(v)?.querySelector('h1[tabindex],h2[tabindex]')?.focus({preventScroll: true});
  }
}

/** Reescribe el hash actual al formato canónico (sin crear entrada de historial). */
function replaceHash(h) { try { history.replaceState(history.state, '', h); } catch { /* file:// */ } }

/** Interpreta location.hash y muestra la vista. `initial` = primera carga. */
function route(initial) {
  const r = parseHash(location.hash);
  let {view, anchor} = r;
  if (view === null) {                                     // ancla desconocida: #ref-3, #main…
    view = viewOf(anchor);
    if (!view) {                                           // fuera de las vistas (p. ej. #main): quedarse
      const el = document.getElementById(anchor);
      replaceHash(buildHash(state.view || DEFAULT_VIEW, state.params));
      if (!state.view) show(DEFAULT_VIEW);
      if (el) { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus(); }
      return;
    }
  }
  const user = state.userNav; state.userNav = false;
  const fixed = onParams(view, {...r.params}, initial);      // el callback puede completar los parámetros (filtros vigentes)
  const params = fixed || r.params;
  if (r.legacy || fixed) replaceHash(buildHash(view, params, anchor));
  state.params = params;
  show(view, {anchor, focus: !initial, restore: !initial && !user && !anchor});
}

/** Lleva a una vista (y opcionalmente a un elemento dentro de ella), creando entrada en el historial. */
export function navigate(view, anchor = null, params = null) {
  state.userNav = true;
  const h = buildHash(view, params ?? (view === state.view ? state.params : keepPais()), anchor);
  if (location.hash === h) { state.userNav = false; show(view, {anchor, focus: true}); return; }
  location.hash = h;
}

const keepPais = () => (state.params.pais ? {pais: state.params.pais} : {});

/** Actualiza los parámetros de la vista visible sin crear entrada de historial (filtros). */
export function setParams(params, view = state.view) {
  if (view !== state.view) return;
  state.params = {...params};
  replaceHash(buildHash(view || DEFAULT_VIEW, state.params));
}

/**
 * Normaliza el hash y devuelve los parámetros iniciales (antes de cargar datos), para leer país y filtros.
 */
export function initialParams() {
  const r = parseHash(location.hash);
  return {...r.params};
}

/**
 * Activa el router. `cb(view, params, initial)` se llama antes de mostrar cada vista (para aplicar país y filtros);
 * si devuelve un objeto, esos son los parámetros canónicos que quedan en el hash.
 */
export function startRouter(cb) {
  onParams = cb || onParams;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) state.userNav = true;
  });
  window.addEventListener('hashchange', () => route(false));
  route(true);
}

/** Antes de cargar los datos: mostrar ya la vista pedida (evita ver Inicio un instante en #/calculadora). */
export function earlyView() {
  const {view} = parseHash(location.hash);
  if (!view) return;
  VIEWS.forEach(x => { const el = viewEl(x); if (el) el.hidden = x !== view; });
  setTitle(view); paintNav(view);
}
