# Issue 90: The Chairman evidence and access blocker

Agent: codex-worker-2-5351
Issue: https://github.com/mosesisik-cloud/velvet-vip-tables/issues/90
RestaurantId: `curated-HKG-the-chairman`
Restaurant and verified branch: The Chairman, 3rd Floor, The Wellington, 198 Wellington Street, Central, Hong Kong.
Work status: blocked for booking integration; evidence handoff ready for review.
Checked: 2026-10-16 (Europe/Stockholm).

## Identity and sources

The [official homepage](https://www.thechairmangroup.com/), [contact page](https://www.thechairmangroup.com/index.php?route=about/contactus) and [relocation notice](https://www.thechairmangroup.com/newlocation) identify this address. The relocation notice dates the move to September 30, 2022; do not use the former address. These full pages were available through the web reader, distinct from direct browser access. Current physical operation was not independently visited or confirmed by phone.

Exact name/ID search in `data/restaurants.json` found only `curated-HKG-the-chairman`. This was not an exhaustive fuzzy duplicate audit. Stable ID retained.

## Booking route

Category H: exact booking destination/provider unresolved. The [official announcement](https://www.thechairmangroup.com/importantannouncement), dated April 26, 2026, directs legitimate online reservations to the platform on its own website and warns about impersonating domains. Use only `www.thechairmangroup.com` as the verified official-site identity; do not substitute a similarly named domain.

The readable official pages did not expose the reservation-platform link. Homepage URL is an informational source, not a verified functional booking endpoint. No category A booking link, embedded form, observed availability, manual booking route or confirmed reservation is established.

The official contact page lists telephone, WhatsApp, email and an enquiry form. These are not evidence that bookings are accepted through those channels. A search-index version mentions online-only reservations, but that sentence was absent from the freshly opened text; no classification relies on the snippet alone.

English informational content observed. Booking-language options are unknown.

## Published terms

The [general terms](https://www.thechairmangroup.com/terms) say restaurant confirmation and any applicable deposit are required. Card information or a deposit may be requested. Cancellation/change requires 72 hours notice; shorter notice or no-show forfeits paid deposit. Deposit amount, actual card guarantee and transaction-specific conditions remain unknown because checkout was not inspected. The cancellation email in those terms must not be promoted as a verified new-booking email.

## Implementation

Only this Markdown report and `docs/booking-evidence/issue-90-the-chairman.json` are added. No application/provider mapping, canonical worklist, branding or release files changed. This per-issue fragment is for the assigned integrator; keep the route unresolved until a precise destination is verified.

Branch: `booking/90-chairman-codex-5351`. Commit and PR are recorded in the issue handoff.

## Tests and limitations

Direct Node GET to the official homepage returned HTTP 403. Live Edge/Playwright inspection at 390x900 and 1365x900 likewise returned HTTP 403 and a CloudFront blocked-request page, with no links. This demonstrates a limitation of this environment, not closure, no inventory, a universal mobile problem or a broken booking platform.

Service workers were disabled. The context allowed only GET/HEAD on the official hostname and blocked other hosts/methods. No controls clicked, guest data entered, messages sent, reservations/holds/payments created or access controls bypassed. No actual booking form, date/guest selection, language switch, embedded flow, fallback or confirmation tested. No successful restaurant-page visual QA can be claimed from error-page captures.

Local JSON validation checked both 403 observations and preserved unknown booking URL/provider and unverified manual route. `git diff --check` passed. Application regression tests are not applicable to evidence-only changes.

## Claim, publication and next step

Original claim comment 6204260529 matches authoritative commit `93ec0c05718b964fdd0cb3dc0bb026323fa348ec`. Coordinator confirmation: https://github.com/mosesisik-cloud/velvet-vip-tables/issues/90#issuecomment-6204367795 . Existing lock retained.

Not published. Coordinator should accept this blocker evidence and assign read-only verification from an ordinarily accessible environment with the same safety guards, obtaining the exact official reservation destination before provider mapping. No invented fallback is proposed.
