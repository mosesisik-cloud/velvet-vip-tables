# Le Comptoir de la Gastronomie — card and manual confirmation evidence

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Evidence only on main2673a8cf26fa35656e19e41b2e5eb61fd4be2db1bfc. Identity4be27ccf1361f2d50aca0c1fd0f0ae95914b2db4 independently supplied by32d5/master. Canonical curated-PAR-comptoir-gastronomie; reserved ZENCHEF_COMPTOIRGASTRONOMIE / VELVET_ZENCHEF_COMPTOIRGASTRONOMIE, neither implemented nor activated.

Own Paris1er:34 Rue Montmartre75001. Official https://comptoirdelagastronomie.com/le-restaurante saved C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/comptoir-gastronomie-official-20261018.html SHA25604490b36064d780a4dba975a02e0e7572d27a8dd44ec5c753968c915d71ed5a7. Own iframe and reservation anchor rid88892/pid1001. Separate Paris7e RueBourgogne section and contradictory address75007/phone are excluded; no cross-branch identity import. Official footer says booking15days ahead and uses “Reservation for more than5people or more”; native notices say more than4. Preserve both source wordings, not an invented harmonization.

One permitted results GET on2026-10-18: https://bookings.zenchef.com/results?rid=88892&pid=1001&day=2026-10-23&pax=2 returned200/no redirect/results SHA2568776a4ba53c1ee1c933faed3d667235dab5196f9d1fed0d913fd8a6a65432347. Raw retained work/comptoir-gastronomie-results.html and -state.json. Native name Le Comptoir de la Gastronomie/address34, rue Montmartre/75001 matches own branch; statepartner string1001.

Lunch6065 Déjeuner - 12h: confirmation false/untilnull (manual), cardaskabletrue/min2/per15 applies to2, prepaymentnull/noofferfalse/fromnull, cancellation86400 SHIFT. Observed times12:00,12:15,12:30,13:30,13:45,14:00. Dinner5933 Diner 18h-21h30 also manualfalse/null and cardmin2/per20,86400SHIFT; sparse18:00,21:00,21:15,21:30,21:45. No form GET because safe automatic/no-card condition fails. Six standard mandatory/custom[]/V2[], no room, raw and selected offers[]. No capability or receipt probes, no native replay, no supplier writes.

PARK accepted by master. Activation requires separately assigned support for both card guarantee and manual confirmation, preserving request-versus-confirmed semantics and explicit consent. A visible time is not a confirmed reservation. No provider/test/catalog/runtime/registry/release change in this delivery.

## Exact native notices

### Restaurant en

```html
If you want to make a reservation for more then four people, please contact us at vincent@comptoirdelagastronomie.com

For your information reservations can be made only 15 days before booking

INFORMATION : The restaurant is closed sunday and monday (all day).
```

### Restaurant fr

```html
Si vous souhaitez faire une réservation pour plus de quatre personnes, veuillez nous contacter à l'adresse suivante : vincent@comptoirdelagastronomie.com

Pour votre information, les réservations ne peuvent être effectuées que 15 jours à l'avance.

INFOS : le restaurant est fermé le dimanche et le lundi
```

### Shift 6065

```json
{
  "fr": "Votre réservation est valable durant 15 minutes après l'heure prévue. Au delà, votre table sera annulée.\nYour reservation is available during 15 mn. after, the table will be cancelled."
}
```

### Shift 5933

```json
{
  "fr": "Votre réservation est valable durant 15 minutes après l'heure prévue. Au delà, votre table sera annulée.\nYour reservation is available during 15 mn. After, the table will be cancelled."
}
```

Validation: local raw JSON policy extraction and identity/source hash checks; documentation-only diff check. No implementation test or actual booking is claimed. Research is ready for accepted handoff; published release267 remains unchanged.
