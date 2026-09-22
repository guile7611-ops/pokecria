import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../public/simulation.js';
import { WILD_POKEMON } from '../public/data.js';
import { animationFrame } from '../public/animation.js';

test('wild encounters use Pokémon species and never the old placeholder', () => {
  const sim = new Simulation();
  assert.deepEqual(sim.enemies.filter(e=>!e.isBoss&&!e.horde).map(enemy => enemy.id), ['caterpie', 'pidgey']);
  assert.ok(sim.enemies.filter(enemy => !enemy.isBoss).every(enemy => WILD_POKEMON.some(species => species.id === enemy.id)));
});

test('a stopped player has no movement and stays on a single idle frame', () => {
  const sim = new Simulation(), player = sim.player;
  player.moving = false; player.path = []; const position = { x: player.x, y: player.y };
  for (let i = 0; i < 120; i++) sim.step(1 / 60);
  assert.deepEqual({ x: player.x, y: player.y }, position); assert.equal(player.moving, false);
  const first = animationFrame(player, 0), later = animationFrame(player, 10);
  assert.equal(first.state, 'Idle'); assert.equal(first.column, later.column);
});

test('wild Pokémon use their own idle and lateral sprite atlases', () => {
  for (const id of ['caterpie', 'pidgey']) {
    const sim = new Simulation(); const enemy = sim.enemies.find(candidate => candidate.id === id);
    enemy.moving = false; enemy.facing = { x: -1, y: 0 };
    const frame = animationFrame(enemy, 0); assert.equal(frame.direction, 'left'); assert.equal(frame.state, 'Idle'); assert.ok(frame.animation.src.includes(`/pokemon/${id}/`));
  }
});

test('wild defeats create species drops and complete the clearing quest once', () => {
  const sim = new Simulation();
  for (const enemy of sim.enemies.filter(candidate => !candidate.isBoss).slice(0, 3)) sim.damage(enemy, 999);
  assert.equal(sim.quest.drops.length,3);
  assert.equal(sim.quest.drops.filter(Boolean).length,sim.events.filter(event=>event.type==='drop').length);
  assert.equal(sim.quest.progress, 3); assert.equal(sim.quest.complete, true);
  assert.equal(sim.events.filter(event => event.type === 'questComplete').length, 1);
});

