# L'office Paris — lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Provider/test/fixture/handoff only, based on public272 `fb483bcc43b883de402dc8e9a1f54e7db220f60f`. Integrator32d5 supplied identity `0ef99eec831ffd8d6c246c469aadff2dfd62287b`: `curated-PAR-office-paris` / `ZENCHEF_OFFICEPARIS` / `VELVET_ZENCHEF_OFFICEPARIS`. Shared integration, activation and publication belong to32d5.

## Own sources and ordinary route — 2026-10-20

L'office,3 RUE RICHER,75009 Paris,+33147706731. Own https://www.office-resto.com/ agrees with both supplier responses. Master's saved homepage SHA256 `84ddeb86a8410750b55839bde5fe32d2101a6267b3370f17679fc649b9e078c5` independently checked. Homepage config has restaurant350113/langfr and Zenchef SDK, but this qualification followed its explicit ReserveAction URL rather than guessing an SDK URL.

GET `https://www.office-resto.com/reserver-une-table/?rid=350113&lang=fr` returned301 with empty body and Location `https://bookings.zenchef.com/results?rid=350113&fullscreen&lang=fr&withCloseButton=1`.

One results GET added `day=2026-10-23&pax=2`:200/no redirect, SHA256 `2567e195a1ac877c8688c912f7a9f711f245e0a73dcbf15c3a986967dfc3ecf8`.

One conditional empty form GET used the same query and `slot=12%3A00`:200/no redirect, SHA256 `bf77624e780ccc0ef69c2dba1941d3cadcc712ddc4e4ac3b513615dbf27706bb`.

Raw HTML, metadata and parsed full states remain outside the repository at `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/office-paris/`. No further provider requests during implementation.

Query fullscreen is exactly the empty string; native isFullscreen=false. Preserve langfr/withCloseButton1 and absent pid/sdk/showCollapsed/iframePosition. FR state/customer language; absent state partner differs from the existing native payload default string1001. No query partner is invented.

## Verified scope and terms

Lunch12173 exact `Déjeuner`, exactly two, automatictrue/untilnull. Charge policy is **non-null**: askabletrue/min_guests12/charge_per_guests20, not applicable to two. Prepaymentnull; offerrequiredfalse/fromnull; cancellation10800 seconds relative to shift. Shift and first12:00 slot unclosed/nonfull; eleven quarter-hour candidates12:00–14:30. Candidates are not guaranteed later or held.

Six standard required fields, customFields[]/V2[], updatefalse. No chosen/mandatory room; raw and selected offers[]. Preserve catalog rooms6185Salle1/18492Terrasse/59370Salle3 without selecting or guaranteeing any of them.

Complete raw restaurant notice is preserved in the fixture and exact policy string, including its trailing space before the first newline:

```json
"Si vous ne trouvez pas de place, vous pouvez vous rendre dans notre second restaurant: Ardent situé au 40 Rue Richer \n\nHâte de vous recevoir"
```

Complete lunch notice:

```text
Nous proposons au déjeuner (hors jours fériés) une formule à 25 € en plus de la carte.
La terrasse est ouverte!
```

Provider exposes these as `terms.restaurantNotice` and `terms.shiftNotice`. Shared UI must show both before consent. Ardent is another restaurant, not a fallback selected by the adapter. The25€ wording does not choose a menu, and terrace opening does not guarantee terrace seating.

Dinner12175 and its two-hour limit/comment-based terrace request remain outside scope. Its raw policy stays in the source fixture for contrast; do not import it into lunch or infer lunch duration from capacity.turn_times.

Named policy and query guards apply at results, form and fresh review/pregrant boundaries. Full schema, EULA, raw restaurant notice and full chosen shift are fingerprinted. Existing owner/revision/TTL, explicit approval, durable sendAllowed/attempt binding, one POST/no retry and independent own-booking readback remain. POST echo cannot confirm; unknown locks.

## Validation and remaining gates

Focused4/4PASS: ten fully intercepted synthetic browser scenarios (success, missing/pending/date/party/offer receipt, card, manual, stale terms, wrong attempt) plus three pure contract tests. Coverage includes exact11times, dinner exclusion, typed non-null card threshold, forbidden/changed query, both notices, schema freshness, French payload and rejection of room/menu/comment additions.

Bounded existing Batistou browser+three pure and Casimir two pure tests PASS6/6. Syntax and diff checks PASS. These are local simulated supplier responses, not a real reservation or proof of native rendering.

No real booking, hold, payment, restaurant message or capability/receipt read. No shared app/server/registry/ledger/deployment edits. Independent review, actual Velvet UI/API/SQLite/backend-Playwright QA and32d5 release are required before activation. Public272 remains the baseline. Lava's separately rejected action was not retried.

Cached native390/1366 completed byce5c and accepted bymaster:12-file manifest `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-10/work/office-paris-native-manifest.json`, SHA256 `3551d80d6e8952cc20b97b74eef6650329ca7768b44d7e2b7ddcc96a26b81779`. Master reports all12file/6script hashes and both screenshots verified. Contact opens directly, no launcher; unique unchecked French EULA `/gtc?rid=350113&lang=fr`, below initial mobile viewport. Lunch notice is visible; full Ardent restaurant notice is absent from native Contact and must be projected in Velvet. No selected menu/terrace/room or card fields. Non-null min12/per20 policy and empty fullscreen preserved. Zero remote requests during rendering; four separately observed static GETs byce5c. This worker did not replay native. Native rendering is not app QA or a real supplier confirmation.
