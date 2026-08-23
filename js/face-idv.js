/**
 * Face presence, blink liveness, and passport↔selfie match.
 * Same three checks ID apps use. Not a bank-grade vendor — photos still stored for Gabbe.
 */
const MODEL_URLS = [
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model",
  "https://unpkg.com/@vladmandic/face-api@1.7.15/model",
];
const SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js",
  "https://unpkg.com/@vladmandic/face-api@1.7.15/dist/face-api.js",
];
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
    let fa = window.faceapi;
    if (!fa) {
      let last = null;
      for (const src of SCRIPT_URLS) {
        try { fa = await loadScript(src); if (fa) break; }
        catch (e) { last = e; }
      }
      if (!fa) throw last || new Error("faceapi");
    }
    if (!fa.nets) throw new Error("faceapi");
    let modelsOk = false;
    let last = null;
    for (const base of MODEL_URLS) {
      try {
        await fa.nets.tinyFaceDetector.loadFromUri(base);
        await fa.nets.faceLandmark68Net.loadFromUri(base);
        await fa.nets.faceRecognitionNet.loadFromUri(base);
        modelsOk = true;
        break;
      } catch (e) { last = e; }
    }
    if (!modelsOk) throw last || new Error("faceapi");
    return fa;
  })();
  try {
    return await ready;
  } catch (e) {
    ready = null;
    throw e;
  }
}

