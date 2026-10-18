# Brasserie Lipp — manual confirmation for two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main22918cc863bf16d2f6663ce5a48b8ec7844852209dd. Integrator reserved curated-PAR-brasserie-lipp; no catalog or runtime activation is included.

## Outcome

Correct native identity established through the official HTTP redirect chain. Both observed ordinary services have confirmation.is_auto=false and is_auto_until=1. Party2 exceeds this threshold and is not supported for automatic confirmed booking. Available times must not be reported as completed bookings. Park without further date/form probes.

## Exact source chain, 2026-10-18

1. Official https://www.brasserielipp.fr/o/reservation/ returned200 and contains the ordinary individual-reservation iframe. HTML SHA256 `4ca43f52606c58e443d17ea6a953fe3681c41cced9eb5861b74fc88bac59143d`.
2. Its exact decoded iframe URL is https://www.brasserielipp.fr/reserver-une-table/?fthvcolor=ffffff&bghvcolor=313131&txtcolor=000000&rid=345953&lang=fr&pid=1001&type=web . A GET with redirects disabled returned301 and Location `https://bookings.zenchef.com/results?rid=345953&fullscreen&lang=fr&withCloseButton=1`. Body empty. Thus the native results path was observed, not constructed from the ID.
3. Used that observed Location with the existing provider-supported day/pax search parameters: https://bookings.zenchef.com/results?rid=345953&fullscreen=&lang=fr&withCloseButton=1&day=2026-10-23&pax=2 . Returned200 without redirect, SHA256 `4da0763f82bac1a592f385d1685531e8dd010ddcd593b8a03177448099bcb04f`.

Native state identifies restaurant345953, Brasserie Lipp,151 boulevard Saint-Germain,75006Paris, Europe/Paris, with matching day/party2/waitlistfalse and no mandatory room selection.

| Native service | Confirmation | Observed times for two | Card policy | Prepayment/offer | Cancellation |
| --- | --- | --- | --- | --- | --- |
|3554 Déjeuner|false/until1|12:00,12:30,13:00,14:00,14:30,15:00,15:30,16:00|web askabletrue,min6,20 per guest|null / not required|10800 seconds relative to booking|
|433186 Dîner|false/until1|17:30,18:00,18:30,21:30,22:00,22:30,23:00,23:30,00:00+1,00:30+1|web askabletrue,min6,20 per guest|null / not required|10800 seconds relative to shift|

The existing reviewed Zenchef native automatic rule is is_auto OR pax<=is_auto_until; this source has neither true nor a threshold admitting two. No new static bundle was fetched or asserted to hash-match in this negative review. A future implementation would need current matching code/form evidence as well as a source-backed eligible policy. Card threshold6 being above2 does not resolve manual confirmation.

## Boundaries and next action

Only official page, exact iframe redirect and one native results document were read. No JavaScript executed, no form/contact/code submit, slot action, hold/cart, booking, payment, restaurant message or capability/receipt read. No bypass, no second date, no party1 scope expansion. No runtime tests or code changes; parsed source identity/policy and git diff --check validate this documentation handoff.

Automatic-confirmed booking for two remains blocked pending an explicitly assigned, source-backed eligible policy.32d5 owns shared catalog/release. Do not copy other venues' notices, enable manual requests as confirmed, or repeatedly reprobe this unchanged result.
