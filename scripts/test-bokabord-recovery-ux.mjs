import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Only a loopback document/module server and an injected API fixture are used.
// No provider session, hold, reservation, payment or external request is allowed.
const source = await fs.readFile(new URL('../js/bokabord-mirror.js', import.meta.url));
const server = http.createServer((req, res) => {
  if (req.url === '/mirror.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(source);
  } else if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><meta charset="utf-8"><body style="font:16px Arial;padding:24px"><p style="padding:12px;background:#fff2b2;font-weight:bold">LOKAL TESTFIXTURE — ingen riktig bokning eller extern anslutning</p><div id="mirror" style="width:420px"></div>');
  } else {
    res.writeHead(404); res.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const unexpectedRequests = [];
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url === `${origin}/` || url === `${origin}/mirror.js`) return route.continue();
    unexpectedRequests.push(url);
    return route.abort();
  });

  async function fixture() {
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.evaluate(async () => {
      const { mountBokabordMirror } = await import('/mirror.js');
      const canvas = document.createElement('canvas');
      canvas.width = 420; canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 420, 240);
      const image = canvas.toDataURL('image/png');
      const bytes = Uint8Array.from(atob(image.split(',')[1]), c => c.charCodeAt(0));
      const imageHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const fields = ['firstname', 'lastname'].map((name, i) => ({
        name, value: '', rect: { x: 10, y: 10 + i * 50, width: 240, height: 40 }
      }));
      let revision = 0;
      window.calls = [];
      window.failFill = null;
      window.failSubmit = false;
      window.failClose = false;
      window.currentMode = 'fresh';
      window.holdCurrent = false;
      window.releaseCurrent = null;
      window.unhandled = [];
      addEventListener('unhandledrejection', event => window.unhandled.push(String(event.reason)));
      const snapshot = () => ({
        id: 'fixture-session', restaurantId: 'curated-STO-zink-italian-cuisine',
        revision: ++revision, image, imageHash, fields: structuredClone(fields),
        width: 420, height: 240, text: 'Fixture contact step',
        contact: true, review: true, canSubmit: true, mode: 'prepare'
      });
      let cached;
      mountBokabordMirror(document.querySelector('#mirror'), async (path, opts = {}) => {
        const body = JSON.parse(opts.body || '{}');
        window.calls.push({ path, method: opts.method, body });
        if (opts.method === 'DELETE') {
          if (window.failClose) throw new Error('connection');
          return { ok: true };
        }
        if (path.endsWith('/current')) {
          if (window.holdCurrent) await new Promise(resolve => { window.releaseCurrent = resolve; });
          if (window.currentMode === 'expired') return { error: 'session_expired' };
          if (window.currentMode === 'cached') return structuredClone(cached);
          return snapshot();
        }
        if (body.type === 'fill') {
          if (window.failFill) {
            const error = window.failFill; window.failFill = null;
            return { error };
          }
          for (const [name, value] of Object.entries(body.fields)) {
            fields.find(field => field.name === name).value = value;
          }
        }
        if (body.type === 'submit') {
          if (window.failSubmit) throw new Error('timeout');
          throw new Error('Unexpected fixture submit');
        }
        const result = snapshot();
        cached ||= structuredClone(result);
        return result;
      });
    });
    await page.locator('[data-start]').click();
    await page.locator('[data-provider-field="firstname"]').waitFor();
    await idle(page);
    return { page, errors };
  }
  const idle = page => page.waitForFunction(() => document.querySelector('#mirror').getAttribute('aria-busy') === 'false');
  const calls = page => page.evaluate(() => structuredClone(window.calls));
  const count = async (page, type) => (await calls(page)).filter(c => c.body.type === type).length;
  const hasActionable = (page, selector) => page.locator(selector).evaluate(el => !el.hidden && !el.disabled && el.getClientRects().length > 0);
  async function clean({ page, errors }) {
    await page.waitForTimeout(200);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.deepEqual(await page.evaluate(() => window.unhandled), [], 'No unhandled promise rejections');
    await page.close();
  }

  // Failed typing stays visible even after a read-only refresh. Only the explicit
  // retry sends it again, with no new typing or focus change required.
  {
    const f = await fixture(), { page } = f;
    await page.evaluate(() => { window.failFill = 'connection'; });
    const first = page.locator('[data-provider-field="firstname"]');
    await first.fill('Test-utkast');
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('kunde inte sparas'));
    await idle(page);
    assert.equal(await first.inputValue(), 'Test-utkast');
    assert.equal(await hasActionable(page, '[data-retry-fields]'), true);
    assert.equal(await page.locator('[data-submit]').isDisabled(), true);
    assert.equal(await count(page, 'fill'), 1);
    if (process.argv.includes('--screenshot')) {
      const output = new URL('../../../outputs/Velvet-bokabord-aterhamtning-test.png', import.meta.url);
      await fs.mkdir(new URL('.', output), { recursive: true });
      await page.screenshot({ path: fileURLToPath(output), fullPage: true });
    }
    const before = (await calls(page)).length;
    await page.locator('[data-refresh]').click();
    await idle(page); await page.waitForTimeout(350);
    const afterRefresh = (await calls(page)).slice(before);
    assert.deepEqual(afterRefresh.map(c => c.path), ['/restaurant-bookings/mirror/current']);
    assert.deepEqual(afterRefresh[0].body, {});
    assert.equal(await count(page, 'fill'), 1, 'Refresh must not retry failed edits');
    assert.equal(await first.inputValue(), 'Test-utkast');
    assert.equal(await hasActionable(page, '[data-retry-fields]'), true);
    await page.locator('[data-retry-fields]').click();
    await page.waitForFunction(() => document.querySelector('[data-provider-field="firstname"]').dataset.verifiedValue === 'Test-utkast');
    await idle(page);
    assert.equal(await count(page, 'fill'), 2);
    const fills = (await calls(page)).filter(c => c.body.type === 'fill');
    assert.deepEqual(fills[1].body.fields, { firstname: 'Test-utkast' });
    assert.equal(await page.locator('[data-submit]').isEnabled(), true);
    await clean(f);
    console.log('PASS: failed fill preserves draft; refresh only reads current; explicit retry saves without typing.');
  }

  // Dispatch the fresh edit and refresh in the same browser task so this really
  // exercises the interval before the 150ms debounce, independent of host load.
  // Include both fast replies and edits made while a slow current read is open.
  for (const timing of ['before-debounce', 'during-refresh']) {
    const f = await fixture(), { page } = f;
    await page.evaluate(timing => {
      const first = document.querySelector('[data-provider-field="firstname"]');
      if (timing === 'before-debounce') {
        first.focus();
        first.value = 'Fresh unsynced draft';
        first.dispatchEvent(new Event('input', { bubbles: true }));
        // Real focus transition fires blur with relatedTarget, as mouse/Tab does.
        document.querySelector('[data-refresh]').focus();
        document.querySelector('[data-refresh]').click();
      } else {
        window.holdCurrent = true;
        document.querySelector('[data-refresh]').click();
      }
    }, timing);
    if (timing === 'during-refresh') {
      await page.waitForFunction(() => typeof window.releaseCurrent === 'function');
      assert.equal(await page.locator('[data-provider-field="firstname"]').isEnabled(), true);
      await page.locator('[data-provider-field="firstname"]').fill('Latest draft during read');
      await page.waitForTimeout(220); // The debounce expires while current is busy.
      assert.equal(await count(page, 'fill'), 0);
      await page.evaluate(() => window.releaseCurrent());
    }
    await idle(page); await page.waitForTimeout(350);
    assert.equal(await count(page, 'fill'), 0, `${timing}: current must not trigger a fill`);
    assert.deepEqual((await calls(page)).slice(1).map(c => c.path), ['/restaurant-bookings/mirror/current']);
    const expected = timing === 'before-debounce' ? 'Fresh unsynced draft' : 'Latest draft during read';
    assert.equal(await page.locator('[data-provider-field="firstname"]').inputValue(), expected);
    assert.equal(await hasActionable(page, '[data-retry-fields]'), true);
    assert.equal(await page.locator('[data-submit]').isDisabled(), true);
    await page.locator('[data-retry-fields]').click();
    await page.waitForFunction(value => document.querySelector('[data-provider-field="firstname"]').dataset.verifiedValue === value, expected);
    await idle(page);
    assert.equal(await count(page, 'fill'), 1);
    assert.deepEqual((await calls(page)).find(c => c.body.type === 'fill').body.fields, { firstname: expected });
    await clean(f);
    console.log(`PASS: ${timing} refresh stays read-only and explicit retry saves the latest draft.`);
  }

  // An action error alone cannot authorize creating a new session. The explicit
  // current-session probe must confirm expiry, and no submit has happened.
  {
    const f = await fixture(), { page } = f;
    await page.evaluate(() => { window.failFill = 'session_expired'; });
    await page.locator('[data-provider-field="firstname"]').fill('Expired draft');
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('Sessionen verkar'));
    await idle(page);
    assert.equal(await hasActionable(page, '[data-restart]'), false);
    assert.equal((await calls(page)).filter(c => c.path === '/restaurant-bookings/mirror').length, 1);
    await page.evaluate(() => { window.currentMode = 'expired'; });
    await page.locator('[data-refresh]').click(); await idle(page);
    assert.equal(await hasActionable(page, '[data-restart]'), true);
    await page.locator('[data-restart]').click(); await idle(page);
    assert.equal((await calls(page)).filter(c => c.path === '/restaurant-bookings/mirror').length, 2);
    assert.equal(await page.locator('[data-provider-field="firstname"]').inputValue(), '');
    assert.equal(await count(page, 'submit'), 0);
    await clean(f);
    console.log('PASS: safe pre-submit restart requires expiry confirmed by current-session probe.');
  }

  // Timeout after submission is ambiguous even if the next response is a stale
  // pre-submit screenshot or the old session no longer exists.
  for (const mode of ['cached', 'expired']) {
    const f = await fixture(), { page } = f;
    await page.evaluate(() => { window.failSubmit = true; });
    await page.locator('[data-terms]').check();
    await page.locator('[data-submit]').click();
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('okänt'));
    await idle(page);
    await page.evaluate(value => { window.currentMode = value; }, mode);
    await page.locator('[data-refresh]').click(); await idle(page);
    assert.equal(await hasActionable(page, '[data-restart]'), false);
    assert.equal(await hasActionable(page, '[data-start]'), false);
    assert.equal(await hasActionable(page, '[data-submit]'), false);
    assert.equal(await hasActionable(page, '[data-close]'), false);
    assert.equal(await page.locator('[data-provider-field="firstname"]').isDisabled(), true);
    // Event-handler guards must also reject a programmatic attempt to bypass UI.
    const before = (await calls(page)).length;
    await page.evaluate(() => {
      document.querySelector('[data-restart]').onclick();
      document.querySelector('[data-start]').onclick();
      document.querySelector('[data-terms]').checked = true;
      document.querySelector('[data-submit]').onclick();
    });
    await page.waitForTimeout(200);
    assert.equal((await calls(page)).length, before);
    assert.equal(await count(page, 'submit'), 1);
    assert.equal((await calls(page)).filter(c => c.path === '/restaurant-bookings/mirror').length, 1);
    await clean(f);
    console.log(`PASS: submit timeout followed by ${mode} current snapshot never unlocks restart/create/resubmit.`);
  }

  {
    const f = await fixture(), { page } = f;
    const first = page.locator('[data-provider-field="firstname"]');
    await first.fill('Keep my state');
    await page.waitForFunction(() => document.querySelector('[data-provider-field="firstname"]').dataset.verifiedValue === 'Keep my state');
    await idle(page);
    await page.evaluate(() => { window.failClose = true; });
    await page.locator('[data-close]').click();
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('kunde inte stängas'));
    assert.equal(await first.inputValue(), 'Keep my state');
    assert.equal(await page.locator('[data-screen]').isVisible(), true);
    assert.equal(await hasActionable(page, '[data-start]'), false);
    assert.equal(await hasActionable(page, '[data-close]'), true);
    assert.equal((await calls(page)).filter(c => c.method === 'DELETE').length, 1);
    await clean(f);
    console.log('PASS: rejected DELETE displays error and preserves state without unhandled rejection.');
  }
  assert.deepEqual(unexpectedRequests, [], 'Fixture must never request an external/provider resource');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
