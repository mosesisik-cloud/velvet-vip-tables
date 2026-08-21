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
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      const v = g < 140 ? 0 : 255;
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
    { y: H * 0.68, h: H * 0.32, scale: 3 },
    { y: H * 0.78, h: H * 0.22, scale: 3.4 },
    { y: 0, h: H, scale: Math.min(2, 1800 / Math.max(W, H)) },
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

export function snapshotVideo(video, max = 2000, quality = 0.9) {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const s = Math.min(1, max / Math.max(vw, vh));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(vw * s));
  c.height = Math.max(1, Math.round(vh * s));
  c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

export async function startCamera(video, facing = "environment") {
  stopCamera();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: facing },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  camStream = stream;
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  video.muted = true;
  await video.play();
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
