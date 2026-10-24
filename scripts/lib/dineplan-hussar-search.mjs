import { parseDineplanTimeOptions } from './dineplan-time-options.mjs';
const base = 'https://account.dineplan.com/widget/v3/';

// Qualification-only transport: one exact venue, two guests, no slot selection.
// No shared registry activation, credentials persisted, or confirmation claims.
export async function searchHussar({date, partySize = 2, signal, fetchImpl = fetch}) {
  if (partySize !== 2 || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) {
    throw new TypeError('Invalid qualified query');
  }
  const activeSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000);
  const jar = new Map();
  async function request(path, data) {
    activeSignal.throwIfAborted();
    const allowed = ['frame/1nWHwN9S', 'ajax_covers', 'ajax_times'];
    if (!allowed.includes(path)) throw new Error('Unqualified endpoint');
    const headers = {};
    if (jar.size) headers.Cookie = [...jar].map(([k,v]) => `${k}=${v}`).join('; ');
    if (data) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const r = await fetchImpl(base + path, {method:data ? 'POST':'GET', headers,
      body:data ? new URLSearchParams(data):undefined, redirect:'error', signal:activeSignal});
    if (r.status !== 200 || r.redirected || (r.url && r.url !== base + path)) throw new Error('Unexpected supplier response');
    for (const cookie of r.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]; const split = pair.indexOf('=');
      if (split > 0) jar.set(pair.slice(0,split),pair.slice(split+1));
    }
    return r;
  }
  try {
    const html = await (await request('frame/1nWHwN9S')).text();
    const rid = html.match(/id="restaurant_id"[^>]*value="(\d+)"/)?.[1];
    const reference = html.match(/id="booking_reference"[^>]*value="([^"]*)"/)?.[1];
    const csrf = html.match(/const csrf_hash\s*=\s*"([^"]*)"/)?.[1];
    if (!html.includes('The Hussar Grill Rondebosch') || rid !== '1068' || reference !== '' || csrf === undefined) throw new Error('Unverified supplier identity or session');
    const fields = {date,restaurant_id:rid,csrf_token_name:csrf};
    const covers = await (await request('ajax_covers',fields)).json();
    if (!covers || typeof covers !== 'object' || Array.isArray(covers) || !Object.hasOwn(covers,'2') || covers['2']?.closed !== false) {
      return {status:'unknown',reason:'party_not_qualified',options:[]};
    }
    const payload = await (await request('ajax_times',{...fields,covers:'2',booking_reference:''})).json();
    activeSignal.throwIfAborted();
    return {...parseDineplanTimeOptions(payload),restaurantId:'osm-CPT-the-hussar-grill',date,partySize:2};
  } catch {
    return {status:'unknown',reason:activeSignal.aborted ? 'aborted_or_timeout':'supplier_error',options:[]};
  } finally {
    jar.clear();
  }
}
