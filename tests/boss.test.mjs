import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../public/simulation.js';
import {DEFAULT_BOSS_ATTACKS,REGIONAL_BOSSES,prepareBossAttack,bossAttackHits} from '../public/boss-attacks.js';
import {findPath,walkable} from '../public/world.js';
import {existsSync} from 'node:fs';

test('forest boss cycles through its own four animated attacks',()=>{
 const sim=new Simulation(),b=sim.boss,p=sim.player;sim.enemies=[b];p.x=b.x-40;p.y=b.y;p.hp=p.maxHp=100000;
 tick(sim,12);const casts=sim.events.filter(e=>e.type==='bossTelegraph');
 assert.deepEqual(casts.slice(0,4).map(e=>e.id),['root-ring','thorn-fan','solar-lance','spore-bloom']);
 assert.ok(casts.slice(0,4).every(e=>e.name));
 assert.ok(sim.events.filter(e=>e.type==='bossImpact').length>=4);
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

test('the five regional bosses have unique positions, four visible attacks and six guards',()=>{
 const sim=new Simulation(),bosses=sim.enemies.filter(e=>e.isBoss);
 assert.equal(bosses.length,5);
 assert.equal(new Set(bosses.map(b=>b.uid)).size,5);
 for(const [poiId,variant] of Object.entries(REGIONAL_BOSSES)){
  const boss=bosses.find(e=>e.uid===variant.uid),poi=sim.map.pois.find(p=>p.id===poiId);
  assert.ok(boss&&poi,poiId);
  assert.equal(boss.id,variant.id);
  assert.equal(boss.attacks.length,4);
  assert.equal(new Set(boss.attacks.map(a=>a.id)).size,4);
  assert.ok(walkable(sim.map,boss.x,boss.y,boss.radius),`${poiId} is accessible`);
  const guards=sim.enemies.filter(e=>e.bossUid===boss.uid);
  assert.equal(guards.length,6);
  assert.ok(guards.every(e=>e.level<boss.level),`${poiId} is stronger than its guards`);
  for(const attack of boss.attacks)assert.ok(existsSync(new URL(`../public/assets/sprites/vfx/${attack.vfx}.png`,import.meta.url)),`${attack.id} needs a visible effect`);
 }
 for(const [id,from] of [['arena-mar','lago'],['arena-granito','vale'],['arena-astral','jardim']]){
  const boss=sim.map.pois.find(p=>p.id===id),approach=sim.map.pois.find(p=>p.id===from);
  assert.ok(findPath(sim.map,approach,boss,11,{maxPathNodes:12000}).length,`${id} must connect to its regional route`);
 }
});

test('Blastoise, Tyranitar and Gardevoir cycle through their distinct telegraphed attacks',()=>{
 for(const species of ['blastoise','tyranitar','gardevoir']){
  const sim=new Simulation(),boss=sim.enemies.find(e=>e.isBoss&&e.id===species),p=sim.player;
  sim.enemies=[boss];sim.streamCreatures=()=>{};
  p.x=boss.x-45;p.y=boss.y;p.hp=p.maxHp=100000;
  tick(sim,13);
  const attacks=sim.events.filter(e=>e.type==='bossTelegraph').slice(0,4);
  assert.deepEqual(attacks.map(e=>e.id),boss.attacks.map(a=>a.id),species);
  assert.ok(sim.events.filter(e=>e.type==='bossImpact').length>=4,species);
 }
});

test('distant boss guards free encounter slots and return beside their boss',()=>{
 const sim=new Simulation(),boss=sim.enemies.find(e=>e.id==='blastoise');
 sim.streamCreatures();
 assert.equal(sim.enemies.some(e=>e.bossUid===boss.uid),false);
 Object.assign(sim.player,{x:boss.x-100,y:boss.y});
 sim.streamCreatures();
 assert.equal(sim.enemies.filter(e=>e.bossUid===boss.uid).length,6);
 assert.ok(sim.enemies.length<=48);
});

test('regional boss has phases and telegraphs an area attack before damage', () => {
  const sim = new Simulation(), boss = sim.boss, p = sim.player;
  p.x = boss.x - 40; p.y = boss.y; p.hp=p.maxHp=10000; sim.command({ type: 'target', id: boss.uid });
  tick(sim, .1);
  assert.ok(boss.telegraph); assert.equal(boss.phase, 1);
  const hpBefore = p.hp; tick(sim, 1.4); assert.ok(p.hp < hpBefore); assert.ok(sim.events.some(e => e.type === 'bossImpact'));
  boss.hp = boss.maxHp * .65; tick(sim, .7); assert.equal(boss.phase, 2);
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
 sim.enemies=[boss]; sim.streamCreatures=()=>{}; const original = p.hp; sim.command({ type: 'move', x: boss.x - 180, y: boss.y }); tick(sim, 1.5);
  assert.equal(p.hp, original); assert.ok(sim.events.some(e => e.type === 'bossImpact'));
});

