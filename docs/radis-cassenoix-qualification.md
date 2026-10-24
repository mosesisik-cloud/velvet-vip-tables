# Radis Beurre and CasseNoix qualification — 2026-10-20

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Master requested bounded source qualification after release280, before implementation. Evidence only; no activation or shared runtime edits.

## Le Radis Beurre: no ordinary online booking route established

Own https://restaurantleradisbeurre.com/ identifies 51 boulevard Garibaldi, 75015 Paris, +33 1 40 33 99 26, restaurantleradisbeurre@gmail.com. Its ordinary navigation links FAQ and contact pages. All three returned HTTP200 without redirects:

| Source | Capture UTC | Original SHA256 |
| --- | --- | --- |
| https://restaurantleradisbeurre.com/ | 2026-10-20T16:08:52.724Z | 32fa1c5e04083e92e344fe9334bcde419c92cf1c9d4ec07885bc7b7eed5eaeb4 |
| https://restaurantleradisbeurre.com/questions-reponses/ | 2026-10-20T16:09:17.156Z | bf0f95c67a6e628adc8d0fc29ac56dcf51dbe399119ed0fdd04d1e4da02bbc6d |
| https://restaurantleradisbeurre.com/contact-acces/ | 2026-10-20T16:09:19.030Z | 5ed990222ef95a8f8b6529f7251e9d86e5889910967f09715c5dd5247ffb24cb |

Raw anchor/iframe/provider-marker inspection found no ordinary booking entry in these pages. Contact hours and phone/email do not establish an accepted booking channel. This is an unresolved online route, NOT evidence of another engine, closure, or phone booking. No supplier results/form requests. Park pending new primary booking evidence.

## Le CasseNoix: Zenchef route requires bank guarantee

One distinct fallback candidate: Le CasseNoix, 56 rue de la Federation, 75015 Paris, +33 1 45 66 09 01. Own https://www.le-cassenoix.fr/reservation/ returned HTTP200 without redirects at 2026-10-20T16:10:21.946Z, SHA256 7fb617b784fdb0d68dffe672cf61e2161e8678f764b2f25bfb292395deb93ebe.

The original iframe is https://bookings.zenchef.com/results?rid=361885&fullscreen=1. The own page explicitly requires a bank guarantee of EUR40/person, requested directly or by an emailed link valid three hours; without it the reservation is not retained. It separately describes group and dinner menu conditions and explicitly provides a telephone reservation route. Full original HTML preserves those notices. The guarantee requirement blocks the current no-card integration scope. Stop BEFORE supplier results or form GET; no SDK fetch, iframe load, card input, contact, hold, reservation or payment. Park; no new engine or workaround.

## Duplicate checks and evidence custody

Against origin/main 558a91f9904e0916156e94a550edbc4adad3b9ef (catalog835/registry191), normalized name/domain/address checks found zero matches in data/restaurants.json, js/restaurant-booking-providers.js and data/restaurant-worklist.json for these two candidates. Own earlier evidence and the readonly master monitor state contained no CasseNoix match. Le Petit Retro was considered only during duplicate screening and rejected as already existing; no own/provider GET was made for it.

Original response bytes and JSON capture metadata are retained outside this checkout at ../../evidence/le-radis-beurre/ and ../../evidence/le-cassenoix/. SHA256 checked against those files. No executable code changed; document diff check only, no unrelated runtime test reruns. Neither candidate is qualified for implementation. Master must assign the next bounded candidate; release280 is unchanged.
