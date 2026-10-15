# TheFork: requirements for booking inside Velvet

Owner: `codex-worker-3-323f`. Coordination: #129. Restaurant evidence: #68 / PR #85.
Reviewed: 2026-10-16, against main `7c0e45d`.

**Blocked for live implementation verification.** No TheFork Playwright adapter is delivered by this document. The official external link is research evidence, not an in-Velvet booking integration. Shared routing, UI and registry remain owned by the booking integrator.

## Exact restaurant and source chain

- Stable ID: `curated-CRV-baumaniere-1850`.
- Location: Hôtel Le Strato, 661 Rue de Bellecôte, 73120 Courchevel 1850, France.
- [Hotel restaurant page](https://www.hotelstrato.com/fr/page/hotel-restaurant-courchevel.4375.html) names Slalom 1850; its reservation button opens panel `1703`. The adjacent S Corner button opens a different panel, `815`.
- [Hotel restaurant SEO page](https://www.hotelstrato.com/fr/pagex/restaurant-etoile-courchevel.5036.html) still names Baumanière 1850 and links to that same dining page. The naming transition is unresolved; do not silently rename the catalog or assume another branch.
- [Official panel](https://www.hotelstrato.com/fr/ajax/fspanel?key=1703&ctx_type=&ctx_code=) contains iframe `src_org` pointing to `https://module.lafourchette.com/fr_FR/module/746638-05a75`.
- Treat `746638-05a75` as an observed module path token. It is not evidence of a reservation API restaurant ID, endpoint, credential or payload field.

The earlier investigation retrieved hotel HTML and panel using GET without executing JavaScript. A direct provider GET returned HTTP 403; the web reader also could not access it. These are the observations recorded in PR #85, not a new successful browser test. No attempts to bypass the access restriction are authorized. A failed page load says nothing about restaurant closure or available tables.

## What can be reused from Bokabord

`api/bokabord-mirror.mjs` provides a useful lifecycle pattern: isolated BrowserContext, server-bound owner, bounded capacity and idle lifetime, revision checks, serialized actions, current-session recovery, original screenshots, and cleanup. `api/server.mjs` owns guest/auth binding and route checks. The adapter must never accept an arbitrary provider URL from the client.

The `authorizeSubmission`, `reserveSubmission` and `recordResult` hooks separate approval, durable attempt reservation and result recording. Preserve the ordering: reserve the attempt before a supplier write, persist an uncertain result after a transport failure, and prohibit automatic resubmission. The integrator must make the ledger provider-neutral; do not copy a Bokabord-specific restaurant/timezone/provider identity into TheFork records.

Do **not** copy Bokabord's selectors, Angular readiness code, `saveBooking` endpoint, `matchesApprovedBooking` payload or response parser. None is verified for TheFork. The existing TheFork entry in the frontend provider allowlist only supports a reviewed link; it is not a backend transaction adapter.

## Proposed provider contract for integrator agreement

Names below are a proposal aligned with the existing mirror, not a shipped shared API.

| Operation | Required behavior | Current TheFork evidence |
| --- | --- | --- |
| `create(owner, restaurantId, width)` | Resolve an approved exact destination; start isolated context; stop on access challenge; return revisioned state | Official module URL only; provider access blocked |
| `current(owner)` | Return only this owner's resumable session | Reusable lifecycle design, not implemented here |
| `action(id, owner, action)` | Validate revision/busy state and permitted transition before interaction | Supplier selectors, transitions and network effects unknown |
| `remove(id, owner)` / expiry | Close context and remove private session data without retrying pending writes | Reusable lifecycle design |
| Snapshot | Include provider/restaurant identity, revision, truthful state, original view and supported input/actions | No provider-rendered view verified |
| Approval | Bind explicit confirmation to restaurant, date, local time/timezone, party, guest details and exact terms revision | Supplier terms and payload unknown |
| Durable attempt/result | Stable provider/restaurant/owner binding; single attempt; reference only from matching supplier response | Supplier confirmation schema unknown |

Do not expose a submit action while the provider's submission contract is unknown. A blocked session should return a distinct reason such as `provider_access_blocked`; it must not return empty availability or a successful reservation. Proposed status semantics: `blocked` before any allowed attempt; `unknown` after a possibly transmitted attempt; `confirmed` only after validated supplier confirmation. The integrator owns exact shared enum names.

## Unverified boundaries

| Step | Unknown that must be established | Development behavior now |
| --- | --- | --- |
| Initial page | Redirects, static origins, rendered venue identity, login/CAPTCHA requirements | Stop at 403/challenge; do not load alternate proxies or spoof an access entitlement |
| Date/party search | Read-only endpoint/method/schema and timezone; whether UI interaction writes | No guessed endpoint or live search interaction |
| Slot selection | Whether selection creates a hold; hold expiry/release semantics | Do not select a real slot |
| Guest details | Fields, consent, marketing defaults, account/email side effects | No real guest data entered |
| Review | Exact venue/time/party/price/cancellation/card terms presented | No assumed terms or synthetic review presented as live |
| Submit | Exact write URL, payload and binding to approved details; provider idempotency | Disabled until verified and explicitly authorized |
| Payment | Card guarantee, deposit and 3-D Secure requirements | Unsupported; no payment attempted |
| Result | Confirmation/reference schema; pending/rejected/payment-required/unknown distinctions | Never infer success from HTTP 200, page load or a generic title |

For this restaurant, cancellation policy, card guarantee, prepayment, languages beyond the observed `fr_FR` URL, mobile behavior, availability and full confirmation remain unknown.

## Network and privacy requirements

Install routing before navigation; block service workers, unreviewed requests, popups and downloads. GET/HEAD alone is not proof of a harmless request: do not allow every GET on the provider domain. Build a reviewed per-endpoint policy, including redirect destinations and WebSocket handling, before provider interaction. Unknown writes stay blocked; only one exact approved submission can be armed, with durable attempt reservation first. Capture only redacted diagnostics; do not commit cookies, guest details, payment data or private screenshots.

These are requirements for a future adapter. The investigation executed no provider JavaScript and cannot demonstrate browser network interception or its effectiveness.

## Evidence needed to unblock

1. Integrator confirms identity continuity and assigns one TheFork adapter owner with disjoint files and the agreed shared contract.
2. Obtain legitimate provider access or a provider-approved test/sandbox environment through the coordinator. The 403 remains a blocker until access is available through an approved route.
3. Inspect the actual form under request interception; document precise origins, selectors, search requests and the first hold/write boundary without crossing it.
4. Implement a TheFork-specific adapter and local fixtures representing observed behavior. Test owner isolation, stale revisions, double actions, unknown results, request denial and restart idempotency. Fixtures alone cannot verify supplier behavior.
5. Verify mobile/desktop Velvet UI against the adapter; separately record read-only live evidence and sandbox confirmation. A real hold, reservation or payment test requires separate authorization.
6. Release owner deploys only reviewed changes with runtime/Chromium/session-capacity and durable-ledger checks. Publication is a separate status.

## Delivery status

| Dimension | Status |
| --- | --- |
| Official destination evidence | Verified in prior investigation; naming conflict retained |
| TheFork backend adapter | Not implemented |
| TheFork mock/sandbox journey | Not tested |
| Read-only live availability | Not verified; access blocked |
| Supplier-confirmed booking through Velvet | Not verified |
| Deployment | Not performed |

This PR changes only this gap analysis. No shared runtime, registry, canonical list or frontend files are changed. It cannot be counted as a restaurant with completed Playwright booking.
