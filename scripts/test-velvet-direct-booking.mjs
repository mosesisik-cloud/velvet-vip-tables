import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const restaurantId = 'curated-STO-zink-italian-cuisine';
const root = path.resolve(import.meta.dirname, '..');
const sessionToken = 'velvet-playwright-direct-token';
const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
const user = {
  id: 'U-playwright-direct',
  provider: 'passkey',
  name: 'Pilot Guest',
  email: 'pilot@example.com',
  connected: true,
  authVerified: true,
  deviceBound: true,
};
const directPosts = new Set([
  '/restaurant-bookings/webbridge/availability',
  '/restaurant-bookings/webbridge/book',
]);

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });
}

function staticServer() {
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep) && file !== root) throw new Error('path');
      const body = await fs.promises.readFile(file);
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function waitBoot(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('api boot timeout')), 15000);
    const on = (buf) => {
      if (String(buf).includes('velvet-api')) {
        clearTimeout(timer);
        child.stdout.off('data', on);
        child.stderr.off('data', on);
        resolve();
      }
    };
    child.stdout.on('data', on);
    child.stderr.on('data', on);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error('api exited ' + code)); });
  });
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-direct-'));
const dataFile = path.join(dir, 'store.json');
const outboundLog = path.join(dir, 'outbound.log');
fs.writeFileSync(outboundLog, '');
fs.writeFileSync(dataFile, JSON.stringify({
  tables: [],
  restaurantBookings: [],
  idv: {},
  reviews: [],
  chats: {},
  promoters: {},
  users: { [user.id]: user },
  payments: [],
  sessions: {
    [sessionHash]: {
      userId: user.id,
      created: Date.now(),
      lastUsed: Date.now(),
      exp: Date.now() + 86400000,
    },
  },
}));

