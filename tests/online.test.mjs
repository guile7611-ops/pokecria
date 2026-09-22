import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { server } from '../server.mjs';

test('online presence, village safety, guild invitation and allied PvP lock', async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=async (path,data={},token)=>{
    const response=await fetch(`${base}/api/online/${path}`,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-verdant-session':token}:{})},body:JSON.stringify(data)});
    return {status:response.status,...await response.json()};
  };
  try{
    const a=await post('join',{nick:'Lua',pokemon:'bulbasaur'}),b=await post('join',{nick:'Sol',pokemon:'charmander'});
    assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.id,b.id);
    assert.equal((await post('pvp',{targetId:b.id},a.token)).status,403);
    for(const [p,x] of [[a,900],[b,930]])assert.equal((await post('state',{x,y:560,hp:100,maxHp:100,scene:'world'},p.token)).status,200);
    assert.equal((await post('pvp',{targetId:b.id},a.token)).status,200);
    const skill=await post('skill',{ability:'leaf',x:930,y:560},a.token);
    assert.equal(skill.status,200);assert.equal(skill.victims.length,1);assert.equal(skill.victims[0].id,b.id);assert.ok(skill.victims[0].damage>0);
    assert.equal((await post('guild/invite',{targetId:b.id},a.token)).status,200);
    const accepted=await post('guild/reply',{accept:true},b.token);assert.equal(accepted.accepted,true);
    assert.equal((await post('pvp',{targetId:b.id},a.token)).status,403);
    const abort=new AbortController();
    const stream=await fetch(`${base}/api/online/events?token=${b.token}`,{signal:abort.signal});
    assert.equal(stream.status,200);
    assert.equal((await post('wild-hit',{uid:424242,damage:5},b.token)).status,200);
    assert.equal((await post('wild-hit',{uid:424242,damage:8},a.token)).status,200);
    assert.equal((await post('wild-kill',{uid:424242,xp:80},a.token)).status,200);
    const reader=stream.body.getReader();let events='';
    for(let i=0;i<8&&!events.includes('event: guild-xp');i++)events+=new TextDecoder().decode((await reader.read()).value||new Uint8Array());
    assert.match(events,/event: guild-xp\ndata: .*"xp":40/);
    abort.abort();
    assert.equal((await post('leave',{},a.token)).status,200);
    assert.equal((await post('leave',{},b.token)).status,200);
  }finally{server.close();await once(server,'close');}
});

