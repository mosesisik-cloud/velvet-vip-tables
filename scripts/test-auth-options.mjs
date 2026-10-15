import assert from 'node:assert/strict';
import { AUTH_PROVIDERS, authOptions, authCopy } from '../js/auth-options.js';

const supported = { hostname:'b2b.bakemyday.se', secureContext:true, publicKeyCredential:true, credentials:true };
const disabled = { oauth:Object.fromEntries(AUTH_PROVIDERS.map(id => [id, false])) };
const configured = { oauth:{ ...disabled.oauth, google:true, apple:true } };
assert.deepEqual(authOptions(configured, supported).providers, ['google', 'apple']);
assert.equal(authOptions(disabled, supported).providerState, 'ready');
assert.deepEqual(authOptions(disabled, supported).providers, [], 'configured off is distinct from a read failure');
for (const invalid of [null, {}, {error:'server'}, {oauth:{}}, {oauth:{google:'true'}}]) {
  assert.equal(authOptions(invalid, supported).providerState, 'error');
  assert.deepEqual(authOptions(invalid, supported).providers, []);
}
assert.deepEqual(authOptions({oauth:{google:true,apple:'true',unknown:true}}, supported).providers, ['google'], 'only known providers with explicit boolean readiness may be offered');
assert.equal(authOptions(null, supported).passkey, true, 'an OAuth config failure must not remove supported passkeys');
for (const hostname of ['b2b.bakemyday.se', 'localhost', '127.0.0.1']) assert.equal(authOptions(disabled,{...supported,hostname}).passkey, true);
for (const hostname of ['preview.example.com', 'b2b.bakemyday.se.evil.test', 'localhost.evil.test']) {
  assert.equal(authOptions(configured,{...supported,hostname}).passkey, false);
  assert.equal(authOptions(configured,{...supported,hostname}).passkeyReason, 'hostUnsupported');
}
for (const capability of ['secureContext','publicKeyCredential','credentials']) {
  const options = authOptions(configured,{...supported,[capability]:false});
  assert.equal(options.passkey,false);
  assert.equal(options.passkeyReason,'browserUnsupported');
  assert.deepEqual(options.providers,['google','apple'], 'unsupported passkeys do not suppress configured OAuth');
}
for (const lang of ['sv','en','es','fr']) {
  for (const key of ['intro','passkey','passkeyHint','hostUnsupported','browserUnsupported','loading','error','empty','retry','continueWith','failed']) assert.notEqual(authCopy(key,lang),key);
  assert.ok(authCopy('continueWith',lang).includes('{provider}'));
}
assert.equal(authCopy('retry','unsupported-language'),authCopy('retry','en'));
console.log('PASS auth options: explicit provider readiness, read failure vs disabled, supported host/browser, independent passkey fallback and four languages.');
