// Reviewed records only. This resolver does not discover venues or assert availability.
const HOSTS = Object.freeze({
  TableCheck: ['www.tablecheck.com'], Zenchef: ['bookings.zenchef.com'],
  'ResDiary / Dish Cult': ['booking.resdiary.com'], Tableo: ['app.tableo.com'],
  Restoo: ['palomaibiza.myrestoo.net'], 'Eat App': ['eatapp.co'],
  TheFork: ['widget.thefork.com', 'module.lafourchette.com'],
  Resy: ['resy.com'], Tock: ['www.exploretock.com'], OMAKASE: ['omakase.in'],
});
const EMBED = new Set(['TableCheck', 'Zenchef', 'ResDiary / Dish Cult', 'Tableo', 'Restoo', 'Eat App']);
export function resolveRemainingProvider(registry, restaurantId) {
  if (!registry || !Object.hasOwn(registry, restaurantId)) return null;
  const record = registry[restaurantId];
  try {
    const url = new URL(record.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !HOSTS[record.provider]?.includes(url.hostname)) return null;
    const source = new URL(record.source);
    if (source.protocol !== 'https:' || source.username || source.password) return null;
    const embedded = record.integrationMode === 'native_embed' && record.verification === 'embedded_form_loaded' && EMBED.has(record.provider);
    if (!embedded && record.integrationMode !== 'external_link') return null;
    // Old official links can contain stale search dates; never carry these into a new visit.
    if (record.provider === 'Resy') { url.searchParams.delete('date'); url.searchParams.delete('seats'); }
    return Object.freeze({restaurantId, provider: record.provider, name: record.name, city: record.city,
      url: url.href, source: source.href, integrationMode: embedded ? 'native_embed' : 'external_link',
      liveAvailabilitySupported: false, completionTracking: 'unsupported'});
  } catch { return null; }
}
