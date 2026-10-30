import fs from 'node:fs';
import crypto from 'node:crypto';
const root = new URL('../', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const groups = Array.from({length:10}, (_, i) => read(`data/external200-playwright-group${String(i + 1).padStart(2, '0')}.json`));
const rows = groups.flatMap(g => g.restaurants);
const providers = new Map();
for (const row of rows.filter(r => r.readiness === 'candidate')) {
  const group = providers.get(row.providerCandidate) || {provider:row.providerCandidate, restaurantIds:[], verifiedProviderVenueIds:[]};
  group.restaurantIds.push(row.restaurantId);
  if (row.providerVenueId && !group.verifiedProviderVenueIds.includes(row.providerVenueId)) group.verifiedProviderVenueIds.push(row.providerVenueId);
  providers.set(row.providerCandidate, group);
}
const summary = {
  schemaVersion:1, reviewedAt:'2026-10-16', repositoryBase:'7c0e45d',
  purpose:'Research handoff to canonical backend Playwright adapters; not an activation registry or completed booking implementation',
  coordination:'https://github.com/mosesisik-cloud/velvet-vip-tables/issues/129',
  manifestSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('data/external200-manifest.json', root))).digest('hex'),
  counts:{reviewed:rows.length, ...Object.fromEntries(['candidate','manual_only','unresolved','unavailable'].map(status => [status,rows.filter(r => r.readiness === status).length])),
    backendPlaywrightImplemented:rows.filter(r => r.backendPlaywrightImplemented).length,
    backendPlaywrightTested:rows.filter(r => r.backendPlaywrightTested).length,
    supplierConfirmationVerified:rows.filter(r => r.supplierConfirmationVerified).length},
  providers:[...providers.values()].sort((a,b) => b.restaurantIds.length-a.restaurantIds.length || a.provider.localeCompare(b.provider)),
  exclusions:{manualRoutes:'Do not automate phone, email, WhatsApp or LINE messages.', unresolved:'Do not guess the branch or provider.', unavailable:'Preserve walk-in, takeaway and closure distinctions in original group records.'},
  activationRequirements:[
    'Canonical provider owner validates exact restaurant identity and provider venue ID against official source.',
    'Reuse authenticated owner/session/revision, concurrency and durable attempt protections from the canonical integration.',
    'Observe provider-specific search, hold, guest, terms, submit and confirmation boundaries; no generic Continue or arbitrary URL automation.',
    'Request acceptance, inventory, payment requirement and confirmed reservation stay separate; static time options are not availability.',
    'Guest approves current venue/date/party/experience/price/terms before any mutation; development never performs real holds/bookings/payments.',
    'Require reviewed provider outcome tied to the same attempt before reporting confirmation; unknown outcomes never trigger automatic retry.',
    'CAPTCHA or access protection stops automation; no bypass. Payment handling requires separately reviewed provider-secure flow.',
    'Record implementation, fixture test, read-only live test, supplier confirmation and deployment evidence separately.'
  ]
};
const output = JSON.stringify(summary,null,2)+'\n';
const destination = new URL('data/external200-playwright-handoff.json',root);
if(process.argv.includes('--check')) {
  if(fs.readFileSync(destination,'utf8')!==output) throw new Error('external200 Playwright handoff is stale');
} else fs.writeFileSync(destination,output);
console.log(JSON.stringify(summary.counts));
