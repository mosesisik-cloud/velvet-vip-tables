// VELVET — VIP tables, shared. V2 SPA (no dependencies)

// ---------- Data ----------
let DESTINATIONS = [];
let VENUES = [];
let VENUE_IMAGES = {}; // venue_id -> bild från ställets egen hemsida (data/venue-images.json)
let VENUE_EVENTS = { fetched: null, venues: {} }; // kommande events per venue (data/venue-events.json)
const state = {
  filters: { q: "", dest: "", cat: "", status: "", price: "", sort: "priority" },
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

// ---------- Venue-bilder (V2) ----------
function venuePhoto(v) {
  // Endast ställets egen bild (hämtad från deras officiella hemsida).
  // Saknas riktig bild visas gradient-emblemet.
  const u = VENUE_IMAGES[v.venue_id];
  return (typeof u === "string" && /^https?:\/\//.test(u)) ? u : null;
}
// Bildblock med emblem-fallback under: emblemet syns medan bilden laddar
// och tar över permanent om den misslyckas (onerror → .img-fail).
// { eager: true } för LCP-bilder (detalj-heron): laddas direkt med hög prioritet;
// kort i listor förblir lazy så mobil inte laddar 120 bilder i onödan.
function venueMediaHTML(v, cls, { eager = false } = {}) {
  const url = venuePhoto(v);
  const img = url ? `
    <img src="${esc(url)}" alt="${esc(v.name)} — ${esc(v.category || "")}" loading="${eager ? "eager" : "lazy"}"${eager ? ` fetchpriority="high"` : ""} decoding="async"
         onerror="this.closest('.${cls}').classList.add('img-fail')">` : "";
  return `
  <div class="${cls}${url ? "" : " img-fail"}">
    <div class="dest-emblem venue-media-emblem" aria-hidden="true" style="--h:${destHue(v.destination_code)}">${esc(v.destination_code || "")}</div>${img}
  </div>`;
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

// Defensiv: icke-numeriskt in (t.ex. manipulerad localStorage) → 0 € i stället för "NaN"
const fmtEUR = (n) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

// ---------- Prisklass (€–€€€€) ----------
// Härleds deterministiskt ur billigaste paketets pris. Trösklarna är kalibrerade
// mot faktiska datat (från-pris 950–2950 €) så att alla fyra klasser förekommer:
// € <2500 (44 st) · €€ 2500–2799 (11) · €€€ 2800–2949 (20) · €€€€ ≥2950 (45).
const PRICE_TIERS = [
  { n: 1, max: 2500, label: "Under 2 500 €" },
  { n: 2, max: 2800, label: "2 500–2 799 €" },
  { n: 3, max: 2950, label: "2 800–2 949 €" },
  { n: 4, max: Infinity, label: "Från 2 950 €" },
];
const fromPriceFor = (v) => Math.min(...packagesFor(v).map((p) => p.price));
function priceTier(v) {
  const from = fromPriceFor(v);
  const t = PRICE_TIERS.find((x) => from < x.max) || PRICE_TIERS[PRICE_TIERS.length - 1];
  return { n: t.n, sym: "€".repeat(t.n), from };
}
// Guldfärgade €-tecken: aktiva i guld, resten dimmade upp till fyra
function priceTierHTML(v, extraClass = "") {
  const t = priceTier(v);
  return `<span class="price-tier${extraClass ? ` ${extraClass}` : ""}" title="Prisklass ${t.sym} · paket från ${fmtEUR(t.from)}" role="img" aria-label="Prisklass ${t.n} av 4, paket från ${fmtEUR(t.from)}">${t.sym}<span class="price-tier-off" aria-hidden="true">${"€".repeat(4 - t.n)}</span></span>`;
}

// ---------- Bookings (localStorage) ----------
// Defensivt: getItem/parse kan kasta (private mode, korrupt data) och innehållet
// kan vara vad som helst — behåll bara objekt med giltigt id.
const BOOKINGS_KEY = "velvet_bookings_v1";
const loadBookings = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKINGS_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter((b) => b && typeof b === "object" && !Array.isArray(b) && typeof b.id === "string" && b.id);
  } catch { return []; }
};
const saveBookings = (b) => {
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(b)); }
  catch {
    // Quota full eller lagring blockerad — appen ska inte krascha, men säg till.
    showToast("Kunde inte spara — lagringsutrymmet är fullt eller blockerat.");
  }
  updateBookingBadge();
};

// Diskret toast för icke-blockerande fel
let toastTimer = null;
function showToast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
}

function updateBookingBadge() {
  const n = loadBookings().length;
  const el = document.getElementById("booking-count");
  if (!el) return;
  el.textContent = n;
  el.classList.toggle("hidden", n === 0);
}

// ---------- Favoriter (localStorage) + delbar lista ----------
const FAVS_KEY = "velvet_favs_v1";
const loadFavs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVS_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter((id) => typeof id === "string" && id);
  } catch { return []; }
};
const saveFavs = (ids) => {
  try { localStorage.setItem(FAVS_KEY, JSON.stringify([...new Set(ids)])); }
  catch { showToast("Kunde inte spara favoriter — lagringsutrymmet är fullt eller blockerat."); }
  updateFavBadge();
};
const isFav = (id) => loadFavs().includes(id);
function toggleFav(id) {
  const cur = loadFavs();
  saveFavs(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  return isFav(id);
}
function updateFavBadge() {
  const n = loadFavs().length;
  const el = document.getElementById("fav-count");
  if (!el) return;
  el.textContent = n;
  el.classList.toggle("hidden", n === 0);
}
function favBtnHTML(id) {
  const on = isFav(id);
  return `<button class="fav-btn" type="button" data-fav="${esc(id)}" aria-pressed="${on}" title="${on ? "Sparad" : "Spara"}" aria-label="${on ? "Ta bort från favoriter" : "Spara som favorit"}">
    <svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12.1 21s-7.2-4.5-9.6-8.3C.3 9.3 2.2 5.4 6.3 5.4c2.1 0 3.5 1.3 4.4 2.6.9-1.3 2.3-2.6 4.4-2.6 4.1 0 6 3.9 3.8 7.3-2.4 3.8-9.6 8.3-9.6 8.3z"/></svg>
  </button>`;
}
function bindFavButtons(root = document) {
  root.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = toggleFav(btn.dataset.fav);
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Ta bort från favoriter" : "Spara som favorit");
      btn.title = on ? "Sparad" : "Spara";
      const svg = btn.querySelector("svg");
      if (svg) svg.setAttribute("fill", on ? "currentColor" : "none");
    });
  });
}

// ---------- Concierge: förfrågan (inte fake-bokning) ----------
const CONCIERGE_MAIL = "gabrielhadodo@gmail.com";
const HOST_KEY = "velvet_host_v1";
const loadHost = () => {
  try {
    const h = JSON.parse(sessionStorage.getItem(HOST_KEY) || localStorage.getItem(HOST_KEY));
    if (h && typeof h === "object") return { name: String(h.name || ""), email: String(h.email || ""), phone: String(h.phone || "") };
  } catch {}
  return { name: "", email: "", phone: "" };
};
const saveHost = (h) => {
  try {
    localStorage.setItem(HOST_KEY, JSON.stringify(h));
    sessionStorage.setItem(HOST_KEY, JSON.stringify(h));
  } catch {}
};

function icsFor(b) {
  const ymd = String(b.date || "").replace(/-/g, "");
  const uid = `${b.id}@velvet.app`;
  const summary = `VELVET · ${b.venue}`;
  const desc = [
    `Förfrågan ${b.id} (ej bekräftad bokning).`,
    `${b.package} · ${b.party} personer · indikativt ${fmtEUR(b.per_person)}/person.`,
    `Länk: ${shareLinkFor(b)}`,
  ].join("\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VELVET//Concierge//SV", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${ymd}T120000Z`,
    `DTSTART;VALUE=DATE:${ymd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${b.venue}, ${b.destination}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
function inviteTextFor(b) {
  return [
    `Du är bjuden till ${b.venue} (${b.destination}).`,
    `${b.date} · ${b.package} · ${b.party} personer.`,
    `Indikativ andel: ${fmtEUR(b.per_person)} per person (totalt ${fmtEUR(b.total)}).`,
    `VELVET-teamet bokar bordet — detta är en förfrågan, inte en bekräftad reservation.`,
    `Gå med: ${shareLinkFor(b)}`,
  ].join("\n");
}

async function sendConciergeRequest(b) {
  const payload = {
    _subject: `VELVET-förfrågan ${b.id} · ${b.venue} ${b.date}`,
    id: b.id,
    venue: b.venue,
    venue_id: b.venue_id,
    destination: b.destination,
    date: b.date,
    package: b.package,
    party: b.party,
    total_indicative_eur: b.total,
    per_person_indicative_eur: b.per_person,
    host_name: b.host?.name || "",
    host_email: b.host?.email || "",
    host_phone: b.host?.phone || "",
    guests: (b.guests || []).map((g) => `${g.name}${g.email ? ` <${g.email}>` : ""}`).join(", "),
    note: "Förfrågan från VELVET-appen. INTE en bekräftad bokning — återkoppla till värden.",
  };
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${CONCIERGE_MAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) return "sent";
  } catch {}
  return "local";
}
function mailtoFor(b) {
  const subject = encodeURIComponent(`VELVET-förfrågan ${b.id} · ${b.venue}`);
  const body = encodeURIComponent(inviteTextFor(b) + `\n\nVärd: ${b.host?.name || ""} ${b.host?.email || ""} ${b.host?.phone || ""}`);
  return `mailto:${CONCIERGE_MAIL}?subject=${subject}&body=${body}`;
}

function setTitle(t) {
  document.title = t ? `${t} · VELVET` : "VELVET — VIP-bord. Delad lyx.";
}

// ---------- Dela bokning (base64-länk, ingen backend) ----------
// URL-säker base64 av unicode-JSON: + / = ersätts så länken tål kopiering överallt.
const b64urlEncode = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s) => {
  const norm = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const b64 = norm + "=".repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(b64);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
};

function shareLinkFor(b) {
  const payload = {
    id: b.id, venue_id: b.venue_id, venue: b.venue, destination: b.destination,
    date: b.date, package: b.package, total: b.total, party: b.party, per_person: b.per_person,
  };
  return `${location.origin}${location.pathname}#/join/${b64urlEncode(payload)}`;
}

// Tolka inbjudnings-payload graciöst: trasig base64/JSON eller orimliga fält → null.
function parseInvite(raw) {
  let p;
  try { p = b64urlDecode(raw); } catch { return null; }
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  if (typeof p.id !== "string" || !p.id) return null;
  if (typeof p.venue !== "string" || !p.venue) return null;
  const party = Number(p.party), total = Number(p.total);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (!Number.isInteger(party) || party < 1 || party > 99) return null;
  const per = Number(p.per_person);
  return {
    id: p.id, venue_id: String(p.venue_id || ""), venue: p.venue,
    destination: String(p.destination || ""), date: String(p.date || ""),
    package: String(p.package || ""), total, party,
    per_person: Number.isFinite(per) && per > 0 ? per : Math.ceil(total / party),
  };
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    // Fallback (t.ex. utan clipboard-behörighet): dold textarea + execCommand
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  }
}

