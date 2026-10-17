import { HANTVERKET_LUNCH_RECEIPT_POLICY as hantverket } from '../api/bokabord-receipt-confirmation.mjs';
import { PELIKAN_DINNER_RECEIPT_POLICY as pelikan } from '../api/bokabord-receipt-confirmation.mjs';
import { TENNSTOPET_LUNCH_RECEIPT_POLICY as tennstopet } from '../api/bokabord-receipt-confirmation.mjs';
import { TEATERGRILLEN_LUNCH_RECEIPT_POLICY as teatergrillen } from '../api/bokabord-receipt-confirmation.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBokabordReceiptVerifier, NOEMA_LUNCH_RECEIPT_POLICY as policy, CICCIOS_DINING_RECEIPT_POLICY as ciccios, RICHE_LUNCH_RECEIPT_POLICY as riche, STUREHOF_LUNCH_RECEIPT_POLICY as sturehof, BEIRUT_LUNCH_RECEIPT_POLICY as beirut, BALZAC_LUNCH_RECEIPT_POLICY as balzac, KOMMENDOREN_LUNCH_RECEIPT_POLICY as kommendoren, ASTRID_LUNCH_RECEIPT_POLICY as astrid, VAU_LUNCH_RECEIPT_POLICY as vau, BOQUERIA_LUNCH_RECEIPT_POLICY as boqueria } from '../api/bokabord-receipt-confirmation.mjs';
import { DAGMAR_LUNCH_RECEIPT_POLICY as dagmar, ITALIANO_DINING_RECEIPT_POLICY as italiano, COPINE_LUNCH_RECEIPT_POLICY as copine } from '../api/bokabord-receipt-confirmation.mjs';
import { GONDOLEN_LUNCH_RECEIPT_POLICY as gondolen } from '../api/bokabord-receipt-confirmation.mjs';
import { KLOTET_FRIDAY_LUNCH_RECEIPT_POLICY as klotet } from '../api/bokabord-receipt-confirmation.mjs';
import { AGNES_DINNER_RECEIPT_POLICY as agnes } from '../api/bokabord-receipt-confirmation.mjs';
import { BOBONNE_LUNCH_RECEIPT_POLICY as bobonne } from '../api/bokabord-receipt-confirmation.mjs';
import { LUZETTE_LUNCH_RECEIPT_POLICY as luzette } from '../api/bokabord-receipt-confirmation.mjs';
const verifier = createBokabordReceiptVerifier(policy);

function tennstopetFixture() {
  const v=createBokabordReceiptVerifier(tennstopet),f=fixture();
  Object.assign(f.approval,{hash:tennstopet.hash,mealid:tennstopet.mealid,time:'13:00',date:'2026-10-23'});
  Object.assign(f.attempt,{restaurantId:tennstopet.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:tennstopet.hash,mealid:tennstopet.mealid,time:'13:00',date:'2026-10-23'});
  Object.assign(f.observation.data.booking,{mealid:tennstopet.mealid,time:'13:00',date:'2026-10-23',
    meal:{type:0,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',tennstopet.name).replace('(Lunch)','(Lunch Tennbarens Matsal)').replace('tisdag 15 jan','fredag 23 okt').replace('12:00 - 13:30','13:00 - 14:30');
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Tennstopet exact named dining-room Lunch binds two guests, Friday/Saturday and excludes Christmas',()=>{
  const {v,f,check}=tennstopetFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [2]) assert.ok(v.approvalDigest({...f.approval,party}));
  for(const party of [0,1,3,8,9]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:'a9a751cbf9a3721964247c6b364a4fe2'}),null);
  for(const date of ['2026-10-22','2026-10-25','2026-11-27','2026-12-18']) assert.equal(v.approvalDigest({...f.approval,date}),null);
  for(const time of ['12:00','14:59']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const time of ['11:59','15:00']) assert.equal(v.approvalDigest({...f.approval,time}),null);
  for(const mealid of [54065,54213,54214,59733]) {
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  for(const patch of [{name:'Other'},{hash:policy.hash},{mealid:54213},{mealType:3},{maxParty:8},{mealLabel:'Lunch'},{type0Contract:undefined}])
    assert.throws(()=>createBokabordReceiptVerifier({...tennstopet,...patch}));
});

