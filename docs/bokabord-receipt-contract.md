# Bound Bokabord completion document — candidate integration

Refs #129. This module implements a reusable backend verification contract. It
does not activate any restaurant, create a booking, or claim a completed Noema
end-to-end run. Integration and release remain with the runtime owner.

## Evidence and limits (16 October 2026)

- Official `https://app.bokabord.se/production/app-widget.js?v=6.0.3`
  `confirmPageController` receives `saveBooking`, initializes its booking object,
  routes numeric status 0 to payment, and otherwise emits `reservationSuccess`
  before navigating to `/reservation/booking/?code=<response.short_code>&new=1`.
  The event or nonzero status is **not** sufficient confirmation evidence.
- The previously authorized Zink snapshot independently contains the visible
  document prefix `Tack för din bokning.` and
  `Du är nu klar och bekräftelse har skickats via epost.`, followed by venue,
  party/meal, and a separate `Bokningsreferens` / `# <id>` / `Gästinformation`
  section. Its reference, guest/selection data and image were checked privately.
  This supports a candidate shared document contract, not a universal provider
  guarantee. Historical navigation timings/HTTP exchange were not preserved.
- Noema's official `https://noemastockholm.se/en/` links to its registered hash.
  The public initial widget fetched today lists Lunch 35204, type "2", max 8,
  no card bullet or mandatory products for that meal. Its other meals are outside
  this candidate. No historical successful Noema booking was found in the bounded
  local search; prior reports explicitly stop at contact with `submitted:false`.

## Runtime contract

`createBokabordReceiptVerifier(policy)` exposes `approvalDigest` and `verify`.
Reserve the digest before dispatch using the immutable server-approved object.
The registered venue hash and exact intercepted request payload bind the venue;
the configured meal and completion document's venue name must also match.
No restaurant identity is inferred solely from a supplier numeric status.

After the existing authorized final submit, retain the intercepted response only
in its private server session. Capture `response.request()` method, URL and JSON
payload; HTTP success and response timestamp must come from that same response.
Do not pass client-provided observations. Track the subsequent successful main
frame GET document with its navigation timestamp, final URL and visible body
`innerText`. Only its exact response capability code and `new=1` URL are accepted;
the module never constructs/fetches a confirmation URL and rejects action params.
Capture must occur after response/navigation and within 90 seconds of dispatch.
Use actual server timestamps, not values from the receipt or guest.

Record `respondedAt` when the original save response becomes available, before
awaiting its JSON body. The opt-in native route records this when its single
`route.fetch` resolves, before fulfilling the browser; it is not the browser's
response-header event time. This preserves the response before immediate browser
navigation can evict its body. There are no redirects, retries or second booking
requests. Increment a server-owned navigation generation on every main-frame
navigation and attach `navigationId` to the successful document response. Capture
`documentUrl=location.href` and visible body text in ONE `page.evaluate`. Require
the same generation before and after that awaited evaluation and record it as
`documentNavigationId`. The verifier requires both positive generation IDs and
both URLs to match. If navigation occurs during capture, discard the observation;
never pair an old successful document response with a newer page's text. Clear
private observations on a new attempt and do not reuse an old generation.

The document must START with the observed complete prefix and configured venue,
then correct party. It must have exactly one matching reference section. Searching
for success words anywhere in comments, using hidden HTML, or trusting a
postMessage event is insufficient. The raw response must separately match all
approved selection/contact fields and have no unsupported requirements. Status 1
is only a conservative candidate gate; it never confirms without the independent
document. Other statuses, changed templates, languages or unsupported meals
remain unknown. Email delivery to the recipient's inbox is not claimed.
An observed `must_pay_directly` or `mandatory_products` requirement also remains
unknown even if the response has an empty product list and no card flag.

Map the resulting standard bound proof through the existing durable journal.
Do not overwrite an earlier unknown with confirmation until **both** observations
are present and validated. Missing/failed navigation remains unknown, with no
automatic resubmission. Never persist/return raw payloads, body text, capability
URLs or codes in public attempt records. Same-owner recovery and ordinary session
privacy/TTL checks remain mandatory upstream.

## Validation and activation boundary

Focused tests use synthetic contacts/reference/code and no network. They cover
positive combined evidence, false-positive text/events, bad/missing receipt,
wrong venue/reference, stale/navigation/URL binding, changed approval, special
requirements, and fixture/provider attempt separation. A synthetic provider-source
branch test is explicitly not a real supplier result.

The native capture/journal wiring is implemented behind
`VELVET_NOEMA_RECEIPT=enabled`. It observes the provider's navigation and validates
the atomically captured document against the original request and response.
The common contract can support this scoped verifier without requiring a prior
historical Noema booking. Actual app/API/adapter/journal integration acceptance
is still required before activation. Synthetic receipt tests do not establish
that a real Noema reservation has been completed; that remains a separate claim
requiring actual supplier evidence. No blind extension of the old Zink status
rule is made, and a missing or differently rendered receipt remains unknown.
