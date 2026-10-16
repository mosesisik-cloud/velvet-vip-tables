import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkBatch} from './check-booking-batch-candidates.mjs';

const row=(id,name=id,extra={})=>({restaurantId:id,name,city:'Hvar',cityCode:'HVA',status:{implementation:'not_integrated'},...extra});
function fixture(rows=[row('candidate')]) {
 return {candidates:[rows[0].restaurantId],catalogue:{destinations:{HVA:{restaurants:rows.map(r=>({...r,placeId:r.restaurantId}))}}},worklist:{records:structuredClone(rows)},issues:{complete:true,states:'all',items:[]},claims:{complete:true,items:[]},external200:{records:[]}};
}
const codes=report=>report.results[0].reasons.map(r=>r.code);
test('explicit selection/order preserved; no auto-selected records or authority',()=>{
 const x=fixture([row('one'),row('two'),row('three')]);x.candidates=['three','one'];
 const r=checkBatch(x);assert.deepEqual(r.results.map(x=>x.restaurantId),x.candidates);
 assert.equal(r.reviewRequired,false);assert.equal(r.identityVerified,false);assert.equal(r.claimAuthorized,false);
});
test('active claim wins regardless of ready label',()=>{
 const x=fixture();x.issues.items=[{number:5,state:'open',body:'<!-- restaurantId: candidate -->',labels:['booking:ready']}];x.claims.items=['refs/heads/booking-claims/issue-5'];
 assert.deepEqual(codes(checkBatch(x)),['existing_issue','active_claim']);
});
test('closed duplicate issue still excludes candidate',()=>{
 const x=fixture();x.issues.items=[{number:9,state:'CLOSED',body:'<!-- restaurantId: candidate -->'}];
 assert.deepEqual(codes(checkBatch(x)),['existing_issue']);
});
test('external200 excludes exact ID',()=>{
 const x=fixture();x.external200.records=[row('candidate')];assert.ok(codes(checkBatch(x)).includes('external200_reserved'));
});
test('Dalmatino alias detected despite curated name suffix and missing website',()=>{
 const x=fixture([row('curated-HVA-dalmatino-hvar','Dalmatino Hvar'),row('osm-HVA-dalmatino','Dalmatino',{source:'https://dalmatino-hvar.com/',status:{implementation:'native_embed'}})]);
 x.issues.items=[{number:93,state:'closed',body:'<!-- restaurantId: osm-HVA-dalmatino -->'}];x.claims.items=[{ref:'heads/booking-claims/issue-93'}];
 const r=checkBatch(x);assert.ok(codes(r).includes('possible_alias'));assert.ok(codes(r).includes('existing_issue'));assert.ok(codes(r).includes('active_claim'));
});
test('explicit alias and shared domain require review without asserting identity',()=>{
 for(const extra of [{aliasOf:'other'},{source:'https://www.group.example/location-one'}]){
 const x=fixture([row('candidate','A',extra),row('other','B',{source:'https://group.example/location-two'})]);
 x.external200.records=[row('other')];const r=checkBatch(x);
 assert.ok(codes(r).includes('possible_alias'));assert.ok(codes(r).includes('alias_external200_reserved'));assert.equal(r.identityVerified,false);
 }
});
test('explicit alias outside the exported catalogue requires review',()=>{
 const x=fixture([row('candidate','A',{aliasOf:'missing-alias'})]);
 assert.ok(codes(checkBatch(x)).includes('unresolved_alias'));
});
test('missing records, integrated and unknown status fail closed',()=>{
 const x=fixture();x.candidates=['missing'];assert.deepEqual(codes(checkBatch(x)),['missing_catalogue','missing_worklist']);
 for(const status of [{implementation:'external_link'},{}]){const y=fixture();y.worklist.records[0].status=status;assert.ok(codes(checkBatch(y)).includes('already_integrated_or_unknown_status'));}
});
test('orphan/unidentified locks produce global review requirement',()=>{
 const x=fixture();x.claims.items=['refs/heads/booking-claims/issue-60'];const r=checkBatch(x);
 assert.equal(r.reviewRequired,true);assert.equal(r.warnings[0].code,'unresolved_claim');
});
test('incomplete exports and malformed input rejected',()=>{
 for(const mutate of [
 x=>x.issues.complete=false,x=>x.issues.states='open',x=>x.claims.complete=false,
 x=>x.candidates.push('candidate'),x=>x.candidates=[],x=>x.worklist.records.push(x.worklist.records[0]),
 x=>x.claims.items=['refs/heads/main'],x=>x.issues.items=[{number:5,body:'',state:'unknown'}],
 x=>x.issues.items=[{number:5,body:'',state:'open'},{number:5,body:'',state:'closed'}],
 x=>x.claims.items=['heads/booking-claims/issue-5','refs/heads/booking-claims/issue-5']
 ]){const x=fixture();mutate(x);assert.throws(()=>checkBatch(x));}
});
test('CLI is offline, does not mutate inputs, and exposes 0/1/2 exits',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booking-preflight-'));
 try{
 const input=fixture(),before={};const args=[];
 for(const [key,value]of Object.entries(input)) {const file=path.join(dir,key+'.json');before[file]=JSON.stringify(value);fs.writeFileSync(file,before[file]);args.push(`--${key}=${file}`);}
 const script=new URL('./check-booking-batch-candidates.mjs',import.meta.url);
 const run=extra=>spawnSync(process.execPath,[script.pathname,...args,...extra],{encoding:'utf8'});
 let r=run([]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).readOnly,true);
 for(const [file,content]of Object.entries(before))assert.equal(fs.readFileSync(file,'utf8'),content);
 input.external200.records=[row('candidate')];fs.writeFileSync(path.join(dir,'external200.json'),JSON.stringify(input.external200));
 r=run([]);assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).reviewRequired,true);
 r=run(['--apply']);assert.equal(r.status,2);assert.match(r.stderr,/unknown/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
