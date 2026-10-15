# Issue 53: Matsuhisa Aspen booking evidence

Agent: codex-worker-2-5351 (original claim codex-01)
Issue: https://github.com/mosesisik-cloud/velvet-vip-tables/issues/53
RestaurantId: `curated-ASP-matsuhisa-aspen`
Restaurant and branch: Matsuhisa Aspen, 303 E. Main Street, Aspen, CO 81611, USA
Work status: ready for review (evidence handoff; application integration pending)
Checked: 2026-10-16, Europe/Stockholm

## Identity

The official [Aspen about page](https://www.matsuhisarestaurants.com/aspen/about/) identifies the Aspen branch. Its navigation leads to the [reservation page](https://www.matsuhisarestaurants.com/reservation-2/). The [contact page](https://www.matsuhisarestaurants.com/contact/) supplies the street address. Other branch addresses appear in shared footers: do not substitute Denver or Vail. Catalog name/address search found this Aspen ID and a separate Cala di Volpe branch; no second Aspen entry found, but this was not an exhaustive fuzzy duplicate audit.

## Booking route

- Category E: verified manual phone booking, +1 970 544 6628. The reservation page explicitly directs guests to call for reservations. Observed CTA href `tel:19705446628`; proposed normalized href `tel:+19705446628`.
- Primary evidence URL: https://www.matsuhisarestaurants.com/reservation-2/ . The page states a 30-day downstairs reservation window; this does not establish availability.
- Category D, separate group route: the official page directs parties of 15 or more to https://matsuhisa.tripleseat.com/party_request/20050 . Only the outbound link was verified; the destination was not loaded or submitted. It is an event inquiry, not instant booking.
- An OpenTable loader was present in source with `rid=6946`. It was blocked by the inspection allowlist. Its branch binding, current functionality, and reservation URL remain unverified. Do not infer that online booking is unavailable, and do not install this provider ID from source presence alone.
- No original embedded form, actual availability or confirmed reservation verified. English observed; other languages, cancellation terms, card guarantee and prepayment remain unknown.

## Conflicting official content

The reservation page has duplicated/legacy hours and upstairs reopening wording. The dated contact page describes an upstairs off-season closure from October 6 through December 10, 2026, with a Monday exception, while downstairs remains described as operating. Do not classify the whole restaurant as closed or synthesize a definitive schedule. Recheck the dated official source before showing upstairs hours.

## Implementation and ownership

Only `docs/booking-evidence/issue-53-matsuhisa-aspen.md` and the adjacent JSON fragment are changed. This is scoped evidence for the canonical worklist owner, not a competing worklist. No application, shared registry, canonical worklist, branding or release files changed.

The existing `js/restaurant-contact.js` architecture is a candidate for the integrator. Its current panel hardcodes email copy and `manual_email`; a phone record must not simply be inserted without phone-specific status/copy and relevant tests. Shared-file implementation is left to the assigned integrator.

Branch: `booking/53-matsuhisa-aspen-codex-5351`. The PR and issue report carry the commit SHA.

## Tests and limitations

Live Edge/Playwright inspection of the reservation and contact pages at 390x900 and 1365x900 returned HTTP 200 in all four checks. Rendered text identified Aspen and its phone number; both reservation renders explicitly directed phone booking. JSON contains compact checks and blocked request metadata. No screenshot-based visual QA, telephone call, availability query or production app test performed.

The context disabled service workers and allowed only GET/HEAD to `www.matsuhisarestaurants.com`; all other hosts/methods were blocked. No clicks, form entries, reservations, holds, payments or messages were made. Blocked OpenTable and accessibility resources limit conclusions about the complete original page. Blocked-request arrays are cumulative within each viewport context.

Local validation: JSON parse and four expected successful evidence checks; `git diff --check`. Runtime regression tests are not applicable to this evidence-only change.

## Claim provenance

Original comment: 6204086283. Authoritative claim commit: `903043223756feaecd875475a456d9a6d1e031a8`; its `comment` field matches this chat's claim exactly. Chat: `01a141cc-5351-7e71-9936-986c3650579b`. Clarification comment records the unique replacement agent ID. The lock is retained for coordinator review.

## Publication and next step

Not published. Booking coordinator reviews and consolidates this evidence, then assigns the shared manual-phone implementation and optionally verifies the OpenTable candidate independently. No further issue will be claimed before accepted handoff.
