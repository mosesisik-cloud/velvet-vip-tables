# Playwright booking reference and adapter handoff

Refs #129. Audit owner: `codex-worker-34e97833-ddc2-4a58-9cbf-851c06e3e3aa`, chat `01a141e3-2f17-7af0-bdf9-22a01334e98a`. Checked 2026-10-16 Europe/Stockholm against `7c0e45dc34dc997ffcdc6a73f05294ecec264972`. This is a source audit and proposed contract, not a new adapter or production activation. The booking integrator owns shared routing, contract adoption and app integration; provider and UI workers retain their assigned files.

## What exists

| Component | Implementation | Evidence and limits |
| --- | --- | --- |
| BokaBord/Zink mirror | `api/bokabord-mirror.mjs:55`, server Chromium and isolated BrowserContext, screenshot/input relay | Real Playwright implementation; unit tests use injected fake page/session objects. This audit did not run a supplier booking. |
| BokaBord availability | `api/providers/bokabord-availability.mjs:13`, read-only browser search | Does not click a time or enter contact. Independent of booking-session completion. |
| SevenRooms restaurant UI | `js/restaurant-booking-providers.js`, `docs/sevenrooms-booking.md` | Provider iframe or external link, not a server Playwright booking adapter. No completion postMessage is trusted. |
| SevenRooms search | `api/availability-search.mjs:48` and legacy `api/server.mjs:3755` | Direct HTTP availability parsing, not Playwright; a slot is not a reservation. Registry capability gates still apply. |
| Legacy SevenRooms booking | `api/server.mjs:60` (`srBookSlot`), route at `3788` | Direct HTTP range/hold/book path. Do not reuse as a safe Playwright adapter or run it during development. |

No SevenRooms Playwright booking adapter exists in this audited main snapshot. Other branches may add one; this audit does not claim to describe those branches.

`docs/bokabord-playwright-pilot.md` records an authorized Zink confirmation on 2026-10-15. That is historical reported evidence, not independently repeated here and not proof of current deployment, all BokaBord venues, SevenRooms, payment or cancellation support. Its card/product/waitlist handoff is explicitly incomplete for the full in-Velvet goal.

## Existing HTTP surface to preserve

`api/server.mjs:1923-1963` owns the following paths. Keep `/restaurant-bookings/mirror` compatibility while the integrator dispatches by trusted restaurant registration; do not introduce competing provider routes from a worker branch.

| Request | Body / result |
| --- | --- |
| `/restaurant-bookings/mirror/config` (currently not method-restricted) | `{enabled, mode, guestBooking, restaurantIds}`; no-store |
| `POST /restaurant-bookings/mirror` | `{restaurantId, width, resume?}`; 201 new snapshot / 200 resumed; different active venue gives 409 `other_restaurant` |
| `POST /restaurant-bookings/mirror/current` | Owner's last snapshot; absent session currently returns `{error:'session_expired'}` rather than a thrown HTTP error |
| `POST /restaurant-bookings/mirror/:id/action` | Action plus exact current `revision`; returns next snapshot |
| `DELETE /restaurant-bookings/mirror/:id` | Close browser session, not cancel a supplier reservation |
| `GET /restaurant-bookings` | Existing owner-scoped persisted history; integrate journal records through existing register |

Owner comes from `sessionPublicUser` or the opaque guest cookie via `api/booking-guest.mjs`, never a client-supplied owner ID. Inspect requires operator access. `VELVET_BOKABORD_MIRROR` defaults disabled; `inspect` and `live` are explicit modes. Guest live mode does not require an account. The server checks supplied Origin, body limits, and request budgets; responses containing session data are no-store.

`js/app.js:2515` currently requests mirror config only for Stockholm. `js/app.js:2605` mounts `js/bokabord-mirror.js`; both provider dispatch and that geographic gate need integrator ownership for other providers. The existing UI hardcodes BokaBord labels and terms, so reusing it unchanged for SevenRooms would misstate consent.

## Existing session/action contract

`BokabordMirror` exposes `create(owner, restaurantId, width=420)`, `current(owner)`, `action(id, owner, action)`, `remove(id, owner)`, `close()`. Sessions have owner, restaurantId, browser context, revision, busy, touched, submitted/armed and result state. Width is bounded 320–760; one session per owner, four global sessions, ten-minute inactivity timeout; pending creates count toward capacity. Service workers and downloads are disabled and extra pages close.

Snapshot (`api/bokabord-mirror.mjs:145-170`):

```text
id, restaurantId, restaurant, revision, width, height,
image (PNG data URL), imageHash (SHA-256), capturedAt,
fields [{name,value,rect}], text, contact, review, details,
blocked, mode ('inspect'|'prepare'), canSubmit,
result null|{status,reference}, expiresIn,
handoff null|{reason,url}
```

Do not infer live execution mode from snapshot `mode`: current live sessions also emit `prepare`. `canSubmit` is an eligibility flag, not confirmation and not permission to ignore explicit consent. Screenshots/text/fields contain private data and must not enter logs, shared caches or fixtures.

Actions all require current revision. Busy and stale actions return 409. Inspect allows `click{x,y}`, `scroll{dy}`, `refresh`; prepare also `fill{fields}` (or `field,value`), with whitelist and length limits. Raw clicks stop at contact. `submit{confirm:true,terms:true}` in live mode rechecks provider details against the displayed snapshot, then arms exactly one allowed submission. UI must finish queued fills before submit, reset consent on a changed snapshot, verify image hash, and avoid automatic submit retries.

