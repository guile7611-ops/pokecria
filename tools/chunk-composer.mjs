import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {tileAt,MATERIALS,transitionAlpha,objectDefinition} from '../public/tilemap.js';
import {createMap} from '../public/world.js';
import {createInterior} from '../public/collisions.js';
const assets=new Map();
async function loadAssets(res){if(!assets.has(res))assets.set(res,(async()=>{const tiles=[];for(const name of MATERIALS){const variants=[];for(let v=1;v<=4;v++)variants.push(await sharp(`public/assets/tilesets/${name}/${name}_${String(v).padStart(2,'0')}.png`).resize(res,res,{kernel:res===32?'nearest':'linear'}).ensureAlpha().raw().toBuffer());tiles.push(variants);}return tiles;})());return assets.get(res);}
const objectCache=new Map();
async function objectPixels(kind,scale){const key=kind+':'+scale;if(!objectCache.has(key)){const d=objectDefinition({kind});objectCache.set(key,sharp(`public/assets/sprites/objects/${kind}.png`).resize(Math.max(1,Math.round(d.width*scale)),Math.max(1,Math.round(d.height*scale)),{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true}));}return objectCache.get(key);}
function stamp(dest,width,height,source,sw,sh,left,top,clipLeft=0,clipRight=width){for(let y=Math.max(0,-top);y<sh&&top+y<height;y++)for(let x=Math.max(0,clipLeft-left);x<sw&&left+x<clipRight;x++){const si=(y*sw+x)*4,di=((top+y)*width+left+x)*4,a=source[si+3]/255;if(a===0)continue;for(let c=0;c<3;c++)dest[di+c]=Math.round(source[si+c]*a+dest[di+c]*(1-a));dest[di+3]=255;}}
const completed=new Map(),inFlight=new Map();let active=0;const waiting=[];
async function acquire(){if(active>=2)await new Promise(r=>waiting.push(r));active++;}
function release(){active--;waiting.shift()?.();}
export async function composeChunk({seed,cx,cy,lod=0,layer='ground',scene=''}){
 const key=[seed,cx,cy,lod,layer,scene].join(':');if(completed.has(key)){const v=completed.get(key);completed.delete(key);completed.set(key,v);return v;}if(inFlight.has(key))return inFlight.get(key);
 const job=(async()=>{await acquire();try{
  const world=createMap(seed),source=scene&&world.interactions.find(p=>p.id===scene);if(scene&&!source)throw new Error('Unknown scene');const map=source?createInterior(source,seed):world;
  if(cx<0||cy<0||cx>=Math.ceil(map.cols/24)||cy>=Math.ceil(map.rows/24))throw new Error('Invalid chunk');
  const res=lod===0?32:lod===1?8:4;const tiles=await loadAssets(res),side=res*24,sheet=Buffer.alloc(side*4*side*4),descriptor=[];
  for(let y=0;y<24;y++)for(let x=0;x<24;x++)descriptor.push(tileAt(map,cx*24+x,cy*24+y));
  for(let frame=0;frame<4;frame++)for(let y=0;y<24;y++)for(let x=0;x<24;x++){
   const tile=descriptor[y*24+x],animated=tile.material===6||tile.material===7,base=tiles[tile.material][animated?frame:tile.variant];
   for(let py=0;py<res;py++)for(let px=0;px<res;px++){
    let from=base;for(const [material,mask]of tile.transitions)if(transitionAlpha(mask,px*32/res,py*32/res))from=tiles[material][material===6||material===7?frame:tile.variant];
    const si=(py*res+px)*4,di=((y*res+py)*side*4+frame*side+x*res+px)*4;from.copy(sheet,di,si,si+4);sheet[di+3]=255;
   }
  }
  if(layer==='overview'){
   const left=cx*768,top=cy*768;const objects=map.objects.filter(o=>o.x>left-180&&o.x<left+768+180&&o.y>top-180&&o.y<top+768+180).sort((a,b)=>a.y-b.y);
   for(const o of objects){const d=objectDefinition(o),sprite=await objectPixels(o.kind,res/32);for(let f=0;f<4;f++){
    // Clip each sprite to its sector so its pixels never bleed into the next frame.
    const ox=Math.round((o.x-d.width/2-left)*res/32),oy=Math.round((o.y-d.height-top)*res/32);stamp(sheet,side*4,side,sprite.data,sprite.info.width,sprite.info.height,f*side+ox,oy,f*side,(f+1)*side);
   }}
  }
  const pixelSide=lod===0?768:lod===1?192:96;
  const buffer=await sharp(sheet,{raw:{width:side*4,height:side,channels:4}}).resize(pixelSide*4,pixelSide,{kernel:'nearest'}).png({compressionLevel:3}).toBuffer();completed.set(key,buffer);while(completed.size>120)completed.delete(completed.keys().next().value);return buffer;
 }finally{release();}})();inFlight.set(key,job);try{return await job;}finally{inFlight.delete(key);}
}
// Asset revision: individual objects, bridge fix.
// Asset revision: isolated oak, pine and willow.
