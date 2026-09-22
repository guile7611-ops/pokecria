import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {STARTER_ATTACKS,starterAttackVisual} from '../public/starter-attack-vfx.js';
import {Simulation} from '../public/simulation.js';
import {ABILITIES} from '../public/data.js';

test('all nine starter lines retain their distinct sheets and selected PMD effects load',async()=>{
 const hashes=new Set();let count=0;
 for(const [species,moves] of Object.entries(STARTER_ATTACKS))for(const move of moves){
  const visual=starterAttackVisual(species,move);assert.ok(visual);
  for(const phase of ['cast','travel','impact']){
   const ownPath=`starters/${species}/${move}-${phase}`;
   const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${ownPath}.png`,import.meta.url));
   const meta=await sharp(bytes).metadata();assert.equal(meta.width,512);assert.equal(meta.height,64);
   hashes.add(createHash('sha256').update(bytes).digest('hex'));count++;
   const used=await sharp(await readFile(new URL(`../public/assets/sprites/vfx/${visual[phase]}.png`,import.meta.url))).metadata();assert.equal(used.width,512);assert.equal(used.height,64);
  }
 }
 assert.equal(Object.keys(STARTER_ATTACKS).length,9);
 assert.equal(count,135);assert.equal(hashes.size,count);
 assert.notEqual(starterAttackVisual('charmander','ember').travel,starterAttackVisual('charmander','flamethrower').travel);
 assert.notEqual(starterAttackVisual('charmander','flamethrower').impact,starterAttackVisual('charmander','inferno').impact);
 assert.equal(starterAttackVisual('bulbasaur','leaf').travel,'pmd/0129');
 assert.equal(starterAttackVisual('mudkip','whirlpool').impact,'pmd/0058');
});

test('Ember casts two distinct moving flames without a generic explosion',()=>{
 const sim=new Simulation('charmander'),foe=sim.enemies[0];
 Object.assign(foe,{x:sim.player.x+60,y:sim.player.y,home:{x:sim.player.x+60,y:sim.player.y},hp:500,maxHp:500,state:'Idle',defeated:false});
 assert.ok(sim.command({type:'cast',slot:0,x:foe.x,y:foe.y}));
 assert.equal(sim.projectiles.length,2);assert.equal(sim.projectiles[0].visual.travel,'pmd/0053');
 assert.notEqual(sim.projectiles[0].vy,sim.projectiles[1].vy);
 assert.ok(sim.events.some(event=>event.type==='castVisual'&&event.vfx==='starters/charmander/ember-cast'));
 for(let i=0;i<15;i++)sim.step(.05);
 assert.equal(sim.events.some(event=>event.type==='impact'&&event.vfx==='starters/charmander/ember-impact'),false);
});

test('all Fire moves use curated PMD sheets and Inferno animates its persistent zone',async()=>{
 const fire=Object.values(ABILITIES).filter(move=>move.type==='Fire');
 assert.equal(fire.length,8);
 for(const move of fire){
  assert.match(move.vfx,/^pmd\/\d{4}$/);
  const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${move.vfx}.png`,import.meta.url));
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,512);assert.equal(meta.height,64);
 }
 const sim=new Simulation('charmander');
 assert.equal(starterAttackVisual('charmander','inferno').impact,'pmd/0028');
 assert.ok(sim.cast(ABILITIES.inferno,{x:sim.player.x+50,y:sim.player.y}));
 assert.equal(sim.zones[0].visual.impact,'pmd/0028');
});
