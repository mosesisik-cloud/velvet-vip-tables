import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const files = ['booking-preview.html', 'js/booking-preview.js', 'js/velvet-playwright-booking.js', 'js/booking-preview-fixture.js'];
const server = http.createServer(async (req, res) => {
  const file = req.url.slice(1);
  if (!files.includes(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript');
  res.end(await fs.readFile(new URL('../' + file, import.meta.url)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = process.env.VELVET_PREVIEW_BASE || `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  browser = await chromium.launch({headless:true});
  for (const width of [390, 1366]) {
    const page = await browser.newPage({viewport:{width,height:768},serviceWorkers:'block'});
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requests.push({url:r.url(),method:r.method()}));
    await page.goto(base + 'booking-preview.html');
    assert.match(await page.locator('main > header').innerText(), /ingen riktig reservation/i);
    for (const outcome of ['confirmed','timeout','payment_required','rejected','pending']) {
      await page.locator('#outcome').selectOption(outcome);
      await page.locator('#restart').click();
      await page.locator('[data-action=start]').click();
      await page.locator('[name=date]').fill('2030-01-15');
      await page.locator('[name=party]').fill('2');
      await page.locator('[data-action=search]').click();
      await page.locator('[data-action=select]').click();
      for (const [name,value] of Object.entries({firstname:'Test',lastname:'Person',email:'test@example.com',phone:'0700000000'})) await page.locator(`[name=${name}]`).fill(value);
      await page.locator('[data-action=guest]').click();
      assert.equal(await page.locator('[data-action=submit]').isDisabled(), true);
      await page.locator('[name=terms]').check();
      await page.locator('[data-action=submit]').click();
      if (outcome === 'timeout') await page.locator('[data-action=refresh]').click();
      await page.locator('[data-stage=result]').waitFor();
      assert.equal(await page.locator('[data-action=submit]').count(), 0);
      const visible = await page.locator('#booking').innerText();
      if (outcome === 'confirmed') assert.match(visible, /FIXTURE-NOT-A-RESERVATION/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width > 1000) {
        const footer = await page.locator('[data-panel-footer]').boundingBox();
        assert(footer.y >= 0 && footer.y + footer.height <= 768, 'desktop footer remains visible');
      }
    }
    assert.deepEqual(errors, []);
    assert(requests.every(r => r.method === 'GET' && r.url.startsWith(base) && files.some(f => r.url === base + f)), JSON.stringify(requests));
    console.log(`PASS preview ${width}px, five simulated outcomes, consent, no API or provider traffic`);
    await page.close();
  }
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
