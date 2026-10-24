# Indiana Café Les Halles — required native select contract

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939/chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base main260caf136cf6366a4a7c036806ac8c8f308f60f323e. Canonical curated-PAR-indiana-cafe-les-halles/export ZENCHEF_INDIANALESHALLES/flag VELVET_ZENCHEF_INDIANALESHALLES.32d5 identity57cc6705e76e06e63e7643eb85d8b6d82ea2d71e stays isolated. This is evidence-only; implementation awaits actual cached DOM proof and shared enum contract, not a guessed selector/default.

## Own sources2026-10-18

Reused local official https://www.indianacafe.fr/restaurant/les-halles, C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/indiana-les-halles-official-20261018.html SHA256a1d7772d2c946721243d7212c99a2c0ac40da7a5480ab347c1dea4c37eb158e8 and indiana-directory-official-20261018.html SHA256040d0b632bbe1882b2611b3c7d4993b94b8150305bdfc442785728951f4d29ae. Own35,Rue du Pont-Neuf75001Paris/name/phone0142339707/375449pid1001 branch binding verified; no repeat official GET.

Single resultsGET https://bookings.zenchef.com/results?rid=375449&pid=1001&lang=fr&day=2026-10-23&pax=2 returned200 SHA256a9c016131bb73a572c9a8cb354280144a783caa63cd3a2e5db062674cf9c4a75. Native Indiana Café - Les Halles /35 Rue du Pont Neuf/75001 matches. Own lunch275998 Déjeuner/exact2/false-until8/nullchargeprepayment/nooffer/10800secondsSHIFT/no-room;15candidate times11:30–15:00. Exclude breakfast275944/continuous276001/dinners276003/276009. Candidate times are not reservations.

Single conditional formGET https://bookings.zenchef.com/form?rid=375449&pid=1001&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform SHA25626402e0412a737140790ac3a0e43638d8a85bba817c63e1638e60b4be328e113. Own identity/date/party/slot/policy match, query.pid/partner_id string1001. Strict roomselectionfalse/mandatoryfalse/wishroomnull. Raw catalog offers[] and selected wish.offers[] both empty; obligatoryofferfalse/fromnull, no optional offer found. OwnFRrestaurant notice exact in results/form: walkin/no terrace reservation/15minute retention/phone0142339707; no over20 rule. Own NONNULL lunch comment: Au-delà de 15 min de retard, nous ne pourrons plus garantir votre table. This is late-arrival policy, not a meal requirement.

## Required select and cached native behavior

Six standard mandatory fields PLUS custom_field.je-viens-pour required. Own customFields exactly4811/restaurant_id375449/title Je viens pour :/step3/typeauto/displayTypeselect/requiredtrue/enabledfalse/options three. V2[]. Exact option IDs/text/value:8000 déjeuner/ dîner;8001 grignotter;8002 boire un verre followed by ONE trailing ASCII SPACE. Each option enabled0. Do not trim value or infer disabled options from that metadata alone. No Montparnasse4815/purpose or Denfertmeal exception.

Existing cached app f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and form b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4 correspond to own HTML script filenames _app-30bffcb9f4c3b7b2.js/form-84144e7c9a8b854d.js. No new assets/fresh remote-byte claim. Exact excerpts and zero-based JS UTF16 offsets in own fixture are static evidence:

- getFields sets displayTypeselect for nonemptyoptions and noncheckbox type; enabled is only mandatory-state displayed, required is separately mandatory-state required.
- Legacy select renderer uses a blank option plus t.options.map without filtering option.enabled; each option value=e.value and label translated from e.text. value reads ev.custom_field[t.slug] or blank; onChange reads e.target.value through m(t.slug,value). This differs from the V2 component.
- m updates legacy custom_field keyed by slug, preserving the supplied value. Native validation requires truthiness for that legacy key; it does not itself prove enum membership, so any future provider must enforce the exact own allowlist.
- createBookingData aliases legacy custom_field into payload custom_field. No numeric4811/V2/comment/customersheet substitution inferred.

Static component code does not establish an actual rendered selector, label association, unique control, selected default, exact visible options/disabled state or live DOM behavior. Need empty cached nativeDOM proof390/1366 using existing assets with all other network blocked. No select/inputs/native POST or payload function executed in this analysis. Shared ledger/UI/approval binding must be expressly assigned and exact enum values retained, including trailing space; no automatic meal choice.

Raw files: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/work/velvet-cbfe5665/work/indiana-les-halles-form.html and -results.html; parsed -form-state.json/-state.json. Existing app/form assets in same work directory named aux-bons-crus-app-bundle.js and aux-bons-crus-form-bundle.js.

## Validation and remaining work

Own fixture checks pass for required metadata/exact options/empty catalog and selection/excerpt offsets/rawhashes. No runtime/provider/shared files changed or bookingmatrix rerun. No alternateGET/nativebrowser/newassets/contact/holds/reservations/payments/messages/capability/receipt reads.32d5 informed and retains sharedownership; master decides enum implementation scope, actual cached DOM proof needed before native selector implementation. Live260 unchanged; actual new supplier confirmations zero.
