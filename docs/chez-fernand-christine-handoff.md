# Chez Fernand Christine provider handoff

Refs #129. Provider owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; shared integration/release remains32d5. Base public282/main154b8371ce0aa4239225b9140e2a74ab9c7ba96b. Source/earlier native evidence PR469; this change adds provider, own source fixture, dedicated tests and this handoff only.

## Supported contract

Canonical `curated-PAR-chez-fernand-christine`, export `ZENCHEF_CHEZ_FERNAND_CHRISTINE`, rid361894. Monday–Friday only, two guests, shift121338, slots12:00/12:30/13:00/13:30/14:00. Explicit À la carte60971×2; no automatic menu choice, mixed array, count1/count3, other offer or room. Both current menu offers and historical catalogue remain fully fingerprinted; changes fail closed. Meal price is unknown, not free.

Shared normalized offer has13keys: offerId60971/count2/nameÀ la carte/description empty/currencyEUR/mealPrice null/priceStatus not_provided_by_booking_form/menuSource https://www.restaurantchezfernand.fr//depositApplies false/depositMinGuests4/selectionSource native_offer/submissionSupported true/version64hex. Version binds date/pax, full shift/slot and metadata/catalogue. Auto false/until4, non-null card policy true/min4/25, no shift prepayment,10800-second shift-relative cancellation remain pinned. Full restaurant notice and `terms.seatingNotice` exact French90minute sentence are included in consent version. Root JSON-LD phone differs; own module/provider consistently show+33143251855 at9RueChristine75006Paris, not Guisarde.

## Source-proven direct route

Original results SHA4334ff573de308e9504cc77dbd639c946b55ff35a524cb62ee48c80cfd277a1d. One newly authorized own offersGET (2026-10-20T21:09:03.467Z) returned200/no redirect, SHA f8f74ef1e2012f48f4412b57c3cd565f62132ec8507371fd74966293f8735b8b:

`https://bookings.zenchef.com/offers?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2&slot=12%3A00`

The exact build2b18f39ef7 is required. Original `initServerSide` calls `prefillFormData`, which assigns existing wish keys from query, proving slot prefill. Response has own identity, selected12:00 and empty offers. Source choice flow is native add (count1), native increment (count2), then native continue. Form URL retains the same seven query keys. This avoids mounting the results client; the earlier results-client replay was unsuitable for production because it held foreign recommendation requests.

Root `suggestedRestaurantIds[0]=377647` creates a separate recommendation store. A network abort in getAndApplyWidgetParams is not a not-found error, so the store remains; results useEffect then invokes loadSuggestedRestaurantsData, whose getDailyAvailabilities error can navigate globally to /unavailable. There is NO foreign allowlist addition, forged response or indefinite request hold in production. The final direct-offers adapter test immediately aborts foreign getWidgetParams; no foreign inventory request follows.

## Current state and send boundary

Read-only traversal of the current mounted React root finds exactly one appStore context. No store methods are called and no booking state is injected. Static `__NEXT_DATA__` remains initial `/offers` with empty offers after navigation. Current state is independently checked before contact, review, submit and the durable grant, alongside exact URL and unmodified initial-data fingerprint. The observed SSR type:null→hydrated type:web transition alone is normalized for policy fingerprints; live state must be web.

Only exact60971/count2 is serializable. Approval and durable attempt bind BOTH shift121338 and offer/version. One-attempt native POST is guarded by the existing journal hook. A matching POST echo alone is unknown; confirmation requires same-attempt readback with exact date/time/pax, no room, exact booking_offers array and matching booking ID. Lost/mismatched receipts remain unknown and cannot be retried. Synthetic tests exercise these contracts; no actual Christine booking/hold/payment has been created.

## Validation

- `node --test scripts/test-zenchef-christine.mjs`:5/5 PASS, including seven synthetic browser scenarios (matching readback; mixed before review; count drift before submit; wrong/missing receipt offers; wrong durable shift; denied journal). Four pure tests include source, policy drift, payload negatives and strict request allowlist.
- Existing DeKas regression: `ZENCHEF_TEST_SCENARIO_PREFIX=dekas node --test --test-name-pattern='native booking and own-booking|De Kas admits' scripts/test-zenchef-playwright.mjs`:2/2 PASS (browser scenarios within first test).
- Existing DeKas/IBRIK/Guisarde pure checks:9/9 PASS.
- Actual adapter + original saved HTML/client assets: reached empty contact with correct60971×2 and full own policy, zero remote traffic. Foreign metadata and quotation-previewPOST aborted immediately. Own availability refresh was held only by the offline harness and aborted at teardown; production uses the normal narrowly allowed ownGET. Contact/terms screenshot and network hashes are recorded in the source fixture under nativeEvidence.
- `node --check` and `git diff --check`:PASS.

Local raw evidence is in `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/chez-fernand-christine/`. Final authoritative intake files are offers.html/offers-meta.json/offers-data.json and provider-native-contact.json/provider-native-network.json/provider-native-contact.png. Earlier alacarte results-based network captures were exploratory and one local network path was overwritten during abort diagnosis; use the final direct-offers hashes rather than treating every historical local file as immutable. The PR469 historical snapshots do not supersede the final route.

Remaining:32d5 integration with its combined shift+offer validator/journal/UI, exact integrated native/appQA/review, CI and authorized release. No self-merge or public deployment. This provider implementation is not itself a new public flow or a supplier-confirmed reservation.
