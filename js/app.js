// VELVET — VIP tables, shared. V2 SPA (no dependencies)
import { t, applyLang, bootLang, LANGS, getLang, currentLang } from "./i18n.js?v=82";
import { publicFields as mrzPublic, nameMatch, ageYears } from "./mrz.js";
import { readPassportMrz, jpegFromFile, snapshotVideo, captureStill, focusAt, startCamera, stopCamera, waitForVideo, warmupOcr } from "./passport-ocr.js";
import { loadFaceApi, detectPassportFace, watchBlink, stopLiveness, requestLivenessTap, matchFaces, facePayload, warmupFaceApi } from "./face-idv.js";

// ---------- Data ----------
let DESTINATIONS = [];
let VENUES = [];
let VENUE_IMAGES = {}; // venue_id -> bild från ställets egen hemsida (data/venue-images.json)
let VENUE_YOUTUBE = {}; // venue_id -> mest visade officiella klipp (data/venue-youtube.json)
let VENUE_MENUS = {}; // venue_id -> tryckt meny från klubbens sajt
let VENUE_EVENTS = { fetched: null, venues: {} }; // kommande events per venue (data/venue-events.json)
let BOOKING_URLS = {}; // venue_id -> { url, kind, label } officiell VIP/bokningssida
let VENUE_PACKAGES = {}; // venue_id -> verifierade bord/daybeds/cabanas
let GOOGLE_PLACES = { fetchedAt: null, venues: {} };
let VENUE_FACTS = { fetchedAt: null, venues: {} };
let CLUB_RANKINGS = { fetchedAt: null, byVenueId: {}, cities: [], clubs: [] };
const state = {
  filters: { q: "", dest: "", cat: "", status: "", price: "", sort: "priority" },
  vibe: "",
  night: { dest: "", date: "" },
};
const NIGHT_KEY = "velvet_night_v1";

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
  if (state.filters.dest && (v.destination === state.filters.dest || v.destination_code === state.filters.dest)) return true;
  return queryMentionsCity(q != null ? q : state.filters.q, v);
}
function isVenueVerified(v) {
  return isPublicVenue(v) && statusInfo(v.research_status).cls === "tag-verified";
}
function googleScore(v) {
  const g = googlePlace(v);
  if (!g || !g.matched || !(Number(g.rating) > 0)) return 0;
  const n = Number(g.reviewCount) || 0;
  return Number(g.rating) + Math.min(0.4, n / 20000);
}
function rankingMeta(v) {
  return (v && CLUB_RANKINGS.byVenueId && CLUB_RANKINGS.byVenueId[v.venue_id]) || null;
}
function sourceScore(v) {
  const r = rankingMeta(v);
  if (!r) return 0;
  const raw = Number(r.score) || 0;
  if (raw <= 0) return 0;
  return isVenueVerified(v) ? raw : (Number(r.unverifiedScore) || raw * 0.72);
}
function compareVenues(a, b) {
  const pub = Number(isPublicVenue(b)) - Number(isPublicVenue(a));
  if (pub) return pub;
  const ver = Number(isVenueVerified(b)) - Number(isVenueVerified(a));
  if (ver) return ver;
  const src = sourceScore(b) - sourceScore(a);
  if (Math.abs(src) > 0.02) return src;
  const g = googleScore(b) - googleScore(a);
  if (Math.abs(g) > 0.04) return g;
  const prio = num(b.priority_score) - num(a.priority_score);
  if (prio) return prio;
  const lux = num(b.luxury_score) - num(a.luxury_score);
  if (lux) return lux;
  const party = num(b.party_score) - num(a.party_score);
  if (party) return party;
  return String(a.name || "").localeCompare(String(b.name || ""), "sv");
}

const CATEGORY_GROUPS = [
  { key: "beach", labelKey: "catBeach", match: /beach|floating|cliff/i },
  { key: "day", labelKey: "catDay", match: /day ?club|pool/i },
  { key: "rooftop", labelKey: "catRooftop", match: /rooftop/i },
  { key: "apres", labelKey: "catApres", match: /après|apres/i },
  { key: "restaurant", labelKey: "catRestaurant", match: /restaurant|dinner|show|tavern/i },
  { key: "nightclub", labelKey: "catNightclub", match: /night|hyperclub|open-air|club\b/i },
];

function venueGroup(v) {
  for (const g of CATEGORY_GROUPS) if (g.match.test(v.category)) return g.key;
  return "other";
}
function venuesForVibe(key) {
  let list = publicVenues();
  if (key) list = list.filter((v) => venueGroup(v) === key);
  return [...list].sort(compareVenues);
}
function vibeChipHTML() {
  const chips = [{ key: "", labelKey: "vibeAll" }, ...CATEGORY_GROUPS];
  return chips.map((g) => {
    const n = venuesForVibe(g.key).length;
    if (g.key && n < 2) return "";
    const on = state.vibe === g.key ? " on" : "";
    return `<button type="button" class="vibe-chip${on}" data-vibe="${esc(g.key)}">${esc(t(g.labelKey))}</button>`;
  }).join("");
}

// ---------- Venue-bilder (V2) ----------
function cleanVenuePhoto(url) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;
  return url.replace(/^http:\/\//i, "https://").replace(/&amp;/g, "&");
}
function venueYoutube(v) {
  const y = v && VENUE_YOUTUBE[v.venue_id];
  if (!y || typeof y.id !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(y.id)) return null;
  return y;
}
function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
function youtubeEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

function venuePhotos(v) {
  const raw = VENUE_IMAGES[v.venue_id];
  const values = Array.isArray(raw) ? raw : [raw];
  return [...new Set(values.map(cleanVenuePhoto).filter(Boolean))].slice(0, 5);
}

function venuePhoto(v) {
  return venuePhotos(v)[0] || null;
}

function venueGalleryItems(v) {
  return venuePhotos(v).map((url) => ({ url, original: true, alt: v.name }));
}

function venueGalleryHTML(v) {
  const items = venueGalleryItems(v);
  if (!items.length) return venueMediaHTML(v, "venue-hero-media", { eager: true, extra: favBtnHTML(v.venue_id, v.name) });
  return `
  <section class="venue-gallery" aria-label="Bildgalleri för ${esc(v.name)}">
    <div class="venue-gallery-track" id="venue-gallery-track" tabindex="0">
      ${items.map((photo, i) => `
        <figure class="venue-gallery-slide">
          <div class="dest-emblem venue-media-emblem" aria-hidden="true" style="--h:${destHue(v.destination_code)}">${esc(v.destination_code || "")}</div>
          <img src="${esc(photo.url)}" alt="${esc(photo.original ? `${v.name} — originalbild från ställets officiella kanal` : photo.alt)}"
               loading="${i === 0 ? "eager" : "lazy"}"${i === 0 ? ` fetchpriority="high"` : ""} decoding="async" referrerpolicy="no-referrer"
               onerror="this.closest('.venue-gallery-slide').classList.add('img-fail')">
          <figcaption class="${photo.original ? "is-original" : ""}">${esc(v.name)}</figcaption>
        </figure>`).join("")}
    </div>
    ${favBtnHTML(v.venue_id, v.name)}
    <button type="button" class="venue-gallery-arrow prev" data-gallery-dir="-1" aria-label="Föregående bild">←</button>
    <button type="button" class="venue-gallery-arrow next" data-gallery-dir="1" aria-label="Nästa bild">→</button>
    <div class="venue-gallery-dots" aria-label="Välj bild">
      ${items.map((_, i) => `<button type="button" data-gallery-index="${i}" class="${i === 0 ? "on" : ""}" aria-label="Bild ${i + 1} av ${items.length}"></button>`).join("")}
    </div>
  </section>`;
}

function bindVenueGallery() {
  const track = document.getElementById("venue-gallery-track");
  if (!track) return;
  const dots = [...document.querySelectorAll("[data-gallery-index]")];
  const go = (index) => track.scrollTo({ left: Math.max(0, index) * track.clientWidth, behavior: "smooth" });
  document.querySelectorAll("[data-gallery-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      go(current + Number(btn.dataset.galleryDir || 0));
    });
  });
  dots.forEach((dot) => dot.addEventListener("click", () => go(Number(dot.dataset.galleryIndex || 0))));
  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      dots.forEach((dot, i) => dot.classList.toggle("on", i === current));
    });
  }, { passive: true });
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
function venueMediaHTML(v, cls, { eager = false, extra = "", playable = false } = {}) {
  const yt = venueYoutube(v);
  const photo = venuePhoto(v);
  const url = yt ? youtubeThumb(yt.id) : photo;
  const play = yt && !playable ? `<span class="yt-play" aria-hidden="true"></span>` : "";
  const frame = yt && playable ? `
    <iframe class="yt-frame" src="${esc(youtubeEmbed(yt.id))}" title="${esc(yt.title || v.name)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="${eager ? "eager" : "lazy"}"></iframe>` : "";
  const img = !frame && url ? `
    <img src="${esc(url)}" alt="${esc(v.name)} — ${esc(v.category || "")}" loading="${eager ? "eager" : "lazy"}"${eager ? ` fetchpriority="high"` : ""} decoding="async" referrerpolicy="no-referrer"
         onerror="this.closest('.${cls}').classList.add('img-fail')">` : "";
  return `
  <div class="${cls}${url || frame ? "" : " img-fail"}${yt ? " has-yt" : ""}">
    <div class="dest-emblem venue-media-emblem" aria-hidden="true" style="--h:${destHue(v.destination_code)}">${esc(v.destination_code || "")}</div>${frame || img}
    ${play}${extra}
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
  return `<a class="${cls}" href="#/book-site/${encodeURIComponent(v.venue_id)}" data-nav${style}>${esc(gold ? t("bookOnSite") : t("bookOnSiteShort"))}</a>`;
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
function contactTile(href, title, sub, { gold = false, external = true, id = "", tag = "a", locked = false } = {}) {
  const extra = external ? ` target="_blank" rel="noopener"` : "";
  const nav = !external && tag === "a" ? " data-nav" : "";
  const idAttr = id ? ` id="${id}"` : "";
  const cls = `contact-tile${gold ? " gold" : ""}${locked ? " lock" : ""}`;
  const open = tag === "button"
    ? `<button type="button" class="${cls}"${idAttr}>`
    : `<a class="${cls}" href="${esc(href)}"${extra}${nav}${idAttr}>`;
  const close = tag === "button" ? "</button>" : "</a>";
  return `${open}<strong>${esc(title)}</strong><span>${esc(sub)}</span>${close}`;
}
function waDigits(raw) {
  let s = String(raw || "").trim();
  if (s.startsWith("00")) s = s.slice(2);
  const d = s.replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return "";
  return d;
}
function waHref(phone, text) {
  const d = waDigits(phone);
  if (!d) return "";
  return "https://wa.me/" + d + (text ? "?text=" + encodeURIComponent(text) : "");
}
function venueWaPhone(v) {
  const f = venueFacts(v) || {};
  const vip = String(f.vipHow || "");
  const hit = vip.match(/wa\.me\/(\+?\d{8,15})/i) || vip.match(/phone=(\+?\d{8,15})/i);
  if (hit) return waDigits(hit[1]);
  if (/whatsapp|wa\.me/i.test(vip) && f.phone) return waDigits(f.phone);
  return "";
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
    venueFacts(v)?.phone ? contactTile("tel:" + String(venueFacts(v).phone).replace(/\s+/g, ""), t("factPhone"), venueFacts(v).phone, { gold: true, external: false }) : "",
    venueFacts(v)?.email ? contactTile("mailto:" + venueFacts(v).email, t("factEmail"), venueFacts(v).email, { external: false }) : "",
    v.website_url ? contactTile(v.website_url, t("website"), webHost) : "",
    contactTile("#", t("sharePlace"), v.name, { tag: "button", id: "v-share", external: false }),
    venueWaPhone(v) ? contactTile(waHref(venueWaPhone(v), t("waPrefill").replace("{venue}", v.name)), "WhatsApp", t("waOpen"), { gold: true }) : "",
    contactTile(
      promoterHref(v.venue_id),
      t("chatPromoter"),
      isPayingMember() ? t("payingCustomer") : t("promoterNeedVerify"),
      { gold: isPayingMember(), locked: !isPayingMember(), external: false }
    ),
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
    ${book ? `<a class="btn btn-gold btn-sm" href="#/book-site/${encodeURIComponent(v.venue_id)}" data-nav>${esc(t("dockBook"))}</a>` : `<button type="button" class="btn btn-gold btn-sm" id="dock-book">${esc(t("dockBook"))}</button>`}
    <a class="btn btn-ghost btn-sm" href="${esc(mapsGoogleQuery(q))}" target="_blank" rel="noopener">${esc(t("openMaps"))}</a>
    ${v.instagram_url ? `<a class="btn btn-ghost btn-sm" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">IG</a>` : ""}
    <button type="button" class="btn btn-ghost btn-sm" id="dock-share">${esc(t("sharePlace"))}</button>
  </nav>`;
}

function photoAttrHTML(v) {
  const yt = venueYoutube(v);
  if (yt) {
    const href = yt.url || `https://www.youtube.com/watch?v=${yt.id}`;
    const who = yt.channel || v.name;
    return `<p class="photo-attr"><a href="${esc(href)}" target="_blank" rel="noopener">${esc(t("videoCredit").replace("{name}", who))}</a> · ${esc(t("videoMostViewed"))}</p>`;
  }
  if (!venuePhoto(v)) return "";
  const href = v.website_url || v.source_url || "";
  const credit = href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(t("photoCredit").replace("{name}", v.name))}</a>`
    : esc(t("photoCredit").replace("{name}", v.name));
  return `<p class="photo-attr">${credit} · ${esc(t("photoPreview"))}</p>`;
}

function statusInfo(s) {
  const x = (s || "").toLowerCase();
  if (x.includes("unverified") || x.includes("unlisted")) return { cls: "tag-unverified", label: t("unverified") };
  if (x.includes("verified") || x.includes("web")) return { cls: "tag-verified", label: t("verified") };
  if (x.includes("check")) return { cls: "tag-check", label: "Kontrollera status" };
  return { cls: "tag-research", label: "Research" };
}

// Request types only — no invented EUR. Club publishes min-spend on their own site.
function requestPackageTemplates(v) {
  const grp = venueGroup(v);
  if (grp === "beach" || grp === "day") return [
    { id: "sunbed", name: "Sunbed", priceClass: 1 },
    { id: "daybed", name: "Daybed", priceClass: 2 },
    { id: "cabana", name: "Cabana", priceClass: 3 },
    { id: "vip-cabana", name: "VIP Cabana", priceClass: 4 },
  ];
  return [
    { id: "vip-table", name: t("pkgTable"), priceClass: 1 },
    { id: "premium-table", name: "Premium table", priceClass: 2 },
    { id: "dancefloor-table", name: "Dancefloor table", priceClass: 3 },
    { id: "front-row", name: "Front row / owner’s table", priceClass: 4 },
  ];
}
function normalizePackage(p, verified) {
  const amount = Number(p?.price);
  const isVerified = Boolean(verified && p?.verified !== false);
  return {
    id: String(p?.id || p?.name || "package").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: String(p?.name || t("pkgTable")),
    price: Number.isFinite(amount) && amount > 0 ? amount : null,
    currency: String(p?.currency || "EUR").toUpperCase(),
    priceClass: Math.min(4, Math.max(1, Number(p?.priceClass || 1))),
    capacity: p?.capacity ? String(p.capacity) : "",
    included: Array.isArray(p?.included) ? p.included.filter(Boolean).map(String) : [],
    note: String(p?.note || ""), verified: isVerified, source: String(p?.source || ""),
    desc: isVerified ? "Verifierad av klubben" : "Pris och innehåll bekräftas av klubben",
  };
}
function packagesFor(v) {
  const official = Array.isArray(VENUE_PACKAGES[v.venue_id]) ? VENUE_PACKAGES[v.venue_id] : [];
  if (official.length) return official.map((p) => normalizePackage(p, true));
  return requestPackageTemplates(v).map((p) => normalizePackage(p, false));
}
function packagePriceHTML(p) {
  if (p.price) {
    try { return new Intl.NumberFormat("sv-SE", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(p.price); } catch {}
  }
  return "Pris på förfrågan";
}
function packageIncludedHTML(p) {
  const included = p.included.length ? p.included : ["Placering och minsta spend bekräftas av klubben", "Innehåll och serviceavgift bekräftas före betalning"];
  return `<ul class="package-included">${included.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}
