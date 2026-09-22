import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {SPRITE_DEFINITIONS} from '../public/sprite-data.js';
const grounding={};
for(const [id,d]of Object.entries(SPRITE_DEFINITIONS)){
 grounding[id]={};if(['pidgey','pidgeotto','pidgeot','butterfree','beedrill'].includes(id))continue;
 for(const state of ['Idle','Walk']){const a=d.animations[state],{data,info}=await sharp('public'+a.src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  grounding[id][state]=Array.from({length:a.rows},(_,row)=>Array.from({length:a.columns},(_,col)=>{
   for(let y=a.frameHeight-1;y>=0;y--){let count=0;for(let x=0;x<a.frameWidth;x++)if(data[((row*a.frameHeight+y)*info.width+col*a.frameWidth+x)*4+3]>100)count++;if(count>=3)return y+1;}return a.pivots[row][col].y;
  }));
 }
}
await writeFile('public/sprite-grounding.js','// Generated from opaque foot rows by tools/ground-sprites.mjs.\nexport const GROUNDING='+JSON.stringify(grounding)+';\n');
