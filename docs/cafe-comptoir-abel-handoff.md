# Café Comptoir Abel provider handoff

Refs #129. Provider owner: `codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939`, chat `01a141e3-6cf0-7ef1-8908-41a5840b1b4e`. Base: public 284/main `256572e7ecea022023e5850fc08c6c32e747238f`. 32d5 owns shared app/server/identity, integration and release. This delivery changes only provider, dedicated test, own source fixture and this document.

## Contract

Canonical `curated-LYO-cafe-comptoir-abel`; export `ZENCHEF_CAFE_COMPTOIR_ABEL`; requested integration flag `VELVET_ZENCHEF_CAFE_COMPTOIR_ABEL`. Café Comptoir Abel, 25 Rue Guynemer, 69002 Lyon, +33 4 78 37 46 18. It is not Bistrot Abel, restaurant357746. Normalized local identity search found no prior match before implementation; 32d5 independently owns canonical identity/destination integration.

Monday–Friday, exactly two guests, lunch77701, six quarter-hour times12:00–13:15. Automatic confirmation true/until-null; charge and prepayment null; cancellation10,800 seconds relative to shift. No selected menu, room or gift. The complete French restaurant notice—including the15-minute lateness condition—is bound to consent. Specific-day notice must remain null. Strict own metadata and all nine original slot-policy fingerprints retain capacity, turn times, booking windows and offer/card requirements; only dynamic availability indicators and same-day date prefixes are excluded from those fingerprints. Changed policy fails closed. This conservative approach may reject future configurations until reviewed.

The adapter reports destination Lyon. Intent details are exactly date/time/party/shiftId; the existing contact projection adds firstname/lastname/email/phone/civility/country. Durable send approval binds shift77701. Outbound payload requires the exact party, supported time and shift, no room/menu/custom gift values; optional review invitations are stripped by the existing sanitizer. Confirmation requires independent same-attempt readback matching date/time/party and empty booking_offers, not merely a successful POST echo. Unknown outcomes cannot be retried.

## Original source and native evidence

Three HTTP GETs were made on20October: the own official page, one results query and one empty form. Exact own page: `https://www.maisonabel.fr/maison-abel/le-cafe-comptoir-chez-abel/`. Its explicit booking link is `https://bookings.zenchef.com/results?rid=357745&fullscreen=1`. No language, partner or SDK parameters were inferred. The query added only day2026-10-21/pax2; the form additionally uses slot12:00 under the existing source-backed form route.

The21October availability is now historical. It must not be presented as current availability. On22October work resumed exclusively from saved files, without fresh supplier probes.

The source fixture preserves original query, build2b18f39ef7, complete daily policies and metadata; no auth/payment secrets. Original hashes:

- Own page: `052355ae73fb46720342b65b734bd033e4af81e71a594ad5c9f6d209790a04e8`.
- Results: `7892c0af9870a3aade0ba429baff9d487ec05d16dfceb0530f193b415762ea76`.
- Empty form: `e15f4f71947d0f5f11770405809d9761691fcd4783023d12614433af0675848b`.

The source has optional legacy gift field3111, slug numero-de-bon-cadeau, and connected vouchers enabled, but voucherParam is absent. Original client replay proves the visible control is input#mybeezbox with “Votre code cadeau”, no name/required/readonly and an empty value. The existing Escudella DOM guard is reused, while Abel's own metadata fingerprint remains separate. Gift input is checked before review, submit and durable grant. No gift functionality is advertised by this scope.

Saved original HTML and matching client assets were replayed locally at390/1366; both images inspected. The actual adapter also reached empty contact and passed its native guard, with the gift/consent region separately inspected. No provider store injection or final-submit click occurred. Foreign357746 metadata and quotation-preview POST were immediately aborted. Own availability-summary refresh was held in the offline harness until teardown; aborting that request in the first exploratory replay navigated to unavailable. Production uses the existing narrowly allowlisted own summary GET. No foreign allowance was added. Phone flag images were blocked.

Raw files are retained at `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/comptoir-abel/`. Exact native image/contact/network hashes and static-asset hashes are in `scripts/fixtures/cafe-comptoir-abel-source.json`. Final adapter replay predates the added day-notice/query guards; final guard behavior is covered by synthetic tests.

## Verification and remaining integration

- `node --test scripts/test-zenchef-abel.mjs`:4/4 pass on22October. Three source/policy/payload tests and one browser suite with eight synthetic scenarios: confirmed receipt, gift before review/send, policy change before send, wrong durable shift, denied journal, wrong guest count receipt and nonempty offer receipt. Terminal cases also reject repeat submission. All browser transport is synthetic; no actual supplier request.
- `node --test --test-name-pattern='Escudella|Chez Fernand Guisarde' scripts/test-zenchef-playwright.mjs`:9/9 pass, including reused gift DOM guard and related metadata/payload regressions.
- Provider syntax, diff whitespace and original source-hash verification pass.

No real reservation, hold, payment or restaurant message was created. No self-merge/deployment. Remaining work belongs to32d5: shared integration, independent review/app QA and authorized publication. This provider delivery alone does not establish public availability or a real supplier-confirmed booking.
