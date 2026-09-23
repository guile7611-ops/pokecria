import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Simulation} from '../public/simulation.js';
import {WILD_POKEMON} from '../public/data.js';
import {createInterior} from '../public/collisions.js';
import {walkable} from '../public/world.js';
import {freePosition} from '../public/world-navigation.js';
import {LAYER_SYSTEMS} from '../public/world-habitats.js';
import {DEFAULT_SPAWN_CONFIG,eligibleSpawnCandidates,findDynamicSpawn,spawnRandom,weightedSpawnChoice} from '../public/spawn-system.js';
import {DAY_LENGTH_MS,NIGHT_SPECIES} from '../public/day-night.js';
import {CITY_SAFE_ZONES} from '../public/safe-zones.js';

const fill=sim=>{for(let i=0;i<24;i++)sim.streamCreatures();return sim.enemies.filter(enemy=>enemy.dynamicSpawn);};

test('runtime vacancies fill gradually to 30 unique collision-free positions around the player',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:41,worldNow:()=>0});assert.equal(sim.enemies.filter(enemy=>enemy.dynamicSpawn).length,2);
 sim.streamCreatures();assert.equal(sim.enemies.filter(enemy=>enemy.dynamicSpawn).length,4);
 const wild=fill(sim);assert.equal(wild.length,DEFAULT_SPAWN_CONFIG.targetPopulation);
 assert.equal(new Set(wild.map(enemy=>`${enemy.x},${enemy.y}`)).size,wild.length);
 for(const enemy of wild){const distance=Math.hypot(enemy.x-sim.player.x,enemy.y-sim.player.y);assert.ok(distance>=sim.spawnConfig.minPlayerDistance&&distance<=sim.spawnConfig.radius);assert.ok(walkable(sim.map,enemy.x,enemy.y,enemy.radius));assert.ok(!sim.inSafeCity(enemy));}
 for(let i=0;i<wild.length;i++)for(let j=i+1;j<wild.length;j++)assert.ok(Math.hypot(wild[i].x-wild[j].x,wild[i].y-wild[j].y)>=sim.spawnConfig.entitySpacing);
});

test('spawn session changes ordinary positions while bosses retain authored coordinates',()=>{
 const a=new Simulation('bulbasaur',{spawnEpoch:51,spawnSessionSeed:1001,worldNow:()=>0}),b=new Simulation('bulbasaur',{spawnEpoch:51,spawnSessionSeed:2002,worldNow:()=>0});fill(a);fill(b);
 assert.notDeepEqual(a.enemies.filter(enemy=>enemy.dynamicSpawn).map(enemy=>[enemy.x,enemy.y]),b.enemies.filter(enemy=>enemy.dynamicSpawn).map(enemy=>[enemy.x,enemy.y]));
 assert.deepEqual(a.enemies.filter(enemy=>enemy.isBoss).map(enemy=>[enemy.id,enemy.home]),b.enemies.filter(enemy=>enemy.isBoss).map(enemy=>[enemy.id,enemy.home]));
});

test('each vacancy performs one weighted draw after biome and time filtering',()=>{
 const sim=new Simulation('bulbasaur'),point={x:47*32,y:40*32},day=eligibleSpawnCandidates(sim.map,point,0),night=eligibleSpawnCandidates(sim.map,point,DAY_LENGTH_MS/2);
 assert.ok(day.length&&night.length);assert.ok(night.every(entry=>NIGHT_SPECIES.has(entry.id)));assert.ok(day.every(entry=>!NIGHT_SPECIES.has(entry.id)));
 const counts=new Map();for(let i=0;i<30000;i++){const entry=weightedSpawnChoice(day,spawnRandom(8128,i));counts.set(entry.rarity,(counts.get(entry.rarity)||0)+1);}
 assert.ok((counts.get('common')||0)>(counts.get('rare')||0)*8);assert.equal([...counts.values()].reduce((sum,count)=>sum+count,0),30000);
});

test('caves and highlands draw exclusively from their current environment roster',()=>{
 const surface=new Simulation().map;
 for(const system of LAYER_SYSTEMS){const entry=surface.interactions.find(portal=>portal.id===system.portals[0]),map=createInterior(entry,surface.seed,surface),player=freePosition(map,map.layerExits[0]),config={...DEFAULT_SPAWN_CONFIG,radius:1050,minPlayerDistance:80,entitySpacing:0};
  const proposals=Array.from({length:70},(_,index)=>findDynamicSpawn({map,player,enemies:[],recent:[],spawnEpoch:3,serial:index+1,now:0,config})).filter(Boolean);assert.ok(proposals.length>15,system.id);assert.ok(proposals.every(spawn=>spawn.zoneId===system.id&&system.species.includes(spawn.species)),system.id);
 }
});

