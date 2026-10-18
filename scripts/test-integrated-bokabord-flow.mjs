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
const laCoupole=process.argv.includes('--la-coupole') || process.env.VELVET_TEST_PROVIDER==='LaCoupole';
const terminusNord=process.argv.includes('--terminus-nord') || process.env.VELVET_TEST_PROVIDER==='TerminusNord';
const procope=process.argv.includes('--procope') || process.env.VELVET_TEST_PROVIDER==='Procope';
const laLorraine=process.argv.includes('--la-lorraine') || process.env.VELVET_TEST_PROVIDER==='LaLorraine';
const piedDeCochon=process.argv.includes('--pied-de-cochon') || process.env.VELVET_TEST_PROVIDER==='PiedDeCochon';
const grandCafe=process.argv.includes('--grand-cafe') || process.env.VELVET_TEST_PROVIDER==='GrandCafe';
const vagenende=process.argv.includes('--vagenende') || process.env.VELVET_TEST_PROVIDER==='Vagenende';
const bouillon=process.argv.includes('--bouillon-julien') || process.env.VELVET_TEST_PROVIDER==='BouillonJulien';
const bouillonHolidays=['2026','2030'].flatMap(year=>['12-24','12-25','12-31'].map(day=>year+'-'+day));
const bouillonAdjacent=['2026-12-23','2026-12-26','2026-12-30','2027-01-01','2030-12-23','2030-12-26','2030-12-30','2031-01-01'];
const racine=process.argv.includes('--bouillon-racine') || process.env.VELVET_TEST_PROVIDER==='BouillonRacine';
const republique=process.argv.includes('--bouillon-republique') || process.env.VELVET_TEST_PROVIDER==='BouillonRepublique';
const republiqueTimes=['11:30','12:00','12:30','13:00','13:30','14:00','14:30'];
const republiqueBlocked=['11:45','15:00','18:00'];
const rosie=process.argv.includes('--rosie') || process.env.VELVET_TEST_PROVIDER==='Rosie';
const rosieLou=process.argv.includes('--rosie-lou') || process.env.VELVET_TEST_PROVIDER==='RosieLou';
const jolie=process.argv.includes('--rosie-jolie') || process.env.VELVET_TEST_PROVIDER==='RosieJolie';
const jolieBlocked=['2026','2030'].flatMap(year=>['08-03','08-13','08-23'].map(day=>year+'-'+day));
const jolieAdjacent=['2026-08-02','2026-08-24','2030-08-02','2030-08-24'];
const dateGuardDates=jolie?jolieBlocked:bouillon?bouillonHolidays:[];
const petit=process.argv.includes('--petit-sommelier') || process.env.VELVET_TEST_PROVIDER==='PetitSommelier';
const savy=process.argv.includes('--chez-savy') || process.env.VELVET_TEST_PROVIDER==='ChezSavy';
const rene=process.argv.includes('--chez-rene') || process.env.VELVET_TEST_PROVIDER==='ChezRene';
// Native local rendering from own saved form SHA0b7c5fe6 and referenced bundles; external requests blocked.
const auxEula="J'accepte les conditions g\u00e9n\u00e9rales d'utilisation du service.  \u00a0*";
// Bourgogne own form SHA8cc8b957 also renders this exact EULA with cached native bundles.
// Retro own form SHAb25b0f3d independently renders this EULA from matching cached assets.
// Moulin own form SHAb031a406 independently renders this EULA from matching cached assets.
// Pontoise own form SHA89c2bdfc renders this EULA from matching cached assets.
// Florentin own form SHA277d84c8 renders this EULA with matching cached assets.
// Martha own form SHA10bd667f independently renders the cached native EULA.
// Cafe Marly own form SHA569d9e7d independently renders the cached native EULA.
// Cafe Ruc own form SHA651e5bbc independently renders the cached native EULA.
// Indiana own form SHA18ac3afe independently renders the cached native EULA.
// Richelieu own form SHA35c4cd57 independently renders the cached native EULA.
const richelieu=process.argv.includes('--indiana-richelieu') || process.env.VELVET_TEST_PROVIDER==='IndianaRichelieu';
const indiana=process.argv.includes('--indiana-bonne-nouvelle') || process.env.VELVET_TEST_PROVIDER==='IndianaBonneNouvelle';
const ruc=process.argv.includes('--cafe-ruc') || process.env.VELVET_TEST_PROVIDER==='CafeRuc';
const marly=process.argv.includes('--cafe-marly') || process.env.VELVET_TEST_PROVIDER==='CafeMarly';
const martha=process.argv.includes('--martha') || process.env.VELVET_TEST_PROVIDER==='Martha';
const florentin=process.argv.includes('--le-florentin') || process.env.VELVET_TEST_PROVIDER==='LeFlorentin';
const pontoise=process.argv.includes('--petit-pontoise') || process.env.VELVET_TEST_PROVIDER==='PetitPontoise';
const moulin=process.argv.includes('--moulin-vent') || process.env.VELVET_TEST_PROVIDER==='MoulinVent';
const retro=process.argv.includes('--petit-retro') || process.env.VELVET_TEST_PROVIDER==='PetitRetro';
const bourgogne=process.argv.includes('--aux-crus-bourgogne') || process.env.VELVET_TEST_PROVIDER==='AuxCrusBourgogne';
const aux=process.argv.includes('--aux-bons-crus') || process.env.VELVET_TEST_PROVIDER==='AuxBonsCrus';
const bistrot=process.argv.includes('--bistrot-paris') || process.env.VELVET_TEST_PROVIDER==='BistrotParis';
const savyOrRene=savy || rene || bistrot;
const savyTimes=['12:00','12:30','13:00','13:30','14:00'];
const petitTimes=Array.from({length:29},(_,i)=>String(11+Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0'));
const rosieFamily=rosie || rosieLou || jolie;
const rosieTimes=['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15'];
const partnerGuardOnly=process.argv.includes('--partner-guard-only');
const partnerQueryCases=['partner-query-changed','partner-query-missing','partner-query-null','partner-query-number','partner-query-absent'];
const fieldGuardOnly=process.argv.includes('--field-guard-only');
const lunchCoreOnly=process.argv.includes('--lunch-core-only');
const lunchReviewOnly=process.argv.includes('--lunch-review-only');
const automaticLunch=ruc || marly || moulin || retro || aux || grandCafe || vagenende || racine || republique || rosieFamily || petit || savy;
const cardLunch=marly || pontoise || retro || terminusNord || laLorraine || piedDeCochon || vagenende || republique || rosie || rosieLou || savyOrRene;
const cardThreshold=marly?6:pontoise?6:retro?6:bistrot?6:rene?5:savy?6:rosieFamily?5:republique?4:vagenende?5:piedDeCochon?5:laLorraine?8:12;
const namedLunch=richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || bourgogne || aux || bistrot || rene || bofinger || laCoupole || terminusNord || procope || laLorraine || piedDeCochon || grandCafe || vagenende || bouillon || racine || republique || rosieFamily || petit || savy;
const lunchSlug=richelieu?'indiana-richelieu':indiana?'indiana-bonne-nouvelle':ruc?'cafe-ruc':marly?'cafe-marly':martha?'martha':florentin?'le-florentin':pontoise?'petit-pontoise':moulin?'moulin-vent':retro?'petit-retro':bourgogne?'aux-crus-bourgogne':aux?'aux-bons-crus':bistrot?'bistrot-paris':rene?'chez-rene':savy?'chez-savy':petit?'petit-sommelier':jolie?'rosie-jolie':rosieLou?'rosie-lou':rosie?'rosie':republique?'bouillon-republique':racine?'bouillon-racine':bouillon?'bouillon-julien':vagenende?'vagenende':grandCafe?'grand-cafe':piedDeCochon?'pied-de-cochon':laLorraine?'la-lorraine':procope?'procope':terminusNord?'terminus-nord':laCoupole?'la-coupole':'bofinger';
const lunchTail=namedLunch && process.argv.includes('--'+lunchSlug+'-tail');
const lunchSource=namedLunch?JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/'+lunchSlug+'-source.json'),'utf8')):null;
const roomCases=['selected','unknown','missing','string','flag-missing','flag-string','mandatory','mandatory-missing','mandatory-string','rooms-missing','room-id','room-name','bookable','available'];
const rucCardCases=["missing", "null", "flag-missing", "flag-null", "flag-string", "flag-number", "flag-true", "min-missing", "min-null", "min-string", "min-drift", "price-missing", "price-null", "price-string", "price-drift"];
function mutateRucCard(shift,mutation){if(mutation==='missing')delete shift.charge_param;else if(mutation==='null')shift.charge_param=null;else {const c=shift.charge_param;if(mutation==='flag-missing')delete c.is_web_booking_askable;if(mutation==='flag-null')c.is_web_booking_askable=null;if(mutation==='flag-string')c.is_web_booking_askable='false';if(mutation==='flag-number')c.is_web_booking_askable=0;if(mutation==='flag-true')c.is_web_booking_askable=true;if(mutation==='min-missing')delete c.min_guests;if(mutation==='min-null')c.min_guests=null;if(mutation==='min-string')c.min_guests='1';if(mutation==='min-drift')c.min_guests=6;if(mutation==='price-missing')delete c.charge_per_guests;if(mutation==='price-null')c.charge_per_guests=null;if(mutation==='price-string')c.charge_per_guests='40';if(mutation==='price-drift')c.charge_per_guests=30;}}
const lunchCases=[...(ruc?[...rucCardCases.map(v=>'form-disabled-card-'+v),...rucCardCases.map(v=>'card-changed-'+v),'form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-cancellation-reference','form-cancellation-exact','form-cancellation-missing','form-cancellation-null','form-cancellation-string','form-notice-empty','form-shift-breakfast','form-shift-tea','shift-comment-changed','shift-comment-en','notice-en-changed','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(marly?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-null-card','form-card-price','form-card-price-type','form-borrowed-confirmation','form-cancellation-reference','form-cancellation-exact','form-cancellation-missing','form-cancellation-null','form-cancellation-string','form-notice-empty','form-shift-breakfast','form-shift-tea','shift-comment-changed','shift-comment-en','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...((richelieu || indiana || marly || martha)?[...partnerQueryCases,'partner-state-changed','partner-state-missing','partner-state-null','partner-state-number','search-partner-missing','search-partner-wrong','search-partner-number','form-partner-missing','form-partner-wrong','form-partner-number','form-state-partner-missing','form-state-partner-wrong','form-state-partner-number','form-state-partner-null','payload-partner-wrong']:[]),...((richelieu || indiana || martha || florentin)?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-auto-type','form-borrowed-card','form-cancellation-reference','form-cancellation-exact','form-cancellation-missing','form-cancellation-null','form-cancellation-string','form-notice-empty',...(richelieu?['form-shift-continu','form-shift-breakfast','form-shift-happyhour','notice-en-changed']:indiana?['form-shift-continu','notice-en-changed']:martha?['form-shift-second']:['form-shift-morning','form-shift-afternoon']),'shift-comment-changed','shift-comment-en','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(pontoise?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-null-card','form-card-price','form-card-price-type','form-cancellation-reference','form-cancellation-exact','form-cancellation-missing','form-cancellation-null','form-cancellation-string','form-notice-empty','search-partner-missing','search-partner-wrong','search-partner-number','form-partner-missing','form-partner-wrong','form-partner-number','form-state-partner-missing','form-state-partner-wrong','form-state-partner-number','form-state-partner-null','payload-partner-wrong',...partnerQueryCases,'partner-state-changed','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(moulin?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-borrowed-card','form-cancellation-reference','form-cancellation-exact','form-notice-empty','form-seating-missing','form-seating-empty','form-seating-null','form-seating-changed','shift-comment-changed','shift-comment-en','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(retro?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-borrowed-confirmation','form-null-card','form-card-price','form-card-price-type','form-cancellation-reference','form-cancellation-exact','form-notice-empty','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(bourgogne?['form-room-optional','form-room-selected','form-room-unknown','form-room-missing','form-room-string','form-room-flag-missing','form-room-flag-string','form-room-mandatory','form-room-mandatory-missing','form-room-mandatory-string','form-auto-type','form-cancellation-reference','form-cancellation-exact','form-notice-empty','room-selected-changed','room-mandatory-changed','custom-required-changed']:[]),...(aux?[...roomCases.map(v=>'form-room-'+v),'form-cancellation-reference','form-cancellation-exact','form-notice-empty','room-selected-changed','room-definition-changed','room-mandatory-changed','custom-required-changed']:[]),...(bistrot?['form-custom-required']:[]),...(rene || bistrot || bourgogne || pontoise || florentin || martha || indiana || richelieu?['form-borrowed-confirmation','form-auto-missing','form-auto-drift','form-auto-flag-missing','form-auto-flag-string','form-auto-flag-number','form-auto-flag-null','form-auto-flag-true']:[]),...(savyOrRene?['form-card-price','form-card-price-type','form-cancellation-reference','form-cancellation-exact','form-notice-empty']:[]),...(petit?['form-cancellation-reference','form-cancellation-exact','form-notice-missing','form-notice-null','form-notice-number','form-notice-object','form-notice-changed','form-eula-empty','search-partner-missing','search-partner-wrong','form-partner-missing','form-partner-wrong','payload-partner-wrong']:[]),...(jolie?['form-cancellation-reference','form-cancellation-exact','form-borrowed-card','date-changed','holiday-readback']:[]),...(rosie || rosieLou?['form-card-price','form-card-price-type','form-cancellation-reference','form-cancellation-exact']:[]),...(republique?['form-card-price','form-card-price-type','form-cancellation-reference','form-cancellation-exact','time-changed','wrong-saved-time']:[]),...(racine?['form-cancellation-reference','form-cancellation-exact']:[]),...(bouillon?['form-auto-missing','form-auto-type','form-auto-drift','form-cancellation-exact','form-cancellation-reference','date-changed','holiday-readback']:[]),...(vagenende?['form-card-price','form-card-price-type','form-cancellation-reference']:[]),...(automaticLunch?['form-auto-flag-missing','form-auto-flag-string','form-auto-flag-number','form-auto-flag-null','form-auto-until-missing','form-auto-until-string','form-auto-until-drift']:[]),...(procope?['form-auto-missing','form-auto-type','form-auto-drift']:[]),...(cardLunch?['form-card-threshold-string','form-card-threshold-null','form-card-threshold-missing','form-card-threshold-drift','form-card-flag-type',...(!automaticLunch?['form-auto-type']:[])]:[]),'notice-changed','form-card','form-manual','form-prepayment','form-shift','form-cancellation','missing-saved-time','wrong-saved-party','pending-saved','unexpected-offer','missing-offers','saved-room','mismatch-readback-id','mismatch-readback-uuid','mismatch-readback-date','readback-error','readback-http-error',...(bistrot || rene?['custom-required-changed']:[])];
const lunchFrom=process.argv.find(arg=>arg.startsWith('--lunch-from='))?.split('=')[1];
assert.ok(!lunchFrom || lunchCases.includes(lunchFrom),'Unknown lunch tail start');
const lunchOnly=process.argv.find(arg=>arg.startsWith('--lunch-only='))?.split('=')[1];
assert.ok(!lunchOnly || lunchCases.includes(lunchOnly),'Unknown lunch case');
const readbackVenue = namedLunch || roomVenue || dekas;
const zenchef = fishcorner || readbackVenue;
const chosenRoom = pirouette ? 52521 : 52372;
const otherRoom = pirouette ? 65674 : 51183;
const alternateRoom = pirouette ? 65674 : 52373;
const chosenRoomName = pirouette ? 'Salle principale' : 'Mazagran salle';
const zenchefShift = richelieu ? 276858 : indiana ? 253448 : ruc ? 32216 : marly ? 122853 : martha ? 159369 : florentin ? 283681 : pontoise ? 9493 : moulin ? 139531 : retro ? 116623 : bourgogne ? 22200 : aux ? 20711 : bistrot ? 68145 : rene ? 68277 : savy ? 68279 : petit ? 37613 : jolie ? 298043 : rosieLou ? 118503 : rosie ? 43203 : republique ? 528175 : racine ? 93989 : bouillon ? 12711 : vagenende ? 63972 : grandCafe ? 19590 : piedDeCochon ? 29 : laLorraine ? 16674 : procope ? 18190 : terminusNord ? 19380 : laCoupole ? 20148 : bofinger ? 19170 : dekas ? 494748 : pirouette ? 189024 : pesquiere ? 136503 : 545372;
const zenchefRid = richelieu ? '375454' : indiana ? '373444' : ruc ? '353947' : marly ? '353937' : martha ? '364490' : florentin ? '376209' : pontoise ? '118' : moulin ? '363128' : retro ? '361808' : bourgogne ? '352723' : aux ? '352718' : bistrot ? '357075' : rene ? '357076' : savy ? '357117' : petit ? '1404' : jolie ? '376490' : rosieLou ? '361941' : rosie ? '355132' : republique ? '357115' : racine ? '132' : bouillon ? '350246' : vagenende ? '356807' : grandCafe ? '101232' : piedDeCochon ? '247' : laLorraine ? '478' : procope ? '250682' : terminusNord ? '82241' : laCoupole ? '83871' : bofinger ? '84941' : dekas ? '386643' : pirouette ? '363313' : pesquiere ? '362908' : '388090';
const zenchefName = richelieu ? 'Indiana Caf\u00e9 Richelieu-Drouot' : indiana ? 'Indiana Caf\u00e9 Bonne Nouvelle' : ruc ? 'Le Caf\u00e9 Ruc' : marly ? 'Le Caf\u00e9 Marly' : martha ? 'Martha \u2013 Pizze Amore' : florentin ? 'Le Florentin' : pontoise ? 'Le Petit Pontoise' : moulin ? 'Au Moulin \u00e0 Vent' : retro ? 'Le Petit R\u00e9tro' : bourgogne ? 'Aux Crus de Bourgogne' : aux ? 'Aux Bons Crus' : bistrot ? 'Le Bistrot de Paris' : rene ? 'Chez Ren\u00e9' : savy ? 'Chez Savy' : petit ? 'Le Petit Sommelier' : jolie ? 'Brasserie Rosie Jolie' : rosieLou ? 'Brasserie Rosie Lou' : rosie ? 'Brasserie Rosie' : republique ? 'Bouillon R\u00e9publique' : racine ? 'Bouillon Racine' : bouillon ? 'Bouillon Julien' : vagenende ? 'Brasserie Vagenende' : grandCafe ? 'Le Grand Caf\u00e9 Capucines' : piedDeCochon ? 'Au Pied de Cochon' : laLorraine ? 'La Lorraine' : procope ? 'Le Procope' : terminusNord ? 'Terminus Nord' : laCoupole ? 'La Coupole' : bofinger ? 'Bofinger' : dekas ? 'DeKas' : pirouette ? 'Pirouette' : pesquiere ? 'Pesquiere' : 'FishCorner';
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
assert.ok([florentin,pontoise,moulin,retro,bourgogne,aux,bistrot,rene,savy,petit,jolie,rosieLou,rosie,republique,racine,bouillon,vagenende,grandCafe,piedDeCochon,laLorraine,procope,terminusNord,laCoupole,bofinger,kvarnen,hantverket,pelikan,tennstopet,teatergrillen,luzette,bobonne,agnes,klotet,gondolen,sazon,fishcorner,pesquiere,pirouette,dekas,noema,ciccios,riche,sturehof,beirut,balzac,kommendoren,astrid,vau,boqueria,dagmar,italiano,copine].filter(Boolean).length <= 1, 'Choose one named provider scenario');
// Noema/Ciccios saved-source evidence: issue129 comment6241312516, native phoneField/Next copy.
const nativePhone = contactFinal || nativeGuest || noema || ciccios;
const receiptMode = noema || guestChoice || contactFinal;
const receiptName = kvarnen ? 'Kvarnen Restaurang' : hantverket ? 'Restaurang Hantverket' : pelikan ? 'Restaurang Pelikan' : tennstopet ? 'Tennstopet' : teatergrillen ? 'Teatergrillen' : luzette ? 'Luzette' : bobonne ? 'Brasserie Bobonne' : agnes ? 'Agnes' : klotet ? 'Caf\u00e9 Klotet' : gondolen ? 'Gondolen' : copine ? 'Copine' : italiano ? 'Italiano' : dagmar ? 'Villa Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau De Ville' : astrid ? 'Brasserie Astrid' : kommendoren ? 'Kommendören' : balzac ? 'Brasserie Balzac' : beirut ? 'Beirut Café' : sturehof ? 'Sturehof' : riche ? 'Riche' : ciccios ? "Ciccio's" : 'Noema';
const receiptCode = kvarnen ? 'synthetic-kvarnen-only' : hantverket ? 'synthetic-hantverket-only' : pelikan ? 'synthetic-pelikan-only' : tennstopet ? 'synthetic-tennstopet-only' : teatergrillen ? 'synthetic-teatergrillen-only' : luzette ? 'synthetic-luzette-only' : bobonne ? 'synthetic-bobonne-only' : agnes ? 'synthetic-agnes-only' : klotet ? 'synthetic-klotet-only' : gondolen ? 'synthetic-gondolen-only' : copine ? 'synthetic-copine-only' : italiano ? 'synthetic-italiano-only' : dagmar ? 'synthetic-dagmar-only' : boqueria ? 'synthetic-boqueria-only' : vau ? 'synthetic-vau-only' : astrid ? 'synthetic-astrid-only' : kommendoren ? 'synthetic-kommendoren-only' : balzac ? 'synthetic-balzac-only' : beirut ? 'synthetic-beirut-only' : sturehof ? 'synthetic-sturehof-only' : riche ? 'synthetic-riche-only' : ciccios ? 'synthetic-ciccios-only' : 'synthetic-noema-only';
const mealId = kvarnen ? 91 : hantverket ? 7097 : pelikan ? 1540 : tennstopet ? 54277 : teatergrillen ? 6491 : luzette ? 7253 : bobonne ? 31 : agnes ? 1628 : klotet ? 63872 : gondolen ? 33008 : copine ? 4790 : italiano ? 22890 : dagmar ? 63588 : boqueria ? 22 : vau ? 22476 : astrid ? 55508 : kommendoren ? 3501 : balzac ? 354 : beirut ? 30471 : sturehof ? 3913 : riche ? 7180 : ciccios ? 2379 : noema ? 35204 : 9778;
const scopeInvalid = [{mealid:999999999},{amount:noema ? 9 : ciccios ? 8 : 3}];
const mealType = tennstopet ? 0 : klotet ? 0 : dagmar ? 0 : noema || guestLunch || contactFinal ? 2 : 3;
const restaurantId = richelieu ? 'curated-PAR-indiana-cafe-richelieu-drouot' : indiana ? 'curated-PAR-indiana-cafe-bonne-nouvelle' : ruc ? 'curated-PAR-le-cafe-ruc' : marly ? 'curated-PAR-le-cafe-marly' : martha ? 'curated-PAR-martha-pizze-amore' : florentin ? 'curated-PAR-le-florentin' : pontoise ? 'curated-PAR-le-petit-pontoise' : moulin ? 'curated-PAR-au-moulin-a-vent' : retro ? 'curated-PAR-le-petit-retro' : bourgogne ? 'curated-PAR-aux-crus-de-bourgogne' : aux ? 'curated-PAR-aux-bons-crus' : bistrot ? 'curated-PAR-le-bistrot-de-paris' : rene ? 'curated-PAR-chez-rene' : savy ? 'curated-PAR-chez-savy' : petit ? 'curated-PAR-le-petit-sommelier' : jolie ? 'curated-PAR-brasserie-rosie-jolie' : rosieLou ? 'curated-PAR-brasserie-rosie-lou' : rosie ? 'curated-PAR-brasserie-rosie' : republique ? 'curated-PAR-bouillon-republique' : racine ? 'curated-PAR-bouillon-racine' : bouillon ? 'curated-PAR-bouillon-julien' : vagenende ? 'curated-PAR-brasserie-vagenende' : grandCafe ? 'curated-PAR-le-grand-cafe-capucines' : piedDeCochon ? 'curated-PAR-au-pied-de-cochon' : laLorraine ? 'curated-PAR-la-lorraine' : procope ? 'curated-PAR-le-procope' : terminusNord ? 'curated-PAR-terminus-nord' : laCoupole ? 'curated-PAR-la-coupole' : bofinger ? 'curated-PAR-bofinger' : kvarnen ? 'curated-STO-kvarnen' : hantverket ? 'curated-STO-hantverket' : pelikan ? 'curated-STO-pelikan' : tennstopet ? 'curated-STO-tennstopet' : teatergrillen ? 'curated-STO-teatergrillen' : luzette ? 'curated-STO-luzette' : bobonne ? 'curated-STO-brasserie-bobonne' : agnes ? 'curated-STO-agnes' : klotet ? 'curated-STO-cafe-klotet' : gondolen ? 'curated-STO-gondolen' : sazon ? 'osm-BAL-sazon' : copine ? 'curated-STO-copine' : italiano ? 'curated-STO-italiano' : dekas ? 'curated-AMS-de-kas' : dagmar ? 'curated-STO-villa-dagmar' : boqueria ? 'curated-STO-boqueria' : vau ? 'curated-STO-vau-de-ville' : astrid ? 'curated-STO-brasserie-astrid' : pirouette ? 'osm-MCO-pirouette' : kommendoren ? 'curated-STO-kommendoren' : balzac ? 'curated-STO-balzac' : beirut ? 'curated-STO-beirut-cafe' : pesquiere ? 'osm-STT-la-pesquiere-le-mazagran-et-lou-revelen' : sturehof ? 'curated-STO-sturehof' : fishcorner ? 'osm-SBH-fishcorner' : riche ? 'curated-STO-riche' : ciccios ? 'curated-STO-ciccios' : noema ? 'curated-STO-noema' : 'curated-STO-zink-italian-cuisine';
const venue = JSON.parse(fs.readFileSync(path.join(root, 'api/bokabord-restaurants.json')))[receiptMode ? restaurantId : 'curated-STO-zink-italian-cuisine'];
const saveUrl = 'https://app.bokabord.se/reservation/api/booking/saveBooking';
let date = process.env.VELVET_TEST_DATE || (tennstopet || klotet ? '2026-10-23' : '2030-01-15');
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
  if(namedLunch){
    const captured=structuredClone(aux?JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/aux-bons-crus-native.json'),'utf8')).dailyAvailabilities['2026-10-23'].shifts[0]:lunchSource.dailyAvailabilities['2026-10-23'].shifts[0]);
    Object.assign(shift,captured,{bookable_from:null,bookable_to:null,shift_slots:[slot]});delete slot.available_rooms;
    Object.assign(state,{name:lunchSource.name,currency:'EUR',language:'fr',restaurantTimezone:'Europe/Paris',hasRoomSelection:false,mandatoryFields:lunchSource.mandatoryFields,restaurantComment:lunchSource.restaurantComment});
    const outcome=process.env.VELVET_TEST_OUTCOME;
    if(richelieu || indiana || ruc || marly || martha || florentin){shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));state.customFields=[];if(form)state.wish.slot=url.searchParams.get('slot');if(form && outcome==='form-borrowed-card')shift.charge_param={is_web_booking_askable:true,min_guests:6,charge_per_guests:25};if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=0;if(form && outcome==='form-cancellation-missing')delete shift.cancelation_param.enduser_cancelable_before;if(form && outcome==='form-cancellation-null')shift.cancelation_param.enduser_cancelable_before=null;if(form && outcome==='form-cancellation-string')shift.cancelation_param.enduser_cancelable_before='10800';if(form && outcome==='form-shift-morning')shift.id=282308;if(form && outcome==='form-shift-afternoon')shift.id=283683;}
    if(richelieu && form){if(outcome==='form-shift-continu')shift.id=276861;if(outcome==='form-shift-breakfast')shift.id=276855;if(outcome==='form-shift-happyhour')shift.id=314291;}
    if(indiana && form && outcome==='form-shift-continu')shift.id=253445;
    if(ruc && form){if(outcome?.startsWith('form-disabled-card-'))mutateRucCard(shift,outcome.slice('form-disabled-card-'.length));if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=18300;if(outcome==='form-cancellation-string')shift.cancelation_param.enduser_cancelable_before='21600';if(outcome==='form-shift-breakfast')shift.id=32215;if(outcome==='form-shift-tea')shift.id=294991;}
    if(marly && form){if(outcome==='form-null-card')shift.charge_param=null;if(outcome==='form-card-price')shift.charge_param.charge_per_guests=25;if(outcome==='form-card-price-type')shift.charge_param.charge_per_guests='50';if(outcome==='form-borrowed-confirmation')shift.confirmation={is_auto:false,is_auto_until:6};if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=10800;if(outcome==='form-cancellation-string')shift.cancelation_param.enduser_cancelable_before='18300';if(outcome==='form-shift-breakfast')shift.id=122851;if(outcome==='form-shift-tea')shift.id=35528;}
    if(richelieu || indiana || marly || martha){state.partner_id='1001';if(form && outcome==='form-shift-second')shift.id=159418;if(form && outcome==='form-state-partner-missing')delete state.partner_id;if(form && outcome==='form-state-partner-wrong')state.partner_id='9999';if(form && outcome==='form-state-partner-number')state.partner_id=1001;if(form && outcome==='form-state-partner-null')state.partner_id=null;}
    if(pontoise){shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));state.customFields=[];state.partner_id='1001';if(form)state.wish.slot=url.searchParams.get('slot');if(form && outcome==='form-null-card')shift.charge_param=null;if(form && outcome==='form-card-price')shift.charge_param.charge_per_guests=10;if(form && outcome==='form-card-price-type')shift.charge_param.charge_per_guests='25';if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=10800;if(form && outcome==='form-cancellation-missing')delete shift.cancelation_param.enduser_cancelable_before;if(form && outcome==='form-cancellation-null')shift.cancelation_param.enduser_cancelable_before=null;if(form && outcome==='form-cancellation-string')shift.cancelation_param.enduser_cancelable_before='0';if(form && outcome==='form-state-partner-missing')delete state.partner_id;if(form && outcome==='form-state-partner-wrong')state.partner_id='9999';if(form && outcome==='form-state-partner-number')state.partner_id=1001;if(form && outcome==='form-state-partner-null')state.partner_id=null;}
    if(moulin){shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));state.customFields=[];if(form)state.wish.slot=url.searchParams.get('slot');if(form && outcome==='form-borrowed-card')shift.charge_param={is_web_booking_askable:true,min_guests:6,charge_per_guests:10};if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=14400;if(form && outcome==='form-seating-missing')delete shift.comment;if(form && outcome==='form-seating-empty')shift.comment.fr='';if(form && outcome==='form-seating-null')shift.comment.fr=null;if(form && outcome==='form-seating-changed')shift.comment.fr='Changed seating';}
    if(retro){shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));state.customFields=[];if(form)state.wish.slot=url.searchParams.get('slot');if(form && outcome==='form-borrowed-confirmation')shift.confirmation={is_auto:false,is_auto_until:4};if(form && outcome==='form-null-card')shift.charge_param=null;if(form && outcome==='form-card-price')shift.charge_param.charge_per_guests=20;if(form && outcome==='form-card-price-type')shift.charge_param.charge_per_guests='10';if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=7200;}
    if(bourgogne){shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));state.customFields=[];if(form)state.wish.slot=url.searchParams.get('slot');if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='shift';if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=10800;}
    if(aux){
      state.hasRoomSelection=true;state.rooms=structuredClone(lunchSource.rooms);state.customFields=[];
      shift.shift_slots=structuredClone(captured.shift_slots).map(slot=>({...slot,bookable_from:null,bookable_to:null}));
      if(form)state.wish.slot=url.searchParams.get('slot');
      if(form && outcome==='form-borrowed-confirmation')shift.confirmation={is_auto:false,is_auto_until:4};
      if(form && outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
      if(form && outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=7200;
    }
    if(form && outcome?.startsWith('form-room-')){
      const mutation=outcome.slice(10);
      if(mutation==='selected')state.wish.room_id=richelieu || indiana || ruc?lunchSource.dailyAvailabilities['2026-10-23'].shifts[0].bookable_rooms[0]:marly?41006:martha?57498:florentin?95254:pontoise?5207:moulin?51857:retro?45475:bourgogne?10308:10289;
      if(mutation==='unknown')state.wish.room_id=999;
      if(mutation==='missing')delete state.wish.room_id;
      if(mutation==='string')state.wish.room_id='null';
      if(mutation==='flag-missing')delete state.hasRoomSelection;
      if(mutation==='flag-string')state.hasRoomSelection='true';
      if(mutation==='disabled')state.hasRoomSelection=false;
      if(mutation==='optional')state.hasRoomSelection=true;
      if(mutation==='mandatory')state.isRoomMandatory=true;
      if(mutation==='mandatory-missing')delete state.isRoomMandatory;
      if(mutation==='mandatory-string')state.isRoomMandatory='false';
      if(mutation==='rooms-missing')delete state.rooms;
      if(mutation==='room-id')state.rooms[0].id=999;
      if(mutation==='room-name')state.rooms[0].name='Other room';
      if(mutation==='bookable')shift.bookable_rooms=[999];
      if(mutation==='available')shift.shift_slots[0].available_rooms[2]=[999];
    }
    if(form && outcome==='form-card')shift.charge_param={...shift.charge_param,is_web_booking_askable:true,...(cardLunch?{min_guests:2}:{})};
    if(form && cardLunch){
      if(outcome==='form-card-threshold-string')shift.charge_param.min_guests=String(cardThreshold);
      if(outcome==='form-card-threshold-null')shift.charge_param.min_guests=null;
      if(outcome==='form-card-threshold-missing')delete shift.charge_param.min_guests;
      if(outcome==='form-card-threshold-drift')shift.charge_param.min_guests=bistrot?5:cardThreshold+1;
      if(outcome==='form-card-flag-type')shift.charge_param.is_web_booking_askable='true';
      if(outcome==='form-auto-type')shift.confirmation.is_auto_until='6';
    }
    if(form && (procope || bouillon)){
      if(outcome==='form-auto-missing')delete shift.confirmation.is_auto_until;
      if(outcome==='form-auto-type')shift.confirmation.is_auto_until=String(bouillon?8:4);
      if(outcome==='form-auto-drift')shift.confirmation.is_auto_until=richelieu?11:indiana?6:martha || florentin?4:6;
    }
    if(form && automaticLunch){
      if(outcome==='form-auto-flag-missing')delete shift.confirmation.is_auto;
      if(outcome==='form-auto-flag-string')shift.confirmation.is_auto='true';
      if(outcome==='form-auto-flag-number')shift.confirmation.is_auto=1;
      if(outcome==='form-auto-flag-null')shift.confirmation.is_auto=null;
      if(outcome==='form-auto-until-missing')delete shift.confirmation.is_auto_until;
      if(outcome==='form-auto-until-string')shift.confirmation.is_auto_until='null';
      if(outcome==='form-auto-until-drift')shift.confirmation.is_auto_until=6;
    }
    if(form && outcome==='form-manual'){if(automaticLunch)shift.confirmation.is_auto=false;else shift.confirmation.is_auto_until=null;}
    if(form && outcome==='form-prepayment')shift.prepayment_param={is_web_booking_askable:true};
    if(form && outcome==='form-shift')shift.id=richelieu?276865:indiana?253452:ruc?32217:marly?116978:martha?159419:florentin?301346:pontoise?47972:moulin?140331:retro?116917:bourgogne?63455:aux?57365:bistrot?68148:rene?68278:savy?68280:petit?37614:jolie?411615:rosieLou?118508:rosie?80093:racine?371604:procope?18191:laCoupole?19170:20148;
    if(republique){shift.shift_slots=[...republiqueTimes,...republiqueBlocked].map(name=>({...slot,name}));if(form)state.wish.slot=url.searchParams.get('slot');}
    if(rosieFamily){shift.shift_slots=rosieTimes.map(name=>({...slot,name}));if(form)state.wish.slot=url.searchParams.get('slot');}
    if(petit){shift.shift_slots=petitTimes.map(name=>({...slot,name}));if(form)state.wish.slot=url.searchParams.get('slot');}
    if(savyOrRene){shift.shift_slots=savyTimes.map(name=>({...slot,name}));if(form)state.wish.slot=url.searchParams.get('slot');}
    if(form && savyOrRene){
      if(outcome==='form-card-price')shift.charge_param.charge_per_guests=rene?20:50;
      if(outcome==='form-card-price-type')shift.charge_param.charge_per_guests=rene?'50':'20';
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=bistrot?10800:rene?1800:21600;
    }
    if(bistrot){
      state.customFields=structuredClone(lunchSource.customFields);
      if(form && outcome==='form-custom-required'){state.customFields[0].enabled=true;state.customFields[0].required=true;state.mandatoryFields={...state.mandatoryFields,'custom_field.test':'required'};}
    }
    if(form && (rene || bistrot || bourgogne || pontoise || florentin || martha || indiana || richelieu)){
      if(outcome==='form-borrowed-confirmation')shift.confirmation={is_auto:true,is_auto_until:null};
      if(outcome==='form-auto-missing')delete shift.confirmation.is_auto_until;
      if(outcome==='form-auto-type')shift.confirmation.is_auto_until=richelieu?'14':indiana?'11':martha || florentin?'6':'4';
      if(outcome==='form-auto-drift')shift.confirmation.is_auto_until=richelieu?11:indiana?6:martha || florentin?4:6;
      if(outcome==='form-auto-flag-missing')delete shift.confirmation.is_auto;
      if(outcome==='form-auto-flag-string')shift.confirmation.is_auto='false';
      if(outcome==='form-auto-flag-number')shift.confirmation.is_auto=0;
      if(outcome==='form-auto-flag-null')shift.confirmation.is_auto=null;
      if(outcome==='form-auto-flag-true')shift.confirmation.is_auto=true;
    }
    if(form && savy && outcome==='form-borrowed-confirmation')shift.confirmation={is_auto:false,is_auto_until:4};
    if(form && petit){
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=21660;
    }
    if(form){
      if(outcome==='form-notice-missing')delete state.restaurantComment.fr;
      if(outcome==='form-notice-null')state.restaurantComment.fr=null;
      if(outcome==='form-notice-number')state.restaurantComment.fr=7;
      if(outcome==='form-notice-object')state.restaurantComment.fr={text:''};
      if(outcome==='form-notice-empty')state.restaurantComment.fr='';
      if(outcome==='form-notice-changed')state.restaurantComment.fr='Changed notice';
    }
    if(form && jolie){
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='shift';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=43200;
      if(outcome==='form-borrowed-card')shift.charge_param={is_web_booking_askable:true,min_guests:5,charge_per_guests:10};
    }
    if(form && rosieLou && outcome==='form-null-card')shift.charge_param=null;
    if(form && (rosie || rosieLou)){
      if(outcome==='form-card-price')shift.charge_param.charge_per_guests=4;
      if(outcome==='form-card-price-type')shift.charge_param.charge_per_guests='10';
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='shift';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=rosieLou?21600:43200;
    }
    if(form && republique){
      if(outcome==='form-card-price')shift.charge_param.charge_per_guests=5;
      if(outcome==='form-card-price-type')shift.charge_param.charge_per_guests='4';
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=21660;
    }
    if(form && vagenende){
      if(outcome==='form-card-price')shift.charge_param.charge_per_guests=20;
      if(outcome==='form-card-price-type')shift.charge_param.charge_per_guests='25';
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='shift';
    }
    if(form && racine){
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=10860;
    }
    if(form && bouillon){
      if(outcome==='form-cancellation-exact')shift.cancelation_param.enduser_cancelable_before=10800;
      if(outcome==='form-cancellation-reference')shift.cancelation_param.enduser_cancelable_reference='booking';
    }
    if(form && outcome==='form-cancellation')shift.cancelation_param.enduser_cancelable_before=1;
  }
  const data = {page:form?'/form':'/results',query:Object.fromEntries(url.searchParams),props:{initialState:{appStoreState:state}}};
  if(ruc || florentin || moulin || retro){assert.equal(url.searchParams.has('pid'),false);assert.equal(url.searchParams.has('fullscreen'),false);assert.equal(Object.hasOwn(data.query,'pid'),false);assert.equal(Object.hasOwn(data.query,'fullscreen'),false);}
  if(ruc){assert.equal(url.searchParams.has('shxpid'),false);assert.equal(Object.hasOwn(state,'partner_id'),false);}
  if(bourgogne || aux || savyOrRene){assert.equal(url.searchParams.get('fullscreen'),'1');assert.equal(url.searchParams.has('pid'),false);assert.equal(data.query.fullscreen,'1');assert.equal(Object.hasOwn(data.query,'pid'),false);}
  if(richelieu || indiana || marly || martha || petit || pontoise){
    if(marly || martha || pontoise)assert.equal(url.searchParams.has('fullscreen'),false);
    assert.equal(url.searchParams.get('pid'),'1001','Native routing must preserve official partner');
    const outcome=process.env.VELVET_TEST_OUTCOME;
    if(outcome===(form?'form-partner-missing':'search-partner-missing'))delete data.query.pid;
    if(outcome===(form?'form-partner-wrong':'search-partner-wrong'))data.query.pid='9999';if(outcome===(form?'form-partner-number':'search-partner-number'))data.query.pid=1001;
  }
  return `<html><meta charset="utf-8"><body><h1>${namedLunch?lunchSource.name:zenchefName} LOCAL TEST — no real booking</h1>${roomVenue&&form?`<div>${rooms.find(room=>room.id===Number(url.searchParams.get('room_id')))?.name}</div>`:''}${pirouette&&form?`<div id="seating">Jusqu&#39;à 21:00</div>`:''}<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
  ${form ? ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('') +
    `<div class="iti"><button type="button" class="iti__selected-country" title="France (+33)" aria-label="Selected country France"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div>` +
    `<label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox" ${richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || aux || bourgogne?'style="white-space:pre-wrap"':''}><input type="checkbox">${process.env.VELVET_TEST_OUTCOME==='form-eula-empty'?'':richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || aux || bourgogne?auxEula:'Synthetic test terms'}</label>
    <button data-testid="validate-btn">Reserve fixture</button><script>
    document.querySelector('[data-testid="validate-btn"]').onclick=()=>{
      const value=k=>document.querySelector('[data-testid="'+k+'-input"]').value;
      const firstname=value('firstname'),lastname=value('lastname'),email=value('email'),phone=value('phone');
      const payload={day:${JSON.stringify(date)},nb_guests:2,time:${JSON.stringify(richelieu||indiana||ruc||marly||martha||florentin||pontoise||moulin||retro||bourgogne||aux||republique||rosieFamily||petit||savyOrRene?url.searchParams.get('slot'):'12:30')},lang:'fr',firstname,lastname,civility:'mr',country:'fr',phone_number:phone,email,
        comment:'',custom_field:{},custom_field_v2:[],customersheet:{firstname,lastname,civility:'mr',phone,email,
        optins:[{type:'review_mail',value:true},{type:'review_sms',value:true}],country:'fr',lang:'fr'},offers:[],partner_id:'1001',type:'web'${roomVenue?",wish:{booking_room_id:"+Number(url.searchParams.get('room_id'))+"}":''}};
      ${(richelieu || indiana || marly || martha || petit || pontoise) && process.env.VELVET_TEST_OUTCOME==='payload-partner-wrong'?"payload.partner_id='9999';":''}
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
        if(namedLunch || fishcorner || roomVenue)process.on('message',message=>{
          if(message.kind==='fixture-change-time')page.locator('script#__NEXT_DATA__').evaluate(el=>{const data=JSON.parse(el.textContent);data.props.initialState.appStoreState.wish.slot='15:00';el.textContent=JSON.stringify(data);}).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-date')page.locator('script#__NEXT_DATA__').evaluate((el,changedDate)=>{const data=JSON.parse(el.textContent);data.props.initialState.appStoreState.wish.day=changedDate;el.textContent=JSON.stringify(data);},jolie?'2030-08-13':'2030-12-24').then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-partner')page.locator('script#__NEXT_DATA__').evaluate((el,mutation)=>{const data=JSON.parse(el.textContent);if(mutation==='partner-query-changed')data.query.pid='9999';else if(mutation==='partner-query-missing')delete data.query.pid;else if(mutation==='partner-query-null')data.query.pid=null;else if(mutation==='partner-query-number')data.query.pid=1001;else if(mutation==='partner-query-absent')delete data.query;else if(mutation==='partner-state-missing')delete data.props.initialState.appStoreState.partner_id;else if(mutation==='partner-state-null')data.props.initialState.appStoreState.partner_id=null;else if(mutation==='partner-state-number')data.props.initialState.appStoreState.partner_id=1001;else data.props.initialState.appStoreState.partner_id='9999';el.textContent=JSON.stringify(data);},message.mutation).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-shift-comment')page.locator('script#__NEXT_DATA__').evaluate((el,language)=>{const data=JSON.parse(el.textContent);const state=data.props.initialState.appStoreState;(Object.values(state.dailyAvailabilities)[0].shifts[0].comment ??= {})[language]='Changed native shift notice';el.textContent=JSON.stringify(data);},message.language).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-room')page.locator('script#__NEXT_DATA__').evaluate((el,{mutation,roomId})=>{const data=JSON.parse(el.textContent);const state=data.props.initialState.appStoreState;if(mutation==='room-selected-changed')state.wish.room_id=roomId;if(mutation==='room-definition-changed')state.rooms[0].name='Changed room';if(mutation==='room-mandatory-changed')state.isRoomMandatory=true;el.textContent=JSON.stringify(data);},{mutation:message.mutation,roomId:richelieu || indiana || ruc?lunchSource.dailyAvailabilities['2026-10-23'].shifts[0].bookable_rooms[0]:marly?41006:martha?57498:florentin?95254:pontoise?5207:moulin?51857:retro?45475:bourgogne?10308:10289}).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-custom')page.locator('script#__NEXT_DATA__').evaluate(el=>{const data=JSON.parse(el.textContent);const state=data.props.initialState.appStoreState;state.customFields ??= [{id:4379,slug:'test'}];state.customFields[0] ??= {id:4379,slug:'test'};state.customFields[0].enabled=true;state.customFields[0].required=true;state.mandatoryFields['custom_field.test']='required';el.textContent=JSON.stringify(data);}).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-card')page.locator('script#__NEXT_DATA__').evaluate((el,mutation)=>{const data=JSON.parse(el.textContent);const shift=Object.values(data.props.initialState.appStoreState.dailyAvailabilities)[0].shifts[0];if(mutation==='missing')delete shift.charge_param;else if(mutation==='null')shift.charge_param=null;else {const c=shift.charge_param;if(mutation==='flag-missing')delete c.is_web_booking_askable;if(mutation==='flag-null')c.is_web_booking_askable=null;if(mutation==='flag-string')c.is_web_booking_askable='false';if(mutation==='flag-number')c.is_web_booking_askable=0;if(mutation==='flag-true')c.is_web_booking_askable=true;if(mutation==='min-missing')delete c.min_guests;if(mutation==='min-null')c.min_guests=null;if(mutation==='min-string')c.min_guests='1';if(mutation==='min-drift')c.min_guests=6;if(mutation==='price-missing')delete c.charge_per_guests;if(mutation==='price-null')c.charge_per_guests=null;if(mutation==='price-string')c.charge_per_guests='40';if(mutation==='price-drift')c.charge_per_guests=30;}el.textContent=JSON.stringify(data);},message.mutation).then(()=>process.send?.({kind:'fixture-notice-changed'}));
          if(message.kind==='fixture-change-notice')page.locator('script#__NEXT_DATA__').evaluate((el,language)=>{const data=JSON.parse(el.textContent);data.props.initialState.appStoreState.restaurantComment[language]='Changed native restaurant notice';el.textContent=JSON.stringify(data);},message.language ?? 'fr').then(()=>process.send?.({kind:'fixture-notice-changed'}));
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
              if(namedLunch){
                const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(process.env.VELVET_PLAYWRIGHT_DB,{readOnly:true});
                try{const row=db.prepare('SELECT owner,payload FROM playwright_attempts_v1 ORDER BY rowid DESC LIMIT 1').get();const attempt=JSON.parse(row.payload);
                  assert.equal(attempt.restaurantId,restaurantId);assert.equal(attempt.status,'unknown');assert.equal(attempt.party,2);assert.deepEqual(attempt.details,{shiftId:zenchefShift});
                  assert.ok(row.owner&&attempt.sessionId);assert.match(attempt.reviewFingerprint,/^[a-f0-9]{64}$/);
                  const payload=JSON.parse(options.postData);if(savyOrRene)assert.equal(payload.partner_id,'1001');if(richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || aux || bourgogne || bistrot){assert.equal(payload.partner_id,'1001');assert.deepEqual(payload.custom_field,{});assert.deepEqual(payload.custom_field_v2,[]);}if(petit){assert.equal(payload.partner_id,'1001');assert.equal(payload.time,'17:45');assert.equal(attempt.time,'17:45');}assert.deepEqual(payload.offers,[]);assert.equal(payload.wish,undefined);assert.equal(payload.shift_id,undefined);
                  process.send?.({kind:'durable-service-before-dispatch',shiftId:attempt.details.shiftId});
                }catch(error){process.send?.({kind:'lunch-fixture-assertion',message:error.message});throw error;}finally{db.close();}
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
              const data={id:createdBooking.id,uuid:createdBooking.uuid,status:'confirmed',day:payload.day,shift_date:payload.day,time:payload.time,nb_guests:payload.nb_guests,...(namedLunch?{booking_offers:[]}:dekas?{booking_offers:[{offer_id:118785,count:2}]}:{wish:{booking_room_id:payload.wish.booking_room_id}})};
              if(namedLunch){
                assert.equal(Object.hasOwn(data,'shift_id'),false,'No invented raw receipt service field');
                if(outcome==='holiday-readback'){data.day=jolie?'2030-08-13':'2030-12-24';data.shift_date=data.day;}
                if(outcome==='wrong-saved-time')data.time='15:00';
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
  async function start(outcome, tennstopetEnabled = true, fixtureDate = date) {
    date=fixtureDate;
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
      VELVET_TEST_DATE: date,
      VELVET_TEST_PROVIDER: richelieu ? 'IndianaRichelieu' : indiana ? 'IndianaBonneNouvelle' : ruc ? 'CafeRuc' : marly ? 'CafeMarly' : martha ? 'Martha' : florentin ? 'LeFlorentin' : pontoise ? 'PetitPontoise' : moulin ? 'MoulinVent' : retro ? 'PetitRetro' : bourgogne ? 'AuxCrusBourgogne' : aux ? 'AuxBonsCrus' : bistrot ? 'BistrotParis' : rene ? 'ChezRene' : savy ? 'ChezSavy' : petit ? 'PetitSommelier' : jolie ? 'RosieJolie' : rosieLou ? 'RosieLou' : rosie ? 'Rosie' : republique ? 'BouillonRepublique' : racine ? 'BouillonRacine' : bouillon ? 'BouillonJulien' : vagenende ? 'Vagenende' : grandCafe ? 'GrandCafe' : piedDeCochon ? 'PiedDeCochon' : laLorraine ? 'LaLorraine' : procope ? 'Procope' : terminusNord ? 'TerminusNord' : laCoupole ? 'LaCoupole' : bofinger ? 'Bofinger' : kvarnen ? 'Kvarnen' : hantverket ? 'Hantverket' : pelikan ? 'Pelikan' : tennstopet ? 'Tennstopet' : teatergrillen ? 'Teatergrillen' : luzette ? 'Luzette' : bobonne ? 'Bobonne' : agnes ? 'Agnes' : klotet ? 'Klotet' : gondolen ? 'Gondolen' : sazon ? 'Sazon' : copine ? 'Copine' : italiano ? 'Italiano' : dekas ? 'DeKas' : dagmar ? 'Dagmar' : boqueria ? 'Boqueria' : vau ? 'Vau' : astrid ? 'Astrid' : pirouette ? 'Pirouette' : kommendoren ? 'Kommendoren' : balzac ? 'Balzac' : beirut ? 'Beirut' : pesquiere ? 'Pesquiere' : sturehof ? 'Sturehof' : fishcorner ? 'FishCorner' : riche ? 'Riche' : ciccios ? 'Ciccios' : noema ? 'Noema' : 'BokaBord',
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
      VELVET_ZENCHEF_INDIANARICHELIEU: richelieu ? 'live' : 'disabled',
      VELVET_ZENCHEF_INDIANABONNENOUVELLE: indiana ? 'live' : 'disabled',
      VELVET_ZENCHEF_CAFERUC: ruc ? 'live' : 'disabled',
      VELVET_ZENCHEF_CAFEMARLY: marly ? 'live' : 'disabled',
      VELVET_ZENCHEF_MARTHA: martha ? 'live' : 'disabled',
      VELVET_ZENCHEF_LEFLORENTIN: florentin ? 'live' : 'disabled',
      VELVET_ZENCHEF_PETITPONTOISE: pontoise ? 'live' : 'disabled',
      VELVET_ZENCHEF_MOULINVENT: moulin ? 'live' : 'disabled',
      VELVET_ZENCHEF_PETITRETRO: retro ? 'live' : 'disabled',
      VELVET_ZENCHEF_AUXCRUSBOURGOGNE: bourgogne ? 'live' : 'disabled',
      VELVET_ZENCHEF_AUXBONSCRUS: aux ? 'live' : 'disabled',
      VELVET_ZENCHEF_BISTROTPARIS: bistrot ? 'live' : 'disabled',
      VELVET_ZENCHEF_CHEZRENE: rene ? 'live' : 'disabled',
      VELVET_ZENCHEF_CHEZSAVY: savy ? 'live' : 'disabled',
      VELVET_ZENCHEF_PETITSOMMELIER: petit ? 'live' : 'disabled',
      VELVET_ZENCHEF_ROSIEJOLIE: jolie ? 'live' : 'disabled',
      VELVET_ZENCHEF_ROSIELOU: rosieLou ? 'live' : 'disabled',
      VELVET_ZENCHEF_ROSIE: rosie ? 'live' : 'disabled',
      VELVET_ZENCHEF_BOUILLONREPUBLIQUE: republique ? 'live' : 'disabled',
      VELVET_ZENCHEF_BOUILLONRACINE: racine ? 'live' : 'disabled',
      VELVET_ZENCHEF_BOUILLONJULIEN: bouillon ? 'live' : 'disabled',
      VELVET_ZENCHEF_VAGENENDE: vagenende ? 'live' : 'disabled',
      VELVET_ZENCHEF_GRANDCAFE: grandCafe ? 'live' : 'disabled',
      VELVET_ZENCHEF_PIEDDECOCHON: piedDeCochon ? 'live' : 'disabled',
      VELVET_ZENCHEF_LALORRAINE: laLorraine ? 'live' : 'disabled',
      VELVET_ZENCHEF_PROCOPE: procope ? 'live' : 'disabled',
      VELVET_ZENCHEF_TERMINUSNORD: terminusNord ? 'live' : 'disabled',
      VELVET_ZENCHEF_LACOUPOLE: laCoupole ? 'live' : 'disabled',
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
      if(namedLunch){assert.equal((await page.locator('.restaurant-detail h1').innerText()).trim(),zenchefName);
        const scope=page.locator('.booking-scope');await scope.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        for(const text of [richelieu?'18-20 Boulevard Montmartre i Paris':indiana?'42 bis Boulevard Bonne Nouvelle i Paris':ruc?'159 rue Saint-Honor\u00e9 i Paris':marly?'93 rue de Rivoli i Paris':martha?'48 rue Richard Lenoir i Paris':florentin?'10 Rue Saint-Florentin i Paris':pontoise?'9 rue de Pontoise i Paris':moulin?'20 rue des Foss\u00e9s Saint-Bernard i Paris':retro?'5 rue Mesnil i Paris':bourgogne?'3 rue Bachaumont i Paris':aux?'54 rue Godefroy Cavaignac i Paris':bistrot?'33 rue de Lille i Paris':rene?'14 boulevard Saint-Germain i Paris':savy?'23 rue Bayard i Paris':petit?'49 avenue du Maine i Paris':jolie?'38 avenue Raymond Poincar\u00e9 i Paris':rosieLou?'31 boulevard de Bonne Nouvelle i Paris':rosie?'53 rue du Faubourg Saint-Antoine i Paris':republique?'39 boulevard du Temple i Paris':zenchefName+' i Paris','exakt tv\u00e5',richelieu || indiana || ruc || marly?'lunchserveringen D\u00e9jeuner':martha?'MIDI 1er service':florentin || pontoise || moulin || retro?'lunchserveringen D\u00e9jeuner':bourgogne?'lunchserveringen D\u00e9jeuner service 1':aux?'lunchserveringen Semaine Midi':savyOrRene?'lunchserveringen Midi':petit?'MIDI-service':jolie?'D\u00c9JEUNER':rosieLou?'Service midi semaine':rosie?'Midi Semaine':republique?'11.30, 12.00, 12.30, 13.00, 13.30, 14.00 och 14.30':racine?'f\u00f6rsta lunchsittningen (D\u00e9jeuner 1 service)':bouillon || vagenende?'ordinarie lunch':procope?'f\u00f6rsta lunchsittningen (D\u00e9jeuner 1er service)':'15 minuters','Ingen viss placering'])assert.ok((await scope.innerText()).includes(text),text);
        assert.ok(await scope.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
        if(richelieu || indiana)assert.ok((await scope.innerText()).includes('Terrassplatser kan inte reserveras.'));
        if(moulin)assert.ok((await scope.innerText()).includes('1 timme och 30 minuter'));
        if(procope || vagenende || bouillon || republique || savyOrRene)assert.ok(!(await scope.innerText()).includes('15 min'));
        if(petit || savyOrRene){const text=await scope.innerText();for(const absent of ['15 min','augusti','december','11.30','garanterar inget bord'])assert.ok(!text.includes(absent));}
        if(jolie){const text=await scope.innerText();for(const expected of ['3\u201323 augusti','saknar \u00e5rtal','inte en bekr\u00e4ftad \u00e5rlig st\u00e4ngning','15 minuter'])assert.ok(text.includes(expected),expected);assert.ok(!text.includes('kontakta eller bes\u00f6ka'));}
        if(rosie || rosieLou){const text=await scope.innerText();for(const expected of ['15 minuter','garanterar inget bord'])assert.ok(text.includes(expected));for(const absent of ['oavsett \u00e5r','11.30','24, 25 och 31 december'])assert.ok(!text.includes(absent));}
        if(racine){const text=await scope.innerText();assert.ok(text.includes('franska bokningsformul\u00e4ret'));assert.ok(!text.includes('31 december'));assert.ok(!text.includes('20 minuter'));}
        if(bouillon){const text=await scope.innerText();for(const expected of ['24, 25 och 31 december','oavsett \u00e5r','hela s\u00e4llskapet','plats utan reservation garanteras'])assert.ok(text.includes(expected),expected);}
        if(vagenende){const text=await scope.innerText();assert.ok(!text.includes('2025'));assert.ok(!text.includes('22h'));}
        if(piedDeCochon)assert.ok((await scope.innerText()).includes('utan reservation'));
        await scope.screenshot({path:path.join(root,'..',lunchSlug+'-scope-'+width+'.png')});}
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
      let offerGuardsChecked=false;let holidayGuardRuns=0;
      await start('confirmed'); browser = await chromium.launch();
      const flow = async (view, expectedDispatches = 1, roomId = chosenRoom, scenario = '', selectedTime = petit?'17:45':rosieFamily?'12:15':'12:30') => {
        const page = view.page;const flowDispatchesBefore=submits();
        const action = async click => {
          const pending = page.waitForResponse(r => r.request().method() === 'POST'
            && /^\/restaurant-bookings\/playwright(?:\/[a-f0-9-]+\/action)?$/.test(new URL(r.url()).pathname), {timeout:65_000});
          await click(); const response = await pending;
          const body = await response.json();
          assert.ok(response.ok(), 'Real provider API: ' + JSON.stringify({status:response.status(),error:body.error}));
          await page.waitForFunction(() => !document.querySelector('#provider-playwright-booking [data-refresh]')?.disabled);
          return {body,request:response.request().postDataJSON()};
        };
        const opened=await action(() => panel(page).locator('[data-start]').click());
        if((bouillon || jolie) && !scenario && [0,2].includes(submits()) && holidayGuardRuns<2){
          const before=submits(),documents=messages.filter(m=>m.kind==='supplier-document').length;
          for(const blockedDate of dateGuardDates){
            await panel(page).locator('[name=date]').fill(blockedDate);
            const calls=apiCalls.filter(c=>c.action==='search').length;
            await panel(page).locator('[data-search] button').click();
            assert.match(await panel(page).locator('[data-status]').innerText(),jolie?/3.23 augusti/:/24, 25 och 31 december/);
            assert.equal(apiCalls.filter(c=>c.action==='search').length,calls,'UI holiday guard prevents API search');
            const current=await api(page,'/restaurant-bookings/playwright/'+opened.body.id+'/current',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
            const rejected=await api(page,'/restaurant-bookings/playwright/'+opened.body.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'search',date:blockedDate,party:2,revision:current.body.revision})});
            assert.equal(rejected.status,400);assert.equal(rejected.body.error,jolie?'summer_date_unsupported':'special_date_unsupported');
          }
          assert.equal(submits(),before);assert.equal(messages.filter(m=>m.kind==='supplier-document').length,documents);
          const refresh=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/current'));
          await panel(page).locator('[data-refresh]').click();await refresh;await page.waitForFunction(()=>!document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
          holidayGuardRuns++;console.log('PASS '+zenchefName+' scoped date UI/API guards, run '+holidayGuardRuns);
        }
        await panel(page).locator('[name=date]').fill(date);
        if(scenario.startsWith('search-partner-')){
          const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='search');await panel(page).locator('[data-search] button').click();const response=await pending;
          assert.equal(response.status(),502);assert.equal((await response.json()).error,'provider_state_unverified');assert.equal(submits(),flowDispatchesBefore);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
        }
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
        if(namedLunch){assert.equal(await panel(page).locator('[data-room]').count(),0);assert.equal(searched.body.availabilityEvidence.candidates[0].shiftId,zenchefShift);}
        if(richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || aux || bourgogne){const times=richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || bourgogne || retro?lunchSource.dailyAvailabilities['2026-10-23'].shifts[0].shift_slots.filter(s=>s.possible_guests.includes(2)).map(s=>s.name):lunchSource.lunch.slots.map(s=>s.name);assert.deepEqual(searched.body.availabilityEvidence.candidates.map(s=>s.time),times);assert.deepEqual(await panel(page).locator('[data-slot]').evaluateAll(nodes=>nodes.map(n=>n.dataset.slot)),times);}
        if(savyOrRene){assert.deepEqual(searched.body.availabilityEvidence.candidates.map(s=>s.time),savyTimes);assert.deepEqual(await panel(page).locator('[data-slot]').evaluateAll(nodes=>nodes.map(n=>n.dataset.slot)),savyTimes);}
        if(petit){assert.deepEqual(searched.body.availabilityEvidence.candidates.map(s=>s.time),petitTimes);assert.deepEqual(await panel(page).locator('[data-slot]').evaluateAll(nodes=>nodes.map(n=>n.dataset.slot)),petitTimes);}
        if(rosieFamily){assert.deepEqual(searched.body.availabilityEvidence.candidates.map(s=>s.time),rosieTimes);assert.deepEqual(await panel(page).locator('[data-slot]').evaluateAll(nodes=>nodes.map(n=>n.dataset.slot)),rosieTimes);}
        if(republique){
          assert.deepEqual(searched.body.availabilityEvidence.candidates.map(s=>s.time),republiqueTimes);
          assert.deepEqual(await panel(page).locator('[data-slot]').evaluateAll(nodes=>nodes.map(n=>n.dataset.slot)),republiqueTimes);
          const before=submits(),documents=messages.filter(m=>m.kind==='supplier-document').length;
          for(const time of republiqueBlocked){
            assert.equal(await panel(page).locator('[data-slot="'+time+'"]').count(),0);
            const current=await api(page,'/restaurant-bookings/playwright/'+searched.body.id+'/current',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
            const rejected=await api(page,'/restaurant-bookings/playwright/'+searched.body.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'select',time,shiftId:zenchefShift,revision:current.body.revision})});
            assert.ok(rejected.status>=400);assert.equal(submits(),before);
          }
          assert.equal(messages.filter(m=>m.kind==='supplier-document').length,documents,'No native navigation for excluded times');
          const refresh=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/current'));
          await panel(page).locator('[data-refresh]').click();await refresh;await page.waitForFunction(()=>!document.querySelector('#provider-playwright-booking [data-refresh]').disabled);
        }
        let selected;
        if(scenario==='form-custom-required' || scenario.startsWith('form-partner-') || scenario==='form-notice-number' || scenario==='form-notice-object'){
          const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='select');
          await panel(page).locator('[data-slot="'+selectedTime+'"]').click();const response=await pending;const body=await response.json();
          assert.ok(response.status()>=400);assert.equal(submits(),flowDispatchesBefore);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);
          if(scenario==='form-custom-required')assert.equal(body.error,'provider_fields_unverified');console.log('PASS closed selection '+scenario+' HTTP'+response.status()+' '+body.error);return;
        }
        selected=await action(() => panel(page).locator('[data-slot="'+selectedTime+'"]').click());
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
        if(richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || bourgogne || aux || vagenende || bistrot)assert.equal(await panel(page).locator('[data-field]').count(),6);
        await panel(page).locator('[data-field="civility"]').selectOption('mr');
        await action(() => panel(page).locator('[data-save]').click());
        const reviewed=await action(() => panel(page).locator('[data-review]').click());
        if(namedLunch){
          if(vagenende){assert.ok(!(await panel(page).locator('[data-final-details]').innerText()).includes('22h'));}
          assert.equal(reviewed.body.details.shiftId,zenchefShift);assert.equal(reviewed.body.details.party,2);assert.equal(reviewed.body.details.offer,undefined);assert.equal(reviewed.body.details.roomId,undefined);
          if(richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || aux || bourgogne)assert.equal(reviewed.body.terms.text,auxEula);
          const notice=reviewed.body.terms.restaurantNotice;if(!scenario.startsWith('form-notice-'))assert.equal(notice,lunchSource.restaurantComment.fr);const terms=await panel(page).locator('[data-terms-text]').innerText();
          for(const text of scenario.startsWith('form-notice-')?[]:richelieu?['La plupart de nos tables','pas de r\u00e9servation en terrasse','15 min maximum','01 47 70 08 05']:indiana?['La plupart de nos tables','pas de r\u00e9servation en terrasse','15 min maximum','plus de 20 personnes','09 51 43 03 52']:ruc || marly?['Nous sommes ravis de vous recevoir','Ouvert tous les jours','Service continu']:martha?['8 personnes maximum','plus de 8 personnes','mail ou par t\u00e9l\u00e9phone']:florentin?['Bienvenue au Florentin','votre nouveau bistrot','rue saint florentin']:pontoise?['sauf mardi','plus de 9 personnes','contact@lepetitpontoise.fr']:moulin?['8 couverts','01 43 54 99 37']:retro?['15 minutes','maintenues',"d'autres clients"]:bourgogne?['4 personnes sur internet','groupe plus important','0142334824','Le soir','durant 2h','21h30']:aux?['VENDREDI','SAMEDI','21h30','pour le diner','5 personnes']:bistrot?['Bienvenue au Bistrot de Paris','12-40 personnes','reservations@lebistrotdeparis1965.com']:rene?['Bienvenue Chez Ren\u00e9','12-40 personnes','reservations@chezrene1957.com']:savy?['Bienvenue Chez Savy','12-40 personnes','reservations@savy1923.com']:petit?[]:jolie?['French Riviera','15 min','3 au 23 ao\u00fbt inclus','plus de 16 personnes','uniquement Rosie Jolie']:rosieLou?['Loupiot.e.s','Atlantique','15mn, pas plus','plus de 12 personnes','Passez \u00e0 la brasserie ou appelez-nous']:rosie?['15mn, pas plus','plus de 16 personnes','Passez \u00e0 la brasserie ou appelez-nous']:republique?['plus de 20 personnes',"Venez au complet et \u00e0 l'heure",'Please come in full and on time']:bouillon?['commentaire','totalit\u00e9 des convives','r\u00e9servation est fixe','directement au restaurant']:vagenende?['plus de 8 personnes','31 d\u00e9cembre 2025','22h au plus tard']:procope?['15h30','17h30','sans r\u00e9servation','plus de 9 personnes']:['15 min'])assert.ok(terms.includes(text),text);
          if(procope || vagenende || bouillon || republique || savyOrRene){assert.ok(!terms.includes('15 min'));assert.ok(!notice.includes('15 min'));}
          if(laLorraine){assert.ok(terms.includes('SERVICE VOITURIER'));assert.ok(!terms.includes('15h30'));assert.ok(!terms.includes('sans r\u00e9servation'));}
          if(piedDeCochon){assert.ok(terms.includes('SANS r\u00e9servation'));assert.ok(!terms.includes('SERVICE VOITURIER'));assert.ok(!terms.includes('15h30'));}
          if(grandCafe){for(const absent of ['SANS r\u00e9servation','SERVICE VOITURIER','15h30'])assert.ok(!terms.includes(absent));}
          if(racine){assert.ok(terms.includes('plus de 10 couverts'));assert.ok(!terms.includes('20 minutes'));assert.equal(await panel(page).locator('[data-terms-text]').locator('b,u,font').count(),0);}
          assert.ok(!terms.includes('<br>'));assert.equal(await panel(page).locator('[data-terms-text]').locator('br,img,iframe').count(),0);
          assert.equal(await panel(page).locator('[data-terms]').isChecked(),false);
          await panel(page).screenshot({path:path.join(root,'..',lunchSlug+'-review-'+page.viewportSize().width+'.png')});
          if(jolie){for(const absent of ['Passez','appelez-nous','Rositos','Loupiot','2026','2030'])assert.ok(!notice.includes(absent),absent);}
          if(rosie || rosieLou){assert.ok(!notice.includes(rosieLou?'plus de 16 personnes':'plus de 12 personnes'));assert.ok(!notice.includes(rosieLou?'Rositos':'Loupiot.e.s'));}
          if(moulin && !scenario.startsWith('form-seating-') && scenario!=='form-shift'){
            const seating=panel(page).locator('[data-seating-notice]');assert.equal(reviewed.body.terms.seatingNotice,lunchSource.dailyAvailabilities['2026-10-23'].shifts[0].comment.fr);assert.equal(await seating.innerText(),'Sittning: '+reviewed.body.terms.seatingNotice);assert.equal(await seating.isVisible(),true);assert.equal(await seating.locator('*').count(),0);assert.equal(await panel(page).locator('[data-terms]').isChecked(),false);
            assert.ok(await seating.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('[data-terms]'))&Node.DOCUMENT_POSITION_FOLLOWING)),'Seating shown before consent');
            if(!scenario)await seating.screenshot({path:path.join(root,'..','moulin-seating-'+page.viewportSize().width+'.png')});
            assert.ok(!notice.includes('15 minutes'));
          }
          if(richelieu && !scenario.startsWith('form-notice-')){assert.deepEqual(Object.keys(lunchSource.restaurantComment),['fr']);assert.ok(!notice.includes('20 personnes'));assert.ok(!notice.includes('09 51 43 03 52'));}
          if(ruc || marly || martha || florentin || pontoise){assert.ok(!notice.includes('15 minutes'));assert.ok(!notice.includes('1h30'));}
          if(richelieu || indiana || ruc || marly || martha || florentin || retro || pontoise){assert.equal(reviewed.body.terms.seatingNotice,undefined);assert.equal(await panel(page).locator('[data-seating-notice]').isVisible(),false);assert.ok(!notice.includes('1h30'));}
          if(retro){for(const absent of ['21h30','2h','4 personnes','0142334824'])assert.ok(!notice.includes(absent));}if(bourgogne)assert.ok(!notice.includes('15 minutes'));
          if(savyOrRene){for(const other of ['savy1923','chezrene1957','lebistrotdeparis1965'].filter(v=>v!==(bistrot?'lebistrotdeparis1965':rene?'chezrene1957':'savy1923')))assert.ok(!notice.includes(other));}
          if((richelieu || indiana || ruc || marly || martha || florentin || pontoise || moulin || retro || bourgogne || aux || rosieFamily || petit || savyOrRene) && !scenario){
            assert.equal(reviewed.body.details.time,selectedTime);assert.equal(reviewed.body.canSubmit,true);if(petit){assert.equal(notice,'');assert.equal(terms,'Synthetic test terms');assert.ok(reviewed.body.terms.text.trim());}
            assert.ok(!/<\/?(?:br|b|u|a)\b[^>]*>/i.test(terms));assert.equal(await panel(page).locator('[data-terms-text]').locator('a,b,u,br,img,iframe').count(),0);
            const sourceDocument=zenchefDocument('https://bookings.zenchef.com/form?rid='+zenchefRid+(richelieu || indiana || marly || martha || petit || pontoise?'&pid=1001':bourgogne || aux || savyOrRene?'&fullscreen=1':'')+'&lang=fr&day='+date+'&pax=2&slot='+encodeURIComponent(selectedTime));
            const sourceState=JSON.parse(sourceDocument.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]).props.initialState.appStoreState;
            const expected=createHash('sha256').update(JSON.stringify([reviewed.body.terms.text,sourceState.restaurantComment,sourceState.dailyAvailabilities[date].shifts[0]])).digest('hex');
            assert.equal(reviewed.body.terms.version,expected);
            const current=await api(page,'/restaurant-bookings/playwright/'+reviewed.body.id+'/current',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
            assert.equal(current.body.terms.version,expected);assert.equal(current.body.terms.restaurantNotice,notice);
            await panel(page).locator('[data-terms-text]').screenshot({path:path.join(root,'..',lunchSlug+'-notice-'+page.viewportSize().width+'.png')});
          }
          if(scenario==='scope-review'){assert.equal(reviewed.body.canSubmit,true);assert.equal(reviewed.body.details.time,selectedTime);return reviewed;}
          if(scenario==='review-only'){
            assert.equal(reviewed.body.canSubmit,true);assert.ok(!/<\/?(?:br|b|u|p)\s*\/?\s*>/i.test(terms),'Display markup removed');assert.ok(!/<\/?a\b[^>]*>/i.test(terms),'Anchor markup removed, labels retained');assert.equal(await panel(page).locator('[data-terms-text] a').count(),0);
            const sourceDocument=zenchefDocument('https://bookings.zenchef.com/form?rid='+zenchefRid+(richelieu || indiana || marly || martha || petit || pontoise?'&pid=1001':bourgogne || aux || savyOrRene?'&fullscreen=1':'')+'&lang=fr&day='+date+'&pax=2&slot=12%3A30');
            const sourceState=JSON.parse(sourceDocument.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]).props.initialState.appStoreState;
            const expectedVersion=createHash('sha256').update(JSON.stringify([reviewed.body.terms.text,sourceState.restaurantComment,sourceState.dailyAvailabilities[date].shifts[0]])).digest('hex');
            assert.equal(reviewed.body.terms.version,expectedVersion,'Digest still binds complete raw notice, including EN variant');
            const current=await api(page,'/restaurant-bookings/playwright/'+reviewed.body.id+'/current',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
            assert.equal(current.body.terms.version,expectedVersion);assert.equal(current.body.terms.restaurantNotice,notice);
            await panel(page).locator('[data-terms-text]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
            await panel(page).locator('[data-terms-text]').screenshot({path:path.join(root,'..',lunchSlug+'-notice-tail-'+page.viewportSize().width+'.png')});
            assert.equal(submits(),0);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return reviewed;
          }
          if(scenario.startsWith('form-')){
            assert.equal(reviewed.body.canSubmit,false);const before=submits();
            const rejected=await api(page,'/restaurant-bookings/playwright/'+reviewed.body.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'submit',revision:reviewed.body.revision,reviewToken:reviewed.body.reviewToken,termsVersion:reviewed.body.terms.version,terms:true,confirm:true,idempotencyKey:'fixture-pretransport-guard'})});
            assert.equal(rejected.status,409);assert.equal(submits(),before);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
          }
          if(scenario==='notice-changed' || scenario==='notice-en-changed' || scenario.startsWith('card-changed-') || scenario==='date-changed' || scenario==='time-changed' || scenario.startsWith('shift-comment-')){
            assert.equal(reviewed.body.canSubmit,true);
            const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('notice_change_timeout')),5000);const receive=m=>{if(m.kind==='fixture-notice-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
            child.send({kind:scenario.startsWith('card-changed-')?'fixture-change-card':scenario.startsWith('shift-comment-')?'fixture-change-shift-comment':scenario==='time-changed'?'fixture-change-time':scenario==='date-changed'?'fixture-change-date':'fixture-change-notice',mutation:scenario.slice('card-changed-'.length),language:scenario==='shift-comment-en' || scenario==='notice-en-changed'?'en':'fr'});await changed;await panel(page).locator('[data-terms]').check();const before=submits();
            const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='submit');await panel(page).locator('[data-submit]').click();const rejected=await pending;
            assert.equal(rejected.status(),409);assert.equal((await rejected.json()).error,'stale_review');assert.equal(submits(),before);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
          }
        }
        if(scenario==='custom-required-changed' || scenario.startsWith('room-') || scenario.startsWith('partner-')){
          assert.equal(reviewed.body.canSubmit,true);
          const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('custom_field_change_timeout')),5000);const receive=m=>{if(m.kind==='fixture-notice-changed'){clearTimeout(timer);child.off('message',receive);resolve();}};child.on('message',receive);});
          child.send({kind:scenario.startsWith('partner-')?'fixture-change-partner':scenario.startsWith('room-')?'fixture-change-room':'fixture-change-custom',mutation:scenario});await changed;
          await panel(page).locator('[data-terms]').check();const before=submits();
          const pending=page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postDataJSON()?.type==='submit');await panel(page).locator('[data-submit]').click();const rejected=await pending;
          assert.equal(rejected.status(),409);assert.equal((await rejected.json()).error,scenario.startsWith('room-') || scenario.startsWith('partner-')?'stale_review':'provider_fields_unverified');assert.equal(submits(),before);assert.equal((await api(page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);return;
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
        if(readbackVenue && before===0 && expectedDispatches!==0){
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
      if(lunchReviewOnly){
        for(const width of [390,1366]){const view=await makeView(width);try{const reviewed=await flow(view,0,chosenRoom,'review-only');const ended=await api(view.page,'/restaurant-bookings/playwright/'+reviewed.body.id,{method:'DELETE'});assert.equal(ended.status,200);}finally{await view.context.close();}}
        console.log(JSON.stringify({status:'PASS',scenario:'notice_visual_tail',restaurantId,integrationCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),viewports:[390,1366],APIRequests:apiCalls.length,supplierBoundaryAttempts:submits(),actualSupplierRequests:0}));return;
      }
      if(!lunchTail && !process.argv.includes('--field-guard-tail')){
      first = await makeView();
      const success = await flow(first);
      assert.equal(success.body.result.status,'confirmed');
      assert.equal(success.body.result.reference,'999999998');
      if(namedLunch){assert.equal(success.body.result.verification.bookingEvidence,'own_booking_readback');assert.equal(success.body.result.verification.shiftId,zenchefShift);assert.equal(success.body.details.shiftId,zenchefShift);}
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
      if(namedLunch)assert.deepEqual(recovered.body.attempts[0].details,{shiftId:zenchefShift});
      if(readbackVenue){
        const history=await api(first.page,'/restaurant-bookings');assert.equal(history.status,200);
        const booking=history.body.bookings.find(row=>row.restaurantId===restaurantId);
        if(namedLunch){assert.equal(booking.status,'confirmed');assert.equal(booking.party,2);assert.equal(booking.roomId,undefined);assert.equal(booking.offer,undefined);}else if(dekas){assert.equal(booking.offer.offerId,118785);assert.equal(booking.offer.count,2);assert.equal(booking.offer.version,success.body.details.offer.version);assert.equal(booking.offer.mealPrice,null);}else recoveredRoom={roomId:booking.roomId,roomName:booking.roomName};
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
      if(fieldGuardOnly){
        for(const outcome of ['custom-required-changed',...(pirouette?['seating-changed']:[])]){
          console.log('CHECK '+zenchefName+' '+outcome);await stop();await start(outcome);const view=await makeView();
          try{await flow(view,0,chosenRoom,outcome);}finally{await view.context.close();}
        }
      }
      if(partnerGuardOnly){
        for(const outcome of partnerQueryCases){
          console.log('CHECK '+zenchefName+' '+outcome);await stop();await start(outcome);const view=await makeView();
          try{await flow(view,0,chosenRoom,outcome);}finally{await view.context.close();}
        }
      }
      if(namedLunch && !partnerGuardOnly && (!lunchCoreOnly || rosie || rosieLou || jolie || petit || savy || rene || bistrot || aux || bourgogne || retro || moulin || pontoise || florentin || martha || marly || ruc || indiana)){for(const outcome of lunchCoreOnly?(indiana?['form-auto-drift','form-borrowed-card','shift-comment-en','partner-query-null','partner-state-number']:ruc?['form-disabled-card-flag-string','form-disabled-card-price-drift','card-changed-flag-true','card-changed-price-drift']:marly?['form-card-price','form-cancellation-exact','partner-query-null','partner-state-number']:martha?['form-shift-second','form-borrowed-card','partner-query-changed','partner-state-null']:florentin?['form-auto-drift','form-borrowed-card','form-cancellation-exact','custom-required-changed']:pontoise?['form-cancellation-missing','form-cancellation-null','form-cancellation-string','form-cancellation-exact','form-auto-drift','partner-state-changed','partner-query-changed','partner-query-missing','partner-query-number']:moulin?['form-borrowed-card','form-seating-empty','shift-comment-changed','shift-comment-en','custom-required-changed']:retro?['form-null-card','form-card-price','notice-changed','custom-required-changed']:bourgogne?['form-borrowed-confirmation','form-card','form-cancellation-reference','form-cancellation-exact','notice-changed','custom-required-changed']:aux?['form-room-disabled','form-room-mandatory','form-borrowed-confirmation','form-cancellation-exact','custom-required-changed']:bistrot?['form-room-optional','form-room-mandatory','custom-required-changed']:rene?['form-card-threshold-drift','form-card-price','form-cancellation-exact','form-notice-empty','custom-required-changed']:savy?['form-borrowed-confirmation','form-card-price','form-notice-empty']:petit?['form-notice-missing','form-notice-null','form-eula-empty','search-partner-missing','form-partner-wrong','payload-partner-wrong']:jolie?['form-notice-empty','notice-changed']:rosieLou?['form-cancellation-exact','form-null-card','form-shift']:['form-cancellation-exact','form-shift','notice-changed']):lunchCases.filter((outcome,index)=>(!lunchOnly || outcome===lunchOnly) && (!lunchFrom || index>=lunchCases.indexOf(lunchFrom)))){
        console.log('CHECK '+zenchefName+' '+outcome);await stop();await start(outcome);const view=await makeView();
        try{const result=await flow(view,outcome==='payload-partner-wrong'?0:1,chosenRoom,outcome);if(result)assert.equal(result.body.result.status,'unknown',outcome);}
        finally{await view.context.close();}
      }}
      if(bouillon || republique || jolie){
        // Direct server-only journal checks use the real persistent ledger and register, not adapter hooks.
        const {PlaywrightAttemptLedger}=await import('../api/playwright-attempt-ledger.mjs');
        const {BookingRegister}=await import('../api/booking-register.mjs');
        const {createProviderJournal}=await import('../api/provider-booking-journal.mjs');
        const configs=await import('../api/providers/zenchef-playwright.mjs');const config=jolie?configs.ZENCHEF_ROSIEJOLIE:republique?configs.ZENCHEF_BOUILLONREPUBLIQUE:configs.ZENCHEF_BOUILLONJULIEN;
        const ledgerPath=path.join(directory,'date-guard-ledger.sqlite'),registerPath=path.join(directory,'date-guard-register.sqlite');
        const request={owner:'date-guard-owner',provider:'Zenchef',restaurantId,sessionId:'date-guard-session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-12-23',time:'12:30',party:2,shiftId:zenchefShift}};
        let ledger,register,journal;
        const openJournal=()=>{ledger=new PlaywrightAttemptLedger(ledgerPath);register=new BookingRegister(registerPath);journal=createProviderJournal({ledger,register,provider:'Zenchef',restaurants:{[restaurantId]:{...config,confirmationPolicySource:config.policySource}}});};
        openJournal();
        try{
          for(const blockedDate of dateGuardDates){
            assert.throws(()=>journal.reserveAttempt({...request,details:{...request.details,date:blockedDate}}),/special_date_unsupported/);
            assert.throws(()=>ledger.reserve({...request,mode:'live',idempotencyKey:'date_guard_key_123456',date:blockedDate,time:'12:30',party:2,details:{shiftId:zenchefShift}}),/special_date_unsupported/);
          }
          assert.equal(ledger.list(request.owner).length,0);assert.equal(register.list([request.owner]).length,0);
          if(republique)for(const time of republiqueBlocked){
            assert.throws(()=>journal.reserveAttempt({...request,details:{...request.details,time}}),/lunch_time_unsupported/);
            assert.throws(()=>ledger.reserve({...request,mode:'live',idempotencyKey:'time_guard_key_123456',date:request.details.date,time,party:2,details:{shiftId:zenchefShift}}),/lunch_time_unsupported/);
          }
          const {attempt}=journal.reserveAttempt(request);
          for(let restart=0;restart<2;restart++){
            for(const changedDate of [...dateGuardDates,...(jolie?jolieAdjacent:[]),'2030-12-26'])assert.throws(()=>journal.recordAttempt({intent:{...request,details:{...request.details,date:changedDate}},attempt,result:{status:'confirmed',reference:'SYNTHETIC-ONLY'}}),/special_date_unsupported|attempt_binding/);
            for(const time of ['11:30','13:00',...republiqueBlocked])assert.throws(()=>journal.recordAttempt({intent:{...request,details:{...request.details,time}},attempt,result:{status:'confirmed',reference:'SYNTHETIC-ONLY'}}),/lunch_time_unsupported|attempt_binding/);
            assert.throws(()=>journal.recordAttempt({intent:{...request,details:{...request.details,party:3}},attempt,result:{status:'confirmed',reference:'SYNTHETIC-ONLY'}}),/shift_binding|attempt_binding/);
            assert.equal(ledger.get(request.owner,attempt.attemptId).status,'unknown');assert.equal(register.list([request.owner])[0].status,'unknown');
            assert.throws(()=>journal.reserveAttempt({...request,details:{...request.details,date:'2030-12-26'}}),/idempotency_conflict/);
            if(!restart){ledger.close();register.close();openJournal();}
          }
          const result={status:'confirmed',reference:'SYNTHETIC-ONLY',verification:{verified:true,source:'provider',policySource:config.policySource,provider:'Zenchef',restaurantId,sessionId:request.sessionId,attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,reviewFingerprint:request.reviewFingerprint,shiftId:zenchefShift,bookingEvidence:'own_booking_readback'}};
          journal.recordAttempt({intent:request,attempt,result});
          const snapshot={id:request.sessionId,restaurantId,details:request.details,result};assert.equal(journal.verifySnapshot(snapshot,request.owner).status,'confirmed');
          for(const changedDate of [...dateGuardDates,...(jolie?jolieAdjacent:[]),'2030-12-26'])assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,date:changedDate}},request.owner),null);
          for(const time of ['11:30','13:00',...republiqueBlocked])assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,time}},request.owner),null);
          assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,party:3}},request.owner),null);
          ledger.close();register.close();openJournal();assert.equal(journal.verifySnapshot(snapshot,request.owner).status,'confirmed');
          for(const time of ['11:30','13:00',...republiqueBlocked])assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,time}},request.owner),null);
          for(const changedDate of [...dateGuardDates,...(jolie?jolieAdjacent:[]),'2030-12-26'])assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,date:changedDate}},request.owner),null);
          if(republique)for(const time of republiqueTimes.filter(t=>t!=='12:30')){
            const allowed={...request,sessionId:'time-guard-'+time,details:{...request.details,time}};const gate=journal.reserveAttempt(allowed);assert.equal(gate.sendAllowed,true);assert.equal(gate.attempt.time,time);
          }
          console.log('PASS '+zenchefName+' real SQLite date/time/party reserve/record/restart/projection guards (synthetic proof)');
        }finally{ledger.close();register.close();}
        for(const allowedDate of jolie && !lunchCoreOnly?jolieAdjacent:bouillon && !lunchCoreOnly?bouillonAdjacent:[]){
          console.log('CHECK '+zenchefName+' adjacent '+allowedDate);await stop();await start('boundary',true,allowedDate);const view=await makeView();
          try{
            const result=await flow(view,1,chosenRoom,'boundary');assert.equal(result.body.result.status,'confirmed');assert.equal(result.body.details.date,allowedDate);
            const before=submits();await stop();await start('boundary',true,allowedDate);
            const attempts=await api(view.page,'/restaurant-bookings/playwright/attempts');assert.equal(attempts.body.attempts[0].date,allowedDate);assert.equal(attempts.body.attempts[0].status,'confirmed');assert.equal(submits(),before);
          }finally{await view.context.close();}
        }
      }
      if(republique && !lunchCoreOnly){
        await stop();await start('boundary');
        for(const [index,time] of republiqueTimes.entries()){
          const view=await makeView(index%2?1366:390);const before=submits();
          try{const reviewed=await flow(view,0,chosenRoom,'scope-review',time);assert.equal(submits(),before);assert.equal((await api(view.page,'/restaurant-bookings/playwright/attempts')).body.attempts.length,0);assert.equal((await api(view.page,'/restaurant-bookings/playwright/'+reviewed.body.id,{method:'DELETE'})).status,200);}
          finally{await view.context.close();}
        }
        console.log('PASS Republique all seven native form/review times, zero dispatch; excluded times never navigated');
      }
      if(rosieLou && lunchCoreOnly){
        // Synthetic isolation from Jolie's conservative summer guard, never a live availability claim.
        const isolatedDate='2030-08-13';await stop();await start('boundary',true,isolatedDate);const view=await makeView();
        try{const result=await flow(view,1,chosenRoom,'boundary');assert.equal(result.body.result.status,'confirmed');assert.equal(result.body.details.date,isolatedDate);
          const before=submits();await stop();await start('boundary',true,isolatedDate);const recovered=await api(view.page,'/restaurant-bookings/playwright/attempts');assert.equal(recovered.body.attempts[0].status,'confirmed');assert.equal(recovered.body.attempts[0].date,isolatedDate);assert.equal(submits(),before);
          console.log('PASS Lou synthetic summer isolation and restart, no availability claim');
        }finally{await view.context.close();}
      }
      if(racine && !lunchCoreOnly){
        // A synthetic holiday slot proves venue-scoped guards, not actual holiday availability.
        await stop();await start('boundary',true,'2030-12-24');const view=await makeView();
        try{const result=await flow(view,1,chosenRoom,'boundary');assert.equal(result.body.result.status,'confirmed');assert.equal(result.body.details.date,'2030-12-24');
          const before=submits();await stop();await start('boundary',true,'2030-12-24');const recovered=await api(view.page,'/restaurant-bookings/playwright/attempts');assert.equal(recovered.body.attempts[0].status,'confirmed');assert.equal(recovered.body.attempts[0].date,'2030-12-24');assert.equal(submits(),before);
          console.log('PASS Racine synthetic holiday search/form/journal isolation and restart; no availability claim');
        }finally{await view.context.close();}
      }
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
      if(roomVenue && !fieldGuardOnly){
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
        actualSupplierRequests:0,liveConfirmationVerified:false,backendRestarts:namedLunch?backendStarts-1:dekas?8:pirouette?17:roomVenue?15:2,APIRequests:apiCalls.length,deployed:false}));
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
