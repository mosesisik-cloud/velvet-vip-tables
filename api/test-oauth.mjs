import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from 'jose';
import { verifyIdentityToken, newOAuthTransaction, validOAuthTransaction, oauthCookie, configuredOAuth } from './oauth-security.mjs';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
jwk.kid = 'test';
const keys = createLocalJWKSet({ keys: [jwk] });
async function token(overrides = {}, key = privateKey) {
  return new SignJWT({ sub: '123', nonce: 'nonce', iss: 'https://accounts.google.com', aud: 'velvet', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+300, ...overrides }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(key);
}
test('Google and Apple signed identities are accepted', async () => {
  assert.equal((await verifyIdentityToken('google', await token(), 'velvet', 'nonce', keys)).sub, '123');
  assert.equal((await verifyIdentityToken('apple', await token({iss:'https://appleid.apple.com'}), 'velvet', 'nonce', keys)).sub, '123');
});
test('reject forged signature and invalid identity claims', async () => {
  const wrong = await generateKeyPair('RS256');
  await assert.rejects(verifyIdentityToken('google', await token({},wrong.privateKey), 'velvet', 'nonce', keys));
  for (const claims of [{iss:'https://evil.example'}, {aud:'another-app'}, {exp:1}, {exp:undefined}, {nonce:undefined}, {nonce:'wrong'}, {sub:''}, {azp:'another-app'}]) {
    await assert.rejects(verifyIdentityToken('google', await token(claims), 'velvet', 'nonce', keys));
  }
});
test('transaction binds provider, browser and expiry', () => {
  const {record,browser} = newOAuthTransaction('google');
  assert.ok(validOAuthTransaction(record,'google',browser));
  assert.equal(validOAuthTransaction(record,'apple',browser),false);
  assert.equal(validOAuthTransaction(record,'google','wrong'),false);
  assert.equal(validOAuthTransaction(record,'google',''),false);
  assert.equal(validOAuthTransaction({...record,exp:1},'google',browser),false);
});
test('Apple cross-site POST cookie is secure, HttpOnly and expires', () => {
  assert.match(oauthCookie('apple','test','https://velvet.example'), /HttpOnly; Max-Age=600; SameSite=None; Secure/);
  assert.match(oauthCookie('apple','','https://velvet.example',true), /Max-Age=0/);
});
test('environment overrides local credentials without changing stored configuration', () => {
  const raw={google:{id:'old',secret:'stored'}};
  const result=configuredOAuth(raw,{VELVET_GOOGLE_CLIENT_ID:'new'});
  assert.equal(result.google.id,'new'); assert.equal(result.google.secret,'stored'); assert.equal(raw.google.id,'old');
});
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('HTTP routes reject stolen state, consume denied state, and disallow URL bearer sessions', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'velvet-oauth-'));
  const port = 19843;
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['api/server.mjs'], { env: { ...process.env, PORT:String(port), VELVET_DATA:path.join(dir,'store.json'), VELVET_PAY:path.join(dir,'pay.json'), VELVET_IDV:path.join(dir,'idv'), VELVET_CRAWL:'0', VELVET_RATE:'0', VELVET_GOOGLE_CLIENT_ID:'test-client', VELVET_GOOGLE_CLIENT_SECRET:'test-secret', VELVET_APPLE_CLIENT_ID:'test-apple', VELVET_APPLE_CLIENT_SECRET:'test-secret' }, stdio:'ignore' });
  try {
    let ready=false;
    for(let i=0;i<60;i++) { try { await fetch(base+'/pay/config'); ready=true; break; } catch { await new Promise(r=>setTimeout(r,100)); } }
    assert.ok(ready,'test API started');
    for (const provider of ['google','apple']) {
      const start=await fetch(base+'/auth/start/'+provider);
      assert.equal(start.status,200);
      const cookie=start.headers.get('set-cookie').split(';')[0];
      const auth=new URL((await start.json()).url);
      assert.ok(auth.searchParams.get('nonce'));
      const params=new URLSearchParams({state:auth.searchParams.get('state'),error:'access_denied'});
      const callback=async (cookieHeader='')=>fetch(base+'/auth/callback/'+provider+(provider==='google'?'?'+params:''),{method:provider==='apple'?'POST':'GET',headers:{Cookie:cookieHeader,'Content-Type':'application/x-www-form-urlencoded'},...(provider==='apple'?{body:params}:{}),redirect:'manual'});
      assert.match((await callback()).headers.get('location'),/auth_error=state/);
      assert.match((await callback(cookie)).headers.get('location'),/auth_error=denied/);
      assert.match((await callback(cookie)).headers.get('location'),/auth_error=state/);
    }
    assert.equal((await fetch(base+'/auth/session?token=any-token')).status,401);
  } finally {
    const stopped = new Promise(resolve=>child.once('exit',resolve));
    child.kill(); await stopped;
    await rm(dir,{recursive:true,force:true});
  }
});
