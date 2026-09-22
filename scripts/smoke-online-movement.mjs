import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const url=process.env.SMOKE_URL||'https://pokecria.vercel.app/';
const browser=await chromium.launch({headless:true});
try{
  const [first,second]=await Promise.all([browser.newPage(),browser.newPage()]);
  await Promise.all([first.goto(url),second.goto(url)]);
  const join=(page,nick)=>page.evaluate(async nick=>{
    const {cloud}=await import('/cloud-client.js');
    const {RealtimeOnline}=await import('/realtime-online.js');
    cloud.session={user:{id:nick}};
    window.online=new RealtimeOnline();
    await window.online.join({nick,pokemon:'bulbasaur'});
    return window.online.id;
  },nick);
  const idA=await join(first,'BridgeA'),idB=await join(second,'BridgeB');
  await Promise.all([
    first.waitForFunction(id=>window.online.players.some(p=>p.id===id),idB),
    second.waitForFunction(id=>window.online.players.some(p=>p.id===id),idA)
  ]);
  await second.evaluate(id=>{
    const online=window.online,original=online.receive.bind(online);
    online.receive=message=>{if(message.type==='player-state'&&message.from===id)return;original(message);};
  },idA);
  for(const x of [752,800,848,896,944,992,1040,1088]){
    await first.evaluate(x=>window.online.update({x,y:560,moving:true}),x);
    await first.waitForTimeout(180);
  }
  for(let i=0;i<12;i++){
    await first.evaluate(()=>window.online.update({x:1088,y:560,moving:false}));
    await first.waitForTimeout(180);
  }
  try{await second.waitForFunction(id=>window.online.players.find(p=>p.id===id)?.x===1088,idA,{timeout:15000});}catch(error){console.log(JSON.stringify({first:await first.evaluate(()=>({state:window.online.state,presence:window.online.channel.presenceState(),status:window.online.channel.state})),second:await second.evaluate(id=>({peer:window.online.players.find(p=>p.id===id),presence:window.online.channel.presenceState(),status:window.online.channel.state}),idA)}));throw error;}
  const seen=await second.evaluate(id=>window.online.players.find(p=>p.id===id)?.x,idA);
  assert.equal(seen,1088);
  await Promise.all([first.evaluate(()=>window.online.leave()),second.evaluate(()=>window.online.leave())]);
  console.log('OK: segundo cliente vê a travessia completa da ponte mesmo sem broadcasts de movimento.');
}finally{await browser.close();}
