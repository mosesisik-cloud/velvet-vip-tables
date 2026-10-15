import { getBookingCopy, requestBookingNotes } from './booking-copy.js?v=180';
import { placeBrandHTML } from './place-brand.js?v=178';
import { availabilityCopy } from './availability-copy.js?v=180';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function availabilityCities(restaurants) {
  const rows = Array.isArray(restaurants) ? restaurants.map(row => row.city || row.destination) : Object.values(restaurants?.destinations || {}).map(row => row.destination);
  return [...new Set(rows.filter(value => typeof value === 'string' && value.trim()))].sort((a,b) => a.localeCompare(b,'sv'));
}
function bookingLink(row, slot, query) {
  const selection = new URLSearchParams({date:query.get('date') || '',time:slot.time || '',party:query.get('party') || ''});
  try { const u = new URL(slot.bookingUrl); if (u.protocol === 'https:' && !u.username && !u.password) {
    if (row.provider === 'SevenRooms' && ['www.sevenrooms.com','sevenrooms.com','eu.sevenrooms.com'].includes(u.hostname)) {
      return `#/restaurant/${encodeURIComponent(row.restaurantId)}?${selection}`;
    }
    return u.href;
  } } catch {}
  return `#/restaurant/${encodeURIComponent(row.restaurantId || '')}?${selection}`;
}
const SEARCH_CACHE_KEY = 'velvet_availability_v1';
const SEARCH_MAX_AGE = 5 * 60 * 1000;
export function availabilityState(restaurants, params = new URLSearchParams(), initialCity = '', today = localDate()) {
  const cities = availabilityCities(restaurants);
  const requested = params.get('city') ?? initialCity;
  const codeCity = restaurants?.destinations?.[requested]?.destination;
  const city = cities.find(city => city.toLocaleLowerCase() === String(codeCity || requested).toLocaleLowerCase()) || '';
  const requestedDate = params.get('date') || today;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= today && !Number.isNaN(Date.parse(requestedDate)) && new Date(requestedDate).toISOString().slice(0, 10) === requestedDate ? requestedDate : today;
  const requestedTime = params.get('time') || '19:00';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(requestedTime) ? requestedTime : '19:00';
  const party = /^[1-9]$|^1[0-2]$/.test(params.get('party') || '') ? params.get('party') : '2';
  return { city, date, time, party };
}
export function availabilityCacheMatches(saved, query, now = Date.now()) {
  return !!saved && saved.query === query && Number.isFinite(saved.savedAt) && now >= saved.savedAt && now - saved.savedAt < SEARCH_MAX_AGE && Array.isArray(saved.data?.results);
}
// Result-level unknown flags apply to the whole result; a slot-level unknown
// must remain visible even when another option has a known card requirement.
export function availabilityTermsNotes(row, tr) {
  const options = [row, ...(Array.isArray(row.slots) ? row.slots.filter(Boolean) : [])];
  const notes = [];
  if (options.some(option => option.requiresPrepayment || option.paymentRequirement === 'prepayment')) notes.push(tr('prepaymentNote'));
  else if (options.some(option => option.requiresCard || option.paymentRequirement === 'card')) notes.push(tr('cardNote'));
  if (options.some(option => option.paymentRequirement === 'mixed')) notes.push(tr('mixedNote'));
  const unknownPayment = options.some(option => option.paymentRequirement === 'not_specified');
  const unknownCancellation = options.some(option => option.cancellationPolicyStatus === 'unknown');
  if (unknownPayment) notes.push(tr('paymentUnknownNote'));
  if (unknownCancellation) notes.push(tr('cancellationUnknownNote'));
  if (unknownPayment || unknownCancellation) notes.push(tr('finalTermsNote'));
  return notes;
}
/** Mounts guest search. Call destroy before replacing its route to cancel requests. */
export function mountAvailabilitySearch(container, { restaurants, apiBase = '', initialCity = '', lang } = {}) {
  const { language, locale, text: tr } = availabilityCopy(lang);
  const cities = availabilityCities(restaurants);
  cities.sort((a, b) => a.localeCompare(b, language));
  const routeParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const initial = availabilityState(restaurants, routeParams, initialCity);
  let controller, revision = 0, destroyed = false;
  container.innerHTML = `<section class="availability-search" aria-labelledby="availability-heading">
    <header class="availability-intro"><span class="availability-eyebrow">${escapeHTML(tr('eyebrow'))}</span><h1 id="availability-heading">${escapeHTML(tr('title'))}</h1><p>${escapeHTML(tr('intro'))}</p></header>
    <form class="availability-form">
      <label>${escapeHTML(tr('city'))}<select name="city" required aria-label="${escapeHTML(tr('city'))}"><option value="">${escapeHTML(tr('chooseCity'))}</option>${cities.map(city=>`<option value="${escapeHTML(city)}" ${city===initial.city?'selected':''}>${escapeHTML(city)}</option>`).join('')}</select></label>
      <label>${escapeHTML(tr('date'))}<input type="date" name="date" aria-label="${escapeHTML(tr('date'))}" required min="${localDate()}" value="${initial.date}"></label>
      <label>${escapeHTML(tr('time'))}<input type="time" name="time" aria-label="${escapeHTML(tr('time'))}" required value="${initial.time}" step="900"></label>
      <label>${escapeHTML(tr('guests'))}<select name="party" aria-label="${escapeHTML(tr('guests'))}">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${String(i+1)===initial.party?'selected':''}>${i+1} ${escapeHTML(tr(i===0?'guest':'guestPlural'))}</option>`).join('')}</select></label>
      <button type="submit" class="availability-submit" aria-label="${escapeHTML(tr('search'))}">${escapeHTML(tr('search'))} <span aria-hidden="true">→</span></button>
    </form>
    <p class="availability-note">${escapeHTML(tr('note'))}</p>
    <div class="availability-status" role="status" aria-live="polite">${escapeHTML(tr(initial.city ? 'selectedInitial' : 'initial', {city:initial.city}))}</div>
    <div class="availability-results" aria-busy="false"></div>
    <p class="availability-disclaimer">${escapeHTML(tr('disclaimer'))}</p>
  </section>`;
  const form = container.querySelector('form');
  const status = container.querySelector('.availability-status');
  const results = container.querySelector('.availability-results');
  const button = container.querySelector('[type=submit]');
  const setButtonBusy = busy => {
    button.setAttribute('aria-label', tr('search'));
    button.setAttribute('aria-busy', String(busy));
    button.innerHTML = `${escapeHTML(tr(busy ? 'searching' : 'search'))} <span aria-hidden="true">→</span>`;
  };
  const readQuery = () => new URLSearchParams(new FormData(form));
  const syncQuery = query => history.replaceState(history.state, '', '#/availability?' + query.toString());
  const cache = (query, data) => {
    try { sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({query: query.toString(), data, savedAt: Date.now()})); } catch {}
  };
  function reconcile(markup) {
    const template = document.createElement('template'); template.innerHTML = markup;
    const existing = new Map([...results.children].map(node => [node.dataset.resultKey || node.className, node]));
    let previous = null;
    for (const fresh of [...template.content.children]) {
      const key = fresh.dataset.resultKey || fresh.className;
      const old = existing.get(key);
      const node = old && old.outerHTML === fresh.outerHTML ? old : fresh;
      if (old && old !== node && old.tagName === 'DETAILS') node.open = old.open;
      const expected = previous ? previous.nextElementSibling : results.firstElementChild;
      if (node !== expected) results.insertBefore(node, expected);
      if (old && old !== node) old.remove();
      existing.delete(key); previous = node;
    }
    for (const node of existing.values()) node.remove();
  }
  function waitForPoll(signal) {
    return new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted','AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve(); },1500);
      if (signal.aborted) abort(); else signal.addEventListener('abort',abort,{once:true});
    });
  }
  function invalidate() {
    syncQuery(readQuery());
    revision++; controller?.abort(); controller = null;
    results.replaceChildren(); results.setAttribute('aria-busy','false');
    setButtonBusy(false);
    status.textContent = tr('edited');
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  function renderResults(data, query) {
    const complete = data.complete !== false;
    const rows = data.results.filter(row => row && typeof row.restaurantId === 'string');
    const validSlot = slot => slot && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time);
    const available = rows.filter(row => row.bookingMode !== 'request_only' && row.status === 'available' && Array.isArray(row.slots) && row.slots.some(validSlot));
    const rest = rows.filter(row => !available.includes(row));
    const pending = rows.filter(row => row.status === 'pending').length;
    const checked = new Date(data.checkedAt || NaN);
    const updated = Number.isNaN(checked.getTime()) ? '' : ' · ' + tr('checked', {time:checked.toLocaleTimeString(locale, {hour:'2-digit',minute:'2-digit'})});
    const availableText = tr(available.length === 1 ? 'availableOne' : 'availableMany', {count:available.length});
    status.textContent = !complete
      ? (available.length ? availableText + ' · ' : '') + tr('searchingMore') + (pending ? ' · ' + tr('remaining', {count:pending}) : '…')
      : !rows.some(row => row.bookingMode !== 'request_only' && ['available','unavailable'].includes(row.status)) ? tr(rows.some(row => row.status === 'request_only' || row.bookingMode === 'request_only') ? 'requestResults' : 'noCheck')
      : available.length ? availableText + updated : tr('none', {updated});
    const cards = available.map(row => {
      const name = row.restaurant || row.name || tr('restaurant');
      const slots = row.slots.filter(validSlot).map(slot => `<a href="${escapeHTML(bookingLink(row,slot,query))}" class="availability-slot" aria-label="${escapeHTML(tr('bookAt', {name,time:slot.time}))}">${escapeHTML(slot.time)}<span aria-hidden="true"> ↗</span></a>`).join('');
      return `<article class="availability-card" data-result-key="${escapeHTML(row.restaurantId)}"><div class="availability-card-head"><div><p class="availability-city">${escapeHTML(row.city || query.get('city'))}</p><h2><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${placeBrandHTML({placeId:row.restaurantId,name})}</a></h2><p class="availability-provider">${escapeHTML(tr('via', {provider:row.provider || tr('bookingSystem')}))}</p></div><span class="availability-badge">${escapeHTML(tr('available'))}</span></div><div class="availability-slots" aria-label="${escapeHTML(tr('slotsFor', {name}))}">${slots}</div><p class="availability-card-note">${row.partial ? escapeHTML(tr('partialNote')) + ' ' : ''}${availabilityTermsNotes(row, tr).map(escapeHTML).join(' ')} ${escapeHTML(tr('continueNote'))}</p></article>`;
    }).join('');
    const labels = {pending:tr('pending'),unsupported:tr('unsupported'),error:tr('error'),unavailable:tr('unavailable')};
    const markup = cards + (rest.length ? `<details class="availability-other" ${available.length ? '' : 'open'}><summary>${escapeHTML(tr('other', {count:rest.length}))}</summary><ul>${rest.map(row => `<li><div><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.restaurant || row.name || tr('restaurant'))}</a><p>${escapeHTML(row.status === 'request_only' || row.bookingMode === 'request_only' ? getBookingCopy(language).requestHeading + '. ' + requestBookingNotes(row, language).join(' ') : labels[row.status] || tr('unconfirmed'))}</p></div><a class="availability-detail" href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.status === 'request_only' || row.bookingMode === 'request_only' ? getBookingCopy(language).requestOpen : tr('show'))} <span aria-hidden="true">→</span></a></li>`).join('')}</ul></details>` : '');
    reconcile(rows.length ? markup : complete ? `<p class="availability-empty">${escapeHTML(tr('empty'))}</p>` : '');
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const query = readQuery();
    syncQuery(query);
    return runSearch(query);
  }
  async function runSearch(query, resumeId = "") {
    controller?.abort(); controller = new AbortController();
    const current = ++revision;
    const requestController = controller;
    let timedOut = false, receivedPartial = Boolean(resumeId);
    const deadline = setTimeout(() => { timedOut = true; requestController.abort(); },180000);
    if (!resumeId) results.replaceChildren();
    results.setAttribute('aria-busy','true');
    status.textContent = tr('searchingCity', {city:query.get('city')});
    setButtonBusy(true);
    try {
      const initialQuery = new URLSearchParams(query); initialQuery.set('progressive','1');
      let endpoint = resumeId ? (apiBase.endsWith("/") ? apiBase.slice(0,-1) : apiBase) + "/availability/jobs/" + encodeURIComponent(resumeId) : `${apiBase.replace(/\/$/,'')}/availability?${initialQuery}`;
      while (true) {
      const response = await fetch(endpoint, {signal:requestController.signal,cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw new Error('search_failed');
      const data = await response.json();
      if (destroyed || current !== revision) return;
      if (!Array.isArray(data.results)) throw new Error('invalid_response');
      const complete = data.complete !== false;
      receivedPartial = true;
      renderResults(data, query);
      cache(query, data);
      if (complete) break;
      if (typeof data.searchId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.searchId)) throw new Error('invalid_search_id');
      endpoint = `${apiBase.replace(/\/$/,'')}/availability/jobs/${encodeURIComponent(data.searchId)}`;
      await waitForPoll(requestController.signal);
      if (destroyed || current !== revision) return;
      }
    } catch(error) {
      if (destroyed || current!==revision || (error.name==='AbortError' && !timedOut)) return;
      status.textContent = tr(timedOut ? 'timeout' : receivedPartial ? 'interrupted' : 'failure');
    } finally {
      clearTimeout(deadline);
      if (!destroyed && current===revision) { results.setAttribute('aria-busy','false'); setButtonBusy(false); }
    }
  }
  form.addEventListener('submit', submit);
  try {
    const query = readQuery();
    const saved = JSON.parse(sessionStorage.getItem(SEARCH_CACHE_KEY));
    if (availabilityCacheMatches(saved, query.toString())) {
      renderResults(saved.data, query);
      if (saved.data.complete === false && typeof saved.data.searchId === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(saved.data.searchId)) {
        runSearch(query, saved.data.searchId);
      }
    }
  } catch {}

  return { destroy() { destroyed=true; revision++; controller?.abort(); form.removeEventListener('submit',submit); form.removeEventListener('change',invalidate); form.removeEventListener('input',invalidate); } };
}
