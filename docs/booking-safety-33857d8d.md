# Bokabord safety review for provider reuse — issue 129

Owner: `codex-worker-33857d8d-6772-434c-a27e-a1eee7f786fa`, chat `01a141e4-a9ca-73a3-abf7-566167c993e1`. Master approved exactly this report and `scripts/test-booking-safety-33857d8d.mjs`; runtime remains read-only. Reviewed main `7c0e45dc34dc997ffcdc6a73f05294ecec264972`, 2026-10-16. Integrator owns fixes, routing and the shared contract. Zenchef, SevenRooms and UI owners consume the requirements below.

## Decision

Do not treat the Bokabord implementation as a complete reusable safety contract yet. Two failure paths are reproduced against its actual class methods with an inert browser fixture. The durable submission gate and pending-session capacity controls withstand the specific concurrent probes below. No provider browser or real network is opened by these tests; they are not Playwright end-to-end or supplier-confirmation evidence.

## Reproduced findings

### P1 — missing or unknown supplier status is promoted to confirmed

`api/bokabord-mirror.mjs:116-118` accepts `success:true` plus positive booking ID, then classifies every status except numeric zero as confirmed. Injecting a response with missing status, `unrecognized`, -1 or 99 produces `confirmed` and a reference. The test invokes the actual response listener installed by `create`; no response classifier is reimplemented. The provider's real status vocabulary has not been established by this test, so it deliberately does not assert that any particular nonzero numeric status is valid.

Minimum fix: provider-specific response schema and an explicit, documented set of terminal confirmed statuses, bound to the attempted request/venue. Missing, malformed, unexpected or mismatched responses stay unknown. Do not equate a positive reference or successful HTTP/JSON response with restaurant acceptance. UI must never promote unknown or payment-required to confirmed. Payment-required needs its own supported, authorized flow; the present pilot does not perform payments.

### P2 — failed submit can resume an actionable snapshot with no result

`api/bokabord-mirror.mjs:185-189` returns `lastSnapshot` unchanged. When a final click throws after request transmission, `action` exits before its final snapshot and only clears armed/busy in `finally`. The session has submitted=true/result=unknown, but `current(owner)` can return canSubmit=true/result=null from before submission. Server resume uses this snapshot at `api/server.mjs:1935-1943`.

The fixture simulates precisely that interruption at the browser click boundary. A second submit in the SAME session is rejected as already_attempted: this is a stale recovery/UI state finding, not a demonstrated duplicate booking. Minimum fix: atomically invalidate actionable snapshots when the durable attempt is reserved, overlay current attempt/result on resume even when screenshot capture fails, and expose an owned durable attempt lookup after TTL/restart. Polling must observe/reconcile, never resubmit. UI should retain an unknown-result state and instruct against retry until reconciliation.

## Contract gaps and deployment conditions

These are bounded observations, not claims that a provider currently exploits them.

- **Owner transition:** ledger key at `api/bokabord-ledger.mjs:8-9` includes owner. The server chooses account ID over guest identity at `api/server.mjs:1930`. Same restaurant/date/time/party under a guest owner and a later account owner generate different keys. Account transition therefore does not inherit the earlier idempotency lock. Decide an explicit secure guest-to-account attempt handoff; do not globally deduplicate guests using names/contact data. Backend-issued durable attempt ID must survive UI retries, reloads and ownership handoff, with access checks preserved.
- **Hold boundary:** `allowedRequest` at `api/bokabord-mirror.mjs:16-24` allows arbitrary GET/HEAD on approved provider hosts except a pathname denylist. A synthetic GET `/reservation/api/booking/hold` is allowed. This does NOT prove that endpoint exists or writes. New adapters need a reviewed method/path/body request matrix, fail-closed unknown endpoints and service workers blocked; GET is not independently sufficient evidence of read-only behavior. Actual provider hold endpoints and redirect chains require separately authorized research, not speculative calls.
- **Rate limit deployment condition:** exact `rateLimited` source at `api/server.mjs:1892-1898` skips budget evaluation for loopback peers before considering forwarded client IP. A VM invocation of that function proves no budget call for loopback plus an external forwarded address. If production reverse proxy connects over loopback, upstream limiting must be verified or this bypass removed with a trusted-proxy policy. Deployment topology was not inspected; no production exposure is claimed. Four-session capacity is not a substitute for per-owner/rate budgets, and budgets/capacity must be shared or explicitly partitioned across workers.
- **Provider-neutral persistence:** `api/bokabord-ledger.mjs:15` hardcodes BokaBord/Stockholm. Do not reuse the row unchanged for Zenchef/SevenRooms. Pin provider, restaurant and approved selection in the attempt record; atomic reserve must fail closed before any request may continue. Session expiry/deletion must not erase the attempt. Current exclusive file creation protects repeated reservations using the same key and shared directory; independent stores/replicas need a common atomic arbiter. Record updates use rename without an explicit fsync of replacement/directory: abrupt power-loss durability was not tested. Keep these limits explicit when choosing production persistence.

## Reuse requirements by owner

| Owner | Required behavior and acceptance evidence |
| --- | --- |
| Integrator | Authenticated/guest owner derived server-side; revision-bound approval; atomic durable attempt before send; no implicit retries; owned current/attempt recovery after timeout/restart; provider-neutral record and canonical state mapping. Include guest/account transition and multiworker persistence decisions. |
| Zenchef / SevenRooms | Read-only exploration with exact request matrix; explicit hold boundary; no unauthorized hold before confirm; single permitted submission bound to approved venue/date/time/party/contact/terms; documented supplier response classification. Unknown outcomes remain unknown. No CAPTCHA/access-control bypass. |
| UI | Consent reset after edits/revision changes; use fresh approval fingerprint; submitted/unknown/payment-required/rejected/confirmed separate; recovery never shows stale submit permission; payment or unsupported handoff is not a completed Velvet booking. |
| Release / infrastructure | Verify trusted-proxy rate limiting, shared attempt storage, process capacity and safe shutdown/recovery. Deployment and supplier-confirmed completion remain separate states. |

Preserve existing safeguards: isolated browser contexts, no arbitrary client URL, serviceWorkers:block, owner/revision/busy checks, matching approved payload with no marketing/products/waitlist, finally disarming, bounded pending sessions, and durable reserve before route.continue. The hooks are security-critical contracts, not optional logging. A no-op reserve hook is not production-safe.

## Validation and reproducibility

- `node --test api/test-zink-playwright.mjs`: **11/11 pass**, unchanged existing suite.
- `node --test scripts/test-booking-safety-33857d8d.mjs`: **7/7 characterization checks pass**. Passing here reproduces the documented unsafe behavior; it is NOT release acceptance.
- Set `VELVET_SAFETY_ENFORCE=1` and run the new script: **5 pass / 2 fail**, intentionally asserting the desired fail-closed status and recovery behavior. These two failures are the actionable blockers above. Do not suppress them as flakes. After fixes, update/remove the old-behavior characterization assertions under the same owner coordination.
- Concurrent actual route-handler calls using the real ledger permit one mocked transmission, abort the other, preserve one unknown record and reject the same key after ledger restart.
- Four pending browser creations block a fifth, reject a duplicate owner and release all pending counters after simulated failure.
- VM test executes only the extracted rate-limit function, never starts the server. The synthetic hold-path check performs no request.

An initial local test-harness failure from CRLF function extraction was corrected before final results. Browser/HTTP boundaries are inert fixtures; fetch is disabled. No real reservations, holds, payments, guest data, restaurant messages or access-control circumvention. No shared runtime file changed. No merge or deployment approval. Draft delivery is appropriate until integrator resolves the two failing safety expectations.
