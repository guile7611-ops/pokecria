// Shared client/server tile metadata. Visual atlas selection and navigation use
// the same terrain definition; no coordinate list of blocked tiles is maintained.
export const TILE_SIZE=32;
export const MATERIALS=['grass','forest','meadow','dirt','sand','wetSand','shallowWater','deepWater','rock','snow','cave','swamp','ruins','wood','lava','leaves'];
export const COLLISION={WALKABLE:0,BLOCKED:1,WATER:2,CLIFF:3,MOUNTAIN:4,BUILDING:5,OBJECT:6,BRIDGE:7,INTERACTABLE:8};
export const COLLISION_LAYERS={WORLD:1,PLAYER:2,CREATURE:4,INTERACTION:8,HITBOX:16,HURTBOX:32};
export const RENDER_LAYERS={BASE:0,TERRAIN:1,TRANSITIONS:2,LOW_OBJECTS:3,Y_SORT:4,BRIDGE_OVERHEAD:5,VFX:8,OVERLAY:9};
export const TERRAIN_PROPERTIES={
 0:{category:0,walkable:true},1:{category:6,walkable:true},2:{category:2,walkable:false,capability:'swim'},
 3:{category:4,walkable:false},4:{category:0,walkable:true},5:{category:0,walkable:true},6:{category:0,walkable:true},
 7:{category:0,walkable:true},8:{category:7,walkable:true,elevation:1},9:{category:0,walkable:true},10:{category:5,walkable:true},11:{category:0,walkable:true},
};
export const OBJECT_PROPERTIES={
 tree:{frame:1,width:80,height:108,body:[-9,-11,18,18]},pine:{frame:3,width:72,height:112,body:[-8,-10,16,18]},willow:{frame:4,width:96,height:120,body:[-10,-12,20,18]},
 smallTree:{frame:0,width:64,height:80,body:[-7,-10,14,16]},ancientTree:{frame:2,width:112,height:144,body:[-11,-13,22,20]},deadTree:{frame:5,width:80,height:112,body:[-8,-10,16,16]},flowerTree:{frame:6,width:80,height:104,body:[-8,-10,16,16]},palm:{frame:7,width:80,height:112,body:[-7,-9,14,16]},
 bush:{frame:8,width:48,height:40,low:true},flowers:{frame:9,width:32,height:32,low:true},grass:{frame:10,width:32,height:40,low:true},mushrooms:{frame:11,width:40,height:40,low:true},
 rock:{frame:12,width:40,height:40,body:[-9,-10,18,16]},bigRock:{frame:13,width:72,height:88,body:[-17,-18,34,26]},mountain:{frame:14,width:128,height:144},
 cave:{frame:15,width:144,height:152,enterable:true},house:{frame:16,width:128,height:160,enterable:true},hall:{frame:17,width:144,height:176,enterable:true},heal:{frame:18,width:144,height:168,enterable:true},shop:{frame:19,width:128,height:152,enterable:true},
 ruins:{frame:20,width:104,height:120,body:[-38,-32,20,30]},tower:{frame:21,width:112,height:160,enterable:true},boss:{frame:22,width:160,height:176,enterable:true},camp:{frame:23,width:112,height:128,enterable:true},
 log:{frame:24,width:64,height:32,body:[-24,-8,48,14]},stump:{frame:25,width:40,height:32,body:[-9,-10,18,15]},sign:{frame:26,width:40,height:48,interactable:true},bench:{frame:27,width:64,height:36,body:[-23,-9,46,16]},crate:{frame:28,width:56,height:48,body:[-17,-16,34,24]},well:{frame:29,width:56,height:72,body:[-17,-19,34,26]},bridge:{frame:30,width:128,height:80},fire:{frame:31,width:40,height:48,low:true},
 gate:{frame:20,width:112,height:120},waterfall:{frame:15,width:128,height:152},lava:{frame:13,width:48,height:48,low:true},cactus:{frame:5,width:48,height:72,body:[-7,-10,14,16]},
};
export function materialAt(map,x,y){const t=map.grid[y]?.[x],biome=map.regions?.[map.biome?.[y]?.[x]]?.biome||'field';
 if(t===undefined)return 7;
 if(t===2){const near=[[0,1],[1,0],[0,-1],[-1,0]].some(([dx,dy])=>map.grid[y+dy]?.[x+dx]!==2);return near?6:7;}
 if(t===3)return biome==='conifer'?9:8;
 if(t===4)return [[0,1],[1,0],[0,-1],[-1,0]].some(([dx,dy])=>map.grid[y+dy]?.[x+dx]===2)?5:4;
 if(t===5)return 11;if(t===6)return 14;if(t===7)return 3;if(t===8)return 13;if(t===9)return 10;if(t===11)return 12;
 return {village:0,field:0,forest:15,dense:1,meadow:2,conifer:1,rock:8,volcano:14,desert:4,swamp:11,lake:0,ruins:12,cave:10,beach:4}[biome]??0;
}
export const NEIGHBORS=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8],[1,-1,16],[1,1,32],[-1,1,64],[-1,-1,128]];
const rank=[2,3,2,5,4,6,8,9,7,7,7,4,5,10,7,3];
export function tileAt(map,x,y){const material=materialAt(map,x,y),masks=new Map();for(const [dx,dy,bit]of NEIGHBORS){const n=materialAt(map,x+dx,y+dy);if(n!==material&&rank[n]>rank[material])masks.set(n,(masks.get(n)||0)|bit);}
 const variant=((Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^map.seed)>>>0)%4;
 return {material,variant,transitions:[...masks].sort((a,b)=>rank[a[0]]-rank[b[0]]),collision:TERRAIN_PROPERTIES[map.grid[y]?.[x]]||{walkable:false,category:1}};
}
export function transitionAlpha(mask,x,y){
 const edge=7+((x*3+y*5)%5===0?1:0);
 let alpha=(mask&1&&y<edge)||(mask&2&&x>31-edge)||(mask&4&&y>31-edge)||(mask&8&&x<edge);
 if(!alpha)alpha=(mask&16&&x>23&&y<8&&((31-x)**2+y*y<70))||(mask&32&&x>23&&y>23&&((31-x)**2+(31-y)**2<70))||(mask&64&&x<8&&y>23&&(x*x+(31-y)**2<70))||(mask&128&&x<8&&y<8&&(x*x+y*y<70));
 return alpha?255:0;
}
export function objectDefinition(o){return OBJECT_PROPERTIES[o.kind]||OBJECT_PROPERTIES.rock;}
