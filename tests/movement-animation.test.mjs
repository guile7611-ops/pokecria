import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Simulation } from '../public/simulation.js';
import { CREATURES } from '../public/data.js';
import { findPath, followPath, createMap, walkable, clearSegment } from '../public/world.js';
import { SPRITE_DEFINITIONS, DIRECTIONS, facingDirection, animationFrame } from '../public/animation.js';

test('latest click immediately reverses motion and clears combat pursuit', () => {
  const sim = new Simulation(), p = sim.player;
  sim.command({ type: 'target', id: 1 }); sim.step(1 / 60);
  sim.command({ type: 'move', x: 390, y: 560 });
  for (let i = 0; i < 10; i++) sim.step(1 / 60);
  const previousX = p.x;
  sim.command({ type: 'move', x: 160, y: 560 });
  assert.equal(p.target, null); assert.deepEqual(p.path.at(-1), { x: 160, y: 560 });
  sim.step(1 / 60); assert.ok(p.x < previousX); assert.equal(facingDirection(p.facing), 'left');
  for (let i = 0; i < 120; i++) sim.step(1 / 60);
  assert.ok(Math.abs(p.x - 160) < .01);
});
test('invalid destination stops old path instead of continuing the earlier click', () => {
  const sim = new Simulation(); sim.command({ type: 'move', x: 390, y: 560 });
  assert.equal(sim.command({ type: 'move', x: 850, y: 300 }), false);
  const { x, y } = sim.player; sim.step(1 / 60); assert.equal(sim.player.x, x); assert.equal(sim.player.y, y); assert.equal(sim.player.path.length, 0);
});
test('open ground supports continuous diagonal and lateral travel at the same speed', () => {
  const map = { tile: 32, cols: 30, rows: 30, grid: Array.from({length:30},()=>Array(30).fill(0)) }, e = { x: 240, y: 560, radius: 11, speed: 145, path: [] };
  e.path = findPath(map, e, { x: 340, y: 460 }); assert.equal(e.path.length, 1);
  followPath(e, .1, map); assert.ok(e.x > 240 && e.y < 560);
  assert.ok(Math.abs(Math.hypot(e.x - 240, e.y - 560) - 14.5) < .001);
  const originalY = e.y; e.path = findPath(map, e, { x: 400, y: e.y }); followPath(e, .1, map); assert.equal(e.y, originalY);
});
test('diagonal navigation cannot squeeze through touching obstacle corners', () => {
  const map = { tile: 32, cols: 2, rows: 2, grid: [[0, 1], [1, 0]] };
  const a = { x: 16, y: 16, radius: 11 }, b = { x: 48, y: 48 };
  assert.ok(walkable(map, a.x, a.y)); assert.ok(walkable(map, b.x, b.y));
  assert.equal(clearSegment(map, a, b), false); assert.deepEqual(findPath(map, a, b), []);
});
test('all nine starters retain their selected species, four slots, and elemental attack', () => {
  for (const [id, ability] of [['bulbasaur','leaf'],['charmander','ember'],['squirtle','water'],['chikorita','leaf'],['cyndaquil','ember'],['totodile','water'],['treecko','leaf'],['torchic','ember'],['mudkip','water']]) {
    const sim = new Simulation(id); assert.equal(sim.player.id, id); assert.equal(sim.player.slots.length, 4); assert.equal(sim.player.slots[0], ability);
    assert.equal(sim.command({ type: 'cast', slot: 0, x: 300, y: 560 }), true); assert.equal(sim.projectiles[0].ability, ability);
    sim.gainXP(45); assert.ok(sim.player.slots[1]);
  }
  assert.throws(() => new Simulation('__proto__'), RangeError);
});
test('PMD row mapping covers all eight directions including true lateral sprites', () => {
  const vectors = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
  assert.deepEqual(vectors.map(([x,y]) => facingDirection({x,y})), DIRECTIONS);
});
test('imported atlas dimensions, frame durations and per-frame pivots match source files', () => {
  for (const [id, definition] of Object.entries(SPRITE_DEFINITIONS)) {
    assert.equal(Object.keys(definition.animations).length, 6);
    for (const animation of Object.values(definition.animations)) {
      const buffer = readFileSync(new URL('../public' + animation.src, import.meta.url));
      assert.equal(buffer.readUInt32BE(16), animation.frameWidth * animation.columns);
      assert.equal(buffer.readUInt32BE(20), animation.frameHeight * animation.rows);
      assert.equal(animation.durations.length, animation.columns); assert.ok(animation.durations.every(n => n > 0));
      assert.equal(animation.pivots.length, animation.rows);
      for (const row of animation.pivots) { assert.equal(row.length, animation.columns); for (const pivot of row) assert.ok(pivot.x >= 0 && pivot.x < animation.frameWidth && pivot.y >= 0 && pivot.y < animation.frameHeight); }
    }
    const base = CREATURES[id]?.baseCreature ?? id; const player = new Simulation(CREATURES[id]?.baseCreature ?? 'bulbasaur').player; player.id = id; player.moving = true; player.facing = { x: 1, y: 0 };
    assert.equal(animationFrame(player, 0).row, 2);
    player.facing = { x: -1, y: 0 }; assert.equal(animationFrame(player, 0).row, 6);
    assert.notEqual(animationFrame(player, 0).column, animationFrame(player, .22).column);
    player.dead = true; player.deathStart = 0;
    assert.equal(animationFrame(player, 50).column, definition.animations.Faint.columns - 1);
  }
});
