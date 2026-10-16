# Independent Velvet booking journey tests

Refs #129. Owner: `codex-worker-33473488-ff38-4e6b-8134-b986409997df`
(chat `01a141e3-efb0-7553-91f0-e19d39cfce5c`).

## Scope and dependencies

This suite mounts the real `js/velvet-playwright-booking.js` module from the UI
owner. It does not recreate the UI, alter the app, implement a provider, or
normalize the existing Bokabord/SevenRooms screenshot contracts. The integrator
owns routing and the connection between normalized UI and provider adapters.

The agreed UI contract is `mountVelvetPlaywrightBooking(container, options)` with
`restaurantId`, `restaurantName`, `mode`, and injected `transport`. Transport
methods are `create`, `current`, `action`, and `remove`. Actions echo session ID,
restaurant ID and revision. Final submission includes explicit confirmation,
terms consent/version, server review token, and an idempotency key. The server
must bind these to the authenticated owner and reviewed details. A client test
does not prove that server guarantee.

The fixture uses a synthetic restaurant ID, date, guest and result reference.
All inventory and outcomes are test data. Its journal is an in-memory model,
not the production durable booking ledger. It survives browser reload during a
test, but does not prove recovery after a backend process restart.

## Run

```sh
npm ci --ignore-scripts
npx playwright install chromium
node scripts/test-velvet-playwright-journey.mjs
```

The UI dependency must be present. Missing implementation or browser fails the
run; no success is reported from a skip. Before integration, a reviewer may set
`VELVET_JOURNEY_UI_FILE` to a local copy of the UI owner's exact pushed module.
That changes only which real UI module is served; it cannot select a remote
server or supplier. Record the reviewed UI commit alongside the emitted SHA-256.

The runner binds an ephemeral loopback server and serves the module plus its
local JavaScript dependencies. It never starts the production API server.
Browser requests are denied except local static GET/HEAD and the single local
fixture POST endpoint. Service workers and WebSockets are blocked. Synthetic
owner cookies are HttpOnly and only identify isolated test contexts. No supplier
JavaScript, external forms, phone/email actions, holds or payment requests are
part of the suite.

## Acceptance matrix

| Scenario | Required observable evidence |
| --- | --- |
| Selection to review | Actual date/party inputs, fixture slots, guest form and review in real UI; no iframe; no submission before review |
| Explicit consent | No transport submission without terms; final action carries revision, review token, terms version and idempotency key |
| Double click | Exactly one submit transport call and one simulated attempt |
| Confirmed | Fixture reference shown only with confirmed result and venue/session/attempt-bound fixture proof; persistent fixture label |
| Pending / unknown | No confirmation, no automatic repeat submission |
| Payment required | No confirmation or payment navigation |
| Rejected / error | No fabricated reference or confirmed state |
| Confirmed without reference | Never rendered as confirmed |
| Timeout after attempt | Result stays uncertain; reload reconciles without another submit |
| Reload | Restore current result through read-only current/resume, not replayed submit |
| Owner isolation | A separate browser context does not see another context's guest/review |
| Changed terms/revision | Stale submit rejected before attempt; reload does not silently re-arm consent or submit while outcome needs reconciliation |
| Viewports | Full happy path at 390px and 1365px |

## What passing does not establish

- The API's owner authentication, persistent idempotency or revision enforcement.
- The app router's integration of this module, or any supplier-specific selector.
- Live inventory, a working live submit endpoint, payment handling or a supplier
  confirmation. Initial supplier adapters remain inspect-only unless separately
  verified and authorized.
- Publication or production readiness.

Report separately: implemented UI, mock-tested journey, provider sandbox tests,
read-only live inventory, authorized supplier-confirmation verification, and
deployment. An external link, iframe or mock confirmation is not full live
booking through Velvet.

## Reviewed UI dependency

Initial independent run: UI PR #138, commit
`a74a5debffbe17751f020d59b15a102674bf4a7c`, module SHA-256
`00073dd4bb07b12e9f74ae8fc3497cb9a81e7caee21f9e3a7566f69e5e16a3fd`.
The UI also requires confirmed-result proof with `verified: true`, fixture/provider
source, matching restaurant/session, and the attempted idempotency key as
`attemptId`. The fixture supplies this explicitly; a reference alone is insufficient.
This test PR depends on the UI module being integrated or provided through the
local override above. It does not include another worker's implementation.