// ---------- Helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Datastyrda "tal" kan vara vad som helst i JSON — tvinga till number innan de hamnar i HTML
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const $ = (sel, root = document) => root.querySelector(sel);
const view = () => document.getElementById("view");

// Fokus-fälla för modaler: håller Tab/Shift+Tab inom containern.
// Returnerar en cleanup-funktion som tar bort lyssnaren.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(container) {
  const handler = (e) => {
    if (e.key !== "Tab") return;
    const els = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (!container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", handler, true);
  return () => document.removeEventListener("keydown", handler, true);
}

// Återställ fokus till elementet som öppnade en modal (om det finns kvar i DOM)
function restoreFocus(el) {
  if (el && document.contains(el) && typeof el.focus === "function") el.focus();
}

function pips(n) {
  const v = Math.max(0, Math.min(5, num(n)));
  let h = "";
  for (let i = 1; i <= 5; i++) h += `<div class="score-pip ${i <= v ? "on" : ""}"></div>`;
  return `<div class="dest-scores" title="${v}/5">${h}</div>`;
}

// ---------- Views ----------
function renderHome() {
  const tier1 = DESTINATIONS.filter((d) => d.tier === "Tier 1");
  const top = [...VENUES].sort((a, b) => b.priority_score - a.priority_score).slice(0, 6);
  view().innerHTML = `
  <section class="hero">
    <div class="hero-media" id="hero-media" aria-hidden="true"></div>
    <div class="hero-kicker">Concierge-förhandsversion · V4</div>
    <h1>VIP-bord på världens bästa klubbar.<br><em>Dela kostnaden.</em></h1>
    <p>Skicka en förfrågan till ${VENUES.length} handplockade lyxställen i ${DESTINATIONS.length} destinationer. VELVET-teamet bokar bordet — ni splittrar notan.</p>
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
  initHeroVideo();
}

// ---------- Hero-video (V2) ----------
// Ambient stämningsvideo i heron (Pexels, fri licens — nattklubb/ljusshow,
// URL:er verifierade HTTP 200 2026-08-20). Laddas EFTER första render
// (dubbel rAF + idle) med preload="metadata" så LCP inte påverkas.
// prefers-reduced-motion → stillbild (postern) istället för video.
// Fel (offline, borttagen fil, CSP …) → elementet tas bort och den
// befintliga gradient-bakgrunden i .hero står kvar som fallback.
const HERO_VIDEO = {
  mp4: "https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4",      // ~8 MB
  mp4Small: "https://videos.pexels.com/video-files/2022395/2022395-sd_960_540_30fps.mp4",   // ~3 MB (mobil)
  poster: "https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&w=1600",
};
function initHeroVideo() {
  const host = document.getElementById("hero-media");
  if (!host) return;
  const fail = () => host.remove(); // gradienten bakom tar över
  const mount = () => {
    if (!document.contains(host) || host.childElementCount) return; // navigerat bort / redan monterad
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const img = new Image();
      img.className = "hero-still";
      img.alt = "";
      img.decoding = "async";
      img.onload = () => host.classList.add("loaded");
      img.onerror = fail;
      img.src = HERO_VIDEO.poster;
      host.appendChild(img);
      return;
    }
    const vid = document.createElement("video");
    vid.muted = true;
    vid.loop = true;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("muted", "");
    vid.preload = "metadata";
    vid.poster = HERO_VIDEO.poster;
    vid.tabIndex = -1;
    vid.disablePictureInPicture = true;
    vid.setAttribute("aria-hidden", "true"); // ren dekor — osynlig för skärmläsare
    vid.addEventListener("error", fail);
    vid.addEventListener("canplay", () => host.classList.add("loaded"), { once: true });
    vid.src = window.innerWidth < 720 ? HERO_VIDEO.mp4Small : HERO_VIDEO.mp4;
    host.appendChild(vid);
    // Växlar användaren till reduced-motion medan sidan är öppen → pausa direkt
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPref = () => {
      if (!document.contains(vid)) { mq.removeEventListener("change", onMotionPref); return; }
      if (mq.matches) vid.pause();
      else { const pp = vid.play(); if (pp && typeof pp.catch === "function") pp.catch(() => {}); }
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onMotionPref);
    const p = vid.play();
    // Autoplay blockerad → visa postern som stillbild istället
    if (p && typeof p.catch === "function") p.catch(() => host.classList.add("loaded"));
  };
  // Dubbel rAF garanterar att första paint hunnit ske, sedan idle-tid
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if ("requestIdleCallback" in window) requestIdleCallback(mount, { timeout: 1500 });
    else setTimeout(mount, 200);
  }));
}

// Deterministisk nyans per destinationskod → diskret gradient-emblem
function destHue(code) {
  let h = 0;
  for (const c of String(code || "")) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function destCard(d) {
  return `
  <div class="dest-card" data-code="${esc(d.code)}" role="link" tabindex="0" aria-label="Visa destinationen ${esc(d.name)}">
    <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
    <div class="dest-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
    <h3>${esc(d.name)}</h3>
    <div class="dest-country">${esc(d.country)} · ${esc(d.region)}</div>
    <div class="dest-meta"><span>Säsong <b>${esc(d.peak_season)}</b></span>${(() => { const km = distanceToDest(d); return km != null ? `<span class="dest-km">~${fmtKm(km)} km</span>` : ""; })()}</div>
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
    const go = () => { location.hash = `#/destination/${encodeURIComponent(el.dataset.code)}`; };
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

// ---------- Destination detail ----------
function renderDestinationDetail(code) {
  const d = DESTINATIONS.find((x) => String(x.code).toLowerCase() === String(code).toLowerCase());
  if (!d) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🧭</div>
        <h3>Destinationen hittades inte</h3>
        <p>Koden "${esc(code)}" finns inte i katalogen.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/destinations" data-nav>Alla destinationer</a></p>
      </div>
    </section>`;
    return;
  }
  setTitle(d.name);
  const venues = VENUES.filter((v) => v.destination === d.name)
    .sort((a, b) => b.priority_score - a.priority_score || a.name.localeCompare(b.name));
  const useCases = String(d.use_cases || "").split(",").map((s) => s.trim()).filter(Boolean);

  view().innerHTML = `
  <section class="section detail">
    <a class="detail-back" href="#/destinations" data-nav>← Alla destinationer</a>

    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-kicker">${esc(d.country)} · ${esc(d.region)} · Säsong ${esc(d.peak_season)}</div>
        <h1 class="detail-name">${esc(d.name)}</h1>
        <div class="venue-tags detail-tags">
          <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
          ${useCases.map((u) => `<span class="tag">${esc(u)}</span>`).join("")}
        </div>
        ${d.note ? `<p class="detail-notes"><span class="dest-note-label">Strategisk not</span> ${esc(d.note)}</p>` : ""}
        <div class="detail-links">
          <a class="icon-link" href="#/venues" id="dd-list">Visa i listan →</a>
        </div>
      </div>
      <div class="dest-emblem dest-emblem-lg" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
    </div>

    <div class="detail-grid dest-detail-grid">
      <div class="detail-panel">
        <h2 class="detail-panel-title">Betyg</h2>
        <div class="meters">
          ${scoreMeter("Lyx", d.luxury)}
          ${scoreMeter("Party", d.party)}
          ${scoreMeter("Delbarhet", d.shareability)}
        </div>
      </div>
      <div class="detail-panel">
        <h2 class="detail-panel-title">Fakta</h2>
        <div class="detail-facts" style="margin-top:0; border-top:none; padding-top:0">
          <div class="fact"><span class="fact-label">Land</span><span class="fact-val">${esc(d.country)}</span></div>
          <div class="fact"><span class="fact-label">Region</span><span class="fact-val">${esc(d.region)}</span></div>
          <div class="fact"><span class="fact-label">Tier</span><span class="fact-val"><span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span></span></div>
          <div class="fact"><span class="fact-label">Högsäsong</span><span class="fact-val">${esc(d.peak_season)}</span></div>
          <div class="fact"><span class="fact-label">Ställen i katalogen</span><span class="fact-val">${venues.length}</span></div>
          ${(() => { const km = distanceToDest(d); return km != null ? `<div class="fact"><span class="fact-label">Avstånd från dig</span><span class="fact-val">~${fmtKm(km)} km</span></div>` : ""; })()}
        </div>
      </div>
    </div>

    ${Number.isFinite(d.lat) && Number.isFinite(d.lng) ? `
    <div class="detail-panel dest-map-panel">
      <h2 class="detail-panel-title">På kartan</h2>
      <div class="map-shell map-shell-mini">
        <div id="map-dest" class="map-canvas map-canvas-mini" role="application" aria-label="Karta över ${esc(d.name)} och dess ställen"></div>
        <div class="map-loading" id="dest-map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> Laddar kartan …</div>
      </div>
      <p class="map-note">Ungefärliga positioner — ställena grupperas kring ${esc(d.name)}. <a class="link-gold" href="#/map" data-nav>Hela kartan →</a></p>
    </div>` : ""}

    <div class="section-head" style="margin-top:44px">
      <div><h2>Ställen i ${esc(d.name)}</h2><div class="sub">${venues.length} ${venues.length === 1 ? "ställe" : "ställen"} · sorterade efter prioritet</div></div>
      <a class="link-gold" href="#/venues" id="dd-list-2">Visa i listan →</a>
    </div>
    ${venues.length
      ? `<div class="venue-grid">${venues.map(venueCard).join("")}</div>`
      : `<div class="empty-state"><div class="big">🥂</div><h3>Inga ställen ännu</h3><p>Katalogen för ${esc(d.name)} är under uppbyggnad.</p></div>`}
  </section>`;

  // "Visa i listan" — förifiltrera venue-listan på destinationen
  const goList = (e) => {
    e.preventDefault();
    state.filters = { q: "", dest: d.name, cat: "", status: "", price: "", sort: "priority" };
    location.hash = "#/venues";
  };
  $("#dd-list").addEventListener("click", goList);
  const l2 = $("#dd-list-2");
  if (l2) l2.addEventListener("click", goList);
  bindVenueCards();
  mountDestMap(d, venues);
}

// ---------- Sociala länkar ----------
const IG_ICON = `<svg class="soc-ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.35" fill="currentColor"/></svg>`;
const TIKTOK_ICON = `<svg class="soc-ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M14.2 3v10.9a3.9 3.9 0 1 1-3.4-3.87" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M14.2 4.2c.5 2.6 2.3 4.3 5 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
const FB_ICON = `<svg class="soc-ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M13.4 21v-6.9h2.5l.4-2.9h-2.9V9.3c0-.85.3-1.5 1.6-1.5h1.4V5.2c-.25-.03-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7v2.4H8.3v2.9h2.4V21z" fill="currentColor"/></svg>`;

/** Plocka ut @handle ur en Instagram-URL, t.ex. ".../hiibizaofficial/" → "@hiibizaofficial" */
function igHandle(url) {
  const m = /instagram\.com\/([A-Za-z0-9_.]+)/.exec(url || "");
  return m ? "@" + m[1] : null;
}

function igLinkHTML(v, { arrow = false } = {}) {
  if (!v.instagram_url) return "";
  const handle = igHandle(v.instagram_url) || "Instagram";
  return `<a class="icon-link ig-link" href="${esc(v.instagram_url)}" target="_blank" rel="noopener" aria-label="${esc(v.name)} på Instagram">${IG_ICON}<span class="soc-handle">${esc(handle)}</span>${arrow ? " ↗" : ""}</a>`;
}

function venueCard(v) {
  const st = statusInfo(v.research_status);
  return `
  <div class="venue-card venue-card-link" data-id="${esc(v.venue_id)}" role="link" tabindex="0" aria-label="Visa detaljer för ${esc(v.name)}">
    ${venueMediaHTML(v, "venue-media")}
    ${favBtnHTML(v.venue_id)}
    <div class="venue-top">
      <div>
        <div class="venue-name">${esc(v.name)}</div>
        <div class="venue-loc">${esc(v.destination)} ${priceTierHTML(v)}</div>
      </div>
      <div class="prio"><span class="prio-num">${num(v.priority_score)}</span><span class="prio-label">Prio</span></div>
    </div>
    <div class="venue-tags">
      <span class="tag">${esc(v.category)}</span>
      <span class="tag ${st.cls}">${st.label}</span>
      ${v.shareable_format ? '<span class="tag tag-verified">Delbar kostnad</span>' : ""}
      ${eventsFor(v).length ? `<span class="tag tag-events">🎟 ${eventsFor(v).length} kommande</span>` : ""}
    </div>
    <div class="venue-note">${esc(v.notes || "")}</div>
    <div class="venue-actions">
      <button class="btn btn-gold btn-sm" data-book="${esc(v.venue_id)}">Skicka förfrågan</button>
      ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">Hemsida</a>` : ""}
      ${igLinkHTML(v)}
    </div>
  </div>`;
}

function applyFilters() {
  const f = state.filters;
  let list = VENUES.filter((v) => {
    if (f.dest && v.destination !== f.dest) return false;
    if (f.cat && venueGroup(v) !== f.cat) return false;
    if (f.status && statusInfo(v.research_status).cls !== f.status) return false;
    if (f.price && priceTier(v).n !== Number(f.price)) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!`${v.name} ${v.destination} ${v.category} ${v.notes}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  if (f.sort === "priority") list.sort((a, b) => b.priority_score - a.priority_score || a.name.localeCompare(b.name));
  else if (f.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (f.sort === "luxury") list.sort((a, b) => b.luxury_score - a.luxury_score || b.priority_score - a.priority_score);
  else if (f.sort === "price") list.sort((a, b) => fromPriceFor(a) - fromPriceFor(b) || b.priority_score - a.priority_score || a.name.localeCompare(b.name));
  return list;
}

function parseVenueQuery() {
  const i = location.hash.indexOf("?");
  if (i < 0) return;
  const p = new URLSearchParams(location.hash.slice(i + 1));
  if (p.has("q")) state.filters.q = p.get("q") || "";
  if (p.has("dest")) state.filters.dest = p.get("dest") || "";
  if (p.has("cat")) state.filters.cat = p.get("cat") || "";
  if (p.has("status")) state.filters.status = p.get("status") || "";
  if (p.has("pris")) state.filters.price = p.get("pris") || "";
  if (p.has("sort")) state.filters.sort = p.get("sort") || "priority";
}

function renderVenues() {
  parseVenueQuery();
  const f = state.filters;
  const dests = [...new Set(VENUES.map((v) => v.destination))].sort();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Ställen</h2><div class="sub">Filtrera katalogen och skicka en förfrågan — VELVET-teamet bokar</div></div>
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
      <select id="f-price" aria-label="Prisklass">
        <option value="">Alla prisklasser</option>
        ${PRICE_TIERS.map((t) => `<option value="${t.n}" ${f.price === String(t.n) ? "selected" : ""}>${"€".repeat(t.n)} · ${t.label}</option>`).join("")}
      </select>
      <select id="f-sort" aria-label="Sortering">
        <option value="priority" ${f.sort === "priority" ? "selected" : ""}>Högst prioritet</option>
        <option value="luxury" ${f.sort === "luxury" ? "selected" : ""}>Mest lyx</option>
        <option value="price" ${f.sort === "price" ? "selected" : ""}>Lägst från-pris</option>
        <option value="name" ${f.sort === "name" ? "selected" : ""}>A–Ö</option>
      </select>
      <span class="filter-count" id="f-count" role="status" aria-live="polite" aria-atomic="true"></span>
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

  const syncHash = () => {
    const f = state.filters;
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.dest) p.set("dest", f.dest);
    if (f.cat) p.set("cat", f.cat);
    if (f.status) p.set("status", f.status);
    if (f.price) p.set("pris", f.price);
    if (f.sort && f.sort !== "priority") p.set("sort", f.sort);
    const qs = p.toString();
    const next = qs ? `#/venues?${qs}` : "#/venues";
    if (location.hash !== next) history.replaceState(null, "", next);
  };

  $("#f-q").addEventListener("input", (e) => { state.filters.q = e.target.value; renderList(); syncHash(); });
  $("#f-dest").addEventListener("change", (e) => { state.filters.dest = e.target.value; renderList(); syncHash(); });
  $("#f-cat").addEventListener("change", (e) => { state.filters.cat = e.target.value; renderList(); syncHash(); });
  $("#f-status").addEventListener("change", (e) => { state.filters.status = e.target.value; renderList(); syncHash(); });
  $("#f-price").addEventListener("change", (e) => { state.filters.price = e.target.value; renderList(); syncHash(); });
  $("#f-sort").addEventListener("change", (e) => { state.filters.sort = e.target.value; renderList(); syncHash(); });
  renderList();
}

function bindVenueCards() {
  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
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
  bindFavButtons();
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

const SV_MONTHS = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
function eventsFor(v) {
  const rec = VENUE_EVENTS.venues[v.venue_id];
  return rec && Array.isArray(rec.events) ? rec.events : [];
}
function eventWhen(e) {
  if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
    const [y, m, d] = e.date.split("-").map(Number);
    return `${d} ${SV_MONTHS[m - 1]}`;
  }
  return e.recurring || "";
}
function eventsSectionHTML(v) {
  const evs = eventsFor(v);
  if (!evs.length) return "";
  const rec = VENUE_EVENTS.venues[v.venue_id] || {};
  const rows = evs.map((e) => `
    <li class="event-row">
      <span class="event-when">${esc(eventWhen(e))}</span>
      <span class="event-body">
        <span class="event-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} ↗</a>` : esc(e.title)}</span>
        ${e.note ? `<span class="event-note">${esc(e.note)}</span>` : ""}
      </span>
    </li>`).join("");
  const src = rec.source ? ` · <a href="${esc(rec.source)}" target="_blank" rel="noopener">källa ↗</a>` : "";
  return `
  <div class="detail-panel events-panel">
    <h2 class="detail-panel-title">🎟 Kommande</h2>
    <ul class="event-list">${rows}</ul>
    <p class="events-meta">Hämtat ${esc(VENUE_EVENTS.fetched || "")} från ställets officiella kanaler${src} — dubbelkolla alltid innan du bokar resan.</p>
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

    ${venueMediaHTML(v, "venue-hero-media", { eager: true })}
    ${favBtnHTML(v.venue_id)}
    ${venuePhoto(v) ? `<p class="photo-attr">Bild: ställets officiella hemsida · förhandsvisning, inte kommersiell licens</p>` : ""}

    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-kicker">${esc(v.destination)}${dest ? ` · ${esc(dest.country)}` : ""} · ${esc(v.category)} · ${priceTierHTML(v)}</div>
        <h1 class="detail-name">${esc(v.name)}</h1>
        <div class="venue-tags detail-tags">
          <span class="tag ${st.cls}">${st.label}</span>
          ${v.shareable_format ? '<span class="tag tag-verified">Delbar kostnad</span>' : ""}
          ${v.vip_table_potential ? '<span class="tag">VIP-bord</span>' : ""}
          ${dest ? `<span class="tag">Säsong ${esc(dest.peak_season)}</span>` : ""}
        </div>
        ${v.notes ? `<p class="detail-notes">${esc(v.notes)}</p>` : ""}
        <div class="follow-block">
          ${v.instagram_url ? `
          <div class="follow-ig">
            <div>
              <div class="soc-handle">${esc(igHandle(v.instagram_url) || "Instagram")}</div>
              <p>Följ &amp; inspireras — ställets skyltfönster</p>
            </div>
            <a class="btn btn-gold btn-sm" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">Öppna Instagram</a>
          </div>` : ""}
          <div class="detail-links">
            ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">Hemsida ↗</a>` : ""}
            ${v.tiktok_url ? `<a class="icon-link" href="${esc(v.tiktok_url)}" target="_blank" rel="noopener" aria-label="${esc(v.name)} på TikTok">${TIKTOK_ICON}<span>TikTok</span> ↗</a>` : ""}
            ${v.facebook_url ? `<a class="icon-link" href="${esc(v.facebook_url)}" target="_blank" rel="noopener" aria-label="${esc(v.name)} på Facebook">${FB_ICON}<span>Facebook</span> ↗</a>` : ""}
            ${v.source_url ? `<a class="icon-link" href="${esc(v.source_url)}" target="_blank" rel="noopener">Källa ↗</a>` : ""}
          </div>
        </div>
      </div>
      <div class="prio prio-lg" title="Priority score">
        <span class="prio-num">${num(v.priority_score)}</span>
        <span class="prio-label">Priority score</span>
      </div>
    </div>

    <div class="detail-grid">
      ${eventsSectionHTML(v)}
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
        <h2 class="detail-panel-title">Förfrågan &amp; delad kostnad</h2>
        <p class="detail-cta-sub">Indikativt från ${priceTierHTML(v)}</p>
        <div class="detail-price" id="from-price">${fmtEUR(fromPrice)}</div>
        <div class="from-calc">
          <span class="from-calc-label">Per person vid</span>
          <div class="stepper" role="group" aria-label="Sällskapsstorlek för från-pris">
            <button type="button" id="from-minus" aria-label="Färre">−</button>
            <span class="stepper-val" id="from-party">4</span>
            <button type="button" id="from-plus" aria-label="Fler">+</button>
          </div>
          <span class="from-calc-val" id="from-per">${fmtEUR(Math.ceil(fromPrice / 4))}</span>
        </div>
        <p class="detail-cta-note">VELVET-teamet bokar bordet åt er. Priset är indikativt — klubben sätter det riktiga.</p>
        <button class="btn btn-gold" id="d-book" style="width:100%">Skicka förfrågan</button>
        <ul class="detail-perks">
          <li>Concierge mot klubben — ingen automatisk bokning</li>
          <li>Delad kostnad när bordet är bekräftat</li>
          <li>Inga dragningar i förhandsversionen</li>
        </ul>
      </div>
    </div>
  </section>`;

  $("#d-book").addEventListener("click", () => openBookingModal(v));
  bindFavButtons(view());
  setTitle(v.name);
  let fromParty = 4;
  const paintFrom = () => {
    $("#from-party").textContent = fromParty;
    $("#from-per").textContent = fmtEUR(Math.ceil(fromPrice / fromParty));
  };
  $("#from-minus").addEventListener("click", () => { fromParty = Math.max(1, fromParty - 1); paintFrom(); });
  $("#from-plus").addEventListener("click", () => { fromParty = Math.min(20, fromParty + 1); paintFrom(); });
}

// ---------- Booking modal ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const todayISO = () => new Date().toISOString().slice(0, 10);

function openBookingModal(v) {
  const pkgs = packagesFor(v);
  let sel = pkgs[0];
  let party = 4;
  const guests = [];
  const host0 = loadHost();
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const root = document.getElementById("modal-root");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Förfrågan ${esc(v.name)}" tabindex="-1">
      <button class="modal-close" id="m-close" aria-label="Stäng">✕</button>
      <h2>${esc(v.name)}</h2>
      <div class="modal-sub">${esc(v.destination)} · ${esc(v.category)} · ${priceTierHTML(v)}</div>
      <div class="req-steps" aria-hidden="true">
        <div class="req-step on">1 Datum</div>
        <div class="req-step on">2 Paket</div>
        <div class="req-step on">3 Sällskap</div>
      </div>
      <p class="req-summary" id="m-summary"></p>

      <div class="form-group">
        <label for="m-host">Ditt namn</label>
        <input type="text" id="m-host" autocomplete="name" value="${esc(host0.name)}" placeholder="Namn på värden">
        <div class="field-error hidden" id="err-host" role="alert"></div>
      </div>
      <div class="form-group">
        <label for="m-email">E-post</label>
        <input type="email" id="m-email" autocomplete="email" value="${esc(host0.email)}" placeholder="sarah.b@example.net">
        <div class="field-error hidden" id="err-email" role="alert"></div>
      </div>
      <div class="form-group">
        <label for="m-phone">Mobil <span class="label-optional">(valfritt)</span></label>
        <input type="tel" id="m-phone" autocomplete="tel" value="${esc(host0.phone)}" placeholder="+46 …">
      </div>

      <div class="form-group">
        <label for="m-date">Datum</label>
        <input type="date" id="m-date" min="${todayISO()}" value="${new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)}">
        <div class="field-error hidden" id="err-date" role="alert"></div>
      </div>

      <div class="form-group">
        <label id="lbl-pkgs">Välj paket</label>
        <div class="package-list" id="m-pkgs" role="radiogroup" aria-labelledby="lbl-pkgs">
          ${pkgs.map((p, i) => `
            <div class="package ${i === 0 ? "selected" : ""}" data-pkg="${esc(p.id)}" role="radio" aria-checked="${i === 0}" tabindex="0">
              <div><div class="package-name">${esc(p.name)}</div><div class="package-desc">${esc(p.desc)}</div></div>
              <div class="package-price">${fmtEUR(p.price)}</div>
            </div>`).join("")}
        </div>
      </div>

      <div class="form-group">
        <label id="lbl-party">Antal i sällskapet</label>
        <div class="stepper" role="group" aria-labelledby="lbl-party">
          <button id="m-minus" aria-label="Färre personer">−</button>
          <span class="stepper-val" id="m-party" aria-live="polite" aria-atomic="true">4</span>
          <button id="m-plus" aria-label="Fler personer">+</button>
        </div>
        <div class="stepper-hint" id="m-party-hint"></div>
      </div>

      <div class="form-group">
        <label for="g-name">Bjud in sällskapet <span class="label-optional">(valfritt · namn till concierge-teamet)</span></label>
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

      <p class="price-disclaimer">Indikativt från-pris — klubben sätter det riktiga. Ingen bokning sker förrän VELVET återkommer.</p>
      <div class="field-error hidden" id="err-confirm" role="alert"></div>
      <button class="btn btn-gold" id="m-confirm" style="width:100%">Skicka förfrågan</button>
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
    $("#m-total").textContent = `Indikativt ${fmtEUR(sel.price)} · delas på ${party} personer`;
    const dateEl = $("#m-date");
    const dateTxt = dateEl && dateEl.value ? dateEl.value : "datum";
    $("#m-summary").innerHTML = `<strong>${esc(sel.name)}</strong> · ${esc(dateTxt)} · ${party} pers · ${fmtEUR(Math.ceil(sel.price / party))}/person`;
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

  const pkgEls = [...root.querySelectorAll("[data-pkg]")];
  pkgEls.forEach((el, idx) => {
    const pick = () => {
      pkgEls.forEach((x) => { x.classList.remove("selected"); x.setAttribute("aria-checked", "false"); });
      el.classList.add("selected"); el.setAttribute("aria-checked", "true");
      sel = pkgs.find((p) => p.id === el.dataset.pkg);
      update();
    };
    el.addEventListener("click", pick);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pkgEls[(idx + 1) % pkgEls.length].focus(); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pkgEls[(idx - 1 + pkgEls.length) % pkgEls.length].focus(); }
    });
  });
  $("#m-minus").addEventListener("click", () => { party = Math.max(minParty(), party - 1); update(); });
  $("#m-plus").addEventListener("click", () => { party = Math.min(20, party + 1); update(); });
  $("#m-date").addEventListener("change", update);

  const modalEl = root.querySelector(".modal");
  const untrap = trapFocus(modalEl);
  const cleanup = () => { untrap(); document.removeEventListener("keydown", onKey); };
  const close = () => { cleanup(); root.innerHTML = ""; restoreFocus(opener); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $("#m-close").addEventListener("click", close);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
  modalEl.focus();

  $("#m-confirm").addEventListener("click", async () => {
    const date = $("#m-date").value;
    const hostName = $("#m-host").value.trim();
    const hostEmail = $("#m-email").value.trim();
    const hostPhone = $("#m-phone").value.trim();
    setErr("err-date", ""); setErr("err-confirm", ""); setErr("err-host", ""); setErr("err-email", "");
    if (!hostName) { setErr("err-host", "Ange ditt namn så vi kan återkoppla."); $("#m-host").focus(); return; }
    if (!hostEmail || !EMAIL_RE.test(hostEmail)) { setErr("err-email", "Ange en giltig e-post."); $("#m-email").focus(); return; }
    if (!date) { setErr("err-date", "Välj ett datum."); $("#m-date").focus(); return; }
    if (date < todayISO()) { setErr("err-date", "Datumet kan inte vara i det förflutna."); $("#m-date").focus(); return; }
    if (!Number.isInteger(party) || party < 1) { setErr("err-confirm", "Sällskapet måste vara minst 1 person."); return; }

    const host = { name: hostName, email: hostEmail, phone: hostPhone };
    saveHost(host);
    const booking = {
      id: `RQ-${Date.now().toString(36).toUpperCase()}`,
      venue_id: v.venue_id, venue: v.name, destination: v.destination,
      date, package: sel.name, total: sel.price,
      party, per_person: Math.ceil(sel.price / party),
      guests: guests.map((g) => ({ name: g.name, email: g.email })),
      host,
      status: "requested",
      created: new Date().toISOString(),
    };
    const btn = $("#m-confirm");
    btn.disabled = true;
    btn.textContent = "Skickar …";
    const sent = await sendConciergeRequest(booking);
    booking.delivery = sent;
    saveBookings([...loadBookings(), booking]);
    cleanup();
    showConfirmation(booking, opener);
  });

  renderChips();
  update();
}

function showConfirmation(b, opener) {
  const root = document.getElementById("modal-root");
  const sent = b.delivery === "sent";
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" style="text-align:center" role="dialog" aria-modal="true" aria-label="Förfrågan skickad" tabindex="-1">
      <div class="confirm-check">✓</div>
      <h2>Förfrågan skickad</h2>
      <div class="modal-sub">${esc(b.id)} · ${sent ? "till VELVET-teamet" : "sparad på den här enheten"}</div>
      <p style="color:var(--text-dim); margin-bottom:8px">${esc(b.package)} på <b>${esc(b.venue)}</b>, ${esc(b.destination)}</p>
      <p style="color:var(--text-dim)">${esc(b.date)} · ${num(b.party)} personer</p>
      ${(b.guests || []).length ? `
      <div class="confirm-guests">
        <div class="confirm-guests-title">Sällskap</div>
        <div class="chip-list" style="justify-content:center">
          <span class="chip chip-self">Du <em>värd</em></span>
          ${b.guests.map((g) => `<span class="chip">${esc(g.name)}${g.email ? ` <em>${esc(g.email)}</em>` : ""}</span>`).join("")}
        </div>
        <div class="confirm-guests-note">Gästlistan följer med förfrågan till VELVET-teamet. Inga automatiska mejl till gästerna ännu.</div>
      </div>` : ""}
      <div class="split-box">
        <div class="split-per">${fmtEUR(b.per_person)}</div>
        <div class="split-label">per person</div>
        <div class="split-total">Totalt ${fmtEUR(b.total)}</div>
      </div>
      <p class="price-disclaimer">${sent
        ? "Vi återkommer till din e-post när klubben svarat. Inget bord är reserverat ännu."
        : "Kunde inte nå mejlvägen — förfrågan ligger under Förfrågningar. Du kan också skicka den via din e-postapp."}</p>
      <div class="confirm-actions">
        <a class="btn btn-gold" href="#/bookings" data-nav id="c-go">Mina förfrågningar</a>
        <button class="btn btn-ghost" id="c-copy">Kopiera inbjudningstext</button>
        <a class="btn btn-ghost" id="c-ics" download="${esc(b.id)}.ics" href="${icsFor(b)}">Lägg till i kalendern</a>
        ${sent ? "" : `<a class="btn btn-ghost" href="${mailtoFor(b)}">Öppna i Mail</a>`}
        <button class="btn btn-ghost" id="c-close">Fortsätt utforska</button>
      </div>
    </div>
  </div>`;
  const modalEl = root.querySelector(".modal");
  const untrap = trapFocus(modalEl);
  const close = (refocus = true) => {
    untrap(); document.removeEventListener("keydown", onKey);
    root.innerHTML = "";
    if (refocus) restoreFocus(opener);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $("#c-close").addEventListener("click", close);
  $("#c-go").addEventListener("click", () => close(false));
  const copyBtn = $("#c-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const ok = await copyText(inviteTextFor(b));
      copyBtn.textContent = ok ? "Kopierad ✓" : "Kunde inte kopiera";
    });
  }
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
  modalEl.focus();
}

function renderBookings() {
  const bookings = loadBookings();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Mina förfrågningar</h2><div class="sub">${bookings.length} ${bookings.length === 1 ? "förfrågan" : "förfrågningar"} · concierge, inte automatisk bokning</div></div>
    </div>
    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>Inga förfrågningar ännu</h3>
        <p>Välj ett ställe och skicka en förfrågan — VELVET-teamet tar den mot klubben.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a></p>
      </div>` :
      bookings.map((b) => `
      <div class="booking-card">
        <div class="booking-info">
          <h3>${esc(b.venue)}</h3>
          <div class="booking-meta">${esc(b.destination)} · ${esc(b.date)} · ${esc(b.package)} · ${num(b.party)} personer · ${esc(b.id)}</div>
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
          <button class="btn btn-ghost btn-sm btn-share" data-share="${esc(b.id)}">Dela</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-cancel="${esc(b.id)}">Ta bort</button>
        </div>
      </div>`).join("")}
  </section>`;

  document.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      saveBookings(loadBookings().filter((b) => b.id !== btn.dataset.cancel));
      renderBookings();
    });
  });

  // Dela: kopiera inbjudningslänk till urklipp med feedback på knappen
  document.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const b = loadBookings().find((x) => x.id === btn.dataset.share);
      if (!b || btn.disabled) return;
      btn.disabled = true; // direkt — annars kan snabba dubbelklick passera innan await:en är klar
      const orig = btn.textContent;
      const ok = await copyText(shareLinkFor(b));
      btn.textContent = ok ? "Länk kopierad ✓" : "Kunde inte kopiera";
      btn.classList.toggle("copied", ok);
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove("copied");
        btn.disabled = false;
      }, 1800);
    });
  });
}

