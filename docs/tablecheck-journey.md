# Sazón / TableCheck booking journey

Tested from the deployed Velvet restaurant detail page for Sazón — Regent Bali Canggu. Scenario: 22 October 2026, two guests, 19:00, Dining Area, local Bali time (Asia/Makassar).

## What passed

- Velvet opens the original TableCheck form without a Velvet account.
- Welcome, guest count, date, time and service-area controls work. Real read-only provider queries returned Dining Area times from 18:00 to 20:00 in quarter-hour increments.
- After locally simulating cart creation/update, the original provider form reached optional experiences and guest review. First name, last name, email and phone are required. Synthetic test contact details stayed inside the intercepted test context.
- The actual restaurant cancellation-policy text is expanded before the final button, and its agreement checkbox is mandatory. Empty guest fields and an unchecked agreement display validation errors.
- The final `Confirm booking` action attempted `PUT /v2/booking/checkout/velvet-simulation-only`. The test blocked it before any provider submission. No booking confirmation was fabricated or claimed.

## Cancellation and card limitations

The actual provider's public server-rendered `booking_page.cancel_policy_translations` matches the text displayed in review. It says the table is held for 15 minutes after the reservation time, dining duration is 120 minutes for 2–7 guests or 150 minutes for 8+, and outdoor seating in bad weather is subject to availability. It also contains dress-code and larger-party information.

It **does not state a cancellation deadline or fee amount**. This must not be presented as free cancellation. Real card requirements and payment behavior remain unknown: the simulated cart's payment flags cannot establish them. Checkout, card guarantee, payment and successful confirmation require a provider test environment or a separately authorized real booking.

## Test boundary

`POST /v2/booking/calendar`, `/menu_items`, `/meals_v2`, and `/availability_v5/{grid,chain,dates}` were observed carrying shop/date/party/menu query fields and were individually permitted as read-only queries. All other mutations were blocked except local responses to `/cart/init`, `/cart` and the named fake-cart update. No real cart, temporary hold, reservation, email, card charge or payment was created.

Cart fixture shape was based on the public TableCheck frontend's response handling. The fixture is explicitly synthetic and screenshots are watermarked. It enables testing visible form behavior, not provider-side availability locking or payment validation.

## Mobile correction

At a 390px screen, card padding restricted the iframe to 300px. TableCheck's fixed-width email validation hint extended its document to 369px. The scoped mobile CSS gives only the TableCheck stage 8px screen margins (374px iframe). Real provider content then measured 374px viewport / 374px scroll width. The cancellation notice and the surrounding booking layout remain in place.

`node scripts/test-tablecheck-mobile.mjs` passes at 390px and 430px with a provider email-hint fixture. Narrower viewports are not certified by these checks.

## Reproduction

```powershell
$env:TABLECHECK_READONLY_TEST='1'
node scripts/test-tablecheck-journey.mjs
node scripts/test-tablecheck-mobile.mjs
```

The journey uses the above fixed October scenario; update dates for later audits. It runs against the public Velvet page, allows only inspected read queries, and injects the scoped mobile correction for verification before deployment. All cart state is simulated locally and final checkout is always blocked.

Evidence outside the repository: `outputs/tablecheck-journey-summary.json`, `outputs/tablecheck-review-desktop.png`, and `outputs/tablecheck-review-mobile.png`. The snapshots show simulated-cart review, not a real held or confirmed reservation.
