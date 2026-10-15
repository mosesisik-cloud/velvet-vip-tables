// Read-only, restaurant-scoped evidence check for issue #106.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const blocked = [];
    await context.route('**/*', route => {
      const r = route.request();
      const u = new URL(r.url());
      if (r.method() !== 'GET' || u.hostname !== 'www.jimbochoden.com'
        || ['xhr', 'fetch', 'websocket'].includes(r.resourceType())) {
        blocked.push({ method: r.method(), host: u.hostname, type: r.resourceType() });
        return route.abort();
      }
      return route.continue();
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    const response = await page.goto('https://www.jimbochoden.com/en/reserve/',
      { waitUntil: 'networkidle', timeout: 45000 });
    assert.equal(response.status(), 200);
    const text = await page.locator('body').innerText();
    assert.match(text, /only by telephone/i);
    assert.match(text, /do not accept online/i);
    assert.match(text, /third parties/i);
    assert.match(text, /confirmation email/i);
    assert.match(text, /2-3-18/);
    assert.match(text, /6455-5433/);
    const forms = await page.locator('form').count();
    const links = await page.locator('a[href]').evaluateAll(xs => xs.map(x => ({ text: x.innerText.trim(), href: x.getAttribute('href') })));
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), url: page.url(),
      status: response.status(), title: await page.title(), policyAssertions: 'passed', forms, links, blocked,
      limitation: 'No calls, form submissions, bookings or availability checks. Group-restaurant link is outside Den scope.' }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
