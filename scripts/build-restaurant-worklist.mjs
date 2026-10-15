import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Evidence ledger, not a test runner. Usage: node scripts/build-restaurant-worklist.mjs --output <file> [--no-public]
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing ${name}`);return args[i+1];};
const output=path.resolve(option('--output',path.join(root,'data/restaurant-worklist.json')));
const provenance=[];
const read=async name=>{const bytes=await fs.readFile(path.join(root,name));provenance.push({file:name,sha256:createHash('sha256').update(bytes).digest('hex')});return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));};
const optional=async name=>{try{return await read(name);}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const [catalog,registry,bb,brands,manifest]=await Promise.all([read('data/restaurants.json'),read('data/booking-providers.json'),read('api/bokabord-restaurants.json'),read('data/restaurant-brands.json'),optional('data/external200-manifest.json')]);
const rootOwner='01a14080-83ed-7991-ac52-7f57761f13e7',externalOwner='01a14189-8468-7353-97ad-3549532fc728',logoOwner='01a14138-697b-7681-aac3-72cf68a8f205';
const externalIds=new Set((manifest?.records||[]).map(r=>r.restaurantId));
const audits=new Map();
for(const file of (await fs.readdir(path.join(root,'data'))).filter(f=>/^external200-group\d+\.json$/.test(f)).sort()){
 const group=await read('data/'+file);
 for(const row of group.records||[]){if(audits.has(row.restaurantId))throw Error(`Duplicate audit ${row.restaurantId}`);audits.set(row.restaurantId,{row,file:'data/'+file,checkedAt:group.checkedAt||null});}
}
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const publicUrl=option('--public-registry','https://b2b.bakemyday.se/velvet/data/booking-providers.json');
let published=null,publicError=null;
if(!args.includes('--no-public')){
 try{if(new URL(publicUrl).protocol!=='https:')throw Error('HTTPS required');const response=await fetch(publicUrl,{method:'GET',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error(`HTTP ${response.status}`);published=await response.json();if(!published||Array.isArray(published)||typeof published!=='object')throw Error('Invalid public registry');}
 catch(e){published=null;publicError=e.message;}
}else publicError='Public comparison not requested';
const generatedAt=new Date().toISOString(),records=[],seen=new Set();
for(const [cityCode,group] of Object.entries(catalog.destinations))for(const restaurant of group.restaurants||[]){
 const id=restaurant.placeId;if(!id||seen.has(id))throw Error(`Invalid/duplicate catalog ID ${id}`);seen.add(id);
 const mapping=registry[id],mirror=bb[id],brand=brands[id],audit=audits.get(id),a=audit?.row;
 const provider=mapping?.provider||(mirror?'BokaBord':a?.provider||null);
 const source=mapping?.source||mirror?.source||restaurant.locationSource||a?.sources?.find(s=>s.kind==='official')?.url||restaurant.website||null;
 const identity=mapping||mirror?'reviewed_mapping':restaurant.locationSource?'official_location_reviewed':a?.identity?.status||'unknown';
 const route=mapping||mirror?'reviewed_provider_link':a?.checks?.officialExternalLink?'official_external_link':a?.status||'unknown';
 const implementation=mapping?.integrationMode||(mirror?'bokabord_mirror_configured':'not_integrated');
 const tests={status:'unknown',confirmedReservation:'unknown',basis:null};
 if(a?.checks){tests.status='reported_checks';tests.reported={...a.checks};tests.basis=audit.file;tests.confirmedReservation=a.checks.confirmedReservation===true?'reported_confirmed':a.checks.confirmedReservation===false?'reported_not_confirmed':'unknown';}
 else if(mapping?.verification==='embedded_form_loaded'){tests.status='initial_form_evidence_only';tests.basis='data/booking-providers.json';}
 // A declaration of tracking support is not evidence that a booking was made.
 let publication={status:'unknown',basis:null};
 if(mapping&&published)publication={status:Object.hasOwn(published,id)?canonical(published[id])===canonical(mapping)?'exact_public_registry_match':'public_registry_differs':'absent_public_registry',basis:publicUrl};
 else if(mirror)publication={status:'unknown',basis:'Bokabord publication not established by generic public registry'};
 else if(mapping)publication={status:'unknown',basis:publicError};
 let assetPresent=false;
 if(brand?.src){const asset=path.resolve(root,brand.src);if(asset.startsWith(root)&&!/^https?:/i.test(brand.src)){try{assetPresent=(await fs.stat(asset)).isFile();}catch{}}}
 const logo={status:brand?assetPresent?'local_asset_present':'asset_unverified':'unknown',owner:logoOwner,source:brand?.source||null,checkedAt:brand?.verifiedAt||null};
 const owner=externalIds.has(id)?externalOwner:rootOwner;
 const blocker=mapping?.bookingMode==='request_only'?'Provider processes a request; no instant confirmation':!mapping&&!mirror?'No active reviewed provider mapping':publication.status==='public_registry_differs'?'Public registry differs':publication.status==='absent_public_registry'?'Mapping not published':null;
 const next=!mapping&&!mirror?(identity==='unknown'||identity==='unresolved'?'Verify exact restaurant identity and official booking route':'Review booking route and provider integration'):publication.status!=='exact_public_registry_match'&&!mirror?'Verify publication against reviewed mapping':'Validate remaining guest journey without live booking';
 records.push({restaurantId:id,name:restaurant.name,city:group.destination,cityCode,country:group.country,provider,source,owner,blocker,next,checked:mapping?.checkedAt||mirror?.verifiedAt||restaurant.locationVerifiedAt||audit?.checkedAt||null,
  status:{identity,bookingRoute:route,implementation,tests,publication,logo},
  priority:provider&&identity!=='unknown'&&identity!=='unresolved'?1:identity!=='unknown'&&identity!=='unresolved'?2:3,
  evidence:{catalog:{file:'data/restaurants.json',website:restaurant.website||null,address:restaurant.address||null,locationSource:restaurant.locationSource||null,locationVerifiedAt:restaurant.locationVerifiedAt||null},mapping:mapping?{file:'data/booking-providers.json',record:mapping}:mirror?{file:'api/bokabord-restaurants.json',record:mirror}:null,audit:audit?{file:audit.file,checkedAt:audit.checkedAt,identity:a.identity,sources:a.sources||[],limitations:a.limitations||[]}:null,logo:brand?{file:'data/restaurant-brands.json',record:brand}:null}});
}
if(records.length!==770)throw Error(`Expected770 stable IDs, found${records.length}`);
records.sort((a,b)=>a.priority-b.priority||(a.provider||'').localeCompare(b.provider||'')||a.city.localeCompare(b.city)||a.restaurantId.localeCompare(b.restaurantId));
const countBy=fn=>records.reduce((all,r)=>{const k=fn(r)||'unknown';all[k]=(all[k]||0)+1;return all;},{});
const result={schemaVersion:1,generatedAt,scope:'770 stable catalog IDs. Declared evidence and test reports are separate from publication; no live booking or test execution inferred.',warnings:['Branding is a local snapshot; ongoing branding work may be pending. Asset presence does not establish live publication or visual QA.','Sources may change during concurrent work. File hashes identify exactly the bytes read; this is not an atomic Git snapshot.','Unknown tests/publication remain unknown. A matching public registry is not proof that provider checkout works.'],provenance:provenance.sort((a,b)=>a.file.localeCompare(b.file)),publicComparison:{url:publicUrl,status:published?'fetched':'unknown',error:publicError,checkedAt:generatedAt},counts:{restaurants:records.length,providers:countBy(r=>r.provider),implementation:countBy(r=>r.status.implementation),publication:countBy(r=>r.status.publication.status),owners:countBy(r=>r.owner)},records};
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output,...result.counts}));
