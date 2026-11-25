/* Vista Inicio: tarjetas de resumen que llevan a cada vista (con una cifra viva de cada una)
   y pie de cada vista (siguiente vista + compartir). Sin ref(): no altera la numeración de fuentes. */
import {SEGMENTO} from './constants.js';
import {$, esc, lowerMedian, nf0} from './util.js';
import {data, money} from './state.js';
import {programasPorCosto, unicos} from './data.js';
import {VIEWS} from './route.js';
import {shareBar, siteUrl} from './share.js';

const PORCENTAJE = 100;

/** Textos para compartir cada vista (sin datos personales). */
const SHARE_TXT = {
  inicio: '¿Vale la pena un MBA en el Perú? Precios de cada programa, calculadora de retorno y evidencia con fuentes.',
  precios: 'Lo que cuesta un MBA en el Perú, programa por programa, con fuente de cada precio.',
  calculadora: 'Antes de pagar un MBA, haz tus números: ¿en cuántos años lo recuperas?',
  retorno: '¿Cuánto más gana quien tiene posgrado en el Perú? La evidencia, sin promesas.',
  mundo: 'Afuera, el MBA ya no es la apuesta segura que era: postulaciones, empleo y salarios.',
  fuentes: 'MBA Radar: datos abiertos y fuentes verificables sobre el costo y el retorno del MBA.',
};
const NEXT_TXT = {
  inicio: 'Ver los precios', precios: 'Simula un programa en la calculadora', calculadora: 'Ver la evidencia de retorno',
  retorno: 'Ver el contexto mundial', mundo: 'Ver fuentes y metodología', fuentes: 'Volver al inicio',
};

function cards() {
  const P = data.pais, cc = programasPorCosto(), u = unicos(cc);
  const e = P.enaho_resumen, bajo = P.alertas?.find(a => a.id === 'enaho_bajo_mediana');
  const pct = bajo?.pct_misma_edad ?? bajo?.pct;
  const post = data.global?.hartley?.series?.postulaciones_fall2026?.puntos || [];
  const peor = post.length ? post.reduce((a, b) => (b[1] < a[1] ? b : a)) : null;
  const nRefs = document.querySelectorAll('#refs li').length;
  const med = lowerMedian(u.map(p => p.costo_soles).sort((a, b) => a - b));
  const ref = P.sueldos_ref?.[0];
  const mPub = lowerMedian(u.filter(p => p.segmento === SEGMENTO.publica).map(p => p.costo_soles).sort((a, b) => a - b));
  return [
    cc.length ? {v: 'precios', k: 'Precios', b: `${nf0.format(u.length)}`, u: 'programas con precio', t: `De ${money(cc[0].costo_soles)} a ${money(cc.at(-1).costo_soles)}. Mediana: ${money(med)}${mPub ? `; en universidades públicas, ${money(mPub)}` : ''}.`, cta: 'Comparar precios'} : null,
    med && ref ? {v: 'calculadora', k: 'Calculadora', b: `${nf0.format(med / ref.mensual)}`, u: 'sueldos', t: `cuesta el MBA mediano a un universitario típico (${money(ref.mensual)} al mes). ¿En cuántos años lo recuperas?`, cta: 'Simular mi caso'} : null,
    e ? {v: 'retorno', k: 'Retorno', b: `+${nf0.format(e.prima_pct)} %`, u: 'prima del posgrado', t: `en sueldo frente a universitarios comparables${pct ? `; pero 1 de cada ${Math.round(PORCENTAJE / pct)} gana menos que el universitario típico de su edad` : ''}.`, cta: 'Ver la evidencia'} : null,
    peor ? {v: 'mundo', k: 'Mundo', b: `${peor[1] < 0 ? '−' : '+'}${nf0.format(Math.abs(peor[1]))} %`, u: 'postulaciones', t: `${peor[0]} para la clase de otoño 2026. Menos postulantes y más egresados sin oferta de trabajo.`, cta: 'Ver el contexto'} : null,
    {v: 'fuentes', k: 'Fuentes', b: `${nf0.format(nRefs)}`, u: 'fuentes citadas', t: 'Metodología, datos abiertos (CSV y JSON) y cómo apoyar este proyecto independiente.', cta: 'Revisar fuentes'},
  ].filter(Boolean);
}

export function renderResumen() {
  $('resumen').innerHTML = cards().map(c => `<a class="rs-card rs-${esc(c.v)}" href="#/${esc(c.v)}">
      <span class="rs-k">${esc(c.k)}</span>
      <span class="rs-n"><b>${esc(c.b)}</b> <span>${esc(c.u)}</span></span>
      <span class="rs-t">${esc(c.t)}</span>
      <span class="rs-cta">${esc(c.cta)} <span aria-hidden="true">→</span></span></a>`).join('');
}

/** Pie de cada vista: enlace a la siguiente + compartir. Se monta una vez. */
export function renderViewFeet() {
  VIEWS.forEach((v, i) => {
    const view = document.getElementById('v-' + v);
    if (!view) return;
    let foot = view.querySelector(':scope > .view-foot');
    if (!foot) {
      foot = document.createElement('div');
      foot.className = 'view-foot';
      view.appendChild(foot);
    }
    const next = VIEWS[(i + 1) % VIEWS.length];
    foot.innerHTML = `<div class="wrap view-foot-in"><a class="vf-next" href="#/${esc(next)}"><small>Siguiente</small><span>${esc(NEXT_TXT[v])} <span aria-hidden="true">→</span></span></a><div class="vf-share"></div></div>`;
    shareBar(foot.querySelector('.vf-share'), {url: siteUrl(v === 'inicio' ? '' : v), text: SHARE_TXT[v], label: v === 'inicio' ? 'Comparte con quien esté pensando en un MBA' : 'Compartir esta vista'});
  });
  const hero = document.getElementById('hero-share');
  if (hero) shareBar(hero, {url: siteUrl(''), text: SHARE_TXT.inicio, label: 'Compartir', dark: true});
}

