import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BookingLedger } from './bokabord-ledger.mjs';
import { bookingGuest } from './booking-guest.mjs';

test('guest booking credential is private, persistent and isolated without account authentication', () => {
  const headers = {};
  const res = {setHeader:(name,value)=>{headers[name]=value;}};
  assert.equal(bookingGuest({headers:{}},res),null);
  const owner = bookingGuest({headers:{}},res,true);
  const cookie = headers['Set-Cookie'];
  assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);
  assert.equal(bookingGuest({headers:{cookie}},res),owner);
  assert.notEqual(bookingGuest({headers:{}},res,true),owner);
  assert.equal(bookingGuest({headers:{cookie:'velvet_booking_guest=chosen-owner'}},res),null);
  assert.ok(!cookie.includes(owner));
});
import { allowedRequest, matchesApprovedBooking, BokabordMirror } from './bokabord-mirror.mjs';

const approval = { date: '2026-10-19', time: '17:00', party: 1, firstname: 'Test', lastname: 'Guest', email: 'test@example.com', phone: '+46700000000', terms: true };
const approvedPayload = () => ({ ...approval, amount: 1, waitlist: false, terms: { general: true, restaurant: false, bokabord: false }, products: [] });

test('durable ledger blocks repeats across restarts and isolates users and restaurants', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-ledger-'));
  try {
    const ledger = new BookingLedger(directory);
    const session = { owner: 'alice', restaurantId: 'one', restaurant: 'Test restaurant' };
    ledger.reserve(approval, session);
    assert.throws(() => new BookingLedger(directory).reserve(approval, session), /EEXIST/);
    assert.equal(ledger.list()[0].status, 'unknown');
    session.result = { status: 'confirmed', reference: 'TEST-ONLY' };
    ledger.record(session);
    assert.equal(new BookingLedger(directory).list()[0].providerReference, 'TEST-ONLY');
    ledger.reserve(approval, { ...session, owner: 'bob' });
    ledger.reserve(approval, { ...session, restaurantId: 'two' });
    assert.equal(ledger.list().length, 3);
  } finally { fs.rmSync(directory, {recursive:true,force:true}); }
});

test('live approval is bound to the displayed revision and requires current terms consent', async () => {
  const mirror = new BokabordMirror({ prepare: true, live: true, reserveSubmission: async () => {} });
  mirror.bookingDetails = async () => ({...approval,time:'18:00'});
  const session = { id:'live',owner:'alice',revision:1,touched:Date.now(),lastSnapshot:{details:approval},context:{close:async()=>{}} };
  mirror.sessions.set(session.id,session);
  try {
    await assert.rejects(mirror.action('live','alice',{type:'submit',revision:1,confirm:true}),/confirmation_required/);
    await assert.rejects(mirror.action('live','alice',{type:'submit',revision:1,confirm:true,terms:true}),/stale_view/);
  } finally {await mirror.close();}
});

test('submission requires exact approved details, terms and no marketing or products', () => {
  assert.equal(matchesApprovedBooking(approvedPayload(), approval), true);
  assert.equal(matchesApprovedBooking({...approvedPayload(),phone:''},{...approval,phone:''}), false);
  assert.equal(matchesApprovedBooking({ ...approvedPayload(), phone: '070-000 00 00' }, approval), true);
  for (const changes of [{ amount: 2 }, { date: '2026-10-20' }, { time: '18:00' }, { firstname: 'Other' }, { lastname: 'Other' }, { email: 'other@example.com' }, { phone: '+46711111111' }, { waitlist: true }, { products: [{}] }, { products: {} }, { products: undefined }, { terms: { general: false } }, { terms: { general: true, restaurant: true, bokabord: false } }]) {
    assert.equal(matchesApprovedBooking({ ...approvedPayload(), ...changes }, approval), false);
  }
  assert.equal(matchesApprovedBooking(approvedPayload(), { ...approval, terms: false }), false);
});

test('review submission selects the final button, disarms on failure and prevents repeat submission', async () => {
  const mirror = new BokabordMirror({ prepare: true, authorizeSubmission: async () => approval, reserveSubmission: async () => {} });
  let finalClicks = 0;
  const s = { id: 'review', owner: 'alice', revision: 1, touched: Date.now(), context: { close: async () => {} }, page: {
    getByRole: (role, options) => ({ isVisible: async () => options.name === 'Kontrollera din bokning', click: async () => { assert.ok(options.name.test('SLUTFÖR BOKNINGEN')); finalClicks++; throw new Error('simulated interruption'); } }),
    waitForResponse: async () => null,
  } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action(s.id, s.owner, { type: 'submit', revision: 1 }), /confirmation_required/);
    await assert.rejects(mirror.action(s.id, s.owner, { type: 'submit', revision: 1, confirm: true }), /simulated interruption/);
    assert.equal(s.armed, false);
    assert.equal(s.busy, false);
    s.submitted = true;
    await assert.rejects(mirror.action(s.id, s.owner, { type: 'submit', revision: 1, confirm: true }), /already_attempted/);
    assert.equal(finalClicks, 1);
  } finally { await mirror.close(); }
});
test('inspection never sends booking, contact, payment or unknown mutations', () => {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    assert.equal(allowedRequest(method, 'https://app.bokabord.se/reservation/api/booking/saveBooking'), false);
  }
  for (const path of ['/reservation/api/booking/checkEmail', '/reservation/api/payment', '/unknown']) {
    assert.equal(allowedRequest('POST', 'https://app.bokabord.se' + path), false);
  }
  assert.equal(allowedRequest('POST', 'https://app.bokabord.se/booking-widget/api/getTimes'), true);
  assert.equal(allowedRequest('GET', 'https://evil.example/'), false);
  assert.equal(allowedRequest('GET', 'http://127.0.0.1/'), false);
});
test('ownership, revision, coordinates and input guard prevent cross-session actions', async () => {
  const mirror = new BokabordMirror();
  let clicks = 0;
  const s = { id: 'one', owner: 'alice', revision: 4, touched: Date.now(), width: 420, height: 760, context: { close: async () => {} }, page: { getByRole: () => ({ isVisible: async () => false }), mouse: { click: async () => clicks++ } } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('one', 'bob', { type: 'click', revision: 4 }), /session_expired/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 3 }), /stale_view/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'fill', revision: 4 }), /inspect_only/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 4, x: -1, y: 50 }), /coordinates/);
    s.page.getByRole = () => ({ isVisible: async () => true });
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 4, x: 20, y: 20 }), /contact_stop/);
    assert.equal(clicks, 0);
    await mirror.remove('one', 'bob'); assert.equal(mirror.sessions.size, 1);
    await assert.rejects(mirror.create('alice', 'unknown'), /pilot_only/);
  } finally { await mirror.close(); }
});

