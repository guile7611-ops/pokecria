import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ABILITIES} from '../public/data.js';
import {animationProfileFor,moveAnimationVisual,MOVE_AUDIO_FILES,SUPPORTED_MOVE_MOTIFS} from '../public/move-animation-profiles.js';
import {EXTERNAL_MOVE_VFX} from '../public/external-move-vfx.js';
import sharp from 'sharp';

test('every current move has an authored semantic animation profile',()=>{
 const moves=Object.values(ABILITIES),motifs=new Set();
 assert.equal(moves.length,361);
 for(const move of moves){
  const profile=animationProfileFor(move);assert.ok(SUPPORTED_MOVE_MOTIFS.has(profile.motif),move.id);motifs.add(profile.motif);
  if(move.id==='basic'){assert.equal(profile.fallback,true);assert.equal(moveAnimationVisual(move),null);continue;}
  const visual=moveAnimationVisual(move);assert.ok(visual.cast&&visual.travel&&visual.impact,move.id);assert.ok(visual.castSize>0&&visual.travelSize>0&&visual.impactSize>0,move.id);
 }
 assert.ok(motifs.size>=90,`expected a broad visual vocabulary, got ${motifs.size}`);
});

test('audio palette exists once on disk and the complete audit lists every move',()=>{
 const audioRoot=fileURLToPath(new URL('../public/assets/audio/moves/',import.meta.url));
 for(const file of new Set(Object.values(MOVE_AUDIO_FILES)))assert.ok(existsSync(`${audioRoot}${file}`),file);
 const audit=readFileSync(new URL('../docs/move-animation-coverage.md',import.meta.url),'utf8');
 const rows=audit.split('\n').filter(line=>/^\| .* \| `[^`]+` \|/.test(line));
 assert.equal(rows.length,Object.keys(ABILITIES).length);
 assert.match(audit,/EBDX/);assert.match(audit,/Pokémon Showdown/);assert.match(audit,/Gen 3/);
});

test('different combat behaviors retain different phase composition',()=>{
 const projectile=moveAnimationVisual(ABILITIES.hydroPump),melee=moveAnimationVisual(ABILITIES.iceFang),area=moveAnimationVisual(ABILITIES.earthquake),support=moveAnimationVisual(ABILITIES.recover),multi=moveAnimationVisual(ABILITIES.furySwipes);
 assert.equal(projectile.travel,'moves/hydroPump');assert.equal(melee.impact,'moves/iceFang');
 assert.notEqual(animationProfileFor(ABILITIES.earthquake).motif,animationProfileFor(ABILITIES.recover).motif);
 assert.notEqual(animationProfileFor(ABILITIES.furySwipes).motif,animationProfileFor(ABILITIES.hydroPump).motif);
 assert.ok(area.impactSize>melee.impactSize);assert.ok(support.castSize>0&&multi.impactSize>0);
});

test('exact external resources replace local effects without empty sheets',async()=>{
 const rows=Object.entries(EXTERNAL_MOVE_VFX);assert.equal(rows.length,233);assert.equal(rows.filter(([,row])=>row.source==='gen3').length,54);assert.equal(rows.filter(([,row])=>row.source==='ebdx').length,177);assert.equal(rows.filter(([,row])=>row.source==='gen9').length,2);assert.equal(rows.filter(([,row])=>row.audio).length,230);assert.equal(EXTERNAL_MOVE_VFX.earthquake.source,'ebdx');
 for(const [id,row] of rows){const path=fileURLToPath(new URL(`../public/assets/sprites/vfx/moves/${id}.png`,import.meta.url)),{data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true}),large=['surf','muddyWater'].includes(id);assert.equal(info.width,large?1024:512,id);assert.equal(info.height,large?128:64,id);let visible=0;for(let index=3;index<data.length;index+=4)if(data[index]>8)visible++;assert.ok(visible>info.width*info.height*.002,id);if(row.audio)assert.ok(existsSync(new URL(`../public/assets/audio/moves/external/${row.audio}`,import.meta.url)),row.audio);const visual=moveAnimationVisual(ABILITIES[id]);assert.equal(visual.travel,`moves/${id}`);assert.equal(visual.external,row.source);}
});

test('Surf and Muddy Water use distinct layered Gen 9 choreography',async()=>{
 assert.equal(animationProfileFor(ABILITIES.surf).motif,'surf');assert.equal(animationProfileFor(ABILITIES.muddyWater).motif,'muddyWater');
 for(const name of ['surfPool','muddyCurrent']){const {width,height}=await sharp(fileURLToPath(new URL(`../public/assets/sprites/vfx/moves/${name}.png`,import.meta.url))).metadata();assert.equal(width,1024);assert.equal(height,128);}
 const renderer=readFileSync(new URL('../public/renderer.js',import.meta.url),'utf8');assert.match(renderer,/surfVfx\(/);assert.match(renderer,/muddyWaterVfx\(/);assert.match(renderer,/shot\.ability==='muddyWater'/);
});

test('Earthquake uses its transparent EBDX field sheet instead of the opaque PMD fallback',async()=>{
 const visual=moveAnimationVisual(ABILITIES.earthquake);assert.equal(visual.impact,'moves/earthquake');assert.equal(visual.external,'ebdx');
 const path=fileURLToPath(new URL('../public/assets/sprites/vfx/moves/earthquake.png',import.meta.url)),{data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0,opaqueBlack=0;
 for(let index=0;index<data.length;index+=4){if(data[index+3]===0)transparent++;if(data[index]<5&&data[index+1]<5&&data[index+2]<5&&data[index+3]>240)opaqueBlack++;}
 assert.ok(transparent>info.width*info.height*.7);assert.equal(opaqueBlack,0);
});
