// Full Zenchef flow with aborted POSTs: pick first enabled day -> time -> search -> form.
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 420, height: 760 }, locale: 'fr-FR' });
const page = await context.newPage();

await context.route('**/*', route => {
  const r = route.request();
  if (!['GET', 'HEAD'].includes(r.method())) {
    const u = new URL(r.url());
    // quotation-preview carries only day/time/party (no identity, no hold) and is
    // required for the form to unlock; it is let through once. Everything else —
    // above all the final reservation call — is aborted before leaving the browser.
    if (/zenchef\.com/.test(u.hostname) && /quotation-preview/.test(u.pathname)) return route.continue();
    if (/zenchef\.com/.test(u.hostname) && !/metrics|telemetry/.test(u.pathname)) {
      console.log('INTERCEPTED+ABORTED:', r.method(), r.url());
      console.log('PAYLOAD:', (r.postData() || '').slice(0, 1500));
    }
    return route.abort();
  }
  return route.continue();
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// First enabled day button in the CURRENT month panel (testids repeat per month).
const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
const days = page.locator(`[aria-label*="${monthName}" i] [data-testid^="day-"][data-testid$="-btn"]`);
let clicked = null;
for (const handle of await days.elementHandles()) {
  const dis = await handle.evaluate(el => !!(el.disabled || el.closest('button')?.disabled || el.closest('[aria-disabled="true"]')));
  if (!dis) { await handle.evaluate(el => el.click()); clicked = await handle.getAttribute('data-testid'); break; }
}
console.log('CLICKED DAY:', clicked, '(month:', monthName + ')');
await page.waitForTimeout(3000);

const ids = await page.locator('[data-testid]').evaluateAll(els =>
  els.filter(e => e.getClientRects().length).map(e => ({ id: e.getAttribute('data-testid'), text: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40), dis: e.disabled || undefined })));
console.log('TESTIDS NOW:', JSON.stringify(ids.filter(i => !/^day-|guest-btn/.test(i.id)), null, 1));

const searchBtn = page.locator('[data-testid="search-btn"]');
console.log('search-btn enabled?', await searchBtn.isEnabled().catch(() => 'n/a'));
if (await searchBtn.isEnabled().catch(() => false)) {
  await searchBtn.click();
  await page.waitForTimeout(4000);
  console.log('TEXT AFTER SEARCH:', (await page.locator('body').innerText()).slice(0, 900));

  // Pick the first available time slot the search revealed.
  const slotBtn = page.locator('[data-testid^="slot-available-"]').first();
  if (await slotBtn.isVisible().catch(() => false)) {
    console.log('CLICK SLOT:', await slotBtn.getAttribute('data-testid'));
    await slotBtn.click();
    await page.waitForTimeout(2500);
  }
  // Continue to the contact form (same search-btn continues the flow once a slot is chosen).
  if (await searchBtn.isEnabled().catch(() => false)) {
    console.log('CLICK CONTINUE (search-btn again)');
    await searchBtn.click();
    await page.waitForTimeout(4000);
  }
  console.log('TEXT AFTER SLOT+CONTINUE:', (await page.locator('body').innerText()).slice(0, 900));
  const inputs = await page.locator('input:visible, textarea:visible').evaluateAll(els =>
    els.map(e => ({ type: e.type || '', name: e.name || '', ph: e.placeholder || '', tid: e.getAttribute('data-testid') || '' })));
  console.log('FORM INPUTS:', JSON.stringify(inputs, null, 1));
  const ids2 = await page.locator('[data-testid]').evaluateAll(els =>
    els.filter(e => e.getClientRects().length).map(e => e.getAttribute('data-testid')));
  console.log('TESTIDS ON FORM:', JSON.stringify([...new Set(ids2)]));

  // Fill dummy contact data and attempt the final submit (POST aborted before leaving).
  const fill = async (sel, val) => { const el = page.locator(sel).first(); if (await el.isVisible().catch(() => false)) { await el.fill(val); await el.blur().catch(() => {}); return true; } return false; };
  await fill('[data-testid*="first" i] input, input[name*="first" i]', 'Test');
  await fill('[data-testid*="last" i] input, input[name*="last" i]', 'Guest');
  await fill('input[type="email"], input[name*="email" i]', 'test@example.com');
  await fill('input[type="tel"], input[name*="phone" i]', '+46700000000');
  const finalBtn = page.locator('button:visible, [data-testid$="-btn"]:visible').filter({ hasText: /Confirmer|Valider|Réserver|Envoyer|Book/i }).last();
  if (await finalBtn.isVisible().catch(() => false) && await finalBtn.isEnabled().catch(() => false)) {
    console.log('CLICK FINAL SUBMIT (aborted):', (await finalBtn.innerText()).slice(0, 40));
    await finalBtn.click();
    await page.waitForTimeout(5000);
    console.log('TEXT AFTER SUBMIT-ATTEMPT:', (await page.locator('body').innerText()).slice(0, 600));

  // The book_now click opens the contact form. Fill it, accept terms, then the
  // final submit - its POST is likewise aborted before leaving the browser.
  const fillForm = async (sel, val) => { const el = page.locator(sel).first(); if (await el.isVisible().catch(() => false)) { await el.fill(val); await el.blur().catch(() => {}); return true; } return false; };
  await fillForm('input[name*="first" i], input[placeholder*="Prénom" i], input[id*="first" i]', 'Test');
  await fillForm('input[name*="last" i], input[placeholder*="Nom" i], input[id*="last" i]', 'Guest');
  await fillForm('input[type="email"], input[name*="email" i]', 'test@example.com');
  await fillForm('input[type="tel"], input[name*="phone" i], input[placeholder*="Téléphone" i]', '+46700000000');
  // Accept CGU only; never the marketing opt-ins.
  for (const box of await page.locator('input[type="checkbox"]:visible').all()) {
    const label = await box.evaluate(el => el.closest('label')?.innerText || el.parentElement?.innerText || '');
    if (/conditions g|terms/i.test(label.replace(/\s+/g, ' '))) await box.check().catch(() => box.evaluate(el => el.click()));
  }
  const formInputs = await page.locator('input:visible').evaluateAll(els => els.map(e => ({ name: e.name, id: e.id, type: e.type, tid: e.getAttribute('data-testid') })));
  console.log('CONTACT FORM FIELDS:', JSON.stringify(formInputs, null, 1));
  const bookBtn = page.locator('[data-testid="book_now-btn"], [data-testid="search-btn"]').last();
  if (await bookBtn.isEnabled().catch(() => false)) {
    console.log('CLICK FINAL BOOK (aborted)');
    await bookBtn.click();
    await page.waitForTimeout(5000);
    console.log('TEXT AFTER FINAL:', (await page.locator('body').innerText()).slice(0, 700));
  }
  }
}
await browser.close();
