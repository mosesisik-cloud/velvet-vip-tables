# Bokabord/Zink independent offline regression

Refs #129. Owner: `codex-20261016-01` (Bokabord regression assignment, chat suffix a199).
Checked 2026-10-16 Europe/Stockholm against main commit `7c0e45dc34dc997ffcdc6a73f05294ecec264972`.
Scope: this report only; no mirror, server, UI, registry or shared-contract changes.

## Conclusion

The reference contains an actual backend Playwright booking path, not merely a link or iframe. The selected existing offline regressions all pass. They do **not** establish a newly completed supplier booking, production activation, or equivalent functionality for other providers.

The implemented in-Velvet path is limited to ordinary supported Bokabord selections with no required card guarantee, products, waiting list or provider-initiated reservation. Those cases deliberately hand off to Bokabord and are not complete in-Velvet bookings. There are 22 registered targets including Zink; that is configuration coverage, not 22 independently confirmed booking journeys.

## Tests actually run

Environment: Windows, Node v24.13.0, locked Playwright 1.64.1, installed Playwright Chromium. All commands ran from the repository root. Tests were inspected before execution. No live inspector, provider navigation, reservation, hold, payment or message was run in this audit.

| Command | Result | What was exercised | Boundary |
| --- | --- | --- | --- |
| `npm test` | PASS, 11/11, exit 0 | Guest credential isolation; durable reservation/restart deduplication; current revision and consent; exact approved payload; final-button selection/disarming; representative denied requests; owner/revision/coordinates/input checks; public asset cache; batch input validation; request budgets; provider-reservation handoff | Node unit tests with synthetic sessions/page stubs and temporary local journal files; no real browser-to-provider submission |
| `node scripts/test-bokabord-ui.mjs` | PASS, exit 0 | Shipped UI module in Chromium, local HTTP server and injected transport; typing remains usable, latest edits/focus survive slow responses, unsynced/failed edits block submission | Synthetic image/snapshots, `mode: prepare`; no final confirmed-result journey or actual API server |
| `node scripts/test-bokabord-ready.mjs` | PASS, exit 0 | Real `BokabordMirror.settle` against local DOM/Angular stubs; delayed non-Angular AJAX and phone initialization complete before returning | Small provider readiness fixture, not the real supplier DOM |
| `BOKABORD_LIVE_READONLY=0` then `node scripts/test-bokabord-availability.mjs` | PASS, exit 0 | Bookable-row/time-window/deduplication filters; registry/request restrictions; queue/concurrency/deadline cleanup; cancellation and late browser start; public-only cache; real Chromium meal-selector fixture excludes gift cards | Stub browser jobs plus local DOM; live branch explicitly disabled. Search inventory is not a held or booked slot |

PowerShell reproduction for the last row: `$env:BOKABORD_LIVE_READONLY='0'; node scripts/test-bokabord-availability.mjs`.

No application regression was inferred from CI on another PR. `api/test-rails.mjs` was inspected but not run: its general API/catalog suite is not an end-to-end mirror confirmation test. No new overlapping test file was added; security and journey workers own their separately assigned tests.

## Implemented contract and actual boundaries

Source locations below refer to the audited commit.

- `api/bokabord-mirror.mjs:76`: `create(owner, restaurantId, width)` selects a fixed registered URL, creates an isolated context, blocks service workers and downloads, and installs request interception. Four sessions maximum, one per owner, ten-minute idle TTL.
- `api/bokabord-mirror.mjs:145`: snapshots carry provider pixels, SHA-256, revision, contact/review flags, fields, details, result and handoff. `current(owner)` resumes the last in-memory snapshot, not a durable supplier reconciliation.
- `api/bokabord-mirror.mjs:191`: `action` validates owner/revision/busy state. Contact filling and explicit `submit` are enabled only in configured modes. The live approval is compared with the current Angular booking model and requires explicit confirmation and terms. The contact-stage action can advance toward review; final submission selects the final provider button. A clicked button alone is not confirmation.
- `api/bokabord-mirror.mjs:95`: only the exact approved `saveBooking` POST can pass the armed submission gate. The payload is checked and `reserveSubmission` must succeed before forwarding. The session is marked attempted/unknown before transmission. There is no automatic retry.
- `api/bokabord-ledger.mjs:9`: durable key binds owner, restaurant, date, time and party; exclusive file creation blocks repeats after restart. Stored provider/destination are hardcoded to Bokabord/Stockholm, so this journal is not already provider-neutral.
- `api/server.mjs:31` and `:1923`: runtime mode controls activation, guest/operator identity and routes. Default is disabled; inspect is operator-only and live permits guest sessions. This audit did not read production configuration or exercise these HTTP routes.
- `js/bokabord-mirror.js:35`: shipped UI uses the mirror API and verifies image hashes; it forwards revision and explicitly confirmed terms. The existing offline UI test covers input synchronization, not a complete guest-to-confirmation journey.
- `api/bokabord-mirror.mjs:180` and `js/bokabord-mirror.js:79`: card guarantees, mandatory products, waiting lists and early provider-reservation requirements produce external handoff. They remain gaps against the full in-Velvet objective.

