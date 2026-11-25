/* Enlaces para compartir (puro, sin DOM: lo prueban los tests). */

const enc = encodeURIComponent;

/**
 * @param {string} url  enlace a compartir
 * @param {string} text texto (sin datos personales)
 * @returns {Array<{id: string, label: string, href: string}>}
 */
export function shareLinks(url, text) {
  const t = String(text || '').trim();
  return [
    {id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(t ? `${t} ${url}` : url)}`},
    {id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`},
    {id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(url)}`},
    {id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`},
  ];
}
