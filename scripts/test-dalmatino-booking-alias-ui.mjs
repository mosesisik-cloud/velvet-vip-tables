// Actual Velvet routes and branch registry, fully mocked provider.
// No provider page, hold, reservation or email is requested by this test.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { resolveEmbeddedBooking } from '../js/restaurant-booking-providers.js';
import { bookingLanguage } from '../js/booking-language.js';

// Fail before starting a browser if the source/target preconditions have drifted.
await import('./test-dalmatino-booking-alias.mjs');
const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const spec = await readJSON('work/booking-wave17b-dalmatino-native.patch.json');
const registry = await readJSON('data/booking-providers.json');
const providerUrl = bookingLanguage(resolveEmbeddedBooking(registry, spec.restaurantId), 'sv').url;
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (relative !== 'index.html' && !/^(js|css|data|media|assets)\//.test(relative)) { res.writeHead(404).end(); return; }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root) || !Object.hasOwn(types, path.extname(file))) { res.writeHead(404).end(); return; }
    const body = await fs.readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
let browser;
let providerLoads = 0;
let blockedWrites = 0;
try {
  browser = await chromium.launch({headless:true, ...(process.env.VELVET_TEST_BROWSER_CHANNEL ? {channel:process.env.VELVET_TEST_BROWSER_CHANNEL} : {})});
  for (const width of [390, 1280]) {
    const context = await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
    await context.route('**/*', async route => {
      const req = route.request();
      const url = new URL(req.url());
      if (!['GET', 'HEAD'].includes(req.method())) { blockedWrites++; await route.abort(); return; }
      if (req.url() === providerUrl) {
        providerLoads++;
        await route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><h1>Dalmatino Hvar — OFFLINE TEST</h1><label>E-post<input name="email" type="email"></label><label><input type="checkbox" name="selection">Simulerat formulärval</label><p>OFFLINE-ONLY: no booking or email sent</p>`});
        return;
      }
      if (url.origin !== new URL(base).origin) { await route.abort(); return; }
      await route.continue();
    });
    await context.addInitScript(() => localStorage.setItem('velvet_lang', 'sv'));
    const page = await context.newPage();
    page.on('pageerror', error => console.error('Browser test script error:', error.message));
    for (const id of [spec.restaurantId, spec.reuseRestaurantId]) {
      await page.goto(base + '#/restaurant/' + id);
      const panel = page.locator('#restaurant-provider-booking');
      const start = panel.getByRole('button', {name:'Hitta ett bord',exact:true});
      await start.waitFor({timeout:15000});
      assert.equal(await panel.locator('iframe').count(), 0);
      await start.click();
      const frame = page.frameLocator('.booking-provider-frame');
      await frame.locator('input[name="email"]').waitFor();
      // The production renderer scrolls the new stage into view on animation frame.
      // Wait for that actual layout to settle before pointer interaction in the iframe.
      await page.waitForFunction(() => {
        const top = document.querySelector('.booking-provider-frame')?.getBoundingClientRect().top;
        const state = window.__dalmatinoLayout || {top:null,stable:0};
        state.stable = top === state.top ? state.stable + 1 : 0;
        state.top = top; window.__dalmatinoLayout = state;
        return Number.isFinite(top) && state.stable >= 8;
      }, null, {polling:'raf',timeout:5000});
      await frame.locator('input[name="email"]').fill('offline-test@example.invalid');
      await frame.getByRole('checkbox').check();
      assert.equal(await frame.locator('input[name="email"]').inputValue(), 'offline-test@example.invalid');
      assert.equal(await frame.getByRole('checkbox').isChecked(), true);
      assert.equal(await panel.locator('iframe').getAttribute('src'), providerUrl);
      assert.ok(await panel.locator('iframe').evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1));
      assert.equal(page.url(), base + '#/restaurant/' + id, 'Guest remains inside Velvet');
      assert.equal(context.pages().length, 1, 'No extra tab opened');
      await page.evaluate(() => window.postMessage({status:'confirmed',bookingId:'OFFLINE-FAKE'}, '*'));
      assert.equal(await page.getByText('OFFLINE-FAKE', {exact:true}).count(), 0);
    }
    await context.close();
  }
  assert.equal(providerLoads, 4);
  assert.equal(blockedWrites, 0, 'No booking/contact requests may be attempted by this UI test');
  console.log('PASS: both Dalmatino routes on mobile+desktop, same retained original-form renderer, no new tabs, no synthetic confirmation. Provider fully mocked; 0 reservation/email requests. Registry unchanged.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
