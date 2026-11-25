// Pruebas del modelo financiero (js/simular.js) y del esquema mínimo de data/paises/pe.json.
// Ejecutar: node --test tests/   (o make test)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simular} from '../js/simular.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
const BASE = {C: 60000, D: 18, S: 6000, ft: false, p: 0.17, H: 10, r: 0.08, t: 0.14};

test('caso a mano: sin descuento ni impuesto', () => {
  // S = 1200 → 1400 al mes (14 sueldos / 12); costo 1000/mes × 12; ganancia 0.5 × 1400 = 700/mes.
  const s2 = simular({C: 12000, D: 12, S: 1200, ft: false, p: 0.5, H: 2, r: 0, t: 0});
  close(s2.npv, -12000 + 12 * 700);
  assert.equal(s2.pay, null);
  close(s2.pEq, 12000 / (12 * 1400));
  assert.deepEqual(s2.anual.length, 3);
  close(s2.anual[1], -12000);

  const s3 = simular({C: 12000, D: 12, S: 1200, ft: false, p: 0.5, H: 3, r: 0, t: 0});
  close(s3.npv, -12000 + 24 * 700);
  assert.equal(s3.pay, 12 + 18);          // 18 meses × 700 = 12 600 ≥ 12 000
  assert.equal(s3.costoTotal, 12000);
});

test('VAN = 0 con la prima de equilibrio', () => {
  const {pEq} = simular(BASE);
  assert.ok(pEq > 0);
  close(simular({...BASE, p: pEq}).npv, 0, 1e-9);
  assert.ok(simular({...BASE, p: pEq * 1.01}).npv > 0);
  assert.ok(simular({...BASE, p: pEq * 0.99}).npv < 0);
});

test('el VAN crece con la prima y cae con la tasa de descuento', () => {
  assert.ok(simular({...BASE, p: 0.3}).npv > simular({...BASE, p: 0.2}).npv);
  assert.ok(simular({...BASE, r: 0.12}).npv < simular({...BASE, r: 0.04}).npv);
});

test('TIR: descontar a la TIR deja el VAN en cero', () => {
  const s = simular({...BASE, p: 0.4});
  assert.ok(s.irr > 0 && Number.isFinite(s.irr));
  close(simular({...BASE, p: 0.4, r: s.irr}).npv, 0, 1e-6);
  assert.equal(simular({...BASE, p: 0}).irr, null);     // nunca recupera: sin TIR
});

test('payback: primer mes con acumulado descontado ≥ 0, y solo tras egresar', () => {
  const s = simular({...BASE, p: 0.5});
  assert.ok(s.pay > BASE.D);
  const antes = simular({...BASE, p: 0.5, H: (s.pay - 1) / 12});
  assert.ok(antes.npv < 0);
  assert.equal(simular({...BASE, p: 0}).pay, null);
});

test('impuesto: pEq con t = 0.14 es pEq sin impuesto / 0.86 (part-time)', () => {
  const sinImp = simular({...BASE, t: 0}).pEq;
  const conImp = simular({...BASE, t: 0.14}).pEq;
  close(conImp, sinImp / 0.86, 1e-9);
});

test('full-time: suma el sueldo perdido y exige más aumento', () => {
  const pt = simular(BASE), ft = simular({...BASE, ft: true});
  close(ft.costoTotal, BASE.C + BASE.S * 14 / 12 * BASE.D);
  assert.equal(pt.costoTotal, BASE.C);
  assert.ok(ft.pEq > pt.pEq);
  assert.ok(ft.npv < pt.npv);
});

test('horizonte ≤ duración: no hay ganancia, ni equilibrio ni recuperación', () => {
  const s = simular({...BASE, D: 24, H: 2});
  assert.equal(s.pEq, null);
  assert.equal(s.pay, null);
  assert.ok(s.npv < 0);
  assert.equal(s.anual.length, 3);
});

test('esquema mínimo de data/paises/pe.json', () => {
  const pe = JSON.parse(readFileSync(new URL('../data/paises/pe.json', import.meta.url), 'utf8'));
  const SEGMENTOS = new Set(['Escuela de negocios con acreditación internacional', 'Universidad privada', 'Universidad pública']);
  const MODALIDADES = new Set(['Online', 'Full-time', 'Ejecutivo', 'Part-time / semipresencial']);
  const CONFIANZA = new Set(['alta', 'media', 'baja']);
  const SIGNOS = new Set(['positivo', 'negativo', 'mixto', 'neutral']);
  const numOrNull = v => v === null || (typeof v === 'number' && Number.isFinite(v));

  assert.equal(pe.pais.code, 'pe');
  assert.equal(typeof pe.pais.simbolo, 'string');
  assert.ok(pe.pais.tc_usd > 0);
  assert.ok(Array.isArray(pe.programas) && pe.programas.length > 0);
  const ids = new Set();
  for (const p of pe.programas) {
    const at = `programa ${p.id} (${p.universidad})`;
    assert.equal(typeof p.id, 'number', at); ids.add(p.id);
    assert.ok(p.universidad && p.programa, at);
    assert.ok(numOrNull(p.costo_soles), `${at}: costo_soles`);
    assert.ok(numOrNull(p.duracion_meses), `${at}: duracion_meses`);
    assert.ok(SEGMENTOS.has(p.segmento), `${at}: segmento ${p.segmento}`);
    assert.ok(MODALIDADES.has(p.modalidad_grupo), `${at}: modalidad_grupo ${p.modalidad_grupo}`);
    assert.ok(CONFIANZA.has(p.confianza), `${at}: confianza ${p.confianza}`);
    assert.ok(['PEN', 'USD'].includes(p.moneda_original), at);
    assert.ok(p.sede === null || typeof p.sede === 'string', `${at}: sede`);
    assert.ok([true, false, null].includes(p.es_mba_generalista), `${at}: es_mba_generalista`);
    assert.ok([true, false, null].includes(p.incluye_derecho_grado), `${at}: incluye_derecho_grado`);
    assert.ok(p.grupo_precio === null || typeof p.grupo_precio === 'string', `${at}: grupo_precio`);
  }
  assert.equal(ids.size, pe.programas.length, 'ids únicos');
  assert.ok(pe.sueldos_ref.every(r => r.etiqueta && r.mensual > 0));
  assert.ok(pe.presets_prima.every(x => typeof x.valor === 'number' && x.etiqueta));
  assert.ok([...pe.estudios, ...pe.alertas].every(s => SIGNOS.has(s.signo)));
  assert.ok(pe.enaho_resumen && typeof pe.enaho_resumen.prima_pct === 'number');
});
