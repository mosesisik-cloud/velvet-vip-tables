# Ardent Paris — lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Own provider/test/fixture/handoff only, based on public273 `925fe69059ad6d39e71b5ece44fb43d8831763f5`. Integrator32d5 supplies identity `83200ef99e018295c1f2f1106892aabd7870ee42`: `curated-PAR-ardent` / `ZENCHEF_ARDENT` / `VELVET_ZENCHEF_ARDENT`. Shared app/server/integration/release remain his responsibility.

## Own evidence — 2026-10-20

ARDENT,40 rue Richer,75009Paris,+33147703512, independently verified against https://www.restaurant-ardentparis.com/ and both supplier responses. Normalized identity-field scan on exact public273 found zero matches among828catalog/184registry entries for name/address/local and international phone/domain/rid. Ardent is distinct from Office.

Own homepage200 SHA256 `2afeafebf7579fc104fbc03d66497e92bbc67c1cbe5e9d0a23befe37fc598d3b`. Config data-restaurant358338/data-langfr/Zenchef SDK. Its actual ReserveAction `https://www.restaurant-ardentparis.com/reserver-une-table/?rid=358338&lang=fr` returned301 to `https://bookings.zenchef.com/results?rid=358338&fullscreen&lang=fr&withCloseButton=1`. No SDK URL was guessed or inherited from Office.

One results GET added `day=2026-10-23&pax=2`,200/no redirect, SHA256 `8af32a1554fd3eaa60b1f6cf7d5a887005ffa6f2e7bb7d15fed7896a1d8e7916`. One conditional empty form GET used the same query plus `slot=12%3A00`,200/no redirect, SHA256 `8ca3328d0ef216c5a1632fb8a7cd1b127034c1cbb401a311f7232f5214ce1d1d`. Full bytes/state/metadata remain at `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/ardent-paris/`.

Exact query fullscreen is an empty string, native isFullscreenfalse, langfr/withCloseButton1, absent pid/sdk/showCollapsed/iframePosition. State partner_id absent; the existing French native payload uses its default string1001, without adding a query partner. FR state/customer language, EUR, updatefalse.

## Contract

Own lunch82526 exact `Midi`, exactly two, automatictrue/untilnull, charge_paramnull/prepayment_paramnull, offerrequiredfalse/fromnull, cancellation10800 seconds relative to shift, shiftcommentnull. Eleven quarter-hour candidates12:00–14:30; shift and12:00 slot unclosed/nonfull/windowvalid when observed. Candidates are not held or guaranteed later. Dinner82527Soir excluded.

Six standard required fields, customFields[]/V2[], raw and selected offers[], no mandatory/selected room. Preserve raw room35359Salle principale without selecting it. No menu or seating duration inferred from homepage prices or capacity.turn_times.

Full raw French restaurant notice is preserved exactly in policy/fixture and returned as `terms.restaurantNotice`:

```html
Bienvenue au restaurant Ardent !
<br><br/>
Toute l'équipe est ravie de vous accueillir !
<br><br/>
Si nous sommes complets sur un service ou un créneau, vous pouvez réserver dans les autres restaurants du groupe : Bien élevé et l'Office !
<br><br/>
À très bientôt!
```

Shared Velvet must display the entire notice before consent. Bien élevé and Office remain other restaurants, never automatic fallbacks. No Office25€ or terrace terms, no lunch shiftNotice or seatingNotice invented.

Named guards bind policy, identity and exact query at results/form/fresh checks. Full schema/EULA/raw notice/chosen shift fingerprint is rechecked before approval and durable send grant. Existing owner/revision/TTL, explicit consent, durable sendAllowed/attempt binding, one POST/no retry and independent own-booking readback remain; POST echo alone never confirms and unknown locks.

## Validation and gates

Focused4/4PASS: ten fully intercepted synthetic browser scenarios plus three pure tests for eleven slots, dinner rejection, null-card policy, exact typed query, schema/notice freshness, French payload and rejection of room/menu/comment additions. Bounded Office browser+three pure and Batistou three pure PASS7/7. Syntax and diff checks PASS.

No new provider requests during implementation, native replay, real reservation/hold/payment/message or capability/receipt read. No shared edits/merge/deploy. Independent review, actual Velvet UI/API/SQLite/backend-Playwright QA and32d5 release are required before activation. These local synthetic tests do not prove native rendering or a real supplier confirmation. Lava remains untouched.

ce5c's separate native handoff:12-file manifest `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-10/work/ardent-native-manifest.json` SHA256 `cb246708dcc6dc14c086bee192ce0dba1aedecfa5fc7cac8fce95f58eb4afc58`; reused-assets manifest `9e387863b6394a8a787f646ac1e231a8dbb59b5ace99e6102f8795c777f7df94`. Reports both390/1366 screenshots visually checked, unchanged original form/query, Contact directly/zero launcher, unique unchecked French EULA with ownhref `/gtc?rid=358338&lang=fr`. EULA is below initial mobile viewport, in desktop viewport. Empty fields/optional comment/voucher and unchecked optins. **Full restaurant notice is absent from Contact DOM/images**, so Velvet must project it; shiftcomment remains null. No selected room/offer or card. Zero new assets/results/form GETs, zero remote rendering requests, two automatic quotation-preview POSTs aborted before transport, zero page errors. This worker did not replay native; handoff is not integrated app QA or real confirmation.
