import crypto from 'node:crypto';

export const SAZON = Object.freeze({
  restaurantId: 'osm-BAL-sazon', name: 'Saz\u00f3n', slug: 'regent-bali-canggu-sazon',
  shopId: '679ad6c65cfb12f1c5492a58', menuId: '684f99577a39bdf73ccda4ab',
  url: 'https://www.tablecheck.com/en/regent-bali-canggu-sazon/reserve/message',
  source: 'https://sazonbali.com/', timezone: 'Asia/Makassar', currency: 'IDR',
});
const GRID = 'https://production-booking.tablecheck.com/v2/booking/availability_v5/grid';
const TTL = 600_000, FRESH = 120_000;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const copy = value => structuredClone(value);
const API = 'https://production-booking.tablecheck.com/v2';
const opaque = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,256}$/.test(value);
export class TablecheckSazonError extends Error {
  constructor(code, status = 409) { super(code); this.status = status; }
}
function requireValue(ok, code) { if (!ok) throw new TablecheckSazonError(code); }
function validQuery(query) {
  const date = query?.date;
  requireValue(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date
    && query.party === 2, 'search_fields');
}
function decodeAttribute(text) {
  return text.replace(/&#x([0-9a-f]+);|&#(\d+);|&(quot|apos|lt|gt|amp);/gi, (_, hex, dec, named) => {
    if (hex || dec) return String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10));
    return { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' }[named.toLowerCase()];
  });
}
// Parse embedded JSON only. No provider script, hydration, cart restoration or DOM click.
export function sazonPolicy(html) {
  const match = html.match(/<input\s+data-preloaded="context"[^>]*\svalue='([^']*)'/);
  requireValue(match, 'policy_missing');
  let data;
  try { data = JSON.parse(decodeAttribute(match[1])); } catch { throw new TablecheckSazonError('policy_invalid'); }
  const settings = data['/booking/booking_pages']?.get;
  const shop = settings?.shop, page = settings?.booking_page;
  const menu = data.menu?.items?.[SAZON.menuId];
  requireValue(shop?.slug === SAZON.slug && shop.id === SAZON.shopId
    && shop.time_zone === SAZON.timezone && shop.currency === SAZON.currency
    && page?.shop_slug === SAZON.slug && page.is_active === true, 'venue_binding');
  requireValue(shop.enable_payments === false && shop.smartpay_mode === 'none'
    && Array.isArray(shop.payment_gateways) && shop.payment_gateways.length === 0
    && page.reservation_auto_accept === true && page.require_email_confirmation === false
    && page.min_num_people <= 2 && page.max_num_people >= 2, 'policy_changed');
  requireValue(menu?.id === SAZON.menuId && menu.slug === 'a-la-carte'
    && menu.isActive === true && menu.isHidden === false && menu.isGroupOrder === false
    && menu.paymentType === 'none' && menu.paymentRequireIntl === false
    && menu.paymentRequireGroupSize === null && menu.price === null
    && menu.useExperiencePage === true, 'menu_policy_changed');
  const service = page.booking_services?.find(row => row.service_mode === 'dining');
  requireValue(service && Array.isArray(service.cancel_policy_translations)
    && page.input_customer_phone === 'required' && page.input_customer_email === 'required', 'guest_policy_changed');
  requireValue(Array.isArray(service.questions) && service.questions.length === 2
    && service.questions.every(q => q.is_required === false)
    && service.questions[0].id === '679ad6c65cfb12f1c5492a55' && service.questions[0].ui_type === 'textarea'
    && service.questions[1].id === '679ad6c65cfb12f1c5492a56' && service.questions[1].ui_type === 'checkboxes'
    && Array.isArray(menu.questions) && menu.questions.length === 0, 'guest_policy_changed');
  // Version all current source policy, rather than pretending null menu price means free.
  const policy = { shop, page, menu };
  return { version: hash(policy), source: SAZON.url, shopId: shop.id,
    menu: { id: menu.id, name: menu.nameTranslations, description: menu.descriptionTranslations,
      count: 1, isGroupOrder: true, party: 2, price: null, priceStatus: 'not_provided', currency: shop.currency },
    categories: copy(shop.service_categories), terms: copy(service),
    guestRequirements: { phone: page.input_customer_phone, email: page.input_customer_email,
      purpose: page.input_purpose, roomName: page.input_room_name, questions: copy(service.questions),
      marketing: page.input_marketing },
    reservationTimeout: page.reservation_timeout };
}

