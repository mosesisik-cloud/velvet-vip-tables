// Refs #129. Real app + HTTP server + native Chromium adapter + SQLite journal.
// ONLY the supplier boundary is simulated. Never runs against a remote target.
// Preload mode instruments Chromium's network boundary, NOT the adapter/state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const fishcorner = process.argv.includes('--fishcorner') || process.env.VELVET_TEST_PROVIDER === 'FishCorner';
const pesquiere = process.argv.includes('--pesquiere') || process.env.VELVET_TEST_PROVIDER === 'Pesquiere';
const pirouette = process.argv.includes('--pirouette') || process.env.VELVET_TEST_PROVIDER === 'Pirouette';
const roomVenue = pesquiere || pirouette;
const dekas = process.argv.includes('--dekas') || process.env.VELVET_TEST_PROVIDER === 'DeKas';
const readbackVenue = roomVenue || dekas;
const zenchef = fishcorner || readbackVenue;
const chosenRoom = pirouette ? 52521 : 52372;
const otherRoom = pirouette ? 65674 : 51183;
const alternateRoom = pirouette ? 65674 : 52373;
const chosenRoomName = pirouette ? 'Salle principale' : 'Mazagran salle';
const zenchefShift = dekas ? 494748 : pirouette ? 189024 : pesquiere ? 136503 : 545372;
const zenchefRid = dekas ? '386643' : pirouette ? '363313' : pesquiere ? '362908' : '388090';
const zenchefName = dekas ? 'DeKas' : pirouette ? 'Pirouette' : pesquiere ? 'Pesquiere' : 'FishCorner';
const rooms = pirouette ? [{id:52521,name:'Salle principale'},{id:65674,name:'Terasse'}] : [{id:51183,name:'La Pesquiere'},{id:52372,name:'Mazagran salle'},{id:52373,name:'Mazagran terrasse'}];
const noema = process.argv.includes('--noema') || process.env.VELVET_TEST_PROVIDER === 'Noema';
const ciccios = process.argv.includes('--ciccios') || process.env.VELVET_TEST_PROVIDER === 'Ciccios';
const riche = process.argv.includes('--riche') || process.env.VELVET_TEST_PROVIDER === 'Riche';
const sturehof = process.argv.includes('--sturehof') || process.env.VELVET_TEST_PROVIDER === 'Sturehof';
const beirut = process.argv.includes('--beirut') || process.env.VELVET_TEST_PROVIDER === 'Beirut';
const balzac = process.argv.includes('--balzac') || process.env.VELVET_TEST_PROVIDER === 'Balzac';
const kommendoren = process.argv.includes('--kommendoren') || process.env.VELVET_TEST_PROVIDER === 'Kommendoren';
const astrid = process.argv.includes('--astrid') || process.env.VELVET_TEST_PROVIDER === 'Astrid';
const vau = process.argv.includes('--vau') || process.env.VELVET_TEST_PROVIDER === 'Vau';
const boqueria = process.argv.includes('--boqueria') || process.env.VELVET_TEST_PROVIDER === 'Boqueria';
const dagmar = process.argv.includes('--dagmar') || process.env.VELVET_TEST_PROVIDER === 'Dagmar';
const guestLunch = beirut || balzac || kommendoren || astrid || vau || boqueria || dagmar;
const italiano = process.argv.includes('--italiano') || process.env.VELVET_TEST_PROVIDER === 'Italiano';
const nativeGuest = guestLunch || italiano;
const guestChoice = ciccios || nativeGuest;
const contactFinal = riche || sturehof;
assert.ok([fishcorner,pesquiere,pirouette,dekas,noema,ciccios,riche,sturehof,beirut,balzac,kommendoren,astrid,vau,boqueria,dagmar,italiano].filter(Boolean).length <= 1, 'Choose one named provider scenario');
const receiptMode = noema || guestChoice || contactFinal;
const receiptName = italiano ? 'Italiano' : dagmar ? 'Villa Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau De Ville' : astrid ? 'Brasserie Astrid' : kommendoren ? 'Kommendören' : balzac ? 'Brasserie Balzac' : beirut ? 'Beirut Café' : sturehof ? 'Sturehof' : riche ? 'Riche' : ciccios ? "Ciccio's" : 'Noema';
const receiptCode = italiano ? 'synthetic-italiano-only' : dagmar ? 'synthetic-dagmar-only' : boqueria ? 'synthetic-boqueria-only' : vau ? 'synthetic-vau-only' : astrid ? 'synthetic-astrid-only' : kommendoren ? 'synthetic-kommendoren-only' : balzac ? 'synthetic-balzac-only' : beirut ? 'synthetic-beirut-only' : sturehof ? 'synthetic-sturehof-only' : riche ? 'synthetic-riche-only' : ciccios ? 'synthetic-ciccios-only' : 'synthetic-noema-only';
const mealId = italiano ? 22890 : dagmar ? 63588 : boqueria ? 22 : vau ? 22476 : astrid ? 55508 : kommendoren ? 3501 : balzac ? 354 : beirut ? 30471 : sturehof ? 3913 : riche ? 7180 : ciccios ? 2379 : noema ? 35204 : 9778;
const mealType = dagmar ? 0 : noema || guestLunch || contactFinal ? 2 : 3;
const restaurantId = italiano ? 'curated-STO-italiano' : dekas ? 'curated-AMS-de-kas' : dagmar ? 'curated-STO-villa-dagmar' : boqueria ? 'curated-STO-boqueria' : vau ? 'curated-STO-vau-de-ville' : astrid ? 'curated-STO-brasserie-astrid' : pirouette ? 'osm-MCO-pirouette' : kommendoren ? 'curated-STO-kommendoren' : balzac ? 'curated-STO-balzac' : beirut ? 'curated-STO-beirut-cafe' : pesquiere ? 'osm-STT-la-pesquiere-le-mazagran-et-lou-revelen' : sturehof ? 'curated-STO-sturehof' : fishcorner ? 'osm-SBH-fishcorner' : riche ? 'curated-STO-riche' : ciccios ? 'curated-STO-ciccios' : noema ? 'curated-STO-noema' : 'curated-STO-zink-italian-cuisine';
const venue = JSON.parse(fs.readFileSync(path.join(root, 'api/bokabord-restaurants.json')))[receiptMode ? restaurantId : 'curated-STO-zink-italian-cuisine'];
const saveUrl = 'https://app.bokabord.se/reservation/api/booking/saveBooking';
const date = '2030-01-15';
const bookingTime = noema || guestLunch || contactFinal ? '12:00' : '19:00';
const childMode = process.env.VELVET_INTEGRATED_SUPPLIER_FIXTURE === 'child';

// Sanitized native DOM/SSR contract from the canonical provider tests. No supplier JS.
function deKasState(date) {
  const offer={id:118785,name:'Lunch',name_translations:{en:'Lunch'},description:{en:'Native menu terms'},
    has_prepayment:false,payment_type:'none',charge_per_guests:null,has_duration:false,
    config:{is_same_for_all:true,is_limited_to_pax:true,min_pax_available:1,max_pax_available:null},
    stock:6,possible_guests:[2],available_rooms:{2:[138396,138397]},bookable_from:null,bookable_to:null};
  const slot={name:'12:30',closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,possible_guests:[],available_rooms:[],offers:[{id:offer.id,stock:offer.stock,config:{...offer.config},possible_guests:[2],available_rooms:{2:[138396,138397]},has_prepayment:false,payment_type:'none',has_duration:false,bookable_from:null,bookable_to:null}]};
  const shift={id:494748,name:'Lunch',closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,shift_slots:[slot],offers:[offer],
    charge_param:null,prepayment_param:{is_web_booking_askable:true,min_guests:7,charge_per_guests:5000,deposit_type:'fixed'},
    is_offer_required:true,offer_required_from_pax:null,confirmation:{is_auto:true,is_auto_until:null}};
  return {restaurantId:'386643',initializedSSR:true,restaurantTimezone:'Europe/Amsterdam',isDisabled:0,currency:'EUR',language:'en',isRoomMandatory:false,
    wish:{day:date,pax:2,waiting_list:false,offers:[],room_id:null},mandatoryFields:{firstname:'required'},
    offers:[{id:118785,is_active:true,is_private:false,has_prepayment:false,has_duration:false}],dailyAvailabilities:{[date]:{date,shifts:[shift]}}};
}

