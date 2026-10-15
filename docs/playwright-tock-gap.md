# Tock / Delta: backend Playwright booking gap

Owner: codex-worker-1-ac9f. Assignment: issue #129, Tock gap research only. Checked 2026-10-16 (Europe/Stockholm). Code baseline: main `7c0e45dc34dc997ffcdc6a73f05294ecec264972`. Prior Delta evidence: PR #82, commit `9b4676aa695cc636035502f8c73999c455171c30`, already pushed. Restaurant claim #54 remains untouched.

## Decision

**Blocked for a real Tock booking adapter; research ready for review.** No Tock backend booking implementation, read-only live availability, supplier-confirmed booking, or deployment is established by this report. A link, opened widget, iframe, or local fixture is not full booking inside Velvet. No shared code, registry, or canonical worklist is changed.

The first blocker is a verified current Delta provider destination. The next is an observed, reviewed separation between search and inventory mutation. Even selecting a slot must be treated as potentially creating a hold until its effects are established. Payment and supplier confirmation require separate evidence and a sanctioned test environment.

## Current code inventory

| File / symbol | Observed capability | Tock gap |
| --- | --- | --- |
| `api/providers/remaining-registry.mjs`, `resolveRemainingProvider` | Allows Tock host `www.exploretock.com`; Tock is excluded from embedded-provider set; returns `liveAvailabilitySupported: false`, `completionTracking: unsupported` | URL validation/fallback only; no Tock journey |
| `js/restaurant-booking-providers.js` | Tock destination allowlist | No completion evidence |
| `data/booking-providers.json` | Seven Tock rows, all `external_link`, all live availability disabled; Delta absent from these Tock rows | Registry entries cannot count as bookings or active adapters |
| `api/server.mjs`, availability construction | Registers BokaBord and Delicity adapters; SevenRooms availability has its own path | No Tock availability adapter wired at this baseline |
| `api/availability-search.mjs`, `AvailabilitySearch.venue` | Honors explicit live-disable gate; unsupported providers stay unsupported | Empty or blocked Tock results must not become sold out |
| `api/bokabord-mirror.mjs`, `BokabordMirror` | Backend browser sessions, create/current/action/remove, owner/revision/busy/TTL, context request filtering, explicit confirmation and one-attempt submission hooks | Useful reference structure, not portable Tock selectors or network rules |
| `api/bokabord-ledger.mjs`, `BookingLedger` | Durable pre-transmission reservation of an attempt; unknown outcome persisted; repeat attempts blocked | Hardcodes BokaBord and Stockholm; key covers owner/restaurant/date/time/party, not Tock experience/payment semantics |
| `api/server.mjs`, `/restaurant-bookings/mirror/...` | Routes to BokabordMirror and its ledger | Integrator owns provider-neutral routing and authorization |
| `api/book-bridge.mjs` | Detects Tock URLs and prepares a bridge/handoff | Not an in-Velvet supplier-confirmed booking adapter |

The seven Tock registry IDs are `osm-MIA-sushi-by-scratch-restaurant`, `curated-RIO-oteque`, `curated-RIO-lasai`, `curated-CDM-quintonil`, `curated-LAX-n-naka`, `curated-NYC-atomix`, `curated-CDM-rosetta`. This is a read-only inventory of the stated commit, not a new worklist or a fresh venue verification.

`docs/remaining-providers-audit.md` records prior Tock security challenges and explicitly limited inspection. Its referenced parent-work-directory artifacts are not proof available in this checkout. Do not relabel historical checks as tests performed in this task.

## Public structure: supported facts and unknowns

