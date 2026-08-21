/**
 * Face presence, blink liveness, and passport↔selfie match.
 * Same three checks ID apps use. Not a bank-grade vendor — photos still stored for Gabbe.
 */
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js";
export const MATCH_MAX = 0.55;

let ready = null;
let liveAbort = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.faceapi) return resolve(window.faceapi);
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(window.faceapi);
    s.onerror = () => reject(new Error("faceapi"));
    document.head.appendChild(s);
  });
}

export async function loadFaceApi() {
  if (ready) return ready;
  ready = (async () => {
    const fa = await loadScript(SCRIPT_URL);
    if (!fa || !fa.nets) throw new Error("faceapi");
    await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    return fa;
  })();
  try {
    return await ready;
  } catch (e) {
    ready = null;
    throw e;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}

function scaleCanvas(src, max) {
  const w0 = src.videoWidth || src.naturalWidth || src.width;
  const h0 = src.videoHeight || src.naturalHeight || src.height;
  const s = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w0 * s));
  c.height = Math.max(1, Math.round(h0 * s));
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function cropCanvas(img, x, y, w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  c.getContext("2d").drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ear(eye) {
  if (!eye || eye.length < 6) return 1;
  return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * Math.max(dist(eye[0], eye[3]), 1));
}

function faceAreaRatio(det, w, h) {
  const box = det.detection && det.detection.box;
  if (!box || !w || !h) return 0;
  return (box.width * box.height) / (w * h);
}

async function detectOn(input, inputSize) {
  const fa = await loadFaceApi();
  const opts = new fa.TinyFaceDetectorOptions({ inputSize: inputSize || 320, scoreThreshold: 0.38 });
  return fa.detectSingleFace(input, opts).withFaceLandmarks().withFaceDescriptor();
}

export function descriptorDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 99;
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export async function detectPassportFace(dataUrl) {
  const img = await loadImg(dataUrl);
  const full = scaleCanvas(img, 720);
  const tries = [
    full,
    cropCanvas(img, 0, 0, img.width * 0.52, img.height * 0.72),
    cropCanvas(img, 0, img.height * 0.08, img.width * 0.48, img.height * 0.62),
  ];
  let best = null;
  for (const c of tries) {
    const det = await detectOn(c, 416);
    if (!det) continue;
    const ratio = faceAreaRatio(det, c.width, c.height);
    if (ratio < 0.012) continue;
    if (!best || ratio > best.ratio) best = { det, ratio };
  }
  if (!best) return { ok: false, reason: "no_passport_face" };
  return {
    ok: true,
    descriptor: Array.from(best.det.descriptor),
    score: Number(best.det.detection.score.toFixed(3)),
  };
}

export async function detectSelfieFace(input) {
  const c = input instanceof HTMLVideoElement ? scaleCanvas(input, 480) : scaleCanvas(input, 640);
  const det = await detectOn(c, 320);
  if (!det) return { ok: false, reason: "no_selfie_face" };
  const ratio = faceAreaRatio(det, c.width, c.height);
  if (ratio < 0.04) return { ok: false, reason: "face_too_small" };
  const left = det.landmarks.getLeftEye();
  const right = det.landmarks.getRightEye();
  const e = (ear(left) + ear(right)) / 2;
  return {
    ok: true,
    descriptor: Array.from(det.descriptor),
    score: Number(det.detection.score.toFixed(3)),
    ear: e,
    box: det.detection.box,
  };
}

export function stopLiveness() {
  if (liveAbort) liveAbort.abort();
  liveAbort = null;
}

export async function watchBlink(video, onStatus) {
  stopLiveness();
  const ac = new AbortController();
  liveAbort = ac;
  await loadFaceApi();
  let closed = 0;
  let openSeen = false;
  const started = Date.now();
  while (!ac.signal.aborted) {
    if (Date.now() - started > 45000) return { ok: false, reason: "timeout" };
    if (!video.videoWidth) {
      await sleep(80);
      continue;
    }
    let rec;
    try { rec = await detectSelfieFace(video); }
    catch { rec = { ok: false }; }
    if (ac.signal.aborted) return { ok: false, reason: "abort" };
    if (!rec.ok) {
      closed = 0;
      openSeen = false;
      if (onStatus) onStatus("no_face");
      await sleep(90);
      continue;
    }
    const e = rec.ear;
    if (e > 0.24) {
      openSeen = true;
      if (closed >= 2) {
        if (onStatus) onStatus("ok");
        return { ok: true, descriptor: rec.descriptor, liveness: "blink" };
      }
      closed = 0;
      if (onStatus) onStatus("blink");
    } else if (e < 0.19 && openSeen) {
      closed += 1;
      if (onStatus) onStatus("closed");
    } else if (onStatus) onStatus("look");
    await sleep(70);
  }
  return { ok: false, reason: "abort" };
}

export function matchFaces(passDesc, selfDesc) {
  const distance = descriptorDistance(passDesc, selfDesc);
  return {
    distance: Math.round(distance * 1000) / 1000,
    matchOk: distance <= MATCH_MAX,
  };
}

export function facePayload(pass, live, match) {
  return {
    passportFace: !!(pass && pass.ok),
    selfieFace: !!(live && live.ok),
    liveness: !!(live && live.ok && live.liveness === "blink"),
    matchDistance: match ? match.distance : null,
    matchOk: !!(match && match.matchOk),
  };
}
