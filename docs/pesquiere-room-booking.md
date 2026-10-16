# Pesquiere dinner: explicit room booking

Refs #129. Scoped venue osm-STT-la-pesquiere-le-mazagran-et-lou-revelen,
Zenchef362908, dinner136503, party2. Official source:
https://www.lapesquiere.fr/contact-restaurant-a-saint-tropez-dans-le-var-83/
Address1 rue des Remparts,83990 Saint-Tropez. The provider shares room inventory
for La Pesquiere51183, Mazagran salle52372 and Mazagran terrasse52373.

The native source uses room_id in the form URL and persisted wish.room_id;
createBookingData sends wish.booking_room_id and getBookingByUuid consumes the
same property. The original read-only search/select/fill/review was verified by
the adapter owner for19:00/room52372, with auto confirmation enabled, card asking
disabled and no prepayment. No final click or supplier write was made.
A real create-response room echo was NOT observed. This implementation therefore
requires a same-room echo in addition to the existing confirmed/ID contract;
missing or mismatched room evidence remains unknown, with no replay or readback.

An independent VELVET_ZENCHEF_PESQUIERE=live flag adds this guest capability beside
FishCorner. It does not activate Gigi. The existing runtime supports separate
venue entries under one provider, preserving exact venue/owner/resume binding
and shared capacity. Adapters close once even when shared by entries.

Every slot with room inventory requires a user-selected room; no first-room
default. The name is visible in review. roomId is an explicitly allowed action
field; the provider validates it against the observed slot inventory and exact
native form. The server journal stores only validated room ID/name as optional
selection metadata and verifies venue-specific policy, room proof and snapshot.
Public confirmation includes the bound room fields. No guest/contact data is
added to the ledger. Existing duplicate hashes remain unchanged deliberately:
changing room cannot re-arm the same owner's same venue/date/time/party booking.

16 adapter tests and28 runtime/journal/ledger tests passed on candidate22fde2e.
Actual full-chain and shared-boundary review are required before activation.
No real reservation, hold, payment or code is created for testing.
