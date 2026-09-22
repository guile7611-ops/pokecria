import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {walkable} from '../public/world.js';
import {objectDefinition} from '../public/tilemap.js';
import {animationFrame} from '../public/animation.js';
import {GROUNDING} from '../public/sprite-grounding.js';

test('village bridge stays clear and can be crossed repeatedly with live enemy AI',()=>{
 const sim=new Simulation();sim.player.maxHp=sim.player.hp=100000;
 Object.assign(sim.player,{x:23.5*32,y:17.5*32,path:[]});
 const began=performance.now();
 for(const x of [31.5*32,23.5*32,31.5*32]){
  assert.ok(sim.command({type:'move',x,y:17.5*32}));
  for(let n=0;n<300&&sim.player.path.length;n++){sim.step(1/30);assert.ok(walkable(sim.map,sim.player.x,sim.player.y,sim.player.radius));}
  assert.ok(Math.abs(sim.player.x-x)<2);
 }
 assert.ok(performance.now()-began<4000,'bridge traversal must not cause runaway AI searches');
});
test('decoration footprints cannot occupy water, roads or bridges',()=>{
 const {map}=new Simulation();
 for(const o of map.objects){if(o.structure)continue;const d=objectDefinition(o),half=Math.max(16,d.width/2),depth=d.low?d.height:24;
  for(let y=Math.floor((o.y-depth)/32);y<=Math.floor((o.y+12)/32);y++)for(let x=Math.floor((o.x-half)/32);x<=Math.floor((o.x+half)/32);x++)assert.ok(![2,7,8].includes(map.grid[y]?.[x]),`${o.kind} at ${o.x},${o.y}`);
 }
});
test('starter idle and walk frames anchor their opaque feet to world position',()=>{
 for(const id of ['bulbasaur','charmander','squirtle'])for(const moving of [false,true])for(const facing of [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}]){
  const f=animationFrame({id,moving,facing},.3);assert.equal(f.pivot.y,GROUNDING[id][moving?'Walk':'Idle'][f.row][f.column]);
 }
});

