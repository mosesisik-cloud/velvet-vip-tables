import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export class BookingRegister {
  constructor(file) {
    fs.mkdirSync(path.dirname(file),{recursive:true});
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, owner TEXT NOT NULL, status TEXT NOT NULL, updated TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS booking_owner ON bookings(owner, updated);');
    try {fs.chmodSync(file,0o600);} catch {}
  }
  upsert(row) {
    // Persist only booking metadata. Never arbitrary provider payloads or card fields.
    const clean = {};
    for (const key of ['id','userId','restaurantId','restaurant','destination','date','time','party','provider','providerReference','status','createdAt','updatedAt','providerConfirmedAt','requestMode']) if (row[key] !== undefined) clean[key] = row[key];
    if (Number.isSafeInteger(row.roomId) && row.roomId > 0 && typeof row.roomName === 'string'
      && row.roomName.trim() && row.roomName.length <= 256 && !/[\x00-\x1f\x7f]/.test(row.roomName)) {
      clean.roomId=row.roomId; clean.roomName=row.roomName;
    }
    if (!clean.id || !clean.userId || !clean.status) return;
    this.db.prepare('INSERT INTO bookings VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated=excluded.updated,payload=excluded.payload WHERE bookings.owner=excluded.owner').run(clean.id,clean.userId,clean.status,clean.updatedAt || clean.createdAt,JSON.stringify(clean));
    return clean;
  }
  report(owner, restaurantId, restaurant, body) {
    const date=String(body.date||''),time=String(body.time||''),party=Number(body.party),reference=String(body.reference||'').trim();
    const parsed=new Date(date+'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0,10)!==date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isInteger(party) || party<1 || party>100 || !/^[\p{L}\p{N} _.-]{2,100}$/u.test(reference)) throw new Error('invalid_report');
    const id='GR-'+crypto.createHash('sha256').update(JSON.stringify([owner,restaurantId,reference])).digest('hex').slice(0,24);
    const existing=this.db.prepare('SELECT payload FROM bookings WHERE id=? AND owner=?').get(id,owner);
    if(existing) return JSON.parse(existing.payload);
    const now=new Date().toISOString();
    return this.upsert({id,userId:owner,restaurantId,restaurant:restaurant.name,destination:restaurant.city,date,time,party,provider:restaurant.provider,providerReference:reference,status:'guest_reported',createdAt:now,updatedAt:now,requestMode:'guest_reported'});
  }
  list(owners, operator=false) {
    const unique=[...new Set(owners.filter(Boolean))];
    if(!operator&&!unique.length)return [];
    const query=operator?'SELECT payload FROM bookings ORDER BY updated DESC LIMIT 100':`SELECT payload FROM bookings WHERE owner IN (${unique.map(()=>'?').join(',')}) ORDER BY updated DESC LIMIT 100`;
    return this.db.prepare(query).all(...(operator?[]:unique)).map(r=>JSON.parse(r.payload));
  }
  close(){this.db.close();}
}
