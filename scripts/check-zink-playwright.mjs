// Opt-in live inspection; never enters guest details or presses Next.
import assert from 'node:assert/strict';
import { BokabordMirror } from '../api/bokabord-mirror.mjs';
const date = process.argv[2] || '2026-10-19';
const mirror = new BokabordMirror();
try {
  let state = await mirror.create('smoke-test', 'curated-STO-zink-italian-cuisine', 420);
  const s = mirror.sessions.get(state.id);
  const page = s.page;
  const blocked = [];
  page.on('requestfailed', r => { if (r.method() !== 'GET') blocked.push(new URL(r.url()).pathname); });
  async function click(locator) {
    await locator.scrollIntoViewIfNeeded();
    state = await mirror.action(s.id, 'smoke-test', { type: 'refresh', revision: state.revision });
    const b = await locator.boundingBox(); assert.ok(b);
    state = await mirror.action(s.id, 'smoke-test', { type: 'click', revision: state.revision, x: b.x + b.width / 2, y: b.y + b.height / 2 });
  }
  await click(page.getByRole('heading', { name: 'Middag', exact: true }));
  await click(page.locator('li[ng-click="selectAmount(amount)"]').filter({ hasText: /^2\s/ }));
  const month = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
  const calendar = page.locator('.ConsumerCalendar-month').filter({ has: page.locator('.ConsumerCalendar-monthHeading').filter({ hasText: month }) });
  const day = calendar.locator('.ConsumerCalendar-day:not(.is-out-of-month):not(.is-disabled)').filter({ hasText: new RegExp('^\\s*' + date.slice(-2) + '\\s*$') });
  await click(day);
  await page.locator('.TimesList-item').first().waitFor();
  const times = await page.locator('.TimesList-item:not(.not-available) .TimesList-itemTime').allTextContents();
  console.log(JSON.stringify({ date, party: 2, times, blocked }, null, 2));
  assert.ok(times.length, 'No selectable time found; inspect provider contract');
  const row = page.locator('.TimesList-item:not(.not-available)').filter({ hasText: times.includes('18:00') ? '18:00' : times[0] });
  await click(row.locator('a.book:visible').first());
  await page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).waitFor();
  state = await mirror.action(s.id, 'smoke-test', { type: 'refresh', revision: state.revision });
  assert.equal(state.contact, true);
  assert.match(state.text, /Förnamn/);
  assert.match(state.text, /Epostadress/);
  await assert.rejects(mirror.action(s.id, 'smoke-test', { type: 'click', revision: state.revision, x: 10, y: 10 }), /contact_stop/);
  console.log('PASS: provider start → dinner → two guests → date → live time → contact. Submission blocked.');
} finally { await mirror.close(); }
