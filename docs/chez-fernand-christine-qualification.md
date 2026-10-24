# Chez Fernand Christine — unresolved ordinary booking entry

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Master source-only assignment after282. Status parked pending a concretely observed ordinary entry within approved inspection scope.

Normalized name/domain/address/phone search on main154b8371ce0aa4239225b9140e2a74ab9c7ba96b catalog837/registry193/worklist returned only the distinct published Chez Fernand Guisarde name/domain row. No Christine address/domain/phone match; own prior evidence contained only Guisarde. Do not reuse Guisarde384073/policy/query.

ONE GET https://www.restaurantchezfernand.fr/ returnedHTTP200/no redirect at2026-10-20T17:29:33.962Z. Original SHA256a8d80b4001ad3dec49aa42af4c79b4d6dd4ff6fe9afd79e0f59e3edd074ec1dd. OriginalHTML/meta retained at C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/chez-fernand-christine/official.html and official-meta.json.

The raw own page title and structured Restaurant name identify Chez Fernand Christine,9 Rue Christine75006Paris. Its structured telephone is +33 1 43 54 61 71, DIFFERENT from the supplied search lead +33 1 43 25 18 55. Neither is silently substituted or contacted. The author metatag names Josephine Chez Dumonet; it does not establish a branch or booking destination. The explicit Restaurant name/address are retained separately.

Rawbody contains an empty root element, an inline Zenchef SDK loader and this configuration:

```html
<div class="zc-widget-config"
  data-restaurant="361894"
  data-open="false"></div>
```

This is evidence of an own Zenchef widget configuration, but the returned HTML contains no concrete results/form href, ReserveAction URL or directly observed booking redirect. An acceptsReservations True value alone does not supply that route. The app module /assets/index-BxTjHQ_d.js is referenced but not fetched or executed; no SDK/native/asset request is authorized by this source-only boundary. Do not invent fullscreen/lang/pid query parameters or borrow them from Guisarde.

Stop at unresolved ordinary entry, not a claim that Zenchef is unsupported, the restaurant is closed, or booking is unavailable. No supplier results/form query, SDK, script execution, alternate host/path/branch, contact, reservation, hold or payment. No policy/schema/availability/confirmation/card data established. Originalhash verified and document diffcheckPASS; no runtime tests or shared/runtime changes. Existing282 unchanged. Master can decide whether a separately bounded read of the referenced own application source is warranted; no such further request made here.

## Authorized bounded own-module inspection

Master authorized one rawtextGET of the EXACT root-referenced module; no execution or imports. https://www.restaurantchezfernand.fr/assets/index-BxTjHQ_d.js returnedHTTP200/no redirect at2026-10-20T17:31:08.034Z,507846bytes,SHA256f00e0fa2948191a2ccfe2461a646174b2558525a38aa4155e3e5b4c6026ec1b4. Stored own-module.js and own-module-meta.json beside the root evidence; hash/length verified.

The shared booking-button props are exactly:

```javascript
nC={type:`button`,"data-zc-action":`open`}
```

The floating booking component kC renders a button spreading those props (`...nC`) and labels it via reservationWidget.label (French Reservation / English Book a table). This delegates opening to the root's Zenchef SDK/config361894. No concrete results/form URL or additional query parameters are present in the own module. Its separate api.zenchef.com/api/v1/restaurants/361894/reviews reference is a REVIEWS route, not a booking entry, and was not fetched.

Module-rendered identity states Chez Fernand Christine,9 Rue Christine75006Paris. Footer and privacy text contain0143251855, agreeing with the original search lead; the root JSON-LD's0143546171 discrepancy remains recorded. No contact was made and no canonical phone changed.

Outcome remains unresolved concrete booking destination/query within this inspection boundary. Exactly one moduleGET added; no imports/SDK/analytics/fonts/browser/provider/results/form fetched, no code executed or transaction. No invented URL/defaults. Await master assessment before further network work.

## Authorized static SDK trace — initial destination established

Master authorized ONE rawtextGET of the exact SDK URL referenced by the own root, with no execution/import/provider requests. https://sdk.zenchef.com/v1/sdk.min.js returnedHTTP200/no redirect at2026-10-20T20:24:30.170Z,19582bytes,SHA256f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c. Saved sdk.min.js and sdk-meta.json beside own evidence; hash/bytes independently verified. This later SDK capture is timestamped separately from the earlier root/module captures.

Static chain in this captured SDK:

