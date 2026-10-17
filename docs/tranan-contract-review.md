# Tranan — ordinary flow blocked, no activation

Reviewed2026-10-18 from main `9bc3413c87237858e36275e6dfd0584e932a2897` (release225). Exact official identity: Tranan, Karlbergsvägen14,11327 Stockholm, [official restaurant page](https://www.tranan.se/restaurang/). Its button data-hash is `147d04d2ad025809c156a7f81eef15c8&lang=sw`. The assigned, source-supported widget entry read here was `https://app.bokabord.se/reservation/?app_type=bokabord&hash=147d04d2ad025809c156a7f81eef15c8&lang=sw`. No version=new was added. Provider name is Tranan.

## Observed initial contract

| Meal | Type | Direct-payment flag | Native time | Party |
| --- | --- | --- | --- | --- |
| Lunch1240 | 2 | true |12:00–16:00| min/max unset; global6 |
| Middag11857 |3|true|16:00–22:30|min/max unset; global6|
| Kort sittning Middag3831 |0|false|17:00–21:15|min unset,max2|
| Kort sittning Lunch47623 |0|false|11:30–16:00,weekdays|min1,max2|
| Teatersittning55920 |0|false|16:00–20:30|min1,max4|

All listed mandatory_products flags are false and card bullets empty. Empty card bullets do not negate must_pay_directly=true. Initial data does not disclose whether ordinary lunch/dinner requires a charge, guarantee, or conditional card action, nor its amount/terms/final receipt state. Existing unpaid receipt policy rejects those flags and is not relaxed.

Short sittings are separate choices, not interchangeable ordinary lunch/dinner. Dinner3831 has seating.allow=false,length_def90,length_min90 and books_after21:00; lunch47623 has seating.allow=false,length_def90,length_min60. Official general terms say weekday lunch1.5hours, weekend lunch2hours and dinner for two2hours. These fields do not establish an actual selected short-sitting duration/end-time contract; no slot response was requested. Do not present short dinner as a two-hour dinner or infer an exact short lunch duration from conflicting/default metadata. Teatersittning is explicitly for a short sitting before theatre, not a fallback.

## Additional constraints and boundary

Native comment=false,widget_end_time=false,canUseAuthFeature=true,testPhone=true,_allow_temp=false,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],is_bb=true. Official rules prohibit dogs and prams inside, allow carrying in a pram insert and ask that this be mentioned in the booking. A supported native way to convey that request has not been established with comment disabled; do not silently drop it, invent another field, or send the restaurant a message.

Official max6online, larger groups direct contact, no terrace reservations. Present cards share widget infrastructure but remain a separate purpose. Existing feature-on native flow would require unauthenticated guest continuation/review; authenticated Next may submit directly. Its general phone/approval/journal/receipt behavior does not solve the missing payment or short-sitting contract.

## Exact unblock evidence and decision

Stop this candidate without adding a venue policy, registry activation or alternate short-sitting workaround. For ordinary1240/11857, need provider documentation or an authorized sanitized nonproduction reference chain establishing actual card/payment requirements, amounts/terms and independently confirmed final booking status. Alternatively a separately reviewed short-sitting scope would need evidence of the exact offered duration and guest-visible terms, plus a supported way to handle the insert notification requirement. Public marketing duration and initial defaults alone do not supply that evidence. No claim is made that Tranan cannot be booked through its own site.

Initial HTML SHA256 `76851c1667e95b6a7af4819f69ffe270b52296ed05786e055c0b7d0975ba4d70`. Only one native initial GET and one official-page GET; subsequent inspection used saved files. No contacts/codes/holds/reservations/payments/capability reads or restaurant messages. Zero new real final bookings. Documentation-only validation: source inspection and git diff --check; no synthetic positive fixture or code test added. Owner32d5 retains catalog/shared runtime/release. No further probe or candidate started.