function venuePackagesPanelHTML(v) {
  const packages = packagesFor(v);
  const hasOfficial = packages.some((p) => p.verified);
  return `
  <section class="detail-panel package-compare" aria-labelledby="package-compare-title">
    <div class="package-compare-head">
      <div><p class="detail-kicker">Bord · Daybeds · Cabanas</p><h2 class="detail-panel-title" id="package-compare-title">Välj din plats</h2>
        <p class="events-meta">${hasOfficial ? "Verifierade alternativ från klubbens officiella kanal." : "Förfrågningsalternativ — pris och innehåll bekräftas alltid av klubben."}</p></div>
      <span class="package-trust ${hasOfficial ? "ok" : ""}">${hasOfficial ? "Officiell data" : "Ingen låtsaspris"}</span>
    </div>
    <div class="package-compare-grid">
      ${packages.map((p) => `<article class="package-option ${p.verified ? "verified" : ""}">
        <div class="package-option-top"><span class="package-level" aria-label="Prisklass ${p.priceClass} av 4">${"€".repeat(p.priceClass)}</span>
          ${p.verified ? '<span class="idv-badge ok">Verifierad</span>' : '<span class="idv-badge">Förfrågan</span>'}</div>
        <h3>${esc(p.name)}</h3><div class="package-option-price">${esc(packagePriceHTML(p))}</div>
        ${p.capacity ? `<p class="package-capacity">För ${esc(p.capacity)} personer</p>` : ""}${packageIncludedHTML(p)}
        ${p.note ? `<p class="package-note">${esc(p.note)}</p>` : ""}
        <button type="button" class="btn ${p.verified ? "btn-gold" : "btn-ghost"}" data-pkg-open="${esc(p.id)}">Välj alternativ</button>
      </article>`).join("")}
    </div>
    <p class="detail-cta-note">Priser visas endast när de kommer från klubbens officiella kanal. Annars skickas en förfrågan utan betalning.</p>
  </section>`;
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
    showToast(t("storageFull"));
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
  catch { showToast(t("favStorageFull")); }
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
  if (name) return (on ? t("favRemove") : t("favAdd")).replace("{name}", name);
  return on ? t("favRemoveShort") : t("favAddShort");
}
function favBtnHTML(id, name = "") {
  const on = isFav(id);
  const label = favLabel(on, name);
  return `<button class="fav-btn" type="button" data-fav="${esc(id)}" data-fav-name="${esc(name)}" aria-pressed="${on}" title="${on ? t("favSaved") : t("saveSettings")}" aria-label="${esc(label)}">
    <svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12.1 21s-7.2-4.5-9.6-8.3C.3 9.3 2.2 5.4 6.3 5.4c2.1 0 3.5 1.3 4.4 2.6.9-1.3 2.3-2.6 4.4-2.6 4.1 0 6 3.9 3.8 7.3-2.4 3.8-9.6 8.3-9.6 8.3z"/></svg>
  </button>`;
}
function paintFavButton(btn) {
  const on = isFav(btn.dataset.fav);
  const name = btn.dataset.favName || "";
  const label = favLabel(on, name);
  btn.setAttribute("aria-pressed", String(on));
  btn.setAttribute("aria-label", label);
  btn.title = on ? t("favSaved") : t("saveSettings");
  const svg = btn.querySelector("svg");
  if (svg) svg.setAttribute("fill", on ? "currentColor" : "none");
}
function syncFavButtons(root = document) {
  root.querySelectorAll("[data-fav]").forEach(paintFavButton);
}
const USER_KEY = "velvet_user_v1";
const SOCIALS = [
  { id: "google", label: "Google", color: "#fff", dark: true },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
  { id: "tiktok", label: "TikTok", color: "#111" },
  { id: "snapchat", label: "Snapchat", color: "#FFFC00", dark: true },
];
let userMem = null;
function loadUser() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY));
    if (u && u.provider && u.id) { userMem = u; return u; }
  } catch {}
  return (userMem && userMem.provider && userMem.id) ? userMem : null;
}
function displayName(u) {
  if (!u) return "";
  if (u.legalName) return u.legalName;
  if (u.name) return u.name;
  const s = SOCIALS.find((x) => x.id === u.provider);
  return s ? s.label : (u.provider || "");
}
function saveUser(u) {
  userMem = u;
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
  if (provider === "google" && /@/.test(h)) return `mailto:${h}`;
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
function newSocialSid(provider) {
  let sid = "";
  try { sid = localStorage.getItem("velvet_sid_" + provider) || ""; } catch {}
  if (sid) return sid;
  sid = (globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  if (!sid) sid = String(Date.now()).slice(-12);
  try { localStorage.setItem("velvet_sid_" + provider, sid); } catch {}
  return sid;
}
function avatarHTML(u, cls = "") {
  const name = displayName(u) || "?";
  const pic = u && /^https:\/\//i.test(u.photo || "") ? u.photo : "";
  const extra = `person-avatar ${cls} soc-${esc(u?.provider || "none")}`.trim();
  if (pic) return `<div class="${extra} has-photo" aria-hidden="true"><img src="${esc(pic)}" alt="" width="64" height="64"></div>`;
  return `<div class="${extra}" aria-hidden="true">${esc(name.slice(0, 1).toUpperCase())}</div>`;
}
function profileReady(u) {
  return !!(u && u.provider && u.id && String(u.handle || "").replace(/^@/, "") && (u.name || u.legalName));
}
async function loginWithSocial(provider) {
  if (!SOCIALS.some((s) => s.id === provider)) return { ok: false };
  const start = await Promise.race([
    apiJSON(`/auth/start/${encodeURIComponent(provider)}`),
    new Promise((r) => setTimeout(() => r(null), 1800)),
  ]);
  if (start?.url && /^https:\/\//i.test(start.url) && !start.local) {
    try { sessionStorage.setItem("velvet_oauth_from", location.hash || "#/"); } catch {}
    location.href = start.url;
    return { oauth: true };
  }
  return { connect: true, provider };
}
async function connectSocialProfile(provider, handle, name) {
  const r = await apiJSON("/auth/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, handle, name }),
  });
  if (r?.error === "handle" || r?.error === "name") return { error: r.error };
  if (r?.error === "not_found") return { error: "not_found" };
  const user = r?.user;
  if (!user || !user.id) return { error: "fail" };
  saveUser({
    ...loadUser(),
    ...user,
    provider,
    created: user.created || new Date().toISOString(),
    auto: false,
    connected: true,
  });
  return { user: loadUser() };
}

function socialTrustCopy() {
  const copy = {
    sv: {
      eyebrow: "SOCIAL TRUST", title: "Din sociala verifiering", preview: "Social profil ansluten · ej OAuth-verifierad", verified: "Socialt konto verifierat",
      explain: "Ett valt socialt nätverk är inte samma sak som verifierad identitet. VELVET visar aldrig en verifierad badge förrän plattformens riktiga OAuth har bekräftat kontot.",
      chosen: "Plattform vald", oauth: "Kontot bekräftat av plattformen", identity: "Namn matchat mot passverifiering", done: "Klart",
      waiting: "Väntar på riktig OAuth", needPass: "Passverifiering krävs", launch: "Om OAuth saknas kan profilen anslutas manuellt, men den förblir tydligt ej verifierad.",
      demo: "OAuth / säker anslutning", create: "Fortsätt med",
    },
    en: {
      eyebrow: "SOCIAL TRUST", title: "Your social verification", preview: "Social profile connected · not OAuth-verified", verified: "Social account verified",
      explain: "Choosing a social network is not verified identity. VELVET never displays a verified badge until the platform’s real OAuth confirms the account.",
      chosen: "Platform selected", oauth: "Account confirmed by platform", identity: "Name matched to passport verification", done: "Done",
      waiting: "Waiting for real OAuth", needPass: "Passport verification required", launch: "If OAuth is unavailable, the profile can be linked manually but remains clearly unverified.",
      demo: "OAuth / secure connection", create: "Continue with",
    },
    es: {
      eyebrow: "SOCIAL TRUST", title: "Tu verificación social", preview: "Perfil conectado · sin verificar por OAuth", verified: "Cuenta social verificada",
      explain: "Elegir una red social no verifica la identidad. VELVET no muestra la insignia hasta que el OAuth real de la plataforma confirme la cuenta.",
      chosen: "Plataforma elegida", oauth: "Cuenta confirmada por la plataforma", identity: "Nombre comparado con el pasaporte", done: "Listo",
      waiting: "Esperando OAuth real", needPass: "Se requiere verificación de pasaporte", launch: "Si OAuth no está disponible, el perfil puede vincularse manualmente pero sigue sin verificar.",
      demo: "OAuth / conexión segura", create: "Continuar con",
    },
    fr: {
      eyebrow: "SOCIAL TRUST", title: "Votre vérification sociale", preview: "Profil connecté · non vérifié par OAuth", verified: "Compte social vérifié",
      explain: "Choisir un réseau social ne vérifie pas l’identité. VELVET n’affiche jamais de badge avant confirmation par le véritable OAuth de la plateforme.",
      chosen: "Plateforme choisie", oauth: "Compte confirmé par la plateforme", identity: "Nom comparé au passeport", done: "Terminé",
      waiting: "En attente du véritable OAuth", needPass: "Vérification du passeport requise", launch: "Sans OAuth, le profil peut être lié manuellement mais reste clairement non vérifié.",
      demo: "OAuth / connexion sécurisée", create: "Continuer avec",
    },
  };
  return copy[currentLang()] || copy.sv;
}

function socialVerificationHTML(u) {
  const c = socialTrustCopy();
  const oauthOk = u?.oauth === true || u?.socialVerification === "verified" || u?.socialOAuthVerified === true;
  const passOk = idvStatus() === "verified";
  const provider = SOCIALS.find((s) => s.id === u?.provider)?.label || u?.provider || "—";
  return `
  <section class="social-trust-card ${oauthOk ? "is-verified" : "is-preview"}" aria-label="${esc(c.title)}">
    <div class="social-trust-head">
      <div><span class="social-trust-eyebrow">${esc(c.eyebrow)}</span><h3>${esc(c.title)}</h3></div>
      <span class="social-trust-state">${oauthOk ? `✓ ${esc(c.verified)}` : `! ${esc(c.preview)}`}</span>
    </div>
    <p class="social-trust-explain">${esc(c.explain)}</p>
    <ol class="social-trust-steps">
      <li class="done"><span>1</span><div><b>${esc(c.chosen)}</b><small>${esc(provider)} · ${esc(c.done)}</small></div></li>
      <li class="${oauthOk ? "done" : "waiting"}"><span>2</span><div><b>${esc(c.oauth)}</b><small>${esc(oauthOk ? c.done : c.waiting)}</small></div></li>
      <li class="${oauthOk && passOk ? "done" : "waiting"}"><span>3</span><div><b>${esc(c.identity)}</b><small>${esc(oauthOk && passOk ? c.done : c.needPass)}</small></div></li>
    </ol>
    ${oauthOk ? "" : `<p class="social-trust-launch">🔒 ${esc(c.launch)}</p>`}
  </section>`;
}
function logoutUser() {
  userMem = null;
  try { localStorage.removeItem(USER_KEY); } catch {}
  paintUser();
}
function isOperatorUser(u) {
  const email = String(u?.email || "").toLowerCase();
  const handle = String(u?.handle || "").toLowerCase();
  return email === "gabrielhadodo@gmail.com" || email === "moses.isik@bakemyday.se" || handle === "velvet" || handle === "gabbe";
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
  // GitHub Pages och andra origins: API:t är CORS-öppet (Access-Control-Allow-Origin: *),
  // så livesajten får samma backend-funktioner som b2b.bakemyday.se/velvet/.
  return "https://b2b.bakemyday.se/velvet-api";
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
  if (r?.menus?.venues) VENUE_MENUS = r.menus.venues;
  else {
    try {
      const rm = await apiJSON("/menus");
      if (rm?.venues) VENUE_MENUS = rm.venues;
    } catch { /* keep */ }
  }
  if (r?.facts?.venues) VENUE_FACTS = r.facts;
  else {
    try {
      const rf = await apiJSON("/facts");
      if (rf?.venues) VENUE_FACTS = rf;
    } catch { /* keep */ }
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
  if (remote?.error) return remote;
  return remote?.table || table;
}
async function listOpenTables() {
  const remote = await apiJSON("/tables");
  if (remote?.tables) return remote.tables;
  return loadLocalTables().filter((t) => t.status === "open" && Number(t.openLeft) > 0);
}
async function joinOpenTable(id, hint) {
  const u = loadUser();
  if (!u) return { error: "auth" };
  const venueId = (hint && hint.venue_id) || loadLocalTables().find((x) => x.id === id)?.venue_id;
  const ven = VENUES.find((x) => x.venue_id === venueId);
  const young = venueTooYoung(ven);
  if (young) return { error: "too_young", minAge: young.min, ageYears: young.age };
  const age = myAgeYears();
  if (age != null && age < 18) return { error: "too_young", minAge: 18, ageYears: age };
  const base = apiBase();
  if (base) {
    try {
      const r = await fetch(`${base}/tables/${encodeURIComponent(id)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: u }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 403) return { error: data.error || "idv_required", openFor: data.openFor, minAge: data.minAge, ageYears: data.ageYears };
      if (r.status === 409) return { error: "full" };
      if (data.table) return { table: data.table, already: data.already };
    } catch {}
  }
  const list = loadLocalTables();
  const tb = list.find((x) => x.id === id);
  if (!tb) return { error: "missing" };
  const localVen = ven || VENUES.find((x) => x.venue_id === tb.venue_id);
  const localYoung = venueTooYoung(localVen);
  if (localYoung) return { error: "too_young", minAge: localYoung.min, ageYears: localYoung.age };
  if ((tb.sharp || (localVen && isSharpVenue(localVen))) && !isIdvOk()) return { error: "idv_required" };
  if (openForOf(tb.openFor) !== "anyone") {
    if (!isIdvOk()) return { error: "idv_required" };
    if (!canTakeOpenSeat(tb)) return { error: "seat_pref", openFor: tb.openFor };
  }
  if (tb.openLeft < 1) return { error: "full" };
  if (tb.host?.id === u.id || (tb.joiners || []).some((j) => j.id === u.id)) return { table: decorateLocalTable(tb), already: true };
  tb.joiners = [...(tb.joiners || []), { id: u.id, name: u.name, provider: u.provider, handle: u.handle, paid: false, joined: new Date().toISOString() }];
  tb.openLeft = Math.max(0, tb.openLeft - 1);
  if (tb.openLeft === 0) tb.status = "full";
  saveLocalTables(list);
  return { table: decorateLocalTable(tb) };
}

function decorateLocalTable(tb) {
  if (!tb) return null;
  const me = loadUser();
  const asPerson = (p, role) => {
    if (!p) return null;
    const id = p.id || "";
    const handle = String(p.handle || "").replace(/^@/, "");
    const provider = p.provider || "";
    const idv = (id && me && id === me.id && isIdvOk()) ? "verified" : (p.idv || "none");
    return {
      id,
      name: p.name || t("guestRole"),
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
  const host = asPerson(tb.host, "host");
  const joiners = (tb.joiners || []).map((j) => asPerson(j, "guest")).filter(Boolean);
  const invites = (tb.guests || []).map((g) => asPerson({ name: g.name, paid: g.paid }, "invite")).filter(Boolean);
  const members = [host, ...joiners, ...invites].filter(Boolean);
  const party = Number(tb.party) || Math.max(members.length, 1);
  return {
    ...tb,
    host,
    joiners,
    guests: invites,
    members,
    paidN: members.filter((m) => m.paid).length,
    dueN: members.length,
    per_person: tb.per_person || Math.ceil((Number(tb.total) || 0) / Math.max(1, party)),
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
        ${whoIsRealHTML(p.spend, p.idv, { compact: true })}
        ${p.card?.last4 ? `<span class="idv-badge ok">💳 ${esc(cardLabel(p.card))}</span>` : ""}
      </div>
    </div>
    <div class="person-pay">
      <span class="pay-pill ${paid ? "yes" : (p.paidPending ? "wait" : "no")}">${esc(paid ? t("paid") : (p.paidPending ? t("payWait") : t("unpaid")))}${paid && p.paidVia ? ` · ${esc(p.paidVia)}` : ""}</span>
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
function isCardOk() {
  const u = loadUser();
  return !!(u && String(u.cardLast4 || "").replace(/\D/g, "").length === 4);
}
function isPayingMember() {
  return isIdvOk() && isCardOk();
}
function venueMinAge(v) {
  const raw = String((venueFacts(v) || {}).ageLimit || "");
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  const fromFacts = (n >= 16 && n <= 25) ? n : null;
  if (["MIA", "LAS", "NYC", "LAX", "ASP"].includes(String(v?.destination_code || "").toUpperCase())) {
    return Math.max(fromFacts || 0, 21);
  }
  return fromFacts || 18;
}
function myAgeYears() {
  const u = loadUser();
  if (u?.ageYears != null) return Number(u.ageYears);
  return ageYears(u?.idvFields?.birthDate);
}
function venueTooYoung(v) {
  const min = venueMinAge(v);
  const age = myAgeYears();
  return age != null && age < min ? { min, age } : null;
}
function tooYoungText(data, v) {
  const min = data?.minAge != null ? data.minAge : (data?.min != null ? data.min : (v ? venueMinAge(v) : 18));
  const age = data?.ageYears != null ? data.ageYears : (data?.age != null ? data.age : myAgeYears());
  return t("venueTooYoung").replace("{min}", String(min || 18)).replace("{age}", age != null && age !== "" ? String(age) : "—");
}
function openForOf(v) {
  const s = String(v || "anyone").toLowerCase();
  return s === "women" || s === "men" ? s : "anyone";
}
function openForLabel(v) {
  const k = openForOf(v);
  if (k === "women") return t("openForWomen");
  if (k === "men") return t("openForMen");
  return t("openForAnyone");
}
function myPassportSex() {
  const f = (loadUser() && loadUser().idvFields) || {};
  return String(f.sex || "").toUpperCase();
}
function canTakeOpenSeat(tb) {
  const ven = VENUES.find((x) => x.venue_id === (tb && tb.venue_id));
  if (venueTooYoung(ven)) return false;
  const want = openForOf(tb && tb.openFor);
  if (want === "anyone") return true;
  if (!isIdvOk()) return false;
  const sex = myPassportSex();
  if (want === "women") return sex === "F";
  if (want === "men") return sex === "M";
  return true;
}
function openForSelectHTML(id, selected) {
  const cur = openForOf(selected);
  return `<select id="${id}">
    <option value="anyone"${cur === "anyone" ? " selected" : ""}>${esc(t("openForAnyone"))}</option>
    <option value="women"${cur === "women" ? " selected" : ""}>${esc(t("openForWomen"))}</option>
    <option value="men"${cur === "men" ? " selected" : ""}>${esc(t("openForMen"))}</option>
  </select>`;
}
function openSeatsLine(tb) {
  const n = Number(tb.openLeft != null ? tb.openLeft : tb.openSeats) || 0;
  if (n < 1) return "";
  const who = openForOf(tb.openFor);
  if (who === "anyone") return `${n} ${t("seatsOpen")}`;
  return `${n} ${t("seatsOpen")} · ${t("openForLabel").toLowerCase()} ${openForLabel(who)}`;
}
function whoIsRealHTML(spend, idv, { compact } = {}) {
  if (spend && spend.real) {
    return compact
      ? `<span class="idv-badge ok">✓ ${esc(t("realGuest"))} · ${esc(spendLabel(spend))}</span>`
      : `<p class="real-flag on"><span class="idv-badge ok">✓ ${esc(t("realGuest"))}</span> ${esc(t("verifiedSpend"))} ${esc(spendLabel(spend))}</p><p class="stepper-hint">${esc(t("realGuestHint"))}</p>`;
  }
  if (idv === "verified" || (spend && spend.verified)) {
    return compact
      ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span><span class="idv-badge no">${esc(t("realNoSpend"))}</span>`
      : `<p class="real-flag"><span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span> ${esc(t("realNoSpend"))}</p><p class="stepper-hint">${esc(t("realGuestHint"))}</p>`;
  }
  return compact
    ? `<span class="idv-badge no">${esc(t("notReal"))}</span>`
    : `<p class="real-flag off"><span class="idv-badge no">${esc(t("notReal"))}</span></p><p class="stepper-hint">${esc(t("realGuestHint"))}</p>`;
}
function spendLabel(s) {
  const a = Number(s && s.amount) || 0;
  const cur = (s && s.currency) || "EUR";
  const n = Number(s && s.n) || 0;
  const money = cur === "EUR" ? `€${a % 1 ? a.toFixed(2) : String(a)}` : `${a} ${cur}`;
  return n ? `${money} · ${t("spendN").replace("{n}", String(n))}` : money;
}
function cardLabel(card) {
  const u = loadUser();
  const c = card || (u && u.cardLast4 ? { last4: u.cardLast4, brand: u.cardBrand } : null);
  if (!c || !c.last4) return "";
  const brand = String(c.brand || "card");
  const pretty = brand === "visa" ? "Visa" : brand === "mastercard" ? "Mastercard" : brand === "amex" ? "Amex" : t("cardOk");
  return `${pretty} ••${c.last4}`;
}
function luhnOk(num) {
  const s = String(num || "").replace(/\D/g, "");
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = Number(s[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function cardBrandOf(num) {
  const n = String(num || "").replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^3[47]/.test(n)) return "amex";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^(50|5[6-9]|6)/.test(n)) return "maestro";
  return "card";
}
function rememberAfterIdv(hash) {
  try { sessionStorage.setItem("velvet_after_idv", hash); } catch { /* private mode */ }
}
const PENDING_BRIDGE_KEY = "velvet_pending_bridge_v1";
function savePendingBridge(rec) {
  try { sessionStorage.setItem(PENDING_BRIDGE_KEY, JSON.stringify(rec)); } catch { /* private mode */ }
}
function loadPendingBridge(venueId) {
  try {
    const rec = JSON.parse(sessionStorage.getItem(PENDING_BRIDGE_KEY) || "null");
    if (!rec || (venueId && rec.venueId !== venueId)) return null;
    return rec;
  } catch { return null; }
}
function clearPendingBridge() {
  try { sessionStorage.removeItem(PENDING_BRIDGE_KEY); } catch { /* private mode */ }
}
function consumeAfterIdv() {
  try {
    const n = sessionStorage.getItem("velvet_after_idv") || "";
    sessionStorage.removeItem("velvet_after_idv");
    return n;
  } catch { return ""; }
}
function promoterHref(venueId) {
  return `#/promoter/${encodeURIComponent(venueId)}`;
}
function promoterCardHTML(p, opts = {}) {
  const name = p.legalName || p.name || t("promoter");
  const handle = p.handle ? "@" + String(p.handle).replace(/^@/, "") : "";
  const venues = (p.venues || []).map((x) => x.name || x.id).filter(Boolean);
  const chatId = opts.chatVenue || "";
  const where = p.scope
    || (venues.length ? venues.slice(0, 4).join(" · ") + (venues.length > 4 ? " +" + (venues.length - 4) : "") : "")
    || (p.venueCount ? t("promoterVenuesN").replace("{n}", String(p.venueCount)) : "");
  const badge = p.idv === "verified" ? t("verifyOk") : t("promoterListed");
  const pic = String(p.photo || "").replace(/\\/g, "/");
  const picOk = /^media\/promoters\/[a-z0-9._-]+\.(gif|jpg|jpeg|png|webp)$/i.test(pic);
  const avatar = picOk
    ? `<div class="person-avatar has-photo" aria-hidden="true"><img src="${esc(pic)}" alt="" width="56" height="56"></div>`
    : `<div class="person-avatar soc-${esc(p.provider || "none")}" aria-hidden="true">${esc(name.slice(0, 1).toUpperCase())}</div>`;
  return `
  <div class="person-row">
    ${avatar}
    <div class="person-info">
      <div class="person-name">${esc(name)} <span class="chip-mini">${esc(t("promoterVerified"))}</span></div>
      <div class="person-meta">
        ${p.provider ? `<span class="soc-pill">${esc(p.provider)}</span>` : ""}
        ${handle ? (p.socialUrl
          ? `<a class="person-handle" href="${esc(p.socialUrl)}" target="_blank" rel="noopener">${esc(handle)}</a>`
          : `<span class="person-handle">${esc(handle)}</span>`) : ""}
        <span class="idv-badge ok">✓ ${esc(badge)}</span>
        ${where ? `<span>${esc(where)}</span>` : ""}
      </div>
    </div>
    ${opts.compact || !chatId ? "" : `<div class="person-pay"><a class="btn btn-gold btn-sm" href="${promoterHref(chatId)}" data-nav>${esc(t("chatPromoter"))}</a></div>`}
  </div>`;
}
function venuePromotersPanelHTML() {
  return `
      <div class="detail-panel" id="venue-promoters">
        <h2 class="detail-panel-title">${esc(t("promotersTitle"))}</h2>
        <p class="events-meta">${esc(isPayingMember() ? t("promotersLoading") : t("promotersLocked"))}</p>
      </div>`;
}
async function fillVenuePromoters(venueId) {
  const el = $("#venue-promoters");
  if (!el) return;
  const me = loadUser();
  const v = VENUES.find((x) => x.venue_id === venueId);
  const paintYoung = (data) => {
    el.innerHTML = `
      <h2 class="detail-panel-title">${esc(t("promotersTitle"))}</h2>
      <p class="detail-cta-note">${esc(tooYoungText(data, v))}</p>`;
  };
  if (venueTooYoung(v)) { paintYoung(venueTooYoung(v)); return; }
  if (!me || !isPayingMember()) {
    el.innerHTML = `
      <h2 class="detail-panel-title">${esc(t("promotersTitle"))}</h2>
      <p class="detail-cta-note">${esc(t("promotersLocked"))}</p>
      ${promoterLockHTML(me && isIdvOk() ? "card" : "idv")}`;
    rememberAfterIdv(promoterHref(venueId));
    $("#ch-verify")?.addEventListener("click", () => rememberAfterIdv("#/promoters"));
    $("#ch-card")?.addEventListener("click", () => rememberAfterIdv("#/promoters"));
    return;
  }
  const r = await apiJSON(`/promoters/${encodeURIComponent(venueId)}?userId=${encodeURIComponent(me.id)}`);
  if (!el.isConnected) return;
  if (r?.error === "too_young") { paintYoung(r); return; }
  if (r?.error === "idv_required" || r?.error === "card_required") {
    el.innerHTML = `
      <h2 class="detail-panel-title">${esc(t("promotersTitle"))}</h2>
      ${promoterLockHTML(r.error === "card_required" ? "card" : "idv")}`;
    return;
  }
  const list = r?.promoters || [];
  el.innerHTML = `
    <h2 class="detail-panel-title">${esc(t("promotersTitle"))}</h2>
    <p class="events-meta">${esc(t("promotersSub"))}</p>
    ${list.length
      ? `<div class="person-list">${list.map((p) => promoterCardHTML(p, { chatVenue: venueId })).join("")}</div>`
      : `<p class="price-disclaimer">${esc(t("promotersEmpty"))}</p>`}
    <p style="margin-top:12px"><a class="btn btn-ghost btn-sm" href="#/promoters" data-nav>${esc(t("promotersSee"))}</a></p>`;
}
async function renderPromoters() {
  const me = loadUser();
  setTitle(t("promotersTitle"));
  if (!me) {
    view().innerHTML = `
    <section class="section">
      <div class="empty-state">
        <h3>${esc(t("promotersTitle"))}</h3>
        <p>${esc(t("promotersLocked"))}</p>
        <p style="margin-top:16px"><button class="btn btn-gold" id="pr-login">${esc(t("loginCta"))}</button></p>
      </div>
    </section>`;
    $("#pr-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
    return;
  }
  await refreshIdv();
  if (!isPayingMember()) {
    rememberAfterIdv("#/promoters");
    view().innerHTML = `
    <section class="section">
      <h1>${esc(t("promotersTitle"))}</h1>
      <p class="ob-sub" style="text-align:left;margin:0 0 16px">${esc(t("promotersLocked"))}</p>
      ${promoterLockHTML(isIdvOk() ? "card" : "idv")}
    </section>`;
    return;
  }
  view().innerHTML = `
  <section class="section">
    <div class="section-head"><div><h2>${esc(t("promotersTitle"))}</h2></div></div>
    <p class="ob-sub" style="text-align:left;margin:0 0 12px">${esc(t("promotersSub"))}</p>
    <p class="member-access on">${esc(t("memberAccessOn"))}${cardLabel() ? ` · ${esc(cardLabel())}` : ""}</p>
    <div id="promo-list"><p class="events-meta">${esc(t("promotersLoading"))}</p></div>
  </section>`;
  const r = await apiJSON(`/promoters?userId=${encodeURIComponent(me.id)}`);
  const el = $("#promo-list");
  if (!el) return;
  if (r?.error === "idv_required" || r?.error === "card_required") {
    rememberAfterIdv("#/promoters");
    location.hash = r.error === "card_required" ? "#/card" : "#/verify";
    return;
  }
  const list = r?.promoters || [];
  el.innerHTML = list.length
    ? `<div class="person-list">${list.map((p) => promoterCardHTML(p)).join("")}</div>`
    : `<p class="price-disclaimer">${esc(t("promotersEmpty"))}</p>`;
}
function promoterLockHTML(kind) {
  if (kind === "card") {
    return `
    <div class="promo-lock">
      <p class="idv-badge ok">${esc(t("payingCustomer"))}</p>
      <h2>${esc(t("cardTitle"))}</h2>
      <p>${esc(t("cardLockedBody"))}</p>
      <a class="btn btn-gold" href="#/card" data-nav id="ch-card">${esc(t("cardCta"))}</a>
    </div>`;
  }
  return `
    <div class="promo-lock">
      <p class="idv-badge ok">${esc(t("verifiedMember"))}</p>
      <h2>${esc(t("verifiedPerkPromoter"))}</h2>
      <p>${esc(t("promoterLockedBody"))}</p>
      <a class="btn btn-gold" href="#/verify" data-nav id="ch-verify">${esc(t("verifyCta"))}</a>
    </div>`;
}
async function refreshIdv() {
  const u = loadUser();
  if (!u) return "none";
  const r = await apiJSON(`/idv/${encodeURIComponent(u.id)}`);
  const st = r?.idv?.status || "none";
  saveUser({
    ...u,
    idvStatus: st,
    idvSubmitted: r?.idv?.submitted || u.idvSubmitted,
    legalName: r?.idv?.legalName || u.legalName || "",
    idvFields: r?.idv?.fields || u.idvFields || null,
    ageYears: r?.idv?.ageYears != null ? r.idv.ageYears : u.ageYears,
    cardLast4: r?.card?.last4 || u.cardLast4 || "",
    cardBrand: r?.card?.brand || u.cardBrand || "",
  });
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
// Första POST:en triggar FormSubmits aktiveringsmejl till Gabbe. Tills han klickat
// bekräftelsen svarar FormSubmit utan success → koden faller tillbaka på "local" + mailto,
// så inget tappas bort. När inkorgen är bekräftad flyter förfrågningarna direkt.
const FORMSUBMIT_INBOX_CONFIRMED = true;
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
  const summary = t("icsSummary").replace("{venue}", b.venue);
  const desc = [
    t("icsDesc").replace("{id}", b.id),
    `${b.package} · ${b.party} ${t("people")} · ${b.per_person ? t("guestBudget").replace("{amount}", fmtEUR(b.per_person)) : t("clubSetsPrice")}.`,
    t("inviteJoin").replace("{link}", shareLinkFor(b)),
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
    t("inviteLine1").replace("{venue}", b.venue).replace("{dest}", b.destination),
    t("inviteLine2").replace("{date}", b.date).replace("{pkg}", b.package).replace("{n}", String(b.party)),
    b.total > 0
      ? t("inviteBudget").replace("{total}", fmtEUR(b.total)).replace("{per}", fmtEUR(b.per_person))
      : t("inviteClubPrice"),
    t("ribbon"),
    t("inviteJoin").replace("{link}", shareLinkFor(b)),
  ].join("\n");
}

function conciergeFields(b) {
  const f = b.host?.fields || {};
  const card = b.host?.cardLast4
    ? `${b.host.cardBrand || "card"} ••${b.host.cardLast4}`
    : (b.host?.card ? `${b.host.card.brand || "card"} ••${b.host.card.last4}` : "");
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
    host_legal_name: b.host?.legalName || "",
    host_email: b.host?.email || "",
    host_phone: b.host?.phone || "",
    host_social: [b.host?.provider, b.host?.handle ? "@" + b.host.handle : ""].filter(Boolean).join(" "),
    host_nationality: f.nationality || "",
    host_birth: f.birthDate || "",
    host_passport_masked: f.documentNumberMasked || "",
    host_card: card,
    host_idv: b.host?.idvStatus || (b.host?.idv === "verified" ? "verified" : ""),
    guests: (b.guests || []).map((g) => `${g.name}${g.email ? ` <${g.email}>` : ""}`).join(", "),
    note: "Förfrågan från VELVET-appen. INTE en bekräftad bokning — återkoppla till värden. Värden är passverifierad betalande kund (kort sista fyra, inget PAN).",
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
    f.host_legal_name ? `Passnamn: ${f.host_legal_name}` : "",
    `E-post: ${f.host_email}`,
    `Telefon: ${f.host_phone}`,
    f.host_social ? `Profil: ${f.host_social}` : "",
    f.host_nationality ? `Nationalitet: ${f.host_nationality}` : "",
    f.host_birth ? `Född: ${f.host_birth}` : "",
    f.host_passport_masked ? `Pass: ${f.host_passport_masked}` : "",
    f.host_card ? `Kort: ${f.host_card}` : "",
    f.host_idv ? `IDV: ${f.host_idv}` : "",
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
  ].filter(Boolean).join("\n"));
  return `mailto:${CONCIERGE_MAIL}?subject=${subject}&body=${body}`;
}

function setTitle(page, description) {
  const title = page ? `${page} · VELVET` : `VELVET — ${t("tagline")}`;
  document.title = title;
  const desc = description || t("metaDesc") || "";
  const set = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el && val) el.setAttribute(attr, val);
  };
  set('meta[name="description"]', "content", desc);
  set('meta[property="og:title"]', "content", title);
  set('meta[property="og:description"]', "content", desc);
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
  try {
  const pubD = publicDestinations();
  const pubV = publicVenues();
  const tier1 = pubD.filter((d) => d.tier === "Tier 1");
  view().innerHTML = `
  <section class="hero">
    <div class="hero-media" id="hero-media" aria-hidden="true"></div>
    <div class="hero-kicker">${esc(t("heroKicker"))}</div>
    <h1>${esc(t("heroTitle1"))}<br><em>${esc(t("heroTitle2"))}</em></h1>
    <p>${esc(t("heroP"))}</p>
    <div class="hero-cta">
      <button type="button" class="btn btn-gold" id="walk-start">${esc(t("walkCta"))}</button>
      <a class="btn btn-ghost" href="#/destinations" data-nav>${esc(t("seeDest"))}</a>
    </div>
    <p class="hero-credit"><a href="${esc(HERO_VIDEO.credit)}" target="_blank" rel="noopener">${esc(t("videoPexels"))}</a></p>
  </section>

  <section class="section night-section" id="night-home">
    <div class="section-head">
      <div><h2>${esc(t("tablesTitle"))}</h2><div class="sub">${esc(t("tablesSub"))}</div></div>
      <a class="link-gold" href="${openNightHref(loadNight().dest, loadNight().date)}" data-nav>${esc(t("navOpen"))} →</a>
    </div>
    <div class="night-pick">
      <label class="night-dest-label">${esc(t("tablesCity"))}
        <select id="home-night-dest" aria-label="${esc(t("tablesCity"))}">
          <option value="">${esc(t("allDest"))}</option>
          ${publicDestinations().map((x) => `<option value="${esc(x.code)}" ${loadNight().dest === x.code ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="avail-chips" id="home-night-chips" role="list">${dateChipsHTML(loadNight().date, destByCodeOrName(loadNight().dest))}</div>
    <div class="night-board" id="home-night-list"></div>
  </section>

  <section class="section vibe-section" id="vibe-walk">
    <div class="section-head">
      <div><h2>${esc(t("walkTitle"))}</h2><div class="sub">${esc(t("walkSub"))}</div></div>
      <a class="link-gold" href="#/venues" data-nav>${esc(t("explore"))} →</a>
    </div>
    <div class="vibe-bar" role="tablist" aria-label="${esc(t("walkTitle"))}">${vibeChipHTML()}</div>
    <div class="vibe-rail" id="vibe-rail"></div>
  </section>

  <section class="section">
    <div class="section-head">
      <div><h2>${esc(t("launchDests"))}</h2><div class="sub">${esc(t("launchDestsSub"))}</div></div>
      <a class="link-gold" href="#/destinations" data-nav>${esc(t("allDest"))} →</a>
    </div>
    <div class="dest-grid dest-grid-walk">${tier1.slice(0, 8).map(destCard).join("")}</div>
  </section>

  <div class="stats">
    <div class="stat"><div class="stat-num">${pubD.length}</div><div class="stat-label">${esc(t("statDests"))}</div></div>
    <div class="stat"><div class="stat-num">${pubV.length}</div><div class="stat-label">${esc(t("statVenues"))}</div></div>
    <div class="stat"><div class="stat-num">${pubV.filter((v) => v.priority_score >= 90).length}</div><div class="stat-label">${esc(t("statPrio"))}</div></div>
    <div class="stat"><div class="stat-num">${pubV.filter((v) => statusInfo(v.research_status).cls === "tag-verified").length}</div><div class="stat-label">${esc(t("verified"))}</div></div>
  </div>`;
  bindDestCards();
  paintVibeRail();
  const paintHomeNight = async () => {
    const n = loadNight();
    const dd = destByCodeOrName(n.dest);
    const chips = $("#home-night-chips");
    if (chips) chips.innerHTML = dateChipsHTML(n.date, dd);
    chips?.querySelectorAll("[data-avail-date]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveNight({ dest: n.dest, date: btn.dataset.availDate });
        paintHomeNight();
      });
    });
    const more = document.querySelector(".night-section .link-gold");
    if (more) more.setAttribute("href", openNightHref(n.dest, n.date));
    if (dd) await hydrateNight(dd, n.date);
    const tables = (await listOpenTables()).map((tb) => tb.members ? tb : decorateLocalTable(tb));
    paintNightList($("#home-night-list"), dd, n.date, { limit: 6, openTables: tables });
  };
  $("#home-night-dest")?.addEventListener("change", (e) => {
    saveNight({ dest: e.target.value, date: loadNight().date });
    paintHomeNight();
  });
  paintHomeNight();
  $("#walk-start")?.addEventListener("click", () => {
    document.getElementById("vibe-walk")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll("[data-vibe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.vibe = btn.dataset.vibe || "";
      document.querySelectorAll("[data-vibe]").forEach((b) => b.classList.toggle("on", b === btn));
      paintVibeRail();
    });
  });
  initHeroVideo();
  } catch (err) {
    console.error("VELVET: startsidan", err);
    view().innerHTML = `
    <section class="hero">
      <div class="hero-kicker">VELVET</div>
      <h1>${esc(t("heroTitle1"))}<br><em>${esc(t("heroTitle2"))}</em></h1>
      <p>${esc(t("heroP"))}</p>
      <div class="hero-cta">
        <a class="btn btn-gold" href="#/venues" data-nav>${esc(t("explore"))}</a>
        <a class="btn btn-ghost" href="#/destinations" data-nav>${esc(t("seeDest"))}</a>
      </div>
    </section>`;
  }
}
function paintVibeRail() {
  const host = $("#vibe-rail");
  if (!host) return;
  const list = venuesForVibe(state.vibe).slice(0, 18);
  host.innerHTML = list.length
    ? list.map((v, i) => venueCard(v, { vibe: true, eager: i < 3 })).join("")
    : `<p class="events-meta">${esc(t("noHits"))}</p>`;
  bindVenueCards();
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
  <div class="dest-card" data-code="${esc(d.code)}" role="link" tabindex="0" aria-label="${esc(t("destCardAria").replace("{name}", d.name))}">
    <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
    <div class="dest-cover${cover ? "" : " img-fail"}">
      ${coverImgHTML(cover && cover.url)}
      <div class="dest-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
    </div>
    ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
    <h3>${esc(d.name)}</h3>
    <div class="dest-country">${esc(d.country)} · ${esc(d.region)}</div>
    <div class="dest-meta"><span>${esc(t("seasonShort"))} <b>${esc(d.peak_season)}</b></span>${(() => { const km = distanceToDest(d); return km != null ? `<span class="dest-km">~${fmtKm(km)} km</span>` : ""; })()}</div>
    ${pips(d.luxury)}
  </div>`;
}

function renderDestinations() {
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>${esc(t("navDestinations"))}</h2><div class="sub">${esc(t("destListSub").replace("{n}", String(publicDestinations().length)))}</div></div>
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
        <h3>${esc(t("destMissing"))}</h3>
        <p>${esc(t("destMissingHint").replace("{code}", code))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/destinations" data-nav>${esc(t("allDest"))}</a></p>
      </div>
    </section>`;
    return;
  }
  setTitle(d.name);
  const inCity = VENUES.filter((v) => v.destination === d.name || v.destination_code === d.code).sort(compareVenues);
  const verified = inCity.filter(isVenueVerified);
  const rest = inCity.filter((v) => !isVenueVerified(v));
  const useCases = String(d.use_cases || "").split(",").map((s) => s.trim()).filter(Boolean);

  const cover = coverVenueForDest(d);
  view().innerHTML = `
  <section class="section detail">
    <a class="detail-back" href="#/destinations" data-nav>← ${esc(t("allDest"))}</a>
    ${cover ? `<div class="dest-walk-hero${cover.url ? "" : " img-fail"}">${coverImgHTML(cover.url)}<div class="dest-walk-hero-copy"><p class="kicker">${esc(d.country)}</p><p>${esc(t("walkCity").replace("{name}", d.name))}</p></div></div>` : ""}

    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-kicker">${esc(d.country)} · ${esc(d.region)} · ${esc(t("seasonShort"))} ${esc(d.peak_season)}</div>
        <h1 class="detail-name">${esc(d.name)}</h1>
        <div class="venue-tags detail-tags">
          <span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span>
          ${useCases.map((u) => `<span class="tag">${esc(u)}</span>`).join("")}
          ${(() => {
            const c = (CLUB_RANKINGS.cities || []).find((x) => x.destination_code === d.code);
            return c ? `<span class="tag src-rank">${esc(t("srcTimeout").replace("{n}", String(c.rank)))}</span>` : "";
          })()}
        </div>
        ${d.note ? `<p class="detail-notes"><span class="dest-note-label">${esc(t("strategicNote"))}</span> ${esc(d.note)}</p>` : ""}
        <div class="detail-links">
          <a class="icon-link" href="#/open?dest=${encodeURIComponent(d.code)}" data-nav>${esc(t("navOpen"))}</a>
          <a class="icon-link" href="#/venues" id="dd-list">${esc(t("seeInList"))}</a>
          <a class="icon-link" href="${esc(mapsGoogleQuery(destQuery(d)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
          <a class="icon-link" href="${esc(mapsAppleQuery(destQuery(d)))}" target="_blank" rel="noopener">${esc(t("mapsApple"))} ↗</a>
        </div>
      </div>
      <div class="dest-emblem dest-emblem-lg" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
    </div>

    ${cityAvailHTML(d, (location.hash.split("?")[1] ? new URLSearchParams(location.hash.split("?")[1]).get("date") : "") || loadNight().date)}

    <div class="detail-grid dest-detail-grid">
      <div class="detail-panel">
        <h2 class="detail-panel-title">${esc(t("ratings"))}</h2>
        <div class="meters">
          ${scoreMeter(t("scoreLuxury"), d.luxury)}
          ${scoreMeter(t("scoreParty"), d.party)}
          ${scoreMeter(t("scoreShare"), d.shareability)}
        </div>
      </div>
      <div class="detail-panel">
        <h2 class="detail-panel-title">${esc(t("destFacts"))}</h2>
        <div class="detail-facts" style="margin-top:0; border-top:none; padding-top:0">
          <div class="fact"><span class="fact-label">${esc(t("countryLabel"))}</span><span class="fact-val">${esc(d.country)}</span></div>
          <div class="fact"><span class="fact-label">${esc(t("regionLabel"))}</span><span class="fact-val">${esc(d.region)}</span></div>
          <div class="fact"><span class="fact-label">Tier</span><span class="fact-val"><span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span></span></div>
          <div class="fact"><span class="fact-label">${esc(t("peakSeason"))}</span><span class="fact-val">${esc(d.peak_season)}</span></div>
          <div class="fact"><span class="fact-label">${esc(t("verified"))}</span><span class="fact-val">${verified.length}</span></div>
          ${(() => { const km = distanceToDest(d); return km != null ? `<div class="fact"><span class="fact-label">${esc(t("distanceFromYou"))}</span><span class="fact-val">~${fmtKm(km)} km</span></div>` : ""; })()}
        </div>
      </div>
    </div>

    ${Number.isFinite(d.lat) && Number.isFinite(d.lng) ? `
    <div class="detail-panel dest-map-panel">
      <h2 class="detail-panel-title">${esc(t("onMap"))}</h2>
      <div class="map-shell map-shell-mini">
        <div id="map-dest" class="map-canvas map-canvas-mini" role="application" aria-label="${esc(t("mapOf").replace("{name}", d.name))}"></div>
        <div class="map-loading" id="dest-map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> ${esc(t("loadingMap"))}</div>
      </div>
      <p class="map-note">${esc(t("mapNoteApprox").replace("{name}", d.name))} <a class="link-gold" href="#/map" data-nav>${esc(t("wholeMap"))}</a></p>
    </div>` : ""}

    ${inCity.length ? `
    <div class="section-head" style="margin-top:44px">
      <div><h2>${esc(t("cityBest").replace("{name}", d.name))}</h2><div class="sub">${esc(t("cityBestSub"))}</div></div>
      <a class="link-gold" href="#/venues" id="dd-list-2">${esc(t("seeInList"))}</a>
    </div>
    <div class="venue-grid">${verified.map((v, i) => venueCard(v, { eager: i < 2, rank: i + 1 })).join("")}</div>
    ${rest.length ? `
    <div class="rank-head">
      <h3>${esc(t("cityMore").replace("{name}", d.name))}</h3>
      <p>${esc(t("cityMoreSub"))}</p>
    </div>
    <div class="venue-grid">${rest.map((v, i) => venueCard(v, { rank: verified.length + i + 1 })).join("")}</div>` : ""}` : `
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
  document.querySelectorAll("[data-avail-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      saveNight({ dest: d.code, date: btn.dataset.availDate });
      location.hash = `#/destination/${encodeURIComponent(d.code)}?date=${encodeURIComponent(btn.dataset.availDate)}`;
    });
  });
  bindVenueCards();
  mountDestMap(d, inCity);
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
  return `<a class="icon-link ig-link" href="${esc(v.instagram_url)}" target="_blank" rel="noopener" aria-label="${esc(t("onSocial").replace("{name}", v.name).replace("{net}", "Instagram"))}">${IG_ICON}<span class="soc-handle">${esc(handle)}</span>${arrow ? " ↗" : ""}</a>`;
}

function venueCard(v, { eager = false, rank = 0, vibe = false } = {}) {
  const st = statusInfo(v.research_status);
  const rankMark = rank > 0
    ? `<span class="rank-badge${rank <= 3 ? " top" : ""}" title="${esc(t("rankLabel").replace("{n}", String(rank)))}">${rank}</span>`
    : "";
  return `
  <div class="venue-card${vibe ? " vibe-card" : ""}">
    ${favBtnHTML(v.venue_id, v.name)}
    <div class="venue-card-link" data-id="${esc(v.venue_id)}" role="link" tabindex="0" aria-label="${esc(t("openRoom").replace("{name}", v.name))}">
      ${venueMediaHTML(v, "venue-media", { eager, extra: rankMark })}
      <div class="venue-top">
        <div>
          <div class="venue-name">${esc(v.name)}</div>
          <div class="venue-loc">${esc(v.destination)}</div>
        </div>
        ${vibe ? "" : `<div class="prio">${googleRatingHTML(v, { compact: true }) || `<span class="prio-num">${num(v.priority_score)}</span><span class="prio-label">Prio</span>`}</div>`}
      </div>
      <div class="venue-tags">
        <span class="tag">${esc(v.category)}</span>
        ${vibe ? "" : `<span class="tag ${st.cls}">${st.label}</span>
        ${rankingTagHTML(v)}
        ${v.shareable_format ? `<span class="tag tag-verified">${esc(t("shareableCost"))}</span>` : ""}
        ${eventsFor(v).length ? `<span class="tag tag-events">🎟 ${esc(t("comingN").replace("{n}", String(eventsFor(v).length)))}</span>` : ""}`}
      </div>
      ${!vibe && publicNote(v) ? `<div class="venue-note">${esc(publicNote(v))}</div>` : ""}
      ${vibe ? `<div class="vibe-open">${esc(t("openRoom").replace("{name}", v.name))}</div>` : `
      <div class="venue-actions">
        <button class="btn btn-gold btn-sm" data-book="${esc(v.venue_id)}">${esc(t("sendRequest"))}</button>
        ${bookingLinkHTML(v)}
        <a class="icon-link" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener">${esc(t("openMaps"))} ↗</a>
        ${igLinkHTML(v)}
      </div>`}
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
  if (f.sort === "name") list.sort((a, b) => compareVenues(a, b) || a.name.localeCompare(b.name, "sv"));
  else if (f.sort === "luxury") list.sort((a, b) => compareVenues(a, b) || num(b.luxury_score) - num(a.luxury_score));
  else list.sort(compareVenues);
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
      <div><h2>${esc(t("navVenues"))}</h2><div class="sub">${esc(t("venuesSub"))}</div></div>
    </div>
    <div class="filters">
      <input type="search" id="f-q" placeholder="${esc(t("searchPh"))}" value="${esc(f.q)}" aria-label="${esc(t("navSearch"))}">
      <select id="f-dest" aria-label="${esc(t("filterDest"))}">
        <option value="">${esc(t("allDest"))}</option>
        ${dests.map((d) => `<option ${f.dest === d ? "selected" : ""}>${esc(d)}</option>`).join("")}
      </select>
      <select id="f-cat" aria-label="${esc(t("filterCat"))}">
        <option value="">${esc(t("allCats"))}</option>
        ${CATEGORY_GROUPS.map((g) => `<option value="${g.key}" ${f.cat === g.key ? "selected" : ""}>${esc(t(g.labelKey))}</option>`).join("")}
      </select>
      <select id="f-status" aria-label="${esc(t("filterStatus"))}">
        <option value="">${esc(t("allStatus"))}</option>
        <option value="tag-verified" ${f.status === "tag-verified" ? "selected" : ""}>${esc(t("verified"))}</option>
        <option value="tag-unverified" ${f.status === "tag-unverified" ? "selected" : ""}>${esc(t("unverified"))}</option>
      </select>
      <select id="f-sort" aria-label="${esc(t("filterSort"))}">
        <option value="priority" ${f.sort === "priority" ? "selected" : ""}>${esc(t("sortPrio"))}</option>
        <option value="luxury" ${f.sort === "luxury" ? "selected" : ""}>${esc(t("sortLuxury"))}</option>
        <option value="name" ${f.sort === "name" ? "selected" : ""}>${esc(t("sortName"))}</option>
      </select>
      <span class="filter-count" id="f-count" role="status" aria-live="polite" aria-atomic="true"></span>
    </div>
    <div class="venue-grid" id="venue-list"></div>
  </section>`;

  const renderList = () => {
    const list = applyFilters();
    const ver = list.filter(isVenueVerified);
    const unv = list.filter((v) => !isVenueVerified(v));
    $("#f-count").textContent = f.dest
      ? t("cityCount").replace("{n}", String(list.length)).replace("{name}", f.dest).replace("{ok}", String(ver.length)).replace("{rest}", String(unv.length))
      : `${list.length} · ${ver.length} ${t("verified").toLowerCase()}`;
    let html = "";
    if (f.dest && list.length) {
      html += `<div class="rank-head" style="grid-column:1/-1"><h3>${esc(t("cityBest").replace("{name}", f.dest))}</h3><p>${esc(t("cityBestSub"))}</p></div>`;
    }
    if (ver.length) html += ver.map((v, i) => venueCard(v, { eager: i < 2, rank: i + 1 })).join("");
    if (unv.length) {
      html += `<div class="unlisted-banner" style="grid-column:1/-1"><h3>${esc(t("cityMore").replace("{name}", f.dest || t("unverified")))}</h3><p>${esc(t("cityMoreSub"))}</p></div>`;
      html += unv.map((v, i) => venueCard(v, { rank: ver.length + i + 1 })).join("");
    }
    $("#venue-list").innerHTML = html || `<div class="empty-state" style="grid-column:1/-1"><div class="big">🔍</div><h3>${esc(t("noHits"))}</h3><p>${f.status === "tag-unverified" && !(f.q || "").trim() && !f.dest ? esc(t("unlistedNeedCity")) : esc(t("clearFilters"))}</p></div>`;
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
function rankingSources(v) {
  const r = rankingMeta(v);
  return (r && Array.isArray(r.sources)) ? r.sources : [];
}
function rankingTagHTML(v) {
  const dj = rankingSources(v).find((s) => s.source === "djmag-top100");
  const ina = rankingSources(v).find((s) => s.source === "ina-100-best");
  const best = dj || ina;
  if (!best || !(Number(best.rank) > 0)) return "";
  const label = dj
    ? t("srcDjMag").replace("{year}", String(dj.year || 2026)).replace("{n}", String(dj.rank))
    : t("srcIna").replace("{year}", String(ina.year || 2025)).replace("{n}", String(ina.rank));
  return `<span class="tag src-rank">${esc(label)}</span>`;
}
function rankingPanelHTML(v) {
  const srcs = rankingSources(v);
  if (!srcs.length) return "";
  const rows = srcs.map((s) => {
    const label = s.source === "djmag-top100"
      ? t("srcDjMag").replace("{year}", String(s.year || "")).replace("{n}", String(s.rank))
      : s.source === "ina-100-best"
        ? t("srcIna").replace("{year}", String(s.year || "")).replace("{n}", String(s.rank))
        : `${s.source} #${s.rank}`;
    const href = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : esc(label);
    return `<li>${href}</li>`;
  }).join("");
  const disc = isVenueVerified(v) ? "" : `<p class="events-meta">${esc(t("rankUnverifiedHint"))}</p>`;
  return `
  <div class="detail-panel">
    <h2 class="detail-panel-title">${esc(t("rankSources"))}</h2>
    <p class="events-meta">${esc(t("rankSourcesHint"))}</p>
    ${disc}
    <ul class="rank-src-list">${rows}</ul>
  </div>`;
}
function googleRatingHTML(v, { compact = false } = {}) {
  const g = googlePlace(v);
  const href = googleMapsReviewsUrl(v);
  if (g && g.matched && Number(g.rating) > 0) {
    const n = g.reviewCount != null ? Number(g.reviewCount).toLocaleString(currentLang()) : "";
    if (compact) {
      return `<a class="g-rate" href="${esc(href)}" target="_blank" rel="noopener" title="Google"><span class="g-rate-num">${esc(String(g.rating))}</span><span class="g-rate-stars">${esc(googleStars(g.rating))}</span>${n ? `<span class="g-rate-n">(${esc(n)})</span>` : ""}</a>`;
    }
    return "";
  }
  if (compact) return "";
  return "";
}
function venueFacts(v) {
  return (v && VENUE_FACTS.venues && VENUE_FACTS.venues[v.venue_id]) || null;
}
function factsPanelHTML(v) {
  const f = venueFacts(v) || {};
  const rows = [
    ["address", t("factAddress")],
    ["area", t("factArea")],
    ["phone", t("factPhone")],
    ["email", t("factEmail")],
    ["hours", t("factHours")],
    ["season", t("factSeason")],
    ["ageLimit", t("factAge")],
    ["dressCode", t("factDress")],
    ["doorPolicy", t("factDoor")],
    ["music", t("factMusic")],
    ["vipHow", t("factVip")],
    ["gettingThere", t("factGo")],
  ].filter(([k]) => f[k]);
  const highs = Array.isArray(f.highlights) ? f.highlights.filter(Boolean) : [];
  const src = f.source ? `<a href="${esc(f.source)}" target="_blank" rel="noopener">${esc(t("factSource"))} ↗</a>` : "";
  return `
  <div class="detail-panel facts-panel">
    <h2 class="detail-panel-title">${esc(t("venueFacts"))}</h2>
    ${f.summary ? `<p class="facts-summary">${esc(f.summary)}</p>` : ""}
    ${rows.length ? `<div class="detail-facts facts-rows">${rows.map(([k, lab]) => {
      let val = esc(f[k]);
      if (k === "phone") val = `<a href="tel:${esc(String(f[k]).replace(/\s+/g, ""))}">${esc(f[k])}</a>`;
      if (k === "email") val = `<a href="mailto:${esc(f[k])}">${esc(f[k])}</a>`;
      return `<div class="fact"><span class="fact-label">${esc(lab)}</span><span class="fact-val">${val}</span></div>`;
    }).join("")}</div>` : `<p class="events-meta">${esc(t("factsEmpty"))}</p>`}
    ${highs.length ? `<ul class="facts-highs">${highs.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    <p class="events-meta">${esc(t("factsHint"))}${src ? " · " + src : ""}</p>
    ${apiBase() ? `<p class="events-actions"><button type="button" class="btn btn-ghost btn-sm" id="facts-refresh">${esc(t("factsRefresh"))}</button></p>` : ""}
  </div>`;
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
          <p class="events-meta">${g.reviewCount != null ? `${esc(Number(g.reviewCount).toLocaleString(currentLang()))} ${esc(t("googleCount"))}` : esc(t("googleChannel"))}${g.placeName ? ` · ${esc(g.placeName)}` : ""}</p>
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
  <div class="meter" role="img" aria-label="${esc(label)}: ${n}/5">
    <div class="meter-head">
      <span class="meter-label">${esc(label)}</span>
      <span class="meter-val">${n}<span class="meter-max">/5</span></span>
    </div>
    <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function eventsFor(v) {
  const rec = VENUE_EVENTS.venues[v.venue_id];
  const list = rec && Array.isArray(rec.events) ? rec.events : [];
  const today = todayISO();
  return list.filter((e) => !e.date || e.date >= today);
}
function venueMenu(v) {
  return (v && VENUE_MENUS[v.venue_id]) || null;
}
function destVenuesOf(d) {
  return VENUES.filter((v) => v.destination_code === d.code || v.destination === d.name).sort(compareVenues);
}
function addDaysISO(iso, n) {
  const [y, m, day] = String(iso).split("-").map(Number);
  const dt = new Date(y, m - 1, day + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function destNightRows(d, date) {
  return destVenuesOf(d)
    .map((v) => ({ v, nights: eventsFor(v).filter((e) => e.date === date) }))
    .filter((x) => x.nights.length);
}
function loadNight() {
  let dest = state.night.dest || "";
  let date = state.night.date || "";
  try {
    const j = JSON.parse(localStorage.getItem(NIGHT_KEY) || "{}");
    if (!dest && j.dest) dest = j.dest;
    if (!date && /^\d{4}-\d{2}-\d{2}$/.test(j.date || "")) date = j.date;
  } catch { /* ignore */ }
  if (!dest) {
    const home = homeDestination();
    if (home) dest = home.code;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayISO()) date = todayISO();
  state.night = { dest, date };
  return state.night;
}
function saveNight(n) {
  const dest = String(n.dest || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(n.date || "") ? n.date : todayISO();
  state.night = { dest, date };
  try { localStorage.setItem(NIGHT_KEY, JSON.stringify(state.night)); } catch { /* ignore */ }
}
function destByCodeOrName(x) {
  const s = String(x || "");
  return DESTINATIONS.find((d) => d.code === s || d.name === s) || null;
}
function upcomingDates(n = 14) {
  const today = todayISO();
  return Array.from({ length: n }, (_, i) => addDaysISO(today, i));
}
function fmtChipDate(iso) {
  const [y, m, day] = String(iso).split("-").map(Number);
  try {
    return new Date(y, m - 1, day).toLocaleDateString(currentLang(), { weekday: "short", day: "numeric" });
  } catch { return String(iso).slice(8); }
}
function nightBoard(d, date) {
  const catalog = destVenuesOf(d).filter(isPublicVenue);
  const onCal = [];
  const rest = [];
  for (const v of catalog) {
    const nights = eventsFor(v).filter((e) => e.date === date);
    if (nights.length) onCal.push({ v, nights });
    else rest.push(v);
  }
  return { catalog, onCal, rest };
}
function dateChipsHTML(selected, dest) {
  return upcomingDates(14).map((iso) => {
    const n = dest ? destNightRows(dest, iso).length : 0;
    return `<button type="button" class="avail-chip${iso === selected ? " on" : ""}" data-avail-date="${iso}" aria-pressed="${iso === selected ? "true" : "false"}">${esc(fmtChipDate(iso))}${n ? ` <span class="avail-n">${n}</span>` : ""}</button>`;
  }).join("");
}
function nightRowHTML(v, date, nights) {
  const href = nights && nights[0]
    ? `#/book-site/${encodeURIComponent(v.venue_id)}?date=${encodeURIComponent(date)}&night=${encodeURIComponent(nights[0].title)}`
    : `#/book-site/${encodeURIComponent(v.venue_id)}?date=${encodeURIComponent(date)}`;
  const cta = nights && nights[0] ? t("bridgePickNight") : t("nightAskCta");
  return `
    <div class="avail-row">
      <div>
        <a class="avail-name" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>${esc(v.name)}</a>
        <div class="avail-nights">${nights && nights.length ? nights.slice(0, 3).map((e) => esc(e.title)).join(" · ") : esc(v.category || "")}</div>
      </div>
      <a class="btn ${nights && nights[0] ? "btn-gold" : "btn-ghost"} btn-sm" href="${esc(href)}" data-nav>${esc(cta)}</a>
    </div>`;
}
async function hydrateNight(d, date) {
  await refreshLiveEvents();
  if (!d) return;
  const live = await apiJSON(`/inventory?dest=${encodeURIComponent(d.code)}&date=${encodeURIComponent(date)}`);
  if (!live || !Array.isArray(live.venues)) return;
  if (!VENUE_EVENTS.venues) VENUE_EVENTS.venues = {};
  for (const row of live.venues) {
    if (!row || !row.venueId || !Array.isArray(row.nights)) continue;
    const rec = VENUE_EVENTS.venues[row.venueId] || { events: [] };
    const have = new Set((rec.events || []).map((e) => `${e.date || ""}|${e.title || ""}`));
    let extra = rec.events || [];
    for (const n of row.nights) {
      const k = `${n.date || ""}|${n.title || ""}`;
      if (have.has(k) || !n.title) continue;
      extra = extra.concat([n]);
      have.add(k);
    }
    VENUE_EVENTS.venues[row.venueId] = { ...rec, events: extra };
  }
}
function cityAvailHTML(d, selected) {
  const dates = upcomingDates(14);
  const date = dates.includes(selected) ? selected : todayISO();
  const { catalog, onCal } = nightBoard(d, date);
  const withCal = catalog.filter((v) => eventsFor(v).some((e) => e.date)).length;
  return `
  <div class="city-avail" id="city-avail">
    <h2 class="detail-panel-title">${esc(t("cityAvail").replace("{name}", d.name))}</h2>
    <p class="events-meta">${esc(t("cityAvailSub"))}${withCal ? ` · ${esc(t("cityCalCount").replace("{n}", String(withCal)).replace("{all}", String(catalog.length)))}` : ""}</p>
    <div class="avail-chips" role="list">${dateChipsHTML(date, d)}</div>
    ${onCal.length ? `<div class="avail-list">${onCal.map(({ v, nights }) => nightRowHTML(v, date, nights)).join("")}</div>` : `<p class="events-meta">${esc(t("cityAvailEmpty"))}</p>`}
    ${catalog.length > withCal ? `<p class="events-meta">${esc(t("cityAvailNoCal").replace("{n}", String(catalog.length - withCal)))}</p>` : ""}
    <p class="events-meta">${esc(t("cityAvailOverlap"))}</p>
  </div>`;
}
function menuPanelHTML(v) {
  const m = venueMenu(v);
  const items = m && Array.isArray(m.items) ? m.items.filter((x) => x && x.name) : [];
  if (!items.length) {
    return `
    <div class="detail-panel menu-panel">
      <h2 class="detail-panel-title">${esc(t("menuTitle"))}</h2>
      <p class="events-meta">${esc(t("menuEmpty"))}</p>
    </div>`;
  }
  return `
  <div class="detail-panel menu-panel">
    <h2 class="detail-panel-title">${esc(t("menuTitle"))}</h2>
    <p class="events-meta">${esc(t("menuSub"))}</p>
    <ul class="menu-list">
      ${items.slice(0, 40).map((it) => `
        <li class="menu-row">
          <span class="menu-name">${esc(it.name)}${it.section ? ` <em>${esc(it.section)}</em>` : ""}</span>
          <span class="menu-price">${esc(it.price || t("clubSetsPrice"))}</span>
        </li>`).join("")}
    </ul>
    ${m.source ? `<p class="events-meta"><a href="${esc(m.source)}" target="_blank" rel="noopener">${esc(t("menuFrom"))} ↗</a></p>` : ""}
  </div>`;
}
function eventWhen(e) {
  if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
    const [y, m, d] = e.date.split("-").map(Number);
    try {
      return new Date(y, m - 1, d).toLocaleDateString(currentLang(), { day: "numeric", month: "short" });
    } catch { return e.date; }
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
        ${e.date ? `<a class="event-book" href="#/book-site/${encodeURIComponent(v.venue_id)}?date=${encodeURIComponent(e.date)}&night=${encodeURIComponent(e.title)}" data-nav>${esc(t("bridgePickNight"))}</a>` : ""}
      </span>
    </li>`).join("");
  const src = rec.source ? ` · <a href="${esc(rec.source)}" target="_blank" rel="noopener">${esc(t("factSource"))} ↗</a>` : "";
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
        <h3>${esc(t("venueMissing"))}</h3>
        <p>${esc(t("venueGone"))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>${esc(t("allVenues"))}</a></p>
      </div>
    </section>`;
    return;
  }
  const st = statusInfo(v.research_status);
  const dest = DESTINATIONS.find((d) => d.name === v.destination);
  view().innerHTML = `
  <section class="section detail">
    <a class="detail-back" href="#/venues" data-nav>← ${esc(t("allVenues"))}</a>

    ${venueMediaHTML(v, "venue-hero-media", { eager: true, playable: true, extra: favBtnHTML(v.venue_id, v.name) })}
    ${venueGalleryHTML(v)}
    ${photoAttrHTML(v)}

    <div class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-kicker">${esc(v.destination)}${dest ? ` · ${esc(dest.country)}` : ""} · ${esc(v.category)}</div>
        <h1 class="detail-name">${esc(v.name)}</h1>
        <div class="venue-tags detail-tags">
          <span class="tag ${st.cls}">${st.label}</span>
          ${v.shareable_format ? `<span class="tag tag-verified">${esc(t("shareableCost"))}</span>` : ""}
          ${v.vip_table_potential ? `<span class="tag">${esc(t("pkgTable"))}</span>` : ""}
          ${rankingTagHTML(v)}
          ${dest ? `<span class="tag">${esc(t("seasonShort"))} ${esc(dest.peak_season)}</span>` : ""}
        </div>
        ${publicNote(v) ? `<p class="detail-notes">${esc(publicNote(v))}</p>` : ""}
        <div class="follow-block">
          ${v.instagram_url ? `
          <div class="follow-ig">
            <div>
              <div class="soc-handle">${esc(igHandle(v.instagram_url) || t("instagram"))}</div>
              <p>${esc(t("followIg"))}</p>
            </div>
            <a class="btn btn-gold btn-sm" href="${esc(v.instagram_url)}" target="_blank" rel="noopener">${esc(t("instagram"))} ↗</a>
          </div>` : ""}
          <div class="detail-links">
            ${bookingLinkHTML(v)}
            <a class="icon-link" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener">${esc(t("directions"))} ↗</a>
            ${v.website_url ? `<a class="icon-link" href="${esc(v.website_url)}" target="_blank" rel="noopener">${esc(t("website"))} ↗</a>` : ""}
            ${v.tiktok_url ? `<a class="icon-link" href="${esc(v.tiktok_url)}" target="_blank" rel="noopener" aria-label="${esc(t("onSocial").replace("{name}", v.name).replace("{net}", "TikTok"))}">${TIKTOK_ICON}<span>TikTok</span> ↗</a>` : ""}
            ${v.facebook_url ? `<a class="icon-link" href="${esc(v.facebook_url)}" target="_blank" rel="noopener" aria-label="${esc(t("onSocial").replace("{name}", v.name).replace("{net}", "Facebook"))}">${FB_ICON}<span>Facebook</span> ↗</a>` : ""}
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
      ${rankingPanelHTML(v)}
      ${factsPanelHTML(v)}
      ${googleReviewsPanelHTML(v)}
      ${menuPanelHTML(v)}
      ${eventsSectionHTML(v)}
      ${venuePackagesPanelHTML(v)}
      <div class="detail-panel">
        <h2 class="detail-panel-title">${esc(t("velvetScore"))}</h2>
        <p class="events-meta">${esc(t("velvetScoreHint"))}</p>
        <div class="meters">
          ${scoreMeter(t("scoreLuxury"), v.luxury_score)}
          ${scoreMeter(t("scoreParty"), v.party_score)}
          ${scoreMeter(t("scoreShare"), v.shareability_score)}
          ${scoreMeter(t("scoreBook"), v.booking_potential)}
        </div>
        <div class="detail-facts">
          <div class="fact"><span class="fact-label">${esc(t("verification"))}</span><span class="fact-val"><span class="tag ${st.cls}">${st.label}</span></span></div>
          <div class="fact"><span class="fact-label">${esc(t("categoryLabel"))}</span><span class="fact-val">${esc(v.category)}</span></div>
          <div class="fact"><span class="fact-label">Venue-ID</span><span class="fact-val">${esc(v.venue_id)}</span></div>
          ${dest ? `<div class="fact"><span class="fact-label">${esc(t("regionLabel"))}</span><span class="fact-val">${esc(dest.region)}</span></div>` : ""}
        </div>
      </div>

      <div class="detail-panel detail-cta">
        <h2 class="detail-panel-title">${esc(t("requestShareTitle"))}</h2>
        <p class="detail-cta-sub">${esc(t("clubSetsPrice"))}</p>
        <div class="detail-price" id="from-price">${esc(t("clubSetsPrice"))}</div>
        <p class="detail-cta-note">${esc(t("priceHonest"))}</p>
        ${bookingLinkHTML(v, { gold: true, full: true })}
        <a class="btn btn-ghost" href="${esc(mapsGoogleQuery(placeQuery(v)))}" target="_blank" rel="noopener" style="width:100%;margin-top:10px">${esc(t("directions"))} ↗</a>
        <button class="btn btn-ghost" id="d-book" style="width:100%;margin-top:10px">${esc(t("sendRequest"))}</button>
        <a class="btn ${isPayingMember() ? "btn-gold" : "btn-ghost"}" id="d-promo" href="${promoterHref(v.venue_id)}" data-nav style="width:100%;margin-top:10px">${esc(isPayingMember() ? t("chatPromoter") : t("verifiedPerkPromoter"))}</a>
        <a class="btn btn-ghost" href="${promoterHref(v.venue_id)}?match=1" data-nav style="width:100%;margin-top:10px">${esc(t("matchAsk"))}</a>
        <p class="detail-cta-note">${esc(isPayingMember() ? t("memberAccessOn") : t("memberAccessOff"))}</p>
        <ul class="detail-perks">
          <li>${esc(t("perkSite"))}</li>
          <li>${esc(t("perkConcierge"))}</li>
          <li>${esc(t("perkSplit"))}</li>
          <li>${esc(t("perkPromoter"))}</li>
        </ul>
      </div>
      ${venuePromotersPanelHTML()}
    </div>
    ${venueDockHTML(v)}
  </section>`;
  document.body.classList.add("has-dock");
  bindVenueGallery();
  document.querySelectorAll("[data-pkg-open]").forEach((btn) => btn.addEventListener("click", () => openBookingModal(v, btn.dataset.pkgOpen)));

  fillVenuePromoters(v.venue_id);
  $("#d-book").addEventListener("click", () => openBookingModal(v));
  $("#dock-book")?.addEventListener("click", () => openBookingModal(v));
  $("#v-share")?.addEventListener("click", () => shareVenue(v));
  $("#dock-share")?.addEventListener("click", () => shareVenue(v));
  bindFavButtons(view());
  $("#ev-refresh")?.addEventListener("click", () => refreshVenueEvents(v));
  $("#facts-refresh")?.addEventListener("click", async () => {
    const btn = $("#facts-refresh");
    if (btn) { btn.disabled = true; btn.textContent = t("factsRefreshing"); }
    const r = await apiJSON("/facts/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: loadUser(), venueId: v.venue_id }),
    });
    if (r?.venues) VENUE_FACTS = r;
    else {
      const live = await apiJSON("/facts");
      if (live?.venues) VENUE_FACTS = live;
    }
    if ((location.hash || "").split("?")[0] === `#/venue/${v.venue_id}`) renderVenueDetail(v.venue_id);
  });
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

async function openBookingModal(v, preselectedPackageId = "") {
  const me0 = loadUser();
  if (!me0) {
    openOnboarding({ dismissable: false, phase: "auth" });
    return;
  }
  await refreshIdv();
  if (!isPayingMember()) {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    rememberAfterIdv(`#/venue/${encodeURIComponent(v.venue_id)}`);
    const needCard = isIdvOk();
    const root = document.getElementById("modal-root");
    root.innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t("verifyTitle"))}" tabindex="-1">
        <button class="modal-close" id="m-close" aria-label="${esc(t("close"))}">✕</button>
        <h2>${esc(needCard ? t("cardTitle") : t("verifyTitle"))}</h2>
        <p class="modal-sub">${esc(t("bookNeedVerify"))}</p>
        <p style="color:var(--text-dim);margin:12px 0 20px">${esc(t("bookCredentials"))}</p>
        <a class="btn btn-gold" href="${needCard ? "#/card" : "#/verify"}" data-nav id="m-go-verify" style="width:100%">${esc(needCard ? t("cardCta") : t("verifyCta"))}</a>
      </div>
    </div>`;
    const close = () => { root.innerHTML = ""; restoreFocus(opener); };
    $("#m-close")?.addEventListener("click", close);
    $("#overlay")?.addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
    $("#m-go-verify")?.addEventListener("click", close);
    return;
  }
  const tooYoung = venueTooYoung(v);
  if (tooYoung) {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("modal-root");
    root.innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t("verifyAge"))}" tabindex="-1">
        <button class="modal-close" id="m-close" aria-label="${esc(t("close"))}">✕</button>
        <h2>${esc(t("verifyAge"))}</h2>
        <p class="modal-sub">${esc(t("venueTooYoung").replace("{min}", String(tooYoung.min)).replace("{age}", String(tooYoung.age)))}</p>
      </div>
    </div>`;
    const close = () => { root.innerHTML = ""; restoreFocus(opener); };
    $("#m-close")?.addEventListener("click", close);
    $("#overlay")?.addEventListener("click", (e) => { if (e.target.id === "overlay") close(); });
    return;
  }
  const pkgs = packagesFor(v);
  let sel = pkgs.find((p) => p.id === preselectedPackageId) || pkgs[0];
  let party = 4;
  let openSeats = 2;
  const guests = [];
  const host0 = loadHost();
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const root = document.getElementById("modal-root");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t("requestAria").replace("{name}", v.name))}" tabindex="-1">
      <button class="modal-close" id="m-close" aria-label="${esc(t("close"))}">✕</button>
      <h2>${esc(v.name)}</h2>
      <div class="modal-sub">${esc(v.destination)} · ${esc(v.category)}</div>
      <div class="req-steps" aria-hidden="true">
        <div class="req-step on">${esc(t("stepDate"))}</div>
        <div class="req-step on">${esc(t("stepPkg"))}</div>
        <div class="req-step on">${esc(t("stepParty"))}</div>
      </div>
      <p class="req-summary" id="m-summary"></p>
      <div class="verify-perks" style="margin:0 0 16px">
        <p class="verify-perks-title">${esc(t("bookSentAs"))}</p>
        <p style="margin:0;color:var(--text)">${esc((loadUser()?.legalName || displayName(loadUser()) || host0.name))}${cardLabel() ? ` · ${esc(cardLabel())}` : ""}${loadUser()?.handle ? ` · @${esc(loadUser().handle)}` : ""}</p>
        <p class="stepper-hint" style="margin:8px 0 0">${esc(t("bookCredentials"))}</p>
      </div>

      <div class="form-group">
        <label for="m-host">${esc(t("yourName"))}</label>
        <input type="text" id="m-host" autocomplete="name" value="${esc(loadUser()?.legalName || host0.name)}" placeholder="${esc(t("hostPh"))}">
        <div class="field-error hidden" id="err-host" role="alert"></div>
      </div>
      <div class="form-group">
        <label for="m-email">${esc(t("emailPh"))}</label>
        <input type="email" id="m-email" autocomplete="email" value="${esc(host0.email)}" placeholder="sarah.b@example.net">
        <div class="field-error hidden" id="err-email" role="alert"></div>
      </div>
      <div class="form-group">
        <label for="m-phone">${esc(t("mobileLabel"))} <span class="label-optional">(${esc(t("optional"))})</span></label>
        <input type="tel" id="m-phone" autocomplete="tel" value="${esc(host0.phone)}" placeholder="+46 …">
      </div>

      <div class="form-group">
          <label for="m-package-notes">Vad vill du ska ingå? <span class="label-optional">(valfritt)</span></label>
          <textarea id="m-package-notes" rows="3" maxlength="500" placeholder="T.ex. bästa placering, champagne, middag, födelsedag, nära dansgolvet…"></textarea>
          <p class="stepper-hint">Önskemålet skickas till klubben och är inte garanterat förrän de bekräftar.</p>
        </div>

        <div class="form-group">
        <label for="m-date">${esc(t("dateLabel"))}</label>
        <input type="date" id="m-date" min="${todayISO()}" value="${new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)}">
        <div class="field-error hidden" id="err-date" role="alert"></div>
      </div>

      <div class="form-group">
        <label id="lbl-pkgs">${esc(t("pickPackage"))}</label>
        <div class="package-list" id="m-pkgs" role="radiogroup" aria-labelledby="lbl-pkgs">
          ${pkgs.map((p, i) => `
            <div class="package ${p.id === sel.id ? "selected" : ""}" data-pkg="${esc(p.id)}" role="radio" aria-checked="${p.id === sel.id}" tabindex="0">
              <div><div class="package-name">${esc(p.name)}</div><div class="package-desc">${esc(p.desc)}</div></div>
              <div class="package-price">${esc(t("clubSetsPrice"))}</div>
            </div>`).join("")}
        </div>
      </div>

      <div class="form-group">
        <label id="lbl-party">${esc(t("partyCount"))}</label>
        <div class="stepper" role="group" aria-labelledby="lbl-party">
          <button id="m-minus" aria-label="${esc(t("fewerPeople"))}">−</button>
          <span class="stepper-val" id="m-party" aria-live="polite" aria-atomic="true">4</span>
          <button id="m-plus" aria-label="${esc(t("morePeople"))}">+</button>
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
        <label class="stepper-hint" style="display:block;margin-top:10px">${esc(t("openForLabel"))}
          ${openForSelectHTML("m-open-for", "women")}
        </label>
        <p class="stepper-hint">${esc(t("openForHint"))}</p>
      </div>

      <div class="form-group">
        <label for="g-name">${esc(t("inviteGuests"))} <span class="label-optional">(${esc(t("inviteGuestsHint"))})</span></label>
        <div class="guest-row">
          <input type="text" id="g-name" placeholder="${esc(t("namePh"))}" autocomplete="off">
          <input type="email" id="g-email" placeholder="${esc(t("emailPh"))}" autocomplete="off">
          <button class="btn btn-ghost btn-sm" id="g-add" type="button">${esc(t("addGuest"))}</button>
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
      <p class="price-disclaimer">${esc(t("requestMailNote"))}</p>
      <label class="consent-row" for="m-consent">
        <span class="consent-box"><input type="checkbox" id="m-consent" required></span>
        <span class="consent-text">${esc(t("consentBefore"))}<a href="#/integritet" id="m-privacy">${esc(t("consentPrivacy"))}</a>${esc(t("consentAfter"))}</span>
      </label>
      <details class="privacy-inline" id="m-privacy-details">
        <summary>${esc(t("privacySummary"))}</summary>
        <p>${esc(t("privacyInline").replace("{mail}", CONCIERGE_MAIL))}</p>
      </details>
      <div class="field-error hidden" id="err-confirm" role="alert"></div>
      <button class="btn btn-gold" id="m-confirm" style="width:100%">${esc(t("sendRequest"))}</button>
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
      `<span class="chip chip-self">${esc(t("youWord"))} <em>${esc(t("youHostEm"))}</em></span>`,
      ...guests.map((g, i) => `
        <span class="chip">${esc(g.name)}${g.email ? ` <em>${esc(g.email)}</em>` : ""}
          <button type="button" class="chip-x" data-rm="${i}" aria-label="${esc(t("removeNamed").replace("{name}", g.name))}">✕</button>
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
    const dateTxt = dateEl && dateEl.value ? dateEl.value : t("dateLabel").toLowerCase();
    $("#m-summary").innerHTML = `<strong>${esc(sel.name)}</strong> · ${esc(dateTxt)} · ${party} ${esc(t("persShort"))} · ${esc(moneyOrClub(per))}`;
    $("#m-party-hint").textContent = guests.length
      ? t("guestsPlus").replace("{n}", String(guests.length)).replace("{word}", guests.length === 1 ? t("guestOne") : t("guestMany"))
        + (party > minParty() ? t("unnamedExtra").replace("{n}", String(party - minParty())) : "")
      : "";
  };

  const addGuest = () => {
    const name = $("#g-name").value.trim();
    const email = $("#g-email").value.trim();
    if (!name) { setErr("err-guest", t("errGuestName")); $("#g-name").focus(); return; }
    if (email && !EMAIL_RE.test(email)) { setErr("err-guest", t("errGuestEmail")); $("#g-email").focus(); return; }
    if (1 + guests.length + 1 > 20) { setErr("err-guest", t("errGuestMax")); return; }
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
    if (!hostName) { setErr("err-host", t("errHost")); $("#m-host").focus(); return; }
    if (!hostEmail || !EMAIL_RE.test(hostEmail)) { setErr("err-email", t("errEmail")); $("#m-email").focus(); return; }
    if (!date) { setErr("err-date", t("errDate")); $("#m-date").focus(); return; }
    if (date < todayISO()) { setErr("err-date", t("errDatePast")); $("#m-date").focus(); return; }
    if (!Number.isInteger(party) || party < 1) { setErr("err-confirm", t("errParty")); return; }
    if (!$("#m-consent").checked) { setErr("err-confirm", t("errConsent")); $("#m-consent").focus(); return; }

    const me = loadUser();
    const openOnPreview = !!$("#m-open")?.checked;
    if (openOnPreview && !me) {
      setErr("err-confirm", t("loginNeedJoin"));
      return;
    }
    const host = {
      name: hostName,
      email: hostEmail,
      phone: hostPhone,
      id: me?.id || "",
      provider: me?.provider || "",
      handle: me?.handle || "",
      legalName: me?.legalName || "",
      idvStatus: me?.idvStatus || "",
      cardLast4: me?.cardLast4 || "",
      cardBrand: me?.cardBrand || "",
      fields: me?.idvFields || null,
      paid: false,
    };
    saveHost(host);
    const openOn = !!$("#m-open")?.checked;
    const booking = {
      id: `RQ-${Date.now().toString(36).toUpperCase()}`,
      venue_id: v.venue_id, venue: v.name, destination: v.destination,
      date, package: sel.name, packageId: sel.id, packageDetails: sel,
      packageRequest: ($("#m-package-notes")?.value || "").trim(), total: budgetVal(),
      party, per_person: budgetVal() > 0 ? Math.ceil(budgetVal() / party) : 0,
      guests: guests.map((g) => ({ name: g.name, email: g.email, paid: false })),
      openSeats: openOn ? openSeats : 0,
      openLeft: openOn ? openSeats : 0,
      openFor: openOn ? ($("#m-open-for")?.value || "anyone") : "anyone",
      joiners: [],
      host,
      status: openOn ? "open" : "requested",
      sharp: isSharpVenue(v),
      created: new Date().toISOString(),
    };
    const btn = $("#m-confirm");
    btn.disabled = true;
    btn.textContent = t("sending");
    const sent = await sendConciergeRequest(booking);
    booking.delivery = sent;
    saveBookings([...loadBookings(), booking]);
    const remote = await publishTable(booking);
    if (remote?.error === "idv_required" || remote?.error === "card_required") {
      btn.disabled = false;
      btn.textContent = t("sendRequest");
      rememberAfterIdv(`#/venue/${encodeURIComponent(v.venue_id)}`);
      location.hash = remote.error === "card_required" ? "#/card" : "#/verify";
      return;
    }
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
  const heading = sent ? t("confirmSent") : t("confirmSaved");
  root.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" style="text-align:center" role="dialog" aria-modal="true" aria-label="${heading}" tabindex="-1">
      <button class="modal-close" id="m-close" aria-label="${esc(t("close"))}">✕</button>
      <div class="confirm-check">✓</div>
      <h2>${heading}</h2>
      <div class="modal-sub">${esc(b.id)} · ${esc(sent ? t("confirmToTeam") : t("confirmLocal"))}</div>
      <p style="color:var(--text-dim); margin-bottom:8px">${esc(b.package)} · <b>${esc(b.venue)}</b>, ${esc(b.destination)}</p>
      <p style="color:var(--text-dim)">${esc(b.date)} · ${num(b.party)} ${esc(t("people"))}</p>
      ${b.host?.legalName || b.host?.cardLast4 ? `<p class="member-access on">${esc(t("bookSentAs"))}: ${esc(b.host.legalName || b.host.name || "")}${b.host.cardLast4 ? ` · ${esc((b.host.cardBrand || "card") + " ••" + b.host.cardLast4)}` : ""}</p>` : ""}
      ${(b.guests || []).length ? `
      <div class="confirm-guests">
        <div class="confirm-guests-title">${esc(t("partyTitle"))}</div>
        <div class="chip-list" style="justify-content:center">
          <span class="chip chip-self">${esc(t("youWord"))} <em>${esc(t("youHostEm"))}</em></span>
          ${b.guests.map((g) => `<span class="chip">${esc(g.name)}${g.email ? ` <em>${esc(g.email)}</em>` : ""}</span>`).join("")}
        </div>
        <div class="confirm-guests-note">${esc(t("guestsFollow"))}</div>
      </div>` : ""}
      <div class="split-box">
        <div class="split-per">${esc(moneyOrClub(b.per_person))}</div>
        <div class="split-label">${esc(t("perPerson"))}</div>
        <div class="split-total">${esc(moneyOrClub(b.total))}</div>
      </div>
      <p class="price-disclaimer">${esc(sent ? t("confirmSentHint") : t("confirmSavedHint"))}</p>
      ${b.openSeats ? `<p class="invite-joined" role="status">${esc(t("openPublished"))}</p>` : ""}
      <div class="confirm-actions">
        ${b.openSeats ? `<a class="btn btn-gold" href="#/table/${encodeURIComponent(b.id)}" data-nav id="c-go">${esc(t("viewParty"))}</a>` : `<a class="btn btn-gold" href="#/bookings" data-nav id="c-go">${esc(t("navBookings"))}</a>`}
        <button class="btn btn-ghost" id="c-copy">${esc(t("copyInvite"))}</button>
        <a class="btn btn-ghost" id="c-ics" download="${esc(b.id)}.ics" href="${icsFor(b)}">${esc(t("addToCal"))}</a>
        <a class="btn btn-ghost" href="${mailtoFor(b)}">${esc(t("openMail"))}</a>
        <button class="btn btn-ghost" id="c-close">${esc(t("keepExploring"))}</button>
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
      copyBtn.textContent = ok ? t("copiedOk") : t("copyFail");
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
      <div><h2>${esc(t("navBookings"))}</h2><div class="sub">${esc(t("bookingsSub").replace("{n}", String(bookings.length)))}</div></div>
    </div>
    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="big">🥂</div>
        <h3>${esc(t("noBookings"))}</h3>
        <p>${esc(t("noBookingsHint"))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>${esc(t("explore"))}</a></p>
      </div>` :
      bookings.map((b) => `
      <div class="booking-card">
        <div class="booking-info">
          <h3>${esc(b.venue)}</h3>
          <div class="booking-meta">${esc(b.destination)} · ${esc(b.date)} · ${esc(b.package)} · ${num(b.party)} ${esc(t("people"))} · ${esc(b.id)}</div>
          <div class="booking-status">${esc(t("requestNotReserved"))}</div>
          <div class="booking-delivery">${esc(b.delivery === "sent" ? t("deliverySent") : t("deliveryLocal"))}</div>
          ${(b.guests || []).length ? `
          <div class="chip-list booking-guests">
            <span class="chip chip-self">${esc(t("youWord"))}</span>
            ${b.guests.map((g) => `<span class="chip">${esc(g.name)}</span>`).join("")}
          </div>` : ""}
        </div>
        <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap">
          <div class="booking-price">
            <div class="per">${esc(moneyOrClub(b.per_person))}</div>
            <div class="total">${esc(moneyOrClub(b.total))}</div>
          </div>
          <a class="btn btn-gold btn-sm" href="#/table/${encodeURIComponent(b.id)}" data-nav>${esc(t("viewParty"))}</a>
          ${b.delivery !== "sent" ? `<a class="btn btn-ghost btn-sm" href="${mailtoFor(b)}">${esc(t("openMail"))}</a>` : ""}
          <button class="btn btn-ghost btn-sm btn-share" data-share="${esc(b.id)}">${esc(t("sharePlace"))}</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-cancel="${esc(b.id)}">${esc(t("remove"))}</button>
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
      btn.textContent = ok ? t("linkCopied") : t("copyFail");
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
        <h3>${esc(t("invalidInvite"))}</h3>
        <p>${esc(t("invalidInviteHint"))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>${esc(t("explore"))}</a></p>
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
        <div class="invite-kicker">${esc(t("inviteKicker"))}</div>
        <div class="invite-glass" aria-hidden="true">🥂</div>
        <h1 class="invite-title">${esc(t("inviteTitle"))}<br><em>${esc(inv.venue)}</em></h1>
        ${meta ? `<div class="invite-meta">${esc(meta)}</div>` : ""}
        <div class="invite-facts">
          ${inv.date ? `<div class="invite-fact"><span class="k">${esc(t("dateLabel"))}</span><span class="v">${esc(inv.date)}</span></div>` : ""}
          ${inv.package ? `<div class="invite-fact"><span class="k">${esc(t("pkgLabel"))}</span><span class="v">${esc(inv.package)}</span></div>` : ""}
          <div class="invite-fact"><span class="k">${esc(t("partyTitle"))}</span><span class="v">${esc(t("peopleN").replace("{n}", String(inv.party)))}</span></div>
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
        ${v ? `<a class="icon-link invite-venue-link" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>${esc(t("seeVenue"))}</a>` : ""}
      </div>
    </div>
  </section>`;

  const joinBtn = $("#join-btn");
  if (joinBtn) {
    joinBtn.addEventListener("click", async () => {
      if (!loadUser()) { openOnboarding({ dismissable: false, phase: "auth" }); return; }
      joinBtn.disabled = true;
      const r = await joinOpenTable(inv.id, inv);
      if (r.error === "auth") { openOnboarding({ dismissable: false, phase: "auth" }); return; }
      if (r.error === "idv_required") { location.hash = "#/verify"; return; }
      if (r.error === "too_young") { showToast(tooYoungText(r, v)); joinBtn.disabled = false; return; }
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
  const loc = currentLang();
  return km < 10
    ? km.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : Math.round(km).toLocaleString(loc);
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
    s.onerror = () => { clearTimeout(guard); link.remove(); s.remove(); fail(t("leafletFail")); };
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
    <h3>${esc(t("mapLoadFail"))}</h3>
    <p>${esc(t("mapLoadFailHint"))}</p>
    <button class="btn btn-gold btn-sm" id="${id}">${esc(t("geoRetry"))}</button>
  </div>`;
}

// ---------- Kartvyn (#/map) ----------
function renderMapView() {
  view().innerHTML = `
  <section class="section map-section">
    <div class="section-head">
      <div><h2>${esc(t("navMap"))}</h2><div class="sub">${esc(t("mapSub").replace("{dests}", String(publicDestinations().length)).replace("{venues}", String(publicVenues().length)))}</div></div>
      <button class="btn btn-ghost btn-sm map-near-btn" id="map-near" disabled><span aria-hidden="true">🧭</span> ${esc(t("nearMe"))}</button>
    </div>
    <div class="map-shell">
      <div id="map-all" class="map-canvas" role="application" aria-label="${esc(t("mapAria"))}"></div>
      <div class="map-loading" id="map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> ${esc(t("loadingMap"))}</div>
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
              <div class="map-pop-meta">${count} ${esc(count === 1 ? t("venueOne") : t("venueMany"))} · ${esc(t("seasonShort"))} ${esc(d.peak_season)}</div>
              <a class="map-pop-link" href="#/destination/${encodeURIComponent(d.code)}">${esc(t("viewDest"))}</a>
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
          () => { done(); showToast(t("geoMapError")); }
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
          <a class="map-pop-link" href="#/venue/${encodeURIComponent(v.venue_id)}">${esc(t("seeVenue"))}</a>
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
        <div id="map-dest" class="map-canvas map-canvas-mini" role="application" aria-label="${esc(t("mapAria"))}"></div>
        <div class="map-loading" id="dest-map-status" role="status"><span class="spinner spinner-sm" aria-hidden="true"></span> ${esc(t("loadingMap"))}</div>`;
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
  el.textContent = d ? d.name : t("allDest");
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
  let phase = opts.phase
    || (dismissable ? "country" : (!langPicked() ? "lang" : (!loadUser() ? "auth" : "country")));
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
  const requestGeo = () => {
    if (!geoSupported) { geoState = "error"; announce(t("geoError")); render("#ob-geo-retry"); return; }
    geoState = "loading";
    announce(t("geoLoading"));
    render();
    let done = false;
    const fail = () => {
      if (done || closed) return;
      done = true;
      geoState = "error";
      announce(t("geoError"));
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
            announce(t("geoAnnounce").replace("{name}", nearest.d.name).replace("{km}", fmtKm(nearest.km)));
            render("#ob-geo-choose");
          } else {
            announce(t("geoError"));
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
      return `<div class="ob-geo" role="status"><span class="ob-geo-spin" aria-hidden="true"></span> ${esc(t("geoLoading"))}</div>`;
    }
    if (geoState === "found" && nearest) {
      return `
      <div class="ob-geo ob-geo-found" role="status">
        <div class="ob-geo-text">${esc(t("geoNearest"))} <b>${esc(nearest.d.name)}</b> <span class="ob-geo-km">(${fmtKm(nearest.km)} km)</span></div>
        <div class="ob-geo-actions">
          <button class="btn btn-gold btn-sm" id="ob-geo-choose">${esc(t("chooseX").replace("{name}", nearest.d.name))}</button>
          <button class="btn btn-ghost btn-sm" id="ob-geo-dismiss">${esc(t("geoManual"))}</button>
        </div>
      </div>`;
    }
    if (geoState === "error") {
      return `
      <div class="ob-geo ob-geo-error" role="status">
        ${esc(t("geoError"))}
        ${geoSupported ? `<button class="btn btn-ghost btn-sm" id="ob-geo-retry">${esc(t("geoRetry"))}</button>` : ""}
      </div>`;
    }
    return `
    <div class="ob-geo">
      <button class="btn btn-ghost btn-sm" id="ob-geo-btn" aria-describedby="ob-geo-hint"><span aria-hidden="true">🧭</span> ${esc(t("geoUse"))}</button>
      <span class="ob-geo-hint" id="ob-geo-hint">${esc(t("geoHint"))}</span>
    </div>`;
  };
  // Direktlänkar/bakåtknapp får aldrig blockeras — ruttbyte stänger onboardingen
  const onHash = () => close(false);
  const onKey = (e) => { if (e.key === "Escape" && dismissable) close(); };
  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", onHash);

  const choose = (d) => {
    saveHomeChoice({ code: d.code });
    saveNight({ dest: d.code, date: loadNight().date });
    state.filters.dest = d.name; // förfiltrera venue-listan på hemdestinationen
    close(false);
    const target = `#/destination/${encodeURIComponent(d.code)}`;
    if (location.hash === target) route(); else location.hash = target;
  };
  const skip = () => {
    saveHomeChoice({ all: true });
    state.filters.dest = "";
    close(false);
    route();
  };
  const enterAfterLogin = () => {
    if (loadHomeChoice()) {
      close(false);
      route();
      return;
    }
    phase = "country";
    render();
  };

  // focusSel: valfritt CSS-mål att fokusera efter re-render (annars dialogen) —
  // så att t.ex. geo-flödet landar fokus på "Välj X"-knappen i stället för toppen.
  const render = (focusSel) => {
    if (untrap) untrap();
    if (phase === "lang" || phase === "auth" || phase === "connect") {
      const entryCover = coverVenueForDest(DESTINATIONS.find((d) => d.code === "IBZ")) || coverVenueForDest(DESTINATIONS[0]) || null;
      root.innerHTML = `
      <div class="ob-overlay" id="ob-overlay">
        <div class="ob-overlay-media" aria-hidden="true">${coverImgHTML(entryCover && entryCover.url)}</div>
        ${entryCover && entryCover.v ? `<div class="ob-overlay-credit">${photoAttrHTML(entryCover.v)}</div>` : ""}
        <div class="ob" role="dialog" aria-modal="true" aria-label="${esc(phase === "lang" ? t("chooseLang") : phase === "connect" ? t("connectTitle") : t("loginTitle"))}" tabindex="-1">
          <button class="modal-close ob-close" id="ob-close" aria-label="${esc(t("close"))}">✕</button>
          <div class="ob-brand" aria-hidden="true">VELVET<span class="logo-dot">.</span></div>
          <div class="ob-brand-rule" aria-hidden="true"></div>
          ${phase === "connect" ? `
          <h1 class="ob-title">${esc(t("connectTitle"))}</h1>
          <p class="ob-sub">${esc((authProvider === "google" ? t("connectGoogleSub") : t("connectSub")).replace("{net}", (SOCIALS.find((s) => s.id === authProvider) || {}).label || authProvider || ""))}</p>
          <form class="connect-form" id="ob-connect">
            <label>${esc(authProvider === "google" ? t("yourGoogleEmail") : t("yourHandle"))}
              <input type="${authProvider === "google" ? "email" : "text"}" id="ob-handle" autocomplete="${authProvider === "google" ? "email" : "username"}" spellcheck="false" placeholder="${authProvider === "google" ? "you@gmail.com" : "@anvandarnamn"}" maxlength="${authProvider === "google" ? 80 : 40}" required>
            </label>
            <label>${esc(t("yourName"))}
              <input type="text" id="ob-name" autocomplete="name" placeholder="${esc(t("yourName"))}" maxlength="80" required>
            </label>
            <p class="stepper-hint" id="ob-connect-err" hidden></p>
            <div class="ob-actions">
              <button type="submit" class="btn btn-gold" id="ob-connect-go">${esc(t("connectCta"))}</button>
              <button type="button" class="btn btn-ghost" id="ob-connect-back">${esc(t("loginTitle"))}</button>
            </div>
          </form>` : phase === "lang" ? `
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
              <button type="button" class="social-btn social-btn-preview" data-soc="${s.id}" style="--soc:${s.color};color:${s.dark ? "#111" : "#fff"}">
                <span>${esc(socialTrustCopy().create)} ${esc(s.label)}</span><small>${esc(socialTrustCopy().demo)}</small>
              </button>`).join("")}
          </div>
          <p class="stepper-hint social-honesty">🔒 ${esc(socialTrustCopy().explain)}</p>
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
          paintNavLang();
          phase = loadUser() ? "country" : "auth";
          render();
        });
      });
      root.querySelectorAll("[data-soc]").forEach((el) => {
        el.addEventListener("click", async () => {
          el.disabled = true;
          let r = null;
          try { r = await loginWithSocial(el.dataset.soc); }
          catch (err) { console.warn("VELVET login", err); }
          if (r?.oauth) return;
          if (r?.connect) {
            authProvider = el.dataset.soc;
            phase = "connect";
            render();
            return;
          }
          el.disabled = false;
        });
      });
      const closeLang = $("#ob-close");
      if (closeLang) closeLang.addEventListener("click", () => { if (dismissable) close(); else skip(); });
      const skipA = $("#ob-skip-auth");
      if (skipA) skipA.addEventListener("click", () => { phase = "country"; render(); });
      const backC = $("#ob-connect-back");
      if (backC) backC.addEventListener("click", () => { phase = "auth"; render(); });
      const formC = $("#ob-connect");
      if (formC) {
        formC.addEventListener("submit", async (e) => {
          e.preventDefault();
          const errEl = $("#ob-connect-err");
          const go = $("#ob-connect-go");
          if (go) go.disabled = true;
          const r = await connectSocialProfile(authProvider, $("#ob-handle")?.value, $("#ob-name")?.value);
          if (r?.user && profileReady(r.user)) { enterAfterLogin(); return; }
          if (errEl) {
            errEl.hidden = false;
            errEl.textContent = r?.error === "not_found" ? t("connectMissing") : t("connectNeed");
          }
          if (go) go.disabled = false;
        });
      }
      return;
    }
    const countries = countryList();
    const inCountry = country ? countries.find((c) => c.country === country) : null;
    const dests = inCountry ? inCountry.dests : [];
    const dlgLabel = step === 1
      ? t("obStepCountry")
      : t("obStepDest").replace("{country}", country);

    const entryCover = coverVenueForDest(DESTINATIONS.find((d) => d.code === "IBZ"))
      || coverVenueForDest(DESTINATIONS[0]) || null;
    root.innerHTML = `
    <div class="ob-overlay" id="ob-overlay">
      <div class="ob-overlay-media" aria-hidden="true">${coverImgHTML(entryCover && entryCover.url)}</div>
      ${entryCover && entryCover.v ? `<div class="ob-overlay-credit">${photoAttrHTML(entryCover.v)}</div>` : ""}
      <div class="ob" role="dialog" aria-modal="true" aria-label="${esc(dlgLabel)}" tabindex="-1">
        <button class="modal-close ob-close" id="ob-close" aria-label="${esc(t("close"))}">✕</button>
        <div class="ob-brand" aria-hidden="true">VELVET<span class="logo-dot">.</span></div>
        <div class="ob-brand-rule" aria-hidden="true"></div>
        <div class="ob-kicker">${esc(t("tagline"))}</div>
        ${step === 1 ? `
        <h1 class="ob-title">${esc(t("obCelebrate1"))} <em>${esc(t("obCelebrate2"))}</em>?</h1>
        <p class="ob-sub">${esc(t("obCelebrateSub"))}</p>
        <div class="ob-step">${esc(t("obStepCountry"))}</div>
        ${geoPanel()}
        <div class="ob-grid">
          ${countries.map((c, i) => {
            const cover = coverVenueForCountry(c.country);
            const word = c.dests.length === 1 ? t("destOne") : t("destMany");
            return `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-country="${esc(c.country)}" role="button" tabindex="0" aria-label="${esc(t("chooseX").replace("{name}", c.country))}">
            <div class="ob-cover${cover ? "" : " img-fail"}">
              ${coverImgHTML(cover && cover.url)}
              <div class="dest-emblem ob-emblem" style="--h:${destHue(c.country)}" aria-hidden="true">${esc(c.country.slice(0, 2).toUpperCase())}</div>
            </div>
            ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
            <h3>${esc(c.country)}</h3>
            <div class="ob-meta">${c.dests.length} ${esc(word)}</div>
            <div class="ob-names">${c.dests.slice(0, 3).map((d) => esc(d.name)).join(" · ")}${c.dests.length > 3 ? " …" : ""}</div>
          </div>`;
          }).join("")}
        </div>` : `
        <h1 class="ob-title">${esc(t("obDest1"))} <em>${esc(t("obDest2"))}</em></h1>
        <p class="ob-sub">${esc(t("destInCountry").replace("{n}", String(dests.length)).replace("{word}", dests.length === 1 ? t("destOne") : t("destMany")).replace("{country}", country))}</p>
        <div class="ob-step">${esc(t("obStepDest").replace("{country}", country))}</div>
        <div class="ob-grid">
          ${dests.map((d, i) => {
            const km = distanceToDest(d);
            const cover = coverVenueForDest(d);
            return `
          <div class="ob-card" style="animation-delay:${(0.42 + Math.min(i, 14) * 0.045).toFixed(2)}s" data-dest="${esc(d.code)}" role="button" tabindex="0" aria-label="${esc(t("chooseX").replace("{name}", d.name))}">
            <div class="ob-cover${cover ? "" : " img-fail"}">
              ${coverImgHTML(cover && cover.url)}
              <div class="dest-emblem ob-emblem" style="--h:${destHue(d.code)}" aria-hidden="true">${esc(d.code)}</div>
            </div>
            ${cover && cover.v ? photoAttrHTML(cover.v) : ""}
            <h3>${esc(d.name)}</h3>
            <div class="ob-meta"><span class="tier ${d.tier === "Tier 1" ? "tier-1" : "tier-2"}">${esc(d.tier)}</span> · ${esc(t("seasonShort"))} ${esc(d.peak_season)}${km != null ? ` · ~${fmtKm(km)} km` : ""}</div>
            ${pips(d.luxury)}
          </div>`;
          }).join("")}
        </div>`}
        <div class="ob-actions">
          ${step === 2 ? `<button class="btn btn-ghost" id="ob-back">← ${esc(t("changeCountry"))}</button>` : ""}
          <button class="btn btn-ghost" id="ob-skip">${esc(t("showAll"))}</button>
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
    if (x) x.addEventListener("click", () => { if (dismissable) close(); else skip(); });
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
      <div><h2>${esc(t("navFav"))}</h2><div class="sub">${esc(t("favSub").replace("{n}", String(list.length)))}</div></div>
      ${list.length ? `<button class="btn btn-gold btn-sm" id="fav-share">${esc(t("shareList"))}</button>` : ""}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="big">♡</div>
        <h3>${esc(t("noFav"))}</h3>
        <p>${esc(t("noFavHint"))}</p>
        <p style="margin-top:20px"><a class="btn btn-gold" href="#/venues" data-nav>${esc(t("explore"))}</a></p>
      </div>` : `<div class="venue-grid">${list.map(venueCard).join("")}</div>`}
  </section>`;
  bindVenueCards();
  const share = $("#fav-share");
  if (share) {
    share.addEventListener("click", async () => {
      const payload = { name: "VELVET-lista", ids: loadFavs() };
      const url = `${location.origin}${location.pathname}#/list/${b64urlEncode(payload)}`;
      const ok = await copyText(url);
      share.textContent = ok ? t("linkCopied") : t("copyFail");
      setTimeout(() => { share.textContent = t("shareList"); }, 1800);
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
  const title = (typeof p.name === "string" && p.name) ? p.name : t("sharedListName");
  view().innerHTML = `
  <section class="section">
    <div class="section-head">
      <div><h2>${esc(title)}</h2><div class="sub">${esc(t("sharedListSub").replace("{n}", String(list.length)))}</div></div>
      ${list.length ? `<button class="btn btn-ghost btn-sm" id="list-save">${esc(t("saveAllFavs"))}</button>` : ""}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="big">🔗</div>
        <h3>${esc(t("listEmpty"))}</h3>
        <p>${esc(t("listEmptyHint"))}</p>
      </div>` : `<div class="venue-grid">${list.map(venueCard).join("")}</div>`}
  </section>`;
  bindVenueCards();
  const save = $("#list-save");
  if (save) {
    save.addEventListener("click", () => {
      saveFavs([...loadFavs(), ...list.map((v) => v.venue_id)]);
      save.textContent = t("savedCheck");
      syncFavButtons();
    });
  }
}

function openNightHref(dest, date) {
  const p = new URLSearchParams();
  if (dest) p.set("dest", dest);
  if (date) p.set("date", date);
  const q = p.toString();
  return q ? `#/open?${q}` : "#/open";
}
function paintNightList(host, d, date, { limit = 0, openTables = [] } = {}) {
  if (!host) return;
  if (!d) {
    host.innerHTML = `<p class="events-meta">${esc(t("tablesPickCity"))}</p>`;
    return;
  }
  const { onCal, rest } = nightBoard(d, date);
  const seats = openTables.filter((tb) => tb.date === date && (tb.destination === d.name || destVenuesOf(d).some((v) => v.venue_id === tb.venue_id)));
  const cal = limit ? onCal.slice(0, limit) : onCal;
  const ask = limit ? rest.slice(0, Math.max(0, limit - cal.length)) : rest;
  let html = "";
  if (seats.length) {
    html += `<h3 class="night-h">${esc(t("nightVelvetSeats"))}</h3>`;
    html += seats.map((tb) => `
      <div class="avail-row">
        <div>
          <a class="avail-name" href="#/table/${encodeURIComponent(tb.id)}" data-nav>${esc(tb.venue)}</a>
          <div class="avail-nights">${esc(openSeatsLine(tb) || `${num(tb.openLeft)} ${t("seatsOpen")}`)}</div>
        </div>
        <a class="btn btn-gold btn-sm" href="#/table/${encodeURIComponent(tb.id)}" data-nav>${esc(t("viewParty"))}</a>
      </div>`).join("");
  }
  html += `<h3 class="night-h">${esc(t("nightOnCal"))}</h3>`;
  html += cal.length
    ? `<div class="avail-list">${cal.map(({ v, nights }) => nightRowHTML(v, date, nights)).join("")}</div>`
    : `<p class="events-meta">${esc(t("tablesEmptyCal"))}</p>`;
  if (ask.length) {
    html += `<h3 class="night-h">${esc(t("nightAsk"))}</h3><div class="avail-list">${ask.map((v) => nightRowHTML(v, date, [])).join("")}</div>`;
  }
  host.innerHTML = html;
}
async function renderOpenTables() {
  const q = new URLSearchParams((location.hash.split("?")[1] || ""));
  const night = loadNight();
  if (q.get("dest")) night.dest = q.get("dest");
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "")) night.date = q.get("date");
  saveNight(night);
  const d = destByCodeOrName(night.dest) || null;
  const u = loadUser();
  const dests = publicDestinations();
  view().innerHTML = `
  <section class="section night-page">
    <div class="section-head">
      <div><h2>${esc(t("tablesTitle"))}</h2><div class="sub">${esc(t("tablesSub"))}</div></div>
    </div>
    <div class="night-pick">
      <label class="night-dest-label">${esc(t("tablesCity"))}
        <select id="night-dest" aria-label="${esc(t("tablesCity"))}">
          <option value="">${esc(t("allDest"))}</option>
          ${dests.map((x) => `<option value="${esc(x.code)}" ${d && d.code === x.code ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>
      </label>
    </div>
    ${d ? `<div class="avail-chips" role="list">${dateChipsHTML(night.date, d)}</div>` : ""}
    ${!u ? `<p class="price-disclaimer"><button class="btn btn-gold btn-sm" id="open-login">${esc(t("loginTitle"))}</button></p>` : ""}
    <div class="night-board" id="night-board"><p class="events-meta">${esc(t("tablesLoading"))}</p></div>
  </section>`;
  $("#night-dest")?.addEventListener("change", (e) => {
    location.hash = openNightHref(e.target.value, night.date);
  });
  document.querySelectorAll("[data-avail-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = openNightHref(d ? d.code : "", btn.dataset.availDate);
    });
  });
  $("#open-login")?.addEventListener("click", () => openOnboarding({ dismissable: true, phase: "auth" }));
  const tables = (await listOpenTables()).map((tb) => tb.members ? tb : decorateLocalTable(tb));
  if (d) await hydrateNight(d, night.date);
  paintNightList($("#night-board"), d, night.date, { openTables: tables });
  setTitle(t("tablesTitle"));
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
  const canJoin = Number(tb.openLeft) > 0 && !already && canTakeOpenSeat(tb);
  const seatBlocked = Number(tb.openLeft) > 0 && !already && !canTakeOpenSeat(tb);
  const hostId = tb.host?.id || "";
  const over = !!(tb.past || partyOver(tb));
  const reviews = Array.isArray(tb.reviews) ? tb.reviews : [];
  const others = members.filter((p) => p.id && me && p.id !== me.id);
  setTitle(`${tb.venue} · ${t("partyTitle")}`);
  view().innerHTML = `
  <section class="section party-page">
    <a class="detail-back" href="#/open" data-nav>← ${esc(t("navOpen"))}</a>
    <p class="detail-kicker">${esc(tb.destination)} · ${esc(tb.date)} · ${esc(tb.package || "")}${over ? ` · ${esc(t("pastParties"))}` : ""}</p>
    <h1>${esc(tb.venue)}</h1>
    <p class="ob-sub" style="text-align:left;margin:6px 0 18px">${esc(over ? t("partyOverTitle") : t("partySub"))}</p>
    <div class="party-stats">
      <div><b>${esc(moneyOrClub(tb.per_person))}</b><span>${esc(t("perPerson"))}</span></div>
      <div><b>${num(tb.paidN)}/${num(tb.dueN)}</b><span>${esc(t("paid"))}</span></div>
      <div><b>${num(tb.openLeft)}</b><span>${esc(openSeatsLine(tb) || t("seatsOpen"))}</span></div>
      <div><b>${num(tb.party)}</b><span>${esc(t("people"))}</span></div>
    </div>
    ${over ? "" : `<p class="price-disclaimer">${esc(t("payNote"))}</p>`}
    <h2 class="detail-panel-title" style="margin-top:8px">${esc(t("roster"))}</h2>
    <div class="person-list" id="party-list">
      ${members.map((p) => personRowHTML(p, { me, hostId, tableId: tb.id })).join("")}
    </div>
    ${already && over && others.length ? `
      <h2 class="detail-panel-title" style="margin-top:28px">${esc(t("rateTogether"))}</h2>
      <p class="stepper-hint">${esc(t("rateTogetherHint"))}</p>
      <div class="rate-list" id="rate-list">
        ${others.map((p) => rateRowHTML(p, tb.id, reviews.find((r) => r.from === me.id && r.to === p.id))).join("")}
      </div>` : ""}
    <div class="book-site-actions" style="margin-top:22px;max-width:420px">
      ${!me ? `<button class="btn btn-gold" id="party-login">${esc(t("loginTitle"))}</button>` : ""}
      ${me && canJoin && !over ? `<button class="btn btn-gold" id="party-join">${esc(t("takeSeat"))}</button>` : ""}
      ${me && seatBlocked && !over ? `<p class="price-disclaimer">${esc(t("seatPref").replace("{who}", openForLabel(tb.openFor).toLowerCase()))}</p>` : ""}
      ${already && me && !over && members.some((m) => m.id === me.id && !m.paid) ? `<a class="btn btn-gold" href="#/pay/${encodeURIComponent(tb.id)}" data-nav>${esc(t("payShare"))}</a>` : ""}
      ${already ? `<p class="invite-joined">${esc(t("youAreIn"))}</p>` : ""}
      ${tb.venue_id ? `<a class="btn btn-ghost" href="#/venue/${encodeURIComponent(tb.venue_id)}" data-nav>${esc(t("explore"))}</a>` : ""}
    </div>
  </section>`;
  $("#party-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
  $("#party-join")?.addEventListener("click", async () => {
    if (!loadUser()) { openOnboarding({ dismissable: false, phase: "auth" }); return; }
    const btn = $("#party-join");
    if (btn) btn.disabled = true;
    const r = await joinOpenTable(tb.id, tb);
    if (r.error === "auth") openOnboarding({ dismissable: false, phase: "auth" });
    else if (r.error === "idv_required") location.hash = "#/verify";
    else if (r.error === "too_young") { showToast(tooYoungText(r, VENUES.find((x) => x.venue_id === tb.venue_id))); if (btn) btn.disabled = false; }
    else if (r.error === "seat_pref") { showToast(t("seatPref").replace("{who}", openForLabel(r.openFor || tb.openFor).toLowerCase())); if (btn) btn.disabled = false; }
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
  if (me) bindRateRows(document.getElementById("rate-list") || view(), me, () => renderTable(id));
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
    $("#p-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
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
  const canPay = !!(mine && !mine.paid);
  const startAmt = Number(mine?.paidAmount) || 0;
  setTitle(`${t("payShare")} · ${tb.venue}`);
  view().innerHTML = `
  <section class="section pay-page">
    <a class="detail-back" href="#/table/${encodeURIComponent(tb.id)}" data-nav>← ${esc(tb.venue)}</a>
    <p class="detail-kicker">${esc(cfg.destination || "Revolut")} · ${esc(cfg.currency || "EUR")}${cfg.ready ? "" : ` · ${esc(t("paySoon"))}`}</p>
    <h1>${esc(t("payShare"))}</h1>
    <p class="ob-sub" style="text-align:left">${esc(t("payIntro"))}</p>
    <div class="split-box" style="margin:18px 0">
      <label class="split-label" for="pay-amt">${esc(t("payAmount"))} · ${esc(tb.venue)}</label>
      <div class="pay-amt-row">
        <span>€</span>
        <input type="number" id="pay-amt" min="1" step="1" inputmode="decimal" value="${startAmt || ""}" placeholder="0">
      </div>
      <div class="split-label">${esc(t("payEnterAmount"))}</div>
      ${Number(tb.per_person) > 0 ? `<p class="price-disclaimer">${esc(t("guestBudget").replace("{amount}", fmtEUR(tb.per_person)))}</p>` : `<p class="price-disclaimer">${esc(t("clubSetsPrice"))}</p>`}
    </div>
    ${mine?.paid ? `<p class="invite-joined">✓ ${esc(t("paid"))}${mine.paidVia ? ` · ${esc(mine.paidVia)}` : ""}</p>` : ""}
    ${mine?.paidPending ? `<p class="invite-joined">${esc(t("payWait"))}</p>` : ""}
    ${!mine ? `<p class="price-disclaimer">${esc(t("payNeedJoin"))}</p>` : ""}
    ${!cfg.ready && isOperatorUser(me) ? `<p style="margin:0 0 14px"><a class="btn btn-gold" href="#/payout" data-nav>${esc(t("paySetup"))}</a></p>` : ""}
    <div class="pay-grid" id="pay-grid">
      ${PAY_METHODS.map((m) => {
        const spec = (cfg.methods || []).find((x) => x.id === m.id);
        const on = !!(spec && spec.enabled);
        return `<button type="button" class="pay-method${on ? "" : " off"}" data-method="${m.id}" ${on && canPay ? "" : "disabled"}>
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
  const payAmount = () => Math.max(0, Number($("#pay-amt")?.value || 0));
  document.querySelectorAll("[data-method]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const err = $("#pay-err");
      err.classList.add("hidden");
      const amount = payAmount();
      if (amount < 1) { err.textContent = t("payEnterAmount"); err.classList.remove("hidden"); return; }
      btn.disabled = true;
      const r = await apiJSON("/pay/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: tb.id, user: me, method: btn.dataset.method, amount }),
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
          <p style="margin-top:12px"><button type="button" class="btn btn-gold" id="pay-sent">${esc(t("payISent"))}</button></p>
          <p class="stepper-hint">${esc(t("payAfterBank"))}</p>`;
        $("#copy-iban")?.addEventListener("click", () => copyText(r.bank.iban));
        $("#copy-ref")?.addEventListener("click", () => copyText(r.bank.reference));
        $("#pay-sent")?.addEventListener("click", async () => {
          const s = await apiJSON("/pay/sent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tableId: tb.id, user: me, amount, method: btn.dataset.method, reference: r.bank.reference }),
          });
          if (s?.ok) { showToast(t("payWait")); location.hash = `#/table/${encodeURIComponent(tb.id)}`; }
        });
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
  if (r?.ok && r.card) {
    saveUser({ ...loadUser(), cardLast4: r.card.last4, cardBrand: r.card.brand });
    showToast(t("payingCustomer"));
    location.hash = "#/account";
    return;
  }
  if (r?.ok && r.bridge) {
    showToast(t("paid"));
    location.hash = `#/book-site/${encodeURIComponent(r.bridge.venueId)}`;
    return;
  }
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
      <label>${esc(t("adminKey"))}<input name="adminKey" type="password" autocomplete="off" placeholder="${esc(t("adminKeyPh"))}"></label>
      <label>${esc(t("webhookToken"))}<input name="webhookToken" type="password" autocomplete="off"></label>
      <label>Revolut IBAN<input name="revolutIban" autocomplete="off" placeholder="${esc(t("ibanPh"))}" value="${esc(cfg.account?.iban || "")}"></label>
      <label>BIC / SWIFT<input name="revolutBic" autocomplete="off" placeholder="${esc(t("bicPh"))}" value="${esc(cfg.account?.bic || "")}"></label>
      <label>${esc(t("payHolder"))}<input name="revolutName" value="${esc(cfg.account?.name || "")}" placeholder="${esc(t("holderPh"))}"></label>
      <label>Revolut.me<input name="revolutMe" value="${esc(cfg.account?.me || "")}" placeholder="${esc(t("usernamePh"))}"></label>
      <label>Stripe secret (sk_live_… / sk_test_…)<input name="stripeSecret" type="password" placeholder="${cfg.keys?.stripe ? "•••• set" : ""}" autocomplete="off"></label>
      <label>Stripe webhook secret<input name="stripeWebhook" type="password" placeholder="${cfg.keys?.stripe ? "" : ""}" autocomplete="off"></label>
      <label>Revolut Merchant secret<input name="revolutMerchantSecret" type="password" placeholder="${cfg.keys?.revolut ? "•••• set" : ""}" autocomplete="off"></label>
      <label>PayPal client ID<input name="paypalClient" autocomplete="off"></label>
      <label>PayPal secret<input name="paypalSecret" type="password" autocomplete="off"></label>
      <label>Google client ID<input name="googleId" autocomplete="off" placeholder="${cfg.oauth?.google ? "•••• set" : "….apps.googleusercontent.com"}"></label>
      <label>Google client secret<input name="googleSecret" type="password" autocomplete="off"></label>
      <p class="stepper-hint">${esc(t("googleOauthHint"))}</p>
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
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function partyOver(tb) {
  const d = String((tb && tb.date) || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayISO();
}
function partyCardHTML(p, { mine } = {}) {
  if (!p) return "";
  const mates = Array.isArray(p.mates) ? p.mates : [];
  const names = mates.map((m) => m.name || "").filter(Boolean).slice(0, 4).join(", ");
  const extra = mates.length > 4 ? ` +${mates.length - 4}` : "";
  const role = p.role === "host" ? t("hostRole") : t("guestRole");
  return `
  <a class="party-card" href="#/table/${encodeURIComponent(p.id)}" data-nav>
    <div class="party-card-top">
      <b>${esc(p.venue || "")}</b>
      <span class="chip-mini">${esc(role)}</span>
    </div>
    <p class="booking-meta">${esc(p.destination || "")} · ${esc(p.date || "")}${p.package ? ` · ${esc(p.package)}` : ""}</p>
    ${mates.length ? `<p class="party-card-crew">${esc(t("withCrew"))} ${esc(names)}${esc(extra)}</p>` : ""}
    ${mine && p.past && mates.length ? `<p class="party-card-rate">${mates.filter((m) => (p.ratedIds || []).includes(m.id)).length}/${mates.length} ${esc(t("reviews"))}</p>` : ""}
  </a>`;
}
function rateRowHTML(person, tableId, existing) {
  if (!person || !person.id) return "";
  if (existing) {
    return `<div class="rate-row done">
      <div><b>${esc(person.name || "")}</b> · ${starRow(existing.rating)}${existing.text ? `<p>${esc(existing.text)}</p>` : ""}</div>
      <span class="events-meta">${esc(t("alreadyRated"))}</span>
    </div>`;
  }
  return `<div class="rate-row" data-rate-to="${esc(person.id)}" data-rate-name="${esc(person.name || "")}" data-rate-table="${esc(tableId)}">
    <div>
      <p class="rate-who"><b>${esc(person.name || "")}</b> — ${esc(t("rateTogether"))}</p>
      <div class="star-pick">${[1,2,3,4,5].map((n) => `<button type="button" data-star="${n}" aria-label="${n}">★</button>`).join("")}</div>
      <textarea rows="2" maxlength="280" placeholder="${esc(t("optional"))}"></textarea>
    </div>
    <button type="button" class="btn btn-gold btn-sm" data-rate-go>${esc(t("rateSend"))}</button>
  </div>`;
}
function bindRateRows(root, me, onDone) {
  root.querySelectorAll(".rate-row[data-rate-to]").forEach((row) => {
    let stars = 5;
    const paint = () => {
      row.querySelectorAll("[data-star]").forEach((b) => {
        b.textContent = Number(b.dataset.star) <= stars ? "★" : "☆";
      });
    };
    paint();
    row.querySelectorAll("[data-star]").forEach((b) => b.addEventListener("click", () => { stars = Number(b.dataset.star); paint(); }));
    row.querySelector("[data-rate-go]")?.addEventListener("click", async () => {
      const btn = row.querySelector("[data-rate-go]");
      if (btn) btn.disabled = true;
      const r = await apiJSON("/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: me,
          to: { id: row.dataset.rateTo, name: row.dataset.rateName },
          tableId: row.dataset.rateTable,
          rating: stars,
          text: row.querySelector("textarea")?.value || "",
        }),
      });
      if (r?.review) {
        showToast(t("ratedOk"));
        if (onDone) onDone();
        return;
      }
      if (btn) btn.disabled = false;
      showToast(r?.error === "too_soon" ? t("rateTogetherHint") : r?.error === "dup" ? t("alreadyRated") : t("reviewHint"));
    });
  });
}

function faceChecksHTML(passOk, liveOk, match) {
  const row = (ok, label) =>
    `<div class="face-check ${ok ? "ok" : "no"}">${ok ? "✓" : "○"} ${esc(label)}</div>`;
  const matchOn = !!(match && match.matchOk);
  return `<div class="face-checks" id="face-checks">
    ${row(!!passOk, t("verifyFacePass"))}
    ${row(!!liveOk, t("verifyFaceLive"))}
    ${row(matchOn, t("verifyFaceMatch"))}
  </div>`;
}

function mrzRowsHTML(fields) {
  if (!fields) return "";
  const sexKey = fields.sex === "F" ? "mrzSexF" : fields.sex === "M" ? "mrzSexM" : fields.sex === "X" ? "mrzSexX" : "";
  const rows = [
    [t("mrzName"), [fields.firstName, fields.lastName].filter(Boolean).join(" ")],
    [t("mrzDob"), fields.birthDate],
    [t("verifyAge"), fields.ageYears != null ? String(fields.ageYears) : (ageYears(fields.birthDate) != null ? String(ageYears(fields.birthDate)) : "")],
    [t("mrzSex"), sexKey ? t(sexKey) : fields.sex],
    [t("mrzNat"), fields.nationality],
    [t("mrzState"), fields.issuingState],
    [t("mrzNo"), fields.documentNumberMasked],
    [t("mrzExp"), fields.expirationDate],
  ].filter(([, v]) => v);
  return `<div class="mrz-card">
    <p class="mrz-card-kicker">${esc(t("verifyReadOk"))}</p>
    <div class="detail-facts facts-rows">${rows.map(([lab, val]) =>
      `<div class="fact"><span class="fact-label">${esc(lab)}</span><span class="fact-val">${esc(val)}</span></div>`
    ).join("")}</div>
  </div>`;
}

async function renderVerify() {
  const u = loadUser();
  if (!u) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p><button class="btn btn-gold" id="v-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#v-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
    return;
  }
  await refreshIdv();
  warmupOcr().catch(() => {});
  warmupFaceApi().catch(() => {});
  const st = idvStatus();
  const savedFields = (loadUser() && loadUser().idvFields) || null;
  let passJpeg = "";
  let selfJpeg = "";
  let mrz = null;
  let confirmMismatch = false;
  let passFace = null;
  let liveFace = null;
  let faceMatch = null;
  view().innerHTML = `
  <section class="section verify-page">
    <a class="detail-back" href="#/account" data-nav>← ${esc(t("account"))}</a>
    <h1>${esc(t("verifyTitle"))}</h1>
    <p class="ob-sub" style="margin:0 0 18px;text-align:left">${esc(t("verifySub"))}</p>
    ${st === "verified"
      ? `<p class="idv-badge ok">✓ ${esc(t("verifyOk"))}</p><p class="member-access${isPayingMember() ? " on" : ""}">${esc(isPayingMember() ? t("memberAccessOn") : t("cardNeed"))}</p>${mrzRowsHTML(savedFields)}`
      : `<div class="verify-perks">
          <p class="verify-perks-title">${esc(t("verifyPerksTitle"))}</p>
          <ul>
            <li>${esc(t("verifyPerkPromoter"))}</li>
            <li>${esc(t("verifyPerkSee"))}</li>
            <li>${esc(t("verifyPerkCard"))}</li>
            <li>${esc(t("verifyPerkEvents"))}</li>
          </ul>
        </div>`}
    <p class="stepper-hint">${esc(t("verifyHint"))}</p>
    <div class="mrz-cam-wrap" id="mrz-cam-wrap" hidden>
      <video id="mrz-video" playsinline muted autoplay></video>
      <div class="mrz-guide" id="mrz-guide" aria-hidden="true"><span>${esc(t("verifyMrzGuide"))}</span></div>
      <button type="button" class="mrz-shutter" id="idv-shutter" hidden aria-label="${esc(t("verifySnap"))}"></button>
      <button type="button" class="mrz-flip" id="idv-flip">${esc(t("verifyFlipCam"))}</button>
    </div>
    <p class="mrz-status" id="mrz-status" hidden></p>
    <div id="mrz-fields"></div>
    <div id="face-box">${faceChecksHTML(false, false, null)}</div>
    <div class="idv-grid">
      <label class="idv-slot">
        <span>${esc(t("verifyPassport"))}</span>
        <input type="file" id="idv-pass" accept="image/*" capture="environment">
        <img id="idv-pass-prev" alt="" hidden>
        <em>${esc(t("pickPhoto"))}</em>
      </label>
      <label class="idv-slot">
        <span>${esc(t("verifySelfie"))}</span>
        <img id="idv-self-prev" alt="" hidden>
        <em>${esc(t("verifyBlink"))}</em>
      </label>
    </div>
    <p class="idv-actions">
      <button type="button" class="btn btn-ghost" id="idv-cam">${esc(t("verifyCam"))}</button>
      <button type="button" class="btn btn-ghost hidden" id="idv-snap">${esc(t("verifySnap"))}</button>
      <button type="button" class="btn btn-gold" id="idv-live">${esc(t("verifyLive"))}</button>
    </p>
    <p class="price-disclaimer">${esc(t("verifyStored"))}</p>
    <div class="field-error hidden" id="idv-err" role="alert"></div>
    <label class="chk-row hidden" id="idv-confirm-row">
      <input type="checkbox" id="idv-confirm"> ${esc(t("verifyConfirmName"))}
    </label>
    <button class="btn btn-gold" id="idv-go" style="width:100%;margin-top:12px">${esc(t("verifyCta"))}</button>
  </section>`;

  const setErr = (msg) => {
    const err = $("#idv-err");
    if (!err) return;
    if (!msg) { err.classList.add("hidden"); err.textContent = ""; return; }
    err.textContent = msg;
    err.classList.remove("hidden");
  };
  const setStatus = (msg, show) => {
    const el = $("#mrz-status");
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !show;
  };
  const paintFace = () => {
    const box = $("#face-box");
    if (box) box.innerHTML = faceChecksHTML(passFace && passFace.ok, liveFace && liveFace.ok, faceMatch);
  };
  const showMrz = (rec) => {
    mrz = rec;
    const fields = rec && rec.fields ? mrzPublic(rec.fields) : null;
    const box = $("#mrz-fields");
    if (box) box.innerHTML = rec && rec.checksumsOk ? mrzRowsHTML(fields) : "";
    const row = $("#idv-confirm-row");
    if (row && rec && rec.fields) {
      const nm = nameMatch(rec.fields.firstName, rec.fields.lastName, u.name || displayName(u));
      row.classList.toggle("hidden", nm.ok);
    }
  };
  const readShot = async (data) => {
    passJpeg = data;
    passFace = null;
    liveFace = null;
    faceMatch = null;
    paintFace();
    const img = $("#idv-pass-prev");
    if (img) { img.src = data; img.hidden = false; img.dataset.data = data; }
    setStatus(t("verifyReading"), true);
    setErr("");
    try {
      const rec = await readPassportMrz(data);
      if (rec && rec.expired) {
        setStatus("", false);
        setErr(t("verifyExpired"));
        showMrz(rec);
        return;
      }
      if (!rec || !rec.checksumsOk) {
        setStatus("", false);
        setErr(t("verifyReadFail"));
        showMrz(null);
        return;
      }
      const years = ageYears(rec.fields?.birthDate);
      if (years == null || years < 18) {
        setStatus("", false);
        setErr(t("verifyTooYoung").replace("{age}", years == null ? "—" : String(years)));
        showMrz(rec);
        return;
      }
      setStatus(t("verifyFaceLoad"), true);
      showMrz(rec);
      try { await loadFaceApi(); } catch { setStatus("", false); setErr(t("verifyFaceLoadFail")); return; }
      passFace = await detectPassportFace(data);
      setStatus("", false);
      paintFace();
      if (!passFace.ok) setErr(t("verifyNoFacePass"));
    } catch {
      setStatus("", false);
      setErr(t("verifyReadFail"));
    }
  };

  $("#idv-pass")?.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { await readShot(await jpegFromFile(f, 2000, 0.9)); }
    catch { setErr(t("verifyReadFail")); }
  });
  const camBtn = $("#idv-cam");
  let camFacing = "environment";
  let camMode = "pass";
  let snapping = false;
  const paintShutter = () => {
    const shutter = $("#idv-shutter");
    if (shutter) shutter.hidden = camBtn?.dataset.open !== "1";
  };
  const takePassShot = async () => {
    if (snapping || camMode !== "pass" || camBtn?.dataset.open !== "1") return;
    const video = $("#mrz-video");
    if (!video || !video.videoWidth) return;
    snapping = true;
    const data = await captureStill(video);
    stopLiveness();
    stopCamera();
    const wrap = $("#mrz-cam-wrap");
    if (wrap) wrap.hidden = true;
    wrap?.classList.remove("selfie");
    $("#idv-snap")?.classList.add("hidden");
    paintShutter();
    if (camBtn) { camBtn.dataset.open = ""; camBtn.textContent = t("verifyCam"); }
    try { await readShot(data); }
    finally { snapping = false; }
  };
  const openCam = async (facing, { mode = camMode } = {}) => {
    const wrap = $("#mrz-cam-wrap");
    const video = $("#mrz-video");
    camMode = mode === "selfie" ? "selfie" : "pass";
    camFacing = facing === "user" ? "user" : "environment";
    await startCamera(video, camFacing);
    await waitForVideo(video).catch(() => {});
    if (wrap) {
      wrap.hidden = false;
      wrap.classList.toggle("selfie", camMode === "selfie" || camFacing === "user");
      wrap.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const guide = $("#mrz-guide");
    if (guide) {
      const txt = camMode === "selfie" ? t("verifyBlink") : t("verifyMrzGuide");
      guide.innerHTML = `<span>${esc(txt)}</span>`;
    }
    if (camBtn) { camBtn.dataset.open = "1"; camBtn.textContent = t("verifyCamStop"); }
    paintShutter();
  };
  $("#idv-flip")?.addEventListener("click", async () => {
    if (camBtn?.dataset.open !== "1") return;
    try {
      await openCam(camFacing === "user" ? "environment" : "user", { mode: camMode });
    } catch { setErr(t("verifyCamFail")); }
  });
  if (camBtn) {
    camBtn.onclick = async () => {
      if (camBtn.dataset.open === "1") {
        stopLiveness();
        stopCamera();
        const wrap = $("#mrz-cam-wrap");
        if (wrap) { wrap.hidden = true; wrap.classList.remove("selfie"); }
        $("#idv-snap")?.classList.add("hidden");
        camBtn.dataset.open = "";
        camBtn.textContent = t("verifyCam");
        paintShutter();
        return;
      }
      try {
        await openCam("environment", { mode: "pass" });
        $("#idv-snap")?.classList.remove("hidden");
      } catch {
        stopCamera();
        setErr(t("verifyCamFail"));
      }
    };
  }
  $("#idv-snap")?.addEventListener("click", () => { takePassShot(); });
  $("#idv-shutter")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (camMode === "selfie") {
      requestLivenessTap();
      setStatus(t("verifyBlinkNow"), true);
      return;
    }
    takePassShot();
  });
  $("#mrz-cam-wrap")?.addEventListener("click", (e) => {
    if (e.target.closest(".mrz-flip, .mrz-shutter")) return;
    if (camBtn?.dataset.open !== "1") return;
    const video = $("#mrz-video");
    if (camMode === "selfie") {
      requestLivenessTap();
      setStatus(t("verifyBlinkNow"), true);
      return;
    }
    focusAt(video, e.clientX, e.clientY);
  });
  $("#idv-live")?.addEventListener("click", async () => {
    if (!passFace || !passFace.ok) {
      setErr(t("verifyNoFacePass"));
      return;
    }
    const wrap = $("#mrz-cam-wrap");
    const video = $("#mrz-video");
    const liveBtn = $("#idv-live");
    if (liveBtn?.dataset.busy === "1") return;
    if (liveBtn) liveBtn.dataset.busy = "1";
    setErr("");
    try {
      await openCam("user", { mode: "selfie" });
    } catch {
      if (liveBtn) liveBtn.dataset.busy = "";
      setStatus("", false);
      setErr(t("verifyCamFail"));
      return;
    }
    setStatus(t("verifyFaceLoad"), true);
    try { await loadFaceApi(); }
    catch {
      stopLiveness();
      stopCamera();
      if (wrap) { wrap.hidden = true; wrap.classList.remove("selfie"); }
      if (camBtn) { camBtn.dataset.open = ""; camBtn.textContent = t("verifyCam"); }
      paintShutter();
      if (liveBtn) liveBtn.dataset.busy = "";
      setStatus("", false);
      setErr(t("verifyFaceLoadFail"));
      return;
    }
    try {
      setStatus(t("verifyBlink"), true);
      const live = await watchBlink(video, (st) => {
        if (st === "no_face") setStatus(t("verifyNoFaceSelf"), true);
        else if (st === "blink" || st === "look") setStatus(t("verifyBlink"), true);
        else if (st === "closed") setStatus(t("verifyBlinkNow"), true);
        else if (st === "ok") setStatus(t("verifyFaceOk"), true);
      });
      const shot = snapshotVideo(video, 1400, 0.88);
      stopLiveness();
      stopCamera();
      if (wrap) { wrap.hidden = true; wrap.classList.remove("selfie"); }
      if (camBtn) { camBtn.dataset.open = ""; camBtn.textContent = t("verifyCam"); }
      paintShutter();
      if (!live.ok) {
        liveFace = null;
        faceMatch = null;
        paintFace();
        setStatus("", false);
        setErr(live.reason === "timeout" ? t("verifyNoBlink") : t("verifyNoFaceSelf"));
        return;
      }
      selfJpeg = shot;
      const img = $("#idv-self-prev");
      if (img) { img.src = shot; img.hidden = false; }
      liveFace = live;
      faceMatch = matchFaces(passFace.descriptor, live.descriptor);
      paintFace();
      setStatus("", false);
      if (!faceMatch.matchOk) setErr(t("verifyFaceMismatch"));
    } catch {
      stopLiveness();
      stopCamera();
      if (wrap) { wrap.hidden = true; wrap.classList.remove("selfie"); }
      if (camBtn) { camBtn.dataset.open = ""; camBtn.textContent = t("verifyCam"); }
      paintShutter();
      setStatus("", false);
      setErr(t("verifyCamFail"));
    } finally {
      if (liveBtn) liveBtn.dataset.busy = "";
    }
  });
  $("#idv-confirm")?.addEventListener("change", (e) => {
    confirmMismatch = !!e.target.checked;
  });
  $("#idv-go")?.addEventListener("click", async () => {
    const errNeed = !passJpeg || !selfJpeg || !mrz || !mrz.checksumsOk;
    if (errNeed) {
      setErr(!mrz || !mrz.checksumsOk ? t("verifyNeedMrz") : t("verifyHint"));
      return;
    }
    if (mrz.expired) { setErr(t("verifyExpired")); return; }
    const years = ageYears(mrz.fields?.birthDate || mrz.birthDate);
    if (years == null || years < 18) {
      setErr(t("verifyTooYoung").replace("{age}", years == null ? "—" : String(years)));
      return;
    }
    const face = facePayload(passFace, liveFace, faceMatch);
    if (!face.passportFace) { setErr(t("verifyNoFacePass")); return; }
    if (!face.selfieFace || !face.liveness) { setErr(t("verifyNoBlink")); return; }
    if (!face.matchOk) { setErr(t("verifyFaceMismatch")); return; }
    const btn = $("#idv-go");
    btn.disabled = true;
    btn.textContent = "…";
    const r = await apiJSON("/idv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: u.id,
        name: u.name || displayName(u),
        passport: passJpeg,
        selfie: selfJpeg,
        mrz: { line1: mrz.line1, line2: mrz.line2 },
        confirmMismatch,
        face,
      }),
    });
    if (r?.idv?.status === "verified") {
      saveUser({
        ...loadUser(),
        legalName: r.idv.legalName || "",
        idvStatus: "verified",
        idvSubmitted: r.idv.submitted,
        idvFields: r.idv.fields || null,
        ageYears: r.idv.ageYears,
      });
      showToast(t("verifyOk"));
      if (!isCardOk()) { location.hash = "#/card"; return; }
      const next = consumeAfterIdv();
      if (next) { location.hash = next; return; }
      renderVerify();
      return;
    }
    if (r?.error === "name_mismatch" || r?.idv?.status === "mismatch") {
      $("#idv-confirm-row")?.classList.remove("hidden");
      setErr(t("verifyMismatch").replace("{name}", r?.idv?.legalName || ""));
      btn.disabled = false;
      btn.textContent = t("verifyCta");
      return;
    }
    if (r?.error === "mrz_expired") {
      setErr(t("verifyExpired"));
      btn.disabled = false;
      btn.textContent = t("verifyCta");
      return;
    }
    if (r?.error === "too_young") {
      setErr(t("verifyTooYoung").replace("{age}", r.ageYears == null ? "—" : String(r.ageYears)));
      btn.disabled = false;
      btn.textContent = t("verifyCta");
      return;
    }
    if (r?.error === "face_passport") { setErr(t("verifyNoFacePass")); btn.disabled = false; btn.textContent = t("verifyCta"); return; }
    if (r?.error === "face_selfie" || r?.error === "face_liveness") { setErr(t("verifyNoBlink")); btn.disabled = false; btn.textContent = t("verifyCta"); return; }
    if (r?.error === "face_mismatch") { setErr(t("verifyFaceMismatch")); btn.disabled = false; btn.textContent = t("verifyCta"); return; }
    saveUser({ ...loadUser(), idvStatus: "pending" });
    setErr(r?.error === "mrz_unreadable" ? t("verifyReadFail") : t("verifyPending"));
    btn.disabled = false;
    btn.textContent = t("verifyCta");
  });
}

