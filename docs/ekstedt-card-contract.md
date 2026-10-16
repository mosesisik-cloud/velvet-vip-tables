# Ekstedt mandatory card contract — source-only, activation blocked

Scope: `curated-STO-ekstedt`, hash `cf1ffc30f54f7f3b6158c4be497182ed`, Set Menu 448/type 3, exactly two guests. Reviewed 2026-10-16. No supplier booking, hold, contact, authentication-code, card, payment, or capability-URL request was made for this investigation.

## Evidence and native sequence

Saved initial widget HTML SHA256 `93055f99ecafe250f54859f61c1518c4d971cc89f95559905c0cc575c173df7d` declares `must_pay_directly: true`, credit-card confirmation, no mandatory products, `confirm_in_widget: false`, `_allow_temp: false`, and `canUseAuthFeature: false`. Feature-off contact Next can call completeBooking directly: it must be treated as a submission boundary. Zero average marketing price does not establish a free booking. Meal group metadata does not authorize a group flow.

Public client: <https://app.bokabord.se/production/app-widget.js?v=6.0.3>, SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. Line numbers refer to that captured version.

1. guestCtrl lines 2360–2369 and 2531–2540 submits `booking.save()`. Lines 5057 onward identify POST `/reservation/api/booking/saveBooking`. A separate temporary-booking function uses the same endpoint: it is outside scope. No request should be sent to discover the response.
2. The response booking is copied into the model (2569, 5363 onward). Numeric status 0 routes to payment; the other branch redirects to the short-code receipt (2627 onward). Earlier `reservationSuccess`/`Final-Confirmation` events are not independent proof. Status meanings after a card operation are not established by these branches.
3. bookingConfirmationCtrl (4485–4840) calls POST `/reservation/api/booking/paymentMeta` with `{booking: id, hash}`. Its `express` flag can enable saved-card reuse; that path is not reviewed for activation. The endpoint was not called.
4. Card confirmation calls POST `/reservation/api/booking/stripeCreateIntent` with `{booking: id, hash, invitation: active_invitee, giftcard}` (5428 onward). Normal guest flow excludes invitations and gift cards. When `requires_action` is true, `total > 0` selects Stripe `handleCardPayment`; otherwise the native client selects `handleCardSetup`. Our classifier requires a known numeric nonnegative total and a client secret before classifying either branch. Missing total is unknown, not setup.
5. Both native completion branches POST `/reservation/api/booking/stripeHandlePayment` with `{booking: id, hash, payment_intent_id: intent.id}` (5433–5440). The setup branch also uses the field named `payment_intent_id`. This names an observed implementation, not an instruction to submit it. The legacy `confirmPaymentWithCC` function is not proven active in this path.
6. The loose non-action branch redirects to the booking short-code page. Initial intent handling reads `result.data`, while recursive completion passes the HTTP result wrapper. Neither that redirect nor a 2xx, Stripe success, return parameter, or callback wrapper proves booking confirmation. `confirm_in_widget` selects routing only (3358 onward).

Stripe [SetupIntents](https://docs.stripe.com/payments/setup-intents) prepare a payment method for future use without creating a charge; [PaymentIntents](https://docs.stripe.com/payments/payment-intents) track payment authentication and payment state. Neither establishes the restaurant's reservation status. The client uses native Stripe Elements; Velvet must not collect raw card data.

## What is implemented

`api/bokabord-ekstedt-card-evidence.mjs` is a pure backend evidence classifier, disconnected from runtime activation. It recognizes only the exact scope and matching backend attempt/digest/booking identifiers, then reports payment/setup as **pending**. All completion observations remain **unknown** and `activationAllowed` is always false. It emits no secret, intent identifier, receipt URL or booking proof. Existing ordinary receipt verifiers and their mandatory-card rejection remain unchanged.

The helper is not an authorizer, durable journal, transaction capture mechanism, or booking verifier. The upstream trusted capture layer must establish original approval/contact/selection binding and reject group, product, invitation, temporary, gift-card and other unsupported flows. Caller-supplied matching identifiers alone do not establish that trust. Replaying an observation cannot confer permission or produce confirmation. No synthetic fixture represents an actual successful paid booking.

Validation: `node scripts/test-ekstedt-card-evidence.mjs` plus the existing `node scripts/test-bokabord-receipt-confirmation.mjs` regression suite.

## Exact missing contract and integration handoff

The public source does not establish which branch Ekstedt actually returns, the charge/guarantee amount and currency units, capture timing, cancellation deadline, no-show liability, or final server state. Initial HTML contains generic card wording; actual `require_noshow`/`no_show_text` and booking data are returned by the server. They must not be synthesized from marketing price, the boolean payment flag, or a generic Stripe example.

To unblock, obtain provider-authorized nonproduction access or a sanitized, authorized reference chain for this exact venue/meal/party: original save response and terms; paymentMeta and createIntent responses including amount/currency and setup-versus-payment meaning; authentication/error behavior; handlePayment response; and independently obtained final receipt with authoritative reservation state bound to the same booking. Provider documentation of those server-only contracts can substitute where explicit. Do not acquire this evidence by creating a production booking or payment.

Integration owner32d5 retains shared UI/server/release ownership. Once the missing contract exists, the existing flow needs server-provided terms and amount/currency shown before card consent, native Stripe challenge ownership, durable attempt phase/locking without persisted secrets, no automatic resubmission on timeout/redirect, and independent final booking proof. The current classifier supplies no permission to perform any of these writes. No new engine, general guard relaxation or additional restaurant is included. Stop here pending the concrete provider evidence/access; repeated public-source probes cannot supply it.
