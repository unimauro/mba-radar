/* Interfaz fija de la página: barra de secciones (sección activa + indicadores de desborde) y copiar el número de Yape. */

const EDGE_PX = 4;                  // tolerancia para mostrar los indicadores "hay más"
const ACTIVE_LINE = 0.3;            // la sección activa es la última cuyo inicio pasó el 30 % del viewport
const COPY_RESET_MS = 2200;

export function setupPageChrome() {
  setupSecNav();
  setupYapeCopy();
}

function setupSecNav() {
  const nav = document.getElementById('secnav');
  const top = document.getElementById('top');
  const strip = nav.querySelector('.secnav-in');
  const links = [...nav.querySelectorAll('a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));

  const setHeaderH = () => document.documentElement.style.setProperty('--header-h', top.offsetHeight + 'px');
  setHeaderH(); window.addEventListener('resize', setHeaderH);

  const edges = () => {
    nav.classList.toggle('more-l', strip.scrollLeft > EDGE_PX);
    nav.classList.toggle('more-r', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - EDGE_PX);
  };
  strip.addEventListener('scroll', edges, {passive: true}); window.addEventListener('resize', edges); edges();

  let active = -1, ticking = false;
  const spy = () => {
    ticking = false;
    const line = top.offsetHeight + window.innerHeight * ACTIVE_LINE;
    let idx = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) idx = i; });
    if (idx === active) return;
    active = idx;
    links.forEach((a, i) => {
      if (i === idx) {
        a.setAttribute('aria-current', 'true');
        strip.scrollLeft = a.offsetLeft - strip.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
      } else a.removeAttribute('aria-current');
    });
    edges();
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, {passive: true});
  window.addEventListener('load', spy); spy();
}

function setupYapeCopy() {
  const btn = document.getElementById('yape-copy'), status = document.getElementById('yape-ok');
  btn.addEventListener('click', () => {
    const n = btn.getAttribute('data-num');
    const manual = () => { status.textContent = 'Copia manualmente: ' + n; };
    const done = () => {
      btn.textContent = 'Copiado'; btn.classList.add('ok'); status.textContent = 'Número copiado: ' + n;
      setTimeout(() => { btn.textContent = 'Copiar número'; btn.classList.remove('ok'); status.textContent = ''; }, COPY_RESET_MS);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(n).then(done, manual);
    else manual();
  });
}
