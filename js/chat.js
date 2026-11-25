/* Asistente IA (chat) de MBA Radar.
 * Autónomo: inyecta chat.css y su DOM, espera a que data.pais exista y conversa con el gateway.
 * Las funciones puras (normalizar, construir contexto, parsear la respuesta) se exportan y no tocan el DOM:
 * tests/chat.test.mjs las importa en Node. El arranque del DOM está tras `typeof document !== 'undefined'`. */

export const CHAT_API = 'https://ai.tunky.net/v1/chat';
const CHAT_TOKEN = 'mbar_10ff557724dbc0488e7780ecbb07e7fc';   // token público de cliente (el gateway valida el Origin)
const CHAT_PROJECT = 'mba-radar';
export const CHAT_TIMEOUT_MS = 45000;   // modelos gratuitos del gateway pueden tardar 30+ s
export const CONTEXT_MAX = 2500;          // caracteres del bloque DATOS
const HIST_TURNS = 4;                     // vueltas previas (pregunta + respuesta) que se reenvían
const HIST_MSG_MAX = 500;                 // recorte por mensaje del historial
const QUESTION_MAX = 500;

export const SUGERENCIAS = [
  '¿Cuál es el MBA acreditado más barato?',
  '¿Cuánto cuesta ESAN vs CENTRUM?',
  '¿Cuánto tiene que subir mi sueldo para pagar un MBA de S/ 80 mil?',
  '¿El MBA en universidad pública vale la pena?',
  '¿Qué dice la evidencia sobre el retorno?',
];
export const AVISO = 'Respuestas generadas por IA a partir de los datos del tablero; pueden equivocarse. No es asesoría financiera.';

/* Rutas internas que el modelo puede citar (#/precios…) → id de la sección de la página. */
export const RUTAS = {precios: 'costos', costos: 'costos', calculadora: 'calculadora', retorno: 'retorno',
  riesgos: 'riesgos', mundo: 'mundo', fuentes: 'fuentes', apoya: 'apoya'};

/* ---------------------------------------------------------------- texto */

/** Minúsculas, sin tildes, solo letras/dígitos separados por un espacio. */
export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

/* Palabras que no sirven para encontrar un programa (aparecen en casi todos o son de la pregunta). */
const STOP = new Set(('mba mbas maestria maestrias magister programa programas universidad universidades escuela escuelas ' +
  'negocios business school administracion master cuanto cuanta cuesta cuestan costo costos precio precios vale pena ' +
  'cual cuales que quien como donde cuando para por con sin una uno unos unas los las del el la de en es y o vs versus ' +
  'mas menos mejor peor barato barata caro cara entre sobre tiene tienen hay mi mis su sus me te se lo le al ' +
  'peru peruano acreditado acreditada acreditados acreditacion publica publico privada privado sueldo sueldos ' +
  'subir pagar retorno evidencia dice dicen mil soles total años anos meses ese esa este esta esto conviene hacer ' +
  'estudiar estudio ia online part time full un si no ya yo tu nos muy ha he hoy pero tan son ser fue sea vez ver').split(' '));

/** Términos de búsqueda de la pregunta (normalizados, sin stopwords). */
export function terminos(pregunta) {
  return [...new Set(normalizar(pregunta).split(' ').filter(t => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t)))];
}

