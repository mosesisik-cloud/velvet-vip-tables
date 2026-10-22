# SHIYO provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public291/c0a1fa2c706b4b0daa5aebac7453cc89b9ea6439. Four provider/test/fixture/handoff files only;32d5 owns shared integration, review, app QA and release.

## Identity and scope

Reserved curated-LYO-shiyo / ZENCHEF_SHIYO / VELVET_ZENCHEF_SHIYO. Own https://www.shiyo.fr/ links directly to https://bookings.zenchef.com/results?rid=377346&pid=1001. SHIYO, Grand Hotel-Dieu, Lyon; provider address is exactly `2 cour Saint-Martin`,69002 Lyon. No matching identity/rid/domain in base catalog, registry or provider. Provider phone +3333333333 is a suspected placeholder and MUST NOT be published as a contact. Identity is supported by the restaurant's direct booking link, name and address.

Initial scope: Monday-Friday lunch for exactly two, shift304033. Six starts11:45,12:00,12:15,12:30,12:45,13:00 had two-person availability in the sole requested23October2026 response. All twelve raw quarter-hour slots11:45–14:30 are fingerprinted;13:15–14:30 had empty possible_guests and are not exposed. Each slot closes at its own start; shift deadline14:30. All opening deadlines null, preserved exactly. Only the selected-date prefix of known closing deadlines normalizes. All differing slot capacities, waitlist settings and turn_times remain fingerprinted. No invented seating duration.

Confirmation true/null; charge and prepayment null; cancellation900seconds relative to shift. Dinner304037 is excluded. No offers or shift menus; no custom fields. Room metadata101054/130786/101724 preserved, selection false and not mandatory, wish.room_id null. Connected vouchers false, shouldDisplayShopVoucher true, voucherParam absent, partner_id string1001. Original empty form has no gift input. Gift values, selected rooms and offers are excluded from payload and independent receipt.

## Full guest notices before approval

The existing terms.restaurantNotice contains the complete original global French notice, two newlines, then the complete original lunch shift.comment.fr. Its HTML breaks are normalized by the existing app terms renderer. Both original strings are fingerprinted and covered by the terms version, with revalidation before approval/send. Shared app QA must verify the full notice appears before consent at390/1366, without raw HTML:

- Global opening7/7, lunch11:45–14:30 and dinner18:45–22:30; last orders BEFORE14:30/22:30.
- Lunch kitchen closes14:30; restaurant closes15:00. These are separate statements, not a seating duration.
- Monday-Friday lunch27.90EUR; Saturday, Sunday AND public-holiday lunch35.90EUR. Do not present27.90 as an unconditional weekday or universal price. The complete exception remains visible even though integration scope excludes weekends.

Specific-day comment must remain null. Changed notices, policy or dates fail closed. Query permits only rid/pid/day/pax/optional slot and binds377346/1001/party2. Approval and durable journal bind own shift/date/time/party; independent saved-booking readback must match, with no room and empty offers. POST echo stays unknown and terminal submission cannot repeat.

## Evidence

One root GET, ONE results query23October2026/pax2, one empty12:00 form GET. All200, fetched2026-10-22:

- Root23260bytes, SHA f56c46e585f09064810f5d178a9836d2f5e4779cedb5fa3fb0de18833c45e936.
- Results161013bytes, SHA 64c4de2471ff92157671589ef11af43b619ca7314263a455bc2e1828effb3104.
- Form161879bytes, SHA 8999e34d8298790cb8af78d40a7bd10b659fe23d8e0a9b4993fd1b145f0b49a2.

Exact URLs/timestamps, safe full policy projection and native hashes are in scripts/fixtures/shiyo-source.json. Raw originals: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/shiyo/. No authentication secrets included.

Own client build907c2a6d69.27 original HTML script/CSS references matched exact URL and SHA against already cached assets; this is not a claim that27 scripts executed.26 assets live under evidence/bistrot-abel/assets. Polyfill nomodule: files-pasted-by-the-user-ja-10/work/office-paris-assetcache/polyfills-42372ed130431b0a.js, SHA0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683. Existing ordinary client createBookingData/getByUuid/status mapping; no new engine.

Original client replayed entirely offline390/1366, visually inspected. Actual adapter reached empty contact and verified native policy, including exact concatenated notices. All traffic local/aborted, own summary refresh held only in the harness until teardown. No guest data entered, consent or submit; phone flag images blocked. Seven native evidence files and27 asset references hashed in fixture.

## Validation

node --test scripts/test-zenchef-shiyo.mjs:5/5 PASS, including8 synthetic browser scenarios covering successful independent receipt, gift/policy drift, wrong durable shift, denied journal, wrong guest-count or offer-bearing receipt and duplicate prevention. Test verifies complete notices at contact. Date/DST checks confirm individual expiry, final allowed13:00 expiry, and null opening deadline drift rejection. Original hashes, full daily policy,27 asset hashes, syntax and diff checks pass.

Synthetic final-send/readback testing is separate from original empty-client replay. No actual reservation, hold, payment or contact was made. Dated availability is not a promise of future slots. No self-merge or deploy; public completion requires32d5 receipt.
