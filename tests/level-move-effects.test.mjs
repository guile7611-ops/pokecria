import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {ABILITIES,CANONICAL_LEARNSETS} from '../public/data.js';

function encounter(){
 const sim=new Simulation('bulbasaur'),foe=sim.enemies[0];
 Object.assign(foe,{x:sim.player.x+55,y:sim.player.y,hp:900,maxHp:900,attack:60,defense:16,speed:80,state:'Idle',defeated:false,aggro:0,cooldown:50});
 return {sim,foe};
}

test('Growl, Leer and Scary Face change the enemy stats used by combat',()=>{
 const {sim,foe}=encounter(),aim={x:foe.x,y:foe.y};
 assert.ok(sim.cast(ABILITIES.growl,aim));assert.equal(foe.debuffs[0].attackMultiplier,.8);
 assert.ok(sim.cast(ABILITIES.leer,aim));assert.ok(foe.debuffs.some(b=>b.defenseMultiplier===.8));
 const hp=foe.hp;sim.damage(foe,30);assert.equal(hp-foe.hp,Math.round(30-foe.defense*.8));
 assert.ok(sim.cast(ABILITIES.scaryFace,aim));assert.ok(foe.debuffs.some(b=>b.speedMultiplier===.55));
});

test('Hypnosis stops movement, Toxic damages over time, and Leech Seed restores HP',()=>{
 const {sim,foe}=encounter(),aim={x:foe.x,y:foe.y};
 assert.ok(sim.cast(ABILITIES.hypnosis,aim));assert.ok(foe.sleepUntil>sim.time);
 sim.player.hp=sim.player.maxHp-40;
 assert.ok(sim.cast(ABILITIES.toxic,aim));assert.ok(sim.cast(ABILITIES.leechSeed,aim));
 const initialHp=foe.hp;
 for(let i=0;i<25;i++)sim.step(.05);
 assert.ok(foe.hp<initialHp);
 assert.ok(sim.player.hp>sim.player.maxHp-40);
});

test('Poison Powder inflicts poison over time instead of instant damage',()=>{
 const {sim,foe}=encounter(),hp=foe.hp;
 assert.equal(sim.cast(ABILITIES.poisonPowder,{x:foe.x,y:foe.y}),true);
 assert.equal(foe.hp,hp);
 assert.ok(foe.poison?.until>sim.time);
 for(let i=0;i<25;i++)sim.step(.05);
 assert.ok(foe.hp<hp);
});

test('new level moves have individual sheets and are learned only by species that list them',()=>{
 assert.ok(CANONICAL_LEARNSETS.bulbasaur.some(row=>row.ability==='growl'));
 assert.ok(CANONICAL_LEARNSETS.mareep.some(row=>row.ability==='thunderShock'));
 assert.equal(ABILITIES.growl.vfx,'moves/growl');
 assert.notEqual(ABILITIES.leer.vfx,ABILITIES.growl.vfx);
});

test('PvP debuffs affect the player without inventing direct damage',()=>{
 const {sim}=encounter(),p=sim.player,origin={x:p.x,y:p.y};
 assert.ok(sim.applyPlayerStatus(ABILITIES.scaryFace));
 assert.ok(p.buffs.some(b=>b.id==='pvp-scaryFace'&&b.speedMultiplier===.55));
 assert.ok(sim.applyPlayerStatus(ABILITIES.hypnosis));
 assert.equal(sim.command({type:'move',x:p.x+60,y:p.y}),false);
 sim.step(.05);assert.deepEqual({x:p.x,y:p.y},origin);
 sim.time=p.sleepUntil;
 assert.ok(sim.applyPlayerStatus(ABILITIES.toxic));
 const hp=p.hp;
 for(let i=0;i<25;i++)sim.step(.05);
 assert.ok(p.hp<hp);
});

test('Teleport lands on walkable terrain and the previously uncovered species learn moves',()=>{
 const {sim}=encounter(),p=sim.player,start={x:p.x,y:p.y};
 assert.ok(sim.cast(ABILITIES.teleport,{x:p.x+100,y:p.y}));
 assert.ok(p.x>start.x);
 assert.ok(sim.events.filter(event=>event.type==='buff'&&event.vfx===ABILITIES.teleport.vfx).length===2);
 for(const [species,move] of [['abra','teleport'],['metapod','harden'],['kakuna','harden'],['weedle','poisonSting']])assert.ok(CANONICAL_LEARNSETS[species].some(row=>row.ability===move),species);
});