1. ce reads the first .zc-widget-config through I.extractFromDocument; own raw root supplies restaurant361894 and data-openfalse, with no other attributes. Script-host detection Q selects Zenchef for the explicit sdk.zenchef.com source; I.env falls back to prod because own data-env is absent. K selects the production bookings.zenchef.com origin.
2. I.bwParameters maps data-restaurant to rid. Missing data-lang/data-partner-id/data-position/etc returnnull and P.addParameter omits nullish values. Missing data-hide-default-button deterministically produces showCollapsedSTRING1. These are SDK-proven rules, not assumed defaults. data-openfalse affects only the open delay (null), not the URL.
3. P.loadConfig constructs h without multivenue and adds sdkSTRING1 and withCloseButtonSTRING1 before the mapped parameters. h.page selects results: own root URL has no search parameters for prepayment, credit-card-imprint or preview and no multivenue config. h.build uses URL/URLSearchParams in insertion order; P.resetSrc assigns the built URL to the iframe.
4. y listens to clicks on data-zc-action, passes open through c/R to O, which calls P.open. With showCollapsed1, P.open sends an open-widget postMessage to the iframe; it does not add booking query values. The own module contains no ZcWidget/ZenchefWidget/openWith/openOffer calls.

Relevant exact small code fragments from the SDK:

```javascript
get env(){return this.getAttribute("data-env")??"prod"}
this.iframe.setAttribute("src",this.urlBuilder.build())
case"open":this.iframeBuilder.open();break;
```

The deterministic INITIAL iframe destination for the captured own root configuration is therefore:

```text
https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1
```

No lang, pid, fullscreen, day, pax, room or offer is added by this own path. In particular, ownHTMLlangfr does not become a bookingquerylang in this SDK. No URL was fetched to validate the derivation; it is a static derivation, not an observed browser request.

Remaining runtime boundaries: initial construction requires the own config/script element to exist in the DOM; subsequent widget-listening/height/open/redirect/popup events and supplier content are unknown until separately authorized inspection. The SDK also contains other website_popup/payment/redirect/analytics branches, but they are NOT the selected initial booking URL and none was followed. Provider identity/policy/schema/availability/default language/native rendering and successful acceptance remain unknown. Dynamic server changes since capture are not inferred away.

The previously unresolved INITIAL destination is now statically established from own config plus captured SDK. Stop here for coordinator assessment BEFORE any results/form request. No SDK execution, CSS/import/analytics/font requests, browser replay, provider traffic, transaction, contact or implementation; document-only update to the same PR469.

## Authorized results-only qualification — required-offer boundary

ONE read-only GET of the statically established initial URL plus ONLY the explicitly requested search inputs day2026-10-23/pax2 returnedHTTP200/no redirect at2026-10-20T20:27:10.492Z. OriginalSHA2564334ff573de308e9504cc77dbd639c946b55ff35a524cb62ee48c80cfd277a1d. Exact requested/final URL:

```text
https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2
```

Original results.html/results-meta.json/results-state.json saved beside earlier evidence. Raw query contains exactly those six STRING values. day/pax are user-selected search values, not original SDK parameters. sdkStoreState is isSdktrue/showCollapsedtrue/isCollapsedtrue/iframePositionright/sdkEntrypointrestaurant.

Provider identity matches Chez Fernand Christine,9 Rue Christine75006Paris,+33143251855, corroborating own rendered-module identity/phone. Earlier root JSON-LD phone0143546171 discrepancy remains visible in this record. No Guisarde data substituted.

Own lunch121338Dejeuner: confirmation{is_auto:false,is_auto_until:4}, charge{is_web_booking_askable:true,min_guests:4,charge_per_guests:25}, prepaymentnull. This is the existing threshold shape for automatic acceptance below4 and no card below4, not false/null manual confirmation and not a null charge. Exact2 falls below both thresholds, but a required-offer step remains: is_offer_requiredtrue/offer_required_from_paxnull, wish.offers initiallyempty. Do NOT silently choose an offer or treat this as an ordinary no-offer contract.

Five available half-hour slots12:00,12:30,13:00,13:30,14:00 include2. Shiftfromnull/to2026-10-2314:15; each slotfromnull/toits own time. Full shift and each slotcapacity: min1/max20/total_per_slot40/waitlistvalues0/show_turn_timesfalse/buffer0/all six turn_times values6. Cancellation10800seconds relative shift. Own explicit French shiftcomment states a90minute table duration; this is text evidence, distinct from internal capacity and any unobserved DOM endtime.

Global offer objects preserved completely in originalstate:

-23228Formule Dejeuner: active/from2023-06-19/no end date/weekdaysMon–Fri/charge2450/no prepayment; description distinguishes two-course24.5 and three-course29.5EUR; no claim that the stored charge proves a selected final bill.
-60971A la carte: active/from2025-04-15/no end date/weekdaysMon–Fri/chargenull/no prepayment.
-47494year-end menu: activeflagtrue but date2025-12-24 through2025-12-31,charge15500/no prepayment; historical for selected2026date, not selected or generalized.

Lunch shift offers23228 and60971 retain complete stock/capacity/config/payment_type none/has_prepaymentfalse/window metadata. Each of the five slot offers retains stock1000, min/max/totalcapacitynull, is_limited_to_paxfalse/is_same_for_allfalse/min_pax_available1/maxnull, own fromnull/toits time and possible_guests1–20. No offer selected, count constructed or payload sent.

FR/FR/EUR/isInUpdateFlowfalse/partner_idABSENT despite no querylang. Sixstandardrequired,comment/voucherdisplayed,customFields[]/V2[],custom_field{}. roomselectionfalse/mandatoryfalse/wishroomnull; rawrooms77565Devant/77566Salle double-space Milieu/77567Fond retained. connectedvouchersfalse/shoptrue/voucherParamABSENT/bothcodesempty/lunchactivevouchertrue/limitfalse. Daynotice23octnull. Full original French restaurantnotice offers phone contact when the desired booking is unavailable; no contact made. Dinner121339 has charge threshold1 and14400second cancellation, and is excluded.

STOP before emptyform/native/implementation: mandatory menu selection plus own90minute term requires explicit scope assessment; current qualification does not establish the no-offer contact flow. No claim that lunch2 necessarily requires card or manual approval. No further GET/SDK/browser, no input/offer selection/hold/contact/reservation/payment. Originalresults hash and exact rawHTML-to-savedstate deepJSON verified. This source record is ready for coordinator decision;283 implementation is not assumed.

## Required-offer contract and offline native evidence — 2026-10-20

This section supersedes the earlier STOP at the required-offer boundary. Master explicitly extended the same assignment to source derivation and completely offline original-client replay. No runtime/provider implementation is included in this PR.

### Exact client sources and navigation

The original results HTML references build `2b18f39ef7`, `_app-a594f8b01517e683.js` (SHA256 `c87ee2585d01c6e86fabb1f29d0950497817eb5feca8426671fb229d2c9f9509`) and `results-803a0db5615ab11c.js` (`79bd01415618e7e50b5ff461f603bdb8c2aa26d10ae13b398fd6f04a135954cd`). Its exact build manifest (`a7039dfadf806a4ab4a6be848901601f1942d2d4178fe7482cd958d5a67f68f3`) references `/offers` bundle `offers-b5c31684a647ec4e.js` (`a54c9a2a9fd28f86ba26ebadd20962e07fa0a224604da062218e409c1eb276d3`) and `/form` bundle `form-7e6e65ee0b088568.js` (`c659c89822563e4fd140fa03ffc753ca9645b7a0f41c9d0dcd637ec2418cd32a`). Existing exact-name assets were reused. Only missing results/offers JS and two referenced fonts were fetched; no new restaurant-page GET was necessary.

The original results response was served locally to Playwright with ALL routes intercepted. Original client actions were: open collapsed booking widget, select the observed `12:00`, press search, select À la carte, increment its count, continue to contact. There was no response rewriting and no invented API response. The actual client reached:

```text
/offers?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2
/form?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2
```

The slot is carried in live client state, not added to these observed URLs. The source `goToNextPage` chooses offers when selected shift/slot/wish allow offers; generic navigation preserves current query. Critically, SPA navigation leaves `#__NEXT_DATA__` describing `/results`, with initial empty offers and no selected slot. It is NOT current form evidence. Passive reading of the mounted React context (no state mutation) established current `appStore.state.wish`, selected shift and selected offers alongside the DOM. An implementation must not claim that stale initial JSON proves the accepted selection.

### Count, mixing and price semantics

The original `addOffer` function starts count at one for `is_same_for_all=false`, increments an existing offer by one (up to stock), and only uses pax directly when `is_same_for_all=true`. Both Christine offers have false. `countSelectedOffers` sums all selected counts. `OffersFooter` requires valid offer counts AND, for this required-offer shift, total count at least pax. There is no exact-total or same-for-all rule here; `is_limited_to_pax=false` does not impose a two-count cap.

All three offline runs establish empty selection => disabled continue; À la carte60971 count1 => disabled continue; total count2 => enabled continue. Desktop and mobile À la carte runs preserve exactly `[{offer_id:60971,count:2}]` into the empty contact form. A separate desktop run proves `[{offer_id:60971,count:1},{offer_id:23228,count:1}]` is also accepted by the original client and retained into the form. Thus mixed arrays must never be silently reduced to a single entry.

