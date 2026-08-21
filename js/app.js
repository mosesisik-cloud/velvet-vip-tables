// VELVET — VIP tables, shared. V2 SPA (no dependencies)
import { t, applyLang, bootLang, LANGS, getLang, currentLang } from "./i18n.js";

// ---------- Data ----------
let DESTINATIONS = [];
let VENUES = [];
let VENUE_IMAGES = {}; // venue_id -> bild från ställets egen hemsida (data/venue-images.json)
let VENUE_EVENTS = { fetched: null, venues: {} }; // kommande events per venue (data/venue-events.json)
let BOOKING_URLS = {}; // venue_id -> { url, kind, label } officiell VIP/bokningssida
let GOOGLE_PLACES = { fetchedAt: null, venues: {} };
const state = {
  filters: { q: "", dest: "", cat: "", status: "", price: "", sort: "priority" },
};

function isPublicVenue(v) { return v && v.listed !== false; }
function isPublicDest(d) { return d && d.listed !== false; }
function publicVenues() { return VENUES.filter(isPublicVenue); }
function publicDestinations() { return DESTINATIONS.filter(isPublicDest); }
function queryMentionsCity(q, v) {
  const s = fold(q).replace(/[^a-z0-9]+/g, " ").trim();
  if (s.length < 3) return false;
  const d = destForVenue(v);
  const keys = [v.destination, v.destination_code, d?.name, d?.code]
    .filter(Boolean)
    .map((k) => fold(k).trim());
  for (const k of keys) {
    if (!k) continue;
    if (s === k || s.split(/\s+/).includes(k)) return true;
    if (k.length >= 4 && s.includes(k)) return true;
    if (s.length >= 4 && k.includes(s)) return true;
  }
  return false;
}
function venueVisible(v, q) {
  if (isPublicVenue(v)) return true;
  return queryMentionsCity(q != null ? q : state.filters.q, v);
}

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
  // http:// → https:// så mobil-Safari inte blockerar mixed content.
  const u = VENUE_IMAGES[v.venue_id];
  if (typeof u !== "string" || !/^https?:\/\//.test(u)) return null;
  return u.replace(/^http:\/\//i, "https://");
}
function coverVenueForDest(d) {
  if (!d) return null;
  const list = VENUES
    .filter((v) => isPublicVenue(v) && (v.destination_code === d.code || v.destination === d.name))
    .sort((a, b) => num(b.priority_score) - num(a.priority_score));
  for (const v of list) {
    const url = venuePhoto(v);
    if (url) return { v, url };
  }
  return null;
}
function coverVenueForCountry(country) {
  const dests = DESTINATIONS
    .filter((x) => x.country === country)
    .sort((a, b) => (a.tier === b.tier ? b.luxury - a.luxury : a.tier.localeCompare(b.tier)));
  for (const d of dests) {
    const c = coverVenueForDest(d);
    if (c) return c;
  }
  return null;
}
function coverImgHTML(url) {
  if (!url) return "";
  return `<img src="${esc(url)}" alt="" loading="eager" fetchpriority="high" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('img-fail')">`;
}
// Bildblock med emblem-fallback under: emblemet syns medan bilden laddar
// och tar över permanent om den misslyckas (onerror → .img-fail).
// { eager: true } för LCP-bilder (detalj-heron): laddas direkt med hög prioritet;
// kort i listor förblir lazy så mobil inte laddar 120 bilder i onödan.
function venueMediaHTML(v, cls, { eager = false, extra = "" } = {}) {
  const url = venuePhoto(v);
  const img = url ? `
    <img src="${esc(url)}" alt="${esc(v.name)} — ${esc(v.category || "")}" loading="${eager ? "eager" : "lazy"}"${eager ? ` fetchpriority="high"` : ""} decoding="async" referrerpolicy="no-referrer"
         onerror="this.closest('.${cls}').classList.add('img-fail')">` : "";
  return `
  <div class="${cls}${url ? "" : " img-fail"}">
    <div class="dest-emblem venue-media-emblem" aria-hidden="true" style="--h:${destHue(v.destination_code)}">${esc(v.destination_code || "")}</div>${img}
    ${extra}
  </div>`;
}

function urlHost(url) {
  try { return new URL(url).hostname.replace(/^www\./i, ""); }
  catch { return ""; }
}
function isSocialUrl(url) {
  return /(?:instagram|facebook|tiktok|snapchat)\.com/i.test(url || "");
}
/** Officiell bokning: VIP-path i booking-urls.json, annars ställets hemsida. */
function bookingUrlFor(v) {
  if (!v) return null;
  const o = BOOKING_URLS[v.venue_id];
  let url = "";
  let kind = "site";
  let label = "";
  if (o && typeof o.url === "string" && /^https?:\/\//i.test(o.url)) {
    url = o.url;
    kind = o.kind || "vip";
    label = o.label || "";
  } else {
    url = v.website_url || v.source_url || "";
  }
  if (!url || !/^https?:\/\//i.test(url)) return null;
  url = url.replace(/^http:\/\//i, "https://");
  return { url, kind, label, host: urlHost(url), social: isSocialUrl(url) };
}
function bookingLinkHTML(v, { gold = false, sm = false, full = false } = {}) {
  if (!bookingUrlFor(v)) return "";
  const cls = gold ? `btn btn-gold${sm ? " btn-sm" : ""}` : "icon-link";
  const style = full ? ` style="width:100%"` : "";
  return `<a class="${cls}" href="#/book-site/${encodeURIComponent(v.venue_id)}" data-nav${style}>${esc(gold ? t("bookOnSite") : t("bookOnSiteShort"))} ↗</a>`;
}

function destForVenue(v) {
  return DESTINATIONS.find((d) => d.code === v.destination_code || d.name === v.destination) || null;
}
function placeQuery(v) {
  const d = destForVenue(v);
  return [v.name, v.destination, d?.country].filter(Boolean).join(", ");
}
function destQuery(d) {
  return [d.name, d.country].filter(Boolean).join(", ");
}
function mapsGoogleQuery(q) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}
function mapsAppleQuery(q) {
  return "https://maps.apple.com/?q=" + encodeURIComponent(q);
}
function socialPath(url) {
  try {
    const p = new URL(url).pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(p);
  } catch { return ""; }
}
function contactTile(href, title, sub, { gold = false, external = true, id = "", tag = "a" } = {}) {
  const extra = external ? ` target="_blank" rel="noopener"` : "";
  const nav = !external && tag === "a" ? " data-nav" : "";
  const idAttr = id ? ` id="${id}"` : "";
  const open = tag === "button"
    ? `<button type="button" class="contact-tile${gold ? " gold" : ""}"${idAttr}>`
    : `<a class="contact-tile${gold ? " gold" : ""}" href="${esc(href)}"${extra}${nav}${idAttr}>`;
  const close = tag === "button" ? "</button>" : "</a>";
  return `${open}<strong>${esc(title)}</strong><span>${esc(sub)}</span>${close}`;
}
function venueShareUrl(v) {
  const u = new URL(location.href);
  u.search = "";
  u.hash = "#/venue/" + encodeURIComponent(v.venue_id);
  return u.toString();
}
async function shareVenue(v) {
  const url = venueShareUrl(v);
  const title = `${v.name} — ${v.destination}`;
  if (navigator.share) {
    try { await navigator.share({ title, text: title, url }); return; } catch { /* fall through */ }
  }
  const ok = await copyText(url);
  showToast(ok ? t("copied") : t("sharePlace"));
}
function contactPanelHTML(v) {
  const d = destForVenue(v);
  const book = bookingUrlFor(v);
  const q = placeQuery(v);
  const ig = igHandle(v.instagram_url);
  const tk = v.tiktok_url ? socialPath(v.tiktok_url) : "";
  const fb = v.facebook_url ? socialPath(v.facebook_url) : "";
  const webHost = urlHost(v.website_url || "");
  const tiles = [
    book ? contactTile(`#/book-site/${encodeURIComponent(v.venue_id)}`, t("bookOnSiteShort"), book.host || book.label || t("bookKindSite"), { gold: true, external: false }) : "",
    contactTile(mapsGoogleQuery(q), t("mapsGoogle"), q, { gold: true }),
    contactTile(googleMapsReviewsUrl(v), t("googleOpen"), googlePlace(v)?.matched ? `${googlePlace(v).rating} · Google` : t("googleChannel")),
    contactTile(mapsAppleQuery(q), t("mapsApple"), t("directions")),
    v.instagram_url ? contactTile(v.instagram_url, "Instagram", ig || t("instagram")) : "",
    v.tiktok_url ? contactTile(v.tiktok_url, "TikTok", tk.startsWith("@") ? tk : "@" + tk) : "",
    v.facebook_url ? contactTile(v.facebook_url, "Facebook", fb ? "/" + fb : "Facebook") : "",
    v.website_url ? contactTile(v.website_url, t("website"), webHost) : "",
    contactTile("#", t("sharePlace"), v.name, { tag: "button", id: "v-share", external: false }),
    contactTile(`#/promoter/${encodeURIComponent(v.venue_id)}`, t("chatPromoter"), t("promoter"), { external: false }),
  ].filter(Boolean).join("");
  const season = d?.peak_season ? `${t("whenToGo")} ${d.peak_season}` : "";
  const where = [v.destination, d?.country, d?.region].filter(Boolean).join(" · ");
  return `
  <div class="detail-panel contact-panel">
    <h2 class="detail-panel-title">${esc(t("contactTitle"))}</h2>
    <p class="events-meta">${esc(t("contactHint"))}</p>
    <div class="contact-grid">${tiles}</div>
    <p class="events-meta" style="margin-top:12px">${esc(t("noPhone"))}</p>
    <div class="contact-meta">
      ${where ? `<span>${esc(where)}</span>` : ""}
      ${season ? `<span>${esc(season)}</span>` : ""}
      ${v.category ? `<span>${esc(v.category)}</span>` : ""}
    </div>
  </div>`;
}
function venueDockHTML(v) {
  const book = bookingUrlFor(v);
  const q = placeQuery(v);
  return `
  <nav class="venue-dock" aria-label="${esc(t("contactTitle"))}">
    ${book ? `<a class="btn btn-gold btn-sm" href="#/book-site/${encodeURIComponent(v.venue_id)}" data-nav>${esc(t("bookOnSiteShort"))}</a>` : `<button type="button" class="btn btn-gold btn-sm" id="dock-book">${esc(t("sendRequest"))}</button>`}
    <a class="btn btn-ghost btn-sm" href="${esc(mapsGoogleQuery(q))}" target="_blank" rel="noopener">${esc(t("openMaps"))}</a>
    ${v.instagram_url ? `<a class="btn btn-ghost btn-sm" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">IG</a>` : ""}
    <button type="button" class="btn btn-ghost btn-sm" id="dock-share">${esc(t("sharePlace"))}</button>
  </nav>`;
}

function photoAttrHTML(v) {
  if (!venuePhoto(v)) return "";
  const href = v.website_url || v.source_url || "";
  const credit = href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener">Bild: ${esc(v.name)}</a>`
    : `Bild: ${esc(v.name)}`;
  return `<p class="photo-attr">${credit} · förhandsvisning, inte kommersiell licens</p>`;
}

function statusInfo(s) {
  const x = (s || "").toLowerCase();
  if (x.includes("unverified") || x.includes("unlisted")) return { cls: "tag-unverified", label: t("unverified") };
  if (x.includes("verified") || x.includes("web")) return { cls: "tag-verified", label: t("verified") };
  if (x.includes("check")) return { cls: "tag-check", label: "Kontrollera status" };
  return { cls: "tag-research", label: "Research" };
}

// Request types only — no invented EUR. Club publishes min-spend on their own site.
function packagesFor(v) {
  const grp = venueGroup(v);
  const pkgs = [];
  if (grp === "beach" || grp === "day") {
    pkgs.push({ id: "daybed", name: "Daybed / sunbed", desc: t("clubSetsPrice") });
    pkgs.push({ id: "cabana", name: "Cabana", desc: t("clubSetsPrice") });
  }
  pkgs.push({ id: "table", name: "VIP-bord", desc: t("clubSetsPrice") });
  return pkgs;
}

// Defensiv: icke-numeriskt in (t.ex. manipulerad localStorage) → 0 € i stället för "NaN"
const fmtEUR = (n) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

function fromPriceFor() { return null; }
function priceTierHTML() { return ""; }
function moneyOrClub(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return t("clubSetsPrice");
  return fmtEUR(x);
}
function publicNote(v) {
  const n = (v.notes || "").trim();
  if (!n) return "";
  if (/tier\s*2|v1 candidate|ig live-verifierad|handle corrected|ig handle/i.test(n)) return "";
  return n;
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
function favLabel(on, name) {
  if (name) return on ? `Ta bort ${name} från favoriter` : `Spara ${name} som favorit`;
  return on ? "Ta bort från favoriter" : "Spara som favorit";
}
function favBtnHTML(id, name = "") {
  const on = isFav(id);
  const label = favLabel(on, name);
  return `<button class="fav-btn" type="button" data-fav="${esc(id)}" data-fav-name="${esc(name)}" aria-pressed="${on}" title="${on ? "Sparad" : "Spara"}" aria-label="${esc(label)}">
    <svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12.1 21s-7.2-4.5-9.6-8.3C.3 9.3 2.2 5.4 6.3 5.4c2.1 0 3.5 1.3 4.4 2.6.9-1.3 2.3-2.6 4.4-2.6 4.1 0 6 3.9 3.8 7.3-2.4 3.8-9.6 8.3-9.6 8.3z"/></svg>
  </button>`;
}
function paintFavButton(btn) {
  const on = isFav(btn.dataset.fav);
  const name = btn.dataset.favName || "";
  const label = favLabel(on, name);
  btn.setAttribute("aria-pressed", String(on));
  btn.setAttribute("aria-label", label);
  btn.title = on ? "Sparad" : "Spara";
  const svg = btn.querySelector("svg");
  if (svg) svg.setAttribute("fill", on ? "currentColor" : "none");
}
function syncFavButtons(root = document) {
  root.querySelectorAll("[data-fav]").forEach(paintFavButton);
}
const USER_KEY = "velvet_user_v1";
const SOCIALS = [
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
  { id: "tiktok", label: "TikTok", color: "#111" },
  { id: "snapchat", label: "Snapchat", color: "#FFFC00", dark: true },
];
function loadUser() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY));
    if (u && u.provider && u.id) return u;
  } catch {}
  return null;
}
function displayName(u) {
  if (!u) return "";
  if (u.name) return u.name;
  const s = SOCIALS.find((x) => x.id === u.provider);
  return s ? s.label : (u.provider || "");
}
function saveUser(u) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
  paintUser();
  registerUser(u);
}
function socialUrl(provider, handle) {
  const h = String(handle || "").replace(/^@/, "").trim();
  if (!h) return "";
  const enc = encodeURIComponent(h);
  if (provider === "instagram") return `https://www.instagram.com/${enc}/`;
  if (provider === "facebook") return `https://www.facebook.com/${enc}`;
  if (provider === "tiktok") return `https://www.tiktok.com/@${enc}`;
  if (provider === "snapchat") return `https://www.snapchat.com/add/${enc}`;
  return "";
}
function registerUser(u) {
  if (!u?.id || !u.provider) return;
  apiJSON("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: u.id, name: u.name || "", handle: u.handle || "", provider: u.provider }),
  });
}
async function loginWithSocial(provider) {
  if (!SOCIALS.some((s) => s.id === provider)) return;
  const start = await apiJSON(`/auth/start/${encodeURIComponent(provider)}`);
  if (start?.url) {
    location.href = start.url;
    return;
  }
  let sid = "";
  try { sid = localStorage.getItem("velvet_sid_" + provider) || ""; } catch {}
  if (!sid) {
    sid = (globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())).replace(/-/g, "").slice(0, 12);
    try { localStorage.setItem("velvet_sid_" + provider, sid); } catch {}
  }
  saveUser({
    id: `U-${provider}-${sid}`,
    provider,
    name: "",
    handle: "",
    auto: true,
    created: new Date().toISOString(),
  });
}
function logoutUser() {
  try { localStorage.removeItem(USER_KEY); } catch {}
  paintUser();
}
function isOperatorUser(u) {
  const email = String(u?.email || "").toLowerCase();
  const handle = String(u?.handle || "").toLowerCase();
  return email === "gabrielhadodo@gmail.com" || email === "moses.isik@bakemyday.se" || handle === "velvet";
}
function paintUser() {
  const u = loadUser();
  const lab = document.getElementById("nav-user-label");
  const btn = document.getElementById("nav-user");
  const label = displayName(u);
  if (lab) lab.textContent = u ? (label.slice(0, 1).toUpperCase() || "•") : "In";
  if (btn) btn.title = u ? `${t("loggedInAs")} ${label}` : t("loginTitle");
}
function apiBase() {
  if (location.hostname === "b2b.bakemyday.se") return `${location.origin}/velvet-api`;
  return "";
}
async function apiJSON(path, opts) {
  const base = apiBase();
  if (!base) return null;
  try {
    const headers = { ...(opts && opts.headers) };
    const r = await fetch(base + path, { cache: "no-store", ...opts, headers });
    const json = await r.json().catch(() => null);
    if (!r.ok) return json || null;
    return json;
  } catch { return null; }
}

