# Riche Lunch — receipt policy and required native review

Refs #129. Restaurant `curated-STO-riche`, integration/release owner32d5.
Base main4d0fac7 (Ciccio's release199). This export is NOT activation approval
without the contact-final review change described below.

## Public identity and exact scope

`https://riche.se/` identifies Restaurant Riche, Birger Jarlsgatan4, Stockholm.
Its official booking link uses Waiteraid with hash
`4a8d2f702a18092521b0b031fbfb4d4a`, matching the existing canonical registry.
The canonical Bokabord URL returned HTTP200 on16 October2026. Initial HTML SHA256:
`c91c2d41c3384dcd2a70f5369e7f5e5e4e2b5c7f853678751412d3813b8d96c0`.
Exact provider name is `Riche`. Lunch is meal7180/type2, started=true,
must_pay_directly=false, mandatory_products=false, bullets={}, times11:30–17:00.
Settings max_people8/max_seating9 permit normal party1–8; custom_request=false,
group_bookings=false, linked_meals=[]. Numeric restid is not exposed in initial
HTML or the inspected model; it is not invented. Existing hash/request/meal/name
and approval/receipt binding identify this venue.

Excluded: Middag7181/type3 has must_pay_directly=true; Brunch7426/type4 and
Sent bord - endast dryck65062/type0 are outside the ordinary lunch policy.

## Actual guarded inspection and contact-final difference

At2026-10-16T02:45:46.320Z, original-provider Chromium selected Lunch, two guests,
22 October2026,13:30 and reached Kontaktuppgifter. Fourteen selectable times were
observed from13:30 to16:45. Noon was not available, so an initial selector wait
stopped before slot selection and the observed13:30 option was then used.
Availability is transient, not guaranteed inventory.

The actual page exposed canUseAuthFeature=false, visible contact Next, and no
visible final-review heading. Unlike Noema/Ciccio's, this is not a guest-account
continuation route. The current official app-widget6.0.3 was fetched again and
still hashes to
`ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`.
Its guestCtrl.next2368–2369 directly calls completeBooking when loginFeature is
false; completeBooking calls booking.save at2540. The contact Next therefore
counts as the final supplier action. It was NOT clicked. No account choice or
provider review is claimed. confirm_in_widget does not control this branch.

The probe reused the existing availability network guard. Unknown requests,
contact-stat POST, tracking writes and WebSockets were blocked. No saveBooking,
hold, email-code or payment request was sent. Synthetic contact fields were used.
This proves the route to contact and the source-controlled final-action boundary,
not a completed booking. There is no external access blocker requiring a venue
switch; the missing native review is an implementation task.

## Minimal handoff

The new RICHE_LUNCH_RECEIPT_POLICY export reuses the unchanged common verifier,
with exact hash/name/meal/type and maxParty8. The existing focused suite adds a
synthetic bound receipt case and excludes dinner, brunch, late drinks, oversized
party and newly observed payment requirements. No server/UI/journal edits or
duplicate engine/harness are added.

Before activation,32d5 must implement an explicit native Velvet review for this
verified contact-final route: first review action freezes the approved provider
details and returns a review view WITHOUT clicking Next or granting dispatch.
Only a separate explicit final action with fresh revision/consent and unchanged
provider details may reserve the durable attempt, arm exactly its approved POST,
and click the real provider Next. Field/selection changes invalidate review.
Do not arm all contact buttons, auto-click Next, modify provider auth flags, or
pretend the provider supplies the missing review. Existing Noema/Ciccio's paths
must retain their own reviewed behavior. Receipt confirmation remains conditional
on both actual save response and bound completion document; unknown never retries.

Ce5c should reuse the actual app/API/adapter/journal harness with a contact-final
supplier fixture: review causes0save requests, final consent causes1, changed
details/replay are blocked, and recovery uses the durable journal. Publication is
owned by32d5 after integration validation. No real Riche booking is claimed.

## Native Velvet review implementation

`VELVET_RICHE_RECEIPT=enabled` independently enables the receipt policy and
contact-final review contract. `review` freezes server-read policy-approved
booking details and a bounded atomic view (full visible text, page URL, visible
anchor destinations/labels and checkbox states). It performs no provider click,
no journal reservation and no arming. The UI displays the frozen details and
web links, then resets consent. The server-issued review token is session-bound.

A separate final action checks current revision, fresh consent, token, unchanged
provider details and view, and a five-minute review lifetime. It reserves SQLite
before clicking the source-backed Next button. The route still checks the exact
approved request before one transmission. A denied durable reservation returns
a locked unknown snapshot without a provider click; uncertain click/transport
outcomes remain consumed. Editing invalidates review. Existing provider-side
review flows remain unchanged; payment-required meals hand off.

Narrow review found and fixed truncation and href-binding issues; full text is
now bound up to64k (oversize fails closed), with at most100 visible links. All
link destinations participate in binding; only HTTP(S) links render clickable.
The Swedish review UI and actual newlines were visually checked in the local
supplier-fixture screenshot. No provider booking was created by this work.

### Phone projection before the final provider action

The real Riche guest form stores typed phone input separately from Booking.phone;
Next validates and copies the canonical number and country code. The earlier
fixture incorrectly copied phone on input; activation was held when a read-only
real-contact check exposed this difference.

For this scoped path only, `readRicheContactPhone` reads the unique visible phone
component and its selected country metadata. It uses the provider's read-only
phoneValid/intlTelInputUtils validation and formatting, including the exact NANP
prefix rule from libPhoneUtils.js?t=12 (SHA256
`d860a6780f1016797e35e5490b25aecdec6b49a600e1fb76d23dca59bb3adfd7`). It does not
instantiate the plugin, click Next, initialize a second widget or change Booking.
Canonical/raw number, ISO country and dial code join the frozen review binding.
Final intercepted request must match the canonical phone and both country_code
and dial_code. Missing or ambiguous metadata/invalid phone fails closed. Other
restaurants retain their existing model-read behavior.

### Final validation

Exact runtime phone helper and mirror passed guarded real-contact reads at
2026-10-16T03:09:17Z (source d9d24e5): bookingDetails returned the canonical
synthetic phone, three binding reads stayed identical across snapshot/settle,
and seeded review survived snapshot while Booking.phone stayed empty/unchanged.
Unique input/title/E164 checks passed. This was read-only, with no final click.
See PR172 comment6207166504. It proves actual read/retention, not dispatch.

Existing actual app/API/adapter/SQLite harness --riche passed on runtime2cc956b
(test source9811f44):120 API calls,4 restarts,3 simulated supplier POSTs,0 real
supplier requests. The source-faithful fixture keeps phone/country/dial absent
from Booking until Next. Review leaves them absent while displaying the canonical
phone. Direct submit, edited details, stale token and changed terms link all stop
before reserve/click; fresh consent gives one double-click transmission. Missing
and wrong receipts stay unknown; original completion navigation confirms and
survives restart. Denied replay returns locked unknown before Next. Prior failing
phone fixture reproduced the bug on8e61730. Noema and Ciccios regression runs
passed84 API/4 restarts/3 simulated POSTs each before the Riche-only phone delta.
14 focused receipt/journal tests also pass. Narrow reviews accepted the final
consent/dispatch/phone wiring. No real reservation, hold, code or payment made.
