// Only reviewed restaurant -> provider mappings are enabled. Discovery results
// must never be used as booking destinations without checking the venue.
let registryPromise;
let reviewedRegistry = {};
export const hasEmbeddedBooking = id => !!resolveEmbeddedBooking(reviewedRegistry, id);
export function resolveEmbeddedBooking(registry, restaurantId) {
  const row = registry?.[restaurantId];
  if (!row || row.provider !== 'SevenRooms' || !/^[a-z0-9_-]+$/i.test(row.venueId)) return null;
  try {
    const url = new URL(row.url);
    if (url.protocol !== 'https:' || !['www.sevenrooms.com', 'sevenrooms.com', 'eu.sevenrooms.com'].includes(url.hostname)
      || url.username || url.password || url.port || url.search || url.hash) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (!['reservations', 'explore'].includes(parts[0]) || parts[1] !== row.venueId) return null;
    if (parts[0] === 'reservations' && parts.length !== 2) return null;
    if (parts[0] === 'explore' && parts.slice(2).join('/') !== 'reservations/create/search') return null;
    return { ...row, url: url.href };
  } catch { return null; }
}

export async function getEmbeddedBooking(restaurantId) {
  registryPromise ||= fetch(new URL('../data/booking-providers.json', import.meta.url), { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('registry_unavailable'); return response.json(); })
    .then(registry => { reviewedRegistry = registry; return registry; })
    .catch(() => { registryPromise = null; return {}; });
  return resolveEmbeddedBooking(await registryPromise, restaurantId);
}

export function mountEmbeddedBooking(container, booking) {
  // The cross-origin provider owns every field, availability response, consent,
  // payment and confirmation. Velvet does not infer success from iframe loads
  // or untrusted postMessages, and does not store contact or card details.
  const source = document.createElement('p');
  source.className = 'booking-source';
  source.textContent = `Bokning via ${booking.provider} · Utan Velvet-konto`;
  const intro = document.createElement('p');
  intro.className = 'booking-intro';
  intro.textContent = 'Restaurangens eget bokningsformulär öppnas här.';
  const start = document.createElement('button');
  start.className = 'btn btn-gold'; start.type = 'button'; start.textContent = 'Hitta ett bord';
  const stage = document.createElement('div'); stage.className = 'booking-provider-stage';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const fallback = document.createElement('a');
  fallback.href = booking.url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
  fallback.className = 'restaurant-official-book';
  fallback.textContent = 'Öppna bokningen i en egen flik ↗';
  container.replaceChildren(source, intro, start, status, stage, fallback);
  start.addEventListener('click', () => {
    if (stage.firstChild) return;
    start.remove();
    intro.textContent = 'Lediga tider, villkor och bokningsbekräftelse visas av restaurangen i formuläret.';
    status.textContent = 'Öppnar bokningen…';
    const frame = document.createElement('iframe');
    frame.className = 'booking-provider-frame';
    frame.title = `Boka bord hos ${booking.name} via ${booking.provider}`;
    frame.allow = 'payment';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('load', () => { status.textContent = ''; });
    frame.addEventListener('error', () => { status.textContent = 'Om formuläret inte visas kan du öppna bokningen i en egen flik.'; });
    frame.src = booking.url;
    stage.append(frame);
  });
}