async function loadVenueEvents() {
  try {
    const re = await fetch("data/venue-events.json", { cache: "no-store" });
    if (re.ok) {
      const d = await re.json();
      if (d && d.venues) VENUE_EVENTS = d;
    }
  } catch { /* keep previous */ }
  await refreshLiveEvents();
}

async function refreshLiveEvents() {
  const live = await apiJSON("/events");
  if (live && live.venues) {
    VENUE_EVENTS = live;
    return true;
  }
  return false;
}

async function pollEventsUntilIdle(ms = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const st = await apiJSON("/events/status");
    if (!st?.running) {
      await refreshLiveEvents();
      return true;
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

async function refreshVenueEvents(v) {
  const btn = $("#ev-refresh");
  if (btn) { btn.disabled = true; btn.textContent = t("eventsRefreshing"); }
  const r = await apiJSON("/events/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: loadUser(), venueId: v.venue_id }),
  });
  if (r?.venues) VENUE_EVENTS = r;
  else if (r?.running) {
    showToast(t("eventsCrawlBusy"));
    await pollEventsUntilIdle();
  } else {
    await refreshLiveEvents();
  }
  if ((location.hash || "").split("?")[0] === `#/venue/${v.venue_id}`) renderVenueDetail(v.venue_id);
}
const TABLES_KEY = "velvet_tables_v1";
function loadLocalTables() {
  try {
    const t = JSON.parse(localStorage.getItem(TABLES_KEY));
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}
function saveLocalTables(list) {
  try { localStorage.setItem(TABLES_KEY, JSON.stringify(list.slice(0, 50))); } catch {}
}
async function publishTable(table) {
  saveLocalTables([table, ...loadLocalTables().filter((x) => x.id !== table.id)]);
  const remote = await apiJSON("/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(table),
  });
  return remote?.table || table;
}
async function listOpenTables() {
  const remote = await apiJSON("/tables");
  if (remote?.tables) return remote.tables;
  return loadLocalTables().filter((t) => t.status === "open" && Number(t.openLeft) > 0);
}
async function joinOpenTable(id) {
  const u = loadUser();
  if (!u) return { error: "auth" };
  const base = apiBase();
  if (base) {
    try {
      const r = await fetch(`${base}/tables/${encodeURIComponent(id)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: u }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 403) return { error: "idv_required" };
      if (r.status === 409) return { error: "full" };
      if (data.table) return { table: data.table, already: data.already };
    } catch {}
  }
  const list = loadLocalTables();
  const tb = list.find((x) => x.id === id);
  if (!tb) return { error: "missing" };
  const ven = VENUES.find((x) => x.venue_id === tb.venue_id);
  if ((tb.sharp || (ven && isSharpVenue(ven))) && !isIdvOk()) return { error: "idv_required" };
  if (tb.openLeft < 1) return { error: "full" };
  if (tb.host?.id === u.id || (tb.joiners || []).some((j) => j.id === u.id)) return { table: decorateLocalTable(tb), already: true };
  tb.joiners = [...(tb.joiners || []), { id: u.id, name: u.name, provider: u.provider, handle: u.handle, paid: false, joined: new Date().toISOString() }];
  tb.openLeft = Math.max(0, tb.openLeft - 1);
  if (tb.openLeft === 0) tb.status = "full";
  saveLocalTables(list);
  return { table: decorateLocalTable(tb) };
}

function decorateLocalTable(t) {
  if (!t) return null;
  const me = loadUser();
  const asPerson = (p, role) => {
    if (!p) return null;
    const id = p.id || "";
    const handle = String(p.handle || "").replace(/^@/, "");
    const provider = p.provider || "";
    const idv = (id && me && id === me.id && isIdvOk()) ? "verified" : (p.idv || "none");
    return {
      id,
      name: p.name || "Gäst",
      handle,
      provider,
      socialUrl: socialUrl(provider, handle),
      role,
      paid: !!p.paid,
      paidAt: p.paidAt || null,
      idv,
      joined: p.joined || null,
    };
  };
  const host = asPerson(t.host, "host");
  const joiners = (t.joiners || []).map((j) => asPerson(j, "guest")).filter(Boolean);
  const invites = (t.guests || []).map((g) => asPerson({ name: g.name, paid: g.paid }, "invite")).filter(Boolean);
  const members = [host, ...joiners, ...invites].filter(Boolean);
  const party = Number(t.party) || Math.max(members.length, 1);
  return {
    ...t,
    host,
    joiners,
    guests: invites,
    members,
    paidN: members.filter((m) => m.paid).length,
    dueN: members.length,
    per_person: t.per_person || Math.ceil((Number(t.total) || 0) / Math.max(1, party)),
  };
}
async function getTable(id) {
  const remote = await apiJSON(`/tables/${encodeURIComponent(id)}`);
  if (remote?.table) return remote.table;
  const local = loadLocalTables().find((x) => x.id === id) || loadBookings().find((x) => x.id === id);
  return local ? decorateLocalTable(local) : null;
}
async function markPaid(tableId, { targetId = "", targetName = "", paid }) {
  const u = loadUser();
  if (!u) return { error: "auth" };
  const remote = await apiJSON(`/tables/${encodeURIComponent(tableId)}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: u, targetId, targetName, paid: !!paid }),
  });
  if (remote?.table) return { table: remote.table };
  const list = loadLocalTables();
  const tb = list.find((x) => x.id === tableId);
  if (!tb) return { error: "missing" };
  const isHost = tb.host?.id === u.id;
  if (tb.host && (tb.host.id === targetId || (!targetId && !targetName && (isHost || tb.host.id === u.id)))) {
    if (!isHost && tb.host.id !== u.id) return { error: "forbidden" };
    tb.host.paid = !!paid;
    tb.host.paidAt = paid ? new Date().toISOString() : null;
  } else {
    const j = (tb.joiners || []).find((x) => x.id === targetId);
    if (j) {
      if (!isHost && j.id !== u.id) return { error: "forbidden" };
      j.paid = !!paid;
      j.paidAt = paid ? new Date().toISOString() : null;
    } else if (isHost && targetName) {
      const g = (tb.guests || []).find((x) => x.name === targetName);
      if (g) { g.paid = !!paid; g.paidAt = paid ? new Date().toISOString() : null; }
      else return { error: "member" };
    } else return { error: "member" };
  }
  saveLocalTables(list);
  return { table: decorateLocalTable(tb) };
}
function personRowHTML(p, { me, hostId, tableId } = {}) {
  if (!p) return "";
  const verified = p.idv === "verified";
  const paid = !!p.paid;
  const isHostView = !!(me && hostId && me.id === hostId);
  const canPay = !!(me && (isHostView || (p.id && me.id === p.id)));
  const payAttr = p.id
    ? `data-pay="${esc(p.id)}"`
    : `data-pay-name="${esc(p.name)}"`;
  const handle = p.handle ? `@${p.handle}` : "";
  const shown = p.name || displayName({ provider: p.provider, name: p.name });
  const nameInner = p.id
    ? `<a href="#/user/${encodeURIComponent(p.id)}" data-nav>${esc(shown)}</a>`
    : esc(shown);
  return `
  <div class="person-row">
    <div class="person-avatar soc-${esc(p.provider || "none")}" aria-hidden="true">${esc((p.name || p.provider || "?").slice(0, 1).toUpperCase())}</div>
    <div class="person-info">
      <div class="person-name">${nameInner}${p.role === "host" ? ` <span class="chip-mini">${esc(t("hostRole"))}</span>` : p.role === "invite" ? ` <span class="chip-mini">${esc(t("inviteRole"))}</span>` : ""}</div>
      <div class="person-meta">
        ${p.provider ? `<span class="soc-pill">${esc(p.provider)}</span>` : `<span class="soc-pill dim">${esc(t("noSocial"))}</span>`}
        ${handle ? (p.socialUrl
          ? `<a class="person-handle" href="${esc(p.socialUrl)}" target="_blank" rel="noopener">${esc(handle)}</a>`
          : `<span class="person-handle">${esc(handle)}</span>`) : ""}
        ${verified
          ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span>`
          : `<span class="idv-badge no">${esc(t("notVerified"))}</span>`}
      </div>
    </div>
    <div class="person-pay">
      <span class="pay-pill ${paid ? "yes" : "no"}">${esc(paid ? t("paid") : t("unpaid"))}${paid && p.paidVia ? ` · ${esc(p.paidVia)}` : ""}</span>
      ${!paid && me && p.id && me.id === p.id && tableId ? `<a class="btn btn-gold btn-sm" href="#/pay/${encodeURIComponent(tableId)}" data-nav>${esc(t("payShare"))}</a>` : ""}
      ${canPay ? `<button type="button" class="btn btn-ghost btn-sm" ${payAttr} data-paid="${paid ? "0" : "1"}">${esc(paid ? t("markUnpaid") : t("markPaid"))}</button>` : ""}
    </div>
  </div>`;
}
function partyPreviewHTML(tb) {
  const members = tb.members || [tb.host, ...(tb.joiners || [])].filter(Boolean);
  const paidN = tb.paidN != null ? tb.paidN : members.filter((m) => m && m.paid).length;
  const dueN = tb.dueN != null ? tb.dueN : members.length;
  return `
    <div class="party-preview">
      ${members.slice(0, 6).map((m) => `<span class="person-dot soc-${esc((m && m.provider) || "none")}" title="${esc((m && m.name) || "")}">${esc(((m && m.name) || "?").slice(0, 1).toUpperCase())}</span>`).join("")}
      ${members.length > 6 ? `<span class="person-dot more">+${members.length - 6}</span>` : ""}
      <span class="party-paid-meta">${num(paidN)}/${num(dueN)} ${esc(t("paid"))}</span>
    </div>`;
}

function isSharpVenue(v) {
  return eventsFor(v).length > 0;
}
function idvStatus() {
  const u = loadUser();
  return (u && u.idvStatus) || "none";
}
function isIdvOk() {
  return idvStatus() === "verified";
}
async function refreshIdv() {
  const u = loadUser();
  if (!u) return "none";
  const r = await apiJSON(`/idv/${encodeURIComponent(u.id)}`);
  const st = r?.idv?.status || "none";
  saveUser({ ...u, idvStatus: st, idvSubmitted: r?.idv?.submitted || u.idvSubmitted });
  return st;
}
function fileToJpeg(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("image"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

function bindFavButtons(root = document) {
  root.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(btn.dataset.fav);
      if ((location.hash.split("?")[0] || "") === "#/favorites") {
        renderFavorites();
        return;
      }
      paintFavButton(btn);
    });
  });
}

// ---------- Concierge: förfrågan (inte fake-bokning) ----------
const CONCIERGE_MAIL = "gabrielhadodo@gmail.com";
// FormSubmit vidarebefordrar inte förrän Gabbe bekräftat inkorgen (README).
const FORMSUBMIT_INBOX_CONFIRMED = false;
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
  const summary = `VELVET-förfrågan · ${b.venue} (ej reserverat)`;
  const desc = [
    `Förfrågan ${b.id} (ej bekräftad bokning).`,
    `${b.package} · ${b.party} personer · ${b.per_person ? fmtEUR(b.per_person) + "/person (gästens budget, inte klubbens pris)" : "pris enligt klubben"}.`,
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
    "STATUS:TENTATIVE",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
function inviteTextFor(b) {
  return [
    `Du är bjuden till ${b.venue} (${b.destination}).`,
    `${b.date} · ${b.package} · ${b.party} personer.`,
    b.total > 0 ? `Gästens budget: ${fmtEUR(b.total)} totalt (${fmtEUR(b.per_person)}/person) — klubben sätter det riktiga priset.` : `Pris enligt klubben — inget belopp påhittat i appen.`,
    `VELVET-teamet tar förfrågan mot klubben — ingen reservation förrän återkoppling.`,
    `Gå med: ${shareLinkFor(b)}`,
  ].join("\n");
}

function conciergeFields(b) {
  return {
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
}
async function sendConciergeRequest(b) {
  // Tills Gabbe bekräftat FormSubmit-inkorgen: ingen POST av PII. mailtoFor är sändvägen.
  if (!FORMSUBMIT_INBOX_CONFIRMED) return "local";
  const fields = conciergeFields(b);
  const payload = {
    _subject: `VELVET-förfrågan ${b.id} · ${b.venue} ${b.date}`,
    _captcha: false,
    _replyto: fields.host_email,
    ...fields,
    _honey: "",
  };
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${CONCIERGE_MAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return "local";
    let data;
    try { data = await r.json(); } catch { return "local"; }
    if (data && (data.success === true || data.success === "true")) return "sent";
  } catch {}
  return "local";
}
function mailtoFor(b) {
  const f = conciergeFields(b);
  const subject = encodeURIComponent(`VELVET-förfrågan ${b.id} · ${b.venue}`);
  const body = encodeURIComponent([
    `Värd: ${f.host_name}`,
    `E-post: ${f.host_email}`,
    `Telefon: ${f.host_phone}`,
    `Gäster: ${f.guests || "—"}`,
    `venue_id: ${f.venue_id}`,
    `Ställe: ${f.venue} (${f.destination})`,
    `Paket: ${f.package}`,
    `Datum: ${f.date}`,
    `Sällskap: ${f.party} personer`,
    f.total_indicative_eur > 0
      ? `Gästens budget: ${fmtEUR(f.total_indicative_eur)} totalt · ${fmtEUR(f.per_person_indicative_eur)}/person (inte klubbens pris)`
      : `Pris: enligt klubben (inget belopp ifyllt)`,
    f.note,
    `id: ${f.id}`,
  ].join("\n"));
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
const fold = (s) => String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function setAppInert(on) {
  const app = document.getElementById("app");
  if (!app) return;
  if (on) {
    app.setAttribute("aria-hidden", "true");
    app.inert = true;
  } else {
    app.removeAttribute("aria-hidden");
    app.inert = false;
  }
}

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

let modalTeardown = null;

function pips(n) {
  const v = Math.max(0, Math.min(5, num(n)));
  let h = "";
  for (let i = 1; i <= 5; i++) h += `<div class="score-pip ${i <= v ? "on" : ""}"></div>`;
  return `<div class="dest-scores" title="${v}/5">${h}</div>`;
}

// ---------- Views ----------
function renderHome() {
  const pubD = publicDestinations();
  const pubV = publicVenues();
  const tier1 = pubD.filter((d) => d.tier === "Tier 1");
  const top = [...pubV].sort((a, b) => b.priority_score - a.priority_score).slice(0, 6);
  view().innerHTML = `
  <section class="hero">
    <div class="hero-media" id="hero-media" aria-hidden="true"></div>
    <div class="hero-kicker">${esc(t("heroKicker"))}</div>
    <h1>${esc(t("heroTitle1"))}<br><em>${esc(t("heroTitle2"))}</em></h1>
    <p>${esc(t("heroP"))}</p>
    <div class="hero-cta">
      <a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a>
      <a class="btn btn-ghost" href="#/destinations" data-nav>Se destinationer</a>
    </div>
    <p class="hero-credit"><a href="${esc(HERO_VIDEO.credit)}" target="_blank" rel="noopener">Video: Pexels</a></p>
  </section>

  <div class="stats">
    <div class="stat"><div class="stat-num">${pubD.length}</div><div class="stat-label">Destinationer</div></div>
    <div class="stat"><div class="stat-num">${pubV.length}</div><div class="stat-label">Verifierade ställen</div></div>
    <div class="stat"><div class="stat-num">${pubV.filter((v) => v.priority_score >= 90).length}</div><div class="stat-label">Prio 90+</div></div>
    <div class="stat"><div class="stat-num">${pubV.filter((v) => statusInfo(v.research_status).cls === "tag-verified").length}</div><div class="stat-label">${esc(t("verified"))}</div></div>
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
      <a class="link-gold" href="#/venues" data-nav>Alla ${pubV.length} verifierade →</a>
    </div>
    <div class="venue-grid">${top.map((v) => venueCard(v, { eager: true })).join("")}</div>
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
  credit: "https://www.pexels.com/video/2022395/",
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
  const cover = coverVenueForDest(d);
  return `
  <div class="dest-card" data-code="${esc(d.code)}" role="link" tabindex="0" aria-label="Visa destinationen ${esc(d.name)}">
    <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
    <div class="dest-cover${cover ? "" : " img-fail"}">
      ${coverImgHTML(cover && cover.url)}
      <div class="dest-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
    </div>
    ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
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
      <div><h2>Destinationer</h2><div class="sub">${publicDestinations().length} publika marknader · fler städer är sökbara när du valt stad</div></div>
    </div>
    <div class="dest-grid">
      ${[...publicDestinations()].sort((a, b) => (a.tier === b.tier ? b.luxury - a.luxury : a.tier.localeCompare(b.tier))).map(destCard).join("")}
    </div>
  </section>`;
  bindDestCards();
}

