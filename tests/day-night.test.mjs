import test from 'node:test';
import assert from 'node:assert/strict';
import {nightVision,worldDaylight,spawnAvailable,NIGHT_SPECIES,DAY_LENGTH_MS} from '../public/day-night.js';
import {Simulation} from '../public/simulation.js';
import {eligibleSpawnCandidates} from '../public/spawn-system.js';
import {RegionDefinitions} from '../public/world-definition.js';

test('the shared clock alternates day and night across the cycle',()=>{
 assert.equal(worldDaylight(0).isNight,false);
 assert.equal(worldDaylight(DAY_LENGTH_MS/2).isNight,true);
 assert.equal(worldDaylight(DAY_LENGTH_MS).isNight,false);
 assert.equal(worldDaylight(DAY_LENGTH_MS*3/4).darkness,1);
});
test('night narrows the visible field and interiors ignore outdoor darkness',()=>{
 const day=nightVision({darkness:0},1280,720),night=nightVision({darkness:1},1280,720),inside=nightVision({darkness:1},1280,720,true);
 assert.equal(day.strength,0);assert.equal(night.strength,1);assert.ok(night.innerRadius<day.innerRadius);assert.ok(night.outerRadius<day.outerRadius);assert.equal(inside.strength,0);
});

test('night-only encounters remain in their authored region and leave at dawn',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:234,worldNow:()=>DAY_LENGTH_MS/2}),region=RegionDefinitions.find(entry=>entry.id==='bosque'),point={x:region.x*32,y:region.y*32};
 const candidates=eligibleSpawnCandidates(sim.map,point,DAY_LENGTH_MS/2);
 assert.ok(candidates.length);assert.ok(candidates.every(entry=>NIGHT_SPECIES.has(entry.id)&&region.species.includes(entry.id)));
 for(let i=0;i<20;i++)sim.streamCreatures();
 assert.ok(sim.enemies.filter(enemy=>enemy.dynamicSpawn).every(enemy=>NIGHT_SPECIES.has(enemy.id)));
 sim.worldNow=()=>DAY_LENGTH_MS;sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.dynamicSpawn&&NIGHT_SPECIES.has(enemy.id)),false);
});

test('day and night candidate pools are mutually exclusive',()=>{
 const sim=new Simulation('bulbasaur'),region=RegionDefinitions.find(entry=>entry.id==='bosque'),point={x:region.x*32,y:region.y*32};
 const day=eligibleSpawnCandidates(sim.map,point,0),night=eligibleSpawnCandidates(sim.map,point,DAY_LENGTH_MS/2);
 assert.ok(day.length);assert.ok(night.length);assert.ok(day.every(entry=>spawnAvailable(entry,0)&&!spawnAvailable(entry,DAY_LENGTH_MS/2)));
 assert.ok(night.every(entry=>!spawnAvailable(entry,0)&&spawnAvailable(entry,DAY_LENGTH_MS/2)));
 assert.equal(day.some(entry=>night.some(other=>other.id===entry.id)),false);
});

test('time change removes incompatible shared wilds instead of restoring an immortal snapshot',()=>{
 let now=0;const sim=new Simulation('bulbasaur',{spawnEpoch:234,worldNow:()=>now});
 for(let i=0;i<20;i++)sim.streamCreatures();
 const daytime=sim.enemies.find(enemy=>enemy.dynamicSpawn&&enemy.time==='day');assert.ok(daytime);
 const staleDay=sim.sharedCreatureSnapshot(daytime);sim.applySharedWildState(staleDay);assert.ok(sim.sharedWildStates.has(daytime.uid));
 now=DAY_LENGTH_MS/2;sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===daytime.uid),false);assert.equal(sim.sharedWildStates.has(daytime.uid),false);
 sim.applySharedWildState(staleDay);assert.equal(sim.enemies.some(enemy=>enemy.uid===daytime.uid),false);assert.equal(sim.sharedWildStates.has(daytime.uid),false);
 const nighttime=sim.enemies.find(enemy=>enemy.dynamicSpawn&&enemy.time==='night');assert.ok(nighttime);
 const staleNight=sim.sharedCreatureSnapshot(nighttime),nightUid=nighttime.uid;sim.applySharedWildState(staleNight);now=DAY_LENGTH_MS;sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===nightUid),false);assert.equal(sim.sharedWildStates.has(nightUid),false);
 sim.applySharedWildState(staleNight);assert.equal(sim.enemies.some(enemy=>enemy.uid===nightUid),false);
});
