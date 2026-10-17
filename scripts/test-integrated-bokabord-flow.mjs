// Refs #129. Real app + HTTP server + native Chromium adapter + SQLite journal.
// ONLY the supplier boundary is simulated. Never runs against a remote target.
// Preload mode instruments Chromium's network boundary, NOT the adapter/state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scopeGuards = process.argv.includes('--scope-guards') || process.env.VELVET_TEST_SCOPE_GUARDS === '1';
const root = fileURLToPath(new URL('../', import.meta.url));
const sazon = process.argv.includes('--sazon') || process.env.VELVET_TEST_PROVIDER === 'Sazon';
const fishcorner = process.argv.includes('--fishcorner') || process.env.VELVET_TEST_PROVIDER === 'FishCorner';
const pesquiere = process.argv.includes('--pesquiere') || process.env.VELVET_TEST_PROVIDER === 'Pesquiere';
const pirouette = process.argv.includes('--pirouette') || process.env.VELVET_TEST_PROVIDER === 'Pirouette';
const roomVenue = pesquiere || pirouette;
const dekas = process.argv.includes('--dekas') || process.env.VELVET_TEST_PROVIDER === 'DeKas';
const bofinger=process.argv.includes('--bofinger') || process.env.VELVET_TEST_PROVIDER==='Bofinger';
const bofingerTail=bofinger && process.argv.includes('--bofinger-tail');
const bofingerSource=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/bofinger-source.json'),'utf8'));
const bofingerCases=['notice-changed','form-card','form-manual','form-prepayment','form-shift','missing-saved-time','wrong-saved-party','pending-saved','unexpected-offer','missing-offers','saved-room','mismatch-readback-id','mismatch-readback-uuid','mismatch-readback-date','readback-error','readback-http-error'];
const readbackVenue = bofinger || roomVenue || dekas;
const zenchef = fishcorner || readbackVenue;
const chosenRoom = pirouette ? 52521 : 52372;
const otherRoom = pirouette ? 65674 : 51183;
const alternateRoom = pirouette ? 65674 : 52373;
const chosenRoomName = pirouette ? 'Salle principale' : 'Mazagran salle';
const zenchefShift = bofinger ? 19170 : dekas ? 494748 : pirouette ? 189024 : pesquiere ? 136503 : 545372;
const zenchefRid = bofinger ? '84941' : dekas ? '386643' : pirouette ? '363313' : pesquiere ? '362908' : '388090';
const zenchefName = bofinger ? 'Bofinger' : dekas ? 'DeKas' : pirouette ? 'Pirouette' : pesquiere ? 'Pesquiere' : 'FishCorner';
const rooms = pirouette ? [{id:52521,name:'Salle principale'},{id:65674,name:'Terasse'}] : [{id:51183,name:'La Pesquiere'},{id:52372,name:'Mazagran salle'},{id:52373,name:'Mazagran terrasse'}];
const noema = process.argv.includes('--noema') || process.env.VELVET_TEST_PROVIDER === 'Noema';
const kvarnen = process.argv.includes('--kvarnen') || process.env.VELVET_TEST_PROVIDER === 'Kvarnen';
const kvarnenTail=kvarnen && process.argv.includes('--kvarnen-tail');
const kvarnenComment='Fixture lunch preference; no room allocation requested.';
const kvarnenTarget='https://app.bokabord.se/reservation/?hash=724b0f1e583fb02d404504176bbe156b&version=new';
const kvarnenInvalid=[{amount:0},{amount:3},...[215,1278,11819,64214,999999999].map(mealid=>({mealid})),...['2030-01-19','2030-01-20','2026-11-23','2026-12-15','2026-12-23'].map(date=>({date})),{time:'11:59'},{time:'15:00'}];
const kvarnenBoundaries=[{time:'12:00'},{time:'14:59'},{time:'12:00',date:'2026-11-20'},{time:'12:00',date:'2026-12-24'},{time:'12:00',amount:1}];
const kvarnenOutcomes=['wrong-provider-name','wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const hantverket = process.argv.includes('--hantverket') || process.env.VELVET_TEST_PROVIDER === 'Hantverket';
const hantTail=hantverket && process.argv.includes('--hantverket-tail');
const hantComment='Vi har barnvagn och hund med oss. Fixture only.';
const hantTarget='https://app.bokabord.se/reservation/?hash=f7f00569986df77ef5d7b4abe98b9bed&version=new&lang=sw';
const hantInvalid=[...[7098,7103,999999999].map(mealid=>({mealid})),{amount:0},{amount:3},{date:'2030-01-19'},{date:'2030-01-20'},{time:'11:29'},{time:'14:00'}];
const hantBoundaries=[{time:'11:30'},{time:'13:59'}];
const hantOutcomes=['english-receipt','wrong-provider-name','wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const pelikan = process.argv.includes('--pelikan') || process.env.VELVET_TEST_PROVIDER === 'Pelikan';
const pelikanComment='Fixture seating preference, no room guarantee.';
const pelikanInvalid=[{amount:1},{amount:3},...[293,11704,65474,999999999].map(mealid=>({mealid})),{time:'15:59'},{time:'22:30'}];
const pelikanBoundaries=[{time:'16:00'},{time:'22:29'}];
const pelikanOutcomes=['wrong-provider-name','wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const tennstopet = process.argv.includes('--tennstopet') || process.env.VELVET_TEST_PROVIDER === 'Tennstopet';
const tennLabel='Lunch Tennbarens Matsal';
const tennInvalid=[{amount:1},{amount:3},...[54065,54213,54214,59733,999999999].map(mealid=>({mealid})),...['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-25','2026-11-25','2026-11-27','2026-12-19','2026-12-23'].map(date=>({date})),{time:'11:59'},{time:'15:00'}];
const tennBoundaries=[{time:'12:00'},{time:'14:59'},{time:'12:00',date:'2026-10-24'},{time:'12:00',date:'2026-11-21'},{time:'12:00',date:'2026-12-25'}];
const tennOutcomes=['wrong-room-receipt','wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const teatergrillen = process.argv.includes('--teatergrillen') || process.env.VELVET_TEST_PROVIDER === 'Teatergrillen';
const teaterBarHash='a9a751cbf9a3721964247c6b364a4fe2';
const teaterTarget='https://app.bokabord.se/reservation/?hash=e11fb52c16bde7a7d8f255342f6a6eaf&version=new';
const teaterInvalid=[...[6492,9063,42517,64051,999999999].map(mealid=>({mealid})),{amount:0},{amount:3},{time:'12:59'},{time:'15:00'},{date:'2030-01-19'},{date:'2030-01-20'},{hash:teaterBarHash}];
const teaterBoundaries=[{time:'13:00'},{time:'14:59'}];
const teaterOutcomes=['wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const luzette = process.argv.includes('--luzette') || process.env.VELVET_TEST_PROVIDER === 'Luzette';
const luzetteInvalid=[...[7254,7434,44511,49633,49749,51726,52551].map(mealid=>({mealid})),{amount:0},{amount:3},{time:'11:14'},{time:'15:00'}];
const luzetteBoundaries=[{time:'11:15'},{time:'14:59'}];
const luzetteOutcomes=['wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products','group','temporary'];
const bobonne = process.argv.includes('--bobonne') || process.env.VELVET_TEST_PROVIDER === 'Bobonne';
const bobonneInvalid=[{mealid:155},{amount:3},{date:'2030-01-19'},{date:'2030-01-20'},{time:'11:00'},{time:'11:29'},{time:'14:00'}];
const bobonneBoundaries=[{time:'11:30'},{time:'13:59'}];
const bobonneOutcomes=['wrong-meal','wrong-type','party-cap','waitlist','requirement','payment','mandatory-products'];
const agnes = process.argv.includes('--agnes') || process.env.VELVET_TEST_PROVIDER === 'Agnes';
const agnesInvalid=[{amount:3},...[1627,2775,3568].map(mealid=>({mealid}))];
const agnesOutcomes=['excluded-lunch','excluded-kitchen','excluded-cellar','party-cap','waitlist','requirement','payment','mandatory-products'];
const ciccios = process.argv.includes('--ciccios') || process.env.VELVET_TEST_PROVIDER === 'Ciccios';
const riche = process.argv.includes('--riche') || process.env.VELVET_TEST_PROVIDER === 'Riche';
const klotet = process.argv.includes('--klotet') || process.env.VELVET_TEST_PROVIDER === 'Klotet';
const klotetInvalid = [{date:'2026-09-04'},{date:'2026-12-25'},{date:'2026-10-24'},{time:'11:59'},{time:'15:00'},{amount:3},...[39316,39493,43781,53207,54658,64420].map(mealid=>({mealid}))];
const klotetOutcomes=['wrong-meal','wrong-type','requirement','payment','mandatory-products'];
const gondolen = process.argv.includes('--gondolen') || process.env.VELVET_TEST_PROVIDER === 'Gondolen';
const gondolenExcluded = [33009,34460,36498,39271,46058,51679,53289,53348,53350,65403];
const gondolenOutcomes = process.argv.includes('--gondolen-smoke') ? [] : [...gondolenExcluded.map(id=>'excluded-'+id),'wrong-type','party-cap','requirement','payment'];
const sturehof = process.argv.includes('--sturehof') || process.env.VELVET_TEST_PROVIDER === 'Sturehof';
const beirut = process.argv.includes('--beirut') || process.env.VELVET_TEST_PROVIDER === 'Beirut';
const balzac = process.argv.includes('--balzac') || process.env.VELVET_TEST_PROVIDER === 'Balzac';
const kommendoren = process.argv.includes('--kommendoren') || process.env.VELVET_TEST_PROVIDER === 'Kommendoren';
const astrid = process.argv.includes('--astrid') || process.env.VELVET_TEST_PROVIDER === 'Astrid';
const vau = process.argv.includes('--vau') || process.env.VELVET_TEST_PROVIDER === 'Vau';
const boqueria = process.argv.includes('--boqueria') || process.env.VELVET_TEST_PROVIDER === 'Boqueria';
const dagmar = process.argv.includes('--dagmar') || process.env.VELVET_TEST_PROVIDER === 'Dagmar';
const copine = process.argv.includes('--copine') || process.env.VELVET_TEST_PROVIDER === 'Copine';
const guestLunch = kvarnen || hantverket || tennstopet || bobonne || beirut || balzac || kommendoren || astrid || vau || boqueria || dagmar || copine;
const italiano = process.argv.includes('--italiano') || process.env.VELVET_TEST_PROVIDER === 'Italiano';
const nativeGuest = pelikan || guestLunch || italiano || agnes;
const guestChoice = ciccios || nativeGuest;
const contactFinal = teatergrillen || luzette || riche || sturehof || gondolen || klotet;
assert.ok([bofinger,kvarnen,hantverket,pelikan,tennstopet,teatergrillen,luzette,bobonne,agnes,klotet,gondolen,sazon,fishcorner,pesquiere,pirouette,dekas,noema,ciccios,riche,sturehof,beirut,balzac,kommendoren,astrid,vau,boqueria,dagmar,italiano,copine].filter(Boolean).length <= 1, 'Choose one named provider scenario');
// Noema/Ciccios saved-source evidence: issue129 comment6241312516, native phoneField/Next copy.
const nativePhone = contactFinal || nativeGuest || noema || ciccios;
const receiptMode = noema || guestChoice || contactFinal;
const receiptName = kvarnen ? 'Kvarnen Restaurang' : hantverket ? 'Restaurang Hantverket' : pelikan ? 'Restaurang Pelikan' : tennstopet ? 'Tennstopet' : teatergrillen ? 'Teatergrillen' : luzette ? 'Luzette' : bobonne ? 'Brasserie Bobonne' : agnes ? 'Agnes' : klotet ? 'Caf\u00e9 Klotet' : gondolen ? 'Gondolen' : copine ? 'Copine' : italiano ? 'Italiano' : dagmar ? 'Villa Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau De Ville' : astrid ? 'Brasserie Astrid' : kommendoren ? 'Kommendören' : balzac ? 'Brasserie Balzac' : beirut ? 'Beirut Café' : sturehof ? 'Sturehof' : riche ? 'Riche' : ciccios ? "Ciccio's" : 'Noema';
const receiptCode = kvarnen ? 'synthetic-kvarnen-only' : hantverket ? 'synthetic-hantverket-only' : pelikan ? 'synthetic-pelikan-only' : tennstopet ? 'synthetic-tennstopet-only' : teatergrillen ? 'synthetic-teatergrillen-only' : luzette ? 'synthetic-luzette-only' : bobonne ? 'synthetic-bobonne-only' : agnes ? 'synthetic-agnes-only' : klotet ? 'synthetic-klotet-only' : gondolen ? 'synthetic-gondolen-only' : copine ? 'synthetic-copine-only' : italiano ? 'synthetic-italiano-only' : dagmar ? 'synthetic-dagmar-only' : boqueria ? 'synthetic-boqueria-only' : vau ? 'synthetic-vau-only' : astrid ? 'synthetic-astrid-only' : kommendoren ? 'synthetic-kommendoren-only' : balzac ? 'synthetic-balzac-only' : beirut ? 'synthetic-beirut-only' : sturehof ? 'synthetic-sturehof-only' : riche ? 'synthetic-riche-only' : ciccios ? 'synthetic-ciccios-only' : 'synthetic-noema-only';
const mealId = kvarnen ? 91 : hantverket ? 7097 : pelikan ? 1540 : tennstopet ? 54277 : teatergrillen ? 6491 : luzette ? 7253 : bobonne ? 31 : agnes ? 1628 : klotet ? 63872 : gondolen ? 33008 : copine ? 4790 : italiano ? 22890 : dagmar ? 63588 : boqueria ? 22 : vau ? 22476 : astrid ? 55508 : kommendoren ? 3501 : balzac ? 354 : beirut ? 30471 : sturehof ? 3913 : riche ? 7180 : ciccios ? 2379 : noema ? 35204 : 9778;
const scopeInvalid = [{mealid:999999999},{amount:noema ? 9 : ciccios ? 8 : 3}];
const mealType = tennstopet ? 0 : klotet ? 0 : dagmar ? 0 : noema || guestLunch || contactFinal ? 2 : 3;
const restaurantId = bofinger ? 'curated-PAR-bofinger' : kvarnen ? 'curated-STO-kvarnen' : hantverket ? 'curated-STO-hantverket' : pelikan ? 'curated-STO-pelikan' : tennstopet ? 'curated-STO-tennstopet' : teatergrillen ? 'curated-STO-teatergrillen' : luzette ? 'curated-STO-luzette' : bobonne ? 'curated-STO-brasserie-bobonne' : agnes ? 'curated-STO-agnes' : klotet ? 'curated-STO-cafe-klotet' : gondolen ? 'curated-STO-gondolen' : sazon ? 'osm-BAL-sazon' : copine ? 'curated-STO-copine' : italiano ? 'curated-STO-italiano' : dekas ? 'curated-AMS-de-kas' : dagmar ? 'curated-STO-villa-dagmar' : boqueria ? 'curated-STO-boqueria' : vau ? 'curated-STO-vau-de-ville' : astrid ? 'curated-STO-brasserie-astrid' : pirouette ? 'osm-MCO-pirouette' : kommendoren ? 'curated-STO-kommendoren' : balzac ? 'curated-STO-balzac' : beirut ? 'curated-STO-beirut-cafe' : pesquiere ? 'osm-STT-la-pesquiere-le-mazagran-et-lou-revelen' : sturehof ? 'curated-STO-sturehof' : fishcorner ? 'osm-SBH-fishcorner' : riche ? 'curated-STO-riche' : ciccios ? 'curated-STO-ciccios' : noema ? 'curated-STO-noema' : 'curated-STO-zink-italian-cuisine';
const venue = JSON.parse(fs.readFileSync(path.join(root, 'api/bokabord-restaurants.json')))[receiptMode ? restaurantId : 'curated-STO-zink-italian-cuisine'];
const saveUrl = 'https://app.bokabord.se/reservation/api/booking/saveBooking';
const date = tennstopet ? '2026-10-23' : klotet ? '2026-10-23' : '2030-01-15';
const bookingTime = teatergrillen ? '13:00' : noema || guestLunch || contactFinal ? '12:00' : '19:00';
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
  if(bofinger){
    const captured=structuredClone(bofingerSource.dailyAvailabilities['2026-10-23'].shifts[0]);
    Object.assign(shift,captured,{bookable_from:null,bookable_to:null,shift_slots:[slot]});delete slot.available_rooms;
    Object.assign(state,{name:'Bofinger',currency:'EUR',language:'fr',restaurantTimezone:'Europe/Paris',hasRoomSelection:false,mandatoryFields:bofingerSource.mandatoryFields,restaurantComment:bofingerSource.restaurantComment});
    const outcome=process.env.VELVET_TEST_OUTCOME;
    if(form && outcome==='form-card')shift.charge_param.is_web_booking_askable=true;
    if(form && outcome==='form-manual')shift.confirmation.is_auto_until=null;
    if(form && outcome==='form-prepayment')shift.prepayment_param={is_web_booking_askable:true};
    if(form && outcome==='form-shift')shift.id=19173;
  }
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
const model={custom_request:false,settings:{custom_request:${astrid},comment:${!(tennstopet || agnes || luzette || teatergrillen)},autoplacing_labels:${hantverket || agnes || tennstopet}${tennstopet || pelikan ? ',widget_end_time:false,confirm_in_widget:false' : ''}${kvarnen ? ',widget_end_time:true,confirm_in_widget:false' : ''}${hantverket ? ',separated:true,widget_end_time:true,confirm_in_widget:false' : ''}${luzette ? ',separated:true,widget_end_time:false,confirm_in_widget:false' : ''}},meal:{bullets:{},mandatory_products:false},getQuery:()=>q};
window.angular={element:()=>({injector:()=>({get:key=>key==='Booking'?model:key==='$http'?{pendingRequests:[]}:{$$phase:false}}),scope:()=>({isAjaxRequest:()=>false,phoneValid:()=>!!document.querySelector('[name=phone]')?.value.match(/^\\+46700000000$/)})})};
if(${nativePhone}){
 window.$={fn:{intlTelInput:{getCountryData:()=>[{iso2:'se',dialCode:'46',name:'Sweden'}]}}};
 window.intlTelInputUtils={isValidNumber:(value,iso)=>iso==='se'&&value==='+46700000000',formatNumber:(value,iso)=>iso==='se'?value:''};
}
const screen=document.querySelector('#screen');
screen.innerHTML=${JSON.stringify(`<h1>${receiptMode ? receiptName : 'Zink'} FIXTURE — no real booking</h1><button id="party">2 gäster</button><button id="date">${date}</button><button id="slot" hidden>${bookingTime} TESTDATA</button>`)};
document.querySelector('#party').onclick=()=>{q.amount=2;document.querySelector('#party').textContent='2 gäster valda';};
document.querySelector('#date').onclick=async()=>{q.date='${date}';const r=await fetch('/reservation/api/booking/getTimes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:q.date,amount:q.amount,hash:q.hash})});const data=await r.json();document.querySelector('#slot').hidden=!data.times.includes('${bookingTime}');};
document.querySelector('#slot').onclick=()=>{q.time='${bookingTime}';Object.assign(q,${JSON.stringify(kvarnen && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? kvarnenBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : kvarnen && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? kvarnenInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : hantverket && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? hantBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : hantverket && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? hantInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : pelikan && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? pelikanBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : pelikan && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? pelikanInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : tennstopet && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? tennBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : tennstopet && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? tennInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : teatergrillen && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? teaterBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : teatergrillen && !scopeGuards && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? teaterInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : luzette && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? luzetteBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : luzette && !scopeGuards && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? luzetteInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : bobonne && process.env.VELVET_TEST_OUTCOME?.startsWith('boundary-') ? bobonneBoundaries[Number(process.env.VELVET_TEST_OUTCOME.slice(9))] : bobonne && !scopeGuards && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? bobonneInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : scopeGuards && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? scopeInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : agnes && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? agnesInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : klotet && process.env.VELVET_TEST_OUTCOME?.startsWith('invalid-') ? klotetInvalid[Number(process.env.VELVET_TEST_OUTCOME.slice(8))] : {})});contact();};
function contact(){screen.innerHTML='<h2>Kontaktuppgifter</h2><p>FIXTURE supplier form</p>'+['firstname','lastname','email','phone'].map(n=>'<label>'+n+'<input name="'+n+'" value=""></label>').join('')+'${tennstopet || agnes || luzette || teatergrillen ? '' : '<textarea ng-model="booking.comment"></textarea>'}${contactFinal ? '<a id="terms-link" href="https://www.waiteraid.com/terms/fixture-a">Fixture terms</a>' : ''}<button id="next">Nästa</button>';
 if(${nativePhone}){const phone=document.querySelector('[name=phone]');phone.className='phoneField';const wrapper=document.createElement('div');wrapper.className='intl-tel-input';phone.before(wrapper);wrapper.innerHTML='<div class="selected-flag" title="Sweden: +46"><span class="iti-flag se"></span></div>';wrapper.append(phone);}
 // The native phone widget copies into Booking only on Next, not on input.
 for(const input of document.querySelectorAll('input,textarea'))input.oninput=()=>{if(!(${nativePhone}&&input.name==='phone'))q[input.name||'comment']=input.value;};
 const dispatch=async()=>{if(${(kvarnen || hantverket) && process.env.VELVET_TEST_OUTCOME==='comment-payload-drop'})q.comment='';if(${agnes && process.env.VELVET_TEST_OUTCOME==='phone-payload-change'})q.phone='+46711111111';if(${contactFinal})console.log('fixture-contact-final-click');try{const response=await fetch(${JSON.stringify(saveUrl)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});const data=await response.json();if(${receiptMode}){if(${JSON.stringify(process.env.VELVET_TEST_OUTCOME)}!=='missing-receipt')location.assign('/reservation/booking/?code='+encodeURIComponent(data.booking.short_code)+'&new=1');else screen.innerHTML='<h2>FIXTURE response only</h2>';}else{history.replaceState({},'', '/reservation/booking/fixture');screen.innerHTML='<h2>FIXTURE response received</h2>';}}catch{screen.innerHTML='<h2>FIXTURE network interrupted</h2>';}};
 const review=()=>{screen.innerHTML='<h2>Kontrollera din bokning</h2><p>FIXTURE '+q.date+' '+q.time+' '+q.amount+' guests${kvarnen ? ' — Lunch; FIXTURE native sitting information retained' : ''}${hantverket ? ' — Lunch; FIXTURE native seating and placement labels retained' : ''}${pelikan ? ' — Middag' : ''}${tennstopet ? ' — Lunch Tennbarens Matsal' : ''}${agnes ? ' — FIXTURE seating and placement labels retained' : ''}${guestChoice ? ' — guest choice completed' : ''}</p><button id="final">Slutför bokningen</button>';if(${kvarnen || pelikan || hantverket}){const preference=document.createElement('p');preference.textContent=q.comment;screen.prepend(preference);}document.querySelector('#final').onclick=dispatch;};
 document.querySelector('#next').onclick=()=>{if(${nativePhone}){q.phone=document.querySelector('[name=phone]').value;q.country_code='46';q.dial_code='46';}if(${contactFinal}){q.phone=document.querySelector('[name="phone"]').value;q.country_code='46';q.dial_code='46';dispatch();}else if(${guestChoice}){if(${nativeGuest}){q.phone=document.querySelector('[name=phone]').value;q.country_code='46';q.dial_code='46';}if(${(kvarnen || hantverket || pelikan || agnes || tennstopet) && process.env.VELVET_TEST_OUTCOME==='direct-contact'}){dispatch();return;}screen.innerHTML='<h2>Fortsätt som gäst</h2><button id="guest">Fortsätt utan konto</button>';document.querySelector('#guest').onclick=review;}else review();};}
</script></body></html>`;
}

if (childMode) {
  // Refuse to act as an arbitrary server preload outside this spawned fixture.
  assert.equal(typeof process.send, 'function');
  assert.ok(process.env.VELVET_PLAYWRIGHT_DB?.startsWith(process.env.VELVET_TEST_DIRECTORY + path.sep));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (address, options) => {
    const url = new URL(typeof address === 'string' || address instanceof URL ? address : address.url);
    if (sazon && ['https://www.tablecheck.com/en/regent-bali-canggu-sazon/reserve/message','https://production-booking.tablecheck.com/v2/booking/availability_v5/grid'].includes(url.href)) {
      const fixture=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/tablecheck-sazon-source.json')));
      const grid=url.pathname.endsWith('/grid');
      assert.equal(options?.method || 'GET',grid?'POST':'GET');
      if(grid){
        const query=JSON.parse(options.body);
        assert.match(query.session_ref,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        assert.deepEqual(query,{shop_id:'regent-bali-canggu-sazon',start_at:date+'T00:00:00.000+08:00',
          pax_adult:2,pax_senior:0,pax_child:0,pax_baby:0,service_category_ids:[],manual_duration:null,
          voucher_ids:[],smoking:'none',orders:[{is_group_order:true,qty:1,menu_item_id:'684f99577a39bdf73ccda4ab'}],
          use_experience_page:true,locale:'en',session_ref:query.session_ref});
        process.send?.({kind:'sazon-historical-rejection-replay',query});
        return Promise.resolve(new Response(JSON.stringify(fixture.grid),{headers:{'content-type':'application/json'}}));
      }
      // Deliberately hostile translation tests text rendering, not supplier behavior.
      fixture.context.menu.items['684f99577a39bdf73ccda4ab'].descriptionTranslations={en:'<img src=x onerror="window.sazonInjected=true">'};
      const encoded=JSON.stringify(fixture.context).replaceAll('&','&amp;').replaceAll("'",'&#39;');
      process.send?.({kind:'sazon-policy-fixture'});
      return Promise.resolve(new Response(`<input data-preloaded="context" value='${encoded}' />`));
    }
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
        if(bofinger)process.on('message',message=>{
          if(message.kind==='fixture-change-notice')page.locator('script#__NEXT_DATA__').evaluate(el=>{const data=JSON.parse(el.textContent);data.props.initialState.appStoreState.restaurantComment.fr='Changed native restaurant notice';el.textContent=JSON.stringify(data);}).then(()=>process.send?.({kind:'fixture-notice-changed'}));
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
      if (nativePhone) context.on('page', page => {process.on('message',message=>{
        if(message.kind==='fixture-check-phone-model')page.evaluate(()=>{
          const query=window.angular.element(document.body).injector().get('Booking').getQuery();
          return {phone:query.phone,countryCode:query.country_code??null,dialCode:query.dial_code??null};
        }).then(model=>process.send?.({kind:'fixture-phone-model',model}));
        if(tennstopet && message.kind==='fixture-idle-selection')page.evaluate(change=>{
          history.replaceState(null,'','/reservation/?hash=48b3bfcf5f5ff2974d516a5bd226850c&version=new&mr=30');
          Object.assign(window.angular.element(document.body).injector().get('Booking').getQuery(),change);
          document.querySelector('#screen').insertAdjacentHTML('afterbegin','<p>FIXTURE idle selector changed</p>');
        },message.change).then(()=>process.send?.({kind:'fixture-idle-changed'}));
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
            const name = process.env.VELVET_TEST_OUTCOME === 'unverified-success' ? 'Wrong restaurant' : kvarnen && process.env.VELVET_TEST_OUTCOME==='wrong-provider-name' ? 'Kvarnen' : hantverket && process.env.VELVET_TEST_OUTCOME==='wrong-provider-name' ? 'Hantverket' : pelikan && process.env.VELVET_TEST_OUTCOME==='wrong-provider-name' ? 'Pelikan' : receiptName;
            return intercepted.fulfill({status:200,contentType:'text/html',body:`<html><meta charset="utf-8"><body><div>${hantverket && process.env.VELVET_TEST_OUTCOME==='english-receipt'?'Thank you for your booking.':'Tack för din bokning.'}</div><div>${hantverket && process.env.VELVET_TEST_OUTCOME==='english-receipt'?'Your confirmation has been sent by email.':'Du är nu klar och bekräftelse har skickats via epost.'}</div><div>${name}</div><div>2 pers. (${pelikan ? 'Middag' : tennstopet ? (process.env.VELVET_TEST_OUTCOME==='wrong-room-receipt'?'Lunch Odengatan':tennLabel) : agnes ? 'Middag' : klotet ? 'Fredagslunch p\u00e5 Caf\u00e9 Klotet' : italiano ? 'Dining Room' : ciccios ? 'Matsal' : boqueria ? 'LUNCH' : 'Lunch'})</div><div>Bokningsreferens</div><div># 999999999</div><div>Gästinformation</div></body></html>`});
          }
          if (request.method() === 'GET' && request.url() === venue.url) {
            if(kvarnen)assert.equal(request.url(),kvarnenTarget,'Exact Stockholm restaurant hash and native version');
            if(hantverket)assert.equal(request.url(),hantTarget,'Native Swedish target must retain version and hash');
            if(teatergrillen)assert.equal(request.url(),teaterTarget,'Selected restaurant target, never bar or selector');
            process.send?.({ kind: 'supplier-document', ...(teatergrillen?{url:request.url()}:{} ) });
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
              if(nativeGuest || gondolen || klotet || luzette || teatergrillen){
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
              if(copine){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='excluded-dinner')data.booking.mealid=4788;
                if(outcome==='excluded-private')data.booking.mealid=5303;
                if(outcome==='excluded-private-lunch')data.booking.mealid=9196;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
              }
              if(gondolen){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome.startsWith('excluded-'))data.booking.mealid=Number(outcome.slice(9));
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                assert.equal(approved.hash,'720cdcb4d664ceeebbe8548904e275e6');
                assert.equal(approved.mealid,33008);assert.equal(approved.amount,2);
                assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
              }
              if(klotet){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=39316;
                if(outcome==='wrong-type')data.booking.meal.type=2;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                assert.equal(approved.hash,'dc1cbc8f42a27a99c6cf4174dd8bf6fa');
                assert.equal(approved.mealid,63872);assert.equal(approved.amount,2);assert.equal(approved.date,date);
                assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
              }
              if(agnes){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='excluded-lunch')data.booking.mealid=1627;
                if(outcome==='excluded-kitchen')data.booking.mealid=2775;
                if(outcome==='excluded-cellar')data.booking.mealid=3568;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                assert.equal(approved.hash,'1e49551d0d8b677c1dc6ad956301cec7');assert.equal(approved.mealid,1628);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');
              }
              if(bobonne){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=155;
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                assert.equal(approved.hash,'b529fb237cb8d5e64c73c1faba7e9854');assert.equal(approved.mealid,31);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');
              }
              if(luzette){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=7254;
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'e2b9133107e1225157d4ea30e3967d5c');assert.equal(approved.mealid,7253);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
              }
              if(kvarnen){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=215;
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'724b0f1e583fb02d404504176bbe156b');assert.equal(approved.mealid,91);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
                assert.equal(approved.comment,kvarnenComment);
                for(const field of ['dog','stroller','room','room_id','mr'])assert.equal(Object.hasOwn(approved,field),false,'No invented room or end time');
              }
              if(hantverket){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=7098;
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'f7f00569986df77ef5d7b4abe98b9bed');assert.equal(approved.mealid,7097);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
                assert.equal(approved.comment,hantComment);
                for(const field of ['dog','stroller','room','room_id','mr'])assert.equal(Object.hasOwn(approved,field),false,'No invented room or end time');
              }
              if(pelikan){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=293;
                if(outcome==='wrong-type')data.booking.meal.type=2;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'27fdc69fb0efef5d4125e11383c08ee8');assert.equal(approved.mealid,1540);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
                assert.equal(approved.comment,pelikanComment);
                for(const field of ['room','room_id','mr','end_time','endtime'])assert.equal(Object.hasOwn(approved,field),false,'No invented room or end time');
              }
              if(tennstopet){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=54065;
                if(outcome==='wrong-type')data.booking.meal.type=2;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'48b3bfcf5f5ff2974d516a5bd226850c');assert.equal(approved.mealid,54277);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
                assert.equal(Object.hasOwn(approved,'mr'),false,'Selector is not a booking room parameter');
              }
              if(teatergrillen){
                const outcome=process.env.VELVET_TEST_OUTCOME;
                if(outcome==='wrong-meal')data.booking.mealid=6492;
                if(outcome==='wrong-type')data.booking.meal.type=3;
                if(outcome==='party-cap')data.booking.amount=3;
                if(outcome==='waitlist')data.booking.waitlist=1;
                if(outcome==='requirement')data.booking.require_noshow=true;
                if(outcome==='payment')data.booking.meal.must_pay_directly=true;
                if(outcome==='mandatory-products')data.booking.meal.mandatory_products=true;
                if(outcome==='group')data.booking.group_booking=true;
                if(outcome==='temporary')data.booking.is_temp_booking=true;
                assert.equal(approved.hash,'e11fb52c16bde7a7d8f255342f6a6eaf');assert.equal(approved.mealid,6491);
                assert.equal(approved.amount,2);assert.equal(approved.phone,'+46700000000');assert.equal(approved.country_code,'46');
                assert.equal(Object.hasOwn(approved,'mr'),false,'Selector is not a booking room parameter');
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
              if(bofinger){
                const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(process.env.VELVET_PLAYWRIGHT_DB,{readOnly:true});
                try{const row=db.prepare('SELECT owner,payload FROM playwright_attempts_v1 ORDER BY rowid DESC LIMIT 1').get();const attempt=JSON.parse(row.payload);
                  assert.equal(attempt.restaurantId,restaurantId);assert.equal(attempt.status,'unknown');assert.equal(attempt.party,2);assert.deepEqual(attempt.details,{shiftId:19170});
                  assert.ok(row.owner&&attempt.sessionId);assert.match(attempt.reviewFingerprint,/^[a-f0-9]{64}$/);
                  const payload=JSON.parse(options.postData);assert.deepEqual(payload.offers,[]);assert.equal(payload.wish,undefined);assert.equal(payload.shift_id,undefined);
                  process.send?.({kind:'durable-service-before-dispatch',shiftId:attempt.details.shiftId});
                }catch(error){process.send?.({kind:'bofinger-fixture-assertion',message:error.message});throw error;}finally{db.close();}
              }
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
              const data={id:createdBooking.id,uuid:createdBooking.uuid,status:'confirmed',day:payload.day,shift_date:payload.day,time:payload.time,nb_guests:payload.nb_guests,...(bofinger?{booking_offers:[]}:dekas?{booking_offers:[{offer_id:118785,count:2}]}:{wish:{booking_room_id:payload.wish.booking_room_id}})};
              if(bofinger){
                assert.equal(Object.hasOwn(data,'shift_id'),false,'No invented raw receipt service field');
                if(outcome==='missing-saved-time')delete data.time;
                if(outcome==='wrong-saved-party')data.nb_guests=3;
                if(outcome==='pending-saved')data.status='waiting';
                if(outcome==='unexpected-offer')data.booking_offers=[{offer_id:1,count:2}];
                if(outcome==='missing-offers')delete data.booking_offers;
                if(outcome==='saved-room')data.wish={booking_room_id:9359};
              }
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
  let child, backend, browser, base, childLog = '', backendStarts=0;
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
  async function start(outcome, tennstopetEnabled = true) {
    backendStarts++;
    const portHolder = http.createServer();
    await new Promise(resolve => portHolder.listen(0, '127.0.0.1', resolve));
    const port = portHolder.address().port;
    await new Promise(resolve => portHolder.close(resolve));
    backend = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--import', import.meta.url, 'api/server.mjs'], { cwd: root, env: {
      ...process.env, VELVET_TEST_SCOPE_GUARDS: scopeGuards ? '1' : '0', VELVET_INTEGRATED_SUPPLIER_FIXTURE: 'child', VELVET_TEST_DIRECTORY: directory,
      VELVET_SAZON_PREPARATION: sazon ? 'enabled' : 'disabled',
      VELVET_GONDOLEN_RECEIPT: gondolen ? 'enabled' : 'disabled',
      VELVET_KLOTET_RECEIPT: klotet ? 'enabled' : 'disabled',
      VELVET_AGNES_RECEIPT: agnes ? 'enabled' : 'disabled',
      VELVET_BOBONNE_RECEIPT: bobonne ? 'enabled' : 'disabled',
      VELVET_LUZETTE_RECEIPT: luzette ? 'enabled' : 'disabled',
      VELVET_KVARNEN_RECEIPT: kvarnen ? 'enabled' : 'disabled',
      VELVET_HANTVERKET_RECEIPT: hantverket ? 'enabled' : 'disabled',
      VELVET_PELIKAN_RECEIPT: pelikan ? 'enabled' : 'disabled',
      VELVET_TENNSTOPET_RECEIPT: tennstopet && tennstopetEnabled ? 'enabled' : 'disabled',
      VELVET_TEATERGRILLEN_RECEIPT: teatergrillen ? 'enabled' : 'disabled',
      VELVET_TEST_PROVIDER: bofinger ? 'Bofinger' : kvarnen ? 'Kvarnen' : hantverket ? 'Hantverket' : pelikan ? 'Pelikan' : tennstopet ? 'Tennstopet' : teatergrillen ? 'Teatergrillen' : luzette ? 'Luzette' : bobonne ? 'Bobonne' : agnes ? 'Agnes' : klotet ? 'Klotet' : gondolen ? 'Gondolen' : sazon ? 'Sazon' : copine ? 'Copine' : italiano ? 'Italiano' : dekas ? 'DeKas' : dagmar ? 'Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau' : astrid ? 'Astrid' : pirouette ? 'Pirouette' : kommendoren ? 'Kommendoren' : balzac ? 'Balzac' : beirut ? 'Beirut' : pesquiere ? 'Pesquiere' : sturehof ? 'Sturehof' : fishcorner ? 'FishCorner' : riche ? 'Riche' : ciccios ? 'Ciccios' : noema ? 'Noema' : 'BokaBord',
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
      VELVET_COPINE_RECEIPT: copine ? 'enabled' : 'disabled',
      VELVET_ZENCHEF_FISHCORNER: zenchef ? 'live' : 'disabled',
      VELVET_ZENCHEF_PESQUIERE: roomVenue ? 'live' : 'disabled',
      VELVET_ZENCHEF_PIROUETTE: pirouette ? 'live' : 'disabled',
      VELVET_ZENCHEF_BOFINGER: bofinger ? 'live' : 'disabled',
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
      await page.locator(sazon ? '#provider-preparation [data-prep-start]' : zenchef ? '#provider-playwright-booking [data-start]' : '#bokabord-mirror [data-start]').waitFor();
      if(bofinger){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Bofinger');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['Bofinger i Paris','exakt tv\u00e5','15 minuters','Ingen viss placering'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','bofinger-scope-'+width+'.png')});}
      if(klotet){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),receiptName);const scope=await page.locator('#bokabord-mirror').innerText();for(const text of ['Fredagslunch','1\u20132','11 september','18 december 2026','12.00\u201314.59','Stockholmstid'])assert.ok(scope.includes(text),'Visible scope '+text);}
      if(klotet){const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Scope readable in viewport');
        await scope.screenshot({path:path.join(root,'..','klotet-scope-'+width+'.png')});}
      if(kvarnen){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Kvarnen');assert.equal(venue.name,'Kvarnen Restaurang');assert.equal(venue.url,kvarnenTarget);
        const find=v=>v&&typeof v==='object'?(v.placeId===restaurantId?v:Object.values(v).map(find).find(Boolean)):null;
        assert.equal(find(JSON.parse(fs.readFileSync(path.join(root,'data/restaurants.json'),'utf8'))).bookingUrl,kvarnenTarget);
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['Kvarnen i Stockholm','1\u20132','m\u00e5ndag\u2013fredag','12.00\u201314.59','23 november\u201323 december 2026','ing\u00e5r inte i det f\u00f6rsta bokningsst\u00f6det','Middag, brunch, julbord','sittningstid och placering'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','kvarnen-scope-'+width+'.png')});}
      if(hantverket){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Restaurang Hantverket');assert.equal(venue.url,hantTarget);
        const official=hantTarget.replace('lang=sw','lang=en');assert.equal(venue.officialEntryUrl,official);
        const find=v=>v&&typeof v==='object'?(v.placeId===restaurantId?v:Object.values(v).map(find).find(Boolean)):null;
        assert.equal(find(JSON.parse(fs.readFileSync(path.join(root,'data/restaurants.json'),'utf8'))).bookingUrl,official);
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie lunch','1\u20132','m\u00e5ndag\u2013fredag','11.30\u201313.59','barnvagn eller hund','placering och sittningstid','ingen viss matsal','Spritbordet'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','hantverket-scope-'+width+'.png')});}
      if(pelikan){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Pelikan');assert.equal(venue.name,'Restaurang Pelikan');
        assert.equal(venue.url,'https://app.bokabord.se/reservation/?hash=27fdc69fb0efef5d4125e11383c08ee8');
        const find=v=>v&&typeof v==='object'?(v.placeId===restaurantId?v:Object.values(v).map(find).find(Boolean)):null;
        assert.equal(find(JSON.parse(fs.readFileSync(path.join(root,'data/restaurants.json'),'utf8'))).bookingUrl,'https://app.waiteraid.com/reservation/?hash=27fdc69fb0efef5d4125e11383c08ee8');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie middag','exakt 2','16.00\u201322.29','linnematsalen eller stora hallen','2 timmar','om inget annat','Lunch','gruppbokningar'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','pelikan-scope-'+width+'.png')});}
      if(tennstopet){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Tennstopet');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of [tennLabel,'exakt 2','fredag\u2013l\u00f6rdag','12.00\u201314.59','halv trappa ned','25 november\u201323 december 2026','Tennstopet Grill'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','tennstopet-scope-'+width+'.png')});}
      if(teatergrillen){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Teatergrillen');
        assert.equal(venue.url,teaterTarget);
        const official='https://app.bokabord.se/reservation/?hash='+teaterBarHash+'&version=new&mr=83';
        assert.equal(venue.officialEntryUrl,official);
        const find=v=>v&&typeof v==='object'?(v.placeId===restaurantId?v:Object.values(v).map(find).find(Boolean)):null;
        assert.equal(find(JSON.parse(fs.readFileSync(path.join(root,'data/restaurants.json'),'utf8'))).bookingUrl,official);
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie lunch','1\u20132','m\u00e5ndag\u2013fredag','13.00\u201314.59','Teatergrillens bar','teatersittning'])assert.ok((await scope.innerText()).includes(text));
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','teatergrillen-scope-'+width+'.png')});}
      if(luzette){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Luzette');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie lunch','1\u20132','11.15\u201314.59','Frukost','middag','gruppbokningar'])assert.ok((await scope.innerText()).includes(text));
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','luzette-scope-'+width+'.png')});}
      if(bobonne){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Brasserie Bobonne');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie lunch','1\u20132','m\u00e5ndag\u2013fredag','11.30\u201313.59','Middag och privat matsal','samma kv\u00e4ll','fler \u00e4n 6','direktkontakt'])assert.ok((await scope.innerText()).includes(text));
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','bobonne-scope-'+width+'.png')});}
      if(agnes){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Restaurang Agnes');
        assert.equal(new URL(venue.url).searchParams.get('version'),'new');
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of ['ordinarie middag','1\u20132','sittningstid och placering','Lunch','Vink\u00e4llaren','v\u00e4ntelista'])assert.ok((await scope.innerText()).includes(text));
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        await scope.screenshot({path:path.join(root,'..','agnes-scope-'+width+'.png')});}
      if(gondolen) assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),'Gondolen','Correct new catalog detail heading');
      if (!sazon) assert.equal(await page.locator('#restaurant-provider-booking').count(), 0, 'Native route wins over registry embed');
    };
    await visit();
    return { context, page, visit };
  }
  const submits = () => messages.filter(m => m.kind === 'supplier-submit').length;
  const panel = page => page.locator(sazon ? '#provider-preparation' : zenchef ? '#provider-playwright-booking' : '#bokabord-mirror');
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
  async function toReview(page, expectRejected = false, directContact = false) {
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
    for (const [name, value] of Object.entries({ firstname: 'Integration', lastname: 'Fixture', email: 'fixture@example.invalid', phone: '+46700000000', ...(kvarnen ? {comment:kvarnenComment} : hantverket ? {comment:hantComment} : pelikan ? {comment:pelikanComment} : {}) })) {
      const input = panel(page).locator(`[data-provider-field="${name}"]`);
      await input.fill(value); await input.blur();
      await page.waitForFunction(({ name, value }) => document.querySelector(`[data-provider-field="${name}"]`)?.dataset.verifiedValue === value, { name, value });
      await settled(page);
    }
    if(kvarnen || hantverket)assert.deepEqual((await panel(page).locator('[data-provider-field]').evaluateAll(fields=>fields.map(el=>el.dataset.providerField))).sort(),['comment','email','firstname','lastname','phone']);
    const before = submits();
    const finalClicks = () => messages.filter(m=>m.kind==='provider-final-click').length;
    const clicksBefore = finalClicks();
    const current = async () => (await api(page,'/restaurant-bookings/mirror/current',{method:'POST'})).body;
    const rawAction = async (state, action) => api(page,`/restaurant-bookings/mirror/${state.id}/action`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:state.revision,...action})});
    if(kvarnen || hantverket || pelikan || tennstopet || (scopeGuards && (noema || ciccios))){
      const phoneModel=new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('native_phone_model_timeout')),5000);
        const receive=message=>{if(message.kind==='fixture-phone-model'){clearTimeout(timer);child.off('message',receive);resolve(message.model);}};
        child.on('message',receive);
      });
      child.send({kind:'fixture-check-phone-model'});
      assert.deepEqual(await phoneModel,{phone:'',countryCode:null,dialCode:null},'Projection must not write the native model before Next');
      assert.equal((await current()).details.phone,'+46700000000');
    }
    if(expectRejected){
      assert.equal(await panel(page).locator('[data-submit]').isHidden(),true,'Invalid source binding hides final action');
      const state=await current();assert.equal(state.canSubmit,false);assert.equal(state.nativeReview,null);
      for(const type of ['review','submit'])assert.equal((await rawAction(state,{type,confirm:true,terms:true})).status,409);
      assert.equal(submits(),before);assert.equal(finalClicks(),clicksBefore);
      assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
      return;
    }
    if (contactFinal && !contactFinalGuardsChecked) {
      const rejected = await rawAction(await current(),{type:'submit',confirm:true,terms:true});
      assert.equal(rejected.status,409); assert.equal(submits(),before); assert.equal(finalClicks(),clicksBefore);
      assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
    }
    await panel(page).locator('[data-submit]').click(); // without consent
    assert.equal(submits(), before);
    await panel(page).locator('[data-terms]').check();
    if(directContact){
      const blockedBefore=messages.filter(m=>m.kind==='adapter-blocked-submit').length;
      await panel(page).locator('[data-submit]').click();await settled(page);
      assert.equal(messages.filter(m=>m.kind==='adapter-blocked-submit').length,blockedBefore+1);
      assert.equal(submits(),before);const state=await current();assert.equal(state.blocked,true);
      assert.notEqual(state.result?.status,'confirmed');assert.equal(state.review,false);
      assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
      await panel(page).locator('[data-refresh]').click();await settled(page);assert.equal(submits(),before);
      return;
    }
    await panel(page).locator('[data-submit]').click();
    await page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-submit]')?.textContent === 'Slutför bokningen');
    await settled(page);
    assert.equal(submits(), before, 'Contact-to-review must not reach supplier save');
    assert.equal(await panel(page).locator('[data-terms]').isChecked(), false, 'Review requires fresh consent');
    if(kvarnen){assert.equal((await current()).details.comment,kvarnenComment);const text=await panel(page).locator('[data-text]').textContent();for(const required of ['Kontrollera din bokning',kvarnenComment,'FIXTURE native sitting information retained'])assert.ok(text.includes(required));await panel(page).screenshot({path:path.join(root,'..','kvarnen-review-'+page.viewportSize().width+'.png')});}
    if(hantverket){assert.equal((await current()).details.comment,hantComment);const text=await panel(page).locator('[data-text]').textContent();for(const required of ['Kontrollera din bokning',hantComment,'FIXTURE native seating and placement labels retained'])assert.ok(text.includes(required));await panel(page).screenshot({path:path.join(root,'..','hantverket-review-'+page.viewportSize().width+'.png')});}
    if(pelikan){assert.equal((await current()).details.comment,pelikanComment);assert.ok((await panel(page).locator('[data-text]').textContent()).includes(pelikanComment));assert.match(await panel(page).locator('[data-text]').textContent(),/Middag/);await panel(page).screenshot({path:path.join(root,'..','pelikan-review-'+page.viewportSize().width+'.png')});}
    if(tennstopet){assert.equal((await current()).review,true);assert.match(await panel(page).locator('[data-text]').textContent(),/Lunch Tennbarens Matsal/);assert.equal(await panel(page).locator('[data-provider-field=comment]').count(),0);await panel(page).screenshot({path:path.join(root,'..','tennstopet-review-'+page.viewportSize().width+'.png')});}
    if(bobonne){assert.equal((await current()).review,true);await panel(page).screenshot({path:path.join(root,'..','bobonne-review-'+page.viewportSize().width+'.png')});}
    if(agnes){assert.equal((await current()).review,true);assert.match(await panel(page).locator('[data-text]').textContent(),/FIXTURE seating and placement labels retained/);assert.equal(await panel(page).locator('[data-provider-field=comment]').count(),0);await panel(page).screenshot({path:path.join(root,'..','agnes-review-'+page.viewportSize().width+'.png')});}
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
      if(teatergrillen)await panel(page).screenshot({path:path.join(root,'..','teatergrillen-review-'+page.viewportSize().width+'.png')});
      if(luzette)await panel(page).screenshot({path:path.join(root,'..','luzette-review-'+page.viewportSize().width+'.png')});
      if(klotet)await panel(page).screenshot({path:path.join(root,'..','klotet-review-'+page.viewportSize().width+'.png')});
      if(gondolen)await panel(page).screenshot({path:path.join(root,'..','gondolen-review-'+page.viewportSize().width+'.png')});
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
    if((agnes && process.argv.includes('--agnes-direct-guards')) || (hantverket && process.argv.includes('--hantverket-comment-guard')) || (kvarnen && process.argv.includes('--kvarnen-comment-guard'))){
      browser=await chromium.launch();
      for(const outcome of (kvarnen||hantverket)?['comment-payload-drop']:['direct-contact','phone-payload-change']){
        await stop();await start(outcome);const view=await makeView();first=view;
        try{
          const before=submits();await toReview(view.page,false,outcome==='direct-contact');
          if(outcome==='phone-payload-change'||outcome==='comment-payload-drop'){
            const blocked=messages.filter(m=>m.kind==='adapter-blocked-submit').length;
            await panel(view.page).locator('[data-terms]').check();await panel(view.page).locator('[data-submit]').click();
            await view.page.waitForFunction(()=>document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus==='unknown',null,{timeout:40000});
            assert.equal(messages.filter(m=>m.kind==='adapter-blocked-submit').length,blocked+1);
            assert.equal((await api(view.page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
          }
          assert.equal(submits(),before);
        }finally{await view.context.close();first=null;}
      }
      assert.equal(messages.filter(m=>m.kind==='unexpected-supplier-request'||m.kind==='blocked-node-network').length,0);
      console.log(JSON.stringify({status:'PASS',scenario:kvarnen?'kvarnen-comment-guard':hantverket?'hantverket-comment-guard':'agnes-direct-guards',runtime:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),APIRequests:apiCalls.length,supplierBoundaryAttempts:submits(),actualSupplierRequests:0}));return;
    }
    if(scopeGuards){
      assert.ok(receiptMode && !contactFinal,'Scoped provider-review scenarios only');
      browser=await chromium.launch();
      for(const outcome of ['unverified-success','invalid-0','invalid-1']){
        await stop();await start(outcome);const view=await makeView();first=view;
        try{
          const before=submits();await toReview(view.page,outcome.startsWith('invalid-'));
          if(outcome==='unverified-success'){
            await panel(view.page).locator('[data-terms]').check();await panel(view.page).locator('[data-submit]').click();
            await view.page.waitForFunction(()=>document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus==='unknown',null,{timeout:40000});
            await settled(view.page);assert.equal(submits(),before+1,'Valid policy-bound control dispatches once');
          }else assert.equal(submits(),before,'Invalid source selection never dispatches');
        }finally{await view.context.close();first=null;}
      }
      assert.equal(messages.filter(m=>m.kind==='unexpected-supplier-request'||m.kind==='blocked-node-network').length,0);
      console.log(JSON.stringify({status:'PASS',scenario:'scope-guards',restaurantId,runtime:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),APIRequests:apiCalls.length,supplierBoundaryAttempts:submits(),actualSupplierRequests:0,invalidSelections:scopeInvalid}));return;
    }
    if (sazon) {
      // Synthetic local sessions exercise normal server cookie/auth lookup. No real account is used.
      const users={},sessions={};
      for(const id of ['operator-one','operator-two','ordinary-member']){
        users[id]={id,email:id+'@example.invalid',name:id,handle:id.startsWith('operator')?'velvet':'fixture-member',role:'user'};
        sessions[createHash('sha256').update('local-test-'+id).digest('hex')]={userId:id,exp:Date.now()+3600000};
      }
      fs.writeFileSync(path.join(directory,'store.json'),JSON.stringify({users,sessions}));
      await start('historical-rejection-only');browser=await chromium.launch();
      const endpoint='/restaurant-bookings/playwright';
      const cookie=id=>({name:'velvet_session',value:'local-test-'+id,url:base,httpOnly:true,sameSite:'Lax'});
      const request=(page,route,body,method='POST')=>api(page,route,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
      const check=s=>{
        assert.equal(s.mode,'prepare');assert.equal(s.preparation,true);assert.equal(s.operatorOnly,true);
        for(const key of ['liveBooking','canHold','canSubmit'])assert.equal(s[key],false);
        assert.equal(s.image,null);assert.equal(s.result,null);assert.equal(s.terms.menu.price,null);
      };
      const guest=await browser.newContext({serviceWorkers:'block'});
      await guest.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
      const guestPage=await guest.newPage();
      await guestPage.goto(base+'/?api='+encodeURIComponent(base)+'#/restaurant/'+restaurantId);
      await guestPage.waitForFunction(()=>document.body.textContent.includes('Sazón'));
      const config=await api(guestPage,endpoint+'/config');
      assert.equal(config.body.preparationOperator,false);
      assert.equal(config.body.providers.some(p=>p.restaurantId===restaurantId),false);
      assert.equal((await request(guestPage,endpoint,{provider:'TableCheck',restaurantId})).status,403);
      assert.equal(await guestPage.locator('#provider-preparation').count(),0);
      assert.ok(await guestPage.locator('a[href*="tablecheck.com"]').count(),'Guest retains external booking');
      await guest.addCookies([cookie('ordinary-member')]);
      assert.equal((await request(guestPage,endpoint,{provider:'TableCheck',restaurantId})).status,403);
      let previousId;
      if(process.argv.includes('--sazon-api-only')){
        await guest.addCookies([cookie('operator-one')]);
        const created=await request(guestPage,endpoint,{provider:'TableCheck',restaurantId});assert.equal(created.status,201);check(created.body);
        let state=created.body;
        const searched=await request(guestPage,endpoint+'/'+state.id+'/action',{type:'search',date,party:2,revision:state.revision});
        assert.equal(searched.status,200);state=searched.body;check(state);assert.equal(state.availabilityEvidence.status,'invalid_menu_items');assert.deepEqual(state.availabilityEvidence.slots,[]);
        const before=messages.filter(m=>m.kind.startsWith('sazon-')).length;
        for(const type of ['hold','submit','fill','click','expireCart','cart_init','cart','cart_update','checkout']){
          const denied=await request(guestPage,endpoint+'/'+state.id+'/action',{type,revision:state.revision,confirm:true,terms:true});assert.equal(denied.status,409);assert.equal(denied.body.error,'inspect_only');
        }
        for(const action of [{type:'search',date,party:2,revision:state.revision-1},{type:'select',slotId:'invented',revision:state.revision},{type:'review',revision:state.revision}])assert.equal((await request(guestPage,endpoint+'/'+state.id+'/action',action)).status,409);
        assert.equal(messages.filter(m=>m.kind.startsWith('sazon-')).length,before);
        await guest.addCookies([cookie('operator-two')]);assert.equal((await request(guestPage,endpoint+'/'+state.id+'/current',{})).status,404);
        await stop();await start('historical-rejection-only');await guest.addCookies([cookie('operator-one')]);
        assert.equal((await request(guestPage,endpoint+'/'+state.id+'/current',{})).status,404);assert.equal((await api(guestPage,endpoint+'/attempts')).body.attempts.length,0);
        await guest.close();console.log('PASS Sazon API only; UI NOT validated',JSON.stringify({apiCalls:apiCalls.length,realProviderCalls:0,bookingWrites:submits(),historicalRejectionReplays:messages.filter(m=>m.kind==='sazon-historical-rejection-replay').length}));return;
      }
      for(const width of [390,1366]){
        const view=await makeView(width,{cookies:[cookie('operator-one')],origins:[]});
        first=view;const page=view.page,prep=page.locator('#provider-preparation');
        await prep.locator('[data-prep-start]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        const [opened]=await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname===endpoint&&r.request().method()==='POST'),prep.locator('[data-prep-start]').click({timeout:5000})]);
        assert.equal(opened.status(),201);let state=await opened.json();check(state);
        previousId=state.id;
        await prep.locator('[data-prep-search]').waitFor();
        assert.match(await prep.locator('[data-prep-policy]').innerText(),/Pris anges inte/);
        assert.match(await prep.locator('[data-prep-policy]').innerText(),/<img src=x onerror=/);
        assert.equal(await prep.locator('img,iframe,[data-submit],[data-terms]').count(),0);
        assert.equal(await page.evaluate(()=>window.sazonInjected),undefined);
        await prep.locator('input[name=date]').fill(date);
        const searching=page.waitForResponse(r=>r.url().endsWith('/action')&&r.request().postDataJSON()?.type==='search');
        await prep.locator('[data-prep-search] button').click();const searched=await searching;
        assert.equal(searched.status(),200);state=await searched.json();check(state);
        assert.equal(state.availabilityEvidence.status,'invalid_menu_items');assert.deepEqual(state.availabilityEvidence.slots,[]);
        await page.waitForFunction(()=>document.querySelector('[data-prep-status]')?.textContent.includes('accepterade inte'));
        assert.equal(await prep.locator('[data-prep-slot]').count(),0);
        const calls=messages.filter(m=>m.kind.startsWith('sazon-')).length;
        for(const type of ['hold','submit','fill','click','expireCart','cart_init','cart','cart_update','checkout']){
          const denied=await request(page,endpoint+'/'+state.id+'/action',{type,revision:state.revision,confirm:true,terms:true});
          assert.equal(denied.status,409);assert.equal(denied.body.error,'inspect_only');
        }
        assert.equal((await request(page,endpoint+'/'+state.id+'/action',{type:'search',date,party:2,revision:state.revision-1})).status,409);
        assert.equal((await request(page,endpoint+'/'+state.id+'/action',{type:'select',slotId:'invented',revision:state.revision})).status,409);
        assert.equal((await request(page,endpoint+'/'+state.id+'/action',{type:'review',revision:state.revision})).status,409);
        assert.equal(messages.filter(m=>m.kind.startsWith('sazon-')).length,calls,'Denied actions make zero supplier calls');
        await guest.addCookies([cookie('operator-two')]);
        assert.equal((await request(guestPage,endpoint+'/'+state.id+'/current',{})).status,404);
        assert.equal((await api(page,endpoint+'/attempts')).body.attempts.length,0);
        await prep.screenshot({path:path.join(root,'..','sazon-preparation-'+width+'.png')});
        if(width===390){
          // Separate UI fault injection: null is not an acknowledged deletion.
          const target=base+endpoint+'/'+state.id;
          await page.route(target,r=>r.request().method()==='DELETE'?r.fulfill({status:200,contentType:'application/json',body:'null'}):r.continue());
          await prep.locator('[data-prep-end]').click();
          await page.waitForFunction(()=>document.querySelector('[data-prep-status]')?.textContent.startsWith('Kunde inte avsluta'));
          assert.equal(await prep.locator('[data-prep-start]').isHidden(),true);
          await page.unroute(target);await prep.locator('[data-prep-end]').click();
          await page.waitForFunction(()=>document.querySelector('[data-prep-status]')?.textContent.endsWith('avslutad.'));
          assert.equal((await request(page,endpoint+'/'+state.id+'/current',{})).status,404);
        }
        await view.context.close();first=null;
      }
      await stop();await start('historical-rejection-only');
      await guest.addCookies([cookie('operator-one')]);
      assert.equal((await request(guestPage,endpoint+'/'+previousId+'/current',{})).status,404);
      assert.equal((await api(guestPage,endpoint+'/attempts')).body.attempts.length,0);
      await guest.close();
      assert.equal(submits(),0);
      assert.equal(messages.filter(m=>m.kind==='blocked-node-network').length,0,'No unexpected provider endpoint attempted');
      const queries=messages.filter(m=>m.kind==='sazon-historical-rejection-replay');assert.equal(queries.length,2);
      for(const {query} of queries){assert.equal(query.start_at,date+'T00:00:00.000+08:00');assert.equal(query.shop_id,'regent-bali-canggu-sazon');assert.equal(query.use_experience_page,true);}
      console.log(JSON.stringify({provider:'Sazon',apiCalls:apiCalls.length,policyFixtures:messages.filter(m=>m.kind==='sazon-policy-fixture').length,historicalRejectionReplays:queries.length,realProviderCalls:0,bookingWrites:0,viewports:[390,1366],availabilityEvidence:'none: historical rejection replay only'}));
      return;
    }
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
        if(bofinger){assert.equal(await panel(page).locator('[data-room]').count(),0);assert.equal(searched.body.availabilityEvidence.candidates[0].shiftId,19170);}
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
        const reviewed=await action(() => panel(page).locator('[data-review]').click());
        if(bofinger){
          assert.equal(reviewed.body.details.shiftId,19170);assert.equal(reviewed.body.details.party,2);assert.equal(reviewed.body.details.offer,undefined);assert.equal(reviewed.body.details.roomId,undefined);
          const notice=reviewed.body.terms.restaurantNotice;assert.ok(notice.includes('15 min'));const terms=await panel(page).locator('[data-terms-text]').innerText();
          assert.ok(terms.includes('15 min'));assert.ok(!terms.includes('<br>'));assert.equal(await panel(page).locator('[data-terms-text]').locator('br,img,iframe').count(),0);
          assert.equal(await panel(page).locator('[data-terms]').isChecked(),false);
          await panel(page).screenshot({path:path.join(root,'..','bofinger-review-'+page.viewportSize().width+'.png')});
          if(scenario.startsWith('form-')){
            assert.equal(reviewed.body.canSubmit,false);const before=submits();
            const rejected=await api(page,'/restaurant-bookings/playwright/'+reviewed.body.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'submit',revision:reviewed.body.revision,reviewToken:reviewed.body.reviewToken,termsVersion:reviewed.body.terms.version,terms:true,confirm:true,idempotencyKey:'fixture-pretransport-guard'})});
            assert.equal(rejected.status,409);assert.equal(submits(),before);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
          }
          if(scenario==='notice-changed'){
            const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('notice_change_timeout')),5000);const receive=m=>{if(m.kind==='fixture-notice-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
            child.send({kind:'fixture-change-notice'});await changed;await panel(page).locator('[data-terms]').check();const before=submits();
            const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='submit');await panel(page).locator('[data-submit]').click();const rejected=await pending;
            assert.equal(rejected.status(),409);assert.equal((await rejected.json()).error,'stale_review');assert.equal(submits(),before);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
          }
        }
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
          assert.ok(messages.some(m=>m.kind==='supplier-own-readback'),'Expected independent own-booking readback');
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
      if(!bofingerTail){
      first = await makeView();
      const success = await flow(first);
      assert.equal(success.body.result.status,'confirmed');
      assert.equal(success.body.result.reference,'999999998');
      if(bofinger){assert.equal(success.body.result.verification.bookingEvidence,'own_booking_readback');assert.equal(success.body.result.verification.shiftId,19170);assert.equal(success.body.details.shiftId,19170);}
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
      if(bofinger)assert.deepEqual(recovered.body.attempts[0].details,{shiftId:19170});
      if(readbackVenue){
        const history=await api(first.page,'/restaurant-bookings');assert.equal(history.status,200);
        const booking=history.body.bookings.find(row=>row.restaurantId===restaurantId);
        if(bofinger){assert.equal(booking.status,'confirmed');assert.equal(booking.party,2);assert.equal(booking.roomId,undefined);assert.equal(booking.offer,undefined);}else if(dekas){assert.equal(booking.offer.offerId,118785);assert.equal(booking.offer.count,2);assert.equal(booking.offer.version,success.body.details.offer.version);assert.equal(booking.offer.mealPrice,null);}else recoveredRoom={roomId:booking.roomId,roomName:booking.roomName};
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
      }
      if(bofinger){for(const outcome of bofingerCases){
        console.log('CHECK Bofinger '+outcome);await stop();await start(outcome);const view=await makeView();
        try{const result=await flow(view,1,chosenRoom,outcome);if(result)assert.equal(result.body.result.status,'unknown',outcome);}
        finally{await view.context.close();}
      }}
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
        actualSupplierRequests:0,liveConfirmationVerified:false,backendRestarts:bofinger?backendStarts-1:dekas?8:pirouette?17:roomVenue?15:2,APIRequests:apiCalls.length,deployed:false}));
      return;
    }
    if(!hantTail && !kvarnenTail){
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
    if(nativeGuest || gondolen || klotet || luzette || teatergrillen)assert.equal(messages.filter(m=>m.kind==='durable-before-provider-dispatch').length,1);
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
    if(tennstopet){const history=await api(third.page,'/restaurant-bookings');assert.equal(history.body.bookings.find(b=>b.restaurantId===restaurantId).mealLabel,tennLabel);
      assert.match(await panel(third.page).locator('[data-text]').textContent(),/Lunch Tennbarens Matsal/);}
    await panel(third.page).locator('[data-refresh]').click(); await settled(third.page);
    assert.equal(submits(), 3);
    assert.equal(await panel(third.page).locator('[data-status]').getAttribute('data-booking-status'), 'confirmed');
    if (receiptMode) {
      assert.equal(messages.filter(m=>m.kind==='supplier-receipt-navigation').length,2);
      assert.ok(!JSON.stringify(recovered.body).includes(receiptCode),'Receipt capability must not be persisted in public attempts');
      await stop(); await start('confirmed');
      const persisted=await api(third.page,'/restaurant-bookings/playwright/attempts');
      assert.equal(persisted.body.attempts[0].status,'confirmed'); assert.equal(persisted.body.attempts[0].reference,'999999999');
      if(kvarnen||hantverket||pelikan||tennstopet||italiano||copine||gondolen||klotet||agnes||bobonne||luzette||teatergrillen){const history=await api(third.page,'/restaurant-bookings');assert.equal(history.status,200);const row=history.body.bookings.find(b=>b.restaurantId===restaurantId);assert.equal(row.status,'confirmed');assert.equal(String(row.providerReference||row.reference),'999999999');if(tennstopet)assert.equal(row.mealLabel,tennLabel);else assert.equal(row.mealLabel,undefined);if(pelikan){assert.equal(row.roomId,undefined);assert.equal(row.roomName,undefined);assert.equal(row.endTime,undefined);}}
    }
    if(tennstopet){
      await stop();await start('confirmed',false);
      const offHistory=await api(third.page,'/restaurant-bookings');const offRow=offHistory.body.bookings.find(b=>b.restaurantId===restaurantId);
      assert.equal(offRow.mealLabel,tennLabel);assert.equal(offRow.status,'confirmed');assert.equal(String(offRow.providerReference),'999999999');
      assert.equal(submits(),3,'Policy-off recovery must not dispatch');
      const stranger=await api(second.page,'/restaurant-bookings');assert.ok(!stranger.body.bookings.some(b=>b.id===offRow.id));
      console.log('PASS Tennstopet confirmed dining-room label survives policy-OFF restart, owner isolation, and API recovery');
    }
    if(kvarnen || hantverket || pelikan || tennstopet || gondolen){
      await third.page.goto(base+'/?api='+encodeURIComponent(base)+'#/bookings');
      const card=third.page.locator('.restaurant-history-card').filter({has:third.page.locator('h3',{hasText:receiptName})});
      await card.waitFor();assert.match(await card.innerText(),/999999999/);
      if(tennstopet)assert.ok((await card.innerText()).includes(tennLabel));else assert.ok(!(await card.innerText()).includes(tennLabel));
      await card.screenshot({path:path.join(root,'..',(kvarnen?'kvarnen':hantverket?'hantverket':pelikan?'pelikan':tennstopet?'tennstopet':'gondolen')+'-history-1366.png')});
      if(tennstopet){await third.page.setViewportSize({width:390,height:844});await third.page.reload();await card.waitFor();assert.ok((await card.innerText()).includes(tennLabel));await card.screenshot({path:path.join(root,'..','tennstopet-history-390.png')});}
    }
    console.log(receiptMode ? 'PASS receipt policy: POST remains unknown until provider main-frame receipt; static completion document confirms matching reference and survives restart' : 'PASS scoped positive Zink receipt through actual app/API/adapter/journal, owner recovery and reference; supplier remains simulated');
    }else browser=await chromium.launch();
    if(kvarnen||hantverket||pelikan||tennstopet||dagmar||italiano||copine||gondolen||klotet||agnes||bobonne||luzette||teatergrillen){
      for(const outcome of kvarnen?kvarnenOutcomes:hantverket?hantOutcomes:pelikan?pelikanOutcomes:tennstopet?tennOutcomes:teatergrillen?teaterOutcomes:luzette?luzetteOutcomes:bobonne?bobonneOutcomes:agnes?agnesOutcomes:klotet?klotetOutcomes:gondolen?gondolenOutcomes:copine?['excluded-dinner','excluded-private','excluded-private-lunch','party-cap','requirement','payment']:italiano?['excluded-lunch','excluded-bar','wrong-type','party-cap','requirement']:['wrong-meal','requirement']){
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
      if(!gondolen || gondolenOutcomes.length)console.log('PASS '+receiptName+' excluded meal/type/party/requirement responses remain unknown');
    }
    if(klotet){
      for(let i=0;i<klotetInvalid.length;i++){
        await stop();await start('invalid-'+i);const view=await makeView();
        try{await toReview(view.page,true);console.log('PASS Klotet pretransport rejection',JSON.stringify(klotetInvalid[i]));}
        finally{await view.context.close();}
      }
    }
    if(agnes){
      for(let i=0;i<agnesInvalid.length;i++){
        await stop();await start('invalid-'+i);const view=await makeView();
        try{await toReview(view.page,true);console.log('PASS Agnes pretransport rejection',JSON.stringify(agnesInvalid[i]));}
        finally{await view.context.close();}
      }
    }
    if(kvarnen || hantverket || pelikan || agnes || tennstopet){await stop();await start('direct-contact');const view=await makeView();
      try{await toReview(view.page,false,true);console.log('PASS '+receiptName+' simulated direct-contact branch is blocked before transport with no journal attempt');}
      finally{await view.context.close();}}
    if(kvarnen || hantverket || pelikan || tennstopet || bobonne || luzette || teatergrillen){
      const invalid=kvarnen?kvarnenInvalid:hantverket?hantInvalid:pelikan?pelikanInvalid:tennstopet?tennInvalid:teatergrillen?teaterInvalid:luzette?luzetteInvalid:bobonneInvalid, boundaries=kvarnen?kvarnenBoundaries:hantverket?hantBoundaries:pelikan?pelikanBoundaries:tennstopet?tennBoundaries:teatergrillen?teaterBoundaries:luzette?luzetteBoundaries:bobonneBoundaries;
      for(let i=0;i<invalid.length;i++){
        await stop();await start('invalid-'+i);const view=await makeView();
        try{await toReview(view.page,true);console.log('PASS '+receiptName+' pretransport rejection',JSON.stringify(invalid[i]));}
        finally{await view.context.close();}
      }
      for(let i=0;i<boundaries.length;i++){
        await stop();await start('boundary-'+i);const view=await makeView();
        try{const before=submits();await toReview(view.page);
          const state=(await api(view.page,'/restaurant-bookings/mirror/current',{method:'POST'})).body;
          assert.equal(state.canSubmit,true);assert.equal(state.details.time,boundaries[i].time);if(boundaries[i].date)assert.equal(state.details.date,boundaries[i].date);if(boundaries[i].amount)assert.equal(state.details.party,boundaries[i].amount);
          assert.equal(submits(),before);assert.equal((await api(view.page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
          console.log('PASS '+receiptName+' accepted boundary at review',JSON.stringify(boundaries[i]));}
        finally{await view.context.close();}
      }
    }
    if(tennstopet){for(const change of [{mealid:54065},{hash:'synthetic-wrong-restaurant'}]){
      await stop();await start('idle-change');const view=await makeView();
      try{await toReview(view.page);const before=submits();
        const state=(await api(view.page,'/restaurant-bookings/mirror/current',{method:'POST'})).body;
        const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('idle_change_timeout')),5000);const receive=m=>{if(m.kind==='fixture-idle-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
        child.send({kind:'fixture-idle-selection',change});await changed;
        const result=await api(view.page,'/restaurant-bookings/mirror/'+state.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:state.revision,type:'submit',confirm:true,terms:true})});
        assert.equal(result.status,409,'Changed idle selector invalidates previous approval');
        assert.equal(result.body.error,'stale_view');
        const refreshed=await api(view.page,'/restaurant-bookings/mirror/'+state.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:state.revision,type:'refresh'})});
        assert.equal(refreshed.status,200);assert.equal(refreshed.body.canSubmit,false);
        await panel(view.page).locator('[data-refresh]').click();await settled(view.page);
        assert.equal(await panel(view.page).locator('[data-submit]').isHidden(),true);
        assert.equal(submits(),before);assert.equal((await api(view.page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
        console.log('PASS Tennstopet idle selector invalidates approval',JSON.stringify(change));
      }finally{await view.context.close();}
    }}
    assert.equal(messages.filter(m => m.kind === 'unexpected-supplier-request').length, 0);
    assert.equal(messages.filter(m => m.kind === 'blocked-node-network').length, 0);
    console.log(JSON.stringify({ status: 'PASS', evidence: 'real_local_app_api_adapter_journal_with_supplier_fixture',
      integrationCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      supplierBoundaryAttempts: submits(), actualSupplierRequests: 0, liveConfirmationVerified: false,
      restaurantId,backendRestarts: kvarnen ? (kvarnenTail?0:5)+kvarnenOutcomes.length+kvarnenInvalid.length+kvarnenBoundaries.length : hantverket ? (hantTail?0:5)+hantOutcomes.length+hantInvalid.length+hantBoundaries.length : pelikan ? 5+pelikanOutcomes.length+pelikanInvalid.length+pelikanBoundaries.length : tennstopet ? 8+tennOutcomes.length+tennInvalid.length+tennBoundaries.length : teatergrillen ? 4+teaterOutcomes.length+teaterInvalid.length+teaterBoundaries.length : luzette ? 4+luzetteOutcomes.length+luzetteInvalid.length+luzetteBoundaries.length : bobonne ? 4+bobonneOutcomes.length+bobonneInvalid.length+bobonneBoundaries.length : agnes ? 5+agnesOutcomes.length+agnesInvalid.length : klotet ? 4+klotetOutcomes.length+klotetInvalid.length : gondolen ? 4+gondolenOutcomes.length : copine ? 10 : italiano ? 9 : dagmar ? 6 : receiptMode ? 4 : 3, APIRequests: apiCalls.length, deployed: false }));
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