function bindDestCards() {
  document.querySelectorAll(".dest-card").forEach((el) => {
    const go = () => { location.hash = `#/destination/${encodeURIComponent(el.dataset.code)}`; };
    el.addEventListener("click", (e) => { if (e.target.closest("a, button")) return; go(); });
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
  const verified = VENUES.filter((v) => isPublicVenue(v) && (v.destination === d.name || v.destination_code === d.code))
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
          <a class="icon-link" href="${esc(mapsGoogleQuery(destQuery(d)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
          <a class="icon-link" href="${esc(mapsAppleQuery(destQuery(d)))}" target="_blank" rel="noopener">${esc(t("mapsApple"))} ↗</a>
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
          <div class="fact"><span class="fact-label">${esc(t("verified"))}</span><span class="fact-val">${verified.length}</span></div>
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

    ${verified.length ? `
    <div class="section-head" style="margin-top:44px">
      <div><h2>${esc(t("verified"))} i ${esc(d.name)}</h2><div class="sub">${verified.length} i den publika katalogen</div></div>
      <a class="link-gold" href="#/venues" id="dd-list-2">Visa i listan →</a>
    </div>
    <div class="venue-grid">${verified.map(venueCard).join("")}</div>` : `
    <p class="events-meta" style="margin-top:28px">${esc(t("unlistedNeedCity"))}</p>`}
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
  mountDestMap(d, verified);
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

function venueCard(v, { eager = false } = {}) {
  const st = statusInfo(v.research_status);
  return `
  <div class="venue-card">
    ${favBtnHTML(v.venue_id, v.name)}
    <div class="venue-card-link" data-id="${esc(v.venue_id)}" role="link" tabindex="0" aria-label="Visa detaljer för ${esc(v.name)}">
      ${venueMediaHTML(v, "venue-media", { eager })}
      <div class="venue-top">
        <div>
          <div class="venue-name">${esc(v.name)}</div>
          <div class="venue-loc">${esc(v.destination)}</div>
        </div>
        <div class="prio">${googleRatingHTML(v, { compact: true }) || `<span class="prio-num">${num(v.priority_score)}</span><span class="prio-label">Prio</span>`}</div>
      </div>
      <div class="venue-tags">
        <span class="tag">${esc(v.category)}</span>
        <span class="tag ${st.cls}">${st.label}</span>
        ${v.shareable_format ? '<span class="tag tag-verified">Delbar kostnad</span>' : ""}
        ${eventsFor(v).length ? `<span class="tag tag-events">🎟 ${eventsFor(v).length} kommande</span>` : ""}
      </div>
      ${publicNote(v) ? `<div class="venue-note">${esc(publicNote(v))}</div>` : ""}
      <div class="venue-actions">
        <button class="btn btn-gold btn-sm" data-book="${esc(v.venue_id)}">${esc(t("sendRequest"))}</button>
        ${bookingLinkHTML(v)}
        <a class="icon-link" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener">${esc(t("openMaps"))} ↗</a>
        ${igLinkHTML(v)}
      </div>
    </div>
    ${photoAttrHTML(v)}
  </div>`;
}

function applyFilters() {
  const f = state.filters;
  let list = VENUES.filter((v) => {
    if (!venueVisible(v, f.q)) return false;
    if (f.dest && v.destination !== f.dest && v.destination_code !== f.dest) return false;
    if (f.cat && venueGroup(v) !== f.cat) return false;
    if (f.status && statusInfo(v.research_status).cls !== f.status) return false;
    if (f.price) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!`${v.name} ${v.destination} ${v.category} ${v.notes} ${v.instagram_url || ""} ${v.tiktok_url || ""} ${v.facebook_url || ""} ${v.website_url || ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const vis = (a, b) => Number(isPublicVenue(b)) - Number(isPublicVenue(a));
  if (f.sort === "priority") list.sort((a, b) => vis(a, b) || b.priority_score - a.priority_score || a.name.localeCompare(b.name));
  else if (f.sort === "name") list.sort((a, b) => vis(a, b) || a.name.localeCompare(b.name));
  else if (f.sort === "luxury") list.sort((a, b) => vis(a, b) || b.luxury_score - a.luxury_score || b.priority_score - a.priority_score);
  else if (f.sort === "price") list.sort((a, b) => vis(a, b) || a.name.localeCompare(b.name));
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
  const dests = [...new Set(publicDestinations().map((d) => d.name))].sort();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>Ställen</h2><div class="sub">${esc(t("venuesSub"))}</div></div>
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
        <option value="tag-verified" ${f.status === "tag-verified" ? "selected" : ""}>${esc(t("verified"))}</option>
        <option value="tag-unverified" ${f.status === "tag-unverified" ? "selected" : ""}>${esc(t("unverified"))}</option>
      </select>
      <select id="f-sort" aria-label="Sortering">
        <option value="priority" ${f.sort === "priority" ? "selected" : ""}>Högst prioritet</option>
        <option value="luxury" ${f.sort === "luxury" ? "selected" : ""}>Mest lyx</option>
        <option value="name" ${f.sort === "name" ? "selected" : ""}>A–Ö</option>
      </select>
      <span class="filter-count" id="f-count" role="status" aria-live="polite" aria-atomic="true"></span>
    </div>
    <div class="venue-grid" id="venue-list"></div>
  </section>`;

  const renderList = () => {
    const list = applyFilters();
    const ver = list.filter(isPublicVenue);
    const unv = list.filter((v) => !isPublicVenue(v));
    $("#f-count").textContent = f.dest
      ? `${list.length} i ${f.dest} · ${ver.length} ${t("verified").toLowerCase()} · ${unv.length} ${t("unverified").toLowerCase()}`
      : `${list.length} ${t("verified").toLowerCase()}`;
    let html = "";
    if (ver.length) html += ver.map(venueCard).join("");
    if (unv.length) {
      html += `<div class="unlisted-banner" style="grid-column:1/-1"><h3>${esc(t("unverified"))}</h3><p>${esc(t("unlistedHint"))}</p></div>`;
      html += unv.map(venueCard).join("");
    }
    $("#venue-list").innerHTML = html || `<div class="empty-state" style="grid-column:1/-1"><div class="big">🔍</div><h3>Inga träffar</h3><p>${f.status === "tag-unverified" && !(f.q || "").trim() ? esc(t("unlistedNeedCity")) : "Prova att rensa filtren."}</p></div>`;
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
function googlePlace(v) {
  return (v && GOOGLE_PLACES.venues && GOOGLE_PLACES.venues[v.venue_id]) || null;
}
function googleMapsReviewsUrl(v) {
  const g = googlePlace(v);
  if (g && g.mapsUrl) return g.mapsUrl;
  return mapsGoogleQuery(placeQuery(v));
}
function googleStars(rating) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(n);
  const half = n - full >= 0.4 && n - full < 0.9;
  let s = "★".repeat(full);
  if (half) s += "½";
  s += "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
  return s;
}
function googleRatingHTML(v, { compact = false } = {}) {
  const g = googlePlace(v);
  const href = googleMapsReviewsUrl(v);
  if (g && g.matched && Number(g.rating) > 0) {
    const n = g.reviewCount != null ? Number(g.reviewCount).toLocaleString("sv-SE") : "";
    if (compact) {
      return `<a class="g-rate" href="${esc(href)}" target="_blank" rel="noopener" title="Google"><span class="g-rate-num">${esc(String(g.rating))}</span><span class="g-rate-stars">${esc(googleStars(g.rating))}</span>${n ? `<span class="g-rate-n">(${esc(n)})</span>` : ""}</a>`;
    }
    return "";
  }
  if (compact) return "";
  return "";
}
function googleReviewsPanelHTML(v) {
  const g = googlePlace(v);
  const href = googleMapsReviewsUrl(v);
  const matched = !!(g && g.matched && Number(g.rating) > 0);
  const rows = matched && Array.isArray(g.reviews) ? g.reviews.filter((r) => r && r.text).slice(0, 5) : [];
  return `
  <div class="detail-panel google-panel">
    <h2 class="detail-panel-title">${esc(t("googleReviews"))}</h2>
    ${matched ? `
      <div class="g-hero">
        <div class="g-hero-score">${esc(String(g.rating))}</div>
        <div>
          <div class="g-hero-stars" aria-label="${esc(String(g.rating))} / 5">${esc(googleStars(g.rating))}</div>
          <p class="events-meta">${g.reviewCount != null ? `${esc(Number(g.reviewCount).toLocaleString("sv-SE"))} ${esc(t("googleCount"))}` : esc(t("googleChannel"))}${g.placeName ? ` · ${esc(g.placeName)}` : ""}</p>
        </div>
      </div>
      ${rows.length ? `<ul class="g-review-list">${rows.map((r) => `
        <li class="g-review">
          <div class="g-review-head">${r.rating ? `<span class="g-rate-stars">${esc(googleStars(r.rating))}</span>` : ""} <b>${esc(r.author || "")}</b>${r.relativeTime ? ` · ${esc(r.relativeTime)}` : ""}</div>
          <p>${esc(r.text)}</p>
        </li>`).join("")}</ul>` : ""}
    ` : `<p class="events-meta">${esc(t("googleNeedMatch"))}</p>`}
    <p class="events-actions"><a class="btn btn-gold btn-sm" href="${esc(href)}" target="_blank" rel="noopener">${esc(t("googleOpen"))} ↗</a></p>
    <p class="events-meta">${esc(t("googleHint"))}</p>
  </div>`;
}
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
  const list = rec && Array.isArray(rec.events) ? rec.events : [];
  const today = todayISO();
  return list.filter((e) => !e.date || e.date >= today);
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
  const rec = VENUE_EVENTS.venues[v.venue_id] || {};
  if (!evs.length && !apiBase()) return "";
  const rows = evs.map((e) => `
    <li class="event-row">
      <span class="event-when">${esc(eventWhen(e))}</span>
      <span class="event-body">
        <span class="event-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} ↗</a>` : esc(e.title)}</span>
        ${e.note ? `<span class="event-note">${esc(e.note)}</span>` : ""}
      </span>
    </li>`).join("");
  const src = rec.source ? ` · <a href="${esc(rec.source)}" target="_blank" rel="noopener">källa ↗</a>` : "";
  const fetched = (VENUE_EVENTS.fetchedAt || VENUE_EVENTS.fetched || "").slice(0, 10);
  const canRefresh = !!apiBase();
  return `
  <div class="detail-panel events-panel">
    <h2 class="detail-panel-title">🎟 ${esc(t("events"))} <span class="idv-badge ok">${esc(t("sharpEvent"))}</span></h2>
    ${rows ? `<ul class="event-list">${rows}</ul>` : ""}
    <p class="events-meta">${esc(t("eventsDaily"))}${fetched ? ` · ${esc(fetched)}` : ""}${src}</p>
    ${canRefresh ? `<p class="events-actions"><button type="button" class="btn btn-ghost btn-sm" id="ev-refresh">${esc(t("eventsRefresh"))}</button></p>` : ""}
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
  view().innerHTML = `
  <section class="section detail">
    <a class="detail-back" href="#/venues" data-nav>← Alla ställen</a>

    ${venueMediaHTML(v, "venue-hero-media", { eager: true, extra: favBtnHTML(v.venue_id, v.name) })}
    ${photoAttrHTML(v)}

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
        ${publicNote(v) ? `<p class="detail-notes">${esc(publicNote(v))}</p>` : ""}
        <div class="follow-block">
          ${v.instagram_url ? `
          <div class="follow-ig">
            <div>
              <div class="soc-handle">${esc(igHandle(v.instagram_url) || "Instagram")}</div>
              <p>Följ &amp; inspireras — ställets skyltfönster</p>
            </div>
            <a class="btn btn-gold btn-sm" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">Instagram ↗</a>
          </div>` : ""}
          <div class="detail-links">
            ${bookingLinkHTML(v)}
            <a class="icon-link" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
            ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">${esc(t("website"))} ↗</a>` : ""}
            ${v.tiktok_url ? `<a class="icon-link" href="${esc(v.tiktok_url)}" target="_blank" rel="noopener" aria-label="${esc(v.name)} på TikTok">${TIKTOK_ICON}<span>TikTok</span> ↗</a>` : ""}
            ${v.facebook_url ? `<a class="icon-link" href="${esc(v.facebook_url)}" target="_blank" rel="noopener" aria-label="${esc(v.name)} på Facebook">${FB_ICON}<span>Facebook</span> ↗</a>` : ""}
          </div>
        </div>
      </div>
      <div class="prio prio-lg">
        ${googlePlace(v)?.matched
          ? `<span class="prio-num">${esc(String(googlePlace(v).rating))}</span><span class="prio-label">Google</span>`
          : `<span class="prio-num">${num(v.priority_score)}</span><span class="prio-label">VELVET-prio</span>`}
      </div>
    </div>

    <div class="detail-grid">
      ${contactPanelHTML(v)}
      ${googleReviewsPanelHTML(v)}
      ${eventsSectionHTML(v)}
      <div class="detail-panel">
        <h2 class="detail-panel-title">${esc(t("velvetScore"))}</h2>
        <p class="events-meta">${esc(t("velvetScoreHint"))}</p>
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
        <p class="detail-cta-sub">${esc(t("clubSetsPrice"))}</p>
        <div class="detail-price" id="from-price">${esc(t("clubSetsPrice"))}</div>
        <p class="detail-cta-note">${esc(t("priceHonest"))}</p>
        ${bookingLinkHTML(v, { gold: true, full: true })}
        <a class="btn btn-ghost" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener" style="width:100%;margin-top:10px">${esc(t("directions"))} ↗</a>
        <button class="btn btn-ghost" id="d-book" style="width:100%;margin-top:10px">${esc(t("sendRequest"))}</button>
        <a class="btn btn-ghost" id="d-promo" href="#/promoter/${encodeURIComponent(v.venue_id)}" data-nav style="width:100%;margin-top:10px">${esc(t("chatPromoter"))}</a>
        <ul class="detail-perks">
          <li>${esc(t("perkSite"))}</li>
          <li>${esc(t("perkConcierge"))}</li>
          <li>${esc(t("perkSplit"))}</li>
        </ul>
      </div>
    </div>
    ${venueDockHTML(v)}
  </section>`;

  $("#d-book").addEventListener("click", () => openBookingModal(v));
  $("#dock-book")?.addEventListener("click", () => openBookingModal(v));
  $("#v-share")?.addEventListener("click", () => shareVenue(v));
  $("#dock-share")?.addEventListener("click", () => shareVenue(v));
  bindFavButtons(view());
  $("#ev-refresh")?.addEventListener("click", () => refreshVenueEvents(v));
  setTitle(v.name);
  if (apiBase()) {
    refreshLiveEvents().then((ok) => {
      if (!ok) return;
      if ((location.hash || "").split("?")[0] !== `#/venue/${v.venue_id}`) return;
      const panel = document.querySelector(".events-panel");
      const fresh = eventsSectionHTML(v);
      if (panel && fresh) {
        panel.outerHTML = fresh;
        $("#ev-refresh")?.addEventListener("click", () => refreshVenueEvents(v));
      } else if (!panel && fresh) {
        renderVenueDetail(id);
      }
    });
  }
}

// ---------- Booking modal ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const todayISO = () => new Date().toISOString().slice(0, 10);

function openBookingModal(v) {
  if (isSharpVenue(v) && !isIdvOk()) {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("modal-root");
    root.innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t("verifyTitle"))}" tabindex="-1">
        <button class="modal-close" id="m-close" aria-label="Stäng">✕</button>
        <h2>${esc(t("verifyTitle"))}</h2>
        <p class="modal-sub">${esc(t("sharpEvent"))}</p>
        <p style="color:var(--text-dim);margin:12px 0 20px">${esc(t("verifyNeed"))}</p>
        <a class="btn btn-gold" href="#/verify" data-nav id="m-go-verify" style="width:100%">${esc(t("verifyTitle"))}</a>
      </div>
    </div>`;
    const close = () => { root.innerHTML = ""; restoreFocus(opener); };
    $("#m-close")?.addEventListener("click", close);
    $("#overlay")?.addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
    $("#m-go-verify")?.addEventListener("click", close);
    return;
  }
  const pkgs = packagesFor(v);
  let sel = pkgs[0];
  let party = 4;
  let openSeats = 2;
  const guests = [];
  const host0 = loadHost();
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const root = document.getElementById("modal-root");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Förfrågan ${esc(v.name)}" tabindex="-1">
      <button class="modal-close" id="m-close" aria-label="Stäng">✕</button>
      <h2>${esc(v.name)}</h2>
      <div class="modal-sub">${esc(v.destination)} · ${esc(v.category)}</div>
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
              <div class="package-price">${esc(t("clubSetsPrice"))}</div>
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
        <label class="chk-row"><input type="checkbox" id="m-open" checked> ${t("openSeats")}</label>
        <p class="stepper-hint">${t("openSeatsHint")}</p>
        <div class="stepper" id="m-open-row" role="group" aria-label="${t("openSeatsCount")}">
          <button type="button" id="m-open-minus" aria-label="−">−</button>
          <span class="stepper-val" id="m-open-val">2</span>
          <button type="button" id="m-open-plus" aria-label="+">+</button>
        </div>
      </div>

      <div class="form-group">
        <label for="g-name">Bjud in sällskapet <span class="label-optional">(valfritt · namn och e-post följer med i mejlet till teamet, VELVET mejlar inte gästerna)</span></label>
        <div class="guest-row">
          <input type="text" id="g-name" placeholder="Namn" autocomplete="off">
          <input type="email" id="g-email" placeholder="E-post" autocomplete="off">
          <button class="btn btn-ghost btn-sm" id="g-add" type="button">Lägg till</button>
        </div>
        <div class="field-error hidden" id="err-guest" role="alert"></div>
        <div class="chip-list" id="g-chips" aria-live="polite"></div>
      </div>

      <div class="form-group">
        <label for="m-budget">${esc(t("optionalBudget"))} <span class="label-optional">(${esc(t("optional"))})</span></label>
        <input type="number" id="m-budget" min="0" step="50" inputmode="numeric" placeholder="${esc(t("budgetPh"))}">
        <p class="stepper-hint">${esc(t("budgetHint"))}</p>
      </div>

      <div class="split-box">
        <div class="split-per" id="m-per"></div>
        <div class="split-label">${esc(t("perPerson"))}</div>
        <div class="split-total" id="m-total"></div>
      </div>

      <p class="price-disclaimer">${esc(t("priceHonest"))}</p>
      <p class="price-disclaimer">Värd- och gästnamn/e-post ingår i mejlet till VELVET-teamet (FormSubmit → Gmail). VELVET mejlar inte gästerna. Ingen reservation förrän återkoppling.</p>
      <label class="consent-row" for="m-consent">
        <span class="consent-box"><input type="checkbox" id="m-consent" required></span>
        <span class="consent-text">Jag godkänner att uppgifterna (inkl. ifyllda gäster) går till VELVET via FormSubmit/Gmail eller Öppna i Mail. Ingen reservation. Se <a href="#/integritet" id="m-privacy">integritetspolicyn</a>.</span>
      </label>
      <details class="privacy-inline" id="m-privacy-details">
        <summary>Kort om hur uppgifterna hanteras</summary>
        <p>Personuppgiftsansvarig: Gabriel (VELVET), ${esc(CONCIERGE_MAIL)}. Rättslig grund: samtycke via kryssrutan. FormSubmit/Google kan ta emot uppgifter utanför EES när mejlvägen är aktiv. Gästuppgifter skickas bara om du har deras tillåtelse. Ingen reservation.</p>
      </details>
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

  const budgetVal = () => Math.max(0, Number($("#m-budget")?.value || 0));
  const update = () => {
    $("#m-party").textContent = party;
    const budget = budgetVal();
    const per = budget > 0 ? Math.ceil(budget / party) : 0;
    $("#m-per").textContent = moneyOrClub(per);
    $("#m-total").textContent = budget > 0
      ? `${fmtEUR(budget)} · ${t("splitOn")} ${party} ${t("people")}`
      : t("clubSetsPrice");
    const dateEl = $("#m-date");
    const dateTxt = dateEl && dateEl.value ? dateEl.value : "datum";
    $("#m-summary").innerHTML = `<strong>${esc(sel.name)}</strong> · ${esc(dateTxt)} · ${party} pers · ${esc(moneyOrClub(per))}`;
    $("#m-party-hint").textContent = guests.length
      ? `Du + ${guests.length} ${guests.length === 1 ? "inbjuden gäst" : "inbjudna gäster"}${party > minParty() ? ` + ${party - minParty()} utan namn` : ""}`
      : "";
  };

  const addGuest = () => {
    const name = $("#g-name").value.trim();
    const email = $("#g-email").value.trim();
    if (!name) { setErr("err-guest", "Ange ett namn på gästen."); $("#g-name").focus(); return; }
    if (email && !EMAIL_RE.test(email)) { setErr("err-guest", "E-postadressen ser inte giltig ut."); $("#g-email").focus(); return; }
    if (1 + guests.length + 1 > 20) { setErr("err-guest", "Max 20 personer per förfrågan."); return; }
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
  $("#m-minus").addEventListener("click", () => { party = Math.max(minParty(), party - 1); openSeats = Math.min(openSeats, Math.max(0, party - minParty())); update(); });
  $("#m-plus").addEventListener("click", () => { party = Math.min(20, party + 1); update(); });
  $("#m-date").addEventListener("change", update);
  $("#m-budget")?.addEventListener("input", update);
  const openRow = $("#m-open-row");
  const syncOpen = () => {
    const on = $("#m-open")?.checked;
    openRow?.classList.toggle("hidden", !on);
    if ($("#m-open-val")) $("#m-open-val").textContent = openSeats;
  };
  $("#m-open")?.addEventListener("change", syncOpen);
  $("#m-open-minus")?.addEventListener("click", () => { openSeats = Math.max(1, openSeats - 1); syncOpen(); });
  $("#m-open-plus")?.addEventListener("click", () => { openSeats = Math.min(Math.max(1, party - minParty()), openSeats + 1); syncOpen(); });
  syncOpen();

  const modalEl = root.querySelector(".modal");
  const untrap = trapFocus(modalEl);
  document.body.classList.add("modal-lock");
  setAppInert(true);
  const cleanup = () => {
    untrap();
    document.removeEventListener("keydown", onKey);
    if (modalTeardown === cleanup) modalTeardown = null;
  };
  modalTeardown = cleanup;
  const close = () => {
    cleanup();
    root.innerHTML = "";
    document.body.classList.remove("modal-lock");
    setAppInert(false);
    restoreFocus(opener);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $("#m-close").addEventListener("click", close);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
  const privacyLink = $("#m-privacy");
  if (privacyLink) {
    privacyLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const w = window.open(`${location.pathname}#/integritet`, "_blank", "noopener");
      if (!w) {
        const d = $("#m-privacy-details");
        if (d) d.open = true;
      }
    });
  }
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
    if (!$("#m-consent").checked) { setErr("err-confirm", "Bekräfta att vi får skicka uppgifterna till VELVET-teamet."); $("#m-consent").focus(); return; }

    const me = loadUser();
    const openOnPreview = !!$("#m-open")?.checked;
    if (openOnPreview && !me) {
      setErr("err-confirm", t("loginNeedJoin"));
      return;
    }
    const host = { name: hostName, email: hostEmail, phone: hostPhone, id: me?.id || "", provider: me?.provider || "", handle: me?.handle || "", paid: false };
    saveHost(host);
    const openOn = !!$("#m-open")?.checked;
    const booking = {
      id: `RQ-${Date.now().toString(36).toUpperCase()}`,
      venue_id: v.venue_id, venue: v.name, destination: v.destination,
      date, package: sel.name, total: budgetVal(),
      party, per_person: budgetVal() > 0 ? Math.ceil(budgetVal() / party) : 0,
      guests: guests.map((g) => ({ name: g.name, email: g.email, paid: false })),
      openSeats: openOn ? openSeats : 0,
      openLeft: openOn ? openSeats : 0,
      joiners: [],
      host,
      status: openOn ? "open" : "requested",
      sharp: isSharpVenue(v),
      created: new Date().toISOString(),
    };
    const btn = $("#m-confirm");
    btn.disabled = true;
    btn.textContent = "Skickar …";
    const sent = await sendConciergeRequest(booking);
    booking.delivery = sent;
    saveBookings([...loadBookings(), booking]);
    if (openOn) await publishTable(booking);
    cleanup();
    document.body.classList.add("modal-lock");
    showConfirmation(booking, opener);
  });

  renderChips();
  update();
}

