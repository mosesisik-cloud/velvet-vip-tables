# Ciccio's Dining Room — scoped receipt policy

Refs #129. `curated-STO-ciccios`; integration/release owner 32d5.

## Verified source and flow, 16 October 2026

Official `https://www.ciccios.se/` identifies Nybrogatan 21, Stockholm. Its
booking link redirects from Waiteraid to Bokabord with the same registry hash
`6efc74a27b57165fbfb16acbebf7d248`. A public widget GET returned HTTP200 and
`restaurant_name` exactly `Ciccio's` (ASCII apostrophe, unlike registry display).
Snapshot SHA256: `3ca90bc102bce01eadaffb161c2a03859b40b9ceea00420962242d0f3113fb24`.

Dining Room is meal2379/type3, started=true, must_pay_directly=false,
mandatory_products=false, bullets={}. Settings max_people=7, max_seating=8,
linked_meals=[], custom_request=false, group_bookings=false, skip_general=false.
The existing provider amount selector permits normal sizes through7. The new
policy limits its approved party to1–7; the actual observed search used2.
Bar meal56067/type0 is explicitly excluded. Numeric restaurant `restid` was not
exposed in initial HTML or the inspected Booking model; none is invented. Venue
binding uses the established registry hash, exact meal and supplier name, actual
intercepted request, approval digest and completion document contract.

A guarded original-provider Chromium inspection at 2026-10-16T02:19:09.691Z
selected Dining Room, 2 guests, 22 October2026. It observed 12 selectable times,
including19:00, then reached contact, the visible `FORTSÄTT UTAN KONTO` choice,
and `Kontrollera din bokning` with a visible final submit button. The final button
was NOT clicked. This proves the observed route to review, not a completed booking.

The probe reused the existing availability request guard: only its known read
endpoints/static requests were allowed; other requests and WebSockets were blocked.
POST addContactStats and sendAuthCode were aborted. No saveBooking/hold request
was observed, no email code was sent, and no reservation/payment was created.
Contact values were synthetic. An initial probe stopped before slot selection
because a selector matched both booking and hidden waitlist links; the corrected
probe selected only the visible exact `Boka` link and completed to review.
Times are transient, not promised inventory.

## Minimal integration delta

`CICCIOS_DINING_RECEIPT_POLICY` is a new export in the existing receipt verifier.
The existing factory gains optional maxParty (default8 preserves Noema). No new
engine, transport, registry row or positive status rule is added. Its focused
fixture covers exact provider name, existing combined proof, Bar exclusion and
the party limit. All actual save/receipt proof and journal protections remain.

32d5 should add this exported policy to the existing operator-controlled receipt
policy selection and extend the already-working native guest-to-review bridge to
this exact venue/meal. Do not enable email writes, infer success from status1, or
enable Bar/special meals. Ce5c can reuse the existing real app/API/adapter/journal
harness with the Ciccio's policy and guest-continuation phase. Final activation
requires those integration checks; no new live supplier booking is claimed here.

## Runtime integration

The server selects this policy only when `VELVET_CICCIOS_RECEIPT=enabled`.
This flag is independent of `VELVET_NOEMA_RECEIPT`; both default off unless
explicitly enabled by the operator. The generic native guest-to-review bridge,
actual-response capture and SQLite journal are unchanged. No Bar confirmation
policy is added. Noema retains its previous party ceiling of8.

Candidate8fe55e111eb71008c855eae22a2ba5b64be0b686 passed13 focused receipt and
journal tests. Independent narrow review found no identity, default-off or
Noema-preservation issues. Whole-chain validation is required before activation.

Whole-chain validation passed on runtime8fe55e111eb71008c855eae22a2ba5b64be0b686
with the committed existing harness (`--ciccios`, test source05b5644):84 actual
local API calls,4 backend restarts,3 simulated supplier POSTs,0 real supplier
requests. It traverses the explicit guest choice, requires fresh review consent,
permits one double-click attempt, rejects wrong-restaurant receipts, preserves
owner isolation and restart replay guards, and keeps a successful POST unknown
until the original main-frame completion document arrives. Missing receipts
cause no constructed GET or retry. The static exact-name receipt confirms and
survives restart. Ciccios was enabled independently with Noema disabled.
No real reservation, hold, email code or payment was created.
