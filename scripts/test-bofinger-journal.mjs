import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
for (const [restaurantId,shiftId,name] of [['curated-PAR-bofinger',19170,'Bofinger'],['curated-PAR-la-coupole',20148,'La Coupole'],['curated-PAR-terminus-nord',19380,'Terminus Nord'],['curated-PAR-le-procope',18190,'Le Procope'],['curated-PAR-la-lorraine',16674,'La Lorraine'],['curated-PAR-au-pied-de-cochon',29,'Au Pied de Cochon'],['curated-PAR-le-grand-cafe-capucines',19590,'Le Grand Café Capucines'],['curated-PAR-brasserie-vagenende',63972,'Brasserie Vagenende'],['curated-PAR-bouillon-julien',12711,'Bouillon Julien'],['curated-PAR-bouillon-racine',93989,'Bouillon Racine'],['curated-PAR-bouillon-republique',528175,'Bouillon République'],['curated-PAR-brasserie-rosie',43203,'Brasserie Rosie'],['curated-PAR-brasserie-rosie-lou',118503,'Brasserie Rosie Lou'],['curated-PAR-brasserie-rosie-jolie',298043,'Brasserie Rosie Jolie'],['curated-PAR-le-petit-sommelier',37613,'Le Petit Sommelier'],['curated-PAR-chez-savy',68279,'Chez Savy'],['curated-PAR-chez-rene',68277,'Chez René'],['curated-PAR-le-bistrot-de-paris',68145,'Le Bistrot de Paris'],['curated-PAR-aux-bons-crus',20711,'Aux Bons Crus'],['curated-PAR-aux-crus-de-bourgogne',22200,'Aux Crus de Bourgogne'],['curated-PAR-le-petit-retro',116623,'Le Petit Rétro'],['curated-PAR-au-moulin-a-vent',139531,'Au Moulin à Vent'],['curated-PAR-le-petit-pontoise',9493,'Le Petit Pontoise'],['curated-PAR-le-florentin',283681,'Le Florentin'],['curated-PAR-martha-pizze-amore',159369,'Martha – Pizze Amore'],['curated-PAR-le-cafe-marly',122853,'Le Café Marly'],['curated-PAR-le-cafe-ruc',32216,'Le Café Ruc'],['curated-PAR-indiana-cafe-bonne-nouvelle',253448,'Indiana Café Bonne Nouvelle'],['curated-PAR-indiana-cafe-richelieu-drouot',276858,'Indiana Café Richelieu-Drouot'],['curated-PAR-indiana-cafe-beaugrenelle',281252,'Indiana Café Beaugrenelle'],['curated-PAR-indiana-cafe-tolbiac',243266,'Indiana Café Tolbiac'],['curated-PAR-indiana-cafe-republique',274078,'Indiana Café République Service continu'],['curated-PAR-indiana-cafe-bercy-village',245385,'Indiana Café Bercy Village'],['curated-PAR-indiana-cafe-denfert-rochereau',278132,'Indiana Café Denfert-Rochereau'],['curated-PAR-okomusu',87616,'OKOMUSU'],['curated-PAR-zen-restaurant',192088,'ZEN dinner'],['curated-PAR-cafe-des-musees',7248,'Café des Musées'],['curated-PAR-casimir',160340,'Casimir'],['curated-PAR-biche-paris8',149228,'Biche'],['curated-PAR-savannah-cafe',300276,'Savannah Café'],['curated-PAR-jules-jo',86920,'Jules Jo'],['curated-PAR-becco',177844,'Becco'],['curated-PAR-batistou',176469,'Batistou'],['curated-PAR-office-paris',12173,'L’office'],['curated-PAR-ardent',82526,'Ardent'],['curated-PAR-bien-eleve',36016,'Bien élevé'],['curated-PAR-brasserie-jaja-amsterdam',347295,'Brasserie Jaja'],['curated-PAR-les-canailles-pigalle',107333,'Les Canailles Pigalle'],['curated-PAR-comptoir-petits-champs',292,'Le Comptoir des Petits Champs'],['curated-PAR-escudella',4974,'L’Escudella'],['curated-PAR-le-cornichon-goncourt',172864,'Le Cornichon'],['curated-PAR-ibrik-kitchen',17983,'IBRIK Kitchen'],['curated-PAR-chez-fernand-guisarde',429732,'Chez Fernand Guisarde'],['curated-LYO-maison-moly',137085,'Maison Moly'],['curated-LYO-comptoir-chabert',41399,'Comptoir Chabert'],['curated-LYO-bistrot-abel',77813,"Le Bistrot d'Abel"],['curated-LYO-cafe-comptoir-abel',77701,'Café Comptoir Abel']]) test(name+' durable service, owner and independent receipt survive restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bofinger-journal-'));
 let ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));
 const policy='TEST-ONLY-POLICY';
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name,city:'Paris',shiftId,confirmationPolicySource:policy}},register:{upsert(){}}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId}};
 try {
  for(const details of [{...intent.details,shiftId:shiftId+1},{...intent.details,shiftId:undefined},{...intent.details,party:3}])assert.throws(()=>journal.reserveAttempt({...intent,details}),/shift_binding/);
  if (restaurantId === 'curated-PAR-bouillon-julien') {
   for (const year of ['2030','2031']) for (const day of ['12-24','12-25','12-31']) {
    const date=year+'-'+day;
    assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,date}}),/special_date_unsupported/);
    assert.throws(()=>ledger.reserve({owner:'owner',provider:'Zenchef',restaurantId,sessionId:'date-test',mode:'fixture',phase:'booking',idempotencyKey:'date-test-idempotency-key',reviewFingerprint:'b'.repeat(64),date,time:'12:00',party:2,details:{shiftId}}),/special_date_unsupported/);
   }
   for (const date of ['2030-12-23','2030-12-26','2030-12-30','2031-01-01']) {
    const gate=journal.reserveAttempt({...intent,sessionId:'boundary-'+date,details:{...intent.details,date}});assert.equal(gate.sendAllowed,true);
   }
  }
  if (restaurantId === 'curated-PAR-brasserie-rosie-jolie') {
   for (const year of ['2030','2031']) for (const day of ['08-03','08-13','08-23']) {
    const date=year+'-'+day;
    assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,date}}),/special_date_unsupported/);
    assert.throws(()=>ledger.reserve({owner:'owner',provider:'Zenchef',restaurantId,sessionId:'date-test',mode:'fixture',phase:'booking',idempotencyKey:'date-test-idempotency-key',reviewFingerprint:'b'.repeat(64),date,time:'12:00',party:2,details:{shiftId}}),/special_date_unsupported/);
   }
   for (const date of ['2030-08-02','2030-08-24','2031-08-02','2031-08-24']) {
    const gate=journal.reserveAttempt({...intent,sessionId:'boundary-'+date,details:{...intent.details,date}});assert.equal(gate.sendAllowed,true);
   }
  }
  if (restaurantId === 'curated-PAR-bouillon-republique') {
   for (const time of ['11:29','11:45','14:31','15:00','18:00',null,1200]) {
    assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,time}}),/lunch_time_unsupported/);
    assert.throws(()=>ledger.reserve({owner:'owner',provider:'Zenchef',restaurantId,sessionId:'time-test',mode:'fixture',phase:'booking',idempotencyKey:'time-test-idempotency-key',reviewFingerprint:'c'.repeat(64),date:'2030-01-15',time,party:2,details:{shiftId}}),/lunch_time_unsupported|invalid_time/);
   }
   for (const time of ['11:30','12:00','12:30','13:00','13:30','14:00','14:30']) assert.equal(journal.reserveAttempt({...intent,sessionId:'time-'+time,details:{...intent.details,date:'2030-01-16',time}}).sendAllowed,true);
  }
  const {attempt}=journal.reserveAttempt(intent);assert.deepEqual(attempt.details,{shiftId});
  ledger.close();ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));journal=make();
  assert.deepEqual(ledger.get('owner',attempt.attemptId).details,{shiftId});
  assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{shiftId:shiftId+1}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId};
  for(const bad of [{...proof,shiftId:shiftId+1},{...proof,bookingEvidence:undefined}])assert.equal(journal.recordAttempt({intent,attempt,result:{status:'confirmed',reference:'TEST-REF',verification:bad}}).status,'unknown');
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  if (restaurantId === 'curated-PAR-bouillon-julien') {
   for (const date of ['2030-12-24','2030-12-25','2030-12-31','2030-01-16']) assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,date}},attempt,result}),/special_date_unsupported|attempt_binding/);
  }
  if (restaurantId === 'curated-PAR-brasserie-rosie-jolie') for (const date of ['2030-08-03','2030-08-13','2030-08-23','2030-01-16']) assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,date}},attempt,result}),/special_date_unsupported|attempt_binding/);
  if (restaurantId === 'curated-PAR-bouillon-republique') for (const time of ['15:00','11:45','12:30']) assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,time}},attempt,result}),/lunch_time_unsupported|attempt_binding/);
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,shiftId);
  if (restaurantId === 'curated-PAR-bouillon-republique') for (const time of ['15:00','11:45','12:30']) assert.equal(journal.verifySnapshot({...snapshot,details:{...snapshot.details,time}},'owner'),null);
  if (restaurantId === 'curated-PAR-bouillon-julien') for (const date of ['2030-12-24','2030-12-25','2030-12-31','2030-01-16']) assert.equal(journal.verifySnapshot({...snapshot,details:{...snapshot.details,date}},'owner'),null);
  assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,shiftId:shiftId+1}},'owner'),null);
  if (restaurantId === 'curated-PAR-brasserie-rosie-jolie') for (const date of ['2030-08-03','2030-08-13','2030-08-23','2030-01-16']) assert.equal(journal.verifySnapshot({...snapshot,details:{...snapshot.details,date}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
 } finally {ledger.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
