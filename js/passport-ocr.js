import { extractMrzFromText } from "./mrz.js";

let worker = null;
let workerBusy = false;
let camStream = null;

const TESS_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js",
  "https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => reject(new Error("tesseract"));
    document.head.appendChild(s);
  });
}

async function tess() {
  if (worker) return worker;
  let T = window.Tesseract;
  if (!T) {
    let last = null;
    for (const src of TESS_SCRIPTS) {
      try { T = await loadScript(src); if (T) break; }
      catch (e) { last = e; }
    }
    if (!T) throw last || new Error("tesseract");
  }
  worker = await T.createWorker("eng", 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    tessedit_pageseg_mode: "6",
  });
  return worker;
}

export async function warmupOcr() {
  try { await tess(); } catch { /* verify page still works; readShot reports fail */ }
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}

function canvasFrom(img, sx, sy, sw, sh, scale, enhance) {
  const w = Math.max(32, Math.round(sw * scale));
  const h = Math.max(16, Math.round(sh * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  if (enhance) {
    const data = ctx.getImageData(0, 0, w, h);
    const d = data.data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const span = Math.max(1, max - min);
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      const n = (g - min) / span;
      const v = n < 0.46 ? 0 : n > 0.58 ? 255 : Math.round(n * 255);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
  }
  return c;
}

function invertCanvas(src) {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(src, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function rotateCanvas(src, deg) {
  if (!deg) return src;
  const r = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(src.width * cos + src.height * sin));
  c.height = Math.max(1, Math.round(src.width * sin + src.height * cos));
  const ctx = c.getContext("2d");
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(r);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

async function ocrCanvas(c, psm) {
  const w = await tess();
  workerBusy = true;
  try {
    if (psm) await w.setParameters({ tessedit_pageseg_mode: String(psm) });
    const { data } = await w.recognize(c);
    return data && data.text ? data.text : "";
  } finally {
    workerBusy = false;
  }
}

function keepBest(best, rec) {
  if (!rec) return best;
  if (rec.valid) return rec;
  if (!best) return rec;
  if (rec.checksumsOk && !best.checksumsOk) return rec;
  if ((rec.reasons || []).length < (best.reasons || []).length) return rec;
  return best;
}

export async function readPassportMrz(dataUrl) {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const bands = [
    { y: H * 0.84, h: H * 0.16, scale: 4.2 },
    { y: H * 0.78, h: H * 0.22, scale: 4 },
    { y: H * 0.70, h: H * 0.30, scale: 3.6 },
    { y: H * 0.58, h: H * 0.42, scale: 3.2 },
    { y: 0, h: H, scale: Math.min(2.2, 2200 / Math.max(W, H)) },
  ];
  let best = null;
  for (const b of bands) {
    const crop = canvasFrom(img, 0, b.y, W, b.h, b.scale, true);
    for (const v of [crop, invertCanvas(crop)]) {
      const text = await ocrCanvas(v, 6);
      best = keepBest(best, extractMrzFromText(text));
      if (best && best.valid) return best;
    }
    const top = canvasFrom(img, 0, b.y, W, b.h * 0.5, b.scale, true);
    const bot = canvasFrom(img, 0, b.y + b.h * 0.45, W, b.h * 0.55, b.scale, true);
    const joined = (await ocrCanvas(top, 7)) + "\n" + (await ocrCanvas(bot, 7));
    best = keepBest(best, extractMrzFromText(joined));
    if (best && best.valid) return best;
  }
  if (!best || !best.valid) {
    const crop = canvasFrom(img, 0, H * 0.70, W, H * 0.30, 3.6, true);
    for (const deg of [-3, 3, -6, 6]) {
      const text = await ocrCanvas(rotateCanvas(crop, deg), 6);
      best = keepBest(best, extractMrzFromText(text));
      if (best && best.valid) return best;
    }
  }
  return best;
}

export async function jpegFromFile(file, max = 2000, quality = 0.9) {
  if (!file || !String(file.type || "").startsWith("image/")) throw new Error("image");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * s));
    c.height = Math.max(1, Math.round(img.height * s));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function snapshotVideo(video, max = 3200, quality = 0.92) {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const s = Math.min(1, max / Math.max(vw, vh));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(vw * s));
  c.height = Math.max(1, Math.round(vh * s));
  c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

async function jpegFromBlob(blob, max = 3200, quality = 0.92) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImg(url);
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * s));
    c.height = Math.max(1, Math.round(img.height * s));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureStill(video) {
  const track = camStream && camStream.getVideoTracks()[0];
  if (track && typeof ImageCapture === "function") {
    try {
      const photo = await new ImageCapture(track).takePhoto();
      if (photo) return await jpegFromBlob(photo, 3600, 0.92);
    } catch { /* video frame fallback */ }
  }
  return snapshotVideo(video, 3200, 0.92);
}

function camTrack() {
  return camStream && camStream.getVideoTracks()[0];
}

export async function applyAutofocus() {
  const track = camTrack();
  if (!track || typeof track.getCapabilities !== "function") return;
  try {
    const caps = track.getCapabilities() || {};
    const adv = {};
    const modes = caps.focusMode || [];
    if (modes.includes("continuous")) adv.focusMode = "continuous";
    else if (modes.includes("single-shot")) adv.focusMode = "single-shot";
    if (caps.zoom && caps.zoom.max > 1) {
      const min = Number(caps.zoom.min) || 1;
      const max = Number(caps.zoom.max) || 1;
      adv.zoom = Math.min(max, Math.max(min, 1.15));
    }
    if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
  } catch { /* Safari often saknar focus constraints */ }
}

export async function focusAt(video, clientX, clientY) {
  const track = camTrack();
  if (!track || !video) return;
  const r = video.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
  const y = Math.min(1, Math.max(0, (clientY - r.top) / Math.max(1, r.height)));
  try {
    const caps = typeof track.getCapabilities === "function" ? (track.getCapabilities() || {}) : {};
    const adv = {};
    if (caps.pointsOfInterest) adv.pointsOfInterest = [{ x, y }];
    const modes = caps.focusMode || [];
    if (modes.includes("single-shot")) adv.focusMode = "single-shot";
    else if (modes.includes("continuous")) adv.focusMode = "continuous";
    if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
  } catch { /* ignore */ }
}

function camFacingOf(stream) {
  try {
    return String(stream.getVideoTracks()[0]?.getSettings?.().facingMode || "");
  } catch { return ""; }
}

async function gum(videoConstraint) {
  return navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraint });
}

