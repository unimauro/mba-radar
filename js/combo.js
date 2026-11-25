/* Combobox accesible sobre un <input> + <ul> (sin <select> nativo): teclado, táctil, resaltado y botón limpiar.
   combo() se puede llamar varias veces: la primera monta los eventos, las siguientes solo cambian cfg.
   cfg = {source() → [{label, sub, val}], onPick(item), onType?(texto), onClear?()}
   Evento 'cx-sync' en el input: el valor cambió desde fuera → actualizar botón limpiar y cerrar la lista. */
import {MAX_SUGERENCIAS} from './constants.js';
import {esc, highlight, isMob, matchAll, terms} from './util.js';

export function combo(input, list, cfg) {
  input._cx = cfg;
  if (input._cxInit) return;
  input._cxInit = true;

  const wrap = input.closest('.combo') || input.parentNode;
  wrap.classList.add('cx-combo');
  const clr = document.createElement('button');
  clr.type = 'button'; clr.className = 'cx-clear'; clr.setAttribute('aria-label', 'Limpiar búsqueda'); clr.textContent = '×';
  wrap.appendChild(clr);
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false');
  if (list.id) input.setAttribute('aria-controls', list.id);

  let items = [], sel = -1;
  const sync = () => { clr.hidden = !input.value; };
  const close = () => { list.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const pick = item => { input._cx.onPick(item); close(); sync(); };
  const draw = () => {
    const ts = terms(input.value);
    items = input._cx.source().filter(it => !ts.length || matchAll(it.label + ' ' + it.sub, ts)).slice(0, MAX_SUGERENCIAS);
    list.innerHTML = items.map((it, i) => `<li role="option" id="${esc(list.id)}-o${i}" data-i="${i}" aria-selected="${i === sel}">${highlight(it.label, ts)}<small>${highlight(it.sub, ts)}</small></li>`).join('')
      || '<li class="empty">Sin resultados</li>';
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
    if (sel >= 0) { input.setAttribute('aria-activedescendant', `${list.id}-o${sel}`); list.children[sel]?.scrollIntoView({block: 'nearest'}); }
  };

  input.addEventListener('input', () => { sel = -1; sync(); draw(); input._cx.onType?.(input.value); });
  input.addEventListener('cx-sync', () => { sync(); close(); });
  input.addEventListener('focus', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, items.length - 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') {
      if (items[sel]) input._cx.onPick(items[sel]);
      close(); sync(); e.preventDefault();
      if (isMob()) input.blur();
    }
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('mousedown', e => e.preventDefault());           // no robar el foco en escritorio
  list.addEventListener('click', e => {
    const li = e.target.closest('li[data-i]');
    if (!li) return;
    pick(items[+li.dataset.i]);
    if (isMob()) input.blur();
  });
  clr.addEventListener('click', () => { input.value = ''; sync(); close(); input._cx.onType?.(''); input._cx.onClear?.(); input.focus(); });
  document.addEventListener('pointerdown', e => { if (!list.hidden && !wrap.contains(e.target)) close(); }, {passive: true});
  input.addEventListener('focusout', e => { if (e.relatedTarget && !wrap.contains(e.relatedTarget)) close(); });
  sync();
}
