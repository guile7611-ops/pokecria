import sharp from 'sharp';
import {copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=resolve(root,'public/assets/source/move-vfx/gen9');
const output=resolve(root,'public/assets/sprites/vfx/moves');
const audioOutput=resolve(root,'public/assets/audio/moves/external');
const transparent={r:0,g:0,b:0,alpha:0};

async function spriteFrame(path,{texture=false,frame=0}){
 const progress=(frame+1)/8,fade=frame===7?.58:1;
 if(texture){
  const image=await sharp(path).extract({left:0,top:524,width:610,height:627}).resize(128,128,{fit:'cover',kernel:'nearest'}).png().toBuffer();
  const rx=45+progress*17,ry=20+progress*15;
  const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><ellipse cx="64" cy="67" rx="${rx}" ry="${ry}" fill="white" opacity="${fade}"/><ellipse cx="64" cy="67" rx="${Math.max(1,rx-7)}" ry="${Math.max(1,ry-5)}" fill="none" stroke="white" stroke-width="2" opacity="${Math.max(.15,.72-frame*.07)}"/></svg>`);
  return sharp({create:{width:128,height:128,channels:4,background:transparent}}).composite([
   {input:image,left:0,top:0},
   {input:mask,blend:'dest-in'}
  ]).png().toBuffer();
 }
 const crestMask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="325" height="170"><path d="M30 130 C62 118 58 91 94 73 C126 57 139 18 197 6 C230 0 252 27 250 55 C278 69 291 101 325 112 L325 145 L30 145 Z" fill="white"/></svg>');
 const isolated=await sharp(path).extract({left:285,top:0,width:325,height:170}).composite([{input:crestMask,blend:'dest-in'}]).png().toBuffer();
 const crest=await sharp(isolated).trim({background:transparent}).resize({width:116+Math.round(progress*12),height:58+Math.round(progress*8),fit:'fill',kernel:'nearest'}).modulate({brightness:1+.05*Math.sin(progress*Math.PI)}).png().toBuffer();
 const meta=await sharp(crest).metadata(),lift=Math.round(Math.sin(progress*Math.PI)*8);
 return sharp({create:{width:128,height:128,channels:4,background:transparent}}).composite([{input:crest,left:128-meta.width,top:36-lift,opacity:fade}]).png().toBuffer();
}

async function sheet(sourceName,targetName,texture=false){
 const path=resolve(source,sourceName),frames=[];
 for(let frame=0;frame<8;frame++)frames.push(await spriteFrame(path,{texture,frame}));
 await sharp({create:{width:1024,height:128,channels:4,background:transparent}}).composite(frames.map((input,index)=>({input,left:index*128,top:0}))).png().toFile(resolve(output,targetName));
}

await mkdir(output,{recursive:true});await mkdir(audioOutput,{recursive:true});
await sheet('PRAS- Surf FG Opp.png','surf.png');
await sheet('PRAS- Surf FG Opp.png','surfPool.png',true);
await sheet('PRAS- Muddy Water FG Opp.png','muddyWater.png');
await sheet('PRAS- Muddy Water FG Opp.png','muddyCurrent.png',true);
await copyFile(resolve(source,'PRSFX- Surf.wav'),resolve(audioOutput,'gen9-surf.wav'));
await copyFile(resolve(source,'PRSFX- Muddy Water.wav'),resolve(audioOutput,'gen9-muddy-water.wav'));
console.log('Built layered Gen 9 Surf and Muddy Water effects.');