function showConfirmation(b, opener) {
  const root = document.getElementById("modal-root");
  const sent = b.delivery === "sent";
  const heading = sent ? "Förfrågan skickad" : "Förfrågan sparad";
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" style="text-align:center" role="dialog" aria-modal="true" aria-label="${heading}" tabindex="-1">
      <button class="modal-close" id="m-close" aria-label="Stäng">✕</button>
      <div class="confirm-check">✓</div>
      <h2>${heading}</h2>
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
        <div class="confirm-guests-note">Gästlistan följer med förfrågan till VELVET-teamet. VELVET mejlar inte gästerna.</div>
      </div>` : ""}
      <div class="split-box">
        <div class="split-per">${esc(moneyOrClub(b.per_person))}</div>
        <div class="split-label">${esc(t("perPerson"))}</div>
        <div class="split-total">${esc(moneyOrClub(b.total))}</div>
      </div>
      <p class="price-disclaimer">${sent
        ? "Vi återkommer till din e-post när klubben svarat. Inget bord är reserverat ännu. Mail-knappen är en extra väg till teamet."
        : "Mejlvägen är inte bekräftad ännu — förfrågan ligger under Förfrågningar. Öppna i Mail för att skicka till VELVET-teamet."}</p>
      ${b.openSeats ? `<p class="invite-joined" role="status">${esc(t("openPublished"))}</p>` : ""}
      <div class="confirm-actions">
        ${b.openSeats ? `<a class="btn btn-gold" href="#/table/${encodeURIComponent(b.id)}" data-nav id="c-go">${esc(t("viewParty"))}</a>` : `<a class="btn btn-gold" href="#/bookings" data-nav id="c-go">Mina förfrågningar</a>`}
        <button class="btn btn-ghost" id="c-copy">Kopiera inbjudningstext</button>
        <a class="btn btn-ghost" id="c-ics" download="${esc(b.id)}.ics" href="${icsFor(b)}">Lägg till i kalendern</a>
        <a class="btn btn-ghost" href="${mailtoFor(b)}">Öppna i Mail</a>
        <button class="btn btn-ghost" id="c-close">Fortsätt utforska</button>
      </div>
    </div>
  </div>`;
  const modalEl = root.querySelector(".modal");
  const untrap = trapFocus(modalEl);
  document.body.classList.add("modal-lock");
  setAppInert(true);
  const teardown = () => {
    untrap();
    document.removeEventListener("keydown", onKey);
    if (modalTeardown === teardown) modalTeardown = null;
  };
  modalTeardown = teardown;
  const close = (refocus = true) => {
    teardown();
    root.innerHTML = "";
    document.body.classList.remove("modal-lock");
    setAppInert(false);
    if (refocus) restoreFocus(opener);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $("#m-close").addEventListener("click", close);
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
          <div class="booking-status">Förfrågan · inte reserverat</div>
          <div class="booking-delivery">${b.delivery === "sent" ? "Skickad till VELVET-teamet" : "Sparad lokalt"}</div>
          ${(b.guests || []).length ? `
          <div class="chip-list booking-guests">
            <span class="chip chip-self">Du</span>
            ${b.guests.map((g) => `<span class="chip">${esc(g.name)}</span>`).join("")}
          </div>` : ""}
        </div>
        <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap">
          <div class="booking-price">
            <div class="per">${esc(moneyOrClub(b.per_person))}</div>
            <div class="total">${esc(moneyOrClub(b.total))}</div>
          </div>
          <a class="btn btn-gold btn-sm" href="#/table/${encodeURIComponent(b.id)}" data-nav>${esc(t("viewParty"))}</a>
          ${b.delivery !== "sent" ? `<a class="btn btn-ghost btn-sm" href="${mailtoFor(b)}">Öppna i Mail</a>` : ""}
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

function renderInvalidLink() {
  view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🔗</div>
        <h3>Ogiltig inbjudningslänk</h3>
        <p>Länken verkar vara trasig eller ofullständig. Be värden dela en ny länk.</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>Utforska ställen</a></p>
      </div>
    </section>`;
}

// ---------- Inbjudningsvy (#/join/<base64>) ----------
function renderJoin(raw) {
  const inv = parseInvite(raw);
  if (!inv) {
    renderInvalidLink();
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
          <div class="split-per">${esc(moneyOrClub(inv.per_person))}</div>
          <div class="split-label">${esc(t("perPerson"))}</div>
          <div class="split-total">${esc(moneyOrClub(inv.total))}</div>
        </div>
        <div id="join-cta">
          ${already ? `
            <p class="invite-joined" role="status">✓ ${esc(t("alreadyIn"))}</p>
            <a class="btn btn-gold" href="#/table/${encodeURIComponent(inv.id)}" data-nav style="width:100%">${esc(t("viewParty"))}</a>` : `
            <button class="btn btn-gold" id="join-btn" style="width:100%">${esc(t("imIn"))}</button>
            <p class="invite-note">${esc(t("joinNote"))}</p>`}
        </div>
        ${v ? `<a class="icon-link invite-venue-link" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>Se stället →</a>` : ""}
      </div>
    </div>
  </section>`;

  const joinBtn = $("#join-btn");
  if (joinBtn) {
    joinBtn.addEventListener("click", async () => {
      if (!loadUser()) { openOnboarding({ dismissable: false }); return; }
      joinBtn.disabled = true;
      const r = await joinOpenTable(inv.id);
      if (r.error === "auth") { openOnboarding({ dismissable: false }); return; }
      if (r.error === "idv_required") { location.hash = "#/verify"; return; }
      if (!loadBookings().some((b) => b.id === inv.id)) {
        saveBookings([...loadBookings(), { ...inv, guests: [], joined: true, created: new Date().toISOString() }]);
      }
      location.hash = `#/table/${encodeURIComponent(inv.id)}`;
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
      <div><h2>Karta</h2><div class="sub">${publicDestinations().length} destinationer · ${publicVenues().length} verifierade ställen — klicka på en guldnål</div></div>
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
      publicDestinations().forEach((d) => {
        if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return;
        pts.push([d.lat, d.lng]);
        const count = publicVenues().filter((v) => v.destination === d.name).length;
        L.marker([d.lat, d.lng], { icon: goldPin(L), title: d.name, alt: d.name })
          .addTo(map)
          .bindPopup(`
            <div class="map-pop">
              <div class="map-pop-kicker">${esc(d.country)} · ${esc(d.tier)}</div>
              <div class="map-pop-name">${esc(d.name)}</div>
              <div class="map-pop-meta">${count} ${count === 1 ? "ställe" : "ställen"} · Säsong ${esc(d.peak_season)}</div>
              <a class="map-pop-link" href="#/destination/${encodeURIComponent(d.code)}">Visa destination →</a>
              <a class="map-pop-link" href="${esc(mapsGoogleQuery(destQuery(d)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
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
          <div class="map-pop-meta">${esc(t("clubSetsPrice"))}</div>
          <a class="map-pop-link" href="#/venue/${encodeURIComponent(v.venue_id)}">Se stället →</a>
          ${bookingUrlFor(v) ? `<br><a class="map-pop-link" href="#/book-site/${encodeURIComponent(v.venue_id)}">${esc(t("bookOnSiteShort"))} ↗</a>` : ""}
          <br><a class="map-pop-link" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
          ${v.instagram_url ? `<br><a class="map-pop-link" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">${esc(igHandle(v.instagram_url) || "Instagram")} ↗</a>` : ""}
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
  const langPicked = () => { try { return !!localStorage.getItem("velvet_lang_picked"); } catch { return false; } };
  let phase = dismissable ? "country" : (!langPicked() ? "lang" : (!loadUser() ? "auth" : "country"));
  let step = 1;
  let authProvider = null;
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
    if (phase === "lang" || phase === "auth") {
      const entryCover = coverVenueForDest(DESTINATIONS.find((d) => d.code === "IBZ")) || coverVenueForDest(DESTINATIONS[0]) || null;
      root.innerHTML = `
      <div class="ob-overlay" id="ob-overlay">
        <div class="ob-overlay-media" aria-hidden="true">${coverImgHTML(entryCover && entryCover.url)}</div>
        ${entryCover && entryCover.v ? `<div class="ob-overlay-credit">${photoAttrHTML(entryCover.v)}</div>` : ""}
        <div class="ob" role="dialog" aria-modal="true" aria-label="${esc(phase === "lang" ? t("chooseLang") : t("loginTitle"))}" tabindex="-1">
          <div class="ob-brand" aria-hidden="true">VELVET<span class="logo-dot">.</span></div>
          <div class="ob-brand-rule" aria-hidden="true"></div>
          ${phase === "lang" ? `
          <h1 class="ob-title">${esc(t("chooseLang"))}</h1>
          <p class="ob-sub">${esc(t("langSub"))}</p>
          <div class="lang-grid">
            ${LANGS.map((l) => `
              <button type="button" class="lang-card${currentLang() === l.id ? " on" : ""}" data-lang="${l.id}">
                <span class="lang-flag">${l.flag}</span>
                <span>${esc(l.label)}</span>
              </button>`).join("")}
          </div>` : `
          <h1 class="ob-title">${esc(t("loginTitle"))}</h1>
          <p class="ob-sub">${esc(t("loginSub"))}</p>
          <div class="social-grid">
            ${SOCIALS.map((s) => `
              <button type="button" class="social-btn" data-soc="${s.id}" style="--soc:${s.color};color:${s.dark ? "#111" : "#fff"}">${esc(t("loginWith"))} ${esc(s.label)}</button>`).join("")}
          </div>
          <p class="stepper-hint">${esc(t("loginAuto"))}</p>
          <div class="ob-actions"><button class="btn btn-ghost" id="ob-skip-auth">${esc(t("skipLogin"))}</button></div>
          `}
        </div>
      </div>`;
      const dialog = root.querySelector(".ob");
      untrap = trapFocus(dialog);
      dialog.focus();
      root.querySelectorAll("[data-lang]").forEach((el) => {
        el.addEventListener("click", () => {
          applyLang(el.dataset.lang);
          try { localStorage.setItem("velvet_lang_picked", "1"); } catch {}
          phase = loadUser() ? "country" : "auth";
          render();
        });
      });
      root.querySelectorAll("[data-soc]").forEach((el) => {
        el.addEventListener("click", async () => {
          el.disabled = true;
          await loginWithSocial(el.dataset.soc);
          if (loadUser()) { phase = "country"; render(); }
          else el.disabled = false;
        });
      });
      const skipA = $("#ob-skip-auth");
      if (skipA) skipA.addEventListener("click", () => { phase = "country"; render(); });
      return;
    }
    const countries = countryList();
    const inCountry = country ? countries.find((c) => c.country === country) : null;
    const dests = inCountry ? inCountry.dests : [];
    const dlgLabel = step === 1
      ? "Välj din destination — steg 1 av 2, välj land"
      : `Välj din destination — steg 2 av 2, ${country}`;

    const entryCover = coverVenueForDest(DESTINATIONS.find((d) => d.code === "IBZ"))
      || coverVenueForDest(DESTINATIONS[0]) || null;
    root.innerHTML = `
    <div class="ob-overlay" id="ob-overlay">
      <div class="ob-overlay-media" aria-hidden="true">${coverImgHTML(entryCover && entryCover.url)}</div>
      ${entryCover && entryCover.v ? `<div class="ob-overlay-credit">${photoAttrHTML(entryCover.v)}</div>` : ""}
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
          ${countries.map((c, i) => {
            const cover = coverVenueForCountry(c.country);
            return `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-country="${esc(c.country)}" role="button" tabindex="0" aria-label="Välj ${esc(c.country)}">
            <div class="ob-cover${cover ? "" : " img-fail"}">
              ${coverImgHTML(cover && cover.url)}
              <div class="dest-emblem ob-emblem" style="--h:${destHue(c.country)}" aria-hidden="true">${esc(c.country.slice(0, 2).toUpperCase())}</div>
            </div>
            ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
            <h3>${esc(c.country)}</h3>
            <div class="ob-meta">${c.dests.length} ${c.dests.length === 1 ? "destination" : "destinationer"}</div>
            <div class="ob-names">${c.dests.slice(0, 3).map((d) => esc(d.name)).join(" · ")}${c.dests.length > 3 ? " …" : ""}</div>
          </div>`;
          }).join("")}
        </div>` : `
        <h1 class="ob-title">Välj din <em>destination</em></h1>
        <p class="ob-sub">${dests.length} ${dests.length === 1 ? "destination" : "destinationer"} i ${esc(country)}.</p>
        <div class="ob-step">Steg 2 av 2 · ${esc(country)}</div>
        <div class="ob-grid">
          ${dests.map((d, i) => {
            const km = distanceToDest(d);
            const cover = coverVenueForDest(d);
            return `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-dest="${esc(d.code)}" role="button" tabindex="0" aria-label="Välj ${esc(d.name)}">
            <div class="ob-cover${cover ? "" : " img-fail"}">
              ${coverImgHTML(cover && cover.url)}
              <div class="dest-emblem ob-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
            </div>
            ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
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
      el.addEventListener("click", (e) => { if (e.target.closest("a, button")) return; fn(); });
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
  const valid = p && typeof p === "object" && !Array.isArray(p) && Array.isArray(p.ids);
  if (!valid) {
    renderInvalidLink();
    return;
  }
  const ids = p.ids.filter((id) => typeof id === "string");
  const list = ids.map((id) => VENUES.find((v) => v.venue_id === id)).filter(Boolean);
  const title = (typeof p.name === "string" && p.name) ? p.name : "Delad lista";
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
      saveFavs([...loadFavs(), ...list.map((v) => v.venue_id)]);
      save.textContent = "Sparad ✓";
      syncFavButtons();
    });
  }
}

async function renderOpenTables() {
  const tables = (await listOpenTables()).map((tb) => tb.members ? tb : decorateLocalTable(tb));
  const u = loadUser();
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>${esc(t("navOpen"))}</h2><div class="sub">${esc(t("openSeatsHint"))}</div></div>
    </div>
    ${!u ? `<p class="price-disclaimer"><button class="btn btn-gold btn-sm" id="open-login">${esc(t("loginTitle"))}</button></p>` : ""}
    ${tables.length === 0 ? `
      <div class="empty-state">
        <div class="big">🪑</div>
        <h3>${esc(t("noOpen"))}</h3>
        <p>${esc(t("noOpenHint"))}</p>
      </div>` : tables.map((tb) => {
        const per = tb.per_person || Math.ceil((Number(tb.total) || 0) / Math.max(1, Number(tb.party) || 1));
        return `
        <div class="booking-card">
          <div class="booking-info">
            <h3><a href="#/table/${encodeURIComponent(tb.id)}" data-nav>${esc(tb.venue)}</a></h3>
            <div class="booking-meta">${esc(tb.destination)} · ${esc(tb.date)} · ${esc(tb.package)} · ${tb.host?.id ? `<a href="#/user/${encodeURIComponent(tb.host.id)}" data-nav>${esc(tb.host?.name || "")}</a>` : esc(tb.host?.name || "")} ${tb.host?.handle ? "@" + esc(tb.host.handle) : ""}</div>
            <div class="booking-meta">${num(tb.openLeft)} ${esc(t("seatsOpen"))} · ${esc(t("splitOn"))} ${num(tb.party)} ${esc(t("people"))}</div>
            ${partyPreviewHTML(tb)}
          </div>
          <div class="booking-price">
            <div class="per">${esc(moneyOrClub(per))}</div>
            <a class="btn btn-ghost btn-sm" href="#/table/${encodeURIComponent(tb.id)}" data-nav>${esc(t("viewParty"))}</a>
            <button class="btn btn-gold btn-sm" data-join="${esc(tb.id)}">${esc(t("takeSeat"))}</button>
          </div>
        </div>`;
      }).join("")}
  </section>`;
  $("#open-login")?.addEventListener("click", () => openOnboarding({ dismissable: true }));
  document.querySelectorAll("[data-join]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!loadUser()) { openOnboarding({ dismissable: false }); return; }
      btn.disabled = true;
      const r = await joinOpenTable(btn.dataset.join);
      if (r.error === "auth") openOnboarding({ dismissable: false });
      else if (r.error === "idv_required") location.hash = "#/verify";
      else if (r.table) location.hash = `#/table/${encodeURIComponent(r.table.id)}`;
      else renderOpenTables();
    });
  });
}

async function renderTable(id) {
  const tb = await getTable(id);
  if (!tb) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>${esc(t("tableMissing"))}</h3>
        <p>${esc(t("tableMissingHint"))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/open" data-nav>${esc(t("navOpen"))}</a></p>
      </div>
    </section>`;
    return;
  }
  const me = loadUser();
  const members = tb.members || [];
  const already = !!(me && members.some((m) => m.id && m.id === me.id));
  const canJoin = Number(tb.openLeft) > 0 && !already;
  const hostId = tb.host?.id || "";
  setTitle(`${tb.venue} · ${t("partyTitle")}`);
  view().innerHTML = `
  <section class="section party-page">
    <a class="detail-back" href="#/open" data-nav>← ${esc(t("navOpen"))}</a>
    <p class="detail-kicker">${esc(tb.destination)} · ${esc(tb.date)} · ${esc(tb.package || "")}</p>
    <h1>${esc(tb.venue)}</h1>
    <p class="ob-sub" style="text-align:left;margin:6px 0 18px">${esc(t("partySub"))}</p>
    <div class="party-stats">
      <div><b>${esc(moneyOrClub(tb.per_person))}</b><span>${esc(t("perPerson"))}</span></div>
      <div><b>${num(tb.paidN)}/${num(tb.dueN)}</b><span>${esc(t("paid"))}</span></div>
      <div><b>${num(tb.openLeft)}</b><span>${esc(t("seatsOpen"))}</span></div>
      <div><b>${num(tb.party)}</b><span>${esc(t("people"))}</span></div>
    </div>
    <p class="price-disclaimer">${esc(t("payNote"))}</p>
    <h2 class="detail-panel-title" style="margin-top:8px">${esc(t("roster"))}</h2>
    <div class="person-list" id="party-list">
      ${members.map((p) => personRowHTML(p, { me, hostId, tableId: tb.id })).join("")}
    </div>
    <div class="book-site-actions" style="margin-top:22px;max-width:420px">
      ${!me ? `<button class="btn btn-gold" id="party-login">${esc(t("loginTitle"))}</button>` : ""}
      ${me && canJoin ? `<button class="btn btn-gold" id="party-join">${esc(t("takeSeat"))}</button>` : ""}
      ${already && me && members.some((m) => m.id === me.id && !m.paid) ? `<a class="btn btn-gold" href="#/pay/${encodeURIComponent(tb.id)}" data-nav>${esc(t("payShare"))}</a>` : ""}
      ${already ? `<p class="invite-joined">${esc(t("youAreIn"))}</p>` : ""}
      ${tb.venue_id ? `<a class="btn btn-ghost" href="#/venue/${encodeURIComponent(tb.venue_id)}" data-nav>${esc(t("explore"))}</a>` : ""}
    </div>
  </section>`;
  $("#party-login")?.addEventListener("click", () => openOnboarding({ dismissable: false }));
  $("#party-join")?.addEventListener("click", async () => {
    if (!loadUser()) { openOnboarding({ dismissable: false }); return; }
    const btn = $("#party-join");
    if (btn) btn.disabled = true;
    const r = await joinOpenTable(tb.id);
    if (r.error === "auth") openOnboarding({ dismissable: false });
    else if (r.error === "idv_required") location.hash = "#/verify";
    else renderTable(id);
  });
  document.querySelectorAll("[data-pay], [data-pay-name]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const r = await markPaid(tb.id, {
        targetId: btn.dataset.pay || "",
        targetName: btn.dataset.payName || "",
        paid: btn.dataset.paid === "1",
      });
      if (r.table) renderTable(id);
      else btn.disabled = false;
    });
  });
}

const PAY_METHODS = [
  { id: "card", icon: "💳" },
  { id: "applepay", icon: "" },
  { id: "googlepay", icon: "G" },
  { id: "revolut", icon: "R" },
  { id: "paypal", icon: "P" },
  { id: "klarna", icon: "K" },
  { id: "sepa", icon: "EU" },
  { id: "swift", icon: "SW" },
];

async function renderPay(tableId) {
  const me = loadUser();
  if (!me) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p><button class="btn btn-gold" id="p-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#p-login")?.addEventListener("click", () => openOnboarding({ dismissable: false }));
    return;
  }
  await refreshIdv();
  if (!isIdvOk()) {
    try { sessionStorage.setItem("velvet_after_idv", `#/pay/${tableId}`); } catch {}
    view().innerHTML = `
    <section class="section pay-page">
      <a class="detail-back" href="#/table/${encodeURIComponent(tableId)}" data-nav>← ${esc(t("navOpen"))}</a>
      <h1>${esc(t("verifyTitle"))}</h1>
      <p class="ob-sub" style="text-align:left">${esc(t("payNeedPassport"))}</p>
      <p style="margin-top:20px"><a class="btn btn-gold" href="#/verify" data-nav>${esc(t("verifyCta"))}</a></p>
    </section>`;
    return;
  }
  const tb = await getTable(tableId);
  const cfg = await apiJSON("/pay/config") || { methods: [], ready: false, currency: "EUR" };
  if (!tb) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("tableMissing"))}</h3><p style="margin-top:20px"><a class="btn btn-gold" href="#/open" data-nav>${esc(t("navOpen"))}</a></p></div></section>`;
    return;
  }
  const mine = (tb.members || []).find((m) => m.id === me.id);
  setTitle(`${t("payShare")} · ${tb.venue}`);
  view().innerHTML = `
  <section class="section pay-page">
    <a class="detail-back" href="#/table/${encodeURIComponent(tb.id)}" data-nav>← ${esc(tb.venue)}</a>
    <p class="detail-kicker">${esc(cfg.destination || "Revolut")} · ${esc(cfg.currency || "EUR")}</p>
    <h1>${esc(t("payShare"))}</h1>
    <p class="ob-sub" style="text-align:left">${esc(t("payIntro"))}</p>
    <div class="split-box" style="margin:18px 0">
      <div class="split-per">${esc(moneyOrClub(tb.per_person))}</div>
      <div class="split-label">${esc(t("perPerson"))} · ${esc(tb.venue)}</div>
    </div>
    ${mine?.paid ? `<p class="invite-joined">✓ ${esc(t("paid"))}${mine.paidVia ? ` · ${esc(mine.paidVia)}` : ""}</p>` : ""}
    ${!mine ? `<p class="price-disclaimer">${esc(t("payNeedJoin"))}</p>` : ""}
    <div class="pay-grid" id="pay-grid">
      ${PAY_METHODS.map((m) => {
        const spec = (cfg.methods || []).find((x) => x.id === m.id);
        const on = !!(spec && spec.enabled);
        return `<button type="button" class="pay-method${on ? "" : " off"}" data-method="${m.id}" ${on && mine && !mine.paid ? "" : "disabled"}>
          <span class="pay-ico">${m.id === "applepay" ? "Pay" : m.icon}</span>
          <b>${esc(t("pay_" + m.id))}</b>
          <span>${on ? esc(t("payToRevolut")) : esc(t("paySoon"))}</span>
        </button>`;
      }).join("")}
    </div>
    <div id="pay-bank" class="pay-bank hidden"></div>
    <div class="field-error hidden" id="pay-err" role="alert"></div>
    <p class="price-disclaimer">${esc(t("payHonest"))}</p>
  </section>`;
  document.querySelectorAll("[data-method]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const err = $("#pay-err");
      err.classList.add("hidden");
      btn.disabled = true;
      const r = await apiJSON("/pay/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: tb.id, user: me, method: btn.dataset.method }),
      });
      btn.disabled = false;
      if (r?.mode === "redirect" && r.url) {
        location.href = r.url;
        return;
      }
      if (r?.mode === "bank" && r.bank) {
        const box = $("#pay-bank");
        box.classList.remove("hidden");
        box.innerHTML = `
          <h2>${esc(t("payBankTitle"))}</h2>
          <p>${esc(t("payBankHint"))}</p>
          <div class="pay-iban">
            <div><span>IBAN</span><b id="iban-val">${esc(r.bank.iban)}</b></div>
            ${r.bank.bic ? `<div><span>BIC</span><b>${esc(r.bank.bic)}</b></div>` : ""}
            <div><span>${esc(t("payHolder"))}</span><b>${esc(r.bank.name || "Revolut")}</b></div>
            <div><span>${esc(t("payRef"))}</span><b id="ref-val">${esc(r.bank.reference)}</b></div>
            <div><span>${esc(t("payShare"))}</span><b>${fmtEUR(r.bank.amount)}</b></div>
          </div>
          ${r.bank.me ? `<p><a class="btn btn-gold" href="https://revolut.me/${esc(r.bank.me)}" target="_blank" rel="noopener">Revolut.me/${esc(r.bank.me)}</a></p>` : ""}
          <p style="margin-top:12px">
            <button type="button" class="btn btn-ghost btn-sm" id="copy-iban">${esc(t("copyIban"))}</button>
            <button type="button" class="btn btn-ghost btn-sm" id="copy-ref">${esc(t("copyRef"))}</button>
          </p>
          <p class="stepper-hint">${esc(t("payAfterBank"))}</p>`;
        $("#copy-iban")?.addEventListener("click", () => copyText(r.bank.iban));
        $("#copy-ref")?.addEventListener("click", () => copyText(r.bank.reference));
        return;
      }
      err.textContent = r?.message || t("payNoProcessor");
      err.classList.remove("hidden");
    });
  });
}

async function renderPayReturn() {
  const me = loadUser();
  const sid = new URLSearchParams(location.search).get("session_id") || "";
  view().innerHTML = `
  <section class="section">
    <div class="empty-state">
      <div class="spinner" aria-hidden="true"></div>
      <h3>${esc(t("payChecking"))}</h3>
    </div>
  </section>`;
  const r = sid ? await apiJSON("/pay/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: me, sessionId: sid }),
  }) : null;
  if (r?.ok && r.table) {
    showToast(t("paid"));
    location.hash = `#/table/${encodeURIComponent(r.table.id)}`;
    return;
  }
  view().innerHTML = `
  <section class="section">
    <div class="empty-state">
      <h3>${esc(t("payPending"))}</h3>
      <p>${esc(t("payPendingHint"))}</p>
      <p style="margin-top:20px"><a class="btn btn-gold" href="#/open" data-nav>${esc(t("navOpen"))}</a></p>
    </div>
  </section>`;
}

