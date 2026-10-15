const test = require('node:test');
const assert = require('node:assert/strict');
const claim = require('./claim-booking.cjs');
function setup(permission='write', failLabels=false) {
  let lock; let seq=0; const commits=new Map(); const comments=[];
  const github={rest:{
    repos:{getCollaboratorPermissionLevel:async()=>({data:{permission}})},
    issues:{createComment:async x=>comments.push(x.body),addLabels:async()=>{if(failLabels)throw Error('label failure');},removeLabel:async()=>{},addAssignees:async()=>{}},
    git:{
      getRef:async({ref})=>{if(ref==='heads/main')return {data:{object:{sha:'base'}}};if(!lock)throw Object.assign(Error(),{status:404});return {data:{object:{sha:lock}}};},
      getCommit:async({commit_sha})=>({data:commit_sha==='base'?{tree:{sha:'tree'}}:commits.get(commit_sha)}),
      createCommit:async x=>{const sha=`commit${++seq}`;commits.set(sha,x);return {data:{sha}};},
      createRef:async({sha})=>{if(lock)throw Object.assign(Error(),{status:422});lock=sha;}
    }
  }};
  const run=agent=>claim({github,core:{warning:()=>{}},context:{repo:{owner:'o',repo:'r'},payload:{repository:{default_branch:'main'},issue:{number:10,state:'open',labels:[{name:'booking-task'},{name:'booking:ready'}]},comment:{body:`/claim ${agent}`,id:agent,user:{login:'shared-account'}}}}});
  return {run,comments,getLock:()=>lock};
}
test('two agents sharing an account cannot both acquire the claim',async()=>{
  const s=setup();await Promise.all([s.run('claude-1'),s.run('gemini-1')]);
  assert.equal(s.comments.filter(x=>x.startsWith('CLAIM CONFIRMED')).length,1);
  assert.ok(s.getLock());
  await s.run('third-agent');assert.equal(s.comments.filter(x=>x.startsWith('CLAIM CONFIRMED')).length,1);
});
test('read-only users cannot claim',async()=>{const s=setup('read');await s.run('agent');assert.equal(s.getLock(),undefined);});
test('metadata failure retains the authoritative lock',async()=>{const s=setup('write',true);await s.run('first');await s.run('second');assert.equal(s.comments.filter(x=>x.startsWith('CLAIM CONFIRMED')).length,1);});