function deKasDocument(url) {
  const state=deKasState(date),offers=url.pathname==='/offers';
  if(offers)state.wish.slot='12:30';
  if(process.env.VELVET_TEST_OUTCOME==='rotated-offer')state.restaurantComment='Updated native terms';
  const data={page:offers?'/offers':'/results',query:Object.fromEntries(url.searchParams),props:{initialState:{appStoreState:state}}};
  const form='<div>Lunch</div><span id="offer-count"> × 2</span><div>Until 3:30 PM</div>'+
    ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('')+
    '<div class="iti"><button class="iti__selected-country" title="France (+33)" aria-label="Selected country France"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div>'+
    '<label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox"><input type="checkbox">Native test terms</label><button data-testid="validate-btn" onclick="fixtureSubmit()">Reserve</button>';
  return `<html><meta charset="utf-8"><body><h1>De Kas LOCAL TEST</h1><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>${offers?'<div id="controls"><span>Lunch</span><span>Native menu terms</span><button data-testid="add-to-cart-btn">Add</button><button disabled data-testid="disabled-continue-btn">Continue</button><button hidden data-testid="go-to-form-btn">Validate</button></div>':''}<script>
  if(${offers}){
    document.querySelector('[data-testid="add-to-cart-btn"]').onclick=()=>{document.querySelector('[data-testid="add-to-cart-btn"]').remove();document.querySelector('[data-testid="disabled-continue-btn"]').remove();document.querySelector('[data-testid="go-to-form-btn"]').hidden=false;};
    document.querySelector('[data-testid="go-to-form-btn"]').onclick=()=>{history.replaceState(null,'',location.href.replace('/offers?','/form?'));document.querySelector('#controls').innerHTML=${JSON.stringify(form)};};
  }
  function fixtureSubmit(){
    const value=k=>document.querySelector('[data-testid="'+k+'-input"]').value;
    const firstname=value('firstname'),lastname=value('lastname'),email=value('email'),phone=value('phone');
    const payload={day:${JSON.stringify(date)},nb_guests:2,time:'12:30',lang:'en',firstname,lastname,email,phone_number:phone,civility:'mr',country:'fr',comment:'',custom_field:{},custom_field_v2:[],customersheet:{firstname,lastname,email,phone,civility:'mr',country:'fr',lang:'en',optins:[]},offers:[{offer_id:118785,count:2}],partner_id:'1001',type:'web'};
    ${process.env.VELVET_TEST_OUTCOME==='wrong-request-offer'?'payload.offers[0].offer_id=999;':''}
    fetch('https://bookings-middleware.zenchef.com/booking?restaurantId=386643',{method:'POST',body:JSON.stringify(payload)}).catch(()=>{});
  }</script></body></html>`;
}
function zenchefDocument(address) {
  const url = new URL(address), form = url.pathname === '/form';
  const slot = { name:'12:30',closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,possible_guests:[2],available_rooms:{2:roomVenue?rooms.map(room=>room.id):[1]} };
  const shift = { id:zenchefShift,closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,shift_slots:[slot],
    charge_param:pirouette?{is_web_booking_askable:true,min_guests:3,charge_per_guests:50}:roomVenue?{is_web_booking_askable:false,min_guests:1,charge_per_guests:10}:null,prepayment_param:null,is_offer_required:false,confirmation:{is_auto:true,is_auto_until:null} };
  const state = { restaurantId:zenchefRid,initializedSSR:true,restaurantTimezone:roomVenue?'Europe/Paris':'America/Guadeloupe',isDisabled:0,
    wish:{day:date,pax:2,waiting_list:false,offers:[],room_id:roomVenue&&form?Number(url.searchParams.get('room_id')):null,...(form?{slot:'12:30'}:{})},
    rooms:roomVenue?rooms:undefined,mandatoryFields:{firstname:'required'},isRoomMandatory:roomVenue,dailyAvailabilities:{[date]:{date,shifts:[shift]}} };
  const data = {page:form?'/form':'/results',query:Object.fromEntries(url.searchParams),props:{initialState:{appStoreState:state}}};
  return `<html><meta charset="utf-8"><body><h1>${zenchefName} LOCAL TEST — no real booking</h1>${roomVenue&&form?`<div>${rooms.find(room=>room.id===Number(url.searchParams.get('room_id')))?.name}</div>`:''}${pirouette&&form?`<div id="seating">Jusqu&#39;à 21:00</div>`:''}<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
  ${form ? ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('') +
    `<div class="iti"><button type="button" class="iti__selected-country" title="France (+33)" aria-label="Selected country France"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div>` +
    `<label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox"><input type="checkbox">Synthetic test terms</label>
    <button data-testid="validate-btn">Reserve fixture</button><script>
    document.querySelector('[data-testid="validate-btn"]').onclick=()=>{
      const value=k=>document.querySelector('[data-testid="'+k+'-input"]').value;
      const firstname=value('firstname'),lastname=value('lastname'),email=value('email'),phone=value('phone');
      const payload={day:${JSON.stringify(date)},nb_guests:2,time:'12:30',lang:'fr',firstname,lastname,civility:'mr',country:'fr',phone_number:phone,email,
        comment:'',custom_field:{},custom_field_v2:[],customersheet:{firstname,lastname,civility:'mr',phone,email,
        optins:[{type:'review_mail',value:true},{type:'review_sms',value:true}],country:'fr',lang:'fr'},offers:[],partner_id:'1001',type:'web'${roomVenue?",wish:{booking_room_id:"+Number(url.searchParams.get('room_id'))+"}":''}};
      ${roomVenue && process.env.VELVET_TEST_OUTCOME === 'missing-request-room' ? 'delete payload.wish;' : ''}
      ${roomVenue && process.env.VELVET_TEST_OUTCOME === 'mismatch-request-room' ? 'payload.wish.booking_room_id='+otherRoom+';' : ''}
      ${pirouette && process.env.VELVET_TEST_OUTCOME === 'code-request' ? "payload.custom_field={code:'fixture-code'};" : ''}
      fetch('https://bookings-middleware.zenchef.com/booking?restaurantId=${zenchefRid}',{method:'POST',body:JSON.stringify(payload)}).catch(()=>{});
    };</script>` : ''}</body></html>`;
}

function supplierHtml() {
  return `<!doctype html><html><meta charset="utf-8"><body ng-app="fixture">
<style>body{font:16px Arial;margin:20px}button,input,textarea{box-sizing:border-box;min-height:40px;width:260px;display:block;margin:8px 0}button{background:#eee}h1,h2{font-size:22px}#party{position:absolute;top:90px}#date{position:absolute;top:150px}#slot{position:absolute;top:210px}</style>
<main id="screen"></main><script>
const q={hash:${JSON.stringify(venue.hash)},mealid:${mealId},date:'',time:'',amount:0,firstname:'',lastname:'',email:'',phone:'',comment:'',products:[],waitlist:false,giftcard:null,linked_meals:[],bookingid:null,terms:{general:true,restaurant:false,bokabord:false}};
const model={custom_request:false,settings:{custom_request:${astrid}},meal:{bullets:{},mandatory_products:false},getQuery:()=>q};
window.angular={element:()=>({injector:()=>({get:key=>key==='Booking'?model:key==='$http'?{pendingRequests:[]}:{$$phase:false}}),scope:()=>({isAjaxRequest:()=>false,phoneValid:()=>!!document.querySelector('[name=phone]')?.value.match(/^\\+46700000000$/)})})};
if(${contactFinal || nativeGuest}){
 window.$={fn:{intlTelInput:{getCountryData:()=>[{iso2:'se',dialCode:'46',name:'Sweden'}]}}};
 window.intlTelInputUtils={isValidNumber:(value,iso)=>iso==='se'&&value==='+46700000000',formatNumber:(value,iso)=>iso==='se'?value:''};
}
const screen=document.querySelector('#screen');
screen.innerHTML=${JSON.stringify(`<h1>${receiptMode ? receiptName : 'Zink'} FIXTURE — no real booking</h1><button id="party">2 gäster</button><button id="date">2030-01-15</button><button id="slot" hidden>${bookingTime} TESTDATA</button>`)};
document.querySelector('#party').onclick=()=>{q.amount=2;document.querySelector('#party').textContent='2 gäster valda';};
document.querySelector('#date').onclick=async()=>{q.date='2030-01-15';const r=await fetch('/reservation/api/booking/getTimes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:q.date,amount:q.amount,hash:q.hash})});const data=await r.json();document.querySelector('#slot').hidden=!data.times.includes('${bookingTime}');};
document.querySelector('#slot').onclick=()=>{q.time='${bookingTime}';contact();};
function contact(){screen.innerHTML='<h2>Kontaktuppgifter</h2><p>FIXTURE supplier form</p>'+['firstname','lastname','email','phone'].map(n=>'<label>'+n+'<input name="'+n+'" value=""></label>').join('')+'<textarea ng-model="booking.comment"></textarea>${contactFinal ? '<a id="terms-link" href="https://www.waiteraid.com/terms/fixture-a">Fixture terms</a>' : ''}<button id="next">Nästa</button>';
 if(${contactFinal || nativeGuest}){const phone=document.querySelector('[name=phone]');phone.className='phoneField';const wrapper=document.createElement('div');wrapper.className='intl-tel-input';phone.before(wrapper);wrapper.innerHTML='<div class="selected-flag" title="Sweden: +46"><span class="iti-flag se"></span></div>';wrapper.append(phone);}
 // The native contact-final form copies its phone widget into Booking only on Next.
 for(const input of document.querySelectorAll('input,textarea'))input.oninput=()=>{if(!(${contactFinal || nativeGuest}&&input.name==='phone'))q[input.name||'comment']=input.value;};
 const dispatch=async()=>{if(${contactFinal})console.log('fixture-contact-final-click');try{const response=await fetch(${JSON.stringify(saveUrl)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});const data=await response.json();if(${receiptMode}){if(${JSON.stringify(process.env.VELVET_TEST_OUTCOME)}!=='missing-receipt')location.assign('/reservation/booking/?code='+encodeURIComponent(data.booking.short_code)+'&new=1');else screen.innerHTML='<h2>FIXTURE response only</h2>';}else{history.replaceState({},'', '/reservation/booking/fixture');screen.innerHTML='<h2>FIXTURE response received</h2>';}}catch{screen.innerHTML='<h2>FIXTURE network interrupted</h2>';}};
 const review=()=>{screen.innerHTML='<h2>Kontrollera din bokning</h2><p>FIXTURE '+q.date+' '+q.time+' '+q.amount+' guests${guestChoice ? ' — guest choice completed' : ''}</p><button id="final">Slutför bokningen</button>';document.querySelector('#final').onclick=dispatch;};
 document.querySelector('#next').onclick=()=>{if(${contactFinal}){q.phone=document.querySelector('[name="phone"]').value;q.country_code='46';q.dial_code='46';dispatch();}else if(${guestChoice}){if(${nativeGuest}){q.phone=document.querySelector('[name=phone]').value;q.country_code='46';q.dial_code='46';}screen.innerHTML='<h2>Fortsätt som gäst</h2><button id="guest">Fortsätt utan konto</button>';document.querySelector('#guest').onclick=review;}else review();};}
</script></body></html>`;
}

if (childMode) {
  // Refuse to act as an arbitrary server preload outside this spawned fixture.
  assert.equal(typeof process.send, 'function');
  assert.ok(process.env.VELVET_PLAYWRIGHT_DB?.startsWith(process.env.VELVET_TEST_DIRECTORY + path.sep));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (address, options) => {
    const url = new URL(typeof address === 'string' || address instanceof URL ? address : address.url);
    if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      process.send?.({ kind: 'blocked-node-network', host: url.hostname });
      return Promise.reject(new Error('fixture_network_denied'));
    }
    return originalFetch(address, options);
  };
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async options => {
    process.send?.({ kind: 'browser-launch-start', at: Date.now() });
    const browser = await launch(options);
    process.send?.({ kind: 'browser-launch-ready', at: Date.now() });
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async options => {
      process.send?.({ kind: 'browser-context-start', at: Date.now() });
      const context = await newContext({ ...options, serviceWorkers: 'block' });
      process.send?.({ kind: 'browser-context-ready', at: Date.now() });
      if (zenchef) context.on('page', page => {
        if(dekas)process.on('message',message=>{
          if(message.kind==='fixture-change-offer')page.evaluate(()=>{
            const element=document.querySelector('#__NEXT_DATA__'),data=JSON.parse(element.textContent);
            const state=data.props.initialState.appStoreState;
            Object.values(state.dailyAvailabilities)[0].shifts[0].offers[0].description.en='Changed native menu';
            element.textContent=JSON.stringify(data);
          }).then(()=>process.send?.({kind:'fixture-offer-changed'}));
        });
        if(pirouette)process.on('message',message=>{
          if(message.kind==='fixture-change-seating')page.evaluate(()=>document.querySelector('#seating').textContent="Jusqu'à 20:30")
            .then(()=>process.send?.({kind:'fixture-seating-changed'}));
        });
        page.on('pageerror', error => process.send?.({kind:'supplier-fixture-script-error',message:error.message}));
        page.on('domcontentloaded', () => page.evaluate(() => ({
          path:location.pathname,fields:[...document.querySelectorAll('[data-testid]')].map(el=>el.getAttribute('data-testid')),
          text:document.body?.innerText.slice(0,160),
        })).then(state=>process.send?.({kind:'supplier-fixture-dom',...state})).catch(()=>{}));
      });
      if (contactFinal) context.on('page', page => {process.on('message',message=>{
        if(message.kind==='fixture-check-phone-model')page.evaluate(()=>{
          const query=window.angular.element(document.body).injector().get('Booking').getQuery();
          return {phone:query.phone,countryCode:query.country_code??null,dialCode:query.dial_code??null};
        }).then(model=>process.send?.({kind:'fixture-phone-model',model}));
        if(message.kind==='fixture-change-terms')page.evaluate(()=>document.querySelector('#terms-link').href='https://www.waiteraid.com/terms/fixture-b')
          .then(()=>process.send?.({kind:'fixture-terms-changed'}));
      });page.on('console', message => {
        if (message.text()==='fixture-contact-final-click') process.send?.({kind:'provider-final-click'});
      });});
      const route = context.route.bind(context);
      if(astrid)context.on('page',page=>process.on('message',message=>{
        if(message.kind==='fixture-custom-request')page.evaluate(async()=>{
          try{await fetch('/reservation/api/booking/sendCustomRequest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({custom_request:true})});return false;}
          catch{return true;}
        }).then(blocked=>process.send?.({kind:'fixture-custom-request-result',blocked}));
      }));
      let createdBooking;
      await context.routeWebSocket('**/*', socket => socket.close());
      // A final guard also catches requests not registered by the production adapter.
      await route('**/*', request => request.abort());
      context.route = async (pattern, handler, ...rest) => route(pattern, intercepted => {
        const boundary = async () => {
          const request = intercepted.request();
          const url = new URL(request.url());
          if (receiptMode && request.method() === 'GET' && url.origin === 'https://app.bokabord.se' && url.pathname === '/reservation/booking/') {
            assert.equal(request.resourceType(),'document'); assert.equal(request.isNavigationRequest(),true);
            assert.equal(request.frame().parentFrame(),null); assert.equal(url.searchParams.get('code'),receiptCode);
            process.send?.({kind:'supplier-receipt-navigation',outcome:process.env.VELVET_TEST_OUTCOME});
            if (process.env.VELVET_TEST_OUTCOME === 'confirmed') await new Promise((resolve,reject)=>{
              const timer=setTimeout(()=>{process.off('message',receive);reject(new Error('fixture_receipt_gate_timeout'));},15000);
              const receive=message=>{if(message.kind==='release-provider-receipt'){clearTimeout(timer);process.off('message',receive);resolve();}};
              process.on('message',receive);
            });
            const name = process.env.VELVET_TEST_OUTCOME === 'unverified-success' ? 'Wrong restaurant' : receiptName;
            return intercepted.fulfill({status:200,contentType:'text/html',body:`<html><meta charset="utf-8"><body><div>Tack för din bokning.</div><div>Du är nu klar och bekräftelse har skickats via epost.</div><div>${name}</div><div>2 pers. (${italiano ? 'Dining Room' : ciccios ? 'Matsal' : boqueria ? 'LUNCH' : 'Lunch'})</div><div>Bokningsreferens</div><div># 999999999</div><div>Gästinformation</div></body></html>`});
          }
          if (request.method() === 'GET' && request.url() === venue.url) {
            process.send?.({ kind: 'supplier-document' });
            return intercepted.fulfill({ status: 200, contentType: 'text/html', body: supplierHtml() });
          }
          if (request.method() === 'POST' && url.origin === 'https://app.bokabord.se' && url.pathname === '/reservation/api/booking/getTimes') {
            process.send?.({ kind: 'supplier-slots' });
            return intercepted.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ times: [bookingTime] }) });
          }
          if (request.method() === 'POST' && request.url() === saveUrl) {
            // Reaching this boundary means the REAL adapter authorized the call
            // and the REAL journal reserved it. It is fulfilled/aborted, never sent.
            process.send?.({ kind: 'supplier-submit', outcome: process.env.VELVET_TEST_OUTCOME });
            if (process.env.VELVET_TEST_OUTCOME === 'timeout') return intercepted.abort('connectionreset');
            const approved = request.postDataJSON();
            // Synthetic receipt shape from the reviewed policy, no historical
            // guest data, reference, shortcode or capability URL is copied.
            const booking = { ...approved, id: 999999999, status: 1,
              restid: process.env.VELVET_TEST_OUTCOME === 'confirmed' ? 1359 : 9999,
              meal: { type: mealType, bullets: {} }, waitlist: 0, require_noshow: false,
              ...(receiptMode ? {short_code:receiptCode} : {}),
              phone: Number(String(approved.phone).replace(/\D/g, '')),
            };
            return intercepted.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, booking }) });
          }
          process.send?.({ kind: 'unexpected-supplier-request', method: request.method(), path: url.pathname });
          return intercepted.abort();
        };
        const proxy = new Proxy(intercepted, { get(target, key) {
          if (key === 'continue' || key === 'fallback') return boundary;
          if (key === 'fetch') return async options => {
            if (receiptMode && target.request().method()==='POST' && target.request().url()===saveUrl) {
              if(nativeGuest){
                const {DatabaseSync}=await import('node:sqlite');
                const db=new DatabaseSync(process.env.VELVET_PLAYWRIGHT_DB,{readOnly:true});
                try{
                  const attempts=db.prepare('SELECT payload FROM playwright_attempts_v1').all().map(row=>JSON.parse(row.payload));
                  assert.ok(attempts.some(attempt=>attempt.restaurantId===restaurantId&&attempt.status==='unknown'&&attempt.phase==='booking'),'Durable unknown reservation must exist before supplier network dispatch');
                  process.send?.({kind:'durable-before-provider-dispatch'});
                }finally{db.close();}
              }
              assert.equal(options.maxRedirects,0); assert.equal(options.maxRetries,0);
              process.send?.({kind:'supplier-submit',outcome:process.env.VELVET_TEST_OUTCOME});
              const approved=target.request().postDataJSON();
              const data={success:true,booking:{...approved,id:999999999,status:1,meal:{type:mealType,bullets:{}},waitlist:0,require_noshow:false,
                short_code:receiptCode,phone:Number(String(approved.phone).replace(/\D/g,''))}};
              if(dagmar&&process.env.VELVET_TEST_OUTCOME==='wrong-meal')data.booking.mealid=63589;
              if(dagmar&&process.env.VELVET_TEST_OUTCOME==='requirement')data.booking.require_noshow=true;
              if(italiano){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='excluded-lunch')data.booking.mealid=13836;
                if(outcome==='excluded-bar')data.booking.mealid=56070;
                if(outcome==='wrong-type')data.booking.meal.type=2;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='requirement')data.booking.require_noshow=true;
              }
              const body=JSON.stringify(data);
              return {status:()=>200,ok:()=>true,json:async()=>data,body:async()=>Buffer.from(body),
                headers:()=>({'content-type':'application/json'}),url:()=>saveUrl,
                fixture:{status:200,contentType:'application/json',body}};
            }
            if (!zenchef) throw new Error('fixture_forbids_route_fetch');
            const request = target.request(), url = new URL(request.url());
            assert.equal(options.maxRedirects, 0);
            let body, contentType, responseStatus=200;
            if (request.method() === 'GET' && url.origin === 'https://bookings.zenchef.com'
              && ['/results','/form',...(dekas?['/offers']:[])].includes(url.pathname) && url.searchParams.get('rid') === zenchefRid) {
              process.send?.({kind:'supplier-document',page:url.pathname});
              body = dekas ? deKasDocument(new URL(request.url())) : zenchefDocument(request.url()); contentType = 'text/html';
            } else if (request.method() === 'POST' && request.url() === 'https://bookings-middleware.zenchef.com/booking?restaurantId='+zenchefRid) {
              assert.equal(options.maxRetries, 0);
              assert.deepEqual(JSON.parse(options.postData).customersheet.optins, []);
              if(dekas){
                const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(process.env.VELVET_PLAYWRIGHT_DB,{readOnly:true});
                try{
                  const attempt=JSON.parse(db.prepare('SELECT payload FROM playwright_attempts_v1 ORDER BY rowid DESC LIMIT 1').get().payload);
                  assert.equal(attempt.restaurantId,restaurantId);assert.equal(attempt.status,'unknown');
                  const offer=attempt.details.offer;
                  assert.equal(offer.offerId,118785);assert.equal(offer.count,2);assert.equal(offer.mealPrice,null);assert.equal(offer.depositApplies,false);assert.match(offer.version,/^[a-f0-9]{64}$/);
                  assert.deepEqual(JSON.parse(options.postData).offers,[{offer_id:offer.offerId,count:offer.count}]);
                  process.send?.({kind:'durable-offer-before-dispatch',offer});
                }finally{db.close();}
              }
              process.send?.({kind:'supplier-submit',outcome:process.env.VELVET_TEST_OUTCOME});
              if (process.env.VELVET_TEST_OUTCOME === 'timeout') throw new Error('synthetic_lost_supplier_reply');
              createdBooking={id:999999998,uuid:'synthetic-zenchef-only',payload:JSON.parse(options.postData)};
              // The creation response deliberately contains no room evidence.
              body = JSON.stringify({id:createdBooking.id,uuid:createdBooking.uuid,status:'confirmed',...(process.env.VELVET_TEST_OUTCOME.startsWith('post-echo-')?{wish:{booking_room_id:process.env.VELVET_TEST_OUTCOME==='post-echo-mismatch'?otherRoom:createdBooking.payload.wish.booking_room_id}}:{})}); contentType = 'application/json';
            } else if(readbackVenue && request.method()==='GET' && url.origin==='https://bookings-middleware.zenchef.com' && url.pathname.startsWith('/bookings/')) {
              assert.ok(createdBooking,'Readback must follow this context\'s own POST');
              assert.equal(request.url(),`https://bookings-middleware.zenchef.com/bookings/${createdBooking.uuid}?restaurantId=${zenchefRid}`);
              assert.equal(options.maxRetries,0);assert.equal(options.timeout,8000);
              const outcome=process.env.VELVET_TEST_OUTCOME;
              process.send?.({kind:'supplier-own-readback',outcome});
              if(outcome==='confirmed')await new Promise((resolve,reject)=>{
                const timer=setTimeout(()=>{process.off('message',receive);reject(Error('fixture_readback_gate_timeout'));},5000);
                const receive=message=>{if(message.kind==='release-own-readback'){clearTimeout(timer);process.off('message',receive);resolve();}};
                process.on('message',receive);
              });
              if(outcome==='readback-error')throw Error('synthetic_readback_transport_error');
              const payload=createdBooking.payload;
              const data={id:createdBooking.id,uuid:createdBooking.uuid,status:'confirmed',day:payload.day,shift_date:payload.day,time:payload.time,nb_guests:payload.nb_guests,...(dekas?{booking_offers:[{offer_id:118785,count:2}]}:{wish:{booking_room_id:payload.wish.booking_room_id}})};
              if(outcome==='missing-receipt-offer')delete data.booking_offers;
              if(outcome==='wrong-receipt-offer')data.booking_offers[0].offer_id=999;
              if(outcome==='wrong-receipt-count')data.booking_offers[0].count=1;
              if(outcome==='missing-receipt-room')delete data.wish;
              if(outcome==='mismatch-receipt-room'||outcome==='post-echo-bad-readback')data.wish.booking_room_id=otherRoom;
              if(outcome==='mismatch-readback-id')data.id=999999997;
              if(outcome==='mismatch-readback-uuid')data.uuid='different-synthetic-booking';
              if(outcome==='mismatch-readback-date')data.day='2030-01-16';
              if(outcome==='readback-http-error')responseStatus=503;
              body=JSON.stringify(data);contentType='application/json';
            } else {
              process.send?.({kind:'unexpected-supplier-request',method:request.method(),path:url.pathname});
              throw new Error('fixture_network_denied');
            }
            return {status:()=>responseStatus,json:async()=>JSON.parse(body),fixture:{status:responseStatus,contentType,body,headers:{'access-control-allow-origin':'https://bookings.zenchef.com'}}};
          };
          if (key === 'fulfill' && (zenchef || receiptMode)) return options => {
            assert.ok(options.response?.fixture, 'Only locally constructed responses may be fulfilled');
            return target.fulfill(options.response.fixture);
          };
          if (key === 'abort') return async (...args) => {
            if(astrid && new URL(target.request().url()).pathname.endsWith('/sendCustomRequest'))process.send?.({kind:'adapter-blocked-custom-request'});
            if (target.request().url() === saveUrl) process.send?.({ kind: 'adapter-blocked-submit' });
            return target.abort(...args);
          };
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value;
        } });
        return handler(proxy);
      }, ...rest);
      return context;
    };
    return browser;
  };
} else {
  await main();
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-integrated-'));
  const messages = [];
  const apiCalls = [];
  let child, backend, browser, base, childLog = '';
  const staticServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, base || 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname).slice(1);
    const file = path.resolve(root, relative);
    if (['GET', 'HEAD'].includes(req.method) && file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' })[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      return fs.createReadStream(file).pipe(res);
    }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    let action;
    try { action = JSON.parse(body).type; } catch {}
    const call = { path: url.pathname, method: req.method, action, started: Date.now() };
    apiCalls.push(call);
    const proxy = http.request(backend + url.pathname + url.search, { method: req.method, headers: { ...req.headers, host: new URL(backend).host } }, upstream => {
      call.status = upstream.statusCode;
      call.responseMs = Date.now() - call.started;
      const diagnostic = [];
      upstream.on('data', chunk => { if (upstream.statusCode >= 400) diagnostic.push(chunk); });
      upstream.on('end', () => {
        if (diagnostic.length) {
          try { call.error = JSON.parse(Buffer.concat(diagnostic)).error; } catch {}
        }
      });
      res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
    });
    proxy.on('error', () => { res.writeHead(502); res.end('{}'); });
    proxy.end(body);
  });
  await new Promise(resolve => staticServer.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${staticServer.address().port}`;
  async function start(outcome) {
    const portHolder = http.createServer();
    await new Promise(resolve => portHolder.listen(0, '127.0.0.1', resolve));
    const port = portHolder.address().port;
    await new Promise(resolve => portHolder.close(resolve));
    backend = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--import', import.meta.url, 'api/server.mjs'], { cwd: root, env: {
      ...process.env, VELVET_INTEGRATED_SUPPLIER_FIXTURE: 'child', VELVET_TEST_DIRECTORY: directory,
      VELVET_TEST_PROVIDER: italiano ? 'Italiano' : dekas ? 'DeKas' : dagmar ? 'Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau' : astrid ? 'Astrid' : pirouette ? 'Pirouette' : kommendoren ? 'Kommendoren' : balzac ? 'Balzac' : beirut ? 'Beirut' : pesquiere ? 'Pesquiere' : sturehof ? 'Sturehof' : fishcorner ? 'FishCorner' : riche ? 'Riche' : ciccios ? 'Ciccios' : noema ? 'Noema' : 'BokaBord',
      VELVET_NOEMA_RECEIPT: noema ? 'enabled' : 'disabled',
      VELVET_CICCIOS_RECEIPT: ciccios ? 'enabled' : 'disabled',
      VELVET_RICHE_RECEIPT: riche ? 'enabled' : 'disabled',
      VELVET_STUREHOF_RECEIPT: sturehof ? 'enabled' : 'disabled',
      VELVET_BEIRUT_RECEIPT: beirut ? 'enabled' : 'disabled',
      VELVET_BALZAC_RECEIPT: balzac ? 'enabled' : 'disabled',
      VELVET_KOMMENDOREN_RECEIPT: kommendoren ? 'enabled' : 'disabled',
      VELVET_ASTRID_RECEIPT: astrid ? 'enabled' : 'disabled',
      VELVET_VAU_RECEIPT: vau ? 'enabled' : 'disabled',
      VELVET_BOQUERIA_RECEIPT: boqueria ? 'enabled' : 'disabled',
      VELVET_DAGMAR_RECEIPT: dagmar ? 'enabled' : 'disabled',
      VELVET_ITALIANO_RECEIPT: italiano ? 'enabled' : 'disabled',
      VELVET_ZENCHEF_FISHCORNER: zenchef ? 'live' : 'disabled',
      VELVET_ZENCHEF_PESQUIERE: roomVenue ? 'live' : 'disabled',
      VELVET_ZENCHEF_PIROUETTE: pirouette ? 'live' : 'disabled',
      VELVET_ZENCHEF_DEKAS: dekas ? 'live' : 'disabled',
      VELVET_TEST_OUTCOME: outcome, PORT: String(port), PUBLIC_URL: base,
      VELVET_CRAWL: '0', VELVET_BOKABORD_MIRROR: 'live', VELVET_PLAYWRIGHT_INSPECTION: 'disabled',
      VELVET_DATA: path.join(directory, 'store.json'), VELVET_PAY: path.join(directory, 'pay.json'),
      VELVET_IDV: path.join(directory, 'idv'), VELVET_BOOKINGS_DB: path.join(directory, 'bookings.sqlite'),
      VELVET_PLAYWRIGHT_DB: path.join(directory, 'attempts.sqlite'),
    }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.on('message', message => messages.push(message));
    child.stdout.on('data', chunk => { childLog += chunk; });
    child.stderr.on('data', chunk => { childLog += chunk; });
    // Cold Windows process/module startup can exceed 15s under concurrent runs.
    // Wait for health once; never retry a booking or replace a failed child.
    const startupDeadline = Date.now() + 60_000;
    while (Date.now() < startupDeadline) {
      if (child.exitCode !== null) throw new Error('API startup failed: ' + childLog.slice(-2000));
      try { if ((await fetch(backend + '/health',{signal:AbortSignal.timeout(1000)})).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('API startup timeout: ' + childLog.slice(-2000));
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await exited;
  }
  async function makeView(width = 390, storageState) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', storageState });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.routeWebSocket('**/*', socket => socket.close());
    await context.addInitScript(() => localStorage.setItem('velvet_lang', 'sv'));
    const page = await context.newPage(); page.setDefaultTimeout(20_000);
    let visitNumber = 0;
    const visit = async () => {
      // A changed document query forces a real reload, not same-document hash
      // navigation that would leave the old mirror closure mounted after restart.
      await page.goto(base + '/?api=' + encodeURIComponent(base) + '&fixtureVisit=' + ++visitNumber + '#/restaurant/' + restaurantId,
        {waitUntil:'domcontentloaded',timeout:65_000});
      await page.locator(zenchef ? '#provider-playwright-booking [data-start]' : '#bokabord-mirror [data-start]').waitFor();
      assert.equal(await page.locator('#restaurant-provider-booking').count(), 0, 'Native route wins over registry embed');
    };
    await visit();
    return { context, page, visit };
  }
  const submits = () => messages.filter(m => m.kind === 'supplier-submit').length;
  const panel = page => page.locator(zenchef ? '#provider-playwright-booking' : '#bokabord-mirror');
  async function settled(page) {
    await page.waitForFunction(() => document.querySelector('#bokabord-mirror')?.getAttribute('aria-busy') === 'false');
  }
  async function pixel(page, y) {
    const image = panel(page).locator('[data-image]');
    const previous = await image.getAttribute('data-revision');
    const width = await image.evaluate(img => img.getBoundingClientRect().width);
    const naturalWidth = await image.evaluate(img => img.naturalWidth);
    await image.click({ position: { x: 100 * width / naturalWidth, y: y * width / naturalWidth } });
    await page.waitForFunction(revision => document.querySelector('#bokabord-mirror [data-image]')?.dataset.revision !== revision, previous);
    await settled(page);
  }
  let contactFinalGuardsChecked = false;
  async function toReview(page) {
    const opening = page.waitForResponse(response => response.request().method() === 'POST'
      && new URL(response.url()).pathname === '/restaurant-bookings/mirror', { timeout: 65_000 });
    await panel(page).locator('[data-start]').click();
    const response = await opening;
    assert.equal(response.status(), 201, 'Mirror creation must succeed: ' + JSON.stringify(
      response.ok() ? {} : await response.json()));
    await panel(page).locator('[data-image]').waitFor(); await settled(page);
    await pixel(page, 110); // party
    await pixel(page, 170); // date -> actual adapter's allowed supplier getTimes
    await pixel(page, 230); // fixture slot -> contact
    for (const [name, value] of Object.entries({ firstname: 'Integration', lastname: 'Fixture', email: 'fixture@example.invalid', phone: '+46700000000' })) {
      const input = panel(page).locator(`[data-provider-field="${name}"]`);
      await input.fill(value); await input.blur();
      await page.waitForFunction(({ name, value }) => document.querySelector(`[data-provider-field="${name}"]`)?.dataset.verifiedValue === value, { name, value });
      await settled(page);
    }
    const before = submits();
    const finalClicks = () => messages.filter(m=>m.kind==='provider-final-click').length;
    const clicksBefore = finalClicks();
    const current = async () => (await api(page,'/restaurant-bookings/mirror/current',{method:'POST'})).body;
    const rawAction = async (state, action) => api(page,`/restaurant-bookings/mirror/${state.id}/action`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:state.revision,...action})});
    if (contactFinal && !contactFinalGuardsChecked) {
      const rejected = await rawAction(await current(),{type:'submit',confirm:true,terms:true});
      assert.equal(rejected.status,409); assert.equal(submits(),before); assert.equal(finalClicks(),clicksBefore);
      assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
    }
    await panel(page).locator('[data-submit]').click(); // without consent
    assert.equal(submits(), before);
    await panel(page).locator('[data-terms]').check();
    await panel(page).locator('[data-submit]').click();
    await page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-submit]')?.textContent === 'Slutför bokningen');
    await settled(page);
    assert.equal(submits(), before, 'Contact-to-review must not reach supplier save');
    assert.equal(await panel(page).locator('[data-terms]').isChecked(), false, 'Review requires fresh consent');
    if (guestChoice) assert.match(await panel(page).locator('[data-text]').textContent(), /guest choice completed/, 'Native adapter must traverse the guest choice');
    if (contactFinal) {
      assert.equal(finalClicks(),clicksBefore,'Velvet review must not click supplier Next');
      let frozen = await current(); assert.ok(frozen.nativeReview?.token); assert.equal(frozen.fields.length,0);
      assert.equal(await panel(page).locator('[data-provider-view]').isHidden(),true);
      if (!contactFinalGuardsChecked) {
        const phoneModel=new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('fixture_phone_model_timeout')),5000);
          const receive=message=>{if(message.kind==='fixture-phone-model'){clearTimeout(timer);child.off('message',receive);resolve(message.model);}};
          child.on('message',receive);
        });
        child.send({kind:'fixture-check-phone-model'});
        assert.deepEqual(await phoneModel,{phone:'',countryCode:null,dialCode:null},'Review must not copy phone into the provider model before Next');
        assert.equal(frozen.nativeReview.details.phone,'+46700000000','Review projects the validated native phone');
        // Raw adversarial API actions bypass the UI closure. Refresh the actual
        // adapter snapshot, then let the normal UI recover that fresh snapshot.
        const refresh = async () => {await rawAction(await current(),{type:'refresh'});await panel(page).locator('[data-refresh]').click();await settled(page);};
        const review = async () => {
          await panel(page).locator('[data-terms]').check();await panel(page).locator('[data-submit]').click();await settled(page);
          await panel(page).locator('[data-native-review]').waitFor(); return current();
        };
        const oldToken=frozen.nativeReview.token;
        const edited=await rawAction(frozen,{type:'fill',fields:{firstname:'Changed'}});
        assert.equal(edited.status,200); assert.equal(edited.body.nativeReview,null);
        assert.equal((await rawAction(edited.body,{type:'submit',confirm:true,terms:true,reviewToken:oldToken})).status,409);
        await refresh();
        const input=panel(page).locator('[data-provider-field="firstname"]');await input.fill('Integration');await input.blur();
        await page.waitForFunction(()=>document.querySelector('[data-provider-field="firstname"]')?.dataset.verifiedValue==='Integration');await settled(page);
        frozen=await review();assert.notEqual(frozen.nativeReview.token,oldToken);
        assert.equal((await rawAction(frozen,{type:'submit',confirm:true,terms:true,reviewToken:oldToken})).status,409);
        await refresh();frozen=await review();
        const editedToken=frozen.nativeReview.token;
        await panel(page).locator('[data-edit-review]').click();await settled(page);
        const editState=await current();assert.equal(editState.nativeReview,null);
        assert.equal((await rawAction(editState,{type:'submit',confirm:true,terms:true,reviewToken:editedToken})).status,409);
        await refresh();frozen=await review();
        const changed=new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('fixture_terms_change_timeout')),5000);
          const receive=message=>{if(message.kind==='fixture-terms-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};
          child.on('message',receive);
        });
        child.send({kind:'fixture-change-terms'});await changed;
        assert.equal((await rawAction(frozen,{type:'submit',confirm:true,terms:true,reviewToken:frozen.nativeReview.token})).status,409,'Changed visible terms URL invalidates approval');
        await refresh();frozen=await review();
        assert.equal(submits(),before);assert.equal(finalClicks(),clicksBefore);
        assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0,'Review and rejected tokens must not reserve');
        await panel(page).screenshot({path:path.join(root,'..',receiptName.toLowerCase()+'-native-review.png')});
        contactFinalGuardsChecked=true;
        console.log('PASS '+receiptName+': direct submit, edited details, old token and edit-review cannot reserve or click; fresh native review remains separate');
      }
      assert.equal(await panel(page).locator('[data-terms]').isChecked(),false);
    }
  }
  async function api(page, route, options = {}) {
    return page.evaluate(async ({ route, options }) => {
      const response = await fetch(route, { credentials: 'include', ...options });
      return { status: response.status, body: await response.json() };
    }, { route, options });
  }
  let first, second, third;
  try {
    if (zenchef) {
      let recoveredRoom;
      let offerGuardsChecked=false;
      await start('confirmed'); browser = await chromium.launch();
      const flow = async (view, expectedDispatches = 1, roomId = chosenRoom, scenario = '') => {
        const page = view.page;
        const action = async click => {
          const pending = page.waitForResponse(r => r.request().method() === 'POST'
            && /^\/restaurant-bookings\/playwright(?:\/[a-f0-9-]+\/action)?$/.test(new URL(r.url()).pathname), {timeout:65_000});
          await click(); const response = await pending;
          const body = await response.json();
          assert.ok(response.ok(), 'Real provider API: ' + JSON.stringify({status:response.status(),error:body.error}));
          await page.waitForFunction(() => !document.querySelector('#provider-playwright-booking [data-refresh]')?.disabled);
          return {body,request:response.request().postDataJSON()};
        };
        await action(() => panel(page).locator('[data-start]').click());
        await panel(page).locator('[name=date]').fill(date);
        const searched = await action(() => panel(page).locator('[data-search] button').click());
        if(roomVenue){
          assert.equal(await panel(page).locator('[data-room="12:30"]').inputValue(),'');
          assert.equal(await panel(page).locator('[data-slot="12:30"]').isDisabled(),true);
          const before=submits();
          for(const room of [undefined,999]){
            const current=await api(page,`/restaurant-bookings/playwright/${searched.body.id}/current`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
            const rejected=await api(page,`/restaurant-bookings/playwright/${searched.body.id}/action`,{
              method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'select',time:'12:30',shiftId:zenchefShift,revision:current.body.revision,...(room===undefined?{}:{roomId:room})})});
            assert.equal(rejected.status,409,'Missing or unverified room must be rejected');
            assert.equal(rejected.body.error,'room_required_or_unverified');
          }
          assert.equal(submits(),before);
          const refreshed=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/current'));
          await panel(page).locator('[data-refresh]').click();await refreshed;
          await page.waitForFunction(()=>!document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
          await panel(page).locator('[data-room="12:30"]').selectOption(String(roomId));
        }
        const selected=await action(() => panel(page).locator('[data-slot="12:30"]').click());
        let selectedOffer;
        if(dekas){
          assert.equal(selected.body.state,'offers');
          assert.equal(await panel(page).locator('[data-field="firstname"]').isVisible(),false,'Contact cannot precede explicit offer selection');
          const offer=selected.body.offerChoices[0];
          assert.equal(offer.offerId,118785);assert.equal(offer.count,2);assert.equal(offer.mealPrice,null);assert.equal(offer.depositApplies,false);assert.equal(offer.depositMinGuests,7);
          assert.match(await panel(page).locator('[data-offers]').innerText(),/Pris anges inte/);
          assert.equal(await panel(page).locator('[data-offers] a').getAttribute('href'),'https://restaurantdekas.com/eng/menu');
          if(!offerGuardsChecked){
            for(const forbidden of [{type:'fill',fields:{firstname:'Premature'}},{type:'select_offer',offerId:offer.offerId,count:offer.count,offerVersion:'invalid-version'}]){
              const current=await api(page,`/restaurant-bookings/playwright/${selected.body.id}/current`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
              const rejected=await api(page,`/restaurant-bookings/playwright/${selected.body.id}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...forbidden,revision:current.body.revision})});
              assert.ok(rejected.status>=400);assert.equal(submits(),0);
            }
            const fresh=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/current'));
            await panel(page).locator('[data-refresh]').click();await fresh;
            await page.waitForFunction(()=>!document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
            offerGuardsChecked=true;
          }
          const picked=await action(()=>panel(page).locator('[data-offer="118785"]').click());
          selectedOffer=offer;
          assert.equal(picked.body.state,'contact');
        }
        assert.equal(await panel(page).locator('[data-field="country"]').inputValue(),'fr','Country read back from native phone widget');
        for (const [name,value] of Object.entries({firstname:'Integration',lastname:'Fixture',email:'fixture@example.invalid',phone:'+33612345678'})) {
          await panel(page).locator(`[data-field="${name}"]`).fill(value);
        }
        await panel(page).locator('[data-field="civility"]').selectOption('mr');
        await action(() => panel(page).locator('[data-save]').click());
        await action(() => panel(page).locator('[data-review]').click());
        if(dekas){
          assert.match(await panel(page).locator('[data-final-offer]').innerText(),/Native menu terms/);
          assert.match(await panel(page).locator('[data-final-offer]').innerText(),/Ingen deposition/);
          assert.equal(await panel(page).locator('[data-seating-notice]').innerText(),'Sittning: Until 3:30 PM');
          assert.equal(await panel(page).locator('[data-terms]').isChecked(),false);
          if(!scenario){await panel(page).screenshot({path:path.join(root,'..',`dekas-review-${page.viewportSize().width}.png`)});}
          if(scenario==='changed-offer'){
            const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('offer_change_timeout')),5000);const receive=m=>{if(m.kind==='fixture-offer-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
            child.send({kind:'fixture-change-offer'});await changed;
            await panel(page).locator('[data-terms]').check();const before=submits();
            const rejected=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='submit');
            await panel(page).locator('[data-submit]').click();const response=await rejected;
            assert.equal(response.status(),409);assert.equal((await response.json()).error,'offer_changed');assert.equal(submits(),before);return;
          }
        }
        if(pirouette){
          assert.equal(await panel(page).locator('[data-seating-notice]').innerText(),"Sittning: Jusqu'à 21:00");
          if(scenario==='seating-changed'){
            const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('fixture_seating_timeout')),5000);const receive=m=>{if(m.kind==='fixture-seating-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
            child.send({kind:'fixture-change-seating'});await changed;
            await panel(page).locator('[data-terms]').check();
            const before=submits();
            const rejected=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='submit');
            await panel(page).locator('[data-submit]').click();const response=await rejected;
            assert.equal(response.status(),409);assert.equal((await response.json()).error,'stale_review');assert.equal(submits(),before);
            return;
          }
        }
        if(roomVenue)assert.ok((await panel(page).locator('[data-final-details]').innerText()).includes(rooms.find(room=>room.id===roomId).name));
        assert.equal(await panel(page).locator('[data-submit]').isDisabled(), true, 'Explicit consent required');
        const before = submits(); await panel(page).locator('[data-terms]').check();
        const readbacksBefore=messages.filter(m=>m.kind==='supplier-own-readback').length;
        const pending=action(() => panel(page).locator('[data-submit]').dblclick());
        if(readbackVenue && before===0){
          const deadline=Date.now()+5000;
          while(!messages.some(m=>m.kind==='supplier-own-readback')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
          assert.ok(messages.some(m=>m.kind==='supplier-own-readback'));
          const pendingAttempt=await api(page,'/restaurant-bookings/playwright/attempts');
          assert.equal(pendingAttempt.body.attempts[0].status,'unknown','POST alone cannot confirm before saved-booking readback');
          child.send({kind:'release-own-readback'});
        }
        const result = await pending;
        if(dekas)assert.deepEqual(result.body.details.offer,selectedOffer);
        if(dekas&&expectedDispatches===1)assert.deepEqual(messages.filter(m=>m.kind==='durable-offer-before-dispatch').at(-1).offer,selectedOffer,'Exact selected offer persisted before transport');
        assert.equal(submits(), before + expectedDispatches, 'Supplier boundary dispatch count');
        if(readbackVenue)assert.ok(messages.filter(m=>m.kind==='supplier-own-readback').length-readbacksBefore<=1,'At most one readback, never retry');
        return result;
      };
      first = await makeView();
      const success = await flow(first);
      assert.equal(success.body.result.status,'confirmed');
      assert.equal(success.body.result.reference,'999999998');
      if(dekas){assert.equal(success.body.result.verification.offerEvidence,'own_booking_readback');assert.equal(success.body.result.verification.offerVersion,success.body.details.offer.version);}
      if(roomVenue){assert.equal(success.body.result.verification.roomId,chosenRoom);assert.equal(success.body.result.verification.roomName,chosenRoomName);assert.equal(messages.filter(m=>m.kind==='supplier-own-readback').length,1);assert.equal(success.body.result.verification.roomEvidence,'own_booking_readback');}
      assert.notEqual(success.request.idempotencyKey,success.body.result.verification.idempotencyKey,'Server owns the durable key');
      assert.equal(await panel(first.page).locator('[data-status]').getAttribute('data-booking-status'),'confirmed');
      assert.match(await panel(first.page).locator('[data-status]').innerText(),/999999998/);
      if(readbackVenue){
        const other=await api(first.page,'/restaurant-bookings/playwright',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'Zenchef',restaurantId:'osm-SBH-fishcorner',resume:true})});
        assert.equal(other.status,409);assert.equal(other.body.error,'other_restaurant');
        assert.equal(submits(),1,'Same-provider different venue cannot resume this booking');
      }
      await panel(first.page).locator('[data-refresh]').click();
      await first.page.waitForFunction(() => !document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
      assert.equal(submits(),1);
      await stop(); await start('timeout');
      const recovered = await api(first.page,'/restaurant-bookings/playwright/attempts');
      assert.equal(recovered.status,200); assert.equal(recovered.body.attempts.length,1);
      assert.equal(recovered.body.attempts[0].status,'confirmed');
      assert.equal(recovered.body.attempts[0].reference,'999999998');
      if(readbackVenue){
        const history=await api(first.page,'/restaurant-bookings');assert.equal(history.status,200);
        const booking=history.body.bookings.find(row=>row.restaurantId===restaurantId);
        if(dekas){assert.equal(booking.offer.offerId,118785);assert.equal(booking.offer.count,2);assert.equal(booking.offer.version,success.body.details.offer.version);assert.equal(booking.offer.mealPrice,null);}else recoveredRoom={roomId:booking.roomId,roomName:booking.roomName};
      }
      console.log('PASS '+zenchefName+' actual UI/API/native Zenchef/SQLite: consent, double click, server-owned key, confirmation/reference and restart recovery');
      second = await makeView(1366);
      assert.equal((await api(second.page,'/restaurant-bookings/playwright/attempts')).status,401);
      const lost = await flow(second);
      assert.equal(lost.body.result.status,'unknown');
      assert.equal(await panel(second.page).locator('[data-status]').getAttribute('data-booking-status'),'unknown');
      assert.equal(await panel(second.page).locator('[data-submit]').isDisabled(),true);
      await panel(second.page).locator('[data-refresh]').click();
      await second.page.waitForFunction(() => !document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
      assert.equal(submits(),2);
      await stop(); await start(dekas?'rotated-offer':'confirmed');
      const unknown = await api(second.page,'/restaurant-bookings/playwright/attempts');
      assert.equal(unknown.status,200); assert.equal(unknown.body.attempts.length,1);
      assert.equal(unknown.body.attempts[0].status,'unknown');
      const replay = await api(second.page,`/restaurant-bookings/playwright/${lost.body.id}/action`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lost.request)});
      assert.ok([404,409].includes(replay.status)); assert.equal(submits(),2);
      // The same owner in a fresh UI session must not bypass the durable guard.
      third = await makeView(390, await second.context.storageState());
      const repeated = await flow(third, 0, alternateRoom);
      if(dekas)assert.notEqual(repeated.body.details.offer.version,lost.body.details.offer.version,'Rotated native offer version cannot bypass durable duplicate scope');
      assert.equal(repeated.body.result.status,'unknown'); assert.equal(submits(),2);
      assert.equal(messages.filter(m=>['unexpected-supplier-request','blocked-node-network'].includes(m.kind)).length,0);
      console.log('PASS '+zenchefName+' lost supplier reply: durable unknown, owner isolation, refresh/restart without replay');
      if(dekas){
        for(const outcome of ['changed-offer','wrong-request-offer','missing-receipt-offer','wrong-receipt-offer','wrong-receipt-count','readback-error']){
          await stop();await start(outcome);const view=await makeView();
          try{
            const result=await flow(view,outcome.includes('request')?0:1,chosenRoom,outcome);
            if(outcome==='changed-offer')continue;
            assert.equal(result.body.result.status,'unknown',outcome);
          }finally{await view.context.close();}
        }
      }
      if(roomVenue){
        for(const outcome of [...(pirouette?['seating-changed','code-request']:[]),'missing-request-room','mismatch-request-room','missing-receipt-room','mismatch-receipt-room','readback-error','readback-http-error','mismatch-readback-id','mismatch-readback-uuid','mismatch-readback-date','post-echo-bad-readback','post-echo-mismatch','post-echo-good-readback']){
          console.log('CHECK '+zenchefName+' '+outcome);await stop();await start(outcome);
          const view=await makeView();
          try{
            const readsBefore=messages.filter(m=>m.kind==='supplier-own-readback').length;
            const result=await flow(view,outcome.includes('request')?0:1,chosenRoom,outcome);
            if(outcome==='seating-changed')continue;
            assert.equal(result.body.result.status,outcome==='post-echo-good-readback'?'confirmed':'unknown',outcome);
            assert.equal(messages.filter(m=>m.kind==='supplier-own-readback').length-readsBefore,outcome.includes('request')||outcome==='post-echo-mismatch'?0:1,outcome+' readback count');
            if(outcome==='readback-error'){
              await stop();await start(outcome);
              const attempts=await api(view.page,'/restaurant-bookings/playwright/attempts');
              assert.equal(attempts.body.attempts[0].status,'unknown');
              const fresh=await makeView(390,await view.context.storageState());
              const reads=messages.filter(m=>m.kind==='supplier-own-readback').length;
              try{assert.equal((await flow(fresh,0,alternateRoom)).body.result.status,'unknown');}
              finally{await fresh.context.close();}
              assert.equal(messages.filter(m=>m.kind==='supplier-own-readback').length,reads,'Restart must not replay failed readback or POST');
            }
          }
          finally{await view.context.close();}
        }
        console.log('PASS '+zenchefName+' missing/mismatched request room blocks dispatch; missing/mismatched receipt room stays unknown');
        assert.deepEqual(recoveredRoom,{roomId:chosenRoom,roomName:chosenRoomName},'Public booking history preserves chosen room after restart');
      }
      console.log(JSON.stringify({status:'PASS',restaurantId,evidence:'real_local_app_api_native_zenchef_journal_with_supplier_fixture',
        integrationCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),supplierBoundaryAttempts:submits(),
        actualSupplierRequests:0,liveConfirmationVerified:false,backendRestarts:dekas?8:pirouette?17:roomVenue?15:2,APIRequests:apiCalls.length,deployed:false}));
      return;
    }
    await start('unverified-success');
    browser = await chromium.launch();
    first = await makeView();
    await toReview(first.page);
    assert.equal(submits(), 0);
    if(astrid){
      const attempted=new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('fixture_custom_request_timeout')),5000);
        const receive=message=>{if(message.kind==='fixture-custom-request-result'){clearTimeout(timer);child.off('message',receive);resolve(message.blocked);}};
        child.on('message',receive);
      });
      child.send({kind:'fixture-custom-request'});
      assert.equal(await attempted,true,'Custom request must fail at the native adapter boundary');
      assert.equal(messages.filter(m=>m.kind==='adapter-blocked-custom-request').length,1);
      assert.equal(submits(),0);
      assert.equal((await api(first.page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
      assert.notEqual(await panel(first.page).locator('[data-status]').getAttribute('data-booking-status'),'confirmed');
    }
    await panel(first.page).locator('[data-terms]').check();
    if (contactFinal) await panel(first.page).locator('[data-submit]').dblclick();
    else await panel(first.page).locator('[data-submit]').evaluate(button => { button.click(); button.click(); });
    await first.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 40_000 });
    await settled(first.page);
    assert.equal(submits(), 1, 'Exactly one supplier boundary attempt');
    if(nativeGuest)assert.equal(messages.filter(m=>m.kind==='durable-before-provider-dispatch').length,1);
    let recovered = await api(first.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.status, 200); assert.equal(recovered.body.attempts.length, 1);
    assert.equal(recovered.body.attempts[0].status, 'unknown');
    assert.ok(!JSON.stringify(recovered.body).includes('fixture@example.invalid'));
    console.log('PASS actual app/API/Chromium/journal: explicit consent, two-step review, one double-click attempt, wrong-restaurant receipt remains unknown');
    if (receiptMode) assert.equal(messages.filter(m=>m.kind==='supplier-receipt-navigation').length,1);
    second = await makeView(1366);
    assert.equal((await api(second.page, '/restaurant-bookings/playwright/attempts')).status, 401);
    await stop(); await start('unverified-success');
    recovered = await api(first.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1); assert.equal(recovered.body.attempts[0].status, 'unknown');
    await first.visit(); await toReview(first.page);
    await panel(first.page).locator('[data-terms]').check();
    await panel(first.page).locator('[data-submit]').click();
    // The public serializer deliberately normalizes internal already_attempted
    // to unknown; assert the supplier boundary block, not an internal status.
    await first.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 40_000 });
    assert.equal(submits(), 1, 'Restart + new session cannot repeat supplier transmission');
    assert.equal(messages.filter(m => m.kind === 'adapter-blocked-submit').length, contactFinal ? 0 : 1);
    if (contactFinal) {
      assert.equal(messages.filter(m=>m.kind==='provider-final-click').length,1,'Replay must stop before supplier Next');
      assert.equal(await panel(first.page).locator('[data-submit]').isHidden(),true);
    }
    console.log('PASS actual restart/replay: persisted attempt recovered by same owner; other browser isolated; new session/key blocked');
    await stop(); await start(receiptMode ? 'missing-receipt' : 'timeout');
    await second.visit(); await toReview(second.page);
    await panel(second.page).locator('[data-terms]').check();
    await panel(second.page).locator('[data-submit]').click();
    await second.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 45_000 });
    await settled(second.page); assert.equal(submits(), 2);
    await panel(second.page).locator('[data-refresh]').click(); await settled(second.page);
    assert.equal(submits(), 2);
    assert.equal(await panel(second.page).locator('[data-submit]').isHidden(), true);
    recovered = await api(second.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1); assert.equal(recovered.body.attempts[0].status, 'unknown');
    if (receiptMode) assert.equal(messages.filter(m=>m.kind==='supplier-receipt-navigation').length,1,'Missing receipt must not trigger an adapter-constructed GET');
    console.log(receiptMode ? 'PASS receipt policy: successful POST without receipt stays unknown; no constructed receipt GET or refresh retry' : 'PASS actual supplier-boundary timeout: unknown journal/current UI, no retry after refresh');
    await stop(); await start('confirmed');
    third = await makeView(1366);
    await toReview(third.page);
    await panel(third.page).locator('[data-terms]').check();
    const receiptPending = receiptMode ? new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{child.off('message',receive);reject(new Error('No provider receipt navigation'));},15000);
      const receive=message=>{if(message.kind==='supplier-receipt-navigation'){clearTimeout(timer);child.off('message',receive);resolve();}};
      child.on('message',receive);
    }) : null;
    await panel(third.page).locator('[data-submit]').click();
    if (receiptMode) {
      await receiptPending;
      const candidate=await api(third.page,'/restaurant-bookings/playwright/attempts');
      assert.equal(candidate.status,200); assert.equal(candidate.body.attempts[0].status,'unknown','POST success alone cannot confirm');
      assert.notEqual(await panel(third.page).locator('[data-status]').getAttribute('data-booking-status'),'confirmed');
      child.send({kind:'release-provider-receipt'});
    }
    await third.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'confirmed', null, { timeout: 40_000 });
    await settled(third.page);
    assert.equal(submits(), 3);
    assert.match(await panel(third.page).locator('[data-status]').innerText(), /999999999/);
    recovered = await api(third.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1);
    assert.equal(recovered.body.attempts[0].status, 'confirmed');
    assert.equal(recovered.body.attempts[0].reference, '999999999');
    assert.ok(!JSON.stringify(recovered.body).includes('fixture@example.invalid'));
    await panel(third.page).locator('[data-refresh]').click(); await settled(third.page);
    assert.equal(submits(), 3);
    assert.equal(await panel(third.page).locator('[data-status]').getAttribute('data-booking-status'), 'confirmed');
    if (receiptMode) {
      assert.equal(messages.filter(m=>m.kind==='supplier-receipt-navigation').length,2);
      assert.ok(!JSON.stringify(recovered.body).includes(receiptCode),'Receipt capability must not be persisted in public attempts');
      await stop(); await start('confirmed');
      const persisted=await api(third.page,'/restaurant-bookings/playwright/attempts');
      assert.equal(persisted.body.attempts[0].status,'confirmed'); assert.equal(persisted.body.attempts[0].reference,'999999999');
      if(italiano){const history=await api(third.page,'/restaurant-bookings');assert.equal(history.status,200);const row=history.body.bookings.find(b=>b.restaurantId===restaurantId);assert.equal(row.status,'confirmed');assert.equal(String(row.providerReference||row.reference),'999999999');}
    }
    console.log(receiptMode ? 'PASS receipt policy: POST remains unknown until provider main-frame receipt; static completion document confirms matching reference and survives restart' : 'PASS scoped positive Zink receipt through actual app/API/adapter/journal, owner recovery and reference; supplier remains simulated');
    if(dagmar||italiano){
      for(const outcome of italiano?['excluded-lunch','excluded-bar','wrong-type','party-cap','requirement']:['wrong-meal','requirement']){
        await stop();await start(outcome);const view=await makeView();
        try{
          await toReview(view.page);await panel(view.page).locator('[data-terms]').check();
          const before=submits();await panel(view.page).locator('[data-submit]').click();
          await view.page.waitForFunction(()=>document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus==='unknown',null,{timeout:40000});
          await settled(view.page);assert.equal(submits(),before+1);
          const result=await api(view.page,'/restaurant-bookings/playwright/attempts');
          assert.equal(result.body.attempts[0].status,'unknown',outcome+' cannot confirm outside the exact receipt policy');
        }finally{await view.context.close();}
      }
      console.log('PASS '+receiptName+' excluded meal/type/party/requirement responses remain unknown');
    }
    assert.equal(messages.filter(m => m.kind === 'unexpected-supplier-request').length, 0);
    assert.equal(messages.filter(m => m.kind === 'blocked-node-network').length, 0);
    console.log(JSON.stringify({ status: 'PASS', evidence: 'real_local_app_api_adapter_journal_with_supplier_fixture',
      integrationCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      supplierBoundaryAttempts: submits(), actualSupplierRequests: 0, liveConfirmationVerified: false,
      restaurantId,backendRestarts: italiano ? 9 : dagmar ? 6 : receiptMode ? 4 : 3, APIRequests: apiCalls.length, deployed: false }));
    console.log('Mirror startup timings:', JSON.stringify(apiCalls.filter(call => call.method === 'POST'
      && call.path === '/restaurant-bookings/mirror').map(({ status, responseMs }) => ({ status, responseMs }))));
    console.log('Browser startup events:', JSON.stringify(messages.filter(event => event.kind.startsWith('browser-'))));
  } catch (error) {
    console.error('Integrated fixture failure:', error.message);
    for (const [name, view] of Object.entries({ first, second, third })) {
      if (zenchef && view && !view.page.isClosed()) {
        const screenshot = path.join(root,'..',`${zenchefName.toLowerCase()}-failure-${name}.png`);
        await view.page.screenshot({path:screenshot,fullPage:true}).catch(()=>{});
        console.error(zenchefName+' layout:',JSON.stringify({name,screenshot,layout:await view.page.evaluate(()=>{
          const selectors=['#provider-playwright-booking','#provider-playwright-booking section','#provider-playwright-booking footer',
            '#provider-playwright-booking [data-refresh]','#restaurant-booking-panel','.restaurant-detail-main','.restaurant-detail-main .detail-panel'];
          return selectors.map(selector=>{const el=document.querySelector(selector);if(!el)return {selector};
            const r=el.getBoundingClientRect(),s=getComputedStyle(el);
            return {selector,rect:r.toJSON(),position:s.position,height:s.height,maxHeight:s.maxHeight,overflow:s.overflow,
              flex:s.flex,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,180)};});
        }).catch(()=>null)}));
      }
      if (view && !view.page.isClosed()) console.error('UI diagnostic:', JSON.stringify({ name,
        state: await panel(view.page).evaluate(el => ({ busy: el.getAttribute('aria-busy'),
          status: el.querySelector('[data-status]')?.textContent,
          bookingStatus: el.querySelector('[data-status]')?.dataset.bookingStatus,
          screenHidden: el.querySelector('[data-screen]')?.hidden })).catch(() => null) }));
    }
    console.error('API child diagnostic:', JSON.stringify({ exitCode: child?.exitCode, log: childLog.slice(-3000) }));
    console.error('Recent local API calls:', JSON.stringify(apiCalls.slice(-12)));
    console.error('Supplier boundary events:', JSON.stringify(messages));
    throw error;
  } finally {
    await first?.context.close(); await second?.context.close(); await third?.context.close();
    await browser?.close(); await stop();
    staticServer.closeAllConnections(); await new Promise(resolve => staticServer.close(resolve));
    // Only this test's mkdtemp directory is removed, never repository/user data.
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
