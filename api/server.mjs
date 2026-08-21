import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEventsFile, loadCrawlStatus, runCrawl, getCrawlState, scheduleDailyCrawl } from "./crawl-events.mjs";
import { loadPlacesFile, runPlacesLookup } from "./google-places.mjs";
import { loadFactsFile, runFactsCrawl } from "./venue-facts.mjs";
import { parseTd3, extractMrzFromText, nameMatch, publicFields, legalName } from "./mrz.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.VELVET_DATA || path.join(__dir, "store.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const IDV_DIR = process.env.VELVET_IDV || path.join(__dir, "idv");
const PORT = Number(process.env.PORT || 8787);
const PUBLIC_APP = process.env.PUBLIC_URL || "https://b2b.bakemyday.se/velvet";

fs.mkdirSync(IDV_DIR, { recursive: true });

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA, "utf8"));
    return {
      tables: Array.isArray(raw.tables) ? raw.tables : [],
      idv: raw.idv && typeof raw.idv === "object" ? raw.idv : {},
      reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
      chats: raw.chats && typeof raw.chats === "object" ? raw.chats : {},
      promoters: raw.promoters && typeof raw.promoters === "object" ? raw.promoters : {},
      promoterContact: raw.promoterContact && typeof raw.promoterContact === "object" ? raw.promoterContact : {},
      chatsMeta: raw.chatsMeta && typeof raw.chatsMeta === "object" ? raw.chatsMeta : {},
      waSeen: raw.waSeen && typeof raw.waSeen === "object" ? raw.waSeen : {},
      users: raw.users && typeof raw.users === "object" ? raw.users : {},
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      auth: raw.auth && typeof raw.auth === "object" ? raw.auth : {},
    };
  } catch {}
  return { tables: [], idv: {}, reviews: [], chats: {}, promoters: {}, promoterContact: {}, chatsMeta: {}, waSeen: {}, users: {}, payments: [], auth: {} };
}
function waDigits(raw) {
  let s = String(raw || "").trim();
  if (s.startsWith("00")) s = s.slice(2);
  const d = s.replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return "";
  return d;
}
function extractWa(str) {
  const s = String(str || "");
  const m = s.match(/wa\.me\/(\+?\d{8,15})/i)
    || s.match(/whatsapp\.com\/send\?[^"'<\s]*phone=(\+?\d{8,15})/i);
  return m ? waDigits(m[1]) : "";
}
function venueWaFromFacts(venueId) {
  const f = loadFactsFile().venues[venueId];
  if (!f) return "";
  if (extractWa(f.vipHow)) return extractWa(f.vipHow);
  if (/whatsapp|wa\.me/i.test(String(f.vipHow || "")) && f.phone) return waDigits(f.phone);
  return extractWa(JSON.stringify(f));
}
function whatsappForVenue(venueId, db) {
  const saved = db.promoterContact && db.promoterContact[venueId];
  const promo = saved ? waDigits(saved.whatsapp) : "";
  if (promo) return { phone: promo, source: "promoter" };
  const venue = venueWaFromFacts(venueId);
  if (venue) return { phone: venue, source: "venue" };
  return null;
}
function waCloud() {
  const p = loadPay();
  return {
    token: String(process.env.WHATSAPP_TOKEN || p.whatsapp?.token || "").trim(),
    phoneId: String(process.env.WHATSAPP_PHONE_ID || p.whatsapp?.phoneId || "").trim(),
    verify: String(process.env.WHATSAPP_VERIFY || p.whatsapp?.verify || "").trim(),
  };
}
function guestWaForThread(db, venueId, threadId) {
  const u = db.users[threadId];
  const meta = db.chatsMeta?.[venueId]?.[threadId];
  return waDigits((u && u.whatsapp) || (meta && meta.guestWa) || "");
}
function setGuestWa(db, venueId, threadId, phone, name) {
  const d = waDigits(phone);
  if (!d) return "";
  if (db.users[threadId]) db.users[threadId].whatsapp = d;
  if (!db.chatsMeta) db.chatsMeta = {};
  if (!db.chatsMeta[venueId]) db.chatsMeta[venueId] = {};
  db.chatsMeta[venueId][threadId] = {
    ...(db.chatsMeta[venueId][threadId] || {}),
    guestWa: d,
    guestName: name || db.chatsMeta[venueId][threadId]?.guestName || "",
  };
  return d;
}
function appendChat(db, venueId, threadId, msg) {
  if (!db.chats[venueId]) db.chats[venueId] = {};
  if (!db.chats[venueId][threadId]) db.chats[venueId][threadId] = [];
  db.chats[venueId][threadId].push(msg);
  db.chats[venueId][threadId] = db.chats[venueId][threadId].slice(-200);
  return db.chats[venueId][threadId];
}
function markWaSeen(db, id) {
  if (!id) return false;
  if (!db.waSeen) db.waSeen = {};
  if (db.waSeen[id]) return true;
  db.waSeen[id] = Date.now();
  const keys = Object.keys(db.waSeen);
  if (keys.length > 400) {
    for (const k of keys.slice(0, keys.length - 300)) delete db.waSeen[k];
  }
  return false;
}
async function cloudSendWa(to, text) {
  const c = waCloud();
  if (!c.token || !c.phoneId || !to) return false;
  try {
    const r = await fetch("https://graph.facebook.com/v21.0/" + encodeURIComponent(c.phoneId) + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: String(text || "").slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(12000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
function isIdvVerified(uid, db) {
  return !!(uid && db.idv[uid] && db.idv[uid].status === "verified");
}
function hasCardOnFile(uid, db) {
  return !!publicCard(db.users[uid]?.card);
}
function isVerifiedMember(uid, db) {
  return isIdvVerified(uid, db) && hasCardOnFile(uid, db);
}
function memberGate(uid, db) {
  if (!isIdvVerified(uid, db)) return "idv_required";
  if (!hasCardOnFile(uid, db)) return "card_required";
  return "";
}
function isPromoter(user, venueId, db) {
  const uid = user?.id || "";
  const email = String(user?.email || "").toLowerCase();
  const handle = String(user?.handle || "").toLowerCase();
  if (email === "gabrielhadodo@gmail.com" || email === "moses.isik@bakemyday.se") return true;
  if (handle === "velvet" || user?.role === "promoter") return true;
  const list = db.promoters[venueId] || [];
  return list.includes(uid);
}
function save(db) {
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
}
function safeId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "unknown";
}
function send(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  });
  res.end(body);
}
function readRaw(req, max = 1e6) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > max) { req.destroy(); reject(new Error("too large")); }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function readBody(req, max = 12e6) {
  return new Promise((resolve, reject) => {
    let s = "";
    req.on("data", (c) => {
      s += c;
      if (s.length > max) { req.destroy(); reject(new Error("too large")); }
    });
    req.on("end", () => {
      try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); }
    });
  });
}
function decodeDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/(jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!m) return null;
  const buf = Buffer.from(m[3].replace(/\s/g, ""), "base64");
  if (buf.length < 8000 || buf.length > 5e6) return null;
  return { ext: m[2].toLowerCase() === "png" ? "png" : "jpg", buf };
}
function publicIdv(rec) {
  if (!rec) return { status: "none" };
  return {
    status: rec.status || "none",
    submitted: rec.submitted || null,
    reasons: rec.reasons || [],
    fields: rec.fieldsPublic || null,
    legalName: rec.legalName || "",
    nameMatch: rec.nameMatch || null,
    face: rec.facePublic || null,
  };
}
function readFace(b) {
  const f = b && b.face && typeof b.face === "object" ? b.face : {};
  const dist = Number(f.matchDistance);
  const distOk = Number.isFinite(dist) && dist >= 0 && dist <= 0.58;
  const passportFace = f.passportFace === true;
  const selfieFace = f.selfieFace === true;
  const liveness = f.liveness === true;
  const matchOk = f.matchOk === true && distOk;
  let error = "";
  if (!passportFace) error = "face_passport";
  else if (!selfieFace) error = "face_selfie";
  else if (!liveness) error = "face_liveness";
  else if (!matchOk) error = "face_mismatch";
  return {
    passportFace,
    selfieFace,
    liveness,
    matchOk,
    matchDistance: distOk ? Math.round(dist * 1000) / 1000 : null,
    ok: passportFace && selfieFace && liveness && matchOk,
    error,
  };
}
function readMrzBody(b) {
  const line1 = b?.mrz?.line1 || b?.line1 || "";
  const line2 = b?.mrz?.line2 || b?.line2 || "";
  if (line1 && line2) return parseTd3(line1, line2);
  if (b?.mrz?.text) return extractMrzFromText(b.mrz.text);
  return null;
}
function avgRating(reviews) {
  if (!reviews.length) return { avg: 0, n: 0 };
  const n = reviews.length;
  const avg = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / n;
  return { avg: Math.round(avg * 10) / 10, n };
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
function upsertUser(db, u) {
  if (!u || !u.id) return;
  const provider = String(u.provider || "");
  const handle = String(u.handle || "").replace(/^@/, "").slice(0, 40);
  const prev = db.users[u.id] || {};
  db.users[u.id] = {
    id: String(u.id).slice(0, 80),
    name: String(u.name || prev.name || "").slice(0, 80),
    handle: handle || prev.handle || "",
    provider: provider || prev.provider || "",
    updated: new Date().toISOString(),
    created: prev.created || new Date().toISOString(),
    whatsapp: prev.whatsapp || "",
    card: prev.card || null,
  };
}
function publicCard(c) {
  if (!c || !c.last4) return null;
  const last4 = String(c.last4).replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) return null;
  return {
    last4,
    brand: String(c.brand || "card").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16) || "card",
    expMonth: Number(c.expMonth) || 0,
    expYear: Number(c.expYear) || 0,
  };
}
function parseCardBody(b) {
  if (b.number || b.pan || b.cardNumber || b.cvc || b.cvv || b.securityCode) {
    return { error: "no_pan" };
  }
  const last4 = String(b.last4 || "").replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) return { error: "last4" };
  const brandRaw = String(b.brand || "card").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16);
  const brand = ["visa", "mastercard", "amex", "maestro", "card"].includes(brandRaw) ? brandRaw : "card";
  const expMonth = Number(b.expMonth);
  let expYear = Number(b.expYear);
  if (expMonth < 1 || expMonth > 12 || !expYear) return { error: "exp" };
  if (expYear < 100) expYear += 2000;
  const now = new Date();
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    return { error: "expired" };
  }
  return { card: { last4, brand, expMonth, expYear, added: new Date().toISOString() } };
}
function publicPerson(p, db, role) {
  if (!p) return null;
  const id = String(p.id || "");
  const stored = id && db.users[id] ? db.users[id] : {};
  const provider = String(p.provider || stored.provider || "");
  const handle = String(p.handle || stored.handle || "").replace(/^@/, "");
  const name = String(p.name || stored.name || "Gäst").slice(0, 80);
  const idv = id && db.idv[id]?.status === "verified" ? "verified" : "none";
  const card = publicCard(db.users[id]?.card);
  return {
    id,
    name,
    handle,
    provider,
    socialUrl: socialUrl(provider, handle),
    role: role || p.role || "guest",
    paid: !!p.paid,
    paidAt: p.paidAt || null,
    paidVia: p.paidVia || "",
    idv,
    paying: !!card,
    card,
    joined: p.joined || p.created || null,
  };
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function tableMemberIds(t) {
  return [t.host?.id, ...((t.joiners || []).map((j) => j.id))].filter(Boolean);
}
function isPartyOver(t) {
  const d = String(t.date || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayISO();
}
function partySummary(t, uid, db) {
  const mates = tableMemberIds(t)
    .filter((id) => id !== uid)
    .map((id) => {
      const p = t.host?.id === id ? t.host : (t.joiners || []).find((j) => j.id === id);
      return {
        id,
        name: String(p?.name || "").slice(0, 80),
        provider: String(p?.provider || ""),
        handle: String(p?.handle || "").replace(/^@/, ""),
      };
    });
  const given = (db.reviews || []).filter((r) => r.tableId === t.id && r.from === uid);
  return {
    id: t.id,
    venue_id: t.venue_id || "",
    venue: t.venue,
    destination: t.destination || "",
    date: t.date || "",
    package: t.package || "",
    role: t.host?.id === uid ? "host" : "guest",
    past: isPartyOver(t),
    mates,
    ratedIds: given.map((r) => r.to),
  };
}
function tableReviews(t, db) {
  return (db.reviews || [])
    .filter((r) => r.tableId === t.id)
    .map((r) => ({
      id: r.id,
      from: r.from,
      fromName: r.fromName,
      to: r.to,
      toName: r.toName,
      rating: r.rating,
      text: r.text,
      created: r.created,
    }));
}
function publicTable(t, db) {
  const host = publicPerson(t.host, db, "host");
  const joiners = (t.joiners || []).map((j) => publicPerson(j, db, "guest")).filter(Boolean);
  const invites = (t.guests || []).map((g) => ({
    id: "",
    name: String(g.name || "Gäst").slice(0, 80),
    handle: "",
    provider: "",
    socialUrl: "",
    role: "invite",
    paid: !!g.paid,
    paidAt: g.paidAt || null,
    idv: "none",
    joined: null,
  }));
  const members = [host, ...joiners, ...invites].filter(Boolean);
  const paidN = members.filter((m) => m.paid).length;
  const party = Number(t.party) || Math.max(members.length, 1);
  return {
    id: t.id,
    venue_id: t.venue_id,
    venue: t.venue,
    destination: t.destination,
    date: t.date,
    package: t.package,
    total: Number(t.total) || 0,
    party,
    openSeats: Number(t.openSeats) || 0,
    openLeft: Number(t.openLeft) || 0,
    status: t.status,
    sharp: !!t.sharp,
    created: t.created,
    host,
    joiners,
    guests: invites,
    members,
    paidN,
    dueN: members.length,
    per_person: Math.ceil((Number(t.total) || 0) / Math.max(1, party)),
    past: isPartyOver(t),
    reviews: tableReviews(t, db),
  };
}
function findUser(db, id) {
  if (db.users[id]) return db.users[id];
  for (const t of db.tables) {
    if (t.host?.id === id) return t.host;
    const j = (t.joiners || []).find((x) => x.id === id);
    if (j) return j;
  }
  return null;
}
function setPaidFlag(obj, paid, actorId, via) {
  obj.paid = !!paid;
  obj.paidAt = paid ? new Date().toISOString() : null;
  obj.paidBy = actorId || "";
  obj.paidVia = paid ? (via || obj.paidVia || "manual") : "";
}

function isOperator(user) {
  const email = String(user?.email || "").toLowerCase();
  const handle = String(user?.handle || "").toLowerCase();
  return email === "gabrielhadodo@gmail.com" || email === "moses.isik@bakemyday.se" || handle === "velvet" || user?.role === "operator";
}

function emptyPay() {
  return {
    currency: "EUR",
    firecrawlKey: "",
    googlePlacesKey: "",
    revolut: { iban: "", bic: "", name: "", me: "", merchantSecret: "", sandbox: false },
    stripe: { secret: "", pub: "", webhook: "" },
    paypal: { client: "", secret: "", sandbox: false },
    whatsapp: { token: "", phoneId: "", verify: "" },
    oauth: {
      facebook: { id: "", secret: "" },
      instagram: { id: "", secret: "" },
      tiktok: { key: "", secret: "" },
      snapchat: { id: "", secret: "" },
    },
  };
}
function loadPay() {
  try {
    const raw = JSON.parse(fs.readFileSync(PAY_FILE, "utf8"));
    const base = emptyPay();
    return {
      currency: String(raw.currency || "EUR").toUpperCase().slice(0, 3),
      firecrawlKey: String(raw.firecrawlKey || ""),
      googlePlacesKey: String(raw.googlePlacesKey || ""),
      revolut: { ...base.revolut, ...(raw.revolut || {}) },
      stripe: { ...base.stripe, ...(raw.stripe || {}) },
      paypal: { ...base.paypal, ...(raw.paypal || {}) },
      whatsapp: { ...base.whatsapp, ...(raw.whatsapp || {}) },
      oauth: {
        facebook: { ...base.oauth.facebook, ...(raw.oauth?.facebook || {}) },
        instagram: { ...base.oauth.instagram, ...(raw.oauth?.instagram || {}) },
        tiktok: { ...base.oauth.tiktok, ...(raw.oauth?.tiktok || {}) },
        snapchat: { ...base.oauth.snapchat, ...(raw.oauth?.snapchat || {}) },
      },
    };
  } catch {
    return emptyPay();
  }
}
function savePay(p) {
  fs.writeFileSync(PAY_FILE, JSON.stringify(p, null, 2));
}
function ibanOk(s) {
  const v = String(s || "").replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v) ? v : "";
}
function payRef(tableId, userId) {
  const t = String(tableId || "").replace(/[^A-Z0-9]/gi, "").slice(-8).toUpperCase();
  const u = String(userId || "").replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
  return `VEL-${t}-${u}`.slice(0, 22);
}
function publicPayConfig() {
  const p = loadPay();
  const iban = ibanOk(p.revolut.iban);
  const stripeOn = !!(p.stripe.secret && p.stripe.secret.startsWith("sk_"));
  const revolutOn = !!(p.revolut.merchantSecret);
  const paypalOn = !!(p.paypal.client && p.paypal.secret);
  const bankOn = !!iban;
  const cardOn = stripeOn || revolutOn;
  return {
    currency: p.currency || "EUR",
    destination: "Revolut",
    holder: p.revolut.name || "",
    ready: cardOn || bankOn || paypalOn,
    stripe: stripeOn,
    revolutMerchant: revolutOn,
    paypal: paypalOn,
    bank: bankOn,
    methods: [
      { id: "card", group: "card", enabled: cardOn },
      { id: "applepay", group: "wallet", enabled: cardOn },
      { id: "googlepay", group: "wallet", enabled: cardOn },
      { id: "revolut", group: "wallet", enabled: revolutOn || bankOn },
      { id: "paypal", group: "wallet", enabled: paypalOn },
      { id: "klarna", group: "bnpl", enabled: stripeOn },
      { id: "sepa", group: "bank", enabled: bankOn },
      { id: "swift", group: "bank", enabled: bankOn },
    ],
    account: bankOn ? {
      iban,
      bic: String(p.revolut.bic || "").replace(/\s+/g, "").toUpperCase(),
      name: p.revolut.name || "",
      bank: "Revolut",
      me: p.revolut.me || "",
    } : null,
    keys: {
      stripe: stripeOn,
      revolut: revolutOn,
      paypal: paypalOn,
      iban: bankOn,
      firecrawl: !!p.firecrawlKey,
      googlePlaces: !!p.googlePlacesKey,
      whatsapp: !!(p.whatsapp?.token && p.whatsapp?.phoneId),
    },
    oauth: oauthFlags(p),
  };
}
function oauthFlags(p) {
  const o = p.oauth || emptyPay().oauth;
  const fb = !!(o.facebook?.id && o.facebook?.secret);
  const ig = !!(o.instagram?.id && o.instagram?.secret) || fb;
  return {
    facebook: fb,
    instagram: ig,
    tiktok: !!(o.tiktok?.key && o.tiktok?.secret),
    snapchat: !!(o.snapchat?.id && o.snapchat?.secret),
  };
}
function oauthRedirect(provider) {
  return `${process.env.PUBLIC_URL ? process.env.PUBLIC_URL.replace(/\/velvet\/?$/, "") : "https://b2b.bakemyday.se"}/velvet-api/auth/callback/${provider}`;
}
function oauthAuthorizeUrl(provider, state) {
  const p = loadPay();
  const flags = oauthFlags(p);
  if (!flags[provider]) return null;
  const redir = oauthRedirect(provider);
  if (provider === "facebook" || (provider === "instagram" && p.oauth.facebook?.id && !p.oauth.instagram?.id)) {
    const id = p.oauth.facebook.id;
    const scope = provider === "instagram" ? "public_profile,email,instagram_basic" : "public_profile,email";
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redir)}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }
  if (provider === "instagram") {
    const id = p.oauth.instagram.id;
    return `https://api.instagram.com/oauth/authorize?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redir)}&scope=user_profile,user_media&response_type=code&state=${encodeURIComponent(state)}`;
  }
  if (provider === "tiktok") {
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(p.oauth.tiktok.key)}&redirect_uri=${encodeURIComponent(redir)}&response_type=code&scope=user.info.basic&state=${encodeURIComponent(state)}`;
  }
  if (provider === "snapchat") {
    return `https://accounts.snapchat.com/login/oauth2/authorize?client_id=${encodeURIComponent(p.oauth.snapchat.id)}&redirect_uri=${encodeURIComponent(redir)}&response_type=code&scope=https://auth.snapchat.com/oauth2/api/user.display_name&state=${encodeURIComponent(state)}`;
  }
  return null;
}
async function oauthProfile(provider, code) {
  const p = loadPay();
  const redir = oauthRedirect(provider);
  if (provider === "facebook" || (provider === "instagram" && p.oauth.facebook?.id && !p.oauth.instagram?.id)) {
    const tok = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(p.oauth.facebook.id)}&redirect_uri=${encodeURIComponent(redir)}&client_secret=${encodeURIComponent(p.oauth.facebook.secret)}&code=${encodeURIComponent(code)}`);
    const tj = await tok.json();
    if (!tj.access_token) throw new Error(tj.error?.message || "fb_token");
    const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tj.access_token)}`);
    const u = await me.json();
    return {
      id: `U-${provider}-${u.id}`,
      name: String(u.name || ""),
      handle: String(u.id || ""),
      email: String(u.email || ""),
      provider,
      oauth: true,
    };
  }
  if (provider === "instagram") {
    const body = new URLSearchParams({
      client_id: p.oauth.instagram.id,
      client_secret: p.oauth.instagram.secret,
      grant_type: "authorization_code",
      redirect_uri: redir,
      code,
    });
    const tok = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body });
    const tj = await tok.json();
    const token = tj.access_token || tj.data?.[0]?.access_token;
    const iid = tj.user_id || tj.data?.[0]?.user_id;
    if (!token) throw new Error("ig_token");
    const me = await fetch(`https://graph.instagram.com/me?fields=id,username,name&access_token=${encodeURIComponent(token)}`);
    const u = await me.json();
    return {
      id: `U-instagram-${u.id || iid}`,
      name: String(u.name || u.username || ""),
      handle: String(u.username || u.id || ""),
      provider: "instagram",
      oauth: true,
    };
  }
  if (provider === "tiktok") {
    const tok = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: p.oauth.tiktok.key,
        client_secret: p.oauth.tiktok.secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redir,
      }),
    });
    const tj = await tok.json();
    const access = tj.access_token || tj.data?.access_token;
    if (!access) throw new Error("tt_token");
    const me = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url", {
      headers: { Authorization: "Bearer " + access },
    });
    const u = (await me.json()).data?.user || {};
    return {
      id: `U-tiktok-${u.open_id || crypto.randomBytes(6).toString("hex")}`,
      name: String(u.display_name || ""),
      handle: String(u.username || ""),
      provider: "tiktok",
      oauth: true,
    };
  }
  if (provider === "snapchat") {
    const tok = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: p.oauth.snapchat.id,
        client_secret: p.oauth.snapchat.secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redir,
      }),
    });
    const tj = await tok.json();
    if (!tj.access_token) throw new Error("snap_token");
    const me = await fetch("https://kit.snapchat.com/v1/me", {
      method: "POST",
      headers: { Authorization: "Bearer " + tj.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ me { displayName bitmoji { avatar } externalId } }" }),
    });
    const u = (await me.json()).data?.me || {};
    return {
      id: `U-snapchat-${u.externalId || crypto.randomBytes(6).toString("hex")}`,
      name: String(u.displayName || ""),
      handle: String(u.externalId || ""),
      provider: "snapchat",
      oauth: true,
    };
  }
  throw new Error("provider");
}
function mintAuthToken(user) {
  const db = load();
  if (!db.auth) db.auth = {};
  const token = crypto.randomBytes(24).toString("hex");
  db.auth[token] = { user, exp: Date.now() + 15 * 60 * 1000 };
  const keys = Object.keys(db.auth);
  if (keys.length > 80) {
    for (const k of keys) if (db.auth[k].exp < Date.now()) delete db.auth[k];
  }
  save(db);
  return token;
}
function applyIncomingPayment(db, { tableId, userId, amount, currency, method, provider, providerId }) {
  const t = db.tables.find((x) => x.id === tableId);
  if (!t || !userId) return null;
  let target = t.host?.id === userId ? t.host : (t.joiners || []).find((j) => j.id === userId);
  if (!target) return null;
  setPaidFlag(target, true, userId, provider || method);
  const rec = {
    id: `PY-${Date.now().toString(36)}`,
    tableId,
    userId,
    amount: Number(amount) || 0,
    currency: currency || "EUR",
    method: method || provider || "",
    provider: provider || "",
    providerId: providerId || "",
    status: "paid",
    created: new Date().toISOString(),
  };
  db.payments = [rec, ...(db.payments || [])].slice(0, 500);
  return rec;
}
async function stripeCheckout({ table, user, cents, currency, method }) {
  const p = loadPay();
  if (!p.stripe.secret) return null;
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${PUBLIC_APP}/?session_id={CHECKOUT_SESSION_ID}#/pay-return`);
  params.set("cancel_url", `${PUBLIC_APP}/#/pay/${encodeURIComponent(table.id)}`);
  params.set("client_reference_id", `${table.id}:${user.id}`);
  params.set("metadata[tableId]", table.id);
  params.set("metadata[userId]", user.id);
  params.set("metadata[method]", method);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", currency.toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(cents));
  params.set("line_items[0][price_data][product_data][name]", `VELVET · ${table.venue} · ${table.date || ""}`.slice(0, 120));
  params.set("automatic_payment_methods[enabled]", "true");
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.stripe.secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const j = await r.json();
  if (!j.url) throw new Error(j.error?.message || "stripe");
  return { url: j.url, id: j.id };
}
async function revolutOrder({ table, user, cents, currency }) {
  const p = loadPay();
  if (!p.revolut.merchantSecret) return null;
  const host = p.revolut.sandbox ? "https://sandbox-merchant.revolut.com" : "https://merchant.revolut.com";
  const r = await fetch(host + "/api/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.revolut.merchantSecret}`,
      "Revolut-Api-Version": "2024-09-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: cents,
      currency,
      redirect_url: `${PUBLIC_APP}/#/pay-return`,
      merchant_order_data: { reference: `${table.id}:${user.id}` },
      description: `VELVET ${table.venue} ${table.date || ""}`.slice(0, 250),
    }),
  });
  const j = await r.json();
  const url = j.checkout_url || j.token && `${host.replace("merchant.revolut.com", "checkout.revolut.com")}/pay/${j.token}`;
  if (!j.id) throw new Error(j.message || "revolut");
  return { url: url || j.checkout_url, id: j.id };
}
async function paypalOrder({ table, user, amount, currency }) {
  const p = loadPay();
  if (!p.paypal.client || !p.paypal.secret) return null;
  const api = p.paypal.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const tok = await fetch(api + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${p.paypal.client}:${p.paypal.secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tj = await tok.json();
  if (!tj.access_token) throw new Error("paypal_auth");
  const r = await fetch(api + "/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tj.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: `${table.id}:${user.id}`,
        amount: { currency_code: currency, value: Number(amount).toFixed(2) },
        description: `VELVET ${table.venue}`.slice(0, 120),
      }],
      application_context: {
        return_url: `${PUBLIC_APP}/#/pay-return`,
        cancel_url: `${PUBLIC_APP}/#/pay/${encodeURIComponent(table.id)}`,
        brand_name: "VELVET",
        user_action: "PAY_NOW",
      },
    }),
  });
  const j = await r.json();
  const approve = (j.links || []).find((l) => l.rel === "approve");
  if (!approve?.href) throw new Error(j.message || "paypal");
  return { url: approve.href, id: j.id };
}
function bankDetails(table, user, amount, currency) {
  const cfg = publicPayConfig();
  if (!cfg.account) return null;
  return {
    ...cfg.account,
    amount,
    currency,
    reference: payRef(table.id, user.id),
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      return send(res, 200, { ok: true, service: "velvet-api" });
    }
    if (req.method === "GET" && url.pathname === "/events") {
      const data = loadEventsFile();
      const st = loadCrawlStatus();
      return send(res, 200, {
        ...data,
        crawl: {
          lastRun: st.lastOk || st.lastRun,
          running: !!st.running,
          engine: st.engine,
          venuesUpdated: st.venuesUpdated,
          events: st.events,
        },
      }, { "Cache-Control": "no-store" });
    }
    if (req.method === "GET" && url.pathname === "/events/status") {
      return send(res, 200, loadCrawlStatus(), { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/events/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      const operator = isOperator(b.user);
      const live = getCrawlState();
      if (live.running) {
        return send(res, 202, { running: true, status: live.status, ...loadEventsFile() });
      }
      const last = Date.parse(live.status.lastOk || live.status.lastRun || 0);
      const coolMs = venueId ? 20 * 60 * 1000 : 4 * 3600 * 1000;
      if (!operator && Number.isFinite(last) && Date.now() - last < coolMs && !venueId) {
        return send(res, 429, { error: "cooldown", status: live.status, ...loadEventsFile() });
      }
      if (venueId) {
        const result = await runCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" });
        return send(res, 200, { ...(result.payload || loadEventsFile()), status: result, running: false }, { "Cache-Control": "no-store" });
      }
      runCrawl({ reason: operator ? "operator" : "app" }).catch((e) => console.error("velvet-crawl", e));
      return send(res, 202, { running: true, status: loadCrawlStatus(), ...loadEventsFile() });
    }
    if (req.method === "GET" && url.pathname === "/places") {
      return send(res, 200, loadPlacesFile(), { "Cache-Control": "no-store" });
    }
    const placeOne = url.pathname.match(/^\/places\/([A-Z0-9._-]+)$/i);
    if (req.method === "GET" && placeOne) {
      const all = loadPlacesFile();
      const rec = all.venues?.[placeOne[1]] || null;
      return send(res, 200, { venueId: placeOne[1], place: rec }, { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/places/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      if (!isOperator(b.user)) return send(res, 403, { error: "operator" });
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      runPlacesLookup({ venueId, reason: "operator" }).catch((e) => console.error("velvet-places", e));
      return send(res, 202, { running: true, ...loadPlacesFile() });
    }
    if (req.method === "GET" && url.pathname === "/facts") {
      return send(res, 200, loadFactsFile(), { "Cache-Control": "no-store" });
    }
    const factOne = url.pathname.match(/^\/facts\/([A-Z0-9._-]+)$/i);
    if (req.method === "GET" && factOne) {
      const all = loadFactsFile();
      return send(res, 200, { venueId: factOne[1], facts: all.venues?.[factOne[1]] || null }, { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/facts/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      const operator = isOperator(b.user);
      if (venueId) {
        const result = await runFactsCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" });
        return send(res, 200, { ...(result.payload || loadFactsFile()), status: result }, { "Cache-Control": "no-store" });
      }
      if (!operator) return send(res, 403, { error: "operator" });
      runFactsCrawl({ reason: "operator" }).catch((e) => console.error("velvet-facts", e));
      return send(res, 202, { running: true, ...loadFactsFile() });
    }

    if (req.method === "GET" && url.pathname === "/pay/config") {
      return send(res, 200, publicPayConfig());
    }
    const authStart = url.pathname.match(/^\/auth\/start\/(facebook|instagram|tiktok|snapchat)$/);
    if (req.method === "GET" && authStart) {
      const provider = authStart[1];
      const state = crypto.randomBytes(12).toString("hex");
      const db = load();
      if (!db.auth) db.auth = {};
      db.auth["st:" + state] = { provider, exp: Date.now() + 15 * 60 * 1000 };
      save(db);
      const dest = oauthAuthorizeUrl(provider, state);
      if (!dest) return send(res, 200, { local: true, provider });
      return send(res, 200, { url: dest, provider });
    }
    const authCb = url.pathname.match(/^\/auth\/callback\/(facebook|instagram|tiktok|snapchat)$/);
    if (req.method === "GET" && authCb) {
      const provider = authCb[1];
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      const fail = () => {
        res.writeHead(302, { Location: `${PUBLIC_APP}/#/account` });
        res.end();
      };
      if (!code) return fail();
      const db0 = load();
      const st = db0.auth?.["st:" + state];
      if (!st || st.exp < Date.now()) return fail();
      try {
        const profile = await oauthProfile(provider, code);
        profile.created = new Date().toISOString();
        const db = load();
        upsertUser(db, profile);
        save(db);
        const token = mintAuthToken(profile);
        res.writeHead(302, { Location: `${PUBLIC_APP}/?auth=${encodeURIComponent(token)}#/` });
        res.end();
      } catch {
        fail();
      }
      return;
    }
    if (req.method === "GET" && url.pathname === "/auth/session") {
      const token = url.searchParams.get("token") || "";
      const db = load();
      const rec = db.auth?.[token];
      if (!rec || rec.exp < Date.now() || !rec.user) return send(res, 401, { error: "auth" });
      delete db.auth[token];
      save(db);
      return send(res, 200, { user: rec.user });
    }
    if (req.method === "POST" && url.pathname === "/pay/setup") {
      const b = await readBody(req, 2e5);
      if (!isOperator(b.user)) return send(res, 403, { error: "operator" });
      const cur = loadPay();
      if (b.currency) cur.currency = String(b.currency).toUpperCase().slice(0, 3);
      if (b.revolutIban !== undefined) cur.revolut.iban = ibanOk(b.revolutIban) || String(b.revolutIban || "").replace(/\s+/g, "").toUpperCase();
      if (b.revolutBic !== undefined) cur.revolut.bic = String(b.revolutBic || "").replace(/\s+/g, "").toUpperCase();
      if (b.revolutName !== undefined) cur.revolut.name = String(b.revolutName || "").slice(0, 80);
      if (b.revolutMe !== undefined) cur.revolut.me = String(b.revolutMe || "").replace(/^https?:\/\/(www\.)?revolut\.me\//i, "").slice(0, 40);
      if (b.revolutMerchantSecret) cur.revolut.merchantSecret = String(b.revolutMerchantSecret);
      if (b.revolutSandbox !== undefined) cur.revolut.sandbox = !!b.revolutSandbox;
      if (b.stripeSecret) cur.stripe.secret = String(b.stripeSecret);
      if (b.stripePub) cur.stripe.pub = String(b.stripePub);
      if (b.stripeWebhook) cur.stripe.webhook = String(b.stripeWebhook);
      if (b.paypalClient) cur.paypal.client = String(b.paypalClient);
      if (b.paypalSecret) cur.paypal.secret = String(b.paypalSecret);
      if (b.paypalSandbox !== undefined) cur.paypal.sandbox = !!b.paypalSandbox;
      if (!cur.oauth) cur.oauth = emptyPay().oauth;
      if (b.facebookId) cur.oauth.facebook.id = String(b.facebookId);
      if (b.facebookSecret) cur.oauth.facebook.secret = String(b.facebookSecret);
      if (b.instagramId) cur.oauth.instagram.id = String(b.instagramId);
      if (b.instagramSecret) cur.oauth.instagram.secret = String(b.instagramSecret);
      if (b.tiktokKey) cur.oauth.tiktok.key = String(b.tiktokKey);
      if (b.tiktokSecret) cur.oauth.tiktok.secret = String(b.tiktokSecret);
      if (b.snapchatId) cur.oauth.snapchat.id = String(b.snapchatId);
      if (b.snapchatSecret) cur.oauth.snapchat.secret = String(b.snapchatSecret);
      if (b.firecrawlKey) cur.firecrawlKey = String(b.firecrawlKey).trim();
      if (b.googlePlacesKey) cur.googlePlacesKey = String(b.googlePlacesKey).trim();
      savePay(cur);
      return send(res, 200, { ok: true, config: publicPayConfig() });
    }
    if (req.method === "POST" && url.pathname === "/pay/intent") {
      const b = await readBody(req, 2e5);
      const userId = String(b.user?.id || "");
      if (!userId) return send(res, 401, { error: "auth" });
      const db = load();
      const t = db.tables.find((x) => x.id === String(b.tableId || ""));
      if (!t) return send(res, 404, { error: "not_found" });
      const member = t.host?.id === userId || (t.joiners || []).some((j) => j.id === userId);
      if (!member) return send(res, 403, { error: "not_member" });
      const pub = publicTable(t, db);
      const amount = Number(pub.per_person) || 0;
      const currency = publicPayConfig().currency || "EUR";
      const method = String(b.method || "card");
      const cardLike = ["card", "applepay", "googlepay", "klarna", "paypal"].includes(method);
      if (cardLike && amount < 1) {
        return send(res, 409, { error: "no_amount", message: "Inget belopp — klubben sätter priset. Fyll en budget i förfrågan först." });
      }
      const cents = Math.max(100, Math.round(amount * 100));
      const table = { id: t.id, venue: t.venue, date: t.date };
      const user = { id: userId, name: b.user?.name || "", email: b.user?.email || "" };
      try {
        if (method === "sepa" || method === "swift" || (method === "revolut" && !loadPay().revolut.merchantSecret)) {
          const bank = bankDetails(table, user, amount, currency);
          if (!bank) return send(res, 409, { error: "no_account", message: "Revolut-konto inte kopplat än." });
          return send(res, 200, { mode: "bank", bank, method });
        }
        if (method === "paypal") {
          const o = await paypalOrder({ table, user, amount, currency });
          if (!o) return send(res, 409, { error: "paypal_off" });
          return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "paypal", method });
        }
        if (method === "revolut") {
          const o = await revolutOrder({ table, user, cents, currency });
          if (o?.url) return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "revolut", method });
          const bank = bankDetails(table, user, amount, currency);
          if (!bank) return send(res, 409, { error: "revolut_off" });
          return send(res, 200, { mode: "bank", bank, method });
        }
        // card / applepay / googlepay / klarna → Stripe, else Revolut Merchant
        const s = await stripeCheckout({ table, user, cents, currency, method });
        if (s?.url) return send(res, 200, { mode: "redirect", url: s.url, id: s.id, provider: "stripe", method });
        const o = await revolutOrder({ table, user, cents, currency });
        if (o?.url) return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "revolut", method });
        const bank = bankDetails(table, user, amount, currency);
        if (bank) return send(res, 200, { mode: "bank", bank, method, fallback: true });
        return send(res, 409, { error: "no_processor" });
      } catch (e) {
        return send(res, 502, { error: "provider", message: String(e.message || e) });
      }
    }
    if (req.method === "POST" && url.pathname === "/pay/confirm") {
      const b = await readBody(req, 2e5);
      const userId = String(b.user?.id || "");
      if (!userId) return send(res, 401, { error: "auth" });
      const db = load();
      const pay = loadPay();
      if (b.sessionId && pay.stripe.secret) {
        const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(b.sessionId)}`, {
          headers: { Authorization: `Bearer ${pay.stripe.secret}` },
        });
        const s = await r.json();
        if (s.payment_status === "paid" || s.status === "complete") {
          const tableId = s.metadata?.tableId || String(b.tableId || "");
          const uid = s.metadata?.userId || userId;
          const rec = applyIncomingPayment(db, {
            tableId, userId: uid, amount: (s.amount_total || 0) / 100,
            currency: (s.currency || "eur").toUpperCase(), method: "card", provider: "stripe", providerId: s.id,
          });
          if (rec) save(db);
          const t = db.tables.find((x) => x.id === tableId);
          return send(res, 200, { ok: !!rec, table: t ? publicTable(t, db) : null });
        }
      }
      if (b.orderId && pay.revolut.merchantSecret) {
        const host = pay.revolut.sandbox ? "https://sandbox-merchant.revolut.com" : "https://merchant.revolut.com";
        const r = await fetch(`${host}/api/orders/${encodeURIComponent(b.orderId)}`, {
          headers: { Authorization: `Bearer ${pay.revolut.merchantSecret}`, "Revolut-Api-Version": "2024-09-01" },
        });
        const o = await r.json();
        if (["completed", "paid", "captured"].includes(String(o.state || o.status || "").toLowerCase())) {
          const ref = String(o.merchant_order_data?.reference || b.tableId || "");
          const [tableId, uid] = ref.includes(":") ? ref.split(":") : [b.tableId, userId];
          const rec = applyIncomingPayment(db, {
            tableId, userId: uid || userId, amount: (o.amount || 0) / 100,
            currency: o.currency || "EUR", method: "revolut", provider: "revolut", providerId: o.id,
          });
          if (rec) save(db);
          const t = db.tables.find((x) => x.id === tableId);
          return send(res, 200, { ok: !!rec, table: t ? publicTable(t, db) : null });
        }
      }
      return send(res, 409, { error: "not_paid" });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/stripe") {
      const raw = await readRaw(req);
      const pay = loadPay();
      if (pay.stripe.webhook) {
        const header = String(req.headers["stripe-signature"] || "");
        const parts = Object.fromEntries(header.split(",").map((x) => {
          const i = x.indexOf("=");
          return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : ["", ""];
        }).filter((x) => x[0]));
        const signed = `${parts.t}.${raw.toString("utf8")}`;
        const digest = crypto.createHmac("sha256", pay.stripe.webhook).update(signed).digest("hex");
        if (!parts.v1 || digest.length !== parts.v1.length || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(parts.v1))) {
          return send(res, 400, { error: "sig" });
        }
      }
      let ev;
      try { ev = JSON.parse(raw.toString("utf8")); } catch { return send(res, 400, { error: "json" }); }
      const s = ev.data?.object || {};
      if ((ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") && (s.payment_status === "paid" || s.status === "complete")) {
        const db = load();
        applyIncomingPayment(db, {
          tableId: s.metadata?.tableId, userId: s.metadata?.userId,
          amount: (s.amount_total || 0) / 100, currency: (s.currency || "eur").toUpperCase(),
          method: "card", provider: "stripe", providerId: s.id,
        });
        save(db);
      }
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/revolut") {
      const b = await readBody(req, 2e5);
      const order = b.order || b.data || b;
      const state = String(order.state || order.status || b.event || "").toLowerCase();
      if (state.includes("complet") || state.includes("paid") || b.event === "ORDER_COMPLETED") {
        const ref = String(order.merchant_order_data?.reference || "");
        const [tableId, userId] = ref.split(":");
        if (tableId && userId) {
          const db = load();
          applyIncomingPayment(db, {
            tableId, userId, amount: (order.amount || 0) / 100,
            currency: order.currency || "EUR", method: "revolut", provider: "revolut", providerId: order.id,
          });
          save(db);
        }
      }
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/paypal") {
      const b = await readBody(req, 2e5);
      const ev = String(b.event_type || "");
      const custom = String(b.resource?.purchase_units?.[0]?.custom_id || b.resource?.custom_id || "");
      if (ev.includes("PAYMENT") || ev.includes("CHECKOUT.ORDER.APPROVED") || ev.includes("CAPTURE.COMPLETED")) {
        const [tableId, userId] = custom.split(":");
        if (tableId && userId) {
          const db = load();
          applyIncomingPayment(db, {
            tableId, userId,
            amount: Number(b.resource?.amount?.value || b.resource?.purchase_units?.[0]?.amount?.value || 0),
            currency: b.resource?.amount?.currency_code || "EUR",
            method: "paypal", provider: "paypal", providerId: b.resource?.id,
          });
          save(db);
        }
      }
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/users") {
      const b = await readBody(req, 2e5);
      if (!b.id || !b.provider) return send(res, 400, { error: "missing" });
      const db = load();
      upsertUser(db, b);
      save(db);
      return send(res, 200, { user: publicPerson(db.users[b.id], db, "user") });
    }
    const userM = url.pathname.match(/^\/users\/([^/]+)$/);
    if (req.method === "GET" && userM) {
      const uid = decodeURIComponent(userM[1]);
      const db = load();
      const u = findUser(db, uid);
      const list = db.reviews.filter((r) => r.to === uid);
      const mine = db.tables.filter((t) => t.host?.id === uid || (t.joiners || []).some((j) => j.id === uid));
      const parties = mine.map((t) => partySummary(t, uid, db)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return send(res, 200, {
        user: u ? publicPerson(u, db, "user") : { id: uid, name: uid, handle: "", provider: "", socialUrl: "", idv: db.idv[uid]?.status === "verified" ? "verified" : "none" },
        reviews: list,
        ...avgRating(list),
        tables: parties,
        parties: {
          past: parties.filter((p) => p.past).slice(0, 40),
          upcoming: parties.filter((p) => !p.past).slice(0, 20),
        },
      });
    }

    if (req.method === "GET" && url.pathname === "/tables") {
      const db = load();
      const open = db.tables
        .filter((t) => t.status === "open" && Number(t.openLeft) > 0)
        .map((t) => publicTable(t, db));
      return send(res, 200, { tables: open });
    }
    const payM = url.pathname.match(/^\/tables\/([^/]+)\/pay$/);
    const joinM = url.pathname.match(/^\/tables\/([^/]+)\/join$/);
    const getM = url.pathname.match(/^\/tables\/([^/]+)$/);
    if (req.method === "GET" && getM) {
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(getM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      return send(res, 200, { table: publicTable(t, db) });
    }
    if (req.method === "POST" && url.pathname === "/tables") {
      const b = await readBody(req, 2e6);
      if (!b.venue || !b.host?.name) return send(res, 400, { error: "missing" });
      const party = Math.max(2, Math.min(20, Number(b.party) || 4));
      const openSeats = Math.max(0, Math.min(party - 1, Number(b.openSeats) || 0));
      const host = {
        id: String(b.host?.id || ""),
        name: String(b.host.name),
        provider: String(b.host?.provider || ""),
        handle: String(b.host?.handle || "").replace(/^@/, ""),
        email: String(b.host?.email || ""),
        phone: String(b.host?.phone || ""),
        paid: false,
        joined: new Date().toISOString(),
      };
      const table = {
        id: b.id || `TB-${Date.now().toString(36).toUpperCase()}`,
        venue_id: String(b.venue_id || ""),
        venue: String(b.venue),
        destination: String(b.destination || ""),
        date: String(b.date || ""),
        package: String(b.package || ""),
        total: Number(b.total) || 0,
        party,
        openSeats,
        openLeft: openSeats,
        split: true,
        sharp: !!b.sharp,
        status: openSeats > 0 ? "open" : "closed",
        host,
        guests: Array.isArray(b.guests) ? b.guests.map((g) => ({
          name: String(g.name || "").slice(0, 80),
          email: String(g.email || ""),
          paid: false,
        })) : [],
        joiners: [],
        created: new Date().toISOString(),
      };
      const db = load();
      upsertUser(db, host);
      db.tables.unshift(table);
      db.tables = db.tables.slice(0, 200);
      save(db);
      return send(res, 201, { table: publicTable(table, db) });
    }
    if (req.method === "POST" && joinM) {
      const b = await readBody(req, 2e6);
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(joinM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      if (t.sharp) {
        const idv = db.idv[b.user?.id || ""];
        if (!idv || idv.status !== "verified") return send(res, 403, { error: "idv_required" });
      }
      if (t.openLeft < 1) return send(res, 409, { error: "full" });
      const uid = b.user?.id || "";
      if (uid && (t.host?.id === uid || t.joiners.some((j) => j.id === uid))) {
        return send(res, 200, { table: publicTable(t, db), already: true });
      }
      const joiner = {
        id: uid || `U-${Date.now().toString(36)}`,
        name: String(b.user?.name || b.user?.provider || "Gäst"),
        provider: String(b.user?.provider || ""),
        handle: String(b.user?.handle || "").replace(/^@/, ""),
        paid: false,
        joined: new Date().toISOString(),
      };
      t.joiners.push(joiner);
      upsertUser(db, joiner);
      t.openLeft = Math.max(0, t.openLeft - 1);
      if (t.openLeft === 0) t.status = "full";
      save(db);
      return send(res, 200, { table: publicTable(t, db) });
    }
    if (req.method === "POST" && payM) {
      const b = await readBody(req, 2e5);
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(payM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      const actorId = String(b.user?.id || "");
      if (!actorId) return send(res, 401, { error: "auth" });
      const isHost = !!(t.host?.id && t.host.id === actorId);
      const targetId = String(b.targetId || actorId);
      const targetName = String(b.targetName || "");
      const paid = !!b.paid;
      if (!isHost && targetId !== actorId) return send(res, 403, { error: "forbidden" });
      let hit = false;
      if (t.host?.id === targetId || (isHost && !targetId && !targetName && t.host)) {
        setPaidFlag(t.host, paid, actorId);
        hit = true;
      }
      const j = t.joiners.find((x) => x.id === targetId);
      if (j) { setPaidFlag(j, paid, actorId); hit = true; }
      if (!hit && isHost && targetName) {
        const g = (t.guests || []).find((x) => x.name === targetName);
        if (g) { setPaidFlag(g, paid, actorId); hit = true; }
      }
      if (!hit) return send(res, 404, { error: "member" });
      save(db);
      return send(res, 200, { table: publicTable(t, db) });
    }

    if (req.method === "POST" && url.pathname === "/idv") {
      const b = await readBody(req);
      const uid = safeId(b.userId);
      if (!uid || uid === "unknown") return send(res, 400, { error: "user" });
      const pass = decodeDataUrl(b.passport);
      const self = decodeDataUrl(b.selfie);
      if (!pass || !self) return send(res, 400, { error: "images" });
      const parsed = readMrzBody(b);
      const dir = path.join(IDV_DIR, uid);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "passport." + pass.ext), pass.buf);
      fs.writeFileSync(path.join(dir, "selfie." + self.ext), self.buf);
      const claimed = String(b.name || "");
      const db = load();
      const now = new Date().toISOString();
      if (!parsed || !parsed.checksumsOk || (parsed.reasons || []).includes("not_passport")) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: "unreadable",
          submitted: now,
          reasons: (parsed && parsed.reasons) || ["mrz_unreadable"],
        };
        save(db);
        return send(res, 422, { error: "mrz_unreadable", idv: publicIdv(db.idv[b.userId]) });
      }
      if (parsed.expired) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: "expired",
          submitted: now,
          reasons: parsed.reasons,
          fields: parsed.fields,
          fieldsPublic: publicFields(parsed.fields),
          legalName: legalName(parsed.fields),
        };
        save(db);
        return send(res, 422, { error: "mrz_expired", idv: publicIdv(db.idv[b.userId]) });
      }
      const face = readFace(b);
      if (!face.ok) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: face.error === "face_mismatch" ? "face_mismatch" : "face_required",
          submitted: now,
          reasons: [face.error || "face_required"],
          fields: parsed.fields,
          fieldsPublic: publicFields(parsed.fields),
          legalName: legalName(parsed.fields),
          facePublic: {
            passportFace: face.passportFace,
            selfieFace: face.selfieFace,
            liveness: face.liveness,
            matchOk: face.matchOk,
            matchDistance: face.matchDistance,
          },
        };
        save(db);
        return send(res, 422, { error: face.error || "face_required", idv: publicIdv(db.idv[b.userId]) });
      }
      const nm = nameMatch(parsed.fields.firstName, parsed.fields.lastName, claimed);
      let status = "verified";
      if (!nm.ok && !b.confirmMismatch) status = "mismatch";
      db.idv[b.userId] = {
        userId: String(b.userId),
        name: claimed,
        status,
        submitted: now,
        reasons: parsed.reasons,
        nameMatch: nm,
        fields: parsed.fields,
        fieldsPublic: publicFields(parsed.fields),
        legalName: legalName(parsed.fields),
        mrz: { line1: parsed.line1, line2: parsed.line2 },
        facePublic: {
          passportFace: true,
          selfieFace: true,
          liveness: true,
          matchOk: true,
          matchDistance: face.matchDistance,
        },
      };
      if (status === "verified" && db.users[b.userId]) {
        db.users[b.userId].legalName = legalName(parsed.fields);
      }
      save(db);
      if (status === "mismatch") {
        return send(res, 200, { error: "name_mismatch", idv: publicIdv(db.idv[b.userId]) });
      }
      return send(res, 200, { idv: publicIdv(db.idv[b.userId]) });
    }
    const idvM = url.pathname.match(/^\/idv\/([^/]+)$/);
    if (req.method === "GET" && idvM) {
      const db = load();
      const rec = db.idv[decodeURIComponent(idvM[1])];
      const uid = decodeURIComponent(idvM[1]);
      return send(res, 200, {
        idv: publicIdv(rec),
        card: publicCard(db.users[uid]?.card),
        paying: hasCardOnFile(uid, db),
      });
    }
    if (req.method === "POST" && url.pathname === "/card") {
      const b = await readBody(req, 2e5);
      const uid = String(b.user?.id || b.userId || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      upsertUser(db, b.user || { id: uid });
      if (!isIdvVerified(uid, db)) return send(res, 403, { error: "idv_required" });
      const parsed = parseCardBody(b);
      if (parsed.error) return send(res, 400, { error: parsed.error });
      db.users[uid].card = parsed.card;
      save(db);
      return send(res, 200, { ok: true, card: publicCard(parsed.card), paying: true });
    }

    if (req.method === "POST" && url.pathname === "/reviews") {
      const b = await readBody(req, 2e5);
      const from = String(b.from?.id || "");
      const to = String(b.to?.id || "");
      const tableId = String(b.tableId || "");
      const rating = Number(b.rating);
      if (!from || !to || from === to) return send(res, 400, { error: "who" });
      if (!tableId) return send(res, 400, { error: "table" });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return send(res, 400, { error: "rating" });
      const db = load();
      const t = db.tables.find((x) => x.id === tableId);
      if (!t) return send(res, 404, { error: "table" });
      const ids = tableMemberIds(t);
      if (!ids.includes(from) || !ids.includes(to)) return send(res, 403, { error: "not_shared" });
      if (!isPartyOver(t)) return send(res, 403, { error: "too_soon" });
      if (db.reviews.some((r) => r.from === from && r.to === to && r.tableId === tableId)) {
        return send(res, 409, { error: "dup" });
      }
      const rec = {
        id: `RV-${Date.now().toString(36)}`,
        from,
        fromName: String(b.from?.name || ""),
        to,
        toName: String(b.to?.name || ""),
        tableId: String(b.tableId || ""),
        rating,
        text: String(b.text || "").slice(0, 500),
        created: new Date().toISOString(),
      };
      db.reviews.unshift(rec);
      db.reviews = db.reviews.slice(0, 500);
      save(db);
      return send(res, 201, { review: rec });
    }
    const revM = url.pathname.match(/^\/reviews\/([^/]+)$/);
    if (req.method === "GET" && revM) {
      const uid = decodeURIComponent(revM[1]);
      const db = load();
      const list = db.reviews.filter((r) => r.to === uid);
      const u = findUser(db, uid);
      return send(res, 200, {
        reviews: list,
        ...avgRating(list),
        idv: db.idv[uid]?.status || "none",
        user: u ? publicPerson(u, db, "user") : null,
      });
    }

    if (req.method === "GET" && url.pathname === "/wa/webhook") {
      const cloud = waCloud();
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && cloud.verify && token === cloud.verify) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(challenge || "");
        return;
      }
      return send(res, 403, { error: "verify" });
    }
    if (req.method === "POST" && url.pathname === "/wa/webhook") {
      const b = await readBody(req, 1e6);
      const db = load();
      const entries = Array.isArray(b.entry) ? b.entry : [];
      let stored = 0;
      for (const entry of entries) {
        const changes = Array.isArray(entry.changes) ? entry.changes : [];
        for (const ch of changes) {
          const msgs = ch.value?.messages || [];
          for (const m of msgs) {
            const from = waDigits(m.from);
            const text = String(m.text?.body || m.button?.text || "").trim().slice(0, 800);
            const mid = String(m.id || "");
            if (!from || !text) continue;
            if (markWaSeen(db, mid)) continue;
            let venueId = "";
            let threadId = "";
            let role = "user";
            for (const [vid, rec] of Object.entries(db.promoterContact || {})) {
              if (waDigits(rec.whatsapp) === from) {
                venueId = vid;
                threadId = rec.lastThreadId || "";
                role = "promoter";
                break;
              }
            }
            if (!venueId) {
              for (const [vid, threads] of Object.entries(db.chatsMeta || {})) {
                for (const [tid, meta] of Object.entries(threads || {})) {
                  if (waDigits(meta.guestWa) === from) {
                    venueId = vid;
                    threadId = tid;
                    role = "user";
                    break;
                  }
                }
                if (venueId) break;
              }
            }
            if (!venueId) {
              for (const [uid, u] of Object.entries(db.users || {})) {
                if (waDigits(u.whatsapp) === from) {
                  for (const [vid, rec] of Object.entries(db.chats || {})) {
                    if (rec[uid]) { venueId = vid; threadId = uid; role = "user"; break; }
                  }
                  break;
                }
              }
            }
            if (!venueId || !threadId) continue;
            const who = role === "promoter"
              ? (findUser(db, db.promoterContact[venueId]?.userId) || { name: "Promoter" })
              : (db.users[threadId] || { name: "Gäst" });
            appendChat(db, venueId, threadId, {
              id: `M-wa-${Date.now().toString(36)}`,
              role,
              userId: role === "promoter" ? (db.promoterContact[venueId]?.userId || "promoter") : threadId,
              name: String(who.name || ""),
              handle: String(who.handle || ""),
              text,
              via: "whatsapp",
              created: new Date().toISOString(),
            });
            stored += 1;
            if (role === "promoter") {
              const guestPhone = guestWaForThread(db, venueId, threadId);
              if (guestPhone) cloudSendWa(guestPhone, text).catch(() => {});
            } else {
              const promo = whatsappForVenue(venueId, db);
              if (promo?.phone) {
                if (!db.promoterContact[venueId]) db.promoterContact[venueId] = { whatsapp: promo.phone };
                db.promoterContact[venueId].lastThreadId = threadId;
                cloudSendWa(promo.phone, `${who.name || "Gäst"} · VELVET\n${text}`).catch(() => {});
              }
            }
          }
        }
      }
      save(db);
      return send(res, 200, { ok: true, stored });
    }

    const claimM = url.pathname.match(/^\/chats\/([^/]+)\/claim$/);
    const guestWaM = url.pathname.match(/^\/chats\/([^/]+)\/guest-wa$/);
    const inboxM = url.pathname.match(/^\/chats\/([^/]+)\/inbox$/);
    const chatM = url.pathname.match(/^\/chats\/([^/]+)$/);
    if (req.method === "POST" && guestWaM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(guestWaM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      if (!isPromoter(b.user, venueId, db)) {
        const gate = memberGate(uid, db);
        if (gate) return send(res, 403, { error: gate });
      }
      const phone = waDigits(b.whatsapp);
      if (String(b.whatsapp || "").trim() && !phone) return send(res, 400, { error: "whatsapp" });
      upsertUser(db, b.user);
      if (phone) setGuestWa(db, venueId, uid, phone, b.user?.name);
      else if (db.users[uid]) db.users[uid].whatsapp = "";
      save(db);
      return send(res, 200, { ok: true, guestWa: phone || "" });
    }
    if (req.method === "POST" && claimM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(claimM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      const list = db.promoters[venueId] || [];
      if (!list.includes(uid)) list.push(uid);
      db.promoters[venueId] = list;
      if (Object.prototype.hasOwnProperty.call(b, "whatsapp")) {
        const phone = waDigits(b.whatsapp);
        if (String(b.whatsapp || "").trim() && !phone) return send(res, 400, { error: "whatsapp" });
        if (!db.promoterContact) db.promoterContact = {};
        if (phone) {
          const prev = db.promoterContact[venueId] || {};
          db.promoterContact[venueId] = { ...prev, userId: uid, whatsapp: phone };
        } else delete db.promoterContact[venueId];
      }
      save(db);
      return send(res, 200, { ok: true, promoter: true, whatsapp: whatsappForVenue(venueId, db) });
    }
    if (req.method === "GET" && inboxM) {
      const venueId = decodeURIComponent(inboxM[1]);
      const uid = url.searchParams.get("userId") || "";
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) return send(res, 403, { error: "not_promoter" });
      const venueChats = db.chats[venueId] || {};
      const threads = Object.entries(venueChats).map(([threadId, msgs]) => {
        const last = msgs[msgs.length - 1] || {};
        return {
          threadId,
          name: msgs.find((m) => m.role === "user")?.name || threadId,
          last: last.text || "",
          at: last.created || "",
          n: msgs.length,
        };
      }).sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const withWa = threads.map((th) => {
        const card = publicCard(db.users[th.threadId]?.card);
        return {
          ...th,
          guestWa: guestWaForThread(db, venueId, th.threadId),
          idv: db.idv[th.threadId]?.status === "verified" ? "verified" : "none",
          paying: !!card,
          card,
        };
      });
      return send(res, 200, { threads: withWa, promoter: true });
    }
    if (req.method === "GET" && chatM) {
      const venueId = decodeURIComponent(chatM[1]);
      const uid = url.searchParams.get("userId") || "";
      const thread = url.searchParams.get("thread") || uid;
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      if (uid && !promoter) {
        const gate = memberGate(uid, db);
        if (gate) return send(res, 403, { error: gate });
      }
      const venueChats = db.chats[venueId] || {};
      const messages = venueChats[thread] || [];
      const guestId = promoter ? thread : uid;
      const guestCard = publicCard(db.users[guestId]?.card);
      return send(res, 200, {
        messages,
        promoter,
        whatsapp: whatsappForVenue(venueId, db),
        guestWa: guestWaForThread(db, venueId, thread),
        cloud: !!(waCloud().token && waCloud().phoneId),
        guest: {
          id: guestId,
          idv: db.idv[guestId]?.status === "verified" ? "verified" : "none",
          paying: !!guestCard,
          card: guestCard,
        },
      });
    }
    if (req.method === "POST" && chatM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(chatM[1]);
      const text = String(b.text || "").trim().slice(0, 800);
      const uid = String(b.user?.id || "");
      if (!uid || !text) return send(res, 400, { error: "missing" });
      const db = load();
      upsertUser(db, b.user);
      const promoter = isPromoter(b.user, venueId, db);
      if (!promoter) {
        const gate = memberGate(uid, db);
        if (gate) return send(res, 403, { error: gate });
      }
      const threadId = promoter ? String(b.threadId || uid) : uid;
      if (b.whatsapp) setGuestWa(db, venueId, uid, b.whatsapp, b.user?.name);
      const asPromo = promoter && b.asPromoter !== false;
      const msg = {
        id: `M-${Date.now().toString(36)}`,
        role: asPromo ? "promoter" : "user",
        userId: uid,
        name: String(b.user?.name || ""),
        handle: String(b.user?.handle || ""),
        text,
        via: "app",
        created: new Date().toISOString(),
      };
      const messages = appendChat(db, venueId, threadId, msg);
      if (!asPromo) {
        if (!db.promoterContact[venueId]) db.promoterContact[venueId] = {};
        db.promoterContact[venueId].lastThreadId = threadId;
        const promo = whatsappForVenue(venueId, db);
        if (promo?.phone) {
          cloudSendWa(promo.phone, `${msg.name || "Gäst"} · VELVET · ${venueId}\n${text}\n\nSvara i WhatsApp — det går till gästen.`).catch(() => {});
        }
      } else {
        const guestPhone = guestWaForThread(db, venueId, threadId);
        if (guestPhone) cloudSendWa(guestPhone, text).catch(() => {});
      }
      save(db);
      return send(res, 201, { message: msg, messages, promoter, guestWa: guestWaForThread(db, venueId, threadId) });
    }

    send(res, 404, { error: "nope" });
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("velvet-api " + PORT);
  scheduleDailyCrawl();
});
