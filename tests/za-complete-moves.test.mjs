import test from 'node:test';
import assert from 'node:assert/strict';
import {ABILITIES,CANONICAL_LEARNSETS} from '../public/data.js';
import {LEGENDS_ZA_MOVE_METADATA} from '../public/legends-za-data.js';
import {Simulation} from '../public/simulation.js';

const step=(sim,seconds)=>{for(let elapsed=0;elapsed<seconds;elapsed+=.025)sim.step(.025);};
const combat=()=>{const sim=new Simulation('bulbasaur'),p=sim.player,e=sim.enemies[0];Object.assign(e,{x:p.x+45,y:p.y,home:{x:p.x+45,y:p.y},hp:1000,maxHp:1000,defense:0,spDefense:1,state:'Idle',defeated:false,aggro:0,path:[]});sim.updateEnemy=()=>{};return {sim,p,e};};

test('all 160 Legends Z-A level moves map to a functional ability',()=>{
 const mapped=new Map(Object.values(CANONICAL_LEARNSETS).flat().filter(row=>row.ability).map(row=>[row.move,row.ability]));
 assert.equal(Object.keys(LEGENDS_ZA_MOVE_METADATA).length,160);
 for(const move of Object.keys(LEGENDS_ZA_MOVE_METADATA)){assert.ok(mapped.has(move),move);const ability=ABILITIES[mapped.get(move)];assert.ok(ability&&!ability.catalogOnly,move);assert.equal(ability.officialSource,'legends-za');}
});

test('False Swipe is nonlethal and Leech Life heals from melee damage',()=>{
 const {sim,p,e}=combat();e.hp=4;assert.ok(sim.cast(ABILITIES.falseSwipe,{...e,targetId:e.uid}));assert.equal(e.hp,1);p.hp=Math.max(1,p.maxHp-30);e.hp=100;sim.time+=10;const before=p.hp;assert.ok(sim.cast(ABILITIES.leechLife,{...e,targetId:e.uid}));assert.ok(p.hp>before);
});

test('Future Sight waits before impact and field traps apply their status',()=>{
 const {sim,e}=combat();const hp=e.hp;assert.ok(sim.cast(ABILITIES.futureSight,{x:e.x,y:e.y}));step(sim,1);assert.equal(e.hp,hp);step(sim,.8);assert.ok(e.hp<hp);
 e.hp=1000;e.state='Idle';sim.time+=20;assert.ok(sim.cast(ABILITIES.toxicSpikes,{x:e.x,y:e.y}));step(sim,.8);assert.ok(e.poison);
});

test('Haze clears harmful conditions from the player',()=>{
 const {sim,p}=combat();p.poison={until:99,nextTick:1};p.burn={until:99,nextTick:1};p.hp--;
 assert.ok(sim.cast(ABILITIES.haze,{x:p.x,y:p.y}));assert.equal(p.poison,null);assert.equal(p.burn,null);
});
