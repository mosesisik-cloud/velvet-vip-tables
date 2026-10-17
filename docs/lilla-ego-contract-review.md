# Lilla Ego — ordinary dinner blocked

Reviewed2026-10-18 from main `9bc3413c87237858e36275e6dfd0584e932a2897` (release225). Official identity Lilla Ego, Västmannagatan69,11326 Stockholm, [official page](https://www.lillaego.com/content/lilla-ego). Its shared booking/giftcard widget publishes hash `a6ec81a26b9ea18ff9ba9852b8dcaa0b`. Reused the already inspected official Bokabord loader's app_type=bokabord URL construction, with no speculative version or meal parameter. One public native initial GET at `https://app.bokabord.se/reservation/?app_type=bokabord&hash=a6ec81a26b9ea18ff9ba9852b8dcaa0b` returned provider name Lilla Ego and language sw.

## Exact findings

Only one native meal is published: Middag6518/type3,min1/max10, Tuesday–Saturday,17:00–23:00,date0/dateto0. must_pay_directly=true,mandatory_products=false,bullets.cc exists with empty Swedish/English values. Empty card copy does not negate the payment flag and does not explain amount, guarantee versus charge, conditions or final booking status.

Its description includes dining room, kitchen-bar high stools, and a basement séparée for7–10; no particular placement for two is established. Drop-in bar seats are not a confirmed booking fallback. The official one-month release schedule and opening hours do not prove current slots. Gift cards share the button but are not an alternative ordinary dinner contract.

Native `_allow_temp:true` adds a separate hold boundary. Saved common client v6.0.3 lines3745–3747 conditionally invokes reserveTempBooking;5059 defines the temporary saveBooking path;5094 can reuse temp_booking_id. No time was selected and no such request was made. Do not attempt a protected-path probe merely to discover whether a temporary hold would occur.

Settings canUseAuthFeature=true,comment=true,confirm_in_widget=false,group_bookings=false,custom_request=false,linked_meals=[],autoplacing_labels=true,idle_reload_time5. Existing guest-review/authenticated-Next and phone protections do not establish a supported payment/temporary-hold chain. No session/capability value is retained in this evidence document.

## Missing evidence and stop

For exact Middag6518/two, need provider documentation or an authorized sanitized nonproduction reference chain establishing payment/card requirements, amount/currency/guarantee/terms, temporary-hold lifecycle and permitted consent boundary, and independent authoritative final receipt/state bound to the same attempt. Also retain the actual selected placement rather than promise dining-room seating. Initial flags alone do not establish any of these server contracts.

Park without policy, catalog activation or invented unpaid fallback. No positive booking fixture or engine change. This is not a claim that the restaurant cannot be booked via its own site. Do not make further live probes or visit capability URLs to fill the gap.

Initial HTML SHA256 `7e662d788f7884f619c1394614b2f6a77400e3b85de0ac06eadfd3304ad08dea`. Common native client captured2026-10-17 SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. One official and one initial GET; remaining work used saved files. No holds/reservations/contacts/codes/payments/capability reads or restaurant messages. Zero new real final bookings. Documentation-only source inspection and git diff --check; no code tests added. Owner32d5 retains shared catalog/runtime/release and should leave source-first integration stopped.
