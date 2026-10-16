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
  // Version all current source policy, rather than pretending null menu price means free.
  const policy = { shop, page, menu };
  return { version: hash(policy), source: SAZON.url, shopId: shop.id,
    menu: { id: menu.id, name: menu.nameTranslations, description: menu.descriptionTranslations,
      count: 2, price: null, priceStatus: 'not_provided', currency: shop.currency },
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
    orders: [{ is_group_order: false, qty: 2, menu_item_id: SAZON.menuId }],
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
      menuId: SAZON.menuId, count: 2 };
    slot.id = hash({ query, policyVersion: policy.version, ...slot });
    if (!slots.some(other => other.id === slot.id)) slots.push(slot);
  }
  return { ...base, status: slots.length ? 'available' : 'no_availability', slots };
}

// Existing PlaywrightRuntime create/action/current/remove lifecycle; no second
// booking engine. This preparation adapter never creates/restores a native cart.
export class TablecheckSazon {
  #sessions = new Map();
  #pending = new Set();
  #closed = false;
  constructor({ fetchImpl = fetch, now = Date.now } = {}) { this.fetch = fetchImpl; this.now = now; }
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
      provider: 'TableCheck', mode: 'prepare', evidenceMode: 'provider_search_local_preparation',
      revision: ++s.revision, state: s.state, capturedAt: new Date(this.now()).toISOString(),
      expiresIn: TTL / 1000, canHold: false, canSubmit: false, liveAvailabilitySupported: true,
      availabilityEvidence: s.evidence, details: s.details, terms: s.policy,
      reviewFingerprint: s.review?.fingerprint || null, reviewToken: s.review?.token || null,
      fields: null, result: null, phase: 'preparation',
      checkoutBlocker: 'native_slot_creates_cart_authorization_not_integrated',
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
        state: 'search', touched: this.now(), busy: false, evidence: null, details: null, review: null };
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
    requireValue(['refresh', 'search', 'select', 'review'].includes(action.type), 'cart_authorization_not_integrated');
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
        s.review = { fingerprint: hash({ owner, sessionId: id, details: s.details,
          policyVersion: s.policy.version, phase: 'preparation' }), token: crypto.randomUUID() };
        s.state = 'review';
      }
      requireValue(this.#sessions.get(id) === s && !this.#closed, 'session_expired');
      return this.snapshot(s);
    } finally { s.busy = false; }
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
