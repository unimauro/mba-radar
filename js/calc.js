/* Calculadora: formulario, resultado (KPIs + veredicto), gráfico de flujo acumulado y resumen fijo en móvil.
   El modelo financiero está en simular.js. */
import {CALC_DEFAULT, COLOR, DEBOUNCE_MS, DURACION_DEFAULT, MESES_ANIO, MODALIDAD_FULL_TIME, PAGO_RAPIDO_ANIOS} from './constants.js';
import {$, debounce, esc, isMob, nf0, nf1, short} from './util.js';
import {charts, data, money, ui} from './state.js';
import {nombreCorto, programasConCosto} from './data.js';
import {simular} from './simular.js';
import {combo} from './combo.js';
import {baseOptions, fontSize, FONT_FAMILY, hasChart} from './charts-common.js';

const MONEY_INPUTS = ['c-costo', 'c-sueldo'];
const SLIDERS = ['c-prima', 'c-hor', 'c-tasa', 'c-imp'];
const MAX_DIGITOS = 9;
const PORCENTAJE = 100;

/* ---------- Entradas numéricas ---------- */
const numVal = id => { const el = $(id); return MONEY_INPUTS.includes(id) ? +String(el.value).replace(/\D/g, '') || 0 : +el.value || 0; };
function setNum(id, v) { const el = $(id); el.value = MONEY_INPUTS.includes(id) ? (v ? nf0.format(Math.round(v)) : '') : v; }

/** Reformatea un monto con separador de miles sin mover el cursor respecto de los dígitos. */
function fmtMoneyInput(el) {
  const raw = el.value, pos = el.selectionStart ?? raw.length;
  const digitosAntes = raw.slice(0, pos).replace(/\D/g, '').length;
  const d = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITOS);
  el.value = d ? nf0.format(+d) : '';
  let i = 0, c = 0;
  while (i < el.value.length && c < digitosAntes) { if (/\d/.test(el.value[i])) c++; i++; }
  try { el.setSelectionRange(i, i); } catch { /* sin foco */ }
}

/** Envuelve un input con − / + (y prefijo de moneda para montos). Se hace una sola vez. */
function stepper(id, step, isMoney) {
  const el = $(id);
  if (!el || el.dataset.cx) return;
  el.dataset.cx = '1';
  const min = +el.min || 0, max = el.max ? +el.max : Infinity;
  if (isMoney) { el.type = 'text'; el.inputMode = 'numeric'; el.autocomplete = 'off'; el.removeAttribute('min'); el.removeAttribute('step'); }
  const lab = el.closest('label'); if (lab) lab.htmlFor = id;      // los botones no deben robar la etiqueta
  const wrap = document.createElement('div');
  wrap.className = 'cx-step' + (isMoney ? ' cx-money' : '');
  el.parentNode.insertBefore(wrap, el);
  const boton = (dir, txt, aria) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cx-sb'; b.textContent = txt; b.setAttribute('aria-label', aria);
    b.onclick = () => { setNum(id, Math.min(max, Math.max(min, numVal(id) + dir * step))); calc(); };
    return b;
  };
  const field = document.createElement('span');
  field.className = 'cx-field';
  if (isMoney) { const pre = document.createElement('span'); pre.className = 'cx-pre'; pre.textContent = data.simbolo || 'S/'; field.appendChild(pre); }
  field.appendChild(el);
  wrap.append(boton(-1, '−', `Restar ${nf0.format(step)}`), field, boton(1, '+', `Sumar ${nf0.format(step)}`));
}

const calcSoon = debounce(() => calc(), DEBOUNCE_MS.calc);

/* ---------- API para otras secciones ---------- */
/**
 * Carga un programa en la calculadora y recalcula.
 * @param {object} p programa
 * @param {{sueldo?: number, run?: boolean}} [opts] sueldo mensual a fijar; run=false no recalcula
 */
