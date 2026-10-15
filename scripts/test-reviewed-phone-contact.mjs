import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { resolveReviewedRestaurantContact, restaurantContactPanel } from '../js/restaurant-contact.js';
import { getBookingCopy } from '../js/booking-copy.js';

const cases = [
  { id: 'curated-TYO-den', phone: '+81364555433', source: 'https://www.jimbochoden.com/en/reserve/', den: true },
  { id: 'curated-STT-club-55', phone: '+33494555555', source: 'https://www.club55.fr/en/contact.html', den: false },
];
for (const row of cases) {
  const contact = resolveReviewedRestaurantContact(row.id);
  assert.deepEqual(contact, { type: 'phone', value: row.phone, source: row.source });
  assert.ok(Object.isFrozen(contact));
  for (const bad of [
    { ...contact, type: 'email' }, { ...contact, type: 'whatsapp' },
    { ...contact, value: '+33494555557' }, // Club55 beach is not restaurant booking.
    { ...contact, value: cases.find(other => other.id !== row.id).phone },
    { ...contact, value: row.phone + '?body=guest' },
    { ...contact, value: row.phone + '\r\n' },
    { ...contact, source: row.source + '?redirect=other' },
    { ...contact, source: 'https://denkushiflori.com/en/' },
    { ...contact, source: 'javascript:alert(1)' },
    { ...contact, extra: 'not allowed' }, {},
  ]) assert.equal(resolveReviewedRestaurantContact(row.id, bad), null);
}
for (const id of ['unknown', '__proto__', 'constructor', 'curated-TYO-den-kushi-flori', 'curated-STT-club55']) {
  assert.equal(resolveReviewedRestaurantContact(id), null);
  assert.equal(restaurantContactPanel(id), null);
}
assert.equal(restaurantContactPanel(cases[0].id, 'unsupported'), restaurantContactPanel(cases[0].id, 'en'));

const root = fileURLToPath(new URL('../', import.meta.url));
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root)) throw new Error('outside root');
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream' });
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  browser = await chromium.launch();
  for (const row of cases) for (const lang of ['sv', 'en', 'es', 'fr']) for (const width of [390, 1365]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    await context.routeWebSocket('**/*', socket => socket.close());
    await context.route('**/*', route => {
      const req = route.request();
      return new URL(req.url()).origin === new URL(base).origin && ['GET', 'HEAD'].includes(req.method())
        ? route.continue() : route.abort();
    });
    await context.addInitScript(lang => {
      localStorage.setItem('velvet_lang', lang);
      window.contactClicksPrevented = 0;
      // Capture phase prevents the actual OS telephone handler from opening.
      document.addEventListener('click', event => {
        if (event.target.closest('a[href^="tel:"],a[href^="mailto:"]')) {
          event.preventDefault(); window.contactClicksPrevented++;
        }
      }, true);
    }, lang);
    const page = await context.newPage();
    await page.goto(base + '#/restaurant/' + row.id + '?date=2026-12-20&time=19%3A30&party=2', { waitUntil: 'domcontentloaded' });
    const panel = page.locator('.restaurant-contact-status');
    await panel.waitFor();
    const copy = getBookingCopy(lang), text = await panel.innerText();
    assert.equal(await panel.getAttribute('data-booking-status'), 'manual_phone');
    assert.equal(await page.locator('#restaurant-booking-heading').innerText(), copy.requestHeading);
    assert.ok(text.includes(copy.manualPaymentUnknown));
    if (row.den) {
      for (const key of ['denDirectPhone', 'denCallWindow', 'denCancellation']) assert.ok(text.includes(copy[key]));
      assert.match(text, /12:00–17:00/); assert.match(text, /Asia\/Tokyo/); assert.match(text, /18:00–20:00/);
      assert.ok(!text.includes(copy.requestUnknownPolicy));
      assert.ok(!text.includes(copy.club55PhoneOnly));
    } else {
      for (const key of ['manualPhoneNotice', 'club55PhoneOnly', 'requestUnknownPolicy']) assert.ok(text.includes(copy[key]));
      assert.ok(!text.includes(copy.denCancellation));
      assert.doesNotMatch(text, /Asia\/Tokyo|12:00|18:00/);
    }
    const call = panel.locator('a[href^="tel:"]');
    assert.equal(await call.getAttribute('href'), 'tel:' + row.phone);
    assert.equal(await call.innerText(), copy.manualPhone);
    assert.equal(await panel.locator('a[target="_blank"]').getAttribute('href'), row.source);
    assert.equal(await panel.locator('a[href^="mailto:"]').count(), 0);
    assert.equal(await panel.locator('input,select,form,button').count(), 0);
    assert.equal(await page.locator('#restaurant-book-form,#restaurant-provider-booking,iframe,#restaurant-webbridge-search,.booking-selection-summary').count(), 0);
    assert.equal(await page.evaluate(() => window.contactClicksPrevented), 0);
    await call.click();
    assert.equal(await page.evaluate(() => window.contactClicksPrevented), 1);
    assert.equal(await panel.count(), 1);
    assert.ok(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'panel should fit viewport');
    await context.close();
  }
  console.log('PASS Den + Club55: exact contact tamper guards; 2 restaurants × 4 languages × desktop/mobile; policy separation; prevented telephone clicks; no booking UI. Local UI only, all external requests blocked.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
