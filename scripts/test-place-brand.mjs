import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let moduleId = 0;
async function fresh() { return import(`../js/place-brand.js?test=${++moduleId}`); }
const brand = { src: 'media/brands/original.svg', source: 'https://example.com/', verifiedAt: '2026-10-15', surface: 'light' };

test('curated manifests render original assets with reserved dimensions and accessible fallback', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async path => { requests++; return { ok: true, json: async () => path.includes('restaurant') ? { shared: brand } : { shared: { ...brand, src: 'media/brands/venue.png', surface: 'dark' } } }; };
  try {
    const module = await fresh();
    assert.match(module.placeBrandHTML({ placeId: 'shared', name: 'Before load' }), /place-brand-name/);
    assert.deepEqual(await module.loadPlaceBrands(), { restaurants: 1, venues: 1 });
    await module.loadPlaceBrands();
    assert.equal(requests, 2);
    const html = module.placeBrandHTML({ placeId: 'shared', name: 'A < B & "C"' });
    assert.match(html, /src="media\/brands\/original.svg"/);
    assert.match(html, /aria-label="A &lt; B &amp; &quot;C&quot;"/);
    assert.match(html, /width="160" height="40"/);
    assert.match(html, /alt=""/);
    assert.match(html, /place-brand-fallback/);
    assert.match(html, /class="place-brand-caption" aria-hidden="true">A &lt; B &amp; &quot;C&quot;<\/span>/);
    const detail = module.placeBrandHTML({ venue_id: 'shared', name: 'Venue' }, 'detail');
    assert.match(detail, /place-brand--dark/);
    assert.match(detail, /src="media\/brands\/venue.png"/);
    assert.match(detail, /width="320" height="80"/);
    assert.doesNotMatch(detail, /place-brand-caption/);
    // Error handler uses only static code and reveals the existing escaped name.
    const handler = html.match(/onerror="([^"]+)"/)[1];
    const classes = new Set();
    const image = { hidden: false, parentElement: { classList: { add: value => classes.add(value) } } };
    Function(handler).call(image);
    assert.equal(image.hidden, true);
    assert.ok(classes.has('place-brand--failed'));
    assert.doesNotMatch(module.placeBrandHTML({ placeId: '__proto__', name: '<script>' }, '"><img>'), /<script>|<img/);
  } finally { globalThis.fetch = originalFetch; }
});

test('unsafe sources and malformed entries fall back to escaped text', async () => {
  const originalFetch = globalThis.fetch;
  const unsafe = ['https://example.com/logo.png', '//example.com/a.svg', 'data:image/svg+xml,x', 'media/brands/../x.svg', 'media/brands/%2e%2e/x.svg', 'media/brands/a.svg?x=1', 'media/brands/a.svg" onload="bad'];
  globalThis.fetch = async () => ({ ok: true, json: async () => Object.fromEntries([
    ...unsafe.map((src, id) => [String(id), { ...brand, src }]),
    ['badSurface', { ...brand, surface: '" onclick="bad' }],
    ['badSource', { ...brand, source: 'javascript:alert(1)' }],
  ]) });
  try {
    const module = await fresh();
    assert.deepEqual(await module.loadPlaceBrands(), { restaurants: 0, venues: 0 });
    for (let i = 0; i < unsafe.length; i++) assert.doesNotMatch(module.placeBrandHTML({ placeId: String(i), name: '<unsafe>' }), /<img|<unsafe>/);
  } finally { globalThis.fetch = originalFetch; }
});

test('manifest failure is isolated and optional brand loading never blocks text', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async path => { if (path.includes('restaurant')) throw Error('offline'); return { ok: true, json: async () => ({ venue: brand }) }; };
  try {
    const module = await fresh();
    assert.deepEqual(await module.loadPlaceBrands(), { restaurants: 0, venues: 1 });
    assert.equal(module.placeBrandHTML({ placeId: 'missing', name: 'Name & Co' }), '<span class="place-brand-name place-brand-name--card">Name &amp; Co</span>');
    assert.match(module.placeBrandHTML({ venue_id: 'venue', name: 'Venue' }), /<img/);
  } finally { globalThis.fetch = originalFetch; }
});

test('optional manifest requests abort after three seconds', async () => {
  const originalFetch = globalThis.fetch;
  const originalTimeout = globalThis.setTimeout;
  const requestedTimeouts = [];
  globalThis.setTimeout = (callback, delay) => { requestedTimeouts.push(delay); queueMicrotask(callback); return 0; };
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }));
  try {
    const module = await fresh();
    assert.deepEqual(await module.loadPlaceBrands(), { restaurants: 0, venues: 0 });
    assert.deepEqual(requestedTimeouts, [3000, 3000]);
  } finally { globalThis.fetch = originalFetch; globalThis.setTimeout = originalTimeout; }
});

test('curated registries reference known places, real local assets and recorded provenance', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const readJSON = async name => JSON.parse(await fs.readFile(path.join(root, 'data', name), 'utf8'));
  const [restaurants, venues, unlisted, restaurantBrands, venueBrands] = await Promise.all([
    readJSON('restaurants.json'), readJSON('venues.json'), readJSON('unlisted-venues.json'),
    readJSON('restaurant-brands.json'), readJSON('venue-brands.json'),
  ]);
  const restaurantIds = new Set(Object.values(restaurants.destinations).flatMap(destination => (destination.restaurants || []).map(restaurant => restaurant.placeId)));
  const venueIds = new Set([...venues, ...unlisted].map(venue => venue.venue_id));
  for (const [registry, ids] of [[restaurantBrands, restaurantIds], [venueBrands, venueIds]]) {
    assert.ok(registry && typeof registry === 'object' && !Array.isArray(registry));
    for (const [id, entry] of Object.entries(registry)) {
      assert.ok(ids.has(id), `Unknown place ID: ${id}`);
      assert.match(entry.src, /^media\/brands\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:png|jpe?g|webp|gif|svg|avif)$/i, id);
      assert.ok(['light', 'dark'].includes(entry.surface), id);
      const source = new URL(entry.source);
      assert.equal(source.protocol, 'https:', id);
      assert.equal(source.username + source.password, '', id);
      assert.match(entry.verifiedAt, /^\d{4}-\d{2}-\d{2}(?:$|T)/, id);
      assert.ok(Number.isFinite(Date.parse(entry.verifiedAt)), id);
      const assetPath = path.resolve(root, entry.src);
      assert.ok(assetPath.startsWith(path.join(root, 'media', 'brands') + path.sep), id);
      const bytes = await fs.readFile(assetPath);
      assert.ok(bytes.length > 0, `Empty asset: ${entry.src}`);
      if (/\.svg$/i.test(entry.src)) {
        const svg = bytes.toString('utf8');
        assert.match(svg, /<svg[\s>]/i, entry.src);
        assert.doesNotMatch(svg, /<\s*(?:script|foreignObject|iframe|object|embed)\b|<!ENTITY|<!DOCTYPE|\son[a-z]+\s*=|@import/i, entry.src);
        for (const link of svg.matchAll(/(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi)) assert.ok(link[2].startsWith('#'), `External SVG reference: ${entry.src}`);
        for (const url of svg.matchAll(/url\(\s*["']?([^\s"')]+)/gi)) assert.ok(url[1].startsWith('#'), `External SVG CSS reference: ${entry.src}`);
      }
    }
  }
});
