import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { availabilityCopy } from '../js/availability-copy.js';
import { availabilityState, availabilityCacheMatches, mountAvailabilitySearch } from '../js/availability-search.js';

const catalogue = { destinations: { STO: { destination: 'Stockholm', restaurants: [] }, PAR: { destination: 'Paris', restaurants: [] } } };
const query = new URLSearchParams('city=STO&date=2030-10-20&time=20%3A15&party=4');
assert.deepEqual(availabilityState(catalogue, query, '', '2030-10-15'), {city:'Stockholm',date:'2030-10-20',time:'20:15',party:'4'});
assert.deepEqual(availabilityState(catalogue, new URLSearchParams('city=unknown&date=bad&time=25:00&party=99'), '', '2030-10-15'), {city:'',date:'2030-10-15',time:'19:00',party:'2'});
const record = {query:'city=Stockholm',savedAt:1000,data:{results:[]}};
assert.equal(availabilityCacheMatches(record, record.query, 2000), true);
assert.equal(availabilityCacheMatches(record, 'city=Paris', 2000), false);
assert.equal(availabilityCacheMatches(record, record.query, 301000), false);
assert.equal(availabilityCacheMatches(record, record.query, 0), false);

// A small DOM boundary fake tests request cancellation and restoration without a browser or real API.
class Element {
  listeners = new Map(); attributes = {}; children = []; textContent = ''; parent = null;
  get innerHTML() { return this.children.length ? this.children.map(node => node.outerHTML).join('') : this._html || ''; }
  set innerHTML(value) {
    this._html = value;
    this.children = [...value.matchAll(/<(article|details|p)\b[^>]*>[\s\S]*?<\/\1>/g)].map(match => {
      const node = new Element(); node.outerHTML = match[0]; node.parent = this;
      node.tagName = match[1].toUpperCase(); node.dataset = {resultKey:match[0].match(/data-result-key="([^"]*)"/)?.[1]};
      node.className = match[0].match(/class="([^"]*)"/)?.[1] || ''; return node;
    });
  }
  get firstElementChild() { return this.children[0] || null; }
  get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this)+1] || null; }
  insertBefore(node, expected) {
    node.remove(); node.parent = this;
    const index = expected ? this.children.indexOf(expected) : this.children.length;
    this.children.splice(index,0,node);
  }
  remove() { if(this.parent) this.parent.children=this.parent.children.filter(node=>node!==this); this.parent=null; }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name) { this.listeners.delete(name); }
  setAttribute(name, value) { this.attributes[name] = value; }
  replaceChildren() { this.innerHTML=''; }
  reportValidity() { return true; }
}
globalThis.document = { createElement(tag) {
  assert.equal(tag,'template'); const template = new Element();
  Object.defineProperty(template,'content',{get(){return {children:this.children}}}); return template;
} };
const store = new Map();
globalThis.sessionStorage = {getItem:key=>store.get(key) || null, setItem:(key,value)=>store.set(key,value)};
globalThis.location = {hash:'#/availability?city=Stockholm&date=2030-10-20&time=20%3A15&party=4'};
globalThis.history = {state:{preserved:true},replaceState(state,_,url) {assert.equal(state.preserved,true);location.hash=url;}};
globalThis.FormData = class {constructor(form){return new URLSearchParams(form.values)}};
function fixture() {
  const form = new Element(); form.values = {city:'Stockholm',date:'2030-10-20',time:'20:15',party:'4'};
  const status = new Element(), results = new Element(), button = new Element();
  const elements = {'form':form,'.availability-status':status,'.availability-results':results,'[type=submit]':button};
  const container = {innerHTML:'',querySelector:selector=>elements[selector]};
  return {form,status,results,container,button};
}
const response = {results:[{restaurantId:'zink',restaurant:'Zink',status:'available',slots:[{time:'20:15',bookingUrl:'https://booking.example/zink'}]}],checkedAt:new Date().toISOString()};
let fetches=0;
globalThis.fetch = async()=>{fetches++;return {ok:true,json:async()=>response}};
const first=fixture();const mounted=mountAvailabilitySearch(first.container,{restaurants:catalogue});
assert.match(first.container.innerHTML, /value="20:15"/);
assert.match(first.container.innerHTML, /value="4" selected/);
await first.form.listeners.get('submit')({preventDefault(){}});
assert.match(first.results.innerHTML,/Zink/);
assert.equal(new URLSearchParams(location.hash.split('?')[1]).get('party'),'4');
mounted.destroy();
const back=fixture(); const restored=mountAvailabilitySearch(back.container,{restaurants:catalogue});
assert.match(back.results.innerHTML,/Zink/,'Back restores the matching response');
assert.equal(fetches,1,'Restoration must not silently submit another request');
back.form.values.party='5'; back.form.listeners.get('input')();
assert.equal(back.results.innerHTML,'','Editing clears stale result cards');
assert.equal(new URLSearchParams(location.hash.split('?')[1]).get('party'),'5');
restored.destroy();

