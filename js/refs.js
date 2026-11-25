/* Referencias numeradas [n] y sección Fuentes.
   La numeración sigue el orden en que las secciones llaman a ref(): renderFuentes() va al final. */
import {$, esc, safeUrl} from './util.js';
import {data} from './state.js';

let refs = [];                     // [{key, txt, url}]

export const resetRefs = () => { refs = []; };

/** Registra (una vez por key) y devuelve el superíndice enlazado a la lista de fuentes. */
export function ref(key, txt, url) {
  let i = refs.findIndex(r => r.key === key);
  if (i < 0) { refs.push({key, txt, url}); i = refs.length - 1; }
  return `<sup class="ref"><a href="#ref-${i + 1}" title="${esc(txt)}">[${i + 1}]</a></sup>`;
}

export function renderFuentes() {
  $('metodo').innerHTML = (data.pais.metodologia || []).map(m => `<p>${esc(m)}</p>`).join('');
  $('refs').innerHTML = refs.map((r, i) =>
    `<li id="ref-${i + 1}">${esc(r.txt)} ${r.url ? `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">${esc(r.url)}</a>` : ''}</li>`).join('');
}
