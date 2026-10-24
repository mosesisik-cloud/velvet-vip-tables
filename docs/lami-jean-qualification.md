# L’Ami Jean: manual-confirmation boundary

Refs #129. Owner: `codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939`, chat `01a141e3-6cf0-7ef1-8908-41a5840b1b4e`. Master assigned this exact candidate after release 284; 32d5 retains shared integration and release ownership. Inspected 20 October 2026, 23:26 Europe/Stockholm. Evidence only; no runtime activation.

## Identity and ordinary booking route

The own [website](https://lamijean.fr/) identifies L’Ami Jean, 27 rue Malar, 75007 Paris, telephone +33 1 47 05 86 89. Normalized name/domain/address/phone search across `data`, `docs` and `api` at main `256572e7ecea022023e5850fc08c6c32e747238f` returned no matches. No canonical restaurantId was invented or assigned.

One root GET returned 200 and linked “Réserver une table” to `https://lamijean.fr/reservation/`. One GET of that exact page returned 200 and contained this ordinary iframe:

```text
https://bookings.zenchef.com/results?rid=343886&fullscreen=1
```

One results GET added only the search inputs `day=2026-10-21&pax=2` for the next lunch date. It returned 200 without a redirect. No SDK parameters, language, partner, room, slot or offer were invented. Provider identity is `L'Ami Jean`, restaurantId `343886`, telephone `01 47 05 86 89`, France, EUR, Europe/Paris. The own-site address was not inferred from the provider name alone.

## Concrete obstacle

Lunch shift `1977` (12:00–14:00) has `confirmation: {is_auto:false,is_auto_until:null}`. This is a manual-confirmation shape, unlike the established bounded automatic-acceptance thresholds. Its own French lunch notice additionally requires the guest to reconfirm 24 hours before or risk cancellation. These two requirements must not be conflated or hidden by marking a submitted request confirmed.

For 21 October, the lunch shift is marked full. All five half-hour slots have empty `possible_guests` and waiting-list arrays. This observation proves neither permanent unavailability nor absence of future availability. No further date was queried after discovering the independent confirmation obstacle.

Lunch `charge_param` is `{is_web_booking_askable:false,min_guests:1,charge_per_guests:75}`; preserve that non-null object rather than describing the entire charge policy as absent. Prepayment is null. Cancellation is 86,400 seconds relative to the shift, and booking closes at 09:00. There is no required offer. Room selection and mandatory-room flags are false, wish room is null, and the source still carries bookable room `352`, “La salle”. Full shift and slot capacity/window metadata is retained in the companion JSON.

Dinner `1978` also has false/null confirmation, and additionally has web charge askable true from one guest, amount 75. It is excluded, not substituted for lunch. The global September 4 Greek-event offer remains in the source but is historical for the selected date and was not chosen.

## Evidence and limits

[`evidence/lami-jean-source.json`](evidence/lami-jean-source.json) preserves the exact query, source metadata and SHA-256 hashes, full daily availability and offers, restaurant/day/shift notices, mandatory/custom fields, room/voucher state and relevant locale/identity flags. Authentication and payment keys are excluded. Raw captures remain in this chat’s `evidence/lami-jean` directory outside the repository; root/reservation hashes describe UTF-8 re-encoded response text, while the results hash describes the original response bytes.

Results SHA-256: `2ea7d330a4e04d46c5eb9313654e106fa3492fd10df5e71194975907c57bedb3`. Original build: `2b18f39ef7`. Raw-hash, source-to-projection equality, exact-query and manual/no-availability assertions passed. This is source qualification, not a native form or end-to-end test.

No browser/script execution, form GET, slot selection, personal details, submission, reservation, hold, payment or restaurant contact occurred. Exactly three HTTP GETs were made. No runtime or canonical registry files changed. Release 284 remains unaffected.

Status: blocked for the existing automatically confirmed booking contract. A separately scoped request/pending-confirmation flow with truthful result handling and the reconfirmation obligation would need an explicit product/integration decision. Do not reopen the same obstacle by probing more dates or silently treating a request as a confirmed booking.
