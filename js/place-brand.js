// Only locally stored original brand assets from the curated manifests are rendered.
const manifests = { restaurants: Object.create(null), venues: Object.create(null) };
let loading;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeAsset(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  // No URL schemes, encoded separators, traversal, query strings or event markup.
  if (!/^media\/brands\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(entry.src || '')) return false;
  if (String(entry.src).split('/').some(segment => segment === '.' || segment === '..')) return false;
  if (!['light', 'dark'].includes(entry.surface)) return false;
  try {
    const source = new URL(entry.source);
    return source.protocol === 'https:' && !source.username && !source.password;
  } catch { return false; }
}

async function readManifest(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(path, { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) return Object.create(null);
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return Object.create(null);
    return Object.fromEntries(Object.entries(data).filter(([, entry]) => safeAsset(entry)));
  } catch { return Object.create(null); }
  finally { clearTimeout(timeout); }
}

export function loadPlaceBrands() {
  if (!loading) {
    loading = Promise.all([
      readManifest('data/restaurant-brands.json'),
      readManifest('data/venue-brands.json'),
    ]).then(([restaurants, venues]) => {
      manifests.restaurants = restaurants;
      manifests.venues = venues;
      return { restaurants: Object.keys(restaurants).length, venues: Object.keys(venues).length };
    });
  }
  return loading;
}

export function placeBrandHTML(item, variant = 'card') {
  const kind = variant === 'detail' ? 'detail' : 'card';
  const name = escapeHTML(item?.name || '');
  const id = item?.placeId || item?.venue_id;
  const catalog = item?.placeId ? manifests.restaurants : manifests.venues;
  const brand = id && Object.hasOwn(catalog, id) ? catalog[id] : null;
  if (!brand) return `<span class="place-brand-name place-brand-name--${kind}">${name}</span>`;
  const width = kind === 'detail' ? 320 : 160;
  const height = kind === 'detail' ? 80 : 40;
  const logo = `<span class="place-brand place-brand--${kind} place-brand--${brand.surface}" role="img" aria-label="${name}"><img src="${escapeHTML(brand.src)}" alt="" width="${width}" height="${height}" decoding="async"${kind === 'card' ? ' loading="lazy"' : ''} onerror="this.hidden=true;this.parentElement.classList.add('place-brand--failed')"><span class="place-brand-fallback" aria-hidden="true">${name}</span></span>`;
  return logo + (kind === 'card' ? `<span class="place-brand-caption" aria-hidden="true">${name}</span>` : '');
}
