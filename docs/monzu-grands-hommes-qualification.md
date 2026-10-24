# Monzù Grands-Hommes — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; Refs #129. Base public300. Sole integrator32d5 reserved curated-BOD-monzu-grands-hommes, ZENCHEF_MONZU_GRANDS_HOMMES, VELVET_ZENCHEF_MONZU_GRANDS_HOMMES. Four provider/test/fixture/docs files only; shared integration and release remain with32d5.

## Independent branch evidence

Own https://www.monzu.fr/grands-hommes returned200 on2026-10-24 at11:42:11Z,19281bytes,SHA256 ccc87a5196602ea909c711f10c37a39890ac3b869d2dbd2335a82847ab42ae9b. Master's saved bytes independently verified locally. Main branch reservation button, labelled navigation and footer explicitly link https://bookings.zenchef.com/results?rid=354097 withoutpid. Sainte-Catherine356808 and Chartrons Popina are separate, excluded branches.

Own address12 Pl. des Grands Hommes,33000Bordeaux; provider fuller address Centre commercial des grands hommes, 12 Place des Grands Hommes,33000Bordeaux. Own+33556485524 matches provider05 56 48 55 24.

One27October/pax2 results GET at11:44:04.734Z returned200,157851bytes,SHA256 3d7bc73b79548d944a0e3bbf04e5cb076ff661ce3a22c4fd1aa4ff22cccf4f25. One empty12:00form GET at11:44:07.196Z returned200,158717bytes,SHA256 7478756a532d6664cd565bd9007ceac32014187ae860991b71d07f67dc724465. Exact metadata/full safe projection in scripts/fixtures/monzu-grands-hommes-source.json. Raw HTML and replay assets/screenshots under workspace evidence/monzu-grands-hommes.

## Own contract

Exactly two guests, Monday–Friday, lunch43253 SERVICE MIDI SEMAINE. Fourteen raw slots; eleven normal available slots12:00–14:30 every15minutes. 11:30,11:45,14:45 had empty possible_guests and are excluded from launch scope. Dinner43255 and weekends excluded. Historical stock observation does not promise current availability.

Confirmationfalse/until6 qualifies two automatically. Charge/prepaymentnull. Cancellation enduser_cancelable_before=0 relative to shift, preserved exactly without inventing a cancellation promise. All opening valuesnull. Every slot closes at its own start; shift closes14:45. Date prefixes normalize only on those verified closing fields. All14slot policies and complete shift policy fingerprinted, including unavailable slots.

No room selection or mandatory room; wish.room_id=null. Own rooms24652 Intérieur and22475 Terrasse retained in metadata; neither promised nor selected. Offers/customfields empty. Full French notice including line breaks preserved before consent:15-minute late-arrival tolerance and contact for groups above6. Lunch/day commentsnull. No sitting-end label, so no duration inferred from internal turn-times.

Unlike Sainte-Catherine, this branch has voucherParam7574/tablebooker and an optional visible gift-code input. Full voucher configuration pinned; hasConnectedVouchers=false. verifyMonzuGrandsHommesNoGift requires exactly one visible enabled empty text input namedvoucher with the native voucher-validate-code-input testid, optional and writable; exactly one visible disabled Appliquer button with voucher-validate-code-btn testid. Initial preparation, review and pre-send validation enforce this. No gift is entered or applied. Source partner_id is absent and exact query forbids pid; existing submission payload contract retains default string partner_id1001.

Changed branch/query, metadata, fields, notice, voucher, room, card, confirmation, capacity, opening or cutoff fails closed. Only verified party/shift/times accepted. Durable submission attempt and independent receipt required; POST echo alone is unknown.

## Verification

Five own tests, including eight synthetic browser scenarios, pass. They cover confirmation with independent receipt, actual gift-input change before review/send, policy drift before send, wrong shift grant, denied journal, mismatched receipt, gift receipt and duplicate prevention. Separate policy assertions cover metadata/card/room/notice/cancellation/capacity/cutoff drift. Future-date test proves per-slot expiration and null opening. Combined Grands-Hommes/Sainte-Catherine/Cerf-Volant regression15/15PASS.

Original unmodified b59e3e3c70 client replay390/1366PASS with all27exact asset references reused byURL/hash. Mobile screenshot inspected. Actual Velvet provider adapter reaches original empty contact and passes its own gift/native checks; complete notice retained. All replay network traffic fulfilled locally or aborted. Live qualification limited to the single results and single emptyformGET above. No contact fields filled against provider, no consent, real booking, hold, payment, supplierPOST, message,OTP or bypass. Real supplier-confirmed end-to-end booking remains unverified.
