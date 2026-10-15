# Delta Restaurant — issue 54 evidence handoff

Agent: codex-worker-1-ac9f
Issue: https://github.com/mosesisik-cloud/velvet-vip-tables/issues/54
RestaurantId: curated-ATH-delta-restaurant
Status: ready for review (research); booking integration blocked pending provider verification.
Checked: 2026-10-16, Europe/Stockholm.
Claim comment: 6204096528. The authoritative claim commit matches this exact comment and agent. Retain the claim for coordinator review.

## Identity

The [official homepage](https://deltarestaurant.gr/) and [contact page](https://deltarestaurant.gr/portfolio/contact/) identify Delta in the SNFCC, fifth floor of the Greek National Opera building, Syggrou Avenue 364, 17674 Kalithea/Kallithea, Athens, Greece. The official site currently advertises operating hours and reservations; this supports an active advertised identity, not proof of physical operation on a particular date.

Catalog city is Athens Riviera; the verified physical location is Kallithea in the Athens area. Preserve the stable ID and leave geographic presentation to the coordinator. Searching data/restaurants.json for Delta and the address found only curated-ATH-delta-restaurant; no second matching catalog ID was found by this search. This is not an exhaustive fuzzy duplicate audit. Existing branding evidence agrees with the address.

## Booking route

Official entry URL: https://deltarestaurant.gr/portfolio/reservations/

Category A: official booking entry page verified. Category H: downstream provider route/functionality unresolved. Category D/E: the official page explicitly directs inquiries for groups exceeding 20 people to events@deltarestaurant.gr; that is a request route, not instant confirmation. Do not promote the general phone number to a verified telephone reservation channel.

Provider: Tock indicated by HTML markup, not a verified active integration. The source contains Tock_widget_container, data-tock-display-mode=Button, locale en-gb, and timezone Europe/Athens. No restaurant-specific Tock URL was identified in the inspected HTML. Do not invent a slug or activate a provider mapping from this evidence.

The site offers English and Greek entry pages. A checkbox gates the reservation control. The nearby Follow the Path button opens directions, not booking. No working embedded form (B), live availability (C), hold, transaction or reservation confirmation was observed. Date, party size and provider language behavior remain untested.

## Published conditions

The [reservation policy](https://deltarestaurant.gr/terms-of-use/) says online reservations require at least 24 hours' notice and a EUR 100 deposit per reservation, credited against dinner; confirmation depends on receiving an email. It describes cancellation before 18:00 three days prior, EUR 100 for later table cancellation, and EUR 240 per person for same-day cancellation or no-show. These are website statements checked on the date above, not verified checkout terms. Card-guarantee mechanics were not inspected. Guests must review the current policy themselves.

## Implementation and file ownership

Evidence-only PR; no runtime or shared registry changes. Files:
- docs/booking-evidence/issue-54-delta.md
- docs/booking-evidence/issue-54-delta-inspection.json

Branch: booking/54-delta-codex-worker-1-ac9f. Commit and PR are recorded in the GitHub issue handoff. The booking coordinator owns incorporation into data/restaurant-worklist.json and any runtime mapping.

## Checks and limitations

- Read official home, contact, booking and policy pages; inspected raw booking HTML without executing its scripts.
- Chromium static inspections at 1365x900 and 390x844 returned HTTP 200, one terms checkbox and one Tock container each; zero exploretock.com anchor links. Body width matched viewport width. Machine results are in the companion JSON.
- JavaScript was disabled, service workers blocked, and requests restricted to same-origin document/style/image/font GET/HEAD. No interaction was performed. This is a limited live static-render inspection, not a functional desktop/mobile booking test, full visual QA or availability check. Script-dependent controls cannot be judged from it.
- Raw source also contained obfuscated scripts referencing external blockchain RPC endpoints. These scripts were not executed or fetched separately; their purpose is unverified. This concrete source anomaly is an additional reason to require a reviewed, restricted inspection before enabling an automated journey. It does not prove closure or domain takeover.
- No dates, guest counts, payment details or personal data were entered; no reservation/hold/payment/message was created. No CAPTCHA was bypassed.
- No runtime regression suite was required for these documentation-only changes. JSON parsing and git diff --check validate the handoff files, not the restaurant service.

## Next step and publication

Booking coordinator: review this fragment, reconcile the geographic label, and assign a restricted inspection to resolve the exact current Tock destination and source anomaly before marking the integration ready. The verified official entry page is a lead, not evidence of a functioning end-to-end route. No direct provider URL is proposed.

Not published. No merge or deployment performed. Claim remains reserved until the coordinator accepts the handoff and handles final status. No next issue claimed.
