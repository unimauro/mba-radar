/* MBA Radar — punto de entrada. Carga datos, dibuja TODAS las vistas una vez y arranca el router.
   Datos: data/paises/index.json (países), data/paises/<code>.json (país), data/global.json (evidencia mundial).
   Vistas: #/inicio #/precios #/calculadora #/retorno #/mundo #/fuentes (router.js; formato del hash en route.js).
   Estilos de los componentes cx-*: charts.css. Chart.js es global (CDN con defer, se ejecuta antes que este módulo). */
import {DEBOUNCE_MS} from './constants.js';
import {$, debounce, esc, mobileQuery} from './util.js';
import {data, resetBarState} from './state.js';
import {loadIndexAndGlobal, loadPais} from './data.js';
import {resetRefs, renderFuentes} from './refs.js';
import {clearAumentoCache} from './aumento.js';
import {filterParams, paisEnHash, readHash, renderFiltros, syncFiltros} from './filters.js';
import {renderHero} from './kpis.js';
import {renderCostos, renderSegmentos} from './costos.js';
import {renderBE} from './breakeven.js';
import {calc, resetCalcChart, setupCalc} from './calc.js';
import {renderMundo, renderRetorno, renderRiesgos} from './evidencia.js';
import {renderDistribucion, renderMundoGraf, renderTendencia} from './evidencia-graf.js';
import {renderMeses, renderPreciosGraf} from './precios-graf.js';
import {renderResumen, renderViewFeet} from './inicio.js';
import {resizeCharts, setChartDefaults, setChartFontSize} from './charts-common.js';
import {setupPageChrome} from './page-chrome.js';
import {earlyView, initialParams, startRouter} from './router.js';
import {fxScan, setupFx} from './fx.js';

/** Redibuja lo que depende de los filtros de precios. */
function renderListados() { renderCostos(); renderMeses(); renderBE(); }

/** Todas las vistas, en orden: la numeración de referencias [n] sigue este orden y Fuentes va al final.
    Se llama una vez por país; después el router solo muestra u oculta vistas. */
function renderAll() {
  renderHero();
  renderFiltros(renderListados);
  renderCostos(); renderSegmentos(); renderPreciosGraf(); renderBE();
  setupCalc();
  renderRetorno(); renderTendencia(); renderDistribucion(); renderRiesgos();
  renderMundo(); renderMundoGraf();
  renderFuentes();
  renderResumen();
  renderViewFeet();
  fxScan();
}

async function showPais(code, params) {
  await loadPais(code);
  resetRefs(); clearAumentoCache();
  document.querySelectorAll('#paises button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === code));
  const P = data.pais.pais;
  $('hero-eyebrow').textContent = `${P.nombre} · datos a ${P.fecha_texto || P.fecha}`;
  readHash(params || {});
  resetBarState();
  renderAll();
}

function renderPaises(idx, actual) {
  $('paises').innerHTML = idx.paises.map(p => `<button data-c="${esc(p.code)}" ${p.listo ? '' : 'disabled title="Próximamente"'} aria-pressed="${p.code === actual}">${esc(p.bandera || '')} ${esc(p.nombre)}</button>`).join('');
  $('paises').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) showPais(b.dataset.c, null); };
}

/* Al cruzar 640 px (p. ej. al girar el teléfono) cambian fuentes, alturas y etiquetas: recrear los charts de canvas. */
function onBreakpoint() {
  if (!data.pais) return;
  setChartFontSize();
  renderPreciosGraf();
  renderRetorno(); renderTendencia(); renderRiesgos(); renderMundo(); renderMundoGraf();
  resetCalcChart(); calc();
  resizeCharts();
}

/** Antes de mostrar cada vista: país del hash y filtros de #/precios. Devuelve los parámetros canónicos. */
function onRoute(view, params, initial) {
  if (!initial && params.pais && params.pais !== data.pais?.pais?.code) {
    const btn = document.querySelector(`#paises button[data-c="${CSS.escape(params.pais)}"]`);
    if (btn && !btn.disabled) showPais(params.pais, params);
  }
  if (view !== 'precios') return null;
  if (!initial && syncFiltros(params)) renderListados();
  return filterParams();
}

async function init() {
  const idx = await loadIndexAndGlobal();
  const params = initialParams();
  const want = paisEnHash() || idx.default;
  renderPaises(idx, want);
  setChartDefaults();
  mobileQuery().addEventListener?.('change', debounce(onBreakpoint, DEBOUNCE_MS.breakpoint));
  await showPais(want, params);
  startRouter(onRoute);
}

setupPageChrome();
earlyView();
setupFx();
init().catch(err => {
  console.error(err);
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="wrap empty">No se pudieron cargar los datos (${esc(err.message)}).</p>`);
});
