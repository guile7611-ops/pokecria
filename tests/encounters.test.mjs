import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {encounterStats,cleanInventory} from '../public/encounters.js';
import {saveWorld,loadWorldSave} from '../public/world-runtime.js';
import {WILD_POKEMON} from '../public/data.js';
import {walkable} from '../public/world.js';
import {pokeballCaptureChance} from '../public/pokeballs.js';
test('distance and rarity raise stats, XP and coins deterministically',()=>{
 const sim=new Simulation(),s=WILD_POKEMON[0],near=encounterStats(s,sim.map,{x:460,y:545},6),far=encounterStats(s,sim.map,{x:11000,y:6000},6);
 assert.ok(far.level>near.level);for(const key of ['hp','attack','defense','xp','money'])assert.ok(far[key]>near[key],key);
 const rolls=Array.from({length:1000},(_,uid)=>encounterStats(s,sim.map,{x:460,y:545},uid));const rare=rolls.find(e=>e.rarity==='rare'),common=rolls.find(e=>e.rarity==='common'&&e.level===rare.level);assert.ok(rare.hp>common.hp);assert.ok(rare.xp>common.xp);
 assert.deepEqual(encounterStats(s,sim.map,{x:460,y:545},6),near);
});
test('bosses are higher level than their six guards, outside spawn, on accessible terrain',()=>{
 const sim=new Simulation();assert.ok(Math.hypot(sim.boss.x-240,sim.boss.y-560)>1500);
 for(const boss of sim.enemies.filter(e=>e.isBoss)){const guards=sim.enemies.filter(e=>e.bossUid===boss.uid);assert.equal(guards.length,6);assert.ok(guards.every(e=>e.level<boss.level&&e.maxHp<boss.maxHp&&Math.hypot(e.x-boss.x,e.y-boss.y)<500));for(const e of [boss,...guards])assert.ok(walkable(sim.map,e.x,e.y,e.radius));}
});
test('Poké Balls persist through the dedicated inventory save across reloads',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},sim=new Simulation();
 sim.inventory.money=500;assert.equal(sim.buyPokeballs(3),true);assert.equal(sim.inventory.items['Poké Bola'],3);assert.equal(saveWorld(storage,sim),true);
 const restored=new Simulation('bulbasaur',loadWorldSave(storage));assert.equal(restored.inventory.items['Poké Bola'],3);assert.equal(restored.inventory.money,200);
});
test('ball tiers change capture chance, persist, and Master Ball cannot be purchased',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},sim=new Simulation();
 sim.inventory.money=10000;
 assert.equal(sim.buyPokeballs(2,'great'),true);
 assert.equal(sim.buyPokeballs(1,'ultra'),true);
 assert.equal(sim.buyPokeballs(1,'master'),false);
 assert.equal(sim.inventory.items['Master Bola'],undefined);
 assert.ok(pokeballCaptureChance(.3,8,'ultra')>pokeballCaptureChance(.3,8,'great'));
 assert.equal(pokeballCaptureChance(.01,99,'master'),1);
 assert.equal(sim.configureCapture('caterpie',true,'ultra'),true);
 saveWorld(storage,sim);
 const restored=new Simulation('bulbasaur',loadWorldSave(storage));
 assert.equal(restored.inventory.items['Super Bola'],2);
 assert.equal(restored.inventory.items['Ultra Bola'],1);
 assert.equal(restored.capturePlan.ballId,'ultra');
});
test('ordinary victories pay coins but item drops are occasional',()=>{
 const sim=new Simulation(),targets=sim.enemies.filter(e=>!e.isBoss).slice(0,6);
 for(const enemy of targets)sim.damage(enemy,999999);
 const drops=sim.events.filter(event=>event.type==='drop');
 assert.ok(drops.length<targets.length);
 assert.ok(sim.inventory.money>0);
 assert.equal(Object.values(sim.inventory.items).reduce((sum,count)=>sum+count,0),drops.reduce((sum,event)=>sum+(targets.find(target=>target.drop===event.item)?.dropCount||1),0));
});
test('loot stacks once per defeat and survives save, death and room transitions',()=>{
 const sim=new Simulation(),e=sim.enemies[0];sim.damage(e,99999);const money=sim.inventory.money,count=sim.inventory.items[e.drop];assert.equal(money,e.money);assert.equal(count,e.dropCount);sim.damage(e,99999);assert.equal(sim.inventory.money,money);
 const copy=new Simulation('bulbasaur',{inventory:JSON.parse(JSON.stringify(sim.inventory))});assert.deepEqual(copy.inventory,sim.inventory);assert.notEqual(copy.inventory.items,sim.inventory.items);
 const door=sim.map.interactions.find(i=>i.kind==='house');sim.interact(door);sim.exitInterior();assert.equal(sim.inventory.money,money);
 assert.deepEqual(cleanInventory({money:-1,items:{bad:-10}}),{money:0,items:{}});
});

