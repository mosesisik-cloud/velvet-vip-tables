# Le Mercière integrated app QA

Release runtime dc22fca206947d806f35ab987901e171cf8b748c over public292 a340a40a3c5673d76af394cae4806e16ba46fbd9. Its eleven runtime files are identical to initial integration0fc72ecf0f06a1e0e22d74f0dd65c18747c4769b; only an accidentally changed worklist owner UUID was restored after independent review. Provider5032a430238f0686a782b22ad17338ad989ae7fe43c unchanged.

Integrator local QA used the real app/API/provider/durable journal with intercepted synthetic supplier traffic. No actual reservation, hold, payment or contact. Original-client empty-contact proof remains separate. Unavailable ce5c was not retried or represented as independent app QA.

- Main PASS390/1366 on0fc72ec: guest search/Lyon list/destination/restaurant, full own15-minute lateness and call-for-changes notice before unchecked consent, duplicate blocking, independent synthetic confirmation, lost-reply unknown state, owner isolation and restart recovery. 60API requests,2restarts,2synthetic dispatches.
- Eight negatives PASS ondc22fca: opening-date drift, hidden TAGS becoming enabled, voucher parameter, foreign language, changed notice, changed shop flag, grant-time voucher parameter and extra payload key. 107API requests,8restarts,0dispatches.
- Four cutoff/DST cases PASS ondc22fca:23/26October, eight candidates at11:29 and none at11:30 local. 48API requests,4restarts,0dispatches.

Scope/notice/review screenshots inspected. No aborted Mercière app runs or old-venue matrix reruns. Source hashes, identity847/mappings203, strict journal/restart and syntax/diff checks passed. Work resumed24October after usage-limit interruption; saved passing runs retained without duplicate testing. Source availability for23October is historical evidence, not a claim of current availability.

Eleven staged runtime files are compared to local bytes and exact Git content before release. Existing public292 baseline is checked again before deployment; only proven server-generated catalog fetchedAt/serialization differences are allowed. Independent review completion, final CI, merge and public GET/HEAD-only results are recorded in the release receipt.
