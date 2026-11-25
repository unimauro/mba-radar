/* Gráfico "¿Cuánto tendría que subir tu sueldo?": aumento necesario por programa (#be). */
import {BE_CAP_PCT, BE_HORIZONTES, BE_IMP, BE_TASA, BE_TIERS, ORDEN_DEFAULT, PRIMA_ENAHO_PCT, PRIMA_EEUU_PCT} from './constants.js';
import {$, esc, nf0} from './util.js';
import {data, money, ui} from './state.js';
import {programasConCosto, tieneCosto} from './data.js';
import {aplicar, filtrados, ordenar} from './filters.js';
import {aumentoNecesario, sueldoBase} from './aumento.js';
import {barList, detalleHTML} from './bars.js';
import {extremoDe} from './costos.js';
import {simularPrograma} from './calc.js';
import {goToSection} from './navigation.js';

const PORCENTAJE = 100;

export function renderBE() {
  const refs = data.pais.sueldos_ref || [];
  if (!refs.length || !programasConCosto().length) { $('be').hidden = true; return; }
  $('be').hidden = false;
  renderControles(refs);
  $('be-leg').innerHTML = BE_TIERS.map(t => `<span><i style="background:${t.color}"></i>${esc(t.txt)}</span>`).join('');

  const mensual = refs[ui.base].mensual;
  const rows = filasBE();
  barList('be', $('box-be'), $('ch-be'), rows, {
    aria: 'Aumento salarial mínimo para recuperar cada MBA', cap: BE_CAP_PCT, redraw: renderBE,
    detail: r => detalleHTML(r.p, `<div class="cx-dl-hi"><dt>Aumento necesario</dt><dd><b>+${esc(nf0.format(r.v))} %</b> ≈ ${esc(money(mensual * r.v / PORCENTAJE))} más al mes (bruto), durante ${ui.H} años</dd></div>`),
    onSim: r => { simularPrograma(r.p, {sueldo: Math.round(sueldoBase(mensual))}); goToSection('calculadora'); },
  });
  $('be-nota').innerHTML = rows.length ? notaBE(rows, mensual) : '';
}

/** Chips de sueldo de partida y de horizonte. */
function renderControles(refs) {
  const alCambiar = () => { if (ui.ord === 'aumento') aplicar(); else renderBE(); };
  $('be-base').innerHTML = refs.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="${i === ui.base}">${esc(r.etiqueta)}: ${money(r.mensual)}/mes</button>`).join('');
  $('be-base').onclick = e => { const b = e.target.closest('button'); if (b) { ui.base = +b.dataset.i; alCambiar(); } };
  let hz = $('be-hor');
  if (!hz) {
    hz = document.createElement('div');
    hz.id = 'be-hor'; hz.className = 'chips';
    hz.setAttribute('role', 'group'); hz.setAttribute('aria-label', 'Horizonte');
    $('be-base').after(hz);
  }
  hz.innerHTML = '<span class="note" style="align-self:center;margin:0">El aumento dura:</span>' + BE_HORIZONTES.map(h => `<button type="button" data-h="${h}" aria-pressed="${h === ui.H}">${h} años</button>`).join('');
  hz.onclick = e => { const b = e.target.closest('button'); if (b) { ui.H = +b.dataset.h; alCambiar(); } };
}

/** Programas filtrados con precio; con el orden por defecto ("más caro") se ordenan por aumento necesario. */
function filasBE() {
  const base = ordenar(filtrados().filter(tieneCosto));
  const ordenados = ui.ord === ORDEN_DEFAULT ? [...base].sort((a, b) => (aumentoNecesario(b) ?? -1) - (aumentoNecesario(a) ?? -1)) : base;
  return ordenados.map(p => {
    const v = aumentoNecesario(p) ?? 0;
    return {p, v, txt: `+${nf0.format(v)} %`, color: BE_TIERS.find(t => v <= t.max).color, hl: extremoDe(p)};
  });
}

function notaBE(rows, mensual) {
  const masDe = t => rows.filter(x => x.v > t).length;
  return `Con un sueldo de partida de ${money(mensual)} al mes, <b>${masDe(PRIMA_ENAHO_PCT)} de ${rows.length}</b> programas exigen un aumento mayor que la diferencia promedio de sueldos entre posgraduados y universitarios en el Perú (+${PRIMA_ENAHO_PCT} %, ENAHO), y <b>${masDe(PRIMA_EEUU_PCT)}</b> exigen más que el +${PRIMA_EEUU_PCT} % estimado para el MBA en EE.UU. Supuestos: el aumento dura ${ui.H} años, descuento ${Math.round(BE_TASA * PORCENTAJE)} % anual, impuesto marginal ${Math.round(BE_IMP * PORCENTAJE)} %. Sueldos de referencia: ENAHO 2024 (universitarios completos de 25-64 años) y AméricaEconomía (sueldo previo de postulantes a Pacífico). Barras cortadas en +${BE_CAP_PCT} % (›). ${ui.ord === ORDEN_DEFAULT ? 'Ordenado por aumento necesario. ' : ''}Toca una barra para ver el detalle.`;
}