test('Tennstopet provider-review policy preserves room label, request, phone and receipt guards',()=>{
  for(const change of [
    f=>f.observation.receipt.text=f.observation.receipt.text.replace('Lunch Tennbarens Matsal','Lunch Odengatan'),
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>{delete f.observation.request;},f=>f.observation.attemptId='replayed',
    f=>f.attempt.dispatched=false,f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=tennstopetFixture();change(f);assert.equal(check().status,'unknown'); }
});

function teatergrillenFixture() {
  const v=createBokabordReceiptVerifier(teatergrillen),f=fixture();
  Object.assign(f.approval,{hash:teatergrillen.hash,mealid:teatergrillen.mealid,time:'13:00'});
  Object.assign(f.attempt,{restaurantId:teatergrillen.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:teatergrillen.hash,mealid:teatergrillen.mealid,time:'13:00'});
  Object.assign(f.observation.data.booking,{mealid:teatergrillen.mealid,time:'13:00',
    meal:{type:2,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',teatergrillen.name).replace('12:00 - 13:30','13:00 - 14:30');
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Teatergrillen exact Lunch scope binds 1–2 guests, native time window and excludes every other meal',()=>{
  const {v,f,check}=teatergrillenFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [1,2]) assert.ok(v.approvalDigest({...f.approval,party}));
  for(const party of [0,3,8,9]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:'a9a751cbf9a3721964247c6b364a4fe2'}),null);
  for(const date of ['2026-10-17','2026-10-18']) assert.equal(v.approvalDigest({...f.approval,date}),null);
  for(const time of ['13:00','14:59']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const time of ['12:59','15:00']) assert.equal(v.approvalDigest({...f.approval,time}),null);
  for(const mealid of [6492,9063,42517,64051]) {
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  for(const patch of [{name:'Other'},{hash:policy.hash},{mealid:6492},{mealType:3},{maxParty:8}])
    assert.throws(()=>createBokabordReceiptVerifier({...teatergrillen,...patch}));
});

test('Teatergrillen contact-final policy preserves request, native canonical phone and receipt guards',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>{delete f.observation.request;},f=>f.observation.attemptId='replayed',
    f=>f.attempt.dispatched=false,f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=teatergrillenFixture();change(f);assert.equal(check().status,'unknown'); }
});

function luzetteFixture() {
  const v=createBokabordReceiptVerifier(luzette),f=fixture();
  Object.assign(f.approval,{hash:luzette.hash,mealid:luzette.mealid});
  Object.assign(f.attempt,{restaurantId:luzette.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:luzette.hash,mealid:luzette.mealid});
  Object.assign(f.observation.data.booking,{mealid:luzette.mealid,
    meal:{type:2,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',luzette.name);
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Luzette exact Lunch scope binds 1–2 guests, native time window and excludes every other meal',()=>{
  const {v,f,check}=luzetteFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [1,2]) assert.ok(v.approvalDigest({...f.approval,party}));
  for(const party of [0,3,8,9]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  for(const time of ['11:15','14:59']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const time of ['11:14','15:00']) assert.equal(v.approvalDigest({...f.approval,time}),null);
  for(const mealid of [7254,7434,44511,49633,49749,51726,52551]) {
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  for(const patch of [{name:'Other'},{hash:policy.hash},{mealid:7254},{mealType:3},{maxParty:8}])
    assert.throws(()=>createBokabordReceiptVerifier({...luzette,...patch}));
});

test('Luzette contact-final policy preserves request, native canonical phone and receipt guards',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>{delete f.observation.request;},f=>f.observation.attemptId='replayed',
    f=>f.attempt.dispatched=false,f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=luzetteFixture();change(f);assert.equal(check().status,'unknown'); }
});

function hantverketFixture() {
  const v=createBokabordReceiptVerifier(hantverket),f=fixture();
  Object.assign(f.approval,{hash:hantverket.hash,mealid:hantverket.mealid});
  Object.assign(f.attempt,{restaurantId:hantverket.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:hantverket.hash,mealid:hantverket.mealid});
  Object.assign(f.observation.data.booking,{mealid:hantverket.mealid,
    meal:{type:2,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',hantverket.name);
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Hantverket ordinary Lunch binds full venue name and excludes dinner and larger parties',()=>{
  const {v,f,check}=hantverketFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [3,6,7]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  assert.equal(v.approvalDigest({...f.approval,mealid:7098}),null);
  assert.equal(v.approvalDigest({...f.approval,mealid:7103}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:policy.hash}),null);
  for(const patch of [{date:'2030-01-19'},{date:'2030-01-20'},{time:'11:00'},{time:'11:29'},{time:'14:00'}])
    assert.equal(v.approvalDigest({...f.approval,...patch}),null);
  for(const time of ['11:30','13:59']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const patch of [{name:'Other'},{hash:policy.hash},{mealid:7098},{maxParty:3}])
    assert.throws(()=>createBokabordReceiptVerifier({...hantverket,...patch}),/reviewed_ordinary_meal_policy_required/);
  f.observation.data.booking.mealid=7098;assert.equal(check().status,'unknown');
});

test('Hantverket stroller/dog comment stays part of approved submission',()=>{
  const {v,f,check}=hantverketFixture();
  f.approval.comment='Barnvagn och hund medföljer';
  f.attempt.detailsDigest=v.approvalDigest(f.approval);
  f.observation.detailsDigest=f.attempt.detailsDigest;
  f.observation.request.payload.comment=f.approval.comment;
  assert.equal(check().status,'confirmed');
  f.observation.request.payload.comment='';
  assert.equal(check().status,'unknown');
});

test('Hantverket retains submission and independent receipt binding with native-phone approval',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>{delete f.observation.request;},
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.attempt.restaurantId='curated-STO-other',
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=hantverketFixture();change(f);assert.equal(check().status,'unknown'); }
});

