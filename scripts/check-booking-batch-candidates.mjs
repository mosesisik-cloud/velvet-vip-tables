/** Offline only. Never imports issues, claims work, or verifies physical identity.
 * Usage: node scripts/check-booking-batch-candidates.mjs --candidates=ids.json
 *   --catalogue=data/restaurants.json --worklist=data/restaurant-worklist.json
 *   --issues=issues.json --claims=claims.json --external200=data/external200-manifest.json
 * ids.json: explicit nonempty array of stable IDs (order preserved; no auto-selection).
 * issues.json: {complete:true, states:"all", items:[{number,state,body}]}
 *   Include ALL issues, open AND closed, across all pages. Do not filter by label.
 * claims.json: {complete:true, items:[{ref:"refs/heads/booking-claims/issue-123"}]}
 *   Include ALL claim refs across all pages; strings are also accepted as items.
 * Complete is the exporter's attestation, not independently verified by this tool.
 * Repository JSON files retain their native shapes. Use fresh, coherent exports.
 * Exit 0 = no metadata conflicts; 1 = review required; 2 = invalid/incomplete input.
 * Exit 0 never grants a claim/import/booking permission. Recheck live locks before
 * import, then wait for CLAIM CONFIRMED before restaurant research. Shared domains
 * and name matching are conservative alias warnings, not proof of physical identity.
 */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

const idOf = row => row.restaurantId ?? row.placeId;
const normalized = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function requireValue(condition, message) { if (!condition) throw Error(message); }
function uniqueRows(rows, label) {
  requireValue(Array.isArray(rows), `${label} must be an array`);
  const map = new Map();
  for (const row of rows) {
    requireValue(row && typeof row === 'object' && typeof idOf(row) === 'string' && idOf(row).length > 0, `${label}: missing stable ID`);
    requireValue(!map.has(idOf(row)), `${label}: duplicate ID ${idOf(row)}`);
    map.set(idOf(row),row);
  }
  return map;
}
function domain(value) {
  if (!value) return '';
  try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) ? u.hostname.toLowerCase().replace(/^www\./,'') : ''; }
  catch { return ''; }
}
function shortName(row) {
  const name=normalized(row.name), city=normalized(row.city);
  return city && name.endsWith(city) && name.length>city.length ? name.slice(0,-city.length) : name;
}

