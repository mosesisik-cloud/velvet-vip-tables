# Le Bistrot de Lyon: weekday two-person lunch

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Refs #129. Reserved identity curated-LYO-le-bistrot-de-lyon / ZENCHEF_LE_BISTROT_DE_LYON / VELVET_ZENCHEF_LE_BISTROT_DE_LYON. Provider-only implementation; sole integrator owns catalogue, routing, flags and release.

## Own sources, 24 October 2026

The restaurant's https://bistrotdelyon.com/fr/ directly links to https://bookings.zenchef.com/results?rid=362476&pid=1001. Root HTTP200,151765bytes,SHA25632a6019a86416c89244ff71f23b568b528c76725200d9cf00eca174340128b13. Identity matches Le Bistrot de Lyon,64 Rue Mercière,69002 Lyon,04 78 38 47 47. No policy inherited from Léon de Lyon or other venues.

Exactly one future results GET,27 October2026,pax2:HTTP200,149622bytes,SHA25606aecaecb44657f6944422157ffc29431b7b71c7e564c5676c5c12c220c33417. One original empty12:00form GET:HTTP200,150488bytes,SHA256eed1df31fee80437096da222485f92d87104cf121a828a149f3bda4bd740a60f. Original client build b59e3e3c70;27exact asset references,3fetched and24reused only by exact URL/hash. Raw files under workspace evidence/bistrot-de-lyon; source timestamps and safe full state in scripts/fixtures/bistrot-de-lyon-source.json.

## Contract

Monday–Friday,exactly2people,shift428393 DEJEUNER SEMAINE,12:00/12:30/13:00/13:30/14:00. All five returned slots support two guests. Confirmation true/null; charge and prepayment null. Cancellation7200seconds relative to shift. Opening null; shift and every slot stop booking at11:50local. Weekends, dinner129370,other party sizes, offers, room selection, gifts and unknown query options excluded. Advertised daily opening hours are not availability evidence.

Full restaurant metadata and shift/slot policies pinned, including capacity, buffer, display duration, notices, room IDs and null opening. Date normalization applies only to proven same-day11:50cutoffs. Dynamic guest counts remain live. Pinned six15-minute units for two guests correspond to native12:00→13:30. The actual visible Jusqu'à end time must match selected time+90minutes; checked initially and again before review/send. Full global French notice and full lunch comment are passed in restaurantNotice, with seatingNotice using the existing renderer. Global notice warns that after15minutes late the table may be resold; groups above10call04 78 38 47 47. Lunch notice independently gives0478384040 for special requests; retained verbatim, not silently reconciled.

No gift input is rendered; voucherParam absent, connected vouchers false, offers/custom fields empty. Full gift metadata retained and drift blocked. Independent supplier readback remains necessary; a submission echo is not treated as confirmation. Durable attempt handling prevents duplicate submission.

## Verification

node --test scripts/test-zenchef-bistrot-de-lyon.mjs:5/5PASS,including10synthetic browser scenarios. Tests cover exact identity/query, own policy hashes, fixed cutoff expiry, field/card/gift/room/notice/duration drift, seating DOM drift before review/send, wrong shift grant, denied journal, mismatched receipt and duplicate prevention. Synthetic transport uses fictitious contact details locally only.

Original unmodified HTML/client replay at390/1366PASS,with all requests locally fulfilled or blocked; no provider POST. Actual Velvet provider adapter against that original client reaches empty contact state and passes verifyNativeRoom. Source/native/provider JSON and screenshots retained locally. Mobile screenshot inspected. Original lunch end13:30confirmed. No contact data filled in the original client, no consent, real booking, hold, payment or restaurant contact. No WAF bypass. This verifies preparation and guarded implementation, not a real supplier-confirmed booking.
