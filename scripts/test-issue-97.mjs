import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const id = 'curated-MRB-mamzel-marbella';
const bookingUrl = 'https://www.sevenrooms.com/reservations/mamzelmarbella';
const root = path.resolve(import.meta.dirname, '..');
const restaurants = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
const row = restaurants.destinations.MRB.restaurants.find((item) => item.placeId === id);
assert.equal(row.name, 'Mamzel Marbella');
assert.equal(row.address, 'Urbanización Rio Verde Alto 1, 29600 Marbella, Málaga, Spain');
assert.equal(row.website, 'https://mamzelmarbella.com/');
assert.equal(row.phone, '+34 951 55 23 88');
assert.equal(row.email, 'reservations@mamzelmarbella.com');
assert.equal(row.bookingUrl, bookingUrl);
assert.equal(row.bookingProvider, 'SevenRooms');
assert.equal(row.bookingDirect, true);
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
    const local = new URL(request.url()).origin === new URL(base).origin;
    if (local && (request.method() === 'GET' || request.method() === 'HEAD')) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(base + '#/restaurant/' + id, { waitUntil: 'domcontentloaded' });
  const panel = page.locator('.restaurant-book-panel');
  const link = panel.locator('a.restaurant-live-book');
  await link.waitFor({ timeout: 15000 });
  assert.equal(await link.getAttribute('href'), bookingUrl);
  assert.equal(await page.locator('#restaurant-book-form').count(), 0);
  assert.equal(await panel.getByRole('heading', { name: 'Permanently closed', exact: true }).count(), 0);
  assert.match(await page.locator('.restaurant-facts').innerText(), /Rio Verde Alto 1/);
  assert.match(await page.locator('.restaurant-facts').innerText(), /29600/);
  await context.close();
  console.log('PASS issue 97: Mamzel Marbella official SevenRooms link, no request form');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