const nf0 = new Intl.NumberFormat('es-PE', {maximumFractionDigits: 0});
const soles = (v, sim = 'S/') => v == null || !(v > 0) ? 'n.d.' : `${sim} ${nf0.format(Math.round(v))}`;
const corta = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const mediana = v => { if (!v.length) return null; const a = [...v].sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

/* ---------------------------------------------------------------- contexto (RAG ligero) */

const conCosto = p => p && p.costo_soles > 0;
const ACR_RE = /AACSB|AMBA|EQUIS|BGA|ACBSP|IACBE/i;   // = ACREDITACION_RE de constants.js
const comparable = p => conCosto(p) && p.es_mba_generalista !== false && p.confianza !== 'baja';
const nombre = p => p.siglas || corta(p.universidad, 30);

function avisos(p) {
  return [
    p.incluye_derecho_grado === false ? 'no incluye derecho de grado' : '',
    p.es_mba_generalista === false ? 'MBA sectorial/no generalista' : '',
  ].filter(Boolean);
}

/** Una línea compacta por programa. */
export function lineaPrograma(p, sim = 'S/') {
  const partes = [
    nombre(p),
    corta(p.programa_corto || p.programa, 64),
    soles(p.costo_soles, sim),
    p.duracion_meses ? `${Math.round(p.duracion_meses)} m` : '',
    p.modalidad || '',
    p.sede ? corta(p.sede, 22) : '',
    p.acreditaciones ? 'acr: ' + corta(p.acreditaciones, 48) : 'sin acreditación intl.',
    p.confianza ? 'confianza ' + p.confianza : '',
    ...avisos(p).map(a => '⚠ ' + a),
  ].filter(Boolean);
  return '- ' + partes.join(' | ');
}

/** Programas cuya sigla/universidad/programa/sede contiene los términos de la pregunta, mejor puntaje primero. */
export function buscarProgramas(pregunta, programas) {
  const ts = terminos(pregunta);
  if (!ts.length || !Array.isArray(programas)) return [];
  const out = [];
  for (const p of programas) {
    const sig = ' ' + normalizar(p.siglas) + ' ';
    const hay = ' ' + normalizar([p.siglas, p.universidad, p.programa, p.programa_corto, p.sede].join(' ')) + ' ';
    let score = 0;
    for (const t of ts) {
      if (sig.includes(' ' + t + ' ')) score += 3;
      else if (hay.includes(' ' + t + ' ')) score += 2;
      else if (t.length >= 5 && hay.includes(' ' + t)) score += 1;     // prefijo: "pacific" → "pacifico"
    }
    if (score) out.push({p, score});
  }
  out.sort((a, b) => b.score - a.score || (a.p.costo_soles || Infinity) - (b.p.costo_soles || Infinity));
  // Varias filas con el mismo precio (grupo_precio) → una sola.
  const vistos = new Set();
  return out.map(o => o.p).filter(p => {
    const k = p.grupo_precio || 'id:' + p.id;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

function lineaSegmento(seg, progs, sim) {
  const ps = progs.filter(p => p.segmento === seg && comparable(p)).sort((a, b) => a.costo_soles - b.costo_soles);
  if (!ps.length) return '';
  const c = ps.map(p => p.costo_soles);
  return `- ${seg}: ${ps.length} prog.; mín ${soles(c[0], sim)} (${nombre(ps[0])}, ${corta(ps[0].programa_corto || ps[0].programa, 40)}), ` +
    `mediana ${soles(mediana(c), sim)}, máx ${soles(c.at(-1), sim)} (${nombre(ps.at(-1))})`;
}

/** Líneas de resumen general (rangos, prima ENAHO, alertas, hallazgos internacionales). */
export function lineasResumen(pais, global) {
  const sim = pais?.pais?.simbolo || 'S/';
  const progs = pais?.programas || [];
  const L = [];
  const comp = progs.filter(comparable).sort((a, b) => a.costo_soles - b.costo_soles);
  if (comp.length) {
    L.push(`Programas con precio: ${progs.filter(conCosto).length} de ${progs.length}. MBA generalistas comparables: ${comp.length}; ` +
      `mín ${soles(comp[0].costo_soles, sim)} (${nombre(comp[0])}), mediana ${soles(mediana(comp.map(p => p.costo_soles)), sim)}, ` +
      `máx ${soles(comp.at(-1).costo_soles, sim)} (${nombre(comp.at(-1))}).`);
    const acr = comp.find(p => ACR_RE.test(p.acreditaciones || ''));
    if (acr) L.push(`Más barato con acreditación internacional (AACSB/AMBA/EQUIS/BGA/ACBSP/IACBE): ${lineaPrograma(acr, sim).slice(2)}`);
    const segs = [...new Set(progs.map(p => p.segmento).filter(Boolean))];
    segs.forEach(s => { const l = lineaSegmento(s, progs, sim); if (l) L.push(l); });
  }
  const er = pais?.enaho_resumen, ep = pais?.enaho_panel;
  if (er?.prima_pct != null) L.push(`Prima ENAHO posgrado vs universitario: +${er.prima_pct} % (${corta(er.detalle, 70)}).`);
  if (ep?.advertencia) L.push('Advertencia ENAHO: ' + corta(ep.advertencia, 230));
  if (ep?.cortes?.length) {
    const pub = ep.cortes.find(c => /p[uú]blico/i.test(c.grupo)), pri = ep.cortes.find(c => /privado/i.test(c.grupo));
    if (pub && pri) L.push(`Prima sector público +${pub.prima_pct} % vs privado +${pri.prima_pct} %.`);
  }
  for (const a of pais?.alertas || []) {
    if (a.id === 'enaho_bajo_mediana') L.push(`${a.pct} % de posgraduados gana menos que la mediana universitaria (${a.pct_misma_edad} % frente a su misma edad).`);
    else if (a.titulo) L.push(corta(a.titulo, 110) + '.');
  }
  const sr = (pais?.sueldos_ref || []).slice(0, 2).map(s => `${s.etiqueta} ${soles(s.mensual, sim)}/mes`).join('; ');
  if (sr) L.push('Sueldos de referencia: ' + sr + '.');
  const pp = (pais?.presets_prima || []).map(p => `${p.etiqueta} ${p.valor} %`).join(', ');
  if (pp) L.push('Escenarios de prima: ' + pp + '.');
  const hs = global?.hartley?.hallazgos || [];
  ['calidad', 'carrera', 'salario', 'colocacion'].map(id => hs.find(h => h.id === id)).filter(Boolean).slice(0, 3)
    .forEach(h => L.push(`Internacional (Hartley 2026): ${h.titulo}${h.cifra ? ' [' + h.cifra + ']' : ''}: ${corta(h.texto, 150)}`));
  return L;
}

/** Añade líneas hasta el presupuesto; nunca devuelve más de `max` caracteres. */
function empaquetar(lineas, max) {
  let out = '';
  for (const l of lineas) {
    if (!l) continue;
    const next = out ? out + '\n' + l : l;
    if (next.length > max) continue;     // la siguiente (más corta) puede caber
    out = next;
  }
  return out.slice(0, max);
}

/** Bloque "DATOS: …" (≤ max caracteres en total) con lo relevante para la pregunta. */
export function construirContexto(pregunta, pais, global, max = CONTEXT_MAX) {
  const sim = pais?.pais?.simbolo || 'S/';
  const pre = 'DATOS: ';
  const budget = max - pre.length;
  if (!pais) return (pre + 'sin datos cargados.').slice(0, max);
  const encab = `País: ${pais.pais?.nombre || ''}; precios a ${pais.pais?.fecha_texto || pais.pais?.fecha || 'n.d.'}; TC ${pais.pais?.tc_usd || 'n.d.'} S/ por US$.`;
  const hallados = buscarProgramas(pregunta, pais.programas);
  let lineas;
  if (hallados.length) {
    const res = lineasResumen(pais, global);
    lineas = [encab, `Programas que coinciden con la pregunta (${hallados.length}):`,
      ...hallados.slice(0, 14).map(p => lineaPrograma(p, sim)),
      res[0], ...res.filter(l => /^Prima ENAHO/.test(l))];
  } else {
    lineas = [encab, ...lineasResumen(pais, global)];
  }
  return pre + empaquetar(lineas, budget);
}

/** Mensaje completo para el gateway. */
export function armarMensaje(pregunta, pais, global) {
  const q = corta(pregunta, QUESTION_MAX);
  return `${construirContexto(q, pais, global)}\n` +
    'INSTRUCCIONES: responde en español, en máximo 3 frases, solo con los DATOS; si no están, dilo y remite a la sección del tablero (#/precios, #/calculadora, #/retorno, #/mundo, #/fuentes).\n' +
    `PREGUNTA: ${q}`;
}

/** Historial recortado: últimas `turns` vueltas, cada mensaje ≤ HIST_MSG_MAX. */
export function recortarHistorial(hist, turns = HIST_TURNS) {
  return hist.slice(-turns * 2).map(m => ({role: m.role, content: corta(m.content, HIST_MSG_MAX)}));
}

/* ---------------------------------------------------------------- respuesta → tokens seguros */

const HASH_RE = /^#\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i;
export const esHashInterno = h => HASH_RE.test(String(h || ''));

/** Limpia marcas de bloque markdown (títulos, separadores, viñetas) y devuelve líneas no vacías. */
export function lineasRespuesta(texto) {
  return String(texto ?? '').replace(/\r/g, '').split('\n')
    .map(l => l.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*(?:[*+-])\s+/, '• ').replace(/^\s*>\s?/, '').trimEnd())
    .filter(l => l.trim() && !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l));
}

/**
 * Convierte una línea en tokens: {t:'text', v}, {t:'b', v}, {t:'a', v, href}.
 * Solo **negritas** y enlaces a hashes internos (#/…) se vuelven elementos; cualquier otro enlace queda como texto.
 */
export function parsearLinea(linea) {
  const s = String(linea ?? '');
  const out = [];
  const push = (t, v, href) => {
    if (!v) return;
    const last = out.at(-1);
    if (t === 'text' && last?.t === 'text') last.v += v;
    else out.push(href ? {t, v, href} : {t, v});
  };
  // **negrita** | [texto](url) | #/ruta suelta
  const RE = /\*\*([^*\n]+?)\*\*|\[([^\]\n]{1,200})\]\(([^)\s]{1,300})\)|(#\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)/gi;
  let i = 0, m;
  while ((m = RE.exec(s))) {
    push('text', s.slice(i, m.index));
    if (m[1] != null) push('b', m[1]);
    else if (m[2] != null) {
      if (esHashInterno(m[3])) push('a', m[2], m[3]);
      else push('text', m[2] === m[3] ? m[2] : `${m[2]} (${m[3]})`);
    } else push('a', m[4], m[4]);
    i = RE.lastIndex;
  }
  push('text', s.slice(i));
  return out;
}

/** Mensaje amable según el error del gateway. */
export function mensajeError(e, local = false) {
  const st = e?.status;
  if (e?.name === 'AbortError' || e?.name === 'TimeoutError') return 'La IA tardó más de 20 s en responder. Puedes reintentar.';
  if (st === 429) return 'Hay muchas consultas seguidas. Espera un minuto y vuelve a intentar.';
  if (st === 503 || st === 502 || st === 504) return 'El servicio de IA está ocupado en este momento. Reintenta en unos segundos.';
  if (st === 403 || (local && !st)) return local
    ? 'El asistente solo funciona en el sitio publicado (unimauro.github.io/mba-radar); en local el servidor no acepta este origen.'
    : 'El servidor rechazó la consulta. Recarga la página y vuelve a intentar.';
  if (st) return `El servicio respondió con un error (${st}). Puedes reintentar.`;
  return 'No pude conectar con el servicio de IA. Revisa tu conexión y reintenta.';
}

/* ---------------------------------------------------------------- red */

export async function preguntarGateway(messages, {fetchImpl = fetch, timeoutMs = CHAT_TIMEOUT_MS} = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(CHAT_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Client-Token': CHAT_TOKEN},
      body: JSON.stringify({project: CHAT_PROJECT, messages}),
      signal: ctrl.signal,
    });
    if (!r.ok) { const err = new Error('HTTP ' + r.status); err.status = r.status; throw err; }
    const j = await r.json();
    if (!j || typeof j.reply !== 'string' || !j.reply.trim()) { const err = new Error('respuesta vacía'); err.status = 502; throw err; }
    return j.reply;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------- DOM */

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(k => k != null && n.append(k));
  return n;
}

