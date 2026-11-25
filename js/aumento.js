/* Aumento salarial bruto necesario (%) para no perder dinero con un programa, con el sueldo de
   partida y el horizonte elegidos en el gráfico de aumento. Cacheado por base|horizonte|programa. */
import {BE_IMP, BE_TASA, DURACION_DEFAULT, MESES_ANIO, MODALIDAD_FULL_TIME, SUELDOS_ANIO} from './constants.js';
import {data, ui} from './state.js';
import {simular} from './simular.js';
import {tieneCosto} from './data.js';

const cache = new Map();
export const clearAumentoCache = () => cache.clear();

/** Sueldo de referencia ENAHO (ingreso anual / 12) convertido a sueldo de 14 pagos al año. */
export const sueldoBase = mensualEnaho => mensualEnaho * MESES_ANIO / SUELDOS_ANIO;

export function aumentoNecesario(p) {
  const refs = data.pais.sueldos_ref || [];
  if (!refs.length || !tieneCosto(p)) return null;
  const k = `${ui.base}|${ui.H}|${p.id}`;
  if (!cache.has(k)) {
    const r = simular({
      C: p.costo_soles, D: Math.max(1, Math.round(p.duracion_meses || DURACION_DEFAULT)),
      S: sueldoBase(refs[ui.base].mensual), ft: p.modalidad_grupo === MODALIDAD_FULL_TIME,
      p: 0, H: ui.H, r: BE_TASA, t: BE_IMP,
    });
    cache.set(k, r.pEq == null ? null : r.pEq * 100);
  }
  return cache.get(k);
}
