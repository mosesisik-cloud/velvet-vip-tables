# Disfrutar booking evidence — Refs #57

Agent: `codex-20261016-01`
RestaurantId: `curated-BCN-disfrutar`
Restaurant and branch: Disfrutar, C. de Villarroel 163, 08036 Barcelona, Spain
Work status: ready for review (evidence handoff; application integration pending)
Checked: 2026-10-16, Europe/Stockholm

## Identity and route

The [official restaurant site](https://www.disfrutarbarcelona.com/?lang=en) identifies Disfrutar in Barcelona. Its booking-page HTML gives the street address above. A scan of every catalog record for `Disfrutar` or `Villarroel.*163` returns only the stable ID above; this does not exclude aliases lacking both strings. Compartir Barcelona and Compartir Cadaques are presented as other restaurants and must not be substituted.

The home booking link leads to [the official booking page](https://www.disfrutarbarcelona.com/bookings). Its HTML constructs a CoverManager iframe using exactly:

`https://www.covermanager.com/reservation/module_restaurant/resaurante-disfrutar/english`

Verified categories: **A**, official external booking destination, and **E**, explicitly advertised phone reservations at +34 933 486 896, Monday-Friday 10:30-22:00. The official page offers English and navigation to Catalan, Spanish and French; those alternate flows were not tested. Its calendar legend is not evidence of actual availability.

[Published reservation conditions](https://www.disfrutarbarcelona.com/terms-conditions-booking), sections 3, 3.1 and 7, describe reservations and a separate waiting list, card security, free cancellation up to 15 days beforehand and EUR 150/person for later cancellation or no-show. Dining payment is stated to occur on the reserved day. Checkout was not inspected.

## Implementation and ownership

Changed files:

- `docs/booking-evidence/issue-57-disfrutar.json`: restaurant-scoped evidence for consolidation.
- `docs/booking-evidence/issue-57-disfrutar.md`: findings, checks and handoff.
- `scripts/inspect-disfrutar-booking.mjs`: opt-in guarded initial-page inspection.

Branch: `booking/57-disfrutar-codex-20261016`. Commit and PR are recorded in the issue handoff.

Recommend the official `/bookings` page as the guest-facing destination because the restaurant expressly identifies its website as its official channel. The provider URL is provenance, not an automatically approved direct-link mapping. Existing CoverManager validation supports external links but not native embeds; the official restaurant domain needs an integrator-approved route through the existing application rules. No shared registry, canonical worklist, catalog, branding or application files changed. This fragment is not a competing worklist.

## Checks and limitations

- Read-only live HTTP retrieval: official home, booking page, terms and exact provider HTML were accessible. Booking-page source contains the exact CoverManager URL and address. Provider HTML contains party-size and lunch/dinner controls; that is source evidence only.
- Catalog scan: one matching stable ID, no detected name/address duplicate.
- Playwright/Edge against the real official booking page: 1365x900 and 390x844. Service workers and WebSockets blocked; only exact initial document URLs and restricted static assets permitted; all fetch/XHR, unreviewed navigations and non-GET requests blocked. No clicks, form input or selections.
- Both viewports rendered booking information, explicit phone fallback and the exact provider iframe shell with a waiting-list label. Mobile screenshot inspected: readable booking text, cookie overlay and incomplete provider content; some lower-page heading overflow. This is a constrained rendering, not a claim of normal end-to-end usability.
- The provider attempted `POST /reservation/ibox2/0`, which was blocked before transmission. Therefore **B is unverified**, not failed in the normal service. No category C availability, party/date/time result, completed reservation, waiting-list submission, card entry or checkout was tested. A waiting-list label alone does not establish that the restaurant is fully booked. A blocked request must not be interpreted as no tables.
- Exact source verification caught and corrected a transcription error before delivery: the official provider slug is `resaurante-disfrutar` (without the expected `t`). Preserve that observed spelling.
- Reproduction: `npm ci --ignore-scripts`, then `node scripts/inspect-disfrutar-booking.mjs` (requires Microsoft Edge). Outputs are local JSON and screenshots under `work/`. Static source downloads and screenshots are intentionally not committed.
- Local JSON parse, stable ID/category/source URL checks and `git diff --check` passed. No application regression suite needed for this evidence-only handoff; no application behavior is claimed as tested or changed.

## Handoff

Integration remains pending approval by booking coordinator `01a14080-83ed-7991-ac52-7f57761f13e7`: review the fragment, choose and validate the official-site route, then consolidate the canonical record. Claim remains held; only the coordinator may release or transfer it. Do not take another task until this handoff is accepted.

Publication: **not published**. No merge or deployment performed. The release owner handles any later production change.
