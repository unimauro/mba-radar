/* Estado compartido. Un único objeto mutable por tipo de estado: los módulos leen y escriben aquí. */
import {ORDEN_DEFAULT} from './constants.js';
import {money as fmtMoney} from './util.js';

/** Datos cargados (data.js los llena una vez por país). */
export const data = {
  pais: null,          // data/paises/<code>.json
  global: null,        // data/global.json
  simbolo: '',         // símbolo de moneda del país
  extremos: {min: null, max: null},   // ids del programa más barato / más caro
};

/** Filtros del listado de costos (se reflejan en el hash). */
export const FILTER_KEYS = ['modalidad', 'seg', 'rng', 'acr', 'sede'];

/** Estado de la interfaz. */
export const ui = {
  modalidad: '', seg: '', rng: '', acr: '', sede: '', ord: ORDEN_DEFAULT, q: '',
  pick: null,                     // programa elegido en la calculadora
  base: 2, H: 10,                 // sueldo de partida (índice en sueldos_ref) y horizonte del gráfico de aumento
  open: {costos: false, be: false},   // listas de barras expandidas
  det: {costos: null, be: null},      // id del programa con detalle abierto
  fpOpen: false,                  // panel de filtros abierto (móvil)
};

export function resetFilters() {
  FILTER_KEYS.forEach(k => { ui[k] = ''; });
  ui.q = '';
  ui.ord = ORDEN_DEFAULT;
}

export function resetBarState() {
  ui.open = {costos: false, be: false};
  ui.det = {costos: null, be: null};
}

/** Instancias de Chart.js por clave. */
export const charts = {};

export const money = (v, s = data.simbolo) => fmtMoney(v, s);
