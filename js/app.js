// VELVET — VIP tables, shared. V1 SPA (no dependencies)

// ---------- Data ----------
let DESTINATIONS = [];
let VENUES = [];
const state = {
  filters: { q: "", dest: "", cat: "", status: "", sort: "priority" },
};

const CATEGORY_GROUPS = [
  { key: "nightclub", label: "Nattklubb", match: /night|hyperclub|open-air|club\b/i },
  { key: "beach", label: "Beach club", match: /beach|floating|cliff/i },
  { key: "day", label: "Day club / Pool", match: /day ?club|pool/i },
  { key: "rooftop", label: "Rooftop", match: /rooftop/i },
  { key: "restaurant", label: "Restaurang / Show", match: /restaurant|dinner|show|tavern/i },
  { key: "apres", label: "Après-ski", match: /après|apres/i },
];

function venueGroup(v) {
  for (const g of CATEGORY_GROUPS) if (g.match.test(v.category)) return g.key;
  return "other";
}

function statusInfo(s) {
  const t = (s || "").toLowerCase();
  if (t.includes("verified") || t.includes("web")) return { cls: "tag-verified", label: "Verifierad" };
  if (t.includes("check")) return { cls: "tag-check", label: "Kontrollera status" };
  return { cls: "tag-research", label: "Research" };
}

// Deterministic mock pricing from scores (EUR)
function packagesFor(v) {
  const base = 200 + v.luxury_score * 260 + v.booking_potential * 90;
  const grp = venueGroup(v);
  const isBeachy = grp === "beach" || grp === "day";
  const pkgs = [];
  if (isBeachy) {
    pkgs.push({ id: "daybed", name: "Premium daybed", desc: "2–4 personer · min-spend ingår", price: Math.round(base * 0.6 / 50) * 50 });
    pkgs.push({ id: "cabana", name: "VIP-cabana", desc: "4–8 personer · service & host", price: Math.round(base * 1.2 / 50) * 50 });
  }
  pkgs.push({ id: "table", name: "VIP-bord", desc: "6–10 personer · dedikerad service", price: Math.round(base * 1.5 / 50) * 50 });
  if (v.luxury_score >= 5) {
    pkgs.push({ id: "front", name: "Front row / Owner's table", desc: "8–12 personer · bästa placering", price: Math.round(base * 2.6 / 50) * 50 });
  }
  return pkgs;
}

const fmtEUR = (n) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ---------- Bookings (localStorage) ----------
const BOOKINGS_KEY = "velvet_bookings_v1";
const loadBookings = () => { try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []; } catch { return []; } };
const saveBookings = (b) => { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(b)); updateBookingBadge(); };

function updateBookingBadge() {
  const n = loadBookings().length;
  const el = document.getElementById("booking-count");
  if (!el) return;
  el.textContent = n;
  el.classList.toggle("hidden", n === 0);
}

// ---------- Helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const view = () => document.getElementById("view");

function pips(n) {
  let h = "";
  for (let i = 1; i <= 5; i++) h += `<div class="score-pip ${i <= n ? "on" : ""}"></div>`;
  return `<div class="dest-scores" title="${n}/5">${h}</div>`;
}