function bobonneFixture() {
  const v=createBokabordReceiptVerifier(bobonne),f=fixture();
  Object.assign(f.approval,{hash:bobonne.hash,mealid:bobonne.mealid});
  Object.assign(f.attempt,{restaurantId:bobonne.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:bobonne.hash,mealid:bobonne.mealid});
  Object.assign(f.observation.data.booking,{mealid:bobonne.mealid,
    meal:{type:2,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',bobonne.name);
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Bobonne ordinary Lunch binds full venue name and excludes dinner and larger parties',()=>{
  const {v,f,check}=bobonneFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [3,6,7]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  assert.equal(v.approvalDigest({...f.approval,mealid:155}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:policy.hash}),null);
  for(const patch of [{date:'2030-01-19'},{date:'2030-01-20'},{time:'11:00'},{time:'11:29'},{time:'14:00'}])
    assert.equal(v.approvalDigest({...f.approval,...patch}),null);
  for(const time of ['11:30','13:59']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const patch of [{name:'Other'},{hash:policy.hash},{mealid:155},{maxParty:3}])
    assert.throws(()=>createBokabordReceiptVerifier({...bobonne,...patch}),/reviewed_ordinary_meal_policy_required/);
  f.observation.data.booking.mealid=155;assert.equal(check().status,'unknown');
});

test('Bobonne retains submission and independent receipt binding with native-phone approval',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>{delete f.observation.request;},
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.attempt.restaurantId='curated-STO-other',
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=bobonneFixture();change(f);assert.equal(check().status,'unknown'); }
});

function pelikanFixture() {
  const v=createBokabordReceiptVerifier(pelikan),f=fixture();
  Object.assign(f.approval,{hash:pelikan.hash,mealid:pelikan.mealid,time:'19:00'});
  Object.assign(f.attempt,{restaurantId:pelikan.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:pelikan.hash,mealid:pelikan.mealid,time:'19:00'});
  Object.assign(f.observation.data.booking,{mealid:pelikan.mealid,time:'19:00',
    meal:{type:3,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',pelikan.name)
    .replace('(Lunch)','(Middag)').replace('12:00 - 13:30','19:00 - 20:30');
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Pelikan ordinary dinner binds canonical identity, type and cap; lunch/private meals excluded',()=>{
  const {v,f,check}=pelikanFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [1,3,10]) assert.equal(v.approvalDigest({...f.approval,party}),null);
  for(const time of ['15:59','22:30']) assert.equal(v.approvalDigest({...f.approval,time}),null);
  for(const time of ['16:00','22:29']) assert.ok(v.approvalDigest({...f.approval,time}));
  for(const patch of [{name:'Pelikan'},{hash:policy.hash},{mealid:293},{mealType:2},{maxParty:3}]) assert.throws(()=>createBokabordReceiptVerifier({...pelikan,...patch}));
  assert.equal(v.approvalDigest({...f.approval,hash:policy.hash}),null);
  for(const mealid of [293,11704,65474]) {
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
});

test('Pelikan requires bound receipt and preserves payment, waitlist, consent and replay guards',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=2,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.attempt.restaurantId='curated-STO-other',
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=pelikanFixture();change(f);assert.equal(check().status,'unknown'); }
});

function agnesFixture() {
  const v=createBokabordReceiptVerifier(agnes),f=fixture();
  Object.assign(f.approval,{hash:agnes.hash,mealid:agnes.mealid,time:'19:00'});
  Object.assign(f.attempt,{restaurantId:agnes.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:agnes.hash,mealid:agnes.mealid,time:'19:00'});
  Object.assign(f.observation.data.booking,{mealid:agnes.mealid,time:'19:00',
    meal:{type:3,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',agnes.name)
    .replace('(Lunch)','(Middag)').replace('12:00 - 13:30','19:00 - 20:30');
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Agnes ordinary dinner binds canonical identity, type and cap; lunch/private meals excluded',()=>{
  const {v,f,check}=agnesFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:policy.hash}),null);
  for(const mealid of [1627,2775,3568]) {
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
});

test('Agnes requires bound receipt and preserves payment, waitlist, consent and replay guards',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.type=2,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.attempt.restaurantId='curated-STO-other',
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=agnesFixture();change(f);assert.equal(check().status,'unknown'); }
});

