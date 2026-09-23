import test from 'node:test';
import assert from 'node:assert/strict';
import {freePosition,levelRangeAt} from '../public/world-navigation.js';
import {Simulation} from '../public/simulation.js';
import {encounterStats} from '../public/encounters.js';
import {enemySkillCount,enemySkillSet} from '../public/enemy-skills.js';
import {WILD_POKEMON} from '../public/data.js';
import {DEFAULT_SPAWN_CONFIG,findDynamicSpawn} from '../public/spawn-system.js';

const volcanicProposals=sim=>{const player=freePosition(sim.map,{x:387*32,y:205*32}),config={...DEFAULT_SPAWN_CONFIG,radius:1200,minPlayerDistance:64,entitySpacing:0};return Array.from({length:240},(_,index)=>findDynamicSpawn({map:sim.map,player,enemies:[],recent:[],spawnEpoch:sim.spawnEpoch,serial:index+1,now:0,config})).filter(spawn=>spawn?.zoneId==='vulcao');};

test('volcanic wild levels vary within their walking-distance band and respect evolution minima',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:777});
 const spawns=volcanicProposals(sim);assert.ok(spawns.length>10);
 const levels=spawns.map(s=>encounterStats(WILD_POKEMON.find(p=>p.id===s.species),sim.map,s,s.uid).level);
 assert.ok(new Set(levels).size>=3);
 for(let i=0;i<spawns.length;i++){const [low,high]=levelRangeAt(sim.map,spawns[i]);assert.ok(levels[i]>=low&&levels[i]<=Math.max(high,spawns[i].minLevel));}
 for(const spawn of spawns.filter(s=>s.minLevel>1)){const level=encounterStats(WILD_POKEMON.find(p=>p.id===spawn.species),sim.map,spawn,spawn.uid).level;assert.ok(level>=spawn.minLevel);}
});
test('respawn rerolls level and stronger wild Pokémon pay more XP and coins',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:777}),spawn=volcanicProposals(sim)[0],species=WILD_POKEMON.find(p=>p.id===spawn.species);
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
test('attribute investment spends one level point without changing EVs and persists on the active Pokémon',()=>{
 const sim=new Simulation('mudkip');sim.gainXP(1000);const before={...sim.player.evs},attack=sim.player.attack,spAttack=sim.player.spAttack;
 assert.ok(sim.player.attributePoints>0);assert.equal(sim.investAttribute('power'),true);assert.equal(sim.player.attack,attack+1);assert.equal(sim.player.spAttack,spAttack+1);assert.deepEqual(sim.player.evs,before);
 const restored=new Simulation(sim.player.id,{activePokemon:sim.activeSnapshot()});assert.equal(restored.player.attributes.power,1);assert.equal(restored.player.attributePoints,sim.player.attributePoints);
});