// ---------- Inbjudningsvy (#/join/<base64>) ----------
function renderJoin(raw) {
  const inv = parseInvite(raw);
  if (!inv) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🔗</div>
        <h3>Ogiltig inbjudningslänk</h3>
        <p>Länken verkar vara trasig eller ofullständig. Be värden dela en ny länk.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a></p>
      </div>
    </section>`;
    return;
  }

  const v = VENUES.find((x) => x.venue_id === inv.venue_id);
  const meta = [inv.destination, v ? v.category : ""].filter(Boolean).join(" · ");
  const already = loadBookings().some((b) => b.id === inv.id);

  view().innerHTML = `
  <section class="section">
    <div class="invite">
      <div class="invite-card">
        <div class="invite-kicker">Inbjudan · VELVET</div>
        <div class="invite-glass" aria-hidden="true">🥂</div>
        <h1 class="invite-title">Du är bjuden till<br><em>${esc(inv.venue)}</em></h1>
        ${meta ? `<div class="invite-meta">${esc(meta)}</div>` : ""}
        <div class="invite-facts">
          ${inv.date ? `<div class="invite-fact"><span class="k">Datum</span><span class="v">${esc(inv.date)}</span></div>` : ""}
          ${inv.package ? `<div class="invite-fact"><span class="k">Paket</span><span class="v">${esc(inv.package)}</span></div>` : ""}
          <div class="invite-fact"><span class="k">Sällskap</span><span class="v">${inv.party} personer</span></div>
        </div>
        <div class="split-box">
          <div class="split-per">${fmtEUR(inv.per_person)}</div>
          <div class="split-label">din andel per person</div>
          <div class="split-total">Totalt ${fmtEUR(inv.total)} · delas på ${inv.party} personer</div>
        </div>
        <div id="join-cta">
          ${already ? `
            <p class="invite-joined" role="status">✓ Du är redan med i den här förfrågan.</p>
            <a class="btn btn-gold" href="#/bookings" data-nav style="width:100%">Mina förfrågningar</a>` : `
            <button class="btn btn-gold" id="join-btn" style="width:100%">Jag är med 🥂</button>
            <p class="invite-note">Förfrågan sparas under Förfrågningar på den här enheten. Bordet är inte reserverat förrän VELVET återkommer.</p>`}
        </div>
        ${v ? `<a class="icon-link invite-venue-link" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>Se stället →</a>` : ""}
      </div>
    </div>
  </section>`;

  const joinBtn = $("#join-btn");
  if (joinBtn) {
    joinBtn.addEventListener("click", () => {
      if (loadBookings().some((b) => b.id === inv.id)) return; // skydd mot dubbelklick
      saveBookings([...loadBookings(), { ...inv, guests: [], joined: true, created: new Date().toISOString() }]);
      $("#join-cta").innerHTML = `
        <p class="invite-joined" role="status">🥂 Klart — du är med. Förfrågan ligger under Förfrågningar på den här enheten.</p>
        <a class="btn btn-gold" href="#/bookings" data-nav style="width:100%">Mina förfrågningar</a>`;
    });
  }
}

// ---------- Platstjänster: haversine + närmaste destination ----------
// Användarens position sparas per session (sessionStorage) — aldrig obligatoriskt.
const GEO_KEY = "velvet_geo";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// "8,4 km" under en mil, annars heltal med svensk tusentalsavgränsning
function fmtKm(km) {
  return km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km).toLocaleString("sv-SE");
}

function loadGeo() {
  try {
    const g = JSON.parse(sessionStorage.getItem(GEO_KEY));
    if (g && Number.isFinite(g.lat) && Number.isFinite(g.lng)) return g;
  } catch {}
  return null;
}
function saveGeo(lat, lng) {
  try { sessionStorage.setItem(GEO_KEY, JSON.stringify({ lat, lng, ts: Date.now() })); } catch {}
}

function nearestDestination(lat, lng) {
  let best = null;
  for (const d of DESTINATIONS) {
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) continue;
    const km = haversineKm(lat, lng, d.lat, d.lng);
    if (!best || km < best.km) best = { d, km };
  }
  return best;
}

// Avstånd från sparad position till en destination — null om position/koordinat saknas
function distanceToDest(d) {
  const g = loadGeo();
  if (!g || !d || !Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return null;
  return haversineKm(g.lat, g.lng, d.lat, d.lng);
}

// ---------- Karta (V3, Leaflet via CDN) ----------
// Leaflet laddas LAZY först när en kartvy öppnas — unpkg-CDN med SRI-hashar
// (verifierade mot unpkg 2026-08-21). Offline/blockerad CDN → graciös fallback-
// panel med "Försök igen", appen kraschar aldrig. Tiles: CartoDB dark_all
// (OpenStreetMap-data) som matchar appens mörka tema.
const LEAFLET_CDN = {
  css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  cssIntegrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
  js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  jsIntegrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=",
};
let leafletPromise = null;
function ensureLeaflet() {
  if (window.L && typeof window.L.map === "function") return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const fail = (msg) => {
      leafletPromise = null; // nästa försök får injicera på nytt
      reject(new Error(msg));
    };
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CDN.css;
    link.integrity = LEAFLET_CDN.cssIntegrity;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = LEAFLET_CDN.js;
    s.integrity = LEAFLET_CDN.jsIntegrity;
    s.crossOrigin = "anonymous";
    const guard = setTimeout(() => fail("Leaflet-CDN svarade inte i tid"), 12000);
    s.onload = () => {
      clearTimeout(guard);
      if (window.L && typeof window.L.map === "function") resolve(window.L);
      else fail("Leaflet laddades men initierades inte");
    };
    s.onerror = () => { clearTimeout(guard); link.remove(); s.remove(); fail("Kunde inte nå Leaflet-CDN"); };
    document.head.appendChild(s);
  });
  return leafletPromise;
}

// Aktiva Leaflet-instanser rivs vid varje ruttbyte — annars läcker lyssnare
// när vyns DOM skrivs över av nästa render.
let ACTIVE_MAPS = [];
function destroyMaps() {
  ACTIVE_MAPS.forEach((m) => { try { m.remove(); } catch {} });
  ACTIVE_MAPS = [];
}

function darkTileLayer(L) {
  return L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  });
}

// Guldnål i appens designspråk (CSS-ritad droppe, ingen bild-asset)
function goldPin(L, { small = false } = {}) {
  const size = small ? 22 : 30;
  return L.divIcon({
    className: "velvet-pin-wrap",
    html: `<span class="velvet-pin${small ? " velvet-pin-sm" : ""}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

// Diskret markör för användarens egen position
function userDot(L) {
  return L.divIcon({
    className: "velvet-pin-wrap",
    html: `<span class="velvet-user-dot" title="Din position"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Gemensam "Nära mig": känd position direkt, annars geolocation med timeout-vakt.
function locateUser(onFound, onError) {
  const known = loadGeo();
  if (known) { onFound(known); return; }
  if (!("geolocation" in navigator)) { onError(); return; }
  let done = false;
  const guard = setTimeout(() => { if (!done) { done = true; onError(); } }, 10000);
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return;
        done = true; clearTimeout(guard);
        saveGeo(pos.coords.latitude, pos.coords.longitude);
        onFound({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { if (done) return; done = true; clearTimeout(guard); onError(); },
      { timeout: 8000, maximumAge: 300000 }
    );
  } catch { clearTimeout(guard); if (!done) { done = true; onError(); } }
}

// Fallback-panel när CDN inte kan nås (offline etc.) — med retry
function mapFallbackHTML(id) {
  return `
  <div class="map-fallback" role="alert">
    <div class="big" aria-hidden="true">🗺️</div>
    <h3>Kartan kunde inte laddas</h3>
    <p>Kartbiblioteket hämtas från nätet och verkar inte kunna nås just nu.<br>Kontrollera anslutningen och försök igen.</p>
    <button class="btn btn-gold btn-sm" id="${id}">Försök igen</button>
  </div>`;
}

// ---------- Kartvyn (#/map) ----------
function renderMapView() {
  view().innerHTML = `
  <section class="section map-section">
    <div class="section-head">
      <div><h2>Karta</h2><div class="sub">${DESTINATIONS.length} destinationer · ${VENUES.length} ställen — klicka på en guldnål</div></div>
      <button class="btn btn-ghost btn-sm map-near-btn" id="map-near" disabled><span aria-hidden="true">🧭</span> Nära mig</button>
    </div>
    <div class="map-shell">
      <div id="map-all" class="map-canvas" role="application" aria-label="Interaktiv karta över alla destinationer"></div>
      <div class="map-loading" id="map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> Laddar kartan …</div>
    </div>
  </section>`;

  const shell = $(".map-shell");
  const mount = () => {
    ensureLeaflet().then((L) => {
      if (!document.getElementById("map-all")) return; // navigerat bort under laddning
      const status = $("#map-status");
      if (status) status.remove();
      const map = L.map("map-all", { worldCopyJump: true, zoomControl: true });
      ACTIVE_MAPS.push(map);
      darkTileLayer(L).addTo(map);

      const pts = [];
      DESTINATIONS.forEach((d) => {
        if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return;
        pts.push([d.lat, d.lng]);
        const count = VENUES.filter((v) => v.destination === d.name).length;
        L.marker([d.lat, d.lng], { icon: goldPin(L), title: d.name, alt: d.name })
          .addTo(map)
          .bindPopup(`
            <div class="map-pop">
              <div class="map-pop-kicker">${esc(d.country)} · ${esc(d.tier)}</div>
              <div class="map-pop-name">${esc(d.name)}</div>
              <div class="map-pop-meta">${count} ${count === 1 ? "ställe" : "ställen"} · Säsong ${esc(d.peak_season)}</div>
              <a class="map-pop-link" href="#/destination/${encodeURIComponent(d.code)}">Visa destination →</a>
            </div>`);
      });
      if (pts.length) map.fitBounds(pts, { padding: [36, 36] });
      else map.setView([40, 10], 3);

      // "Nära mig" — zooma till användarens position (återanvänd geo-logiken)
      const near = $("#map-near");
      near.disabled = false;
      let userMarker = null;
      near.addEventListener("click", () => {
        if (near.disabled) return;
        near.disabled = true;
        const orig = near.innerHTML;
        near.innerHTML = `<span class="spinner spinner-sm" aria-hidden="true"></span> Hämtar plats …`;
        const done = () => { near.innerHTML = orig; near.disabled = false; };
        locateUser(
          (g) => {
            done();
            if (!ACTIVE_MAPS.includes(map)) return; // vyn har bytts
            if (!userMarker) userMarker = L.marker([g.lat, g.lng], { icon: userDot(L), alt: "Din position" }).addTo(map);
            else userMarker.setLatLng([g.lat, g.lng]);
            map.flyTo([g.lat, g.lng], 7, { duration: 1.2 });
          },
          () => { done(); showToast("Kunde inte hämta din plats — tillåt platsåtkomst och försök igen."); }
        );
      });
    }).catch(() => {
      if (!document.contains(shell)) return;
      shell.innerHTML = mapFallbackHTML("map-retry");
      $("#map-retry").addEventListener("click", renderMapView);
    });
  };
  mount();
}

// Mini-karta på destinationsdetaljen: destinationens venues grupperade kring
// destinationens koordinat (venues saknar egna koordinater i datasetet —
// positionerna är därför ungefärliga, vilket sägs rakt ut under kartan).
function mountDestMap(d, venues) {
  const host = document.getElementById("map-dest");
  if (!host || !Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return;
  ensureLeaflet().then((L) => {
    if (!document.contains(host)) return;
    const status = document.getElementById("dest-map-status");
    if (status) status.remove();
    const map = L.map("map-dest", { scrollWheelZoom: false });
    ACTIVE_MAPS.push(map);
    darkTileLayer(L).addTo(map);

    // Destinationens egen nål i centrum
    L.marker([d.lat, d.lng], { icon: goldPin(L), title: d.name, alt: d.name })
      .addTo(map)
      .bindPopup(`<div class="map-pop"><div class="map-pop-name">${esc(d.name)}</div><div class="map-pop-meta">${esc(d.country)} · ${esc(d.region)}</div></div>`);

    // Venues i en deterministisk ring runt centrum (~2 km) — stabil mellan renderingar
    const pts = [[d.lat, d.lng]];
    const n = venues.length;
    const latRad = d.lat * Math.PI / 180;
    venues.forEach((v, i) => {
      const ang = (2 * Math.PI * i) / Math.max(n, 1) + destHue(v.venue_id) / 360;
      const r = n > 1 ? 0.02 : 0.012;
      const lat = d.lat + Math.sin(ang) * r * 0.75;
      const lng = d.lng + (Math.cos(ang) * r) / Math.max(Math.cos(latRad), 0.2);
      pts.push([lat, lng]);
      L.circleMarker([lat, lng], {
        radius: 7, color: "#d4af5f", weight: 1.5,
        fillColor: "#e8c87e", fillOpacity: 0.55,
      }).addTo(map).bindPopup(`
        <div class="map-pop">
          <div class="map-pop-kicker">${esc(v.category)}</div>
          <div class="map-pop-name">${esc(v.name)}</div>
          <div class="map-pop-meta">Paket från ${fmtEUR(fromPriceFor(v))}</div>
          <a class="map-pop-link" href="#/venue/${encodeURIComponent(v.venue_id)}">Se stället →</a>
        </div>`);
    });
    map.fitBounds(pts, { padding: [30, 30], maxZoom: 13 });
  }).catch(() => {
    const shell = host && host.closest(".map-shell");
    if (!shell || !document.contains(shell)) return;
    shell.innerHTML = mapFallbackHTML("dest-map-retry");
    const btn = document.getElementById("dest-map-retry");
    if (btn) btn.addEventListener("click", () => {
      shell.innerHTML = `
        <div id="map-dest" class="map-canvas map-canvas-mini" role="application" aria-label="Karta över ${esc(d.name)}"></div>
        <div class="map-loading" id="dest-map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> Laddar kartan …</div>`;
      mountDestMap(d, venues);
    });
  });
}