// Native client 189154 + Pages-Menu 513011; interceptor adds locale/session_ref.
// session_ref is the native random UUID correlation value, not a cart capability.
export function sazonSearchPayload(query, sessionRef) {
  validQuery(query);
  requireValue(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionRef), 'search_session');
  return { shop_id: SAZON.slug, start_at: `${query.date}T00:00:00.000+08:00`,
    pax_adult: 2, pax_senior: 0, pax_child: 0, pax_baby: 0, service_category_ids: [],
    manual_duration: null, voucher_ids: [], smoking: 'none',
    // Experience Book now (Pages-Menu 872909) overrides catalog isGroupOrder:
    // one group order, with the two diners bound separately in pax_adult.
    orders: [{ is_group_order: true, qty: 1, menu_item_id: SAZON.menuId }],
    use_experience_page: true, locale: 'en', session_ref: sessionRef };
}

// There is deliberately no generic provider-host allowlist. In particular a
// GET capability and the deceptively named checkout_status PUT are not search.
export function sazonRequestAllowed(method, address, body, query, sessionRef) {
  if (method === 'GET' && address === SAZON.url && body === undefined) return true;
  if (method !== 'POST' || address !== GRID) return false;
  try { return hash(body) === hash(sazonSearchPayload(query, sessionRef)); } catch { return false; }
}

// Wire JSON has snake_case; use RAW rows, not native UI filtering/coercion.
export function sazonGrid(data, query, policy, observedAt) {
  validQuery(query);
  const grid = data?.availability_grid;
  requireValue(!data?.error && grid && typeof grid === 'object', 'availability_schema');
  const base = { restaurantId: SAZON.restaurantId, provider: 'TableCheck', date: query.date,
    party: 2, timezone: SAZON.timezone, observedAt, source: 'provider_availability_grid',
    policyVersion: policy.version, slots: [] };
  if (grid.code === 'failure') {
    requireValue(Array.isArray(grid.data?.menu_item_ids)
      && grid.data.menu_item_ids.every(id => id === SAZON.menuId), 'availability_schema');
    return { ...base, status: 'invalid_menu_items', rejectedMenuIds: copy(grid.data.menu_item_ids) };
  }
  requireValue(Array.isArray(grid.data) && grid.data.length <= 2000, 'availability_schema');
  const categories = new Set(policy.categories.map(row => row.id));
  const slots = [];
  for (const row of grid.data) {
    // Native !false is too permissive for confirmed availability evidence.
    if (row.a !== true) continue;
    requireValue(typeof row.t === 'string' && Number.isFinite(Date.parse(row.t)), 'slot_time');
    const local = new Date(Date.parse(row.t) + 8 * 3600_000).toISOString();
    requireValue(local.slice(0, 10) === query.date && local.slice(17, 23) === '00.000', 'slot_date');
    requireValue(row.sc == null || categories.has(row.sc), 'slot_category');
    requireValue(row.exp == null || row.exp === SAZON.menuId, 'slot_menu');
    const slot = { time: local.slice(11, 16), startAt: row.t, serviceCategoryId: row.sc ?? null,
      menuId: SAZON.menuId, count: 1, isGroupOrder: true };
    slot.id = hash({ query, policyVersion: policy.version, ...slot });
    if (!slots.some(other => other.id === slot.id)) slots.push(slot);
  }
  return { ...base, status: slots.length ? 'available' : 'no_availability', slots };
}

function checkedSelection(details) {
  validQuery(details);
  requireValue(details.restaurantId === SAZON.restaurantId && details.menuId === SAZON.menuId
    && details.count === 1 && details.isGroupOrder === true
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(details.time), 'selection_binding');
  requireValue(Number.isFinite(Date.parse(details.startAt))
    && new Date(Date.parse(details.startAt) + 8 * 3600_000).toISOString().slice(0, 16)
      === `${details.date}T${details.time}`, 'selection_binding');
}
function cleanGuest(fields) {
  requireValue(fields && Object.keys(fields).sort().join(',') === 'email,firstname,lastname,phone', 'guest_fields');
  const guest = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : '']));
  requireValue([guest.firstname, guest.lastname].every(name => name.length > 0 && name.length <= 100 && !/[\x00-\x1f<>]/.test(name))
    && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(guest.email) && guest.email.length <= 254
    && /^\+[1-9]\d{6,14}$/.test(guest.phone), 'guest_fields');
  return guest;
}

