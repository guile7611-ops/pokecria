const random=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*.013)*43758.5453;return n-Math.floor(n);};
// Overlapping irregular chambers and curved tunnels. The same topology is used by collision and rendering.
export function generateLayer(system,seed){
 const {cols,rows}=system,tile=32,cave=system.kind==='cave',floor=cave?9:0;
 const grid=Array.from({length:rows},()=>new Uint8Array(cols).fill(3)),biome=Array.from({length:rows},()=>new Uint8Array(cols));
 const chambers=[[.12,.23,.07,.09],[.31,.18,.095,.10],[.47,.36,.11,.13],[.25,.56,.12,.1],[.52,.72,.105,.1],[.77,.61,.105,.12],[.86,.28,.075,.11],[.74,.87,.085,.065]];
 const carve=(cx,cy,rx,ry,rough=0)=>{for(let y=Math.max(2,Math.floor(cy-ry-2));y<Math.min(rows-2,cy+ry+2);y++)for(let x=Math.max(2,Math.floor(cx-rx-2));x<Math.min(cols-2,cx+rx+2);x++){const a=Math.atan2(y-cy,x-cx),edge=1+rough*Math.sin(a*5+cx)*Math.cos(a*3+cy);if(Math.hypot((x-cx)/rx,(y-cy)/ry)<edge)grid[y][x]=floor;}};
 for(const [x,y,rx,ry]of chambers)carve(x*cols,y*rows,rx*cols*(cave?1:1.7),ry*rows*(cave?1:1.7),.16);
 const links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2],[5,7],[3,0]];
 for(const [a,b]of links){const from=chambers[a],to=chambers[b],steps=Math.ceil(Math.hypot((to[0]-from[0])*cols,(to[1]-from[1])*rows)*2);for(let i=0;i<=steps;i++){const t=i/steps,bend=Math.sin(t*Math.PI)*3;carve((from[0]+(to[0]-from[0])*t)*cols+bend,(from[1]+(to[1]-from[1])*t)*rows-bend,cave?3.3:5,cave?3.3:5);}}
 const exits=system.portals.map((surfaceId,i)=>{const room=chambers[[0,6,7,3][i]];return{id:`exit-${surfaceId}`,surfaceId,kind:'exit',x:(Math.floor(room[0]*cols)+.5)*32,y:(Math.floor(room[1]*rows)+.5)*32,radius:54,label:cave?'Sair da caverna':'Descer montanha'};});
 const chunks=new Map();for(let cy=0;cy<Math.ceil(rows/24);cy++)for(let cx=0;cx<Math.ceil(cols/24);cx++)chunks.set(`${cx},${cy}`,{id:`${cx},${cy}`,cx,cy,objects:[],spawns:[]});
 const objects=[];for(let y=3;y<rows-3;y++)for(let x=3;x<cols-3;x++)if(grid[y][x]===floor&&random(x,y,seed)>.973&&!exits.some(p=>Math.hypot(p.x/32-x,p.y/32-y)<6)){const o={kind:cave?(random(y,x,seed)>.6?'mushrooms':'rock'):'rock',x:(x+.5)*32,y:(y+.7)*32,scale:1};objects.push(o);chunks.get(`${Math.floor(x/24)},${Math.floor(y/24)}`).objects.push(o);}
 // Stair mouths are unobstructed; their marker is also the interaction position.
 for(const exit of exits){const o={kind:cave?'gate':'sign',x:exit.x,y:exit.y-32,scale:1};objects.push(o);chunks.get(`${Math.floor(o.x/768)},${Math.floor(o.y/768)}`).objects.push(o);}
 const region={id:system.id,name:system.name,biome:cave?'cave':'highland',x:cols/2,y:rows/2,rx:cols/2,ry:rows/2,level:[1,100],species:system.species,reward:cave?'Cristal azul':'Cristal da serra',difficulty:'Exploração'};
 return {seed,scene:system.id,layer:system.kind,interiorKind:system.kind,name:system.name,cols,rows,tile,grid,biome,chunks,objects,regions:[region],pois:exits.map(e=>({...e,name:e.label})),structures:[],spawns:[],roads:[],rivers:[],layerExits:exits,system};
}
// Encounters are populated at runtime around each player. Layer generation only
// owns terrain and exits, so a cave never leaks surface spawn candidates.
export function populateLayer(map){return map;}
