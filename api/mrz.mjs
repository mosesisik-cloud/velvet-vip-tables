/**
 * ICAO 9303 TD3 passport MRZ — keep in sync with js/mrz.js
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
/** Born 2009-08-22 — under 18 on 2026-08-21. Checksums valid, not expired. */
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

/** Common Tesseract swaps on a TD3 field so one misread char can still checksum. */
const OCR_SWAP = {
  "0": "OQD", "O": "0DQ", "Q": "0O", "D": "0O",
  "1": "I", "I": "1",
  "5": "S", "S": "5",
  "8": "B", "B": "8",
  "2": "Z", "Z": "2",
  "6": "G", "G": "6",
  "C": "<", "K": "<", "E": "<",
};

function repairField(raw, checkChar) {
  const src = String(raw || "");
  const cd = String(checkChar || "");
  if (checkDigit(src) === cd) return src;
  for (let i = 0; i < src.length; i++) {
    const alts = OCR_SWAP[src[i]] || "";
    for (const ch of alts) {
      const next = src.slice(0, i) + ch + src.slice(i + 1);
      if (checkDigit(next) === cd) return next;
    }
  }
  return null;
}

function applyField(chars, start, len, checkIdx) {
  const raw = chars.slice(start, start + len).join("");
  const cd = chars[checkIdx];
  if (checkDigit(raw) === cd) return;
  const fixed = repairField(raw, cd);
  if (fixed) {
    for (let i = 0; i < len; i++) chars[start + i] = fixed[i];
    return;
  }
  const altsCd = OCR_SWAP[cd] || "";
  for (const ch of altsCd) {
    if (checkDigit(raw) === ch) { chars[checkIdx] = ch; return; }
  }
}

export function repairTd3(line1, line2) {
  const a0 = pad44(line1);
  const b0 = pad44(line2);
  let best = parseTd3(a0, b0);
  if (best && best.valid) return best;
  const chars = b0.split("");
  applyField(chars, 0, 9, 9);
  applyField(chars, 13, 6, 19);
  applyField(chars, 21, 6, 27);
  applyField(chars, 28, 14, 42);
  const l2 = chars.join("");
  const composite = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
  const wantComp = checkDigit(composite);
  if (wantComp && wantComp !== chars[43]) {
    const alts = OCR_SWAP[chars[43]] || "";
    if (alts.includes(wantComp) || chars[43] === "<") chars[43] = wantComp;
  }
  let a = a0;
  if (a[0] !== "P") {
    if (a[0] === "F" || a[0] === "R" || a[0] === "D") a = "P" + a.slice(1);
  }
  const repaired = parseTd3(a, chars.join(""));
  if (scoreParse(repaired) > scoreParse(best)) best = repaired;
  if (best && best.valid) return best;
  const src = (best && best.line2) || chars.join("");
  for (let i = 0; i < 44; i++) {
    const alts = OCR_SWAP[src[i]] || "";
    for (const ch of alts) {
      const n = src.slice(0, i) + ch + src.slice(i + 1);
      const p = parseTd3(a, n);
      if (scoreParse(p) > scoreParse(best)) best = p;
      if (p.valid) return p;
    }
  }
  return best;
}

function consider(best, line1, line2) {
  const raw = parseTd3(pad44(line1), pad44(line2));
  const p = raw && raw.valid ? raw : repairTd3(line1, line2);
  if (scoreParse(p) > scoreParse(best)) return p;
  return best;
}

export function extractMrzFromText(text) {
  const lines = String(text || "")
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.length >= 28);
  let best = null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i][0] !== "P" && lines[i + 1][0] !== "P" && lines[i][0] !== "F" && lines[i + 1][0] !== "F") continue;
    const a = (lines[i][0] === "P" || lines[i][0] === "F") ? lines[i] : lines[i + 1];
    const b = a === lines[i] ? lines[i + 1] : lines[i];
    best = consider(best, a, b);
    if (best && best.valid) return best;
  }
  const blob = String(text || "").toUpperCase().replace(/[^A-Z0-9<]/g, "");
  for (let i = 0; i + 88 <= blob.length; i++) {
    if (blob[i] !== "P" && blob[i] !== "F") continue;
    best = consider(best, blob.slice(i, i + 44), blob.slice(i + 44, i + 88));
    if (best && best.valid) return best;
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
