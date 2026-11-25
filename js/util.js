/* Utilidades sin estado: escape de HTML, URLs seguras, formatos, búsqueda sin tildes. */

const HTML_ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => HTML_ESC[c]);

/** Solo http(s); cualquier otra cosa (javascript:, data:, inválida) → '#'. */
export function safeUrl(u) {
  try {
    const p = new URL(u);
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : '#';
  } catch { return '#'; }
}

export const $ = id => document.getElementById(id);

export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const MOBILE_QUERY = '(max-width: 639px)';
let mq = null;
export const mobileQuery = () => (mq ??= window.matchMedia(MOBILE_QUERY));
export const isMob = () => mobileQuery().matches;
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Números ---------- */
export const nf0 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 0});
export const nf1 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 1});
const MIL = 1e3, MILLON = 1e6;
export const money = (v, simbolo) => v == null ? '—' : `${simbolo} ${nf0.format(Math.round(v))}`;
export const short = v => v >= MILLON ? `${nf1.format(v / MILLON)} M` : v >= MIL ? `${nf0.format(v / MIL)} mil` : nf0.format(v);
export const cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

/** Mediana inferior (para tamaños pares toma el menor de los dos centrales). */
export const lowerMedian = sorted => sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
export const median = v => v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;

/* ---------- Búsqueda sin tildes con resaltado ---------- */
/** Texto plegado (sin tildes, minúsculas) con mapa de posiciones al original. */
function fold(s) {
  s = String(s ?? '');
  let f = '';
  const map = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    f += c;
    for (let k = 0; k < c.length; k++) map.push(i);
  }
  return {f, map};
}
export const norm = s => fold(s).f;
export const terms = q => norm(q).split(/\s+/).filter(Boolean);
export const matchAll = (txt, ts) => { const f = norm(txt); return ts.every(t => f.includes(t)); };

/** Escapa `txt` y envuelve en <mark> cada aparición de los términos. */
export function highlight(txt, ts) {
  txt = String(txt ?? '');
  if (!ts.length) return esc(txt);
  const {f, map} = fold(txt), on = new Array(txt.length).fill(false);
  ts.forEach(t => {
    let i = f.indexOf(t);
    while (i >= 0 && t) {
      for (let k = i; k < i + t.length; k++) on[map[k]] = true;
      i = f.indexOf(t, i + t.length);
    }
  });
  let out = '', open = false;
  for (let i = 0; i < txt.length; i++) {
    if (on[i] !== open) { out += on[i] ? '<mark>' : '</mark>'; open = on[i]; }
    out += esc(txt[i]);
  }
  return out + (open ? '</mark>' : '');
}
