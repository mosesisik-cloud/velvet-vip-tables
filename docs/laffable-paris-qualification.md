# L'Affable Paris — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Refs #129. Reserved identity curated-PAR-laffable / ZENCHEF_LAFFABLE_PARIS / VELVET_ZENCHEF_LAFFABLE_PARIS. Paris only:10 Rue de Saint-Simon,75007,+33142220160; not Cannes or Belgium. No existing provider/catalogue match found on base public295. Shared integration and release belong to32d5.

## Primary evidence

Own https://laffable.fr/ returned200 at2026-10-24T10:12:55.634Z,32794bytes,SHA2568ed7cfac524f12538fbea4849dd428276fd231e60faf923413d2e8bbd1b57b87. Two direct desktop links are https://bookings.zenchef.com/results?rid=355946. The separate mobile link adds lang=fr&primaryColor=555; this implementation uses only the exact desktop entry, with no pid or invented options.

One future27October2026/pax2 results GET returned200,159273bytes,SHA256001b25b9c88b8f7a6bfb7dff2b65f413e7a49a8e4021d444e42c9aadebc183c8. One original empty12:00form returned200,160139bytes,SHA2565c9ab9a1da31e62edd0a2430dadff19306e87287a40b78d1534b9708b061fb90. Full safe state and source metadata are in scripts/fixtures/laffable-paris-source.json. Raw files and native replay artifacts remain in workspace evidence/laffable-paris. Client build b59e3e3c70 has27exact referenced assets, all reused by exact URL and verified hash.

## Bound contract

Monday–Friday,exactly2people,own lunch424298 Déjeuner semaine. Nine observed normal slots every15minutes12:00–14:00. All support2; waitlist is not used. Confirmation false/until7 permits automatic two-person booking. Card guarantee40EUR/guest starts at6guests, so it does not apply to2. Prepayment null. Cancellation is86460seconds relative to booking, not shift; the unusual value is preserved exactly. Opening2026-06-29 12:59:00 is pinned, with no rolling-window inference. Each slot closes at its own start; shift closes14:00. Only closing-date prefixes normalize to the requested day.

Room selection exists but is optional:hasRoomSelection=true,isRoomMandatory=false. Original empty form reaches contact without selecting a room; wish.room_id remains null. Salle intérieure25477 and Terrasse25540 are preserved as metadata, not exposed as chosen products. Available-room IDs may only be these two. No room is submitted and no indoor/terrace promise is made. Mandatory-room changes, selected room, unknown room IDs and metadata changes fail closed. Offers/custom fields empty; no voucherParam or gift DOM; no room/gift input appears in native contact form.

The entire French global notice is exposed, including first-service2h limit,15-minute lateness warning, terrace23h limit and groups above8 contact information. The entire lunch comment is included too. The response additionally associates an old summer-closure notice (2–23August) with the October day. Its exact text is retained, separately hash-pinned and appended before consent; it is not discarded, interpreted as an October closure or silently rewritten. A changed/removed day notice blocks the policy. No invented105-minute displayed sitting is derived from internal capacity values; native contact displays no Jusqu'à label. Full capacity/display flags and all shift/slot policies are pinned.

## Validation

node --test scripts/test-zenchef-laffable-paris.mjs:5/5PASS,including10synthetic browser scenarios. Identity/query/card/room/gift/notice/opening/capacity drift, future per-slot expiry, independent receipt, wrong grant, denied journal and duplicate prevention covered. Special day-notice drift before review and before send yields zero provider POST. Synthetic requests use fictitious data and local transport only.

Original unmodified HTML/client replay at390/1366PASS; mobile screenshot inspected. Actual Velvet provider adapter against the original client reaches empty contact and passes verifyNativeRoom. All replay requests locally fulfilled or aborted, no external POST. Global+lunch+day notices verified in adapter terms output. Live work limited to own root,one results and one empty form GET. No contact filling, consent, actual booking, hold, payment, restaurant contact or bypass. This is guarded provider preparation and synthetic submission evidence, not a real supplier-confirmed booking.
