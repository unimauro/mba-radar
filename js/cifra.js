/* Cifras animables (puro, sin DOM: lo prueban los tests).
   parseCifra("S/ 68,672") → {pre: "S/ ", value: 68672, decimals: 0, dec: ".", group: ",", suf: ""}
   Solo se anima un texto con UN número (no rangos "5 % → 17 %", ni años sueltos). */

const NUM_RE = /\d[\d.,]*/g;
const ANIO_MIN = 1900, ANIO_MAX = 2100;

export function parseCifra(text) {
  const s = String(text ?? '');
  const nums = s.match(NUM_RE);
  if (!nums || nums.length !== 1) return null;
  const raw = nums[0].replace(/[.,]$/, '');
  const i = s.indexOf(raw);
  const pre = s.slice(0, i), suf = s.slice(i + raw.length);
  // Separadores: "68,672" / "1.234" (miles: grupos de 3) vs "2,6" / "60.5" (decimales).
  let dec = '.', group = ',', decimals = 0, grouped = false, value;
  const m = raw.match(/^(\d{1,3}(?:([.,])\d{3})*)(?:([.,])(\d+))?$/);
  if (m && m[2] && !m[3]) {                         // solo miles: 68,672
    group = m[2]; dec = group === ',' ? '.' : ','; grouped = true;
    value = +m[1].split(group).join('');
  } else if (m && m[3] && (!m[2] || m[2] !== m[3])) { // con decimales: 1,234.5 · 2,6 · 60.5
    dec = m[3]; group = m[2] || (dec === ',' ? '.' : ',');
    decimals = m[4].length; grouped = Boolean(m[2]);
    value = +(`${m[1].split(group).join('')}.${m[4]}`);
  } else if (/^\d+$/.test(raw)) {
    value = +raw;
  } else return null;
  if (!isFinite(value) || value <= 0) return null;
  if (!decimals && /^\d{4}$/.test(raw) && value >= ANIO_MIN && value <= ANIO_MAX) return null;   // año
  return {pre, value, decimals, dec, group, grouped, suf};
}

/** Formatea `v` con los separadores y decimales de la cifra original. */
export function formatCifra(c, v) {
  const fixed = Math.abs(v).toFixed(c.decimals);
  const [ent, frac] = fixed.split('.');
  const conMiles = c.grouped ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, c.group) : ent;
  return c.pre + conMiles + (frac ? c.dec + frac : '') + c.suf;
}
