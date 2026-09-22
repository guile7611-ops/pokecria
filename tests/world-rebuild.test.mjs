import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnAvailable} from '../public/day-night.js';
import { createMap, walkable, findPath, followPath } from '../public/world.js';
import { generateWorld } from '../public/map-generator.js';
import { WorldDefinition, WALKABLE, RegionDefinitions, PoiDefinitions } from '../public/world-definition.js';
import { Simulation } from '../public/simulation.js';
import { Discovery, saveWorld, loadWorldSave } from '../public/world-runtime.js';

test('seed is repeatable; variation preserves every authored location and road',()=>{
 const a=createMap(),b=generateWorld(),c=generateWorld({seed:42});
 assert.deepEqual(a.grid,b.grid);assert.notDeepEqual(a.grid,c.grid);
 assert.deepEqual(a.pois,c.pois);assert.deepEqual(a.roads,c.roads);
 assert.equal(a.cols*a.rows,WorldDefinition.cols*WorldDefinition.rows);assert.ok(a.cols*a.rows>480*340*1.8);
 for(const p of a.pois)assert.ok(walkable(c,p.x,p.y),p.name);
});
test('continent has ocean margins and every POI is reachable from the village',()=>{
 const m=createMap();assert.ok(m.grid[0].every(t=>t===2));assert.ok(m.grid.at(-1).every(t=>t===2));
 const seen=new Set([17*m.cols+7]),queue=[[7,17]];
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*m.cols+nx;if(!seen.has(k)&&WALKABLE.has(m.grid[ny]?.[nx])){seen.add(k);queue.push([nx,ny]);}}}
 for(const p of m.pois)assert.ok(seen.has(Math.floor(p.y/32)*m.cols+Math.floor(p.x/32)),p.name);
 assert.ok(seen.size>60000);
 assert.ok(m.grid.flatMap(r=>[...r]).includes(8),'bridges exist in collision data');
});
test('actual routes negotiate village buildings and reach the first exploration camp',()=>{
 const map=createMap(),entity={x:240,y:560,radius:11,speed:145},goal=PoiDefinitions.find(p=>p.id==='bosque');
 entity.path=findPath(map,entity,goal);assert.ok(entity.path.length);
 for(let i=0;i<800&&entity.path.length;i++)followPath(entity,.05,map);
 assert.ok(Math.hypot(entity.x-goal.x,entity.y-goal.y)<1);
});
test('spawns use their geographical region and stream under an active cap',()=>{
 const sim=new Simulation();assert.ok(sim.map.spawns.length>100);
 for(const s of sim.map.spawns){const r=RegionDefinitions.find(r=>r.id===s.zoneId);assert.ok(r.species.includes(s.species));assert.equal(sim.map.regions[sim.map.biome[Math.floor(s.y/32)][Math.floor(s.x/32)]].id,r.id);assert.ok(walkable(sim.map,s.x,s.y,12));}
 for(const s of sim.map.spawns.filter((spawn,i)=>i%10===0&&spawnAvailable(spawn))){Object.assign(sim.player,{x:s.x,y:s.y});sim.streamCreatures();assert.ok(sim.enemies.length<=48);assert.ok(sim.enemies.some(e=>e.uid===s.uid));}
 assert.ok(sim.dormant.size>0);
});
test('discovery states and seed survive save/load without revealing the world',()=>{
 const sim=new Simulation(),d=sim.discovery;assert.equal(d.state(240,560),'CURRENT');assert.equal(d.state(9000,8000),'UNKNOWN');
 d.reveal({x:9000,y:8000});assert.equal(d.state(240,560),'DISCOVERED');
 let data;const storage={setItem:(k,v)=>data=v,getItem:()=>data};assert.ok(saveWorld(storage,sim));const save=loadWorldSave(storage),restored=new Discovery(sim.map,save.seen);assert.equal(save.seed,sim.map.seed);assert.equal(restored.state(240,560),'DISCOVERED');assert.ok(restored.seen.size<restored.cols*restored.rows/10);
});