// ---------- Views ----------
function renderHome() {
  const tier1 = DESTINATIONS.filter((d) => d.tier === "Tier 1");
  const top = [...VENUES].sort((a, b) => b.priority_score - a.priority_score).slice(0, 6);
  view().innerHTML = `
  <section class="hero">
    <div class="hero-kicker">Nu i förhandsversion · V1</div>
    <h1>VIP-bord på världens bästa klubbar.<br><em>Dela kostnaden.</em></h1>
    <p>Boka bord, cabanas och daybeds på ${VENUES.length} handplockade lyxställen i ${DESTINATIONS.length} destinationer — och splitta notan med ditt sällskap, automatiskt.</p>
    <div class="hero-cta">
      <a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a>
      <a class="btn btn-ghost" href="#/destinations" data-nav>Se destinationer</a>
    </div>
  </section>

  <div class="stats">
    <div class="stat"><div class="stat-num">${DESTINATIONS.length}</div><div class="stat-label">Destinationer</div></div>
    <div class="stat"><div class="stat-num">${VENUES.length}</div><div class="stat-label">Lyxställen</div></div>
    <div class="stat"><div class="stat-num">${VENUES.filter((v) => v.priority_score >= 90).length}</div><div class="stat-label">Prio 90+</div></div>
    <div class="stat"><div class="stat-num">${VENUES.filter((v) => statusInfo(v.research_status).cls === "tag-verified").length}</div><div class="stat-label">Verifierade</div></div>
  </div>

  <section class="section">
    <div class="section-head">
      <div><h2>Launch-destinationer</h2><div class="sub">Tier 1 — högst densitet av VIP-inventarie</div></div>
      <a class="link-gold" href="#/destinations" data-nav>Alla destinationer →</a>
    </div>
    <div class="dest-grid">${tier1.slice(0, 8).map(destCard).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head">
      <div><h2>Högst prioriterade ställen</h2><div class="sub">Priority score 100 — launch-klara</div></div>
      <a class="link-gold" href="#/venues" data-nav>Alla ${VENUES.length} ställen →</a>
    </div>
    <div class="venue-grid">${top.map(venueCard).join("")}</div>
  </section>`;
  bindVenueCards();
  bindDestCards();
}

function destCard(d) {
  return `
  <div class="dest-card" data-dest="${esc(d.name)}" role="button" tabindex="0" aria-label="Visa ställen i ${esc(d.name)}">
    <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
    <h3>${esc(d.name)}</h3>
    <div class="dest-country">${esc(d.country)} · ${esc(d.region)}</div>
    <div class="dest-meta"><span>Säsong <b>${esc(d.peak_season)}</b></span></div>
    ${pips(d.luxury)}
  </div>`;
}

