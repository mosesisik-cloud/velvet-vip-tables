# Le Florentin — lunch for exactly two

Refs #129; worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main248 d800df4b5178bb056d6367666bf45bfb9d14047d. Canonical curated-PAR-le-florentin/export ZENCHEF_LEFLORENTIN confirmed by32d5.10 Rue Saint-Florentin,75001Paris,rid376209. Stockholm Florentine is unrelated and untouched; Drugstore/other parked identities excluded.

## Own evidence,2026-10-18

Read master's local official files under C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/:
- le-florentin-official-20261018.html SHA256 06141d04b80515a2387cbdf60b0c516af7952d5c0f5453443100dc958ed16f6c.
- le-florentin-reserver-official-20261018.html SHA256 3cf590e84ae813b718614b6d33e3c297351c89e14322952e93b3da6e39ab7d6a.
Own canonical https://leflorentinbistrot.com/, address and real zc-widget-config restaurant376209/open0 match. No pid/fullscreen/lang on widget; French is selected inspection language, not an asserted source parameter. No repeated official GET.

One results GET https://bookings.zenchef.com/results?rid=376209&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 d2789aab17d737c95a1d3224b8eb7da30e837b85ed7ee9884e4a0a8bbf2851e7. Native identity matches. Lunch283681 Déjeuner, confirmation false/until6 (native formula admits2), charge null, prepayment null, required offer false/from paxnull,10800 seconds SHIFT cancellation. hasRoomSelection=false,isRoomMandatory=false,wishroomnull/offers[].13 observed lunch times12:00–15:00 every15minutes, not holds/reservations. Morning282308/afternoon283683/evening301346 excluded despite matching threshold; no alternate request.

One form GET https://bookings.zenchef.com/form?rid=376209&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform SHA256 277d84c8552bcf2bf17188a5bf97b1347ff8c11f9be86bea8eacdc2f4aade950. Same own identity/date/pax/slot/nullroom/emptyoffers. Six standard required contact fields; customFields/V2 empty, voucher hidden. Own raw FR restaurant notice: Bienvenue au Florentin, votre nouveau bistrot rue saint florentin. Own shiftcomment.fr: En continu. Neither establishes a90-minute seating cap or15-minute retention; none inherited. Room label Salle principale is not a room guarantee.

Current HTML references _app-30bffcb9f4c3b7b2.js and form-84144e7c9a8b854d.js, matching saved local assets with SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4. No new asset GET/fresh-remote-byte claim. Raw own HTML work/le-florentin-form.html retained for QA local EULA replay.

## Implementation and verification

Named no-room policy pins own typed lunch/false-until6/nullcharge/prepay/offer/10800SHIFT and strict room state. No generic relaxation. Native payload omittedroom/emptyoffers/customfields and established defaultpartner1001 without injected pid. Complete raw notice/shift/EULA digest remains. Fresh fields and explicit partner checks, room/seating/consent/owner/session/revision/TTL/durablegrant/same-attempt independent saved readback all preserved. POSTecho cannot confirm and unexpected room/offer/payment/action/missingreference/date/party/status cannot become confirmed. Actual supplier receipt never read.

Focused tests PASS5/5: ten Florentin synthetic browser scenarios,13 source candidates and typed/missing/borrowed-threshold/charge/room/other-service/party-three negatives; existing fresh-field and explicit-partner regressions. Command ZENCHEF_TEST_SCENARIO_PREFIX=florentin node --test --test-name-pattern="native booking and own-booking|Le Florentin|fresh form|Fresh required|Explicit partner venues" scripts/test-zenchef-playwright.mjs. git diff --check PASS. No broad matrix rerun.

Only provider/tests/fixture/docs.32d5 owns exact integration review/actual appQA/own native-local EULA/publication. No live inputs, choices, holds, bookings, payments, messages, capability or receipt reads, additional probes or new engine. Real confirmed booking remains unverified.
