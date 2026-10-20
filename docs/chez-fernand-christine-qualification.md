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
