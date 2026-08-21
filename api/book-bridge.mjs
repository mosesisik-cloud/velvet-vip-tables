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

export function bookingAdapter(venueId) {
  const off = officialBooking(venueId);
  if (!off) return null;
  const facts = loadFactsFile()?.venues?.[venueId] || {};
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
    clubEmail: String(facts.email || "").trim(),
    clubPhone: String(facts.phone || "").trim(),
    vipHow: String(facts.vipHow || "").slice(0, 240),
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
    status: rec.status || "handed_off",
    created: rec.created,
    clubEmail: rec.clubEmail || "",
    guest: rec.guest || {},
    packet: rec.packet || "",
  };
}
