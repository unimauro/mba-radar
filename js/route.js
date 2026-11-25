/* Rutas por hash (puro, sin DOM: lo prueban los tests).
   Formato: #/<vista>?param=valor&…   p. ej. #/precios?seg=publica&precio=0-20000
   Compatibilidad: #pais=pe&q=… (filtros antiguos) → #/precios?…; #costos, #riesgos… (anclas antiguas) → su vista. */

export const VIEWS = ['inicio', 'precios', 'calculadora', 'retorno', 'mundo', 'fuentes'];
export const DEFAULT_VIEW = 'inicio';

/** Parámetro con el id de un elemento al que desplazarse dentro de la vista. */
export const ANCHOR_PARAM = 'ir';

/** Parámetros del hash que son filtros del listado de precios. */
export const FILTER_PARAMS = ['q', 'mod', 'seg', 'precio', 'acr', 'sede', 'orden'];

/** Anclas de la página de una sola columna → [vista, ancla dentro de la vista (null = arriba)]. */
export const LEGACY_ANCHORS = {
  top: ['inicio', null], kpis: ['inicio', null],
  costos: ['precios', null], segmentos: ['precios', 'segmentos'], be: ['precios', 'be'],
  calculadora: ['calculadora', null],
  retorno: ['retorno', null], riesgos: ['retorno', 'riesgos'],
  mundo: ['mundo', null],
  apoya: ['fuentes', 'apoya'], fuentes: ['fuentes', null],
};

const ANCHOR_RE = /^[A-Za-z][\w-]{0,59}$/;
export const safeAnchor = a => (typeof a === 'string' && ANCHOR_RE.test(a) ? a : null);

const toObj = qs => Object.fromEntries([...new URLSearchParams(qs)].filter(([, v]) => v !== ''));

/**
 * @param {string} hash location.hash (con o sin '#')
 * @returns {{view: string|null, params: Object<string,string>, anchor: string|null, legacy: boolean}}
 *   view = null solo si es un ancla desconocida (#ref-3): la resuelve el DOM.
 *   legacy = true si el hash no está en el formato canónico y conviene reescribirlo.
 */
export function parseHash(hash) {
  const h = String(hash || '').replace(/^#/, '');
  if (!h) return {view: DEFAULT_VIEW, params: {}, anchor: null, legacy: false};
  if (h.startsWith('/')) {
    const [path, qs = ''] = h.slice(1).split('?');
    const params = toObj(qs);
    const anchor = safeAnchor(params[ANCHOR_PARAM]);
    delete params[ANCHOR_PARAM];
    const v = path.replace(/\/+$/, '');
    if (VIEWS.includes(v)) return {view: v, params, anchor, legacy: false};
    return {view: DEFAULT_VIEW, params, anchor, legacy: true};
  }
  if (h.includes('=')) {                      // filtros antiguos: #pais=pe&q=…
    const params = toObj(h);
    const view = FILTER_PARAMS.some(k => params[k]) ? 'precios' : DEFAULT_VIEW;
    return {view, params, anchor: null, legacy: true};
  }
  const id = safeAnchor(decodeURIComponent(h));
  if (!id) return {view: DEFAULT_VIEW, params: {}, anchor: null, legacy: true};
  if (LEGACY_ANCHORS[id]) { const [view, anchor] = LEGACY_ANCHORS[id]; return {view, params: {}, anchor, legacy: true}; }
  return {view: null, params: {}, anchor: id, legacy: true};
}

/** Hash canónico. Omite valores vacíos; `anchor` va como ?ir=. */
export function buildHash(view, params = {}, anchor = null) {
  const v = VIEWS.includes(view) ? view : DEFAULT_VIEW;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, val]) => { if (val != null && val !== '' && k !== ANCHOR_PARAM) qs.set(k, String(val)); });
  const a = safeAnchor(anchor);
  if (a) qs.set(ANCHOR_PARAM, a);
  const s = qs.toString();
  return `#/${v}${s ? '?' + s : ''}`;
}
