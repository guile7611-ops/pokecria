import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../public/simulation.js';
import {DEFAULT_BOSS_ATTACKS,prepareBossAttack,bossAttackHits} from '../public/boss-attacks.js';

test('forest boss cycles through its own three animated attacks',()=>{
 const sim=new Simulation(),b=sim.boss,p=sim.player;sim.enemies=[b];p.x=b.x-40;p.y=b.y;p.hp=p.maxHp=100000;
 tick(sim,8);const casts=sim.events.filter(e=>e.type==='bossTelegraph');
 assert.deepEqual(casts.slice(0,3).map(e=>e.id),['root-ring','thorn-fan','solar-lance']);
 assert.ok(casts.slice(0,3).every(e=>e.name));
 assert.ok(sim.events.filter(e=>e.type==='bossImpact').length>=3);
});
test('telegraphs lock the target and each shape has a safe escape direction',()=>{
 const b={x:0,y:0,attack:20},p={x:40,y:0};
 for(const definition of DEFAULT_BOSS_ATTACKS){const a=prepareBossAttack(b,p,1);assert.equal(a.id,definition.id);assert.ok(bossAttackHits(a,p));assert.equal(bossAttackHits(a,{x:-150,y:150}),false);
  if(a.shape!=='circle'){assert.equal(bossAttackHits(a,{x:-20,y:0}),false);assert.equal(bossAttackHits(a,{x:40,y:100}),false);}
  const snapshot={...a};p.y=1;assert.deepEqual(a,snapshot);p.y=0;
 }
});
test('defeating a boss cancels its pending attack and animation',()=>{
 const sim=new Simulation(),b=sim.boss;sim.player.x=b.x-40;sim.player.y=b.y;tick(sim,.1);assert.ok(b.telegraph);sim.damage(b,99999);assert.equal(b.telegraph,null);assert.equal(b.attackVfx,null);
});

const tick = (sim, seconds) => { for (let i = 0; i < seconds * 60; i++) sim.step(1 / 60); };

test('regional boss has phases and telegraphs an area attack before damage', () => {
  const sim = new Simulation(), boss = sim.boss, p = sim.player;
  p.x = boss.x - 40; p.y = boss.y; sim.command({ type: 'target', id: boss.uid });
  tick(sim, .1);
  assert.ok(boss.telegraph); assert.equal(boss.phase, 1);
  const hpBefore = p.hp; tick(sim, .95); assert.ok(p.hp < hpBefore); assert.ok(sim.events.some(e => e.type === 'bossImpact'));
  boss.hp = boss.maxHp * .65; tick(sim, .1); assert.equal(boss.phase, 2);
  boss.hp = boss.maxHp * .3; tick(sim, .1); assert.equal(boss.phase, 3); assert.ok(boss.telegraph?.radius >= 100 || boss.cooldown > 0);
});

test('boss defeat grants reward once and respawns after its long timer', () => {
  const sim = new Simulation(), boss = sim.boss, p = sim.player;
  const xpBefore = p.xp; boss.hp = 1; sim.damage(boss, 9999);
  assert.equal(boss.defeated, true); assert.equal(boss.state, 'Dead'); assert.equal(sim.kills, 1); assert.ok(p.xp > xpBefore); assert.equal(sim.events.filter(e => e.type === 'bossDefeated').length, 1);
  sim.damage(boss, 9999); assert.equal(sim.events.filter(e => e.type === 'bossDefeated').length, 1);
  tick(sim, 44); assert.equal(boss.state, 'Dead'); tick(sim, 2); assert.equal(boss.state, 'Idle'); assert.equal(boss.hp, boss.maxHp); assert.equal(boss.phase, 1);
});

test('boss telegraph can be avoided by moving after it is announced', () => {
  const sim = new Simulation(), boss = sim.boss, p = sim.player;
  p.x = boss.x - 40; p.y = boss.y; sim.command({ type: 'target', id: boss.uid }); tick(sim, .1); assert.ok(boss.telegraph);
  sim.enemies=[boss]; const original = p.hp; sim.command({ type: 'move', x: boss.x + 180, y: boss.y + 150 }); tick(sim, 1.1);
  assert.equal(p.hp, original); assert.ok(sim.events.some(e => e.type === 'bossImpact'));
});

