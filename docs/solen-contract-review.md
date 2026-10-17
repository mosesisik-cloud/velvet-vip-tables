# Solen — explicit card/payment blocker

Reviewed2026-10-18 from main `9bc3413c87237858e36275e6dfd0584e932a2897` (release225). Official identity Solen, Hallgränd45,12162 Johanneshov, [official site](https://solen.se/). Ordinary Book a table data-hash `1db5517eb0b89c62a69b1bb749f304b3` uses the previously verified Bokabord widget construction. One public initial GET used `https://app.bokabord.se/reservation/?app_type=bokabord&hash=1db5517eb0b89c62a69b1bb749f304b3`. No giftcard mealid33183/giftcard or version=new was imported. Native exact name Solen, default language en.

## Initial native evidence

All four published meals have must_pay_directly=true, explicit English/Swedish credit-card confirmation bullets and mandatory_products=false:

| Meal | Type | Party | Native time/day |
| --- | --- | --- | --- |
| Dinner31464 |3|1–11|16:00–23:00,Monday disabled|
| Weekend lunch31985 |2|min/max unset; description1–11|12:00–15:00,Saturday/Sunday|
| Short seating dinner32396 |0|1–9|16:00–18:00,Monday disabled|
| Short Seating Weekend Lunch32454 |0|1–9|12:00–13:00,Saturday/Sunday|

Ordinary descriptions specify the main dining room. Short sittings are separate event-oriented options and also require cards, not unpaid alternatives. No private dining, merch or giftcard contract is inferred from this list. Official opening/closed-date information does not establish available slots; none were requested.

canUseAuthFeature=false,_allow_temp=false,comment=true,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],is_bb=true,widget_end_time=true. Feature-off native contactNext can save directly; it must not be used to inspect payment requirements. No temporary-hold allowance is observed here, but that does not make the paid flow supported. Native English rendering would additionally need a separately verified existing-language route or completion contract before integration; no English-positive receipt is invented.

## Stop and exact missing evidence

Existing ordinary unpaid adapter cannot activate Dinner31464/two or Weekend lunch31985/two. Need provider documentation or an authorized sanitized nonproduction chain establishing actual card requirement, amount/currency, guarantee versus debit/capture, cancellation/no-show terms, payment completion and an independent final reservation receipt/status bound to the same approved attempt. Initial card flags and generic descriptions do not supply this. No production booking/payment/meta/hold/contact requests should be made to discover it.

Park without policy, catalog activation or fake positive fixture. Initial HTML SHA256 `5fc63d2b7914e436c536e2d2828cf570f6015d5b1a6e7fa8fb0fee4ba69109e0`. One official GET and one initial GET; source inspection then local only. Documentation audit and git diff --check pass; no code tests added. Zero new real bookings/holds/contacts/codes/payments/capability reads or restaurant messages. No repeat probes or additional candidate; owner32d5 keeps source-first integration stopped.
