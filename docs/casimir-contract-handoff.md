# Casimir — ordinary lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Base main266877cd5067225b09d5ebc5bcb412adc694c25eac4. Own identity4fce9409410e8610916f0dba2112137bf3f25036; canonical curated-PAR-casimir, ZENCHEF_CASIMIR / VELVET_ZENCHEF_CASIMIR.32d5 solely owns shared integration and release.

## Own evidence on 2026-10-18

Official https://www.casimir.paris/en/r%C3%A9servations saved C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/casimir-official-20261018.html locally verified SHA25681421d77f6f68e69c9d4035e542aa81792f784a62273818fe164680c1ae86833. Actual To book anchor https://bookings.zenchef.com/results?rid=364645&pid=1001. Separate /shop is giftcards, not booking. No lang/sdk/fullscreen/showCollapsed in own entry; none added. Explicit querypartner1001 preserved.

One results GET https://bookings.zenchef.com/results?rid=364645&pid=1001&day=2026-10-23&pax=2 returned200/no redirect/page results SHA256b6d5f519779b62cd5d43e6bdb30210f378085ee7738cee0df23fb5a0eb1779fd.
One conditional form GET https://bookings.zenchef.com/form?rid=364645&pid=1001&day=2026-10-23&pax=2&slot=12%3A00 returned200/no redirect/page form SHA256356541db4f1df3371092f0a199c3831316e561e672aadae1eb2c7f499cae7eae. Native Casimir/6 Rue de Belzunce/75010 matches; own query/statepartner string1001, date/pax/slot/policy match. Raw local work/casimir-results.html,-form.html,-state.json,-form-state.json. No additional source/native/assets requests.

Own lunch160340 exactlabel Déjeuner: auto true/untilnull; charge is_web_booking_askabletrue/min_guests3/charge_per_guests15, so no card for exactly2 (not globally cardfree); prepaymentnull; noofferfalse/fromnull;7200seconds SHIFT cancellation. Eleven observed quarter-hour candidates12:00 through14:30. No room selection/mandatoryroom/wishroomnull, selectedwishoffers[]. Sixstandardrequired, customFields[]/V2[], isInUpdateFlowfalse. Voucher displayed but unsupported; no promo/group/room/voucher flow. Dinner160341 has different notice/cancellation; later330535 manualfalse/untilnull, both excluded.

Raw catalog112842 Diner vigneron / Domaine CLAVEL remains present, dated2026-06-02 only, optional/unselected. Do not claim rawcatalogempty or autochoose an offer. Its presence does not mean it is selected on the observed ordinary lunch.

## Own notices — preserve exact scope

Restaurant French notice welcomes guests and instructs groups over8 to contact0148782880. Own lunch shiftcomment is exactly:
```text
Lorsque vous réservez en premier service : 19h / 19H30, il se peut que votre table soit réservée 2h plus tard pour le deuxième service.
```
It refers to evening times despite being attached to lunch. Preserve verbatim separately as terms.shiftNotice; do not suppress it or infer a two-hour lunch seating limit.7200SHIFT cancellation is also not seating duration. Exact raw shiftcomment (singlefr key) is checked by named policy; restaurantnotice+shift and complete mandatory/custom/V2/update schema are fingerprinted and freshly checked at review, submit and pregrant. No general notice/field guard weakened.

## Provider and integration

Own registered venue/shift, exact2, typedpartner/cardthreshold/amount/auto/offer/cancellation/no-room rules. No inheritedlang/SDK parameters. Explicitquerypid checked results/form/fresh review; statepartner exactstring1001. New optional/required/custom fields or changed schema invalidate review. Existing consent/owner/session/revision/TTL, same durableattempt.details.shiftId160340 and independent own-booking readback remain; POSTecho neverconfirms, unknownlocked. No invented receipt shift or public optionaloffer claim.

Only own provider/test/fixture/handoff files.32d5 owns shared service/UI/server/catalog/ledger/journal, presentation of restaurantNotice plus exact shiftNotice before consent, exacttwo ordinary-only wording and release. ce5c alone owns cachednative390/1366/EULA+notice checks; no original native browser replay performed by this worker. Await that proof, independent final review and actualappQA before activation. No selfmerge/deploy.

## Validation

Focused ZENCHEF_TEST_SCENARIO_PREFIX=casimir with native booking and own-booking plus Casimir patterns: PASS3/3. Browser harness uses local synthetic/intercepted pages, ten scenarios positive/missing/pending/date/party/selectedoffer/cardthreshold/manual/stale/durablewrongshift. Two own pure tests cover11times/identity/onlyownqueryparams/explicittypedpid/ownservice/cardmin3per15/shiftcomment/metadata/room/party/selectedoffers and fresh fullschema+bothnotices. Syntax/diff checks pass. No nativeGET/browser replay, contact/hold/reservation/payment/message/capability/receipt operation beyond the approved two read-only pageGETs. No actual supplier confirmation claimed.
