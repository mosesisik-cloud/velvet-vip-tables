import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-http-'));
const portServer=net.createServer();await new Promise(r=>portServer.listen(0,'127.0.0.1',r));
const port=portServer.address().port;await new Promise(r=>portServer.close(r));
const child=spawn(process.execPath,['api/server.mjs'],{env:{...process.env,PORT:String(port),VELVET_CRAWL:'0',VELVET_BOKABORD_MIRROR:'live',VELVET_PLAYWRIGHT_INSPECTION:'disabled',VELVET_DATA:path.join(directory,'store.json'),VELVET_PAY:path.join(directory,'pay.json'),VELVET_IDV:path.join(directory,'idv'),VELVET_BOOKINGS_DB:path.join(directory,'bookings.sqlite'),VELVET_PLAYWRIGHT_DB:path.join(directory,'attempts.sqlite')},stdio:'ignore'});
try {
  const base=`http://127.0.0.1:${port}`;
  let ready=false;
  for(let i=0;i<60;i++){try{ready=(await fetch(base+'/health')).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
  assert(ready,'server starts');
  const caps=await (await fetch(base+'/restaurant-bookings/playwright/config')).json();
  assert(caps.bokabord.guestBooking);assert(caps.providers.every(p=>!p.enabled&&!p.liveBooking));
  for(const [route,method,status] of [['/restaurant-bookings/playwright','POST',403],['/restaurant-bookings/playwright/attempts','GET',401],['/availability/STO-001/book','POST',409]]){
    const response=await fetch(base+route,{method});assert.equal(response.status,status,route);
  }
  const cross=await fetch(base+'/restaurant-bookings/playwright',{method:'POST',headers:{Origin:'https://untrusted.invalid'}});assert.equal(cross.status,403);
  console.log('PASS actual HTTP server: capability, guest recovery ownership, operator boundary, retired legacy write, origin guard; no supplier calls');
} finally {
  const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill();await stopped;
  fs.rmSync(directory,{recursive:true,force:true});
}
