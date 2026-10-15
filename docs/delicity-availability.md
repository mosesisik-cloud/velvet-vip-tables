# Read-only Delicity availability adapter

`api/providers/delicity-availability.mjs` exports `createDelicityAvailability({registry, fetcher, now, timeoutMs})`, returning an async `(row, query) => result` adapter compatible with AvailabilitySearch adapters. Root wiring example:

```js
import {createDelicityAvailability} from './providers/delicity-availability.mjs';
const adapters = {Delicity: createDelicityAvailability({registry})};
```

Row must include restaurantId `osm-MCO-sushi-arson`, exact URL `https://booking.delicity.com/sushi-arson`, provider Delicity, name Sushi Arson and city Nice. Registry must contain an own property for the same reviewed identity. No general provider host or establishment discovery is enabled. Note catalog ID prefix MCO is historical: this restaurant is in **Nice**, not Monaco. Root must preserve truthful location/filter semantics when wiring search.

Each search GETs public establishment metadata and validates establishment337, sushi-arson slug, Nice and the verified nonarchived zone before GET availability. Query uses date, guests and exact zone UUID. Both calls share a deadline (10s default, max15s), caller abort, and redirect:error. No POST, PATCH, cart/session creation, contact, hold or reservation code exists here. No availability cache.

Slots require available===true, matching provider-local ISO date, matching hour, and requested time within inclusive ±90 minutes. A positive seats count alone is never enough. Observed response does not echo guest count; party is scoped by the exact outgoing GET and live venue limits. If a date/guests echo appears and disagrees, response errors. Guest range outside1–4 is unsupported, not unavailable. Invalid queries, changed identity, malformed response or network errors return error. Verified empty availability returns unavailable.

Returned slot bookingUrl uses the provider's observed seats/when query handling. Provider locally preselects a schedule; opening the link is not a booking confirmation. Initial Continue on the original form creates booking state before guest contact, as documented in delicity-journey.md.

Policy fields are deliberately unknown: `requiresCard:null`, `requiresPrepayment:null`, `paymentRequirement:'not_specified'`, `cancellationPolicyStatus:'unknown'`. Do not translate null into free/no-card/no-fee or invent a deadline. Full guest/confirmation journey remains unverified.

Validation: `node scripts/test-delicity-availability.mjs` passes registry/URL/inherited-key guards, venue mismatch, date cross-contamination, time bounds, false available flags despite seats20, duplicate times, guest scope, malformed data, errors and caller abort. `--live` opts into two public GETs only. Live check2026-10-15T21:46Z returned available with18:30–20:30 for requested19:00 on17October, party2. No holds or bookings created.