import { BookingAssetCache } from './booking-asset-cache.mjs';
test('asset cache reuses public files but never bookings or private responses, expires and stays bounded', () => {
  let now=0;const cache=new BookingAssetCache({maxBytes:8,now:()=>now});
  const req=(type,url,method='GET')=>({resourceType:()=>type,url:()=>url,method:()=>method});
  assert.equal(cache.eligible(req('script','https://app.bokabord.se/app.js')),true);
  for(const type of ['xhr','fetch','document']) assert.equal(cache.eligible(req(type,'https://app.bokabord.se/api/getTimes')),false);
  assert.equal(cache.eligible(req('script','https://app.bokabord.se/app.js','POST')),false);
  const headers={'cache-control':'public, max-age=60','content-type':'application/javascript','content-encoding':'gzip'};
  for(const extra of [{'set-cookie':'private'}, {'cache-control':'private, max-age=60'}, {vary:'Cookie'}, {vary:'*'}, {'content-type':'application/json'}]) {
    cache.put('bad',{...headers,...extra},Buffer.from('abc'),200);assert.equal(cache.get('bad'),null);
  }
  cache.put('a',headers,Buffer.from('abcd'),200);assert.equal(cache.get('a').headers['content-encoding'],undefined);
  cache.put('b',headers,Buffer.from('12345'),200);assert.equal(cache.get('a'),null);assert.equal(cache.bytes,5);
  now=60001;assert.equal(cache.get('b'),null);assert.equal(cache.bytes,0);
});

test('batch contact changes validate every field before touching the provider', async () => {
 const mirror=new BokabordMirror({prepare:true});const edits=[];
 const s={id:'batch',owner:'guest',revision:1,touched:Date.now(),context:{close:async()=>{}},page:{getByRole:()=>({isVisible:async()=>true}),locator:selector=>({fill:async value=>edits.push([selector,value]),blur:async()=>{}})}};
 mirror.sessions.set(s.id,s);mirror.settle=async()=>{};mirror.snapshot=async()=>({ok:true});
 try {
  await assert.rejects(mirror.action('batch','guest',{type:'fill',revision:1,fields:{firstname:'Test',unknown:'bad'}}),/field/);assert.equal(edits.length,0);
  await mirror.action('batch','guest',{type:'fill',revision:1,fields:{firstname:'Test',lastname:'Guest'}});assert.equal(edits.length,2);
 }finally{await mirror.close();}
});

import { RequestBudget } from './request-budget.mjs';
test('browsing cannot exhaust booking updates or protected writes; budgets still enforce limits',()=>{
 let now=0;const budget=new RequestBudget(()=>now);
 for(let i=0;i<100;i++)assert.equal(budget.take('one','GET','/restaurants').allowed,true);
 assert.equal(budget.take('one','POST','/restaurant-bookings/mirror').allowed,true);
 const action='/restaurant-bookings/mirror/12345678-1234-1234-1234-123456789012/action';
 for(let i=0;i<120;i++)assert.equal(budget.take('one','POST',action).allowed,true);
 assert.equal(budget.take('one','POST',action).allowed,false);
 for(let i=1;i<30;i++)assert.equal(budget.take('one','POST','/pay').allowed,true);
 assert.equal(budget.take('one','POST','/pay').allowed,false);
 assert.equal(budget.take('two','POST','/pay').allowed,true);
 now=60000;assert.equal(budget.take('one','POST',action).allowed,true);
});

test('provider-initiated reservation routes to handoff even when query details exist',async()=>{
 const mirror=new BokabordMirror({live:true});
 const s={restaurantId:'curated-STO-zink-italian-cuisine',providerReservationRequired:true,page:{evaluate:async()=>({query:{...approval,hash:'e9d3e6917bc7f05c0df1ae157d9aed5b',products:[]}})}};
 try{assert.equal(await mirror.bookingDetails(s),null);assert.equal(s.handoffReason,'provider_reservation_required');}
 finally{await mirror.close();}
 assert.equal(allowedRequest('POST','https://app.bokabord.se/booking-widget/api/getOffDays'),true);
 assert.equal(allowedRequest('POST','https://app.bokabord.se/reservation/api/booking/saveBooking'),false);
});
