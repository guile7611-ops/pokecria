import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeOnline} from '../public/realtime-online.js';

test('presence retains remote players through a brief gap and keeps their current guild',()=>{
 const online=new RealtimeOnline();
 const remote={id:'friend',nick:'Amigo',guildId:null,scene:'world',spawnEpoch:0,seenAt:Date.now(),x:100,y:100};
 online.remoteStates.set(remote.id,remote);
 online.channel={presenceState:()=>({a:[{id:'friend',nick:'Amigo',guildId:'team',scene:'world',spawnEpoch:0,x:90,y:90}]})};
 online.roster();
 assert.equal(online.players.find(player=>player.id==='friend')?.guildId,'team');
 online.channel.presenceState=()=>({});
 online.roster();
 assert.equal(online.players.find(player=>player.id==='friend')?.x,100);
});

test('newer presence position replaces stale broadcasts across the bridge',()=>{
 const online=new RealtimeOnline(),id='friend';
 online.remoteStates.set(id,{id,nick:'Amigo',x:752,y:560,scene:'world',seq:5,seenAt:Date.now()});
 let presence={a:[{id,nick:'Amigo',x:1088,y:560,scene:'world',seq:12,spawnEpoch:0}]};
 online.channel={presenceState:()=>presence};
 online.roster();
 assert.equal(online.players.find(player=>player.id===id)?.x,1088);
 online.receive({type:'player-state',from:id,state:{id,x:800,y:560,scene:'world',seq:7}});
 assert.equal(online.players.find(player=>player.id===id)?.x,1088);
 presence={a:[{id,nick:'Amigo',x:900,y:560,scene:'world',seq:9,spawnEpoch:0}]};
 online.roster();
 assert.equal(online.players.find(player=>player.id===id)?.x,1088);
});

test('a stale peer causes the realtime channel to be rebuilt',async()=>{
 const online=new RealtimeOnline(),old={state:'joined'};
 online.token=online.id;online.channel=old;online.players=[{id:'friend'}];
 online.remoteStates.set('friend',{id:'friend',seenAt:Date.now()-6000});
 const calls=[];
 online.client={removeChannel:async channel=>{calls.push(channel);}};
 online.openChannel=async()=>{online.channel={state:'joined'};calls.push('opened');};
 online.track=async()=>{calls.push('tracked');};
 online.roster=()=>{};online.send=async()=>{};
 online.watchdog();await online.reconnecting;
 assert.deepEqual(calls,[old,'opened','tracked']);
 assert.equal(online.channel.state,'joined');
});

test('fresh peer updates do not rebuild a healthy channel',()=>{
 const online=new RealtimeOnline();
 online.token=online.id;online.channel={state:'joined'};online.players=[{id:'friend'}];
 online.remoteStates.set('friend',{id:'friend',seenAt:Date.now()});
 online.watchdog();
 assert.equal(online.reconnecting,null);
});
