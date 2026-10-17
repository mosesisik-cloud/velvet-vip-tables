# Luzette ordinary Lunch — provider handoff

Reviewed 2026-10-17 on main `19e46820ad24597f79faf87520717de5809ab455` (release219). Owner32d5 checked current catalog/aliases/hash and reserved `curated-STO-luzette`. Identity: Luzette, Centralplan25, Stockholm. The [official booking page](https://luzette.se/boka-bord/) links WaiterAid with hash `e2b9133107e1225157d4ea30e3967d5c`; a public GET observed the actual redirect to `https://app.bokabord.se/reservation/?hash=e2b9133107e1225157d4ea30e3967d5c`. Provider name is exactly Luzette.

## Exact scope and requirements

`LUZETTE_LUNCH_RECEIPT_POLICY`: reserved ID above, Lunch7253/type2, maxParty2. Published `must_pay_directly:false`, `mandatory_products:false`, `empty_cart_disallowed:null`, `bullets:{}`. Native text says lunch for1–8, max_amount8; minimum0 is unset rather than permission for zero guests. Policy permits only1–2. Official booking supports up to8 and directs9+ to contact; no group-contact fallback is implemented.

Native lunch tstart11:15/tend15:00, date0/dateto0 and no named disabled weekday. Exact-tuple approval validation accepts11:15 inclusive to15:00 exclusive, deliberately treating the end conservatively. This does not generate slots or prove availability: integration must use actual returned offers. No fixed date/holiday schedule is invented. Any changed tuple for this canonical ID is rejected; other restaurants' rules remain untouched.

Excluded: dinner7254, breakfast7434, New Year44511, group dining49633, small dining-room group49749, Christmas51726 and Christmas groups52551. Neither an unpaid flag nor a similar meal name authorizes substituting these for ordinary Lunch.

## Contact-final boundary and phone

Initial `canUseAuthFeature:false`, `_allow_temp:false`, `_widget_preset_meal:false`, `confirm_in_widget:false`, `custom_request:false`, `group_bookings:false`, `linked_meals:[]`, `comment:false`, `separated:true`, `widget_end_time:false`. Preserve the actual provider meal selection and do not promise an end time when it is not displayed. Do not invent comment support.

Use the existing Riche/Sturehof/Gondolen contact-final route, not the feature-on Agnes provider-review route. Common native guestCtrl.next2360–2369 calls completeBooking directly when loginFeature is false; completeBooking2531–2540 saves via POST saveBooking5057. Velvet must show its review, exact terms/details and final consent BEFORE contactNext; no click or contact submission may be used to inspect what follows. `confirm_in_widget:false` affects routing only, not whether submission occurred.

Retain native .phoneField/intlTelInput projection, immutable approved raw/canonical phone binding and re-read before dispatch. Common client2268 stores guestPhone separately;2391–2400 initializes the native widget;2306–2316 validates, gets the native canonical number, sets country code and copies booking.phone on Next. Do not model canonical phone as a plain oninput assignment.

Retain release218 pretransport approval and durable attempt lock plus release219 existing scopes. Receipt verification still requires captured matching submission/response AND a fresh independent main-frame receipt tied to the same booking/navigation. Later card/no-show/product/group/temp/waitlist states remain unknown; 2xx/status1/redirect/event alone cannot confirm. No shared server/mirror/UI changes are included.

## Evidence and verification

Initial native HTML SHA256 `a5ccee92d62b9256f5befe60ff2e0920ee14aac60bf31183245f8a399940af27`; it references common app-widget.js?v=6.0.3. Same-day reviewed common client SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. Only public initial/site/redirect reads; no contacts/codes/holds/bookings/payments/capability reads or restaurant messages.

All33 receipt tests pass: two new Luzette cases cover exact tuple, party/time boundaries, all excluded meals, required submission/native canonical phone, later requirements, replay and independent receipt; existing policies remain passing. Positive proof is synthetic fixture evidence, not live completion. `git diff --check` passes.

Owner32d5: integrate the reserved identity and exact Lunch policy through contact-final handling; ensure approvalDigest runs before transport, preserve phone/journal/receipt checks, and run the actual Velvet review/submit/history harness before release. Availability and interactive Luzette flow remain unobserved here. This is the sole new handoff; shared catalog/registry/server/UI/release remain yours.
