/**
 * ICAO 9303 TD3 passport MRZ — same machine lines a border gate reads.
 * Checksums, dates, names. Never invents fields.
 */
const WEIGHTS = [7, 3, 1];

export const ICAO_SAMPLE = {
  line1: "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
  line2: "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
};
export const TEST_LIVE = {
  line1: "P<SWEISIK<<MOSES<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
  line2: "AB12345671SWE9003152M3203156<<<<<<<<<<<<<<04",
};
export const TEST_YOUNG = {
  line1: "P<SWEUNG<<TEST<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
  line2: "CD99999990SWE0908221M3203156<<<<<<<<<<<<<<00",
};

function mrzVal(ch) {
  const c = String(ch || "<").toUpperCase();
  if (c === "<") return 0;
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
  return -1;
}

export function checkDigit(str) {
  const s = String(str || "").toUpperCase();
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const v = mrzVal(s[i]);
    if (v < 0) return "";
    sum += v * WEIGHTS[i % 3];
  }
  return String(sum % 10);
}

function cleanLine(line, len) {
  let s = String(line || "").toUpperCase().replace(/[^A-Z0-9<]/g, "");
  if (s.length > len) s = s.slice(0, len);
  while (s.length < len) s += "<";
  return s;
}

function parseNames(raw) {
  const parts = String(raw || "").replace(/<+$/g, "").split("<<");
  const last = (parts[0] || "").replace(/</g, " ").replace(/\s+/g, " ").trim();
  const first = (parts[1] || "").replace(/</g, " ").replace(/\s+/g, " ").trim();
  return { lastName: last, firstName: first };
}

export function parseYYMMDD(s, kind) {
  if (!/^\d{6}$/.test(s)) return "";
  const yy = Number(s.slice(0, 2));
  const mm = Number(s.slice(2, 4));
  const dd = Number(s.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const nowY = new Date().getUTCFullYear();
  let year = 2000 + yy;
  if (kind === "birth") {
    if (year > nowY - 1) year -= 100;
  } else if (year > nowY + 20) year -= 100;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function sexLabel(ch) {
  if (ch === "M") return "M";
  if (ch === "F") return "F";
  if (ch === "X" || ch === "<") return "X";
  return "";
}

export function parseTd3(line1, line2) {
  const l1 = cleanLine(line1, 44);
  const l2 = cleanLine(line2, 44);
  const reasons = [];
  if (l1[0] !== "P") reasons.push("not_passport");

  const issuingState = l1.slice(2, 5).replace(/</g, "");
  const names = parseNames(l1.slice(5));
  const documentNumber = l2.slice(0, 9).replace(/</g, "");
  const cdNum = l2[9];
  const nationality = l2.slice(10, 13).replace(/</g, "");
  const birthRaw = l2.slice(13, 19);
  const cdBirth = l2[19];
  const sex = sexLabel(l2[20]);
  const expRaw = l2.slice(21, 27);
  const cdExp = l2[27];
  const optional = l2.slice(28, 42);
  const cdOpt = l2[42];
  const cdComp = l2[43];

  const okNum = checkDigit(l2.slice(0, 9)) === cdNum;
  const okBirth = checkDigit(birthRaw) === cdBirth;
  const okExp = checkDigit(expRaw) === cdExp;
  const okOpt = checkDigit(optional) === cdOpt;
  const composite = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
  const okComp = checkDigit(composite) === cdComp;
  if (!okNum) reasons.push("check_number");
  if (!okBirth) reasons.push("check_birth");
  if (!okExp) reasons.push("check_expiry");
  if (!okOpt) reasons.push("check_optional");
  if (!okComp) reasons.push("check_composite");

  const birthDate = parseYYMMDD(birthRaw, "birth");
  const expirationDate = parseYYMMDD(expRaw, "expiry");
  if (!birthDate) reasons.push("bad_birth");
  if (!expirationDate) reasons.push("bad_expiry");
  const expired = !!(expirationDate && expirationDate < new Date().toISOString().slice(0, 10));
  if (expired) reasons.push("expired");

  const checksumsOk = okNum && okBirth && okExp && okOpt && okComp;
  const valid = checksumsOk && l1[0] === "P" && !!names.lastName && !!documentNumber && !expired;

  return {
    valid,
    checksumsOk,
    expired,
    line1: l1,
    line2: l2,
    reasons,
    fields: {
      documentCode: l1[0] === "P" ? "P" : l1.slice(0, 2).replace(/</g, ""),
      issuingState,
      lastName: names.lastName,
      firstName: names.firstName,
      documentNumber,
      nationality,
      birthDate,
      sex,
      expirationDate,
      personalNumber: optional.replace(/</g, ""),
    },
  };
}

function pad44(s) {
  let t = String(s || "").toUpperCase().replace(/[^A-Z0-9<]/g, "");
  if (t.length > 44) t = t.slice(0, 44);
  while (t.length < 44) t += "<";
  return t;
}

function scoreParse(p) {
  if (!p) return -1;
  if (p.valid) return 100;
  let n = 0;
  if (p.line1 && p.line1[0] === "P") n += 10;
  if (p.checksumsOk) n += 40;
  n += 8 - (p.reasons || []).length;
  if (p.fields && p.fields.lastName) n += 5;
  return n;
}

export function extractMrzFromText(text) {
  const lines = String(text || "")
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.length >= 28);
  let best = null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i][0] !== "P" && lines[i + 1][0] !== "P") continue;
    const a = lines[i][0] === "P" ? lines[i] : lines[i + 1];
    const b = lines[i][0] === "P" ? lines[i + 1] : lines[i];
    const p = parseTd3(pad44(a), pad44(b));
    if (scoreParse(p) > scoreParse(best)) best = p;
    if (p.valid) return p;
  }
  const blob = String(text || "").toUpperCase().replace(/[^A-Z0-9<]/g, "");
  for (let i = 0; i + 88 <= blob.length; i++) {
    if (blob[i] !== "P") continue;
    const p = parseTd3(blob.slice(i, i + 44), blob.slice(i + 44, i + 88));
    if (scoreParse(p) > scoreParse(best)) best = p;
    if (p.valid) return p;
  }
  return best;
}

