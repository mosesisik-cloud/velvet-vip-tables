// First-party UI only. The integrator supplies a normalized v1 transport backed
// by an owner-bound, revision-checked Playwright session. No provider URLs,
// production endpoints, provider actions or fixture inventory live in this file.
// See #129 for the proposed interface; Bokabord's pixel snapshots are NOT v1.
const STAGES = new Set(['selection', 'slots', 'guest', 'review', 'result']);
const RESULTS = new Set(['pending', 'confirmed', 'unknown', 'payment_required', 'rejected', 'error']);
const GUEST_FIELDS = ['firstname', 'lastname', 'email', 'phone', 'comment'];
const string = value => typeof value === 'string' && value.trim().length > 0;
const dateValid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const timeValid = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const selectionValid = value => dateValid(value?.date) && Number.isInteger(value?.party) && value.party >= 1 && value.party <= 100;
const guestValid = value => ['firstname', 'lastname', 'email', 'phone'].every(key => string(value?.[key]))
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) && value.phone.replace(/\D/g, '').length >= 7;
const termsValid = value => string(value?.version) && string(value?.text);

/** Validates structure, not provider truth. Server must verify every write. */
export function validateBookingSnapshot(value, { restaurantId, mode }) {
  if (!value || value.contractVersion !== 1 || !string(value.id) || value.restaurantId !== restaurantId
    || value.mode !== mode || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !STAGES.has(value.stage)) throw new Error('invalid_snapshot');
  if (value.expiresAt !== undefined && !Number.isFinite(Date.parse(value.expiresAt))) throw new Error('invalid_snapshot');
  if (['slots', 'guest', 'review'].includes(value.stage) && !selectionValid(value.selection)) throw new Error('invalid_snapshot');
  if (value.availability) {
    const a = value.availability;
    if (a.source !== (mode === 'fixture' ? 'fixture' : 'provider') || !Number.isFinite(Date.parse(a.observedAt))
      || !Array.isArray(a.slots) || a.slots.length > 500
      || a.slots.some(slot => !string(slot?.id) || !timeValid(slot.time))
      || new Set(a.slots.map(slot => slot.id)).size !== a.slots.length) throw new Error('invalid_availability');
  }
  if (value.stage === 'slots' && !value.availability) throw new Error('invalid_availability');
  if (['guest', 'review'].includes(value.stage) && (!string(value.selection.slotId) || !timeValid(value.selection.time))) throw new Error('invalid_snapshot');
  if (value.stage === 'review' && (!guestValid(value.guest) || !termsValid(value.terms) || !string(value.reviewToken))) throw new Error('invalid_review');
  if (value.stage === 'result' && !RESULTS.has(value.result?.status) || value.result && value.stage !== 'result') throw new Error('invalid_result');
  // A reservation/request/payment ID alone is NOT confirmation. The adapter
  // must supply a reviewed supplier outcome, bound to this venue/session/attempt.
  const proof = value.result?.verification;
  if (value.result?.status === 'confirmed' && (!string(value.result.reference)
    || proof?.verified !== true || proof.source !== (mode === 'fixture' ? 'fixture' : 'provider')
    || proof.restaurantId !== restaurantId || proof.sessionId !== value.id || !string(proof.attemptId))) {
    return { ...value, stage: 'result', canSubmit: false, result: { status: 'unknown' } };
  }
  return value;
}

/**
 * transport.create({restaurantId,resume:true}), current({restaurantId}),
 * action({id,restaurantId,revision,type,...payload}), remove({id,restaurantId}).
 * Methods return v1 snapshots (remove may return void); throw coded Errors on
 * failure. current may return null or session_expired when no session exists.
 * Server owns authentication, terms binding, durable idempotency and TTL.
 * mode fixture is explicit, visibly labelled, and cannot be mixed with live.
 */
