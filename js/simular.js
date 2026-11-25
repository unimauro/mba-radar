/* Modelo financiero de la calculadora (puro, sin DOM: se prueba con node --test). */

const MESES = 12, SUELDOS_ANIO = 14;
const TIR_MAX_MENSUAL = 1;         // cota superior de la bisección (100 % mensual)
const TIR_ITERACIONES = 80;

/**
 * Flujo mensual descontado de un MBA.
 * @param {object} o
 * @param {number} o.C  costo total del programa
 * @param {number} o.D  duración en meses
 * @param {number} o.S  sueldo bruto mensual (se cobran 14 al año)
 * @param {boolean} o.ft full-time: deja de percibir el sueldo durante el programa
 * @param {number} o.p  aumento salarial atribuible (0.17 = 17 %)
 * @param {number} o.H  horizonte en años
 * @param {number} o.r  tasa de descuento anual
 * @param {number} [o.t=0] tasa marginal de impuesto: grava el aumento y el sueldo perdido, no la matrícula
 * @returns {{npv:number, pay:number|null, irr:number|null, anual:number[], pEq:number|null, costoTotal:number}}
 *   pay = mes de recuperación; irr = TIR anual (Infinity si nunca se vuelve negativa); pEq = aumento de equilibrio.
 */
export function simular({C, D, S, ft, p, H, r, t = 0}) {
  const meses = Math.round(H * MESES);
  const rm = Math.pow(1 + r, 1 / MESES) - 1;
  const sueldoMes = S * SUELDOS_ANIO / MESES;
  const neto = 1 - t;
  const costoMes = C / D + (ft ? sueldoMes * neto : 0);
  const gananciaMes = sueldoMes * neto;

  const flows = [];
  for (let m = 0; m < meses; m++) flows.push(m < D ? -C / D - (ft ? sueldoMes * neto : 0) : sueldoMes * p * neto);

  let acc = 0, pay = null;
  const anual = [0];
  flows.forEach((f, m) => {
    acc += f / Math.pow(1 + rm, m + 1);
    if (pay == null && m >= D && acc >= 0) pay = m + 1;
    if ((m + 1) % MESES === 0) anual.push(acc);
  });

  // El VAN es lineal en p: p de equilibrio = VP(costos) / VP(ganancia por unidad de p).
  const pvCost = flows.reduce((a, f, m) => a + (m < D ? costoMes / Math.pow(1 + rm, m + 1) : 0), 0);
  const pvGain = flows.reduce((a, f, m) => a + (m >= D ? gananciaMes / Math.pow(1 + rm, m + 1) : 0), 0);

  return {npv: acc, pay, irr: tir(flows), anual, pEq: pvGain > 0 ? pvCost / pvGain : null, costoTotal: C + (ft ? sueldoMes * D : 0)};
}

/** TIR anual por bisección sobre la tasa mensual. */
function tir(flows) {
  const npvAt = rate => flows.reduce((a, f, m) => a + f / Math.pow(1 + rate, m + 1), 0);
  if (!(npvAt(0) > 0)) return null;
  let lo = 0, hi = TIR_MAX_MENSUAL;
  if (!(npvAt(hi) < 0)) return Infinity;
  for (let i = 0; i < TIR_ITERACIONES; i++) {
    const mid = (lo + hi) / 2;
    if (npvAt(mid) > 0) lo = mid; else hi = mid;
  }
  return Math.pow(1 + lo, MESES) - 1;
}
