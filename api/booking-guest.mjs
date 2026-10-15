import crypto from 'node:crypto';

const COOKIE = 'velvet_booking_guest';
// An opaque browser credential, separate from account authentication. Never expose it in JSON.
export function bookingGuest(req, res, create = false) {
  let token = String(req.headers.cookie || '').split(';').map(p => p.trim()).find(p => p.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!/^[a-f0-9]{64}$/.test(token || '')) {
    if (!create) return null;
    token = crypto.randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  }
  return 'guest:' + crypto.createHash('sha256').update(token).digest('hex');
}
