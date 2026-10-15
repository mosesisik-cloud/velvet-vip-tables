import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const providers = {
  google: { issuer: ['https://accounts.google.com', 'accounts.google.com'], keys: 'https://www.googleapis.com/oauth2/v3/certs' },
  apple: { issuer: 'https://appleid.apple.com', keys: 'https://appleid.apple.com/auth/keys' },
};
const keySets = Object.fromEntries(Object.entries(providers).map(([name, p]) => [name, createRemoteJWKSet(new URL(p.keys), { timeoutDuration: 5000 })]));
export async function verifyIdentityToken(provider, token, audience, nonce, keys = keySets[provider]) {
  if (!providers[provider] || !audience || !nonce) throw new Error('oidc_configuration');
  const { payload } = await jwtVerify(token, keys, {
    issuer: providers[provider].issuer, audience, algorithms: ['RS256'],
    requiredClaims: ['sub', 'iat', 'exp', 'nonce'], clockTolerance: 5,
  });
  if (typeof payload.sub !== 'string' || !payload.sub || payload.nonce !== nonce ||
      (payload.azp && payload.azp !== audience)) throw new Error('oidc_claims');
  return payload;
}
export function newOAuthTransaction(provider) {
  const browser = randomBytes(32).toString('hex');
  return { browser, record: { provider, browserHash: digest(browser), nonce: randomBytes(32).toString('hex'), exp: Date.now() + 10 * 60 * 1000 } };
}
function digest(value) { return createHash('sha256').update(value).digest('hex'); }
export function validOAuthTransaction(record, provider, browser) {
  if (!record || record.provider !== provider || record.exp <= Date.now() || !record.browserHash || !browser) return false;
  const expected = Buffer.from(record.browserHash);
  const actual = Buffer.from(digest(browser));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function oauthCookie(provider, browser, publicApp, clear = false) {
  const secure = new URL(publicApp).protocol === 'https:';
  // Apple returns a cross-site POST: Lax would drop the transaction cookie.
  return `velvet_oauth_${provider}=${browser}; Path=/; HttpOnly; Max-Age=${clear ? 0 : 600}; SameSite=${secure ? 'None; Secure' : 'Lax'}`;
}
export function configuredOAuth(raw = {}, env = process.env) {
  const result = { ...raw };
  for (const provider of ['google', 'apple', 'facebook']) {
    const prefix = `VELVET_${provider.toUpperCase()}_CLIENT_`;
    result[provider] = { ...raw[provider], id: env[prefix + 'ID'] || raw[provider]?.id || '', secret: env[prefix + 'SECRET'] || raw[provider]?.secret || '' };
  }
  return result;
}
