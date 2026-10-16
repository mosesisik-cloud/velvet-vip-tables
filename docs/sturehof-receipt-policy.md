# Sturehof Lunch — narrow integration handoff

Refs #129. Base main c35710f (release200). This is a policy candidate;
32d5 owns runtime activation, server/UI, integration and release.

## Source and scope

Checked 16 October 2026. https://sturehof.com/ and
https://sturehof.com/bokabord/ link to Waiteraid with hash
`07415d5b4d24177e713964f3bc75eeaf`, redirecting to Bokabord with the same hash.
Existing registry ID is `curated-STO-sturehof`; exact provider name is `Sturehof`.
Initial canonical widget HTML SHA256:
`bb1d7ccdc757b51b38d0aff47d6391d2f8132ee7fa4c3665cb0da0e1173215df`.

Lunch3913/type2 has min_amount1/max_amount10, must_pay_directly=false,
mandatory_products=false and bullets={}. Global max_people80/max_seating81
includes other meals and is NOT the ordinary Lunch limit. Initial Velvet policy
is deliberately capped at two guests; actual read-only inspection used party2.
Do not expand this to the provider's ten-person limit through this handoff.
Excluded: Middag3912/type3, Matbar34881/type0, private salons27297/type0.
The salons have min_amount10/max_amount45 and must_pay_directly=true.

Meal metadata group_booking=true is not an actual group reservation. Settings
group_bookings=false; common Booking.groupEnabled5288 requires settings exactly
'Y' plus a nonempty group configuration. Actual Lunch model groupEnabled() was
false and booking.group_booking absent. Preserve rejection of an actual
receipt booking.group_booking=true or parent_order. Do not weaken the verifier.
Numeric restid was not exposed and is not invented.

## Actual guarded inspection

At 2026-10-16T03:17:05.010Z the original provider reached contact for Lunch,
two guests, 22 October 2026 at13:30. Twenty-one selectable times were observed
from11:30 to16:45; availability is transient. canUseAuthFeature=false,
contact Next visible, provider review absent. The common app-widget6.0.3
guestCtrl.next2368–2369 calls completeBooking directly when the feature is off;
completeBooking invokes booking.save2540. Next is therefore the supplier's final
action and was NOT clicked. No account/code or fake provider review step.

The exact release200 canonical mirror and its existing readRicheContactPhone
helper worked without adapter changes: bookingDetails read canonical synthetic
phone plus country metadata, while provider Booking.phone remained empty and
unchanged. Three nativeReviewBinding reads spanning snapshot/settle matched;
locally seeded native review survived snapshot with review=true and the same
token. This checks contact reads/binding/retention, not final dispatch. No manual
phone projection or provider model edits were used. handoffReason was null.

Existing availability network allowlist guarded the browser; unknown requests,
contact-stat/tracking POSTs and WebSockets were blocked. Zero supplier writes,
reservations, holds, email codes, payments or final clicks. Probe and sanitized
evidence remain in a199 checkout work/inspect-sturehof-binding.mjs and
work/sturehof-binding-evidence.json. No historical Sturehof receipt is required
or claimed; positive receipt coverage is explicitly synthetic.

## Minimal integration

Add STUREHOF_LUNCH_RECEIPT_POLICY to the existing contactFinalPolicies path under
its own narrow opt-in flag. Reuse Riches native review, fresh final consent,
immutable approval/token, raw/ISO/dial/canonical binding, durable pre-click
reservation and exact single approved POST. Retain receipt+document verification
and unknown/replay locks. No new engine or shared-file edits in this change.

The focused fixture verifies exact identity/meal, two-person cap, genuine
group-booking rejection, newly required payment rejection and missing-document
rejection while permitting the source's benign meal group metadata. Before
release, run the existing full app harness with Sturehof policy and contact-final
fixture; assert review performs no save, fresh consent sends one simulated save,
and stale/changed/replayed approvals cannot send. 32d5 integrates after the
already queued Fish/Pesquiere work. No public activation is claimed here.

## Integrated validation

Runtime3dd5254 adds the policy independently to both existing contact-final and
receipt configurations. No new adapter/phone/review/journal behavior.15 focused
tests and narrow flag/policy preservation review passed. The existing actual
app/API/adapter/SQLite harness --sturehof passed120 API calls,4 restarts and3
simulated supplier POSTs with0 real supplier requests (test c79ab25).
It enables only Sturehof while Riche is disabled, verifies Next-only phone copy
and unmodified model during review, requires fresh consent, blocks stale/edited
approvals and changed terms URLs before reserve/click, handles double-click as
one attempt, and rejects missing/wrong receipts. Matching original receipt
navigation confirms and survives restart; owner isolation and replay locks hold.
No actual reservation, hold, code or payment was made.
