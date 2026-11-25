/* MBA Radar — punto de entrada. Carga datos y dibuja cada sección.
   Datos: data/paises/index.json (países), data/paises/<code>.json (país), data/global.json (evidencia mundial).
   Estilos de los componentes cx-*: charts.css. Chart.js es global (CDN con defer, se ejecuta antes que este módulo). */
import {DEBOUNCE_MS} from './constants.js';
import {$, debounce, esc, mobileQuery} from './util.js';
import {data, resetBarState} from './state.js';
import {loadIndexAndGlobal, loadPais} from './data.js';
import {resetRefs, renderFuentes} from './refs.js';
import {clearAumentoCache} from './aumento.js';
import {paisEnHash, readHash, renderFiltros} from './filters.js';
import {renderHero} from './kpis.js';
import {renderCostos, renderSegmentos} from './costos.js';
import {renderBE} from './breakeven.js';
import {calc, resetCalcChart, setupCalc} from './calc.js';
import {renderMundo, renderRetorno, renderRiesgos} from './evidencia.js';
import {setChartDefaults, setChartFontSize} from './charts-common.js';
import {setupPageChrome} from './page-chrome.js';

/** Redibuja lo que depende de los filtros de costos. */
function renderListados() { renderCostos(); renderBE(); }

/** Todas las secciones, en orden: la numeración de referencias [n] sigue este orden y Fuentes va al final. */
function renderAll() {
  renderHero();
  renderFiltros(renderListados);
  renderCostos(); renderSegmentos(); renderBE();
  setupCalc();
  renderRetorno(); renderRiesgos(); renderMundo();
  renderFuentes();
}

async function showPais(code, fromHash) {
  await loadPais(code);
  resetRefs(); clearAumentoCache();
  document.querySelectorAll('#paises button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === code));
  const P = data.pais.pais;
  $('hero-eyebrow').textContent = `${P.nombre} · datos a ${P.fecha_texto || P.fecha}`;
  readHash(fromHash);
  resetBarState();
  renderAll();
}

function renderPaises(idx, actual) {
  $('paises').innerHTML = idx.paises.map(p => `<button data-c="${esc(p.code)}" ${p.listo ? '' : 'disabled title="Próximamente"'} aria-pressed="${p.code === actual}">${esc(p.bandera || '')} ${esc(p.nombre)}</button>`).join('');
  $('paises').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) showPais(b.dataset.c, false); };
}

/* Al cruzar 640 px (p. ej. al girar el teléfono) cambian fuentes, alturas y etiquetas: recrear los charts de canvas. */
function onBreakpoint() {
  if (!data.pais) return;
  setChartFontSize();
  renderRetorno(); renderRiesgos(); renderMundo();
  resetCalcChart(); calc();
}

async function init() {
  const idx = await loadIndexAndGlobal();
  const want = paisEnHash() || idx.default;
  renderPaises(idx, want);
  setChartDefaults();
  mobileQuery().addEventListener?.('change', debounce(onBreakpoint, DEBOUNCE_MS.breakpoint));
  await showPais(want, true);
}

setupPageChrome();
init().catch(err => {
  console.error(err);
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="wrap empty">No se pudieron cargar los datos (${esc(err.message)}).</p>`);
});
