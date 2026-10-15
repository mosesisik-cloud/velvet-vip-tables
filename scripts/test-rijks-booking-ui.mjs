import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const restaurants = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'data/booking-providers.json'), 'utf8'));
const row = restaurants.destinations.AMS.restaurants.find((item) => item.placeId === 'curated-AMS-rijks');
const reservationUrl = 'https://www.rijksrestaurant.nl/reserveren/';
const policyUrl = 'https://www.rijksrestaurant.nl/wp-content/uploads/2024/10/08.10.2024-Annuleringsvoorwaarden_NL_ENG.pdf';
assert.equal(row.address, 'Museumstraat 2, Amsterdam, Netherlands');
assert.equal(row.bookingDirect, true);
assert.equal(row.bookingUrl, reservationUrl);
assert.equal(row.bookingProvider, 'rijksrestaurant.nl');
assert.equal(row.cancellationPolicySource, policyUrl);
assert.equal(Object.hasOwn(registry, 'curated-AMS-rijks'), false);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('path');
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
try {
  for (const lang of ['sv', 'en', 'es', 'fr']) {
    const context = await browser.newContext();
    await context.addInitScript((value) => localStorage.setItem('velvet_lang', value), lang);
    await context.route('**/*', (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(base + '#/restaurant/curated-AMS-rijks');
    const panel = page.locator('.restaurant-book-panel');
    const book = panel.locator('a.restaurant-live-book');
    await book.waitFor();
    assert.equal(await book.getAttribute('href'), reservationUrl);
    assert.equal(await panel.locator('#restaurant-book-form, iframe, option').count(), 0);
    assert.match(await panel.locator('.restaurant-live-note').innerText(), /rijksrestaurant\.nl/);
    assert.equal(await panel.locator('.booking-cancellation-notice a').getAttribute('href'), policyUrl);
    assert.match(await page.locator('.restaurant-facts').innerText(), /Museumstraat 2/);
    await context.close();
  }
  console.log('PASS RIJKS: official reservation link in four languages, no invented times, policy PDF linked, no Guestplan registry entry');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
