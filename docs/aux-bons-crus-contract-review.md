# Aux Bons Crus: optional room contract not supported

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main243 8702ab61fc5b2ba02414d5ef718ee5edb9b1c9c0. Canonical confirmed by release owner: curated-PAR-aux-bons-crus, 54 rue Godefroy Cavaignac, 75011 Paris. Do not substitute the old rue des Petits Champs address. Master/release independently verified the official https://auxbonscrus.fr/ address and booking anchor/widget rid352718; this worker did not repeat that GET.

## Own read-only evidence

One GET on 2026-10-18 to https://bookings.zenchef.com/results?rid=352718&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned HTTP200. SHA256 2774070f2c354e58bd93ff55b42b62075d139050d74a8f09e82b3d56d9b8edc1. Native name AUX BONS CRUS and address 54 RUE GODEFROY CAVAIGNAC, Paris match. Query retains fullscreen1/langfr and has no pid.

Lunch20711 Semaine Midi is automatic true/until null, charge null, prepayment null, required offer false/from pax null, cancellation14400 seconds relative to shift. Ten observed times for two, 12:00 through14:15 every15minutes. These are observed candidates, not reservations or guarantees. Dinner57365 has a card threshold of one and is excluded; do not call lunch card-required.

The exact blocker is optional room selection: hasRoomSelection=true, isRoomMandatory=false, wish.room_id=null, one room10289 Salle principale. Lunch bookable_rooms and available_rooms[2] contain10289. Existing no-room scopes require hasRoomSelection=false, while the room path validates isRoomMandatory=true. Neither contract proves this optional-room path's selection, payload and saved receipt behavior. Do not erase the room flag, invent a chosen room or weaken the shared guards to make the candidate pass.

Own French notice describes Friday/Saturday dinner first-service table return at21:30, dinner card imprint and calling for groups of five or more. Lunch shift comment separately says call for seven or more. Both are recorded as source text; neither supports imposing dinner card/retention rules on lunch for two.

## Disposition

Parked with docs and sanitized public fixture only. No provider/registry/API/UI activation. No form GET, choice, hold, booking, contact input, code, payment, message, capability or receipt read. No new engine or duplicate probe. The current shared fresh-required-fields guard remains unchanged. Form requirements, EULA and actual final receipt are unverified. This is a bounded implementation gap, not evidence that the restaurant is closed or unbookable through its own site.
