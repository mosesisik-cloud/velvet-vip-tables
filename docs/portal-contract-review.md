# Portal — ordinary payment contract blocked

Reviewed2026-10-18 from main `9bc3413c87237858e36275e6dfd0584e932a2897` (release225). Official identity Portal Restaurant, Sankt Eriksplan1,11320 Stockholm, [official site](https://www.portalrestaurant.se/). Provider name is `Portal`. No policy/activation is added.

## Source-supported entry and language

Official ordinary button publishes data-hash `6693e91a112345678274eac4d503eabc`, data-lang `sv`. Fresh public widget.min.js201/203 reads the language and normalizes sv to sw;212 builds app.bokabord.se/reservation/?app_type=bokabord&hash=;219 appends lang. The bounded initial GET therefore used `https://app.bokabord.se/reservation/?app_type=bokabord&hash=6693e91a112345678274eac4d503eabc&lang=sw`. No version=new was added.

The separate beta.waiteraid link with version=new/mealid11414 is not the ordinary widget entry. ID11414 is absent from the current native meals object; no meaning or availability is inferred and that link was not probed as a workaround.

## Initial contract and blocker

Lunch44/type2: min1/max8, weekday-only,11:15–15:00,date0/dateto0, must_pay_directly=true,mandatory_products=false,bullets={}. Middag168/type3: min1/max8, Sunday disabled,16:00–21:45, must_pay_directly=true,mandatory_products=false and explicit credit-card bullets. Its English description mentions Friday/Saturday card confirmation; this does not override the machine payment flag or establish a safe unpaid weekday branch. Empty Lunch card bullets do not negate its payment flag.

All remaining listed meals also have must_pay_directly=true:29757 beer event,38736 kitchen inspiration event,49654 afternoon sitting,53082 New Year lunch,53232 Lilla Studion via email,59188 guest-chef event. None is an ordinary unpaid substitute. Bar/drop-in suggestions in native descriptions are not reservable ordinary restaurant proof. Private/group/kitchen/event branches remain separate.

Settings canUseAuthFeature=true,_allow_temp=false,comment=true,confirm_in_widget=false,custom_request=false,group_bookings=false,is_bb=true; linked_meals contains8835→44. That linked-meal configuration is additional unreviewed behavior, not permission to accept linked submissions. Existing guards reject actual linked-meal booking payloads. Feature-on guest continuation would need the existing review/authenticated-Next safeguards, but does not solve payment or linked-meal evidence gaps.

## Exact missing evidence / stop

No source-supported unpaid ordinary branch is established. Need provider documentation or an authorized sanitized nonproduction reference chain for exact Lunch44/two guests: payment versus guarantee/conditional requirement, actual amount/currency and cancellation/no-show terms, linked-meal behavior, card-action completion, and an independently verified final booking receipt/state tied to the same approval/attempt. Initial flags do not tell whether funds would be charged or merely a card registered. Do not send production booking/card/meta/hold/contact requests to discover this.

Park Portal without new engine, adapter policy, fixture-positive or runtime activation. This does not claim that Portal cannot be booked on its own site. Do not reuse meal11414 or probe other candidates. Existing payment/receipt guards remain unchanged.

Initial HTML SHA256 `59998044a243d9b0c68e46e6c0a9026d76006cb47ddff4467fec26ddfe25d9c7`; fresh loader SHA256 `516df0eab0b780c8da6d9fb9ba08bc34c3813c2ae0d43584b9fe68cd8969c3ab`. One official GET, one loader GET, one native initial GET, then saved-source inspection. No holds/bookings/contacts/codes/payments/capability reads or restaurant messages. Zero new real final bookings. Documentation-only source audit and git diff --check; no code tests added. Owner32d5 retains shared catalog/runtime/release.
