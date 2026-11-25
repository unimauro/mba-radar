// Pruebas de las funciones puras de vistas: rutas por hash (js/route.js), enlaces para compartir
// (js/share-links.js) y cifras animables (js/cifra.js).  Ejecutar: node --test tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildHash, parseHash, VIEWS} from '../js/route.js';
import {shareLinks} from '../js/share-links.js';
import {formatCifra, parseCifra} from '../js/cifra.js';

test('parseHash: vacío → inicio', () => {
  for (const h of ['', '#', '#/']) {
    const r = parseHash(h);
    assert.equal(r.view, 'inicio');
    assert.deepEqual(r.params, {});
  }
});

test('parseHash: formato canónico con filtros y ancla', () => {
  const r = parseHash('#/precios?seg=publica&precio=0-20000&ir=be');
  assert.equal(r.view, 'precios');
  assert.deepEqual(r.params, {seg: 'publica', precio: '0-20000'});
  assert.equal(r.anchor, 'be');
  assert.equal(r.legacy, false);
  assert.equal(parseHash('#/calculadora').view, 'calculadora');
});

test('parseHash: vista desconocida → inicio (reescribir)', () => {
  const r = parseHash('#/nada?q=x');
  assert.equal(r.view, 'inicio');
  assert.equal(r.legacy, true);
});

test('parseHash: filtros antiguos #pais=…', () => {
  const a = parseHash('#pais=pe&q=esan&seg=escuela');
  assert.equal(a.view, 'precios');
  assert.deepEqual(a.params, {pais: 'pe', q: 'esan', seg: 'escuela'});
  assert.equal(a.legacy, true);
  const b = parseHash('#pais=pe');
  assert.equal(b.view, 'inicio');
  assert.deepEqual(b.params, {pais: 'pe'});
});

test('parseHash: anclas antiguas', () => {
  assert.deepEqual(parseHash('#costos'), {view: 'precios', params: {}, anchor: null, legacy: true});
  assert.deepEqual(parseHash('#riesgos'), {view: 'retorno', params: {}, anchor: 'riesgos', legacy: true});
  assert.deepEqual(parseHash('#apoya'), {view: 'fuentes', params: {}, anchor: 'apoya', legacy: true});
  assert.equal(parseHash('#calculadora').view, 'calculadora');
  const ref = parseHash('#ref-3');
  assert.equal(ref.view, null);
  assert.equal(ref.anchor, 'ref-3');
});

test('parseHash: anclas inseguras se descartan', () => {
  assert.equal(parseHash('#/fuentes?ir=<img>').anchor, null);
  assert.equal(parseHash('#"><script>').anchor, null);
});

test('buildHash ida y vuelta', () => {
  assert.equal(buildHash('inicio'), '#/inicio');
  assert.equal(buildHash('precios', {seg: 'publica', q: '', precio: '0-20000'}), '#/precios?seg=publica&precio=0-20000');
  assert.equal(buildHash('fuentes', {}, 'ref-2'), '#/fuentes?ir=ref-2');
  assert.equal(buildHash('xx'), '#/inicio');
  for (const v of VIEWS) {
    const h = buildHash(v, {q: 'pucp centrum', orden: 'barato'}, 'x1');
    const r = parseHash(h);
    assert.equal(r.view, v);
    assert.deepEqual(r.params, {q: 'pucp centrum', orden: 'barato'});
    assert.equal(r.anchor, 'x1');
  }
});

test('shareLinks codifica url y texto', () => {
  const l = shareLinks('https://ej.pe/#/precios', 'Hola & chau');
  assert.deepEqual(l.map(x => x.id), ['whatsapp', 'linkedin', 'x', 'facebook']);
  assert.equal(l[0].href, 'https://wa.me/?text=Hola%20%26%20chau%20https%3A%2F%2Fej.pe%2F%23%2Fprecios');
  assert.ok(l[1].href.endsWith('url=https%3A%2F%2Fej.pe%2F%23%2Fprecios'));
  assert.ok(l[2].href.includes('text=Hola%20%26%20chau'));
  l.forEach(x => assert.match(x.href, /^https:\/\//));
});

test('parseCifra / formatCifra', () => {
  const a = parseCifra('S/ 68,672');
  assert.equal(a.value, 68672);
  assert.equal(formatCifra(a, a.value), 'S/ 68,672');
  assert.equal(formatCifra(a, 1234.4), 'S/ 1,234');
  const b = parseCifra('×2,6');
  assert.equal(b.value, 2.6);
  assert.equal(formatCifra(b, 1.25), '×1,3');
  const c = parseCifra('+60.5 %');
  assert.equal(c.value, 60.5);
  assert.equal(formatCifra(c, c.value), '+60.5 %');
  const d = parseCifra('−25 %');
  assert.equal(formatCifra(d, 12), '−12 %');
  assert.equal(parseCifra('5 % → 17 %'), null);
  assert.equal(parseCifra('2024'), null);
  assert.equal(parseCifra('1 de cada 4'), null);
  assert.equal(parseCifra('nunca'), null);
  const e = parseCifra('1062 personas');
  assert.equal(formatCifra(e, 1062), '1062 personas');
});
