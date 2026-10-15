const HOSTS = Object.freeze({
  Meitre: new Set(['lasusana.meitre.com', 'oro.meitre.com', 'fasano.meitre.com']),
  Elyra: new Set(['widget.elyrasystems.com']),
  Guestplan: new Set(['angelicabooking.guestplan.io']),
  CoverManager: new Set(['www.covermanager.com']),
});
export function resolveNextWaveProvider(registry, restaurantId) {
  if (!registry || !Object.hasOwn(registry, restaurantId)) return null;
  const r = registry[restaurantId];
  try {
    const u = new URL(r.url), source = new URL(r.source);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !HOSTS[r.provider]?.has(u.hostname)) return null;
    if (source.protocol !== 'https:' || source.username || source.password) return null;
    if (!['native_embed', 'external_link'].includes(r.integrationMode)) return null;
    if (r.integrationMode === 'native_embed' && (r.provider === 'CoverManager' || r.verification !== 'embedded_form_loaded')) return null;
    return Object.freeze({ ...r, url: u.href, source: source.href, liveAvailabilitySupported: false, completionTracking: 'unsupported' });
  } catch { return null; }
}
