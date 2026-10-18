# La Petite Chaise — parked because card guarantee applies to two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Master-assigned candidate; base main265 aa85cdb7751168f673321292ccd79d4df92cee83. Identity-only4225fc1ef1024fc4864299293777ddf21f99af9f on32d5 codex/la-petite-chaise-integration remains isolated/unpublished. Canonical curated-PAR-la-petite-chaise; reserved ZENCHEF_LAPETITECHAISE / VELVET_ZENCHEF_LAPETITECHAISE unimplemented. No provider/shared activation.

## Own source and SDK chain, 2026-10-18

Official https://www.restaurantlapetitechaise.fr/ saved C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/la-petite-chaise-official-20261018.html; locally verified SHA25689e729fa37873dc7ecc765fda775b10043704335ff08c87ad4364cf4827cab0a. Own La Petite Chaise/36 Rue de Grenelle75007 Paris/01 42 22 13 35. Actual zc-widget-config has data-restaurant365058/data-langfr and https://sdk.zenchef.com/v1/sdk.min.js; no data-partner, data-position or data-hide-default-button.

Reused cached work/bouillon-racine-sdk.js SHA256f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c. Native URL builder defaults sdk1/withCloseButton1, maps rid/lang, emits showCollapsed1 when data-hide-default-button absent, omits null attributes. Default iframe placement right does not add iframePosition when data-position absent. No pid or preview. No SDK download or fresh remote hash claim; no unrelated restaurant partner requirement imported.

## One results GET only

https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=365058&lang=fr&showCollapsed=1&day=2026-10-23&pax=2

HTTP200/no redirect/page results/query preserved; raw SHA25633bb69a53c8237eec3767915d15dd16e130736bb5e489e987186309e25da7497. Native name La Petite Chaise/address36 Rue de Grenelle/zip75007/rid365058 matches. isDisabledfalse; querypid and statepartner absent, not null. Local work/la-petite-chaise-results.html,-next.json,-state.json. No form GET followed.

Lunch172004 exactlabel Dejeuner: auto true/untilnull, charge_param.is_web_booking_askable=true, min_guests=1, charge_per_guests=20. Therefore the card-guarantee policy applies to the requested two guests. Prepaymentnull is distinct from absence of a card guarantee. Cancellation7200 seconds SHIFT; noofferfalse/fromnull; shiftcommentnull. Five candidate times12:00,12:30,13:00,13:30,14:00 have two in possible_guests; not holds or confirmations.

Dinner172006 exactlabel Diner: auto false/untilnull, cardtrue/min_guests1/charge_per_guests50, prepaymentnull, cancellation86400 seconds SHIFT, noofferfalse/fromnull. No observed dinner slot with possible_guests including2. Manual dinner is distinct from automatic but card-backed lunch; do not generalize all services as manual or unavailable.

Six standard required fields. CustomFields[], customFieldsV2[], rawoffers[] and selectedwishoffers[]. Room selectionfalse/mandatoryfalse/wishroomnull. Voucher displayed, not tested. Full French restaurant notice: first-service reservations maximum two hours at table; after15minutes late table reassigned; groups over5 contact01 42 22 13 35. Dinner shift notice separately identifies first-service19:00/19:30 seating for two hours. Preserve these as own notices; cancellation duration is not seating duration. No invented generalized service hours.

## Decision and evidence boundary

PARK within the assigned ordinary two-person flow without card/deposit requirement. The missing implementation is an explicitly scoped, verified card-guarantee flow, including native guarantee terms/consent/payment-provider handling; none was probed or implemented here. No claim that restaurant booking is impossible or closed. Do not remove the card threshold, infer exemption from prepaymentnull, or substitute another service/date/party to bypass the observed contract.

Preliminary evidence sent to master and32d5;32d5 confirmed park after providing own identity. This delivery changes only this document. Validation: official/raw hash, exact SDK parameter derivation, own parsed service/field/notice read and diff check. No executable change or test loop. No form/browser/assets request, alternative date/pax/host, preview bypass, live contact input, hold, reservation, POST, submit, payment, receipt/capability read or message to restaurant. No real supplier confirmation. No self-merge/deploy; live release265 unchanged.