function gondolenFixture() {
  const v=createBokabordReceiptVerifier(gondolen),f=fixture();
  Object.assign(f.approval,{hash:gondolen.hash,mealid:gondolen.mealid});
  Object.assign(f.attempt,{restaurantId:gondolen.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:gondolen.hash,mealid:gondolen.mealid});
  Object.assign(f.observation.data.booking,{mealid:gondolen.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',gondolen.name);
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Gondolen ordinary Lunch binds exact identity and excludes dinner, private rooms and every published event',()=>{
  const {v,f,check}=gondolenFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  assert.equal(v.approvalDigest({...f.approval,hash:policy.hash}),null);
  for(const mealid of [33009,34460,36498,39271,46058,51679,53289,53348,53350,65403]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=gondolen.mealid;
  f.observation.data.booking.meal.type=3;assert.equal(check().status,'unknown');
});

test('Gondolen card, replay, consent and independent receipt guards remain mandatory',()=>{
  for(const change of [
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>f.observation.attemptId='replayed',
    f=>f.attempt.dispatched=false,
    f=>f.attempt.restaurantId='curated-STO-other',
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=gondolenFixture();change(f);assert.equal(check().status,'unknown'); }
});
function klotetFixture() {
  const v=createBokabordReceiptVerifier(klotet),f=fixture();
  Object.assign(f.approval,{hash:klotet.hash,mealid:klotet.mealid,date:'2026-10-23'});
  Object.assign(f.attempt,{restaurantId:klotet.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:klotet.hash,mealid:klotet.mealid,date:f.approval.date});
  Object.assign(f.observation.data.booking,{mealid:klotet.mealid,date:f.approval.date,
    meal:{type:0,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',klotet.name)
    .replace('(Lunch)','(Fredagslunch på Café Klotet)').replace('tisdag 15 jan','fredag 23 okt');
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}

test('Klotet exact recurring Friday lunch requires its reviewed tuple and published date/time window',()=>{
  const {v,f,check}=klotetFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const patch of [{party:3},{date:'2026-10-24'},{date:'2026-09-04'},
    {date:'2026-12-25'},{time:'11:59'},{time:'15:00'},
    ...[39316,39493,43781,53207,54658,64420].map(mealid=>({mealid}))])
    assert.equal(v.approvalDigest({...f.approval,...patch}),null);
  for(const date of ['2026-09-11','2026-12-18']) assert.ok(v.approvalDigest({...f.approval,date}));
  for(const patch of [{restaurantId:'other'},{name:'Other'},{hash:policy.hash},
    {mealid:39316},{mealType:2},{maxParty:3},{type0Contract:undefined},
    {type0Contract:dagmar.type0Contract}])
    assert.throws(()=>createBokabordReceiptVerifier({...klotet,...patch}),/reviewed_ordinary_meal_policy_required/);
});

test('Klotet type0 exception preserves receipt, payment, contact and attempt guards',()=>{
  for(const change of [
    f=>f.observation.data.booking.mealid=39316,
    f=>f.observation.data.booking.meal.type=3,
    f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,
    f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.waitlist=1,
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.observation.receipt.documentNavigationId=999,
    f=>{delete f.observation.receipt;},
  ]) { const {f,check}=klotetFixture();change(f);assert.equal(check().status,'unknown'); }
});
test('Italiano Dining Room binds dinner type and excludes Saturday lunch and Bar',()=>{
  const v=createBokabordReceiptVerifier(italiano),f=fixture();
  Object.assign(f.approval,{hash:italiano.hash,mealid:italiano.mealid,time:'19:00'});
  Object.assign(f.attempt,{restaurantId:italiano.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:italiano.hash,mealid:italiano.mealid,time:'19:00'});
  Object.assign(f.observation.data.booking,{mealid:italiano.mealid,time:'19:00',
    meal:{type:3,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',italiano.name)
    .replace('(Lunch)','(Dining Room)').replace('12:00 - 13:30','19:00 - 20:30');
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [13836,56070]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=italiano.mealid;
  f.observation.data.booking.meal.type=2;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.type=3;
  f.observation.data.booking.require_noshow=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.require_noshow=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Copine Lunch excludes paid dinner and unpaid private lunch alike',()=>{
  const v=createBokabordReceiptVerifier(copine),f=fixture();
  Object.assign(f.approval,{hash:copine.hash,mealid:copine.mealid});
  Object.assign(f.attempt,{restaurantId:copine.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:copine.hash,mealid:copine.mealid});
  Object.assign(f.observation.data.booking,{mealid:copine.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',copine.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [4788,5303,9196]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=copine.mealid;
  f.observation.data.booking.meal.bullets={cc:{sw:'Bekräftas med betalkort'}};
  assert.equal(check().status,'unknown');f.observation.data.booking.meal.bullets={};
  f.observation.data.booking.meal.must_pay_directly=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.must_pay_directly=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
function dagmarFixture() {
  const v=createBokabordReceiptVerifier(dagmar),f=fixture();
  Object.assign(f.approval,{hash:dagmar.hash,mealid:dagmar.mealid});
  Object.assign(f.attempt,{restaurantId:dagmar.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:dagmar.hash,mealid:dagmar.mealid});
  Object.assign(f.observation.data.booking,{mealid:dagmar.mealid,
    meal:{type:0,group_booking:[],must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',dagmar.name);
  return {v,f,check:()=>v.verify(f.attempt,f.approval,f.observation)};
}
test('type0 requires the explicit exact Dagmar tuple, never a reusable broad switch',()=>{
  assert.doesNotThrow(()=>createBokabordReceiptVerifier({...dagmar}));
  for(const patch of [{type0Contract:undefined},{type0Contract:true},{type0Contract:'other'},
    {restaurantId:policy.restaurantId},{name:'Other'},{hash:policy.hash},{mealid:34285},
    {mealid:63586},{mealid:16915},{mealType:'0'},{mealType:2},{maxParty:3},{maxParty:8}]){
    assert.throws(()=>createBokabordReceiptVerifier({...dagmar,...patch}),/reviewed_ordinary_meal_policy_required/);
  }
  for(const p of [policy,ciccios,riche,sturehof,beirut,balzac,kommendoren,astrid,vau,boqueria]){
    assert.doesNotThrow(()=>createBokabordReceiptVerifier(p));
    assert.throws(()=>createBokabordReceiptVerifier({...p,mealType:0}));
    assert.throws(()=>createBokabordReceiptVerifier({...p,mealType:0,type0Contract:dagmar.type0Contract}));
  }
});
test('Dagmar exact Lunch type0 still needs bound transaction and receipt',()=>{
  const {f,v,check}=dagmarFixture();
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  f.observation.data.booking.meal.type='0';assert.equal(check().status,'confirmed');
  for(const mealType of [1,2,3,4]){f.observation.data.booking.meal.type=mealType;assert.equal(check().status,'unknown');}
  f.observation.data.booking.meal.type=0;
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [34285,63586,16915]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=dagmar.mealid;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Dagmar type0 opt-in preserves requirements, consent, request and attempt guards',()=>{
  for(const change of [f=>f.observation.data.booking.meal.must_pay_directly=true,
    f=>f.observation.data.booking.meal.mandatory_products=true,
    f=>f.observation.data.booking.meal.bullets={cc:{sw:'Kort'}},
    f=>f.observation.data.booking.require_noshow=true,
    f=>f.observation.data.booking.group_booking=true,f=>f.observation.data.booking.parent_order=123,
    f=>f.observation.data.booking.waitlist=1,f=>f.observation.data.booking.products=[{}],
    f=>f.observation.data.booking.status=0,
    f=>f.observation.request.url='https://app.bokabord.se/booking-widget/api/sendCustomRequest',
    f=>f.observation.request.payload.terms.general=false,
    f=>f.observation.request.payload.is_temp_booking=true,
    f=>f.observation.request.payload.phone='+46711111111',
    f=>f.observation.attemptId='replayed',f=>f.attempt.dispatched=false,
    f=>f.observation.receipt.documentNavigationId=999]){
    const {f,check}=dagmarFixture();change(f);assert.equal(check().status,'unknown');
  }
});

test('Beirut Lunch binds exact accented identity and excludes card dinner and special meals',()=>{
  const v=createBokabordReceiptVerifier(beirut),f=fixture();
  Object.assign(f.approval,{hash:beirut.hash,mealid:beirut.mealid});
  Object.assign(f.attempt,{restaurantId:beirut.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:beirut.hash,mealid:beirut.mealid});
  Object.assign(f.observation.data.booking,{mealid:beirut.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',beirut.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [19973,52207,27393])assert.equal(v.approvalDigest({...f.approval,mealid}),null);
  f.observation.data.booking.meal.bullets={cc:{sw:'Bekräftas med betalkort'}};
  assert.equal(check().status,'unknown');f.observation.data.booking.meal.bullets={};
  f.observation.receipt.text=f.observation.receipt.text.replace('Beirut Café','Beirut Cafe');
  assert.equal(check().status,'unknown');
  f.observation.receipt.text=f.observation.receipt.text.replace('Beirut Cafe',beirut.name);
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Balzac Lunch binds full provider name and excludes other meals despite ordinary dinner type',()=>{
  const v=createBokabordReceiptVerifier(balzac),f=fixture();
  Object.assign(f.approval,{hash:balzac.hash,mealid:balzac.mealid});
  Object.assign(f.attempt,{restaurantId:balzac.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:balzac.hash,mealid:balzac.mealid});
  Object.assign(f.observation.data.booking,{mealid:balzac.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',balzac.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [9116,10951,62983]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=balzac.mealid;
  f.observation.receipt.text=f.observation.receipt.text.replace(balzac.name,'Balzac');
  assert.equal(check().status,'unknown');
  f.observation.receipt.text=f.observation.receipt.text.replace('Balzac',balzac.name);
  f.observation.data.booking.meal.must_pay_directly=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.must_pay_directly=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Kommendoren Lunch requires exact venue and excludes Saturday lunch and other meal IDs',()=>{
  const v=createBokabordReceiptVerifier(kommendoren),f=fixture();
  Object.assign(f.approval,{hash:kommendoren.hash,mealid:kommendoren.mealid});
  Object.assign(f.attempt,{restaurantId:kommendoren.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:kommendoren.hash,mealid:kommendoren.mealid});
  Object.assign(f.observation.data.booking,{mealid:kommendoren.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',kommendoren.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [453,1805,56547,65558,65397]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=kommendoren.mealid;
  f.observation.receipt.text=f.observation.receipt.text.replace(kommendoren.name,'Kommendoren');
  assert.equal(check().status,'unknown');
  f.observation.receipt.text=f.observation.receipt.text.replace('Kommendoren',kommendoren.name);
  f.observation.data.booking.meal.mandatory_products=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.mandatory_products=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Astrid ordinary Lunch excludes large-party requests and other meals',()=>{
  const v=createBokabordReceiptVerifier(astrid),f=fixture();
  Object.assign(f.approval,{hash:astrid.hash,mealid:astrid.mealid});
  Object.assign(f.attempt,{restaurantId:astrid.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:astrid.hash,mealid:astrid.mealid});
  Object.assign(f.observation.data.booking,{mealid:astrid.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',astrid.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  for(const party of [3,9,12])assert.equal(v.approvalDigest({...f.approval,party}),null);
  for(const mealid of [55509,58704,65363]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=astrid.mealid;
  f.observation.request.url='https://app.bokabord.se/booking-widget/api/sendCustomRequest';
  assert.equal(check().status,'unknown');
});
test('Vau Lunch requires exact provider capitalization and excludes card dinner',()=>{
  const v=createBokabordReceiptVerifier(vau),f=fixture();
  Object.assign(f.approval,{hash:vau.hash,mealid:vau.mealid});
  Object.assign(f.attempt,{restaurantId:vau.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:vau.hash,mealid:vau.mealid});
  Object.assign(f.observation.data.booking,{mealid:vau.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',vau.name);
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  assert.equal(v.approvalDigest({...f.approval,mealid:22477}),null);
  f.observation.data.booking.mealid=22477;assert.equal(check().status,'unknown');
  f.observation.data.booking.mealid=vau.mealid;
  f.observation.data.booking.meal.bullets={cc:{sw:'Bekräftas med betalkort'}};
  assert.equal(check().status,'unknown');f.observation.data.booking.meal.bullets={};
  f.observation.receipt.text=f.observation.receipt.text.replace(vau.name,'Vau de Ville');
  assert.equal(check().status,'unknown');
  f.observation.receipt.text=f.observation.receipt.text.replace('Vau de Ville',vau.name);
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Boqueria LUNCH rejects all dinner and event meals regardless of payment flag',()=>{
  const v=createBokabordReceiptVerifier(boqueria),f=fixture();
  Object.assign(f.approval,{hash:boqueria.hash,mealid:boqueria.mealid});
  Object.assign(f.attempt,{restaurantId:boqueria.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:boqueria.hash,mealid:boqueria.mealid});
  Object.assign(f.observation.data.booking,{mealid:boqueria.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',boqueria.name).replace('(Lunch)','(LUNCH)');
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [11110,146,3709,64620,51751,65006,52627,52902,14627]){
    assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');
  }
  f.observation.data.booking.mealid=boqueria.mealid;
  f.observation.data.booking.meal.must_pay_directly=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.must_pay_directly=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
function fixture() {
  const approval = {hash:policy.hash,mealid:policy.mealid,date:'2030-01-15',time:'12:00',party:2,
    firstname:'Fixture',lastname:'Guest',email:'fixture@example.test',phone:'+46700000000',comment:'',terms:true};
  const attempt = {provider:'BokaBord',restaurantId:policy.restaurantId,sessionId:'fixture-session',attemptId:'fixture-attempt',
    idempotencyKey:'fixture-key',detailsDigest:verifier.approvalDigest(approval),mode:'fixture',dispatched:true,dispatchedAt:1000};
  const booking = {id:123,status:1,mealid:policy.mealid,meal:{type:policy.mealType},short_code:'synthetic-capability',
    date:approval.date,time:approval.time,amount:approval.party,firstname:approval.firstname,lastname:approval.lastname,
    email:approval.email,phone:46700000000,waitlist:0,products:[],require_noshow:false,group_booking:false,parent_order:false};
  const observation = {...attempt,httpOk:true,source:'fixture',respondedAt:1100,data:{success:true,booking},
    request:{method:'POST',url:'https://app.bokabord.se/reservation/api/booking/saveBooking',payload:{...approval,
      amount:approval.party,terms:{general:true,restaurant:false,bokabord:false},waitlist:false,products:[],linked_meals:[]}},
    receipt:{mainFrame:true,method:'GET',httpOk:true,navigatedAt:1200,capturedAt:1300,
      navigationId:1,documentNavigationId:1,
      documentUrl:'https://app.bokabord.se/reservation/booking/?code=synthetic-capability&new=1',
      url:'https://app.bokabord.se/reservation/booking/?code=synthetic-capability&new=1',
      text:'Tack för din bokning.\n\nDu är nu klar och bekräftelse har skickats via epost.\n\nNoema\n2 pers. (Lunch)\ntisdag 15 jan\n12:00 - 13:30\nBokningsreferens\n# 123\nGästinformation\nFixture Guest'}};
  return {approval,attempt,observation};
}
const run = f => verifier.verify(f.attempt,f.approval,f.observation);
test('Sturehof Lunch caps initial scope at two and distinguishes meal metadata from actual group bookings',()=>{
  const v=createBokabordReceiptVerifier(sturehof),f=fixture();
  Object.assign(f.approval,{hash:sturehof.hash,mealid:sturehof.mealid});
  Object.assign(f.attempt,{restaurantId:sturehof.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:sturehof.hash,mealid:sturehof.mealid});
  Object.assign(f.observation.data.booking,{mealid:sturehof.mealid,
    meal:{type:2,group_booking:true,must_pay_directly:false,mandatory_products:false,bullets:{}}});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema','Sturehof');
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.equal(v.approvalDigest({...f.approval,party:3}),null);
  for(const mealid of [3912,34881,27297])assert.equal(v.approvalDigest({...f.approval,mealid}),null);
  f.observation.data.booking.group_booking=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.group_booking=false;
  f.observation.data.booking.meal.must_pay_directly=true;assert.equal(check().status,'unknown');
  f.observation.data.booking.meal.must_pay_directly=false;
  delete f.observation.receipt;assert.equal(check().status,'unknown');
});
test('Riche Lunch is receipt-bound; dinner, brunch and late drinks are excluded',()=>{
  const v=createBokabordReceiptVerifier(riche),f=fixture();
  Object.assign(f.approval,{hash:riche.hash,mealid:riche.mealid});
  Object.assign(f.attempt,{restaurantId:riche.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:riche.hash,mealid:riche.mealid});
  f.observation.data.booking.mealid=riche.mealid;
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema','Riche');
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.ok(v.approvalDigest({...f.approval,party:8}));assert.equal(v.approvalDigest({...f.approval,party:9}),null);
  for(const mealid of [7181,7426,65062]){assert.equal(v.approvalDigest({...f.approval,mealid}),null);
    f.observation.data.booking.mealid=mealid;assert.equal(check().status,'unknown');}
  f.observation.data.booking.mealid=riche.mealid;f.observation.data.booking.meal.must_pay_directly=true;
  assert.equal(check().status,'unknown');
});
test('Ciccios Dining Room uses the same bound contract with exact provider identity and party limit',()=>{
  const v=createBokabordReceiptVerifier(ciccios),f=fixture();
  Object.assign(f.approval,{hash:ciccios.hash,mealid:ciccios.mealid,time:'19:00'});
  Object.assign(f.attempt,{restaurantId:ciccios.restaurantId,detailsDigest:v.approvalDigest(f.approval)});
  Object.assign(f.observation,{restaurantId:f.attempt.restaurantId,detailsDigest:f.attempt.detailsDigest});
  Object.assign(f.observation.request.payload,{hash:ciccios.hash,mealid:ciccios.mealid,time:'19:00'});
  Object.assign(f.observation.data.booking,{mealid:ciccios.mealid,meal:{type:3},time:'19:00'});
  f.observation.receipt.text=f.observation.receipt.text.replace('Noema',ciccios.name).replace('(Lunch)','(Dining Room)').replace('12:00 - 13:30','19:00 - 20:30');
  const check=()=>v.verify(f.attempt,f.approval,f.observation);
  assert.equal(check().status,'confirmed');assert.equal(check().verification.source,'fixture');
  assert.ok(v.approvalDigest({...f.approval,party:7}));assert.equal(v.approvalDigest({...f.approval,party:8}),null);
  assert.equal(v.approvalDigest({...f.approval,mealid:56067}),null,'Bar is out of scope');
  f.observation.receipt.text=f.observation.receipt.text.replace("Ciccio's",'Ciccio’s');assert.equal(check().status,'unknown','exact observed provider name');
  f.observation.receipt.text=f.observation.receipt.text.replace('Ciccio’s',"Ciccio's");
  f.observation.data.booking.mealid=56067;assert.equal(check().status,'unknown');
  assert.throws(()=>createBokabordReceiptVerifier({...ciccios,maxParty:9}));
});
test('complete bound synthetic transaction plus document yields fixture proof, without private data',()=>{
  const f=fixture(), result=run(f);assert.equal(result.status,'confirmed');assert.equal(result.verification.source,'fixture');
  assert.equal(result.reference,'123');assert(!JSON.stringify(result).includes('synthetic-capability'));
  assert(!JSON.stringify(result).includes('fixture@example.test'));
  f.observation.data.booking.meal.type='2';assert.equal(run(f).status,'confirmed');
});
test('success/id/status1 or completion event alone can never confirm',()=>{
  for(const change of [f=>delete f.observation.receipt,f=>f.observation.receipt.text='reservationSuccess',
    f=>f.observation.receipt.text='Kontrollera din bokning',f=>f.observation.data.booking.status=99,
    f=>f.observation.data.booking.status=0,f=>f.observation.data.booking.status=2,
    f=>f.observation.data.booking.status='1']){const f=fixture();change(f);assert.equal(run(f).status,'unknown');}
});
test('body prefix and reference section prevent loose text matching',()=>{
  for(const change of [t=>'Gästkommentar\n'+t,t=>t.replace('Noema','Other restaurant'),t=>t.replace('2 pers.','3 pers.'),
    t=>t.replace('# 123','# 456'),t=>t+'\nBokningsreferens\n# 123\nGästinformation',
    t=>t.replace('Gästinformation','Kommentar'),t=>t+'\nBokningen har avbokats']){
    const f=fixture();f.observation.receipt.text=change(f.observation.receipt.text);assert.equal(run(f).status,'unknown');
  }
});
test('only exact capability URL, main frame, successful GET and fresh sequence are accepted',()=>{
  for(const patch of [{url:'https://evil.example/reservation/booking/?code=synthetic-capability&new=1'},
    {url:'https://app.bokabord.se/reservation/booking/?code=wrong&new=1'},
    {url:'https://app.bokabord.se/reservation/booking/?code=synthetic-capability&new=1&do_confirm=1'},
    {url:'https://app.bokabord.se/reservation/booking/?code=synthetic-capability&code=synthetic-capability'},
    {mainFrame:false},{method:'POST'},{httpOk:false},{navigatedAt:999},{capturedAt:999},{capturedAt:100000}]){
    const f=fixture();Object.assign(f.observation.receipt,patch);assert.equal(run(f).status,'unknown');
  }
});
test('request and reply must match exact approved venue, selection, guest and consent',()=>{
  for(const key of ['hash','mealid','date','time','amount','firstname','lastname','email','phone']){
    const f=fixture();f.observation.request.payload[key]='wrong';assert.equal(run(f).status,'unknown',key);
  }
  for(const key of ['mealid','date','time','amount','firstname','lastname','email','phone']){
    const f=fixture();f.observation.data.booking[key]='wrong';assert.equal(run(f).status,'unknown',key);
  }
  const f=fixture();f.observation.request.payload.terms.general=false;assert.equal(run(f).status,'unknown');
});
test('HTTP document and atomic DOM capture must belong to the same navigation',()=>{
  for(const patch of [{documentUrl:'https://app.bokabord.se/reservation/'},{documentNavigationId:2},
    {navigationId:0},{navigationId:undefined},{documentNavigationId:undefined},{documentUrl:undefined}]){
    const f=fixture();Object.assign(f.observation.receipt,patch);assert.equal(run(f).status,'unknown');
  }
});
test('unsupported requirements and malformed shapes never confirm',()=>{
  for(const patch of [{waitlist:1},{require_noshow:true},{products:[{}]},{linked_meals:{}},{giftcard:0},
    {is_temp_booking:0},{parent_order:0},{group_booking:true},{meal:{type:2,bullets:[]}},{meal:{type:2,bullets:{cc:true}}},
    {meal:{type:2,must_pay_directly:true}},{meal:{type:2,mandatory_products:true}}]){
    const f=fixture();Object.assign(f.observation.data.booking,patch);assert.equal(run(f).status,'unknown');
  }
});
test('server attempt and source binding survives copied or stale observations',()=>{
  for(const key of ['provider','restaurantId','sessionId','attemptId','idempotencyKey','detailsDigest','source']){
    const f=fixture();f.observation[key]='other';assert.equal(run(f).status,'unknown',key);
  }
  const f=fixture();f.attempt.mode='live';assert.equal(run(f).status,'unknown','fixture cannot confirm live');
  f.observation.source='provider';assert.equal(run(f).status,'confirmed','synthetic coverage of trusted provider-source branch');
  f.attempt.dispatched=false;assert.equal(run(f).status,'unknown');
});
test('digest rejects invalid dates, unsupported meals and changed approval',()=>{
  for(const patch of [{date:'2030-02-30'},{time:'25:00'},{party:9},{terms:false},{mealid:9778},{phone:'x'}]){
    assert.equal(verifier.approvalDigest({...fixture().approval,...patch}),null);
  }
  const f=fixture();f.approval.comment='changed';assert.equal(run(f).status,'unknown');
});
