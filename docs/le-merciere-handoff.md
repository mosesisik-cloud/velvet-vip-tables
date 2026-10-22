# Le Mercière provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public292/a340a40a3c5673d76af394cae4806e16ba46fbd9. Four provider/test/fixture/handoff files only.32d5 owns shared integration, review, app QA and release.

## Identity, entry and scope

Reserved curated-LYO-le-merciere / ZENCHEF_LE_MERCIERE / VELVET_ZENCHEF_LE_MERCIERE. Own https://lemerciere.com/ embeds exactly https://bookings.zenchef.com/results?rid=360735&pid=1001#view=fitH&navpanes=0. Provider identity: Le Mercière, Restaurant Le Mercière, 56 Rue Mercière,69002 Lyon,+33478376735. No existing catalog/registry/provider match.

The fragment is preserved in sourceNavigationUrl evidence. It is not transmitted in HTTP, not part of the rid/pid query, and not appended as booking data. Offline original-client navigation retains that exact fragment in page.url while its document request omits it and NEXT query contains only rid/pid/day/pax. Original restaurant notice and selectors render. The adapter uses the same HTTP entry without fragment. No alternative host, token or route was used.

Initial scope is weekday lunch for exactly two, shift101507/Midi. Eleven raw quarter-hour slots12:00–14:30; eight had two-person availability:12:00,12:15,12:30,13:30,13:45,14:00,14:15,14:30.12:45/13:00/13:15 had empty possible_guests and are excluded. Full policies of all eleven slots are pinned, including different capacities. All shift/slot opening deadlines null. All close at11:30 local on selected day, including after DST; only that exact date prefix normalizes. Dinner101525 excluded.

Confirmation true/null, charge and prepayment null, cancellation10800seconds relative to shift. No offer selection. Rooms40970/41561/41063/41560/41064 preserved but no room selection and wish.room_id null. Dynamic available_rooms does not authorize a selected room. Own disabled custom fields2406/TAGS and2407/TAGS2, their options and hidden mandatory statuses are fully pinned. They do not appear in the original form and may not be enabled or sent. No gift input. Connected vouchers false, shop display true, voucherParam absent, partner_id string1001. Empty custom_field and offers are required in outbound payload.

## Guest notice

Complete original French restaurantComment is exposed in terms.restaurantNotice before approval. It includes the15-minute lateness allowance, the restaurant's right to release the table after that, and instruction to telephone for any change. The instruction is preserved, not acted upon. No fabricated seating duration or meal price. Specific-day notice must remain null. All metadata/policy is rechecked before review and send; terms version binds the original notice and shift. Approval/journal bind shift/date/time/party. Independent saved-booking receipt must match with no room and empty offers; POST echo alone remains unknown, and duplicate submission is prevented.

## Sources and native client

One root GET, ONE results query23October2026/pax2, one empty12:00 form GET. All200, fetched2026-10-22:

- Root362588bytes SHA f0fda3fd440de81119b8731af713028ebce1cb09e15b0442969437dafd6127e3.
- Results163489bytes SHA 8143724fd4e6ded10aa227271de7fc71462b10ca9c737452d232eb8dc4b55723.
- Form164355bytes SHA e1a90cc576e16a15288d24927636e2770a5a956c6d83c3579e2c4ba5f6caf712.

Raw originals: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/le-merciere/. Exact URLs, safe full policy projection and native hashes in scripts/fixtures/le-merciere-source.json, without auth secrets.

Own build907c2a6d69,27 exact original HTML script/CSS reference URLs matched and hashed against existing cache. Count is references verified, not27 executed assets.26 under evidence/bistrot-abel/assets; polyfill nomodule is files-pasted-by-the-user-ja-10/work/office-paris-assetcache/polyfills-42372ed130431b0a.js, SHA0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683. No new downloads or other-restaurant tests. Existing ordinary createBookingData/getByUuid/status contract.

Original empty form390/1366 and actual adapter empty contact visually inspected; no gift or hidden TAGS controls. Original results fragment replay is separately recorded. All traffic was local/aborted, own summary held only in harness until teardown. No personal fields, consent or final submit. Phone flag images blocked. Eleven native files and27 asset reference hashes recorded.

## Validation

node --test scripts/test-zenchef-le-merciere.mjs:5/5 PASS, including8 synthetic browser scenarios for saved receipt, gift/policy drift, wrong durable shift, denied journal, mismatched or offer-bearing receipt and duplicate prevention. Disabled TAGS becoming enabled fails closed. Dedicated date/DST test verifies fixed11:30 expiry. Actual adapter offline reaches empty contact and returns the exact full restaurant notice.3source hashes, full daily projection,27 asset hashes, syntax and diff checks PASS.

Final-send/readback proof uses synthetic transport; it is separate from original empty-client replay. No actual reservation, hold, payment or restaurant contact. Dated availability is not a promise of future slots.32d5 public receipt is required before claiming published.
