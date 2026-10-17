# Gondolen ordinary Lunch: provider policy handoff

Reviewed 2026-10-17. Integration owner32d5 reserved `curated-STO-gondolen` after finding no current catalog/alias entry. Exact restaurant: Gondolen, Stadsgården 6, floor 11, 116 45 Stockholm. The [official homepage](https://gondolen.se/) identifies that address and links ordinary BOKA BORD to the [Bokabord widget](https://app.bokabord.se/reservation/?hash=720cdcb4d664ceeebbe8548904e275e6). This is not the event-calendar link or a neighboring restaurant.

## Reviewed scope

`GONDOLEN_LUNCH_RECEIPT_POLICY`: hash `720cdcb4d664ceeebbe8548904e275e6`, meal 33008, name Lunch, type 2, maximum party 2. Provider meal metadata allows up to 7, but Velvet scope is deliberately capped at two. Published values are `must_pay_directly:false`, `mandatory_products:false`, `empty_cart_disallowed:null`, empty `bullets`, and empty meal description. This establishes the initial ordinary-meal policy, not a guarantee that future/server-side requirements cannot change.

Dinner 33009/type3 has `must_pay_directly:true`. Its text says card confirmation is required above five guests, with a 250 SEK/person no-show charge. Do not infer that dinner for two is eligible from that text while its machine payment flag remains true. All other published meals are also excluded: Kungarummet Middag 34460, Nyårssupé sen 36498, Kungarummet Lunch 39271, Brunch 46058, julmeny 51679, Nyårslunch 53289, Nyårssupé tidig 53348, Nyårslunch 53350, Fars dag 65403. A special lunch must never substitute for ordinary Lunch 33008.

Widget settings: `canUseAuthFeature:false`, `_allow_temp:false`, `_widget_preset_meal:false`, `confirm_in_widget:false`, `custom_request:false`, `group_bookings:false`, `linked_meals:[]`. Meal-level `group_booking:true` is metadata, not an actual group reservation; actual group receipts remain rejected.

## Submission and confirmation boundaries

The public client is identical to the reviewed shared native source: guest Next with the authentication feature disabled can call `completeBooking()` directly (lines 2360–2369). That function calls `booking.save()` (2531–2540), which POSTs `/reservation/api/booking/saveBooking` (5057). Therefore integration must reuse the existing Riche/Sturehof native Velvet review **before** this contact Next boundary, retain the immutable approval/contact digest and durable attempt lock, and not send authentication codes or substitute a provider review page that this route does not guarantee.

`confirm_in_widget:false` is routing metadata only. Native success events, numeric status1, a redirect or 2xx alone never establish a confirmed reservation. The unchanged shared verifier requires the captured request and booking to match approval, rejects any card/no-show/payment/product/group/temp/waitlist requirement, and requires a fresh independently loaded main-frame completion document bound to the same booking and navigation. Unexpected requirements/results remain unknown; no retry or guard bypass is added.

## Evidence and validation

- Initial provider HTML SHA256: `9887ad44483caa87023c39340605b6a39c8d25ad4d120859b66590adf68b20ee`.
- Fresh public [app-widget.js?v=6.0.3](https://app.bokabord.se/production/app-widget.js?v=6.0.3) SHA256: `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`.
- Only public initial documents/client code were read. No availability POST, provider contact, code, hold, booking, payment or receipt-capability request was made. No real availability or completed Gondolen reservation is claimed.
- `node scripts/test-bokabord-receipt-confirmation.mjs`: all 25 tests pass, including two Gondolen tests covering exact identity, all ten excluded meals, party cap, new card requirements, consent/contact changes, replay, undispatched attempts and missing/mismatched independent receipts. Positive proof is explicitly synthetic `source:fixture`, not production evidence.
- `git diff --check` passes. Generic verifier logic is unchanged; this adds only the restaurant constant, tests and this evidence.

## Integration owner32d5

Add the reserved real catalog identity/alias and registry entry, select only meal33008 for the supported scope, and wire this exported policy through the existing ordinary Bokabord flow. Carry over the feature-off pre-submit review used by Riche/Sturehof, terms visibility and phone/approval binding. Verify the actual Velvet UI, attempt journal and provider-bound receipt behavior before release. This provider handoff does not itself activate or publish Gondolen and does not authorize a real reservation. Shared catalog, app, server and release remain owned by32d5.
