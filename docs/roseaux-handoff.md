# Brasserie Roseaux provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public289/c0b19144651eef8bd182b3fd6eff348d2a02d9ba. Four provider/test/fixture/handoff files;32d5 owns shared integration/review/appQA/release.

## Own identity and scope

Reserved curated-LYO-brasserie-roseaux / ZENCHEF_BRASSERIE_ROSEAUX / VELVET_ZENCHEF_BRASSERIE_ROSEAUX. Own Brasserie Roseaux,34 Cr Franklin Roosevelt,69006 Lyon,+33451680891. Root https://www.brasserieroseaux.fr/ links directly https://bookings.zenchef.com/results?rid=370036&pid=1001. No matching identity/rid/domain in base data/docs/provider. Own root lists Monday-Friday lunch12–13:45, Saturday/Sunday12–14, with holiday/event variation. Initial integration is weekday lunch only, exactly two guests.

Own shift378092 has seven quarter-hour starts12:00–13:30, all with two-person availability in the sole requested23October2026 response. Confirmation true/null; charge and prepayment null; cancellation86400seconds relative to shift. Each slot deadline equals its start; shift deadline13:30. Every bookable_from is exactly2026-08-24 12:00:00 and remains pinned without inferred recurrence or rolling60-day normalization. Changed opening date fails closed. Only exact selected-date prefixes of closing deadlines normalize. All differing slot capacities/waitlist settings/turn_times are preserved and fingerprinted.

Rooms72063/77638/93023 retained; room selection false/optional, wish.room_id null. Dynamic available_rooms does not authorize choosing a room. Offers empty. Optional gift custom field4654, connected vouchers true, voucherParam absent, partner_id string1001. Original DOM has optional empty text input#mybeezbox with no name and label Votre code cadeau. Reuses existing verified DOM guard, with own exact metadata. Gift values, selected rooms and offers are excluded from payload and independent receipt.

Full French notice directs parties above eight to contact by email and is exposed before approval; specific-day notice must remain null. No contact message was sent. Dinner has distinct policy and is excluded. No internal turn_times are relabeled as a guest seating duration.

Own query permits only rid/pid/day/pax/optionalslot and binds370036/1001/party2. Metadata/policy/query checked before review/send; approval and durable journal bind ownshift/date/time/party. Independent saved-booking readback must match, with no room and empty offers; POST echo remains unknown, and terminal submission cannot repeat.

## Sources and original client

One root GET, ONE results query23October2026/pax2, one empty12:00 form GET. Source SHA:
- root200:158f9060ccbbd9a4b4862097d8fd5ab6272a4f168947fcc4d3dedb93b8a18782
- results200:b5f134cc0cf06f435add7696e6ea01eae13a122ebcde51fe763811e01107b731
- form200:273edb0dea8e871d87f118a6068453ccfa6aa1a62ebfb5c9f121daea5001e9fc

Raw originals in C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/roseaux/. Exact query, safe full policy projection, original/native hashes and asset manifest in scripts/fixtures/roseaux-source.json. No auth/payment secrets.

Own build907c2a6d69;27 HTML script/CSS references matched by exact URL and SHA to existing cached originals. Counts references/hash verification, not27 executed assets. Polyfill nomodule cache is files-pasted-by-the-user-ja-10/work/office-paris-assetcache/polyfills-42372ed130431b0a.js,SHA0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683; other26 are under evidence/bistrot-abel/assets. No new downloads or other-restaurant tests. Existing ordinary createBookingData/getByUuid/status mapping, no new engine.

Original client replayed entirely offline390/1366; actual adapter reached empty contact and native verification, including gift guard. Screens inspected. All traffic local/aborted, own summary held only in harness until teardown. No contact fields filled, consent or final submit. Phone flag images blocked.

## Validation

node --test scripts/test-zenchef-roseaux.mjs:5/5 PASS, including8 synthetic browser scenarios for receipt success, gift/policy drift, wrong durable shift, denied journal, wrong guest-count/offer-bearing receipt and duplicate prevention. Date/DST test verifies individual expiry, final13:30 expiry, and exact opening-date drift rejection. Original hashes, full daily policy,27 referenced asset hashes, syntax and diff checks PASS. Test log saved locally after an initially incomplete tool output.

No actual reservation/hold/payment/contact. Synthetic final-send/readback proof is separate from original empty-client replay. Dated availability is not a promise of later slots. Public release remains32d5 responsibility.
