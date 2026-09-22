// Source: Pokémon Mystery Dungeon: Explorers of Sky / Attack Effects,
// https://www.spriters-resource.com/ds_dsi/pokemonmysterydungeonexplorersofsky/asset/85692/
// Input directories contain the numbered PNG frames from move_VFX/<id>/000/.
import sharp from 'sharp';
import {readdir,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {PMD_IDS} from '../public/pmd-attack-vfx.js';

const source=process.argv[2]||join(tmpdir(),'pmd-attack-selected');
const target=new URL('../public/assets/sprites/vfx/pmd/',import.meta.url);
const ids=PMD_IDS;
await mkdir(target,{recursive:true});
for(const id of ids){
 const files=(await readdir(join(source,id))).filter(file=>/^\d{3}\.png$/.test(file)).sort();
 if(!files.length)throw Error(`Frames de ${id} ausentes`);
 const selected=Array.from({length:8},(_,index)=>files[Math.round(index*(files.length-1)/7)]);
 const dimensions=await Promise.all(selected.map(file=>sharp(join(source,id,file)).metadata()));
 const max=Math.max(...dimensions.flatMap(meta=>[meta.width,meta.height]));
 const scale=Math.min(60/max,Math.max(1,34/max));
 const frames=[];
 for(const [index,file]of selected.entries()){
  const meta=dimensions[index],width=Math.min(60,Math.max(1,Math.round(meta.width*scale))),height=Math.min(60,Math.max(1,Math.round(meta.height*scale)));
  const pixels=await sharp(join(source,id,file)).resize(width,height,{kernel:'nearest'}).png().toBuffer();
  frames.push({input:pixels,left:index*64+Math.floor((64-width)/2),top:Math.floor((64-height)/2)});
 }
 await sharp({create:{width:512,height:64,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toFile(fileURLToPath(new URL(`${id}.png`,target)));
 console.log(`PMD ${id}: ${files.length} frames → 8 quadros`);
}