function renderDestinations() {
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Destinationer</h2><div class="sub">${DESTINATIONS.length} marknader · sorterade efter tier och lyxnivå</div></div>
    </div>
    <div class="dest-grid">
      ${[...DESTINATIONS].sort((a, b) => (a.tier === b.tier ? b.luxury - a.luxury : a.tier.localeCompare(b.tier))).map(destCard).join("")}
    </div>
  </section>`;
  bindDestCards();
}

function bindDestCards() {
  document.querySelectorAll(".dest-card").forEach((el) => {
    const go = () => { state.filters = { q: "", dest: el.dataset.dest, cat: "", status: "", sort: "priority" }; location.hash = "#/venues"; };
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

function venueCard(v) {
  const st = statusInfo(v.research_status);
  return `
  <div class="venue-card venue-card-link" data-id="${esc(v.venue_id)}" role="link" tabindex="0" aria-label="Visa detaljer för ${esc(v.name)}">
    <div class="venue-top">
      <div>
        <div class="venue-name">${esc(v.name)}</div>
        <div class="venue-loc">${esc(v.destination)}</div>
      </div>
      <div class="prio"><span class="prio-num">${v.priority_score}</span><span class="prio-label">Prio</span></div>
    </div>
    <div class="venue-tags">
      <span class="tag">${esc(v.category)}</span>
      <span class="tag ${st.cls}">${st.label}</span>
      ${v.shareable_format ? '<span class="tag tag-verified">Delbar kostnad</span>' : ""}
    </div>
    <div class="venue-note">${esc(v.notes || "")}</div>
    <div class="venue-actions">
      <button class="btn btn-gold btn-sm" data-book="${esc(v.venue_id)}">Boka bord</button>
      ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">Hemsida</a>` : ""}
      ${v.instagram_url ? `<a class="icon-link" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">Instagram</a>` : ""}
    </div>
  </div>`;
}

function applyFilters() {
  const f = state.filters;
  let list = VENUES.filter((v) => {
    if (f.dest && v.destination !== f.dest) return false;
    if (f.cat && venueGroup(v) !== f.cat) return false;
    if (f.status && statusInfo(v.research_status).cls !== f.status) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!`${v.name} ${v.destination} ${v.category} ${v.notes}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  if (f.sort === "priority") list.sort((a, b) => b.priority_score - a.priority_score || a.name.localeCompare(b.name));
  else if (f.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (f.sort === "luxury") list.sort((a, b) => b.luxury_score - a.luxury_score || b.priority_score - a.priority_score);
  return list;
}

function renderVenues() {
  const f = state.filters;
  const dests = [...new Set(VENUES.map((v) => v.destination))].sort();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Ställen</h2><div class="sub">Bordsbokning med delad kostnad — filtrera och boka</div></div>
    </div>
    <div class="filters">
      <input type="search" id="f-q" placeholder="Sök ställe, stad, kategori…" value="${esc(f.q)}" aria-label="Sök">
      <select id="f-dest" aria-label="Destination">
        <option value="">Alla destinationer</option>
        ${dests.map((d) => `<option ${f.dest === d ? "selected" : ""}>${esc(d)}</option>`).join("")}
      </select>
      <select id="f-cat" aria-label="Kategori">
        <option value="">Alla kategorier</option>
        ${CATEGORY_GROUPS.map((g) => `<option value="${g.key}" ${f.cat === g.key ? "selected" : ""}>${g.label}</option>`).join("")}
      </select>
      <select id="f-status" aria-label="Verifiering">
        <option value="">All verifiering</option>
        <option value="tag-verified" ${f.status === "tag-verified" ? "selected" : ""}>Verifierad</option>
        <option value="tag-research" ${f.status === "tag-research" ? "selected" : ""}>Research</option>
        <option value="tag-check" ${f.status === "tag-check" ? "selected" : ""}>Kontrollera status</option>
      </select>
      <select id="f-sort" aria-label="Sortering">
        <option value="priority" ${f.sort === "priority" ? "selected" : ""}>Högst prioritet</option>
        <option value="luxury" ${f.sort === "luxury" ? "selected" : ""}>Mest lyx</option>
        <option value="name" ${f.sort === "name" ? "selected" : ""}>A–Ö</option>
      </select>
      <span class="filter-count" id="f-count"></span>
    </div>
    <div class="venue-grid" id="venue-list"></div>
  </section>`;

  const renderList = () => {
    const list = applyFilters();
    $("#f-count").textContent = `${list.length} av ${VENUES.length}`;
    $("#venue-list").innerHTML = list.length
      ? list.map(venueCard).join("")
      : `<div class="empty-state" style="grid-column:1/-1"><div class="big">🔍</div><h3>Inga träffar</h3><p>Prova att rensa filtren.</p></div>`;
    bindVenueCards();
  };

  $("#f-q").addEventListener("input", (e) => { state.filters.q = e.target.value; renderList(); });
  $("#f-dest").addEventListener("change", (e) => { state.filters.dest = e.target.value; renderList(); });
  $("#f-cat").addEventListener("change", (e) => { state.filters.cat = e.target.value; renderList(); });
  $("#f-status").addEventListener("change", (e) => { state.filters.status = e.target.value; renderList(); });
  $("#f-sort").addEventListener("change", (e) => { state.filters.sort = e.target.value; renderList(); });
  renderList();
}

function bindVenueCards() {
  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = VENUES.find((x) => x.venue_id === btn.dataset.book);
      if (v) openBookingModal(v);
    });
  });
  // Hela kortet öppnar detaljvyn — utom klick på knappar/länkar
  document.querySelectorAll(".venue-card-link").forEach((card) => {
    const go = () => { location.hash = `#/venue/${encodeURIComponent(card.dataset.id)}`; };
    card.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      go();
    });
    card.addEventListener("keydown", (e) => {
      if (e.target !== card) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

// ---------- Venue detail ----------
function scoreMeter(label, val) {
  const n = Math.max(0, Math.min(5, Number(val) || 0));
  const pct = (n / 5) * 100;
  return `
  <div class="meter" role="img" aria-label="${esc(label)}: ${n} av 5">
    <div class="meter-head">
      <span class="meter-label">${esc(label)}</span>
      <span class="meter-val">${n}<span class="meter-max">/5</span></span>
    </div>
    <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function renderVenueDetail(id) {
  const v = VENUES.find((x) => x.venue_id === id);
  if (!v) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>Stället hittades inte</h3>
        <p>Det kan ha tagits bort ur katalogen.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Alla ställen</a></p>
      </div>
    </section>`;
    return;
  }
  const st = statusInfo(v.research_status);
  const dest = DESTINATIONS.find((d) => d.name === v.destination);
  const pkgs = packagesFor(v);
  const fromPrice = Math.min(...pkgs.map((p) => p.price));

  view().innerHTML = `
  <section class="section detail">
    <a class="detail-back" href="#/venues" data-nav>← Alla ställen</a>

    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-kicker">${esc(v.destination)}${dest ? ` · ${esc(dest.country)}` : ""} · ${esc(v.category)}</div>
        <h1 class="detail-name">${esc(v.name)}</h1>
        <div class="venue-tags detail-tags">
          <span class="tag ${st.cls}">${st.label}</span>
          ${v.shareable_format ? '<span class="tag tag-verified">Delbar kostnad</span>' : ""}
          ${v.vip_table_potential ? '<span class="tag">VIP-bord</span>' : ""}
          ${dest ? `<span class="tag">Säsong ${esc(dest.peak_season)}</span>` : ""}
        </div>
        ${v.notes ? `<p class="detail-notes">${esc(v.notes)}</p>` : ""}
        <div class="detail-links">
          ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">Hemsida ↗</a>` : ""}
          ${v.instagram_url ? `<a class="icon-link" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">Instagram ↗</a>` : ""}
          ${v.source_url ? `<a class="icon-link" href="${esc(v.source_url)}" target="_blank" rel="noopener">Källa ↗</a>` : ""}
        </div>
      </div>
      <div class="prio prio-lg" title="Priority score">
        <span class="prio-num">${v.priority_score}</span>
        <span class="prio-label">Priority score</span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-panel">
        <h2 class="detail-panel-title">Betyg</h2>
        <div class="meters">
          ${scoreMeter("Lyx", v.luxury_score)}
          ${scoreMeter("Party", v.party_score)}
          ${scoreMeter("Delbarhet", v.shareability_score)}
          ${scoreMeter("Bokningsbarhet", v.booking_potential)}
        </div>
        <div class="detail-facts">
          <div class="fact"><span class="fact-label">Verifiering</span><span class="fact-val"><span class="tag ${st.cls}">${st.label}</span></span></div>
          <div class="fact"><span class="fact-label">Kategori</span><span class="fact-val">${esc(v.category)}</span></div>
          <div class="fact"><span class="fact-label">Venue-ID</span><span class="fact-val">${esc(v.venue_id)}</span></div>
          ${dest ? `<div class="fact"><span class="fact-label">Region</span><span class="fact-val">${esc(dest.region)}</span></div>` : ""}
        </div>
      </div>

      <div class="detail-panel detail-cta">
        <h2 class="detail-panel-title">Boka & dela kostnaden</h2>
        <p class="detail-cta-sub">Paket från</p>
        <div class="detail-price">${fmtEUR(fromPrice)}</div>
        <p class="detail-cta-note">Välj paket, sällskap och datum — notan splittas automatiskt per person.</p>
        <button class="btn btn-gold" id="d-book" style="width:100%">Boka bord</button>
        <ul class="detail-perks">
          <li>Dedikerad service & host</li>
          <li>Delad kostnad — betala bara din andel</li>
          <li>Avboka kostnadsfritt i förhandsversionen</li>
        </ul>
      </div>
    </div>
  </section>`;

  $("#d-book").addEventListener("click", () => openBookingModal(v));
}

// ---------- Booking modal ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const todayISO = () => new Date().toISOString().slice(0, 10);

function openBookingModal(v) {
  const pkgs = packagesFor(v);
  let sel = pkgs[0];
  let party = 4;
  const guests = []; // { name, email } — mock-inbjudningar, ingen backend

  const root = document.getElementById("modal-root");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Boka ${esc(v.name)}">
      <button class="modal-close" id="m-close" aria-label="Stäng">✕</button>
      <h2>${esc(v.name)}</h2>
      <div class="modal-sub">${esc(v.destination)} · ${esc(v.category)}</div>

      <div class="form-group">
        <label for="m-date">Datum</label>
        <input type="date" id="m-date" min="${todayISO()}" value="${new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)}">
        <div class="field-error hidden" id="err-date" role="alert"></div>
      </div>

      <div class="form-group">
        <label>Välj paket</label>
        <div class="package-list" id="m-pkgs">
          ${pkgs.map((p, i) => `
            <div class="package ${i === 0 ? "selected" : ""}" data-pkg="${p.id}" role="radio" aria-checked="${i === 0}" tabindex="0">
              <div><div class="package-name">${p.name}</div><div class="package-desc">${p.desc}</div></div>
              <div class="package-price">${fmtEUR(p.price)}</div>
            </div>`).join("")}
        </div>
      </div>

      <div class="form-group">
        <label>Antal i sällskapet</label>
        <div class="stepper">
          <button id="m-minus" aria-label="Färre">−</button>
          <span class="stepper-val" id="m-party">4</span>
          <button id="m-plus" aria-label="Fler">+</button>
        </div>
        <div class="stepper-hint" id="m-party-hint"></div>
      </div>

      <div class="form-group">
        <label for="g-name">Bjud in sällskapet <span class="label-optional">(valfritt · mock, inga mejl skickas)</span></label>
        <div class="guest-row">
          <input type="text" id="g-name" placeholder="Namn" autocomplete="off">
          <input type="email" id="g-email" placeholder="E-post" autocomplete="off">
          <button class="btn btn-ghost btn-sm" id="g-add" type="button">Lägg till</button>
        </div>
        <div class="field-error hidden" id="err-guest" role="alert"></div>
        <div class="chip-list" id="g-chips" aria-live="polite"></div>
      </div>

      <div class="split-box">
        <div class="split-per" id="m-per"></div>
        <div class="split-label">per person</div>
        <div class="split-total" id="m-total"></div>
      </div>

      <div class="field-error hidden" id="err-confirm" role="alert"></div>
      <button class="btn btn-gold" id="m-confirm" style="width:100%">Bekräfta bokning</button>
    </div>
  </div>`;

  const minParty = () => Math.max(1, 1 + guests.length); // du + inbjudna gäster
  const setErr = (id, msg) => {
    const el = $("#" + id);
    el.textContent = msg || "";
    el.classList.toggle("hidden", !msg);
  };

  const renderChips = () => {
    $("#g-chips").innerHTML = [
      `<span class="chip chip-self">Du <em>värd</em></span>`,
      ...guests.map((g, i) => `
        <span class="chip">${esc(g.name)}${g.email ? ` <em>${esc(g.email)}</em>` : ""}
          <button type="button" class="chip-x" data-rm="${i}" aria-label="Ta bort ${esc(g.name)}">✕</button>
        </span>`),
    ].join("");
    $("#g-chips").querySelectorAll("[data-rm]").forEach((b) => {
      b.addEventListener("click", () => {
        guests.splice(Number(b.dataset.rm), 1);
        party = Math.max(minParty(), party);
        renderChips(); update();
      });
    });
  };

  const update = () => {
    $("#m-party").textContent = party;
    $("#m-per").textContent = fmtEUR(Math.ceil(sel.price / party));
    $("#m-total").textContent = `Totalt ${fmtEUR(sel.price)} · delas på ${party} personer`;
    $("#m-party-hint").textContent = guests.length
      ? `Du + ${guests.length} ${guests.length === 1 ? "inbjuden gäst" : "inbjudna gäster"}${party > minParty() ? ` + ${party - minParty()} utan namn` : ""}`
      : "";
  };

  const addGuest = () => {
    const name = $("#g-name").value.trim();
    const email = $("#g-email").value.trim();
    if (!name) { setErr("err-guest", "Ange ett namn på gästen."); $("#g-name").focus(); return; }
    if (email && !EMAIL_RE.test(email)) { setErr("err-guest", "E-postadressen ser inte giltig ut."); $("#g-email").focus(); return; }
    if (1 + guests.length + 1 > 20) { setErr("err-guest", "Max 20 personer per bokning."); return; }
    setErr("err-guest", "");
    guests.push({ name, email });
    party = Math.max(party, minParty()); // synka antal med gästlistan
    $("#g-name").value = ""; $("#g-email").value = ""; $("#g-name").focus();
    renderChips(); update();
  };
  $("#g-add").addEventListener("click", addGuest);
  ["g-name", "g-email"].forEach((id) => {
    $("#" + id).addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } });
  });

  root.querySelectorAll("[data-pkg]").forEach((el) => {
    const pick = () => {
      root.querySelectorAll("[data-pkg]").forEach((x) => { x.classList.remove("selected"); x.setAttribute("aria-checked", "false"); });
      el.classList.add("selected"); el.setAttribute("aria-checked", "true");
      sel = pkgs.find((p) => p.id === el.dataset.pkg);
      update();
    };
    el.addEventListener("click", pick);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
  });
  $("#m-minus").addEventListener("click", () => { party = Math.max(minParty(), party - 1); update(); });
  $("#m-plus").addEventListener("click", () => { party = Math.min(20, party + 1); update(); });

  const close = () => { root.innerHTML = ""; document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $("#m-close").addEventListener("click", close);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });

  $("#m-confirm").addEventListener("click", () => {
    // Validering
    const date = $("#m-date").value;
    setErr("err-date", ""); setErr("err-confirm", "");
    if (!date) { setErr("err-date", "Välj ett datum."); $("#m-date").focus(); return; }
    if (date < todayISO()) { setErr("err-date", "Datumet kan inte vara i det förflutna."); $("#m-date").focus(); return; }
    if (!Number.isInteger(party) || party < 1) { setErr("err-confirm", "Sällskapet måste vara minst 1 person."); return; }

    const booking = {
      id: `BK-${Date.now().toString(36).toUpperCase()}`,
      venue_id: v.venue_id, venue: v.name, destination: v.destination,
      date, package: sel.name, total: sel.price,
      party, per_person: Math.ceil(sel.price / party),
      guests: guests.map((g) => ({ name: g.name, email: g.email })),
      created: new Date().toISOString(),
    };
    saveBookings([...loadBookings(), booking]);
    showConfirmation(booking, close);
  });

  renderChips();
  update();
}