const apiPort = await freePort();
const api = spawn(process.execPath, [path.join(root, 'api', 'server.mjs')], {
  cwd: path.join(root, 'api'),
  env: {
    ...process.env,
    PORT: String(apiPort),
    VELVET_DATA: dataFile,
    VELVET_PAY: path.join(dir, 'pay.json'),
    VELVET_CRAWL: '0',
    VELVET_RATE: '0',
    VELVET_IDV: path.join(dir, 'idv'),
    VELVET_WEBBRIDGE_LOCAL: '1',
    VELVET_OUTBOUND_LOG: outboundLog,
    VELVET_BOOKINGS_DB: path.join(dir, 'bookings.sqlite'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let apiLog = '';
api.stdout.on('data', (chunk) => { apiLog += chunk; });
api.stderr.on('data', (chunk) => { apiLog += chunk; });

const server = await staticServer();
const base = `http://127.0.0.1:${server.address().port}/`;
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const browser = await chromium.launch();
const outside = [];

try {
  await waitBoot(api);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  await context.addCookies([{
    name: 'velvet_session',
    value: sessionToken,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await context.addInitScript((guest) => {
    localStorage.setItem('velvet_lang', 'sv');
    localStorage.setItem('velvet_lang_picked', '1');
    localStorage.setItem('velvet_user_v1', JSON.stringify(guest));
  }, user);
  await context.route('**/*', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const appOrigin = new URL(base).origin;
    const method = request.method();
    if (url.origin !== appOrigin && url.origin !== apiOrigin) {
      outside.push(method + ' ' + url.origin);
      return route.abort();
    }
    if (url.origin === apiOrigin && method === 'POST' && !directPosts.has(url.pathname)) {
      return route.abort();
    }
    if (!['GET', 'HEAD', 'OPTIONS', 'POST'].includes(method)) return route.abort();
    return route.continue();
  });

  const page = await context.newPage();
  const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page.goto(`${base}?api=${apiOrigin}#/restaurant/${restaurantId}`, { waitUntil: 'domcontentloaded' });
  const search = page.locator('#restaurant-webbridge-search');
  await search.waitFor({ timeout: 15000 });
  assert.equal(await page.locator('#restaurant-book-form').count(), 0);
  await search.locator('input[name="date"]').fill(day);
  await search.locator('select[name="party"]').selectOption('2');
  await search.locator('button[type="submit"]').click();

  const book = page.locator('#restaurant-webbridge-book');
  await book.waitFor({ timeout: 15000 });
  assert.equal(await page.locator('#restaurant-concierge-request').count(), 0);
  const offered = await page.locator('#restaurant-webbridge-result .webbridge-summary').innerText();
  assert.match(offered, /Tider i Velvet/);
  assert.match(offered, /Zink är inte kontaktad/);
  assert.equal(await book.locator('button[type="submit"]').innerText(), 'Boka direkt i Velvet');
  await book.locator('label:has(input[value="19:00"]) span').click();
  await book.locator('input[name="firstName"]').fill('Pilot');
  await book.locator('input[name="lastName"]').fill('Guest');
  await book.locator('input[name="email"]').fill('pilot@example.com');
  await book.locator('input[name="phone"]').fill('+46701234567');
  await book.locator('textarea[name="note"]').fill('Playwright direct booking. Local Velvet confirmation only.');
  await book.locator('input[name="terms"]').check();
  await book.locator('button[type="submit"]').click();

  const success = page.locator('#restaurant-webbridge-result .webbridge-direct');
  await success.waitFor({ timeout: 15000 });
  const heading = await success.locator('h3').innerText();
  const detail = await success.innerText();
  assert.equal(heading, 'Bordet är bokat direkt i Velvet');
  assert.match(detail, /2 gäster/);
  assert.match(detail, new RegExp(day));
  assert.match(detail, /19:00/);
  assert.match(detail, /Velvet-referens: LOCAL-/);
  assert.match(detail, /Ingen reservation har skickats till Zink/);
  assert.doesNotMatch(detail, /Zinks bokningsreferens/);
  assert.equal(page.url().startsWith(base), true);

  await success.locator('a[href="#/bookings"]').click();
  const historyCard = page.locator('.restaurant-history-card');
  await historyCard.waitFor({ timeout: 15000 });
  const historyText = await historyCard.innerText();
  assert.match(historyText, /Zink/);
  assert.match(historyText, /Bokad direkt i Velvet/);
  assert.match(historyText, /Ingen reservation har skickats till restaurangen/);
  assert.match(historyText, new RegExp(day));
  assert.match(historyText, /19:00/);
  assert.match(historyText, /LOCAL-/);
  assert.doesNotMatch(historyText, /Bekräftad av restaurangen/);
  assert.equal(page.url().startsWith(base), true);

  const history = await fetch(apiOrigin + '/restaurant-bookings', {
    headers: { Cookie: `velvet_session=${sessionToken}` },
  });
  const body = await history.json();
  const stored = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const booking = (stored.restaurantBookings || []).find((item) => item.restaurantId === restaurantId);
  const visible = (body.bookings || []).find((item) => item.restaurantId === restaurantId);
  assert.equal(history.status, 200);
  assert.ok(booking, 'Velvet stored the direct booking');
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.provider, 'velvet-local');
  assert.equal(booking.date, day);
  assert.equal(booking.time, '19:00');
  assert.equal(booking.party, 2);
  assert.match(booking.providerReference, /^LOCAL-/);
  assert.equal(booking.providerConfirmedAt, undefined);
  assert.ok(booking.localConfirmedAt);
  assert.ok(visible, 'the guest can see the direct booking in Velvet');
  assert.equal(visible.status, 'confirmed');
  assert.equal(visible.provider, 'velvet-local');
  assert.equal(visible.providerConfirmedAt, '');
  const outbound = fs.readFileSync(outboundLog, 'utf8').trim();
  assert.equal(outbound, '', 'provider calls: ' + outbound);
  const writes = outside.filter((item) => !item.startsWith('GET ') && !item.startsWith('HEAD '));
  assert.deepEqual(writes, [], 'outside writes: ' + writes.join(', '));
  console.log('PASS Velvet direct booking: ' + booking.id + ' ' + booking.providerReference + ' stays inside Velvet and does not contact Zink');
  await context.close();
} catch (error) {
  console.error(apiLog.slice(-4000));
  throw error;
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  api.kill();
}
