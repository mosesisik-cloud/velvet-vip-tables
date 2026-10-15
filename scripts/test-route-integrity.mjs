import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, root),'utf8');
const app = await read('js/app.js');
const issues = [], warnings = [];
const location = (file,text,index) => `${file}:${text.slice(0,index).split('\n').length}`;
const routeBlock = app.slice(app.indexOf('const routes = {'), app.indexOf('// Parametriserade rutter'));
const staticRoutes = [...routeBlock.matchAll(/"(#[^"]*)"\s*:/g)].map(match=>match[1]);
const paramBlock = app.slice(app.indexOf('const paramRoutes = ['),app.indexOf('// Trasiga %-sekvenser'));
const paramRoutes = [...paramBlock.matchAll(/re:\s*(\/.+?\/[a-z]*),\s*fn:/g)].map(match=>Function('return '+match[1])());
assert.ok(staticRoutes.length > 10 && paramRoutes.length > 5,'Router extraction must cover the real route table');
const resolves = hash => staticRoutes.includes(hash.split('?')[0]) || paramRoutes.some(re=>re.test(hash.split('?')[0]));
const files = ['index.html',...(await fs.readdir(new URL('js/',root))).filter(name=>name.endsWith('.js') && !/copy|i18n/.test(name)).map(name=>'js/'+name)];
let routeReferences = 0, dynamicHrefReferences = 0, mergeMarkers = 0;
const prefixes = new Map(), anchors = [];
for (const file of files) {
  const source = await read(file);
  mergeMarkers += [...source.matchAll(/^<{7} /gm)].length;
  dynamicHrefReferences += [...source.matchAll(/href\s*=\s*["']\$\{/g)].length;
  for (const match of source.matchAll(/["'`](#\/[a-z0-9/_-]*)/gi)) {
    routeReferences++;
    const candidate = match[1];
    prefixes.set(candidate,(prefixes.get(candidate)||0)+1);
    // Ending '/' prefixes are dynamically populated IDs; test their route family.
    if (!resolves(candidate) && !(candidate.endsWith('/') && resolves(candidate+'__audit_id__'))) issues.push({kind:'unknown_route',at:location(file,source,match.index),route:candidate});
  }
  for (const match of source.matchAll(/<a\b[^>]*\bhref=["'](#[^"']*)["'][^>]*>/g)) {
    if (match[1].startsWith('#/')) continue;
    const tag=match[0], at=location(file,source,match.index);
    const intentionalSkip=match[1]==='#view' && /id="skip-link"/.test(tag) && /function initSkipLink\(\)[\s\S]*?e\.preventDefault\(\)/.test(app);
    const hiddenWhatsApp=match[1]==='#' && /id="wa-(open|reply)"/.test(tag) && /a\.href = href;[\s\S]*?wrap\.hidden = false/.test(app);
    anchors.push({at,hash:match[1],handled:intentionalSkip||hiddenWhatsApp});
    if (!intentionalSkip && !hiddenWhatsApp) issues.push({kind:'unhandled_hash_anchor',at,hash:match[1]});
  }
}

const dataFiles=(await fs.readdir(new URL('data/',root))).filter(file=>file.endsWith('.json'));
const data = Object.fromEntries(await Promise.all(dataFiles.map(async file=>[file,JSON.parse(await read('data/'+file))])));
const destinations=[...data['destinations.json'],...data['extra-destinations.json']];
const venues=[...data['venues.json'],...data['unlisted-venues.json']];
const restaurants=Object.entries(data['restaurants.json'].destinations).flatMap(([city,row])=>(row.restaurants||[]).map(r=>({...r,city})));
const destinationCodes=new Set(destinations.map(d=>d.code));
const destinationNames=new Set(destinations.map(d=>d.name));
const venueIds=new Set(venues.map(v=>v.venue_id));
const restaurantIds=new Set(restaurants.map(r=>r.placeId));
const groupedRestaurants=new Map();
for(const restaurant of restaurants) groupedRestaurants.set(restaurant.placeId,[...(groupedRestaurants.get(restaurant.placeId)||[]),restaurant]);
for(const [id,rows] of groupedRestaurants) if(rows.length>1) issues.push({kind:'ambiguous_restaurant_route',id,restaurants:rows.map(row=>row.name)});
for (const v of venues) {
  if (!v.venue_id) issues.push({kind:'missing_venue_id',name:v.name});
  if (!destinationCodes.has(v.destination_code) && !destinationNames.has(v.destination)) issues.push({kind:'missing_destination',venue:v.venue_id,destination:v.destination});
}
for (const r of restaurants) {
  if (!r.placeId) issues.push({kind:'missing_restaurant_id',name:r.name});
  if (!destinationCodes.has(r.city)) issues.push({kind:'missing_restaurant_city',restaurant:r.placeId,city:r.city});
}
for (const [id] of Object.entries(data['booking-providers.json'])) if (!restaurantIds.has(id)) issues.push({kind:'orphan_booking_provider',id});
for (const [id] of Object.entries(data['booking-urls.json'])) if (!venueIds.has(id)) warnings.push({kind:'orphan_venue_booking_url',id});
let generatedRoutes=0;
for (const [ids,families] of [[destinationCodes,['destination']],[venueIds,['venue','menu/venue','book-site','promoter']],[restaurantIds,['restaurant','menu/restaurant']]]) for (const id of ids) for (const family of families) {
  const route=`#/${family}/${encodeURIComponent(id)}`;
  generatedRoutes++;
  if (!resolves(route)) issues.push({kind:'generated_route_missing',route});
}

let externalUrlOccurrences=0;
const uniqueExternalUrls=new Set();
const externalProblems=[];
const urlKey=/(?:url|website|mapsurl|bookingurl|menuurl|instagram|facebook|tiktok|imageSource)$/i;
function scan(value,file,trail=[]) {
  if (Array.isArray(value)) { value.forEach((v,i)=>scan(v,file,[...trail,i])); return; }
  if (value && typeof value==='object') { for (const [k,v] of Object.entries(value)) scan(v,file,[...trail,k]); return; }
  if (typeof value!=='string' || !value) return;
  const expected=urlKey.test(String(trail.at(-1)));
  if (!/^https?:/i.test(value) && !expected) return;
  if (expected && /^(?:\/|#|mailto:|tel:)/i.test(value)) return;
  externalUrlOccurrences++;
  uniqueExternalUrls.add(value);
  try {
    const url=new URL(value);
    if (!['https:','http:'].includes(url.protocol) || !url.hostname || url.username || url.password || /[\r\n\t ]/.test(value)) externalProblems.push({file,path:trail.join('.'),url:value,reason:'unsupported_or_ambiguous_url'});
    else if (url.protocol==='http:') warnings.push({kind:'insecure_http_url',file,path:trail.join('.'),url:value});
  } catch {externalProblems.push({file,path:trail.join('.'),url:value,reason:'invalid_absolute_url'});}
}
for (const [file,value] of Object.entries(data)) scan(value,'data/'+file);
const report={scope:'Static route families, catalogue IDs and URL syntax only; no network requests or claim of live link success.',counts:{sourceFiles:files.length,staticRoutes:staticRoutes.length,parameterizedRoutes:paramRoutes.length,routeReferences,uniqueRoutePrefixes:prefixes.size,dynamicHrefReferences,nonRouteAnchors:anchors.length,generatedCatalogueRoutes:generatedRoutes,destinations:destinationCodes.size,venues:venueIds.size,restaurants:restaurantIds.size,restaurantRecords:restaurants.length,destinationRecords:destinations.length,dataFiles:dataFiles.length,externalUrlOccurrences,uniqueExternalUrls:uniqueExternalUrls.size,mergeMarkers},staticRoutes,paramRoutes:paramRoutes.map(String),anchors,issues,externalProblems,warnings};
console.log(JSON.stringify(report,null,2));
if (mergeMarkers) console.error('NOTICE: merge markers present; structural counts include both merge sides. Re-run after merge.');
if (issues.length || externalProblems.length) process.exitCode=1;

// Menu journeys preserve only validated booking context and cannot overwrite a newer route.
const {default:vm}=await import('node:vm');
const {parseBookingSelection}=await import('../js/booking-selection.js');
const currentApp=await read('js/app.js');
const menuSource=currentApp.slice(currentApp.indexOf('async function renderMenuReader('),currentApp.indexOf('// ---------- Destination detail'));
assert.ok(menuSource.includes('function renderMenuReader'),'Menu behavior test must exercise production function');
const restaurant={placeId:'audit-restaurant',name:'Audit Restaurant',website:'https://restaurant.example/menu'};
const contextData={destinations:{STO:{restaurants:[restaurant]}}};
const screen={innerHTML:''};
const context=vm.createContext({parseBookingSelection,URLSearchParams,URL,location:{hash:'#/menu/restaurant/audit-restaurant?date=2030-10-20&time=20%3A15&party=4&ignore=secret'},setTitle:()=>{},view:()=>screen,esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('"','&quot;'),RESTAURANT_MENUS:{},VENUES:[],menuItemsHTML:()=>'',fetch:async()=>({ok:true,json:async()=>contextData})});
vm.runInContext(menuSource,context);
await vm.runInContext('renderMenuReader("restaurant","audit-restaurant")',context);
assert.match(screen.innerHTML,/#\/restaurant\/audit-restaurant\?date=2030-10-20&amp;time=20%3A15&amp;party=4/);
assert.doesNotMatch(screen.innerHTML,/ignore=secret/);
context.location.hash='#/menu/restaurant/audit-restaurant?date=bad&time=99:99&party=100';
await vm.runInContext('renderMenuReader("restaurant","audit-restaurant")',context);
assert.match(screen.innerHTML,/href="#\/restaurant\/audit-restaurant"/);
let resolveMenu;
context.fetch=()=>new Promise(resolve=>{resolveMenu=resolve});
context.location.hash='#/menu/restaurant/audit-restaurant';
const menuPromise=vm.runInContext('renderMenuReader("restaurant","audit-restaurant")',context);
context.location.hash='#/account';screen.innerHTML='New account screen';
resolveMenu({ok:true,json:async()=>contextData});await menuPromise;
assert.equal(screen.innerHTML,'New account screen','Late menu fetch must leave the newly navigated screen intact');
const menuLink=currentApp.match(/const menuViewHref = `#\/menu\/restaurant[^\n]+/)[0];
const linkContext=vm.createContext({restaurant,bookingSelection:{date:'2030-10-20',time:'20:15',party:4},URLSearchParams});
vm.runInContext(menuLink,linkContext);
assert.equal(vm.runInContext('menuViewHref',linkContext),'#/menu/restaurant/audit-restaurant?date=2030-10-20&time=20%3A15&party=4');
console.error('PASS: menu booking-context round-trip, invalid-context rejection and stale-route protection.');
