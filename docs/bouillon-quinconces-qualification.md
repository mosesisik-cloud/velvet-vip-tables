# Bouillon des Quinconces — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; Refs #129. Base public301. Master assigned this branch;32d5 deduplicated/reserved curated-BOD-bouillon-quinconces, ZENCHEF_BOUILLON_QUINCONCES, VELVET_ZENCHEF_BOUILLON_QUINCONCES. Four provider/test/fixture/docs files only. Shared integration and release remain with32d5.

## Own branch evidence

Own https://lesbouillonnants.com/restaurant/bouillon-bordeaux/ was fetched by master on2026-10-24 at11:55:12Z:200,352319bytes,SHA256 5756c16a5d8f4b153dfb39564bdc55f335a7476465c6cdbf17c3183de0330581. Saved bytes independently verified locally. The branch's repeated reservation buttons explicitly link https://bookings.zenchef.com/results?rid=376711&pid=1001. No identifier inferred from the chain's other restaurants or gift shop.

Own/provider identity Bouillon des Quinconces (Bouillon Bordeaux),36 Allées d'Orléans,33000Bordeaux,+33525463560. One27October/pax2 results GET returned200 at11:56:00.610Z,182502bytes,SHA256 6c4b59073f1aaa32158c22f94f652108eaf198e653b8bf8acfcdf6fd92318821. One12:00emptyform GET returned200 at11:56:05.468Z,183368bytes,SHA256 8ec2df23c3a0f27b68f3bf785c3bb200f3d21be79312dc8ccd83c7a08ccda546. Exact URLs/times and full safe state are in scripts/fixtures/bouillon-quinconces-source.json. Raw/native evidence under workspace evidence/bouillon-quinconces.

## Own bound contract

Exactly two guests, Monday–Friday, lunch291967 MIDI. Twenty-one raw slots11:30–16:30 every15minutes; nineteen observed normal available slots, excluding12:30/12:45 which had empty possible_guests. Scope follows that own lunch shift. Dinner291978 SOIR1 and weekends excluded. Historical slot observations do not promise current stock.

Confirmationfalse/until5 qualifies two automatically. Charge/prepaymentnull; cancellation5400seconds relative to shift. All opening valuesnull. Each slot closes at its own start, shift16:30. Only these verified closing-date prefixes normalize; all21slot policies and fullshift fingerprinted. No imported cutoff or cancellation from another branch.

No room selection or mandatory room; wish.room_id=null. Five room definitions98142Bar,98277Salle des Quinconces,98283Salle des miroirs,98284Terrasse,109562Salle de la Comédie pinned without promising/selecting any. Offers/customfields empty. Own full French welcome/group-contact notice retained including raw HTML and line breaks; lunchtime/day commentsnull. Original contact form has no sitting-end label; internal capacity values do not create a duration promise.

Full voucherParam4969/tablebooker configuration pinned; hasConnectedVouchers=false. Native optional gift input must be the single visible/enabled/empty text input namedvoucher with voucher-validate-code-input testid, optional and writable. Its single visible Appliquer button, voucher-validate-code-btn, must remain disabled. verifyQuinconcesNoGift enforces this during initial preparation, review and immediately before send. No gift entered/applied. Source and query retain ownpartner1001.

Changes to identity/query, fields, notice, voucher, room, card/confirmation, capacity, opening or cutoff block the flow. Only own party/shift/times accepted. Durable attempt and independent receipt required; POST echo alone cannot confirm a reservation.

## Verification and limits

node --test scripts/test-zenchef-bouillon-quinconces.mjs:5/5PASS, including8synthetic browser scenarios. These cover independent confirmation, actual gift-input change before review/send, policy drift before send, wrong shift grant, denied journal, wrong receipt, gift receipt and duplicate prevention. Additional assertions cover metadata/card/room/notice/cancellation/capacity drift, exact query/party/scope and future per-slot expiration.

Original unmodified b59e3e3c70 client replay390/1366PASS,all27exact asset references reused byURL/hash. Mobile screenshot inspected. Actual Velvet adapter reaches original empty contact and passes own native/gift validation with fullnotice. All replay requests locally fulfilled or aborted. Live activity limited to one results and one emptyformGET; master source reused. No real fields/consent/booking/hold/payment/supplierPOST/message/OTP/bypass. Actual supplier-confirmed end-to-end booking remains unverified.
