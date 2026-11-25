/* Sección Costos: barras por programa, nota, tabla completa y tarjetas por segmento. */
import {COLOR, SEG_COLOR, SEG_ORDER} from './constants.js';
import {$, esc, median, safeUrl} from './util.js';
import {data, money} from './state.js';
import {advertencias, programasConCosto, tieneCosto, unicos} from './data.js';
import {filtrados, ordenar} from './filters.js';
import {acreditacionTxt, barList, confBadge, detalleHTML, usdNota} from './bars.js';
import {ref} from './refs.js';
import {simularPrograma} from './calc.js';
import {goToSection} from './navigation.js';

/** 'min' | 'max' | '' según sea el programa más barato o más caro del país. */
export const extremoDe = p => p.id === data.extremos.min ? 'min' : p.id === data.extremos.max ? 'max' : '';

export function renderCostos() {
  const P = data.pais;
  const rows = ordenar(filtrados());
  const conPrecio = rows.filter(tieneCosto);
  const box = $('box-costos');
  box.hidden = !P.programas.length;
  barList('costos', box, $('ch-costos'), conPrecio.map(p => ({p, v: p.costo_soles, txt: money(p.costo_soles), color: SEG_COLOR[p.segmento] || COLOR.gris, hl: extremoDe(p)})), {
    aria: 'Costo total de programas MBA', redraw: renderCostos, detail: r => detalleHTML(r.p),
    onSim: r => { simularPrograma(r.p); goToSection('calculadora'); },
  });
  $('costos-nota').innerHTML = notaCostos(rows, conPrecio);
  $('tb-costos').innerHTML = tablaCostos(rows);
}

function notaCostos(rows, conPrecio) {
  const P = data.pais;
  if (!P.programas.length) return 'Relevamiento de precios en curso: esta sección se actualiza en las próximas horas.';
  const sin = rows.length - conPrecio.length;
  return `${conPrecio.length} filas con precio, ${unicos(conPrecio).length} programas únicos (algunas sedes o modalidades comparten precio). ${sin ? `${sin} sin precio público (en la tabla). ` : ''}Precios en dólares convertidos a ${esc(data.simbolo)} ${esc(P.pais.tc_usd)} por US$ ${ref('tc', P.pais.tc_fuente || 'Tipo de cambio', P.pais.tc_url)}. Toca una barra para ver el detalle y simularla.`;
}

const avisosHTML = p => advertencias(p).map(a => `<br><small class="cx-aviso">${esc(a)}</small>`).join('');

/* Columnas de la tabla: [clase, encabezado, etiqueta en móvil (vacía = sin etiqueta), celda(p)].
   En móvil cada fila es una tarjeta: la etiqueta sale de data-label y la posición de la clase (styles.css),
   así que agregar o mover columnas no desordena las etiquetas. */
const COLUMNAS = [
  ['t-uni', 'Universidad', '', p => esc(p.universidad)],
  ['t-prog', 'Programa', '', p => `${esc(p.programa)}${p.nota ? `<br><small class="empty">${esc(p.nota)}</small>` : ''}${avisosHTML(p)}`],
  ['t-mod', 'Modalidad', 'Modalidad', p => esc(p.modalidad || '—')],
  ['t-sede', 'Sede', 'Sede', p => esc(p.sede || '—')],
  ['t-dur num', 'Meses', 'Duración (meses)', p => esc(p.duracion_meses ?? '—')],
  ['t-costo num', 'Costo total', '', p => `${money(p.costo_soles)}${usdNota(p, '<br><small>US$ ', '</small>')}`],
  ['t-acr', 'Acreditación / ranking', 'Acreditación', p => esc(acreditacionTxt(p) || '—')],
  ['t-anio', 'Año', 'Año del dato', p => esc(p.anio_precio ?? '—')],
  ['t-conf', 'Dato', 'Confianza', p => confBadge(p.confianza || 'baja')],
  ['t-fuente', 'Fuente', 'Fuente', p => p.fuente_url ? `<a href="${esc(safeUrl(p.fuente_url))}" target="_blank" rel="noopener">ver</a>` : '—'],
];

function tablaCostos(rows) {
  const fila = p => `<tr>${COLUMNAS.map(([cls, , lab, cell]) => `<td class="${cls}"${lab ? ` data-label="${esc(lab)}"` : ''}>${cell(p)}</td>`).join('')}</tr>`;
  return `<thead><tr>${COLUMNAS.map(([cls, h]) => `<th class="${cls}" scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>` + rows.map(fila).join('') + '</tbody>';
}

export function renderSegmentos() {
  const cc = programasConCosto();
  $('segmentos').innerHTML = SEG_ORDER.map(s => {
    const v = unicos(cc).filter(p => p.segmento === s).map(p => p.costo_soles).sort((a, b) => a - b);
    if (!v.length) return '';
    return `<div class="card" style="border-top:4px solid ${SEG_COLOR[s]}"><h3>${esc(s)}</h3><b class="big">${money(median(v))}</b><span class="note">mediana · ${v.length} programas · rango ${money(v[0])} – ${money(v.at(-1))}</span></div>`;
  }).join('');
}
