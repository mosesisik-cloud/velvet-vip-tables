# Pelikan ordinary dinner — exactly two, no room promise

Reviewed2026-10-18 from main `8851dd85246228c3889f33f39cf7a1bfa1757a6a` (release222). Owner32d5 checked current identity/aliases/hash and reserved `curated-STO-pelikan`. Official identity Pelikan, Blekingegatan40,11662 Stockholm; provider receipt name is exactly `Restaurang Pelikan`.

Fresh [official booking page](https://pelikan.se/boka-bord) publishes ordinary WaiterAid booking hash `27fdc69fb0efef5d4125e11383c08ee8`. Initial native HTML was obtained by public GET of that published WaiterAid reservation URL. It contains the same hash and ordinary native meals. No old inventory hash or inferred restaurant field is used.

## Scope and published constraints

PELIKAN_DINNER_RECEIPT_POLICY: Middag1540/type3, exactly2 guests. Native min2/max10; must_pay_directly=false,mandatory_products=false,empty_cart_disallowed="0",bullets={}. Native date0/dateto0 and no disabled weekday; tstart16:00/tend22:30. Official hours are daily11:30–01:00, so the policy conservatively accepts native dinner start16:00 inclusive–22:30 exclusive. It creates no slots and proves no availability. Exact tuple is required; changing name/hash/meal/type/party cap for this canonical venue is rejected.

Excluded: Lunch293/type2, paid/card #HämtaHem11704/type10 and paid nyår26 meal65474/type0. Lunch metadata exists but published weekday lunch hours11:30–13:30 alone are not evidence of an offered bookable slot; no lunch claim or fallback is made. This handoff chooses one supported ordinary dinner variant.

Official booking text permits placement in EITHER linnematsalen OR stora hallen and states normal sitting duration2hours unless otherwise agreed. Preserve both facts in Velvet review/offer information; do not promise a specific room or invent an exact end-time response. Online up to10 and lunchgroups10+ contact do not expand this exactly-two policy. No group/contact fallback, room field, takeaway or holiday substitution.

## Native guest flow and evidence boundary

canUseAuthFeature=true,_allow_temp=false,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],comment=true,widget_end_time=false,autoplacing_labels=false,g_id63,idle_reload_time0. Use the existing unauthenticated provider-review path (Agnes/Italiano). Common client2360–2369 sends unauthenticated contactNext into auth; authenticated Next can submit directly. Native guest continuation returns triggerCompleteY and requires confirmation; final confirm2645 calls completeBooking2531–2540 and saveBooking5057. Preserve existing code/contact interception and pretransport approval guard; do not invoke contactNext as a probe.

Preserve native phone widget projection: guestPhone is separate from booking.phone until Next validates and reads native getNumber (common2268,2306–2316,2391–2400). Keep approved phone/details immutable, re-read before dispatch, retain fresh consent and durable journal locking. confirm_in_widget affects routing only. Matching submission/response plus independent fresh main-frame receipt bound to original booking/navigation remain mandatory; 2xx/status1/redirect/events alone are insufficient. New card/no-show/product/group/temp/waitlist requirements stay unknown.

## Verification and integration handoff

Initial HTML SHA256 `6d8e0b38526211653ed139d6fc765cd1dfad76f162084ea1fe5c3cd553e3fe36`. Shared native client source contract previously captured2026-10-17: app-widget.js?v6.0.3 SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. All39 receipt tests pass including two Pelikan cases for exact tuple, minimum/maximum party, time endpoints, excluded meals, payment/contact/consent/replay and receipt guards. Existing policies remain passing; git diff --check passes. Positive test receipts are synthetic fixtures, not real supplier outcomes.

Only public official/native initial reads were performed. No real holds, reservations, contacts, codes, payments, capability reads or restaurant messages. **Zero new real final bookings.** Native interactive Pelikan flow/availability remain unobserved.

Owner32d5 owns catalog/registry/server/UI/release: use reserved ID, exact provider name/Middag policy, correct official booking route, display room flexibility and normal2hour sitting, run the actual provider-review phone/consent/journal/receipt app harness before activation. This is the sole candidate/handoff; no shared runtime file or new engine is added.
