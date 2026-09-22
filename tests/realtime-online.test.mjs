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
