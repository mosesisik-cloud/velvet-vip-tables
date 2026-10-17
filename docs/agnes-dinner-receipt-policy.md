# Agnes ordinary dinner — provider handoff

Reviewed 2026-10-17 on main `d6726f6c603d1f544be9f1d280dd474998b1d971`, preserving Gondolen and Café Klotet. Owner32d5 confirmed current catalog/alias/hash absence and reserved `curated-STO-agnes`. Official identity is Restaurang Agnes, Norra Agnegatan43, Stockholm, [restaurangagnes.com](https://restaurangagnes.com/). Provider name is exactly `Agnes`, which is the receipt-policy name.

The official Boka bord target is `https://app.waiteraid.com/reservation/?hash=1e49551d0d8b677c1dc6ad956301cec7&version=new`. A public GET followed its actual redirect to `https://app.bokabord.se/reservation/?hash=1e49551d0d8b677c1dc6ad956301cec7&version=new`. The host mapping is observed, not guessed. Both refer to this exact venue; capability URLs were not read.

## Initial provider contract

Implement only `AGNES_DINNER_RECEIPT_POLICY`: canonical ID above, hash `1e49551d0d8b677c1dc6ad956301cec7`, Middag1628/type3, maxParty2. Native meal range1–8; `must_pay_directly:false`, `mandatory_products:false`, `bullets:{}`. It is ordinary dinner, not an event. Published dinner hours17:00–22:00 and Monday disabled; availability must supply the actual offered time. Description asks guests to note seating duration in confirmation, says bookings from20:00 retain the table for the evening, and directs larger parties to other arrangements. Do not infer availability or silently change seating terms.

Exclude Lunch1627/type2, Köksbordet2775/type0 (bar stools, min5), and Vinkällaren3568/type0 (manual email arrangement, all weekdays disabled). English dinner text mentions a waiting list when no table is available; a waitlist entry must never become a confirmed reservation.

Settings: `canUseAuthFeature:true`, `_allow_temp:false`, `_widget_preset_meal:false`, `confirm_in_widget:false`, `custom_request:false`, `group_bookings:false`, `linked_meals:[]`, `comment:false`, `autoplacing_labels:true`. Preserve actual placement/seating labels; do not invent comment support. Initial flags cannot override later server requirements.

## Before-submit boundary and receipt semantics

Fresh common client v6.0.3 matches the established provider-review contract. guestCtrl.next2360–2369 sends an unauthenticated feature-on guest to auth with action sendAuthCode; authenticated guests instead call completeBooking directly. Auth routeBack770–788 returns guest continuation to guest-details with triggerCompleteY; guest initialization2385–2389 sets requireConfirmation for the unauthenticated path. Native final confirm2645 calls completeBooking2531–2540, which saves via POST `/reservation/api/booking/saveBooking` at5057. Initial templates contain the native final-confirm and guest-continuation controls.

Integration must reuse the existing Italiano/Ciccio's provider-review path, preserve the existing code/contact network guards, and require the expected unauthenticated state and native review. Do not probe by sending a code or entering contacts. Do not assume feature-on means contactNext is safe for an already authenticated session: fail closed or apply the existing explicit pre-submit review before that branch. No new route/guard bypass is introduced here. The actual Agnes interactive path has not been exercised; owner32d5 must verify it in the existing full-app harness before activation.

`confirm_in_widget:false` is routing only. Keep immutable approved details/phone, terms, durable-before-dispatch journal and no automatic retry. The unchanged verifier requires a matching captured request/response and a fresh independent main-frame receipt bound to the original booking/navigation. Numeric1, success events, 2xx and redirects are insufficient. Later card/no-show/product/group/temp/waitlist requirements stay unknown.

## Evidence and validation

- Initial native HTML SHA256 `0f48d5238c671b414763781388899c0c9b7294f70d291eb9fd2c6f2d903fe617`.
- Fresh public [app-widget.js?v=6.0.3](https://app.bokabord.se/production/app-widget.js?v=6.0.3) SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`.
- Public document/redirect/client GETs only; no availability POST, contacts, code, hold, reservation, payment or receipt-capability request.
- All29 receipt tests pass, including Agnes exact identity/type/cap/excluded meals plus payment, waitlist, consent, replay and independent-receipt negatives; Gondolen/Klotet cases remain passing. Positive results are synthetic fixture proof, not live bookings. `git diff --check` passes.

Handoff to32d5: add the reserved identity and exact dinner mapping to the existing registry, preserve real WaiterAid-to-Bokabord routing, run the full provider-review app/journal harness, then release only the verified scope. Shared catalog/registry/server/UI/release remain owned by32d5. This change adds only an explicit policy, tests and evidence; no generic verifier logic changes or additional restaurant queue entries.
