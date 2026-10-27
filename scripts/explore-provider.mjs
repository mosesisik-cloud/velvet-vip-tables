// Read-only provider exploration. Logs DOM + network. Never submits personal data.
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 420, height: 760 }, locale: 'en-US' });
const page = await context.newPage();
const requests = [];
page.on('request', r => requests.push(`${r.method()} ${r.url().slice(0, 130)}`));

try {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('STATUS:', resp?.status());
} catch (e) { console.log('GOTO ERROR:', e.message.split('\n')[0]); }
await page.waitForTimeout(6000);

console.log('TITLE:', await page.title());
console.log('URL:', page.url());
const text = await page.locator('body').innerText().catch(() => '');
console.log('TEXT:', text.slice(0, 900));
const buttons = await page.locator('button:visible, [role="button"]:visible, a:visible').evaluateAll(els =>
  els.map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean)).catch(() => []);
console.log('BUTTONS:', JSON.stringify([...new Set(buttons)].slice(0, 25), null, 1));
const hosts = {};
for (const r of requests) { try { const h = new URL(r.split(' ')[1]).hostname; hosts[h] = (hosts[h] || 0) + 1; } catch {} }
console.log('HOSTS:', JSON.stringify(hosts, null, 1));
const api = requests.filter(r => /api|avail|book|reserv|slot|search/i.test(r) && !/\.(js|css|png|svg|jpg|woff)/.test(r));
console.log('API-LIKE:', JSON.stringify([...new Set(api)].slice(0, 20), null, 1));
console.log('NON-GET:', JSON.stringify([...new Set(requests.filter(r => !r.startsWith('GET') && !r.startsWith('HEAD')))].slice(0, 15), null, 1));
await browser.close();