async function renderPayout() {
  const me = loadUser();
  if (!me || !isOperatorUser(me)) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("paySetupDenied"))}</h3></div></section>`;
    return;
  }
  const cfg = await apiJSON("/pay/config") || {};
  view().innerHTML = `
  <section class="section">
    <a class="detail-back" href="#/account" data-nav>← ${esc(t("account"))}</a>
    <h1>${esc(t("paySetup"))}</h1>
    <p class="ob-sub" style="text-align:left">${esc(t("paySetupSub"))}</p>
    <form id="pay-form" class="pay-form">
      <label>Revolut IBAN<input name="revolutIban" autocomplete="off" placeholder="IBAN från Revolut Business" value="${esc(cfg.account?.iban || "")}"></label>
      <label>BIC / SWIFT<input name="revolutBic" autocomplete="off" placeholder="BIC från Revolut" value="${esc(cfg.account?.bic || "")}"></label>
      <label>${esc(t("payHolder"))}<input name="revolutName" value="${esc(cfg.account?.name || "")}" placeholder="Namn på Revolut-kontot"></label>
      <label>Revolut.me<input name="revolutMe" value="${esc(cfg.account?.me || "")}" placeholder="användarnamn"></label>
      <label>Stripe secret (sk_live_… / sk_test_…)<input name="stripeSecret" type="password" placeholder="${cfg.keys?.stripe ? "•••• set" : ""}" autocomplete="off"></label>
      <label>Stripe webhook secret<input name="stripeWebhook" type="password" placeholder="${cfg.keys?.stripe ? "" : ""}" autocomplete="off"></label>
      <label>Revolut Merchant secret<input name="revolutMerchantSecret" type="password" placeholder="${cfg.keys?.revolut ? "•••• set" : ""}" autocomplete="off"></label>
      <label>PayPal client ID<input name="paypalClient" autocomplete="off"></label>
      <label>PayPal secret<input name="paypalSecret" type="password" autocomplete="off"></label>
      <label>Facebook / Instagram App ID<input name="facebookId" autocomplete="off"></label>
      <label>Facebook App secret<input name="facebookSecret" type="password" autocomplete="off"></label>
      <label>TikTok client key<input name="tiktokKey" autocomplete="off"></label>
      <label>TikTok secret<input name="tiktokSecret" type="password" autocomplete="off"></label>
      <label>Snapchat client ID<input name="snapchatId" autocomplete="off"></label>
      <label>Snapchat secret<input name="snapchatSecret" type="password" autocomplete="off"></label>
      <label>${esc(t("crawlKey"))}<input name="firecrawlKey" type="password" placeholder="${cfg.keys?.firecrawl ? "•••• set" : "fc-…"}" autocomplete="off"></label>
      <label>${esc(t("googlePlacesKey"))}<input name="googlePlacesKey" type="password" placeholder="${cfg.keys?.googlePlaces ? "•••• set" : "AIza…"}" autocomplete="off"></label>
      <p class="stepper-hint">${esc(t("crawlKeyHint"))}</p>
      <p class="stepper-hint">${esc(t("paySetupKeys"))}</p>
      <div class="field-error hidden" id="pay-setup-err"></div>
      <button class="btn btn-gold" type="submit">${esc(t("saveSettings"))}</button>
    </form>
    <p class="events-meta" id="crawl-status" style="margin-top:18px"></p>
    <p style="margin-top:8px"><button type="button" class="btn btn-ghost" id="crawl-now">${esc(t("crawlNow"))}</button></p>
  </section>`;
  $("#pay-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { user: me };
    for (const [k, v] of fd.entries()) if (String(v).trim()) body[k] = String(v).trim();
    const r = await apiJSON("/pay/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r?.ok) {
      const err = $("#pay-setup-err");
      if (err) { err.textContent = r?.error || t("paySetupDenied"); err.classList.remove("hidden"); }
      return;
    }
    showToast(t("savedOk"));
    renderPayout();
  });
  const stEl = $("#crawl-status");
  const paintCrawl = async () => {
    const st = await apiJSON("/events/status");
    if (!stEl || !st) return;
    const when = (st.lastOk || st.lastRun || "").replace("T", " ").slice(0, 16);
    stEl.textContent = st.running
      ? t("eventsRefreshing")
      : `${t("eventsDaily")}${when ? " · " + when : ""}${st.engine ? " · " + st.engine : ""}`;
  };
  paintCrawl();
  $("#crawl-now")?.addEventListener("click", async () => {
    const btn = $("#crawl-now");
    if (btn) { btn.disabled = true; btn.textContent = t("eventsRefreshing"); }
    const r = await apiJSON("/events/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me }),
    });
    if (r?.running) await pollEventsUntilIdle(180000);
    else if (r?.venues) VENUE_EVENTS = r;
    showToast(t("eventsCrawlOk"));
    if (btn) { btn.disabled = false; btn.textContent = t("crawlNow"); }
    paintCrawl();
  });
}

function starRow(n) {
  const v = Math.max(0, Math.min(5, Number(n) || 0));
  return `<span class="stars" aria-label="${v}/5">${"★".repeat(Math.round(v))}${"☆".repeat(5 - Math.round(v))}</span>`;
}

async function renderVerify() {
  const u = loadUser();
  if (!u) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p><button class="btn btn-gold" id="v-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#v-login")?.addEventListener("click", () => openOnboarding({ dismissable: false }));
    return;
  }
  await refreshIdv();
  const st = idvStatus();
  view().innerHTML = `
  <section class="section verify-page">
    <a class="detail-back" href="#/account" data-nav>← ${esc(t("account"))}</a>
    <h1>${esc(t("verifyTitle"))}</h1>
    <p class="ob-sub" style="margin:0 0 22px;text-align:left">${esc(t("verifySub"))}</p>
    ${st === "verified" ? `<p class="idv-badge ok">✓ ${esc(t("verifyOk"))}</p>` : ""}
    <p class="stepper-hint">${esc(t("verifyHint"))}</p>
    <div class="idv-grid">
      <label class="idv-slot">
        <span>${esc(t("verifyPassport"))}</span>
        <input type="file" id="idv-pass" accept="image/*" capture="environment">
        <img id="idv-pass-prev" alt="" hidden>
        <em>${esc(t("pickPhoto"))}</em>
      </label>
      <label class="idv-slot">
        <span>${esc(t("verifySelfie"))}</span>
        <input type="file" id="idv-self" accept="image/*" capture="user">
        <img id="idv-self-prev" alt="" hidden>
        <em>${esc(t("pickPhoto"))}</em>
      </label>
    </div>
    <p class="price-disclaimer">${esc(t("verifyStored"))}</p>
    <div class="field-error hidden" id="idv-err" role="alert"></div>
    <button class="btn btn-gold" id="idv-go" style="width:100%;margin-top:12px">${esc(t("verifyCta"))}</button>
  </section>`;
  const bindPrev = (inputId, imgId) => {
    $(inputId)?.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const data = await fileToJpeg(f);
        const img = $(imgId);
        img.src = data;
        img.hidden = false;
        img.dataset.data = data;
      } catch {
        showToast("Kunde inte läsa bilden.");
      }
    });
  };
  bindPrev("#idv-pass", "#idv-pass-prev");
  bindPrev("#idv-self", "#idv-self-prev");
  $("#idv-go")?.addEventListener("click", async () => {
    const pass = $("#idv-pass-prev")?.dataset.data;
    const self = $("#idv-self-prev")?.dataset.data;
    const err = $("#idv-err");
    if (!pass || !self) {
      err.textContent = t("verifyHint");
      err.classList.remove("hidden");
      return;
    }
    const btn = $("#idv-go");
    btn.disabled = true;
    btn.textContent = "…";
    const r = await apiJSON("/idv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, name: u.name || displayName(u), passport: pass, selfie: self }),
    });
    if (r?.idv?.status === "verified") {
      const next = (() => { try { const n = sessionStorage.getItem("velvet_after_idv") || ""; sessionStorage.removeItem("velvet_after_idv"); return n; } catch { return ""; } })();
      saveUser({ ...loadUser(), name: loadUser()?.name || displayName(u), idvStatus: "verified", idvSubmitted: r.idv.submitted });
      showToast(t("verifyOk"));
      if (next) { location.hash = next; return; }
      renderVerify();
      return;
    }
    // Local fallback if API is down: mark pending only — never store passport in localStorage.
    saveUser({ ...loadUser(), idvStatus: "pending" });
    err.textContent = t("verifyPending");
    err.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = t("verifyCta");
  });
}

async function renderUserProfile(id) {
  const data = await apiJSON(`/users/${encodeURIComponent(id)}`)
    || await apiJSON(`/reviews/${encodeURIComponent(id)}`)
    || { reviews: [], avg: 0, n: 0, idv: "none" };
  const me = loadUser();
  const u = data.user || {};
  const name = u.name || data.reviews?.[0]?.toName || id;
  const verified = (u.idv || data.idv) === "verified";
  const handle = u.handle ? `@${u.handle}` : "";
  view().innerHTML = `
  <section class="section">
    <a class="detail-back" href="#/open" data-nav>← ${esc(t("navOpen"))}</a>
    <div class="profile-head">
      <div class="person-avatar lg soc-${esc(u.provider || "none")}" aria-hidden="true">${esc((name || "?").slice(0, 1).toUpperCase())}</div>
      <div>
        <h1>${esc(name)}</h1>
        <p class="person-meta">
          ${u.provider ? `<span class="soc-pill">${esc(u.provider)}</span>` : ""}
          ${handle && u.socialUrl ? `<a class="person-handle" href="${esc(u.socialUrl)}" target="_blank" rel="noopener">${esc(handle)}</a>` : handle ? `<span class="person-handle">${esc(handle)}</span>` : ""}
          ${verified ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span>` : `<span class="idv-badge no">${esc(t("notVerified"))}</span>`}
        </p>
        <p>${starRow(data.avg)} ${data.n ? `(${data.n})` : t("noReviews")}</p>
      </div>
    </div>
    ${(data.tables || []).length ? `
      <h2 style="margin:28px 0 12px">${esc(t("roster"))}</h2>
      ${data.tables.map((tb) => `<p class="booking-meta"><a href="#/table/${encodeURIComponent(tb.id)}" data-nav>${esc(tb.venue)}</a> · ${esc(tb.date || "")} · ${esc(tb.role === "host" ? t("hostRole") : t("guestRole"))}</p>`).join("")}
    ` : ""}
    <h2 style="margin:28px 0 12px">${esc(t("reviews"))}</h2>
    ${(data.reviews || []).length ? data.reviews.map((r) => `
      <div class="review-card">
        <div>${starRow(r.rating)} <b>${esc(r.fromName || "")}</b></div>
        <p>${esc(r.text)}</p>
      </div>`).join("") : `<p class="price-disclaimer">${esc(t("noReviews"))}</p>`}
    ${me && me.id !== id ? `
      <h2 style="margin:28px 0 12px">${esc(t("writeReview"))}</h2>
      <p class="stepper-hint">${esc(t("reviewHint"))}</p>
      <div class="star-pick" id="rv-stars">${[1,2,3,4,5].map((n) => `<button type="button" data-star="${n}">☆</button>`).join("")}</div>
      <textarea id="rv-text" rows="3" maxlength="500" style="width:100%;margin:12px 0"></textarea>
      <div class="field-error hidden" id="rv-err"></div>
      <button class="btn btn-gold" id="rv-go">${esc(t("writeReview"))}</button>` : ""}
  </section>`;
  let stars = 5;
  const paintStars = () => {
    document.querySelectorAll("[data-star]").forEach((b) => { b.textContent = Number(b.dataset.star) <= stars ? "★" : "☆"; });
  };
  paintStars();
  document.querySelectorAll("[data-star]").forEach((b) => b.addEventListener("click", () => { stars = Number(b.dataset.star); paintStars(); }));
  $("#rv-go")?.addEventListener("click", async () => {
    const r = await apiJSON("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: me, to: { id, name }, rating: stars, text: $("#rv-text")?.value || "", tableId: "" }),
    });
    if (!r?.review) {
      const err = $("#rv-err");
      if (err) { err.textContent = t("reviewHint"); err.classList.remove("hidden"); }
      return;
    }
    renderUserProfile(id);
  });
}

