import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {XP_CURVE,ABILITIES} from '../public/data.js';
const levelTo=(sim,level)=>{while(sim.player.level<level)sim.gainXP(XP_CURVE[sim.player.level]);};
test('Mudkip learns a persistent water vortex and can reorganize learned moves',()=>{
 const sim=new Simulation('mudkip');levelTo(sim,10);
 assert.equal(sim.player.slots[2],'whirlpool');assert.equal(ABILITIES.whirlpool.type,'Water');assert.equal(ABILITIES.whirlpool.behavior,'zone');
 assert.ok(sim.player.knownMoves.includes('mudSlap'));assert.ok(sim.player.knownMoves.includes('protect'));
 const enemy=sim.enemies[0];Object.assign(enemy,{x:sim.player.x+20,y:sim.player.y,hp:100,maxHp:100,state:'Idle'});const hp=enemy.hp;
 assert.ok(sim.command({type:'cast',slot:2,x:enemy.x,y:enemy.y}));sim.step(.05);assert.ok(enemy.hp<hp);
 assert.ok(sim.equipMove('mudSlap',0));assert.equal(sim.player.slots[0],'mudSlap');assert.equal(sim.equipMove('not-a-move',1),false);
});
test('buff moves apply timed combat modifiers',()=>{
 const sim=new Simulation('charmander');levelTo(sim,5);const row=sim.player.knownMoves.indexOf('smokescreen');assert.ok(row>=0);assert.ok(sim.equipMove('smokescreen',1));
 sim.player.hp=sim.player.maxHp;assert.ok(sim.command({type:'cast',slot:1,x:sim.player.x,y:sim.player.y}));assert.equal(sim.player.buffs[0].defenseBonus,5);sim.step(.05);assert.ok(sim.player.buffs[0].remaining<7);
});
