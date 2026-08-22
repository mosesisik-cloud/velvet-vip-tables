import { extractMrzFromText } from "./mrz.js";

let worker = null;
let workerBusy = false;
let camStream = null;

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
  const T = await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
  worker = await T.createWorker("eng", 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    tessedit_pageseg_mode: "6",
  });
  return worker;
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

async function ocrCanvas(c) {
  const w = await tess();
  workerBusy = true;
  try {
    const { data } = await w.recognize(c);
    return data && data.text ? data.text : "";
  } finally {
    workerBusy = false;
  }
}

export async function readPassportMrz(dataUrl) {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const bands = [
    { y: H * 0.62, h: H * 0.38, scale: 3.2 },
    { y: H * 0.72, h: H * 0.28, scale: 3.6 },
    { y: H * 0.80, h: H * 0.20, scale: 4 },
    { y: 0, h: H, scale: Math.min(2.2, 2200 / Math.max(W, H)) },
  ];
  let best = null;
  for (const b of bands) {
    const crop = canvasFrom(img, 0, b.y, W, b.h, b.scale, true);
    const text = await ocrCanvas(crop);
    const rec = extractMrzFromText(text);
    if (rec && rec.valid) return rec;
    if (rec && rec.checksumsOk) best = rec;
    if (rec && !best) best = rec;
    const top = canvasFrom(img, 0, b.y, W, b.h * 0.5, b.scale, true);
    const bot = canvasFrom(img, 0, b.y + b.h * 0.45, W, b.h * 0.55, b.scale, true);
    const joined = (await ocrCanvas(top)) + "\n" + (await ocrCanvas(bot));
    const rec2 = extractMrzFromText(joined);
    if (rec2 && rec2.valid) return rec2;
    if (rec2 && rec2.checksumsOk) best = rec2;
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

export async function startCamera(video, facing = "environment") {
  stopCamera();
  await new Promise((r) => setTimeout(r, 150));
  const front = facing === "user";
  // Inte 1920×1080 på selfie — bakkameran vinner då ofta över facingMode.
  const tries = front
    ? [
        { facingMode: { exact: "user" } },
        { facingMode: "user" },
        { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      ]
    : [
        { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: { ideal: "continuous" } },
        { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: { ideal: "continuous" } },
        { facingMode: { ideal: "environment" } },
      ];
  let stream = null;
  for (const spec of tries) {
    try {
      stream = await gum(spec);
      const got = camFacingOf(stream);
      if (front && got && got !== "user") {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        continue;
      }
      if (!front && got === "user") {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        continue;
      }
      break;
    } catch { /* next */ }
  }
  if (!stream) stream = await cameraByLabel(front);
  if (!stream) stream = await gum(true);
  camStream = stream;
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  video.muted = true;
  await video.play();
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
