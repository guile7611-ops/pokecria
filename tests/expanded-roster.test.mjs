import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WILD_POKEMON,CREATURES,EVOLUTIONS} from '../public/data.js';
import {RegionDefinitions,SpawnZoneDefinitions,EvolutionMinimumLevel,SpawnRarityDefinitions} from '../public/world-definition.js';
import {Simulation} from '../public/simulation.js';

const added=['ralts','kirlia','gardevoir','aron','lairon','aggron','carvanha','sharpedo','wailmer','wailord','larvitar','pupitar','tyranitar','numel','camerupt','torkoal','houndour','houndoom','makuhita','hariyama'];

test('expanded roster has complete PMD sprites and appears across several biomes',()=>{
 const ids=new Set(WILD_POKEMON.map(p=>p.id));
 for(const id of added){
  assert.ok(ids.has(id),`${id} is missing from encounters`);
  assert.ok(CREATURES[id],`${id} is missing from playable creatures`);
  for(const file of ['portrait.png','Idle-Anim.png','Walk-Anim.png','Attack-Anim.png','Hurt-Anim.png'])assert.ok(fs.existsSync(new URL(`../public/assets/pokemon/${id}/${file}`,import.meta.url)),`${id}/${file}`);
 }
 const regions=RegionDefinitions.filter(r=>r.species.some(id=>added.includes(id)));
 assert.ok(regions.length>=10);
 assert.ok(new Set(regions.map(r=>r.biome)).size>=8);
});

test('new evolution families follow their canonical level thresholds',()=>{
 for(const [from,to,level] of [['ralts','kirlia',20],['kirlia','gardevoir',30],['aron','lairon',32],['lairon','aggron',42],['carvanha','sharpedo',30],['wailmer','wailord',40],['larvitar','pupitar',30],['pupitar','tyranitar',55],['numel','camerupt',33],['houndour','houndoom',24],['makuhita','hariyama',24]]){
  assert.ok(EVOLUTIONS.some(e=>e.creatureId===from&&e.targetCreatureId===to&&e.requiredLevel===level));
 }
});

test('every original wild Pokémon now has its complete evolution line',()=>{
 const lines=[
  ['caterpie','metapod','butterfree'],['weedle','kakuna','beedrill'],['pidgey','pidgeotto','pidgeot'],['rattata','raticate'],['spearow','fearow'],
  ['zubat','golbat','crobat'],['oddish','gloom','vileplume'],['paras','parasect'],['psyduck','golduck'],['poliwag','poliwhirl','poliwrath'],
  ['abra','kadabra','alakazam'],['machop','machoke','machamp'],['geodude','graveler','golem'],['magnemite','magneton','magnezone'],
  ['gastly','haunter','gengar'],['drowzee','hypno'],['krabby','kingler'],['voltorb','electrode'],['cubone','marowak'],['horsea','seadra','kingdra'],
  ['sentret','furret'],['hoothoot','noctowl'],['spinarak','ariados'],['mareep','flaaffy','ampharos'],['wooper','quagsire'],
  ['murkrow','honchkrow'],['slugma','magcargo'],['poochyena','mightyena'],['lotad','lombre','ludicolo'],['shroomish','breloom'],
 ];
 for(const line of lines)for(let i=0;i<line.length-1;i++)assert.ok(EVOLUTIONS.some(e=>e.creatureId===line[i]&&e.targetCreatureId===line[i+1]),`${line[i]} cannot evolve into ${line[i+1]}`);
 for(const id of ['bellossom','politoed',...lines.flat()])assert.ok(CREATURES[id],`${id} is not playable`);
});

test('item and trade branches stay locked until their mechanics exist',()=>{
 for(const [base,expected] of [['oddish','gloom'],['poliwag','poliwhirl']]){
  const sim=new Simulation(base,{nature:'Calma'});sim.player.nature='Calma';
  sim.gainXP(100000);assert.equal(sim.player.id,expected);
 }
});

test('authored encounter population is broad and rare species keep lower weights',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:123}),other=new Simulation('bulbasaur',{spawnEpoch:124});
 assert.ok(sim.map.spawns.length>=240&&sim.map.spawns.length<400);
 assert.notDeepEqual(sim.map.spawns.map(s=>[s.x,s.y]),other.map.spawns.map(s=>[s.x,s.y]));
 for(const spawn of sim.map.spawns)assert.ok(spawn.level>=(EvolutionMinimumLevel[spawn.species]||1),`${spawn.species} spawned below its evolution level`);
 const weights=['common','uncommon','rare','epic','legendary','mythic'].map(id=>SpawnRarityDefinitions[id].weight);
 assert.ok(weights.every((weight,index)=>!index||weight<weights[index-1]));
 assert.ok(sim.map.spawns.every(s=>Math.hypot(s.x/32-7.5,s.y/32-17.5)>=18));
});

test('only common and uncommon tiers receive protected regional slots',()=>{
 for(let epoch=120;epoch<126;epoch++){
  const sim=new Simulation('bulbasaur',{spawnEpoch:epoch});
  for(const zone of SpawnZoneDefinitions){
   const protectedSpawns=sim.map.spawns.filter(spawn=>spawn.zoneId===zone.id&&spawn.protectedTier);
   assert.ok(protectedSpawns.length<=2);
   assert.ok(protectedSpawns.every(spawn=>['common','uncommon'].includes(WILD_POKEMON.find(p=>p.id===spawn.species).rarity)));
  }
 }
 assert.equal(WILD_POKEMON.find(p=>p.id==='ralts').rarity,'rare');
 assert.equal(WILD_POKEMON.find(p=>p.id==='larvitar').rarity,'rare');
});
