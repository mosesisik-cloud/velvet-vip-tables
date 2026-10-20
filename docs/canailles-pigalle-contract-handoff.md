# Les Canailles Pigalle — lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Four provider-owned files on public276222027531f6ab9fa6ee1461caf53b89d80ca6e24. 32d5 owns identity fbe2ad3 and shared67c7055baadf1f22f482453a065381f3b5059920, canonical curated-PAR-les-canailles-pigalle / ZENCHEF_CANAILLESPIGALLE / VELVET_ZENCHEF_CANAILLESPIGALLE. No shared app/server/catalog/registry/release changes here.

## Own evidence — 2026-10-20

Les Canailles Pigalle,25 rue La Bruyère,75009Paris,0148741048. Native LES CANAILLES/25 RUE LA BRUYERE/PARIS75009/+33 1 48 74 10 48. Distinct from Comptoir Canaille, Vaugirard, Antibes and Le Touquet. Normalized own-name/domain/address scan found zero matches in current catalog831/registry187/worklist.

Own https://restaurantlescanailles.fr/ returned200/no redirect at14:19:46.448UTC, SHA256234b576844aa92b910c38694562c43631d40de17d8863c1213ded1eda54537e8. Repeated ordinary booking anchors link https://bookings.zenchef.com/results?rid=361319&pid=1001. One results GET adding day2026-10-23/pax2 returned200/no redirect at14:19:59.580UTC, SHA256bee64e2276050128a4e41fc5a33c56d8e626c35876114af459eb10e81c1d511c. One conditional empty form GET with slot12:00 returned200/no redirect at14:20:16.888UTC, SHA2567c2681c2f41a3b27775c6d8ad82ba374f2dd04c8487f255dd7225bed6d060a82. Only query/wish/today/nowLocal differ between complete results/form states. Raw HTML, metadata and full states remain outside repo in evidence/les-canailles-pigalle.

Exactly two, lunch107333 Déjeuner, only12:00/12:30/13:00/13:30. Observed shift/slots unclosed/nonfull with possible2 and no waitlist. bookable_from null and bookable_to2026-10-23 11:55:00 are retained in fixture and evaluated by existing freshness/window logic. Automatic true/untilnull, null card/prepayment, no required offer/fromnull, cancellation10800seconds relative to shift, shiftcommentnull. No seating duration inferred. Dinner107337 and its table-reuse notice, suggested restaurant361320 and other times remain excluded.

Exact original query rid361319/pid string1001/day/pax/slot only; no lang/fullscreen/SDK/close-button parameter. Native statepartner string1001, French/French/EUR/updatefalse. Six standard required fields, customFields[]/V2[]; comment/voucher displayed. Room selectionfalse/mandatoryfalse/wishroomnull; rooms43053(emptyname),67873Woody,147847Préférence de placement3 remain unselected metadata.

## Expired unselected raw offer

Raw offers contains the complete original49528 Menu St Valentin object. is_active is true, both date_from/date_to are2025-02-14, firststep/restricted/prepaymentfalse, selected wish.offers[]. Full original object retained in fixture, including description, all flags/nulls/weekdays and exact timestamp strings created_at2025-01-08T17:19:59.000000Z / updated_at2026-04-30T09:22:47.000000Z. No PowerShell timestamp normalization.

Named canaillesPigalleOfferMetadata binds the entire original offers array using SHA256 of JSON.stringify:4fa22450fb742152bda07414871060782534d4b6f3afc3b1c9ee030204d3f06b. It also requires the selected ISO day to be later than the observed date_to and selected offers to remain empty. Any changed/added/deleted metadata, active-date change, selected offer, required offer or prepayment stops the contract. Object-order changes also fail closed and require review. No generic raw-offer guard is relaxed. Metadata is never presented as a current menu or price, and outgoing offers remain empty under the existing payload guard.

Full restaurant notice, preserving its double space before the telephone number:

```text
En cas de demande particulière, merci de nous contacter par téléphone au  01 48 74 10 48
```

Returned unchanged in terms.restaurantNotice for32d5 projection before consent. No special request/comment/contact is transmitted. Daynotice null; no lunch shift notice. Existing schema/EULA/notice/shift freshness and named raw-offer checks apply before review and durable grant. Existing owner/revision/TTL, explicit consent, durable attempt, one POST/no retry and independent own-booking UUID readback remain. A POST echo cannot confirm; unknown outcome locks.

## Independent native check

ce5c inspected own cached Contact/EULA390/1366. Twelve-file manifest c22bfe48a4dce51eb7d0030ed2a698f6b16f837f3337c55e4fd672fe3c881dd3, assetmanifest9e387863b6394a8a787f646ac1e231a8dbb59b5ace99e6102f8795c777f7df94. Worker verified all12file hashes. Original entry/query/state and complete offer retained. Contact direct, no click/input; unique unchecked French EULA with own observed /gtc?rid=361319&lang=fr. Mobile y844.078125–885.078125 and desktop537.90625–558.90625 inside initial900px. Both screenshots visually checked byce5c. Contact empty, civility/opt-ins unselected, optionalcommentempty; raw voucherdisplayed but no visible voucher input. Expired menu/price/selection absent from Contact and does not block it. Full restaurant notice absent from Contact: Velvet projection remains required. Zero new assets/providerGET, zero remote renderer requests, two automatic quotation POSTs aborted before transport, zero pageerrors; font/iconfallback.

## Validation and remaining release gates

Focused5/5PASS: ten fully intercepted browser scenarios plus four pure tests covering identity/query/policy/times, full expired-offer metadata, fresh form drift and outbound payload. Bounded regression9/9PASS: Jaja browser scenarios plus Jaja/Bien eleve pure tests. Syntax and diff checks passed; every fixture field is deeply equal to its own raw results source. Tests do not create real reservations, holds, payments, contact or supplier confirmations.

32d5 owns combined integration, flag activation, full notice projection and publication; independent review and actual integrated appQA remain required. This provider delivery is not a public release or real booking confirmation.