// Source client B serializer 178700; jaKR group order override 872909.
// Initial cart is before guest form; update uses the explicit final guest.
export function sazonCartPayload(details, sessionRef, guest = null) {
  checkedSelection(details);
  sazonSearchPayload(details, sessionRef);
  const customer = guest ? cleanGuest(guest) : { firstname: '', lastname: '', email: '', phone: '' };
  return { shop_slug: SAZON.slug, service_mode: 'dining', pax_adult: 2,
    pax_senior: 0, pax_child: 0, pax_baby: 0, start_at: details.startAt,
    manual_duration: null, seat_types: [], smoking: 'none', service_category_id: details.serviceCategoryId,
    purpose: null, room_name: '', visit_history: null, special_request: '',
    orders: [{ is_group_order: true, qty: 1, menu_item_id: SAZON.menuId }],
    // Optional questions serialize even when empty, after the guest form.
    answers: guest ? [{ question_id: '679ad6c65cfb12f1c5492a55', text: '' },
      { question_id: '679ad6c65cfb12f1c5492a56', question_option_ids: [], is_selected: false }] : [],
    membership_auth_id: null, allow_marketing: false, use_experience_page: true,
    menu_item_ids: [SAZON.menuId], is_smartpay_requested: false, voucher_ids: [],
    customer: { first_name: customer.firstname, last_name: customer.lastname,
      is_single_name: false, email: customer.email, phone: customer.phone },
    send_texts: false, locale: 'en', session_ref: sessionRef };
}
// Source E serializer and checkoutCart call; no gateway/token/invoice/wallet branches.
export function sazonCheckoutPayload(sessionRef) {
  sazonSearchPayload({ date: '2026-10-19', party: 2 }, sessionRef);
  return { allow_provider_marketing: false, locale: 'en', session_ref: sessionRef };
}
// Native Experience mount -> initCart: client 195539, pages 873700.
// Clean entry has no URL query or amendment; never forward arbitrary URL fields.
export function sazonInitPayload(sessionRef) {
  sazonSearchPayload({ date: '2026-10-19', party: 2 }, sessionRef);
  return { shop_id: SAZON.shopId, locale: 'en', session_ref: sessionRef };
}
function exactOrders(rows) {
  // qty=1 is source-backed on the outgoing Experience request. Requiring it
  // on saved raw rows is an unverified conservative adapter hypothesis: native
  // saved mapping forces group quantity to 1 regardless of the returned qty.
  // Do not enable live verification until the raw saved representation is known.
  return Array.isArray(rows) && rows.length === 1 && rows[0]?.menu_item_id === SAZON.menuId
    && rows[0].qty === 1 && rows[0].is_group_order === true;
}
function cartFromOwnResponse(response, details, now, previous = null) {
  // Conservative adapter gates, NOT a provider guarantee that POST/PUT returns
  // every field. Orders/start/pax/category are consumed in GET-cart restoration;
  // native state also defaults missing payment fields. A partial write response
  // therefore stays unknown here rather than inheriting native UI defaults.
  const body = response?.data, cart = body?.cart;
  requireValue(response.status === 200 && !body.error && body.availability?.type === 'success'
    && body.is_request_enabled === false && cart && opaque(cart.id) && opaque(cart.access_token)
    && Number.isFinite(Date.parse(cart.expires_at)) && Date.parse(cart.expires_at) > now
    && cart.start_at === details.startAt && exactOrders(cart.orders)
    && cart.payment_transaction_type === 'none' && cart.show_payment_form === false
    && (cart.booking_fee_amt === null || cart.booking_fee_amt === 0 || cart.booking_fee_amt === '0')
    && (!previous || cart.id === previous.id), 'cart_response_unverified');
  return { id: cart.id, token: cart.access_token, expiresAt: Date.parse(cart.expires_at) };
}

