// Shared public assets only. Never cache provider API responses, HTML or guest data.
export class BookingAssetCache {
  entries = new Map();
  bytes = 0;
  hits = 0;
  served = new WeakSet();
  constructor({ maxBytes = 10 * 1024 * 1024, now = Date.now } = {}) { this.maxBytes = maxBytes; this.now = now; }
  eligible(request) {
    return request.method() === 'GET' && ['script', 'stylesheet', 'font'].includes(request.resourceType())
      && /\.(?:js|css|woff2?|ttf|otf)(?:$|\?)/i.test(request.url());
  }
  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expires <= this.now()) { this.bytes -= entry.body.length; this.entries.delete(key); return null; }
    this.hits++;
    return entry;
  }
  put(key, headers, body, status) {
    const cc = headers['cache-control'] || '';
    const age = Number(cc.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1]);
    if (status !== 200 || !age || /private|no-store|no-cache/i.test(cc) || headers['set-cookie']
      || /\*|cookie|authorization/i.test(headers.vary || '') || !/javascript|text\/css|font|woff|octet-stream/i.test(headers['content-type'] || '')
      || body.length > 1024 * 1024 || body.length > this.maxBytes) return;
    const old = this.entries.get(key); if (old) { this.bytes -= old.body.length; this.entries.delete(key); }
    while (this.bytes + body.length > this.maxBytes || this.entries.size >= 100) {
      const first = this.entries.keys().next().value;
      this.bytes -= this.entries.get(first).body.length; this.entries.delete(first);
    }
    // Playwright returns a decoded body; do not replay compressed transfer headers.
    const safeHeaders = {...headers};
    for (const name of ['content-encoding','content-length','transfer-encoding','connection']) delete safeHeaders[name];
    this.entries.set(key, { body, headers: safeHeaders, expires: this.now() + Math.min(age, 900) * 1000 });
    this.bytes += body.length;
  }
  async handle(route) {
    const request = route.request();
    if (!this.eligible(request)) return route.continue();
    const cached = this.get(request.url());
    if (cached) { this.served.add(request); return route.fulfill({status:200,headers:cached.headers,body:cached.body}); }
    // Preserve browser request interception for redirects and all booking traffic.
    return route.continue();
  }
  async capture(response) {
    const request = response.request();
    if (this.served.has(request) || !this.eligible(request) || response.status() !== 200) return;
    const headers = await response.allHeaders();
    if (!/max-age=/i.test(headers['cache-control'] || '') || headers['set-cookie']) return;
    this.put(request.url(), headers, await response.body(), response.status());
  }
}
