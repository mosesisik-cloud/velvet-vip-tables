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
