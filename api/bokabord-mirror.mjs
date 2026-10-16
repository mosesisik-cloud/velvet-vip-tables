import crypto from 'node:crypto';
import fs from 'node:fs';
import { createBokabordReceiptVerifier } from './bokabord-receipt-confirmation.mjs';
import { BookingAssetCache } from './booking-asset-cache.mjs';
import { classifyBokabordResult, bookingAttemptSnapshot, publicBookingResult } from './booking-result.mjs';

// Registry, not user-supplied URLs. Other restaurants can share this adapter.
export const RESTAURANT_DETAILS = Object.freeze(JSON.parse(fs.readFileSync(new URL('./bokabord-restaurants.json', import.meta.url), 'utf8')));
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(RESTAURANT_DETAILS).map(([id, row]) => [id, row.url])));
const TTL = 10 * 60_000;
const MAX_SESSIONS = 4;
const CONTACT_FIELDS = {
  firstname: 'input[name="firstname"]:visible', lastname: 'input[name="lastname"]:visible',
  phone: 'input[name="phone"]:visible', email: 'input[name="email"]:visible',
  comment: 'textarea[ng-model="booking.comment"]:visible',
};
// Exploration only. Unknown mutations fail closed, including final booking.
export function allowedRequest(method, address) {
  const url = new URL(address);
  if (url.protocol !== 'https:') return false;
  if (['unpkg.com', 'cdnjs.cloudflare.com', 'js.stripe.com', 'use.fontawesome.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return method === 'GET';
  if (!['app.bokabord.se', 'app.waiteraid.com', 'www.waiteraid.com'].includes(url.hostname)) return false;
  if (/save|confirm|payment|checkout|login|register|cancel|delete/i.test(url.pathname)) return false;
  if (['GET', 'HEAD'].includes(method)) return true;
  return method === 'POST' && /^\/(booking-widget|reservation)\/api\/(?:booking\/)?(?:getTimes|getProducts|getCalendar|getDates|getOffDays|getMeals|getSettings|getAvailability)$/.test(url.pathname);
}
export class MirrorError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
export function matchesApprovedBooking(query, approved) {
  if (!query || !approved || approved.terms !== true) return false;
  const phone = value => String(value || '').replace(/\D/g, '').replace(/^0046/, '46').replace(/^0/, '46');
  if (phone(approved.phone).length < 7 || phone(approved.phone).length > 15) return false;
  return String(query.date) === approved.date && String(query.time) === approved.time && Number(query.amount) === approved.party
    && query.firstname === approved.firstname && query.lastname === approved.lastname && query.email === approved.email
    && phone(query.phone) === phone(approved.phone) && query.waitlist === false && query.terms?.general === true
    && query.terms?.restaurant === false && query.terms?.bokabord === false
    && Array.isArray(query.products) && query.products.length === 0
    && (!approved.hash || query.hash === approved.hash)
    && (!approved.mealid || Number(query.mealid) === approved.mealid)
    && (approved.comment === undefined || String(query.comment || '') === approved.comment)
    && !query.is_temp_booking && !query.giftcard && !(query.linked_meals?.length) && !query.bookingid;
}
// Bokabord also uses its own AJAX queue, outside Angular's $http service.
export function providerReady() {
  const angular = window.angular;
  const root = document.querySelector('[ng-app]') || document.body;
  const injector = angular?.element(root).injector();
  const scope = angular?.element(document.body).scope();
  const loader = [...document.querySelectorAll('#ajaxloader,[ng-if="isAjaxRequest()"]')]
    .some(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  const phone = document.querySelector('input.phoneField');
  const phoneReady = !phone || !phone.getClientRects().length || !!phone.closest('.intl-tel-input');
  return !!injector && phoneReady && !loader && !scope?.isAjaxRequest?.()
    && injector.get('$http').pendingRequests.length === 0 && !injector.get('$rootScope').$$phase;
}
export class BokabordMirror {
  sessions = new Map();
  assets = new BookingAssetCache();
  browserPromise = null;
  pending = 0;
  pendingOwners = new Set();
  constructor({ prepare = false, live = false, authorizeSubmission = null, reserveSubmission = null, recordResult = null, verifyResult = null, contactFinalPolicies = [] } = {}) {
    this.contactFinalVerifiers = new Map(contactFinalPolicies.map(policy => [policy.restaurantId, createBokabordReceiptVerifier(policy)]));
    this.prepare = prepare;
    this.authorizeSubmission = authorizeSubmission;
    this.reserveSubmission = reserveSubmission;
    this.live = live;
    this.recordResult = recordResult;
    this.verifyResult = verifyResult;
    this.timer = setInterval(() => this.expire(), 30_000);
    this.timer.unref();
  }
  async browser() {
    if (!this.browserPromise) {
      this.browserPromise = import('playwright').then(({ chromium }) => chromium.launch({ headless: true }))
        .catch(error => { this.browserPromise = null; throw error; });
    }
    return this.browserPromise;
  }
  async create(owner, restaurantId, width = 420) {
    if (!owner) throw new MirrorError('auth', 401);
    const address = RESTAURANTS[restaurantId];
    if (!address) throw new MirrorError('pilot_only');
    if (this.sessions.size + this.pending >= MAX_SESSIONS) throw new MirrorError('capacity', 429);
    if (this.pendingOwners.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new MirrorError('session_exists', 409);
    this.pending++;
    this.pendingOwners.add(owner);
    let context;
    let sessionId;
    try {
      const browser = await this.browser();
      width = Math.max(320, Math.min(760, Math.round(Number(width) || 420)));
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'sv-SE', timezoneId: 'Europe/Stockholm', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: RESTAURANT_DETAILS[restaurantId].name, context, width, height: 760, revision: 0, busy: false, touched: Date.now(), blocked: false };
      sessionId = s.id;
      await context.route('**/*', async route => {
        const r = route.request();
        if (r.method() === 'POST' && r.url() === 'https://app.bokabord.se/reservation/api/booking/saveBooking' && s.armed && !s.submitted) {
          let query;
          try { query = r.postDataJSON(); } catch {}
          if (!matchesApprovedBooking(query, s.approval)) { s.blocked = true; s.result = { status: 'payload_mismatch' }; return route.abort(); }
          try { if (!s.submissionReserved) await this.reserveSubmission(s.approval, s); } catch { s.result = { status: 'already_attempted' }; return route.abort(); }
          if (s.receiptVerificationEnabled) s.dispatchObservation = {dispatchedAt:Date.now(),request:{
            method:r.method(),url:r.url(),payload:structuredClone(query),
          }};
          s.submitted = true; s.result = { status: 'unknown' };
          if (s.receiptVerificationEnabled) {
            // Preserve the original response before its browser-side navigation
            // can evict the body from Chromium's response cache. This is the one
            // authorized transmission, not a replay or a second readback call.
            s.responseCapturedByRoute=true;
            try {
              const response=await route.fetch({maxRedirects:0,maxRetries:0,timeout:20000});
              const respondedAt=Date.now();
              const data=await response.json().catch(()=>null);
              s.resultPromise=this.recordResponse(s,data,response.ok(),respondedAt)
                .catch(()=>{s.result={status:'unknown',reason:'result_persistence_failed'};});
              await s.resultPromise;
              return await route.fulfill({response});
            } catch {
              s.result={status:'unknown'};
              return route.abort().catch(()=>{});
            }
          }
          return route.continue();
        }
        if (!allowedRequest(r.method(), r.url())) {
          if (/\/saveBooking(?:\?|$)/i.test(r.url())) s.providerReservationRequired = true;
          if ((r.isNavigationRequest() && r.frame() === s.page?.mainFrame()) || /saveBooking/i.test(r.url())) s.blocked = true;
          return route.abort();
        }
        return this.assets.handle(route);
      });
      s.page = await context.newPage();
      s.navigationGeneration=0;s.documentGeneration=0;s.navigationRequests=new WeakMap();
      s.page.on('request',request=>{
        try {
          if (request.isNavigationRequest() && request.frame() === s.page.mainFrame()) {
            s.navigationRequests.set(request,++s.navigationGeneration);
          }
        } catch { /* Detached-frame requests cannot supply receipt evidence. */ }
      });
      s.page.on('framenavigated',frame=>{
        if (frame === s.page.mainFrame()) {
          if (s.documentGeneration === s.navigationGeneration) s.navigationGeneration++;
          s.documentGeneration=s.navigationGeneration;
        }
      });
      s.page.on('response', response => {
        this.assets.capture(response).catch(() => {});
        if (!s.submitted) return;
        if (response.url() !== 'https://app.bokabord.se/reservation/api/booking/saveBooking') {
          if (s.receiptVerificationEnabled) {
            try {
              const request = response.request?.();
              const address = new URL(response.url());
              if (request?.isNavigationRequest() && request.method() === 'GET' && request.frame() === s.page.mainFrame()
                && address.origin === 'https://app.bokabord.se' && address.pathname === '/reservation/booking/') {
                const navigationId=s.navigationRequests.get(request);
                s.receiptPromise = this.captureReceipt(s,response,Date.now(),navigationId).catch(() => {});
              }
            } catch { /* A detached frame is not confirmation evidence. */ }
          }
          return;
        }
        if (s.responseCapturedByRoute) return;
        const respondedAt=Date.now();
        s.resultPromise = (async () => {
        const data = await response.json().catch(() => null);
        await this.recordResponse(s,data,response.ok?.() === true,respondedAt);
      })().catch(() => { s.result = { status: 'unknown' }; }); });
      s.page.setDefaultTimeout(12_000);
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      await s.page.goto(address, { waitUntil: 'domcontentloaded' });
      await s.page.locator('h1,h2,h3').first().waitFor();
      await this.settle(s);
      this.sessions.set(s.id, s);
      return await this.snapshot(s);
    } catch (error) { this.sessions.delete(sessionId); await context?.close(); throw error; }
    finally { this.pending--; this.pendingOwners.delete(owner); }
  }
  owned(id, owner) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) throw new MirrorError('session_expired', 404);
    if (Date.now() - s.touched > TTL) { this.remove(id, owner); throw new MirrorError('session_expired', 404); }
    return s;
  }
  async settle(s) {
    // Wait for Angular's actual work, not unrelated analytics or a fixed delay per edit.
    await s.page.waitForFunction(providerReady, null, { timeout: 8000 });
    await s.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // A date click can start the provider AJAX queue during the render frames.
    await s.page.waitForFunction(providerReady, null, { timeout: 8000 });
  }

  async recordResponse(s,data,httpOk,respondedAt) {
    if (s.receiptVerificationEnabled) s.responseObservation={data,httpOk,respondedAt};
    s.result=httpOk ? (this.verifyResult ? await this.verifyResult(data,s) : classifyBokabordResult(data))
      : {status:'unknown',reason:'supplier_http_error'};
    if (s.result) await this.recordResult?.(s);
  }

  async captureReceipt(s, response, navigatedAt, navigationId) {
    // Observe the provider's own navigation; never construct or fetch a receipt URL.
    // The private request/response/document stay only in this owned browser session.
    await s.resultPromise;
    if (!Number.isSafeInteger(navigationId) || navigationId<1
      || !s.dispatchObservation || !s.responseObservation?.httpOk || s.result?.status !== 'unknown'
      || response.ok?.() !== true || !this.verifyResult || typeof this.recordResult !== 'function') return;
    let timer;
    try {
      await Promise.race([response.finished(),new Promise((_,reject)=>{
        timer=setTimeout(()=>reject(new Error('receipt_deadline')),5000);
      })]);
    } finally {clearTimeout(timer);}
    await s.page.waitForLoadState('domcontentloaded',{timeout:5000});
    const address=response.url();
    if (s.navigationGeneration !== navigationId || s.documentGeneration !== navigationId || s.page.url() !== address) return;
    let capturedDocument;
    try {
      capturedDocument=await Promise.race([s.page.evaluate(()=>({url:location.href,text:document.body.innerText})),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('receipt_capture_deadline')),5000);})]);
    } finally {clearTimeout(timer);}
    if (capturedDocument.text.length > 64000 || capturedDocument.url !== address || s.page.url() !== address
      || s.navigationGeneration !== navigationId || s.documentGeneration !== navigationId || this.sessions.get(s.id) !== s) return;
    const result=await this.verifyResult(s.responseObservation.data,s,{
      httpOk:s.responseObservation.httpOk,respondedAt:s.responseObservation.respondedAt,
      request:s.dispatchObservation.request,
      receipt:{mainFrame:true,method:'GET',httpOk:true,url:address,navigatedAt,capturedAt:Date.now(),
        navigationId,documentNavigationId:s.documentGeneration,documentUrl:capturedDocument.url,text:capturedDocument.text},
    });
    if (result?.status !== 'confirmed') return;
    s.result=result;
    try { await this.recordResult?.(s); }
    catch { s.result={status:'unknown',reason:'result_persistence_failed'}; }
  }

  async nativeReviewBinding(s, details) {
    const digest = this.contactFinalVerifiers.get(s.restaurantId)?.approvalDigest(details);
    if (!digest) return null;
    const view = await s.page.evaluate(() => {
      const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      return {url:location.href,text:document.body.innerText,
        links:[...document.querySelectorAll('a[href]')].filter(visible).map(el=>({text:el.innerText,href:el.href})),
        checks:[...document.querySelectorAll('input[type=checkbox]')].filter(visible).map(el=>({name:el.name,value:el.value,checked:el.checked}))};
    });
    if (view.text.length > 64_000 || view.links.length > 100 || view.links.some(link=>!/^https?:/.test(link.href))) return null;
    return { fingerprint: crypto.createHash('sha256').update(JSON.stringify([digest,view])).digest('hex'), text:view.text, links:view.links };
  }

  async snapshot(s) {
    // No screenshot or personal fields are persisted to disk.
    const contact = await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible();
    if (contact && this.prepare && !s.contactInitialized) {
      // No marketing opt-in is inferred from a booking request.
      for (const box of await s.page.locator('input[type="checkbox"]:visible').all()) await box.uncheck();
      s.contactInitialized = true;
    }
    let fields = contact && this.prepare ? await s.page.evaluate(selectors => {
      return Object.entries(selectors).flatMap(([name, selector]) => {
        const inputs = [...document.querySelectorAll(selector.replace(':visible',''))].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        if (inputs.length !== 1) return [];
        const input = inputs[0], rect = input.getBoundingClientRect();
        return [{name,value:input.value,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}}];
      });
    }, CONTACT_FIELDS) : [];
    let review = await s.page.getByRole('heading', { name: 'Kontrollera din bokning', exact: true }).isVisible();
    const details = this.live ? await this.bookingDetails(s) : null;
    const contactFinal = this.contactFinalVerifiers.has(s.restaurantId);
    const binding = contactFinal && contact && !s.submitted ? await this.nativeReviewBinding(s,details) : null;
    if (s.nativeReview && (!binding || binding.fingerprint !== s.nativeReview.fingerprint || Date.now()-s.nativeReview.createdAt > 300_000)) s.nativeReview = null;
    const nativeReview = s.nativeReview ? {token:s.nativeReview.token,details:s.nativeReview.details,termsText:s.nativeReview.text,links:s.nativeReview.links} : null;
    if (nativeReview) { review = true; fields = []; }
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    s.revision++;
    const canSubmit = !!(this.prepare && this.reserveSubmission && !s.submitted && !s.finalActionConsumed && !s.result && (!contactFinal || !!binding) && (this.live ? details : await this.authorizeSubmission?.()));
    const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant, revision: s.revision, width: s.width, height: s.height, image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'), capturedAt: new Date().toISOString(), fields, text, contact, review, details, contactFinal, nativeReview, blocked: s.blocked, mode: this.prepare ? 'prepare' : 'inspect', canSubmit, result: s.result ? publicBookingResult(s.result) : null, expiresIn: TTL / 1000 };
    snapshot.handoff = s.handoffReason ? { reason: s.handoffReason, url: RESTAURANTS[s.restaurantId] } : null;
    s.lastSnapshot = snapshot;
    return snapshot;
  }
  async bookingDetails(s) {
    // Read the provider's own form model; never alter it or call its save method.
    const model = await s.page.evaluate(() => {
      const root = document.querySelector('[ng-app]') || document.body;
      const booking = window.angular?.element(root).injector()?.get('Booking');
      return { query: booking.getQuery(), card: !!booking.meal?.bullets?.cc || booking.require_noshow === true || !!booking.meal?.must_pay_directly, products: !!booking.meal?.mandatory_products };
    }).catch(() => null);
    const q = model?.query;
    s.handoffReason = s.providerReservationRequired ? 'provider_reservation_required' : model?.card ? 'card_required' : model?.products || q?.products?.length ? 'products_required' : q?.waitlist ? 'waitlist' : null;
    if (s.handoffReason) return null;
    if (!q || q.hash !== RESTAURANT_DETAILS[s.restaurantId].hash || !/^\d{4}-\d{2}-\d{2}$/.test(q.date) || !/^\d{2}:\d{2}$/.test(q.time) || !Array.isArray(q.products) || q.products.length || q.waitlist || q.giftcard || q.linked_meals?.length || q.bookingid) return null;
    return { date: q.date, time: q.time, party: Number(q.amount), firstname: q.firstname || '', lastname: q.lastname || '', email: q.email || '', phone: q.phone || '', comment: q.comment || '', mealid: Number(q.mealid), hash: q.hash, terms: true };
  }
  current(owner) {
    const s = [...this.sessions.values()].find(row => row.owner === owner);
    if (!s) return { error: 'session_expired' };
    this.owned(s.id, owner);
    return bookingAttemptSnapshot(s);
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new MirrorError('busy', 409);
    if (action.revision !== s.revision) throw new MirrorError('stale_view', 409);
    if ((s.submitted || s.finalActionConsumed) && !['refresh','scroll'].includes(action.type)) throw new MirrorError('already_attempted',409);
    if (!['click', 'scroll', 'refresh', ...(this.prepare ? ['fill'] : []), ...((this.live || this.authorizeSubmission) && this.reserveSubmission ? ['submit','review','edit-review'] : [])].includes(action.type)) throw new MirrorError('inspect_only');
    s.busy = true; s.touched = Date.now();
    try {
      if (action.type === 'review') {
        if (!this.live || !this.contactFinalVerifiers.has(s.restaurantId) || s.result || s.armed) throw new MirrorError('review_required',409);
        if (!await s.page.getByRole('heading',{name:'Kontaktuppgifter',exact:true}).isVisible()) throw new MirrorError('contact_required');
        const details = await this.bookingDetails(s);
        const binding = await this.nativeReviewBinding(s,details);
        if (!binding || JSON.stringify(details)!==JSON.stringify(s.lastSnapshot.details)) throw new MirrorError('stale_view',409);
        s.nativeReview = {token:crypto.randomUUID(),details:Object.freeze(structuredClone(details)),...binding,createdAt:Date.now()};
        // This action never clicks the provider or arms a request.
      } else if (action.type === 'edit-review') {
        s.nativeReview = null;
      } else if (action.type === 'submit') {
        if (s.submitted || s.finalActionConsumed || s.armed || s.result) throw new MirrorError('already_attempted', 409);
        if (action.confirm !== true) throw new MirrorError('confirmation_required', 409);
        if (this.live && action.terms !== true) throw new MirrorError('confirmation_required', 409);
        const approval = this.live ? s.lastSnapshot.details : await this.authorizeSubmission();
        if (!approval) throw new MirrorError('confirmation_required', 409);
        if (this.live && JSON.stringify(approval) !== JSON.stringify(await this.bookingDetails(s))) throw new MirrorError('stale_view', 409);
        const review = await s.page.getByRole('heading', { name: 'Kontrollera din bokning', exact: true }).isVisible();
        if (!review && !await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_required');
        const contactFinal = this.contactFinalVerifiers.has(s.restaurantId);
        if (contactFinal) {
          const frozen = s.nativeReview;
          const binding = await this.nativeReviewBinding(s,approval);
          if (!frozen || !s.lastSnapshot.nativeReview || action.reviewToken !== frozen.token
            || Date.now()-frozen.createdAt > 300_000 || binding?.fingerprint !== frozen.fingerprint
            || JSON.stringify(approval)!==JSON.stringify(frozen.details)) {
            s.nativeReview = null; throw new MirrorError('review_required',409);
          }
          s.approval = frozen.details;
          // Consume durable permission before the final provider button is clicked.
          await this.reserveSubmission(s.approval,s);
          s.submissionReserved = true; s.finalActionConsumed = true;
        } else s.approval = approval;
        s.armed = review || contactFinal;
        const response = s.page.waitForResponse(r => r.url() === 'https://app.bokabord.se/reservation/api/booking/saveBooking', { timeout: 20_000 }).catch(() => null);
        await s.page.getByRole('button', { name: review ? /Slutför bokningen/i : 'Nästa', exact: !review }).click();
        if (!review && !contactFinal) {
          const guest = s.page.getByText(/Fortsätt utan konto/i);
          await guest.waitFor({timeout: 3500}).catch(() => {});
          if (await guest.isVisible()) await guest.click();
        }
        if (s.submitted || review || contactFinal) await response;
        if (contactFinal && !s.submitted) { s.submitted=true; s.result={status:'unknown'}; await this.recordResult?.(s); }
        await s.resultPromise;
        if (s.submitted) await s.page.waitForURL(/\/reservation\/booking\//, { timeout: 5000 }).catch(() => {});
        await s.receiptPromise;
        s.armed = false;
      } else if (action.type === 'fill') {
        s.nativeReview = null;
        if (!await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_required');
        const entries = action.fields && typeof action.fields === 'object' && !Array.isArray(action.fields) ? Object.entries(action.fields) : [[action.field, action.value]];
        if (!entries.length || entries.length > 5 || entries.some(([field,value]) => !Object.hasOwn(CONTACT_FIELDS,field) || typeof value !== 'string' || value.length > 300)) throw new MirrorError('field');
        for (const [field,value] of entries) {
          const input = s.page.locator(CONTACT_FIELDS[field]);
          await input.fill(value);
          await input.blur();
        }
      } else if (action.type === 'click') {
        s.nativeReview = null;
        if (await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_stop', 409);
        const { x, y } = action;
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= s.width || y >= s.height) throw new MirrorError('coordinates');
        await s.page.mouse.click(x, y);
      } else if (action.type === 'scroll') {
        const dy = Number(action.dy);
        if (!Number.isFinite(dy) || Math.abs(dy) > 760) throw new MirrorError('scroll');
        await s.page.mouse.move(s.width / 2, s.height / 2);
        await s.page.mouse.wheel(0, dy);
      }
      if (s.submitted && s.receiptVerificationEnabled) {
        // A completion document need not contain the booking widget's Angular app.
        await s.page.waitForLoadState('domcontentloaded',{timeout:5000}).catch(()=>{});
      } else await this.settle(s);
      return await this.snapshot(s);
    } catch (error) {
      if (s.finalActionConsumed && !s.submitted) {
        s.submitted=true; s.result={status:'unknown'};
        try { await this.recordResult?.(s); } catch { /* Unknown remains consumed. */ }
      }
      throw error;
    } finally { s.armed = false; s.busy = false; }
  }
  async remove(id, owner) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) return;
    this.sessions.delete(id);
    await s.context.close();
  }
  async expire() {
    for (const s of this.sessions.values()) if (!s.busy && Date.now() - s.touched > TTL) await this.remove(s.id, s.owner).catch(() => {});
  }
  async close() {
    clearInterval(this.timer);
    await Promise.all([...this.sessions.values()].map(s => this.remove(s.id, s.owner)));
    if (this.browserPromise) await (await this.browserPromise).close();
  }
}