export function foldName(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .trim();
}

export function nameMatch(firstName, lastName, claimed) {
  const last = foldName(lastName);
  const first = foldName(firstName);
  const c = foldName(claimed);
  if (!last || !c) return { ok: false, score: 0, reason: "no_name" };
  const claimedTok = c.split(" ").filter((x) => x.length > 1);
  const passTok = [...first.split(" "), last].filter((x) => x.length > 1);
  const set = new Set(claimedTok);
  const lastHit = set.has(last);
  const firstHit = first.split(" ").some((x) => x.length > 1 && set.has(x));
  if (lastHit && firstHit) return { ok: true, score: 1, reason: "full" };
  if (lastHit) return { ok: true, score: 0.7, reason: "surname" };
  let hit = 0;
  for (const t of passTok) if (set.has(t)) hit += 1;
  const score = hit / Math.max(passTok.length, 1);
  return { ok: score >= 0.5, score, reason: score >= 0.5 ? "overlap" : "mismatch" };
}

export function ageYears(birthDate, on = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate || ""))) return null;
  const [y, m, d] = String(birthDate).split("-").map(Number);
  let age = on.getUTCFullYear() - y;
  const mm = on.getUTCMonth() + 1;
  const dd = on.getUTCDate();
  if (mm < m || (mm === m && dd < d)) age -= 1;
  return age;
}

export function publicFields(fields) {
  if (!fields) return null;
  const num = String(fields.documentNumber || "");
  const birthDate = fields.birthDate || "";
  return {
    lastName: fields.lastName || "",
    firstName: fields.firstName || "",
    nationality: fields.nationality || "",
    issuingState: fields.issuingState || "",
    birthDate,
    ageYears: ageYears(birthDate),
    expirationDate: fields.expirationDate || "",
    sex: fields.sex || "",
    documentCode: fields.documentCode || "P",
    documentNumberMasked: num ? "•••" + num.slice(-3) : "",
  };
}

export function legalName(fields) {
  if (!fields) return "";
  return [fields.firstName, fields.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
