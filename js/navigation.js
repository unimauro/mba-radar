/* Navegación entre vistas. goToSection(id) lleva a la vista que contiene el elemento `id`
   (o a la vista `id` si es su nombre) y se desplaza hasta él. */
import {navigate} from './router.js';
import {LEGACY_ANCHORS, VIEWS} from './route.js';

export function goToSection(id) {
  if (VIEWS.includes(id)) return navigate(id);
  if (LEGACY_ANCHORS[id]) { const [v, a] = LEGACY_ANCHORS[id]; return navigate(v, a); }
  const v = document.getElementById(id)?.closest('.view')?.dataset.view;
  if (v) navigate(v, id);
}
