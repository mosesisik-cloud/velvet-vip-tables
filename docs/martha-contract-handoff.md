# Martha – Pizze Amore — first lunch for two

Refs #129; worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main249 3f8f1e15da1d3a489834b27bf83bf9be78bf9711. Canonical curated-PAR-martha-pizze-amore/export ZENCHEF_MARTHA confirmed by32d5.48 rue Richard Lenoir,75011Paris,rid364490. Other parked candidates excluded.

## Own evidence,2026-10-18

Read existing master capture C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/martha-paris-official-20261018.html locally, SHA256 8dac4236f67298846ce86ad09c9b130352ab7f20ef0e5bc39428067fdc8ef74a. Own https://marthapizzeamore.com/reservez-une-table/ address and actual anchors https://bookings.zenchef.com/results?rid=364490&pid=1001 match. pid1001 explicit; French chosen inspection language, not source-anchor parameter; no fullscreen. No new official GET.

One results GET https://bookings.zenchef.com/results?rid=364490&pid=1001&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 a56c8cd1e7c4fe8b003ced00739ea61df115261b8d241433069df27f97315a05. Own first lunch159369 MIDI 1er service: confirmation false/until6 (native formula admits2), charge null/prepayment null/required offer false/from paxnull, cancellation10800 seconds SHIFT. Strict no-room flags/nullwishroom/emptyoffers. Two observed times12:00/12:30 are not holds/reservations. Second lunch159418 and evening159419/159420 excluded. Their source policies remain distinct; no alternative request.

One form GET https://bookings.zenchef.com/form?rid=364490&pid=1001&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform, SHA256 10bd667f07d0837a1aeebd999de9c33e68b0f040293d84335b650fe9bf6c17b3. Own Martha Pizze Amore identity matches. Same date/pax/slot/nullroom/emptyoffers; query.pid and state.partner_id are string1001. Six standard required fields; customFields/V2 empty, voucher optional unsupported. Shiftcomment null.

Own French notice says online reservations up to8, larger parties should contact by email/phone. Complete raw notice retained in digest; this does not change automatic threshold6 or exact2 scope. No seating duration/15-minute retention borrowed. Listed room name does not guarantee seating.

Current HTML references _app-30bffcb9f4c3b7b2.js and form-84144e7c9a8b854d.js matching local assets with SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4. No new assetGET or fresh-remote-byte claim. Raw own HTML work/martha-form.html retained for QA local native EULA replay.

## Implementation and verification

Named first-lunch policy pins own typed confirmation/nullcharge/prepay/offer/10800SHIFT/no-room and partner_id string1001. Martha explicitly added to the pid-bound venue checks on results/form and fresh verifyNativeRoom; no assumption that Pontoise/Sommelier automatically cover it. Missing/null/numeric/other fresh query.pid rejects before approval/grant; same variants in partner state also fail fresh own policy. Source pid retained in URL/native payload; no fullscreen or generic relaxation.

Fresh-field/strictroom/seating/rawEULA-notice-shift digest/consent/owner/session/revision/TTL/durablegrant/same-attempt independent saved readback preserved. POSTecho cannot confirm; unexpected room/offers/payment/action/reference/date/party/status remain unconfirmed. No actual supplier receipt read.

Focused tests PASS5/5: ten Martha synthetic browser scenarios, own2sourcecandidates and typed/missing/borrowedthreshold/second-lunch/evening/room/party negatives; explicit three-venue freshpid positive/invalid variants and Martha fresh partner-state variants; existing fresh-field regressions. Command ZENCHEF_TEST_SCENARIO_PREFIX=martha node --test --test-name-pattern="native booking and own-booking|Martha binds|fresh form|Fresh required|Explicit partner venues" scripts/test-zenchef-playwright.mjs. git diff --check PASS; no broad matrix rerun.

Four scoped files only.32d5 owns exact integration review/actualappQA including freshpartner and own native-local EULA/publication. No live contact input, choices, holds, bookings, payments, messages, capability/receipt reads, additional probes or new engine. Actual confirmed booking remains unverified.
