# FOISON — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; Refs #129. Base public301. Master assigned FOISON;32d5 deduplicated/reserved curated-BOD-foison, ZENCHEF_FOISON, VELVET_ZENCHEF_FOISON. Four provider/test/fixture/docs files only; shared integration/release remain with32d5.

## Own identity and entry

Own https://foison.fr/ returned200 at2026-10-24T11:57:36.333Z,65441bytes,SHA256 7b7ca2246d8bd249f41fceb1deac2a1db9e2a0db05e6bb03ee7d3bb1eab57d41. Own identity FOISON–Buffet Canaille,53rueLafaurie deMonbadon,33000Bordeaux,+33556380484. Provider uses53 Rue Lafaurie de Monbadon with a trailing space; exact metadata retained.

Own JSON-LD acceptsReservations explicitly names https://bookings.zenchef.com/results?rid=372834&pid=1001. The page-referenced own client https://foison.fr/assets/index-ZGkTXl2l.js returned200 at11:57:44.884Z,715137bytes,SHA256 36f02bc32381c8c78e0e687ca211623472652295614545a8d41e71d9b20b6dd1. Its zenchefUrl equals that link and its reservation modal assigns it to iframe.src. This is the site's actual booking route, not a guessed rid. Separate Stripe gift shop excluded and not accessed.

One27October2026/pax2 results GET returned200 at11:57:48.700Z,152933bytes,SHA256 4e46f99bbe594db903eec672f03e1d0b09235049240888a34e3df57df1283a9d. One12:00emptyform GET returned200 at11:57:52.124Z,153799bytes,SHA256 fe0e4cc87d250393299aa5e09c02094cead367f8d402e1a7b6eed562613f4dcb. Exact sources and safe full state in scripts/fixtures/foison-source.json; raw files/native evidence under workspace evidence/foison.

## Own bound scope

Exactly two guests,Monday–Friday,lunch262845 DÉJEUNER,seven normal observed slots12:00–13:30 every15minutes. Dinner267599 and weekends excluded. Confirmationfalse/until6 qualifies two automatically. Charge/prepaymentnull,cancellation10800seconds relative to shift.

Opening2026-08-28 13:00:00 is pinned exactly for shift/allslots. Each slot closes at its own start; shift closes13:30. Only verified closing-date prefixes normalize; no rolling opening inferred. Full shift and all seven slot policies fingerprinted. Historical availability is not a promise of current stock.

No room selection or mandatory room,wish.room_id=null. Three room definitions81156Salle Bar,100187Salle Cave,100191Salle buffet retained without room promises. Offers/customfields empty,voucherParam absent,no gift input in originalform. Ownpartner1001 retained. Full French restaurant welcome/group-above10contact notice, including raw HTML and whitespace, preserved before consent. Lunch/daycommentsnull. No sitting-end label in original form; no duration invented from internal turn-times.

Own query/party/shift/time restrictions, metadata and policy changes fail closed at preparation/review/send. Durable attempt plus independent receipt required for confirmation; submission response alone remainsunknown.

## Verification and limits

node --test scripts/test-zenchef-foison.mjs:5/5PASS with8synthetic browser scenarios. These cover independent confirmation, gift metadata before review/send, policy drift before send, wrong shift grant, denied journal, wrong/gift receipts and duplicate prevention. Other assertions cover own address/query/party/time, room/card/notice/cancellation/capacity/opening/cutoff changes and future per-slot expiration.

Original unmodified b59e3e3c70 replay390/1366PASS,all27exact client references reused byURL/hash. Mobile image inspected. Actual Velvet adapter reaches original empty contact and passes native validation with fullnotice. All replay requests locally fulfilled or aborted. No real contact data filled, consent, reservation, hold, payment, supplierPOST, restaurant message,OTP or bypass. Actual supplier-confirmed end-to-end booking remains unverified.
