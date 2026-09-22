import {WorldView} from './world-view.js';
import {animationFrame,animationState} from './animation.js';
import {collidersIn,terrainPassable} from './collisions.js';
import {ABILITIES} from './data.js';
import {advanceRemote} from './remote-motion.js';
import {nightVision,worldDaylight} from './day-night.js';
export class Renderer {
 constructor(element,simulation){this.canvas=element;this.sim=simulation;this.camera={x:490,y:555};this.zoom=1.45;this.effects=[];this.networkEffects=[];this.animationClocks=new WeakMap();this.worldView=new WorldView(simulation.map);this.debug=false;this.playerNick='Treinador';this.remoteEntities=new Map();this.overlays=document.createElement('div');this.overlays.className='world-overlays';this.lighting=document.createElement('div');this.lighting.className='world-lighting';this.clock=document.createElement('div');this.clock.className='world-clock';element.append(this.lighting,this.overlays,this.clock);this.interactionButton=document.createElement('button');this.interactionButton.className='interaction-prompt';this.interactionButton.type='button';this.interactionButton.hidden=true;element.append(this.interactionButton);this.interactionButton.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();this.sim.command({type:'interact',id:this.interactionButton.dataset.worldInteraction});});this.resize();window.addEventListener('resize',()=>this.resize());}
 resize(){this.width=innerWidth;this.height=innerHeight;}
 setZoom(value){this.zoom=Math.max(.55,Math.min(2.2,Number(value)||1.45));return this.zoom;}
 bossPose(e,time){const a=e.attackVfx,t=a?(time-a.start)/.65:2;if(t<0||t>1)return 'none';const pulse=Math.sin(t*Math.PI);
  if(a.id==='slam')return `scale(${1+pulse*.15},${1-pulse*.2})`;
  if(a.id==='cleave')return `rotate(${Math.sin(t*Math.PI*2)*12}deg)`;
  return `translate(${-Math.cos(a.angle)*pulse*7}px,${-Math.sin(a.angle)*pulse*7}px)`;
 }
 worldPoint(x,y){return {x:(x-this.width/2)/this.zoom+this.camera.x,y:(y-this.height/2)/this.zoom+this.camera.y};}
 actor(e,player=false){const time=this.sim.time;if(e.remote&&e.hp<=0||player&&e.dead&&time-(e.deathStart??time)>.8)return null;if(e.state==='Dead'&&time-(e.deathStart||0)>.8)return null;const dead=e.state==='Dead'?{...e,dead:true}:e;const state=animationState(dead,time);let clock=this.animationClocks.get(e);if(!clock||clock.state!==state){clock={state,start:time};this.animationClocks.set(e,clock);}const frame=animationFrame(dead,time,clock.start);if(!frame.animation)return null;const a=frame.animation,s=frame.scale*(e.isBoss?1.45:1);const rolling=player&&e.buffs?.some(b=>b.id==='flameWheel')||e.remote&&e.rolling,selected=!player&&!e.remote&&this.sim.player.target===e.uid;return {key:player?'player':e.uid,x:e.x,y:e.y,src:a.src,width:a.frameWidth*s,height:a.frameHeight*s,sheetWidth:a.frameWidth*a.columns*s,sheetHeight:a.frameHeight*a.rows*s,sx:frame.column*a.frameWidth*s,sy:frame.row*a.frameHeight*s,pivotX:frame.pivot.x*s,pivotY:frame.pivot.y*s,animation:state,label:this.zoom>.6?(player?`${this.playerNick} · Nv. ${e.level}`:e.remote?`${e.name} · Nv. ${e.level}`:`${e.name} · Nv. ${e.level||1}`):'',hp:e.hp,maxHp:e.maxHp,transform:e.isBoss?this.bossPose(e,time):'',className:(player?'player-sprite':e.remote?'player-sprite remote-player':e.isBoss?'creature-sprite boss-sprite':'creature-sprite')+(rolling?' flame-wheel-active':'')+(selected?' combat-target':'')};}
 effect(kind,x,y,key,age=0,size=64){return {key:'vfx-'+key,x,y:y-14,src:`/assets/sprites/vfx/${kind}.png`,width:size,height:size,sheetWidth:size*8,sheetHeight:size,sx:Math.min(7,Math.floor(age*12)%8)*size,sy:0,pivotX:size/2,pivotY:size/2,layer:8};}
 bossEffects(){const effects=[];for(const e of this.sim.enemies){const a=e.attackVfx,age=a?this.sim.time-a.start:1;if(!a||age>.65||e.state==='Dead')continue;
  const add=(x,y,size,i)=>{const v=this.effect(a.vfx,x,y+14,`${e.uid}-${a.start}-${i}`,age,size);v.className=`boss-vfx boss-vfx-${a.id}`;effects.push(v);};
  if(a.shape==='circle')add(a.x,a.y,a.radius*2,0);
  else if(a.shape==='line')for(let i=0;i<7;i++)add(a.x+Math.cos(a.angle)*(i+.5)*a.length/7,a.y+Math.sin(a.angle)*(i+.5)*a.length/7,64,i);
  else for(let i=-1;i<=1;i++){const angle=a.angle+i*.45;add(a.x+Math.cos(angle)*85,a.y+Math.sin(angle)*85,90,i);}
 }return effects;}
 draw(dt,active){const p=this.sim.player;if(this.worldView.map!==this.sim.map){this.worldView.dispose();this.worldView=new WorldView(this.sim.map);this.networkEffects=[];this.effects=[];this.camera={x:p.x,y:p.y};}
  for(const e of this.remoteEntities.values())advanceRemote(e,dt,performance.now());
  const map=this.sim.map;this.terrain={width:map.cols*32,height:map.rows*32};if(active){const blend=1-Math.exp(-dt*9);this.camera.x+=(p.x-this.camera.x)*blend;this.camera.y+=(p.y-this.camera.y)*blend;}
  const hw=this.width/this.zoom/2,hh=this.height/this.zoom/2;this.camera.x=hw*2>=this.terrain.width?this.terrain.width/2:Math.max(hw,Math.min(this.terrain.width-hw,this.camera.x));this.camera.y=hh*2>=this.terrain.height?this.terrain.height/2:Math.max(hh,Math.min(this.terrain.height-hh,this.camera.y));
  const scene=this.sim.map.scene||'world';const actors=[...this.sim.enemies.map(e=>this.actor(e)),...[...this.remoteEntities.values()].filter(e=>e.scene===scene).map(e=>this.actor(e)),this.actor(p,true)].filter(Boolean);
  if(p.buffs?.some(b=>b.id==='flameWheel')&&!p.dead){actors.push(this.effect('moves/flameWheel',p.x,p.y,'flameWheel-active',this.sim.time,72));actors.push(this.effect('pmd/0030',p.x,p.y,'flameWheel-pmd',this.sim.time,94));}
  for(const [id,e] of this.remoteEntities)if(e.scene===scene&&e.hp>0&&e.rolling){actors.push(this.effect('moves/flameWheel',e.x,e.y,`flameWheel-${id}`,this.sim.time,72));actors.push(this.effect('pmd/0030',e.x,e.y,`flameWheel-pmd-${id}`,this.sim.time,94));}
  actors.push(...this.bossEffects());
  for(const shot of this.sim.projectiles){const ability=ABILITIES[shot.ability],type=ability?.type,kind=shot.visual?.travel||ability?.vfx||(type==='Water'?'water':type==='Fire'?'fire':type==='Grass'?'leaf':type==='Ground'?'earth':type==='Flying'?'wind':'energy'),size=ability?.behavior==='wave'?116:shot.visual?.travelSize||32,angle=Math.atan2(shot.vy,shot.vx)*180/Math.PI;
   if(shot.visual)for(const [index,position] of shot.trail.entries()){const trail=this.effect(kind,position.x,position.y,`trail-${shot.uid}-${index}`,this.sim.time-index*.07,size*(.48+index*.1));trail.opacity=.17+index*.11;trail.transform=`rotate(${angle}deg)`;actors.push(trail);}
   const vfx=this.effect(kind,shot.x,shot.y,'shot-'+shot.uid,this.sim.time,size);if(shot.visual)vfx.transform=`rotate(${angle}deg)`;actors.push(vfx);
  }
  for(const [index,shot] of this.sim.enemyProjectiles.entries())actors.push(this.effect(shot.vfx,shot.x,shot.y,`enemy-shot-${index}`,this.sim.time,34));
  for(const attack of this.sim.activeAttacks){const a=ABILITIES[attack.id],age=this.sim.time-(attack.fireAt-(a.charge||0)),angle=Math.atan2(attack.direction.y,attack.direction.x)*180/Math.PI;
   if(attack.behavior==='beam'&&this.sim.time<attack.fireAt){actors.push(this.effect(attack.visual?.cast||a.vfx,p.x,p.y,`charge-${attack.uid}`,this.sim.time,attack.visual?.castSize||90));continue;}
   if(attack.behavior==='channel'){for(let i=1;i<=6;i++){const length=i*a.range/7,wobble=Math.sin(this.sim.time*19+i*2)*i*4,x=p.x+attack.direction.x*length-attack.direction.y*wobble,y=p.y+attack.direction.y*length+attack.direction.x*wobble,v=this.effect(attack.visual?.travel||a.vfx,x,y,`channel-${attack.uid}-${i}`,this.sim.time+i*.06,30+i*10);v.transform=`rotate(${angle}deg)`;actors.push(v);}}
   else if(attack.behavior==='beam'&&attack.fired){for(let i=0;i<8;i++){const length=(i+.5)*a.range/8,v=this.effect(attack.visual?.travel||a.vfx,p.x+attack.direction.x*length,p.y+attack.direction.y*length,`beam-${attack.uid}-${i}`,this.sim.time,65+i*2);v.transform=`rotate(${angle}deg)`;actors.push(v);}}
   else if(attack.behavior==='whip'){for(let i=1;i<=5;i++){const length=i*a.range/6,side=Math.sin(age*25+i*1.7)*17,x=p.x+attack.direction.x*length-attack.direction.y*side,y=p.y+attack.direction.y*length+attack.direction.x*side,v=this.effect(attack.visual?.travel||a.vfx,x,y,`whip-${attack.uid}-${i}`,this.sim.time,48);v.transform=`rotate(${angle}deg)`;actors.push(v);}}
  }
  for(const zone of this.sim.zones){const a=ABILITIES[zone.id],age=this.sim.time-(zone.until-a.duration),kind=zone.visual?.impact||a.vfx;const base=this.effect(kind,zone.x,zone.y,`zone-${zone.uid}`,age,Math.max(100,a.radius*1.8));base.opacity=.75;actors.push(base);
   if(zone.id==='inferno')for(let i=0;i<3;i++){const angle=this.sim.time*2.3+i*Math.PI*2/3,v=this.effect(zone.visual?.travel||a.vfx,zone.x+Math.cos(angle)*a.radius*.6,zone.y+Math.sin(angle)*a.radius*.35,`zone-flame-${zone.uid}-${i}`,this.sim.time+i*.2,70);actors.push(v);}
   if(zone.id==='whirlpool')for(let i=0;i<3;i++){const angle=this.sim.time*2+i*Math.PI*2/3,v=this.effect('pmd/0055',zone.x+Math.cos(angle)*a.radius*.45,zone.y+Math.sin(angle)*a.radius*.45,`zone-water-${zone.uid}-${i}`,this.sim.time+i*.2,57);actors.push(v);}
  }
  for(const [i,e]of this.effects.entries()){const age=this.sim.time-e.time;if(age>.65)continue;const kind=e.vfx||(e.type==='heal'?'heal':e.type==='slash'?'slash':e.type==='kill'?'explosion':'impact');actors.push(this.effect(kind,e.x,e.y,`${i}-${e.time}`,age,e.size||64));}
  for(const [i,e]of this.networkEffects.entries()){const age=this.sim.time-e.time;if(age<0||age>e.duration)continue;const t=Math.min(1,age/e.duration),moving=['projectile','wave'].includes(e.behavior),x=moving?e.x+(e.aimX-e.x)*t:e.aimX,y=moving?e.y+(e.aimY-e.y)*t:e.aimY,angle=Math.atan2(e.aimY-e.y,e.aimX-e.x)*180/Math.PI;
   if(['channel','beam','whip','zone'].includes(e.behavior)){
    if(e.behavior==='zone'){actors.push(this.effect(e.impactVfx||e.vfx,e.aimX,e.aimY,`online-zone-${e.from}-${i}`,age,Math.max(160,e.impactSize||0)));continue;}
    if(e.behavior==='beam'&&age<e.charge){actors.push(this.effect(e.castVfx||e.vfx,e.x,e.y,`online-charge-${e.from}-${i}`,age,e.castSize));continue;}
    const count=e.behavior==='channel'?6:e.behavior==='beam'?8:5;
    for(let j=1;j<=count;j++){const distance=j/(count+1),offset=e.behavior==='channel'?Math.sin(this.sim.time*18+j*2)*j*3:e.behavior==='whip'?Math.sin(this.sim.time*24+j*1.7)*17:0,dx=(e.aimX-e.x),dy=(e.aimY-e.y),length=Math.max(1,Math.hypot(dx,dy)),px=e.x+dx*distance-dy/length*offset,py=e.y+dy*distance+dx/length*offset,v=this.effect(e.vfx,px,py,`online-pattern-${e.from}-${i}-${j}`,age+j*.05,e.behavior==='beam'?70:e.behavior==='channel'?30+j*10:48);v.transform=`rotate(${angle}deg)`;actors.push(v);}continue;
   }
   if(e.trail)for(let j=1;j<=e.trail;j++){const back=Math.max(0,t-j*.08),trail=this.effect(e.vfx,e.x+(e.aimX-e.x)*back,e.y+(e.aimY-e.y)*back,`online-trail-${e.from}-${e.time}-${i}-${j}`,age-j*.07,(e.size||64)*(1-j*.15));trail.opacity=.35-j*.08;trail.transform=`rotate(${angle}deg)`;actors.push(trail);}
   const sprite=this.effect(e.vfx,x,y,`online-${e.from}-${e.time}-${i}`,age,e.size||64);if(['projectile','wave'].includes(e.behavior)&&e.trail)sprite.transform=`rotate(${angle}deg)`;actors.push(sprite);
  }
  this.networkEffects=this.networkEffects.filter(e=>this.sim.time-e.time<=e.duration);
  if(p.evolutionUntil>this.sim.time)actors.push(this.effect('evolution',p.x,p.y,'evolve',this.sim.time-p.evolutionStart,100));
  this.effects=this.effects.filter(e=>this.sim.time-e.time<1.2);
  this.worldView.render(this.canvas,{...this.camera,zoom:this.zoom,width:this.width,height:this.height},{actors});
  const cycle=worldDaylight(),vision=nightVision(this.sim.map.layer==='cave'?{darkness:.55}:cycle,this.width,this.height,!!this.sim.map.scene&&!this.sim.map.layer),playerScreen={x:(p.x-this.camera.x)*this.zoom+this.width/2,y:(p.y-this.camera.y)*this.zoom+this.height/2};
  this.lighting.style.setProperty('--vision-x',`${playerScreen.x}px`);this.lighting.style.setProperty('--vision-y',`${playerScreen.y}px`);this.lighting.style.setProperty('--vision-inner',`${vision.innerRadius}px`);this.lighting.style.setProperty('--vision-outer',`${vision.outerRadius}px`);
  if(Math.abs(vision.strength-(this.lightOpacity||0))>.002){this.lighting.style.opacity=String(vision.strength);this.lightOpacity=vision.strength;}
  const hours=String(Math.floor(cycle.hour)).padStart(2,'0'),minutes=String(Math.floor(cycle.hour%1*60)).padStart(2,'0'),clockText=`${this.sim.map.layer?this.sim.map.name+' · ':''}${cycle.isNight?'☾':'☀'} ${hours}:${minutes}`;if(this.clock.textContent!==clockText)this.clock.textContent=clockText;
  this.drawOverlays();
 }
 drawOverlays(){const sim=this.sim,p=sim.player,point=(x,y)=>({x:(x-this.camera.x)*this.zoom+this.width/2,y:(y-this.camera.y)*this.zoom+this.height/2});const markers=[];
  const marker=(cls,x,y,w,h,text='')=>{const a=point(x,y);markers.push(`<span class="${cls}" style="left:${a.x}px;top:${a.y}px;width:${w*this.zoom}px;height:${h*this.zoom}px">${text}</span>`);};
  if(!sim.map.scene)marker('safe-zone-circle',240-340,560-340,680,680);
  if(p.path.length){const end=p.path.at(-1);marker('destination-marker',end.x-7,end.y-7,14,14);}
  for(const e of sim.enemies)if(e.isBoss&&e.state!=='Dead')marker('boss-aura',e.x-48,e.y-29,96,58);
  for(const e of sim.enemies){const a=e.telegraph;if(!a)continue;
   if(a.shape==='circle')marker('boss-telegraph boss-telegraph-slam',a.x-a.radius,a.y-a.radius,a.radius*2,a.radius*2);
   else {const pos=point(a.x,a.y);markers.push(`<span class="boss-telegraph boss-telegraph-${a.id}" style="left:${pos.x}px;top:${pos.y}px;width:${a.length*this.zoom}px;height:${a.width*this.zoom}px;transform:translateY(-50%) rotate(${a.angle}rad);transform-origin:0 50%"></span>`);}
   const pos=point(e.x,e.y);markers.push(`<span class="boss-attack-name" style="left:${pos.x}px;top:${pos.y-95*this.zoom}px">${a.name}</span>`);
  }
  for(const i of sim.map.interactions||[])if(i.kind==='shopkeeper'){const pos=point(i.x,i.y);markers.push(`<span class="shopkeeper-sprite" style="left:${pos.x}px;top:${pos.y}px"><img src="/assets/ui/shopkeeper.png" alt="Vendedor"><b>Vendedor</b></span>`);}
  for(const exit of sim.map.layerExits||[]){const pos=point(exit.x,exit.y);if(Math.hypot(exit.x-p.x,exit.y-p.y)<900)markers.push(`<span class="layer-exit-marker" style="left:${pos.x}px;top:${pos.y}px">${sim.map.layer==='cave'?'⇧ SAÍDA':'⇩ DESCIDA'}</span>`);}
  const nearest=sim.map.interactions?.find(i=>Math.hypot(i.x-p.x,i.y-p.y)<i.radius+15);this.interactionButton.hidden=!nearest;if(nearest){this.interactionButton.dataset.worldInteraction=nearest.id;this.interactionButton.textContent='F · '+nearest.label;}
  if(this.debug){const l=this.camera.x-this.width/this.zoom/2,t=this.camera.y-this.height/this.zoom/2,r=this.camera.x+this.width/this.zoom/2,b=this.camera.y+this.height/this.zoom/2;
   for(let y=Math.max(0,Math.floor(t/32));y<=Math.min(sim.map.rows-1,Math.floor(b/32));y++)for(let x=Math.max(0,Math.floor(l/32));x<=Math.min(sim.map.cols-1,Math.floor(r/32));x++)if(!terrainPassable(sim.map,x,y))marker(sim.map.grid[y][x]===2?'debug-water':'debug-tile',x*32,y*32,32,32);
   for(const o of collidersIn(sim.map,l,t,r,b))marker('debug-body',o.x,o.y,o.w,o.h);
   for(const e of [...sim.enemies,p]){marker('debug-entity',e.x-e.radius,e.y-e.radius,e.radius*2,e.radius*2);const h=e.hurtbox?.radius||e.radius;marker('debug-hurt',e.x-h,e.y-h,h*2,h*2);}
   for(const shot of sim.projectiles)marker('debug-hit',shot.x-5,shot.y-5,10,10);
   for(const i of sim.map.interactions)marker('debug-interaction',i.x-i.radius,i.y-i.radius,i.radius*2,i.radius*2);
   for(const n of p.path)marker('debug-nav',n.x-3,n.y-3,6,6);
   markers.push('<span class="debug-legend">F3 · QA<br>Vermelho: terreno bloqueado<br>Azul: água · Laranja: objeto/parede<br>Verde: corpo · Rosa: hurtbox<br>Amarelo: interação · Branco: hitbox/rota</span>');
  }
  this.overlays.innerHTML=markers.join('');
 }
 minimap(){this.mapController?.draw();}
}



