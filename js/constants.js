/* Constantes de dominio y de presentación compartidas por todos los módulos. */

export const COLOR = {
  azul: '#257de0', naranja: '#f47230', verdeAgua: '#00b894', rojo: '#dc3c3d', vino: '#b3122e',
  verde: '#1f7a55', verdeTexto: '#14583b', rojoTexto: '#8f1d1e', ambar: '#f2a600', gris: '#8a847c',
  ink: '#1c1a17', ink2: '#5b5650', grid: '#eee9e1',
};

export const SEGMENTO = {
  escuela: 'Escuela de negocios con acreditación internacional',
  privada: 'Universidad privada',
  publica: 'Universidad pública',
};
export const SEG_COLOR = {[SEGMENTO.escuela]: COLOR.azul, [SEGMENTO.privada]: COLOR.naranja, [SEGMENTO.publica]: COLOR.verdeAgua};
export const SEG_ORDER = Object.keys(SEG_COLOR);
export const SEG_KEY = Object.fromEntries(Object.entries(SEGMENTO).map(([k, v]) => [v, k]));
export const SEG_CORTO = {escuela: 'Escuela de negocios', privada: 'Universidad privada', publica: 'Universidad pública'};

export const SIGNO_TXT = {positivo: 'Retorno positivo', negativo: 'Retorno negativo / riesgo', mixto: 'Mixto', neutral: 'Contexto'};
export const ORDEN = {caro: 'Más caro', barato: 'Más barato', corto: 'Más corto', aumento: 'Mayor aumento necesario'};
export const ORDEN_DEFAULT = 'caro';
export const ACREDITACION_RE = /AACSB|AMBA|EQUIS|BGA|ACBSP|IACBE/i;
export const MODALIDAD_FULL_TIME = 'Full-time';

export const TOP_N = 15;                    // barras visibles antes de "Ver todos"
export const TOP_N_HOLGURA = 3;             // si sobran ≤ 3, se muestran todas
export const MAX_SUGERENCIAS = 40;          // opciones del combobox
export const MAX_QUERY = 80;                // largo máximo de ?q= en el hash

export const MESES_ANIO = 12;
export const SUELDOS_ANIO = 14;             // 12 + gratificaciones de julio y diciembre
export const DURACION_DEFAULT = 18;         // meses, si el programa no publica duración

/* Gráfico "aumento necesario" (break-even): supuestos fijos. */
export const BE_TASA = 0.08, BE_IMP = 0.14, BE_HORIZONTES = [10, 20, 30], BE_CAP_PCT = 400;
export const PRIMA_EEUU_PCT = 17, PRIMA_ENAHO_PCT = 61;
export const BE_TIERS = [
  {max: PRIMA_EEUU_PCT, color: COLOR.verde, txt: 'Hasta 17 %: dentro del efecto estimado del MBA en EE.UU.'},
  {max: PRIMA_ENAHO_PCT, color: COLOR.ambar, txt: '17–61 %: más que ese efecto; dentro de la diferencia observada en Perú (que incluye selección)'},
  {max: Infinity, color: COLOR.rojo, txt: 'Más de 61 %: más que la diferencia promedio entre posgraduados y universitarios (ENAHO)'},
];

export const PAGO_RAPIDO_ANIOS = 5;         // recuperación ≤ 5 años = veredicto positivo
export const CALC_DEFAULT = {costo: 60000, duracion: 18, sueldo: 6000};

export const DEBOUNCE_MS = {busqueda: 180, estudios: 120, calc: 120, breakpoint: 150};
