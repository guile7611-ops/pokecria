import {objectDefinition} from './tilemap.js';
export const worldLod=zoom=>zoom>.78?0:zoom>.28?1:2;
export class WorldView {
 constructor(map){this.map=map;this.states=new Map();this.images={};this.cache=new Map();for(const kind of ['tree','pine','rock','house','heal','shop','cave']){const img=new Image();img.src=`/assets/sprites/objects/${kind}.png`;this.images[kind]=img;}}
 dispose(){for(const state of this.states.values())state.plane.remove();this.states.clear();}
 state(host){let state=this.states.get(host);if(!state){const plane=document.createElement('div');plane.className='tilemap-plane';host.append(plane);state={plane,nodes:new Map(),frame:0};this.states.set(host,state);}return state;}
 node(state,key,cls){let node=state.nodes.get(key);if(!node){node=document.createElement('div');node.className=cls;state.nodes.set(key,node);state.plane.append(node);}node._seenFrame=state.frame;return node;}
 render(host,view,{objects=true,actors=[]}={}){const state=this.state(host),{x,y,zoom,width,height}=view,left=x-width/zoom/2,top=y-height/zoom/2,right=x+width/zoom/2,bottom=y+height/zoom/2,lod=worldLod(zoom),preload=lod===0?384:768;
  state.frame++;
  if(state.lod!==lod){for(const [key,node] of state.nodes)if(key.startsWith('chunk:')){node.remove();state.nodes.delete(key);}state.lod=lod;}
  state.plane.style.transform=`translate3d(${width/2-x*zoom}px,${height/2-y*zoom}px,0) scale(${zoom})`;
  for(let cy=Math.max(0,Math.floor((top-preload)/768));cy<=Math.min(Math.ceil(this.map.rows/24)-1,Math.floor((bottom+preload)/768));cy++)for(let cx=Math.max(0,Math.floor((left-preload)/768));cx<=Math.min(Math.ceil(this.map.cols/24)-1,Math.floor((right+preload)/768));cx++){
   const layer=lod===0?'ground':'overview',key=`chunk:${cx},${cy}:${lod}`,node=this.node(state,key,'tile-sector');node.style.left=cx*768+'px';node.style.top=cy*768+'px';
   if(!node.firstChild){const img=document.createElement('img');img.alt='';img.decoding='async';img.loading='eager';img.fetchPriority='high';img.draggable=false;img.src=`/api/tile-chunk?rev=world-6&seed=${this.map.seed}&cx=${cx}&cy=${cy}&lod=${lod}&layer=${layer}&scene=${encodeURIComponent(this.map.scene||'')}`;node.append(img);}
  }
  if(objects&&lod===0){for(let cy=Math.max(0,Math.floor((top-200)/768));cy<=Math.floor((bottom+200)/768);cy++)for(let cx=Math.max(0,Math.floor((left-200)/768));cx<=Math.floor((right+200)/768);cx++)for(const o of this.map.chunks.get(`${cx},${cy}`)?.objects||[]){if(o.x<left-180||o.x>right+180||o.y<top-40||o.y>bottom+200)continue;const d=objectDefinition(o),node=this.node(state,'object:'+o.uid,'world-sprite object-sprite');if(!node._initialized){node.style.cssText=`left:${o.x-d.width/2}px;top:${o.y-d.height}px;width:${d.width}px;height:${d.height}px;z-index:${d.low?2:10000+Math.round(o.y)};background-image:url('/assets/sprites/objects/${o.kind}.png')`;if(o.kind==='waterfall'||o.kind==='fire'){node.style.backgroundImage=`url('/assets/sprites/vfx/${o.kind==='fire'?'campfire':'waterfall'}.png')`;node.style.backgroundSize=`${d.width*8}px ${d.height}px`;node.style.setProperty('--sheet-travel',`${-d.width*8}px`);node.style.animation='object-frames .8s steps(8,end) infinite';}if(o.overhead)node.style.zIndex='29000';node.dataset.kind=o.kind;node.dataset.rootY=o.y;node._initialized=true;}}}
  for(const a of actors){if(a.x<left-160||a.x>right+160||a.y<top-100||a.y>bottom+180)continue;const cls='world-sprite '+(a.className||''),node=this.node(state,'actor:'+a.key,cls);if(node.className!==cls)node.className=cls;const style=`left:${a.x-a.pivotX}px;top:${a.y-a.pivotY}px;width:${a.width}px;height:${a.height}px;z-index:${a.layer===8?30000:10000+Math.round(a.y)};background-image:url('${a.src}');background-size:${a.sheetWidth}px ${a.sheetHeight}px;background-position:${-a.sx}px ${-a.sy}px;opacity:${a.opacity??1};transform:${a.transform||'none'};transform-origin:${a.pivotX}px ${a.pivotY}px`;if(node._styleText!==style){node.style.cssText=style;node._styleText=style;}
   if(a.animation)node.dataset.animation=a.animation;else delete node.dataset.animation;
   if(a.label){let label=node.querySelector('.sprite-name');if(!label){label=document.createElement('span');label.className='sprite-name';node.append(label);}if(label.textContent!==a.label)label.textContent=a.label;}else node.querySelector('.sprite-name')?.remove();
   if(a.label&&Number.isFinite(a.hp)&&Number.isFinite(a.maxHp)){let bar=node.querySelector('.sprite-hp');if(!bar){bar=document.createElement('span');bar.className='sprite-hp';bar.innerHTML='<i></i>';node.append(bar);}const hpWidth=`${Math.max(0,Math.min(100,a.hp/a.maxHp*100))}%`;if(bar._hpWidth!==hpWidth){bar.firstElementChild.style.width=hpWidth;bar._hpWidth=hpWidth;}}else node.querySelector('.sprite-hp')?.remove();
  }
  for(const [key,node]of state.nodes)if(node._seenFrame!==state.frame&&(!key.startsWith('chunk:')||state.frame-node._seenFrame>180)){node.remove();state.nodes.delete(key);}
  this.cache=state.nodes;
 }
}




