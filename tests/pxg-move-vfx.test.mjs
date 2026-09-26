import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {ABILITIES} from '../public/data.js';
import {PXG_MOVE_VFX,PXG_MOVE_IDS} from '../public/pxg-attack-vfx.js';
import {moveAnimationVisual} from '../public/move-animation-profiles.js';

test('the validated PXG catalog registers all 109 mapped moves',()=>{
 assert.equal(PXG_MOVE_IDS.size,109);
 for(const id of PXG_MOVE_IDS){
  assert.ok(ABILITIES[id],id);
  const visual=moveAnimationVisual(ABILITIES[id]);
  assert.ok(visual?.cast&&visual?.travel&&visual?.impact,id);
  if(id!=='earthquake')assert.equal(visual.external,'pxg-2026',id);
 }
});

test('every selected PXG phase is an eight-frame transparent sheet',async()=>{
 const paths=new Set(Object.values(PXG_MOVE_VFX).flatMap(move=>[move.cast,move.travel,move.impact]));
 assert.ok(paths.size>=100);
 for(const path of paths){
  const bytes=await readFile(new URL(`../public/assets/sprites/vfx/${path}.png`,import.meta.url));
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,512,path);
  assert.equal(meta.height,64,path);
  assert.equal(meta.hasAlpha,true,path);
 }
});