function irARuta(href) {
  const id = RUTAS[href.slice(2).split('/')[0].toLowerCase()];
  const sec = id && document.getElementById(id);
  if (sec && sec.offsetParent !== null) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    sec.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    return;
  }
  location.hash = href;     // sin sección visible: que un router de vistas (si existe) lo resuelva
}

/** Pinta texto del modelo como nodos (textContent); solo <strong> y <a href="#/…">. */
function renderRespuesta(texto) {
  const frag = document.createDocumentFragment();
  for (const linea of lineasRespuesta(texto)) {
    const p = document.createElement('p');
    for (const tk of parsearLinea(linea)) {
      if (tk.t === 'b') { const b = document.createElement('strong'); b.textContent = tk.v; p.append(b); }
      else if (tk.t === 'a') {
        const a = document.createElement('a');
        a.href = tk.href; a.textContent = tk.v; a.className = 'chat-link';
        a.addEventListener('click', ev => { ev.preventDefault(); irARuta(tk.href); });
        p.append(a);
      } else p.append(document.createTextNode(tk.v));
    }
    frag.append(p);
  }
  return frag;
}

async function esperarDatos(state, ms = 250, max = FALLBACK_MS) {
  const t0 = Date.now();
  while (!state.data?.pais) {
    if (Date.now() - t0 > max) return false;
    await new Promise(r => setTimeout(r, ms));
  }
  return true;
}

