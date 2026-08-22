/**
 * VELVET booking bridge — middle layer between the app and each club’s
 * official booking page. We do not write into their PMS. The packet is the
 * underlag that follows the guest to their real form.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadFactsFile } from "./venue-facts.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));

function readJson(name) {
  for (const p of [
    path.join(__dir, "public-data", name),
    path.join(__dir, "..", "data", name),
    path.join(__dir, name),
  ]) {
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { /* next */ }
  }
  return null;
}

function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return ""; }
}
function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

const RESELLER = /discotech|clubbookers|ticketsibiza|tasteibiza|nocovernightclubs|lasvegasnightclubs|miamiviptables|clubtickets|viator|getyourguide/i;

export function engineOf(url) {
  const s = String(url || "").toLowerCase();
  if (/sevenrooms/.test(s)) return "sevenrooms";
  if (/covermanager/.test(s)) return "covermanager";
  if (/opentable/.test(s)) return "opentable";
  if (/resy\.com/.test(s)) return "resy";
  if (/exploretock|tock\.com/.test(s)) return "tock";
  if (/designmynight/.test(s)) return "designmynight";
  if (/discotech|clubbookers|ticketsibiza/.test(s)) return "reseller";
  return "official-site";
}

export function officialBooking(venueId) {
  const id = String(venueId || "");
  if (!id) return null;
  const urls = readJson("booking-urls.json") || {};
  const rec = urls[id] && typeof urls[id] === "object" ? urls[id] : null;
  const listed = readJson("venues.json");
  const unlisted = readJson("unlisted-venues.json");
  const venues = [
    ...(Array.isArray(listed) ? listed : []),
    ...(Array.isArray(unlisted) ? unlisted : []),
  ];
  const venue = venues.find((v) => v.venue_id === id);
  const url = String(rec?.url || venue?.website_url || venue?.source_url || "").replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(url)) return null;
  return {
    venueId: id,
    name: String(rec?.name || venue?.name || id),
    destination: String(venue?.destination || ""),
    url,
    kind: String(rec?.kind || "site"),
    label: String(rec?.label || ""),
    host: hostOf(url),
    pay: !!rec?.pay,
    payUrl: /^https:\/\//i.test(rec?.payUrl || "") ? rec.payUrl : "",
    engine: rec?.engine || "",
    email: String(rec?.email || "").trim(),
  };
}

export function venueInventory(venueId) {
  const id = String(venueId || "");
  const eventsFile = readJson("venue-events.json") || {};
  const rec = eventsFile.venues && eventsFile.venues[id] ? eventsFile.venues[id] : {};
  const today = todayLocal();
  const nights = (Array.isArray(rec.events) ? rec.events : [])
    .filter((e) => e && e.title && (!e.date || String(e.date) >= today))
    .slice(0, 40)
    .map((e) => ({
      title: String(e.title).slice(0, 140),
      date: e.date || "",
      note: String(e.note || "").slice(0, 160),
      url: /^https:\/\//i.test(e.url || "") && !RESELLER.test(e.url) ? e.url : "",
    }));
  const facts = loadFactsFile()?.venues?.[id] || {};
  const menus = readJson("venue-menus.json") || {};
  const menu = menus.venues && menus.venues[id] ? menus.venues[id] : null;
  const menuItems = Array.isArray(menu?.items) ? menu.items.slice(0, 40).map((it) => ({
    name: String(it.name || "").slice(0, 80),
    price: String(it.price || "").slice(0, 40),
    amount: Number.isFinite(Number(it.amount)) ? Number(it.amount) : null,
    section: String(it.section || "").slice(0, 40),
  })).filter((it) => it.name) : [];
  return {
    nights,
    source: String(rec.source || ""),
    fetched: String(eventsFile.fetched || rec.fetched || "").slice(0, 10),
    vipHow: String(facts.vipHow || "").slice(0, 280),
    hours: String(facts.hours || "").slice(0, 160),
    dressCode: String(facts.dressCode || "").slice(0, 120),
    ageLimit: String(facts.ageLimit || "").slice(0, 40),
    season: String(facts.season || "").slice(0, 80),
    email: String(facts.email || "").trim(),
    phone: String(facts.phone || "").trim(),
    menu: {
      source: String(menu?.source || ""),
      currency: String(menu?.currency || ""),
      items: menuItems,
    },
  };
}

export function destInventory(code, date) {
  const dests = [...(readJson("destinations.json") || []), ...(readJson("extra-destinations.json") || [])];
  const d = dests.find((x) => String(x.code).toLowerCase() === String(code || "").toLowerCase());
  if (!d) return null;
  const today = todayLocal();
  const want = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : today;
  const venues = (readJson("venues.json") || []).filter((v) => v && v.listed !== false && (v.destination_code === d.code || v.destination === d.name));
  const rows = [];
  let withCal = 0;
  for (const v of venues) {
    const inv = venueInventory(v.venue_id);
    const hasCal = (inv.nights || []).some((n) => n.date);
    if (hasCal) withCal += 1;
    const nights = (inv.nights || []).filter((n) => n.date === want);
    if (!nights.length) continue;
    const off = officialBooking(v.venue_id);
    rows.push({
      venueId: v.venue_id,
      name: v.name,
      category: v.category || "",
      officialUrl: off?.url || "",
      engine: off ? engineOf(off.url) : "official-site",
      nights,
      menuItems: (inv.menu?.items || []).length,
    });
  }
  return {
    dest: d.code,
    name: d.name,
    date: want,
    venues: rows,
    catalog: venues.length,
    withCalendar: withCal,
    fetched: String((readJson("venue-events.json") || {}).fetched || "").slice(0, 10),
  };
}

