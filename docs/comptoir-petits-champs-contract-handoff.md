# Le Comptoir des Petits Champs — ordinary lunch for two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Four provider-owned files on public277448c350fb801eb3d394e15449ad70bcf046d66ce. 32d5 owns identity5386c86/shared6451859cd22db1f9c6ebff423480466b97e6af56 and release278. Canonical curated-PAR-comptoir-petits-champs / ZENCHEF_COMPTOIRPETITSCHAMPS / VELVET_ZENCHEF_COMPTOIRPETITSCHAMPS. No shared/server/catalog/registry/deploy changes here.

## Own source evidence, 2026-10-20

Own/native Le Comptoir des Petits Champs,17, rue des Petits-Champs75001Paris,0142964754. Normalized name/domain/address found zero matches catalog832/registry188/worklist/masterstate/own previous qualification.

Own https://www.lecomptoirdespetitschamps.fr/ GET200/no redirect14:44:21.473UTC, SHA2564593eacd2095f7b1dc1ae8b44171e35a42621f87e864b34a7fc963e555c404bb. Ordinary booking buttons use data-zc-action=open; own widget config77441/fr. Explicit ReserveAction https://www.lecomptoirdespetitschamps.fr/reserver-une-table/?rid=77441&lang=fr returned301/emptybody at14:44:39.223UTC to observed https://bookings.zenchef.com/results?rid=77441&fullscreen&lang=fr&withCloseButton=1. No SDK/asset fetched.

One resultsGET day2026-10-23/pax2 returned200/no redirect14:44:52.534UTC, SHA2566be5b9c717644479ef20cfa1b847008641ea2a10b8c84fd22f5678c8394f1478. One conditional emptyformGET slot12:00,200/no redirect14:45:12.217UTC, SHA2565441c5f72b79ca84911ecde3f62c51089b63f860461f42baa07f7d22d63fc822. Complete state differences only query/wish/today/nowLocal. Raw HTML, metadata and full states remain outside repo in evidence/comptoir-petits-champs.

Own lunch292 Déjeuner semaine, exactly2, only eleven quarterhour times12:00–14:30. Auto true/untilnull, null charge/prepayment, no required offer/fromnull, cancellation86400seconds relative to shift, commentnull. Observed times possible2/unclosed/nonfull; original windows retained with existing freshness checks, not a held or guaranteed future slot. Dinner6847 excluded; its askablefalse/min1/per20 metadata is not assumed to impose a card requirement and is not part of this contract.

Exact query emptyfullscreen/langfr/withCloseButton1/rid/day/pax/slot; all other query keys rejected, no pid/sdk/statepartner. French/French/EUR/updatefalse. Sixstandardrequired/customFields[]/V2[]; comment/voucherdisplayed. Roomselectionfalse/mandatoryfalse/wishroomnull; raw78743Bas/89681Haut remain unselected. Daynotice null. No duration, room or menu promise.

## Two historical prepaid offer objects

Full original raw offers28189 Saint Sylvestre (2025-12-31) and28252 Réveillon de Noël (2025-12-24) retained, each activeTRUE and has_prepaymentTRUE/charge_per_guests5000, firststep/restrictedfalse, wish.offers[]. These are not selected or applicable lunch offers. All translations/description/weekdays/nulls/flags retained. Original created_at strings2023-12-21T09:39:17.000000Z and2023-12-23T14:31:47.000000Z; both updated_at2026-04-30T09:22:42.000000Z.

Named comptoirPetitsChampsOfferMetadata requires exactly two objects, the complete original array JSON.stringify digest e3a1475d826fdd5e70696d6afda4f35ed183ef130abe6ddb9d18beb83e78ebef, selected ISOday after BOTH date_to and wish.offers[]. Any changed/added/deleted/reordered raw metadata, relevant date, selected/required offer, card or prepayment stops the named contract at results/form/fresh review and pregrant checks. Other restaurant guards unchanged. Outgoing offers must stay empty; no payment/offer fields or menu prices added. Even object-order drift fails closed and needs review.

## Full notices and approval

Both complete raw French and English notices are bound exactly, including links, newlines and curly quotes. French is returned unchanged in terms.restaurantNotice:

```text
Le restaurant affiche complet? Nous vous proposons de réserver chez <a href=https://chimere-4septembre.fr/
 target=“_blank”> Chimère</a> ou au <a href=https://www.cafevery-paris.fr/
 target=“_blank”>Café Véry</a>. En cas d'impossibilité d'honorer votre réservation, pensez s'il vous plaît à l'annuler afin de libérer votre table et nous permettre de la réattribuer. Merci de votre confiance!
```

32d5 projects the entire readable notice safely with existing anchor stripping/textContent before consent. English lacks the cancellation request and must not replace French. Alternatives are not followed or substituted. No lunch shift notice; no comment/special request sent.

Fullschema/EULA/notice/shift fingerprints and exact historical-offer guard are refreshed before review and durable grant. Existing owner/revision/TTL, explicit consent, durable attempt binding, one POST/no retry, independent own-booking UUID readback and unknown-outcome lock remain; POSTecho cannot confirm.

## Independent native gate and tests

ce5c/master verified own original cached Contact/EULA390/1366. Twelve-file manifest585d74905c533e4e518700d0268c895338e4584dd906aabe6f3e8e632cb1303c; worker verified all12hashes. Query/identity/fulltwoofferarray/rawFR+EN unchanged. Ordinary Contact directly, blank inputs/unselected choices, no historical menu/price/card step visible. Unique unchecked French EULA with own /gtc?rid=77441&lang=fr. Mobile y917.42–958.42 lies below initial900px and needs normal scroll; desktop537.91–558.91. Full notice absent from native Contact, requiring Velvet projection. Two POST request events and four held/blocked entries are distinct counters; zero remote traffic. No new assets/providerGET or clicks/input in this check. Native does not prove a booking.

Focused5/5PASS: ten fully intercepted browser scenarios plus four pure tests covering own policy/query/times, both complete historical prepaid objects/timestamps/date guards, fresh drift and outgoing payload. Bounded regression9/9PASS: Canailles browser scenarios plus Canailles/Jaja pure tests. Syntax/diff checks and all fixture fields deeply equal own results source. No real reservations/holds/payments/contact/receipt access or supplier confirmations.

Combined integration, independent review, actual integrated appQA, activation and release are32d5's remaining gates. This provider delivery is not a published booking route or real reservation confirmation.
