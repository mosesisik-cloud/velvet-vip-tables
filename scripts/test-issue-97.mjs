import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const id = 'curated-MRB-mamzel-marbella';
const root = path.resolve(import.meta.dirname, '..');
const restaurants = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
const row = restaurants.destinations.MRB.restaurants.find((item) => item.placeId === id);
assert.equal(row.name, 'Mamzel Marbella');
assert.equal(row.address, 'Urbanización Rio Verde Alto 1, 29600 Marbella, Málaga, Spain');
assert.equal(row.website, 'https://mamzelmarbella.com/');
assert.equal(row.phone, '+34 951 55 23 88');
assert.equal(row.email, 'reservations@mamzelmarbella.com');
assert.notEqual(row.bookingDirect, true);
assert.equal(row.bookingUrl, undefined);
assert.equal(row.bookingProvider, undefined);
assert.equal(row.operatingStatus, undefined);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
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
    let local = false;
    try { local = new URL(request.url()).origin === new URL(base).origin; } catch { local = false; }
    if (local && (request.method() === 'GET' || request.method() === 'HEAD')) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(base + '#/restaurant/' + id, { waitUntil: 'domcontentloaded' });
  const form = page.locator('#restaurant-book-form');
  await form.waitFor({ timeout: 15000 });
  assert.equal(await page.locator('a.restaurant-live-book').count(), 0);
  assert.equal(await form.count(), 1);
  const facts = await page.locator('.restaurant-facts').innerText();
  assert.match(facts, /Rio Verde Alto 1/);
  assert.match(facts, /29600/);
  assert.match(facts, /\+34 951 55 23 88/);
  assert.match(facts, /reservations@mamzelmarbella\.com/);
  await context.close();
  console.log('PASS issue 97: Mamzel contact facts only, synthetic request form remains, no direct booking link');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
