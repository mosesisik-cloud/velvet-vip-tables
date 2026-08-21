let meta = #{
    name: "velvet-fulfill",
    description: "Uppfyll allt Moses sagt om VELVET: honest concierge, verified members, promoters, bokningsbrygga som laser klubbens sajt, deploy utan att rora Pulse",
    when_to_use: "Close remaining VELVET product gaps while Moses sleeps; fulfill the stated goal list",
    phases: [
        #{ title: "Audit", detail: "gap vs the full stated goal list" },
        #{ title: "Fix", detail: "implement unblocked gaps in the velvet repo" },
        #{ title: "Verify", detail: "skeptics must quote shipped code or live API" },
        #{ title: "Ship", detail: "tests, commit, push, velvet-api only" },
    ],
};

let findings_schema = #{
    "type": "object", "required": ["findings", "blocked"],
    "properties": #{
        "findings": #{ "type": "array", "maxItems": 8, "items": #{
            "type": "object", "required": ["file", "issue", "fix"],
            "properties": #{
                "file": #{ "type": "string" },
                "issue": #{ "type": "string" },
                "fix": #{ "type": "string" },
            },
        }},
        "blocked": #{ "type": "array", "maxItems": 8, "items": #{ "type": "string" }},
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
let rules = "Holy rules: work ONLY in this repo (never write other files on Desktop). Never docker restart bmd-salj-* Pulse/B2B. Only docker restart velvet-api if needed. Honest product: no fake reservation, prices, phones, stars, EUR. Do not change instagram_url. No passport images on GitHub. Graph mail only from orderagent@bakemyday.se. Do not add catalog venues until Gabbe replies A/B/C. Do not invent promoter faces or WhatsApp numbers. Static SPA HTML/CSS/vanilla JS. Swedish UI dark/gold. After JS edits run node --check and node api/test-rails.mjs.";

let empty_streak = 0;
let round = 0;
let last_confirmed = [];
let blocked_all = [];

while empty_streak < 2 && round < 3 {
    round += 1;
    phase("Audit");
    log("velvet-fulfill round " + round.to_string());

    let dims = [
        "Verified-member gates: passport MRZ+liveness+18+/21+ US dests, card last4 no PAN, unverified cannot GET/POST chats or /promoters, paying member can see verified/listed promoters (JB Bagatelle/Baoli worldwide, Thomas Dubai, Vincenzo Europe, Fredrik Strebel Sweden).",
        "Booking bridge reads official inventory: GET /book/bridge/:venue includes nights from venue-events.json and vipHow/email from facts; POST handoff does not write club PMS; reseller URLs dropped; book-site UI can pick a crawled night. Honest copy: no reservation until club confirms.",
        "Payments honest pipeline: /pay/config methods exist, ready false without Revolut IBAN, no invented EUR amounts. Age via MRZ. Match/compose tables and openFor women/men from passport sex.",
        "Product hygiene: i18n SV/EN/ES/FR for new keys, SW VERSION bumped if shell changed, overflow-x clip so header icons do not wander, language in hamburger not a separate button, Pulse containers must stay up.",
    ];
    let jobs = [];
    let di = 0;
    for d in dims {
        di += 1;
        let p = "You work in " + repo + ". Use read_file, grep, and list_dir on real files. ";
        p += rules + " ";
        p += "Audit ONLY this slice of the Moses goal list: " + d + " ";
        p += "DONE already unless you prove a gap in the shipped files: IDV, card, promoter lock, promoter roster seed, booking bridge, live nights on IBZ-001, i18n langs, SW. ";
        p += "Report unblocked concrete {file, issue, fix} max 8. Put Gabbe/Moses waits (IBAN paste, catalog A/B/C, promoter WhatsApp photos) in blocked, not findings. ";
        p += "Empty findings is valid only after you grepped/read the code. Do not invent files.";
        jobs.push(#{
            prompt: p,
            label: "audit-" + round.to_string() + "-" + di.to_string(),
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
        if r != () && r.success && r.output.blocked != () {
            for b in r.output.blocked { blocked_all.push(b); }
        }
    }
    log(findings.len().to_string() + " unblocked findings this round");

    if findings.len() == 0 {
        empty_streak += 1;
    } else {
        empty_streak = 0;
        phase("Fix");
        let blob = json_encode(findings);
        let fp = "You work in " + repo + ". Close these unblocked gaps. " + rules + " ";
        fp += "Implement the fixes. Keep booking honest (handoff to official site, read their lineup, never claim reserved). ";
        fp += "If you change js/app.js or api/*.mjs run: node --check on edited files and node api/test-rails.mjs. ";
        fp += "Deploy if tests pass: scp changed files to root@46.62.211.104 velvet-app / velvet-api using key C:/Users/moses.isik/.ssh/bmd_key, then docker restart velvet-api ONLY. Confirm docker ps still shows bmd-salj-api Up. ";
        fp += "Findings JSON: " + blob;
        let fx = agent(fp, #{ label: "fix-" + round.to_string(), capability_mode: "all" });
        if fx == () || !fx.success { log("fix agent failed; continuing to verify"); }

        phase("Verify");
        let skeptics = [
            "Read api/server.mjs memberGate, GET /promoters, GET /book/bridge. Set real=true ONLY if an unverified user can list promoters or create a bridge, or if POST /book/bridge claims the club reservation is confirmed. Quote the code.",
            "Read js/app.js renderBookSite and data/promoters.json. Set real=true ONLY if book-site cannot show crawled nights for IBZ-001, or seeded promoters JB/Thomas/Vincenzo/Strebel are missing. Quote files.",
            "Grep fake booking copy (Bokning bekraftad as real reservation, invented EUR prices). Set real=true ONLY if user-visible copy claims a paid reserved table without club confirm. Quote the string.",
        ];
        let vjobs = [];
        let si = 0;
        for s in skeptics {
            si += 1;
            vjobs.push(#{
                prompt: "Adversarially inspect " + repo + ". " + s + " Default real=false if unsure. Use grep/read_file. Evidence must be a quote you read.",
                label: "verify-" + round.to_string() + "-" + si.to_string(),
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
let ship_p = "In " + repo + " run git status and node api/test-rails.mjs if any uncommitted API/JS changes. ";
ship_p += "If the working tree is dirty with VELVET product files: git add those (never Desktop junk, never api/idv passport images, never pay.json secrets), commit with a factual Swedish/English message, git push origin main. ";
ship_p += "If clean, do not commit. Report status, latest commit, and whether Pulse (bmd-salj-api) is still Up via ssh docker ps if you deployed. " + rules;
let ship = agent(ship_p, #{ label: "ship", capability_mode: "all" });
let ship_out = "";
if ship != () && ship.success { ship_out = ship.output; }

let report = "velvet-fulfill rounds=" + round.to_string() + " skeptic_hits=" + last_confirmed.len().to_string();
let path = write_scratch_file("velvet-fulfill-report.md", report);
complete(#{
    rounds: round,
    remaining_skeptic_hits: last_confirmed.len(),
    blocked: blocked_all,
    ship: ship_out,
    path: path,
});
