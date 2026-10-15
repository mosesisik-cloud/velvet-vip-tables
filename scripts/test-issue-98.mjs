import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const id = 'curated-MYK-nammos-mykonos';
const root = path.resolve(import.meta.dirname, '..');
const restaurants = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
const row = restaurants.destinations.MYK.restaurants.find((item) => item.placeId === id);
assert.ok(row);
assert.match(row.address, /Psarou Beach/);
assert.match(row.address, /84600/);
assert.equal(row.phone, '+30 22890 22440');
assert.equal(row.email, 'feelings@nammos.gr');
assert.equal(row.website, 'https://www.nammos.com/mykonos');
assert.equal(row.openingHours, 'Beach: 11.00-19.00 · Restaurant: 13.00-02.00');
assert.equal(row.bookingDirect, undefined);
assert.equal(row.bookingUrl, undefined);
assert.equal(row.bookingProvider, undefined);
assert.equal(row.operatingStatus, undefined);
assert.notEqual(row.bookingDirect, true);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('velvet_lang', 'en'));
  await context.route('**/*', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === new URL(base).origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(base + '#/restaurant/' + id, { waitUntil: 'domcontentloaded' });
  const facts = page.locator('.restaurant-facts');
  await facts.waitFor();
  await page.locator('#restaurant-book-form').waitFor();
  const text = await facts.innerText();
  assert.match(text, /Psarou Beach/);
  assert.match(text, /84600/);
  assert.match(text, /\+30 22890 22440/);
  assert.match(text, /feelings@nammos\.gr/);
  assert.equal(await page.locator('a.restaurant-live-book').count(), 0);
  assert.equal(await page.locator('#restaurant-book-form').count(), 1);
  await context.close();
  console.log('PASS issue 98: NAMMOS Mykonos contact facts visible, no direct booking link, request form still present');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
