# La Plage Parisienne — lunch for two with separate explicit acknowledgement

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Base main264 a8d5e7dc39aecfdb9345af3d1609ed60e6d37925, no Atlas changes. Identity-only114e376cdf78bdf706de6be29223a0e14a0ee9b6; canonical curated-PAR-la-plage-parisienne; ZENCHEF_LAPLAGEPARISIENNE / VELVET_ZENCHEF_LAPLAGEPARISIENNE. Shared integration/release solely32d5.

## Own source and bounded reads on 2026-10-18

Official https://www.laplageparisienne.com/restaurant local C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/la-plage-parisienne-official-20261018.html SHA25693548621710b8c7048f1d95f164fe14ac68f23e71daebc0d0140d8f30b7885e2. Own widget data-restaurant356799/langfr/positionright/hide-default-buttontrue and data-zc-action=open plus https://sdk.zenchef.com/v1/sdk.min.js. Official address Port de Javel Haut – Statue de la Liberté75015/phone+33186618519. Native Javel exploitation - Plage parisienne/address8 10 quai javel haut75015; retain distinct address representations, no claim exact postal equivalence.

Reused SDK work/bouillon-racine-sdk.js SHA256f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c. Native builder default sdk1/withCloseButton1; attribute mappings rid/lang/iframePosition; null attrs omitted, hide-default-button omits showCollapsed. No own partner attr, thus no pid; no preview. No new SDK download or fresh remote hash claim.

Single results GET https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=356799&lang=fr&iframePosition=right&day=2026-10-23&pax=2 returned200/no redirect/page results. SHA2566493cba164ce454afc0721ba51c6aef37623084f64554a4ba99bd7b7db9149ef.
Single conditional form GET https://bookings.zenchef.com/form?sdk=1&withCloseButton=1&rid=356799&lang=fr&iframePosition=right&day=2026-10-23&pax=2&slot=12%3A00 returned200/no redirect/page form. SHA2569a07a4def54c120f3a7c6294385a9a773e6243295f3fdb50fea0970af1f3ba35. Own date/pax/slot/identity/policy match. Querypid and statepartner absent. Source files work/la-plage-parisienne-results.html,-form.html,-state.json,-form-state.json retained locally. Fixture projects own lunch only.

Own lunch535548 exactlabel Déjeuner, auto true/untilnull, charge true/min_guests8/charge_per_guests50 (no card for2), prepaymentnull, offerrequiredfalse/fromnull,10800seconds SHIFT cancellation. Seven observed candidate times12:00,12:30,13:00,13:30,14:00,14:30,15:00. No room selection/mandatory room; wishroomnull/wishoffers[]. Optional raw Groupe133108 catalog is NOT selected; voucher displayed but unsupported. Dinner544161 has distinct card60 and cancellation BOOKING reference/offerfrom1, excluded. No inferred seating duration from internalturncounts.

## Exact required legacy checkbox

Field2069, restaurant_id356799; slug le-samedi-soir-jai-bien-pris-connaissance-que-ma-table-est-reservee-pour-une-duree-de-2h; title exactly: Le samedi soir, j’ai bien pris connaissance que ma table est réservée pour une durée de 2h
Type/displayType checkbox, step3, options[], requiredtrue/enabledfalse; mandatoryFields own custom_field.slug required, six standard required; V2[], isInUpdateFlowfalse. It is present and required on the observed Friday lunch. Do not suppress it based on Saturday wording or enabledfalse. Do not claim a Friday two-hour seating limit: show the actual restaurant acknowledgement text separately and explain its presence on this form.

Own page asset references match cached app _app-30bffcb9f4c3b7b2.js SHA256f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and form-84144e7c9a8b854d.js SHA256b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4. No assets downloaded/executed by this worker.

Cached form UTF16offset22784 filters requiredORdisplayed. At32077 own legacy checkbox uses id custom_field__slug, label htmlFor same, checked ev.custom_field[slug]||false; onChange calls m(slug,e.target.checked). Setter20875 assigns boolean unchanged to formData.custom_field. App createBookingData428200 onward reads g=l.custom_field and at429654 emits custom_field:g unchanged; defaultpayloadpartner1001 distinct from absentquerypid. Legacy validation uses truthiness; strings including 'false' can pass native code. Velvet requires strict BOOLEANtrue, rejects strings/numbers/false/missing at approval/outbound. No numeric2069 key, V2/comment/customersheet substitute or extra legacy key allowed.

Independent e98a cached pure execution confirmed exact serializer and truthiness hazard. Sole native rendered proof from ce5c via32d5:390/1366 exact id and label; initial checkedfalse/disabledfalse/HTMLrequiredfalse/valueon/nameabsent; inputstyledhidden, label/iconvisible. No click tested. Manifest7c3b35a0c7c3461a0632736ec74d6c1916cfdf814d45a8ee7605439c040dee6f. Provider uses unique matching label, exact title, enabledcheckbox and checked readback; no input visibility requirement. No duplicate browser replay here.

## Runtime contract and shared work

Named field reservationSaturdayDurationAcknowledged: snapshot typecheckbox/requiredtrue/exactFrenchlabel/valueboolean, initiallyfalse. Fill accepts only explicit booleanfalse/true; false permits unchecking and invalidates review; review/submit/pregrant/approval/details/payload require true. Entire metadata schema plus original fullraw notice and shift bound into terms fingerprint, rechecked before durable grant. Cross-venue injection rejected.

Both consent-clearing paths handled narrowly: fill clears earlier checked inputs, then applies only the current explicit guest choice using verified ownlabel after freshmetadata; submit preserves ONLY own exactslug after approvedtrue, clears other optins, then independently accepts EULA per explicit submit consent. No default/automatic acknowledgement; no broad required/custom checkbox exemptions. Errors invalidate own prior review. Private durable details bind shiftId535548 and booleantrue; no public receipt/history acknowledgement projection. Existing single-send and own-attempt independent readback retained; no synthetic confirmation represented as real.

Full FR and EN notices displayed before consent: FR says lunch+dinner Monday–Sunday/>8/contact lucas@laplageparisienne.com, EN says eveningWednesday–Sunday/>12/commercial@beaumarly.com. Preserve contradiction and both texts, no general daily-opening claim. Original full multilingual notice remains in fingerprint. Raw notices were not visible on native contact per ce5c; Velvet must show separately.

32d5 owns shared UI/server/ledger/journal and actual app QA/publication. Independent unchecked UI control, explicitboolean transport, private durable/replay/record binding and clearing after edits required. e98a exact final code review and ce5c actual app QA remain release gates. No selfmerge/deploy.

## Validation and limits

Five own pure tests PASS: exactmetadata/type/mandatory/crossvenue; strictbooleanpayload and alternate-location rejection; seven candidates/cardthreshold/offer/no-room/no-partner/dinner isolation; fresh fullschema+FR/ENnotice changes; DOM-adapter stubs; actual provider action method with local stubs proves false/missing/string rejection, explicittrue review, uncheck blocking, optionalmarketing clearing, ownbool retained through fill+submit and approval/details. No browser, real network or native writes in these tests. Initial fixture omitted isInUpdateFlow; corrected from ownrawfalse, then all passed. Five bounded existing pure checks (Ternes/OKOMUSU/ZEN) also pass, total10/10. Syntax/diff pass. No actual real supplier confirmation or full rendered app test claimed here.
