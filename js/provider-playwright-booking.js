// Native provider pixels. The authenticated server owns sessions and all write gates.
export function mountProviderPlaywrightBooking(container, api, {
  provider, restaurantId, restaurantName = '', endpoint = '/restaurant-bookings/playwright',
  onDismiss = null, storage = window.sessionStorage, requestTimeoutMs = 30000,
} = {}) {
  if (!provider || !restaurantId || !endpoint.startsWith('/')) throw new Error('booking_config');
  const isZenchef = provider.toLowerCase() === 'zenchef';
  const lunchShift = restaurantId === 'curated-PAR-bofinger' ? 19170 : restaurantId === 'curated-PAR-la-coupole' ? 20148 : restaurantId === 'curated-PAR-terminus-nord' ? 19380 : restaurantId === 'curated-PAR-le-procope' ? 18190 : restaurantId === 'curated-PAR-la-lorraine' ? 16674 : restaurantId === 'curated-PAR-au-pied-de-cochon' ? 29 : null;
  const key = `velvet:provider:${encodeURIComponent(provider)}:${encodeURIComponent(restaurantId)}`;
  const aliases = { firstname:'Förnamn', firstName:'Förnamn', lastname:'Efternamn', lastName:'Efternamn', email:'E-post', emailAddress:'E-post', phone:'Telefon', phoneNumber:'Telefon', comment:'Önskemål' };
  if (isZenchef) { aliases.civility = 'Tilltal'; aliases.country = 'Telefonens land'; }
  let state = null, busy = false, disposed = false, uncertain = false, marker = null, storageOK = true;
  try {
    const value = storage.getItem(key);
    if (value) {
      marker = JSON.parse(value);
      if (!marker || typeof marker.id !== 'string' || !['open','hold_pending','hold_done','submit_pending','review_required'].includes(marker.phase)) throw new Error('saved_state');
      uncertain = marker.phase === 'hold_pending' || marker.phase === 'submit_pending';
    }
  } catch { storageOK = false; uncertain = true; }
  const drafts = new Map();
  container.style.maxWidth = '560px'; container.style.marginInline = 'auto';
  container.innerHTML = `<section aria-label="Boka hos restaurangen" style="display:flex;flex-direction:column;max-height:calc(100dvh - 32px)">
    <header style="display:flex;justify-content:space-between;gap:12px"><strong data-title></strong><button type="button" data-dismiss>Stäng vyn</button></header>
    <p role="status" aria-live="polite" data-status></p>
    <div style="overflow:auto;min-height:0"><button type="button" data-start>Hitta ett bord</button>
      <div data-screen hidden><div style="max-height:55dvh;overflow:auto"><img data-image alt="Restaurangens aktuella bokningsformulär" style="display:block;width:100%"></div>
        <div data-navigation><button type="button" data-up>↑ Upp</button><button type="button" data-down>↓ Ned</button></div>
        <form data-search hidden><label>Datum <input type="date" name="date" required></label><label>Antal gäster <input type="number" name="party" min="1" max="20" value="2" required></label><button>Sök tider</button></form>
        <div data-slots></div><div data-offers hidden></div>
        <div data-fields></div><button type="button" data-save hidden>Spara kontaktuppgifter</button><button type="button" data-review hidden>Kontrollera bokningen</button>
        <div data-hold hidden><p data-hold-details></p><label><input type="checkbox" data-hold-consent> Jag godkänner denna tillfälliga reservation.</label><button type="button" data-hold-button>Reservera tillfälligt</button></div>
        <div data-final hidden><p data-final-details></p><div data-final-offer hidden></div><p data-seating-notice hidden></p><p data-terms-text></p><label><input type="checkbox" data-terms> Jag har kontrollerat uppgifterna och godkänner bokningsvillkoren ovan.</label><button type="button" data-submit>Slutför bokningen</button></div>
        <details><summary>Visa leverantörens formulär som text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details>
      </div>
    </div><footer style="flex:none"><button type="button" data-refresh>Kontrollera status</button><button type="button" data-end>Avsluta formuläret</button><small>Att stänga vyn avbokar inte en reservation.</small></footer>
  </section>`;
  const el = name => container.querySelector(`[data-${name}]`);
  el('title').textContent = `${restaurantName || restaurantId} · ${provider}`;
  if (restaurantId === 'curated-PAR-bofinger') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Bofinger i Paris för exakt två gäster, i mån av lediga bord. Middag, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-la-coupole') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på La Coupole i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, Dancing, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-terminus-nord') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Terminus Nord i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-procope') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller första lunchsittningen (Déjeuner 1er service) på Le Procope i Paris för exakt två gäster, i mån av lediga bord. Övriga lunchsittningar, middag, kafé, grupper och privata rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-la-lorraine') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på La Lorraine i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, evenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-au-pied-de-cochon') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Au Pied de Cochon i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, evenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Restaurangen har även platser för gäster utan reservation. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  const write = (id, phase, idempotencyKey, reviewFingerprint) => {
    const value = { id, phase, ...(idempotencyKey ? { idempotencyKey } : {}), ...(reviewFingerprint ? { reviewFingerprint } : {}) };
    storage.setItem(key, JSON.stringify(value)); marker = value;
  };
  const isSubmit = () => marker?.phase === 'submit_pending';
  const needsReview = () => marker?.phase === 'review_required';
  const held = snapshot => snapshot?.result?.status === 'held' && snapshot.result.phase === 'hold'
    && ['guest','booking_review'].includes(snapshot.phase);
  const terminal = () => !!state?.result && !held(state);
  const changed = () => { el('terms').checked = false; el('hold-consent').checked = false; controls(); };
  const expiry = value => typeof value === 'number' ? value : Date.parse(value);
  const expired = review => !Number.isFinite(expiry(review?.expiresAt)) || expiry(review.expiresAt) <= Date.now();
  const details = review => review && review.restaurantId === restaurantId
    && /^\d{4}-\d{2}-\d{2}$/.test(review.date) && /^\d{2}:\d{2}/.test(review.time)
    && Number.isInteger(review.party) && review.party > 0;
  const fingerprint = value => typeof value === 'string' && value.length > 0;
  const validOffer = offer => offer?.offerId === 118785 && offer.count === 2 && offer.name === 'Lunch'
    && typeof offer.description === 'string' && !!offer.description.trim() && offer.currency === 'EUR'
    && offer.mealPrice === null && offer.priceStatus === 'not_provided_by_booking_form'
    && offer.menuSource === 'https://restaurantdekas.com/eng/menu' && offer.depositApplies === false
    && offer.depositMinGuests === 7 && offer.selectionSource === 'native_offer'
    && offer.submissionSupported === true && /^[a-f0-9]{64}$/.test(offer.version || '');
  function renderOffer(target, offer) {
    target.replaceChildren(); target.hidden = !validOffer(offer);
    if (target.hidden) return;
    for (const text of [`Meny: ${offer.name} · ${offer.count} gäster`, offer.description,
      'Pris anges inte i bokningsformuläret.', 'Ingen deposition krävs för detta sällskap om två gäster.']) {
      const paragraph = document.createElement('p'); paragraph.textContent = text; target.append(paragraph);
    }
    const link = document.createElement('a'); link.href = offer.menuSource; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Se restaurangens meny'; target.append(link);
  }
  const finalReview = () => state?.bookingReview;
  const finalFingerprint = () => finalReview()?.reviewFingerprint;
  const canHold = () => state?.phase === 'hold_review' && state.canHold === true && details(state.holdReview)
    && fingerprint(state.holdReview.fingerprint) && !expired(state.holdReview) && marker?.phase === 'open';
  const hasReview = () => state?.phase === 'booking_review' && details(finalReview()?.details)
    && (finalReview()?.details.offer === undefined || validOffer(finalReview().details.offer))
    && fingerprint(finalFingerprint()) && (!state.reviewFingerprint || state.reviewFingerprint === finalFingerprint())
    && (!isZenchef || (fingerprint(state.reviewToken) && fingerprint(state.terms?.version)))
    && (finalReview().expiresAt === undefined || !expired(finalReview())) && typeof finalReview().details.termsText === 'string' && !!finalReview().details.termsText.trim();
  const canSubmit = () => !needsReview() && state?.canSubmit === true && hasReview();
  function controls() {
    const locked = busy || uncertain || isSubmit() || needsReview() || !storageOK || terminal() || !!state?.blocked;
    container.querySelectorAll('button,input,textarea,select').forEach(node => { node.disabled = locked; });
    el('dismiss').disabled = false;
    el('refresh').disabled = busy || !storageOK;
    el('end').disabled = busy || uncertain || isSubmit() || !marker?.id;
    for (const button of container.querySelectorAll('[data-requires-room]')) button.disabled = locked || !button.parentElement.querySelector('select')?.value;
    el('save').disabled = locked || !drafts.size;
    el('review').hidden = state?.phase !== 'guest' && !needsReview();
    el('review').textContent = needsReview() ? 'Granska uppgifterna igen' : 'Kontrollera bokningen';
    el('review').disabled = (needsReview() ? busy || uncertain || !storageOK || !state || terminal() || !!state.blocked : locked) || drafts.size > 0;
    el('hold-button').disabled = locked || !canHold() || !el('hold-consent').checked || drafts.size > 0;
    el('submit').disabled = locked || !canSubmit() || !el('terms').checked || drafts.size > 0;
    el('image').style.cursor = locked || state?.phase !== 'selection' ? 'default' : 'pointer';
  }
  function outcome(result, snapshot) {
    const proof = result?.verification;
    if (result?.status === 'confirmed') {
      if (proof?.verified === true && proof.source === 'provider' && proof.restaurantId === restaurantId
        && (!lunchShift || (proof.bookingEvidence === 'own_booking_readback' && proof.shiftId === lunchShift && snapshot.details?.shiftId === lunchShift && snapshot.details?.party === 2))
        && proof.sessionId === snapshot.id && typeof proof.attemptId === 'string' && proof.attemptId
        // The durable journal key is server-owned; the UI UUID is only correlation.
        && (!isZenchef || (fingerprint(proof.idempotencyKey)
          && fingerprint(isSubmit() ? marker.reviewFingerprint : snapshot.reviewFingerprint)
          && proof.detailsDigest === (isSubmit() ? marker.reviewFingerprint : snapshot.reviewFingerprint)))
        && (snapshot.details?.roomId === undefined || (proof.roomId === snapshot.details.roomId && proof.roomName === snapshot.details.roomName))
        && (snapshot.details?.offer === undefined || (validOffer(snapshot.details.offer) && proof.offerEvidence === 'own_booking_readback'
          && proof.offerId === snapshot.details.offer.offerId && proof.offerCount === snapshot.details.offer.count && proof.offerVersion === snapshot.details.offer.version))
        && typeof result.reference === 'string' && result.reference.trim()) return `Bokningen är bekräftad. Referens: ${result.reference}`;
      return 'Bokningen är inte verifierad. Skicka inte en ny bokning. Kontrollera resultatet med restaurangen.';
    }
    return ({pending:'Bokningen behandlas. Skicka inte en ny bokning.', unknown:'Resultatet är okänt. Skicka inte en ny bokning. Kontrollera resultatet med restaurangen.', payment_required:'Bokningen kräver betalning eller kortbekräftelse och är inte färdig.', rejected:'Bokningen accepterades inte av leverantören.', error:'Bokningen kunde inte verifieras. Kontrollera resultatet innan du försöker igen.'})[result?.status] || 'Resultatet är okänt. Skicka inte en ny bokning.';
  }
  async function accept(next) {
    if (!next || next.restaurantId !== restaurantId || next.provider?.toLowerCase() !== provider.toLowerCase()
      || typeof next.id !== 'string' || !next.id || (marker && next.id !== marker.id)
      || !Number.isInteger(next.revision) || next.revision < 0 || (state && next.revision < state.revision)
      || next.mode === 'fixture' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(next.image || '')
      || !Number.isFinite(next.width) || !Number.isFinite(next.height) || next.width <= 0 || next.height <= 0) throw new Error('snapshot');
    const bytes = Uint8Array.from(atob(next.image.split(',')[1]), c => c.charCodeAt(0));
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2,'0')).join('');
    if (hash !== next.imageHash) throw new Error('image_mismatch');
    const image = new Image(); image.src = next.image; await image.decode();
    if (image.naturalWidth !== next.width || image.naturalHeight !== next.height) throw new Error('image_size');
    if (disposed) return;
    if (isZenchef) {
      // Project the actual Zenchef transport, without changing its wire fields.
      const phase = next.result ? 'result' : ({availability_observed:'slots',offers:'offers',contact:'guest',review:'booking_review'})[next.state] || 'selection';
      next = {...next,phase,bookingReview:next.state === 'review' ? {
        details:{...next.details,restaurantId:next.restaurantId,guest:Object.fromEntries(Object.entries(next.details || {}).filter(([name]) => Object.hasOwn(aliases,name))),termsText:[next.terms?.text,next.terms?.restaurantNotice?.replace(/<br\s*\/?\s*>/gi,'\n')].filter(Boolean).join('\n\n'),seatingNotice:next.terms?.seatingNotice},
        reviewFingerprint:next.reviewFingerprint,
      } : null};
    }
    if (!marker) write(next.id, 'open');
    if (marker.phase === 'hold_pending' && ['guest','booking_review'].includes(next.phase) && next.canHold !== true) write(next.id, 'hold_done');
    uncertain = marker.phase === 'hold_pending' || marker.phase === 'submit_pending';
    state = next;
    el('image').src = next.image; el('image').dataset.sourceHash = hash; el('image').dataset.revision = String(next.revision);
    el('screen').hidden = false; el('start').hidden = true;
    el('text').textContent = typeof next.text === 'string' ? next.text : '';
    el('fields').replaceChildren();
    const seen = new Set();
    for (const field of next.phase === 'guest' ? next.fields || [] : []) {
      if (!Object.hasOwn(aliases, field.name) || seen.has(field.name)) continue;
      seen.add(field.name);
      const label = document.createElement('label'); label.textContent = aliases[field.name];
      const input = document.createElement(field.name === 'civility' ? 'select' : field.name === 'comment' ? 'textarea' : 'input');
      input.dataset.field = field.name; input.setAttribute('aria-label', aliases[field.name]);
      if (field.name === 'civility') {
        for (const [value,text] of [['','Välj tilltal'],['mr','Mr'],['mrs','Mrs'],['mx','Mx']]) { const option = document.createElement('option'); option.value = value; option.textContent = text; input.append(option); }
      } else if (field.name !== 'comment') input.type = /^email/.test(field.name) ? 'email' : /phone/i.test(field.name) ? 'tel' : 'text';
      input.value = drafts.get(field.name) ?? (typeof field.value === 'string' ? field.value : '');
      input.readOnly = field.readOnly === true;
      if (input.readOnly) input.title = 'Hämtas från telefonnumret i restaurangens formulär.';
      input.maxLength = field.name === 'comment' ? 2000 : 200;
      input.oninput = () => { if (!input.readOnly) { drafts.set(field.name,input.value); changed(); } };
      label.append(input); el('fields').append(label);
    }
    el('save').hidden = !seen.size; el('review').hidden = next.phase !== 'guest';
    el('search').hidden = !['selection','slots'].includes(next.phase);
    el('navigation').hidden = isZenchef;
    el('slots').replaceChildren();
    if (isZenchef && next.phase === 'slots') {
      for (const slot of next.availabilityEvidence?.candidates || []) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time) || !(typeof slot.shiftId === 'string' || Number.isInteger(slot.shiftId))) continue;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = `${slot.time} · Välj tid`;
        button.dataset.slot = slot.time;
        const row = document.createElement('div');
        let roomSelect = null;
        if (Array.isArray(slot.rooms)) {
          const label = document.createElement('label'); label.textContent = 'Välj rum för ' + slot.time;
          roomSelect = document.createElement('select'); roomSelect.dataset.room = slot.time; roomSelect.setAttribute('aria-label',label.textContent);
          const empty = document.createElement('option'); empty.value=''; empty.textContent='Välj rum'; roomSelect.append(empty);
          for (const room of slot.rooms) {
            if (!Number.isSafeInteger(room.id) || room.id <= 0 || typeof room.name !== 'string' || !room.name.trim()) continue;
            const option=document.createElement('option'); option.value=String(room.id); option.textContent=room.name; roomSelect.append(option);
          }
          button.dataset.requiresRoom='true'; roomSelect.onchange=changed; label.append(roomSelect); row.append(label);
        }
        button.onclick = () => {
          if (roomSelect && !roomSelect.value) return;
          run({type:'select',time:slot.time,shiftId:slot.shiftId,...(roomSelect ? {roomId:Number(roomSelect.value)} : {})});
        };
        row.append(button); el('slots').append(row);
      }
    }
    el('offers').replaceChildren(); el('offers').hidden = next.phase !== 'offers';
    if (next.phase === 'offers') for (const offer of next.offerChoices || []) {
      if (!validOffer(offer)) continue;
      const row = document.createElement('div'); renderOffer(row,offer);
      const button = document.createElement('button'); button.type = 'button'; button.dataset.offer = String(offer.offerId);
      button.textContent = `Välj ${offer.name} för ${offer.count} gäster`;
      button.onclick = () => run({type:'select_offer',offerId:offer.offerId,count:offer.count,offerVersion:offer.version});
      row.append(button); el('offers').append(row);
    }
    el('hold').hidden = !canHold(); el('final').hidden = !hasReview();
    if (canHold()) el('hold-details').textContent = `Tillfällig reservation: ${restaurantName}, ${next.holdReview.date} kl. ${next.holdReview.time}, ${next.holdReview.party} gäster. Giltig till ${new Date(expiry(next.holdReview.expiresAt)).toLocaleString('sv-SE')}. Detta är inte en slutlig bokning.`;
    if (hasReview()) {
      const review = finalReview().details;
      renderOffer(el('final-offer'),review.offer);
      const guest = Object.entries(review.guest || {}).filter(([name,value]) => Object.hasOwn(aliases,name) && typeof value === 'string').map(([name,value]) => `${aliases[name]}: ${value}`).join(', ');
      el('final-details').textContent = `Slutför bokning: ${restaurantName}, ${review.date} kl. ${review.time}, ${review.party} gäster. ${review.roomName ? `Rum: ${review.roomName}. ` : ''}${guest}`;
      el('seating-notice').textContent = review.seatingNotice ? `Sittning: ${review.seatingNotice}` : '';
      el('seating-notice').hidden = !review.seatingNotice;
      el('terms-text').textContent = review.termsText;
    }
    el('status').textContent = terminal() ? outcome(next.result,next) : uncertain ? 'Resultatet måste kontrolleras. Skicka inte på nytt.' : needsReview() ? 'Servern har bekräftat att bokningen inte skickades. Granska uppgifterna igen innan du godkänner.' : hasReview() && !canSubmit() ? 'Uppgifterna visas för kontroll. Leverantörens slutliga bokningssteg är ännu inte tillgängligt.' : next.phase === 'guest' ? `${held(next) ? 'Tillfälligt reserverat. ' : ''}Fyll i och spara dina kontaktuppgifter. Bokningen är inte slutförd.` : next.blocked ? 'Leverantörens formulär är spärrat.' : 'Välj och kontrollera uppgifterna i leverantörens formulär.';
    el('status').dataset.bookingStatus = next.result?.status === 'confirmed' && !el('status').textContent.startsWith('Bokningen är bekräftad.') ? 'unknown' : next.result?.status || '';
    changed();
  }
  async function request(path, options) {
    let timer;
    try { return await Promise.race([Promise.resolve().then(() => api(path,options)), new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('timeout')),requestTimeoutMs); })]); }
    finally { clearTimeout(timer); }
  }
  const post = (path, body) => request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  async function run(action = null) {
    if (disposed || busy || (action && (uncertain || isSubmit() || needsReview() && action.type !== 'review' || drafts.size && action.type !== 'fill' || !state || terminal() || state.blocked))) return;
    if (action?.type === 'hold' && (!canHold() || !el('hold-consent').checked)) return;
    if (action?.type === 'submit' && (!canSubmit() || !el('terms').checked)) return;
    busy = true; controls(); el('status').textContent = 'Kontrollerar…';
    try {
      if (!storageOK) throw new Error('storage');
      if (action?.type === 'hold' || action?.type === 'submit') { write(state.id,`${action.type}_pending`,action.idempotencyKey,action.type === 'submit' ? finalFingerprint() : undefined); uncertain = true; }
      const next = action ? await post(`${endpoint}/${encodeURIComponent(state.id)}/action`,{...action,revision:state.revision})
        : marker ? await post(`${endpoint}/${encodeURIComponent(marker.id)}/current`,{})
        : await post(endpoint,{provider,restaurantId,width:Math.max(320,Math.min(560,Math.round(container.clientWidth))),resume:true});
      if (disposed) return;
      if (next?.error) throw Object.assign(new Error(String(next.error)),next);
      if (action?.type === 'fill' && Object.keys(action.fields).some(name => !next.fields?.some(field => field.name === name && typeof field.value === 'string'))) throw new Error('field_readback');
      await accept(next);
      if (action?.type === 'review' && needsReview() && hasReview() && !terminal() && !state.blocked) {
        write(state.id,isZenchef ? 'open' : 'hold_done');
        uncertain = false; changed();
        el('status').textContent = 'Kontrollera den nya granskningen och godkänn villkoren innan du slutför bokningen.';
      }
      if (action?.type === 'fill') {
        drafts.clear();
        for (const input of el('fields').querySelectorAll('[data-field]')) input.value = next.fields.find(field => field.name === input.dataset.field).value;
      }
    } catch (error) {
      if (!disposed) {
        let notDispatched = false;
        // Only the direct response to this submit may release its pending guard.
        // A generic 409, current() response or late timeout reply is not evidence.
        if (action?.type === 'submit' && isSubmit() && error?.error === 'stale_review'
          && error.submissionState === 'not_dispatched' && error.sessionId === marker.id && marker.id === state?.id
          && fingerprint(marker.reviewFingerprint) && error.reviewFingerprint === marker.reviewFingerprint
          && action.reviewFingerprint === marker.reviewFingerprint) {
          try { write(marker.id,'review_required',marker.idempotencyKey,marker.reviewFingerprint); notDispatched = true; } catch { /* Keep the pending guard if durable storage fails. */ }
        }
        uncertain = !notDispatched; changed();
        el('status').textContent = notDispatched ? 'Servern har bekräftat att bokningen inte skickades. Granska uppgifterna igen innan du godkänner.' : 'Kontakten avbröts eller svaret kunde inte verifieras. Kontrollera status. Skicka inte på nytt.';
      }
    } finally { busy = false; if (!disposed) controls(); }
  }
  el('start').onclick = () => run(); el('refresh').onclick = () => run();
  el('up').onclick = () => run({type:'scroll',delta:-500}); el('down').onclick = () => run({type:'scroll',delta:500});
  el('image').onclick = event => {
    if (isZenchef || !state || state.phase !== 'selection' || busy || uncertain || drafts.size) return;
    const rect = el('image').getBoundingClientRect();
    const x = Math.floor((event.clientX-rect.left)*state.width/rect.width), y = Math.floor((event.clientY-rect.top)*state.height/rect.height);
    if (x>=0 && y>=0 && x<state.width && y<state.height) run({type:'click',x,y});
  };
  el('search').onsubmit = event => { event.preventDefault(); const data = new FormData(el('search')); run({type:'search',date:data.get('date'),party:Number(data.get('party'))}); };
  el('save').onclick = () => run({type:'fill',fields:Object.fromEntries([...el('fields').querySelectorAll('[data-field]')].map(node => [node.dataset.field,node.value]))});
  el('review').onclick = async () => {
    if (needsReview()) { await run(); if (disposed || busy || uncertain || !needsReview()) return; }
    await run({type:'review'});
  };
  el('hold-consent').onchange = controls; el('terms').onchange = controls;
  el('hold-button').onclick = () => run({type:'hold',confirm:true,reviewFingerprint:state?.holdReview?.fingerprint});
  el('submit').onclick = () => run(isZenchef
    ? {type:'submit',confirm:true,terms:true,reviewToken:state?.reviewToken,reviewFingerprint:state?.reviewFingerprint,termsVersion:state?.terms?.version,idempotencyKey:crypto.randomUUID()}
    : {type:'submit',confirm:true,terms:true,reviewFingerprint:finalFingerprint()});
  el('dismiss').onclick = () => { destroy(); container.hidden = true; onDismiss?.(); };
  el('end').onclick = async () => {
    if (busy || uncertain || isSubmit() || !marker) return;
    busy = true; controls();
    try {
      await request(`${endpoint}/${encodeURIComponent(marker.id)}`,{method:'DELETE'});
      if (disposed) return;
      storage.removeItem(key); marker = null; state = null; drafts.clear(); el('screen').hidden = true; el('start').hidden = false;
      el('status').textContent = 'Formuläret är avslutat. Detta avbokar inte en reservation.';
    } catch { uncertain = true; el('status').textContent = 'Formuläret kunde inte avslutas. Kontrollera status.'; }
    finally { busy = false; if (!disposed) controls(); }
  };
  function destroy() { disposed = true; drafts.clear(); clearInterval(expiryTimer); }
  const expiryTimer = setInterval(() => { if (!disposed) controls(); },1000);
  controls();
  const ready = marker ? run() : Promise.resolve();
  return {ready,refresh:() => run(),destroy};
}
