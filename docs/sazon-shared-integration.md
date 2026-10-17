# Sazón shared preparation and durable phase groundwork

This development branch builds on source handoff #219 and corrected query #220.
It is not a production booking activation. Release215 remains the live baseline.
The corrected query is source-derived: no correct-flow availability or completed
supplier booking has been observed. The historical negative response belongs to
the earlier incorrect quantity query and is used only as a rejection replay.

`VELVET_SAZON_PREPARATION=enabled` opts into an operator-only `prepare` runtime
entry. The default is disabled. The public config hides this entry from guests;
the existing authenticated operator check protects every session operation.
Preparation has a hard action ceiling of search/select/review/refresh even if
an entry accidentally lists mutative actions. It always projects liveBooking,
canHold and canSubmit as false and result as null. It cannot grant a guest
session. Existing live and inspect modes retain their behavior.

The separate semantic view accepts image:null preparation snapshots, displays
menu quantity independently of guest count, unknown price, policy and guest
requirements as text, and labels selection/review as local only. No guest
contact fields, consent to book, cart, hold, checkout or payment buttons exist.
Guest external-booking presentation is unchanged; operators get an additional
preparation panel, not a replacement claimed as full booking.

The existing SQLite ledger gains exact TableCheck/Sazón/two-person phases
`cart_init`, `cart` and `cart_update`. Existing hold and booking keys retain their byte-level
hash inputs. Each phase has its own consumed send grant; key, session and review
rotation cannot re-arm it after restart. Cart phases never confirm a booking,
never store a cart reference/capability and never enter booking history. The
provider journal requires an explicit server venue `cartPreparation:true` opt-in.
No such journal or mutative action is wired into this preparation server entry.

Provider coordination uses reserveSubmission(intent) and recordResult(session)
with owner/provider/restaurant/session/mode/phase/reviewFingerprint and canonical
details.date/time/party. The phase fingerprint must cover all raw orders,
category, source policy and consent. Subsequent phases must also bind a digest
of the private cart ID/access token and exact guest/final review. Capabilities
remain private adapter memory; restart does not restore or query them. Future
cart creation, update and checkout each need a separate durable grant and
explicit appropriate consent, without retry after uncertainty.

Known unresolved source boundary: Experience mount calls cart/init before Book
now; the caller does not await its response. Its server effect and dependency
on later operations are not established. A separate fixture-only cart_init grant now models the known request behind explicit consent, followed by separately granted create/update/checkout and one own-code readback. This conservative consent-first sequence is not claimed to reproduce native mount ordering or prove init semantics. No live hydration or init dispatch is wired. Exact missing fields or semantics remain explicit. No real cart, contact,
checkout/status PUT, payment or capability reads are authorized for development.

Local checks cover runtime operator and action restrictions, forged capability
projection, UI rejection/text safety at390/1366, SQLite phase restart/replay and
no cart history/capability persistence. They are internal contract tests, not
provider confirmations. Exact integrated API/UI testing and independent shared
review are separate gates before accepting this branch.


## Integrated acceptance evidence

PR222/223 are integrated as offline source-contract code only, including the
single-encoding readback fix and synchronous journal-hook error fix. The latter
was found by the real SQLite integration test, rather than provider hook stubs.
The actual provider class now runs against the existing on-disk attempt ledger,
provider journal and booking register in three explicitly synthetic scenarios:
success, missing raw-readback proof and ambiguous checkout. All pass, including
persist-before-transport, no cart history/capability leakage, restart recovery
and consumed retry. The journal requires own_booking_raw_readback when configured;
the public proof allowlists that marker for this exact provider/restaurant.
These models do not establish provider response compatibility or a real booking.

Whole-app test handoff #224 covers the operator preparation API/UI at runtime
36adb466:57 API calls,390/1366, four policy fixtures, two historical rejection
replays and zero real provider calls or booking writes. It found a genuine card
layout overlap; CSS3a96ebe corrected inherited relative top offset and actual
pointer clicks passed afterward. Null DELETE does not falsely end the view.
Guest/member/owner/revision restrictions, forbidden mutations, corrected query,
restart and empty journal passed. FishCorner smoke at3a96ebe passed42 API calls,
two mock transports, zero real writes. Later provider changes remain fixture-only;
final relevant preparation regression is tracked separately.

Remaining activation limits: init server semantics/order dependency, actual raw
write/receipt representation and saved group quantity are unobserved. Requiring
complete write-response fields and unchanged update tokens is conservative
adapter policy, not a proven native invariant. Native restoration can replace
returned tokens; native UI normalizes group quantity. No such normalization is
used to manufacture verification. Production215 remains unchanged.