export function simularPrograma(p, {sueldo, run = true} = {}) {
  ui.pick = p;
  $('c-prog').value = `${nombreCorto(p)} — ${p.programa}`;
  $('c-prog').dispatchEvent(new Event('cx-sync'));
  if (p.costo_soles) setNum('c-costo', p.costo_soles);
  setNum('c-dur', p.duracion_meses || DURACION_DEFAULT);   // mismo supuesto que el gráfico de aumento
  document.querySelector(`input[name=c-ft][value="${p.modalidad_grupo === MODALIDAD_FULL_TIME ? 1 : 0}"]`).checked = true;
  if (sueldo != null) setNum('c-sueldo', sueldo);
  if (run) calc();
}

/** Prepara la calculadora para el país cargado (una vez por país) y elige el programa de costo mediano. */
export function setupCalc() {
  combo($('c-prog'), $('c-prog-list'), {
    source: () => programasConCosto().map(p => ({label: `${nombreCorto(p)} — ${p.programa}`, sub: `${money(p.costo_soles)} · ${p.duracion_meses || '?'} meses`, val: p})),
    onPick: it => simularPrograma(it.val),
  });
  stepper('c-costo', 1000, true); stepper('c-sueldo', 100, true); stepper('c-dur', 1, false);
  document.querySelectorAll('.cx-pre').forEach(x => { x.textContent = data.simbolo; });
  setNum('c-sueldo', $('c-sueldo').value ? numVal('c-sueldo') : CALC_DEFAULT.sueldo);
  renderPresets();
  MONEY_INPUTS.forEach(id => { $(id).oninput = () => { fmtMoneyInput($(id)); calcSoon(); }; });
  $('c-dur').oninput = calcSoon;
  SLIDERS.forEach(id => { $(id).oninput = () => calc(); });      // en vivo: el cálculo es barato y el chart se actualiza en sitio
  document.querySelectorAll('input[name=c-ft]').forEach(r => { r.onchange = () => calc(); });
  const mediano = programaMediano();
  if (mediano) simularPrograma(mediano);
  else { setNum('c-costo', CALC_DEFAULT.costo); setNum('c-dur', CALC_DEFAULT.duracion); calc(); }
  setupDock();
}

/** Primer programa (en orden de datos) cuyo costo alcanza la mediana superior. */
function programaMediano() {
  const cc = programasConCosto(), costos = cc.map(p => p.costo_soles).sort((a, b) => a - b);
  return cc.find(p => p.costo_soles >= costos[Math.floor(costos.length / 2)]);
}

function renderPresets() {
  const presets = (data.pais.presets_prima || []).map(x => `<button type="button" data-v="${esc(x.valor)}" title="${esc(x.fuente)}">${esc(x.etiqueta)}: ${nf0.format(x.valor)} %</button>`).join('');
  $('presets').innerHTML = presets ? `<span class="note" style="width:100%;margin:0">Referencias (las dos últimas son techos, no efectos del MBA):</span>${presets}` : '';
  $('presets').onclick = e => { const b = e.target.closest('button'); if (b) { $('c-prima').value = b.dataset.v; calc(); } };
}

/* ---------- Cálculo y resultado ---------- */
function leerEntradas() {
  return {
    C: numVal('c-costo'), D: Math.max(1, numVal('c-dur')), S: numVal('c-sueldo'),
    ft: document.querySelector('input[name=c-ft]:checked').value === '1',
    p: numVal('c-prima') / PORCENTAJE, H: numVal('c-hor'), r: numVal('c-tasa') / PORCENTAJE, t: numVal('c-imp') / PORCENTAJE,
  };
}

/** Recalcula y redibuja el resultado y el gráfico de la calculadora. */
export function calc() {
  const inp = leerEntradas();
  $('o-prima').textContent = `${numVal('c-prima')} %`;
  $('o-hor').textContent = `${inp.H} años`;
  $('o-tasa').textContent = `${nf1.format(numVal('c-tasa'))} %`;
  $('o-imp').textContent = `${numVal('c-imp')} %`;
  if (inp.H * MESES_ANIO <= inp.D) {
    $('c-res').innerHTML = '<p class="empty">El horizonte debe ser mayor que la duración del programa.</p>';
    setDock(null);
    return;
  }
  const s = simular(inp);
  const v = veredicto(s, inp);
  $('c-res').innerHTML = resultadoHTML(s, inp, v);
  const anio = s.pay ? Math.ceil(s.pay / MESES_ANIO) : null;
  setDock(v.kind, v.pierde ? `Pierdes ${money(Math.abs(s.npv))} en ${inp.H} años` : `Recuperas en el año ${anio} · +${money(s.npv)}`);
  drawCalcChart(s, inp);
}

