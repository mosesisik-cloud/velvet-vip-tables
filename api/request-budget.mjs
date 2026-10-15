// Separate reads from writes so browsing restaurants cannot exhaust booking actions.
export class RequestBudget {
  entries = new Map();
  constructor(now = Date.now) { this.now = now; }
  take(ip, method, pathname) {
    const interactive = method === 'POST' && /^\/restaurant-bookings\/mirror\/(?:current|[a-f0-9-]{36}\/action)$/.test(pathname);
    const bucket = interactive ? 'mirror' : ['GET','HEAD'].includes(method) ? 'read' : 'write';
    const limit = bucket === 'write' ? 30 : 120;
    const now = this.now(), key = ip + ':' + bucket;
    let entry = this.entries.get(key);
    if (!entry || entry.reset <= now) { entry = {n:0,reset:now+60_000};this.entries.set(key,entry); }
    entry.n++;
    if (this.entries.size > 5000) for (const [k,v] of this.entries) if (v.reset <= now) this.entries.delete(k);
    return {allowed:entry.n<=limit,retryAfter:Math.max(1,Math.ceil((entry.reset-now)/1000))};
  }
}