async function cameraByLabel(front) {
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    const cams = list.filter((d) => d.kind === "videoinput");
    const hit = cams.find((d) => {
      const n = String(d.label || "").toLowerCase();
      return front
        ? /front|user|selfie|facing.?user/.test(n)
        : /back|rear|environment|facing.?environment|world/.test(n);
    });
    if (!hit?.deviceId) return null;
    return gum({ deviceId: { exact: hit.deviceId } });
  } catch {
    return null;
  }
}

function prepVideoEl(video) {
  if (!video) return;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
}

export async function waitForVideo(video, ms = 6000) {
  if (!video) throw new Error("video");
  if (video.videoWidth > 16 && !video.paused) return;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (video.videoWidth > 16) {
      try { await video.play(); } catch { /* playing */ }
      if (video.videoWidth > 16) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!(video.videoWidth > 16)) throw new Error("video");
}

export async function startCamera(video, facing = "environment") {
  stopCamera();
  await new Promise((r) => setTimeout(r, 80));
  const front = facing === "user";
  prepVideoEl(video);
  // Inte 1920×1080 på selfie — bakkameran vinner då ofta över facingMode.
  const tries = front
    ? [
        { facingMode: { ideal: "user" } },
        { facingMode: "user" },
        { facingMode: { exact: "user" } },
      ]
    : [
        { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: { ideal: "continuous" } },
        { facingMode: "environment" },
        { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      ];
  let stream = null;
  for (const spec of tries) {
    try {
      stream = await gum(spec);
      break;
    } catch { /* next */ }
  }
  if (!stream) stream = await cameraByLabel(front);
  if (!stream) {
    try { stream = await gum(true); } catch { /* none */ }
  }
  if (!stream) throw new Error("camera");
  // iOS: device labels are empty until after the first permission. Prefer a
  // labeled front camera when we asked for a selfie, but never throw away a
  // working stream if the switch fails — that was the live-selfie black hole.
  const got = camFacingOf(stream);
  if (front && got === "environment") {
    const labeled = await cameraByLabel(true);
    if (labeled) {
      stream.getTracks().forEach((t) => t.stop());
      stream = labeled;
    } else {
      try {
        const retry = await gum({ facingMode: { exact: "user" } });
        if (retry) {
          stream.getTracks().forEach((t) => t.stop());
          stream = retry;
        }
      } catch { /* keep the working stream */ }
    }
  }
  camStream = stream;
  video.srcObject = stream;
  prepVideoEl(video);
  try {
    await video.play();
  } catch {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("play")), 6000);
      video.addEventListener("loadedmetadata", () => {
        video.play().then(() => { clearTimeout(t); resolve(); }, (e) => { clearTimeout(t); reject(e); });
      }, { once: true });
    });
  }
  await waitForVideo(video).catch(() => {});
  if (!front) await applyAutofocus();
  return stream;
}

export function stopCamera() {
  if (!camStream) return;
  camStream.getTracks().forEach((t) => t.stop());
  camStream = null;
}

export function cameraBusy() {
  return workerBusy;
}
