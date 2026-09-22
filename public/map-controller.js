import { saveWorld } from './world-runtime.js';
import {levelRangeAt} from './world-navigation.js';
export class MapController {
 constructor(renderer, onSeed){this.renderer=renderer;this.onSeed=onSeed;this.panel=document.querySelector('.minimap');this.canvas=document.getElementById('minimap');this.expanded=false;this.follow=true;this.zoom=.16;this.x=0;this.y=0;this.lastDraw=0;this.atlas=false;
  this.panel.insertAdjacentHTML('beforeend',`<div class="map-tools"><button id="map-out" title="Afastar">−</button><button id="map-in" title="Aproximar">+</button><button id="map-player">Jogador</button><button id="map-region">Região</button><button id="map-world">Mundo</button><button id="map-open">M · Abrir</button></div><div class="atlas-only"><div class="atlas-info"><span class="eyebrow">ATLAS DE AURORA</span><h2>Um mundo para descobrir</h2><p id="map-selection">Selecione uma região ou um lugar descoberto.</p><p id="map-discovery"></p><p class="map-legend">● Você &nbsp; ◆ Santuário &nbsp; ⌂ Povoado<br>Claro: área atual · Escuro: não explorado</p><button id="map-fog">Ver cartografia do mundo</button><label>Seed do mundo<input id="world-seed" type="number" min="0" max="4294967295"></label><button id="world-regenerate">Aplicar seed e regenerar</button><button id="world-save">Salvar descoberta</button><p id="map-save-status" role="status"></p></div><div class="atlas-help">SCROLL · ZOOM &nbsp;&nbsp; ARRASTE · MOVER &nbsp;&nbsp; M · FECHAR</div></div>`);
  const $=id=>document.getElementById(id);
  $('world-seed').value=renderer.sim.map.seed;
  $('map-in').onclick=()=>this.zoomBy(1.35);$('map-out').onclick=()=>this.zoomBy(1/1.35);
  $('map-player').onclick=()=>{this.follow=true;this.zoom=.35;};$('map-region').onclick=()=>{this.follow=true;this.zoom=.09;};$('map-world').onclick=()=>{if(!this.expanded)this.toggle();this.fit();};$('map-open').onclick=()=>this.toggle();
  $('map-fog').onclick=()=>{this.atlas=!this.atlas;$('map-fog').textContent=this.atlas?'Voltar à exploração':'Ver cartografia do mundo';};
  $('world-save').onclick=()=>{$('map-save-status').textContent=saveWorld(localStorage,renderer.sim)?'Mundo e descoberta salvos.':'Não foi possível salvar neste navegador.';};
  $('world-regenerate').onclick=()=>{const seed=Number($('world-seed').value);if(!Number.isInteger(seed)||seed<0||seed>4294967295){$('map-save-status').textContent='Use uma seed inteira entre 0 e 4294967295.';return;}onSeed(seed);$('map-save-status').textContent='Mundo regenerado. Progressão do Pokémon preservada.';this.fit();};
  this.canvas.addEventListener('wheel',e=>{if(!this.expanded)return;e.preventDefault();e.stopPropagation();this.zoomBy(Math.exp(-e.deltaY*.0015),e);},{passive:false});
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,ox:this.x,oy:this.y,moved:false};});
  this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>4)this.drag.moved=true;this.follow=false;this.x=this.drag.ox-dx/this.zoom;this.y=this.drag.oy-dy/this.zoom;this.clamp();});
  this.canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved)this.select(e);this.drag=null;});this.canvas.addEventListener('pointercancel',()=>this.drag=null);
 }
 toggle(){this.expanded=!this.expanded;this.panel.classList.toggle('map-expanded',this.expanded);document.getElementById('map-open').textContent=this.expanded?'M · Fechar':'M · Abrir';if(this.expanded){this.measure();this.fit();}else{this.follow=true;this.zoom=.16;}}
 measure(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,Math.round(r.width));this.height=Math.max(1,Math.round(r.height));if(this.canvas.width!==this.width||this.canvas.height!==this.height){this.canvas.width=this.width;this.canvas.height=this.height;}this.minZoom=Math.min(this.width/(this.renderer.sim.map.cols*32+640),this.height/(this.renderer.sim.map.rows*32+640));}
 fit(){this.measure();this.follow=false;this.zoom=this.minZoom;this.x=this.renderer.sim.map.cols*16;this.y=this.renderer.sim.map.rows*16;}
 clamp(){const m=this.renderer.sim.map;this.x=Math.max(0,Math.min(m.cols*32,this.x));this.y=Math.max(0,Math.min(m.rows*32,this.y));}
 point(e){const r=this.canvas.getBoundingClientRect();return {x:this.x+(e.clientX-r.left-this.width/2)/this.zoom,y:this.y+(e.clientY-r.top-this.height/2)/this.zoom};}
 zoomBy(factor,e){this.measure();const before=e?this.point(e):null;this.zoom=Math.max(this.minZoom,Math.min(2,this.zoom*factor));if(before){const after=this.point(e);this.x+=before.x-after.x;this.y+=before.y-after.y;this.follow=false;}this.clamp();}
 select(e){const p=this.point(e),sim=this.renderer.sim,poi=sim.map.pois.find(o=>Math.hypot(o.x-p.x,o.y-p.y)*this.zoom<18&&sim.discovery.state(o.x,o.y)!=='UNKNOWN');const r=sim.map.regions[sim.map.biome[Math.floor(p.y/32)]?.[Math.floor(p.x/32)]]||sim.map.regions[0];this.selected=poi||r;const discovered=poi||sim.discovery.state(p.x,p.y)!=='UNKNOWN';document.getElementById('map-selection').textContent=discovered?`${poi?.name||r.name} · Níveis ${(levelRangeAt(sim.map,p)||r.level).join('–')} · ${r.difficulty}. Criaturas: ${r.species.join(', ')}. Recompensa: ${r.reward}.`:`${r.name} · Região ainda não explorada.`;}
 draw(){if(performance.now()-this.lastDraw<(this.expanded?100:200))return;this.lastDraw=performance.now();this.measure();const sim=this.renderer.sim,p=sim.player;if(this.follow){this.x=p.x;this.y=p.y;}
  this.renderer.worldView.render(this.canvas,{x:this.x,y:this.y,zoom:this.zoom,width:this.width,height:this.height});
  if(!this.overlay){this.overlay=document.createElement('div');this.overlay.className='map-overlays';this.canvas.append(this.overlay);}
  const project=(x,y)=>({x:(x-this.x)*this.zoom+this.width/2,y:(y-this.y)*this.zoom+this.height/2}),nodes=[];
  const box=(cls,x,y,w,h,text='')=>{const a=project(x,y);if(a.x+w*this.zoom<0||a.y+h*this.zoom<0||a.x>this.width||a.y>this.height)return;nodes.push(`<span class="${cls}" style="left:${a.x}px;top:${a.y}px;${w?'width:'+w*this.zoom+'px;height:'+h*this.zoom+'px;':''}">${text}</span>`);};
  if(!this.atlas){const d=sim.discovery;for(let y=Math.max(0,Math.floor((this.y-this.height/this.zoom/2)/256));y<Math.min(d.rows,Math.ceil((this.y+this.height/this.zoom/2)/256));y++)for(let x=Math.max(0,Math.floor((this.x-this.width/this.zoom/2)/256));x<Math.min(d.cols,Math.ceil((this.x+this.width/this.zoom/2)/256));x++){const state=d.state(x*256+1,y*256+1);if(state!=='CURRENT')box('map-fog '+(state==='DISCOVERED'?'discovered':''),x*256,y*256,256,256);}}
  if(this.expanded&&!sim.map.scene&&this.zoom<.15)for(const r of sim.map.regions)box('map-region-label',r.x*32,r.y*32,0,0,r.name);
  for(const poi of sim.map.pois)if(sim.discovery.state(poi.x,poi.y)!=='UNKNOWN')box('map-dot',poi.x,poi.y,0,0);
  for(const e of sim.enemies)if(e.state!=='Dead'&&sim.discovery.state(e.x,e.y)==='CURRENT'){
   if(e.isBoss)box('map-boss',e.x,e.y,0,0,`<img src="/assets/pokemon/${e.id}/portrait.png" alt=""><small>Nv. ${e.level}</small>`);
   else box('map-dot',e.x,e.y,0,0);
  }
  box('map-dot player',p.x,p.y,0,0);
  const cam=this.renderer;box('map-camera',cam.camera.x-cam.width/cam.zoom/2,cam.camera.y-cam.height/cam.zoom/2,cam.width/cam.zoom,cam.height/cam.zoom);
  nodes.push(`<span class="map-caption">${Math.round(this.zoom*100)}% · ${this.atlas?'CARTOGRAFIA':'EXPLORAÇÃO'}</span>`);this.overlay.innerHTML=nodes.join('');
  document.getElementById('map-discovery').textContent=`${sim.discovery.seen.size} setores descobertos · ${sim.map.pois.filter(o=>sim.discovery.state(o.x,o.y)!=='UNKNOWN').length} lugares encontrados`;
 }
}

