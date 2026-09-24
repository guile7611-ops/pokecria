import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ABILITIES} from '../public/data.js';
import {moveAnimationVisual,PRIORITY_MOVE_IDS} from '../public/move-animation-profiles.js';
import {Simulation} from '../public/simulation.js';

const ids=['leaf','ember','hydroCannon','aquaWave','solarSeed','flame','fireBlast','waterPulse'];

test('oito golpes prioritários usam fases grandes, próprias e distintas',async()=>{
 assert.deepEqual([...PRIORITY_MOVE_IDS],ids);
 const hashes=new Set();
 for(const id of ids){
  const visual=moveAnimationVisual(ABILITIES[id]);
  assert.equal(visual.bespoke,true,id);
  for(const phase of ['cast','travel','impact']){
   assert.equal(visual[phase],`priority/${id}-${phase}`);
   const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${visual[phase]}.png`,import.meta.url));
   const meta=await sharp(bytes).metadata();
   assert.equal(meta.width,512,`${id} ${phase}`);assert.equal(meta.height,64,`${id} ${phase}`);
   hashes.add(createHash('sha256').update(bytes).digest('hex'));
  }
 }
 assert.equal(hashes.size,ids.length*3);
 assert.ok(moveAnimationVisual(ABILITIES.hydroCannon).impactSize>=200);
 assert.ok(moveAnimationVisual(ABILITIES.fireBlast).impactSize>=170);
 assert.equal(ABILITIES.flame.pellets,1);
 assert.equal(ABILITIES.fireBlast.pellets,1);
 assert.ok(ABILITIES.fireBlast.splashRadius>=60);
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