Current observed result vocabulary: `unknown`, `confirmed`, `payment_required`, `rejected`, `payload_mismatch`, `already_attempted`. Session errors are separate (`auth`, `session_expired`, `busy`, `stale_view`, `confirmation_required`, `contact_required`, etc.). Do not translate `unknown` into failure or invite rebooking.

## Write boundary and persistence

`allowedRequest` at `api/bokabord-mirror.mjs:16` blocks known write paths and allows specific read POSTs. The sole armed exception at lines 95–102 is the exact BokaBord save endpoint, after payload comparison and successful `reserveSubmission(approval, session)`. The session is marked submitted/unknown before network continuation. `recordResult(session)` persists the provider outcome; response must contain success and a positive booking ID before reporting confirmation. Payment-required remains separate. Exact BokaBord predicates and Angular-specific `providerReady` must not be generalized to unrelated providers.

`api/bokabord-ledger.mjs` atomically reserves a local attempt using exclusive creation plus fsync before transmission. Key binds owner, restaurant, date, time and party. Existing attempt prevents retry across restart; unknown status is written first. The directory is private persistent storage. Its row currently hardcodes `BokaBord` and `Stockholm`: a provider-neutral journal change belongs to the integrator. Reserve means local attempt reservation, NOT supplier inventory hold.

Persistence does not prove distributed exactly-once delivery. Multiple server instances must share an atomic store, and an uncertain supplier response requires reconciliation rather than resend. Closing/expiring a browser session must retain the attempt record.

## SevenRooms gaps that block reuse

1. The legacy `/availability/:legacyVenueId/book` handler at `api/server.mjs:3788-3829` trusts nonempty `body.user.id`, with no mirror owner/revision/terms/attempt checks before calling `srBookSlot`. Its hold is a real supplier mutation. This is not the contract the new UI should invoke. The integrator must gate/retire or independently harden this path as part of rollout; no exploit or live call was attempted here.
2. Legacy cancellation similarly accepts body user identity and calls a supplier mutation. DELETE of a mirror session must never alias cancellation.
3. Legacy code manually constructs provider request headers. Do not transfer any anti-bot workaround into the adapter. Use the ordinary authorized browser flow and stop at access protection.
4. `docs/sevenrooms-booking.md` records Astoria's hold POST being blocked during an earlier read-only probe. A time/seating click can therefore cross the write boundary before a final button. Provider worker must identify that boundary before enabling actions; blocking only final booking is insufficient.
5. HTTP availability and iframe tests cannot establish hold behavior, complete checkout, 3DS, OTP or confirmation. Missing payment metadata remains `not_specified`; mixed requirements and request-only slots must not become immediate-booking promises.

## Minimum shared adapter proposal (for integrator acceptance)

Reuse the above five lifecycle methods and compatible screenshot/action envelope. Provider worker supplies trusted venue registry, provider-specific read network policy, settle/snapshot extraction, approved-payload comparison and confirmed-response evidence. Server supplies authenticated owner and durable hooks:

```js
create(owner, restaurantId, width) // Promise<Snapshot>
current(owner)                    // Snapshot or explicit no-session outcome
action(sessionId, owner, action)  // Promise<Snapshot>; revision mandatory
remove(sessionId, owner)          // closes session only
close()                          // shutdown
// dependency hooks, not HTTP endpoints:
reserveSubmission(approval, session) // durable BEFORE first approved mutation
recordResult(session)               // persist confirmed/rejected/unknown outcome
```

Integrator should add explicit provider identity and execution mode (`fixture`, `inspect`, `live`) and reviewed capability flags to config/snapshots without silently changing existing fields. Terms must identify the actual provider and displayed conditions; consent is bound to restaurant, selected option/date/time/party, contact, current revision and those conditions. Do not reuse BokaBord's `terms` payload mapping or Swedish phone normalization across providers.

Where supplier holds are required, hold authorization and persistence need an explicit separately reviewed transition before the first write. A generic `click` must not implicitly authorize a hold. Until the integrator and provider owner define that transition, return a blocked capability and keep submit disabled. Payment/OTP/CAPTCHA are unsupported unless separately implemented and verified; do not bypass them or falsely report completion.

Proposed lifecycle semantics: inspect/select/contact/review -> explicitly approved attempt -> unknown while sending -> supplier-confirmed or supplier-rejected; unsupported requirements remain blocked. Timeout, malformed response, interruption or persistence failure after dispatch remain unknown and disable repeat submission. Fixture outcomes must stay labelled fixture and never enter real booking history.

## Validation performed for this audit

- `node api/test-zink-playwright.mjs`: PASS, 11 tests. Mocked page/session controls and local temporary ledger; no real browser booking.
- `node scripts/test-availability-sevenrooms-safety.mjs`: PASS, injected fetch fixtures; no live requests.
- `node scripts/test-booking-providers.mjs`: PASS, 136 mappings plus destination/service-worker guards. Registry validation does not prove checkout.
- No full server/browser end-to-end suite, live availability, hold, booking, payment, cancellation, restaurant message or deployment run by this audit.

Integration acceptance still requires offline/browser-fixture coverage of owner/revision/busy/TTL, wrong venue/URL, earliest-write interception, durable duplicate suppression across restart, changed terms/details, malformed result, interrupted response, and private-data caching. Then separately authorize read-only live validation and an actual supplier-confirmation test. Record implementation, fixture tests, read-only live observation, supplier-confirmation verification and deployment as separate dimensions.