// ---------- Onboarding: hem-destination (land → stad) ----------
// Sparat val: { code: "IBZ" } eller { all: true } ("Visa allt"). Defensiv inläsning.
const HOME_KEY = "velvet_home_destination";
function loadHomeChoice() {
  try {
    const raw = JSON.parse(localStorage.getItem(HOME_KEY));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    if (raw.all === true) return { all: true };
    if (typeof raw.code === "string" && raw.code) return { code: raw.code };
    return null;
  } catch { return null; }
}
function saveHomeChoice(v) {
  try { localStorage.setItem(HOME_KEY, JSON.stringify(v)); } catch {}
  updateNavDest();
}
// Valets destination-objekt — null om "Visa allt", inget val eller okänd kod
function homeDestination() {
  const c = loadHomeChoice();
  if (!c || c.all || !c.code) return null;
  return DESTINATIONS.find((d) => String(d.code).toLowerCase() === c.code.toLowerCase()) || null;
}

function updateNavDest() {
  const el = document.getElementById("nav-dest-name");
  if (!el) return;
  const d = homeDestination();
  el.textContent = d ? d.name : "Alla destinationer";
  // Guldton på väljaren när en hem-destination är vald
  const btn = document.getElementById("nav-dest");
  if (btn) btn.classList.toggle("has-dest", !!d);
}

