# Au Moulin à Vent — lunch for two with own 90-minute seating notice

Refs #129; worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main246 8f93f6d7e17733f00025143207f0f9095f24ba5d. Canonical curated-PAR-au-moulin-a-vent confirmed by32d5; agreed export ZENCHEF_MOULINVENT.20 rue des Fossés Saint-Bernard,75005Paris,rid363128. No parked identity commits.

## Own evidence,2026-10-18

Read master's saved official HTML locally: C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/au-moulin-a-vent-official-20261018.html SHA256 3f88a482e55e5f2f97af6b55ab94f3d188ec445eeaa57672f90353fb1dbdcfce. Own address/open button/widget363128/langfr/GTC match. Widget evidence, not an asserted official results anchor. No pid/fullscreen assumed and no repeated official GET.

One results GET https://bookings.zenchef.com/results?rid=363128&lang=fr&day=2026-10-23&pax=2 returned200 SHA256 2db349eeeaa81afc49afbbb54de95669bed1a0ce989fa5923f1565b43c93e353. Own lunch139531 Déjeuner: auto true/untilnull, charge null, prepayment null, required offer false/from paxnull,10800 seconds SHIFT cancellation. hasRoomSelection=false/isRoomMandatory=false/wishroomnull/offers[]. Nine observed two-person times12:00–14:00 every15minutes, not holds/reservations. Dinner140331 differs (cardmin5/per35/cancel14400) and is excluded.

One form GET https://bookings.zenchef.com/form?rid=363128&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform SHA256 b031a406814d83ea45a1b48f2b6da2628f35310d0e8bbe45a44498c441bfe2fd. Nativeidentity matches; same date/pax/slot, nullroom/emptyoffers. Six standard required fields, customFields/V2 empty, optional voucher unsupported.

Own raw restaurantComment.fr: Au-delà de 8 couverts, merci de nous contacter directement par téléphone au <b>01 43 54 99 37</b>.
Own lunch shift.comment.fr: Votre table est disponible pour une durée de 1h30, en raison d'un double service.
These are distinct. The 90-minute seating text is required and exactly pinned in this venue policy, exposed through existing terms.seatingNotice before consent; complete shift is already in EULA/restaurantComment/shift digest. Missing/empty/changed seating rejects, and post-review change stops before grant/POST/readback. No15-minute retention rule borrowed from Retro; no room guarantee.

Current HTML references existing local _app-30bffcb9f4c3b7b2.js (SHA f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd) and form-84144e7c9a8b854d.js (SHA b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4). Matching saved assets reused; no new asset GET or claim of freshly fetched bytes. Raw own form work/moulin-vent-form.html retained for QA local EULA replay.

## Implementation and validation

Four scoped files: named provider/tests/sanitized fixture/handoff. Own typed service/auto/nullcharge/prepay/offer/cancel/room and seating pinned. No generic guard relaxation. Existing fresh-field checks, owner/session/revision/TTL, consent/durable grant and same-attempt independent saved readback retained. Native payload omits room, sends empty offers/customfields and default partner1001 without invented pid query. POSTecho alone never confirms; missing/pending/wrongdate/party/offers/room/payment/action/error remains unconfirmed. Actual receipt never read.

Focused tests PASS4/4: eleven Moulin synthetic browser scenarios including own-positive seating exposed in snapshot and post-review seating drift with zero grants/sends/reads, standard readback/card/manual/stale-notice/durable-service negatives; source9slots and typed/missing/borrowedcard/dinner/party/empty-null-missing-changedseating negatives; existing fresh-field regressions. Command ZENCHEF_TEST_SCENARIO_PREFIX=moulin node --test --test-name-pattern="native booking and own-booking|Moulin a Vent|fresh form|Fresh required" scripts/test-zenchef-playwright.mjs. git diff --check PASS. No broad matrix rerun.

32d5 explicitly approved existing seatingNotice UI path and owns shared integration, exact review/actualappQA including full90-minute notice and own native-local EULA, and publication. No live inputs/choices/holds/bookings/payments/messages/capability/receiptreads or furtherprobes. Actual confirmed booking remains unverified.
