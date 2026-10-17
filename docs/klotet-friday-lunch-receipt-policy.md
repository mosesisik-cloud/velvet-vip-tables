# Café Klotet recurring Friday lunch: scoped provider handoff

Reviewed 2026-10-17. [Official site](https://cafeklotet.se/) identifies Café Klotet, Urvädersgränd 15A, 116 46 Stockholm, and its ordinary booking route is [Bokabord](https://app.bokabord.se/reservation/?hash=dc1cbc8f42a27a99c6cf4174dd8bf6fa). This is not Gondolen or an event link. Local catalog/registry search on main `a694308a5dcc611c5eae70598de337ebf2fac525` found no Klotet/hash entry. Proposed policy ID `curated-STO-cafe-klotet` must be confirmed/reconciled by owner32d5 against the current catalog/aliases before activation; no catalog entry is created here.

## Public initial contract

Meal 63872, `Fredagslunch på Café Klotet`, type0, is a recurring lunch: Swedish/English text explicitly says Fridays 12:00–15:00; disabled weekdays are 1,2,3,4,6,7. `dateymd:20260911`, date1789077600 and dateto1797634799 correspond to 11 September through 18 December 2026 in Europe/Stockholm. `must_pay_directly:false`, `mandatory_products:false`, `empty_cart_disallowed:null`, `bullets:{}`, min1/max12. The exact policy caps party at2 and accepts only Fridays in that source date range, with start times12:00 inclusive to15:00 exclusive. Availability remains authoritative; this window does not create or guarantee slots.

This is a second exact reviewed type0 tuple following the existing Dagmar pattern, not a generic type0 permission. All tuple fields, including marker `cafe-klotet-friday-lunch:63872:2026:v1`, must match. Changing venue/hash/meal/type/party cap or borrowing another marker is rejected. The additional date/time guard applies only to this exact tuple. It intentionally expires with the published period; refresh evidence before any extension.

Excluded meals: ordinary dinner39316/type3 has `must_pay_directly:true`; group39493, New Year43781/53207, brunch54658 and Christmas64420 also have that flag. Empty card bullets do not cancel a payment flag. No special/holiday meal is substituted for ordinary lunch; no unpaid dinner is claimed.

Settings: `canUseAuthFeature:false`, `_allow_temp:false`, `_widget_preset_meal:false`, `confirm_in_widget:false`, `custom_request:false`, `group_bookings:false`, `linked_meals:[]`. Alternate-meal mappings exist for other IDs and do not authorize substitution for63872. Meal group_booking metadata is true, but actual group receipts remain rejected.

## Existing engine integration

Use the existing feature-off Riche/Sturehof submission boundary: Velvet review/approval must precede contact Next, which can call completeBooking and saveBooking directly. Public client v6.0.3 guestCtrl lines2360–2369/2531–2540 and save5057 establish that boundary. `confirm_in_widget:false` is routing only. Retain exact approval/contact/phone digest, terms, durable attempt locking, and no automatic resubmission. Never send codes, contact or a hold merely to inspect this path.

The receipt verifier still requires a matching captured request and server booking plus a fresh independent main-frame completion receipt. Card/no-show/product/group/temp/waitlist requirements remain unsupported. Numericstatus1, success events, 2xx or redirects alone remain unknown. Positive tests are explicitly synthetic fixture proof, not a live reservation.

## Evidence and verification

Initial HTML SHA256 `f3fbc2cdffdb05c7e751750e2abac4a6f6416b009b948565092add84378b24c0`. Shared client v6.0.3 reviewed earlier the same day has SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. Only public initial HTML/site were read for this candidate; no availability POST, contact, authentication, hold, booking, payment or receipt-capability request was made.

`node scripts/test-bokabord-receipt-confirmation.mjs`:25 tests pass on this base, including two new Klotet cases with exact tuple, excluded meals, date/time boundaries, card/consent/contact/replay and receipt negatives. `git diff --check` passes. Gondolen changes may be added by concurrent integration; this branch does not revert them and must be merged preserving both policies/tests.

Handoff to32d5: confirm canonical ID; integrate only63872 and the restricted Friday window through the existing motor; expose the accurate Friday-lunch scope in Velvet; validate app/review/journal/receipt handling after Gondolen. Shared catalog/app/server/release are not modified here. This handoff alone does not publish or activate Café Klotet.