// Strict raw readback: deliberately no UI menu filtering or qty normalization.
// Caller must supply only the response to this attempt's own checkout capability.
export function sazonSavedResult(response, binding) {
  const unknown = { status: 'unknown' };
  if (!binding || response?.status !== 200 || response.data?.error || response.data?.errors?.length) return unknown;
  const r = response.data?.reservation, a = binding.approval, attempt = binding.attempt;
  if (!r || !a || !attempt || !binding.checkoutCode || !binding.cartDigest
    || attempt.phase !== 'booking' || attempt.provider !== 'TableCheck'
    || attempt.restaurantId !== SAZON.restaurantId || attempt.sessionId !== a.sessionId
    || attempt.reviewFingerprint !== a.reviewFingerprint || !attempt.attemptId || !attempt.idempotencyKey
    || attempt.date !== a.details.date || attempt.time !== a.details.time || attempt.party !== 2
    || binding.cartDigest !== a.cartDigest || r.slug !== binding.checkoutCode
    || !opaque(r.id) || r.shop_id !== SAZON.shopId || r.shop_slug !== SAZON.slug
    || Date.parse(r.start_at) !== Date.parse(a.details.startAt)
    || r.num_people_adult !== 2 || r.num_people_senior !== 0 || r.num_people_child !== 0 || r.num_people_baby !== 0
    || r.service_category_id !== a.details.serviceCategoryId || !exactOrders(r.orders)) return unknown;
  const verification = {
    verified: true, source: attempt.mode === 'fixture' ? 'fixture' : 'provider',
    provider: 'TableCheck', restaurantId: SAZON.restaurantId, sessionId: a.sessionId,
    attemptId: attempt.attemptId, idempotencyKey: attempt.idempotencyKey,
    reviewFingerprint: a.reviewFingerprint, policySource: SAZON.url,
    orderEvidence: 'own_booking_raw_readback' };
  if (r.iou_payable === true || ['iou_auth', 'iou_prepay'].includes(r.customer_status)) return { status: 'payment_required', verification };
  if (r.iou_payable !== false || (r.iou_status != null && r.iou_status !== '')) return unknown;
  if (['pending', 'request'].includes(r.customer_status)) return { status: 'pending', verification };
  if (!['accepted', 'confirmed'].includes(r.customer_status)) return unknown;
  return { status: 'confirmed', reference: r.id, verification };
}