function veredicto(s, inp) {
  const anio = s.pay ? Math.ceil(s.pay / MESES_ANIO) : null;
  if (s.npv < 0 || !s.pay) {
    return {kind: 'neg', pierde: true, txt: `Con estos números pierdes ${money(Math.abs(s.npv))} en ${inp.H} años (en soles de hoy).${s.pEq != null ? ` Para no perder, el MBA tendría que subirte el sueldo al menos ${nf1.format(s.pEq * PORCENTAJE)} %, y de forma permanente.` : ''}`};
  }
  if (s.pay / MESES_ANIO <= PAGO_RAPIDO_ANIOS) {
    return {kind: 'pos', pierde: false, txt: `Recuperas tu inversión en el año ${anio}. A ${inp.H} años terminas ${money(s.npv)} arriba, en soles de hoy.`};
  }
  return {kind: 'mid', pierde: false, txt: `Recuperas tu inversión recién en el año ${anio}: es lento y depende de que el aumento sea real y se mantenga. A ${inp.H} años terminas ${money(s.npv)} arriba.`};
}

function resultadoHTML(s, inp, v) {
  const anio = s.pay ? Math.ceil(s.pay / MESES_ANIO) : null;
  const tir = s.irr != null && isFinite(s.irr) ? ` TIR ≈ ${nf1.format(s.irr * PORCENTAJE)} % anual.` : '';
  return `
    <div class="kpi"><b>${money(s.costoTotal)}</b><span>inversión real</span><small>${inp.ft ? 'matrícula + sueldos que dejas de ganar' : 'solo el programa'}</small></div>
    <div class="kpi"><b class="${s.npv >= 0 ? 'pos' : 'neg'}">${money(s.npv)}</b><span>valor actual neto</span><small>a ${inp.H} años, ${nf1.format(inp.r * PORCENTAJE)} % anual</small></div>
    <div class="kpi"><b>${s.pay ? 'año ' + anio : 'nunca'}</b><span>recuperación</span><small>${s.pay ? `≈ ${nf1.format(s.pay / MESES_ANIO)} años desde que empiezas` : `en ${inp.H} años`}</small></div>
    <div class="kpi"><b>${s.pEq != null ? nf1.format(s.pEq * PORCENTAJE) + ' %' : '—'}</b><span>aumento bruto mínimo necesario</span><small>para no perder dinero en ${inp.H} años, tras impuestos</small></div>
    <div class="verdict ${v.kind}">${esc(v.txt)}${tir}</div>`;
}

/* ---------- Gráfico ---------- */
const PASO_X_LARGO = 12;               // con horizontes > 12 años, ticks cada 2 años
const xStep = H => H > PASO_X_LARGO ? 2 : 1;

function drawCalcChart(s, inp) {
  if (!hasChart()) return;
  const pts = s.anual.map((y, i) => ({x: i, y}));
  const meta = {pay: s.pay, H: inp.H};
  const c = charts.calc;
  if (c && c.canvas === $('ch-calc')) {              // actualizar en sitio (sliders en vivo)
    c.data.datasets[0].data = pts; c.$cx = meta;
    c.options.scales.x.max = inp.H; c.options.scales.x.ticks.stepSize = xStep(inp.H);
    c.update('none');
    return;
  }
  charts.calc = new Chart($('ch-calc'), calcChartConfig(pts, inp.H));
  charts.calc.$cx = meta;
  charts.calc.update('none');
}

/** Fuerza a recrear el gráfico (p. ej. al cruzar el breakpoint móvil). */
export function resetCalcChart() { charts.calc?.destroy(); charts.calc = null; }