async function renderAccount() {
  const u = loadUser();
  if (u) await refreshIdv();
  const st = idvStatus();
  let mine = { reviews: [], avg: 0, n: 0 };
  if (u) mine = await apiJSON(`/reviews/${encodeURIComponent(u.id)}`) || mine;
  view().innerHTML = `
  <section class="section">
    <div class="section-head"><div><h2>${esc(t("account"))}</h2></div></div>
    ${u ? `
      <div class="profile-head" style="margin-bottom:16px">
        <div class="person-avatar lg soc-${esc(u.provider || "none")}" aria-hidden="true">${esc((displayName(u) || "?").slice(0, 1).toUpperCase())}</div>
        <div>
          <p>${esc(t("loggedInAs"))} <b>${esc(displayName(u))}</b></p>
          <p class="person-meta">
            <span class="soc-pill">${esc(u.provider)}</span>
            ${u.handle ? (socialUrl(u.provider, u.handle)
              ? `<a class="person-handle" href="${esc(socialUrl(u.provider, u.handle))}" target="_blank" rel="noopener">@${esc(u.handle)}</a>`
              : `<span class="person-handle">@${esc(u.handle)}</span>`) : ""}
            ${st === "verified" ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span>` : `<a class="btn btn-gold btn-sm" href="#/verify" data-nav>${esc(t("verifyTitle"))}</a>`}
          </p>
        </div>
      </div>
      <p>${starRow(mine.avg)} ${mine.n ? `(${mine.n} ${t("reviews")})` : t("noReviews")}</p>
      ${isOperatorUser(u) ? `<p style="margin-top:12px"><a class="btn btn-gold btn-sm" href="#/payout" data-nav>${esc(t("paySetup"))}</a></p>` : ""}
      <p style="margin-top:16px"><button class="btn btn-ghost" id="acc-out">${esc(t("logout"))}</button></p>` : `
      <p>${esc(t("loginSub"))}</p>
      <p style="margin-top:16px"><button class="btn btn-gold" id="acc-in">${esc(t("loginTitle"))}</button></p>`}
    <h3 style="margin:28px 0 12px">${esc(t("chooseLang"))}</h3>
    <div class="lang-grid">
      ${LANGS.map((l) => `<button type="button" class="lang-card${currentLang() === l.id ? " on" : ""}" data-lang="${l.id}"><span class="lang-flag">${l.flag}</span><span>${esc(l.label)}</span></button>`).join("")}
    </div>
  </section>`;
  $("#acc-out")?.addEventListener("click", () => { logoutUser(); renderAccount(); });
  $("#acc-in")?.addEventListener("click", () => openOnboarding({ dismissable: false }));
  document.querySelectorAll("[data-lang]").forEach((el) => {
    el.addEventListener("click", () => {
      applyLang(el.dataset.lang);
      try { localStorage.setItem("velvet_lang_picked", "1"); } catch {}
      document.getElementById("nav-lang").textContent = currentLang().toUpperCase();
      renderAccount();
    });
  });
}

function renderLegal(kind) {
  const villkor = kind === "villkor";
  view().innerHTML = `
  <section class="section legal">
    <a class="detail-back" href="#/" data-nav>← Start</a>
    <h1>${villkor ? "Villkor" : "Integritet"}</h1>
    ${villkor ? `
      <p>VELVET är en oregistrerad concierge-förhandsversion. Ni skickar en <b>förfrågan</b> om VIP-bord, cabana eller daybed. Det är inte en bindande bokning, inte en betalning, inte ett bokningsavtal med klubben och inte en reservation hos klubben.</p>
      <h2>Operatör</h2>
      <p>Förhandsversionen drivs av Gabriel (VELVET), fysisk person — inte ett registrerat bolag. Kontakt: <a href="mailto:${esc(CONCIERGE_MAIL)}">${esc(CONCIERGE_MAIL)}</a>. Inget organisationsnummer.</p>
      <h2>Vad som händer</h2>
      <ul>
        <li>VELVET-teamet tar förfrågan mot klubben manuellt.</li>
        <li>Priser i appen är indikativa mockar beräknade från research-scores — klubben sätter det riktiga priset.</li>
        <li>Bilder tillhör respektive ställe/fotograf och används som förhandsvisning, inte i kommersiell drift utan licens.</li>
        <li>Inga automatiska avgifter dras i den här versionen.</li>
      </ul>
      <h2>Ansvar</h2>
      <p>Klubbarna äger sitt inventarie. Klubbens husregler (ålder, ID, klädsel, minimi-spend, insläpp) gäller. VELVET garanterar inte tillgänglighet, minimi-spend eller insläpp. En förfrågan kan avslås.</p>
    ` : `
      <p>Personuppgiftsansvarig är Gabriel (VELVET). Kontakt: <a href="mailto:${esc(CONCIERGE_MAIL)}">${esc(CONCIERGE_MAIL)}</a>.</p>
      <h2>Rättslig grund</h2>
      <p>Behandling av förfrågningsuppgifter sker med samtycke (GDPR art. 6.1 a) via kryssrutan i förfrågan. Ni kan återkalla samtycket genom att mejla oss — en redan skickad förfrågan kan redan ha nått oss.</p>
      <h2>Vad vi samlar in</h2>
      <p>Namn, e-post, valfritt telefonnummer, ställe, datum, sällskapsstorlek och gästlista ni själva fyller i. Gästnamn och gäst-e-post lämnar enheten bara om värden har fyllt i dem — värden måste ha gästernas tillåtelse att dela uppgifterna med VELVET.</p>
      <h2>Lagring</h2>
      <ul>
        <li>Förfrågningar: <code>velvet_bookings_v1</code> i localStorage.</li>
        <li>Favoriter: <code>velvet_favs_v1</code> i localStorage.</li>
        <li>Värdprofil (namn, e-post, telefon) sparas separat i <code>velvet_host_v1</code> i localStorage och sessionStorage så fälten kan fyllas i nästa gång — inte samma nyckel som förfrågningar eller favoriter.</li>
        <li>Tills FormSubmit-inkorgen är bekräftad stannar förfrågan på enheten. Ni kan skicka den via «Öppna i Mail». När mejlvägen är aktiv skickas förfrågan via FormSubmit till VELVET-teamets Gmail (${esc(CONCIERGE_MAIL)}). FormSubmit vidarebefordrar, Gmail lagrar kopian. FormSubmit och Google/Gmail är personuppgiftsbiträden utanför EES (USA).</li>
        <li>Positionsdata används bara i sessionen, om ni själva trycker på «Använd min plats».</li>
      </ul>
      <h2>Övriga mottagare</h2>
      <ul>
        <li>Typsnitt (Playfair Display, Inter) är självvärdade i appen — ingen IP till Google Fonts.</li>
        <li>Bilder på ställen laddas direkt från klubbarnas sajter (100+ CDN:er via inbäddad <code>&lt;img&gt;</code>). Det är förhandsvisning, inte kommersiell licens — er IP syns där.</li>
        <li>Herovideon kommer från Pexels (<a href="${esc(HERO_VIDEO.credit)}" target="_blank" rel="noopener">Video: Pexels</a>) — er IP syns hos Pexels.</li>
        <li>Kartan använder Leaflet från unpkg och kartplattor från CARTO.</li>
      </ul>
      <h2>Rättigheter</h2>
      <p>Mejla ${esc(CONCIERGE_MAIL)} för radering. Ni kan rensa webbläsardata när som helst — då försvinner lokala förfrågningar, favoriter och värdprofil.</p>
    `}
  </section>`;
}

// ---------- Global sök (/) ----------
function searchHits(q) {
  const s = fold(q.trim());
  if (s.length < 1) return [];
  const out = [];
  for (const d of DESTINATIONS) {
    if (fold(`${d.name} ${d.country} ${d.code}`).includes(s)) {
      out.push({ kind: "Destination", title: d.name, meta: d.country, href: `#/destination/${encodeURIComponent(d.code)}` });
    }
  }
  for (const v of VENUES) {
    if (!venueVisible(v, q)) continue;
    if (fold(`${v.name} ${v.destination} ${v.category}`).includes(s) || !isPublicVenue(v)) {
      out.push({
        kind: isPublicVenue(v) ? "Ställe" : t("unverified"),
        title: v.name,
        meta: `${v.destination} · ${v.category}`,
        href: `#/venue/${encodeURIComponent(v.venue_id)}`,
      });
    }
  }
  return out.slice(0, 12);
}

