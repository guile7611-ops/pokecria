import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, findPathNearObstacle, followPath, clearSegment, walkable, distance } from '../public/world.js';
import { Simulation } from '../public/simulation.js';

const makeMap = (tile = 0) => ({ tile: 32, cols: 10, rows: 10, grid: Array.from({ length: 10 }, () => Array(10).fill(tile)) });
function arrive(map, start, end) {
  const entity = { ...start, radius: 11, speed: 145, path: findPath(map, start, end) };
  assert.ok(entity.path.length);
  const goal = { ...entity.path.at(-1) };
  for (let i = 0; i < 2000 && entity.path.length; i++) {
    followPath(entity, i % 2 ? 1 / 60 : .1, map);
    assert.ok(walkable(map, entity.x, entity.y, entity.radius));
  }
  assert.ok(distance(entity, goal) < .01, 'must arrive without stopping at a corner');
  return goal;
}

test('routes around walls in every walkable biome and reaches the destination', () => {
  for (const biome of [0, 4, 5, 6]) {
    const map = makeMap(biome);
    for (let y = 0; y < 7; y++) map.grid[y][4] = 1;
    arrive(map, { x: 80, y: 80 }, { x: 240, y: 80 });
  }
});

test('edge clicks on accessible ground leave room for the body', () => {
  const map = makeMap(); map.grid[3][4] = 1;
  const end = arrive(map, { x: 48, y: 112 }, { x: 127, y: 112 });
  assert.ok(end.x < 117);
  assert.equal(Math.floor(end.x / 32), 3);
});

test('swept collision detects a tiny corner crossing between old sampling points', () => {
  const map = makeMap(); map.grid[3][3] = 1;
  assert.equal(clearSegment(map, { x: 70, y: 100.2 }, { x: 100, y: 70.2 }), false);
});

test('a new route midway around an obstacle reaches the latest destination', () => {
  const map = makeMap(); map.grid[3][3] = 1;
  const entity = { x: 48, y: 112, radius: 11, speed: 145 };
  entity.path = findPath(map, entity, { x: 240, y: 112 });
  followPath(entity, .3, map);
  arrive(map, entity, { x: 48, y: 240 });
});

test('held directional input moves without pathfinding and slides along a wall',()=>{
 const sim=new Simulation(),p=sim.player,map=makeMap();
 for(let y=4;y<=8;y++)map.grid[y][5]=1;map.scene='movement-test';
 sim.map=map;sim.discovery.reveal=()=>{};sim.updateEnemy=()=>{};
 Object.assign(p,{x:130,y:145,path:[],target:null});
 sim.inputVector={x:1,y:1};
 for(let i=0;i<20;i++)sim.step(.05);
 assert.ok(p.y>180,'vertical movement continues along the wall');
 assert.ok(p.x<160-p.radius,'the player does not enter the blocked tile');
 assert.equal(p.path.length,0,'held input does not rebuild A* routes');
 assert.equal(p.moving,true);
 sim.inputVector=null;sim.step(.05);assert.equal(p.moving,false);
});

test('clicking inside a structure walks to its nearest accessible edge',()=>{
 const map=makeMap(),wall={x:130,y:80,w:64,h:64},start={x:80,y:112,radius:11,speed:145},click={x:160,y:112};
 map.colliders=new Map();
 for(let y=2;y<=4;y++)for(let x=4;x<=6;x++)map.colliders.set(`${x},${y}`,[wall]);
 assert.equal(findPath(map,start,click).length,0);
 const path=findPathNearObstacle(map,start,click);
 assert.ok(path.length);
 const end=path.at(-1);
 assert.ok(walkable(map,end.x,end.y,start.radius));
 assert.ok(distance(end,click)<distance(start,click));
 const actor={...start,path};
 for(let i=0;i<200&&actor.path.length;i++)followPath(actor,1/60,map);
 assert.ok(distance(actor,end)<1);
});

test('blocked terrain still rejects the click instead of searching across water',()=>{
 const map=makeMap();map.grid[3][4]=1;
 assert.deepEqual(findPathNearObstacle(map,{x:80,y:112,radius:11},{x:144,y:112}),[]);
});

test('real village house click produces a reachable route and arrives at the facade',()=>{
 const sim=new Simulation(),house=sim.map.objects.find(object=>object.kind==='house'&&object.x<500),click={x:house.x,y:house.y-20};
 assert.equal(walkable(sim.map,click.x,click.y,sim.player.radius),false);
 assert.equal(sim.command({type:'move',...click}),true);
 const end={...sim.player.path.at(-1)};
 assert.ok(walkable(sim.map,end.x,end.y,sim.player.radius));
 for(let i=0;i<1000&&sim.player.path.length;i++)followPath(sim.player,1/60,sim.map);
 assert.ok(distance(sim.player,end)<1);
 assert.ok(distance(end,click)<distance({x:240,y:560},click));
});
