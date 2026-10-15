import fs from 'node:fs/promises';
import {BokabordAvailability} from '../api/providers/bokabord-availability.mjs';
if(process.env.BOKABORD_LIVE_READONLY!=='1')throw Error('Explicit opt-in BOKABORD_LIVE_READONLY=1 required');
const adapter=new BokabordAvailability();const ids=Object.keys(adapter.registry).filter(id=>!process.env.BOKABORD_IDS||process.env.BOKABORD_IDS.split(',').includes(id));let cursor=0;const results=[];
const query={date:process.env.BOKABORD_DATE||'2026-10-22',time:'19:00',party:2};
const output=new URL('../../../outputs/'+(process.env.BOKABORD_REPORT||'bokabord-availability-22-readonly.json'),import.meta.url);
try{await Promise.all(Array.from({length:4},async()=>{while(cursor<ids.length){const id=ids[cursor++],started=Date.now();const result=await adapter.searchVenue({id},query);const row={...result,durationMs:Date.now()-started};results.push(row);console.log(result.restaurant,result.status,result.slots.length,Math.round(row.durationMs/1000)+'s',result.partial?'partial':'');await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),query,mode:'actual_provider_ui_readonly_no_time_clicks_no_holds',results},null,2));}}));}finally{await adapter.close();}
console.log(JSON.stringify({total:results.length,counts:results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})}));
