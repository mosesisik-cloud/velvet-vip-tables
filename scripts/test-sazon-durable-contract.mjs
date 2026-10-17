import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {TablecheckSazon,SAZON} from '../api/providers/tablecheck-sazon.mjs';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
import {BookingRegister} from '../api/booking-register.mjs';
// Explicit synthetic source-contract model. No provider success or compatibility is asserted.
const context=JSON.parse(fs.readFileSync(new URL('./fixtures/tablecheck-sazon-source.json',import.meta.url))).context;
const html=`<input data-preloaded="context" value='${JSON.stringify(context).replaceAll('&','&amp;').replaceAll("'",'&#39;')}' />`;
const now=Date.parse('2026-10-16T12:00:00Z'),startAt='2026-10-19T10:00:00Z';
const orders=[{menu_item_id:SAZON.menuId,qty:1,is_group_order:true}];
const approve=(s,type)=>({type,revision:s.revision,confirm:true,terms:true,reviewToken:s.reviewToken,
  reviewFingerprint:s.reviewFingerprint,termsVersion:s.terms.version});
for(const scenario of ['synthetic_success','missing_raw_proof','ambiguous_checkout'])test(`real SQLite/register and offline Sazon lifecycle: ${scenario}`,async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-sazon-contract-'));
  const file=path.join(dir,'attempts.sqlite'),registerFile=path.join(dir,'register.sqlite');
  let ledger=new PlaywrightAttemptLedger(file),register=new BookingRegister(registerFile),journal;
  const setup=()=>{journal=createProviderJournal({ledger,register,provider:'TableCheck',mode:'fixture',
    restaurants:{[SAZON.restaurantId]:{name:'Sazon',cartPreparation:true,orderEvidence:'own_booking_raw_readback',confirmationPolicySource:SAZON.url}}});};setup();
  const calls=[],intents=[];let adapter;
  const make=()=>new TablecheckSazon({mode:'fixture',now:()=>now,
    fetchImpl:async url=>({status:200,url,text:async()=>url===SAZON.url?html:JSON.stringify({availability_grid:{data:[{a:true,t:startAt,sc:null,exp:SAZON.menuId}]}})}),
    reserveSubmission:intent=>{intents.push(structuredClone(intent));return journal.reserveAttempt(intent);},
    recordResult:({approval,attempt,result})=>{
      if(scenario==='missing_raw_proof'&&result.verification){result=structuredClone(result);delete result.verification.orderEvidence;}
      return journal.recordAttempt({intent:approval,attempt,result});
    },
    mutationTransport:async request=>{
      calls.push(request.phase);
      if(request.phase!=='readback'){
        const intent=intents.at(-1);assert.equal(intent.phase,request.phase);
        const saved=ledger.list('owner').find(a=>a.phase===request.phase);
        assert(saved);assert.equal(saved.status,'unknown');assert.equal(saved.reviewFingerprint,intent.reviewFingerprint);
      }
      if(request.phase==='cart_init')return {status:200,data:{}};
      if(request.phase==='cart'||request.phase==='cart_update')return {status:200,data:{availability:{type:'success'},is_request_enabled:false,
        cart:{id:'synthetic-cart',access_token:'synthetic-secret-capability',expires_at:new Date(now+300000).toISOString(),start_at:startAt,orders,
          payment_transaction_type:'none',show_payment_form:false,booking_fee_amt:null}}};
      if(request.phase==='booking'&&scenario==='ambiguous_checkout')throw new Error('synthetic timeout');
      return {status:200,data:{reservation:{id:'synthetic-booking',slug:'synthetic-code',shop_id:SAZON.shopId,shop_slug:SAZON.slug,
        start_at:startAt,num_people_adult:2,num_people_senior:0,num_people_child:0,num_people_baby:0,service_category_id:null,
        orders,customer_status:'accepted',iou_payable:false,iou_status:null}}};
    }});
  const ready=async()=>{
    let s=await adapter.create('owner',SAZON.restaurantId);
    s=await adapter.action(s.id,'owner',{type:'search',date:'2026-10-19',party:2,revision:s.revision});
    s=await adapter.action(s.id,'owner',{type:'select',slotId:s.availabilityEvidence.slots[0].id,revision:s.revision});
    return adapter.action(s.id,'owner',{type:'review',revision:s.revision});
  };
  try{
    adapter=make();let s=await ready();s=await adapter.action(s.id,'owner',approve(s,'cart'));
    assert.deepEqual(register.list(['owner']),[]);
    s=await adapter.action(s.id,'owner',{type:'fill',revision:s.revision,fields:{firstname:'Synthetic',lastname:'Guest',email:'fixture@example.invalid',phone:'+46700000000'}});
    s=await adapter.action(s.id,'owner',{type:'review',revision:s.revision});
    s=await adapter.action(s.id,'owner',approve(s,'submit'));
    assert.equal(s.result.status,scenario==='synthetic_success'?'confirmed':'unknown');
    if(scenario==='synthetic_success')assert.equal(journal.verifySnapshot(s,'owner').verification.orderEvidence,'own_booking_raw_readback');
    const serialized=JSON.stringify({attempts:ledger.list('owner'),history:register.list(['owner']),snapshot:s});
    assert(!serialized.includes('synthetic-secret-capability'));assert(!serialized.includes('fixture@example.invalid'));
    assert.equal(register.list(['owner']).length,1);assert.deepEqual(register.list(['other']),[]);
    assert.deepEqual(calls,scenario==='ambiguous_checkout'?['cart_init','cart','cart_update','booking']:['cart_init','cart','cart_update','booking','readback']);
    await adapter.close();ledger.close();register.close();
    ledger=new PlaywrightAttemptLedger(file);register=new BookingRegister(registerFile);setup();journal.recover('owner');
    assert.equal(register.list(['owner'])[0].status,scenario==='synthetic_success'?'confirmed':'unknown');
    const count=calls.length;adapter=make();s=await ready();
    await assert.rejects(adapter.action(s.id,'owner',approve(s,'cart')),/already_attempted/);
    assert.equal(calls.length,count);
  }finally{await adapter?.close();ledger.close();register.close();fs.rmSync(dir,{recursive:true,force:true});}
});