// Unika länder ur katalogen, med sina destinationer (flest först, sedan A–Ö)
function countryList() {
  const map = new Map();
  for (const d of DESTINATIONS) {
    if (!map.has(d.country)) map.set(d.country, []);
    map.get(d.country).push(d);
  }
  return [...map.entries()]
    .map(([country, dests]) => ({ country, dests: [...dests].sort((a, b) => b.luxury - a.luxury || a.name.localeCompare(b.name, "sv")) }))
    .sort((a, b) => b.dests.length - a.dests.length || a.country.localeCompare(b.country, "sv"));
}

// Helskärms-onboarding i två steg. dismissable=true när den öppnas som "byt destination".
function openOnboarding(opts = {}) {
  const root = document.getElementById("onboarding-root");
  if (!root || root.innerHTML) return; // redan öppen
  const dismissable = !!opts.dismissable;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let step = 1;
  let country = null;
  let untrap = null;
  let closed = false;

  // Platsläge: idle → loading → found/error. Redan känd position → visa direkt.
  const geoSupported = "geolocation" in navigator;
  let geoState = "idle";
  let nearest = null;
  const knownGeo = loadGeo();
  if (knownGeo) {
    nearest = nearestDestination(knownGeo.lat, knownGeo.lng);
    if (nearest) geoState = "found";
  }

  document.body.classList.add("ob-lock");

  // Persistent aria-live-region för geo-status: render() skriver om hela dialogen,
  // så role="status" inuti den annonseras inte pålitligt — den här ligger utanför
  // och överlever varje re-render. Nollställ + kort delay tvingar ny uppläsning.
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  document.body.appendChild(live);
  let liveTimer = null;
  const announce = (msg) => {
    live.textContent = "";
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = msg; }, 50);
  };

  const cleanup = () => {
    if (untrap) untrap();
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("hashchange", onHash);
    document.body.classList.remove("ob-lock");
    clearTimeout(liveTimer);
    live.remove();
  };
  const close = (refocus = true) => {
    closed = true;
    cleanup();
    root.innerHTML = "";
    if (refocus) restoreFocus(opener);
  };

  // Nekad permission, timeout eller saknat stöd → felmeddelande + manuellt val, aldrig krasch.
  // Varje tillståndsbyte annonseras i live-regionen och fokus flyttas till den
  // mest relevanta knappen så tangentbords-/skärmläsaranvändare inte tappas bort.
  const GEO_ERROR_MSG = "Kunde inte hämta din plats — välj destination manuellt nedan.";
  const requestGeo = () => {
    if (!geoSupported) { geoState = "error"; announce(GEO_ERROR_MSG); render("#ob-geo-retry"); return; }
    geoState = "loading";
    announce("Hämtar din plats …");
    render();
    let done = false;
    const fail = () => {
      if (done || closed) return;
      done = true;
      geoState = "error";
      announce(GEO_ERROR_MSG);
      render("#ob-geo-retry");
    };
    const guard = setTimeout(fail, 10000); // fallback om webbläsaren aldrig svarar
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (done || closed) return;
          done = true;
          clearTimeout(guard);
          saveGeo(pos.coords.latitude, pos.coords.longitude);
          nearest = nearestDestination(pos.coords.latitude, pos.coords.longitude);
          geoState = nearest ? "found" : "error";
          if (nearest) {
            announce(`Närmast dig: ${nearest.d.name}, cirka ${fmtKm(nearest.km)} kilometer bort.`);
            render("#ob-geo-choose");
          } else {
            announce(GEO_ERROR_MSG);
            render("#ob-geo-retry");
          }
        },
        () => { clearTimeout(guard); fail(); },
        { timeout: 8000, maximumAge: 300000 }
      );
    } catch { clearTimeout(guard); fail(); }
  };

  const geoPanel = () => {
    if (!geoSupported && geoState !== "error") return "";
    if (geoState === "loading") {
      return `<div class="ob-geo" role="status"><span class="ob-geo-spin" aria-hidden="true"></span> Hämtar din plats …</div>`;
    }
    if (geoState === "found" && nearest) {
      return `
      <div class="ob-geo ob-geo-found" role="status">
        <div class="ob-geo-text">Närmast dig: <b>${esc(nearest.d.name)}</b> <span class="ob-geo-km">(${fmtKm(nearest.km)} km)</span></div>
        <div class="ob-geo-actions">
          <button class="btn btn-gold btn-sm" id="ob-geo-choose">Välj ${esc(nearest.d.name)}</button>
          <button class="btn btn-ghost btn-sm" id="ob-geo-dismiss">Välj manuellt</button>
        </div>
      </div>`;
    }
    if (geoState === "error") {
      return `
      <div class="ob-geo ob-geo-error" role="status">
        Kunde inte hämta din plats — välj manuellt nedan.
        ${geoSupported ? `<button class="btn btn-ghost btn-sm" id="ob-geo-retry">Försök igen</button>` : ""}
      </div>`;
    }
    return `
    <div class="ob-geo">
      <button class="btn btn-ghost btn-sm" id="ob-geo-btn" aria-describedby="ob-geo-hint"><span aria-hidden="true">🧭</span> Använd min plats</button>
      <span class="ob-geo-hint" id="ob-geo-hint">hittar närmaste destination</span>
    </div>`;
  };
  // Direktlänkar/bakåtknapp får aldrig blockeras — ruttbyte stänger onboardingen
  const onHash = () => close(false);
  const onKey = (e) => { if (e.key === "Escape" && dismissable) close(); };
  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", onHash);

  const choose = (d) => {
    saveHomeChoice({ code: d.code });
    state.filters.dest = d.name; // förfiltrera venue-listan på hemdestinationen
    close(false);
    const target = `#/destination/${encodeURIComponent(d.code)}`;
    if (location.hash === target) route(); else location.hash = target;
  };
  const skip = () => {
    saveHomeChoice({ all: true });
    state.filters.dest = "";
    close(false);
    if (!location.hash || location.hash === "#/") route();
  };

  // focusSel: valfritt CSS-mål att fokusera efter re-render (annars dialogen) —
  // så att t.ex. geo-flödet landar fokus på "Välj X"-knappen i stället för toppen.
  const render = (focusSel) => {
    if (untrap) untrap();
    const countries = countryList();
    const inCountry = country ? countries.find((c) => c.country === country) : null;
    const dests = inCountry ? inCountry.dests : [];
    const dlgLabel = step === 1
      ? "Välj din destination — steg 1 av 2, välj land"
      : `Välj din destination — steg 2 av 2, ${country}`;

    root.innerHTML = `
    <div class="ob-overlay" id="ob-overlay">
      <div class="ob" role="dialog" aria-modal="true" aria-label="${esc(dlgLabel)}" tabindex="-1">
        ${dismissable ? `<button class="modal-close ob-close" id="ob-close" aria-label="Stäng">✕</button>` : ""}
        <div class="ob-brand" aria-hidden="true">VELVET<span class="logo-dot">.</span></div>
        <div class="ob-brand-rule" aria-hidden="true"></div>
        <div class="ob-kicker">VIP-bord · Delad lyx</div>
        ${step === 1 ? `
        <h1 class="ob-title">Var vill du <em>fira</em>?</h1>
        <p class="ob-sub">Välj land och destination så skräddarsyr vi utbudet. Du kan byta när som helst via väljaren uppe till höger.</p>
        <div class="ob-step">Steg 1 av 2 · Välj land</div>
        ${geoPanel()}
        <div class="ob-grid">
          ${countries.map((c, i) => `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-country="${esc(c.country)}" role="button" tabindex="0" aria-label="Välj ${esc(c.country)}">
            <div class="dest-emblem ob-emblem" style="--h:${destHue(c.country)}" aria-hidden="true">${esc(c.country.slice(0, 2).toUpperCase())}</div>
            <h3>${esc(c.country)}</h3>
            <div class="ob-meta">${c.dests.length} ${c.dests.length === 1 ? "destination" : "destinationer"}</div>
            <div class="ob-names">${c.dests.slice(0, 3).map((d) => esc(d.name)).join(" · ")}${c.dests.length > 3 ? " …" : ""}</div>
          </div>`).join("")}
        </div>` : `
        <h1 class="ob-title">Välj din <em>destination</em></h1>
        <p class="ob-sub">${dests.length} ${dests.length === 1 ? "destination" : "destinationer"} i ${esc(country)}.</p>
        <div class="ob-step">Steg 2 av 2 · ${esc(country)}</div>
        <div class="ob-grid">
          ${dests.map((d, i) => {
            const km = distanceToDest(d);
            return `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-dest="${esc(d.code)}" role="button" tabindex="0" aria-label="Välj ${esc(d.name)}">
            <div class="dest-emblem ob-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
            <h3>${esc(d.name)}</h3>
            <div class="ob-meta"><span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span> · Säsong ${esc(d.peak_season)}${km != null ? ` · ~${fmtKm(km)} km` : ""}</div>
            ${pips(d.luxury)}
          </div>`;
          }).join("")}
        </div>`}
        <div class="ob-actions">
          ${step === 2 ? `<button class="btn btn-ghost" id="ob-back">← Byt land</button>` : ""}
          <button class="btn btn-ghost" id="ob-skip">Visa allt</button>
        </div>
      </div>
    </div>`;

    const dialog = root.querySelector(".ob");
    untrap = trapFocus(dialog);

    const bindCard = (el, fn) => {
      el.addEventListener("click", fn);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
    };
    root.querySelectorAll("[data-country]").forEach((el) => bindCard(el, () => { country = el.dataset.country; step = 2; render(); }));
    root.querySelectorAll("[data-dest]").forEach((el) => bindCard(el, () => {
      const d = DESTINATIONS.find((x) => x.code === el.dataset.dest);
      if (d) choose(d);
    }));
    const back = $("#ob-back");
    if (back) back.addEventListener("click", () => { step = 1; country = null; render(); });
    $("#ob-skip").addEventListener("click", skip);
    const geoBtn = $("#ob-geo-btn");
    if (geoBtn) geoBtn.addEventListener("click", requestGeo);
    const geoRetry = $("#ob-geo-retry");
    if (geoRetry) geoRetry.addEventListener("click", requestGeo);
    const geoChoose = $("#ob-geo-choose");
    if (geoChoose) geoChoose.addEventListener("click", () => { if (nearest) choose(nearest.d); });
    const geoDismiss = $("#ob-geo-dismiss");
    if (geoDismiss) geoDismiss.addEventListener("click", () => { geoState = "idle"; render("#ob-geo-btn"); });
    const x = $("#ob-close");
    if (x) x.addEventListener("click", () => close());
    if (dismissable) {
      $("#ob-overlay").addEventListener("click", (e) => { if (e.target.id === "ob-overlay") close(); });
    }
    const target = focusSel ? root.querySelector(focusSel) : null;
    if (target) target.focus(); else dialog.focus();
  };

  render();
}