function partiesBlockHTML(data, { mine } = {}) {
  const past = (data.parties && data.parties.past) || (data.tables || []).filter((p) => p.past);
  const upcoming = (data.parties && data.parties.upcoming) || (data.tables || []).filter((p) => !p.past);
  const pastTitle = mine ? t("pastParties") : t("theirParties");
  return `
    ${upcoming.length ? `<h2 class="detail-panel-title" style="margin-top:28px">${esc(t("upcomingParties"))}</h2>
      <div class="party-card-list">${upcoming.map((p) => partyCardHTML(p, { mine })).join("")}</div>` : ""}
    <h2 class="detail-panel-title" style="margin-top:28px">${esc(pastTitle)}</h2>
    ${past.length
      ? `<div class="party-card-list">${past.map((p) => partyCardHTML(p, { mine })).join("")}</div>`
      : `<p class="price-disclaimer">${esc(t("noParties"))}</p>`}`;
}

async function renderUserProfile(id) {
  const data = await apiJSON(`/users/${encodeURIComponent(id)}`)
    || await apiJSON(`/reviews/${encodeURIComponent(id)}`)
    || { reviews: [], avg: 0, n: 0, idv: "none", parties: { past: [], upcoming: [] } };
  const me = loadUser();
  const u = data.user || {};
  const name = u.name || data.reviews?.[0]?.toName || id;
  const verified = (u.idv || data.idv) === "verified";
  const handle = u.handle ? `@${u.handle}` : "";
  const mine = !!(me && me.id === id);
  const sharedPast = (!mine && me) ? ((data.parties && data.parties.past) || []).filter((p) =>
    (p.mates || []).some((m) => m.id === me.id)
  ) : [];
  const rateParty = sharedPast.find((p) => !(data.reviews || []).some((r) => r.from === me.id && r.tableId === p.id)) || null;
  view().innerHTML = `
  <section class="section profile-page">
    <a class="detail-back" href="${mine ? "#/account" : "#/open"}" data-nav>← ${esc(mine ? t("account") : t("navOpen"))}</a>
    <div class="profile-head">
      <div class="person-avatar lg soc-${esc(u.provider || "none")}" aria-hidden="true">${esc((name || "?").slice(0, 1).toUpperCase())}</div>
      <div>
        <h1>${esc(name)}</h1>
        <p class="person-meta">
          ${u.provider ? `<span class="soc-pill">${esc(u.provider)}</span>` : ""}
          ${handle && u.socialUrl ? `<a class="person-handle" href="${esc(u.socialUrl)}" target="_blank" rel="noopener">${esc(handle)}</a>` : handle ? `<span class="person-handle">${esc(handle)}</span>` : ""}
          ${verified ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span>` : `<span class="idv-badge no">${esc(t("notVerified"))}</span>`}
        </p>
        ${whoIsRealHTML(data.spend || u.spend, u.idv || data.idv)}
        <p>${starRow(data.avg)} ${data.n ? `${esc(t("funScore"))} (${data.n})` : t("noReviews")}</p>
      </div>
    </div>
    ${partiesBlockHTML(data, { mine })}
    <h2 class="detail-panel-title" style="margin-top:28px">${esc(t("funScore"))}</h2>
    ${(data.reviews || []).length ? data.reviews.map((r) => `
      <div class="review-card">
        <div>${starRow(r.rating)} <b>${esc(r.fromName || "")}</b>${r.tableId ? ` · <a href="#/table/${encodeURIComponent(r.tableId)}" data-nav>${esc(t("viewParty"))}</a>` : ""}</div>
        ${r.text ? `<p>${esc(r.text)}</p>` : ""}
      </div>`).join("") : `<p class="price-disclaimer">${esc(t("noReviews"))}</p>`}
    ${me && !mine && rateParty ? `
      <h2 class="detail-panel-title" style="margin-top:28px">${esc(t("rateTogether"))}</h2>
      <p class="stepper-hint">${esc(rateParty.venue)} · ${esc(rateParty.date)} — ${esc(t("rateTogetherHint"))}</p>
      <div class="rate-list">${rateRowHTML({ id, name }, rateParty.id, null)}</div>` : ""}
  </section>`;
  if (me && rateParty) bindRateRows(view(), me, () => renderUserProfile(id));
}

async function renderCard() {
  const u = loadUser();
  if (!u) {
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p><button class="btn btn-gold" id="c-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#c-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
    return;
  }
  await refreshIdv();
  if (!isIdvOk()) {
    rememberAfterIdv("#/card");
    location.hash = "#/verify";
    return;
  }
  const payCfg = await apiJSON("/pay/config");
  setTitle(t("cardTitle"));
  view().innerHTML = `
  <section class="section card-page">
    <a class="detail-back" href="#/account" data-nav>← ${esc(t("account"))}</a>
    <h1>${esc(t("cardTitle"))}</h1>
    <p class="ob-sub" style="margin:0 0 16px;text-align:left">${esc(t("cardSub"))}</p>
    ${isCardOk() ? `<p class="idv-badge ok">💳 ${esc(cardLabel())} · ${esc(t("payingCustomer"))}</p>` : `<p class="idv-badge no">${esc(t("cardNeed"))}</p>`}
    <div class="card-face" aria-hidden="true">
      <span class="card-face-brand" id="card-brand-lab">VELVET</span>
      <div class="card-face-num" id="card-face-num">•••• •••• •••• ••••</div>
      <div class="card-face-row">
        <span id="card-face-name">${esc(displayName(u) || "—")}</span>
        <span id="card-face-exp">${esc(t("cardExpPh"))}</span>
      </div>
    </div>
    <form class="pay-form" id="card-form">
      <label>${esc(t("cardName"))}
        <input type="text" id="card-name" autocomplete="cc-name" maxlength="48" value="${esc(displayName(u))}">
      </label>
      <label>${esc(t("cardNumber"))}
        <input type="text" id="card-num" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="•••• •••• •••• ••••">
      </label>
      <div class="card-row">
        <label>${esc(t("cardExp"))}
          <input type="text" id="card-exp" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="${esc(t("cardExpPh"))}">
        </label>
        <label>${esc(t("cardCvc"))}
          <input type="text" id="card-cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="•••">
        </label>
      </div>
      <div class="field-error hidden" id="card-err" role="alert"></div>
      ${payCfg?.stripe ? `<p class="events-meta">${esc(t("cardStripeHint"))}</p>
      <p><button type="button" class="btn btn-gold" id="card-stripe" style="width:100%">${esc(t("cardStripe"))}</button></p>` : ""}
      <button class="btn btn-gold" type="submit" style="width:100%">${esc(t("cardCta"))}</button>
    </form>
  </section>`;
  const setErr = (msg) => {
    const err = $("#card-err");
    if (!err) return;
    if (!msg) { err.classList.add("hidden"); err.textContent = ""; return; }
    err.textContent = msg;
    err.classList.remove("hidden");
  };
  const digits = (el) => String(el?.value || "").replace(/\D/g, "");
  const paintFace = () => {
    const n = digits($("#card-num"));
    const brand = cardBrandOf(n);
    const pretty = n.replace(/(\d{4})(?=\d)/g, "$1 ").trim() || "•••• •••• •••• ••••";
    const lab = $("#card-brand-lab");
    const num = $("#card-face-num");
    const exp = $("#card-face-exp");
    const nm = $("#card-face-name");
    if (lab) lab.textContent = brand === "card" ? "VELVET" : brand.toUpperCase();
    if (num) num.textContent = pretty;
    if (exp) exp.textContent = ($("#card-exp")?.value || t("cardExpPh"));
    if (nm) nm.textContent = ($("#card-name")?.value || displayName(u) || "—").slice(0, 28);
  };
  $("#card-num")?.addEventListener("input", (e) => {
    const d = digits(e.target).slice(0, 19);
    e.target.value = d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    paintFace();
  });
  $("#card-exp")?.addEventListener("input", (e) => {
    let d = digits(e.target).slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2);
    e.target.value = d;
    paintFace();
  });
  $("#card-cvc")?.addEventListener("input", (e) => { e.target.value = digits(e.target).slice(0, 4); });
  $("#card-name")?.addEventListener("input", paintFace);
  $("#card-stripe")?.addEventListener("click", async () => {
    setErr("");
    const r = await apiJSON("/card/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: u }),
    });
    if (r?.url) { location.href = r.url; return; }
    setErr(r?.error === "no_processor" ? t("payNoProcessor") : t("cardBad"));
  });
  $("#card-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setErr("");
    const num = digits($("#card-num"));
    const exp = digits($("#card-exp"));
    const cvc = digits($("#card-cvc"));
    if (!luhnOk(num)) { setErr(t("cardBad")); return; }
    if (exp.length !== 4) { setErr(t("cardExpired")); return; }
    const expMonth = Number(exp.slice(0, 2));
    const expYear = 2000 + Number(exp.slice(2));
    const now = new Date();
    if (expMonth < 1 || expMonth > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
      setErr(t("cardExpired"));
      return;
    }
    if (cvc.length < 3) { setErr(t("cardBad")); return; }
    const btn = $("#card-form button[type=submit]");
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    const r = await apiJSON("/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: u,
        last4: num.slice(-4),
        brand: cardBrandOf(num),
        expMonth,
        expYear,
      }),
    });
    $("#card-num").value = "";
    $("#card-cvc").value = "";
    if (r?.error === "idv_required") { location.hash = "#/verify"; return; }
    if (r?.error === "no_pan") { setErr(t("cardSub")); if (btn) { btn.disabled = false; btn.textContent = t("cardCta"); } return; }
    if (r?.error || !r?.card) {
      setErr(r?.error === "expired" ? t("cardExpired") : t("cardBad"));
      if (btn) { btn.disabled = false; btn.textContent = t("cardCta"); }
      return;
    }
    saveUser({ ...loadUser(), cardLast4: r.card.last4, cardBrand: r.card.brand });
    showToast(t("payingCustomer"));
    const next = consumeAfterIdv();
    location.hash = next || "#/account";
  });
}

async function renderAccount() {
  const u = loadUser();
  if (u) await refreshIdv();
  const st = idvStatus();
  let mine = { reviews: [], avg: 0, n: 0, parties: { past: [], upcoming: [] }, tables: [] };
  if (u) mine = await apiJSON(`/users/${encodeURIComponent(u.id)}`) || await apiJSON(`/reviews/${encodeURIComponent(u.id)}`) || mine;
  view().innerHTML = `
  <section class="section">
    <div class="section-head"><div><h2>${esc(t("account"))}</h2></div></div>
    ${u ? `
      ${!profileReady(u) ? `
      <form class="connect-form" id="acc-connect" style="margin-bottom:20px">
        <h2 class="detail-panel-title">${esc(t("connectTitle"))}</h2>
        <p class="ob-sub" style="text-align:left;margin:0 0 12px">${esc(t("connectSub").replace("{net}", (SOCIALS.find((s) => s.id === u.provider) || {}).label || u.provider))}</p>
        <label>${esc(t("yourHandle"))}<input type="text" id="acc-handle" value="${esc(u.handle || "")}" autocomplete="username" maxlength="40" required></label>
        <label>${esc(t("yourName"))}<input type="text" id="acc-cname" value="${esc(u.name || "")}" autocomplete="name" maxlength="80" required></label>
        <p class="field-error hidden" id="acc-connect-err"></p>
        <button type="submit" class="btn btn-gold" id="acc-connect-go">${esc(t("connectCta"))}</button>
      </form>` : ""}
      <div class="profile-head" style="margin-bottom:16px">
        ${avatarHTML(u, "lg")}
        <div>
          <p>${esc(t("loggedInAs"))} <b>${esc(displayName(u))}</b></p>
          <p class="person-meta">
            <span class="soc-pill">${esc(u.provider)}</span>
            ${u.handle ? (socialUrl(u.provider, u.handle)
              ? `<a class="person-handle" href="${esc(socialUrl(u.provider, u.handle))}" target="_blank" rel="noopener">@${esc(u.handle)}</a>`
              : `<span class="person-handle">@${esc(u.handle)}</span>`) : ""}
            ${st === "verified" ? `<span class="idv-badge ok">✓ ${esc(t("verifyOk"))}</span>` : `<a class="btn btn-gold btn-sm" href="#/verify" data-nav>${esc(t("verifyTitle"))}</a>`}
          </p>
          <p class="member-access${isPayingMember() ? " on" : ""}">${esc(isPayingMember() ? t("memberAccessOn") : t("memberAccessOff"))}</p>
          <p class="person-meta" style="margin-top:6px">
            ${isCardOk()
              ? `<span class="idv-badge ok">💳 ${esc(cardLabel())}</span>`
              : `<a class="btn btn-ghost btn-sm" href="#/card" data-nav>${esc(t("cardNeed"))}</a>`}
          </p>
          ${whoIsRealHTML(mine.spend, st)}
          <p>${starRow(mine.avg)} ${mine.n ? `${esc(t("funScore"))} (${mine.n})` : t("noReviews")}</p>
          <p style="margin-top:10px"><a class="btn btn-ghost btn-sm" href="#/user/${encodeURIComponent(u.id)}" data-nav>${esc(t("openProfile"))}</a>
            ${isPayingMember() ? `<a class="btn btn-gold btn-sm" href="#/promoters" data-nav>${esc(t("promotersSee"))}</a>` : ""}</p>
        </div>
      </div>
      ${socialVerificationHTML(u)}
      ${partiesBlockHTML(mine, { mine: true })}
      ${(mine.reviews || []).length ? `
        <h2 class="detail-panel-title" style="margin-top:28px">${esc(t("funScore"))}</h2>
        ${mine.reviews.map((r) => `
          <div class="review-card">
            <div>${starRow(r.rating)} <b>${esc(r.fromName || "")}</b>${r.tableId ? ` · <a href="#/table/${encodeURIComponent(r.tableId)}" data-nav>${esc(t("viewParty"))}</a>` : ""}</div>
            ${r.text ? `<p>${esc(r.text)}</p>` : ""}
          </div>`).join("")}` : ""}
      ${isOperatorUser(u) ? `<p style="margin-top:16px"><a class="btn btn-gold btn-sm" href="#/payout" data-nav>${esc(t("paySetup"))}</a></p>` : ""}
      <p style="margin-top:16px"><button class="btn btn-ghost" id="acc-out">${esc(t("logout"))}</button></p>` : `
      <p>${esc(t("loginSub"))}</p>
      <p style="margin-top:16px"><button class="btn btn-gold" id="acc-in">${esc(t("loginTitle"))}</button></p>`}
    <h3 style="margin:28px 0 12px">${esc(t("chooseLang"))}</h3>
    <div class="lang-grid">
      ${LANGS.map((l) => `<button type="button" class="lang-card${currentLang() === l.id ? " on" : ""}" data-lang="${l.id}"><span class="lang-flag">${l.flag}</span><span>${esc(l.label)}</span></button>`).join("")}
    </div>
  </section>`;
  $("#acc-out")?.addEventListener("click", () => { logoutUser(); renderAccount(); });
  $("#acc-in")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
  $("#acc-connect")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const go = $("#acc-connect-go");
    const err = $("#acc-connect-err");
    if (go) go.disabled = true;
    const r = await connectSocialProfile(loadUser()?.provider, $("#acc-handle")?.value, $("#acc-cname")?.value);
    if (r?.user && profileReady(r.user)) { renderAccount(); return; }
    if (err) {
      err.classList.remove("hidden");
      err.textContent = r?.error === "not_found" ? t("connectMissing") : t("connectNeed");
    }
    if (go) go.disabled = false;
  });
  document.querySelectorAll("[data-lang]").forEach((el) => {
    el.addEventListener("click", () => {
      applyLang(el.dataset.lang);
      try { localStorage.setItem("velvet_lang_picked", "1"); } catch {}
      paintNavLang();
      renderAccount();
    });
  });
}

function legalFill(key) {
  const mail = `<a href="mailto:${esc(CONCIERGE_MAIL)}">${esc(CONCIERGE_MAIL)}</a>`;
  return esc(t(key))
    .replace(/\{mail\}/g, mail)
    .replace(/\{openMail\}/g, esc(t("openMail")))
    .replace(/\{geo\}/g, esc(t("geoUse")));
}
function renderLegal(kind) {
  const villkor = kind === "villkor";
  view().innerHTML = `
  <section class="section legal">
    <a class="detail-back" href="#/" data-nav>${esc(t("legalHome"))}</a>
    <h1>${esc(villkor ? t("legalTerms") : t("legalPrivacy"))}</h1>
    ${villkor ? `
      <p>${legalFill("legalTermsLead")}</p>
      <h2>${esc(t("legalOpTitle"))}</h2>
      <p>${legalFill("legalOpBody")}</p>
      <h2>${esc(t("legalWhatTitle"))}</h2>
      <ul>
        <li>${legalFill("legalWhat1")}</li>
        <li>${legalFill("legalWhat2")}</li>
        <li>${legalFill("legalWhat3")}</li>
        <li>${legalFill("legalWhat4")}</li>
      </ul>
      <h2>${esc(t("legalLiabilityTitle"))}</h2>
      <p>${legalFill("legalLiabilityBody")}</p>
    ` : `
      <p>${legalFill("legalPrivacyLead")}</p>
      <h2>${esc(t("legalBasisTitle"))}</h2>
      <p>${legalFill("legalBasisBody")}</p>
      <h2>${esc(t("legalCollectTitle"))}</h2>
      <p>${legalFill("legalCollectBody")}</p>
      <h2>${esc(t("legalStoreTitle"))}</h2>
      <ul>
        <li>${legalFill("legalStore1")}</li>
        <li>${legalFill("legalStore2")}</li>
        <li>${legalFill("legalStore3")}</li>
        <li>${legalFill("legalStore4")}</li>
        <li>${legalFill("legalStore5")}</li>
      </ul>
      <h2>${esc(t("legalRecipientsTitle"))}</h2>
      <ul>
        <li>${legalFill("legalRec1")}</li>
        <li>${legalFill("legalRec2")}</li>
        <li>${legalFill("legalRec3")} (<a href="${esc(HERO_VIDEO.credit)}" target="_blank" rel="noopener">${esc(t("videoPexels"))}</a>)</li>
        <li>${legalFill("legalRec4")}</li>
      </ul>
      <h2>${esc(t("legalRightsTitle"))}</h2>
      <p>${legalFill("legalRightsBody")}</p>
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
      out.push({ kind: t("searchKindDest"), title: d.name, meta: d.country, href: `#/destination/${encodeURIComponent(d.code)}` });
    }
  }
  for (const v of VENUES) {
    if (!venueVisible(v, q)) continue;
    if (fold(`${v.name} ${v.destination} ${v.category}`).includes(s) || !isPublicVenue(v)) {
      out.push({
        kind: isPublicVenue(v) ? t("searchKindVenue") : t("unverified"),
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
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="${esc(t("navSearch"))}" tabindex="-1">
        <div class="search-head">
          <input type="search" id="search-q" placeholder="${esc(t("searchPh"))}" autocomplete="off"
            role="combobox" aria-autocomplete="list" aria-controls="search-hits" aria-expanded="true" aria-activedescendant="" aria-label="${esc(t("navSearch"))}">
          <button type="button" class="search-close" id="search-close" aria-label="${esc(t("close"))}" title="${esc(t("close"))}">✕</button>
        </div>
        <div class="sr-only" id="search-status" role="status" aria-live="polite"></div>
        <div class="search-hits" id="search-hits" role="listbox"></div>
        <div class="search-empty" id="search-empty">${esc(t("searchEmpty"))}</div>
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
      emptyEl.textContent = q ? t("noHits") : t("searchEmpty");
      statusEl.textContent = q ? t("noHits") : "";
    } else {
      emptyEl.hidden = true;
      statusEl.textContent = t("searchHitsN").replace("{n}", String(hits.length));
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
      <h3>${esc(t("pageMissing"))}</h3>
      <p>${(() => { const p = t("pageMissingHint").split("{hash}"); return `${esc(p[0] || "")}<code class="route-code">${esc(hash)}</code>${esc(p[1] || "")}`; })()}</p>
      <p style="margin-top:20px">
        <a class="btn btn-gold" href="#/" data-nav>${esc(t("pageMissingHome"))}</a>
        <a class="btn btn-ghost" href="#/venues" data-nav>${esc(t("explore"))}</a>
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
    view().innerHTML = `<section class="section"><div class="empty-state"><h3>${esc(t("loginTitle"))}</h3><p>${esc(t("verifiedPerkPromoter"))}</p><p style="margin-top:16px"><button class="btn btn-gold" id="ch-login">${esc(t("loginCta"))}</button></p></div></section>`;
    $("#ch-login")?.addEventListener("click", () => openOnboarding({ dismissable: false, phase: "auth" }));
    return;
  }
  await refreshIdv();
  const peek = await apiJSON(`/chats/${encodeURIComponent(venueId)}?userId=${encodeURIComponent(me.id)}`);
  const asPromoter = !!(peek && peek.promoter && !peek.error);
  const young = venueTooYoung(v);
  if (!asPromoter && (young || peek?.error === "too_young")) {
    setTitle(t("promoter") + " · " + v.name);
    view().innerHTML = `
    <section class="section chat-page">
      <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
      <h1>${esc(t("promoter"))} · ${esc(v.name)}</h1>
      <p class="ob-sub" style="text-align:left">${esc(tooYoungText(peek?.error === "too_young" ? peek : young, v))}</p>
    </section>`;
    return;
  }
  if (!asPromoter && (peek?.error === "idv_required" || peek?.error === "card_required" || !isPayingMember())) {
    const needCard = peek?.error === "card_required" || (isIdvOk() && peek?.error !== "idv_required");
    rememberAfterIdv(promoterHref(venueId));
    setTitle(t("promoter") + " · " + v.name);
    view().innerHTML = `
    <section class="section chat-page">
      <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
      <h1>${esc(t("promoter"))} · ${esc(v.name)}</h1>
      ${promoterLockHTML(needCard ? "card" : "idv")}
      ${isOperatorUser(me) ? `<p style="margin-top:14px"><button class="btn btn-ghost btn-sm" id="claim-promo">${esc(t("iAmPromoter"))}</button></p>` : ""}
    </section>`;
    $("#ch-verify")?.addEventListener("click", () => rememberAfterIdv(promoterHref(venueId)));
    $("#ch-card")?.addEventListener("click", () => rememberAfterIdv(promoterHref(venueId)));
    $("#claim-promo")?.addEventListener("click", async () => {
      await apiJSON(`/chats/${encodeURIComponent(venueId)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: me }),
      });
      renderPromoterChat(venueId);
    });
    return;
  }
  setTitle(t("promoter") + " · " + v.name);
  let threadId = me.id;
  let promoter = false;
  let threads = [];
  let wa = venueWaPhone(v) ? { phone: venueWaPhone(v), source: "venue" } : null;
  let guestWa = "";
  const waText = () => t("waPrefill").replace("{venue}", v.name);
  const paintWa = () => {
    const wrap = $("#chat-wa");
    const a = $("#wa-open");
    const src = $("#wa-src");
    const href = wa && wa.phone ? waHref(wa.phone, waText()) : "";
    if (wrap && a) {
      if (href && !promoter) {
        a.href = href;
        wrap.hidden = false;
        if (src) src.textContent = wa.source === "promoter" ? t("waFromPromoter") : t("waFromVenue");
      } else {
        wrap.hidden = true;
      }
    }
    $("#wa-edit")?.classList.toggle("hidden", !promoter);
    $("#guest-wa-box")?.classList.toggle("hidden", !!promoter);
    const inp = $("#wa-in");
    if (promoter && inp && wa && wa.source === "promoter" && !inp.value) inp.value = "+" + wa.phone;
    const reply = $("#wa-reply");
    if (reply) {
      if (promoter && guestWa) {
        reply.href = waHref(guestWa, t("waReplyPrefill").replace("{venue}", v.name));
        reply.hidden = false;
      } else reply.hidden = true;
    }
  };

  const paint = (messages) => {
    const box = document.getElementById("chat-log");
    if (!box) return;
    if (!messages.length) {
      box.innerHTML = `<p class="chat-empty">${esc(t("noMsgs"))}</p>`;
      return;
    }
    box.innerHTML = messages.map((m) => `
      <div class="chat-bubble ${m.role === "promoter" ? "promo" : (m.userId === me.id ? "mine" : "")}${m.kind === "match" || m.kind === "match_done" || m.kind === "bridge" ? " match" : ""}">
        <div class="chat-who">${m.kind === "bridge" ? esc(t("bridgePacket")) : (m.kind === "match" || m.kind === "match_done" ? esc(t("matchKind")) : (m.role === "promoter" ? esc(m.name || t("promoter")) + (m.name ? ` · ${esc(t("promoter"))}` : "") : esc(m.name || "")))}${m.via === "whatsapp" ? ` · WhatsApp` : ""}</div>
        <div class="chat-text">${esc(m.text)}</div>
        ${m.tableId ? `<a class="chat-table-link" href="#/table/${encodeURIComponent(m.tableId)}" data-nav>${esc(t("viewParty"))}</a>` : ""}
      </div>`).join("");
    box.scrollTop = box.scrollHeight;
  };
  const paintInbox = () => {
    const el = document.getElementById("chat-inbox");
    if (!el) return;
    el.innerHTML = threads.map((th) => {
      const href = th.guestWa ? waHref(th.guestWa, t("waReplyPrefill").replace("{venue}", v.name).replace("{name}", th.name || "")) : "";
      return `
      <div class="chat-thread-row">
        <button type="button" class="chat-thread${th.threadId === threadId ? " on" : ""}" data-th="${esc(th.threadId)}">
          <b>${esc(th.name)}</b>
          <span class="paying-meta">${th.spend && th.spend.real ? esc(t("realGuest") + " · " + spendLabel(th.spend)) : (th.paying ? esc(t("payingCustomer") + (th.card ? " · " + cardLabel(th.card) : "")) : esc(t("notReal")))}</span>
          ${th.match ? `<span class="paying-meta">${esc(t("matchKind"))} · ${esc(th.match.date)} · ${num(th.match.seats)}</span>` : ""}
          <span>${esc((th.last || "").slice(0, 60))}</span>
        </button>
        ${href ? `<a class="btn btn-wa btn-sm" href="${esc(href)}" target="_blank" rel="noopener" data-wa-guest>${esc(t("waReply"))}</a>` : ""}
      </div>`;
    }).join("");
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
      if (data.whatsapp && data.whatsapp.phone) wa = data.whatsapp;
      if (Object.prototype.hasOwnProperty.call(data, "guestWa")) guestWa = data.guestWa || "";
      const roster = document.getElementById("chat-promoters");
      if (roster && Array.isArray(data.promoters)) {
        roster.innerHTML = data.promoters.length
          ? data.promoters.map((p) => promoterCardHTML(p, { chatVenue: venueId, compact: true })).join("")
          : "";
      }
      paint(data.messages || []);
      paintWa();
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
    ${isPayingMember() ? `<p class="member-access on">${esc(t("memberAccessOn"))}${cardLabel() ? ` · ${esc(cardLabel())}` : ""}</p>` : ""}
    <div class="person-list" id="chat-promoters" style="margin:12px 0 16px"></div>
    <div class="match-ask" id="match-ask" ${asPromoter ? "hidden" : ""}>
      <h2 class="detail-panel-title">${esc(t("matchAsk"))}</h2>
      <p class="stepper-hint">${esc(t("matchAskSub"))}</p>
      <div class="match-ask-row">
        <label>${esc(t("matchDate"))}
          <input type="date" id="match-date" min="${todayISO()}" value="${todayISO()}">
        </label>
        <label>${esc(t("matchSeats"))}
          <input type="number" id="match-seats" min="1" max="8" value="1" inputmode="numeric">
        </label>
      </div>
      <div class="match-ask-row">
        <label>${esc(t("matchOpenLeave"))}
          <input type="number" id="match-leave" min="0" max="8" value="2" inputmode="numeric">
        </label>
        <label>${esc(t("openForLabel"))}
          ${openForSelectHTML("match-for", "women")}
        </label>
      </div>
      <p class="stepper-hint">${esc(t("openForHint"))}</p>
      <label>${esc(t("matchNote"))}
        <input type="text" id="match-note" maxlength="240" placeholder="${esc(t("matchNotePh"))}" autocomplete="off">
      </label>
      <p class="member-access on hidden" id="match-mine"></p>
      <button type="button" class="btn btn-gold" id="match-send" style="width:100%;margin-top:10px">${esc(t("matchSend"))}</button>
    </div>
    <div class="match-queue hidden" id="match-queue"></div>
    <p class="chat-wa" id="chat-wa" hidden>
      <a class="btn btn-wa" id="wa-open" href="#" target="_blank" rel="noopener">WhatsApp</a>
      <span class="events-meta" id="wa-src"></span>
    </p>
    <p class="chat-wa" id="wa-reply-wrap">
      <a class="btn btn-wa" id="wa-reply" href="#" target="_blank" rel="noopener" hidden>${esc(t("waReply"))}</a>
    </p>
    <div class="chat-wa-edit hidden" id="guest-wa-box">
      <label>${esc(t("waGuestNumber"))}
        <input type="tel" id="guest-wa-in" inputmode="tel" autocomplete="tel" placeholder="+46 70…" maxlength="20">
      </label>
      <button type="button" class="btn btn-ghost btn-sm" id="guest-wa-save">${esc(t("waSave"))}</button>
    </div>
    <div class="chat-wa-edit hidden" id="wa-edit">
      <label>${esc(t("waYourNumber"))}
        <input type="tel" id="wa-in" inputmode="tel" autocomplete="tel" placeholder="+34 6…" maxlength="20">
      </label>
      <button type="button" class="btn btn-ghost btn-sm" id="wa-save">${esc(t("waSave"))}</button>
    </div>
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
    ${isOperatorUser(me) || asPromoter ? `<p style="margin-top:14px"><button class="btn btn-ghost btn-sm" id="claim-promo">${esc(t("iAmPromoter"))}</button></p>` : ""}
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
      body: JSON.stringify({ user: me, text, threadId, asPromoter: promoter, whatsapp: $("#guest-wa-in")?.value || undefined }),
    });
    if (data?.error === "idv_required") {
      rememberAfterIdv(promoterHref(venueId));
      location.hash = "#/verify";
      return;
    }
    if (data?.error === "card_required") {
      rememberAfterIdv(promoterHref(venueId));
      location.hash = "#/card";
      return;
    }
    if (data?.error === "too_young") {
      showToast(tooYoungText(data, v));
      return;
    }
    if (data?.messages) paint(data.messages);
    if (promoter) loadInbox();
  });
  const paintMatchQueue = (list) => {
    const el = $("#match-queue");
    if (!el) return;
    const open = (list || []).filter((m) => m.status === "open");
    if (!promoter) {
      el.classList.add("hidden");
      const mine = open.find((m) => m.userId === me.id);
      const lab = $("#match-mine");
      if (lab) {
        lab.textContent = mine ? `${t("matchMine")} · ${mine.date} · ${mine.seats}` : "";
        lab.classList.toggle("hidden", !mine);
      }
      return;
    }
    $("#match-ask")?.setAttribute("hidden", "");
    el.classList.remove("hidden");
    if (!open.length) {
      el.innerHTML = `<h2 class="detail-panel-title">${esc(t("matchQueue"))}</h2><p class="stepper-hint">${esc(t("matchEmpty"))}</p>`;
      return;
    }
    el.innerHTML = `
      <h2 class="detail-panel-title">${esc(t("matchQueue"))}</h2>
      <p class="stepper-hint">${esc(t("matchNeedTwo"))}</p>
      ${open.map((m) => `
        <label class="match-pick">
          <input type="checkbox" data-mx="${esc(m.id)}" checked>
          <span><b>${esc(m.legalName || m.name)}</b> · ${esc(m.date)} · ${num(m.seats)} pers${m.card ? ` · ${esc(cardLabel(m.card))}` : ""}${m.note ? ` · ${esc(m.note)}` : ""}</span>
        </label>`).join("")}
      <label>${esc(t("matchOpenLeave"))}
        <input type="number" id="match-open" min="0" max="12" value="${num(Math.max(...open.map((m) => Number(m.openSeats) || 0), 2))}" inputmode="numeric">
      </label>
      <label>${esc(t("openForLabel"))}
        ${openForSelectHTML("match-compose-for", open.find((m) => m.openFor && m.openFor !== "anyone")?.openFor || "women")}
      </label>
      <button type="button" class="btn btn-gold" id="match-compose" style="width:100%;margin-top:10px">${esc(t("matchCompose"))}</button>`;
    $("#match-compose")?.addEventListener("click", async () => {
      const matchIds = [...el.querySelectorAll("[data-mx]:checked")].map((x) => x.dataset.mx);
      if (!matchIds.length) { showToast(t("matchNeedTwo")); return; }
      const first = open.find((m) => m.id === matchIds[0]);
      const r = await apiJSON(`/matches/${encodeURIComponent(venueId)}/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: me,
          matchIds,
          date: first?.date,
          venue: v.name,
          destination: v.destination,
          openSeats: Number($("#match-open")?.value || 0),
          openFor: $("#match-compose-for")?.value || "anyone",
        }),
      });
      if (r?.table) {
        showToast(t("matchDone"));
        location.hash = `#/table/${encodeURIComponent(r.table.id)}`;
        return;
      }
      if (r?.error === "not_promoter") showToast(t("iAmPromoter"));
    });
  };
  async function loadMatches() {
    const data = await apiJSON(`/matches/${encodeURIComponent(venueId)}?userId=${encodeURIComponent(me.id)}`);
    if (data?.promoter) promoter = true;
    paintMatchQueue(data?.matches || []);
  }
  $("#match-send")?.addEventListener("click", async () => {
    const date = $("#match-date")?.value;
    const seats = Number($("#match-seats")?.value || 1);
    const note = ($("#match-note")?.value || "").trim();
    const openSeats = Number($("#match-leave")?.value || 0);
    const openFor = $("#match-for")?.value || "anyone";
    const btn = $("#match-send");
    if (btn) btn.disabled = true;
    const r = await apiJSON(`/matches/${encodeURIComponent(venueId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, date, seats, note, openSeats, openFor }),
    });
    if (btn) btn.disabled = false;
    if (r?.error === "idv_required") { rememberAfterIdv(promoterHref(venueId) + "?match=1"); location.hash = "#/verify"; return; }
    if (r?.error === "card_required") { rememberAfterIdv(promoterHref(venueId) + "?match=1"); location.hash = "#/card"; return; }
    if (r?.error === "too_young") { showToast(tooYoungText(r, v)); return; }
    if (r?.error === "date") { showToast(t("matchDate")); return; }
    if (r?.match) {
      showToast(t("matchSent"));
      await loadThread();
      await loadMatches();
    }
  });
  if ((location.hash || "").includes("match=1")) {
    $("#match-ask")?.scrollIntoView({ block: "start" });
  }
  $("#claim-promo")?.addEventListener("click", async () => {
    await apiJSON(`/chats/${encodeURIComponent(venueId)}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, whatsapp: $("#wa-in")?.value || undefined }),
    });
    $("#chat-inbox")?.classList.remove("hidden");
    promoter = true;
    paintWa();
    await loadInbox();
    await loadThread();
    await loadMatches();
  });
  $("#guest-wa-save")?.addEventListener("click", async () => {
    const r = await apiJSON(`/chats/${encodeURIComponent(venueId)}/guest-wa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, whatsapp: $("#guest-wa-in")?.value || "" }),
    });
    if (r?.error === "whatsapp") { showToast(t("waBad")); return; }
    guestWa = r?.guestWa || "";
    showToast(t("waSaved"));
  });
  $("#wa-save")?.addEventListener("click", async () => {
    const r = await apiJSON(`/chats/${encodeURIComponent(venueId)}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, whatsapp: $("#wa-in")?.value || "" }),
    });
    if (r?.error === "whatsapp") {
      showToast(t("waBad"));
      return;
    }
    if (r?.whatsapp) wa = r.whatsapp;
    else if (r && !r.whatsapp) wa = venueWaPhone(v) ? { phone: venueWaPhone(v), source: "venue" } : null;
    paintWa();
    showToast(t("waSaved"));
  });

  paintWa();
  await loadThread();
  await loadMatches();
  if (promoter) {
    $("#chat-inbox")?.classList.remove("hidden");
    await loadInbox();
  }
  stopChatPoll();
  chatPoll = setInterval(() => { loadThread(); if (promoter) loadInbox(); }, 4000);
}

