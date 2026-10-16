// Actual provider pixels from an isolated server browser, never a provider iframe.
// Inspection pilot: click/scroll/refresh only. No fields, no submission.
export function mountProviderMirror(container, api, { restaurantId, restaurantName = 'Restaurangen', providerName = 'leverantören' } = {}) {
  restaurantId = restaurantId || container.dataset.restaurantId;
  providerName = container.dataset.providerName || providerName;
  container.innerHTML = `<div class="booking-source"><span>Bokning via ${providerName}</span><span>Inspektionsläge</span></div><p class="booking-intro">Välj datum, tid och antal gäster. Bokningen slutförs inte här i testläget.</p><button class="btn btn-gold" data-start>Hitta ett bord</button><p role="status" aria-live="polite" data-status></p><div data-screen hidden><div data-stage style="position:relative"><img data-image alt="Restaurangens bokningsformulär" style="display:block;width:100%;cursor:pointer"><span class="booking-click" hidden aria-hidden="true" data-click></span></div><div class="booking-navigation"><button class="btn" data-up aria-label="Visa övre delen av formuläret">↑ Upp</button><button class="btn" data-down aria-label="Visa nedre delen av formuläret">↓ Ned</button><button class="btn" data-refresh>Uppdatera</button><button class="btn" data-close>Stäng</button></div><p data-handoff hidden></p><details class="booking-accessible"><summary>Visa formuläret som text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details></div>`;
  const status = container.querySelector('[data-status]');
  const start = container.querySelector('[data-start]');
  const screen = container.querySelector('[data-screen]');
  const img = container.querySelector('[data-image]');
  let state, busy = false, disposed = false;
  const endpoint = '/provider-mirror';
  const messages = { busy: 'Formuläret uppdateras redan. Vänta ett ögonblick.', auth: 'Bokningssessionen kunde inte öppnas. Uppdatera sidan och försök igen.', capacity: 'Många bokar just nu. Försök igen om en liten stund.', session_expired: 'Sessionen har gått ut. Öppna bokningen igen.', session_exists: 'Du har redan en bokning öppen. Stäng den först.', contact_stop: 'Kontaktsteget är nått. Inga uppgifter eller bokningar skickas i testläget.', stale_view: 'Formuläret har uppdaterats. Tryck på Uppdatera för att fortsätta.', inspect_only: 'Testläget tillåter bara inspektion.' };
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function perform(action) {
    if (disposed || busy) return;
    busy = true; container.setAttribute('aria-busy', 'true');
    if (action?.type !== 'fill') status.textContent = state ? 'Uppdaterar…' : 'Öppnar bokningen…';
    container.querySelectorAll('button').forEach(b => b.disabled = true);
    try {
      const result = state ? await post(`${endpoint}/${state.id}/action`, { ...action, revision: state.revision }) : await post(endpoint, { restaurantId, width: Math.max(320, Math.round(container.clientWidth)) });
      if (!result?.image) throw new Error(result?.error || 'connection');
      if (disposed) { await api(`${endpoint}/${result.id}`, { method: 'DELETE' }); return; }
      // Keep coordinates paired with the image actually decoded on screen.
      const next = new Image(); next.src = result.image; await next.decode();
      const bytes = Uint8Array.from(atob(result.image.split(',')[1]), c => c.charCodeAt(0));
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
      if (digest !== result.imageHash) throw new Error('image_mismatch');
      state = result; img.src = result.image;
      img.dataset.revision = String(result.revision);
      img.dataset.sourceHash = digest;
      container.querySelector('[data-text]').textContent = result.text;
      screen.hidden = false; start.hidden = true;
      const handoff = container.querySelector('[data-handoff]'); handoff.replaceChildren(); handoff.hidden = !result.handoff;
      if (result.handoff) { const link = document.createElement('a'); link.href = result.handoff.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Fortsätt hos leverantören';
        handoff.append(document.createTextNode('Testläget stoppar före kontaktuppgifter. Slutför bokningen via leverantören. Ingen bokning har skickats från Velvet. '), link); }
      status.textContent = result.contact ? 'Kontaktsteget är nått. Testet stoppar här — ingen bokning har skapats.' : result.blocked ? 'Det här steget kunde inte genomföras.' : result.times?.length ? `Lediga tider observerade: ${result.times.join(', ')}` : '';
    } catch (error) { status.textContent = messages[error.message] || 'Kopplingen kunde inte uppdateras.'; }
    finally { busy = false; container.setAttribute('aria-busy', 'false'); container.querySelector('[data-click]').hidden = true; container.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  start.onclick = () => perform();
  img.onclick = e => { if (busy || !state || state.contact) return; const r = img.getBoundingClientRect(); const marker = container.querySelector('[data-click]'); marker.style.left = `${100 * (e.clientX - r.left) / r.width}%`; marker.style.top = `${100 * (e.clientY - r.top) / r.height}%`; marker.hidden = false; perform({ type: 'click', x: (e.clientX - r.left) * state.width / r.width, y: (e.clientY - r.top) * state.height / r.height }); };
  container.querySelector('[data-up]').onclick = () => perform({ type: 'scroll', dy: -500 });
  container.querySelector('[data-down]').onclick = () => perform({ type: 'scroll', dy: 500 });
  container.querySelector('[data-refresh]').onclick = () => perform({ type: 'refresh' });
  async function close() {
    if (busy) return;
    if (state) await api(`${endpoint}/${state.id}`, { method: 'DELETE' });
    state = null; screen.hidden = true; start.hidden = false; img.removeAttribute('src'); status.textContent = 'Bokningsformuläret är stängt.';
  }
  container.querySelector('[data-close]').onclick = close;
  const observer = new MutationObserver(() => { if (!container.isConnected) { disposed = true; close(); observer.disconnect(); } });
  observer.observe(document.body, { childList: true, subtree: true });
}