// ---------- Favoriter & delbar lista ----------
function renderFavorites() {
  const ids = loadFavs();
  const list = ids.map((id) => VENUES.find((v) => v.venue_id === id)).filter(Boolean);
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Favoriter</h2><div class="sub">${list.length} sparade ställen · dela listan med sällskapet</div></div>
      ${list.length ? `<button class="btn btn-gold btn-sm" id="fav-share">Dela lista</button>` : ""}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="big">♡</div>
        <h3>Inga favoriter ännu</h3>
        <p>Tryck på hjärtat på ett ställe så landar det här — sen kan du skicka listan till Gabbe, Dan eller gänget.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a></p>
      </div>` : `<div class="venue-grid">${list.map(venueCard).join("")}</div>`}
  </section>`;
  bindVenueCards();
  const share = $("#fav-share");
  if (share) {
    share.addEventListener("click", async () => {
      const payload = { name: "VELVET-lista", ids: loadFavs() };
      const url = `${location.origin}${location.pathname}#/list/${b64urlEncode(payload)}`;
      const ok = await copyText(url);
      share.textContent = ok ? "Länk kopierad ✓" : "Kunde inte kopiera";
      setTimeout(() => { share.textContent = "Dela lista"; }, 1800);
    });
  }
}

function renderSharedList(raw) {
  let p;
  try { p = b64urlDecode(raw); } catch { p = null; }
  const ids = p && Array.isArray(p.ids) ? p.ids.filter((id) => typeof id === "string") : [];
  const list = ids.map((id) => VENUES.find((v) => v.venue_id === id)).filter(Boolean);
  const title = (p && typeof p.name === "string" && p.name) ? p.name : "Delad lista";
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>${esc(title)}</h2><div class="sub">${list.length} ställen · delad VELVET-lista</div></div>
      ${list.length ? `<button class="btn btn-ghost btn-sm" id="list-save">Spara alla som favoriter</button>` : ""}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="big">🔗</div>
        <h3>Listan är tom</h3>
        <p>Länken saknar ställen, eller så har katalogen ändrats.</p>
      </div>` : `<div class="venue-grid">${list.map(venueCard).join("")}</div>`}
  </section>`;
  bindVenueCards();
  const save = $("#list-save");
  if (save) {
    save.addEventListener("click", () => {
      saveFavs([...loadFavs(), ...ids]);
      save.textContent = "Sparad ✓";
      bindFavButtons();
    });
  }
}

