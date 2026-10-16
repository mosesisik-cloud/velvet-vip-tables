import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BokabordMirror, RESTAURANT_DETAILS } from '../api/bokabord-mirror.mjs';
import { BookingLedger } from '../api/bokabord-ledger.mjs';
import { PlaywrightAttemptLedger } from '../api/playwright-attempt-ledger.mjs';
import { createBookingJournalHooks } from '../api/playwright-booking-journal.mjs';
const restaurantId = 'curated-STO-zink-italian-cuisine';
const approval = {date:'2030-01-15',time:'19:00',party:2,firstname:'Test',lastname:'Person',email:'test@example.com',phone:'0700000000',comment:'',mealid:1,hash:RESTAURANT_DETAILS[restaurantId].hash,terms:true};
async function nativeFixture(hooks) {
  let routeHandler, sent=0, aborted=0;
  const page={on(){},setDefaultTimeout(){},goto:async()=>{},locator:()=>({first:()=>({waitFor:async()=>{}})})};
  const context={route:async(_pattern,handler)=>{routeHandler=handler;},newPage:async()=>page,on(){},close:async()=>{}};
  const mirror=new BokabordMirror({prepare:true,live:true,...hooks});
  mirror.browser=async()=>({newContext:async()=>context}); mirror.settle=async()=>{};
  mirror.snapshot=async s=>(s.lastSnapshot={id:s.id,revision:0,canSubmit:true,result:null});
  await mirror.create('owner',restaurantId);
  const session=[...mirror.sessions.values()][0];
  session.armed=true;session.approval=approval;
  const transmit=()=>routeHandler({request:()=>({method:()=> 'POST',url:()=> 'https://app.bokabord.se/reservation/api/booking/saveBooking',postDataJSON:()=>({...approval,amount:approval.party,terms:{general:true,restaurant:false,bokabord:false},products:[],waitlist:false,giftcard:null,linked_meals:[],bookingid:null})}),continue:async()=>{sent++;},abort:async()=>{aborted++;}});
  return {mirror,session,transmit,counts:()=>({sent,aborted})};
}
test('actual native route + shared hook permits one mock transmission; restart/key rotation cannot resend',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-journal-'));
  const file=path.join(directory,'attempts.sqlite'), legacyLedger=new BookingLedger(path.join(directory,'legacy'));
  let ledger=new PlaywrightAttemptLedger(file);
  const rows=[];
  const hooks=()=>createBookingJournalHooks({ledger,legacyLedger,register:{upsert:r=>rows.push(r)},restaurants:RESTAURANT_DETAILS});
  let first,second,third;
  try {
    first=await nativeFixture(hooks()); await first.transmit();
    assert.deepEqual(first.counts(),{sent:1,aborted:0});
    assert.equal(ledger.list('owner')[0].status,'unknown');
    assert.equal(ledger.list('other').length,0);
    await first.mirror.close(); first=null; ledger.close(); ledger=new PlaywrightAttemptLedger(file);
    second=await nativeFixture(hooks()); await second.transmit();
    assert.deepEqual(second.counts(),{sent:0,aborted:1});
    assert.equal(second.session.result.status,'already_attempted');
    assert.equal(ledger.list('owner').length,1);
    assert.equal(fs.existsSync(legacyLedger.directory),false,'no dual journal writes');
    const recovered=hooks().recover('owner');assert.equal(recovered[0].status,'unknown');
    assert(!JSON.stringify(recovered).includes('test@example.com'));
    // An existing legacy attempt is a read-only barrier even if its JSON is corrupt.
    fs.mkdirSync(legacyLedger.directory);
    fs.writeFileSync(path.join(legacyLedger.directory,legacyLedger.key(approval,{owner:'owner',restaurantId})+'.json'),'partial');
    third=await nativeFixture(hooks());await third.transmit();
    assert.deepEqual(third.counts(),{sent:0,aborted:1});
  } finally {
    await first?.mirror.close(); await second?.mirror.close(); await third?.mirror.close(); ledger.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