export async function warmupFaceApi() {
  return loadFaceApi();
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
let detectCalls = 0;

async function detectOn(input, inputSize, { desc = true, scoreThreshold = 0.28 } = {}) {
  const fa = await loadFaceApi();
  const opts = new fa.TinyFaceDetectorOptions({ inputSize: inputSize || 320, scoreThreshold });
  const run = () => {
    const p = fa.detectSingleFace(input, opts).withFaceLandmarks();
    return desc ? p.withFaceDescriptor() : p;
  };
  detectCalls += 1;
  const ms = detectCalls === 1 ? 15000 : (cpuFallback ? 8000 : 6000);
  const raced = await Promise.race([run(), sleep(ms).then(() => DETECT_TIMEOUT)]);
  if (raced !== DETECT_TIMEOUT) return raced;
  if (!cpuFallback) {
    cpuFallback = true;
    try { if (fa.tf?.setBackend) { await fa.tf.setBackend("cpu"); await fa.tf.ready(); } } catch { /* kör vidare */ }
    const retry = await Promise.race([run(), sleep(8000).then(() => DETECT_TIMEOUT)]);
    if (retry !== DETECT_TIMEOUT) return retry;
  }
  return null;
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
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const tries = [
    full,
    cropCanvas(img, 0, 0, W * 0.52, H * 0.72),
    cropCanvas(img, 0, H * 0.08, W * 0.48, H * 0.62),
    cropCanvas(img, 0, H * 0.12, W * 0.42, H * 0.55),
    cropCanvas(img, W * 0.02, H * 0.18, W * 0.38, H * 0.5),
  ];
  let best = null;
  for (const c of tries) {
    const det = await detectOn(c, 416, { desc: true, scoreThreshold: 0.22 });
    if (!det || !det.descriptor) continue;
    const ratio = faceAreaRatio(det, c.width, c.height);
    if (ratio < 0.006) continue;
    if (!best || ratio > best.ratio) best = { det, ratio };
  }
  if (!best) return { ok: false, reason: "no_passport_face" };
  return {
    ok: true,
    descriptor: Array.from(best.det.descriptor),
    score: Number(best.det.detection.score.toFixed(3)),
  };
}

function landmarkRec(det, c) {
  if (!det) return { ok: false, reason: "no_selfie_face" };
  const ratio = faceAreaRatio(det, c.width, c.height);
  if (ratio < 0.014) return { ok: false, reason: "face_too_small" };
  const left = det.landmarks.getLeftEye();
  const right = det.landmarks.getRightEye();
  const e = (ear(left) + ear(right)) / 2;
  const box = det.detection.box;
  return {
    ok: true,
    descriptor: det.descriptor ? Array.from(det.descriptor) : null,
    score: Number(det.detection.score.toFixed(3)),
    ear: e,
    box,
    canvas: c,
  };
}

export async function detectSelfieLandmarks(input) {
  const c = input instanceof HTMLVideoElement ? scaleCanvas(input, 400) : scaleCanvas(input, 480);
  if (c.width < 32 || c.height < 32) return { ok: false, reason: "no_selfie_face" };
  const det = await detectOn(c, 224, { desc: false, scoreThreshold: 0.22 });
  return landmarkRec(det, c);
}

export async function detectSelfieFace(input) {
  const c = input instanceof HTMLVideoElement ? scaleCanvas(input, 560) : scaleCanvas(input, 640);
  if (c.width < 32 || c.height < 32) return { ok: false, reason: "no_selfie_face" };
  const det = await detectOn(c, 320, { desc: true, scoreThreshold: 0.25 });
  const rec = landmarkRec(det, c);
  if (!rec.ok || !rec.descriptor) return rec.ok ? { ...rec, ok: false, reason: "no_selfie_face" } : rec;
  return rec;
}

let tapLiveness = false;

export function stopLiveness() {
  if (liveAbort) liveAbort.abort();
  liveAbort = null;
}

export function requestLivenessTap() {
  tapLiveness = true;
}

function motionOf(boxes, canvasW) {
  if (!boxes.length) return 0;
  const xs = boxes.map((b) => b.x);
  const ys = boxes.map((b) => b.y);
  return (Math.max(...xs) - Math.min(...xs)) + (Math.max(...ys) - Math.min(...ys))
    > Math.max(6, (canvasW || 400) * 0.012);
}

async function captureDescriptor(video) {
  try {
    const full = await detectSelfieFace(video);
    if (full.ok && full.descriptor) return full;
  } catch { /* fall through */ }
  return null;
}

async function blinkFromSamples(video, n = 10) {
  const ears = [];
  const boxes = [];
  let last = null;
  for (let i = 0; i < n; i++) {
    try { last = await detectSelfieLandmarks(video); }
    catch { last = { ok: false }; }
    if (last && last.ok) {
      ears.push(last.ear);
      if (last.box) boxes.push(last.box);
    }
    await sleep(30);
  }
  if (!last || !last.ok || ears.length < 3) return { ok: false, reason: "no_selfie_face" };
  const maxE = Math.max(...ears);
  const minE = Math.min(...ears);
  const blinked = maxE >= 0.16 && minE <= maxE * 0.85;
  const moved = motionOf(boxes, last.canvas && last.canvas.width);
  if (!blinked && !moved) return { ok: false, reason: "timeout" };
  const full = await captureDescriptor(video);
  if (!full) return { ok: false, reason: "no_selfie_face" };
  return { ok: true, descriptor: full.descriptor, liveness: blinked ? "blink" : "tap" };
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
  while (!ac.signal.aborted && !(video && video.videoWidth > 16) && Date.now() - readyAt < 8000) {
    await sleep(40);
  }
  let closed = 0;
  let openSeen = false;
  let openEar = 0;
  const boxes = [];
  const started = Date.now();
  while (!ac.signal.aborted) {
    if (Date.now() - started > 45000) return { ok: false, reason: "timeout" };
    if (!video.videoWidth) {
      if (onStatus) onStatus("no_face");
      await sleep(60);
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
    try { rec = await detectSelfieLandmarks(video); }
    catch { rec = { ok: false }; }
    if (ac.signal.aborted) return { ok: false, reason: "abort" };
    if (!rec.ok) {
      closed = 0;
      if (onStatus) onStatus("no_face");
      await sleep(50);
      continue;
    }
    if (rec.box) {
      boxes.push(rec.box);
      if (boxes.length > 24) boxes.shift();
    }
    const e = rec.ear;
    const openCut = openEar > 0 ? Math.max(0.18, openEar * 0.86) : 0.18;
    const closeCut = openEar > 0 ? Math.min(0.18, openEar * 0.78) : 0.16;
    if (e > openCut) {
      openEar = Math.max(openEar * 0.55 + e * 0.45, e);
      openSeen = true;
      if (closed >= 1) {
        if (onStatus) onStatus("ok");
        const full = rec.descriptor ? rec : await captureDescriptor(video);
        if (!full || !full.descriptor) return { ok: false, reason: "no_selfie_face" };
        return { ok: true, descriptor: full.descriptor, liveness: "blink" };
      }
      closed = 0;
      if (onStatus) onStatus("blink");
    } else if (openSeen && e < closeCut) {
      closed += 1;
      if (onStatus) onStatus("closed");
    } else if (onStatus) onStatus("look");
    await sleep(35);
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
  const liveKind = live && live.liveness;
  return {
    passportFace: !!(pass && pass.ok),
    selfieFace: !!(live && live.ok),
    liveness: !!(live && live.ok && (liveKind === "blink" || liveKind === "tap")),
    matchDistance: match ? match.distance : null,
    matchOk: !!(match && match.matchOk),
  };
}
