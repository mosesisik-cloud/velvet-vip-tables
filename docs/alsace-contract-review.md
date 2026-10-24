# L'Alsace — manual confirmation blocker

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main2300ab66a0dbe8ccdc07345f16860be976b84eedab9. No canonical catalog change or activation is proposed.

## Result

Correct identity and ordinary booking entry, but both observed meal services require manual confirmation: confirmation.is_auto=false and is_auto_until=null. Available slots do not satisfy the automatic-confirmed booking scope for two. Park without additional dates or form probes.

## Sources, 2026-10-18

Official https://www.restaurantalsace.com/ returned200; HTML SHA256 `353a4e4269965e2029866e0790586ffe11a5dfc31abb4088d6800f6b31596525`. Ordinary Réserver anchor is https://bookings.zenchef.com/results?rid=70231&lang=fr&withCloseButton=1 . Address39 avenue des Champs Elysées,75008Paris.

One readonly https://bookings.zenchef.com/results?rid=70231&lang=fr&day=2026-10-23&pax=2 returned200 without venue redirect, SHA256 `bd3310570e9346613c5448d4aca75ee962c1a35d4ea01f8e670fb6ae322eb26c`. Native state identifies70231,L'Alsace,39 Avenue des Champs Elysées,75008Paris,Europe/Paris; wish and query match day23October/party2/waitlistfalse. Room selection and mandatory room are false.

| Service | Confirmation | Available times for two | Charge/prepayment | Required offer | Cancellation |
| --- | --- | --- | --- | --- | --- |
|18208 Midi|false/untilnull|12:00–17:30 every15minutes|null/null|false|10800 seconds relative to shift|
|57091 Soir|false/untilnull|17:45–02:00+1 every15minutes|null/null|false|10800 seconds relative to shift|

The previously reviewed native automatic rule is is_auto OR pax<=is_auto_until; neither observed policy admits two. No new asset was fetched or claimed hash-matched here. No-card/no-prepayment does not resolve the manual-confirmation blocker. Takeaway/delivery/events are outside this review.

## Limits and next action

Only the official page and one native results document were read. No form/JavaScript execution, slot selection, contact/code submit, booking/hold/cart/payment/restaurant message or actual capability/receipt read. No bypass or repeated date query. No runtime edits or runtime tests. Captured identity/policy were parsed; git diff --check validates the docs-only handoff.

Await an explicitly assigned, source-backed automatic policy before considering activation; do not promote a request to confirmed or infer closure from this result.32d5 owns shared integration/release. No additional candidate started.
