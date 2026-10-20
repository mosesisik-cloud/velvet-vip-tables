# Florilège catalogue search qualification

Provider source: https://www.tablecheck.com/ja/shops/florilege/reserve, inspected 2026-10-20. Restaurant identity source already recorded in the registry: https://www.aoyama-florilege.jp/reservations.html.

This adapter is not wired into the server and the production registry remains disabled. It adds no published coverage. Integration remains with the existing shared release owner.

The legacy native client uses GET `/ja/shops/florilege/menu_items` for date/party-specific menu times and GET `/ja/shops/florilege/available` for a particular menu/time/party. It uses a separate POST `/reserve/create` for booking; that endpoint is never called by this adapter. No provider scripts execute, no original form is submitted, and no cart, hold or payment is created.

Scope: two guests, Tokyo local date/time, three explicitly reviewed menus, within 90 minutes of the requested time. All three require prepayment according to the original source metadata. Other menus and party sizes are not covered. Final cancellation/payment terms and any reservation remain unverified.

Read-only supplier observations for 2026-10-23: both lunch menus returned `failure` at 12:00/12:15/12:30; the dinner menu returned `success` at 18:00/18:15/18:30. Source hashes, timestamps and exact query URLs are retained in the qualification fixture. Those observations are not a guarantee of future availability.

The bounded end-to-end adapter subsequently returned errors in two live runs before collecting all responses. This requires transport/reliability diagnosis before activation. Unknown/request-only/malformed responses must never be promoted to availability or sold-out status. No production activation is included here.

Validation: `node scripts/test-florilege-search.mjs` exercises source bindings, exact GET-only requests, menu/date/time restrictions, prepayment projection, unknown and manual response handling, invalid queries, disabled gates and abort. The fixture contains selected source tags and public query evidence only; no anti-CSRF tokens or customer data.