test('future catalog moves are locked and Flame Wheel hits by moving contact online',async()=>{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data={},token)=>{const response=await fetch(`${base}/api/online/${path}`,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-verdant-session':token}:{})},body:JSON.stringify(data)});return {status:response.status,...await response.json()};};
 try{
  const a=await post('join',{nick:'Roda',pokemon:'cyndaquil'}),b=await post('join',{nick:'Alvo',pokemon:'bulbasaur'});
  assert.equal((await post('skill',{ability:'thunderbolt',x:900,y:560},a.token)).status,403);
  await post('state',{x:900,y:560,hp:100,maxHp:100,scene:'world'},a.token);
  await post('state',{x:980,y:560,hp:100,maxHp:100,scene:'world'},b.token);
  const cast=await post('skill',{ability:'flameWheel',x:980,y:560},a.token);assert.equal(cast.status,200);assert.equal(cast.victims.length,0);
  const contact=await post('state',{x:959,y:560,hp:100,maxHp:100,scene:'world'},a.token);
  assert.equal(contact.rollingVictims.length,1);assert.equal(contact.rollingVictims[0].id,b.id);assert.ok(contact.rollingVictims[0].hp<100);
  const repeated=await post('state',{x:959,y:560,hp:100,maxHp:100,scene:'world'},a.token);assert.equal(repeated.rollingVictims.length,0);
  assert.equal((await post('leave',{},a.token)).status,200);assert.equal((await post('leave',{},b.token)).status,200);
 }finally{server.close();await once(server,'close');}
});

test('online cone and delayed beam apply their damage on the proper schedule',async()=>{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data={},token)=>{const response=await fetch(`${base}/api/online/${path}`,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-verdant-session':token}:{})},body:JSON.stringify(data)});return {status:response.status,...await response.json()};};
 try{
  const fire=await post('join',{nick:'Chama',pokemon:'charmander'}),grass=await post('join',{nick:'Sol',pokemon:'bulbasaur'}),target=await post('join',{nick:'Alvo',pokemon:'squirtle'});
  for(const [p,x] of [[fire,900],[grass,800],[target,970]])await post('state',{x,y:560,hp:1000,maxHp:1000,level:25,scene:'world'},p.token);
  const cone=await post('skill',{ability:'flamethrower',x:970,y:560},fire.token);assert.equal(cone.status,200);assert.ok(cone.victims.some(v=>v.id===target.id));
  const initial=(await post('state',{x:970,y:560,scene:'world'},target.token)).hp;
  await new Promise(resolve=>setTimeout(resolve,550));
  const later=(await post('state',{x:970,y:560,scene:'world'},target.token)).hp;assert.ok(later<initial);
  await new Promise(resolve=>setTimeout(resolve,950));
  const beam=await post('skill',{ability:'solarBeam',x:970,y:560},grass.token);assert.equal(beam.status,200);assert.equal(beam.victims.length,0);
  const before=(await post('state',{x:970,y:560,scene:'world'},target.token)).hp;
  await new Promise(resolve=>setTimeout(resolve,850));
  const after=(await post('state',{x:970,y:560,scene:'world'},target.token)).hp;assert.ok(after<before,`beam before=${before} after=${after}`);
  for(const p of [fire,grass,target])assert.equal((await post('leave',{},p.token)).status,200);
 }finally{server.close();await once(server,'close');}
});

test('online Ice Fang and Crunch hit rival players at melee range',async()=>{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data={},token)=>{const response=await fetch(`${base}/api/online/${path}`,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-verdant-session':token}:{})},body:JSON.stringify(data)});return {status:response.status,...await response.json()};};
 try{
  const attacker=await post('join',{nick:'Totodile',pokemon:'totodile'}),target=await post('join',{nick:'Rival',pokemon:'charmander'});
  await post('state',{x:900,y:560,hp:1000,maxHp:1000,level:25,scene:'world'},attacker.token);
  await post('state',{x:965,y:560,hp:1000,maxHp:1000,level:25,scene:'world'},target.token);
  for(const ability of ['iceFang','crunch']){const result=await post('skill',{ability,x:965,y:560},attacker.token);assert.equal(result.status,200);assert.ok(result.victims.some(v=>v.id===target.id&&v.damage>0),ability);}
  assert.ok((await post('state',{x:965,y:560,scene:'world'},target.token)).hp<1000);
  await post('leave',{},attacker.token);await post('leave',{},target.token);
 }finally{server.close();await once(server,'close');}
});

test('boss health and death are shared by every player in the room',async()=>{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data={},token)=>{const response=await fetch(`${base}/api/online/${path}`,{method:'POST',headers:{'content-type':'application/json',...(token?{'x-verdant-session':token}:{})},body:JSON.stringify(data)});return {status:response.status,...await response.json()};};
 try{
  const a=await post('join',{nick:'BossA',pokemon:'bulbasaur'}),b=await post('join',{nick:'BossB',pokemon:'charmander'});
  const first=await post('wild-hit',{uid:1000,damage:120,isBoss:true,maxHp:420,respawn:45},a.token);
  assert.equal(first.boss.hp,300);
  const second=await post('wild-hit',{uid:1000,damage:80,isBoss:true,maxHp:420,respawn:45},b.token);
  assert.equal(second.boss.hp,220);
  const observed=await post('wild-hit',{uid:1000,damage:0,isBoss:true,maxHp:420,respawn:45},a.token);
  assert.equal(observed.boss.hp,220);
  const defeated=await post('wild-hit',{uid:1000,damage:500,isBoss:true,maxHp:420,respawn:45},b.token);
  assert.equal(defeated.boss.hp,0);assert.ok(defeated.boss.respawnAt>Date.now());
  await post('leave',{},a.token);await post('leave',{},b.token);
 }finally{server.close();await once(server,'close');}
});