let searchCloser = null;
function openSearch() {
  if (searchCloser) return;
  if (document.body.classList.contains("modal-lock") || document.body.classList.contains("ob-lock")) return;
  const root = document.getElementById("search-root");
  if (!root) return;
  const opener = document.getElementById("nav-search") || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  if (opener && opener.id === "nav-search") opener.setAttribute("aria-expanded", "true");
  root.innerHTML = `
    <div class="search-overlay" id="search-overlay">
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Sök" tabindex="-1">
        <div class="search-head">
          <input type="search" id="search-q" placeholder="Sök ställe, stad, kategori…" autocomplete="off"
            role="combobox" aria-autocomplete="list" aria-controls="search-hits" aria-expanded="true" aria-activedescendant="" aria-label="Sök">
          <button type="button" class="search-close" id="search-close" aria-label="Stäng" title="Stäng">✕</button>
        </div>
        <div class="sr-only" id="search-status" role="status" aria-live="polite"></div>
        <div class="search-hits" id="search-hits" role="listbox"></div>
        <div class="search-empty" id="search-empty">Skriv för att söka</div>
      </div>
    </div>`;
  const panel = root.querySelector(".search-panel");
  const overlay = $("#search-overlay");
  const input = $("#search-q");
  const hitsEl = $("#search-hits");
  const emptyEl = $("#search-empty");
  const statusEl = $("#search-status");
  let active = 0;
  let hits = [];
  const untrap = trapFocus(panel);
  document.body.classList.add("modal-lock");
  setAppInert(true);
  const vv = window.visualViewport;
  const fitViewport = () => {
    if (!vv || !window.matchMedia("(max-width:720px)").matches) {
      if (overlay) { overlay.style.height = ""; overlay.style.top = ""; }
      panel.style.height = "";
      return;
    }
    if (document.activeElement === input) {
      const h = `${Math.round(vv.height)}px`;
      overlay.style.height = h;
      overlay.style.top = `${Math.round(vv.offsetTop)}px`;
      panel.style.height = h;
    }
  };
  if (vv) vv.addEventListener("resize", fitViewport);
  const close = () => {
    if (searchCloser !== close) return;
    searchCloser = null;
    untrap();
    document.removeEventListener("keydown", onDocKey, true);
    if (vv) vv.removeEventListener("resize", fitViewport);
    root.innerHTML = "";
    document.body.classList.remove("modal-lock");
    setAppInert(false);
    if (opener && opener.id === "nav-search") opener.setAttribute("aria-expanded", "false");
    restoreFocus(opener);
  };
  searchCloser = close;
  const onDocKey = (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close();
  };
  document.addEventListener("keydown", onDocKey, true);
  const syncActive = () => {
    hitsEl.querySelectorAll(".search-hit").forEach((el, i) => {
      const on = i === active;
      el.classList.toggle("active", on);
      el.setAttribute("aria-selected", String(on));
    });
    input.setAttribute("aria-activedescendant", hits.length ? `search-opt-${active}` : "");
    const sel = hitsEl.querySelector(".search-hit.active");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  };
  const paint = () => {
    hits = searchHits(input.value);
    active = 0;
    const q = input.value.trim();
    if (!hits.length) {
      hitsEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = q ? "Inga träffar" : "Skriv för att söka";
      statusEl.textContent = q ? "Inga träffar" : "";
    } else {
      emptyEl.hidden = true;
      statusEl.textContent = `${hits.length} träffar`;
      hitsEl.innerHTML = hits.map((h, i) => `
        <div class="search-hit${i === 0 ? " active" : ""}" id="search-opt-${i}" data-i="${i}" role="option" aria-selected="${i === 0}">
          <div><div>${esc(h.title)}</div><div class="search-hit-k">${esc(h.kind)}</div></div>
          <div class="search-hit-k">${esc(h.meta)}</div>
        </div>`).join("");
      hitsEl.querySelectorAll(".search-hit").forEach((el) => {
        el.addEventListener("click", () => go(Number(el.dataset.i)));
      });
    }
    syncActive();
  };
  const go = (i) => {
    const h = hits[i];
    if (!h) return;
    close();
    location.hash = h.href.replace(/^#/, "#");
  };
  input.addEventListener("input", paint);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!hits.length) return; active = Math.min(hits.length - 1, active + 1); syncActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (!hits.length) return; active = Math.max(0, active - 1); syncActive(); }
    else if (e.key === "Enter") { e.preventDefault(); go(active); }
  });
  $("#search-close").addEventListener("click", close);
  $("#search-overlay").addEventListener("click", (e) => { if (e.target.id === "search-overlay") close(); });
  input.addEventListener("focus", fitViewport);
  input.addEventListener("blur", () => {
    overlay.style.height = "";
    overlay.style.top = "";
    panel.style.height = "";
  });
  paint();
  input.focus();
  fitViewport();
}

