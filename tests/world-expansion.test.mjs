import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,walkable,findPath,followPath} from '../public/world.js';
import {createInterior} from '../public/collisions.js';
import {Simulation} from '../public/simulation.js';
import {pathDistance,levelRangeAt,freePosition} from '../public/world-navigation.js';
import {LAYER_SYSTEMS,habitatAllows} from '../public/world-habitats.js';
import {EvolutionMinimumLevel} from '../public/world-definition.js';
import {DEFAULT_SPAWN_CONFIG,findDynamicSpawn} from '../public/spawn-system.js';
const world=createMap();
test('every surface portal is reachable and ordinary encounters have no authored coordinates',()=>{
 for(const portal of world.interactions.filter(p=>p.sceneId)){assert.ok(Number.isFinite(pathDistance(world,portal)),portal.id);const landing=freePosition(world,{x:portal.x,y:portal.y+64});assert.ok(walkable(world,landing.x,landing.y,12));}
 assert.equal(world.spawns.length,0);
});
test('levels follow navigable routes with smooth progression across neighboring tiles',()=>{
 const samples=world.pois.filter(point=>Number.isFinite(pathDistance(world,point))).sort((a,b)=>pathDistance(world,a)-pathDistance(world,b));for(let i=1;i<samples.length;i++)assert.ok(levelRangeAt(world,samples[i])[0]>=levelRangeAt(world,samples[i-1])[0]);
 for(const s of samples)for(const delta of [{x:32,y:0},{x:0,y:32}]){const q={x:s.x+delta.x,y:s.y+delta.y};const b=levelRangeAt(world,q);if(b)assert.ok(Math.abs(b[0]-levelRangeAt(world,s)[0])<=3,'neighbor progression');}
});
test('irregular caves and highlands have connected exits, habitat-only dynamic encounters and entrance difficulty',()=>{
 const ids=new Set();
 for(const system of LAYER_SYSTEMS){const entry=world.interactions.find(p=>p.id===system.portals[0]),map=createInterior(entry,world.seed,world);assert.ok(map.reachableCount>1800);assert.equal(map.spawns.length,0);assert.equal(map.scene,system.id);
 for(const exit of map.layerExits){const route=findPath(map,freePosition(map,map.layerExits[0]),exit);assert.ok(route.length,exit.id);const actor={...freePosition(map,map.layerExits[0]),radius:11,speed:1000,path:route};for(let i=0;i<10000&&actor.path.length;i++)followPath(actor,.03,map);assert.ok(Math.hypot(actor.x-exit.x,actor.y-exit.y)<2,exit.id);
 const surface=world.interactions.find(p=>p.id===exit.surfaceId);assert.ok(Math.abs(levelRangeAt(map,exit)[0]-levelRangeAt(world,surface)[0])<=1);}
 const player=freePosition(map,map.layerExits[0]),config={...DEFAULT_SPAWN_CONFIG,radius:1100,minPlayerDistance:96,entitySpacing:0};const spawns=Array.from({length:80},(_,index)=>findDynamicSpawn({map,player,enemies:[],recent:[],spawnEpoch:9,serial:index+1,now:0,config})).filter(Boolean);assert.ok(spawns.length>20);assert.equal(map.spawns.length,0);
 for(const spawn of spawns){assert.ok(!ids.has(spawn.uid));ids.add(spawn.uid);assert.ok(system.species.includes(spawn.species));assert.ok(habitatAllows(map.regions[0].biome,spawn.species));assert.ok(walkable(map,spawn.x,spawn.y,12));}
 }
});
test('all entrances support same-entry return, alternate exits, collision-free landing and loop guard',()=>{
 const sim=new Simulation();
 for(const system of LAYER_SYSTEMS)for(const id of system.portals){const portal=sim.map.interactions.find(p=>p.id===id);Object.assign(sim.player,{x:portal.x,y:portal.y,path:[]});sim.time+=2;sim.command({type:'interact',id});assert.equal(sim.map.scene,system.id);
 const exit=sim.map.layerExits.find(e=>e.surfaceId===id);Object.assign(sim.player,{x:exit.x,y:exit.y});sim.command({type:'interact',id:exit.id});assert.equal(sim.map.scene,system.id,'debounce');sim.time+=2;sim.command({type:'interact',id:exit.id});assert.equal(sim.map.scene,undefined);assert.ok(Math.hypot(sim.player.x-portal.x,sim.player.y-portal.y)<110);assert.ok(walkable(sim.map,sim.player.x,sim.player.y));
 Object.assign(sim.player,{x:portal.x,y:portal.y});sim.time+=2;sim.command({type:'interact',id});const other=sim.map.layerExits.find(e=>e.surfaceId!==id);Object.assign(sim.player,{x:other.x,y:other.y});sim.time+=2;sim.command({type:'interact',id:other.id});const destination=sim.map.interactions.find(p=>p.id===other.surfaceId);assert.ok(Math.hypot(sim.player.x-destination.x,sim.player.y-destination.y)<110);assert.ok(walkable(sim.map,sim.player.x,sim.player.y));}
});
test('different cave entrances share creature identities and snapshots cannot move surface actors',()=>{
 const a=new Simulation(),b=new Simulation();const first=a.map.interactions.find(p=>p.id==='cripta'),second=b.map.interactions.find(p=>p.id==='gruta-petalas');
 a.interact(first);b.interact(second);assert.equal(a.map.scene,b.map.scene);assert.deepEqual(a.map.spawns,b.map.spawns);
 const enemy=a.enemies[0],state=a.sharedCreatureSnapshot(enemy);assert.equal(state.scene,a.map.scene);b.applySharedWildState(state);assert.deepEqual(b.sharedWildStates.get(enemy.uid),state);
 a.exitInterior();const target=a.enemies[0],original=target.hp;a.applySharedWildState({...state,uid:target.uid,hp:1});assert.equal(target.hp,original);
});
test('old discovery sectors migrate to the expanded grid without moving explored places',async()=>{
 const {Discovery,saveWorld}=await import('../public/world-runtime.js');const oldIndex=12*60+25;
 const sim=new Simulation('bulbasaur',{seen:[oldIndex]});assert.equal(sim.discovery.state(25*256+1,12*256+1),'DISCOVERED');let saved;saveWorld({setItem:(key,value)=>{if(key==='aurora-world-v2')saved=JSON.parse(value);}},sim);assert.equal(saved.discoveryCols,90);const restored=new Discovery(sim.map,saved.seen,saved.discoveryCols);assert.equal(restored.state(25*256+1,12*256+1),'DISCOVERED');
});
