import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ABILITIES} from '../public/data.js';
import {moveAnimationVisual,PRIORITY_MOVE_IDS} from '../public/move-animation-profiles.js';
import {PXG_MOVE_IDS} from '../public/pxg-attack-vfx.js';
import {Simulation} from '../public/simulation.js';

const ids=['leaf','ember','hydroCannon','aquaWave','solarSeed','flame','fireBlast','waterPulse','vineBurst','smokescreen','fireSpin','bite','iceFang','sandAttack','mudSlap','mudShot','blazeKick','rockThrow','poisonSting','sleepPowder','stunSpore'];

test('golpes prioritários preservam autoria própria ou recebem a substituição PXG catalogada',async()=>{
 assert.deepEqual([...PRIORITY_MOVE_IDS],ids);
 const hashes=new Set();
 for(const id of ids){
  const visual=moveAnimationVisual(ABILITIES[id]);
  if(PXG_MOVE_IDS.has(id))assert.equal(visual.external,'pxg-2026',id);
  else assert.equal(visual.bespoke,true,id);
  for(const phase of ['cast','travel','impact']){
   if(!PXG_MOVE_IDS.has(id))assert.equal(visual[phase],`priority/${id}-${phase}`);
   const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${visual[phase]}.png`,import.meta.url));
   const meta=await sharp(bytes).metadata();
   assert.equal(meta.width,512,`${id} ${phase}`);assert.equal(meta.height,64,`${id} ${phase}`);
   hashes.add(createHash('sha256').update(bytes).digest('hex'));
  }
 }
 assert.ok(hashes.size>=30);
 assert.ok(moveAnimationVisual(ABILITIES.hydroCannon).impactSize>=100);
 assert.ok(moveAnimationVisual(ABILITIES.fireBlast).impactSize>=100);
 assert.equal(ABILITIES.flame.pellets,1);
 assert.equal(ABILITIES.fireBlast.pellets,1);
 assert.ok(ABILITIES.fireBlast.splashRadius>=60);
 assert.equal(ABILITIES.smokescreen.behavior,'buff');
 assert.ok(ABILITIES.smokescreen.range>=350);
 assert.ok(ABILITIES.smokescreen.radius>=160);
 assert.equal(ABILITIES.blazeKick.behavior,'direct');
 assert.equal(ABILITIES.mudShot.behavior,'projectile');
 assert.equal(ABILITIES.rockThrow.behavior,'projectile');
 assert.equal(ABILITIES.poisonSting.behavior,'projectile');
 assert.equal(ABILITIES.sleepPowder.behavior,'debuff');
 assert.equal(ABILITIES.stunSpore.behavior,'debuff');
});

test('impactos locais informam o golpe para usar a coreografia correta',()=>{
 for(const [starter,id] of [['bulbasaur','leaf'],['charmander','ember'],['squirtle','waterPulse']]){
  const sim=new Simulation(starter),foe=sim.enemies[0],ability=ABILITIES[id];
  Object.assign(foe,{x:sim.player.x+55,y:sim.player.y,home:{x:sim.player.x+55,y:sim.player.y},hp:999,maxHp:999,state:'Idle',defeated:false});
  sim.player.knownMoves.push(id);sim.player.slots[0]=id;sim.player.cooldowns={};
  assert.ok(sim.cast(ability,{x:foe.x,y:foe.y}));
  for(let i=0;i<40&&!sim.events.some(e=>e.type==='impact');i++)sim.step(.025);
  if(id!=='ember')assert.ok(sim.events.some(event=>event.type==='impact'&&event.ability===id),id);
 }
});

test('golpes corpo a corpo e a cortina informam a identidade visual',()=>{
 const sim=new Simulation('totodile'),foe=sim.enemies[0];
 Object.assign(foe,{x:sim.player.x+55,y:sim.player.y,home:{x:sim.player.x+55,y:sim.player.y},hp:999,maxHp:999,state:'Idle',defeated:false});
 sim.player.knownMoves.push('iceFang');sim.player.slots[0]='iceFang';sim.player.cooldowns={};
 assert.ok(sim.cast(ABILITIES.iceFang,{x:foe.x,y:foe.y,targetId:foe.uid}));
 assert.ok(sim.events.some(event=>event.type==='slash'&&event.ability==='iceFang'&&event.vfx===moveAnimationVisual(ABILITIES.iceFang).impact));
 sim.player.cooldowns={};sim.player.knownMoves.push('smokescreen');sim.player.slots[0]='smokescreen';
 assert.ok(sim.cast(ABILITIES.smokescreen,{x:foe.x,y:foe.y}));
 assert.ok(sim.events.some(event=>event.type==='buff'&&event.ability==='smokescreen'&&event.size>=320));
});
