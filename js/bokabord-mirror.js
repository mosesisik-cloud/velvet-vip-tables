// Actual provider pixels from an isolated server browser, never a provider iframe.
export function mountBokabordMirror(container, api, { restaurantId = 'curated-STO-zink-italian-cuisine', restaurantName = 'Zink', onLogin = null } = {}) {
  container.innerHTML = `<p><strong>BokaBord i Velvet</strong></p><p>Restaurangens originalformulär. Välj datum, tid och sällskap för att fortsätta.</p><button class="btn btn-gold" data-start>Öppna bokningsflödet</button><p role="status" data-status></p><div data-screen hidden><div data-stage style="position:relative"><img data-image alt="Restaurangens aktuella bokningsformulär. Klicka för att välja." style="display:block;width:100%;border-radius:10px;cursor:pointer"><div data-inputs></div></div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn" data-up>↑ Upp</button><button class="btn" data-down>↓ Ned</button><button class="btn" data-refresh>Uppdatera</button><button class="btn" data-close>Stäng formuläret</button></div><label data-consent hidden style="margin:16px 0"><input type="checkbox" data-terms> Jag har kontrollerat uppgifterna och godkänner <a href="https://www.waiteraid.com/terms/" target="_blank" rel="noopener">Bokabords villkor</a> och har läst <a href="https://www.waiteraid.com/privacy-policy/" target="_blank" rel="noopener">personuppgiftspolicyn</a>.</label><button class="btn btn-gold" data-submit hidden>Fortsätt bokningen</button><p data-handoff hidden></p><details><summary>Formulärets text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details></div>`;
  const status = container.querySelector('[data-status]');
  const start = container.querySelector('[data-start]');
  const screen = container.querySelector('[data-screen]');
  const img = container.querySelector('[data-image]');
  let state, busy = false, disposed = false;
  const pendingFields = new Map();
  const terms = container.querySelector('[data-terms]');
  const endpoint = '/restaurant-bookings/mirror';
  const messages = { auth: 'Logga in i Velvet för att testa.', mirror_disabled: 'Testservern är inte aktiverad.', capacity: 'Testservern är upptagen. Försök senare.', session_expired: 'Sessionen har gått ut. Öppna ett nytt test.', session_exists: 'Du har redan ett test öppet. Avsluta det eller vänta tio minuter.', contact_stop: 'Kontaktsteget är nått. Inga uppgifter eller bokningar skickas i testläget.', stale_view: 'Vyn ändrades. Avsluta och öppna testet igen.' };
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function perform(action) {
    if (disposed) return;
    if (busy) { if (action?.type === 'fill') pendingFields.set(action.field, action.value); return; }
    busy = true; status.textContent = 'Hämtar bokningsformuläret…';
    container.querySelectorAll('button,input,textarea').forEach(b => b.disabled = true);
    try {
      const current = state ? null : await post(`${endpoint}/current`, {});
      if (!state && current?.image && current.restaurantId !== restaurantId) { throw new Error('other_restaurant'); }
      const result = state ? await post(`${endpoint}/${state.id}/action`, { ...action, revision: state.revision }) : (current?.image ? current : await post(endpoint, { restaurantId, width: Math.max(320, Math.round(container.clientWidth)) }));
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
      const overlay = container.querySelector('[data-inputs]');
      overlay.replaceChildren();
      const labels = {firstname:'Förnamn',lastname:'Efternamn',email:'E-postadress',phone:'Mobiltelefon',comment:'Önskemål'};
      for (const field of result.fields || []) {
        const rect = field.rect;
        if (!rect || rect.y < 0 || rect.y + rect.height > result.height) continue;
        const input = document.createElement(field.name === 'comment' ? 'textarea' : 'input');
        if (field.name !== 'comment') input.type = field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'text';
        input.setAttribute('aria-label', labels[field.name]);
        input.dataset.providerField = field.name;
        input.value = pendingFields.has(field.name) ? pendingFields.get(field.name) : field.value;
        input.dataset.verifiedValue = field.value;
        input.style.cssText = `position:absolute;box-sizing:border-box;left:${100*rect.x/result.width}%;top:${100*rect.y/result.height}%;width:${100*rect.width/result.width}%;height:${100*rect.height/result.height}%;background:transparent;color:transparent;border:0;outline:0;resize:none;padding:8px;font:16px Arial;`;
        input.onfocus = () => {input.style.background='white';input.style.color='#222';input.style.outline='2px solid #d5b880';};
        input.onblur = () => {input.style.background='transparent';input.style.color='transparent';input.style.outline='0';};
        let editTimer;
        const sync = () => { clearTimeout(editTimer); perform({type:'fill',field:field.name,value:input.value}); };
        input.oninput = () => { terms.checked = false; clearTimeout(editTimer); editTimer = setTimeout(sync, 900); };
        input.onchange = sync;
        overlay.append(input);
      }
      container.querySelector('[data-text]').textContent = result.text;
      screen.hidden = false; start.hidden = true;
      const ready = (result.contact || result.review) && result.canSubmit;
      container.querySelector('[data-submit]').hidden = !ready;
      container.querySelector('[data-consent]').hidden = !ready;
      container.querySelector('[data-submit]').textContent = result.review ? 'Slutför bokningen' : 'Fortsätt bokningen';
      terms.checked = false;
      const handoff = container.querySelector('[data-handoff]'); handoff.replaceChildren(); handoff.hidden = !result.handoff;
      if (result.handoff) { const link = document.createElement('a'); link.href = result.handoff.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Fortsätt i restaurangens säkra bokningsformulär'; handoff.append(document.createTextNode('Detta val kräver kortgaranti, tillval eller väntelista som slutförs hos restaurangen. Ingen bokning har skickats från Velvet. '), link); }
      if (result.result) status.dataset.bookingStatus = result.result.status;
      if (result.mode === 'prepare') container.querySelector('p:nth-child(2)').textContent = 'Bokabords originalformulär. Uppgifter speglas från serverns webbläsare. Kontrollera uppgifterna och godkänn villkoren innan du fortsätter.';
      status.textContent = result.contact ? (result.mode === 'prepare' ? 'Fyll i uppgifterna direkt i formuläret. Ändringar synkas när du lämnar fältet. Bokningen är ännu inte skickad.' : 'Kontaktsteget är nått. Testet stoppar här — ingen bokning har skapats.') : result.blocked ? 'Den åtgärden är spärrad i testläget.' : 'Välj direkt i formuläret. Det här är en livevy från restaurangen.';
      if (result.result) {
        status.textContent = result.result.status === 'confirmed' ? `${restaurantName} har bekräftat bokningen. Referens: ${result.result.reference}` : 'Bokningen är inte verifierad. Skicka inte en ny bokning; resultatet måste kontrolleras.';
        container.querySelector('p:nth-child(2)').textContent = 'Bokabords resultat visas här direkt från serverns webbläsare.';
      }
    } catch (error) { if (error.message === 'auth' && onLogin) onLogin(); status.textContent = error.message === 'other_restaurant' ? 'Du har ett formulär öppet för en annan restaurang. Stäng det där först, eller vänta tio minuter.' : messages[error.message] || 'Kopplingen kunde inte uppdateras. Uppdatera vyn och kontrollera Mina bokningar innan du försöker boka igen.'; }
    finally { busy = false; container.querySelectorAll('button,input,textarea').forEach(b => b.disabled = false);
      if (pendingFields.size) { const [field,value] = pendingFields.entries().next().value; pendingFields.delete(field); await perform({type:'fill',field,value}); }
    }
  }
  start.onclick = () => perform();
  container.querySelector('[data-submit]').onclick = () => { if (!terms.checked) { status.textContent = 'Kontrollera uppgifterna och godkänn villkoren först.'; return; } perform({type:'submit',confirm:true,terms:true}); };
  img.onclick = e => { if (!state || state.contact || state.review || state.result) return; const r = img.getBoundingClientRect(); perform({ type: 'click', x: (e.clientX - r.left) * state.width / r.width, y: (e.clientY - r.top) * state.height / r.height }); };
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
