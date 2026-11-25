/* Interfaz fija de la página: alto del encabezado, indicadores de desborde de la barra de vistas
   (la vista activa la marca router.js) y copiar el número de Yape / Plin. */

const EDGE_PX = 4;                  // tolerancia para mostrar los indicadores "hay más"
const COPY_RESET_MS = 2200;

export function setupPageChrome() {
  setupSecNav();
  setupYapeCopy();
}

function setupSecNav() {
  const nav = document.getElementById('secnav');
  const top = document.getElementById('top');
  const strip = nav.querySelector('.secnav-in');

  const setHeaderH = () => document.documentElement.style.setProperty('--header-h', top.offsetHeight + 'px');
  setHeaderH(); window.addEventListener('resize', setHeaderH);

  const edges = () => {
    nav.classList.toggle('more-l', strip.scrollLeft > EDGE_PX);
    nav.classList.toggle('more-r', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - EDGE_PX);
  };
  strip.addEventListener('scroll', edges, {passive: true});
  window.addEventListener('resize', edges);
  nav.addEventListener('cx-nav', edges);
  edges();
}

function setupYapeCopy() {
  const btn = document.getElementById('yape-copy'), status = document.getElementById('yape-ok');
  btn.addEventListener('click', () => {
    const n = btn.getAttribute('data-num');
    const manual = () => { status.textContent = 'Copia manualmente: ' + n; };
    const done = () => {
      btn.textContent = 'Copiado'; btn.classList.add('ok'); status.textContent = 'Número copiado (Yape o Plin): ' + n;
      setTimeout(() => { btn.textContent = 'Copiar número'; btn.classList.remove('ok'); status.textContent = ''; }, COPY_RESET_MS);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(n).then(done, manual);
    else manual();
  });
}
