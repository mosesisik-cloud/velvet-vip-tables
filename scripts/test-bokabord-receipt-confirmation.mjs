import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBokabordReceiptVerifier, NOEMA_LUNCH_RECEIPT_POLICY as policy, CICCIOS_DINING_RECEIPT_POLICY as ciccios } from '../api/bokabord-receipt-confirmation.mjs';
const verifier = createBokabordReceiptVerifier(policy);
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
