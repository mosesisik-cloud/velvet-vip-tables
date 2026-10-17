# Brasserie Bobonne ordinary Lunch — provider handoff

Reviewed 2026-10-17 on main `7a2894e9375053bed5d48683955e87f96e9000fb` (release218). Owner32d5 checked current catalog/aliases/hash and reserved `curated-STO-brasserie-bobonne`. [Official site](https://bobonne.se/) identifies Brasserie Bobonne, Storgatan12,11451 Stockholm and links [Bokabord](https://app.bokabord.se/reservation/?hash=b529fb237cb8d5e64c73c1faba7e9854). Provider name is exactly `Brasserie Bobonne`.

## Exact ordinary scope

`BOBONNE_LUNCH_RECEIPT_POLICY`: reserved ID above, hash `b529fb237cb8d5e64c73c1faba7e9854`, Lunch31/type2, maxParty2. `must_pay_directly:false`, `mandatory_products:false`, `empty_cart_disallowed:null`, `bullets:{}`. Meal min/max0 are unset; global max_people6 applies, not zero allowed guests. Lunch disables Saturday/Sunday and has no fixed event date. Select an actually offered future ordinary lunch slot for app QA; no dates or slots have been probed or invented.

Native lunch tstart11:00/tend14:00 differs from official opening text11:30–14:00. Do not promise11:00 from metadata; use actual provider offers and conservatively keep the initial integration within the published opening window. No availability has been observed. Ordinary dinner155/type3 also has false payment/product flags, but is deliberately excluded from this handoff.

The shared integration enforces the conservative intersection before dispatch:
Monday–Friday, 11:30 inclusive to 14:00 exclusive, using the requested local date
and time. It does not invent availability or broaden the provider schedule. This
guard is bound to the exact Bobonne tuple and also applies to receipt approval.

Official restrictions: no online availability or same-evening requests go by phone; parties over6 go by phone/email; chambre séparée requires separate contact. This integration does not bypass those restrictions: it supports only ordinary Lunch for up to2 and never falls back to dinner, Salon/chambre, bar, event, takeaway or gift cards. Do not turn an unavailable result into a custom request or contact the restaurant automatically. Any future dinner scope must explicitly retain the same-evening restriction.

## Native submission boundary and release218 safeguards

Initial settings: canUseAuthFeature=true, testPhone=true, _allow_temp=false, _widget_preset_meal=false, confirm_in_widget=false, custom_request=false, group_bookings=false, linked_meals=[], comment=true. Reuse the existing unauthenticated provider-review path as with Agnes/Italiano. Common client2360–2369 routes unauthenticated contactNext into auth; authenticated contactNext can submit directly. Native guest continuation returns with triggerCompleteY (770–788); guest initialization2385–2389 sets requireConfirmation; final confirm2645 calls completeBooking2531–2540 and saveBooking5057. Retain existing code/contact guards and do not assume an authenticated Next is a harmless navigation.

Bobonne initial HTML98 enables testPhone;160 loads app-widget.js?v=6.0.3;986–989 binds native input.phoneField to guestPhone. Shared client2268 initializes guestPhone separately,2391–2400 initializes intlTelInput, and2306–2316 validates/reads iti.getNumber(), sets country code, strips whitespace and copies into booking.phone on Next. Preserve release218 native phone projection/approval binding, not a plain input/oninput fake.

Preserve release218 submission AND independent-receipt checks for provider-review routes. Captured request/response must match immutable approval and durable dispatched attempt; independent main-frame receipt must bind to the same booking/navigation. No success event, status1,2xx or redirect alone proves confirmation. Later card/no-show/product/group/temp/waitlist requirements stay unknown. No shared server/mirror/UI guard is changed by this policy.

## Evidence and validation

Initial native HTML SHA256 `abb9bf599431df8605b684527c93d7f5357c8e10164c2869fdfa8d7a249bdce8`. The referenced common v6.0.3 client was captured earlier today, SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`; this source contract was reused without another provider sweep.

All31 receipt tests pass, including two Bobonne cases for exact name/hash/meal/cap, excluded dinner, later requirements, native canonical phone mismatch, missing submission, replay and missing/mismatched independent receipt. Agnes/Gondolen/Klotet cases remain passing. Positive receipts are synthetic fixtures. `git diff --check` passes. Only public initial documents read; no contacts/codes/holds/bookings/payments/messages or receipt-capability reads.

Owner32d5 retains catalog/registry/server/UI/release. Integrate this exact lunch policy with the reserved identity, validate the actual review/phone/approval/journal path in the existing full-app harness, and preserve the restrictions above before release. Native interactive Bobonne flow, availability and real supplier success remain unobserved. This is the sole new handoff; no generic verifier logic changes or extra candidates.