export function mountVelvetPlaywrightBooking(container, {
  restaurantId, restaurantName = 'Restaurangen', transport, mode = 'live',
  storage = undefined, requestTimeoutMs = 30_000,
} = {}) {
  if (!container?.ownerDocument || !string(restaurantId) || !['live', 'fixture'].includes(mode)
    || !Number.isFinite(requestTimeoutMs) || requestTimeoutMs < 1
    || !['create', 'current', 'action', 'remove'].every(key => typeof transport?.[key] === 'function')) {
    throw new TypeError('Booking requires a container, restaurantId and normalized transport');
  }
  const document = container.ownerDocument;
  const window = document.defaultView;
  if (storage === undefined) { try { storage = window.sessionStorage; } catch { storage = null; } }
  let state = null, busy = false, disposed = false, alert = '', uncertain = false;
  let attempted = false, epoch = 0;
  let guestDraft = null, selectionDraft = null;
  const root = document.createElement('section');
  root.dataset.vpb = ''; root.className = 'velvet-playwright-booking';
  root.setAttribute('aria-label', `Boka bord på ${restaurantName}`);
  container.replaceChildren(root);
  const element = (tag, text, attrs = {}) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const button = (text, action, click, type = 'button') => {
    const node = element('button', text, {type, 'data-action': action, class: action === 'submit' ? 'btn btn-gold' : 'btn'});
    if (click) node.addEventListener('click', click);
    return node;
  };
  const expired = () => state?.expiresAt && Date.parse(state.expiresAt) <= Date.now();
  const bounded = async promise => {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('connection_timeout')), requestTimeoutMs);
      })]);
    } finally { window.clearTimeout(timer); }
  };
  const markerKey = () => `velvet-booking-attempt:${mode}:${encodeURIComponent(restaurantId)}`;
  const readMarker = () => {
    if (!storage) return null;
    try { return JSON.parse(storage.getItem(markerKey()) || 'null'); } catch { return { uncertain: true }; }
  };
  // A reload with no server session must not erase a previously dispatched attempt.
  attempted = !!readMarker(); uncertain = attempted;
  const lockControls = () => {
    root.setAttribute('aria-busy', String(busy));
    root.querySelectorAll('button,input,textarea,select').forEach(node => {
      node.disabled = busy || node.dataset.locked === 'true';
    });
  };
  function input(form, name, label, type, value = '', required = true) {
    const wrapper = element('label', label);
    const node = element(name === 'comment' ? 'textarea' : 'input', undefined, {name, 'aria-label': label});
    if (name !== 'comment') node.type = type;
    node.value = value; node.required = required;
    if (name === 'party') { node.min = '1'; node.max = '100'; node.step = '1'; }
    if (name === 'comment') node.maxLength = 2000;
    else if (['firstname', 'lastname', 'email', 'phone'].includes(name)) node.maxLength = 254;
    wrapper.append(node); form.append(wrapper);
    return node;
  }
  function summary() {
    const dl = element('dl', undefined, {'data-review-summary': ''});
    const entries = [['Restaurang', restaurantName], ['Datum', state.selection?.date], ['Tid', state.selection?.time], ['Gäster', state.selection?.party]];
    if (state.stage === 'review') entries.push(['Namn', `${state.guest.firstname} ${state.guest.lastname}`], ['E-post', state.guest.email], ['Telefon', state.guest.phone], ['Önskemål', state.guest.comment || '—']);
    for (const [name, value] of entries) if (value !== undefined) dl.append(element('dt', name), element('dd', String(value)));
    return dl;
  }
  const resultCopy = {
    pending: 'Bokningen behandlas. Den är ännu inte bekräftad. Skicka inte en ny bokning.',
    confirmed: 'Restaurangen har bekräftat bokningen.',
    unknown: 'Bokningsresultatet är okänt. Skicka inte en ny bokning. Kontrollera statusen innan du försöker igen.',
    payment_required: 'Betalning eller kortgaranti krävs. Bokningen är inte bekräftad. Betalning kan ännu inte slutföras här.',
    rejected: 'Restaurangen avvisade bokningsförsöket. Ingen bekräftad bokning visas.',
    error: 'Bokningsförsöket kunde inte slutföras. Kontrollera statusen innan du försöker igen.',
  };
  function render() {
    if (disposed) return;
    root.replaceChildren();
    const style = element('style');
    style.textContent = '.velvet-playwright-booking{max-width:42rem;margin:auto;padding:1rem;border:1px solid #80735f;border-radius:12px;overflow-wrap:anywhere}.velvet-playwright-booking form,.velvet-playwright-booking label{display:grid;gap:.6rem}.velvet-playwright-booking form{gap:1rem}.velvet-playwright-booking input:not([type=checkbox]),.velvet-playwright-booking textarea{box-sizing:border-box;width:100%;min-height:44px;padding:.6rem;font:inherit}.velvet-playwright-booking button{min-height:44px;margin:.4rem .4rem .4rem 0}.velvet-playwright-booking button:focus-visible,.velvet-playwright-booking input:focus-visible,.velvet-playwright-booking a:focus-visible{outline:3px solid #a77726;outline-offset:3px}.velvet-playwright-booking dl{display:grid;grid-template-columns:minmax(5rem,1fr) minmax(0,2fr);gap:.5rem}.velvet-playwright-booking dd{margin:0}.velvet-playwright-booking [data-fixture-banner]{padding:.7rem;background:#fff0bd;color:#3d2d00;font-weight:bold}';
    root.append(style);
    const stage = uncertain ? 'result' : state?.stage || 'start';
    root.dataset.stage = stage;
    root.append(element('h2', `Boka bord på ${restaurantName}`));
    if (mode === 'fixture') root.append(element('p', 'TESTDATA — inga riktiga tider eller bokningar. Detta är en lokal demonstration.', {role: 'note', 'data-fixture-banner': ''}));
    const status = element('p', busy ? 'Uppdaterar bokningen…' : '', {role: 'status', 'aria-live': 'polite', 'data-status': ''});
    root.append(status);
    if (alert) root.append(element('p', alert, {role: 'alert'}));
    if (!state && !uncertain) {
      root.append(button('Starta bokning', 'start', () => run('create')));
    } else if (stage === 'result') {
      const result = uncertain ? {status: 'unknown'} : state.result;
      status.textContent = resultCopy[result.status]; status.dataset.bookingStatus = result.status;
      if (result.status === 'pending' && result.reason === 'request_received') status.textContent = 'Restaurangen har tagit emot förfrågan. En bekräftad bokning väntar fortfarande på restaurangens svar.';
      if (mode === 'fixture') status.textContent = 'TESTRESULTAT: ' + status.textContent;
      if (result.status === 'confirmed') root.append(element('p', `Referens: ${result.reference}`, {'data-reference': ''}));
      // No automatic retry, payment handling, or booking restart on any outcome.
    } else if (expired()) {
      status.textContent = 'Sessionen har gått ut. Kontrollera status eller stäng sessionen.';
    } else if (stage === 'selection') {
      const form = element('form');
      const date = input(form, 'date', 'Datum', 'date', selectionDraft?.date || state.selection?.date || '');
      const party = input(form, 'party', 'Antal gäster', 'number', selectionDraft?.party || state.selection?.party || 2);
      form.append(button('Visa tider', 'search', null, 'submit'));
      form.addEventListener('submit', event => {
        event.preventDefault();
        const selection = {date: date.value, party: Number(party.value)};
        if (selectionValid(selection) && form.reportValidity()) run('action', {type: 'search', ...selection});
      });
      root.append(form);
    } else if (stage === 'slots') {
      root.append(summary());
      if (!state.availability.slots.length) root.append(element('p', 'Inga tider finns i det senaste svaret.'));
      else {
        const list = element('div', undefined, {role: 'group', 'aria-label': 'Tillgängliga tider'});
        for (const slot of state.availability.slots) {
          const node = button(slot.label || slot.time, 'select', () => run('action', {type: 'select', slotId: slot.id}));
          node.dataset.slotId = slot.id; list.append(node);
        }
        root.append(list);
      }
      root.append(button('Ändra datum eller antal', 'back', () => run('action', {type: 'back', target: 'selection'})));
    } else if (stage === 'guest') {
      root.append(summary());
      const form = element('form');
      const labels = {firstname: 'Förnamn', lastname: 'Efternamn', email: 'E-post', phone: 'Telefon', comment: 'Önskemål'};
      for (const name of GUEST_FIELDS) input(form, name, labels[name], name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text', guestDraft?.[name] ?? state.guest?.[name] ?? '', name !== 'comment');
      form.append(button('Granska bokningen', 'guest', null, 'submit'));
      form.addEventListener('submit', event => {
        event.preventDefault();
        const guest = Object.fromEntries(GUEST_FIELDS.map(name => [name, form.elements.namedItem(name).value.trim()]));
        if (guestValid(guest) && form.reportValidity()) run('action', {type: 'guest', guest});
      });
      root.append(form, button('Välj annan tid', 'back', () => run('action', {type: 'back', target: 'selection'})));
    } else if (stage === 'review') {
      root.append(element('h3', 'Kontrollera din bokning'), summary());
      root.append(element('p', state.terms.text, {'data-terms-text': ''}));
      try {
        const url = new URL(state.terms.url);
        if (url.protocol === 'https:' && !url.username && !url.password) root.append(element('a', 'Läs villkoren', {href: url.href, target: '_blank', rel: 'noopener noreferrer'}));
      } catch { /* Plain text terms remain available. Never render unsafe links. */ }
      const consent = element('label', 'Jag har kontrollerat uppgifterna och godkänner villkoren.');
      const checkbox = element('input', undefined, {type: 'checkbox', name: 'terms', 'aria-label': 'Godkänn villkoren'});
      consent.prepend(checkbox); root.append(consent);
      const submit = button('Bekräfta och boka', 'submit', () => {
        if (checkbox.checked && state.canSubmit === true && !attempted) run('action', {type: 'submit', confirm: true, terms: true, termsVersion: state.terms.version, reviewToken: state.reviewToken});
      });
      submit.dataset.locked = 'true';
      checkbox.addEventListener('change', () => {
        submit.dataset.locked = String(!checkbox.checked || state.canSubmit !== true || attempted);
        lockControls();
      });
      if (state.canSubmit !== true) root.append(element('p', 'Bokningen kan inte skickas från det här steget.'));
      root.append(submit, button('Ändra uppgifter', 'back', () => run('action', {type: 'back', target: 'guest'})));
    }
    root.append(button('Kontrollera status', 'refresh', () => run('current')));
    if (state && !uncertain && (!attempted && state.stage !== 'result'
      || ['confirmed', 'rejected'].includes(state.result?.status))) root.append(button('Stäng bokningen', 'close', () => run('remove')));
    lockControls();
    // Move focus to context, never to the irreversible confirmation control.
    const heading = root.querySelector('h2'); heading.tabIndex = -1;
    if (!busy) heading.focus({preventScroll: true});
  }
  function accept(value, operation) {
    if (value?.error) throw new Error(value.error);
    if (value === null && operation === 'current' && !attempted) {
      state = null; uncertain = false; guestDraft = null; selectionDraft = null; return;
    }
    let next = validateBookingSnapshot(structuredClone(value), {restaurantId, mode});
    const marker = readMarker();
    if (marker && marker.id !== next.id) throw new Error('session_mismatch');
    // Ledger may assign its own attemptId. Its proof then separately echoes the
    // client idempotencyKey; neither identifier is an authorization credential.
    if (marker && next.result?.status === 'confirmed'
      && (next.result.verification.idempotencyKey ?? next.result.verification.attemptId) !== marker.key) {
      next = {...next, stage: 'result', canSubmit: false, result: {status: 'unknown'}};
    }
    if (state && next.id !== state.id) throw new Error('session_mismatch');
    if (state && next.revision < state.revision) throw new Error('stale_view');
    state = next;
    attempted = attempted || !!marker || state.stage === 'result';
    uncertain = attempted && state.stage !== 'result';
  }
  async function run(operation, action) {
    if (disposed || busy) return;
    if (operation === 'action' && (!state || expired() || uncertain || attempted || state.stage === 'result')) {
      alert = 'Bokningen måste kontrolleras innan du kan fortsätta.'; render(); return;
    }
    const isSubmit = action?.type === 'submit';
    busy = true; alert = ''; lockControls();
    const token = ++epoch;
    try {
      let value;
      if (operation === 'create') value = await bounded(transport.create({restaurantId, resume: true}));
      else if (operation === 'current') value = await bounded(transport.current({restaurantId}));
      else if (operation === 'remove') {
        await bounded(transport.remove({id: state.id, restaurantId}));
        if (!disposed && token === epoch) {
          if (attempted) storage?.removeItem(markerKey());
          state = null; uncertain = false; attempted = false; guestDraft = null; selectionDraft = null;
        }
        return;
      } else {
        const payload = {id: state.id, restaurantId, revision: state.revision, ...action};
        if (action.type === 'guest') guestDraft = {...action.guest};
        if (action.type === 'search') selectionDraft = {date: action.date, party: action.party};
        if (isSubmit) {
          // Only opaque metadata is stored, never guest details or credentials.
          // Write BEFORE dispatch; a lost response/reload must not re-arm submit.
          if (!storage || readMarker()) throw new Error('attempt_locked');
          payload.idempotencyKey = window.crypto.randomUUID();
          const marker = JSON.stringify({id: state.id, key: payload.idempotencyKey, revision: state.revision});
          storage.setItem(markerKey(), marker);
          if (storage.getItem(markerKey()) !== marker) throw new Error('attempt_locked');
          attempted = true;
        }
        value = await bounded(transport.action(payload));
      }
      if (!disposed && token === epoch) accept(value, operation);
    } catch (error) {
      if (disposed || token !== epoch) return;
      const code = error?.code || error?.message;
      if (operation === 'current' && !attempted && code === 'session_expired') {
        state = null; uncertain = false; guestDraft = null; selectionDraft = null;
      } else {
        // On a lost acknowledgement never repeat an action automatically.
        if (isSubmit && attempted || attempted && operation === 'current') uncertain = true;
        alert = code === 'session_expired' ? 'Sessionen har gått ut. Ingen ny bokning skickas automatiskt.'
          : code === 'stale_view' ? 'Vyn har ändrats. Kontrollera status och granska de aktuella uppgifterna igen.'
          : code === 'attempt_locked' ? 'Bokningsförsöket kunde inte säkras. Inget nytt försök skickas.'
          : 'Bokningsvyn kunde inte uppdateras. Kontrollera status innan du fortsätter.';
        // Invalidate consent on every failed request as well as every snapshot.
        // A failed non-submit mutation may have reached the server: reconcile.
        if (operation === 'action' && !isSubmit || ['current', 'create', 'remove'].includes(operation)) uncertain = true;
      }
    } finally {
      if (!disposed && token === epoch) { busy = false; render(); }
    }
  }
  render();
  const ready = run('current');
  return {
    ready,
    refresh: () => run('current'),
    destroy() { disposed = true; epoch++; root.replaceChildren(); root.remove(); state = null; guestDraft = null; selectionDraft = null; },
  };
}
