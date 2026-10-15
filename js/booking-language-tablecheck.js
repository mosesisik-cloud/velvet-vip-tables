/** Locale paths observed through TableCheck's own Sazon language picker. */
export function tableCheckBookingLanguage(rawUrl, requestedLanguage) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'www.tablecheck.com' || url.port || url.username || url.password) return null;
  // The legacy /shops/... widget has a different contract; do not guess its locale API.
  if (!/^\/(en|es|fr)\/[^/]+\/reserve(?:\/|$)/.test(url.pathname)) return null;
  const requested = String(requestedLanguage || '').toLowerCase();
  const language = ['en', 'es', 'fr'].includes(requested) ? requested : 'en';
  url.pathname = url.pathname.replace(/^\/(en|es|fr)\//, '/' + language + '/');
  return {url: url.href, language, requestedLanguage: requested, fallback: language !== requested};
}
