/* Botones para compartir: WhatsApp, LinkedIn, X, Facebook y copiar enlace.
   En pantallas táctiles con navigator.share se agrega el botón nativo "Compartir" al inicio. */
import {esc, safeUrl} from './util.js';
import {shareLinks} from './share-links.js';

const COPY_RESET_MS = 2000;
const FALLBACK_URL = 'https://unimauro.github.io/mba-radar/';

/* Íconos (trazo simple, 16 px, currentColor). */
const ICON = {
  share: '<path d="M8 2v8M4.5 5.5 8 2l3.5 3.5M3 9v4.5h10V9"/>',
  whatsapp: '<path d="M3 13.2 3.8 10.6A5.6 5.6 0 1 1 6 12.6Z"/><path d="M6.3 5.6c.2 1.8 1.6 3.4 3.6 3.9l.8-.9-1.2-.6-.5.5c-.7-.3-1.3-.9-1.6-1.6l.5-.5-.6-1.2Z" fill="currentColor" stroke="none"/>',
  linkedin: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5.3 7v4M5.3 5v.01M7.8 11V7.2M7.8 8.8c0-1 .7-1.8 1.6-1.8s1.4.6 1.4 1.6V11"/>',
  x: '<path d="M3 3l10 10M13 3 3 13"/>',
  facebook: '<path d="M9.5 14V8.5h1.8l.3-2H9.5V5.3c0-.6.2-1 1-1h1.1V2.6a12 12 0 0 0-1.6-.1c-1.6 0-2.6 1-2.6 2.7v1.4H5.6v2h1.8V14"/>',
  link: '<path d="M6.8 9.2a2.5 2.5 0 0 0 3.5 0l2.2-2.2a2.5 2.5 0 0 0-3.5-3.5l-.8.8M9.2 6.8a2.5 2.5 0 0 0-3.5 0L3.5 9a2.5 2.5 0 0 0 3.5 3.5l.8-.8"/>',
};
const icon = k => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

/** URL pública del sitio (og:url), para no compartir enlaces locales. */
export function siteUrl(view) {
  const base = document.querySelector('meta[property="og:url"]')?.content || FALLBACK_URL;
  return view ? `${base}#/${view}` : base;
}

const nativo = () => typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;

/**
 * Dibuja la barra en `host`. o = {url, text, title?, label?, dark?}
 * El texto nunca debe incluir datos personales (sueldo, nombre…).
 */
export function shareBar(host, o) {
  if (!host) return;
  host._share = o;
  const links = shareLinks(o.url, o.text);
  host.classList.add('cx-share');
  host.classList.toggle('cx-share-dark', Boolean(o.dark));
  host.innerHTML = `${o.label ? `<span class="cx-share-l">${esc(o.label)}</span>` : ''}<div class="cx-share-b">` +
    (nativo() ? `<button type="button" class="cx-sh cx-sh-native" data-sh="native">${icon('share')}<span>Compartir</span></button>` : '') +
    links.map(l => `<a class="cx-sh cx-sh-${esc(l.id)}" href="${esc(safeUrl(l.href))}" target="_blank" rel="noopener" data-sh="${esc(l.id)}">${icon(l.id)}<span>${esc(l.label)}</span></a>`).join('') +
    `<button type="button" class="cx-sh" data-sh="copy">${icon('link')}<span>Copiar enlace</span></button></div><span class="cx-share-ok" role="status" aria-live="polite"></span>`;
  if (host._shareInit) return;
  host._shareInit = true;
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-sh]'); if (!b) return;
    const cfg = host._share, kind = b.dataset.sh;
    window.dataLayer?.push({event: 'share', share_method: kind, share_url: cfg.url});
    if (kind === 'native') {
      navigator.share({title: cfg.title || document.title, text: cfg.text, url: cfg.url}).catch(() => {});
    } else if (kind === 'copy') {
      const ok = host.querySelector('.cx-share-ok');
      const done = () => { ok.textContent = 'Enlace copiado'; setTimeout(() => { ok.textContent = ''; }, COPY_RESET_MS); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(cfg.url).then(done, () => { ok.textContent = cfg.url; });
      else ok.textContent = cfg.url;
    }
  });
}
