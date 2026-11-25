/* Tarjetas de estudios y su buscador (texto + chips por signo del resultado). */
import {DEBOUNCE_MS, SIGNO_TXT} from './constants.js';
import {debounce, esc, matchAll, terms} from './util.js';
import {ref} from './refs.js';

const SIGNOS = Object.keys(SIGNO_TXT);
const filtrosPorBloque = {};            // {bloque: {q, s}}: se conserva al redibujar

export function studyCard(s) {
  const r = s.url ? ref(s.id || s.url, `${s.autores || ''} (${s.anio || ''}). ${s.titulo || ''}`, s.url) : '';
  const meta = `${esc(s.autores || '')}${s.anio ? ' · ' + esc(s.anio) : ''}${s.institucion ? ' · ' + esc(s.institucion) : ''}${s.tipo ? ' · ' + esc(s.tipo) : ''}`;
  return `<article class="study ${esc(s.signo)}"><span class="tag ${esc(s.signo)}">${esc(SIGNO_TXT[s.signo] || s.signo || '')}</span><h4>${esc(s.titulo)}${r}</h4><p>${esc(s.hallazgo_clave)}${s.cifra_clave ? ` <b>${esc(s.cifra_clave)}</b>` : ''}</p><div class="meta">${meta}</div></article>`;
}

/** Añade (o reutiliza) la barra de búsqueda encima de `list` y filtra sus <article class="study">. */
export function studyFilter(key, list) {
  if (!list) return;
  const arts = [...list.querySelectorAll('article.study')];
  const st = filtrosPorBloque[key] || (filtrosPorBloque[key] = {q: '', s: ''});
  let bar = list.previousElementSibling?.classList?.contains('cx-stbar') ? list.previousElementSibling : null;
  if (!arts.length) { bar?.remove(); return; }
  if (!bar) bar = mountBar(list, st);

  const inp = bar.querySelector('input');
  inp.value = st.q;
  bar.querySelector('.cx-clear').hidden = !st.q;
  const cnt = {};
  arts.forEach(a => { const s = SIGNOS.find(k => a.classList.contains(k)) || 'neutral'; cnt[s] = (cnt[s] || 0) + 1; });
  const presentes = SIGNOS.filter(k => cnt[k]);
  if (st.s && !cnt[st.s]) st.s = '';
  const chips = bar.querySelector('.cx-chips');
  chips.hidden = presentes.length < 2;
  bar._apply = () => {
    const ts = terms(st.q);
    let n = 0;
    arts.forEach(a => {
      const ok = (!st.s || a.classList.contains(st.s)) && (!ts.length || matchAll(a.textContent, ts));
      a.hidden = !ok;
      if (ok) n++;
    });
    chips.innerHTML = `<button type="button" data-s="" aria-pressed="${!st.s}">Todos</button>` +
      presentes.map(k => `<button type="button" data-s="${esc(k)}" aria-pressed="${st.s === k}" class="cx-s-${esc(k)}">${esc(SIGNO_TXT[k])} <small>${cnt[k]}</small></button>`).join('');
    bar.querySelector('.cx-st-n').textContent = n === arts.length ? `${n} estudios` : n ? `${n} de ${arts.length} estudios` : 'Ningún estudio coincide';
  };
  bar._apply();
}

function mountBar(list, st) {
  const bar = document.createElement('div');
  bar.className = 'cx-stbar';
  bar.innerHTML = `<div class="cx-st-q cx-combo"><input type="search" class="cx-st-in" placeholder="Buscar en estos estudios…" aria-label="Buscar en estudios" autocomplete="off"><button type="button" class="cx-clear" aria-label="Limpiar búsqueda" hidden>×</button></div><div class="cx-chips" role="group" aria-label="Filtrar por tipo de resultado"></div><span class="cx-st-n" aria-live="polite"></span>`;
  list.parentNode.insertBefore(bar, list);
  const inp = bar.querySelector('input'), clr = bar.querySelector('.cx-clear');
  inp.addEventListener('input', debounce(() => { st.q = inp.value; clr.hidden = !inp.value; bar._apply(); }, DEBOUNCE_MS.estudios));
  clr.addEventListener('click', () => { inp.value = ''; st.q = ''; clr.hidden = true; bar._apply(); inp.focus(); });
  bar.querySelector('.cx-chips').addEventListener('click', e => {
    const b = e.target.closest('button[data-s]');
    if (b) { st.s = st.s === b.dataset.s ? '' : b.dataset.s; bar._apply(); }
  });
  return bar;
}
