import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeOnline} from '../public/realtime-online.js';
import {ABILITIES} from '../public/data.js';
import {Simulation} from '../public/simulation.js';

test('every unlocked move reaches online combat with its intended target or status',async()=>{
 const online=new RealtimeOnline();
 const self={id:online.id,nick:'Atacante',pokemon:'swampert',level:100,x:900,y:560,hp:1000,maxHp:1000,scene:'world'};
 const rival={id:'rival',nick:'Rival',pokemon:'charmander',level:100,x:950,y:560,hp:1000,maxHp:1000,scene:'world'};
 online.state=self;online.players=[rival];online.token=online.id;
 const messages=[];online.send=async(type,data,targetId)=>{messages.push({type,data,targetId});};
 for(const [id,ability] of Object.entries(ABILITIES)){
  if(id==='basic'||ability.catalogOnly)continue;
  messages.length=0;
  const result=await online.skill({ability:id,x:rival.x,y:rival.y});
  assert.equal(result.ok,true,id);
  assert.ok(messages.some(message=>message.type==='combat'&&message.data.ability===id),`${id} must appear to other players`);
  if(['heal','buff','rolling','teleport'].includes(ability.behavior)){
   assert.equal(result.victims.length,0,`${id} must not hit players`);
  }else if(ability.behavior==='debuff'){
   assert.ok(messages.some(message=>message.type==='pvp-status'&&message.data.ability===id&&message.targetId===rival.id),`${id} must apply online status`);
   if(id==='poisonPowder'){
    const receiver=new Simulation('charmander');
    assert.equal(receiver.applyPlayerStatus(ability),true);
    assert.ok(receiver.player.poison?.until>receiver.time);
   }
  }else{
   assert.ok(result.victims.some(victim=>victim.id===rival.id&&victim.damage>0),`${id} must hit nearby rival`);
  }
 }
});

test('contact moves cannot hit a rival behind the attacker',async()=>{
 const online=new RealtimeOnline();
 online.state={id:online.id,nick:'Atacante',pokemon:'swampert',level:100,x:900,y:560,hp:100,maxHp:100,scene:'world'};
 online.players=[{id:'behind',nick:'Atrás',pokemon:'charmander',level:100,x:850,y:560,hp:100,maxHp:100,scene:'world'}];
 online.send=async()=>{};
 for(const [id,ability] of Object.entries(ABILITIES)){
  if(ability.behavior!=='direct'||ability.catalogOnly)continue;
  const result=await online.skill({ability:id,x:960,y:560});
  assert.equal(result.victims.length,0,`${id} must not hit behind the attacker`);
 }
});