## Reuse blockers and unproven coverage

1. **Supplier result classification needs an explicit contract and fixtures before reuse.** At `api/bokabord-mirror.mjs:116-118`, `success === true` plus a positive `booking.id` maps numeric status 0 to payment-required and every other value to confirmed. By code inspection this includes absent/unrecognized status (`Number(undefined)` is NaN, hence not 0). No provider status specification is cited there, and the selected tests never exercise this response listener. The ledger test sets a synthetic confirmed result directly; it cannot validate this mapping. Integrator/security owner should require known confirmed states and fixtures for missing/unknown/pending/payment/rejected responses. This is a static finding, not an observed supplier incident.
2. **No complete offline provider submission chain in the existing selected suite.** The final-button test mocks page methods and throws on click. It does not exercise actual route interception, payload dispatch, the response listener, durable result recording, API snapshot and UI confirmation together. Add this through the assigned safety/journey owners using local fixtures, with zero provider traffic.
3. **Network denials are representative, not an exhaustive provider safety proof.** `allowedRequest` allows general GET/HEAD on its supplier hosts after a pathname denylist; `create` has no explicit WebSocket route interception. Tests assert selected API/host denials, not every possible state-changing GET or socket. Service workers are blocked. Do not copy this as a universal network contract for another supplier; independently review each provider's hold and submit boundary.
4. **Provider-specific internals remain.** Swedish headings, Angular `Booking.getQuery`, exact hash/meal fields, phone conventions and endpoint names drive this adapter. A new supplier needs its own verified selectors, read-only inventory/hold boundary, approved payload and outcome semantics. Registry entries, an iframe or an external URL cannot fill these gaps.
5. **State and deployment evidence are separate.** Browser contexts cannot be recovered after process loss; durable attempts remain, but `current` does not query the supplier after restart. The journal and unknown-outcome policy need integration with the new shared contract. Production runtime flags, Chromium version, persistent journal volume, deployed commit and normal-user journey were not independently checked here.

## Historical confirmation evidence

`docs/bokabord-playwright-pilot.md`, section “Verifierat 2026-10-15”, reports one authorized real Zink booking through Velvet, including matching guest/selection details and a confirmation page. It explicitly keeps the private reference and screenshots outside Git. This audit acknowledges that historical report, but did not retrieve those private artifacts or independently verify them. Do not call it a newly reproduced confirmation, and do not extrapolate it to all 22 targets or other suppliers.

Evidence still needed for an independently verified completion claim: a privacy-safe attestation tying the same authorized attempt to exact venue/selection, a recognized supplier-confirmed outcome/reference, durable journal state and Velvet result, plus deployed commit/runtime evidence when claiming production. First validate the entire chain against fixtures or a supplier sandbox. A new real booking/hold/payment requires separate authorization; none is requested or performed by this report.

## Handoff

Offline regression status: **PASS for the four commands above**. Reference reuse status: **conditional; outcome semantics and end-to-end fixture coverage remain unresolved**. Actual supplier completion this audit: **not performed**. Deployment this audit: **not performed**.

Integrator owns routing, common contract and any runtime fixes. Safety worker (93e1) owns outcome/network regression follow-up; journey worker (ce5c) owns fixture journey coverage; reference auditor (e98a) owns broader reference contract consolidation. This report supplies existing-test evidence without parallel edits to their files. Release owner alone handles approved deployment. Report branch, commit, PR and remote verification in #129.
