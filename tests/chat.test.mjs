// Pruebas de las funciones puras del asistente IA (js/chat.js): normalización, contexto y parser seguro.
// Ejecutar: node --test tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  normalizar, terminos, buscarProgramas, construirContexto, armarMensaje, recortarHistorial,
  parsearLinea, lineasRespuesta, esHashInterno, mensajeError, CONTEXT_MAX, SUGERENCIAS,
} from '../js/chat.js';

const pais = JSON.parse(readFileSync(new URL('../data/paises/pe.json', import.meta.url)));
const global = JSON.parse(readFileSync(new URL('../data/global.json', import.meta.url)));

test('normalizar: sin tildes, minúsculas, sin signos', () => {
  assert.equal(normalizar('¿Cuánto cuesta ESAN vs CENTRUM–PUCP?'), 'cuanto cuesta esan vs centrum pucp');
  assert.equal(normalizar('Pacífico  Business'), 'pacifico business');
  assert.equal(normalizar(null), '');
});

test('terminos: quita stopwords y números', () => {
  assert.deepEqual(terminos('¿Cuánto cuesta ESAN vs CENTRUM?'), ['esan', 'centrum']);
  assert.deepEqual(terminos('¿Cuánto tiene que subir mi sueldo para pagar un MBA de S/ 80 mil?'), []);
});

test('buscarProgramas: encuentra por siglas y deduplica grupo_precio', () => {
  const r = buscarProgramas('ESAN vs CENTRUM', pais.programas);
  assert.ok(r.length > 0);
  assert.ok(r.every(p => /ESAN|CENTRUM/.test(p.siglas)));
  const grupos = r.map(p => p.grupo_precio).filter(Boolean);
  assert.equal(new Set(grupos).size, grupos.length);
  assert.ok(buscarProgramas('universidad del pacifico', pais.programas).some(p => p.siglas === 'UP / PBS'));
  assert.deepEqual(buscarProgramas('¿qué dice la evidencia?', pais.programas), []);
});

test('construirContexto: respeta el límite y trae lo relevante', () => {
  for (const q of [...SUGERENCIAS, 'ESAN CENTRUM UPC UP Lima Arequipa Cusco online', 'x'.repeat(3000)]) {
    const c = construirContexto(q, pais, global);
    assert.ok(c.startsWith('DATOS: '));
    assert.ok(c.length <= CONTEXT_MAX, `${c.length} > ${CONTEXT_MAX} para «${q.slice(0, 40)}»`);
  }
  const m = construirContexto('¿Cuánto cuesta ESAN vs CENTRUM?', pais, global);
  assert.match(m, /ESAN \|/);
  assert.match(m, /CENTRUM PUCP \|/);
  assert.match(m, /S\/ \d/);
  const r = construirContexto('¿Qué dice la evidencia sobre el retorno?', pais, global);
  assert.match(r, /Prima ENAHO/);
  assert.match(r, /mediana/);
  assert.match(r, /Hartley/);
  assert.match(r, /gana menos que la mediana/);
  assert.ok(construirContexto('hola', pais, global, 300).length <= 300);
  assert.equal(construirContexto('hola', null, null), 'DATOS: sin datos cargados.');
});

test('construirContexto: avisa derecho de grado / no generalista', () => {
  const p = {...pais.programas[0], siglas: 'ZZTEST', incluye_derecho_grado: false, es_mba_generalista: false, grupo_precio: 'zz'};
  const c = construirContexto('zztest', {...pais, programas: [p]}, global);
  assert.match(c, /no incluye derecho de grado/);
  assert.match(c, /no generalista/);
});

test('armarMensaje y historial', () => {
  const msg = armarMensaje('¿ESAN?', pais, global);
  assert.match(msg, /^DATOS: /);
  assert.match(msg, /\nPREGUNTA: ¿ESAN\?$/);
  const h = Array.from({length: 12}, (_, i) => ({role: i % 2 ? 'assistant' : 'user', content: 'a'.repeat(900)}));
  const r = recortarHistorial(h);
  assert.equal(r.length, 8);
  assert.ok(r.every(m => m.content.length <= 500));
});

test('parsearLinea: negritas y solo enlaces hash internos', () => {
  assert.deepEqual(parsearLinea('Cuesta **S/ 68,672** ver #/precios.'), [
    {t: 'text', v: 'Cuesta '}, {t: 'b', v: 'S/ 68,672'}, {t: 'text', v: ' ver '}, {t: 'a', v: '#/precios', href: '#/precios'}, {t: 'text', v: '.'},
  ]);
  assert.deepEqual(parsearLinea('[la calculadora](#/calculadora)'), [{t: 'a', v: 'la calculadora', href: '#/calculadora'}]);
  // Enlaces externos o peligrosos quedan como texto.
  for (const bad of ['[clic](javascript:alert(1))', '[x](https://evil.example)', '[x](#/a"onmouseover=1)']) {
    assert.ok(parsearLinea(bad).every(t => t.t === 'text'), bad);
  }
  // HTML del modelo no se interpreta: es texto plano que luego va por textContent.
  assert.deepEqual(parsearLinea('<img src=x onerror=alert(1)>'), [{t: 'text', v: '<img src=x onerror=alert(1)>'}]);
  assert.ok(esHashInterno('#/retorno') && !esHashInterno('#costos') && !esHashInterno('https://x/#/a'));
});

test('lineasRespuesta: limpia títulos, separadores y viñetas', () => {
  assert.deepEqual(lineasRespuesta('### Título\n---\n* uno\n\n- dos\nTexto'), ['Título', '• uno', '• dos', 'Texto']);
});

test('mensajeError: casos', () => {
  assert.match(mensajeError({status: 429}), /muchas consultas/i);
  assert.match(mensajeError({status: 503}), /ocupado/);
  assert.match(mensajeError({name: 'AbortError'}), /20 s/);
  assert.match(mensajeError(new TypeError('Failed to fetch'), true), /sitio publicado/);
});
