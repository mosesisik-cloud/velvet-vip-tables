# NOSCH integrated app verification

Runtime 2e425ea455b8a52d0db5f975eb931b563ad41ea5 over public288 bc4b058632661f5e1b86b05affd773632b04bebe. Provider source 14baf0c534348eda7776a13f513331aa9249cd12 is unchanged. Independent e98a review of identity/provider/shared runtime completed with no findings. This is integrator-run local QA, not independent ce5c QA; ce5c was unavailable and was not retried.

The real local app, API, provider adapter and durable journal used an isolated synthetic supplier. All supplier traffic was intercepted locally. Original-client empty-contact verification is documented separately in the provider handoff. No actual reservation, hold, payment or contact was created.

- `--nosch --visit-choice-only`: PASS at390/1366, guest global search/Lyon list/destination/restaurant, full own French notice, initially unchecked final consent, duplicate blocking, independent synthetic saved-booking confirmation, lost-reply unknown state, owner isolation and restart recovery. 60API requests,2backend restarts,2synthetic supplier dispatches.
- `--nosch --nosch-tail`: eight negative cases PASS for required legacy field, V2 field, unexpected voucher parameter, foreign language query, changed notice, changed shop state, grant-time voucher drift and extra payload key. 104API requests,8restarts,0supplier dispatches.
- `--nosch --bistrot-cutoff-only`: four boundaries PASS on23/26October across Europe/Paris DST. At11:29 the five own slots are available; at11:30 none. 48API requests,4restarts,0supplier dispatches. Zero-capacity13:00/13:15 remain excluded.

Own strict journal/restart checks and source hashes passed before integration. No prior-venue broad matrices repeated. No aborted NOSCH app runs. Screenshots of own scope, review and full notice inspected. Runtime packaging contains11files with existing flags retained; staging verifies exact bytes and preceding public baseline. Catalog baseline adjustment allows only proven top-level server-generated fetchedAt/serialization differences, not changed restaurant data. Final CI, merge and public GET/HEAD-only verification are recorded in the release receipt.
