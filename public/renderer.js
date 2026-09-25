import {CITY_SAFE_ZONES} from './safe-zones.js';
import {WorldView} from './world-view.js';
import {animationFrame,animationState} from './animation.js';
import {collidersIn,terrainPassable} from './collisions.js';
import {ABILITIES} from './data.js';
import {advanceRemote} from './remote-motion.js';
import {nightVision,worldDaylight} from './day-night.js';
import {PRIORITY_MOVE_IDS} from './move-animation-profiles.js';
export class Renderer {
 constructor(element,simulation){this.canvas=element;this.sim=simulation;this.camera={x:490,y:555};this.zoom=1.45;this.effects=[];this.networkEffects=[];this.animationClocks=new WeakMap();this.worldView=new WorldView(simulation.map);this.debug=false;this.playerNick='Treinador';this.remoteEntities=new Map();this.overlays=document.createElement('div');this.overlays.className='world-overlays';this.quakeFlash=document.createElement('div');this.quakeFlash.className='earthquake-flash';this.lighting=document.createElement('div');this.lighting.className='world-lighting';this.clock=document.createElement('div');this.clock.className='world-clock';element.append(this.quakeFlash,this.lighting,this.overlays,this.clock);this.interactionButton=document.createElement('button');this.interactionButton.className='interaction-prompt';this.interactionButton.type='button';this.interactionButton.hidden=true;element.append(this.interactionButton);this.interactionButton.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();this.sim.command({type:'interact',id:this.interactionButton.dataset.worldInteraction});});this.resize();window.addEventListener('resize',()=>this.resize());}
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
 priorityProjectileVfx(shot,ability,angle,key='shot'){
  if(!PRIORITY_MOVE_IDS.has(ability?.id))return null;
  const actors=[],kind=shot.visual?.travel||`priority/${ability.id}-travel`,age=this.sim.time,rad=angle*Math.PI/180,nx=-Math.sin(rad),ny=Math.cos(rad),trail=shot.trail||[];
  const add=(x,y,size,suffix,opacity=1,rotation=angle)=>{const v=this.effect(kind,x,y,`${key}-${suffix}`,age,size);v.opacity=opacity;v.transform=`rotate(${rotation}deg)`;actors.push(v);};
  if(ability.id==='aquaWave'){
   add(shot.x+nx*34,shot.y+ny*34,78,'upper',.66);add(shot.x,shot.y,116,'crest',1);add(shot.x-nx*34,shot.y-ny*34,78,'lower',.66);
   for(let i=Math.min(2,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x,p.y,96-i*15,`foam-${i}`,.34-i*.08);}
  }else if(ability.id==='hydroCannon'){
   for(let i=Math.min(6,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x,p.y,104-i*7,`column-${i}`,.78-i*.08);}
   add(shot.x,shot.y,126,'head',1);add(shot.x,shot.y,84,'core',.88,angle+180);
  }else if(ability.id==='waterPulse'){
   add(shot.x,shot.y,76,'core',1,0);add(shot.x,shot.y,96,'ring-a',.48,0);add(shot.x,shot.y,118,'ring-b',.24,0);
  }else if(ability.id==='solarSeed'){
   add(shot.x,shot.y,70,'seed',1,0);for(let i=0;i<4;i++){const orbit=age*5+i*Math.PI/2;add(shot.x+Math.cos(orbit)*27,shot.y+Math.sin(orbit)*18,25,`leaf-${i}`,.72,orbit*180/Math.PI);}
  }else if(ability.id==='fireBlast'){
   add(shot.x,shot.y,104,'glyph',1,angle);add(shot.x,shot.y,77,'heart',.82,angle+36);for(let i=Math.min(3,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x,p.y,58-i*8,`cinder-${i}`,.4-i*.08,angle+i*22);}
  }else if(ability.id==='flame'){
   for(let i=Math.min(4,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x+nx*Math.sin(age*18+i)*10,p.y+ny*Math.sin(age*18+i)*10,64-i*8,`plume-${i}`,.62-i*.09,angle);}
   add(shot.x,shot.y,82,'head',1,angle);
  }else if(ability.id==='ember'){
   add(shot.x,shot.y,52,'ember',1,angle);for(let i=Math.min(4,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x+nx*(i%2?8:-8),p.y+ny*(i%2?8:-8),26-i*3,`spark-${i}`,.7-i*.1,angle+i*19);}
  }else if(ability.id==='mudShot'){
   add(shot.x,shot.y,76,'mud-core',1,angle);for(let i=Math.min(4,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x+nx*(i%2?7:-7),p.y+ny*(i%2?7:-7),34-i*4,`mud-drop-${i}`,.66-i*.1,angle+i*21);}
  }else if(ability.id==='rockThrow'){
   add(shot.x,shot.y,82,'boulder',1,angle+age*260);for(let i=Math.min(3,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x+nx*(i%2?9:-9),p.y+ny*(i%2?9:-9),30-i*4,`rock-chip-${i}`,.58-i*.1,angle-age*190);}
  }else if(ability.id==='poisonSting'){
   add(shot.x,shot.y,70,'needle',1,angle);for(let i=Math.min(4,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x+nx*(i%2?6:-6),p.y+ny*(i%2?6:-6),24-i*3,`toxin-${i}`,.62-i*.09,angle);}
  }else{
   add(shot.x,shot.y,68,'blade',1,angle);add(shot.x+nx*18,shot.y+ny*18,35,'blade-left',.58,angle-24);add(shot.x-nx*18,shot.y-ny*18,35,'blade-right',.58,angle+24);
   for(let i=Math.min(2,trail.length)-1;i>=0;i--){const p=trail[trail.length-1-i];add(p.x,p.y,42-i*7,`cut-${i}`,.33-i*.09,angle+i*36);}
  }
  return actors;
 }
 priorityCastVfx(e,key,age){
  const actors=[],base=this.effect(e.vfx,e.x,e.y,`${key}-core`,age,e.size||82);actors.push(base);
  if(['hydroCannon','fireBlast','solarSeed','fireSpin','iceFang','vineBurst','blazeKick','sleepPowder','stunSpore'].includes(e.ability)){const halo=this.effect(e.vfx,e.x,e.y,`${key}-halo`,age,(e.size||82)*1.35);halo.opacity=.38;halo.transform=`rotate(${-age*90}deg)`;actors.unshift(halo);}
  return actors;
 }
 priorityImpactVfx(e,key,age){
  const actors=[],size=e.size||112,center=this.effect(e.vfx,e.x,e.y,`${key}-center`,age,size);actors.push(center);
  const orbit=(count,radius,scale,opacity=0.65)=>{for(let i=0;i<count;i++){const a=i*Math.PI*2/count+age*2.4,v=this.effect(e.vfx,e.x+Math.cos(a)*radius,e.y+Math.sin(a)*radius*.62,`${key}-orbit-${i}`,age+i*.04,size*scale);v.opacity=opacity;v.transform=`rotate(${i*360/count+age*80}deg)`;actors.push(v);}};
  if(e.ability==='hydroCannon')orbit(7,72,.42,.7);
  else if(e.ability==='fireBlast')orbit(5,58,.52,.72);
  else if(e.ability==='solarSeed')orbit(5,48,.4,.75);
  else if(e.ability==='leaf')orbit(4,38,.36,.62);
  else if(e.ability==='flame')orbit(4,35,.48,.62);
  else if(e.ability==='ember')orbit(5,30,.28,.72);
  else if(e.ability==='aquaWave')orbit(3,44,.62,.58);
  else if(e.ability==='waterPulse'){for(let i=1;i<=3;i++){const ring=this.effect(e.vfx,e.x,e.y,`${key}-ring-${i}`,age+i*.06,size*(.72+i*.28));ring.opacity=.5-i*.1;actors.unshift(ring);}}
  else if(e.ability==='vineBurst')orbit(4,48,.42,.72);
  else if(e.ability==='smokescreen')orbit(8,Math.min(112,size*.34),.34,.48);
  else if(e.ability==='fireSpin')orbit(8,Math.min(82,size*.34),.32,.76);
  else if(e.ability==='bite')orbit(2,22,.58,.68);
  else if(e.ability==='iceFang')orbit(6,42,.32,.82);
  else if(e.ability==='sandAttack')orbit(7,Math.min(78,size*.34),.3,.55);
  else if(e.ability==='mudSlap')orbit(6,Math.min(58,size*.32),.34,.66);
  else if(e.ability==='mudShot')orbit(7,Math.min(48,size*.32),.3,.7);
  else if(e.ability==='blazeKick')orbit(5,Math.min(44,size*.32),.38,.76);
  else if(e.ability==='rockThrow')orbit(6,Math.min(54,size*.34),.34,.78);
  else if(e.ability==='poisonSting')orbit(6,Math.min(42,size*.34),.3,.72);
  else if(e.ability==='sleepPowder')orbit(7,Math.min(64,size*.34),.34,.48);
  else if(e.ability==='stunSpore')orbit(8,Math.min(66,size*.34),.3,.72);
  return actors;
 }
 surfVfx(x,y,key,age,size=280){const actors=[],progress=Math.min(1,Math.max(0,age/.65)),pool=this.effect('moves/surfPool',x,y+10,`${key}-pool`,age,size);pool.opacity=.72;actors.push(pool);for(let i=1;i>=0;i--){const crest=this.effect('moves/surf',x-34+progress*(42+i*12),y-18+i*28,`${key}-crest-${i}`,age+i*.045,size*(i?.56:.76));crest.opacity=i?.48:.96;actors.push(crest);}return actors;}
 muddyWaterVfx(x,y,key,age,angle,size=154,trail=[]){const actors=[],radians=angle*Math.PI/180,dx=Math.cos(radians),dy=Math.sin(radians);for(let i=Math.min(3,trail.length)-1;i>=0;i--){const point=trail[trail.length-1-i],current=this.effect('moves/muddyCurrent',point.x,point.y+8,`${key}-current-${i}`,age-i*.055,size*(.82-i*.12));current.transform=`rotate(${angle}deg)`;current.opacity=.52-i*.1;actors.push(current);}if(!trail.length){for(let i=2;i>=0;i--){const current=this.effect('moves/muddyCurrent',x-dx*(20+i*22),y-dy*(20+i*22)+8,`${key}-current-${i}`,age-i*.055,size*(.74-i*.1));current.transform=`rotate(${angle}deg)`;current.opacity=.46-i*.09;actors.push(current);}}const crest=this.effect('moves/muddyWater',x,y,`${key}-crest`,age,size);crest.transform=`rotate(${angle}deg)`;actors.push(crest);return actors;}
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
   const priority=this.priorityProjectileVfx(shot,ability,angle,`shot-${shot.uid}`);if(priority){actors.push(...priority);continue;}
   if(shot.ability==='muddyWater'){actors.push(...this.muddyWaterVfx(shot.x,shot.y,`shot-${shot.uid}`,this.sim.time,angle,154,shot.trail));continue;}
   if(shot.visual)for(const [index,position] of shot.trail.entries()){const trail=this.effect(kind,position.x,position.y,`trail-${shot.uid}-${index}`,this.sim.time-index*.07,size*(.48+index*.1));trail.opacity=.17+index*.11;trail.transform=`rotate(${angle}deg)`;actors.push(trail);}
   const vfx=this.effect(kind,shot.x,shot.y,'shot-'+shot.uid,this.sim.time,size);if(shot.visual)vfx.transform=`rotate(${angle}deg)`;actors.push(vfx);
  }
  for(const [index,shot] of this.sim.enemyProjectiles.entries())actors.push(this.effect(shot.vfx,shot.x,shot.y,`enemy-shot-${index}`,this.sim.time,34));
  for(const attack of this.sim.activeAttacks){const a=ABILITIES[attack.id],age=this.sim.time-(attack.fireAt-(a.charge||0)),angle=Math.atan2(attack.direction.y,attack.direction.x)*180/Math.PI;
   if(attack.behavior==='beam'&&this.sim.time<attack.fireAt){actors.push(this.effect(attack.visual?.cast||a.vfx,p.x,p.y,`charge-${attack.uid}`,this.sim.time,attack.visual?.castSize||90));continue;}
   if(attack.behavior==='channel'){for(let i=1;i<=6;i++){const length=i*a.range/7,wobble=Math.sin(this.sim.time*19+i*2)*i*4,x=p.x+attack.direction.x*length-attack.direction.y*wobble,y=p.y+attack.direction.y*length+attack.direction.x*wobble,v=this.effect(attack.visual?.travel||a.vfx,x,y,`channel-${attack.uid}-${i}`,this.sim.time+i*.06,30+i*10);v.transform=`rotate(${angle}deg)`;actors.push(v);}}
   else if(attack.behavior==='beam'&&attack.fired){for(let i=0;i<8;i++){const length=(i+.5)*a.range/8,v=this.effect(attack.visual?.travel||a.vfx,p.x+attack.direction.x*length,p.y+attack.direction.y*length,`beam-${attack.uid}-${i}`,this.sim.time,65+i*2);v.transform=`rotate(${angle}deg)`;actors.push(v);}}
   else if(attack.behavior==='whip'){for(let lane=a.id==='vineBurst'?-1:0;lane<=(a.id==='vineBurst'?1:0);lane+=2)for(let i=1;i<=6;i++){const length=i*a.range/7,side=Math.sin(age*25+i*1.7+lane*.7)*17+lane*12,x=p.x+attack.direction.x*length-attack.direction.y*side,y=p.y+attack.direction.y*length+attack.direction.x*side,v=this.effect(attack.visual?.travel||a.vfx,x,y,`whip-${attack.uid}-${lane}-${i}`,this.sim.time+i*.035,a.id==='vineBurst'?62:48);v.transform=`rotate(${angle+lane*7}deg)`;v.opacity=.72+i*.045;actors.push(v);}}
  }
  for(const zone of this.sim.zones){const a=ABILITIES[zone.id],age=this.sim.time-(zone.until-a.duration),kind=zone.visual?.impact||a.vfx;const base=this.effect(kind,zone.x,zone.y,`zone-${zone.uid}`,age,Math.max(100,a.radius*1.8));base.opacity=.75;actors.push(base);
   if(zone.id==='inferno')for(let i=0;i<3;i++){const angle=this.sim.time*2.3+i*Math.PI*2/3,v=this.effect(zone.visual?.travel||a.vfx,zone.x+Math.cos(angle)*a.radius*.6,zone.y+Math.sin(angle)*a.radius*.35,`zone-flame-${zone.uid}-${i}`,this.sim.time+i*.2,70);actors.push(v);}
   if(zone.id==='whirlpool')for(let i=0;i<3;i++){const angle=this.sim.time*2+i*Math.PI*2/3,v=this.effect('pmd/0055',zone.x+Math.cos(angle)*a.radius*.45,zone.y+Math.sin(angle)*a.radius*.45,`zone-water-${zone.uid}-${i}`,this.sim.time+i*.2,57);actors.push(v);}
  }
  for(const [i,e]of this.effects.entries()){const age=this.sim.time-e.time,duration=e.duration||.65;if(age>duration)continue;const kind=e.vfx||(e.type==='heal'?'heal':e.type==='slash'?'slash':e.type==='kill'?'explosion':'impact');if(PRIORITY_MOVE_IDS.has(e.ability)){actors.push(...(e.type==='castVisual'?this.priorityCastVfx(e,`priority-cast-${i}-${e.time}`,age):this.priorityImpactVfx(e,`priority-impact-${i}-${e.time}`,age)));continue;}if(e.ability==='surf'){actors.push(...this.surfVfx(e.x,e.y,`surf-${i}-${e.time}`,age,e.type==='area'?Math.max(260,e.size||0):104));continue;}if(e.ability==='muddyWater'&&e.type==='castVisual'){const current=this.effect('moves/muddyCurrent',e.x,e.y,`muddy-cast-${i}-${e.time}`,age,105);current.opacity=.62;actors.push(current);continue;}if(e.ability==='earthquake'){const center=this.effect(kind,e.x,e.y,`earthquake-${i}-${e.time}`,age,Math.max(210,e.size||0));center.className='earthquake-vfx';actors.push(center);for(let j=0;j<5;j++){const angle=j*Math.PI*2/5+.35,ring=this.effect(kind,e.x+Math.cos(angle)*62,e.y+Math.sin(angle)*38,`earthquake-ring-${i}-${j}-${e.time}`,age+j*.035,92);ring.transform=`rotate(${j*72+18}deg)`;ring.opacity=.74;actors.push(ring);}continue;}actors.push(this.effect(kind,e.x,e.y,`${i}-${e.time}`,age,e.size||64));}
  for(const [i,e]of this.networkEffects.entries()){const age=this.sim.time-e.time;if(age<0||age>e.duration)continue;const t=Math.min(1,age/e.duration),moving=['projectile','wave'].includes(e.behavior),x=moving?e.x+(e.aimX-e.x)*t:e.aimX,y=moving?e.y+(e.aimY-e.y)*t:e.aimY,angle=Math.atan2(e.aimY-e.y,e.aimX-e.x)*180/Math.PI;
   if(PRIORITY_MOVE_IDS.has(e.ability)&&e.behavior==='stationary'){const event={...e,x,y,vfx:e.vfx,size:e.size};actors.push(...(e.phase==='cast'?this.priorityCastVfx(event,`online-priority-cast-${e.from}-${i}`,age):this.priorityImpactVfx(event,`online-priority-impact-${e.from}-${i}`,age)));continue;}
   if(['channel','beam','whip','zone'].includes(e.behavior)){
    if(e.behavior==='zone'){actors.push(this.effect(e.impactVfx||e.vfx,e.aimX,e.aimY,`online-zone-${e.from}-${i}`,age,Math.max(160,e.impactSize||0)));continue;}
    if(e.behavior==='beam'&&age<e.charge){actors.push(this.effect(e.castVfx||e.vfx,e.x,e.y,`online-charge-${e.from}-${i}`,age,e.castSize));continue;}
    const count=e.behavior==='channel'?6:e.behavior==='beam'?8:e.ability==='vineBurst'?6:5,lanes=e.ability==='vineBurst'?[-1,1]:[0];
    for(const lane of lanes)for(let j=1;j<=count;j++){const distance=j/(count+1),offset=e.behavior==='channel'?Math.sin(this.sim.time*18+j*2)*j*3:e.behavior==='whip'?Math.sin(this.sim.time*24+j*1.7+lane*.7)*17+lane*12:0,dx=(e.aimX-e.x),dy=(e.aimY-e.y),length=Math.max(1,Math.hypot(dx,dy)),px=e.x+dx*distance-dy/length*offset,py=e.y+dy*distance+dx/length*offset,v=this.effect(e.vfx,px,py,`online-pattern-${e.from}-${i}-${lane}-${j}`,age+j*.05,e.behavior==='beam'?70:e.behavior==='channel'?30+j*10:e.ability==='vineBurst'?62:48);v.transform=`rotate(${angle+lane*7}deg)`;actors.push(v);}continue;
   }
   if(e.ability==='surf'){actors.push(...this.surfVfx(x,y,`online-surf-${e.from}-${i}`,age,e.behavior==='area'?Math.max(260,e.size||0):104));continue;}
   if(e.ability==='muddyWater'&&e.behavior==='wave'){const trail=Array.from({length:3},(_,j)=>({x:e.x+(e.aimX-e.x)*Math.max(0,t-(j+1)*.08),y:e.y+(e.aimY-e.y)*Math.max(0,t-(j+1)*.08)}));actors.push(...this.muddyWaterVfx(x,y,`online-muddy-${e.from}-${i}`,age,angle,154,trail));continue;}
   if(PRIORITY_MOVE_IDS.has(e.ability)&&moving){const trail=Array.from({length:e.trail||4},(_,j)=>{const back=Math.max(0,t-(j+1)*.08);return {x:e.x+(e.aimX-e.x)*back,y:e.y+(e.aimY-e.y)*back};}),speed=Math.max(1,e.duration),shot={x,y,vx:(e.aimX-e.x)/speed,vy:(e.aimY-e.y)/speed,trail,visual:{travel:e.vfx}};actors.push(...this.priorityProjectileVfx(shot,ABILITIES[e.ability],angle,`online-priority-${e.from}-${i}`));continue;}
   if(e.trail)for(let j=1;j<=e.trail;j++){const back=Math.max(0,t-j*.08),trail=this.effect(e.vfx,e.x+(e.aimX-e.x)*back,e.y+(e.aimY-e.y)*back,`online-trail-${e.from}-${e.time}-${i}-${j}`,age-j*.07,(e.size||64)*(1-j*.15));trail.opacity=.35-j*.08;trail.transform=`rotate(${angle}deg)`;actors.push(trail);}
   if(e.ability==='earthquake'){const quake=this.effect(e.vfx,e.aimX,e.aimY,`online-earthquake-${e.from}-${i}`,age,Math.max(210,e.size||0));quake.className='earthquake-vfx';actors.push(quake);continue;}const sprite=this.effect(e.vfx,x,y,`online-${e.from}-${e.time}-${i}`,age,e.size||64);if(['projectile','wave'].includes(e.behavior)&&e.trail)sprite.transform=`rotate(${angle}deg)`;actors.push(sprite);
  }
  this.networkEffects=this.networkEffects.filter(e=>this.sim.time-e.time<=e.duration);
  if(p.evolutionUntil>this.sim.time)actors.push(this.effect('evolution',p.x,p.y,'evolve',this.sim.time-p.evolutionStart,100));
  this.effects=this.effects.filter(e=>this.sim.time-e.time<(e.duration||1.2));
  const localQuake=this.effects.find(e=>e.ability==='earthquake'&&this.sim.time-e.time>=0&&this.sim.time-e.time<(e.duration||1.12)),onlineQuake=this.networkEffects.find(e=>e.ability==='earthquake'&&this.sim.time-e.time>=0&&this.sim.time-e.time<1.12),quake=localQuake||onlineQuake;
  const localHeavy=this.effects.find(e=>['hydroCannon','fireBlast'].includes(e.ability)&&e.type==='impact'&&this.sim.time-e.time>=0&&this.sim.time-e.time<.62),onlineHeavy=this.networkEffects.find(e=>['hydroCannon','fireBlast'].includes(e.ability)&&e.phase==='impact'&&this.sim.time-e.time>=0&&this.sim.time-e.time<.62),heavy=localHeavy||onlineHeavy,shake=quake||heavy,shakeAge=shake?this.sim.time-shake.time:0,shakeDuration=quake?1.12:.62,shakeFade=shake?Math.max(0,1-shakeAge/shakeDuration):0,shakePower=quake?14:heavy?.ability==='hydroCannon'?9:7,quakeX=shake?Math.sin(shakeAge*(quake?92:74))*shakePower*shakeFade:0,quakeY=shake?Math.cos(shakeAge*(quake?71:59))*shakePower*.3*shakeFade:0;
  this.quakeFlash.style.opacity=quake?String(.08+.2*Math.sin(Math.min(1,shakeAge/.25)*Math.PI)):heavy?String(.04+.09*Math.sin(Math.min(1,shakeAge/.18)*Math.PI)):'0';
  this.worldView.render(this.canvas,{...this.camera,x:this.camera.x-quakeX/this.zoom,y:this.camera.y-quakeY/this.zoom,zoom:this.zoom,width:this.width,height:this.height},{actors});
  const cycle=worldDaylight(),vision=nightVision(this.sim.map.layer==='cave'?{darkness:.55}:cycle,this.width,this.height,!!this.sim.map.scene&&!this.sim.map.layer),playerScreen={x:(p.x-this.camera.x)*this.zoom+this.width/2,y:(p.y-this.camera.y)*this.zoom+this.height/2};
  this.lighting.style.setProperty('--vision-x',`${playerScreen.x}px`);this.lighting.style.setProperty('--vision-y',`${playerScreen.y}px`);this.lighting.style.setProperty('--vision-inner',`${vision.innerRadius}px`);this.lighting.style.setProperty('--vision-outer',`${vision.outerRadius}px`);
  if(Math.abs(vision.strength-(this.lightOpacity||0))>.002){this.lighting.style.opacity=String(vision.strength);this.lightOpacity=vision.strength;}
  const hours=String(Math.floor(cycle.hour)).padStart(2,'0'),minutes=String(Math.floor(cycle.hour%1*60)).padStart(2,'0'),clockText=`${this.sim.map.layer?this.sim.map.name+' · ':''}${cycle.isNight?'☾':'☀'} ${hours}:${minutes}`;if(this.clock.textContent!==clockText)this.clock.textContent=clockText;
  this.drawOverlays();
 }
 drawOverlays(){const sim=this.sim,p=sim.player,point=(x,y)=>({x:(x-this.camera.x)*this.zoom+this.width/2,y:(y-this.camera.y)*this.zoom+this.height/2});const markers=[];
  const marker=(cls,x,y,w,h,text='')=>{const a=point(x,y);markers.push(`<span class="${cls}" style="left:${a.x}px;top:${a.y}px;width:${w*this.zoom}px;height:${h*this.zoom}px">${text}</span>`);};
  if(!sim.map.scene)for(const zone of CITY_SAFE_ZONES)if(Math.hypot(zone.x-p.x,zone.y-p.y)<1600)marker('safe-zone-circle',zone.x-zone.radius,zone.y-zone.radius,zone.radius*2,zone.radius*2);
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



