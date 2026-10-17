# Bistro Bestick City — ordinary payment contract blocked

Reviewed2026-10-18 from main `9bc3413c87237858e36275e6dfd0584e932a2897` (release225). Fresh [official City page](https://bistrobestick.se/bistro-bestick) identifies Bryggargatan8,11121 Stockholm and publishes ordinary WaiterAid hash `7570295601a74fe73892636f439fdbe8`. Native exact name is `Bistro Bestick City`. This is not sister restaurant Gamla Stan/Skeppsbron10.

Official page code maps sv→sw and adds language to reservation links. Initial public GET used `https://app.waiteraid.com/reservation/?hash=7570295601a74fe73892636f439fdbe8&lang=sw`; native language is sw. No version=new was inferred from the separate giftcard link, and no giftcard path was opened.

## Observed meal contracts

| Meal | Type | Payment flag | Party | Native time |
| --- | --- | --- | --- | --- |
| Lunch inne21614 |2|true|1–8|12:00–16:00|
| Middag inne21582 |3|true, explicit card bullets|1–8|16:00–22:00|
| Lunch ute21581 |0|true|1–4|12:00–15:30|
| Middag ute21615 |0|true, explicit card bullets|1–4|16:00–21:15|
| Nyårsmiddag28894 |0|true, explicit card bullets|2–8|17:00–22:00,event dated|

All mandatory_products flags are false. Empty Lunch inne card bullets do not override its true payment flag. Ordinary indoor date/dateto are0 with no explicit disabled weekday; times and party bounds are not observed availability. Outdoor lunch explicitly warns indoor seating cannot be guaranteed in bad weather. No room/outdoor/event/giftcard alternative is substituted for ordinary indoor dining.

Native canUseAuthFeature=false,_allow_temp=false,comment=true,confirm_in_widget=false,separated=true,group_bookings=false,custom_request=false,linked_meals=[],gc_enabled=true,autoplacing_labels=true. Feature-off contactNext may submit directly through existing common completeBooking/saveBooking; do not probe it with contact data. No temporary-hold allowance is observed in this initial source, but that does not resolve the payment blocker. Giftcard enabled means infrastructure exists, not that its purchase contract can be used for dining.

## Exact missing evidence and decision

Stop without adding a provider policy, catalog activation or paid-flow bypass. For exact Lunch inne21614/two or Middag inne21582/two, need provider documentation or an authorized sanitized nonproduction chain establishing charge versus guarantee/conditional card requirements, actual amount/currency/cancellation/no-show terms, payment-action completion and independently confirmed final booking receipt/status bound to the approved attempt. Initial flags alone do not establish these server contracts. No unsupported unpaid alternative exists in the published meal list.

Initial HTML SHA256 `764f51f162b30b512c1d614d33e3c2bd80cc79a3dd6fe6510ba5b6190516992f`. One public official GET and one native initial GET, followed by saved-source inspection. No time selection, holds, reservations, contacts, codes, payments, capability reads or restaurant messages; zero new real final bookings. Documentation-only source audit and git diff --check, no fake positive fixture/code test. Owner32d5 should keep source-first catalog/integration stopped. No further probes/candidates.
