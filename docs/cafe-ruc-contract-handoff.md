# Le Café Ruc — own lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Clean main251 6461673162414485d1c73b3b84bfbc9f122a701f. Canonical curated-PAR-le-cafe-ruc/export ZENCHEF_CAFERUC; 32d5 identity 5ba472f49e3982dc11cb8e875be4c66af9d50935. 159 rue Saint-Honoré,75001 Paris, rid353947/native name Le Ruc.

## Own evidence — 2026-10-18

Read saved official C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/cafe-ruc-official-20261018.html locally, SHA256 9a0cc65e8117fc96781edaa3e3f53e81cdfdbfece2d7644ea292e91d428d3ab9, from https://www.caferuc.com/restaurant. Ordinary data-zc-action=open/widget353947/langfr and address verified. pid1001/shxpid134108 only appear in a separate Réveillon31December popup; neither is imported. No fullscreen. Own group-contact text is over12 guests. No new official GET.

One results GET https://bookings.zenchef.com/results?rid=353947&lang=fr&day=2026-10-23&pax=2 returned200. SHA256 f398cbfc37432b4918060459422dac219cd66e4cdbde3cca0f7f00b6050f4188. Own lunch32216 Déjeuner: auto true/untilnull, charge object is_web_booking_askable false/min_guests1/charge_per_guests40, prepayment null, required offerfalse/frompaxnull,21600 seconds SHIFT cancellation. The disabled charge object is not an active card requirement; all typed values are pinned and any change fails closed. Roomselectionfalse/mandatoryfalse/wishroomnull/offers[]. Fourteen observed candidate times11:30–14:45 every15minutes; not holds or reservations. Breakfast32215,tea294991,dinner32217 excluded. Dinner has a distinct per-guest charge value30 in the same response; no additional probes.

One form GET https://bookings.zenchef.com/form?rid=353947&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform. SHA256 651e5bbc83ef2aec1fbb76ba7b540307f73328897b525ca36ef1a9985ff2705c. Same own identity/date/party/slot and policy. No query pid or partner_id state; no explicit partner guard is added. Existing native payload default behavior is retained, not inferred from the event URL. Six standard required fields, customFields/V2 empty, voucher optional unsupported. Own raw FR/EN welcome/open-daily/service-continu notice retained; shiftcomment null. No displayed90/15minute rule or room guarantee inferred from internal capacity/room lists.

Own raw files in worker checkout: work/cafe-ruc-results.html, work/cafe-ruc-form.html and parsed state JSONs. Current form references _app-30bffcb9f4c3b7b2.js and form-84144e7c9a8b854d.js matching local cached work/aux-bons-crus-app-bundle.js SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and work/aux-bons-crus-form-bundle.js SHA256 b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4. No new asset GET or fresh remote byte claim.

## Implementation and validation

Named cafeRucPolicy pins own lunch32216/exact2/auto/disabled-card/prepay/offer/cancellation/strict-no-room. Uses existing no-room native flow, fresh field and raw notice/EULA/full-shift digest guards, final consent and durable one-attempt grant. Own same-attempt independent readback is still required; POST echo cannot confirm. Existing four explicit partner venues remain unchanged.

Focused 4/4 tests PASS: ten synthetic browser scenarios (positive,missing receipt,pending,wrong date/party/offer,enabled card,manual,stale notice,bad durable shift), own fourteen-candidate source policy/type/missing/other-service checks, ordinary URL excludes pid/shxpid/fullscreen/room, fresh form card/notice/shiftcomment/room/unknown-required-field/missing-field-metadata rejection, and existing fresh-field regression. Command: ZENCHEF_TEST_SCENARIO_PREFIX=ruc node --test --test-name-pattern="native booking and own-booking|Cafe Ruc|Fresh required" scripts/test-zenchef-playwright.mjs. git diff --check PASS. No broad matrix or completed Marly rerun.

Provider/tests/own fixture/handoff only. 32d5 owns app integration, exact review, actual app QA including own cached native EULA replay, and publication. No contact inputs, choices, holds, bookings, payments, restaurant messages, capability or receipt reads. No actual supplier confirmation verified.