function showConfirmation(b, closePrev) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" style="text-align:center" role="dialog" aria-modal="true">
      <div class="confirm-check">✓</div>
      <h2>Bokning bekräftad</h2>
      <div class="modal-sub">${esc(b.id)}</div>
      <p style="color:var(--text-dim); margin-bottom:8px">${esc(b.package)} på <b>${esc(b.venue)}</b>, ${esc(b.destination)}</p>
      <p style="color:var(--text-dim)">${esc(b.date)} · ${b.party} personer</p>
      ${(b.guests || []).length ? `
      <div class="confirm-guests">
        <div class="confirm-guests-title">Sällskap</div>
        <div class="chip-list" style="justify-content:center">
          <span class="chip chip-self">Du <em>värd</em></span>
          ${b.guests.map((g) => `<span class="chip">${esc(g.name)}${g.email ? ` <em>${esc(g.email)}</em>` : ""}</span>`).join("")}
        </div>
        <div class="confirm-guests-note">Inbjudningar skickas när betalningen aktiveras (mock i V1).</div>
      </div>` : ""}
      <div class="split-box">
        <div class="split-per">${fmtEUR(b.per_person)}</div>
        <div class="split-label">per person</div>
        <div class="split-total">Totalt ${fmtEUR(b.total)}</div>
      </div>
      <div style="display:flex; gap:10px; justify-content:center">
        <a class="btn btn-gold" href="#/bookings" data-nav id="c-go">Mina bokningar</a>
        <button class="btn btn-ghost" id="c-close">Fortsätt utforska</button>
      </div>
    </div>
  </div>`;
  const close = () => { root.innerHTML = ""; };
  $("#c-close").addEventListener("click", close);
  $("#c-go").addEventListener("click", close);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
}

function renderBookings() {
  const bookings = loadBookings();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Mina bokningar</h2><div class="sub">${bookings.length} ${bookings.length === 1 ? "bokning" : "bokningar"}</div></div>
    </div>
    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>Inga bokningar ännu</h3>
        <p>Hitta ett VIP-bord och dela kostnaden med ditt sällskap.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a></p>
      </div>` :
      bookings.map((b) => `
      <div class="booking-card">
        <div class="booking-info">
          <h3>${esc(b.venue)}</h3>
          <div class="booking-meta">${esc(b.destination)} · ${esc(b.date)} · ${esc(b.package)} · ${b.party} personer · ${esc(b.id)}</div>
          ${(b.guests || []).length ? `
          <div class="chip-list booking-guests">
            <span class="chip chip-self">Du <em>${fmtEUR(b.per_person)}</em></span>
            ${b.guests.map((g) => `<span class="chip">${esc(g.name)} <em>${fmtEUR(b.per_person)}</em></span>`).join("")}
          </div>` : ""}
        </div>
        <div style="display:flex; gap:14px; align-items:center">
          <div class="booking-price">
            <div class="per">${fmtEUR(b.per_person)} <span style="font-size:12px;color:var(--text-faint)">/person</span></div>
            <div class="total">Totalt ${fmtEUR(b.total)}</div>
          </div>
          <button class="btn btn-ghost btn-sm btn-danger" data-cancel="${esc(b.id)}">Avboka</button>
        </div>
      </div>`).join("")}
  </section>`;

  document.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      saveBookings(loadBookings().filter((b) => b.id !== btn.dataset.cancel));
      renderBookings();
    });
  });
}

// ---------- Router ----------
const routes = {
  "": renderHome,
  "#/": renderHome,
  "#/destinations": renderDestinations,
  "#/venues": renderVenues,
  "#/bookings": renderBookings,
};

function route() {
  const h = location.hash;
  let fn = routes[h];
  if (!fn) {
    const m = h.match(/^#\/venue\/(.+)$/);
    if (m) fn = () => renderVenueDetail(decodeURIComponent(m[1]));
  }
  (fn || renderHome)();
  window.scrollTo(0, 0);
  const active = h.startsWith("#/venue/") ? "#/venues" : (h || "#/");
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === active);
  });
}

// ---------- Init ----------
async function init() {
  const [d, v] = await Promise.all([
    fetch("data/destinations.json").then((r) => r.json()),
    fetch("data/venues.json").then((r) => r.json()),
  ]);
  DESTINATIONS = d;
  VENUES = v;
  window.addEventListener("hashchange", route);
  route();
  updateBookingBadge();
}

init();
