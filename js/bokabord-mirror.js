// Actual provider pixels from an isolated server browser, never a provider iframe.
export function mountBokabordMirror(container, api) {
  container.innerHTML = `<p><strong>BokaBord i Velvet · testläge</strong></p><p>Samma formulär som hos Zink. Testet stannar vid kontaktuppgifter och kan inte skapa en bokning.</p><button class="btn btn-gold" data-start>Öppna bokningsflödet</button><p role="status" data-status></p><div data-screen hidden><img data-image alt="Zinks aktuella bokningsformulär. Klicka för att välja." style="display:block;width:100%;border-radius:10px;cursor:pointer"><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn" data-up>↑ Upp</button><button class="btn" data-down>↓ Ned</button><button class="btn" data-refresh>Uppdatera</button><button class="btn" data-close>Avsluta test</button></div><details><summary>Formulärets text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details></div>`;
  const status = container.querySelector('[data-status]');
  const start = container.querySelector('[data-start]');
  const screen = container.querySelector('[data-screen]');
  const img = container.querySelector('[data-image]');
  let state, busy = false, disposed = false;
  const endpoint = '/restaurant-bookings/mirror';
  const messages = { auth: 'Logga in i Velvet för att testa.', mirror_disabled: 'Testservern är inte aktiverad.', capacity: 'Testservern är upptagen. Försök senare.', session_expired: 'Sessionen har gått ut. Öppna ett nytt test.', session_exists: 'Du har redan ett test öppet. Avsluta det eller vänta tio minuter.', contact_stop: 'Kontaktsteget är nått. Inga uppgifter eller bokningar skickas i testläget.', stale_view: 'Vyn ändrades. Avsluta och öppna testet igen.' };
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function perform(action) {
    if (busy || disposed) return;
    busy = true; status.textContent = 'Hämtar bokningsformuläret…';
    container.querySelectorAll('button').forEach(b => b.disabled = true);
    try {
      const result = state ? await post(`${endpoint}/${state.id}/action`, { ...action, revision: state.revision }) : await post(endpoint, { restaurantId: 'curated-STO-zink-italian-cuisine', width: Math.max(320, Math.round(container.clientWidth)) });
      if (!result?.image) throw new Error(result?.error || 'connection');
      if (disposed) { await api(`${endpoint}/${result.id}`, { method: 'DELETE' }); return; }
      // Keep coordinates paired with the image actually decoded on screen.
      const next = new Image(); next.src = result.image; await next.decode();
      state = result; img.src = result.image;
      container.querySelector('[data-text]').textContent = result.text;
      screen.hidden = false; start.hidden = true;
      status.textContent = result.contact ? 'Kontaktsteget är nått. Testet stoppar här — ingen bokning har skapats.' : result.blocked ? 'Den åtgärden är spärrad i testläget.' : 'Välj direkt i formuläret. Det här är en livevy från Zink.';
    } catch (error) { status.textContent = messages[error.message] || 'Kopplingen kunde inte uppdateras. Avsluta testet och försök igen.'; }
    finally { busy = false; container.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  start.onclick = () => perform();
  img.onclick = e => { if (!state || state.contact) return; const r = img.getBoundingClientRect(); perform({ type: 'click', x: (e.clientX - r.left) * state.width / r.width, y: (e.clientY - r.top) * state.height / r.height }); };
  container.querySelector('[data-up]').onclick = () => perform({ type: 'scroll', dy: -500 });
  container.querySelector('[data-down]').onclick = () => perform({ type: 'scroll', dy: 500 });
  container.querySelector('[data-refresh]').onclick = () => perform({ type: 'refresh' });
  async function close() {
    if (busy) return;
    if (state) await api(`${endpoint}/${state.id}`, { method: 'DELETE' });
    state = null; screen.hidden = true; start.hidden = false; img.removeAttribute('src'); status.textContent = 'Testsessionen är stängd.';
  }
  container.querySelector('[data-close]').onclick = close;
  const observer = new MutationObserver(() => { if (!container.isConnected) { disposed = true; close(); observer.disconnect(); } });
  observer.observe(document.body, { childList: true, subtree: true });
}
