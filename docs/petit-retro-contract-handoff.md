# Le Petit Rétro — lunch for exactly two

Refs #129; worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Clean main245 b125b05b92b053ef884d451987b131ac5f1ffc26, parked Marches/Paris16 excluded. Canonical confirmed by32d5: curated-PAR-le-petit-retro; export ZENCHEF_PETITRETRO.5 rue Mesnil,75116Paris,rid361808.

## Own evidence, 2026-10-18

Read existing master official capture C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/le-petit-retro-official-20261018.html locally. SHA256 dddd9d4aa716be5f86da4e21b884c598de53bf7c02c6fc9d07f25be33cd34a50 matched. Own address/data-zc-action=open/widget361808/langfr/GTC establish provider. Widget evidence, not an asserted official results anchor. No repeated official GET and no pid/fullscreen context imported.

One authorized results GET https://bookings.zenchef.com/results?rid=361808&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 3cef9e0957b2c6aaa1c8ddde00a993ef752954b8dde16224ac92d3d9be3bf813. Own lunch116623 `Déjeuner`, auto true/until null, card askable true/min6/per10, prepayment null, required offer false/from pax null, cancellation10800 seconds relative to shift. No room selection/mandatory room, wishroomnull/offers[]. Ten observed two-person times12:00 through14:15 every15minutes. These are candidates, not holds/reservations. Dinner116917 excluded despite similar policy; no alternative request.

One form GET https://bookings.zenchef.com/form?rid=361808&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, /form, SHA256 b25b0f3da557413b0bae6baedd4b2965f34798c2340a4ea332eb06f54ca196a2. Native identity5rueMesnil matches, same date/pax/slot/nullroom/emptyoffers. Six standard required fields; customFields/customFieldsV2 empty. Optional voucher unsupported. Listed room names do not guarantee seating.

Own full French restaurant and lunch-shift notice: tables held for15minutes after reservation, then may be allocated to others. Complete raw multilingual restaurantComment and shift are retained in the existing native EULA/notice/shift digest; no copied group/evening/date rule. Current form references _app-30bffcb9f4c3b7b2.js and form-84144e7c9a8b854d.js, matching saved local assets. Existing local hashes f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4; no new asset GET or claim of freshly re-fetched bytes. Raw own HTML work/petit-retro-form.html retained for local native EULA replay by QA.

## Implementation and validation

Named no-room policy pins own typed service/auto/card/prepay/offer/cancellation/room state. No generic policy changes. Standard native payload omits room, sends empty offers/custom fields and uses reviewed default partner1001 without inventing a pid query. Existing fresh-field check on review/submit, explicit consent, durable grant, owner/session/revision/TTL and same-attempt independent readback preserved. POST echo cannot confirm, and unknown/charge/action/missing reference/wrong date/party/offer/room cannot be promoted. No actual supplier receipt read.

Focused tests PASS4/4: ten Retro synthetic browser scenarios (own readback positive plus missing/pending/date/party/offer/card/manual/stale notice/wrong durable service), source ten slots and typed/missing/borrowed policy/room/dinner/party-three negatives, existing Bistrot and FishCorner/room fresh-field regressions. Command ZENCHEF_TEST_SCENARIO_PREFIX=retro node --test --test-name-pattern="native booking and own-booking|Petit Retro|fresh form|Fresh required" scripts/test-zenchef-playwright.mjs. git diff --check PASS. No broad matrix rerun.

Only provider/tests/fixture/docs changed.32d5 owns exact integrated review, actual app QA including native-local EULA and publication. No live browser inputs, choices, holds, bookings, payments, messages, capability/receipt reads or additional provider probes. Actual confirmed booking remains unverified.
