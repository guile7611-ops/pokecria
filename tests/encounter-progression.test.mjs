import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {encounterStats} from '../public/encounters.js';
import {enemySkillCount,enemySkillSet} from '../public/enemy-skills.js';
import {WILD_POKEMON} from '../public/data.js';

test('volcanic wild levels vary broadly while evolved species remain level 40–80',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:777});
 const spawns=sim.map.spawns.filter(s=>s.zoneId==='vulcao');
 const levels=spawns.map(s=>encounterStats(WILD_POKEMON.find(p=>p.id===s.species),sim.map,s,s.uid).level);
 assert.ok(new Set(levels).size>=8);
 assert.ok(levels.every(level=>level>=40&&level<=80));
 for(const spawn of spawns.filter(s=>s.minLevel>1)){const level=encounterStats(WILD_POKEMON.find(p=>p.id===spawn.species),sim.map,spawn,spawn.uid).level;assert.ok(level>=40&&level<=80);}
});
test('respawn rerolls level and stronger wild Pokémon pay more XP and coins',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:777}),spawn=sim.map.spawns.find(s=>s.zoneId==='vulcao'),species=WILD_POKEMON.find(p=>p.id===spawn.species);
 const outcomes=Array.from({length:12},(_,respawn)=>encounterStats(species,sim.map,spawn,spawn.uid,{respawn}));
 assert.ok(new Set(outcomes.map(x=>x.level)).size>3);
 const ordered=[...outcomes].sort((a,b)=>a.level-b.level);assert.ok(ordered.at(-1).hp>ordered[0].hp);assert.ok(ordered.at(-1).xp>ordered[0].xp);assert.ok(ordered.at(-1).money>ordered[0].money);
});
test('wild skills unlock every 20 levels up to four and bosses have different repertoires',()=>{
 assert.deepEqual([1,19,20,39,40,59,60,79,80,100].map(enemySkillCount),[0,0,1,1,2,2,3,3,4,4]);
 assert.deepEqual(enemySkillSet('Fogo / Voador',80).map(s=>s.name),['Chama Rápida','Onda de Calor','Brasa Curativa','Inferno']);
 const sim=new Simulation();assert.notDeepEqual(sim.boss.attacks.map(a=>a.id),sim.enemies.find(e=>e.id==='charizard').attacks.map(a=>a.id));
});
test('an evolved active Pokémon survives reconstruction with an old starter id',()=>{
 const first=new Simulation('mudkip'),snapshot={...first.activeSnapshot(),id:'marshtomp',name:'Marshtomp',level:28,xp:1891,captureId:'starter-mudkip'};
 const restored=new Simulation('mudkip',{activePokemon:snapshot,pc:[snapshot]});
 assert.equal(restored.player.id,'marshtomp');assert.equal(restored.player.level,28);assert.equal(restored.player.xp,1891);
});
