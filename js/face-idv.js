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

const DETECT_TIMEOUT = Symbol("detect_timeout");
let cpuFallback = false; // sätts om webgl-inferensen hänger — byt sker en gång per sidladdning

async function detectOn(input, inputSize) {
  const fa = await loadFaceApi();
  const opts = new fa.TinyFaceDetectorOptions({ inputSize: inputSize || 320, scoreThreshold: 0.3 });
  const run = () => fa.detectSingleFace(input, opts).withFaceLandmarks().withFaceDescriptor();
  if (cpuFallback) return run();
  // Watchdog: på vissa drivrutiner (SwiftShader, blocklistad GPU) hänger tfjs-webgl-
  // inferensen för evigt utan fel. Utan timeout snurrar "Läser ansikte…" oändligt.
  const raced = await Promise.race([run(), sleep(12000).then(() => DETECT_TIMEOUT)]);
  if (raced !== DETECT_TIMEOUT) return raced;
  cpuFallback = true;
  try { if (fa.tf?.setBackend) { await fa.tf.setBackend("cpu"); await fa.tf.ready(); } } catch { /* kör vidare ändå */ }
  return run();
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
  const c = input instanceof HTMLVideoElement ? scaleCanvas(input, 560) : scaleCanvas(input, 640);
  if (c.width < 32 || c.height < 32) return { ok: false, reason: "no_selfie_face" };
  const det = await detectOn(c, 320);
  if (!det) return { ok: false, reason: "no_selfie_face" };
  const ratio = faceAreaRatio(det, c.width, c.height);
  if (ratio < 0.018) return { ok: false, reason: "face_too_small" };
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

let tapLiveness = false;

export function stopLiveness() {
  if (liveAbort) liveAbort.abort();
  liveAbort = null;
}

export function requestLivenessTap() {
  tapLiveness = true;
}

async function blinkFromSamples(video, n = 12) {
  const ears = [];
  let last = null;
  for (let i = 0; i < n; i++) {
    try { last = await detectSelfieFace(video); }
    catch { last = { ok: false }; }
    if (last && last.ok) ears.push(last.ear);
    await sleep(45);
  }
  if (!last || !last.ok || ears.length < 3) return { ok: false, reason: "no_selfie_face" };
  const maxE = Math.max(...ears);
  const minE = Math.min(...ears);
  if (maxE >= 0.18 && minE <= maxE * 0.82) {
    return { ok: true, descriptor: last.descriptor, liveness: "blink" };
  }
  return { ok: false, reason: "timeout" };
}

export async function watchBlink(video, onStatus) {
  if (liveAbort) {
    liveAbort.abort();
    liveAbort = null;
  }
  const ac = new AbortController();
  liveAbort = ac;
  await loadFaceApi();
  const readyAt = Date.now();
  while (!ac.signal.aborted && !(video && video.videoWidth > 16) && Date.now() - readyAt < 5000) {
    await sleep(40);
  }
  let closed = 0;
  let openSeen = false;
  let openEar = 0;
  const started = Date.now();
  while (!ac.signal.aborted) {
    if (Date.now() - started > 60000) return { ok: false, reason: "timeout" };
    if (!video.videoWidth) {
      if (onStatus) onStatus("no_face");
      await sleep(80);
      continue;
    }
    if (tapLiveness) {
      tapLiveness = false;
      if (onStatus) onStatus("closed");
      const burst = await blinkFromSamples(video);
      if (ac.signal.aborted) return { ok: false, reason: "abort" };
      if (burst.ok) {
        if (onStatus) onStatus("ok");
        return burst;
      }
    }
    let rec;
    try { rec = await detectSelfieFace(video); }
    catch { rec = { ok: false }; }
    if (ac.signal.aborted) return { ok: false, reason: "abort" };
    if (!rec.ok) {
      closed = 0;
      if (onStatus) onStatus("no_face");
      await sleep(80);
      continue;
    }
    const e = rec.ear;
    const openCut = openEar > 0 ? Math.max(0.2, openEar * 0.88) : 0.2;
    const closeCut = openEar > 0 ? Math.min(0.19, openEar * 0.76) : 0.17;
    if (e > openCut) {
      openEar = Math.max(openEar * 0.6 + e * 0.4, e);
      openSeen = true;
      if (closed >= 1) {
        if (onStatus) onStatus("ok");
        return { ok: true, descriptor: rec.descriptor, liveness: "blink" };
      }
      closed = 0;
      if (onStatus) onStatus("blink");
    } else if (openSeen && e < closeCut) {
      closed += 1;
      if (onStatus) onStatus("closed");
    } else if (onStatus) onStatus("look");
    await sleep(55);
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