let resolveSlow; let aborted=false;
globalThis.fetch = (_,options)=>{options.signal.addEventListener('abort',()=>{aborted=true});return new Promise(resolve=>{resolveSlow=resolve})};
const slow=fixture();const pendingMount=mountAvailabilitySearch(slow.container,{restaurants:catalogue});
const pending=slow.form.listeners.get('submit')({preventDefault(){}});
slow.form.values.city='Paris';slow.form.listeners.get('change')();
resolveSlow({ok:true,json:async()=>response});await pending;
assert.equal(aborted,true);assert.equal(slow.results.innerHTML,'','A late previous-city response cannot overwrite edited search');
pendingMount.destroy();

// Progressive job responses keep already rendered cards and carry the chosen booking context.
store.clear();
location.hash = '#/availability?city=Stockholm&date=2030-10-20&time=20%3A15&party=4';
const providerResponse = {...response, complete:false, searchId:'job_test', results:[{...response.results[0],provider:'SevenRooms',slots:[{time:'20:15',bookingUrl:'https://www.sevenrooms.com/reservations/zink'}]},{restaurantId:'pending',restaurant:'Pending',status:'pending'}]};
let calls=[];
globalThis.fetch = async url=>{calls.push(url);return {ok:true,json:async()=> calls.length===1 ? providerResponse : {...providerResponse,complete:true,results:[providerResponse.results[0]]}}};
const streaming=fixture(); const streamMount=mountAvailabilitySearch(streaming.container,{restaurants:catalogue});
const streamingDone=streaming.form.listeners.get('submit')({preventDefault(){}});
await new Promise(setImmediate);
const stableCard=streaming.results.children[0];
assert.match(streaming.status.textContent,/Söker vidare/);
assert.match(streaming.results.innerHTML,/#\/restaurant\/zink\?date=2030-10-20&amp;time=20%3A15&amp;party=4/);
await streamingDone;
assert.match(calls[0],/progressive=1/);
assert.match(calls[1],/\/availability\/jobs\/job_test$/);
assert.equal(streaming.results.children[0],stableCard,'Progressive updates preserve unchanged cards');
streamMount.destroy();

// Back from a running search resumes the existing job, instead of launching another search.
store.clear(); calls=[];
globalThis.fetch = async url=>{calls.push(url);return {ok:true,json:async()=>providerResponse}};
const interrupted=fixture();const interruptedMount=mountAvailabilitySearch(interrupted.container,{restaurants:catalogue});
const interruptedDone=interrupted.form.listeners.get('submit')({preventDefault(){}});
await new Promise(setImmediate);interruptedMount.destroy();await interruptedDone;
globalThis.fetch = async url=>{calls.push(url);return {ok:true,json:async()=>({...providerResponse,complete:true,results:[providerResponse.results[0]]})}};
const resumed=fixture();const resumedMount=mountAvailabilitySearch(resumed.container,{restaurants:catalogue});
await new Promise(setImmediate);
assert.equal(calls.length,2);
assert.match(calls[1],/\/availability\/jobs\/job_test$/);
assert.match(resumed.results.innerHTML,/Zink/);
assert.equal(resumed.results.attributes['aria-busy'],'false');
resumedMount.destroy();

// Run production discovery functions in isolation: actual catalogue, old venue IDs, mixed shared IDs.
const app=await fs.readFile(new URL('../js/app.js',import.meta.url),'utf8');
const restaurants=JSON.parse(await fs.readFile(new URL('../data/restaurants.json',import.meta.url),'utf8'));
const registry=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url),'utf8'));
const ctx=vm.createContext({fetch:async()=>({ok:true,json:async()=>restaurants}),getEmbeddedBooking:async()=>{},hasEmbeddedBooking:id=>!!registry[id],currentLang:()=> 'sv',t:key=>key,venueVisible:()=>true,isPublicVenue:()=>true,CATEGORY_GROUPS:[],restaurantCardHTML:r=>'restaurant:'+r.placeId,venueCard:v=>'venue:'+v.venue_id});
vm.runInContext(app.slice(app.indexOf('let DESTINATIONS = []'),app.indexOf('let VENUE_IMAGES = {}')),ctx);
vm.runInContext(app.slice(app.indexOf('const sortRestaurants ='),app.indexOf('async function mountHomeRestaurants')),ctx);
vm.runInContext(app.slice(app.indexOf('const fold ='),app.indexOf('\n',app.indexOf('const fold ='))),ctx);
vm.runInContext(app.slice(app.indexOf('function searchHits(q)'),app.indexOf('let searchCloser =')),ctx);
await vm.runInContext('ensureRestaurantIndex()',ctx);
assert.equal(vm.runInContext('searchHits("Zink")[0].href',ctx),'#/restaurant/curated-STO-zink-italian-cuisine');
vm.runInContext('VENUES = [{venue_id:"old-venue",name:"Old Venue"}]; DESTINATIONS = Array.from({length:20}, (_,i)=>({name:"Zink City "+i,country:""}))',ctx);
assert.equal(vm.runInContext('searchHits("Zink – Italian Cuisine")[0].title',ctx),'Zink – Italian Cuisine');
assert.equal(vm.runInContext('favoriteEntry("old-venue").name',ctx),'Old Venue');
assert.equal(vm.runInContext('favoriteEntry("restaurant:curated-STO-zink-italian-cuisine").name',ctx),'Zink – Italian Cuisine');
assert.equal(vm.runInContext('favoriteId(favoriteEntry("restaurant:curated-STO-zink-italian-cuisine"))',ctx),'restaurant:curated-STO-zink-italian-cuisine');
assert.equal(vm.runInContext('favoriteCard(favoriteEntry("old-venue"))',ctx),'venue:old-venue');
assert.equal(vm.runInContext('favoriteCard(favoriteEntry("restaurant:curated-STO-zink-italian-cuisine"))',ctx),'restaurant:curated-STO-zink-italian-cuisine');
console.log('Discovery tests passed: URL state, cached back navigation, stale request protection, real Zink search, mixed legacy/restaurant favorites.');
// Locale coverage includes default document language, translated cached responses and stable names.
assert.equal(availabilityCopy('fr-CA').language, 'fr');
assert.equal(availabilityCopy('en-US').language, 'en');
assert.equal(availabilityCopy('de').language, 'en');
const localeCases = [
  ['sv', 'Var vill du äta?', 'Sök lediga bord', 'Kontrollerat'],
  ['en', 'Where would you like to eat?', 'Find available tables', 'Checked at'],
  ['es', '¿Dónde quieres comer?', 'Buscar mesas disponibles', 'Comprobado a las'],
  ['fr', 'Où souhaitez-vous manger ?', 'Rechercher des tables disponibles', 'Vérifié à'],
];
for (const [lang, title, action, checked] of localeCases) {
  store.clear();
  document.documentElement = {lang:lang + '-test'};
  location.hash = '#/availability?city=Stockholm&date=2030-10-20&time=20%3A15&party=4';
  const tr = availabilityCopy(lang).text;
  const localized = fixture();
  const localizedMount = mountAvailabilitySearch(localized.container,{restaurants:catalogue});
  assert.ok(localized.container.innerHTML.includes(title));
  assert.ok(localized.container.innerHTML.includes(tr('selectedInitial',{city:'Stockholm'})));
  assert.ok(!localized.container.innerHTML.includes('>' + tr('initial') + '<'),'A selected city must not prompt the user to select a city again');
  assert.ok(localized.container.innerHTML.includes('aria-label="'+action+'"'));
  assert.ok(localized.container.innerHTML.includes('<span aria-hidden="true">→</span>'));
  let finishLocaleRequest;
  globalThis.fetch = ()=>new Promise(resolve=>{finishLocaleRequest=resolve});
  const inFlight=localized.form.listeners.get('submit')({preventDefault(){}});
  assert.equal(localized.button.attributes['aria-label'],action,'The action keeps its accessible name while searching');
  assert.equal(localized.button.attributes['aria-busy'],'true');
  assert.equal(localized.status.textContent,tr('searchingCity',{city:'Stockholm'}));
  finishLocaleRequest({ok:true,json:async()=>({...response,results:[{...response.results[0],partial:true},{restaurantId:'unsupported',status:'unsupported'},{restaurantId:'error',status:'error'},{restaurantId:'unavailable',status:'unavailable'}]})});
  await inFlight;
  assert.ok(localized.status.textContent.includes(checked));
  assert.ok(localized.results.innerHTML.includes(tr('available')));
  assert.ok(localized.results.innerHTML.includes(tr('partialNote')));
  assert.ok(localized.results.innerHTML.includes(tr('unsupported')));
  assert.ok(localized.results.innerHTML.includes(tr('error')));
  assert.ok(localized.results.innerHTML.includes(tr('unavailable')));
  assert.equal(localized.button.attributes['aria-label'],action);
  assert.equal(localized.button.attributes['aria-busy'],'false');
  assert.ok(localized.button.innerHTML.includes('<span aria-hidden="true">→</span>'),'Reset preserves the decorative arrow semantics');
  localized.form.values.party='5'; localized.form.listeners.get('input')();
  assert.equal(localized.status.textContent,tr('edited'));
  assert.equal(localized.button.attributes['aria-label'],action);
  globalThis.fetch=async()=>({ok:false});
  await localized.form.listeners.get('submit')({preventDefault(){}});
  assert.equal(localized.status.textContent,tr('failure'));
  localizedMount.destroy();
}
// Stored data is language neutral: restore a Swedish response into an English interface.
location.hash = '#/availability?city=Stockholm&date=2030-10-20&time=20%3A15&party=4';
const localizedBack=fixture();const localizedBackMount=mountAvailabilitySearch(localizedBack.container,{restaurants:catalogue,lang:'en'});
assert.match(localizedBack.results.innerHTML,/Available times/);
assert.doesNotMatch(localizedBack.results.innerHTML,/Lediga tider|Horaires disponibles/);
localizedBackMount.destroy();
store.clear();
location.hash = '#/availability';
const blankCity=fixture();const blankCityMount=mountAvailabilitySearch(blankCity.container,{restaurants:catalogue,lang:'en'});
assert.ok(blankCity.container.innerHTML.includes(availabilityCopy('en').text('initial')));
blankCityMount.destroy();
console.log('Availability locale tests passed: sv/en/es/fr, selected-city prompt, localized cache and error states, stable accessible search name.');
// Internal fallback retains only the selected booking context; external provider links remain unchanged.
store.clear();
location.hash = '#/availability?city=Stockholm&date=2030-10-20&time=20%3A15&party=4';
globalThis.fetch = async()=>({ok:true,json:async()=>({...response,results:[{...response.results[0],slots:[{time:'20:15'},{time:'20:30',bookingUrl:'javascript:alert(1)'},{time:'20:45',bookingUrl:'https://booking.example/zink?table=window'}]}]})});
const fallback=fixture();const fallbackMount=mountAvailabilitySearch(fallback.container,{restaurants:catalogue,lang:'en'});
await fallback.form.listeners.get('submit')({preventDefault(){}});
assert.match(fallback.results.innerHTML,/#\/restaurant\/zink\?date=2030-10-20&amp;time=20%3A15&amp;party=4/);
assert.match(fallback.results.innerHTML,/#\/restaurant\/zink\?date=2030-10-20&amp;time=20%3A30&amp;party=4/);
assert.match(fallback.results.innerHTML,/href="https:\/\/booking.example\/zink\?table=window"/);
assert.doesNotMatch(fallback.results.innerHTML,/javascript:/);
fallbackMount.destroy();
console.log('Availability fallback tests passed: chosen context retained and external URL preserved.');
