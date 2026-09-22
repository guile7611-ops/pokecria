import { objectDefinition,COLLISION_LAYERS,TERRAIN_PROPERTIES } from './tilemap.js';
export function attachCollisions(map){
 map.colliders=new Map();map.interactions=[];
 function add(rect){rect.layer=COLLISION_LAYERS.WORLD;for(let y=Math.floor(rect.y/32);y<=Math.floor((rect.y+rect.h)/32);y++)for(let x=Math.floor(rect.x/32);x<=Math.floor((rect.x+rect.w)/32);x++){const key=`${x},${y}`;if(!map.colliders.has(key))map.colliders.set(key,[]);map.colliders.get(key).push(rect);}}
 for(const [index,o]of map.objects.entries()){
  o.uid=o.id||`object-${index}`;const d=objectDefinition(o);o.pivot={x:d.width/2,y:d.height};
  if(o.structure&&d.enterable){const w=d.width*.66,h=36;add({id:o.uid+'-wall',category:'BUILDING',x:o.x-w/2,y:o.y-h-14,w,h:22});add({id:o.uid+'-left',category:'BUILDING',x:o.x-w/2,y:o.y-28,w:(w-30)/2,h:25});add({id:o.uid+'-right',category:'BUILDING',x:o.x+15,y:o.y-28,w:(w-30)/2,h:25});map.interactions.push({id:o.uid,kind:o.kind,x:o.x,y:o.y+10,radius:40,layer:COLLISION_LAYERS.INTERACTION,label:o.kind==='cave'?'Entrar na caverna':'Entrar',target:o});}
  else if(d.body){const [x,y,w,h]=d.body;add({id:o.uid,category:'OBJECT',x:o.x+x,y:o.y+y,w,h});}
  if(d.interactable)map.interactions.push({id:o.uid,kind:'sign',x:o.x,y:o.y+12,radius:45,layer:COLLISION_LAYERS.INTERACTION,label:'Ler placa',text:'As trilhas de Aurora ligam a vila, o lago e as montanhas.'});
 }
 if(map.spawns){map.spawns=map.spawns.filter(s=>![...collidersIn(map,s.x-12,s.y-12,s.x+12,s.y+12)].some(o=>s.x+12>o.x&&s.x-12<o.x+o.w&&s.y+12>o.y&&s.y-12<o.y+o.h));const allowed=new Set(map.spawns.map(s=>s.uid));for(const chunk of map.chunks.values())chunk.spawns=chunk.spawns.filter(s=>allowed.has(s.uid));}
 return map;
}
export function collidersIn(map,left,top,right,bottom){const found=new Set();if(!map.colliders)return found;for(let y=Math.floor(top/32);y<=Math.floor(bottom/32);y++)for(let x=Math.floor(left/32);x<=Math.floor(right/32);x++)for(const o of map.colliders.get(`${x},${y}`)||[])found.add(o);return found;}
export function terrainPassable(map,x,y,profile={}){const t=map.grid[y]?.[x];if(t===undefined)return false;if(!map.colliders)return [0,4,5,6,7,8,9,11].includes(t);const p=TERRAIN_PROPERTIES[t];return p?.walkable||p?.capability&&profile[p.capability]===true;}
export function createInterior(source,seed){
 const cave=['cave','boss','tower','ruins'].includes(source.kind),cols=18,rows=16,tile=32;
 const grid=Array.from({length:rows},(_,y)=>Uint8Array.from({length:cols},(_,x)=>x<2||y<2||x>=cols-2||y>=rows-2?3:cave?9:11));
 const biome=Array.from({length:rows},()=>new Uint8Array(cols));
 const objects=(cave?[{kind:'bigRock',x:140,y:170},{kind:'rock',x:410,y:170},{kind:'mushrooms',x:180,y:250},{kind:'crate',x:360,y:230}]:[{kind:'bench',x:180,y:210},{kind:'crate',x:390,y:200},{kind:'well',x:390,y:300},{kind:'flowers',x:160,y:320}]).map((o,i)=>({...o,uid:`room-${i}`,scale:1}));
 const region={id:'interior',biome:cave?'cave':'ruins',name:cave?'Gruta de Cristal':'Abrigo de Aurora',level:[1,3],species:['rattata'],difficulty:'Tranquila',reward:'Exploração'};
 const map=attachCollisions({seed,scene:source.id,interiorKind:source.kind,grid,biome,cols,rows,tile,objects,regions:[region],pois:[],structures:[],spawns:[],chunks:new Map([['0,0',{id:'0,0',cx:0,cy:0,objects,spawns:[]}]]),roads:[],rivers:[]});
 map.interactions.push({id:'exit',kind:'exit',x:288,y:418,radius:42,label:'Voltar ao mundo',layer:COLLISION_LAYERS.INTERACTION});
 if(source.kind==='heal')map.interactions.push({id:'heal',kind:'heal',x:288,y:200,radius:70,label:'Recuperar vida',layer:COLLISION_LAYERS.INTERACTION});
 if(source.kind==='shop')map.interactions.push({id:'shopkeeper',kind:'shopkeeper',x:288,y:205,radius:75,label:'Conversar com vendedor',layer:COLLISION_LAYERS.INTERACTION});
 return map;
}
