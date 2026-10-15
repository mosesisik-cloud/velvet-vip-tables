const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function availabilityCities(restaurants) {
  const rows = Array.isArray(restaurants) ? restaurants.map(row => row.city || row.destination) : Object.values(restaurants?.destinations || {}).map(row => row.destination);
  return [...new Set(rows.filter(value => typeof value === 'string' && value.trim()))].sort((a,b) => a.localeCompare(b,'sv'));
}
function bookingLink(row, slot, query) {
  try { const u = new URL(slot.bookingUrl); if (u.protocol === 'https:' && !u.username && !u.password) {
    if (row.provider === 'SevenRooms' && ['www.sevenrooms.com','sevenrooms.com','eu.sevenrooms.com'].includes(u.hostname)) {
      const selection=new URLSearchParams({date:query.get('date'),time:slot.time,party:query.get('party')});
      return `#/restaurant/${encodeURIComponent(row.restaurantId)}?${selection}`;
    }
    return u.href;
  } } catch {}
  return `#/restaurant/${encodeURIComponent(row.restaurantId || '')}`;
}
/** Mounts guest search. Call destroy before replacing its route to cancel requests. */
export function mountAvailabilitySearch(container, { restaurants, apiBase = '', initialCity = '' } = {}) {
  const cities = availabilityCities(restaurants);
  let controller, revision = 0, destroyed = false;
  container.innerHTML = `<section class="availability-search" aria-labelledby="availability-heading">
    <header class="availability-intro"><span class="availability-eyebrow">ETT BORD ATT LÄNGTA TILL</span><h1 id="availability-heading">Var vill du äta?</h1><p>Hitta lediga bord för din kväll. Välj destination, dag och sällskap.</p></header>
    <form class="availability-form">
      <label>Destination<select name="city" required aria-label="Destination"><option value="">Välj destination</option>${cities.map(city=>`<option value="${escapeHTML(city)}" ${city===initialCity?'selected':''}>${escapeHTML(city)}</option>`).join('')}</select></label>
      <label>Datum<input type="date" name="date" aria-label="Datum" required min="${localDate()}" value="${localDate()}"></label>
      <label>Tid<input type="time" name="time" aria-label="Tid" required value="19:00" step="900"></label>
      <label>Gäster<select name="party" aria-label="Gäster">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1} ${i===0?'gäst':'gäster'}</option>`).join('')}</select></label>
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
    revision++; controller?.abort(); controller = null;
    results.replaceChildren(); results.setAttribute('aria-busy','false');
    button.textContent = 'Sök lediga bord →';
    status.textContent = 'Sök för att visa tider för ditt nya val.';
  }
  form.addEventListener('change', invalidate);
  async function submit(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    controller?.abort(); controller = new AbortController();
    const current = ++revision;
    const requestController = controller;
    let timedOut = false, receivedPartial = false;
    const deadline = setTimeout(() => { timedOut = true; requestController.abort(); },180000);
    const query = new URLSearchParams(new FormData(form));
    results.replaceChildren(); results.setAttribute('aria-busy','true');
    status.textContent = `Söker lediga bord i ${query.get('city')}…`;
    button.textContent = 'Söker…';
    try {
      const initialQuery = new URLSearchParams(query); initialQuery.set('progressive','1');
      let endpoint = `${apiBase.replace(/\/$/,'')}/availability?${initialQuery}`;
      while (true) {
      const response = await fetch(endpoint, {signal:requestController.signal,cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw new Error('search_failed');
      const data = await response.json();
      if (destroyed || current !== revision) return;
      if (!Array.isArray(data.results)) throw new Error('invalid_response');
      const complete = data.complete !== false;
      receivedPartial = true;
      const rows = data.results.filter(row=>row && typeof row.restaurantId==='string');
      const available = rows.filter(row=>row.status==='available' && Array.isArray(row.slots) && row.slots.some(slot=>/^\d{2}:\d{2}$/.test(slot.time)));
      const rest = rows.filter(row=>!available.includes(row));
      const pending = rows.filter(row => row.status === 'pending').length;
      const checked = new Date(data.checkedAt || NaN);
      const updated = Number.isNaN(checked.getTime()) ? '' : ` · Kontrollerat ${checked.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})}`;
      status.textContent = !complete ? `${available.length ? available.length + ' restauranger har lediga tider · ' : ''}Söker vidare${pending ? ' · ' + pending + ' restauranger återstår' : '…'}` : !rows.some(row=>['available','unavailable'].includes(row.status)) ? 'Vi kunde inte kontrollera lediga tider här ännu. Öppna restaurangens bokning nedan.' : available.length ? `${available.length} ${available.length===1?'restaurang har':'restauranger har'} lediga tider${updated}` : `Inga lediga tider hittades i de system vi kunde kontrollera${updated}. Prova en annan tid eller dag.`;
      const cards = available.map(row=>`<article class="availability-card" data-result-key="${escapeHTML(row.restaurantId)}"><div class="availability-card-head"><div><p class="availability-city">${escapeHTML(row.city || query.get('city'))}</p><h2><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.restaurant || row.name || 'Restaurang')}</a></h2><p class="availability-provider">Via ${escapeHTML(row.provider || 'restaurangens bokningssystem')}</p></div><span class="availability-badge">Lediga tider</span></div><div class="availability-slots" aria-label="Lediga tider för ${escapeHTML(row.restaurant || row.name)}">${row.slots.filter(slot=>/^\d{2}:\d{2}$/.test(slot.time)).map(slot=>`<a href="${escapeHTML(bookingLink(row,slot,query))}" class="availability-slot" aria-label="Fortsätt boka ${escapeHTML(row.restaurant || row.name)} klockan ${escapeHTML(slot.time)}">${escapeHTML(slot.time)}<span aria-hidden="true"> ↗</span></a>`).join('')}</div><p class="availability-card-note">${row.partial ? 'Visar hittade tider från en del av restaurangens alternativ. ' : ''}Fortsätt till bokningen för att välja bord och se villkor.</p></article>`).join('');
      const labels = {pending:'Kontrollerar lediga tider…',unsupported:'Kan inte kontrolleras här ännu',error:'Kunde inte hämta tider',unavailable:'Inga lediga tider i sökningen'};
      const markup = cards + (rest.length ? `<details class="availability-other" ${available.length?'':'open'}><summary>Övriga restauranger (${rest.length})</summary><ul>${rest.map(row=>`<li><div><a href="#/restaurant/${encodeURIComponent(row.restaurantId)}">${escapeHTML(row.restaurant || row.name || 'Restaurang')}</a><p>${labels[row.status] || 'Tillgänglighet kunde inte bekräftas'}</p></div><a class="availability-detail" href="#/restaurant/${encodeURIComponent(row.restaurantId)}">Visa restaurang <span aria-hidden="true">→</span></a></li>`).join('')}</ul></details>` : '');
      reconcile(rows.length ? markup : complete ? '<p class="availability-empty">Vi har ännu inga sökbara restauranger här. Du kan fortfarande utforska destinationens restauranger i Velvet.</p>' : '');
      if (complete) break;
      if (typeof data.searchId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.searchId)) throw new Error('invalid_search_id');
      endpoint = `${apiBase.replace(/\/$/,'')}/availability/jobs/${encodeURIComponent(data.searchId)}`;
      await waitForPoll(requestController.signal);
      if (destroyed || current !== revision) return;
      }
    } catch(error) {
      if (destroyed || current!==revision || (error.name==='AbortError' && !timedOut)) return;
      status.textContent = timedOut ? 'Sökningen tog för lång tid. Resultaten som redan hittats visas här; återstående restauranger är inte kontrollerade. Sök igen för nya uppgifter.' : receivedPartial ? 'Sökningen avbröts. Resultaten som redan hittats visas här; återstående restauranger kunde inte kontrolleras. Försök igen.' : 'Det gick inte att hämta lediga tider just nu. Försök igen.';
    } finally {
      clearTimeout(deadline);
      if (!destroyed && current===revision) { results.setAttribute('aria-busy','false'); button.textContent='Sök lediga bord →'; }
    }
  }
  form.addEventListener('submit', submit);
  return { destroy() { destroyed=true; revision++; controller?.abort(); form.removeEventListener('submit',submit); form.removeEventListener('change',invalidate); } };
}
