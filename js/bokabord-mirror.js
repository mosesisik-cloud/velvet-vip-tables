// Actual provider pixels from an isolated server browser, never a provider iframe.
export function mountBokabordMirror(container, api, { restaurantId = 'curated-STO-zink-italian-cuisine', restaurantName = 'Zink', onLogin = null } = {}) {
  container.innerHTML = `<div class="booking-source"><span>Bokning via Bokabord</span><span>Utan Velvet-konto</span></div><p class="booking-intro">Välj datum, tid och antal gäster.</p><button class="btn btn-gold" data-start>Hitta ett bord</button><p role="status" aria-live="polite" data-status></p><div data-screen hidden><div data-stage style="position:relative"><img data-image alt="Restaurangens bokningsformulär" style="display:block;width:100%;cursor:pointer"><div data-inputs></div><span class="booking-click" hidden aria-hidden="true" data-click></span></div><div class="booking-navigation"><button class="btn" data-up aria-label="Visa övre delen av formuläret">↑ Upp</button><button class="btn" data-down aria-label="Visa nedre delen av formuläret">↓ Ned</button><button class="btn" data-refresh>Uppdatera</button><button class="btn" data-close>Stäng</button></div><label data-consent hidden><input type="checkbox" data-terms> Jag har kontrollerat uppgifterna och godkänner <a href="https://www.waiteraid.com/terms/" target="_blank" rel="noopener">Bokabords villkor</a> och har läst <a href="https://www.waiteraid.com/privacy-policy/" target="_blank" rel="noopener">personuppgiftspolicyn</a>.</label><button class="btn btn-gold" data-submit hidden>Fortsätt</button><p data-handoff hidden></p><details class="booking-accessible"><summary>Visa formuläret som text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details></div>`;
  const status = container.querySelector('[data-status]');
  const start = container.querySelector('[data-start]');
  const screen = container.querySelector('[data-screen]');
  const img = container.querySelector('[data-image]');
  let state, busy = false, disposed = false;
  const pendingFields = new Map();
  let editTimer;
  const overlay = container.querySelector('[data-inputs]');
  function syncPending() {
    clearTimeout(editTimer);
    if (busy || !pendingFields.size || disposed) return;
    const fields = Object.fromEntries(pendingFields);
    pendingFields.clear();
    perform({type:'fill',fields});
  }
  function controls() {
    container.querySelectorAll('button').forEach(b => b.disabled = busy || pendingFields.size > 0);
    overlay.querySelectorAll('input,textarea').forEach(b => b.disabled = busy && !state?.contact);
    terms.disabled = busy || pendingFields.size > 0;
    container.querySelector('[data-submit]').disabled = busy || pendingFields.size > 0;
  }
  const terms = container.querySelector('[data-terms]');
  const endpoint = '/restaurant-bookings/mirror';
  const messages = { rate_limit: 'Många uppdateringar på kort tid. Vänta en minut och tryck på Uppdatera.', busy: 'Formuläret uppdateras redan. Vänta ett ögonblick.', auth: 'Bokningssessionen kunde inte öppnas. Uppdatera sidan och försök igen.', mirror_disabled: 'Bokningen är tillfälligt otillgänglig.', capacity: 'Många bokar just nu. Försök igen om en liten stund.', session_expired: 'Sessionen har gått ut. Öppna bokningen igen.', session_exists: 'Du har redan en bokning öppen. Stäng den först.', contact_stop: 'Kontaktsteget är nått. Inga uppgifter eller bokningar skickas i testläget.', stale_view: 'Formuläret har uppdaterats. Tryck på Uppdatera för att fortsätta.' };
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function perform(action) {
    if (disposed) return;
    if (busy) { if (action?.type === 'fill') for (const [field,value] of Object.entries(action.fields)) pendingFields.set(field,value); return; }
    let succeeded = false;
    busy = true; container.setAttribute('aria-busy','true');
    if (action?.type !== 'fill') status.textContent = state ? 'Uppdaterar…' : 'Öppnar bokningen…';
    controls();
    try {
      const result = state ? await post(`${endpoint}/${state.id}/action`, { ...action, revision: state.revision }) : await post(endpoint, { restaurantId, resume:true, width: Math.max(320, Math.round(container.clientWidth)) });
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
      const rendered = new Set();
      const labels = {firstname:'Förnamn',lastname:'Efternamn',email:'E-postadress',phone:'Mobiltelefon',comment:'Önskemål'};
      for (const field of result.fields || []) {
        const rect = field.rect;
        if (!rect || rect.y < 0 || rect.y + rect.height > result.height) continue;
        rendered.add(field.name);
        const existing = overlay.querySelector(`[data-provider-field="${field.name}"]`);
        const input = existing || document.createElement(field.name === 'comment' ? 'textarea' : 'input');
        if (field.name !== 'comment') input.type = field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'text';
        input.setAttribute('aria-label', labels[field.name]);
        input.dataset.providerField = field.name;
        if (document.activeElement !== input) input.value = pendingFields.has(field.name) ? pendingFields.get(field.name) : field.value;
        input.dataset.verifiedValue = field.value;
        input.style.cssText = `position:absolute;box-sizing:border-box;left:${100*rect.x/result.width}%;top:${100*rect.y/result.height}%;width:${100*rect.width/result.width}%;height:${100*rect.height/result.height}%;background:${document.activeElement === input || pendingFields.has(field.name) ? 'white' : 'transparent'};color:${document.activeElement === input || pendingFields.has(field.name) ? '#222' : 'transparent'};border:0;outline:${document.activeElement === input ? '2px solid #d5b880' : '0'};resize:none;padding:8px;font:16px Arial;`;
        input.onfocus = () => {input.style.background='white';input.style.color='#222';input.style.outline='2px solid #d5b880';};
        input.onblur = () => {input.style.outline='0';if(input.value === input.dataset.verifiedValue){input.style.background='transparent';input.style.color='transparent';}syncPending();};
        input.oninput = () => {
          terms.checked = false;
          pendingFields.set(field.name, input.value);
          controls(); clearTimeout(editTimer); editTimer = setTimeout(syncPending, 150);
        };
        if (!existing) overlay.append(input);
      }
      for (const input of overlay.children) if (!rendered.has(input.dataset.providerField)) input.remove();
      container.querySelector('[data-text]').textContent = result.text;
      screen.hidden = false; start.hidden = true;
      const ready = (result.contact || result.review) && result.canSubmit;
      container.querySelector('[data-submit]').hidden = !ready;
      container.querySelector('[data-consent]').hidden = !ready;
      container.querySelector('[data-submit]').textContent = result.review ? 'Slutför bokningen' : 'Kontrollera bokningen';
      terms.checked = false;
      const handoff = container.querySelector('[data-handoff]'); handoff.replaceChildren(); handoff.hidden = !result.handoff;
      if (result.handoff) { const link = document.createElement('a'); link.href = result.handoff.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Fortsätt hos Bokabord';
        const explanations = {card_required:'Det här valet kräver kortgaranti.',products_required:'Det här valet har tillval som behöver hanteras hos restaurangen.',waitlist:'Den här tiden erbjuder en väntelista.',provider_reservation_required:'Restaurangen behöver hantera reservationen i sitt eget bokningsflöde.'};
        handoff.append(document.createTextNode(`${explanations[result.handoff.reason] || 'Det här valet behöver slutföras hos restaurangen.'} Fortsätt via Bokabord för att slutföra. Ingen bokning har skickats från Velvet. `), link); }
      if (result.result) status.dataset.bookingStatus = result.result.status;
      if (result.mode === 'prepare') container.querySelector('.booking-intro').hidden = true;
      status.textContent = result.contact ? (result.mode === 'prepare' ? 'Fyll i dina kontaktuppgifter. Du får kontrollera bokningen innan den skickas.' : 'Kontaktsteget är nått. Testet stoppar här — ingen bokning har skapats.') : result.handoff ? 'Fortsätt hos Bokabord för det här valet.' : result.blocked ? 'Det här steget kunde inte genomföras.' : '';
      if (result.result) {
        status.textContent = result.result.status === 'confirmed' ? `${restaurantName} har bekräftat bokningen. Referens: ${result.result.reference}` : 'Bokningen är inte verifierad. Skicka inte en ny bokning; resultatet måste kontrolleras.';
        container.querySelector('.booking-intro').hidden = true;
      }
      succeeded = true;
    } catch (error) { if (action?.type === 'fill') for (const [field,value] of Object.entries(action.fields)) if (!pendingFields.has(field)) pendingFields.set(field,value); if (error.message === 'auth' && onLogin) onLogin(); status.textContent = error.message === 'other_restaurant' ? 'Du har ett formulär öppet för en annan restaurang. Stäng det där först, eller vänta tio minuter.' : messages[error.message] || 'Kopplingen kunde inte uppdateras. Uppdatera vyn och kontrollera Mina bokningar innan du försöker boka igen.'; }
    finally { busy = false; container.setAttribute('aria-busy','false'); container.querySelector('[data-click]').hidden=true; controls(); if (succeeded) syncPending(); }
  }
  start.onclick = () => perform();
  container.querySelector('[data-submit]').onclick = () => { if (busy || pendingFields.size) return; if (!terms.checked) { status.textContent = 'Kontrollera uppgifterna och godkänn villkoren först.'; return; } perform({type:'submit',confirm:true,terms:true}); };
  img.onclick = e => { if (busy || !state || state.contact || state.review || state.result) return; const r = img.getBoundingClientRect(); const marker=container.querySelector('[data-click]'); marker.style.left=`${100*(e.clientX-r.left)/r.width}%`; marker.style.top=`${100*(e.clientY-r.top)/r.height}%`; marker.hidden=false; perform({ type: 'click', x: (e.clientX - r.left) * state.width / r.width, y: (e.clientY - r.top) * state.height / r.height }); };
  container.querySelector('[data-up]').onclick = () => perform({ type: 'scroll', dy: -500 });
  container.querySelector('[data-down]').onclick = () => perform({ type: 'scroll', dy: 500 });
  container.querySelector('[data-refresh]').onclick = () => perform({ type: 'refresh' });
  async function close() {
    if (busy) return;
    if (state) await api(`${endpoint}/${state.id}`, { method: 'DELETE' });
    clearTimeout(editTimer); pendingFields.clear(); overlay.replaceChildren();
    state = null; screen.hidden = true; start.hidden = false; img.removeAttribute('src'); status.textContent = 'Bokningsformuläret är stängt.';
  }
  container.querySelector('[data-close]').onclick = close;
  const observer = new MutationObserver(() => { if (!container.isConnected) { disposed = true; close(); observer.disconnect(); } });
  observer.observe(document.body, { childList: true, subtree: true });
}
