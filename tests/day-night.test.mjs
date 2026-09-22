import test from 'node:test';
import assert from 'node:assert/strict';
import {worldDaylight,spawnAvailable,NIGHT_SPECIES,DAY_LENGTH_MS} from '../public/day-night.js';
import {Simulation} from '../public/simulation.js';

test('the shared clock alternates day and night across the cycle',()=>{
 assert.equal(worldDaylight(0).isNight,false);
 assert.equal(worldDaylight(DAY_LENGTH_MS/2).isNight,true);
 assert.equal(worldDaylight(DAY_LENGTH_MS).isNight,false);
 assert.equal(worldDaylight(DAY_LENGTH_MS*3/4).darkness,1);
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
