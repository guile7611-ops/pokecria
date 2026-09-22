import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../public/simulation.js';
import { CREATURES, ABILITIES, XP_CURVE } from '../public/data.js';
import { applyEvolutions, nextEvolution, xpToLevel } from '../public/progression.js';
const lines = [
  { base: 'bulbasaur', middle: 'ivysaur', final: 'venusaur', finalLevel: 32 },
  { base: 'charmander', middle: 'charmeleon', final: 'charizard', finalLevel: 36 },
  { base: 'squirtle', middle: 'wartortle', final: 'blastoise', finalLevel: 36 },
];
for (const line of lines) {
  test(`${line.base}: evolves exactly at 16 and ${line.finalLevel}, once per stage`, () => {
    const sim = new Simulation(line.base), p = sim.player;
    sim.gainXP(xpToLevel(p, 16) - 1); assert.equal(p.level, 15); assert.equal(p.id, line.base); assert.equal(p.evolutionHistory.length, 0);
    sim.gainXP(1); assert.equal(p.id, line.middle); assert.equal(p.level, 16); assert.equal(p.xp, 0); assert.equal(p.evolutionHistory.length, 1);
    assert.equal(sim.definition.id, p.id); assert.ok(p.maxHp > CREATURES[line.base].hp + 15 * 12);
    sim.gainXP(xpToLevel(p, line.finalLevel) - 1); assert.equal(p.id, line.middle);
    sim.gainXP(1); assert.equal(p.id, line.final); assert.equal(p.level, line.finalLevel); assert.equal(nextEvolution(p.id), null);
    assert.deepEqual(p.evolutionHistory.map(e => e.level), [16, line.finalLevel]);
    assert.deepEqual(applyEvolutions(p, sim.time), []); assert.equal(p.evolutionHistory.length, 2);
  });
}
test('large XP grants cross both stages in order and preserve excess XP below cap', () => {
  const sim = new Simulation('charmander'), p = sim.player;
  sim.gainXP(xpToLevel(p, 37) + 13);
  assert.equal(p.id, 'charizard'); assert.equal(p.level, 37); assert.equal(p.xp, 13);
  assert.deepEqual(sim.events.filter(e => e.type === 'evolve').map(e => [e.from, e.to, e.level]), [['charmander', 'charmeleon', 16], ['charmeleon', 'charizard', 36]]);
  assert.equal(p.element, 'Fogo / Voador');
});
test('evolution preserves movement, target, slots and cooldown instead of granting a free cast', () => {
  const sim = new Simulation('squirtle'), p = sim.player;
  sim.gainXP(xpToLevel(p, 16) - 1);
  sim.command({ type: 'move', x: 380, y: 510 }); const path = structuredClone(p.path), position = { x: p.x, y: p.y };
  sim.command({ type: 'cast', slot: 0, x: 350, y: 560 }); p.cooldowns.recover = 5; const before = p.cooldowns.water;
  sim.gainXP(1);
  assert.deepEqual(p.path, path); assert.deepEqual({ x: p.x, y: p.y }, position); assert.equal(p.target, null);
  assert.equal(p.slots.length, 4); assert.equal(p.slots[0], 'waterPulse'); assert.equal(p.slots[1], 'recover');
  assert.equal(p.cooldowns.waterPulse, before); assert.equal(p.cooldowns.recover, 5);
  assert.equal(sim.command({ type: 'cast', slot: 0, x: 350, y: 560 }), false);
  assert.ok(ABILITIES[p.slots[0]].damage > ABILITIES.water.damage);
  for (let i = 0; i < 180; i++) sim.step(1 / 60);
  assert.equal(sim.command({ type: 'cast', slot: 0, x: 600, y: 560 }), true);
});
test('evolution during death does not resurrect and respawn retains the evolved species', () => {
  const sim = new Simulation(), p = sim.player; sim.gainXP(xpToLevel(p, 16) - 1);
  p.dead = true; p.hp = 0; p.respawnIn = .2; p.deathStart = 0;
  sim.gainXP(1); assert.equal(p.id, 'ivysaur'); assert.equal(p.dead, true); assert.equal(p.hp, 0);
  for (let i = 0; i < 20; i++) sim.step(1 / 60);
  assert.equal(p.dead, false); assert.equal(p.id, 'ivysaur'); assert.equal(p.hp, p.maxHp); assert.equal(p.evolutionHistory.length, 1);
});
test('XP curve remains finite beyond level 40 and progression has no maximum level', () => {
  const sim = new Simulation('bulbasaur'), p = sim.player;
  for (const level of [1,40,75,100,1000]) assert.ok(Number.isFinite(XP_CURVE[level]) && XP_CURVE[level] > 0);
  sim.gainXP(xpToLevel(p,75)+99);assert.equal(p.level,75);assert.equal(p.id,'venusaur');assert.equal(p.xp,99);
  assert.equal(p.evolutionHistory.at(-1).level, 32); assert.equal(xpToLevel(p, NaN), 0);
});