const FALLBACK_MS = 8000;
async function cargarPropio() {
  const base = new URL('../data/', import.meta.url);
  const get = async u => { const r = await fetch(new URL(u, base)); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
  const [pais, global] = await Promise.all([get('paises/pe.json'), get('global.json').catch(() => null)]);
  return {pais, global};
}

function montar() {
  if (document.getElementById('chat-panel')) return;
  if (!document.querySelector('link[data-chat-css]')) {
    const css = new URL('../chat.css', import.meta.url).href;
    document.head.append(el('link', {rel: 'stylesheet', href: css, 'data-chat-css': ''}));
  }
  const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
  const hist = [];
  let data = null, ocupado = false;

  const fab = el('button', {type: 'button', class: 'chat-fab', 'aria-expanded': 'false', 'aria-controls': 'chat-panel'},
    el('span', {'aria-hidden': 'true', text: '💬'}), el('span', {text: ' Pregúntale a la IA'}));
  const cerrar = el('button', {type: 'button', class: 'chat-x', 'aria-label': 'Cerrar el asistente', text: '×'});
  const log = el('div', {class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', tabindex: '-1'});
  const chips = el('div', {class: 'chat-chips', role: 'group', 'aria-label': 'Preguntas sugeridas'},
    SUGERENCIAS.map(q => el('button', {type: 'button', class: 'chat-chip', text: q, onclick: () => enviar(q)})));
  const input = el('input', {type: 'text', class: 'chat-in', id: 'chat-in', maxlength: String(QUESTION_MAX),
    autocomplete: 'off', placeholder: 'Cargando datos…', disabled: true, 'aria-label': 'Tu pregunta sobre el costo o retorno del MBA'});
  const send = el('button', {type: 'submit', class: 'chat-send', disabled: true, text: 'Enviar'});
  const form = el('form', {class: 'chat-form', onsubmit: ev => { ev.preventDefault(); enviar(input.value); }}, input, send);
  const panel = el('section', {id: 'chat-panel', class: 'chat-panel', 'aria-labelledby': 'chat-title', hidden: true},
    el('div', {class: 'chat-head'},
      el('h2', {id: 'chat-title', class: 'chat-title', text: 'Pregúntale a la IA'}), cerrar),
    el('p', {class: 'chat-note', text: AVISO}),
    log, chips, form);
  document.body.append(fab, panel);

  function abrir() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-open');
    (input.disabled ? log : input).focus({preventScroll: true});
  }
  function cerrarPanel() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('chat-open');
    fab.focus({preventScroll: true});
  }
  fab.addEventListener('click', () => (panel.hidden ? abrir() : cerrarPanel()));
  cerrar.addEventListener('click', cerrarPanel);
  panel.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.stopPropagation(); cerrarPanel(); } });

  const scrollFin = () => { log.scrollTop = log.scrollHeight; };
  function burbuja(rol, contenido) {
    const b = el('div', {class: 'chat-msg chat-' + rol});
    if (typeof contenido === 'string') b.textContent = contenido; else b.append(contenido);
    log.append(b); scrollFin();
    return b;
  }
  function setOcupado(v) {
    ocupado = v;
    send.disabled = v || !data;
    chips.querySelectorAll('button').forEach(b => { b.disabled = v || !data; });
    log.setAttribute('aria-busy', v ? 'true' : 'false');
  }

  async function enviar(texto, reintento = false) {
    const q = String(texto || '').trim().slice(0, QUESTION_MAX);
    if (!q || ocupado || !data?.pais) return;
    if (!reintento) { burbuja('user', q); input.value = ''; }
    const pensando = burbuja('bot chat-wait', 'Pensando…');
    setOcupado(true);
    const messages = [...recortarHistorial(hist), {role: 'user', content: armarMensaje(q, data.pais, data.global)}];
    try {
      const reply = await preguntarGateway(messages);
      pensando.remove();
      burbuja('bot', renderRespuesta(reply));
      hist.push({role: 'user', content: q}, {role: 'assistant', content: reply});
    } catch (e) {
      pensando.remove();
      const b = burbuja('bot chat-err', mensajeError(e, local));
      b.append(' ', el('button', {type: 'button', class: 'chat-retry', text: 'Reintentar',
        onclick: ev => { ev.currentTarget.closest('.chat-msg').remove(); enviar(q, true); }}));
    } finally {
      setOcupado(false);
      if (!panel.hidden && document.activeElement !== input) input.focus({preventScroll: true});
    }
  }

  burbuja('bot', 'Hola. Pregúntame por precios de MBA en el Perú, cuánto tendría que subir tu sueldo o qué dice la evidencia sobre su retorno.');
  setOcupado(false);

  /* Usa los datos que cargó main.js (data.pais/data.global). Si en FALLBACK_MS no aparecen (p. ej. error en otro
   * módulo), carga su propia copia de solo lectura del país por defecto para que el asistente siga funcionando. */
  const habilitar = () => { input.disabled = false; input.placeholder = 'Escribe tu pregunta…'; setOcupado(false); };
  import('./state.js').then(async state => {
    if (await esperarDatos(state, 250, FALLBACK_MS)) { data = state.data; habilitar(); return; }
    const propio = await cargarPropio();
    data = {get pais() { return state.data?.pais || propio.pais; }, get global() { return state.data?.global || propio.global; }};
    habilitar();
  }).catch(() => { input.placeholder = 'No se pudieron cargar los datos'; });

  if (new URLSearchParams(location.search).get('chat') === '1') abrir();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, {once: true});
  else montar();
}
