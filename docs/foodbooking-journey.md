# FoodBooking / Thaiyashi initial journey

Checked 2026-10-15. Exact official reservation link:
https://www.foodbooking.com/ordering/restaurant/menu?restaurant_uid=9aa12320-c8cb-4ff7-8d68-61e727ef13a4&reservation=true

Official source https://www.thaiyashi.co.za labels this Reserve a table and identifies Dean Street Arcade, Newlands, Cape Town. The reservation flag is essential; the otherwise identical link serves food ordering.

## Why the read-only test is blank

Browser loading attempted POST `/api/cart/init` twice. Both were blocked before transmission. Payload included exact restaurant_uid, reservation `true`, and payload language_code `sv`, init 1, source `website`, reference null. No guest data, selected time or party was supplied. Public JS loaded successfully; this is not evidence that restaurant booking is unavailable.

Public bundle inspected:
https://www.fbgcdn.com/ordering/main.f9ac83028f89b526.js

The Angular cart service `initRestaurant()` calls `generateInitPayload()` and `call("init", ...)`. It then expects restaurant and order state, validates order statuses (cart, pending, accepted, etc.), calls client-device initialization, and selects order type reservation when the reservation parameter is present. General cart-response processing stores `order.tracker`, restaurant data and scheduledOrdersIntervals. Initialization can subsequently call cart.update to configure type or payment preferences.

Therefore init is not established as a read-only availability query: its contract participates in server cart/order session creation or resumption. No undocumented GET alternative for venue availability/configuration was found in the route map. Do not broadly allow POST /cart/* or assume init has no state effects.

## Allowlist conclusion

No POST has been allowed and none is recommended as proven read-only from this evidence alone. Observed safe public bootstrap resources are the exact ordering document, public fbgcdn assets and GET `/api/translation/language_pack`. Bundle also declares GET /status and /device_location but these are not a replacement for reservation data. Tracker/order endpoints are not discovery APIs and were not queried.

Keep external official-link-only integration. To investigate beyond this boundary, parent must first decide whether isolated empty-cart/session initialization is within the intended test scope; it must not be represented as a read-only query. Any such future test should still block checkout/precheckout, transaction endpoints, cart item edits, client-device mutations, OTP preparation/validation, contact submission and actual reservation actions until individually reviewed. This report does not authorize such calls.

## Scope and evidence

No slot or date selection, hold, reservation, payment, OTP or contact submission. Initial form not rendered, so terms/cancellation/card requirements remain unverified for Thaiyashi. Generic bundle support for deposits or payment gateways does not prove this venue requires them.

Parent work artifacts: discovery-wave11-foodbooking-requests.json, discovery-wave11-foodbooking-scripts.json, discovery-wave11-foodbooking-main.js, discovery-wave11-foodbooking.mjs. Those public bundle files are diagnostic material, not application dependencies. No source/registry/deployment changes.
