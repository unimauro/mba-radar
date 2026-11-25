/* Configuración común de Chart.js (global window.Chart, cargado por CDN con defer antes que los módulos). */
import {COLOR} from './constants.js';
import {$, isMob} from './util.js';
import {charts} from './state.js';

export const FONT_FAMILY = "'Atkinson Hyperlegible', system-ui, sans-serif";
const FONT_SIZE = {mobile: 11, desktop: 12};

export const hasChart = () => Boolean(window.Chart);
export const fontSize = () => isMob() ? FONT_SIZE.mobile : FONT_SIZE.desktop;

export function setChartDefaults() {
  if (!hasChart()) return;
  Chart.defaults.font.family = FONT_FAMILY;
  Chart.defaults.color = COLOR.ink2;
  Chart.defaults.borderColor = COLOR.grid;
  setChartFontSize();
}
export function setChartFontSize() { if (hasChart()) Chart.defaults.font.size = fontSize(); }

export function destroyChart(key) { charts[key]?.destroy(); charts[key] = null; }

/** Destruye el chart previo de `key` y crea uno nuevo sobre el canvas `canvasId`. */
export function makeChart(key, canvasId, config) {
  destroyChart(key);
  charts[key] = new Chart($(canvasId), config);
  return charts[key];
}

/** Recalcula el tamaño de todos los charts (p. ej. al volver a mostrar una vista oculta). */
export function resizeCharts() { Object.values(charts).forEach(c => c?.resize()); }

/** Alto del contenedor .chart-box del canvas `id`. */
export function boxH(id, h) { const c = $(id); if (c?.parentNode) c.parentNode.style.height = Math.round(h) + 'px'; }

export const legendCfg = () => ({position: isMob() ? 'bottom' : 'top', align: 'start', labels: {boxWidth: 10, boxHeight: 10, padding: isMob() ? 10 : 14, usePointStyle: false}});

/** Opciones base de todos los charts. */
export const baseOptions = () => ({responsive: true, maintainAspectRatio: false, animation: false});
