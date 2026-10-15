import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const restaurants = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'data/booking-providers.json'), 'utf8'));
const row = restaurants.destinations.CNS.restaurants.find((item) => item.placeId === 'curated-CNS-la-guerite-cannes');
assert.equal(row.operatingStatus, 'seasonally_closed');
assert.equal(row.address, 'Île Sainte-Marguerite, 06400 Cannes, France');
assert.equal(row.website, 'https://www.restaurantlaguerite.com/cannes/');
assert.equal(row.operatingStatusSource, 'https://www.sevenrooms.com/reservations/lagueritecannes/');
assert.equal(row.bookingDirect, undefined);
assert.equal(Object.hasOwn(registry, 'curated-CNS-la-guerite-cannes'), false);
assert.equal(registry['osm-SBH-la-guerite'].venueId, 'lagueritedb');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('path');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
try {
  for (const [lang, heading] of [['sv', 'Stängd för säsongen 2026'], ['en', 'Closed for the 2026 season'], ['es', 'Cerrado por la temporada 2026'], ['fr', 'Fermé pour la saison 2026']]) {
    const context = await browser.newContext();
    await context.addInitScript((value) => localStorage.setItem('velvet_lang', value), lang);
    await context.route('**/*', (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(base + '#/restaurant/curated-CNS-la-guerite-cannes');
    const panel = page.locator('.restaurant-book-panel');
    await panel.getByRole('heading', { name: heading, exact: true }).waitFor();
    assert.match(await panel.locator('.restaurant-closed-notice').innerText(), /We are now closed for the 2026 season/);
    assert.equal(await panel.locator('form,button,iframe').count(), 0);
    assert.equal(await panel.locator('.booking-cancellation-notice').isVisible(), false);
    assert.equal(await panel.locator('.restaurant-closed-notice a').getAttribute('href'), 'https://www.sevenrooms.com/reservations/lagueritecannes/');
    assert.match(await page.locator('.restaurant-facts').innerText(), /Sainte-Marguerite/);
    assert.equal(await page.locator('#restaurant-book-jump').count(), 0);
    await context.close();
  }
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('velvet_lang', 'en'));
  await context.route('**/*', (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(base + '#/restaurant/osm-MIA-lokal-burgers-and-beer');
  await page.locator('.restaurant-book-panel').getByRole('heading', { name: 'Permanently closed', exact: true }).waitFor();
  await context.close();
  console.log('PASS seasonal closure: La Guérite Cannes notice in four languages, no request form, permanent closure unchanged');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
