# Pirouette dinner for two

Refs #129, source handoff PR191 a924626. Official source:
https://lesagitateurs.com/pirouette links rid363313. This restaurant is at
34 rue Bonaparte,06300 Nice, France. Existing catalog is already Nice/NCE;
legacy stable ID osm-MCO-pirouette is retained. Server history city is Nice.

Dinner189024/party2 only, explicit rooms52521 Salle principale or65674 Terasse
(the latter spelling is from source). Auto-confirmation true, is_auto_until null,
prepayment null, card askable true with min_guests exactly3 are required.
Changing those requirements blocks submission; no party/card/payment widening.
Optional gift-code field is untouched; strict payload rejects code fields.

The original guarded read-only search/select/fill/review reached19:00 room52521
on23October2026 and displayed Jusqu'à21:00. That inventory is transient.
The native seatingNotice is included in terms.version and re-read before
review/confirmation. Velvet renders it next to the room/selection summary.
Terms source https://bookings.zenchef.com/gtc?rid=363313&lang=fr.

An independent VELVET_ZENCHEF_PIROUETTE=live flag adds the venue to the existing
shared Zenchef runtime. Same-attempt own-booking GET uses server-fixed rid363313
and only UUID/ID from its own approved POST. Persisted ID/status/room/date/time/
party must match. POST echo cannot confirm; the journal separately requires
own_booking_readback. Unknown remains consumed with no booking replay.

No actual supplier reservation, hold, payment, code or UUID GET was created for
testing. Provider transport tests use local fixtures; real completion unobserved.
