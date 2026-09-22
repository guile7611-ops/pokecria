import { attachCollisions } from './collisions.js';
import {objectDefinition} from './tilemap.js';
import { WorldDefinition as W, WorldSeed, RegionDefinitions as regions, RoadDefinitions, StructureDefinitions, PoiDefinitions, BiomeDefinitions, SpawnZoneDefinitions } from './world-definition.js';
export const noise = (x,y,seed=WorldSeed) => { const n=Math.sin(x*127.1+y*311.7+seed*.013)*43758.5453; return n-Math.floor(n); };
export function inside(x,y,polygon) {
 let hit=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) { const a=polygon[i],b=polygon[j]; if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit; }
 return hit;
}
export function segmentDistance(x,y,a,b) { const dx=b[0]-a[0],dy=b[1]-a[1], t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1))); return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy); }
export function smoothLine(points) {
 let result=points;
 for(let pass=0;pass<2;pass++) { const next=[result[0]]; for(let i=0;i<result.length-1;i++) {const a=result[i],b=result[i+1];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);} next.push(result.at(-1)); result=next; }
 return result;
}
const wave=(x,y)=>Math.sin(x*.12+y*.04)*1.7+Math.sin(y*.19-x*.03)*1.1;
export function regionAt(x,y) {
 let best=regions[2],score=Infinity;
 for(const r of regions) { const d=Math.hypot((x-r.x)/r.rx,(y-r.y)/r.ry) + .055*Math.sin(x*.14+y*.09+r.x)+.045*Math.sin(y*.23-x*.12+r.y); if(d<score){score=d;best=r;} }
 return best;
}
export function generateWorld({seed=WorldSeed,spawnSeed=seed,cols=W.cols,rows=W.rows,tile=W.tile}={}) {
 const grid=Array.from({length:rows},()=>new Uint8Array(cols)), biome=Array.from({length:rows},()=>new Uint8Array(cols)), altitude=Array.from({length:rows},()=>new Float32Array(cols));
 const roads=RoadDefinitions.map(smoothLine), rivers=W.rivers.map(r=>({...r,points:smoothLine(r.points)}));
 const paintLine=(points,width,fn)=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1])-width-1));y<Math.min(rows,Math.ceil(Math.max(a[1],b[1])+width+1));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0])-width-1));x<Math.min(cols,Math.ceil(Math.max(a[0],b[0])+width+1));x++){if(segmentDistance(x+.5,y+.5,a,b)<=width+.24*Math.sin(x*.4+y*.2))fn(x,y);}}};
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++) {
  const r=regionAt(x,y), wx=x+wave(x,y)*.55,wy=y+wave(y,x)*.55;
  biome[y][x]=regions.indexOf(r);
  if(![W.coast,...W.islands].some(p=>inside(wx,wy,p))){grid[y][x]=2;continue;}
  grid[y][x]=r.biome==='desert'?4:r.biome==='swamp'?5:r.biome==='volcano'?6:r.biome==='cave'?9:0;
 }
 for(const ridge of W.ridges) paintLine(smoothLine(ridge),12,(x,y)=>{if(grid[y][x]===2)return;const d=Math.min(...ridge.slice(1).map((b,i)=>segmentDistance(x,y,ridge[i],b))); altitude[y][x]=Math.max(altitude[y][x],Math.max(0,1-d/13));if(d<5+wave(x,y)*.65)grid[y][x]=3;});
 for(const lake of W.lakes)for(let y=Math.max(0,Math.floor(lake.y-lake.ry-4));y<Math.min(rows,lake.y+lake.ry+4);y++)for(let x=Math.max(0,Math.floor(lake.x-lake.rx-4));x<Math.min(cols,lake.x+lake.rx+4);x++)if(Math.hypot((x-lake.x)/lake.rx,(y-lake.y)/lake.ry)<1+wave(x,y)*.06+.12*Math.sin(Math.atan2(y-lake.y,x-lake.x)*3))grid[y][x]=2;
 for(const river of rivers)paintLine(river.points,river.width,(x,y)=>{grid[y][x]=2;});
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(grid[y][x]!==2&&grid[y][x]!==3&&[[1,0],[-1,0],[0,1],[0,-1],[2,0],[0,2],[-2,0],[0,-2]].some(([dx,dy])=>grid[y+dy]?.[x+dx]===2))grid[y][x]=4;
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
  const r=regions[biome[y][x]], density=BiomeDefinitions[r.biome].tree;
  const cluster=.5+.5*Math.sin(x*.21+Math.sin(y*.14)*2)*Math.cos(y*.17);
  if(![2,3].includes(grid[y][x]) && noise(x,y,seed)<density*(.3+cluster*1.7))grid[y][x]=1;
 }
 for(const p of PoiDefinitions){const px=p.x/tile,py=p.y/tile,rr=p.kind==='village'?11:p.kind==='boss'?9:5;
  for(let y=Math.max(1,Math.floor(py-rr));y<Math.min(rows-1,py+rr);y++)for(let x=Math.max(1,Math.floor(px-rr));x<Math.min(cols-1,px+rr);x++)if(Math.hypot(x-px,y-py)<rr && (grid[y][x]!==2||p.id==='ilha'))grid[y][x]=p.kind==='cave'?9:p.kind==='boss'?11:0;
 }
 for(const road of roads)paintLine(road,1.65,(x,y)=>{grid[y][x]=grid[y][x]===2?8:7;});
 for(let y=4;y<29;y++){const center=27+Math.round(Math.sin(y*.28)*1.3);for(let x=center-2;x<=center+2;x++)grid[y][x]=y>=16&&y<=18?8:2;}
 for(let y=12;y<23;y++)for(let x=3;x<25;x++)if(grid[y][x]!==2&&(Math.hypot((x-8)/1.8,y-17)<3 || Math.abs(y-(17+Math.sin(x*.3)))<1.2))grid[y][x]=7;
 for(const s of StructureDefinitions)for(let y=Math.floor(s.y-s.h);y<Math.ceil(s.y);y++)for(let x=Math.floor(s.x-s.w/2);x<Math.ceil(s.x+s.w/2);x++)if(grid[y]?.[x]!==undefined)grid[y][x]=10;
 const chunks=new Map();
 for(let cy=0;cy<Math.ceil(rows/W.chunkSize);cy++)for(let cx=0;cx<Math.ceil(cols/W.chunkSize);cx++)chunks.set(`${cx},${cy}`,{id:`${cx},${cy}`,cx,cy,objects:[],spawns:[]});
 const objects=[];
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
  const t=grid[y][x],r=regions[biome[y][x]],n=noise(x,y,seed+1); let kind;
  if(t===1)kind=r.biome==='conifer'?'pine':r.biome==='swamp'?'willow':'tree';
  else if(t===3&&n>.68)kind='mountain';
  else if(![2,7,8,10].includes(t)&&n>.965)kind=r.biome==='village'?'flowers':r.biome==='desert'?'cactus':r.biome==='volcano'?'lava':r.biome==='meadow'?'flowers':'rock';
  if(kind){const o={kind,x:(x+.4+noise(x,y,seed+7)*.2)*tile,y:(y+.65+noise(y,x,seed+8)*.25)*tile,variant:noise(y,x,seed),scale:kind==='mountain'?2.3:1};objects.push(o);chunks.get(`${Math.floor(x/W.chunkSize)},${Math.floor(y/W.chunkSize)}`).objects.push(o);}
 }
 // Authored village landscaping surrounds houses instead of blocking streets.
 for(const p of PoiDefinitions.filter(p=>p.kind==='village'))for(const [dx,dy] of [[-5,-3],[-4,6],[2,7],[7,-6],[-6,1]]){const x=Math.floor(p.x/32+dx),y=Math.floor(p.y/32+dy);if(![2,7,8,10].includes(grid[y]?.[x])){grid[y][x]=1;const o={kind:'tree',x:(x+.5)*32,y:(y+.8)*32,scale:1.15};objects.push(o);chunks.get(`${Math.floor(x/W.chunkSize)},${Math.floor(y/W.chunkSize)}`).objects.push(o);}}
 for(const s of StructureDefinitions){const o={...s,x:s.x*tile,y:s.y*tile,scale:1,structure:true};objects.push(o);chunks.get(`${Math.floor(s.x/W.chunkSize)},${Math.floor(s.y/W.chunkSize)}`)?.objects.push(o);}
 // Stone rings and collapsed pillars compose the two sanctuaries.
 for(const p of PoiDefinitions.filter(p=>p.kind==='boss'))for(let i=0;i<10;i++){const a=i/10*Math.PI*2;if(Math.sin(a)>.8)continue;const o={kind:i%3?'rock':'ruins',x:p.x+Math.cos(a)*210,y:p.y+Math.sin(a)*180,scale:1.2};objects.push(o);chunks.get(`${Math.floor(o.x/768)},${Math.floor(o.y/768)}`)?.objects.push(o);}
 // Keep bridge approaches and water free of decorative objects, including authored boss rings.
 for(let i=objects.length-1;i>=0;i--){const o=objects[i],d=objectDefinition(o);if(o.structure)continue;
  const half=Math.max(16,d.width/2),depth=d.low?d.height:24;let forbidden=false;
  for(let y=Math.floor((o.y-depth)/tile);y<=Math.floor((o.y+12)/tile);y++)for(let x=Math.floor((o.x-half)/tile);x<=Math.floor((o.x+half)/tile);x++)if([2,7,8].includes(grid[y]?.[x]))forbidden=true;
  if(forbidden){objects.splice(i,1);const chunk=chunks.get(`${Math.floor(o.x/768)},${Math.floor(o.y/768)}`);if(chunk)chunk.objects=chunk.objects.filter(item=>item!==o);}
 }
 const spawns=[];
 for(const zone of SpawnZoneDefinitions){const r=regions.find(r=>r.id===zone.region);let count=0;
  for(let i=0;i<2600&&count<zone.count;i++){const x=Math.floor(r.x+(noise(i,1,spawnSeed+zone.id.length)-.5)*r.rx*1.75),y=Math.floor(r.y+(noise(i,2,spawnSeed+zone.id.charCodeAt(0))-.5)*r.ry*1.75);if(biome[y]?.[x]!==regions.indexOf(r)||![0,4,5,6,9].includes(grid[y]?.[x]))continue;
   const startDistance=Math.hypot(x-7.5,y-17.5),bossDistance=Math.min(...PoiDefinitions.filter(p=>p.kind==='boss').map(p=>Math.hypot(p.x/tile-x,p.y/tile-y)));
   if(startDistance<18||bossDistance<17)continue;
   if((startDistance<38||bossDistance<31)&&noise(i,7,spawnSeed)<.72)continue;
   if(PoiDefinitions.some(p=>Math.hypot(p.x/tile-x,p.y/tile-y)<10)||spawns.some(s=>s.zoneId===zone.id&&Math.hypot(s.x/tile-x,s.y/tile-y)<3.5))continue;
   const total=zone.species.reduce((sum,entry)=>sum+(entry.weight||1),0),roll=noise(i,count+11,spawnSeed+zone.id.charCodeAt(0))*total;let cursor=0,entry=zone.species.at(-1);
   if(count<zone.guaranteed.length)entry=zone.species.find(candidate=>candidate.id===zone.guaranteed[count]);
   else for(const candidate of zone.species){cursor+=candidate.weight||1;if(roll<=cursor){entry=candidate;break;}}
   const species=typeof entry==='string'?entry:entry.id,baseLevel=zone.level[0]+Math.floor(noise(i,13,spawnSeed)*(zone.level[1]-zone.level[0]+1)),level=Math.max(baseLevel,entry.minLevel||1);
   const spawn={uid:2000+spawns.length,x:(x+.5)*tile,y:(y+.5)*tile,zoneId:zone.id,species,level,minLevel:entry.minLevel||1,reward:zone.reward}; spawns.push(spawn);chunks.get(`${Math.floor(x/W.chunkSize)},${Math.floor(y/W.chunkSize)}`).spawns.push(spawn);count++;
  }
 }
 return attachCollisions({grid,biome,altitude,cols,rows,tile,seed,chunks,objects,spawns,roads,rivers,regions,pois:PoiDefinitions,structures:StructureDefinitions});
}
export function generateTerrainGrid(options){return generateWorld(options).grid;}