A bounded first Velvet implementation can offer an explicit **À la carte for two** choice and require exactly the single60971/count2 array at every boundary. Reject mixed, alternative, missing, duplicated and surplus entries unless separately supported. This is a product restriction on the observed native possibilities, not a claimed provider requirement. Do not preselect or describe count2 as the result of one native click. Do not show 0EUR/free: À la carte has no stated meal price. The mixed native desktop form displays À la carte×1 plus Formule Déjeuner24.5EUR×1 and total24.5EUR; this is not evidence for the entire restaurant bill or the three-course variant.

### Empty form, policy and transport

Machine-readable evidence is [chez-fernand-christine-native.json](evidence/chez-fernand-christine-native.json), including individual raw capture hashes, current wishes, button gates, native text, empty controls, EULA bounds and source hashes. À la carte was replayed at1366×900 and390×900. All contact inputs remained empty, consent unchecked; no final Réserver click occurred. The EULA links `/gtc?rid=361894&lang=fr`. Desktop EULA y710.328125–731.328125 lies inside900; mobile y975.078125–1016.078125 lies below900 and needs scrolling. The mobile original summary does not visibly list À la carte although current state retains60971/count2; desktop visibly shows À la carte×2. Velvet must display the explicit choice in its own review/consent on both sizes.

Both À la carte replay runs: one locally served original results page,32 cached assets,2 original embedded locale responses,4 held then aborted refresh GETs,7 other blocked GETs, and2 POSTs aborted before transport (feature metrics and `quotation-preview?restaurantId=361894`). Mixed replay was before fonts were added (30 cached assets/14 blocked GETs), and is semantic evidence only. No real external request was made by any replay. No booking, hold, quotation or payment was created. Refresh requests remained pending during inspection and were aborted at teardown; the displayed availability is the saved original snapshot, never a claim of newly fetched availability. The initial exploratory replay failures (missing cache and then changed increment selector) were local only; final assertions pass.

The native form repeats the exact shift sentence `Vous disposez de votre table pour une durée de 1h30.`. Preserve full original restaurant notice, shift121338, automatic threshold false/until4, non-null card policy true/min4/25EUR, no prepayment and shift-relative cancellation10800seconds. Do not import Guisarde or DeKas terms. The phone discrepancy documented above remains unresolved in root JSON-LD, with visible/provider phone +33143251855.

### Submit and receipt boundaries

Static inspection of exact `_app` `createBookingData` shows `offers:state.wish.offers` (offer_id/count entries), chosen day/time/pax, language, standard contact/customer-sheet fields and `partner_id:state.partner_id || "1001"`. A null room does not add a room wish; waiting-list false does not add its phase. The fallback does not justify adding a PID to the original URL or initial state. This pure payload builder was inspected, not invoked to submit and not used to fabricate a provider response.

The same original client maps `getBookingByUuid(...).booking_offers` back to offer_id/count entries and consumes booking_offers from booking/update responses. This is shared client schema evidence, NOT an observed Christine receipt. An actual Christine server confirmation/readback remains unverified; no capability URL or booking UUID was fetched or generated. The implementation must bind both shift121338 and the exact approved offer array through consent, journal/restart and receipt comparison. Shared integration owner32d5 identified that the current journal's sequential offer/shift details spreads would overwrite one another, and that its existing ledger only accepts shift-only or DeKas-offer-only. Those must be explicitly extended, not bypassed.

### Handoff and remaining work

Own source/native contract is ready for review. Proposed first implementation scope is exact two guests, observed lunch policy, explicit À la carte60971×2; the other native menu remains an unsupported alternative unless full mixed handling is separately implemented. 32d5 owns shared booking-offer, UI/server/registry, journal/ledger and release. Provider owner1b4e owns provider/fixture/tests only after contract acceptance. Remaining work: current-state binding instead of stale initial JSON, own strict offer/shift validation, consent projection including menu and90minutes, durable combined binding, native/review verification, then integration/release checks. This evidence PR adds no public restaurant and is not a completed end-to-end booking.

Local reproducibility inputs: original evidence folder `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/chez-fernand-christine/`; own scripts `work/christine-replay.mjs` and `work/christine-package.mjs` under the isolated provider checkout. Replay takes `REPLAY_WIDTH=390|1366` and `REPLAY_MODE=alacarte|mixed`. Packaging assertions verified all3runs, exact count gates/current wishes, empty contact/EULA, stale initial state and blocked transport. No runtime tests were added or rerun for this source-only change.
