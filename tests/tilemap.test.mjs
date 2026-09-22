import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {attachCollisions} from '../public/collisions.js';
import {MATERIALS,OBJECT_PROPERTIES,tileAt,transitionAlpha} from '../public/tilemap.js';
import {walkable,clearSegment,findPath,followPath} from '../public/world.js';
import {Simulation} from '../public/simulation.js';
const fixture=(objects=[])=>attachCollisions({seed:1,tile:32,cols:20,rows:20,grid:Array.from({length:20},()=>new Uint8Array(20)),biome:Array.from({length:20},()=>new Uint8Array(20)),regions:[{biome:'field'}],objects,spawns:[],chunks:new Map()});
test('PNG library has 64 actual 32px terrain tiles, transparent sprites and aligned VFX',async()=>{
 for(const name of MATERIALS)for(let v=1;v<=4;v++){const m=await sharp(`public/assets/tilesets/${name}/${name}_${String(v).padStart(2,'0')}.png`).metadata();assert.equal(m.width,32);assert.equal(m.height,32);}
 for(const [kind,d]of Object.entries(OBJECT_PROPERTIES)){const s=sharp(`public/assets/sprites/objects/${kind}.png`),m=await s.metadata();assert.equal(m.width,d.width);assert.equal(m.height,d.height);const stats=await s.stats();assert.equal(stats.channels[3].min,0,kind+' needs transparent background');}
 for(const effect of Object.values(JSON.parse(readFileSync('public/assets/art-manifest.json')).effects)){const m=await sharp('public'+effect.src).metadata();assert.equal(m.width,512);assert.equal(m.height,64);assert.ok(m.hasAlpha);}
});
test('autotile handles cardinal edges, outside corners and mixed materials deterministically',()=>{
 assert.equal(transitionAlpha(1,16,0),255);assert.equal(transitionAlpha(1,16,20),0);assert.equal(transitionAlpha(16,31,0),255);assert.equal(transitionAlpha(16,16,16),0);
 const m=fixture();m.grid[9][10]=2;m.grid[10][11]=2;const t=tileAt(m,10,10);assert.ok(t.transitions.length);assert.deepEqual(tileAt(m,10,10),t);assert.ok(new Set(Array.from({length:8},(_,x)=>tileAt(m,x,5).variant)).size>1);
});
test('tree collision is only its trunk; paths and projectiles can pass behind the canopy',()=>{
 const m=fixture([{kind:'tree',x:320,y:320,scale:1}]);assert.equal(walkable(m,320,320,5),false);assert.equal(walkable(m,320,250,11),true);assert.equal(clearSegment(m,{x:250,y:250},{x:380,y:250}),true);assert.equal(clearSegment(m,{x:250,y:320},{x:380,y:320}),false);
 const e={x:250,y:320,radius:11,speed:145};e.path=findPath(m,e,{x:390,y:320});assert.ok(e.path.length);for(let i=0;i<200;i++)followPath(e,.05,m);assert.ok(Math.hypot(e.x-390,e.y-320)<1);
});
test('rocks block their base and water rules distinguish ground, swimming and bridges',()=>{
 const m=fixture([{kind:'rock',x:220,y:220}]);assert.equal(walkable(m,220,220,5),false);assert.equal(walkable(m,220,185,5),true);
 for(let y=0;y<20;y++)m.grid[y][10]=2;assert.equal(walkable(m,336,300),false);assert.equal(walkable(m,336,300,11,{swim:true}),true);assert.ok(findPath(m,{x:280,y:300,navigation:{swim:true}},{x:400,y:300}).length);
 m.grid[9][10]=8;assert.equal(walkable(m,336,304),true);
});
test('houses block walls, expose a walkable door, and support entry and exit preserving progression',()=>{
 const sim=new Simulation();sim.gainXP(45);const door=sim.map.interactions.find(i=>i.kind==='house');const before=sim.map;
 assert.ok(walkable(sim.map,door.x,door.y,11));assert.equal(walkable(sim.map,door.x-35,door.y-30,5),false);
 Object.assign(sim.player,{x:door.x,y:door.y+20});assert.equal(sim.command({type:'interact',id:door.id}),true);assert.ok(sim.map.scene);assert.ok(walkable(sim.map,sim.player.x,sim.player.y));assert.equal(sim.player.level,2);
 Object.assign(sim.player,{x:288,y:410});sim.command({type:'interact',id:'exit'});assert.equal(sim.map,before);assert.equal(sim.player.level,2);assert.ok(walkable(sim.map,sim.player.x,sim.player.y));
});
test('cave entrance loads a navigable cave with creatures and an exit',()=>{
 const sim=new Simulation(),door=sim.map.interactions.find(i=>i.kind==='cave');Object.assign(sim.player,{x:door.x,y:door.y+16});sim.command({type:'interact',id:door.id});assert.ok(sim.map.scene);assert.equal(sim.map.regions[0].biome,'cave');assert.ok(sim.enemies.length>1);assert.ok(sim.map.interactions.some(i=>i.kind==='exit'));
 assert.ok(findPath(sim.map,sim.player,sim.map.layerExits[1]).length);
});
