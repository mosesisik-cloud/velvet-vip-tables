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

const RESELLER = /discotech|clubbookers|ticketsibiza|tasteibiza|nocovernightclubs|lasvegasnightclubs|miamiviptables|clubtickets|viator|getyourguide/i;

function engineOf(url) {
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
  };
}

export function venueInventory(venueId) {
  const id = String(venueId || "");
  const eventsFile = readJson("venue-events.json") || {};
  const rec = eventsFile.venues && eventsFile.venues[id] ? eventsFile.venues[id] : {};
  const today = new Date().toISOString().slice(0, 10);
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
  const engine = engineOf(off.url);
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
    writesToClub: false,
    clubEmail: inv.email,
    clubPhone: inv.phone,
    vipHow: inv.vipHow,
    hours: inv.hours,
    dressCode: inv.dressCode,
    ageLimit: inv.ageLimit,
    season: inv.season,
    inventory: inv,
    fields: ["date", "party", "legalName", "nationality", "documentMasked", "cardLast4", "email", "phone", "note"],
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
  const lines = [
    `VELVET-underlag ${bridge.id}`,
    `Klubb: ${bridge.venue || ""}`,
    `Officiell bokning: ${bridge.officialUrl || ""}`,
    `Datum: ${bridge.date || ""}`,
    `Sällskap: ${bridge.party || ""}`,
    bridge.eventTitle ? `Kväll på klubbens sajt: ${bridge.eventTitle}` : "",
    bridge.package ? `Paket: ${bridge.package}` : "",
    g.legalName ? `Namn (pass): ${g.legalName}` : "",
    g.nationality ? `Nationalitet: ${g.nationality}` : "",
    g.documentMasked ? `Pass: ${g.documentMasked}` : "",
    g.ageYears != null ? `Ålder: ${g.ageYears}` : "",
    card ? `Kort: ${card}` : "",
    g.email ? `E-post: ${g.email}` : "",
    g.phone ? `Mobil: ${g.phone}` : "",
    bridge.note ? `Meddelande: ${bridge.note}` : "",
    "",
    "Överlämnad till klubbens sajt — ingen reservation förrän klubben bekräftar.",
    "VELVET skriver inte i klubbens eget system.",
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
  };
}
