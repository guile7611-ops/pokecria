import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {MATERIALS,OBJECT_PROPERTIES,transitionAlpha} from '../public/tilemap.js';
await mkdir('public/assets/tilesets',{recursive:true});
for(let material=0;material<16;material++){
 const name=MATERIALS[material],dir=`public/assets/tilesets/${name}`;await mkdir(dir,{recursive:true});const textures=[];
 for(let v=0;v<4;v++){const raw=await sharp(`public/assets/source/tiles/${name}_${String(v+1).padStart(2,'0')}.png`).resize(32,32,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();textures.push(raw);}
 // Common opposite edges make every variant connect without seams.
 for(const data of textures)for(let i=0;i<32;i++)for(let c=0;c<4;c++){const h=textures[0][(16*32+i)*4+c],v=textures[0][(i*32+16)*4+c];data[i*4+c]=data[(31*32+i)*4+c]=h;data[(i*32)*4+c]=data[(i*32+31)*4+c]=v;}
 for(let v=0;v<4;v++)await sharp(textures[v],{raw:{width:32,height:32,channels:4}}).png().toFile(`${dir}/${name}_${String(v+1).padStart(2,'0')}.png`);
 const buffer=Buffer.alloc(512*512*4);
 for(let mask=0;mask<256;mask++)for(let y=0;y<32;y++)for(let x=0;x<32;x++){const from=(y*32+x)*4,to=((Math.floor(mask/16)*32+y)*512+(mask%16)*32+x)*4; textures[0].copy(buffer,to,from,from+3);buffer[to+3]=transitionAlpha(mask,x,y);}
 await sharp(buffer,{raw:{width:512,height:512,channels:4}}).png().toFile(`${dir}/transitions.png`);
}
await mkdir('public/assets/sprites/objects',{recursive:true});
const manifest={tileSize:32,objects:{},materials:MATERIALS,source:'Individual PNG sources; normalized by tools/import-art.mjs. No environment atlas extraction.'};
for(const [kind,d]of Object.entries(OBJECT_PROPERTIES)){
 const sprite=await sharp(`public/assets/source/objects/${kind}.png`).trim({threshold:8}).resize(d.width,d.height,{fit:'contain',position:'bottom',background:'#00000000',kernel:'nearest'}).png().toBuffer();
 await writeFile(`public/assets/sprites/objects/${kind}.png`,sprite);manifest.objects[kind]={...d,src:`/assets/sprites/objects/${kind}.png`,pivot:[d.width/2,d.height]};
}
await mkdir('public/assets/sprites/structures',{recursive:true});
// Reusable raster modules extracted from the finished cottage prefab.
for(const [name,left,top,width,height]of [['roof',16,8,96,48],['wall',16,65,32,32],['door',48,102,32,48],['window',16,85,24,24],['chimney',8,0,24,64]])await sharp('public/assets/sprites/objects/house.png').extract({left,top,width,height}).png().toFile(`public/assets/sprites/structures/${name}.png`);
await mkdir('public/assets/sprites/vfx',{recursive:true});
const vm=await sharp('public/assets/source/vfx.png').metadata(),names=['slash','impact','leaf','explosion','heal','buff','debuff','fire','water','wind','earth','energy','teleport','evolution','campfire','waterfall'];
for(let r=0;r<16;r++){
 const frames=[];for(let f=0;f<8;f++){const cw=vm.width/8,ch=vm.height/16;const input=await sharp('public/assets/source/vfx.png').extract({left:Math.floor(f*cw),top:Math.floor(r*ch),width:Math.floor(cw),height:Math.floor(ch)}).resize(64,64,{kernel:'nearest'}).png().toBuffer();frames.push({input,left:f*64,top:0});}
 await sharp({create:{width:512,height:64,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toFile(`public/assets/sprites/vfx/${names[r]}.png`);
}
await sharp('public/assets/sprites/vfx/waterfall.png').extract({left:192,top:0,width:64,height:64}).resize(128,152,{kernel:'nearest'}).png().toFile('public/assets/sprites/objects/waterfall.png');
manifest.effects=Object.fromEntries(names.map(n=>[n,{src:`/assets/sprites/vfx/${n}.png`,width:64,height:64,frames:8,pivot:[32,32],fps:12}]));
await writeFile('public/assets/art-manifest.json',JSON.stringify(manifest,null,2));
console.log('Imported 64 terrain tiles, 4096 transition tiles, '+Object.keys(manifest.objects).length+' objects, 5 structure modules and 128 VFX frames.');
