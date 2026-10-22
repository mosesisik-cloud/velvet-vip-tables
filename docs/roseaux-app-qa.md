# Brasserie Roseaux integrated app QA

Runtime eec5bbdf68186fac4f1655ddcc602de299e16125 over public289 c0b19144651eef8bd182b3fd6eff348d2a02d9ba. Provider494 exact984a677eec85575156217f409b16fdd393216d22 is unchanged. Independent e98a reviewed this exact runtime with no findings. Local app QA was run by the integrator; unavailable ce5c was not retried or represented as independent app QA.

The real local UI/API/provider adapter/durable journal used intercepted synthetic supplier traffic. No actual reservation, hold, payment or contact occurred. Original-client empty-contact and optional empty gift verification are separate provider evidence.

- `--roseaux --visit-choice-only`: PASS390/1366, guest global search/Lyon list/destination/restaurant routes, full own notice, unchecked consent, double-click protection, independent synthetic confirmation, lost-reply unknown state, owner isolation and restart recovery. 60API requests,2restarts,2synthetic dispatches.
- `--roseaux --roseaux-tail`: eight negative cases PASS: changed exact opening date, required legacy field, filled gift DOM, disconnected vouchers, changed notice, changed shop state, grant-time voucher parameter, extra payload key. 107API requests,8restarts,0dispatches.
- `--roseaux --bistrot-cutoff-only`: eight boundaries PASS23/26October across DST. Candidate counts7/6/5/0 at11:59/12:00/12:15/13:30 local. 84API requests,8restarts,0dispatches.

Own source hashes, normalized identity844/mappings200, strict journal, durable restart, syntax and diff checks PASS. No aborted Roseaux app runs or old-venue matrix reruns. Scope/full notice/review screenshots inspected. Eleven runtime files staged with full prior baseline and combined hash verification; catalog adjustment only permits independently proven server fetchedAt/serialization differences. Exact final CI, merge and public GET/HEAD-only verification are recorded in the release receipt.
