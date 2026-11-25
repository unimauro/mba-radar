/* Navegación entre secciones. Punto único a reemplazar cuando exista un router de vistas. */
import {prefersReducedMotion} from './util.js';

export function goToSection(id) {
  document.getElementById(id).scrollIntoView({behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
}