export function officialEventUrl(officialUrl, eventUrl) {
  const ev = String(eventUrl || "").trim();
  if (!/^https:\/\//i.test(ev) || RESELLER.test(ev)) return "";
  try {
    const a = new URL(officialUrl).hostname.replace(/^www\./i, "").toLowerCase();
    const b = new URL(ev).hostname.replace(/^www\./i, "").toLowerCase();
    if (a === b) return ev;
    const root = (h) => h.split(".").slice(-2).join(".");
    if (root(a) && root(a) === root(b) && root(a).length > 4) return ev;
  } catch { /* ignore */ }
  return "";
}

export function bookingAdapter(venueId) {
  const off = officialBooking(venueId);
  if (!off) return null;
  const inv = venueInventory(venueId);
  const engine = off.engine && off.engine !== "official-site" ? off.engine : engineOf(off.url);
  const nights = inv.nights || [];
  const bookable = engine !== "official-site" || off.kind === "vip" || off.kind === "events" || nights.length > 0 || !!inv.vipHow || !!off.pay;
  const priced = (inv.menu?.items || []).filter((x) => Number(x.amount) > 0);
  return {
    venueId: off.venueId,
    name: off.name,
    destination: off.destination,
    officialUrl: off.url,
    host: off.host,
    kind: off.kind,
    label: off.label,
    engine,
    mode: "handoff",
    overlap: true,
    bookable,
    clubPay: !!(off.pay || off.payUrl),
    payUrl: off.payUrl || "",
    writesToClub: false,
    clubEmail: off.email || inv.email,
    clubPhone: inv.phone,
    vipHow: inv.vipHow,
    hours: inv.hours,
    dressCode: inv.dressCode,
    ageLimit: inv.ageLimit,
    season: inv.season,
    inventory: inv,
    pricedMenu: priced.slice(0, 12),
    fields: ["date", "party", "legalName", "nationality", "documentMasked", "cardLast4", "email", "phone", "note", "amount"],
  };
}

export function handoffUrl(officialUrl, ref) {
  const base = String(officialUrl || "");
  if (!/^https:\/\//i.test(base) || !ref) return base;
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}velvet=${encodeURIComponent(ref)}`;
}

export function packetText(bridge) {
  const g = bridge.guest || {};
  const card = g.card ? `${g.card.brand || "card"} ••${g.card.last4}` : "";
  const pay = bridge.payment;
  const payLine = pay && Number(pay.amount) > 0
    ? `Betalning via VELVET: ${pay.status || "pending"} ${pay.amount} ${pay.currency || "EUR"}${pay.providerId ? " · " + pay.providerId : ""}`
    : (card ? "Kort på fil hos VELVET — klubben ser en verifierad betalande gäst. Debitering när Stripe är kopplat eller på klubbens egen pay-sida." : "");
  const lines = [
    `VELVET-bokning ${bridge.id}`,
    `Klubb: ${bridge.venue || ""}`,
    `Officiell bokning: ${bridge.officialUrl || ""}`,
    `Datum: ${bridge.date || ""}`,
    `Sällskap: ${bridge.party || ""}`,
    bridge.eventTitle ? `Kväll på klubbens sajt: ${bridge.eventTitle}` : "",
    bridge.package ? `Paket: ${bridge.package}` : "",
    "",
    "VERIFIERAD GÄST (pass + live-selfie + kort)",
    g.legalName ? `Namn (pass): ${g.legalName}` : "",
    g.nationality ? `Nationalitet: ${g.nationality}` : "",
    g.documentMasked ? `Pass: ${g.documentMasked}` : "",
    g.ageYears != null ? `Ålder: ${g.ageYears}` : "",
    card ? `Kort: ${card}${g.card?.expMonth ? ` ${String(g.card.expMonth).padStart(2, "0")}/${g.card.expYear}` : ""}` : "",
    g.email ? `E-post: ${g.email}` : "",
    g.phone ? `Mobil: ${g.phone}` : "",
    payLine,
    bridge.note ? `Meddelande: ${bridge.note}` : "",
    "",
    "VELVET är bokningstjänsten. Gästen är ID-kollad (MRZ + blink + ansiktsmatch).",
    "Ingen reservation förrän klubben bekräftar. VELVET skriver inte i deras PMS.",
  ];
  return lines.filter((x) => x !== "").join("\n");
}

export function publicBridge(rec) {
  if (!rec) return null;
  return {
    id: rec.id,
    venueId: rec.venueId,
    venue: rec.venue,
    destination: rec.destination || "",
    officialUrl: rec.officialUrl,
    handoffUrl: rec.handoffUrl || rec.officialUrl,
    host: rec.host || "",
    kind: rec.kind || "site",
    engine: rec.engine || "official-site",
    mode: "handoff",
    overlap: true,
    date: rec.date,
    party: rec.party,
    package: rec.package || "",
    note: rec.note || "",
    eventTitle: rec.eventTitle || "",
    eventUrl: rec.eventUrl || "",
    status: rec.status || "handed_off",
    created: rec.created,
    clubEmail: rec.clubEmail || "",
    guest: rec.guest || {},
    packet: rec.packet || "",
    clubPay: !!rec.clubPay,
    payUrl: rec.payUrl || "",
    payment: rec.payment || null,
  };
}
