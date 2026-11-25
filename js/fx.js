/* Efectos sutiles (todos se desactivan con prefers-reduced-motion):
   - count-up de cifras al entrar en pantalla
   - barras HTML (.cx-bars-host, .cx-rng) que crecen al aparecer
   - aparición suave de bloques (.reveal)
   Sin IntersectionObserver o con movimiento reducido no se hace nada y todo queda visible. */
import {prefersReducedMotion} from './util.js';
import {formatCifra, parseCifra} from './cifra.js';

const COUNT_MS = 750;
const CIFRAS = '.shock b, #hero-max, .kpis .kpi b, .card b.big, .hall b, .bigstat, .rs-card b, .ft-stat b';
const REVEAL = '.view .sec-h, .view .panel, .view .card, .view .be, .view .calc, .view .study, .view .apoya, .rs-card, .ft-stat';
const GROW = '.cx-bars-host, .cx-rngs';

let io = null;
let activo = false;

const easeOut = t => 1 - Math.pow(1 - t, 3);

function countUp(el) {
  const final = el.textContent;
  const c = parseCifra(final);
  if (!c) return;
  const t0 = performance.now();
  el.dataset.fxFinal = final;
  const step = now => {
    if (el.dataset.fxFinal !== final) return;            // se redibujó mientras tanto
    const k = Math.min(1, (now - t0) / COUNT_MS);
    el.textContent = k < 1 ? formatCifra(c, c.value * easeOut(k)) : final;
    if (k < 1) requestAnimationFrame(step); else delete el.dataset.fxFinal;
  };
  el.textContent = formatCifra(c, 0);
  requestAnimationFrame(step);
}

function onIntersect(entries) {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    io.unobserve(el);
    if (el.matches(GROW)) el.classList.add('cx-seen');
    if (el.classList.contains('reveal')) el.classList.add('in');
    if (el.dataset.fxCount === '1') { el.dataset.fxCount = 'done'; countUp(el); }
  });
}

/** Registra los elementos nuevos (llamar después de cada render). Idempotente. */
export function fxScan(root = document) {
  if (!activo) return;
  root.querySelectorAll(GROW).forEach(el => { if (!el.dataset.fxObs) { el.dataset.fxObs = '1'; io.observe(el); } });
  root.querySelectorAll(REVEAL).forEach(el => {
    if (el.dataset.fxObs) return;
    el.dataset.fxObs = '1'; el.classList.add('reveal'); io.observe(el);
  });
  root.querySelectorAll(CIFRAS).forEach(el => {
    if (el.dataset.fxCount) return;
    el.dataset.fxCount = '1';
    io.observe(el);
  });
}

export function setupFx() {
  activo = 'IntersectionObserver' in window && !prefersReducedMotion();
  if (!activo) return;
  document.documentElement.classList.add('fx');
  io = new IntersectionObserver(onIntersect, {rootMargin: '0px 0px -6% 0px', threshold: 0.01});
  // Las cifras se reemplazan con innerHTML al redibujar: re-escanear cuando cambia el DOM de main.
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; fxScan(); });
  }).observe(document.querySelector('main'), {childList: true, subtree: true});
}
