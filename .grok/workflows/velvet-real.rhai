let meta = #{
    name: "velvet-real",
    description: "Loop VELVET until it is an honest concierge product: audit gaps, fix, verify, push",
    when_to_use: "Make VELVET real, close remaining production gaps, or ship a Gabbe-ready concierge preview",
    phases: [
        #{ title: "Audit", detail: "read the shipped SPA for remaining fake-booking and launch gaps" },
        #{ title: "Fix", detail: "one writer closes confirmed gaps in the repo" },
        #{ title: "Verify", detail: "skeptics refute that fake bookings or broken routes remain" },
        #{ title: "Ship", detail: "commit and push if the tree is dirty and verify passed" },
    ],
};

let findings_schema = #{
    "type": "object", "required": ["findings"],
    "properties": #{
        "findings": #{ "type": "array", "maxItems": 8, "items": #{
            "type": "object", "required": ["file", "issue", "fix"],
            "properties": #{
                "file": #{ "type": "string" },
                "issue": #{ "type": "string" },
                "fix": #{ "type": "string" },
            },
        }},
    },
};
let verdict_schema = #{
    "type": "object", "required": ["real", "reason", "evidence"],
    "properties": #{
        "real": #{ "type": "boolean" },
        "reason": #{ "type": "string" },
        "evidence": #{ "type": "string" },
    },
};

let repo = "C:/Users/moses.isik/Desktop/velvet-vip-tables";
let empty_streak = 0;
let round = 0;
let last_confirmed = [];

while empty_streak < 2 && round < 3 {
    round += 1;
    phase("Audit");
    log("VELVET real-loop round " + round.to_string());

    let dims = [
        "fake booking language: any user-visible copy that claims a table is reserved, paid, or confirmed by a club",
        "broken V4 surfaces: request modal host fields, favorites, global search, join/list/legal routes, PWA register",
        "data and legal: missing disclaimers, hotlinked images without attribution, FormSubmit/mailto concierge path",
        "mobile and a11y of V4: 44px hearts, search overlay on 375px, ribbon, request modal",
    ];
    let jobs = [];
    for d in dims {
        let p = "You work in " + repo + ". Use read_file and grep on the actual files (index.html, js/app.js, css/app.css, sw.js, README.md). ";
        p += "Audit ONLY for: " + d + ". ";
        p += "VELVET must stay a static SPA (no frameworks, Swedish UI, dark/gold). ";
        p += "Holy rules: never reintroduce fake 'Bokning bekraftad' as a real reservation; never add Pexels venue photos; never change instagram_url values. ";
        p += "Report at most 8 concrete {file, issue, fix}. Empty findings is valid only after you grepped/read the code. Do not invent files.";
        jobs.push(#{
            prompt: p,
            label: "audit-" + round.to_string(),
            capability_mode: "read-only",
            output_schema: findings_schema,
        });
    }
    let results = parallel(jobs);

    let findings = [];
    for r in results {
        if r != () && r.success && r.output.findings != () {
            for f in r.output.findings {
                if f.file != () && f.issue != () { findings.push(f); }
            }
        }
    }
    log(findings.len().to_string() + " audit findings this round");

    if findings.len() == 0 {
        empty_streak += 1;
    } else {
        empty_streak = 0;
        phase("Fix");
        let blob = json_encode(findings);
        let fp = "You work in " + repo + ". Close these confirmed gaps. Edit the existing static SPA only. ";
        fp += "Do not add a framework or build step. Swedish UI. Dark/gold. ";
        fp += "Never claim a table is booked/reserved. Keep request copy honest. ";
        fp += "Never add stock/Pexels venue photos. Do not change instagram_url values. ";
        fp += "Run node --check js/app.js after JS edits. Findings JSON: " + blob;
        let fx = agent(fp, #{ label: "fix-" + round.to_string(), capability_mode: "all" });
        if fx == () || !fx.success { log("fix agent failed; continuing to verify"); }

        phase("Verify");
        let skeptics = [
            "Read js/app.js and index.html. Set real=true ONLY if user-visible copy still claims a table is reserved, paid, or 'Bokning bekraftad' as a real booking. Evidence must be a quoted string you read.",
            "Grep routes in js/app.js and index.html. Set real=true ONLY if #/favorites, #/villkor, #/integritet, #/list, search overlay, or PWA sw.js registration is missing or throws. Evidence from files.",
        ];
        let vjobs = [];
        for s in skeptics {
            vjobs.push(#{
                prompt: "Adversarially inspect " + repo + ". " + s + " Default real=false if unsure. Use grep/read_file.",
                label: "verify-" + round.to_string(),
                capability_mode: "read-only",
                output_schema: verdict_schema,
            });
        }
        let verdicts = parallel(vjobs);
        last_confirmed = [];
        for v in verdicts {
            if v != () && v.success && v.output.real == true && v.output.evidence != () && v.output.evidence != "" {
                last_confirmed.push(v.output);
            }
        }
        log(last_confirmed.len().to_string() + " skeptic hits");
    }
}

phase("Ship");
let ship_p = "In " + repo + " run git status. If the working tree is dirty: git add the VELVET product files (not Desktop junk), commit with message 'V4: concierge preview — honest request, PWA, favorites, search' and Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>, then git push origin main. ";
ship_p += "If clean, do not commit. Report status and the latest commit hash. Do not rewrite history.";
let ship = agent(ship_p, #{ label: "ship", capability_mode: "all" });
let ship_out = "";
if ship != () && ship.success { ship_out = ship.output; }

complete(#{
    rounds: round,
    remaining_skeptic_hits: last_confirmed.len(),
    ship: ship_out,
});