1. **Official venue entry.** [Delta reservations](https://deltarestaurant.gr/portfolio/reservations/) exposes a terms checkbox and Tock container, locale `en-gb`, timezone `Europe/Athens`. The previous source/static-render checks found no exact Tock business URL; the Greek entry also used `en-gb`. The directions button is not booking. The [published policy](https://deltarestaurant.gr/terms-of-use/) describes EUR 100 deposit per reservation. These are Delta website statements, not an observed provider checkout. Prior raw HTML also contained obfuscated code with unrelated blockchain RPC references; purpose unknown. Do not execute it to discover a slug.
2. **Offerings and search.** [Tock's widget guide](https://tock.zendesk.com/hc/en-us/articles/360030920752-Using-the-Booking-Widget-for-Your-Website) describes all-offering and single-offering searches by date, time and party, plus offering lists. Installation needs generated header JavaScript and body code. A container alone is incomplete evidence. The guide says iframe placement is unsupported. Its hosting/redirect notes do not establish the current Delta journey or backend automation compatibility.
3. **Selection / hold.** No exact Delta/Tock slot-selection request, hold endpoint, token, expiry, release path, or side-effect-free search request was observed. An older venue-specific Tock FAQ surfaced a timed checkout/release description, but subsequent page extraction was inconsistent; it is not used as a current contract or a Delta timeout. Stop before selecting a slot. Do not transfer Bokabord or SevenRooms endpoint assumptions.
4. **Checkout.** Tock's [reservation data model](https://api.exploretock.com/docs/latest/reservation.html) distinguishes experience, add-ons, fees, monetary totals, payment and reservation confirmation identifiers. This supports the need to model more than date/time/party; it does not describe consumer checkout requests. Delta's actual guest-account requirement, payment processor, tokenization, 3DS, mandatory choices and DOM selectors remain unknown.
5. **Confirmation.** The same data model contains reservation IDs, confirmation codes and cancellation state. A confirmation recognizer must be backed by an observed permitted response or authorized webhook and bind venue, party, date, experience and payment state. A success-looking page, URL change or HTTP 200 is insufficient. No such recognizer was implemented or tested here.

The current official [API FAQ](https://tock.zendesk.com/hc/en-us/articles/25447494175508-API-FAQ) lists exports, guest ingest and guest/reservation webhooks, with access dependent on plan. It explicitly excludes available-booking retrieval and reservation creation/cancellation via API. The public reservation schema is therefore **not** a public booking endpoint or a substitute for Playwright. Existing API/webhook access, sandbox access and partner permission were not established; no credentials were requested or used.

An official [Resy announcement dated 2026-08-11](https://blog.resy.com/newsroom/resy-welcomes-tock-restaurants-wineries-experiences/) announces Tock venues appearing on Resy. The old Tock marketing reservations URL now redirects to [Resy's business page](https://resy.com/join/). This does not establish that Delta migrated or that every Tock checkout is now Resy. Resolve each actual destination before selecting an adapter; do not silently rewrite Tock URLs.

## Proposed integration contract (requires integrator agreement)

Reuse lifecycle concepts, not provider implementation: `create(owner, restaurantId)`, `current(owner)`, `action(sessionId, owner, revision, action)`, `remove(sessionId, owner)`. Registry-owned destinations only; no client-supplied URL. Define provider capability flags independently for search, hold, checkout and confirmed reservation.

A Tock snapshot should carry authoritative venue/experience identity, venue timezone, date/party/selected option, monetary amount and currency, deposit versus total versus amount due, applicable cancellation terms, revision and expiry. Unknown terms must remain unknown. Any change to price, terms, identity or slot invalidates previous consent. Do not store payment card data or provider-account secrets in screenshots/logs or the booking register.

Proposed states: `unresolved_venue`, `search_ready`, `search_blocked`, `selection_requires_hold`, `hold_active`, `review`, `payment_required`, `submitting`, `confirmed`, `rejected`, `unknown`. These are design requirements, not implemented provider states. `hold_active` is forbidden in this development scope; browser session TTL and provider inventory-hold expiry are separate concepts. Removal/expiry must not silently imply remote release.

The integrator must supply a provider-neutral durable journal before any permitted mutation. It must bind authenticated owner, venue, experience/option, date/time/timezone, party, terms revision and exact approved amounts to a unique attempt. Persist intent before transmission; unknown outcomes prohibit automatic resubmission after timeout/restart. Confirmation must use trusted provider evidence. Do not assume the existing tuple alone distinguishes all experiences, and do not assume provider idempotency exists.

## Safe inspection boundary

No production browsing with a broad allow-all GET policy: GET, navigation, popups, frames and background scripts can also mutate server state. Before executing a verified provider journey, review exact origin/path/method/query/body combinations. Default deny; disable service workers/downloads and unreviewed WebSocket/background channels, apply guards before navigation to the entire context, and stop at any redirect to an unreviewed host. Only add proven read operations. Unknown POST/PUT/PATCH/DELETE remain blocked; even a search POST requires evidence.

A denied request is `blocked`, not empty inventory. No CAPTCHA/WAF bypass, proxy rotation, stealth browser changes or token fabrication. No provider-account login, personal-data entry, slot click, hold, release, payment or booking in this research. Redact guest data, credentials and tokens in future permitted network evidence. Validate outbound boundaries with a network sink in fixtures; UI inactivity is not proof of no writes.

## Concrete blockers, owners and exit evidence

| Blocker | Next owner/action | Evidence needed before proceeding |
| --- | --- | --- |
| Delta slug / current booking engine unresolved | Coordinator obtains current official generated widget configuration or a verifiable official destination; no restaurant message sent by this worker | Exact venue URL/ID and official provenance; recheck whether Tock or another current engine |
| Unknown safe search and first mutation boundary | Assigned adapter owner in an authorized sandbox or separately approved restricted capture | Sanitized request trace showing search, selection/hold, checkout and confirmation boundaries; no inferred endpoints |
| Payment and account behavior unknown | Integrator with provider-supported test setup | Test payment/3DS path, account requirements, exact fees/currency and policy capture |
| Journal and dispatch tied to Bokabord | Integrator alone | Approved shared contract and provider-neutral durable submission/hold handling |
| Access challenge or unreviewed script/redirect | Adapter owner reports blocked | Legitimate supported access or clean official route; never bypass |
| Confirmation and recovery unverified | Adapter owner plus independent tester | Authorized sandbox confirmation and lost-response/restart/replay tests; separate live mandate required for real transactions |

## Verification and acceptance ladder

Performed on the baseline: static code inventory; exact registry extraction; official documentation reads; `node --test api/test-zink-playwright.mjs` passed **11/11** offline unit/mock tests. Those tests exercise Bokabord guard/ledger/session behavior; they do not prove Tock safety or compatibility. No new provider execution or live availability check was performed. Earlier Delta static inspection remains evidence with its original JavaScript-disabled limitations.

Before a future Tock adapter can be enabled, independently test: spoofed owner and stale revision; duplicate/concurrent actions; price/terms/experience changes; blocked hold on selection; mutation via redirects/frames/background channels; hold expiry distinct from session expiry; payment-required versus confirmation; lost response/restart and duplicate submit; failed cancellation/release; access challenges; zero inventory only from validated provider evidence. Use synthetic fixtures to test application invariants, clearly labeled; do not present fabricated provider responses as verified protocol fixtures. Real-provider protocol coverage requires authorized captures or a provider sandbox.

Current dimensions: research complete for this scope; implementation absent; Tock mock/sandbox tests absent; live availability unverified; supplier confirmation unverified; deployment absent. The next concrete action is for the coordinator to resolve Delta's authoritative provider destination and the integrator to approve the shared contract before assigning an implementation owner. No production enablement is proposed.
