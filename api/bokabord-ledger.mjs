import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Durable reservation before network transmission. Unknown outcomes stay blocked.
export class BookingLedger {
  constructor(directory) { this.directory = directory; }
  key(approval, session) {
    return crypto.createHash('sha256').update(JSON.stringify([session.owner, session.restaurantId, approval.date, approval.time, approval.party])).digest('hex');
  }
  reserve(approval, session) {
    fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const key = this.key(approval, session);
    const now = new Date().toISOString();
    const row = { id: `RB-${key.slice(0,24)}`, userId: session.owner, restaurantId: session.restaurantId, restaurant: session.restaurant, destination: 'Stockholm', date: approval.date, time: approval.time, party: approval.party, provider: 'BokaBord', status: 'unknown', createdAt: now, updatedAt: now };
    const fd = fs.openSync(path.join(this.directory, `${key}.json`), 'wx', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify(row)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    session.ledgerKey = key;
  }
  record(session) {
    if (!session.ledgerKey) return;
    const file = path.join(this.directory, `${session.ledgerKey}.json`);
    const row = JSON.parse(fs.readFileSync(file, 'utf8'));
    row.status = session.result.status;
    row.providerReference = session.result.reference || '';
    row.updatedAt = new Date().toISOString();
    const tmp = `${file}.next`;
    fs.writeFileSync(tmp, JSON.stringify(row), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  list() {
    if (!fs.existsSync(this.directory)) return [];
    return fs.readdirSync(this.directory).filter(n => /^[a-f0-9]{64}\.json$/.test(n)).flatMap(n => {
      try { return [JSON.parse(fs.readFileSync(path.join(this.directory, n), 'utf8'))]; } catch { return []; }
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}