export function checkBatch({candidates,catalogue,worklist,issues,claims,external200}) {
  requireValue(Array.isArray(candidates) && candidates.length>0 && candidates.every(x=>typeof x==='string' && /^[a-zA-Z0-9_-]+$/.test(x)), 'candidates must be an explicit nonempty stable-ID array');
  requireValue(new Set(candidates).size===candidates.length, 'duplicate candidate IDs');
  requireValue(catalogue?.destinations && typeof catalogue.destinations==='object', 'catalogue.destinations required');
  const catalogueRows=Object.entries(catalogue.destinations).flatMap(([cityCode,d])=>{
    requireValue(Array.isArray(d?.restaurants), `catalogue ${cityCode}: restaurants required`);
    return d.restaurants.map(r=>({...r,cityCode}));
  });
  const catalog=uniqueRows(catalogueRows,'catalogue');
  const records=uniqueRows(worklist?.records,'worklist');
  const reserved=uniqueRows(external200?.records,'external200');
  requireValue(issues?.complete===true && issues.states==='all' && Array.isArray(issues.items), 'issues must attest complete:true, states:all and contain items');
  requireValue(claims?.complete===true && Array.isArray(claims.items), 'claims must attest complete:true and contain items');
  const issueMap=new Map(), issueIds=new Map();
  for (const issue of issues.items) {
    requireValue(Number.isSafeInteger(issue?.number) && issue.number>0 && ['open','closed'].includes(String(issue.state).toLowerCase()) && typeof issue.body==='string', 'issue requires number, open/closed state and body');
    requireValue(!issueMap.has(issue.number), `duplicate issue ${issue.number}`);
    const markers=[...issue.body.matchAll(/<!--\s*restaurantId:\s*([^\s]+)\s*-->/g)].map(m=>m[1]);
    if (issue.restaurantId) markers.push(issue.restaurantId);
    const ids=[...new Set(markers)];
    issueMap.set(issue.number,ids);
    for (const id of ids) issueIds.set(id,[...(issueIds.get(id)||[]),issue.number]);
  }
  const locks=new Map(), warnings=[];
  for (const item of claims.items) {
    const ref=typeof item==='string'?item:item?.ref;
    const match=typeof ref==='string' && ref.match(/^(?:refs\/)?heads\/booking-claims\/issue-(\d+)$/);
    requireValue(match && Number.isSafeInteger(Number(match[1])) && Number(match[1])>0, `invalid claim ref ${ref}`);
    const number=Number(match[1]);
    requireValue(!locks.has(number), `duplicate claim ref for issue ${number}`);
    locks.set(number,ref);
    if (!issueMap.get(number)?.length) warnings.push({code:'unresolved_claim',issue:number,ref,note:'Claim cannot be associated with a restaurant from this export; coordinator must resolve.'});
  }
  const all=new Map([...catalog].map(([id,r])=>[id,{...r,...records.get(id)}]));
  for (const [id,r] of records) if (!all.has(id)) all.set(id,r);
  const results=candidates.map(id=>{
    const row=all.get(id), reasons=[];
    const add=(code,detail)=>reasons.push({code,...detail});
    if (!catalog.has(id)) add('missing_catalogue',{});
    if (!records.has(id)) add('missing_worklist',{});
    if (reserved.has(id)) add('external200_reserved',{});
    if (records.has(id) && records.get(id).status?.implementation!=='not_integrated') add('already_integrated_or_unknown_status',{implementation:records.get(id).status?.implementation??null});
    const related=new Set([id]);
    if (row?.aliasOf && !all.has(row.aliasOf)) add('unresolved_alias',{otherId:row.aliasOf});
    if (row) for (const [otherId,other] of all) {
      if (otherId===id) continue;
      const signals=[];
      if (row.aliasOf===otherId || other.aliasOf===id || (row.aliasOf && row.aliasOf===other.aliasOf)) signals.push('explicit_alias');
      const domains=r=>[...new Set([r.source,r.website,r.evidence?.catalog?.website].map(domain).filter(Boolean))];
      if (domains(row).some(h=>domains(other).includes(h))) signals.push('shared_source_domain');
      if (row.cityCode && row.cityCode===other.cityCode && shortName(row) && shortName(row)===shortName(other)) signals.push('same_name_destination');
      if (signals.length) { related.add(otherId); add('possible_alias',{otherId,signals}); }
    }
    for (const relatedId of related) {
      if (relatedId!==id && reserved.has(relatedId)) add('alias_external200_reserved',{relatedId});
      for (const number of issueIds.get(relatedId)||[]) {
        add('existing_issue',{relatedId,issue:number});
        if (locks.has(number)) add('active_claim',{relatedId,issue:number,ref:locks.get(number)});
      }
    }
    return {restaurantId:id,name:row?.name??null,metadataEligible:reasons.length===0,reasons};
  });
  return {readOnly:true,identityVerified:false,claimAuthorized:false,reviewRequired:warnings.length>0 || results.some(r=>!r.metadataEligible),warnings,results,
    limitation:'Metadata only; no physical identity verification, freshness guarantee or permission to import/claim. Recheck authoritative locks and await CLAIM CONFIRMED.'};
}

function main(args) {
  const names=['candidates','catalogue','worklist','issues','claims','external200'];
  const options={};
  for (const arg of args) {
    const match=arg.match(/^--([^=]+)=(.+)$/);
    requireValue(match && names.includes(match[1]) && !Object.hasOwn(options,match[1]), `unknown, duplicate or malformed argument: ${arg}`);
    options[match[1]]=match[2];
  }
  const input={};
  for (const name of names) {
    requireValue(options[name], `missing --${name}=file.json`);
    input[name]=JSON.parse(fs.readFileSync(options[name],'utf8'));
  }
  const report=checkBatch(input);
  console.log(JSON.stringify(report,null,2));
  process.exitCode=report.reviewRequired?1:0;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); }
  catch(error) { console.error(JSON.stringify({error:error.message,reviewRequired:true})); process.exitCode=2; }
}