function initSearch() {
  const btn = document.getElementById("nav-search");
  if (btn) btn.addEventListener("click", openSearch);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/") return;
    if (document.body.classList.contains("modal-lock") || document.body.classList.contains("ob-lock")) return;
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

let chatPoll = null;
function stopChatPoll() {
  if (chatPoll) { clearInterval(chatPoll); chatPoll = null; }
}

async function renderPromoterChat(venueId) {
  const v = VENUES.find((x) => x.venue_id === venueId);
  if (!v) { render404("#/promoter/" + venueId); return; }
  const me = loadUser();
  if (!me) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p>${esc(t("chatPromoter"))}</p><p style="margin-top:16px"><button class="btn btn-gold" id="ch-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#ch-login")?.addEventListener("click", () => openOnboarding({ dismissable: false }));
    return;
  }
  setTitle(t("promoter") + " · " + v.name);
  let threadId = me.id;
  let promoter = false;
  let threads = [];

  const paint = (messages) => {
    const box = document.getElementById("chat-log");
    if (!box) return;
    if (!messages.length) {
      box.innerHTML = `<p class="chat-empty">${esc(t("noMsgs"))}</p>`;
      return;
    }
    box.innerHTML = messages.map((m) => `
      <div class="chat-bubble ${m.role === "promoter" ? "promo" : (m.userId === me.id ? "mine" : "")}">
        <div class="chat-who">${m.role === "promoter" ? esc(t("promoter")) : esc(m.name || "")}</div>
        <div class="chat-text">${esc(m.text)}</div>
      </div>`).join("");
    box.scrollTop = box.scrollHeight;
  };
  const paintInbox = () => {
    const el = document.getElementById("chat-inbox");
    if (!el) return;
    el.innerHTML = threads.map((th) => `
      <button type="button" class="chat-thread${th.threadId === threadId ? " on" : ""}" data-th="${esc(th.threadId)}">
        <b>${esc(th.name)}</b>
        <span>${esc((th.last || "").slice(0, 60))}</span>
      </button>`).join("");
    el.querySelectorAll("[data-th]").forEach((b) => b.addEventListener("click", () => {
      threadId = b.dataset.th;
      loadThread();
      paintInbox();
    }));
  };

  async function loadThread() {
    const q = `/chats/${encodeURIComponent(venueId)}?userId=${encodeURIComponent(me.id)}&thread=${encodeURIComponent(threadId)}`;
    const data = await apiJSON(q);
    if (data) {
      promoter = !!data.promoter;
      paint(data.messages || []);
      return data.messages || [];
    }
    return [];
  }
  async function loadInbox() {
    const data = await apiJSON(`/chats/${encodeURIComponent(venueId)}/inbox?userId=${encodeURIComponent(me.id)}`);
    if (data?.threads) { promoter = true; threads = data.threads; if (threads[0] && !threads.some((x) => x.threadId === threadId)) threadId = threads[0].threadId; }
    paintInbox();
  }

  view().innerHTML = `
  <section class="section chat-page">
    <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
    <h1>${esc(t("promoter"))} · ${esc(v.name)}</h1>
    <p class="ob-sub" style="text-align:left;margin:0 0 16px">${esc(t("promoterSub"))}</p>
    <div class="chat-layout">
      <aside class="chat-inbox hidden" id="chat-inbox"></aside>
      <div class="chat-main">
        <div class="chat-log" id="chat-log"></div>
        <form class="chat-form" id="chat-form">
          <input type="text" id="chat-in" maxlength="800" placeholder="${esc(t("msgPh"))}" autocomplete="off">
          <button class="btn btn-gold" type="submit">${esc(t("sendMsg"))}</button>
        </form>
      </div>
    </div>
    <p style="margin-top:14px"><button class="btn btn-ghost btn-sm" id="claim-promo">${esc(t("iAmPromoter"))}</button></p>
  </section>`;

  $("#chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#chat-in");
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    const data = await apiJSON(`/chats/${encodeURIComponent(venueId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, text, threadId, asPromoter: promoter }),
    });
    if (data?.messages) paint(data.messages);
    if (promoter) loadInbox();
  });
  $("#claim-promo")?.addEventListener("click", async () => {
    await apiJSON(`/chats/${encodeURIComponent(venueId)}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me }),
    });
    $("#chat-inbox")?.classList.remove("hidden");
    await loadInbox();
    await loadThread();
  });

  await loadThread();
  if (promoter) {
    $("#chat-inbox")?.classList.remove("hidden");
    await loadInbox();
  }
  stopChatPoll();
  chatPoll = setInterval(() => { loadThread(); if (promoter) loadInbox(); }, 4000);
}

function renderBookSite(id) {
  const v = VENUES.find((x) => x.venue_id === id);
  if (!v) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>${esc(t("venueMissing"))}</h3>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>${esc(t("explore"))}</a></p>
      </div>
    </section>`;
    return;
  }
  const b = bookingUrlFor(v);
  if (!b) {
    view().innerHTML = `
    <section class="section">
      <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
      <div class="empty-state">
        <div class="big">🌐</div>
        <h3>${esc(t("bookOnSiteNone"))}</h3>
        <p>${esc(t("bookOnSiteNoneHint"))}</p>
        <p style="margin-top:20px"><button class="btn btn-gold" id="bs-velvet">${esc(t("sendRequest"))}</button></p>
      </div>
    </section>`;
    $("#bs-velvet")?.addEventListener("click", () => openBookingModal(v));
    setTitle(v.name);
    return;
  }
  const kindLabel = b.kind === "vip" ? t("bookKindVip") : b.kind === "events" ? t("bookKindEvents") : t("bookKindSite");
  setTitle(`${t("bookOnSite")} · ${v.name}`);
  view().innerHTML = `
  <section class="section book-site">
    <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
    <div class="book-site-hero">
      ${venueMediaHTML(v, "venue-hero-media", { eager: true })}
      <div class="book-site-copy">
        <p class="detail-kicker">${esc(v.destination)} · ${esc(kindLabel)} · ${esc(b.host)}</p>
        <h1>${esc(t("bookOnSite"))}</h1>
        <p class="ob-sub" style="text-align:left;margin:8px 0 0">${esc(t("bookOnSiteLeave"))}</p>
        <div class="book-site-actions">
          <a class="btn btn-gold" id="bs-open" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(t("bookOnSiteOpen"))} ↗</a>
          <button class="btn btn-ghost" type="button" id="bs-velvet">${esc(t("sendRequest"))}</button>
          <a class="btn btn-ghost" href="#/promoter/${encodeURIComponent(v.venue_id)}" data-nav>${esc(t("chatPromoter"))}</a>
        </div>
        <p class="book-site-url">${esc(b.host)} · ${esc(b.url)}</p>
        <p class="detail-cta-note" style="margin-bottom:0">${esc(t("bookOnSiteNote"))}</p>
      </div>
    </div>
    ${b.social ? "" : `
    <div class="book-site-frame-wrap">
      <div class="book-site-frame-bar">
        <span>${esc(t("bookOnSiteIframe"))}</span>
        <a class="icon-link" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(t("bookOnSiteOpen"))} ↗</a>
      </div>
      <iframe class="book-site-frame" src="${esc(b.url)}" title="${esc(v.name)} — ${esc(t("bookOnSite"))}" referrerpolicy="no-referrer-when-downgrade" loading="eager" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"></iframe>
    </div>`}
  </section>`;
  $("#bs-velvet")?.addEventListener("click", () => openBookingModal(v));
}

// ---------- Router ----------
const routes = {
  "": renderHome,
  "#/": renderHome,
  "#/destinations": renderDestinations,
  "#/venues": renderVenues,
  "#/map": renderMapView,
  "#/bookings": renderBookings,
  "#/open": () => { renderOpenTables(); },
  "#/verify": () => { renderVerify(); },
  "#/account": renderAccount,
  "#/payout": () => { renderPayout(); },
  "#/pay-return": () => { renderPayReturn(); },
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
  { re: /^#\/user\/(.+)$/, fn: renderUserProfile, nav: "#/account" },
  { re: /^#\/promoter\/(.+)$/, fn: renderPromoterChat, nav: "#/venues" },
  { re: /^#\/book-site\/(.+)$/, fn: renderBookSite, nav: "#/venues" },
  { re: /^#\/table\/(.+)$/, fn: renderTable, nav: "#/open" },
  { re: /^#\/pay\/(.+)$/, fn: renderPay, nav: "#/open" },
];

// Trasiga %-sekvenser i hashen får inte krascha routern
const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

function route() {
  // Stäng ev. öppen modal vid ruttbyte (t.ex. bakåtknapp med öppen modal)
  if (modalTeardown) modalTeardown();
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot && modalRoot.innerHTML) modalRoot.innerHTML = "";
  document.body.classList.remove("modal-lock");
  setAppInert(false);
  if (searchCloser) searchCloser();
  // Riv aktiva Leaflet-kartor innan vyn skrivs över — annars läcker lyssnare
  destroyMaps();
  stopChatPoll();
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
    // Kommande events: statisk JSON som fallback, sedan live API (daglig Firecrawl)
    await loadVenueEvents();
    try {
      const rb = await fetch("data/booking-urls.json");
      if (rb.ok) BOOKING_URLS = await rb.json() || {};
    } catch (_) { BOOKING_URLS = {}; }
    try {
      const rg = await fetch("data/google-places.json", { cache: "no-store" });
      if (rg.ok) {
        const g = await rg.json();
        if (g && g.venues) GOOGLE_PLACES = g;
        else if (g && typeof g === "object") GOOGLE_PLACES = { fetchedAt: null, venues: g };
      }
    } catch { /* optional */ }
  } catch (err) {
    console.error("VELVET: datainläsning misslyckades", err);
    renderLoadError();
    return;
  }
  try {
    const rx = await fetch("data/extra-destinations.json");
    if (rx.ok) {
      const extraD = await rx.json();
      if (Array.isArray(extraD)) d = d.concat(extraD);
    }
  } catch { /* optional */ }
  try {
    const ru = await fetch("data/unlisted-venues.json");
    if (ru.ok) {
      const extraV = await ru.json();
      if (Array.isArray(extraV)) v = v.concat(extraV);
    }
  } catch { /* optional */ }
  DESTINATIONS = d;
  VENUES = v;
  const livePlaces = await apiJSON("/places");
  if (livePlaces && livePlaces.venues) GOOGLE_PLACES = livePlaces;
  const existing = loadUser();
  if (existing) registerUser(existing);
  const authTok = new URLSearchParams(location.search).get("auth");
  if (authTok) {
    const sess = await apiJSON("/auth/session?token=" + encodeURIComponent(authTok));
    if (sess?.user) saveUser({ ...sess.user, created: sess.user.created || new Date().toISOString() });
    history.replaceState(null, "", location.pathname + (location.hash || "#/"));
  }
  const sid = new URLSearchParams(location.search).get("session_id");
  if (sid && (!location.hash || location.hash === "#/" || location.hash === "#")) {
    location.hash = "#/pay-return";
  }
  if (!uiBound) {
    uiBound = true;
    bootLang();
    paintUser();
    const langBtn = document.getElementById("nav-lang");
    if (langBtn) {
      langBtn.textContent = currentLang().toUpperCase();
      langBtn.addEventListener("click", () => {
        const ids = LANGS.map((l) => l.id);
        const i = ids.indexOf(currentLang());
        applyLang(ids[(i + 1) % ids.length]);
        try { localStorage.setItem("velvet_lang_picked", "1"); } catch {}
        langBtn.textContent = currentLang().toUpperCase();
        route();
      });
    }
    document.getElementById("nav-user")?.addEventListener("click", () => { location.hash = "#/account"; });
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

// PWA: service worker ger offline-stöd (cache-first-skal + SWR för typsnitt/Leaflet)
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
