# Aux Bons Crus: optional-room evidence and room-null follow-up

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main243 8702ab61fc5b2ba02414d5ef718ee5edb9b1c9c0. Canonical confirmed by release owner: curated-PAR-aux-bons-crus, 54 rue Godefroy Cavaignac, 75011 Paris. Do not substitute the old rue des Petits Champs address. Master/release independently verified the official https://auxbonscrus.fr/ address and booking anchor/widget rid352718; this worker did not repeat that GET.

## Own read-only evidence

One GET on 2026-10-18 to https://bookings.zenchef.com/results?rid=352718&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned HTTP200. SHA256 2774070f2c354e58bd93ff55b42b62075d139050d74a8f09e82b3d56d9b8edc1. Native name AUX BONS CRUS and address 54 RUE GODEFROY CAVAIGNAC, Paris match. Query retains fullscreen1/langfr and has no pid.

Lunch20711 Semaine Midi is automatic true/until null, charge null, prepayment null, required offer false/from pax null, cancellation14400 seconds relative to shift. Ten observed times for two, 12:00 through14:15 every15minutes. These are observed candidates, not reservations or guarantees. Dinner57365 has a card threshold of one and is excluded; do not call lunch card-required.

The initial implementation gap was optional room selection: hasRoomSelection=true, isRoomMandatory=false, wish.room_id=null, one room10289 Salle principale. Lunch bookable_rooms and available_rooms[2] contain10289. Existing no-room scopes require hasRoomSelection=false, while the room path validates isRoomMandatory=true. Neither contract proves this optional-room path's selection, payload and saved receipt behavior. Do not erase the room flag, invent a chosen room or weaken the shared guards to make the candidate pass.

Own French notice describes Friday/Saturday dinner first-service table return at21:30, dinner card imprint and calling for groups of five or more. Lunch shift comment separately says call for seven or more. Both are recorded as source text; neither supports imposing dinner card/retention rules on lunch for two.

## Authorized single form follow-up

Master requested one form GET without a room parameter or selection to determine whether a venue-specific room-null policy could reuse the existing engine. The GET to https://bookings.zenchef.com/form?rid=352718&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, page /form, SHA256 0b7c5fe62e1be9c2e43ec2422ccc542459c01c20d4fad044db417fdd1d84b380. Native wish remains room_id=null, offers=[], exact date/party/slot; hasRoomSelection=true/isRoomMandatory=false. Six standard required fields; customFields/customFieldsV2 empty and default custom_field={} / custom_field_v2=[]. No field input or selection.

Current form-referenced bundles were fetched once and match reviewed hashes:
- _app-30bffcb9f4c3b7b2.js: f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd.
- form-84144e7c9a8b854d.js: b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4.

Native route code defines room-missing as isRoomMandatory && !wish.room_id. False mandatory therefore explicitly permits null. Native createBookingData assigns S=wish.room_id and conditionally adds wish.booking_room_id only for truthy S; null uses the existing omitted-wish payload with empty offers/custom fields. The same createBooking function posts the assembled data and stores the returned UUID. The existing native receipt loader maps absent/null wish.booking_room_id to null. This is source evidence for the same submission/readback path, not an actual saved booking receipt.

A narrow venue policy can potentially pin hasRoomSelection=true, isRoomMandatory=false, wish.room_id=null, own room10289 and lunch20711 while preserving the no-chosen-room payload/readback guards. No generic relaxation of mandatory-room/seating/card/freshfield checks is justified. The earlier docs-only parking is provisional pending release-owner assessment of this additional evidence, implementation and exact review/QA.

## Boundaries

Only docs and sanitized fixture changed so far. No provider/registry/API/UI activation, room choice, hold, booking, contact input, code, payment, message, capability or receipt read. No duplicate results search or alternate date. The current shared fresh-required-fields guard remains unchanged. Actual rendered EULA and final receipt remain unverified; source-only form access is not a completed booking. This is not evidence that the restaurant is closed or unbookable through its own site.