async function renderBookSite(id) {
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
  const b = bookingUrlFor(v) || { url: "", host: "", kind: "site", label: "", social: true };
  const me = loadUser();
  if (me) await refreshIdv();
  const live = me
    ? await apiJSON(`/book/bridge/${encodeURIComponent(v.venue_id)}?userId=${encodeURIComponent(me.id)}`)
    : await apiJSON(`/book/bridge/${encodeURIComponent(v.venue_id)}`);
  const adapter = live?.adapter || {
    officialUrl: b.url, host: b.host, kind: b.kind, label: b.label, engine: "official-site", mode: "handoff",
  };
  const kindLabel = t("bridgeTitle");
  const engineName = adapter.engineLabel || "";
  const enginePhrase = engineName || t("bridgeAnySystem");
  const openHref = adapter.widgetUrl || adapter.officialUrl || b.url;
  const openLabel = engineName ? t("bookOnSiteOpenEngine").replace("{engine}", engineName) : t("bookOnSiteOpen");
  const young = venueTooYoung(v);
  const tooYoung = live?.error === "too_young" || !!young;
  const needVerify = !tooYoung && (!me || live?.error === "idv_required" || live?.error === "card_required" || !isPayingMember());
  setTitle(`${v.name} · ${t("bridgeTitle")}`);
  const mine = live?.bridges || [];
  const nights = (adapter.inventory && Array.isArray(adapter.inventory.nights) ? adapter.inventory.nights : eventsFor(v)).slice(0, 24);
  const q = new URLSearchParams((location.hash.split("?")[1] || ""));
  const pending = loadPendingBridge(v.venue_id);
  const preDate = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || pending?.date || "")
    ? (q.get("date") || pending.date)
    : (nights.find((n) => n.date)?.date || todayISO());
  const preNight = q.get("night") || pending?.note || pending?.eventTitle || "";
  if (q.get("go") === "1" && pending && me && !tooYoung && !isPayingMember()) {
    const p = new URLSearchParams();
    if (preDate) p.set("date", preDate);
    if (preNight) p.set("night", preNight);
    p.set("go", "1");
    rememberAfterIdv(`#/book-site/${encodeURIComponent(v.venue_id)}?${p.toString()}`);
    location.hash = isIdvOk() ? "#/card" : "#/verify";
    return;
  }
  if (apiBase()) {
    apiJSON("/events/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: me, venueId: v.venue_id }),
    }).catch(() => {});
  }
  const host = adapter.host || b.host;
  view().innerHTML = `
  <section class="section book-site">
    <a class="detail-back" href="#/venue/${encodeURIComponent(v.venue_id)}" data-nav>← ${esc(v.name)}</a>
    <div class="book-site-hero">
      ${venueMediaHTML(v, "venue-hero-media", { eager: true, playable: false })}
      <div class="book-site-copy">
        <p class="detail-kicker">${esc(v.destination)} · ${esc(kindLabel)}${engineName ? ` · ${esc(engineName)}` : ""}${host ? ` · ${esc(host)}` : ""}</p>
        <h1>${esc(v.name)}</h1>
        <p class="ob-sub" style="text-align:left;margin:8px 0 0">${esc(t("bridgeSub").replace("{name}", v.name).replace("{engine}", enginePhrase))}</p>
        ${adapter.vipHow ? `<p class="events-meta">${esc(t("bridgeReadLive"))}: ${esc(adapter.vipHow)}</p>` : `<p class="events-meta">${esc(t("bridgeReadLive"))}</p>`}
        <div class="book-desk-card">
        ${tooYoung ? `
          <p class="detail-cta-note">${esc(tooYoungText(live?.error === "too_young" ? live : young, v))}</p>
        ` : `
        ${needVerify ? `<p class="events-meta">${esc(t("bridgeNeed"))}</p>` : ""}
        <div class="bridge-desk" id="bridge-desk">
          <label>${esc(t("bridgeDate"))}
            <input type="date" id="br-date" min="${todayISO()}" value="${esc(preDate)}">
          </label>
          <label>${esc(t("bridgeParty"))}
            <input type="number" id="br-party" min="1" max="20" value="${esc(String(pending?.party || 4))}" inputmode="numeric">
          </label>
          <label>${esc(t("matchNote"))}
            <input type="text" id="br-note" maxlength="240" placeholder="${esc(t("bridgeNotePh"))}" value="${esc(preNight)}" autocomplete="off">
          </label>
          ${(adapter.inventory?.menu?.items || []).length ? `
          <label>${esc(t("menuTitle"))}
            <select id="br-menu">
              <option value="">${esc(t("menuPickNone"))}</option>
              ${adapter.inventory.menu.items.slice(0, 40).map((it) => `<option value="${esc(it.name)}"${pending?.menuItem === it.name ? " selected" : ""}>${esc(it.name)}${it.price ? ` · ${esc(it.price)}` : ""}</option>`).join("")}
            </select>
          </label>` : ""}
          <label>${esc(t("bridgeAmount"))}
            <input type="number" id="br-amount" min="0" step="1" inputmode="decimal" placeholder="EUR" value="${pending?.amount ? esc(String(pending.amount)) : ""}">
          </label>
          <p class="events-meta">${esc(isPayingMember() ? t("guestVerified") : t("bridgeNeed"))}${adapter.clubPay ? ` · ${esc(t("clubHasPay"))}` : ""}</p>
          <button type="button" class="btn btn-gold" id="br-make" style="width:100%">${esc(t("bridgeCta").replace("{name}", v.name))}</button>
        </div>
        <div class="bridge-packet hidden" id="bridge-out"></div>`}
        </div>
        ${nights.length ? `
        <div class="bridge-nights" id="bridge-nights">
          <h2 class="detail-panel-title">${esc(t("bridgeFromSite"))}</h2>
          ${nights.map((n) => `
            <button type="button" class="bridge-night${preNight && n.title === preNight ? " on" : ""}" data-date="${esc(n.date || "")}" data-title="${esc(n.title)}" data-url="${esc(n.url || "")}">
              <span class="event-when">${esc(n.date ? eventWhen(n) : "—")}</span>
              <span>${esc(n.title)}${n.note ? ` · ${esc(n.note)}` : ""}</span>
            </button>`).join("")}
        </div>` : `<p class="events-meta">${esc(t("bridgeNoNights"))}</p>`}
        <div class="book-site-actions">
          ${openHref ? `<a class="btn btn-ghost" id="bs-open" href="${esc(openHref)}" target="_blank" rel="noopener noreferrer">${esc(openLabel)}</a>` : ""}
          <button class="btn btn-ghost" type="button" id="bs-velvet">${esc(t("sendRequest"))}</button>
          ${tooYoung ? "" : `<a class="btn btn-ghost" href="${promoterHref(v.venue_id)}" data-nav>${esc(isPayingMember() ? t("chatPromoter") : t("verifiedPerkPromoter"))}</a>`}
        </div>
        ${adapter.clubEmail ? `<p class="book-site-url">${esc(t("bridgeClubMail"))}: ${esc(adapter.clubEmail)}</p>` : ""}
        <p class="detail-cta-note" style="margin-bottom:0">${esc(t("bridgeHonest"))}</p>
      </div>
    </div>
  </section>`;
  $("#bs-velvet")?.addEventListener("click", () => {
    const desk = $("#bridge-desk");
    if (desk) {
      desk.scrollIntoView({ behavior: "smooth", block: "center" });
      ($("#br-date") || $("#br-make"))?.focus();
      return;
    }
    openBookingModal(v);
  });
  const paintPacket = (bridge) => {
    const el = $("#bridge-out");
    if (!el || !bridge) return;
    el.classList.remove("hidden");
    const mail = adapter.clubEmail
      ? `mailto:${encodeURIComponent(adapter.clubEmail)}?subject=${encodeURIComponent("VELVET " + bridge.id + " · " + v.name)}&body=${encodeURIComponent(bridge.packet || "")}`
      : "";
    el.innerHTML = `
      <h2 class="detail-panel-title">${esc(t("bridgePacket"))} · ${esc(bridge.id)}</h2>
      <p class="idv-badge ok">${esc(t("bridgeStatus"))}</p>
      <pre class="bridge-pre">${esc(bridge.packet || "")}</pre>
      <div class="book-site-actions" style="margin-top:12px">
        ${(bridge.handoffUrl || adapter.widgetUrl || adapter.officialUrl || b.url) ? `<a class="btn btn-gold" id="br-open" href="${esc(bridge.handoffUrl || adapter.widgetUrl || adapter.officialUrl || b.url)}" target="_blank" rel="noopener noreferrer">${esc(t("bridgeOpen"))} ↗</a>` : ""}
        <button type="button" class="btn btn-ghost" id="br-copy">${esc(t("bridgeCopy"))}</button>
        ${mail ? `<a class="btn btn-ghost" href="${esc(mail)}">${esc(t("bridgeClubMail"))}</a>` : ""}
        ${bridge.payUrl || adapter.payUrl ? `<a class="btn btn-ghost" href="${esc(bridge.payUrl || adapter.payUrl)}" target="_blank" rel="noopener">${esc(t("clubHasPay"))} ↗</a>` : ""}
        ${live?.payReady && Number(bridge.payment?.amount || $("#br-amount")?.value || 0) > 0 ? `<button type="button" class="btn btn-gold" id="br-pay">${esc(t("bridgePayCta"))}</button>` : ""}
      </div>`;
    $("#br-copy")?.addEventListener("click", async () => {
      const ok = await copyText(bridge.packet || "");
      showToast(ok ? t("bridgeCopied") : t("bridgeCopy"));
    });
    $("#br-open")?.addEventListener("click", () => { copyText(bridge.packet || ""); });
    $("#br-pay")?.addEventListener("click", async () => {
      const amount = Number(bridge.payment?.amount || $("#br-amount")?.value || 0);
      const pay = await apiJSON("/pay/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: loadUser(),
          venueId: v.venue_id,
          bridgeId: bridge.id,
          amount,
          method: "card",
        }),
      });
      if (pay?.url) { location.href = pay.url; return; }
      if (pay?.error === "no_processor" || pay?.error === "no_account") {
        showToast(t("payNoProcessor"));
        return;
      }
      showToast(pay?.message || t("cardNeed"));
    });
  };
  if (mine[0]) paintPacket(mine[0]);
  let pickedUrl = pending?.eventUrl || "";
  let pickedTitle = pending?.eventTitle || preNight;
  document.querySelectorAll(".bridge-night").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bridge-night").forEach((x) => x.classList.remove("on"));
      btn.classList.add("on");
      if (btn.dataset.date && $("#br-date")) $("#br-date").value = btn.dataset.date;
      if ($("#br-note")) $("#br-note").value = btn.dataset.title || "";
      pickedUrl = btn.dataset.url || "";
      pickedTitle = btn.dataset.title || "";
    });
  });
  if (preNight) {
    const hit = [...document.querySelectorAll(".bridge-night")].find((x) => x.dataset.title === preNight);
    if (hit) { pickedUrl = hit.dataset.url || ""; pickedTitle = hit.dataset.title || ""; }
  }
  const returnHash = () => {
    const date = $("#br-date")?.value || preDate || "";
    const night = pickedTitle || ($("#br-note")?.value || "").trim();
    const p = new URLSearchParams();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) p.set("date", date);
    if (night) p.set("night", night);
    p.set("go", "1");
    return `#/book-site/${encodeURIComponent(v.venue_id)}?${p.toString()}`;
  };
  const stashPending = () => {
    savePendingBridge({
      venueId: v.venue_id,
      date: $("#br-date")?.value || "",
      party: Number($("#br-party")?.value || 4),
      note: ($("#br-note")?.value || "").trim(),
      package: adapter.label || "",
      menuItem: ($("#br-menu")?.value || "").trim(),
      eventTitle: pickedTitle || ($("#br-note")?.value || "").trim(),
      eventUrl: pickedUrl,
      amount: Number($("#br-amount")?.value || 0),
    });
  };
  const gateToMember = () => {
    stashPending();
    rememberAfterIdv(returnHash());
    if (!loadUser()) {
      openOnboarding({ dismissable: true, phase: "auth" });
      return true;
    }
    if (!isIdvOk()) { location.hash = "#/verify"; return true; }
    if (!isCardOk()) { location.hash = "#/card"; return true; }
    return false;
  };
  $("#br-make")?.addEventListener("click", async () => {
    if (tooYoung) { showToast(tooYoungText(live?.error === "too_young" ? live : young, v)); return; }
    if (gateToMember()) return;
    const btn = $("#br-make");
    if (btn) btn.disabled = true;
    const r = await apiJSON("/book/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: loadUser(),
        venueId: v.venue_id,
        date: $("#br-date")?.value,
        party: Number($("#br-party")?.value || 4),
        note: ($("#br-note")?.value || "").trim(),
        package: adapter.label || "",
        menuItem: ($("#br-menu")?.value || "").trim(),
        eventTitle: pickedTitle || ($("#br-note")?.value || "").trim(),
        eventUrl: pickedUrl,
        amount: Number($("#br-amount")?.value || 0),
      }),
    });
    if (btn) btn.disabled = false;
    if (r?.error === "idv_required") { stashPending(); rememberAfterIdv(returnHash()); location.hash = "#/verify"; return; }
    if (r?.error === "card_required") { stashPending(); rememberAfterIdv(returnHash()); location.hash = "#/card"; return; }
    if (r?.error === "too_young") { showToast(tooYoungText(r, v)); return; }
    if (r?.error === "date") { showToast(t("bridgeDate")); return; }
    if (r?.bridge) {
      clearPendingBridge();
      paintPacket(r.bridge);
      const amt = Number($("#br-amount")?.value || r.bridge.payment?.amount || 0);
      if (r.payReady && amt > 0) {
        const pay = await apiJSON("/pay/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: loadUser(),
            venueId: v.venue_id,
            bridgeId: r.bridge.id,
            amount: amt,
            method: "card",
          }),
        });
        if (pay?.url) location.href = pay.url;
      }
    }
  });
  if (pending && isPayingMember() && !tooYoung && q.get("go") === "1") {
    requestAnimationFrame(() => $("#br-make")?.click());
  }
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
  "#/card": () => { renderCard(); },
  "#/account": renderAccount,
  "#/promoters": () => { renderPromoters(); },
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
  document.body.classList.remove("has-dock");
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
  if ((location.hash || "").split("?")[0] !== "#/verify") { stopLiveness(); stopCamera(); }
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
    "#/destinations": t("navDestinations"),
    "#/venues": t("navVenues"),
    "#/map": t("navMap"),
    "#/bookings": t("navBookings"),
    "#/favorites": t("navFav"),
    "#/villkor": t("legalTerms"),
    "#/integritet": t("legalPrivacy"),
  };
  if (Object.prototype.hasOwnProperty.call(titles, h)) setTitle(titles[h]);
  window.scrollTo(0, 0);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === active);
  });
}

