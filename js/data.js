/* Carga de datos (una vez por país) y consultas derivadas sobre los programas. */
import {ACREDITACION_RE} from './constants.js';
import {data} from './state.js';

const SIMBOLO_DEFAULT = 'S/';

async function getJSON(url) {
  const r = await fetch(url, {cache: 'no-cache'});
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.json();
}

/** Índice de países + evidencia mundial. Devuelve el índice. */
export async function loadIndexAndGlobal() {
  const idx = await getJSON('data/paises/index.json');
  data.global = await getJSON('data/global.json');
  if (idx.default) data.paisDefault = idx.default;
  return idx;
}

/* Distribución de ingresos (p25 / mediana / p75) de universitarios y posgraduados por año.
   Se usa enaho_panel.distribucion si build.py la incluye en el JSON del país; si no, para el Perú se lee
   la salida del ETL (data/retornos/enaho_prima.json). Es opcional: si falla, el gráfico se oculta. */
const DIST_ETL = {pe: 'data/retornos/enaho_prima.json'};
const DIST_KEYS = ['universitaria_completa', 'posgrado'];

async function loadDistribucion(code) {
  const ya = data.pais.enaho_panel?.distribucion;
  if (ya) return ya;
  if (!DIST_ETL[code]) return null;
  try {
    const e = await getJSON(DIST_ETL[code]);
    const out = {};
    Object.entries(e.resultados?.por_anio || {}).forEach(([anio, r]) => {
      const d = r.descriptivo;
      if (d && DIST_KEYS.every(k => d[k]?.p25_mes && d[k]?.mediana_mes && d[k]?.p75_mes)) {
        out[anio] = Object.fromEntries(DIST_KEYS.map(k => [k, {p25: d[k].p25_mes, mediana: d[k].mediana_mes, p75: d[k].p75_mes, n: d[k].n_muestra}]));
      }
    });
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

export async function loadPais(code) {
  data.pais = await getJSON(`data/paises/${code}.json`);
  data.simbolo = data.pais.pais.simbolo || SIMBOLO_DEFAULT;
  data.pais.programas.forEach(p => { p._sede = sedeGrupo(p.sede); p._acr = ACREDITACION_RE.test(p.acreditaciones || ''); });
  const cc = programasComparables();
  data.extremos = {min: cc[0]?.id ?? null, max: cc.at(-1)?.id ?? null};
  data.dist = await loadDistribucion(code);
}

/** Agrupa la sede libre en una ciudad ("Lima (San Isidro)" → "Lima"). */
function sedeGrupo(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (/^(online|regiones|virtual)/i.test(t)) return 'Online';
  if (/^sedes\b/i.test(t)) return 'Varias sedes';
  return t.split(/\s*[(/+]\s*/)[0].trim();
}

export const tieneCosto = p => p.costo_soles > 0;

/** Programas con precio, en el orden de los datos. */
export const programasConCosto = () => data.pais.programas.filter(tieneCosto);
/** Programas con precio, de más barato a más caro. */
export const programasPorCosto = () => programasConCosto().sort((a, b) => a.costo_soles - b.costo_soles);

export const nombreCorto = p => p.siglas || p.universidad;

/** Programas que entran en los extremos (mín./máx./×N): MBA generalistas con dato de confianza media o alta. */
export const esComparable = p => p.es_mba_generalista !== false && p.confianza !== 'baja';
export const programasComparables = () => programasPorCosto().filter(esComparable);

/* Varias filas (sedes, modalidades) pueden repetir el mismo precio: grupo_precio las identifica. */
const claveUnica = p => p.grupo_precio || `id:${p.id}`;
/** Primera fila de cada grupo de precio. */
export function unicos(programas) {
  const vistos = new Set();
  return programas.filter(p => { const k = claveUnica(p); if (vistos.has(k)) return false; vistos.add(k); return true; });
}

/** Avisos que acompañan al precio del programa. */
export function advertencias(p) {
  return [
    p.incluye_derecho_grado === false ? 'no incluye derecho de grado' : '',
    p.es_mba_generalista === false ? 'MBA sectorial / no generalista' : '',
  ].filter(Boolean);
}
