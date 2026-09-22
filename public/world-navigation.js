// Traversable path distance in pixels, built once per map (not per frame).
// Rectangles are inflated by the creature radius so narrow object gaps do not count as routes.
export const PROGRESSION={pixelsPerLevel:320,spread:3,cavePixelsPerLevel:480};
export function attachNavigation(map,origin={x:240,y:560},baseDistance=0){
 const {cols,rows,tile}=map,n=cols*rows,blocked=new Uint8Array(n),distance=new Int32Array(n).fill(-1);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)blocked[y*cols+x]=[2,3].includes(map.grid[y][x])?1:0;
 const rectangles=new Set();for(const bucket of map.colliders.values())for(const rect of bucket)rectangles.add(rect);
 for(const o of rectangles)for(let y=Math.max(0,Math.ceil((o.y-12)/tile-.5));y<rows&&(y+.5)*tile<o.y+o.h+12;y++)for(let x=Math.max(0,Math.ceil((o.x-12)/tile-.5));x<cols&&(x+.5)*tile<o.x+o.w+12;x++)blocked[y*cols+x]=1;
 let start=Math.floor(origin.y/tile)*cols+Math.floor(origin.x/tile);
 if(blocked[start]){const sx=Math.floor(origin.x/tile),sy=Math.floor(origin.y/tile);outer:for(let r=1;r<10;r++)for(let y=sy-r;y<=sy+r;y++)for(let x=sx-r;x<=sx+r;x++)if(x>=0&&y>=0&&x<cols&&y<rows&&!blocked[y*cols+x]){start=y*cols+x;break outer;}}
 const queue=new Int32Array(n);let head=0,tail=1;queue[0]=start;distance[start]=0;
 while(head<tail){const i=queue[head++],x=i%cols,y=Math.floor(i/cols);for(const j of [x>0?i-1:-1,x<cols-1?i+1:-1,y>0?i-cols:-1,y<rows-1?i+cols:-1])if(j>=0&&!blocked[j]&&distance[j]<0){distance[j]=distance[i]+tile;queue[tail++]=j;}}
 map.travelDistance=distance;map.baseDistance=baseDistance;map.reachableCount=tail;
 return map;
}
export function pathDistance(map,p){const d=map.travelDistance?.[Math.floor(p.y/32)*map.cols+Math.floor(p.x/32)];return d===undefined?null:d<0?Infinity:d+(map.baseDistance||0);}
export function levelRangeAt(map,p){const distance=pathDistance(map,p);if(distance===null||!Number.isFinite(distance))return null;const local=distance-(map.baseDistance||0);const effective=map.progressionDistance?.[Math.floor(p.y/32)*map.cols+Math.floor(p.x/32)]??((map.baseDistance||0)+local*(map.layer==='cave'?PROGRESSION.pixelsPerLevel/PROGRESSION.cavePixelsPerLevel:1));const level=1+Math.floor(effective/PROGRESSION.pixelsPerLevel);return [Math.max(1,level-1),level+PROGRESSION.spread];}
export function filterReachableSpawns(map){map.spawns=map.spawns.filter(s=>Number.isFinite(pathDistance(map,s)));const ids=new Set(map.spawns.map(s=>s.uid));for(const chunk of map.chunks.values())chunk.spawns=chunk.spawns.filter(s=>ids.has(s.uid));return map;}
export function freePosition(map,point){const x=Math.floor(point.x/32),y=Math.floor(point.y/32);for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(r&&Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;const cx=x+dx,cy=y+dy;if(cx<0||cy<0||cx>=map.cols||cy>=map.rows)continue;const p={x:(cx+.5)*32,y:(cy+.5)*32};if(Number.isFinite(pathDistance(map,p)))return p;}throw new Error('No reachable landing position');}
// Blend entrance progression using walking distances through the layer, not straight lines.
// This preserves each entrance's difficulty while adding depth between passages.
export function attachEntranceProgression(map,surface){
 const first=map.travelDistance,base=map.baseDistance;
 const fields=map.layerExits.map(exit=>{const portal=surface?.interactions.find(p=>p.id===exit.surfaceId);const start=portal?pathDistance(surface,portal):base;attachNavigation(map,exit,0);return{distances:map.travelDistance,base:Number.isFinite(start)?start:base};});
 map.travelDistance=first;map.baseDistance=base;map.progressionDistance=new Float32Array(first.length);
 for(let i=0;i<first.length;i++){if(first[i]<0){map.progressionDistance[i]=Infinity;continue;}let total=0,weight=0,depth=Infinity;for(const field of fields){const d=field.distances[i];if(d<0)continue;const w=1/(d+32)**2;total+=field.base*w;weight+=w;depth=Math.min(depth,d);}map.progressionDistance[i]=total/weight+depth*(map.layer==='cave'?2/3:1);}
 return map;
}