function renderLegal(kind) {
  const villkor = kind === "villkor";
  view().innerHTML = `
  <section class="section legal">
    <a class="detail-back" href="#/" data-nav>← Start</a>
    <h1>${villkor ? "Villkor" : "Integritet"}</h1>
    ${villkor ? `
      <p>VELVET är en concierge-förhandsversion. Ni skickar en <b>förfrågan</b> om VIP-bord, cabana eller daybed. Det är inte en bindande bokning, inte en betalning och inte en reservation hos klubben.</p>
      <h2>Vad som händer</h2>
      <ul>
        <li>VELVET-teamet tar förfrågan mot klubben manuellt.</li>
        <li>Priser i appen är indikativa mockar beräknade från research-scores — klubben sätter det riktiga priset.</li>
        <li>Bilder tillhör respektive ställe/fotograf och används som förhandsvisning, inte i kommersiell drift utan licens.</li>
        <li>Inga automatiska avgifter dras i den här versionen.</li>
      </ul>
      <h2>Ansvar</h2>
      <p>Klubbarna äger sitt inventarie. VELVET garanterar inte tillgänglighet, minimi-spend eller insläpp. En förfrågan kan avslås.</p>
    ` : `
      <p>Vi samlar bara det som behövs för att återkoppla på en förfrågan: namn, e-post, valfritt telefonnummer, ställe, datum, sällskapsstorlek och gästlista ni själva fyller i.</p>
      <h2>Lagring</h2>
      <ul>
        <li>Förfrågningar och favoriter sparas i er webbläsare (<code>localStorage</code>).</li>
        <li>När mejlvägen är aktiv skickas förfrågan till VELVET-teamet (${esc(CONCIERGE_MAIL)}) via FormSubmit.</li>
        <li>Positionsdata används bara i sessionen, om ni själva trycker på «Använd min plats».</li>
      </ul>
      <h2>Rättigheter</h2>
      <p>Mejla ${esc(CONCIERGE_MAIL)} för radering. Ni kan rensa webbläsardata när som helst — då försvinner lokala förfrågningar och favoriter.</p>
    `}
  </section>`;
}