function paintNavLang() {
  const cur = currentLang();
  document.querySelectorAll("[data-nav-lang]").forEach((el) => {
    el.setAttribute("aria-pressed", String(el.dataset.navLang === cur));
  });
  updateNavDest();
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle) {
    const open = !!(links && links.classList.contains("open"));
    toggle.setAttribute("aria-label", t(open ? "navMenuClose" : "navMenuOpen"));
  }
}
function initNavLang() {
  document.getElementById("nav-links")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-nav-lang]");
    if (!btn) return;
    applyLang(btn.dataset.navLang);
    try { localStorage.setItem("velvet_lang_picked", "1"); } catch {}
    paintNavLang();
    route();
  });
  paintNavLang();
}

// ---------- Mobil nav (hamburger < 1100px) ----------
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", t(open ? "navMenuClose" : "navMenuOpen"));
  };
  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  // Stäng vid länkklick (även samma route, då hashchange inte triggas)
  links.addEventListener("click", (e) => {
    if (e.target.closest("a") || e.target.closest("[data-nav-lang]")) setOpen(false);
  });
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
    <p class="load-label">${esc(t("loadingApp"))}</p>
  </div>`;
}

function renderLoadError() {
  view().innerHTML = `
  <section class="section">
    <div class="empty-state load-error" role="alert">
      <div class="big">⚠️</div>
      <h3>${esc(t("catalogFail"))}</h3>
      <p>${esc(t("catalogFailHint"))}</p>
      <p style="margin-top:20px"><button class="btn btn-gold" id="retry-btn">${esc(t("geoRetry"))}</button></p>
    </div>
  </section>`;
  $("#retry-btn").addEventListener("click", () => init());
}

async function fetchJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
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
    try {
      const ry = await fetch("data/venue-youtube.json", { cache: "no-store" });
      if (ry.ok) {
        const y = await ry.json();
        VENUE_YOUTUBE = (y && y.venues && typeof y.venues === "object") ? y.venues : {};
      }
    } catch (_) { VENUE_YOUTUBE = {}; }
    try {
      const rm = await fetch("data/venue-menus.json", { cache: "no-store" });
      if (rm.ok) {
        const menus = await rm.json();
        VENUE_MENUS = (menus && menus.venues && typeof menus.venues === "object") ? menus.venues : {};
      }
    } catch (_) { VENUE_MENUS = {}; }
    // Kommande events: statisk JSON som fallback, sedan live API (daglig Firecrawl)
    await loadVenueEvents();
    try {
      const rb = await fetch("data/booking-urls.json", { cache: "no-store" });
      if (rb.ok) BOOKING_URLS = await rb.json() || {};
    } catch (_) { BOOKING_URLS = {}; }
    try {
      const rp = await fetch("data/venue-packages.json", { cache: "no-store" });
      if (rp.ok) VENUE_PACKAGES = await rp.json() || {};
    } catch (_) { VENUE_PACKAGES = {}; }
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
    const rr = await fetch("data/club-rankings.json", { cache: "no-store" });
    if (rr.ok) {
      const ranks = await rr.json();
      if (ranks && typeof ranks === "object") CLUB_RANKINGS = ranks;
    }
  } catch { /* optional */ }
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
  try {
    const rf = await fetch("data/venue-facts.json", { cache: "no-store" });
    if (rf.ok) {
      const facts = await rf.json();
      if (facts && facts.venues) VENUE_FACTS = facts;
    }
  } catch { /* optional */ }
  const liveFacts = await apiJSON("/facts");
  if (liveFacts && liveFacts.venues) VENUE_FACTS = liveFacts;
  const liveMenus = await apiJSON("/menus");
  if (liveMenus && liveMenus.venues) VENUE_MENUS = liveMenus.venues;
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
    initNavLang();
    document.getElementById("nav-user")?.addEventListener("click", () => {
      if (!loadUser()) {
        openOnboarding({ dismissable: true, phase: "auth" });
        return;
      }
      location.hash = "#/account";
    });
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
    openOnboarding({ dismissable: true });
  }
}

// PWA: service worker ger offline-stöd på Android/desktop (network-first skal).
// iPhone/iPad: ingen SW — Apples hem-skärms-PWA uppdaterar inte SW, vilket låste kraschat JS.
function isAppleTouch() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // iOS hem-skärms-PWA har egen SW som inte uppdateras — den är varför appen
  // ofta är trasig när Moses öppnar ikonen. Ingen SW på iPhone/iPad.
  if (isAppleTouch()) {
    navigator.serviceWorker.getRegistrations().then((rs) => {
      rs.forEach((r) => {
        const scope = r.scope || "";
        const src = (r.active && r.active.scriptURL) || (r.waiting && r.waiting.scriptURL) || (r.installing && r.installing.scriptURL) || "";
        if (/\/velvet(\/|$|\?)/i.test(scope) || /\/velvet\/sw\.js/i.test(src)) r.unregister();
      });
    }).catch(() => {});
    if (caches && caches.keys) {
      caches.keys().then((ks) => {
        ks.filter((k) => String(k).indexOf("velvet") === 0).forEach((k) => caches.delete(k));
      }).catch(() => {});
    }
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js?v=82", { updateViaCache: "none" })
      .then((reg) => { try { reg.update(); } catch {} })
      .catch((err) => console.warn("VELVET: service worker kunde inte registreras", err));
  });
}

registerServiceWorker();
init();
