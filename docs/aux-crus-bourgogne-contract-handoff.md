# Aux Crus de Bourgogne — first lunch for exactly two

Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; refs #129. Clean main244 40ecef5b64b416281e62b6dfd0d786fbaadb5666. Canonical confirmed by32d5: curated-PAR-aux-crus-de-bourgogne, export ZENCHEF_AUXCRUSBOURGOGNE. 3 rue Bachaumont,75002Paris, rid352723.

## Own evidence on 2026-10-18

Read master's existing official HTML locally at C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/aux-crus-de-bourgogne-official-20261018.html, SHA256 ce9d68861e6f9b23674a8652a0f0a2156d40e55116b1cf8f069cdd87688d1463. Own address/JSON-LD and actual booking anchor https://bookings.zenchef.com/results?rid=352723&fullscreen=1&lang=fr plus matching widget. No repeated official GET.

One results GET https://bookings.zenchef.com/results?rid=352723&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 fb5490a24ab595059e0a64de2656abade67794ba2a1c22c6b43a8972b7e750c7. Native identity matches. Own lunch22200 `Déjeuner service 1`, automatic false/until4 (native automatic formula permits2), charge null, prepayment null, required offer false/from pax null, cancellation7200 seconds relative to BOOKING. hasRoomSelection=false/isRoomMandatory=false/wish.room_id=null/offers[]. Seven observed times12:00,12:15,12:30,13:30,13:45,14:00,14:15, not holds or guarantees. Dinner63455 has distinct card and cancellation rules and is excluded.

One form GET https://bookings.zenchef.com/form?rid=352723&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, page /form, SHA256 8cc8b9576f3b286e30bddaf6cbafbb0960c5f5a2197cf3228bbe5f4ed7cfab99. Same date/party/slot, roomnull/emptyoffers. Six required standard contact fields; customFields and customFieldsV2 empty. Optional voucher unsupported. Listed rooms do not authorize selection or guarantee seating when room selection is false.

Own FR notice says internet reservations up to four, larger groups should call; evening table duration two hours and second service21:30. Preserve complete raw notice and native EULA/shift digest. No lunch two-hour guarantee, 15-minute retention, annual date rule or Aux Bons Crus optional-room exception. Lunch shift comment null.

Current HTML references the existing local _app-30bffcb9f4c3b7b2.js and form-84144e7c9a8b854d.js; no new static GET. Reused saved bundle bytes from Aux's prior authorized capture: app SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd, form SHA256 b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4. Original references match; no claim of a fresh remote bundle-byte verification. Existing native final submission assembles omitted wish when roomnull, empty offers/custom fields and default partner1001; no pid query injected.

## Implementation and validation

Only named provider policy/export, fixture, tests and this handoff. Own typed service/auto/card/prepay/offer/cancellation/room flags pinned; no generic relaxations. Existing fresh-field revalidation, notice/EULA digest, explicit consent, durable grant, owner/session/revision/TTL and same-attempt independent own-readback retained. POST echo cannot confirm; selected room/payment/action/missing reference/pending/error/changed date or party cannot confirm. No real final receipt read; actual supplier confirmation remains unverified.

Focused tests PASS4/4: ten Bourgogne synthetic browser scenarios (own-readback positive and missing/pending/date/party/offer/card/manual/stale notice/wrong durable-service negatives), source seven candidates and typed/missing/policy/room/dinner/party-three negatives; existing fresh-field regressions. Command: ZENCHEF_TEST_SCENARIO_PREFIX=bourgogne node --test --test-name-pattern="native booking and own-booking|Aux Crus de Bourgogne|fresh form|Fresh required" scripts/test-zenchef-playwright.mjs. git diff --check PASS. No broad matrix rerun. Initial focused run caught an unmodified copied charge policy; corrected to own null charge, final tests above PASS.

Raw own form HTML for local EULA replay is work/aux-crus-bourgogne-form.html in this checkout. Exact integrated review, actual app QA/EULA rendering and publication belong to32d5. No additional live sources are required by this handoff; reuse matching local static assets. No live browser input, room/offer selection, hold/cart/booking, payment, message, capability or receipt read. Shared files unchanged and parked identities excluded.
