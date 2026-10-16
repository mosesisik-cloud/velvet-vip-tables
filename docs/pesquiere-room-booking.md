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
A real create-response room echo was NOT observed. A confirmed create response
now requires one read of the same booking UUID from that
response: GET https://bookings-middleware.zenchef.com/bookings/{uuid}?restaurantId=362908.
The immutable server attempt, review fingerprint, session and owner remain bound.
Saved ID, confirmed status, room, date, time and party must all match. Native
metadata uses only the already available provider SDK. No redirects or retries
are allowed; errors or incomplete/mismatched evidence remain unknown and consumed.
A create-response room echo alone cannot confirm. The server journal independently
requires the own_booking_readback proof marker and preserves it in the public result. No real supplier POST
or UUID lookup was performed during development; contract tests use local transport.
Source: _app-3026847bc4bd29c6.js modules70566,46712,39867 and loadBookingWithUuid.

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

Release204 runtime candidate2b4f7eade252b17362befc4718c6fcf7196bbed3 passed
16 adapter tests plus28 runtime/journal/ledger tests; register/result checks pass.
The source-backed exclusive-readback fix and shared marker enforcement passed
narrow independent review. Actual app/API/native Chromium/SQLite integration:
Pesquiere282API/15restarts/12mockPOST, FishCorner42API/2restarts/2mockPOST;
Sturehof120API/4restarts/3mockPOST on the same shared changes. Zero actual supplier
requests. The final harness49eaa03 verifies pending ledger state before readback,
matching and mismatched GET evidence, POST echo bypass denial, public room proof,
history, guest isolation and no replay after restart or room changes.
No real reservation, hold, payment or code is created for testing.
