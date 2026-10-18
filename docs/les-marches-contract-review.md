# Les Marches — manual confirmation blocker

Refs #129; worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main245 b125b05b92b053ef884d451987b131ac5f1ffc26. Restaurant Les Marches,5 rue de la Manutention,75116Paris, Zenchef355969. Shared identity/registry/release remains with32d5.

Read master's existing official capture locally: C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/les-marches-official-20261018.html. SHA256 7046085a23a82937cfac5cb7c746fd772334f15af8d6a91958f4889d868f0cf3 matches. Own address and actual anchor https://bookings.zenchef.com/results?rid=355969&pid=1001&fullscreen=1&lang=fr. No repeated official GET. Unlike preceding venues, pid1001 is explicit in this source and retained.

One GET https://bookings.zenchef.com/results?rid=355969&pid=1001&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200. SHA256 70ea643020b064c9e427c7ccd415d8625fceb529cfcb8de3bc2d6117c8807da0. Native identity matches. Lunch53498 `déjeuner` has confirmation.is_auto=false and is_auto_until=null. Thus the native automatic-confirmation formula does not admit party two. Existing final confirmed-booking path must not present this as automatically confirmed.

Own lunch charge true/min_guests6/charge_per_guests25; prepayment null; required offer false/from pax null; cancellation10800 seconds relative to shift. hasRoomSelection=false,isRoomMandatory=false,wish.room_id=null,offers[]. Observed two-person times12:00,12:15,13:30,13:45 are not holds or confirmed bookings. Card threshold six does not itself block party two. Dinner53503 is also false/null automatic policy and has distinct charge/cancellation values; no alternate service/date probes.

Disposition: parked for manual confirmation. Docs and sanitized public results fixture only. No form GET, EULA rendering, inputs, room/offer choices, hold, reservation, payment, message, capability or receipt read. No new engine, invented automatic threshold or borrowed policy. This is not a claim of closure, lack of availability or inability to book via the restaurant's own route. Required form behavior and actual saved receipt remain unverified.

Validation: JSON generated from the captured public state; git diff --check PASS. No runtime code changed, so no runtime tests rerun. Shared fresh-field/room/seating/consent/durable/readback guards remain untouched.
