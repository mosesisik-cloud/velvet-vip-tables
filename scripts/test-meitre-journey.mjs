import { chromium } from '../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Read-only real-provider journey. Never send an OTP or create a reservation.
const out = new URL('../../../outputs/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = { checkedAt: new Date().toISOString(), restaurant: 'Oro, Rio de Janeiro', runs: [] };
const permittedApi = /^\/api\/(?:get-restaurant-info-subdomain$|calendar-availability-new\/10\/[1-4]\/(?:lunch|dinner)$|search-all-hours\/en\/[1-4]\/\d{4}-\d{2}-\d{2}\/(?:lunch|dinner)\/10$)/;
try {
  for (const [label, embedded, viewport] of [
    ['velvet-desktop', true, { width: 1400, height: 1000 }],
    ['provider-desktop', false, { width: 1400, height: 1000 }],
    ['velvet-mobile', true, { width: 390, height: 844 }],
  ]) {
    if (process.env.MEITRE_TEST_LABEL && process.env.MEITRE_TEST_LABEL !== label) continue;
    const result = { label, stages: [], reads: [], blocked: [], screenshots: [] };
    report.runs.push(result);
    const context = await browser.newContext({ viewport, serviceWorkers: 'block', locale: 'en-US' });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      // Even GET is unsafe for some Meitre APIs: explicit read-only allowlist.
      if (!['GET', 'HEAD'].includes(request.method()) ||
          (url.hostname === 'api.meitre.com' && !permittedApi.test(url.pathname)) ||
          (url.hostname.endsWith('meitre.com') && url.pathname.startsWith('/api/') && url.hostname !== 'api.meitre.com')) {
        result.blocked.push({ method: request.method(), host: url.hostname, path: url.pathname });
        return route.abort('blockedbyclient');
      }
      if (url.hostname === 'api.meitre.com') result.reads.push(url.pathname);
      return route.continue();
    });
    const page = await context.newPage();
    try {
      await page.goto(embedded ? 'https://b2b.bakemyday.se/velvet/#/restaurant/curated-RIO-oro' : 'https://oro.meitre.com/', { waitUntil: 'domcontentloaded' });
      if (embedded) await page.locator('#restaurant-provider-booking').getByRole('button', { name: 'Hitta ett bord', exact: true }).click();
      const frame = embedded ? await (async () => {
        for (let i = 0; i < 100; i++) {
          const f = page.frames().find(f => f.url().startsWith('https://oro.meitre.com/'));
          if (f) return f;
          await page.waitForTimeout(100);
        }
        throw new Error('Oro iframe missing');
      })() : page.mainFrame();
      const shot = async stage => {
        const name = `meitre-${label}-${stage}.png`;
        await page.screenshot({ path: new URL(name, out).pathname.replace(/^\/([A-Z]:)/i, '$1'), fullPage: false });
        result.screenshots.push(name);
      };
      await frame.getByRole('button', { name: 'Book a table', exact: true }).click();
      await frame.getByRole('button', { name: '3 people', exact: true }).click();
      await frame.getByRole('button', { name: 'Continue with 3 diners', exact: true }).waitFor();
      await frame.getByRole('button', { name: '2 people', exact: true }).click();
      await frame.getByRole('button', { name: 'Continue with 2 diners', exact: true }).click();
      result.stages.push({ stage: 'party change 2→3→2', status: 'PASS' });
      await frame.getByRole('button', { name: /Sat.*17.*Oct/s }).click();
      await frame.getByRole('button', { name: 'Dinner', exact: true }).click();
      await frame.getByRole('button', { name: '22:30', exact: true }).waitFor();
      if (label === 'velvet-desktop') {
        await frame.locator('button').filter({hasText:/Sat.*17.*Oct/s}).click();
        await frame.getByRole('button', { name: /Fri.*16.*Oct/s }).click();
        await frame.waitForURL(/\/select-(?:service|time)$/);
        if (frame.url().endsWith('/select-service')) await frame.getByRole('button', { name: 'Dinner', exact: true }).click();
        await frame.getByText('Select a time', { exact: true }).waitFor();
        await frame.getByRole('button', {name:/^\d{1,2}:\d{2}$/}).first().waitFor();
        result.alternateDateText = await frame.locator('body').innerText();
        await frame.locator('button').filter({hasText:/Fri.*16.*Oct/s}).click();
        await frame.getByRole('button', { name: /Sat.*17.*Oct/s }).click();
        await frame.waitForURL(/\/select-(?:service|time)$/);
        if (frame.url().endsWith('/select-service')) await frame.getByRole('button', { name: 'Dinner', exact: true }).click();
        await frame.getByRole('button', { name: '22:30', exact: true }).waitFor();
        result.stages.push({ stage: 'change date 17→16→17 refreshes available times', status: 'PASS' });
      }
      result.availabilityText = await frame.locator('body').innerText();
      result.stages.push({ stage: 'real dinner availability, 2026-10-17, 2 guests', status: 'PASS', time: '22:30' });
      await shot('availability');
      await frame.getByRole('button', { name: '22:30', exact: true }).click();
      await frame.getByRole('button', { name: 'Continue with Email', exact: true }).waitFor({ timeout: 45000 });
      const auth = new URL(frame.url()), back = new URL(auth.searchParams.get('return_url'));
      assert.equal(auth.hostname, 'auth.v2.meitre.com');
      assert.equal(back.hostname, 'oro.meitre.com');
      assert.equal(back.searchParams.get('ps'), '2');
      assert.equal(back.searchParams.get('d'), '2026-10-17');
      assert.equal(back.searchParams.get('st'), 'dinner');
      assert.equal(back.searchParams.get('t'), '22:30');
      result.stages.push({ stage: 'selected details survive auth transition', status: 'PASS' });
      result.authText = await frame.locator('body').innerText();
      await shot('verification');
      await frame.getByRole('button', { name: 'Continue with Email', exact: true }).click();
      const email = frame.locator('input[type=email]');
      await email.fill('not-an-email');
      assert.equal(await email.evaluate(e => e.validity.typeMismatch), true);
      await email.fill('velvet-test@example.invalid');
      assert.equal(await email.evaluate(e => e.validity.typeMismatch), false);
      await email.fill('');
      result.emailInput = await email.evaluate(e => ({ type: e.type, required: e.required, value: e.value }));
      result.stages.push({ stage: 'email format validation (browser only; no send)', status: 'PASS' });
      result.stages.push({ stage: 'OTP, contact details, terms, card, review, confirmation', status: 'BLOCKED', reason: 'Real Meitre email verification required; no code sent and no booking mutation attempted.' });
      await shot('email');
      result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      result.providerHorizontalOverflow = await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      result.status = 'PASS_TO_VERIFICATION_BOUNDARY';
    } catch (error) {
      result.status = 'FAILED'; result.error = error.message;
      result.failureFrames = await Promise.all(page.frames().filter(f => /meitre\.com/.test(f.url())).map(async f => ({ url: f.url(), text: await f.locator('body').innerText().catch(() => '') })));
    } finally { await context.close(); }
    await fs.writeFile(new URL('meitre-journey-results.json', out), JSON.stringify(report, null, 2));
    console.log(label, result.status, result.error || '');
  }
  const complete = report.runs.filter(r => r.status === 'PASS_TO_VERIFICATION_BOUNDARY');
  if (complete.length === 3) {
    const core = text => text.split('\n').map(s => s.trim()).filter(s => s && s !== '›' && s !== 'powered by Meitre').join('\n');
    assert.equal(core(complete[0].availabilityText), core(complete[1].availabilityText));
    assert.equal(complete[0].authText, complete[1].authText);
    assert.equal(core(complete[0].availabilityText), core(complete[2].availabilityText));
    report.parity = 'PASS: core provider text, real availability and verification match; responsive separator/footer differences excluded';
  } else report.parity = 'NOT_PROVEN';
  await fs.writeFile(new URL('meitre-journey-results.json', out), JSON.stringify(report, null, 2));
  assert.equal(complete.length, process.env.MEITRE_TEST_LABEL ? 1 : 3, 'See report for failed real-provider stages');
} finally { await browser.close(); }




