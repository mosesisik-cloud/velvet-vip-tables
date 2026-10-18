# Le Petit Sommelier — native MIDI service for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main239 7f7ab64359f5381bba558024fb4f0d082e5bc590. Canonical `curated-PAR-le-petit-sommelier` confirmed by32d5; export ZENCHEF_PETITSOMMELIER. Only restaurant49 avenue du Maine, native service37613/MIDI, exactly two. Cavist/wine bar39 rue Daguerre, takeaway, SOIR and room guarantees excluded.

## Actual sources, 2026-10-18

https://www.lepetitsommelierdeparis.com/ returned200, SHA256 `4c99b073cc410022a801c3bdf0c92764bf7cd412dba22c207e03c1c10f2c99f4`. Explicit reservation link https://bookings.zenchef.com/results?rid=1404&pid=1001 and restaurant address49 Av. du Maine,75014 Paris. This directly distinguishes the restaurant from the separate wine shop/bar; no takeover of those routes.

One readonly https://bookings.zenchef.com/results?rid=1404&pid=1001&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `d9270ca53b1f70c8783fbb9554b7d147df60bd673e2c04e3c368a39dac6db30e`. Native Le Petit Sommelier,49, avenue du Maine,Paris; fr/EUR/Europe/Paris. Query keeps pid1001, wish date/party match, room null/offers empty, no room selection/mandatory room.

Exact own policy:37613/MIDI, automatic true/until null, charge null, prepayment null, required offer false/from pax null, cancellation cutoff **21600 seconds relative to shift**. Typed changed/missing values fail closed. SOIR37614 is excluded even though some policy fields coincide.

Native MIDI has29 observed two-person times every15 minutes from11:00 through18:00 inclusive. Scope follows the source's named MIDI service; do not describe a narrower guaranteed lunch window, import a previous venue's time list or invent a calendar constraint. Times are observations, not holds or bookings.

Readonly https://bookings.zenchef.com/form?rid=1404&pid=1001&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `a974f22a629a6605b774e50ce061963df050285ca46c7b9d99b9078a71af4537`. Required first/last/email/phone/country/civility, custom fields empty; optional voucher unsupported. One room label does not grant seating guarantee.

Current form-referenced bundles fetched and hash-matched to reviewed source:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own restaurantComment is exactly `{fr: ""}`, and no day-specific notice is set. Preserve this absence; native EULA still applies. No inherited15-minute notice, seasonal/date rule, walk-in promise or other restaurant's terms. Version digest still binds the full empty-notice object and shift; a later notice change invalidates the review.

## Partner and durable binding

Provider URL explicitly preserves pid1001 in search and form. Availability SSR rejects missing/wrong pid for this venue; initial form SSR additionally checks pid. Exact document URL allowlisting and form revalidation keep that context through review/submit. Existing native approved payload requires partner_id1001. No invented partner semantics or extra parameters.

32d5 owns shared API/UI/registry/ledger/journal and should present the restaurant's MIDI service, bind party2/shift37613 through reserve/record/proof/snapshot and retain pid1001 in routing. Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused.

Final native booking POST is permitted only after explicit final consent, accepted EULA and durable sendAllowed grant. Only its same-attempt UUID permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match, no charge/action/error, empty offers/no chosen room. POST echo never confirms. Shift binding uses validated native selection, frozen approval, durable attempt.details.shiftId and matching saved details, not an invented raw receipt shift field. Actual final receipt remains unverified; unknown stays unknown.

## Checks and boundaries

Guarded actual Chromium form GET preserved pid1001 and rendered empty firstname/native EULA; six requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read, bypass or duplicate results/date probe.

Synthetic browser tests cover own-readback success, missing/pending/wrong date/party/offer, card/manual changes, changed initially-empty notice and wrong durable service. Captured-source tests verify29 times, pid missing/wrong rejection and form preservation, typed policy/cancellation, SOIR/other-service exclusion and party-three rejection. Synthetic receipts/fixture dates are not actual reservations/current availability.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. All parked identities excluded from clean branch.

Explicit-empty notice handling: the existing no-room nonempty-notice requirement is excepted only for this exact venue with native restaurantComment.fr === ''. The venue policy rejects missing, null or changed French notice values; the digest still binds all terms. EULA remains required and every other venue retains its notice guard. Shared code must allow this source-backed empty notice without inventing text.

Final validation after scoped empty-notice correction: node --test scripts/test-zenchef-playwright.mjs — 33/33 PASS, zero failures (120.05 seconds). git diff --check PASS.
