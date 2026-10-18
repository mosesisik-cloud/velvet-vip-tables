# Biche Paris 8 — ordinary lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base main267 3a8cf26fa35656e19e41b2e5eb61fd4be2db1bfc. Separate verified identity 3890c2a1ca8fde0f2e338319db7ca53ba0c64aa4. Canonical curated-PAR-biche-paris8, export ZENCHEF_BICHEPARIS8, flag VELVET_ZENCHEF_BICHEPARIS8. 32d5 owns shared integration, registry, UI and release.

## Evidence — 2026-10-18

Own Biche, 129 Rue du Faubourg Saint-Honoré, 75008 Paris, 0153898373. Not Biche Paris3 or Ma Biche Paris18. Official https://www.biche-restaurant.com/en/ saved at C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/biche-paris8-official-20261018.html; SHA256 1546745c2976bb8611c35276bea42cb46ee7cf05c9e6c7b2c03095b8fb28c794. First iframe data-lazy-src and noscript agree on https://bookings.zenchef.com/results?rid=363606&fullscreen=1&lang=en . Second iframe decoration not imported. No pid/sdk/showCollapsed or group-route import.

One results GET https://bookings.zenchef.com/results?rid=363606&fullscreen=1&lang=en&day=2026-10-23&pax=2 returned200/no redirect/results, SHA256 fe740200bc298c9911cba58de4e099a48cb2f5b5a108be02b5cb198909719449.
One conditional form GET https://bookings.zenchef.com/form?rid=363606&fullscreen=1&lang=en&day=2026-10-23&pax=2&slot=12%3A00 returned200/no redirect/form, SHA256 d03b22ea8f61f7cbf4890db6d668a7651722d9dfd4418ab764c73b831f7f0815. Own native identity agrees. Raw local work/biche-paris8-results.html and -form.html retained. No repeat GET, asset fetch or native browser run by this worker.

Lunch149228 exact Midi Semaine: confirmation false/until9 (automatic for exactly2), charge/prepayment null, offer-required false/fromnull, cancellation10800 SHIFT. No mandatory room/selection, wish roomnull, raw and selected offers[]. Six standard required fields, customFields[]/V2[], updatefalse. language=en, restaurantLanguage=fr, statepartner absent. Native body/customersheet lang use state.language, independently from the absent formData.lang. Cached app createBookingData uses default partner1001 when statepartner absent; query/state absence must not be rewritten to explicit1001. Existing cached app SHA f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd, no claim of fresh remote assets.

18 observed sparse slots:12:00,12:15,12:30,13:30,13:45,14:00,14:15,14:30,14:45,15:00,15:15,15:30,15:45,16:00,16:15,16:30,16:45,17:00. Do not fill gaps. Dinner149229/Soir excluded, including its separate15min late notice.

## Notices and implementation

Lunch shiftcomment is null. Both exact restaurant notices are required and joined in terms.restaurantNotice for display before consent. FR contains late more-than20min cancellation absent from EN; group channels differ. Preserve both and first-service-only2h scope; do not invent a universal2h seating duration or a lunch15min rule.

### Raw en

```html
The Biche restaurant welcomes you in two services. <strong>(⚠️ The first service lasts 2 hours, after which the table must be vacated for the second service.)</strong>
<br>
<br>
For group requests of 10 people or more, please contact us at: <em>restaurantbiche.event@gmail.com.</em>

<br>
<br>
See you soon! – The Biche Team
```

### Raw fr

```html
Le restaurant Biche vous accueille en 2 services. <strong>⚠️ Le premier service dure 2h, la table devra ensuite être libérée. En cas de retard de plus de 20 min, votre table est annulée.</strong><br><br>De 10 à 40 personnes : <a href="https://www.biche-restaurant.com/reservation-groupe">réservez ici</a><br><br>À très vite ! – L’équipe Biche
```

Named provider policy checks own language, identity, exact typed rules, full notices, no offers/rooms/custom fields. Full schema+notices are fingerprinted and freshly checked before review/submit/durable grant. Own query rid/fullscreen/lang and absent pid are checked. English payload exception is only Biche and existing De Kas; body and customersheet must both be en. Terms URL keeps lang=en. Existing owner/revision/TTL, same-attempt durable shift149228 and independent own-booking UUID readback remain; POSTecho is never confirmation and unknown remains locked.

## Validation and release boundary

Focused Biche suite PASS4/4: ten synthetic intercepted browser scenarios plus sparse18-slot/policy/query negatives, fresh schema/notices/query drift, and named EN payload/cross-venue mismatch tests. No real contact/hold/reservation/payment/message/capability/receipt operations. ce5c alone owns cached native390/1366 validation. Independent review and actual app QA are required before 32d5 activates/publishes; this provider handoff does not claim publication or a real supplier confirmation. Only provider/test/own fixture/handoff changed.

Bounded regression: existing De Kas synthetic browser scenarios and two Casimir policy/fresh-schema tests PASS3/3. ce5c reports cached-native proof complete:12-file manifest e9431f3f642c0dc73b97432d2a8508fde9ddce739507533779eea8ad2271e61f, prefix biche-paris8-native. Own raw source hashes unchanged; English contact/EULA visible and unchecked at390/1366, own gtc rid363606/langen. Neither raw restaurant notice appears in native contact DOM, so Velvet must render both before consent. ce5c reports zero actual network requests and two automatic quotation POSTs aborted by interception. Provider worker did not repeat this replay.