function calcChartConfig(pts, H) {
  const sim = data.simbolo;
  return {
    type: 'line', plugins: [payPlugin],
    data: {datasets: [{data: pts, borderColor: COLOR.vino, borderWidth: 2, pointRadius: isMob() ? 2 : 3, pointHoverRadius: 6, pointHitRadius: 14,
      fill: {target: {value: 0}, above: 'rgba(31,122,85,.12)', below: 'rgba(220,60,61,.10)'}}]},
    options: {...baseOptions(), parsing: false, interaction: {mode: 'index', intersect: false},
      layout: {padding: {top: 4, right: 6}},
      plugins: {legend: {display: false}, tooltip: {callbacks: {title: it => it[0].raw.x === 0 ? 'Hoy' : `Año ${it[0].raw.x}`, label: it => `Acumulado (soles de hoy): ${money(it.raw.y)}`}}},
      scales: {
        y: {grace: '8%', ticks: {maxTicksLimit: isMob() ? 5 : 7, callback: v => v === 0 ? `${sim} 0` : `${v < 0 ? '−' : ''}${sim} ${short(Math.abs(v))}`}, grid: {color: COLOR.grid}},
        x: {type: 'linear', min: 0, max: H, grid: {display: false}, title: {display: true, text: 'Años desde que empiezas'}, ticks: {stepSize: xStep(H), callback: v => v === 0 ? 'Hoy' : String(v)}}}},
  };
}

/* Anotaciones: línea de cero marcada y año de recuperación (o "no se recupera"). */
const payPlugin = {
  id: 'cxPay',
  afterDatasetsDraw(ch) {
    const a = ch.$cx; if (!a) return;
    const {ctx, chartArea: ca, scales: {x, y}} = ch, fs = fontSize();
    ctx.save();
    const y0 = y.getPixelForValue(0), ceroVisible = y0 >= ca.top && y0 <= ca.bottom;
    if (ceroVisible) {
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ca.left, y0); ctx.lineTo(ca.right, y0); ctx.stroke();
      ctx.font = `700 ${fs - 1}px ${FONT_FAMILY}`; ctx.fillStyle = COLOR.ink2; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Punto de equilibrio', ca.left + 4, y0 - 3);
    }
    ctx.font = `700 ${fs}px ${FONT_FAMILY}`; ctx.textBaseline = 'top';
    const tag = (txt, px, color) => {
      const w = ctx.measureText(txt).width + 12, h = fs + 10;
      let tx = px + 8;
      if (tx + w > ca.right) tx = Math.max(ca.left, px - 8 - w);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(tx, ca.top + 2, w, h);
      ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(txt, tx + 6, ca.top + 7);
    };
    if (a.pay) {
      const px = x.getPixelForValue(a.pay / MESES_ANIO);
      ctx.strokeStyle = COLOR.verde; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, ca.top); ctx.lineTo(px, ca.bottom); ctx.stroke(); ctx.setLineDash([]);
      if (ceroVisible) { ctx.beginPath(); ctx.arc(px, y0, 5, 0, Math.PI * 2); ctx.fillStyle = COLOR.verde; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      tag(`Recuperas en el año ${Math.ceil(a.pay / MESES_ANIO)}`, px, COLOR.verdeTexto);
    } else tag(`No se recupera en ${a.H} años`, ca.right, COLOR.rojoTexto);
    ctx.restore();
  },
};

/* ---------- Resumen fijo en móvil (#calc-dock): visible mientras se edita y el resultado no está en pantalla ---------- */
let dockObs = null;
function setDock(kind, txt) {
  const d = $('calc-dock'); if (!d) return;
  d.dataset.kind = kind || ''; d.textContent = txt || '';
}
function setupDock() {
  const d = $('calc-dock');
  if (!d || dockObs || !('IntersectionObserver' in window)) return;
  const vis = {form: false, res: false};
  const update = () => { d.hidden = !(isMob() && vis.form && !vis.res && d.textContent); };
  dockObs = new IntersectionObserver(es => { es.forEach(e => { vis[e.target.id === 'c-res' ? 'res' : 'form'] = e.isIntersecting; }); update(); });
  dockObs.observe($('calc')); dockObs.observe($('c-res'));
  d.addEventListener('click', e => { e.preventDefault(); $('c-res').scrollIntoView({block: 'center'}); });
}
