import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
const source = args.find(x => x.startsWith('--source='))?.slice(9) || 'data/restaurant-worklist.json';
const limit = Number(args.find(x => x.startsWith('--limit='))?.slice(8) || 20);
if (!Number.isInteger(limit) || limit < 1 || limit > 770) throw Error('Invalid limit');
const repo = 'mosesisik-cloud/velvet-vip-tables';
function gh(a, input) {
  const r = spawnSync('gh', a, { encoding: 'utf8', input, shell: false });
  if (r.status !== 0) throw Error(r.stderr || 'gh failed');
  return r.stdout;
}
const snapshot = JSON.parse(fs.readFileSync(source, 'utf8'));
const issues = JSON.parse(gh(['issue', 'list', '--repo', repo, '--state', 'all', '--label', 'booking-task', '--limit', '2000', '--json', 'number,body']));
const existing = new Set(issues.map(x => x.body.match(/<!-- restaurantId: ([^ ]+) -->/)?.[1]).filter(Boolean));
const reserved = new Set(['osm-PAR-bigbang', 'curated-MCO-pavyllon-monte-carlo', 'osm-MCO-aradhana', 'osm-MCO-chez-pipo', 'osm-MCO-asia-food']);
const seen = new Set();
for (const r of snapshot.records) {
  if (seen.has(r.restaurantId)) throw Error('Duplicate restaurantId in source');
  seen.add(r.restaurantId);
}
const candidates = snapshot.records.filter(r =>
  r.owner === '01a14080-83ed-7991-ac52-7f57761f13e7' &&
  r.status.implementation === 'not_integrated' &&
  !reserved.has(r.restaurantId) && !existing.has(r.restaurantId)
).sort((a,b) => (a.provider === 'unknown') - (b.provider === 'unknown') || a.restaurantId.localeCompare(b.restaurantId));
console.log(JSON.stringify({ eligible: candidates.length, selected: candidates.slice(0,limit).map(r => ({id:r.restaurantId,name:r.name,identity:r.status.identity,provider:r.provider})), apply:args.includes('--apply') }, null, 2));
if (!args.includes('--apply')) process.exit(0);
for (const r of candidates.slice(0, limit)) {
  const body = `<!-- restaurantId: ${r.restaurantId} -->\n## Scope\nRestaurant ID: \`${r.restaurantId}\`\nCatalog name: ${r.name}\nCatalog city (verify): ${r.city}\nSnapshot: ${snapshot.generatedAt}\n\n## Current evidence\nIdentity: ${r.status.identity}\nBooking route: ${r.status.bookingRoute}\nProvider: ${r.provider}\nImplementation: ${r.status.implementation}\nCatalog/source lead (NOT independently verified by this queue): ${r.source || 'unknown'}\nBlocker: ${r.blocker || 'Not established; inspect canonical evidence'}\nSuggested next step: ${r.next || 'Verify identity and official booking route'}\n\n## Claim before work\nRead [queue rules](https://github.com/${repo}/blob/main/docs/booking-queue.md). Comment \`/claim YOUR-UNIQUE-AGENT-ID\` and wait for CLAIM CONFIRMED. An existing booking-claims/issue-N ref overrides the ready label.\n\n## Acceptance and boundaries\n- Verify exact restaurant/branch/address using official sources.\n- Establish a truthful booking/contact route, or document blocked/closed/walk-in status with evidence.\n- Distinguish external link, original form, observed availability, request and confirmed reservation.\n- No real bookings, holds, payments or restaurant messages.\n- Own working branch; coordinate shared provider/registry files before editing. Do not edit canonical worklist or branding files.\n- PR references this issue; include sources/date, tests/limitations, changed files and next step.\n- Integrator consolidates evidence. Release owner alone publishes; do not claim live status without release evidence.\n\n## Reporting\nStatus | agent | restaurantId | files | sources/date | tests/limitations | blocker/next step | PR/commit | publication\n`;
  const result = gh(['api', `repos/${repo}/issues`, '--method', 'POST', '--input', '-'], JSON.stringify({title:`[Booking] ${r.name} — ${r.restaurantId}`,body,labels:['booking-task','booking:ready']}));
  console.log(JSON.parse(result).html_url);
}
