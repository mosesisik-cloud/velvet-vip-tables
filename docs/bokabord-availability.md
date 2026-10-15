# Bokabord read-only availability adapter

`api/providers/bokabord-availability.mjs` searches the reviewed 22-restaurant Stockholm registry using the actual public widget in isolated Playwright contexts. It is a read-only availability adapter, not a reservation or payment adapter.

## Integration

```js
const adapter = new BokabordAvailability({ maxConcurrent: 2, maxQueued: 8, timeoutMs: 20000, queueTimeoutMs: 15000 });
const result = await adapter.searchVenue({ id: restaurantId }, { date, time, party });
// Application shutdown:
await adapter.close();
```

One shared browser is reused; each restaurant request has a separate context. Queue waiting is bounded to 15 seconds, followed by at most 20 seconds of active browser work. Both are configurable and the caller can enforce an overall city deadline. Passing `q.signal` cancels queued jobs and closes active contexts promptly; a browser that finishes launching after cancellation cannot create a new context. At most two contexts execute concurrently. Excess requests return error, without invented availability. Use bounded city workers and progressive results; do not promise that all 22 browser checks complete immediately. No availability cache is used. The existing `BookingAssetCache` stores only public, explicitly cacheable scripts, stylesheets and fonts. It rejects private/cookie responses, HTML and JSON. Actual widget back controls preserve the loaded page between meals; a full reload is a fallback only when the meal menu cannot be restored.

Restaurant targets come only from `api/bokabord-restaurants.json`, never caller-provided URLs. Canonical URLs must use the exact HTTPS Bokabord host, reservation path and matching reviewed hash.

## Safety and truthfulness

The adapter clicks only a meal, guest count and calendar date. It never clicks a time, enters contact details, makes a temporary hold, submits a reservation or payment. A route allowlist permits recognized read-only widget API calls and approved static resources; unknown APIs and mutation routes are blocked, including `saveBooking`.

Only visible `Boka` links in available time rows count as bookable. Waitlists, full rows and nominal provider times do not count. Results include only slots within 90 minutes of the requested time. Duplicate times are collapsed. The first meal with explicitly observed slots ends the search early and returns `partial: true` if other meals remain. A failure after checking some meals can also return the explicitly observed slots with `partial: true`; an incomplete check without slots returns an error, not “fully booked.”

The public widget's observed `getTimes` request includes a dynamic per-page field. The adapter lets the original widget generate requests; it does not extract or replay that field. Directly treating the response's `times` map as availability would be incorrect: an observed Zink response contained nine nominal times also marked full and shown as full in the UI.

Links return to the original booking widget. Date, guest count and final availability must be reconfirmed there; this adapter does not claim a selected slot is reserved.

## Validation

Run `node scripts/test-bokabord-availability.mjs` for deterministic bookability filtering, time window, duplicates, target validation, mutation denial, concurrency/queue bounds, deadline and context cleanup tests, active/queued AbortSignal cancellation and late-browser-start cancellation tests.

Opt-in live read-only checks:

```powershell
$env:BOKABORD_LIVE_READONLY='1'
$env:BOKABORD_DATE='2026-10-22'
$env:BOKABORD_IDS='curated-STO-zink-italian-cuisine,curated-STO-ciccios,curated-STO-animo,curated-STO-frantzen'
node scripts/test-bokabord-availability.mjs
```

Observed on 15 October 2026 for 22 October, two guests around 19:00: Zink seven bookable times, Ciccio’s seven, Animo five (partial meal coverage). These counts are transient observations, not cached inventory. The complete 22-restaurant read-only audit and four corrective rechecks produced 19 restaurants with observed available slots, Frantzén with no available slots for that search, and two incomplete/error checks (Sperling & Co and Ekstedt). Several available results cover only some meals and are marked partial. Those two errors are not reported as fully booked. No holds or bookings were created. Evidence is saved outside the repository in outputs/bokabord-availability-22-readonly.json; historical observations do not guarantee present availability.


## Narrow performance validation (wave 3)

Two sequential read-only Zink checks for 22 October 2026, party two, 19:00 ±90 minutes both returned seven actual slots and partial meal coverage. Local timings were 4.87 seconds cold and 3.46 seconds warm, with 17 public asset-cache hits on the second check. This is not a production latency guarantee; server CPU and simultaneous searches matter. Broad production revalidation is pending. Safety tests additionally verify HTML, JSON, cookie and private responses are not eligible for caching.

A second narrow scenario (Zink, same date and party, 07:00 ±90 minutes) scanned all five meals, returned unavailable with partial false, and used one main-document navigation in 8.79 seconds. This verified the actual widget back controls without repeated full reloads.
