const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function availabilityCities(restaurants) {
  const rows = Array.isArray(restaurants) ? restaurants.map(row => row.city || row.destination) : Object.values(restaurants?.destinations || {}).map(row => row.destination);
  return [...new Set(rows.filter(value => typeof value === 'string' && value.trim()))].sort((a,b) => a.localeCompare(b,'sv'));
}
function bookingLink(row, slot) {
  try { const u = new URL(slot.bookingUrl); if (u.protocol === 'https:' && !u.username && !u.password) return u.href; } catch {}
  return `#/restaurant/${encodeURIComponent(row.restaurantId || '')}`;
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
/** Mounts guest search. Call destroy before replacing its route to cancel requests. */
export function mountAvailabilitySearch(container, { restaurants, apiBase = '', initialCity = '' } = {}) {
  const cities = availabilityCities(restaurants);
  const routeParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const initial = availabilityState(restaurants, routeParams, initialCity);
  let controller, revision = 0, destroyed = false;
  container.innerHTML = `<section class="availability-search" aria-labelledby="availability-heading">
    <header class="availability-intro"><span class="availability-eyebrow">ETT BORD ATT LÄNGTA TILL</span><h1 id="availability-heading">Var vill du äta?</h1><p>Hitta lediga bord för din kväll. Välj destination, dag och sällskap.</p></header>
    <form class="availability-form">
      <label>Destination<select name="city" required aria-label="Destination"><option value="">Välj destination</option>${cities.map(city=>`<option value="${escapeHTML(city)}" ${city===initial.city?'selected':''}>${escapeHTML(city)}</option>`).join('')}</select></label>
      <label>Datum<input type="date" name="date" aria-label="Datum" required min="${localDate()}" value="${initial.date}"></label>
      <label>Tid<input type="time" name="time" aria-label="Tid" required value="${initial.time}" step="900"></label>
      <label>Gäster<select name="party" aria-label="Gäster">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${String(i+1)===initial.party?'selected':''}>${i+1} ${i===0?'gäst':'gäster'}</option>`).join('')}</select></label>
      <button type="submit" class="availability-submit">Sök lediga bord <span aria-hidden="true">→</span></button>
    </form>
    <p class="availability-note">Visar tider inom 90 minuter från ditt val, i restaurangens lokala tid. Du behöver inget Velvet-konto.</p>
    <div class="availability-status" role="status" aria-live="polite">Välj en destination för att hitta lediga bord.</div>
    <div class="availability-results" aria-busy="false"></div>
    <p class="availability-disclaimer">Tillgängligheten kan ändras. Bordet är bokat först när restaurangens bokningssystem bekräftar din reservation.</p>
  </section>`;
  const form = container.querySelector('form');
  const status = container.querySelector('.availability-status');
  const results = container.querySelector('.availability-results');
  const button = container.querySelector('[type=submit]');
  const readQuery = () => new URLSearchParams(new FormData(form));
  const syncQuery = query => history.replaceState(history.state, '', '#/availability?' + query.toString());
  const cache = (query, data) => {
    try { sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({query: query.toString(), data, savedAt: Date.now()})); } catch {}
  };
  function invalidate() {
    syncQuery(readQuery());
    revision++; controller?.abort(); controller = null;
    results.replaceChildren(); results.setAttribute('aria-busy','false');
    button.textContent = 'Sök lediga bord →';
    status.textContent = 'Sök för att visa tider för ditt nya val.';
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  function renderResults(data, query) {
      const rows = data.results.filter(row=>row && typeof row.restaurantId==='string');
      const available = rows.filter(row=>row.status==='available' && Array.isArray(row.slots) && row.slots.some(slot=>/^\d{2}:\d{2}$/.test(slot.time)));
      const rest = rows.filter(row=>!available.includes(row));
      const checked = new Date(data.checkedAt);
      const updated = Number.isNaN(checked.getTime()) ? '' : ` · Kontrollerat ${checked.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})}`;
      status.textContent = !rows.some(row=>['available','unavailable'].includes(row.status)) ? 'Vi kunde inte kontrollera lediga tider här ännu. Öppna restaurangens bokning nedan.' : available.length ? `${available.length} ${available.length===1?'restaurang har':'restauranger har'} lediga tider${updated}` : `Inga lediga tider hittades i de system vi kunde kontrollera${updated}. Prova en annan tid eller dag.`;
      const cards = available.map(row=>`<article class="availability-card"><div class="availability-card-head"><div><p class="availability-city">${escapeHTML(row.city || query.get('city'))}</p><h2><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.restaurant || row.name || 'Restaurang')}</a></h2><p class="availability-provider">Via ${escapeHTML(row.provider || 'restaurangens bokningssystem')}</p></div><span class="availability-badge">Lediga tider</span></div><div class="availability-slots" aria-label="Lediga tider för ${escapeHTML(row.restaurant || row.name)}">${row.slots.filter(slot=>/^\d{2}:\d{2}$/.test(slot.time)).map(slot=>`<a href="${escapeHTML(bookingLink(row,slot))}" class="availability-slot" aria-label="Fortsätt boka ${escapeHTML(row.restaurant || row.name)} klockan ${escapeHTML(slot.time)}">${escapeHTML(slot.time)}<span aria-hidden="true"> ↗</span></a>`).join('')}</div><p class="availability-card-note">Fortsätt till bokningen för att välja bord och se villkor.</p></article>`).join('');
      const labels = {unsupported:'Kan inte kontrolleras här ännu',error:'Kunde inte hämta tider',unavailable:'Inga lediga tider i sökningen'};
      results.innerHTML = cards + (rest.length ? `<details class="availability-other" ${available.length?'':'open'}><summary>Övriga restauranger (${rest.length})</summary><ul>${rest.map(row=>`<li><div><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.restaurant || row.name || 'Restaurang')}</a><p>${labels[row.status] || 'Tillgänglighet kunde inte bekräftas'}</p></div><a class="availability-detail" href="#/restaurant/${encodeURIComponent(row.restaurantId)}">Visa restaurang <span aria-hidden="true">→</span></a></li>`).join('')}</ul></details>` : '');
      if (!rows.length) results.innerHTML = '<p class="availability-empty">Vi har ännu inga sökbara restauranger här. Du kan fortfarande utforska destinationens restauranger i Velvet.</p>';
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    controller?.abort(); controller = new AbortController();
    const current = ++revision;
    const query = readQuery();
    syncQuery(query);
    results.replaceChildren(); results.setAttribute('aria-busy','true');
    status.textContent = `Söker lediga bord i ${query.get('city')}…`;
    button.textContent = 'Söker…';
    try {
      const response = await fetch(`${apiBase.replace(/\/$/,'')}/availability?${query}`, {signal:controller.signal,cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw new Error('search_failed');
      const data = await response.json();
      if (destroyed || current !== revision) return;
      if (!Array.isArray(data.results)) throw new Error('invalid_response');
      renderResults(data, query);
      cache(query, data);
    } catch(error) {
      if (destroyed || current!==revision || error.name==='AbortError') return;
      status.textContent = 'Det gick inte att hämta lediga tider just nu. Försök igen.';
    } finally {
      if (!destroyed && current===revision) { results.setAttribute('aria-busy','false'); button.textContent='Sök lediga bord →'; }
    }
  }
  form.addEventListener('submit', submit);
  try {
    const query = readQuery();
    const saved = JSON.parse(sessionStorage.getItem(SEARCH_CACHE_KEY));
    if (availabilityCacheMatches(saved, query.toString())) renderResults(saved.data, query);
  } catch {}

  return { destroy() { destroyed=true; revision++; controller?.abort(); form.removeEventListener('submit',submit); form.removeEventListener('change',invalidate); form.removeEventListener('input',invalidate); } };
}
