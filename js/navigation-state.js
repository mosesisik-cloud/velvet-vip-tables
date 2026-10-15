// UI navigation only; never stores guest details or booking credentials.
export function primarySection(hash = '#/') {
  const path = hash.split('?')[0];
  if (/^#\/(bookings|table|join|pay|pay-return)(\/|$)/.test(path)) return '#/bookings';
  if (/^#\/(favorites|list)(\/|$)/.test(path)) return '#/favorites';
  if (/^#\/(account|verify|card|user|payout|promoters|promoter)(\/|$)/.test(path)) return '#/account';
  if (/^#\/(villkor|integritet)$/.test(path)) return null;
  return '#/';
}

export function isDiscoveryList(hash = '') {
  return /^#\/(venues|restaurants|availability|destinations|map|favorites)(\?|$)/.test(hash) || /^#\/destination\/[^/?]+(?:\?|$)/.test(hash);
}

export function safeDiscoveryReturn(hash) {
  return typeof hash === 'string' && isDiscoveryList(hash) ? hash : null;
}
