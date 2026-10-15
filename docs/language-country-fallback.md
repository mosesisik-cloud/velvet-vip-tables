# IP-country language fallback assessment

Read-only repository assessment, 15 October 2026. No environment files, credentials, secret configuration, customer IP addresses or third-party IP lookup services were accessed. No server configuration changed.

## Finding

There is no verified trusted country source in the inspected repository. Keep IP-country language fallback disabled until the deployed ingress trust boundary is established. This is an absence of local evidence, not proof that the production hosting provider has no geographic capability.

Evidence:

- `nginx.default.conf` serves static files on port 80. It has no `proxy_pass`, country header generation, GeoIP module configuration, `set_real_ip_from`, or incoming country-header sanitization.
- `api/server.mjs` uses Node's `http.createServer`, listening on `0.0.0.0`. No country header consumer, country inference or trusted proxy allowlist was found.
- `package.json` lists Playwright only; no GeoIP lookup dependency is declared. No `.mmdb` database was found in the repository file inventory.
- `deploy/Dockerfile.bokabord` installs the Node dependencies and Chromium. It installs no geographic database or explicit GeoIP package.
- The existing rate limiter in `api/server.mjs` reads the first `x-forwarded-for` value without validating a proxy chain. That implementation is not a trusted geographic source and should not be copied for language detection. Actual exposure depends on production ingress configuration, which was not established by these local files.

## Current recommendation

Preserve explicit user language first, then use the ordered supported browser language preferences. Retain the application's default when neither produces a supported language. Do not turn `CF-IPCountry`, `X-Country`, `CloudFront-Viewer-Country` or the first forwarded IP into a language decision merely because a client supplied that header. Do not add an external IP lookup request simply to choose interface language.

If a country fallback is later enabled, first verify a controlled ingress that strips any user-supplied country header, derives country from its authenticated connection metadata or locally maintained GeoIP data, and overwrites the downstream header. The application must accept it only from that ingress; direct origin access must not let clients impersonate it. Validate a small country-code allowlist and treat unknown/private/VPN/proxy cases as unknown. IP country is only a low-priority hint, never an override of a saved choice or useful browser preference.

For Velvet's Swedish/English interface, a deliberate product mapping could be `SE -> sv`, otherwise `en`, only after higher-priority choices are absent. Country is not a reliable statement of a person's language. Avoid logging raw IPs for this feature; country selection can be evaluated in memory. Country-dependent responses must not leak one visitor's preference through a shared response cache.

Before implementation, inspect the deployed reverse-proxy/CDN configuration through the existing administrative path without exposing secrets. Confirm header rewriting, trusted source ranges or private transport, and direct-origin restrictions. None of these deployment guarantees can be inferred from the static Nginx configuration in this repository.
