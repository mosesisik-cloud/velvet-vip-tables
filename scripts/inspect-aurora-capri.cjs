// Read-only evidence collection for issue #61. Run after npm install.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const blocked = [];
    const hosts = new Set(['www.auroracapri.com', 'auroracapri.com',
      'stackpath.bootstrapcdn.com', 'fonts.googleapis.com', 'fonts.gstatic.com',
      'cdnjs.cloudflare.com', 'code.jquery.com']);
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      // Reviewed static translation file; all other fetch/XHR traffic is denied.
      const translation = url.hostname === 'www.auroracapri.com'
        && url.pathname === '/assets/i18n/it.json' && !url.search;
      if (request.method() !== 'GET' || !hosts.has(url.hostname)
        || (['xhr', 'fetch', 'websocket'].includes(request.resourceType()) && !translation)) {
        blocked.push({ method: request.method(), url: request.url() });
        return route.abort();
      }
      return route.continue();
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    const home = await page.goto('https://www.auroracapri.com/', { waitUntil: 'networkidle', timeout: 45000 });
    assert.equal(home.status(), 200);
    await page.locator('a[href="/contatti"]').click();
    await page.waitForLoadState('networkidle');
    const text = await page.locator('body').innerText();
    const contacts = await page.locator('a[href^="tel:"], a[href^="mailto:"]').evaluateAll(
      links => links.map(link => link.getAttribute('href')));
    assert.match(text, /Fuorlovado, 18/);
    assert.match(text, /80073 Capri/);
    assert(contacts.includes('mailto:aurora@capri.it'));
    assert(contacts.includes('tel:+390818370181'));
    assert.equal(await page.locator('form').count(), 0);
    const directPage = await context.newPage();
    const direct = await directPage.goto('https://www.auroracapri.com/contatti', { waitUntil: 'domcontentloaded' });
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), homeStatus: home.status(),
      spaContactUrl: page.url(), contactTitle: await page.title(), contacts,
      forms: 0, directContactStatus: direct.status(), blocked,
      limitation: 'Contact details only; booking acceptance, availability and opening dates not established. Mia Capri contacts belong to the separately labelled enoteca.' }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
