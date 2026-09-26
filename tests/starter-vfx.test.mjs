import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {STARTER_ATTACKS,starterAttackVisual} from '../public/starter-attack-vfx.js';
import {Simulation} from '../public/simulation.js';
import {ABILITIES} from '../public/data.js';
import {moveAnimationVisual} from '../public/move-animation-profiles.js';

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

test('Ember keeps its two-projectile gameplay while using the cataloged PXG phases',()=>{
 const sim=new Simulation('charmander'),foe=sim.enemies[0];
 Object.assign(foe,{x:sim.player.x+60,y:sim.player.y,home:{x:sim.player.x+60,y:sim.player.y},hp:500,maxHp:500,state:'Idle',defeated:false});
 assert.ok(sim.command({type:'cast',slot:0,x:foe.x,y:foe.y}));
 const visual=moveAnimationVisual(ABILITIES.ember);
 assert.equal(sim.projectiles.length,2);assert.equal(sim.projectiles[0].visual.travel,visual.travel);
 assert.equal(sim.projectiles.every(projectile=>projectile.visual.impact===visual.impact),true);
 assert.notEqual(sim.projectiles[0].vy,sim.projectiles[1].vy);
 assert.ok(sim.events.some(event=>event.type==='castVisual'&&event.vfx===visual.cast));
 for(let i=0;i<15;i++)sim.step(.05);
});

test('legacy Fire moves resolve to valid PXG, PMD or authored sheets and Inferno keeps its zone',async()=>{
 const legacyIds=['ember','flame','fireBlast','flamethrower','inferno','fireSpin','flameWheel','flameCharge','heatCrash','flareBlitz'];
 const fire=legacyIds.map(id=>ABILITIES[id]);
 assert.ok(fire.length>=10);
 for(const move of fire){
  assert.match(move.vfx,/^(pxg\/(?:effect|missile)-\d{4}|pmd\/\d{4}|moves\/[A-Za-z0-9]+)$/);
  const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${move.vfx}.png`,import.meta.url));
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,512);assert.equal(meta.height,64);
 }
 assert.equal(ABILITIES.blazeKick.vfx,'moves/blazeKick');
 const sim=new Simulation('charmander');
 assert.equal(starterAttackVisual('charmander','inferno').impact,'pmd/0028');
 assert.ok(sim.cast(ABILITIES.inferno,{x:sim.player.x+50,y:sim.player.y}));
 assert.equal(sim.zones[0].visual.impact,'moves/inferno');
});
