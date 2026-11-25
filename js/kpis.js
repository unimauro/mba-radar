/* Portada: cifras de impacto (#shock), titular con el precio máximo y fila de KPIs. */
import {SEGMENTO} from './constants.js';
import {$, esc, lowerMedian, nf0} from './util.js';
import {data, money} from './state.js';
import {nombreCorto, programasComparables, programasPorCosto, unicos} from './data.js';

const PORCENTAJE = 100, MIL = 1000;

/** Más barato y más caro entre los comparables (o entre todos si no hay comparables). */
function extremosKPI(cc) {
  const comp = programasComparables(), base = comp.length ? comp : cc;
  return {min: base[0], max: base.at(-1)};
}

export function renderHero() {
  renderShock();
  renderKPIs();
}

function renderShock() {
  const P = data.pais, cc = programasPorCosto(), {min, max} = extremosKPI(cc);
  if (max) $('hero-max').textContent = `${data.simbolo} ${nf0.format(Math.round(max.costo_soles / MIL))} mil`;
  const bajo = P.alertas?.find(a => a.id === 'enaho_bajo_mediana');
  const pct = bajo?.pct_misma_edad ?? bajo?.pct ?? null;
  const med = s => lowerMedian(unicos(cc).filter(p => p.segmento === s).map(p => p.costo_soles).sort((a, b) => a - b));
  const mAcr = med(SEGMENTO.escuela), mPub = med(SEGMENTO.publica);
  const ofe = P.oferta;
  const items = [
    pct ? {b: `1 de cada ${Math.round(PORCENTAJE / pct)}`, r: 1, s: `con maestría o doctorado gana menos que el universitario típico de su misma edad (INEI, ENAHO 2024)`} : null,
    max && min ? {b: `×${nf0.format(max.costo_soles / min.costo_soles)}`, s: `entre el MBA más caro (${nombreCorto(max)}${/doble grado/i.test(max.programa) ? ', doble grado internacional' : ''}) y el más barato (${nombreCorto(min)}${min.modalidad_grupo === 'Online' ? ', virtual' : ''}). ¿Te pagarán ${nf0.format(max.costo_soles / min.costo_soles)} veces más?`}
      : ofe ? {b: ofe.titulo.split(' ')[0], s: `maestrías ofrecidas en el Perú (SUNEDU). Oferta masiva, calidad dispareja.`} : null,
    P.enaho_resumen ? {b: `+${nf0.format(P.enaho_resumen.prima_pct)} %`, s: 'gana en promedio quien tiene posgrado… pero buena parte ya ganaba más antes de estudiarlo'} : null,
    mAcr && mPub ? {b: `×${nf0.format(mAcr / mPub)}`, r: 1, s: `cuesta, en mediana, un MBA de escuela acreditada frente a uno de universidad pública. La evidencia: el retorno es menor en programas peor rankeados y part-time.`} : null,
  ].filter(Boolean);
  $('shock').innerHTML = items.map(x => `<div><b class="${x.r ? 'r' : ''}">${esc(x.b)}</b><span>${esc(x.s)}</span></div>`).join('');
}

const kpiHTML = x => `<div class="kpi"><b>${esc(x.b)}</b><span>${esc(x.s)}</span><small>${esc(x.m)}</small></div>`;

function renderKPIs() {
  const P = data.pais, cc = programasPorCosto(), e = P.enaho_resumen;
  if (!cc.length) {
    $('kpis').innerHTML = e ? [{b: `+${nf0.format(e.prima_pct)} %`, s: e.etiqueta, m: e.detalle}, {b: '…', s: 'precios por universidad', m: 'relevamiento en curso'}].map(kpiHTML).join('') : '';
    return;
  }
  const {min, max} = extremosKPI(cc);
  $('kpis').innerHTML = [
    {b: money(min.costo_soles), s: `el MBA más barato encontrado`, m: `${nombreCorto(min)} · ${min.programa}`},
    {b: money(max.costo_soles), s: `el más caro`, m: `${nombreCorto(max)} · ${max.programa}`},
    {b: `×${nf0.format(max.costo_soles / min.costo_soles)}`, s: 'diferencia entre el más caro y el más barato', m: `MBA generalistas con dato confiable · ${cc.length} programas con precio de ${P.programas.length} relevados`},
    e ? {b: `${e.prima_pct >= 0 ? '+' : ''}${nf0.format(e.prima_pct)} %`, s: e.etiqueta, m: e.detalle} : {b: '—', s: 'prima salarial del posgrado', m: 'pendiente'},
  ].map(kpiHTML).join('');
}
