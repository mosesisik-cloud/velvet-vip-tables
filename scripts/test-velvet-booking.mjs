import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '../node_modules/playwright/index.mjs';

const restaurantId = 'curated-MYK-nammos-mykonos';
const root = path.resolve(import.meta.dirname, '..');
const sessionToken = 'velvet-playwright-session-token';
const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
const user = {
  id: 'U-playwright-guest',
  provider: 'passkey',
  name: 'Pilot Guest',
  email: 'pilot@example.com',
  connected: true,
  authVerified: true,
  deviceBound: true,
};

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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-playwright-'));
const dataFile = path.join(dir, 'store.json');
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
    if (url.origin === apiOrigin && method === 'POST' && url.pathname !== '/restaurant-bookings') {
      return route.abort();
    }
    if (!['GET', 'HEAD', 'OPTIONS', 'POST'].includes(method)) return route.abort();
    return route.continue();
  });

  const page = await context.newPage();
  const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page.goto(`${base}?api=${apiOrigin}#/restaurant/${restaurantId}`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('#restaurant-book-form');
  await form.waitFor({ timeout: 15000 });
  assert.equal(await page.locator('a.restaurant-live-book').count(), 0);
  await form.locator('input[name="date"]').fill(day);
  await form.locator('select[name="time"]').selectOption('19:00');
  await form.locator('select[name="party"]').selectOption('2');
  await form.locator('input[name="name"]').fill('Pilot Guest');
  await form.locator('input[name="email"]').fill('pilot@example.com');
  await form.locator('textarea[name="note"]').fill('Playwright request. Not a confirmed table.');
  await form.locator('button[type="submit"]').click();

  const success = page.locator('#restaurant-book-result .restaurant-book-success');
  await success.waitFor({ timeout: 15000 });
  const heading = await success.locator('h3').innerText();
  const detail = await success.innerText();
  assert.equal(heading, 'Förfrågan skickad');
  assert.match(detail, /2 gäster/);
  assert.match(detail, new RegExp(day));
  assert.match(detail, /19:00/);
  assert.match(detail, /Referens RB-/);
  assert.match(detail, /restaurangen behöver bekräfta bordet/);
  assert.equal(page.url().startsWith(base), true);

  const history = await fetch(apiOrigin + '/restaurant-bookings', {
    headers: { Cookie: `velvet_session=${sessionToken}` },
  });
  const body = await history.json();
  const stored = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const booking = (stored.restaurantBookings || []).find((item) => item.restaurantId === restaurantId);
  const visible = (body.bookings || []).find((item) => item.restaurantId === restaurantId);
  assert.equal(history.status, 200);
  assert.ok(booking, 'Velvet stored the request');
  assert.equal(booking.status, 'request');
  assert.equal(booking.date, day);
  assert.equal(booking.time, '19:00');
  assert.equal(booking.party, 2);
  assert.equal(booking.email, 'pilot@example.com');
  assert.equal(booking.providerConfirmedAt, undefined);
  assert.ok(visible, 'the guest can see the request in Velvet');
  assert.equal(visible.status, 'request');
  const writes = outside.filter((item) => !item.startsWith('GET ') && !item.startsWith('HEAD '));
  assert.deepEqual(writes, [], 'outside writes: ' + writes.join(', '));
  console.log('PASS Velvet booking: NAMMOS request ' + booking.id + ' stays inside Velvet and is not a confirmed table');
  await context.close();
} catch (error) {
  console.error(apiLog.slice(-2000));
  throw error;
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  api.kill();
}