test('far wilds are removed and their recently used location is cooled down',()=>{
 const sim=new Simulation('bulbasaur',{worldNow:()=>0}),wild=fill(sim),target=wild[0],uid=target.uid,home={...target.home};Object.assign(sim.player,{x:target.x+sim.spawnConfig.despawnRadius+400,y:target.y});sim.streamCreatures();
 assert.equal(sim.enemies.some(enemy=>enemy.uid===uid),false);assert.ok(sim.recentSpawnLocations.some(entry=>entry.x===home.x&&entry.y===home.y));
});

test('each online player maintains a local population and can import a nearby shared encounter',()=>{
 const first=new Simulation('bulbasaur',{spawnEpoch:63,worldNow:()=>0}),second=new Simulation('squirtle',{spawnEpoch:63,worldNow:()=>0});
 Object.assign(second.player,freePosition(second.map,{x:first.player.x+1200,y:first.player.y+800}));
 first.enemies=first.enemies.filter(enemy=>!enemy.dynamicSpawn);second.enemies=second.enemies.filter(enemy=>!enemy.dynamicSpawn);
 fill(first);fill(second);
 assert.equal(first.enemies.filter(enemy=>enemy.dynamicSpawn).length,30);
 assert.equal(second.enemies.filter(enemy=>enemy.dynamicSpawn).length,30);
 assert.ok(first.enemies.filter(enemy=>enemy.dynamicSpawn).every(enemy=>Math.hypot(enemy.x-first.player.x,enemy.y-first.player.y)<=first.spawnConfig.radius));
 assert.ok(second.enemies.filter(enemy=>enemy.dynamicSpawn).every(enemy=>Math.hypot(enemy.x-second.player.x,enemy.y-second.player.y)<=second.spawnConfig.radius));
 const source=first.enemies.find(enemy=>enemy.dynamicSpawn);
 second.enemies=second.enemies.filter(enemy=>!enemy.dynamicSpawn);Object.assign(second.player,{x:first.player.x,y:first.player.y});
 second.applySharedWildState(first.sharedCreatureSnapshot(source));
 const imported=second.enemies.find(enemy=>enemy.uid===source.uid);
 assert.ok(imported);assert.equal(imported.id,source.id);assert.deepEqual(imported.home,source.home);
});

test('every wild species resolves to a cached PMD portrait shown only by the map',async()=>{
 for(const species of WILD_POKEMON)assert.ok(existsSync(new URL(`../public/assets/pokemon/${species.id}/portrait.png`,import.meta.url)),species.id);
 const fs=await import('node:fs/promises'),map=await fs.readFile(new URL('../public/map-controller.js',import.meta.url),'utf8'),world=await fs.readFile(new URL('../public/world-view.js',import.meta.url),'utf8');
 assert.match(map,/map-wild/);assert.match(map,/portrait\.png/);assert.match(map,/addEventListener\('error'/);assert.doesNotMatch(world,/sprite-icon/);
});

test('stale online snapshots cannot restore damage already applied to a wild Pokemon',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:63,worldNow:()=>0});fill(sim);
 const enemy=sim.enemies.find(entry=>entry.dynamicSpawn);Object.assign(sim.player,{x:enemy.x+80,y:enemy.y+80});
 const before=enemy.hp,damage=sim.damage(enemy,Math.max(1,Math.floor(enemy.maxHp*.2)),'Normal',true);assert.ok(damage>0);const damaged=enemy.hp,version=enemy.stateVersion;
 sim.applySharedWildState({...sim.sharedCreatureSnapshot(enemy),hp:before,stateVersion:version-1});
 assert.equal(enemy.hp,damaged);
 sim.applySharedWildState({...sim.sharedCreatureSnapshot(enemy),hp:Math.max(1,damaged-1),stateVersion:version+1});
 assert.equal(enemy.hp,Math.max(1,damaged-1));
});

test('a stray wild inside a city remains damageable from outside the safe zone',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:63,worldNow:()=>0,safeZones:true}),enemy=sim.enemies.find(entry=>!entry.isBoss),city=CITY_SAFE_ZONES[0];Object.assign(sim.player,{x:city.x+city.radius+100,y:city.y});Object.assign(enemy,{x:city.x,y:city.y,hp:100,maxHp:100,state:'Idle',defeated:false});
 assert.equal(sim.inSafeCity(sim.player),false);assert.equal(sim.inSafeCity(enemy),true);assert.ok(sim.damage(enemy,10,'Normal',true)>0);assert.ok(enemy.hp<100);
});