// ---------- Global sök (/) ----------
function searchHits(q) {
  const s = q.trim().toLowerCase();
  if (s.length < 1) return [];
  const out = [];
  for (const d of DESTINATIONS) {
    if (`${d.name} ${d.country} ${d.code}`.toLowerCase().includes(s)) {
      out.push({ kind: "Destination", title: d.name, meta: d.country, href: `#/destination/${encodeURIComponent(d.code)}` });
    }
  }
  for (const v of VENUES) {
    if (`${v.name} ${v.destination} ${v.category}`.toLowerCase().includes(s)) {
      out.push({ kind: "Ställe", title: v.name, meta: `${v.destination} · ${v.category}`, href: `#/venue/${encodeURIComponent(v.venue_id)}` });
    }
  }
  return out.slice(0, 12);
}

function openSearch() {
  const root = document.getElementById("search-root");
  if (!root) return;
  root.innerHTML = `
    <div class="search-overlay" id="search-overlay">
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Sök" tabindex="-1">
        <input type="search" id="search-q" placeholder="Sök ställe, stad, kategori…" aria-label="Sök" autocomplete="off">
        <div class="search-hits" id="search-hits" role="listbox" aria-live="polite"></div>
      </div>
    </div>`;
  const input = $("#search-q");
  const hitsEl = $("#search-hits");
  let active = 0;
  let hits = [];
  const close = () => { root.innerHTML = ""; };
  const paint = () => {
    hits = searchHits(input.value);
    active = 0;
    hitsEl.innerHTML = hits.length
      ? hits.map((h, i) => `
        <div class="search-hit${i === 0 ? " active" : ""}" data-i="${i}" role="option">
          <div><div>${esc(h.title)}</div><div class="search-hit-k">${esc(h.kind)}</div></div>
          <div class="search-hit-k">${esc(h.meta)}</div>
        </div>`).join("")
      : `<div class="search-empty">${input.value.trim() ? "Inga träffar" : "Skriv för att söka · Esc stänger"}</div>`;
    hitsEl.querySelectorAll(".search-hit").forEach((el) => {
      el.addEventListener("click", () => go(Number(el.dataset.i)));
    });
  };
  const go = (i) => {
    const h = hits[i];
    if (!h) return;
    close();
    location.hash = h.href.replace(/^#/, "#");
  };
  const mark = () => {
    hitsEl.querySelectorAll(".search-hit").forEach((el, i) => el.classList.toggle("active", i === active));
  };
  input.addEventListener("input", paint);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(hits.length - 1, active + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); go(active); }
  });
  $("#search-overlay").addEventListener("click", (e) => { if (e.target.id === "search-overlay") close(); });
  paint();
  input.focus();
}

function initSearch() {
  const btn = document.getElementById("nav-search");
  if (btn) btn.addEventListener("click", openSearch);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/") return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) return;
    e.preventDefault();
    openSearch();
  });
}

// ---------- 404 ----------
function render404(hash) {
  view().innerHTML = `
  <section class="section">
    <div class="empty-state">
      <div class="big">🚪</div>
      <h3>Sidan hittades inte</h3>
      <p>Rutten <code class="route-code">${esc(hash)}</code> finns inte. Kanske en gammal eller felskriven länk?</p>
      <p style="margin-top:20px">
        <a class="btn btn-gold" href="#/" data-nav>Till startsidan</a>
        <a class="btn btn-ghost" href="#/venues" data-nav>Utforska ställen</a>
      </p>
    </div>
  </section>`;
}

// ---------- Router ----------
const routes = {
  "": renderHome,
  "#/": renderHome,
  "#/destinations": renderDestinations,
  "#/venues": renderVenues,
  "#/map": renderMapView,
  "#/bookings": renderBookings,
  "#/favorites": renderFavorites,
  "#/villkor": () => renderLegal("villkor"),
  "#/integritet": () => renderLegal("integritet"),
};

// Parametriserade rutter: mönster → handler(param)
const paramRoutes = [
  { re: /^#\/venue\/(.+)$/, fn: renderVenueDetail, nav: "#/venues" },
  { re: /^#\/destination\/(.+)$/, fn: renderDestinationDetail, nav: "#/destinations" },
  { re: /^#\/join\/(.+)$/, fn: renderJoin, nav: "" },
  { re: /^#\/list\/(.+)$/, fn: renderSharedList, nav: "#/favorites" },
];

// Trasiga %-sekvenser i hashen får inte krascha routern
const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

function route() {
  // Stäng ev. öppen modal vid ruttbyte (t.ex. bakåtknapp med öppen modal)
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot && modalRoot.innerHTML) modalRoot.innerHTML = "";
  const searchRoot = document.getElementById("search-root");
  if (searchRoot && searchRoot.innerHTML) searchRoot.innerHTML = "";
  // Riv aktiva Leaflet-kartor innan vyn skrivs över — annars läcker lyssnare
  destroyMaps();
  const raw = location.hash || "#/";
  const h = raw.split("?")[0];
  let fn = routes[h];
  let active = h || "#/";
  if (!fn) {
    for (const r of paramRoutes) {
      const m = h.match(r.re);
      if (m) { fn = () => r.fn(safeDecode(m[1])); active = r.nav; break; }
    }
  }
  // Okänd rutt → 404-vy (ingen nav-länk markeras som aktiv)
  if (!fn) { fn = () => render404(h); active = null; }
  fn();
  const titles = {
    "#/": null,
    "": null,
    "#/destinations": "Destinationer",
    "#/venues": "Ställen",
    "#/map": "Karta",
    "#/bookings": "Förfrågningar",
    "#/favorites": "Favoriter",
    "#/villkor": "Villkor",
    "#/integritet": "Integritet",
  };
  if (Object.prototype.hasOwnProperty.call(titles, h)) setTitle(titles[h]);
  window.scrollTo(0, 0);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === active);
  });
}

// ---------- Mobil nav (hamburger < 720px) ----------
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Stäng meny" : "Öppna meny");
  };
  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  // Stäng vid länkklick (även samma route, då hashchange inte triggas)
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  window.addEventListener("hashchange", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) setOpen(false);
  });
}

// ---------- Skip-link ----------
function initSkipLink() {
  const link = document.getElementById("skip-link");
  if (!link) return;
  link.addEventListener("click", (e) => {
    e.preventDefault(); // ändra inte location.hash — det skulle trigga routern
    const main = document.getElementById("view");
    main.focus();
    main.scrollIntoView({ block: "start" });
  });
}

// ---------- Init: laddning, fel + retry ----------
function renderLoading() {
  view().innerHTML = `
  <div class="load-state" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <p class="load-label">Laddar VELVET…</p>
  </div>`;
}

function renderLoadError() {
  view().innerHTML = `
  <section class="section">
    <div class="empty-state load-error" role="alert">
      <div class="big">⚠️</div>
      <h3>Kunde inte ladda katalogen</h3>
      <p>Något gick fel när destinationer och ställen skulle hämtas.<br>Kontrollera anslutningen och försök igen.</p>
      <p style="margin-top:20px"><button class="btn btn-gold" id="retry-btn">Försök igen</button></p>
    </div>
  </section>`;
  $("#retry-btn").addEventListener("click", () => init());
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const data = await r.json(); // kastar vid trasig JSON
  if (!Array.isArray(data)) throw new Error(`${url}: oväntat format (förväntade en lista)`);
  return data;
}

// Engångs-bindningar (nav, hashchange) får inte dubbleras vid retry
let uiBound = false;

async function init() {
  renderLoading();
  let d, v;
  try {
    [d, v] = await Promise.all([
      fetchJSON("data/destinations.json"),
      fetchJSON("data/venues.json"),
    ]);
    // Riktiga bilder från ställenas hemsidor — saknas filen visas emblem istället
    try {
      const r = await fetch("data/venue-images.json");
      if (r.ok) VENUE_IMAGES = await r.json() || {};
    } catch (_) { VENUE_IMAGES = {}; }
    // Kommande events (crawlade från ställenas officiella kanaler) — saknas filen visas inget
    try {
      const re = await fetch("data/venue-events.json");
      if (re.ok) { const d = await re.json(); if (d && d.venues) VENUE_EVENTS = d; }
    } catch (_) { /* behåll tom */ }
  } catch (err) {
    console.error("VELVET: datainläsning misslyckades", err);
    renderLoadError();
    return;
  }
  DESTINATIONS = d;
  VENUES = v;
  if (!uiBound) {
    uiBound = true;
    initMobileNav();
    initSkipLink();
    initSearch();
    window.addEventListener("hashchange", route);
    const navDest = document.getElementById("nav-dest");
    if (navDest) navDest.addEventListener("click", () => openOnboarding({ dismissable: true }));
  }
  // Hem-destination: förfiltrera venue-listan om ett val finns sparat
  const homeChoice = loadHomeChoice();
  const home = homeDestination();
  if (home && !state.filters.dest) state.filters.dest = home.name;
  updateNavDest();
  route();
  updateBookingBadge();
  updateFavBadge();
  // Första besöket (inget val sparat) och ingen direktlänk → visa onboardingen.
  // Direktlänkar (#/venue/…, #/join/…, …) får aldrig blockeras.
  if (!homeChoice && (!location.hash || location.hash === "#/")) {
    openOnboarding({ dismissable: false });
  }
}

// PWA: service worker ger offline-stöd (cache-first-skal + stale-while-revalidate-bilder)
// och gör appen installerbar från Chrome. Registreras efter load för att inte konkurrera
// med första renderingen. Misslyckas registreringen (t.ex. file://) funkar appen som vanligt.
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch((err) => console.warn("VELVET: service worker kunde inte registreras", err));
  });
}

registerServiceWorker();
init();
