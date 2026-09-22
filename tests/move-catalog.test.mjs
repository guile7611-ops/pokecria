import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ABILITIES,XP_CURVE} from '../public/data.js';
import {MOVE_CATALOG} from '../public/move-catalog.js';
import {Simulation} from '../public/simulation.js';
import {PMD_MOVE_SPRITES} from '../public/pmd-attack-vfx.js';

test('every move has its own eight-frame PNG sheet',async()=>{
 const hashes=new Set();
 for(const move of Object.values(ABILITIES)){
  if(move.id==='basic')continue;
  assert.equal(move.vfx,PMD_MOVE_SPRITES[move.id]?`pmd/${PMD_MOVE_SPRITES[move.id]}`:`moves/${move.id}`);
  const bytes=await readFile(new URL(`../public/assets/sprites/vfx/moves/${move.id}.png`,import.meta.url));
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,512,move.id);assert.equal(meta.height,64,move.id);
  const active=await sharp(await readFile(new URL(`../public/assets/sprites/vfx/${move.vfx}.png`,import.meta.url))).metadata();
  assert.equal(active.width,512,move.id);assert.equal(active.height,64,move.id);
  hashes.add(createHash('sha256').update(bytes).digest('hex'));
 }
 assert.equal(hashes.size,Object.keys(ABILITIES).length-1);
 assert.ok(MOVE_CATALOG.length>=20);
 assert.ok(MOVE_CATALOG.some(move=>move.source==='HM'));
});

test('catalog moves stay unavailable before an acquisition system exists',()=>{
 const sim=new Simulation('charmander');
 assert.equal(sim.equipMove('thunderbolt',0),false);
 assert.equal(sim.command({type:'cast',slot:0,x:sim.player.x+50,y:sim.player.y}),true);
 assert.equal(sim.player.knownMoves.includes('thunderbolt'),false);
});

test('Flame Wheel remains attached to a moving Pokémon and damages by contact at intervals',()=>{
 const sim=new Simulation('cyndaquil');
 while(sim.player.level<10)sim.gainXP(XP_CURVE[sim.player.level]);
 sim.player.knownMoves.push('flameWheel');assert.equal(sim.equipMove('flameWheel',2),true);
 const foe=sim.enemies[0];Object.assign(foe,{x:sim.player.x+20,y:sim.player.y,maxHp:500,hp:500,defense:0,state:'Idle',defeated:false});
 assert.equal(sim.command({type:'cast',slot:2,x:foe.x,y:foe.y}),true);
 assert.equal(foe.hp,500);
 sim.step(.05);const afterHit=foe.hp;assert.ok(afterHit<500);
 sim.step(.05);assert.equal(foe.hp,afterHit);
 for(let i=0;i<10;i++)sim.step(.05);
 assert.ok(foe.hp<afterHit);
 for(let i=0;i<80;i++)sim.step(.05);
 assert.equal(sim.player.buffs.some(b=>b.id==='flameWheel'),false);
});
