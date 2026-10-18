# L’Atlas rue de Buci — parked preview evidence

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Master-assigned sole candidate. Base main264 a8d5e7dc39aecfdb9345af3d1609ed60e6d37925. Identity-only integration e13b4124e1c950377adaeedb38f8425a0d121e39 belongs to32d5. Canonical curated-PAR-latlas-buci; reserved ZENCHEF_LATLASBUCI / VELVET_ZENCHEF_LATLASBUCI remain unimplemented/inactive. Not Atlas on Boulevard Saint-Germain.

## Exact read-only observation, 2026-10-18

Official https://www.latlas-paris.com/reserver local C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/latlas-buci-official-20261018.html hash verified SHA256 b82072637b3ca4d6df9df0308791fa50fe6031df2d5f4f9e4307844e04bee123. Actual iframe has SDK preview parameter. Single GET, all query parameters preserved:
https://bookings.zenchef.com/results?sdk=1&withCloseButton=0&rid=366341&showCollapsed=0&isPreview=true

HTTP200, no redirect, page /results, query unchanged. Raw SHA256 e7415b5f9f9270a89ae36f4affbd21a827c89398dd18fee4d880d4695c16ef9a. Local raw work/latlas-buci-results.html; parsed work/latlas-buci-next.json and work/latlas-buci-state.json, not committed in bulk. Native L'ATLAS - PARIS / 11 Rue de Buci / 75006 / website https://www.latlas-paris.com/ matches own identity. isDisabled=false, isTestRestaurant=false. Those flags do not prove production transaction semantics.

No date or party was added to the official URL. Native default wish day2026-10-18/pax2, selected offers[], room_idnull; hasRoomSelection=false/isRoomMandatory=false. Own listed shifts: breakfast181015 Petit Déjeuner auto true/untilnull; lunch181028 Déjeuner, late lunch181032 Déjeuner tardif, dinner181033 Dîner all auto false/untilnull. Shift charge/prepayment null; cancellation10800 seconds SHIFT; is_offer_required=false. Service configuration is not a confirmed booking, nor a claim of current available slots. No ordinary confirmed two-person lunch/dinner contract is established.

## Preview classification and missing evidence

Own page references existing cached _app-30bffcb9f4c3b7b2.js. Local bytes SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd. Its sole isPreview occurrence at JavaScript UTF16 offset128550 is in route handling:
if(!w.state.restaurantId||w.state.isDisabled&&!(null==c?void 0:c.isPreview))return[2,"/unavailable"];

This proves a frontend effect: a truthy preview parameter bypasses the disabled-widget route condition. It does not establish whether bookings made through preview are ordinary production bookings, simulated, or otherwise treated differently server-side. With current isDisabled=false the guard would not reject either way, but that is not evidence authorizing removal of preview. No isPreview string in the existing matching-reference results/3040/1698/1175/317/234 chunks; absence is not proof of server semantics. No assets fetched or executed; no remote hash revalidation claimed.

Decision: PARK, no provider implementation or form GET. Missing: authoritative evidence that this exact official preview route supports ordinary production booking safely, plus an approved own ordinary service contract. A non-preview route must not be invented by removing parameters. Do not infer restaurant closure or disabled booking from this uncertainty. Breakfast configuration does not resolve preview semantics; no alternate service probing.

Preliminary classification sent to master and32d5 before this evidence-only delivery. No contacts, holds, POST, submit, payments, restaurant messages, receipt/capability reads, alternate dates/pax/hosts/URLs, or browser actions. No real supplier confirmation. Shared catalog/release ownership remains32d5; no self-merge/deploy. No executable changes: validation limited to raw/source hashes, exact query/identity extraction and diff check.
