import test from 'node:test';
import assert from 'node:assert/strict';
import {nightVision,worldDaylight,spawnAvailable,NIGHT_SPECIES,DAY_LENGTH_MS} from '../public/day-night.js';
import {Simulation} from '../public/simulation.js';

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
 let now=0;
 const sim=new Simulation('bulbasaur',{spawnEpoch:234,worldNow:()=>now});
 const nightSpawns=sim.map.spawns.filter(spawn=>spawn.time==='night');
 assert.ok(nightSpawns.length>=10);
 for(const spawn of nightSpawns){
  assert.ok(NIGHT_SPECIES.has(spawn.species));
  assert.ok(sim.map.regions.find(region=>region.id===spawn.zoneId).species.includes(spawn.species));
  assert.equal(spawnAvailable(spawn,now),false);
 }
 const target=nightSpawns[0];
 Object.assign(sim.player,{x:target.x,y:target.y});
 sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===target.uid),false);
 now=DAY_LENGTH_MS/2;
 sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===target.uid),true);
 now=DAY_LENGTH_MS;
 sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===target.uid),false);
});
