import assert from 'node:assert/strict';
import {once} from 'node:events';
import {chromium} from '@playwright/test';
import {server} from '../server.mjs';

server.listen(0,'127.0.0.1');
await once(server,'listening');
const browser=await chromium.launch({headless:true});
try{
  const url=`http://127.0.0.1:${server.address().port}/`;
  const first=await browser.newPage(),second=await browser.newPage();
  await Promise.all([first.goto(url),second.goto(url)]);
  const join=(page,nick,spawnEpoch)=>page.evaluate(async({nick,spawnEpoch})=>{
    const {cloud}=await import('/cloud-client.js');
    const {RealtimeOnline}=await import('/realtime-online.js');
    cloud.session={user:{id:nick}};
    window.smokeEvents=[];
    window.smokeOnline=new RealtimeOnline({world:({spawnEpoch})=>{window.smokeEpoch=spawnEpoch;},'pvp-hit':event=>window.smokeEvents.push(event),'boss-state':event=>window.smokeEvents.push(event)});
    await window.smokeOnline.join({nick,pokemon:'bulbasaur',spawnEpoch});
    return window.smokeOnline.id;
  },{nick,spawnEpoch});
  const firstId=await join(first,'SmokeA',123);
  const secondId=await join(second,'SmokeB',124);
  await Promise.all([first.waitForFunction(()=>window.smokeOnline.players.length===2,{timeout:12000}),second.waitForFunction(()=>window.smokeOnline.players.length===2,{timeout:12000})]);
  const a=await first.evaluate(()=>({players:window.smokeOnline.players.map(p=>p.id),epoch:window.smokeOnline.state.spawnEpoch}));
  const b=await second.evaluate(()=>({players:window.smokeOnline.players.map(p=>p.id),epoch:window.smokeOnline.state.spawnEpoch}));
  assert.ok(a.players.includes(secondId)&&b.players.includes(firstId));
  assert.equal(a.epoch,123);assert.equal(b.epoch,123);
  await first.evaluate(async()=>{window.smokeOnline.update({x:900,y:560,hp:100,maxHp:100});await window.smokeOnline.track(true);});
  await second.evaluate(async()=>{window.smokeOnline.update({x:960,y:560,hp:100,maxHp:100});await window.smokeOnline.track(true);});
  await Promise.all([first.waitForFunction(id=>window.smokeOnline.players.find(p=>p.id===id)?.x===960,secondId),second.waitForFunction(id=>window.smokeOnline.players.find(p=>p.id===id)?.x===900,firstId)]);
  await first.evaluate(id=>window.smokeOnline.request('pvp',{targetId:id}),secondId);
  await second.waitForFunction(()=>window.smokeEvents.some(event=>event.type==='pvp-hit'));
  assert.ok(await second.evaluate(()=>window.smokeOnline.state.hp<100));
  await first.evaluate(()=>window.smokeOnline.request('wild-hit',{uid:1000,damage:30,isBoss:true,hp:390,maxHp:420,respawn:45}));
  await second.waitForFunction(()=>window.smokeEvents.some(event=>event.uid===1000&&event.hp===390));
  await first.evaluate(id=>window.smokeOnline.request('guild/invite',{targetId:id}),secondId);
  await second.waitForFunction(()=>window.smokeOnline.pendingInvite?.fromNick==='SmokeA');
  await second.evaluate(()=>window.smokeOnline.request('guild/reply',{accept:true}));
  await first.waitForFunction(()=>!!window.smokeOnline.guildId);
  await first.waitForFunction(id=>window.smokeOnline.players.find(player=>player.id===id)?.guildId===window.smokeOnline.guildId,secondId);
  assert.equal(await first.evaluate(()=>window.smokeOnline.guildId),await second.evaluate(()=>window.smokeOnline.guildId));
  await assert.rejects(first.evaluate(id=>window.smokeOnline.request('pvp',{targetId:id}),secondId),/Membros da guilda/);
  await Promise.all([first.evaluate(()=>window.smokeOnline.leave()),second.evaluate(()=>window.smokeOnline.leave())]);
  console.log('Realtime: duas sessões compartilham presença, mapa, PvP, guilda e vida do boss.');
}finally{await browser.close();server.close();await once(server,'close');}
