import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../public/simulation.js';
import { REGION, ABILITIES, XP_CURVE } from '../public/data.js';
import { createMap, findPath, walkable, followPath, lineOfSight } from '../public/world.js';
const run = (sim, seconds) => { for (let i = 0; i < seconds * 60; i++) sim.step(1 / 60); };

test('navigation crosses river only through bridge and remains outside obstacles', () => {
  const map = createMap(), end = { x: 1100, y: 400 };
  const entity = { x: 650, y: 400, speed: 145, radius: 11, path: [] };
  entity.path = findPath(map, entity, end); assert.ok(entity.path.length > 0);
  assert.equal(lineOfSight(map, entity, end), false);
  for (let i = 0; i < 2000; i++) { followPath(entity, 1 / 60, map); assert.ok(walkable(map, entity.x, entity.y)); }
  assert.ok(Math.hypot(entity.x - end.x, entity.y - end.y) < 1);
  assert.deepEqual(findPath(map, entity, { x: 850, y: 300 }), []);
});
test('all configured spawn points are valid', () => {
  const sim = new Simulation(); for (const e of sim.enemies) assert.ok(walkable(sim.map, e.x, e.y, e.radius));
});
test('rejects malformed commands and unavailable slots', () => {
  const sim = new Simulation();
  for (const command of [null, { type: 'move', x: NaN, y: 1 }, { type: 'move', x: 1e9, y: 1e9 }, { type: 'cast', slot: 0, x: Infinity, y: 0 }, { type: 'cast', slot: 4, x: 300, y: 300 }, { type: 'cast', slot: 1, x: 300, y: 300 }, { type: 'target', id: 999 }]) assert.equal(sim.command(command), false);
});
test('Q respects cooldown, damages a target, awards XP exactly once', () => {
  const sim = new Simulation(), e = sim.enemies[0];
  e.x = 300; e.y = 560; e.home = { x: 300, y: 560 }; e.hp = 20;
  const command = { type: 'cast', slot: 0, x: 300, y: 560 };
  assert.equal(sim.command(command), true); assert.equal(sim.command(command), false);
  run(sim, .3); if(e.state!=='Dead')sim.damage(e,1000); assert.equal(e.state, 'Dead'); assert.equal(sim.player.xp, e.xp); assert.equal(sim.kills, 1);
  sim.damage(e, 1000); assert.equal(sim.player.xp, e.xp);
});
test('basic attack follows target and completes kill / level / learn loop', () => {
  const sim = new Simulation();
  for (const e of sim.enemies.slice(0, 2)) {
    Object.assign(e, { x: sim.player.x + 70, y: sim.player.y, home: { x: sim.player.x + 70, y: sim.player.y } });
    sim.command({ type: 'target', id: e.uid }); run(sim, 6); assert.equal(e.state, 'Dead');
  }
  assert.equal(sim.player.level, 2); assert.equal(sim.player.xp, sim.enemies[0].xp+sim.enemies[1].xp-45); assert.equal(sim.player.slots.length, 4); assert.equal(sim.player.slots[1], 'bloom');
});
test('level thresholds continue beyond the former level cap', () => {
  const sim = new Simulation(); sim.gainXP(44); assert.equal(sim.player.level, 1); sim.gainXP(1); assert.equal(sim.player.level, 2);
  assert.equal(sim.player.slots[1], 'bloom'); assert.equal(sim.player.slots[2], null); assert.equal(sim.player.slots[3], null);
  while(sim.player.level<52)sim.gainXP(XP_CURVE[sim.player.level]);
  assert.equal(sim.player.level,52);assert.equal(sim.player.xp,0);assert.equal(sim.player.slots[2],'vineBurst');assert.equal(sim.player.slots[3],'solarBeam');
  sim.gainXP(10);assert.equal(sim.player.xp,10);assert.equal(sim.player.id,'venusaur');assert.equal(sim.player.maxHp,165+51*9);
});
test('healing cannot exceed maximum HP and respects cooldown', () => {
  const sim = new Simulation(); sim.gainXP(45); const p = sim.player;
  assert.equal(sim.command({ type: 'cast', slot: 1, x: 0, y: 0 }), false);
  p.hp -= 10; assert.equal(sim.command({ type: 'cast', slot: 1, x: 0, y: 0 }), true); assert.equal(p.hp, p.maxHp);
  p.hp -= 50; assert.equal(sim.command({ type: 'cast', slot: 1, x: 0, y: 0 }), false); assert.equal(p.cooldowns.bloom, ABILITIES.bloom.cooldown);
});
test('death prevents commands and respawn retains progression', () => {
  const sim = new Simulation(); sim.gainXP(45); sim.player.hp = 1;
  const e = sim.enemies[0]; Object.assign(e, { x: sim.player.x + 10, y: sim.player.y, state: 'Attack' });
  run(sim, .1); assert.equal(sim.player.dead, true); assert.equal(sim.command({ type: 'move', x: 300, y: 560 }), false);
  run(sim, 3.2); assert.equal(sim.player.dead, false); assert.equal(sim.player.level, 2); assert.equal(sim.player.hp, sim.player.maxHp); assert.equal(sim.player.x, REGION.spawn.x);
});
test('enemy respawn waits when the player is close to its home', () => {
  const sim = new Simulation(), e = sim.enemies[0]; sim.damage(e, 1000); sim.player.x = e.home.x; sim.player.y = e.home.y;
  run(sim, 14); assert.equal(e.state, 'Dead'); sim.player.x = REGION.spawn.x; sim.player.y = REGION.spawn.y; run(sim, .1); assert.notEqual(e.state, 'Dead'); assert.equal(e.hp, e.maxHp);
});
test('wild respawn relocates within its biome instead of reusing a fixed point',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:777}),e=sim.enemies[0],before={...e.home};sim.damage(e,99999);sim.player.x=REGION.spawn.x;sim.player.y=REGION.spawn.y;
 run(sim,14);assert.notEqual(e.state,'Dead');assert.notDeepEqual(e.home,before);assert.equal(e.zoneId,'bosque');assert.ok(walkable(sim.map,e.x,e.y,e.radius));
});
test('wild Pokémon notices at 155 pixels and keeps focus until the player opens 400 pixels', () => {
  const sim=new Simulation(),e=sim.enemies.find(enemy=>!enemy.isBoss);
  const point={x:sim.player.x+140,y:sim.player.y};
  assert.ok(walkable(sim.map,point.x,point.y,e.radius));
  Object.assign(e,point,{home:{...point},state:'Idle',timer:2,path:[]});
  sim.updateEnemy(e,1/60);
  assert.equal(e.state,'Chase');
  assert.ok(e.path.length>0);
  sim.player.x=e.x-390;sim.updateEnemy(e,1/60);assert.equal(e.state,'Chase');
  sim.player.x=e.x-410;sim.updateEnemy(e,1/60);assert.equal(e.state,'ReturnToSpawn');
});
test('wild Pokémon patrol while outside the old camera update distance', () => {
  const sim=new Simulation(),e=sim.enemies.find(enemy=>!enemy.isBoss);
  let point;
  for(let y=32;y<sim.map.rows*32&&!point;y+=32)for(let x=32;x<sim.map.cols*32;x+=32){
    const d=Math.hypot(x-sim.player.x,y-sim.player.y);
    if(d>1450&&d<1700&&walkable(sim.map,x,y,e.radius)){point={x,y};break;}
  }
  assert.ok(point);
  Object.assign(e,point,{home:{...point},state:'Idle',timer:0,path:[],moving:false});
  const before={x:e.x,y:e.y};run(sim,.2);
  assert.ok(Math.hypot(e.x-before.x,e.y-before.y)>0);
  assert.ok(Math.hypot(e.x-e.home.x,e.y-e.home.y)<=e.wanderRadius+2);
});