// Existing PlaywrightRuntime create/action/current/remove lifecycle; no second
// booking engine. This preparation adapter never creates/restores a native cart.
export class TablecheckSazon {
  #sessions = new Map();
  #pending = new Set();
  #closed = false;
  constructor({ fetchImpl = fetch, now = Date.now, mode = 'prepare', mutationTransport,
    reserveSubmission, recordResult } = {}) {
    requireValue(['prepare', 'fixture'].includes(mode), 'mode');
    requireValue(mode !== 'fixture' || (fetchImpl !== fetch && typeof mutationTransport === 'function'
      && typeof reserveSubmission === 'function' && typeof recordResult === 'function'), 'fixture_transport_required');
    // Live mutations remain impossible until cart/init prerequisite is resolved.
    // Fixture mode exercises the SAME lifecycle and is rejected by runtime.project.
    this.mode = mode; this.fetch = fetchImpl; this.now = now;
    this.mutationTransport = mutationTransport;
    this.reserveSubmission = reserveSubmission; this.recordResult = recordResult;
  }
  async request(method, url, body, session, query) {
    requireValue(sazonRequestAllowed(method, url, body, query, session.sessionRef), 'request_forbidden');
    const response = await this.fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { Accept: method === 'GET' ? 'text/html' : 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    requireValue(response.status === 200 && (!response.url || response.url === url), 'provider_response');
    const text = await response.text();
    requireValue(text.length <= 2_000_000, 'response_too_large');
    if (method === 'GET') return sazonPolicy(text);
    try { return JSON.parse(text); } catch { throw new TablecheckSazonError('availability_schema'); }
  }
  owned(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner || this.#closed) throw new TablecheckSazonError('session_expired', 404);
    if (this.now() - s.touched >= TTL) { this.#sessions.delete(id); throw new TablecheckSazonError('session_expired', 404); }
    return s;
  }
  snapshot(s) {
    return copy({ id: s.id, restaurantId: SAZON.restaurantId, restaurant: SAZON.name,
      provider: 'TableCheck', mode: this.mode, evidenceMode: this.mode === 'fixture' ? 'local_contract_fixture' : 'provider_search_local_preparation',
      revision: ++s.revision, state: s.state, capturedAt: new Date(this.now()).toISOString(),
      expiresIn: TTL / 1000, canHold: false,
      canCart: this.mode === 'fixture' && s.review?.phase === 'cart' && !s.consumed.has('cart_init') && !s.consumed.has('cart'),
      cartOperations: ['cart_init', 'cart'],
      canSubmit: this.mode === 'fixture' && s.review?.phase === 'booking' && !s.consumed.has('booking'),
      liveAvailabilitySupported: this.mode !== 'fixture',
      availabilityEvidence: s.evidence, details: s.details, terms: s.policy,
      reviewFingerprint: s.review?.fingerprint || null, reviewToken: s.review?.token || null,
      fields: null, result: s.result || null, phase: s.review?.phase || 'preparation',
      checkoutBlocker: 'cart_init_server_prerequisite_unverified_live_dispatch_disabled',
      readiness: 'search_and_local_review', image: null });
  }
  async create(owner, restaurantId) {
    requireValue(!this.#closed, 'closed');
    requireValue(typeof owner === 'string' && owner.length > 0, 'auth');
    requireValue(restaurantId === SAZON.restaurantId, 'unsupported_restaurant');
    await this.expire();
    requireValue(!this.#pending.has(owner) && ![...this.#sessions.values()].some(s => s.owner === owner), 'session_exists');
    requireValue(this.#sessions.size + this.#pending.size < 4, 'capacity');
    this.#pending.add(owner);
    try {
      const s = { id: crypto.randomUUID(), owner, sessionRef: crypto.randomUUID(), revision: 0,
        state: 'search', touched: this.now(), busy: false, evidence: null, details: null, review: null,
        consumed: new Set(), cart: null, guest: null, result: null };
      s.policy = await this.request('GET', SAZON.url, undefined, s);
      requireValue(!this.#closed, 'closed');
      this.#sessions.set(s.id, s);
      return this.snapshot(s);
    } finally { this.#pending.delete(owner); }
  }
  async current(id, owner) {
    const s = this.owned(id, owner);
    requireValue(!s.busy, 'busy');
    return this.snapshot(s);
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    requireValue(!s.busy, 'busy');
    requireValue(action?.revision === s.revision, 'stale_view');
    // No journal write or network call is made for an unsupported mutation.
    const ordinary = ['refresh', 'search', 'select', 'review'].includes(action.type);
    requireValue(ordinary || this.mode === 'fixture' && ['cart', 'fill', 'submit'].includes(action.type), 'cart_authorization_not_integrated');
    requireValue(!s.consumed.size || !['search', 'select'].includes(action.type), 'attempt_locked');
    s.busy = true; s.touched = this.now();
    try {
      if (action.type === 'search') {
        const query = { date: action.date, party: action.party };
        const body = sazonSearchPayload(query, s.sessionRef);
        s.evidence = null; s.details = null; s.review = null; s.state = 'search';
        s.policy = await this.request('GET', SAZON.url, undefined, s);
        const raw = await this.request('POST', GRID, body, s, query);
        requireValue(this.#sessions.get(id) === s && !this.#closed, 'session_expired');
        s.evidence = sazonGrid(raw, query, s.policy, this.now());
        s.state = 'availability_observed';
      } else if (action.type === 'select') {
        requireValue(s.evidence && this.now() - s.evidence.observedAt < FRESH, 'availability_stale');
        const slot = s.evidence.slots.find(row => row.id === action.slotId);
        requireValue(slot, 'unverified_slot');
        s.details = { restaurantId: SAZON.restaurantId, date: s.evidence.date, party: 2,
          ...copy(slot), policyVersion: s.policy.version, price: null, priceStatus: 'not_provided',
          selectionSource: 'local_only_no_native_cart' };
        s.review = null; s.state = 'selected';
      } else if (action.type === 'review') {
        requireValue(s.details && s.evidence && this.now() - s.evidence.observedAt < FRESH, 'selection_stale');
        const freshPolicy = await this.request('GET', SAZON.url, undefined, s);
        if (freshPolicy.version !== s.policy.version) {
          s.details = null; s.review = null; s.evidence = null; s.state = 'search';
          throw new TablecheckSazonError('policy_changed');
        }
        const phase = s.cart ? 'booking' : 'cart';
        if (s.cart) requireValue(s.guest && this.now() < s.cart.expiresAt, 'cart_expired_or_guest_missing');
        const cartDigest = s.cart ? hash([s.cart.id, s.cart.token, s.cart.attemptId]) : null;
        s.review = { phase, cartDigest, fingerprint: hash({ owner, sessionId: id, details: s.details,
          guest: s.guest, policyVersion: s.policy.version, phase, cartDigest }), token: crypto.randomUUID() };
        s.state = 'review';
      } else if (action.type === 'fill') {
        requireValue(s.cart && this.now() < s.cart.expiresAt && !s.consumed.has('cart_update'), 'cart_expired');
        s.guest = cleanGuest(action.fields); s.review = null; s.state = 'contact';
      } else if (action.type === 'cart' || action.type === 'submit') {
        const phase = action.type === 'cart' ? 'cart' : 'booking';
        requireValue(s.review?.phase === phase && action.confirm === true
          && (phase !== 'booking' || action.terms === true)
          && action.reviewFingerprint === s.review.fingerprint && action.reviewToken === s.review.token
          && action.termsVersion === s.policy.version, 'confirmation_required');
        requireValue(this.now() - s.evidence.observedAt < FRESH, 'availability_stale');
        if (phase === 'cart') {
          // Consent covers both disclosed operations; each gets its own grant.
          // Native mount ignores init's response. A 200 here is ONLY transport
          // acknowledgment, not proof of availability, inventory hold or state.
          const initialized = await this.dispatch(s, 'cart_init', `${API}/booking/cart/init`, 'POST', sazonInitPayload(s.sessionRef));
          if (!initialized || initialized.response?.status !== 200 || initialized.response.data?.error
            || initialized.response.data?.errors?.length) return this.snapshot(s);
          s.init = { attemptId: initialized.attempt.attemptId, requestDigest: hash(sazonInitPayload(s.sessionRef)) };
          const result = await this.dispatch(s, 'cart', `${API}/booking/cart`, 'POST', sazonCartPayload(s.details, s.sessionRef));
          if (result) {
            try { s.cart = { ...cartFromOwnResponse(result.response, s.details, this.now()), attemptId: result.attempt.attemptId };
              s.state = 'contact'; s.review = null; s.result = null;
            } catch { s.state = 'result'; }
          }
        } else {
          requireValue(s.cart && this.now() < s.cart.expiresAt && s.review.cartDigest === hash([s.cart.id, s.cart.token, s.cart.attemptId]), 'cart_binding');
          const approval = { owner, sessionId: id, details: copy(s.details), guest: copy(s.guest),
            cartDigest: s.review.cartDigest, reviewFingerprint: s.review.fingerprint };
          const update = await this.dispatch(s, 'cart_update', `${API}/booking/cart/${s.cart.id}`, 'PUT',
            sazonCartPayload(s.details, s.sessionRef, s.guest));
          if (!update) return this.snapshot(s);
          try { const updated = cartFromOwnResponse(update.response, s.details, this.now(), s.cart);
            // Conservative scope, not a native invariant: native upsert accepts
            // rotated tokens. Supporting rotation needs a new private binding
            // and fresh review; this version does not silently replace one.
            requireValue(updated.token === s.cart.token, 'cart_capability_changed');
            s.cart.expiresAt = updated.expiresAt;
            s.updatedCart = { attemptId: update.attempt.attemptId,
              cartDigest: hash([s.cart.id, s.cart.token, s.cart.attemptId]),
              requestDigest: hash(sazonCartPayload(s.details, s.sessionRef, s.guest)) };
          } catch { s.state = 'result'; return this.snapshot(s); }
          const checkout = await this.dispatch(s, 'booking', `${API}/booking/checkout/${s.cart.id}`, 'PUT', sazonCheckoutPayload(s.sessionRef));
          if (!checkout) return this.snapshot(s);
          approval.reviewFingerprint = checkout.intent.reviewFingerprint;
          const data = checkout.response.data, created = data?.reservation;
          const code = created?.slug;
          if (checkout.response.status !== 200 || data.error || data.errors?.length || data.checkout_status || !opaque(code)) {
            s.state = 'result'; return this.snapshot(s);
          }
          // One same-attempt GET only. No status PUT, URL from UI, replay or recovery.
          // Native request builder (client 29478) concatenates these already
          // encoded values directly; URLSearchParams would encode them twice.
          const readUrl = `${API}/reservations/${code}?email=${encodeURIComponent(s.guest.email)}&phone=${encodeURIComponent(s.guest.phone)}`;
          try {
            this.assertActive(s);
            const receipt = await this.mutationTransport({ method: 'GET', url: readUrl, phase: 'readback', body: undefined });
            this.assertActive(s);
            const result = sazonSavedResult(receipt, { approval, attempt: checkout.attempt, checkoutCode: code,
              cartDigest: hash([s.cart.id, s.cart.token, s.cart.attemptId]) });
            // Also bind persisted ID to this same checkout, never only the slug.
            s.result = created.id && created.id === receipt.data?.reservation?.id ? result : { status: 'unknown' };
            const saved = await this.recordResult({ approval: checkout.intent, attempt: checkout.attempt, result: s.result });
            if (saved?.status !== s.result.status) s.result = { status: 'unknown', reason: 'result_not_persisted' };
          } catch { s.result = { status: 'unknown' }; }
          s.state = 'result'; s.review = null;
        }
      }
      requireValue(this.#sessions.get(id) === s && !this.#closed, 'session_expired');
      return this.snapshot(s);
    } finally { s.busy = false; }
  }
  assertActive(s) {
    requireValue(this.mode === 'fixture' && !this.#closed && this.#sessions.get(s.id) === s
      && this.now() - s.touched < TTL, 'dispatch_disabled');
  }
  async dispatch(s, phase, url, method, body) {
    this.assertActive(s);
    if (phase === 'cart') requireValue(s.init?.attemptId && s.consumed.has('cart_init')
      && s.init.requestDigest === hash(sazonInitPayload(s.sessionRef)), 'cart_init_binding');
    if (['cart_update', 'booking'].includes(phase)) requireValue(s.cart && s.cart.attemptId && s.consumed.has('cart')
      && this.now() < s.cart.expiresAt, 'cart_expired');
    if (phase === 'booking') requireValue(s.updatedCart?.attemptId && s.consumed.has('cart_update')
      && s.updatedCart.cartDigest === hash([s.cart.id, s.cart.token, s.cart.attemptId])
      && s.updatedCart.requestDigest === hash(sazonCartPayload(s.details, s.sessionRef, s.guest)), 'cart_update_binding');
    requireValue(!s.consumed.has(phase), 'already_attempted');
    // Exact phase request is constructed internally; no caller URL/payload input.
    const intent = { owner: s.owner, provider: 'TableCheck', restaurantId: SAZON.restaurantId,
      sessionId: s.id, mode: 'fixture', phase,
      reviewFingerprint: hash({ phase, body, approval: s.review.fingerprint,
        cartDigest: s.review.cartDigest, parentAttemptId: phase === 'booking' ? s.updatedCart.attemptId
          : phase === 'cart' ? s.init.attemptId : s.cart?.attemptId || null }),
      details: { date: s.details.date, time: s.details.time, party: 2 } };
    s.consumed.add(phase);
    const gate = await this.reserveSubmission(copy(intent));
    requireValue(gate?.sendAllowed === true && gate.attempt
      && ['provider', 'restaurantId', 'sessionId', 'mode', 'phase', 'reviewFingerprint'].every(key => gate.attempt[key] === intent[key])
      && ['date', 'time', 'party'].every(key => gate.attempt[key] === intent.details[key])
      && gate.attempt.attemptId && gate.attempt.idempotencyKey, 'attempt_binding');
    const attempt = copy(gate.attempt);
    this.assertActive(s);
    s.result = { status: 'unknown', phase }; s.state = 'result';
    try {
      const response = await this.mutationTransport({ url, method, body: copy(body), phase });
      this.assertActive(s);
      await this.recordResult({ approval: copy(intent), attempt: copy(attempt), result: copy(s.result) });
      return { response, intent, attempt };
    } catch {
      try {
        await this.recordResult({ approval: copy(intent), attempt: copy(attempt), result: { status: 'unknown', phase } });
      } catch { /* Durable dispatch remains consumed even if recording fails. */ }
      return null;
    }
  }
  async remove(id, owner) {
    const s = this.owned(id, owner);
    requireValue(!s.busy, 'busy'); this.#sessions.delete(id);
  }
  async expire() {
    for (const [id, s] of this.#sessions) if (!s.busy && this.now() - s.touched >= TTL) this.#sessions.delete(id);
  }
  async close() { this.#closed = true; this.#sessions.clear(); }
}
