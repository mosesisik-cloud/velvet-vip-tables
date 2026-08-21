import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.VELVET_DATA || path.join(__dir, "store.json");
const IDV_DIR = path.join(__dir, "idv");
const PORT = Number(process.env.PORT || 8787);

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
      users: raw.users && typeof raw.users === "object" ? raw.users : {},
    };
  } catch {}
  return { tables: [], idv: {}, reviews: [], chats: {}, promoters: {}, users: {} };
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
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
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
  if (!u || !u.id || !u.name) return;
  const provider = String(u.provider || "");
  const handle = String(u.handle || "").replace(/^@/, "").slice(0, 40);
  const prev = db.users[u.id] || {};
  db.users[u.id] = {
    id: String(u.id).slice(0, 80),
    name: String(u.name).slice(0, 80),
    handle,
    provider,
    updated: new Date().toISOString(),
    created: prev.created || new Date().toISOString(),
  };
}
function publicPerson(p, db, role) {
  if (!p) return null;
  const id = String(p.id || "");
  const stored = id && db.users[id] ? db.users[id] : {};
  const provider = String(p.provider || stored.provider || "");
  const handle = String(p.handle || stored.handle || "").replace(/^@/, "");
  const name = String(p.name || stored.name || "Gäst").slice(0, 80);
  const idv = id && db.idv[id]?.status === "verified" ? "verified" : "none";
  return {
    id,
    name,
    handle,
    provider,
    socialUrl: socialUrl(provider, handle),
    role: role || p.role || "guest",
    paid: !!p.paid,
    paidAt: p.paidAt || null,
    idv,
    joined: p.joined || p.created || null,
  };
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
function setPaidFlag(obj, paid, actorId) {
  obj.paid = !!paid;
  obj.paidAt = paid ? new Date().toISOString() : null;
  obj.paidBy = actorId || "";
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      return send(res, 200, { ok: true, service: "velvet-api" });
    }

    if (req.method === "POST" && url.pathname === "/users") {
      const b = await readBody(req, 2e5);
      if (!b.id || !b.name || !b.provider || !b.handle) return send(res, 400, { error: "missing" });
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
      const tables = db.tables
        .filter((t) => t.host?.id === uid || (t.joiners || []).some((j) => j.id === uid))
        .slice(0, 20)
        .map((t) => ({ id: t.id, venue: t.venue, date: t.date, role: t.host?.id === uid ? "host" : "guest" }));
      return send(res, 200, {
        user: u ? publicPerson(u, db, "user") : { id: uid, name: uid, handle: "", provider: "", socialUrl: "", idv: db.idv[uid]?.status === "verified" ? "verified" : "none" },
        reviews: list,
        ...avgRating(list),
        tables,
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
        name: String(b.user?.name || "Gäst"),
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
      const dir = path.join(IDV_DIR, uid);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "passport." + pass.ext), pass.buf);
      fs.writeFileSync(path.join(dir, "selfie." + self.ext), self.buf);
      const db = load();
      db.idv[b.userId] = {
        userId: String(b.userId),
        name: String(b.name || ""),
        status: "verified",
        submitted: new Date().toISOString(),
        note: "MVP: båda bilderna mottagna och sparade. Produktion ska använda Jumio/Persona.",
      };
      save(db);
      return send(res, 200, { idv: { status: "verified", submitted: db.idv[b.userId].submitted } });
    }
    const idvM = url.pathname.match(/^\/idv\/([^/]+)$/);
    if (req.method === "GET" && idvM) {
      const db = load();
      const rec = db.idv[decodeURIComponent(idvM[1])];
      if (!rec) return send(res, 200, { idv: { status: "none" } });
      return send(res, 200, { idv: { status: rec.status, submitted: rec.submitted } });
    }

    if (req.method === "POST" && url.pathname === "/reviews") {
      const b = await readBody(req, 2e5);
      const from = String(b.from?.id || "");
      const to = String(b.to?.id || "");
      const rating = Number(b.rating);
      if (!from || !to || from === to) return send(res, 400, { error: "who" });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return send(res, 400, { error: "rating" });
      const db = load();
      const shared = db.tables.some((t) => {
        const ids = [t.host?.id, ...(t.joiners || []).map((j) => j.id)].filter(Boolean);
        return ids.includes(from) && ids.includes(to);
      });
      if (!shared) return send(res, 403, { error: "not_shared" });
      if (db.reviews.some((r) => r.from === from && r.to === to && r.tableId === String(b.tableId || ""))) {
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

    const claimM = url.pathname.match(/^\/chats\/([^/]+)\/claim$/);
    const inboxM = url.pathname.match(/^\/chats\/([^/]+)\/inbox$/);
    const chatM = url.pathname.match(/^\/chats\/([^/]+)$/);
    if (req.method === "POST" && claimM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(claimM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      const list = db.promoters[venueId] || [];
      if (!list.includes(uid)) list.push(uid);
      db.promoters[venueId] = list;
      save(db);
      return send(res, 200, { ok: true, promoter: true });
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
      return send(res, 200, { threads, promoter: true });
    }
    if (req.method === "GET" && chatM) {
      const venueId = decodeURIComponent(chatM[1]);
      const uid = url.searchParams.get("userId") || "";
      const thread = url.searchParams.get("thread") || uid;
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      const venueChats = db.chats[venueId] || {};
      const messages = venueChats[thread] || [];
      return send(res, 200, { messages, promoter });
    }
    if (req.method === "POST" && chatM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(chatM[1]);
      const text = String(b.text || "").trim().slice(0, 800);
      const uid = String(b.user?.id || "");
      if (!uid || !text) return send(res, 400, { error: "missing" });
      const db = load();
      const promoter = isPromoter(b.user, venueId, db);
      const threadId = promoter ? String(b.threadId || uid) : uid;
      if (!db.chats[venueId]) db.chats[venueId] = {};
      if (!db.chats[venueId][threadId]) db.chats[venueId][threadId] = [];
      const msg = {
        id: `M-${Date.now().toString(36)}`,
        role: promoter && b.asPromoter !== false ? "promoter" : "user",
        userId: uid,
        name: String(b.user?.name || ""),
        handle: String(b.user?.handle || ""),
        text,
        created: new Date().toISOString(),
      };
      db.chats[venueId][threadId].push(msg);
      db.chats[venueId][threadId] = db.chats[venueId][threadId].slice(-200);
      save(db);
      return send(res, 201, { message: msg, messages: db.chats[venueId][threadId], promoter });
    }

    send(res, 404, { error: "nope" });
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("velvet-api " + PORT);
});
