import {createInterior} from './collisions.js';
import {encounterStats,cleanInventory} from './encounters.js';
import {effectiveness,effectivenessText,combatEffectiveness} from './type-system.js';
import {prepareBossAttack,bossAttackHits,REGIONAL_BOSSES} from './boss-attacks.js';
import {enemySkillSet} from './enemy-skills.js';
import { Discovery, ObjectPool } from './world-runtime.js';
import { STARTERS, CREATURES, WILD_POKEMON, SPAWN_RARITIES, BOSS, ABILITIES, LEARNSETS, EVOLUTIONS, XP_CURVE, REGION, SPAWN_ZONES } from './data.js';
import {starterAttackVisual} from './starter-attack-vfx.js';
import {pokeballById,pokeballCaptureChance} from './pokeballs.js';
import { applyStats, applyEvolutions, nextEvolution } from './progression.js';
import { clearSegment, createMap, distance, findPath, findPathNearObstacle, followPath, lineOfSight, walkable } from './world.js';

export class Simulation {
  constructor(starter = 'bulbasaur', options = {}) {
    if(options.activePokemon?.id&&Object.hasOwn(CREATURES,options.activePokemon.id))starter=options.activePokemon.id;
    if (!Object.hasOwn(CREATURES, starter)) throw new RangeError('Criatura inicial inválida');
    this.definition = CREATURES[starter];
    this.spawnEpoch=Number.isInteger(options.spawnEpoch)?options.spawnEpoch:Math.floor(Date.now()/300000); this.map = createMap(options.seed,this.spawnEpoch); this.discovery = new Discovery(this.map, options.seen || []); this.projectilePool = new ObjectPool(96); this.creaturePool = new ObjectPool(48); this.dormant = new Map(); this.streamAt = 0; this.time = 0; this.kills = 0; this.events = []; this.projectiles = []; this.enemyProjectiles=[]; this.activeAttacks=[]; this.zones=[]; this.pendingShots=[]; this.nextId = 1;
    this.quest = { id: 'clear-clareira', goal: 3, progress: 0, complete: false, rewardXp: 60, drops: [] };
    this.inventory=cleanInventory(options.inventory);
    this.pc=Array.isArray(options.pc)?options.pc:[];this.capturePlan=options.capturePlan&&typeof options.capturePlan==='object'?options.capturePlan:{enabled:false,speciesId:'caterpie'};this.captureSerial=Number(options.captureSerial)||this.pc.length;
    const grass=['bulbasaur','chikorita','treecko'].includes(starter),fire=['charmander','cyndaquil','torchic'].includes(starter);
    this.player = { ...this.definition, ...REGION.spawn, maxHp: this.definition.hp, level: 1, xp: 0, evolutionHistory: [], slots: [null, null, null, null], knownMoves:[], cooldowns: {}, buffs:[], path: [], facing: { x: 0, y: 1 }, dead: false, target: null, attributePoints: options.attributePoints||0, attributes: options.attributes||{vitality:0,power:0,guard:0,agility:0}, nature: options.nature||(grass?'Calma':fire?'Brava':'Serena'), ability: options.ability||(grass?'Clorofila':fire?'Chama do Sol':'Couraça Torrencial') };
    if(options.activePokemon&&options.activePokemon.id===starter)Object.assign(this.player,options.activePokemon,{...REGION.spawn,path:[],target:null,moving:false,dead:false,cooldowns:{}});
    if(this.player.captureId?.startsWith('starter-')){const ratio=this.player.hp/Math.max(1,this.player.maxHp);applyStats(this.player);this.player.hp=Math.min(this.player.maxHp,Math.ceil(this.player.maxHp*ratio));}
    this.enemies = REGION.spawnZones.slice(0,2).map((pos, i) => { const zone = SPAWN_ZONES[i % SPAWN_ZONES.length],species=[WILD_POKEMON[0],WILD_POKEMON.find(p=>p.id==='pidgey')][i]; return { ...species, ...pos, home: { ...pos }, zoneId: zone.id, levelRange: zone.level, maxHp: species.hp, uid: i + 1, state: 'Idle', timer: i * .7, cooldown: 0, path: [], facing: { x: 0, y: 1 }, moving: false }; });
    for(const poi of this.map.pois.filter(p=>p.kind==='boss')){
      const variant=REGIONAL_BOSSES[poi.id];if(!variant)continue;
      const home={x:poi.x,y:poi.y};
      const boss={...BOSS,...variant,element:CREATURES[variant.id].element,...home,home,maxHp:variant.hp||BOSS.hp,state:'Idle',phase:1,timer:2,cooldown:0,path:[],facing:{x:0,y:1},telegraph:null,defeated:false};
      this.enemies.push(boss);
      if(poi.id==='arena-guardiao')this.boss=boss;
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3,pos={x:boss.x+Math.cos(angle)*150,y:boss.y+Math.sin(angle)*150};
        const speciesId=variant.guards[i],species=WILD_POKEMON.find(p=>p.id===speciesId);
        this.enemies.push({...species,...pos,home:{...pos},uid:1100+(boss.uid-1000)*10+i,horde:true,bossUid:boss.uid,minLevel:Math.max(1,(boss.minLevel||1)-8),maxHp:species.hp,state:'Idle',timer:2,cooldown:0,path:[],facing:{x:0,y:1}});
      }
    }
    for (const e of this.enemies) {
      if (!walkable(this.map,e.x,e.y,e.radius)) {
        outer: for(let r=1;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++) {const x=(Math.floor(e.x/32)+dx+.5)*32,y=(Math.floor(e.y/32)+dy+.5)*32;if(walkable(this.map,x,y,e.radius)){e.x=x;e.y=y;e.home={x,y};break outer;}}
      }
    }
    for(const e of this.enemies){const species=e.isBoss?e:WILD_POKEMON.find(s=>s.id===e.id);Object.assign(e,encounterStats(species,this.map,e,e.uid,{boss:e.isBoss,horde:e.horde}));e.skills=e.isBoss?e.attacks:enemySkillSet(e.element,e.level);}
    this.bossGuards=this.enemies.filter(e=>e.horde);
    this.player.hurtbox={radius:12,layer:32}; this.player.collisionLayer=2;
    for(const e of this.enemies){e.hurtbox={radius:e.radius,layer:32};e.collisionLayer=4;e.navigation={maxPathNodes:1500};}
    this.discovery.reveal(this.player);
    for(const evolution of applyEvolutions(this.player,this.time))this.emit('evolve',evolution);
    this.definition=CREATURES[this.player.id];
    this.learn();
  }
  emit(type, data = {}) { this.events.push({ type, time: this.time, ...data }); if (this.events.length > 100) this.events.shift(); }
  activeSnapshot(){const p=this.player;return Object.fromEntries(['captureId','id','name','element','level','xp','hp','maxHp','attack','defense','speed','nature','ability','attributePoints','attributes','evolutionHistory','knownMoves','slots'].map(k=>[k,p[k]]));}
  syncActivePokemon(){if(!this.player.captureId)return;const index=this.pc.findIndex(p=>p.captureId===this.player.captureId);if(index>=0)this.pc[index]={...this.pc[index],...this.activeSnapshot()};}
  configureCapture(speciesId,enabled=true,ballId=this.capturePlan.ballId||'poke'){if(!WILD_POKEMON.some(p=>p.id===speciesId))return false;this.capturePlan={speciesId,enabled:!!enabled,ballId:pokeballById(ballId).id};this.emit('captureConfigured',{...this.capturePlan});return true;}
  buyPokeballs(count=1,ballId='poke'){const ball=pokeballById(ballId);if(ball.price===null)return false;count=Math.max(1,Math.min(99,Math.floor(count)));const cost=count*ball.price;if(this.inventory.money<cost)return false;this.inventory.money-=cost;this.inventory.items[ball.name]=(this.inventory.items[ball.name]||0)+count;this.emit('purchase',{count,cost,ball:ball.name});return true;}
  captureDefeated(e){const ball=pokeballById(this.capturePlan.ballId);if(!this.capturePlan.enabled||this.capturePlan.speciesId!==e.id||!(this.inventory.items[ball.name]>0))return;this.inventory.items[ball.name]--;if(!this.inventory.items[ball.name])delete this.inventory.items[ball.name];const base=SPAWN_RARITIES[e.spawnRarity]?.captureChance||.35,chance=pokeballCaptureChance(base,e.level,ball.id,this.map.scene),roll=((Math.imul(e.uid+this.kills+1,2654435761)^this.map.seed)>>>0)/4294967296;this.emit('captureThrow',{name:e.name,chance,ball:ball.name});if(roll>chance){this.emit('captureFail',{name:e.name,chance,ball:ball.name});return;}const natures=['Calma','Brava','Serena','Audaz','Tímida'],abilities=['Instinto','Foco','Resistência','Impulso','Sintonia'],captureId=`capture-${++this.captureSerial}-${e.id}`,iv=(salt)=>1+(((e.uid*31+salt*17)>>>0)%10);const specimen={captureId,id:e.id,name:e.name,element:e.element,level:e.level,xp:0,nature:natures[(e.uid+e.level)%natures.length],ability:abilities[(e.uid*3+e.level)%abilities.length],attributePoints:0,attributes:{vitality:iv(1),power:iv(2),guard:iv(3),agility:iv(4)},evolutionHistory:[],knownMoves:[],slots:[null,null,null,null],hp:e.maxHp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,speed:Math.round((CREATURES[e.id]?.speed||80)*(1+iv(4)/100)),rarity:e.spawnRarity,rarityName:e.spawnRarityName};this.pc.push(specimen);this.emit('captured',{name:e.name,specimen,ball:ball.name});}
  selectCaptured(captureId){const specimen=this.pc.find(p=>p.captureId===captureId);if(!specimen||!CREATURES[specimen.id])return false;this.syncActivePokemon();const position={x:this.player.x,y:this.player.y};this.definition=CREATURES[specimen.id];this.player={...this.definition,...specimen,...position,hp:Math.min(specimen.hp||specimen.maxHp,specimen.maxHp),slots:specimen.slots||[null,null,null,null],knownMoves:specimen.knownMoves||[],cooldowns:{},buffs:[],path:[],facing:{x:0,y:1},dead:false,target:null,hurtbox:{radius:12,layer:32},collisionLayer:2};if(specimen.captureId?.startsWith('starter-')){const ratio=this.player.hp/Math.max(1,this.player.maxHp);applyStats(this.player);this.player.hp=Math.min(this.player.maxHp,Math.ceil(this.player.maxHp*ratio));}this.learn();this.emit('pokemonSelected',{name:specimen.name,level:specimen.level});return true;}
  learn() { const p=this.player,stages=[p.id];for(let i=0;i<Object.keys(CREATURES).length;i++){const previous=EVOLUTIONS.find(e=>e.targetCreatureId===stages[0]);if(!previous)break;stages.unshift(previous.creatureId);}p.knownMoves??=[];for(const id of stages)for(const row of LEARNSETS[id]||[])if(row.level<=p.level&&ABILITIES[row.ability]&&!p.knownMoves.includes(row.ability)){p.knownMoves.push(row.ability);if(Number.isInteger(row.slot)&&!p.slots[row.slot])p.slots[row.slot]=row.ability;this.emit('learn',{name:ABILITIES[row.ability].name,ability:row.ability});} }
  equipMove(abilityId,slot){const p=this.player;if(!Number.isInteger(slot)||slot<0||slot>3||(slot===2&&p.level<10)||(slot===3&&p.level<25)||!p.knownMoves?.includes(abilityId)||!ABILITIES[abilityId])return false;const previous=p.slots.indexOf(abilityId);if(previous>=0)p.slots[previous]=p.slots[slot]||null;p.slots[slot]=abilityId;this.emit('moveEquipped',{name:ABILITIES[abilityId].name,slot});return true;}
  gainXP(amount) {
    const p = this.player;
    if (!Number.isFinite(amount) || amount <= 0) return;
    p.xp += amount;
    while (p.xp >= XP_CURVE[p.level]) {
      p.xp -= XP_CURVE[p.level]; p.level++; p.attributePoints++; applyStats(p); p.hp = p.dead ? 0 : p.maxHp;
      this.emit('level', { level: p.level });
      for (const evolution of applyEvolutions(p, this.time)) this.emit('evolve', evolution);
      this.definition = CREATURES[p.id];
      this.learn();
    }
  }
  investAttribute(name){if(!['vitality','power','guard','agility'].includes(name)||this.player.attributePoints<1)return false;this.player.attributePoints--;this.player.attributes[name]++;applyStats(this.player);this.player.hp=Math.min(this.player.maxHp,this.player.hp+(name==='vitality'?8:0));this.emit('attribute',{name});return true;}
  applyPlayerStatus(a){
    if(!a||a.behavior!=='debuff')return false;
    const p=this.player;
    p.buffs=(p.buffs||[]).filter(b=>b.id!==`pvp-${a.id}`);
    if(a.attackMultiplier||a.defenseMultiplier||a.speedMultiplier)p.buffs.push({id:`pvp-${a.id}`,remaining:a.duration,attackMultiplier:a.attackMultiplier,defenseBonus:a.defenseMultiplier?-(p.defense*(1-a.defenseMultiplier)):0,speedMultiplier:a.speedMultiplier});
    if(a.sleep)p.sleepUntil=this.time+a.duration;
    if(a.yawn)p.yawnAt=this.time+1.2;
    if(a.poison)p.poison={until:this.time+a.duration,nextTick:this.time+1,stacks:0};
    if(a.leech)p.leech={until:this.time+a.duration,nextTick:this.time+1};
    if(a.ailment==='paralysis')p.buffs.push({id:`pvp-${a.id}`,remaining:a.duration||3,speedMultiplier:.55});
    if(a.ailment==='confusion')p.sleepUntil=Math.max(p.sleepUntil||0,this.time+.6);
    return true;
  }
  command(command) {
    const p = this.player;
    if (!command || p.dead || p.evolutionUntil>this.time || p.sleepUntil>this.time) return false;
    if(command.type==='interact'){const target=command.id?this.map.interactions.find(i=>i.id===command.id):this.map.interactions.find(i=>distance(i,p)<i.radius);if(!target)return false;if(distance(target,p)<=target.radius){this.interact(target);return true;}p.target=null;p.path=findPath(this.map,p,target);this.pendingInteraction=p.path.length?target:null;return p.path.length>0;}
    if (command.type === 'move') {
      this.pendingInteraction=null;
      if (!Number.isFinite(command.x) || !Number.isFinite(command.y)) return false;
      // Every new move replaces the entire previous intent, including pursuit.
      p.target = null; p.pendingCast = null; p.repathAt = 0; p.moving = false; p.attackUntil = 0;
      p.path = findPathNearObstacle(this.map, p, command); return p.path.length > 0;
    }
    if (command.type === 'target') {
      const target = this.enemies.find(e => e.uid === command.id && e.state !== 'Dead');
      if (!target) return false;
      if(p.pendingCast?.targetId!==target.uid)p.pendingCast=null;
      p.target = target.uid; p.path = []; p.repathAt = 0; return true;
    }
    if (command.type === 'cast' && Number.isInteger(command.slot) && command.slot >= 0 && command.slot < 4 && (command.slot!==2||p.level>=10) && (command.slot!==3||p.level>=25)) {
      const ability = ABILITIES[p.slots[command.slot]];
      if (!ability || !Number.isFinite(command.x) || !Number.isFinite(command.y)) return false;
      if(this.cast(ability, command, command.remoteTarget)){p.pendingCast=null;return true;}
      if(ability.behavior!=='direct'||command.remoteTarget||(p.cooldowns[ability.id]||0)>0)return false;
      const target=this.enemies.find(e=>e.uid===(command.targetId??p.target)&&e.state!=='Dead'&&!e.defeated);
      if(!target)return false;
      p.pendingCast={ability:ability.id,targetId:target.uid};p.target=target.uid;p.path=[];p.repathAt=0;
      return 'queued';
    }
    return false;
  }
  cast(a, aim, remoteTarget = null) {
    const p = this.player;
    if (p.dead || p.sleepUntil>this.time || (p.cooldowns[a.id] || 0) > 0) return false;
    const visual=starterAttackVisual(p.baseCreature||p.id,a.id);
    const attackMultiplier=(p.buffs||[]).reduce((value,b)=>value*(b.attackMultiplier||1)*(b.typeBoost?.[a.type]||1),1);
    if(a.behavior==='teleport'){
      const d=distance(p,aim);if(d<4)return false;
      const wanted={x:p.x+(aim.x-p.x)/d*Math.min(d,a.range),y:p.y+(aim.y-p.y)/d*Math.min(d,a.range)};
      let landing=null;
      for(let radius=0;radius<=64&&!landing;radius+=16)for(let angle=0;angle<8;angle++){
        const x=wanted.x+Math.cos(angle*Math.PI/4)*radius,y=wanted.y+Math.sin(angle*Math.PI/4)*radius;
        if(walkable(this.map,x,y,p.radius)){landing={x,y};break;}
      }
      if(!landing)return false;
      this.emit('buff',{x:p.x,y:p.y,vfx:a.vfx,name:a.name});
      Object.assign(p,landing,{path:[],target:null,moving:false});
      this.emit('buff',{x:p.x,y:p.y,vfx:a.vfx,name:a.name});
    } else if (a.behavior === 'heal') {
      if (p.hp === p.maxHp) return false;
      const healing = Math.min(a.healing, p.maxHp - p.hp); p.hp += healing; this.emit('heal', { x: p.x, y: p.y, amount: healing, vfx:a.vfx||'heal' });
    } else if (a.behavior === 'projectile'||a.behavior==='wave') {
      const d=distance(p,aim);if(d<1||this.projectiles.length>=90)return false;
      const direction={x:(aim.x-p.x)/d,y:(aim.y-p.y)/d};
      if(a.charge)this.pendingShots.push({at:this.time+a.charge,ability:a.id,direction,visual,attackMultiplier});
      else this.spawnShots(a,direction,visual,attackMultiplier);
    } else if (a.behavior === 'direct') {
      const candidates=this.enemies.filter(e=>e.state!=='Dead'&&!e.defeated&&distance(p,e)<=a.range&&lineOfSight(this.map,p,e));
      const selectedId=aim.targetId??p.target;
      const e=selectedId!=null?candidates.find(e=>e.uid===selectedId):candidates.sort((left,right)=>distance(left,aim)-distance(right,aim))[0];
      const target=remoteTarget||e;
      if(!target||distance(p,target)>a.range||!lineOfSight(this.map,p,target))return false;
      if(a.lunge){const length=Math.min(a.lunge,Math.max(0,distance(p,target)-p.radius-(target.radius||12)-2)),d=Math.max(1,distance(p,target)),dx=(target.x-p.x)/d,dy=(target.y-p.y)/d;for(let step=4;step<=length;step+=4){const x=p.x+dx*4,y=p.y+dy*4;if(!walkable(this.map,x,y,p.radius))break;p.x=x;p.y=y;}p.path=[];p.target=null;}
      if(target===e){const mult=effectiveness(a.type||'Normal',e.element);let dealt=0;for(let hit=0;hit<(a.hits||1)&&e.state!=='Dead';hit++)dealt+=this.damage(e,(p.attack+a.damage)*combatEffectiveness(mult)*attackMultiplier/(a.hits||1),a.type||'Normal');if(a.recoil&&dealt)p.hp=Math.max(1,p.hp-Math.max(1,Math.round(dealt*a.recoil)));
        if(!e.isBoss&&e.state!=='Dead'){if(a.stagger)e.staggerUntil=this.time+a.stagger;if(a.slow)e.slowUntil=this.time+a.slow;}this.applyEnemyEffect(e,a);
        for(let hit=0;hit<(a.hits||1);hit++)this.emit('slash',{x:e.x+(hit?10:-10),y:e.y+(hit?-6:6),vfx:visual?.impact||a.vfx||'slash',size:visual?.impactSize||78,effectiveness:effectivenessText(mult)});
      }else this.emit('slash',{x:target.x,y:target.y,vfx:a.vfx||`moves/${a.id}`,size:78});
    } else if(a.behavior==='area'){
      let x=a.selfCentered?p.x:aim.x,y=a.selfCentered?p.y:aim.y;const d=Math.hypot(x-p.x,y-p.y),range=a.range||0;if(range&&d>range){x=p.x+(x-p.x)/d*range;y=p.y+(y-p.y)/d*range;}const center={x,y};if(!walkable(this.map,x,y,0)||!lineOfSight(this.map,p,center))return false;let hits=0;for(const e of this.enemies)if(e.state!=='Dead'&&!e.defeated&&Math.hypot(e.x-x,e.y-y)<=a.radius+e.radius&&lineOfSight(this.map,center,e)){const mult=effectiveness(a.type||'Normal',e.element);this.damage(e,(p.attack+a.damage)*combatEffectiveness(mult)*attackMultiplier,a.type||'Normal');this.applyEnemyEffect(e,a);hits++;}this.emit('area',{x,y,size:Math.max(a.radius*2,visual?.impactSize||0),vfx:visual?.impact||a.vfx||'impact',hits});
    } else if(a.behavior==='rolling'){
      p.buffs??=[];p.buffs=p.buffs.filter(b=>b.id!==a.id);p.buffs.push({id:a.id,remaining:a.duration,speedMultiplier:a.speedMultiplier,hitAt:{}});
      this.emit('buff',{x:p.x,y:p.y,vfx:a.vfx,name:a.name});
    } else if(['channel','beam','whip'].includes(a.behavior)){
      const d=distance(p,aim);if(d<1)return false;
      const direction={x:(aim.x-p.x)/d,y:(aim.y-p.y)/d};
      this.activeAttacks.push({uid:this.nextId++,id:a.id,behavior:a.behavior,direction,visual,until:this.time+(a.duration||a.charge||.35)+(a.behavior==='beam'?.42:0),fireAt:this.time+(a.charge||0),nextTick:this.time,ticks:0,attackMultiplier,fired:false});
    } else if(a.behavior==='zone'){
      let x=aim.x,y=aim.y;const d=distance(p,aim);if(d>a.range){x=p.x+(aim.x-p.x)/d*a.range;y=p.y+(aim.y-p.y)/d*a.range;}
      if(!walkable(this.map,x,y,0)||!lineOfSight(this.map,p,{x,y}))return false;
      this.zones.push({uid:this.nextId++,id:a.id,x,y,visual,until:this.time+a.duration,nextTick:this.time,attackMultiplier});
    } else if(a.behavior==='debuff'){
      let x=aim.x,y=aim.y,d=distance(p,aim);if(d>a.range){x=p.x+(x-p.x)/d*a.range;y=p.y+(y-p.y)/d*a.range;}const center={x,y};if(!lineOfSight(this.map,p,center))return false;
      const targets=this.enemies.filter(e=>e.state!=='Dead'&&!e.defeated&&distance(e,center)<=a.radius+(e.radius||12)&&lineOfSight(this.map,center,e));
      if(!targets.length)return false;
      for(const e of targets)this.applyEnemyEffect(e,a,true);
      this.emit('area',{x,y,size:a.radius*2,vfx:a.vfx,hits:targets.length});
    } else if(a.behavior==='buff'){
      p.buffs??=[];p.buffs=p.buffs.filter(b=>b.id!==a.id);p.buffs.push({id:a.id,remaining:a.duration,attackMultiplier:a.attackMultiplier,defenseBonus:a.defenseBonus,speedMultiplier:a.speedMultiplier,typeBoost:a.typeBoost});this.emit('buff',{x:p.x,y:p.y,vfx:a.vfx||'buff',name:a.name});
    }
    if (!['heal','buff'].includes(a.behavior)) {
      const target = aim;
      const d = distance(p, target);
      if (d > 0) p.attackFacing = { x: (target.x - p.x) / d, y: (target.y - p.y) / d };
    }
    p.cooldowns[a.id] = a.cooldown; p.attackStart = this.time;
    p.attackAnimation = ['direct','area','rolling','whip'].includes(a.behavior) ? 'Attack' : 'Shoot'; p.attackUntil = this.time + (a.charge||.45);
    if(visual)this.emit('castVisual',{x:p.x,y:p.y,vfx:visual.cast,size:visual.castSize});
    this.emit('cast', { ability: a.id }); return true;
  }
  applyEnemyEffect(e,a,guaranteed=false){
    if(e.state==='Dead'||e.defeated)return;
    const chance=a.chance||100,roll=(Math.imul((e.uid||1)+Math.floor(this.time*1000)+a.id.length*31,2654435761)>>>0)%100;
    if(!guaranteed&&roll>=chance)return;
    if(a.attackMultiplier||a.defenseMultiplier||a.speedMultiplier){
      e.debuffs=(e.debuffs||[]).filter(b=>b.id!==a.id&&b.until>this.time);
      e.debuffs.push({id:a.id,until:this.time+(a.duration||6),attackMultiplier:a.attackMultiplier||1,defenseMultiplier:a.defenseMultiplier||1,speedMultiplier:a.speedMultiplier||1});
    }
    if(e.isBoss&&['sleep','yawn'].some(key=>a[key]))return;
    if(a.sleep)e.sleepUntil=this.time+a.duration;
    if(a.yawn)e.yawnAt=this.time+1.2;
    if(a.poison||a.ailment==='poison')e.poison={until:this.time+(a.duration||7),nextTick:this.time+1,stacks:0};
    if(a.leech)e.leech={until:this.time+a.duration,nextTick:this.time+1};
    if(a.ailment==='burn')e.burn={until:this.time+6,nextTick:this.time+1};
    if(a.ailment==='paralysis')e.slowUntil=Math.max(e.slowUntil||0,this.time+3);
    if(a.ailment==='confusion')e.staggerUntil=Math.max(e.staggerUntil||0,this.time+.6);
    if(a.ailment||a.sleep||a.poison||a.leech||a.yawn)this.emit('status',{x:e.x,y:e.y,uid:e.uid,name:a.name,vfx:a.vfx});
  }
  updateEnemyConditions(e){
    if(e.yawnAt&&this.time>=e.yawnAt){e.sleepUntil=this.time+2.5;e.yawnAt=0;}
    for(const [key,rate] of [['poison',.025],['burn',.018],['leech',.025]]){
      const condition=e[key];if(!condition)continue;if(this.time>=condition.until){e[key]=null;continue;}
      if(this.time<condition.nextTick)continue;condition.nextTick=this.time+1;
      if(key==='poison')condition.stacks=Math.min(4,(condition.stacks||0)+1);
      const conditionRate=e.isBoss?rate*.2:rate;
      const dealt=this.damage(e,Math.max(2,Math.ceil(e.maxHp*conditionRate*(key==='poison'?condition.stacks:1))+e.defense));
      if(key==='leech'&&dealt&&!this.player.dead)this.player.hp=Math.min(this.player.maxHp,this.player.hp+dealt);
      if(e.state==='Dead')break;
    }
  }
  spawnShots(a,direction,visual,attackMultiplier=1){
    const p=this.player,count=a.pellets||1,baseAngle=Math.atan2(direction.y,direction.x);
    for(let i=0;i<count&&this.projectiles.length<96;i++){
      const angle=baseAngle+(i-(count-1)/2)*(a.spread||0),dx=Math.cos(angle),dy=Math.sin(angle);
      this.projectiles.push(this.projectilePool.take({uid:this.nextId++,x:p.x+dx*13,y:p.y+dy*13,vx:dx*a.speed,vy:dy*a.speed,remaining:a.range,ability:a.id,visual,trail:[],trailAt:0,hitIds:new Set(),bonusDamage:(p.ability==='Chama do Sol'&&p.hp/p.maxHp<.5?1.15:1)*attackMultiplier*(a.pelletScale||1),hitbox:{radius:a.width||5,layer:16}}));
    }
  }
  lineTargets(origin,direction,range,width){
    return this.enemies.filter(e=>{if(e.state==='Dead'||e.defeated||!lineOfSight(this.map,origin,e))return false;const x=e.x-origin.x,y=e.y-origin.y,along=x*direction.x+y*direction.y,cross=Math.abs(x*direction.y-y*direction.x);return along>=0&&along<=range+(e.radius||12)&&cross<=width+(e.radius||12);});
  }
  updateSpecialAttacks(){
    const p=this.player;
    for(const pending of this.pendingShots.filter(shot=>shot.at<=this.time))if(!p.dead)this.spawnShots(ABILITIES[pending.ability],pending.direction,pending.visual,pending.attackMultiplier);
    this.pendingShots=this.pendingShots.filter(shot=>shot.at>this.time);
    for(const active of this.activeAttacks){
      const a=ABILITIES[active.id];if(p.dead)continue;
      if(active.behavior==='beam'){
        if(!active.fired&&this.time>=active.fireAt){active.fired=true;for(const e of this.lineTargets(p,active.direction,a.range,18)){const mult=effectiveness(a.type,e.element);this.damage(e,(p.attack+a.damage)*combatEffectiveness(mult)*active.attackMultiplier,a.type);}this.emit('beamFired',{x:p.x,y:p.y,ability:a.id});}
      }else if(active.behavior==='channel'){
        if(this.time>=active.nextTick&&this.time<=active.until){active.nextTick=this.time+a.hitInterval;for(const e of this.enemies){if(e.state==='Dead'||e.defeated||!lineOfSight(this.map,p,e))continue;const x=e.x-p.x,y=e.y-p.y,along=x*active.direction.x+y*active.direction.y,cross=Math.abs(x*active.direction.y-y*active.direction.x);if(along<0||along>a.range||cross>12+along*.32+(e.radius||12))continue;const mult=effectiveness(a.type,e.element);this.damage(e,(p.attack+a.damage)*combatEffectiveness(mult)*active.attackMultiplier,a.type);}}
      }else if(active.behavior==='whip'&&active.ticks<2&&this.time>=active.nextTick){
        active.ticks++;active.nextTick=this.time+.16;for(const e of this.lineTargets(p,active.direction,a.range,23)){const mult=effectiveness(a.type,e.element);this.damage(e,(p.attack+a.damage*.62)*combatEffectiveness(mult)*active.attackMultiplier,a.type);}
      }
    }
    this.activeAttacks=this.activeAttacks.filter(active=>!p.dead&&active.until>this.time);
    for(const zone of this.zones){
      if(this.time<zone.nextTick||p.dead)continue;const a=ABILITIES[zone.id];zone.nextTick=this.time+a.hitInterval;
      for(const e of this.enemies){if(e.state==='Dead'||e.defeated||distance(e,zone)>a.radius+(e.radius||12)||!lineOfSight(this.map,zone,e))continue;const mult=effectiveness(a.type,e.element);this.damage(e,(p.attack+a.damage)*combatEffectiveness(mult)*zone.attackMultiplier,a.type);
        if(zone.id==='whirlpool'&&!e.isBoss&&e.state!=='Dead'){const d=Math.max(1,distance(e,zone)),x=e.x+(zone.x-e.x)/d*10,y=e.y+(zone.y-e.y)/d*10;if(walkable(this.map,x,y,e.radius||12)){e.x=x;e.y=y;e.path=[];}}
      }
    }
    this.zones=this.zones.filter(zone=>!p.dead&&zone.until>this.time);
  }
  damage(e, amount) {
    if (e.state === 'Dead' || e.defeated) return 0;
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const defenseMultiplier=(e.debuffs||[]).filter(b=>b.until>this.time).reduce((value,b)=>value*(b.defenseMultiplier||1),1);
    const damage = Math.max(1, Math.round(amount - e.defense*defenseMultiplier)); e.hp = Math.max(0, e.hp - damage);
    this.emit('damage', { x: e.x, y: e.y, uid:e.uid, amount: damage }); e.hitUntil = this.time + .16;
    if (e.hp === 0) {
      e.deathStart=this.time;e.state = 'Dead'; e.path = []; this.kills++; this.gainXP(e.xp); this.emit('kill', { x: e.x, y: e.y, uid:e.uid, xp: e.xp });
      const money=e.money??3,dropChance=e.dropChance??(e.isBoss?1:.25),lootRoll=((Math.imul(e.uid+this.kills*31,1664525)^Math.imul(this.map.seed,1013904223))>>>0)/4294967296;
      const dropped=!!e.drop&&(e.isBoss||lootRoll<dropChance),item=dropped?e.drop:null,count=dropped?(e.dropCount||1):0;
      if(dropped)this.inventory.items[item]=(this.inventory.items[item]||0)+count;
      this.inventory.money+=money;this.emit('loot',{item,count,money});
      if(e.isBoss){const rareRoll=((Math.imul(e.uid+this.kills*97,2246822519)^Math.imul(this.map.seed,3266489917))>>>0)/4294967296;if(rareRoll<.02){this.inventory.items['Master Bola']=(this.inventory.items['Master Bola']||0)+1;this.emit('masterBallFound',{name:e.name});}}
      if(!e.isBoss)this.captureDefeated(e);
      if (!e.isBoss) { this.quest.drops.push(item); if(dropped)this.emit('drop', { x: e.x, y: e.y, item }); if (!this.quest.complete) { this.quest.progress++; if (this.quest.progress >= this.quest.goal) { this.quest.complete = true; this.gainXP(this.quest.rewardXp); this.emit('questComplete', { id: this.quest.id, xp: this.quest.rewardXp }); } } }
      if (e.isBoss) { e.defeated = true; e.timer = e.respawn;e.telegraph=null;e.attackVfx=null;e.attackUntil=0; this.emit('bossDefeated', { name: e.name, xp: e.xp }); }
      else e.timer = e.respawn;
      if (this.player.target === e.uid) this.player.target = null;
    }
    else { e.state = 'Chase'; e.timer = 0; }
    return damage;
  }
  moveWithInput(dt){
    const p=this.player,input=this.inputVector;
    if(!input||!Number.isFinite(input.x)||!Number.isFinite(input.y)||(!input.x&&!input.y))return false;
    const magnitude=Math.hypot(input.x,input.y),dx=input.x/magnitude,dy=input.y/magnitude;
    const speed=p.speed*(p.running?1.5:1)*(p.buffs||[]).reduce((value,b)=>value*(b.speedMultiplier||1),1);
    const step=speed*dt,from={x:p.x,y:p.y},destination={x:p.x+dx*step,y:p.y+dy*step};
    p.path=[];p.target=null;p.pendingCast=null;p.repathAt=0;p.facing={x:dx,y:dy};p.moving=false;
    if(clearSegment(this.map,from,destination,p.radius,p.navigation||{})){p.x=destination.x;p.y=destination.y;p.moving=true;return true;}
    // Sliding along an obstacle keeps diagonal input responsive at corners.
    const horizontal={x:p.x+dx*step,y:p.y};
    if(dx&&clearSegment(this.map,from,horizontal,p.radius,p.navigation||{})){p.x=horizontal.x;p.moving=true;}
    const vertical={x:p.x,y:p.y+dy*step};
    if(dy&&clearSegment(this.map,{x:p.x,y:p.y},vertical,p.radius,p.navigation||{})){p.y=vertical.y;p.moving=true;}
    return p.moving;
  }
  step(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, .05); this.time += dt;
    const p = this.player;
    if(p.yawnAt&&this.time>=p.yawnAt){p.sleepUntil=this.time+2.5;p.yawnAt=0;}
    for(const key of ['poison','burn','leech']){const condition=p[key];if(!condition)continue;if(this.time>=condition.until){p[key]=null;continue;}if(this.time<condition.nextTick)continue;condition.nextTick=this.time+1;if(key==='poison')condition.stacks=Math.min(4,(condition.stacks||0)+1);const amount=Math.max(1,Math.ceil(p.maxHp*(key==='poison'?.018*condition.stacks:.018)));p.hp=Math.max(0,p.hp-amount);this.emit('hurt',{x:p.x,y:p.y,amount});}
    if(p.hp===0&&!p.dead){p.dead=true;p.respawnIn=3;p.path=[];p.target=null;p.pendingCast=null;this.emit('death');}
    const pendingEvolution=nextEvolution(p.id);
    if(pendingEvolution&&p.level>=pendingEvolution.requiredLevel){for(const evolution of applyEvolutions(p,this.time))this.emit('evolve',evolution);this.definition=CREATURES[p.id];this.learn();}
    p.buffs=(p.buffs||[]).map(b=>({...b,remaining:b.remaining-dt})).filter(b=>b.remaining>0);
    for (const key of Object.keys(p.cooldowns)) p.cooldowns[key] = Math.max(0, p.cooldowns[key] - dt);
    if (p.dead) {
      p.respawnIn -= dt;
      if (p.respawnIn <= 0) { if(this.outdoor)this.exitInterior();Object.assign(p, REGION.spawn, { dead: false, hp: p.maxHp, path: [], target: null }); this.emit('respawn'); }
    } else if(p.evolutionUntil>this.time||p.sleepUntil>this.time){
      p.path=[];p.target=null;p.moving=false;this.pendingInteraction=null;
    } else {
      if(!this.inputVector){
        const target = this.enemies.find(e => e.uid === p.target && e.state !== 'Dead');
        if (target) {
          const pending=p.pendingCast,ability=pending?.targetId===target.uid&&ABILITIES[pending.ability];
          if(ability&&distance(p,target)<=ability.range&&lineOfSight(this.map,p,target)){
            if(this.cast(ability,target)){p.pendingCast=null;this.emit('queuedCast',{ability:ability.id,x:target.x,y:target.y});p.path=[];}
          }else if(!pending&&distance(p, target) <= ABILITIES.basic.range - 3 && lineOfSight(this.map, p, target)) { p.path = []; this.cast(ABILITIES.basic, target); }
          else if (this.time >= (p.repathAt || 0)) { p.path = findPath(this.map, p, target,p.radius,{maxPathNodes:3000}); p.repathAt = this.time + .35; }
        }else p.pendingCast=null;
        followPath(p, dt, this.map);
      }else this.moveWithInput(dt);
      const rolling=p.buffs?.find(b=>b.id==='flameWheel');
      if(rolling){const a=ABILITIES.flameWheel;for(const enemy of this.enemies){if(enemy.state==='Dead'||enemy.defeated||distance(p,enemy)>a.radius+(enemy.hurtbox?.radius||enemy.radius||12))continue;if((rolling.hitAt[enemy.uid]??-Infinity)>this.time)continue;rolling.hitAt[enemy.uid]=this.time+a.hitInterval;const mult=effectiveness(a.type,enemy.element);this.damage(enemy,(p.attack+a.damage)*combatEffectiveness(mult),a.type);this.emit('slash',{x:enemy.x,y:enemy.y,vfx:a.vfx,effectiveness:effectivenessText(mult)});}}
      if(this.pendingInteraction&&distance(p,this.pendingInteraction)<=this.pendingInteraction.radius){const target=this.pendingInteraction;this.pendingInteraction=null;this.interact(target);}
    }
    this.updateSpecialAttacks();
    for (const shot of this.projectiles) {
      const a = ABILITIES[shot.ability], length = a.speed * dt, steps = Math.max(1, Math.ceil(length / 5));
      for (let i = 0; i < steps && shot.remaining > 0; i++) {
        shot.x += shot.vx * dt / steps; shot.y += shot.vy * dt / steps; shot.remaining -= length / steps;
        if (!walkable(this.map, shot.x, shot.y, 0)) { shot.remaining = 0; break; }
        const hit = this.enemies.find(e => e.state !== 'Dead'&&!e.defeated&&!shot.hitIds.has(e.uid)&&distance(e, shot) < (e.hurtbox?.radius||e.radius||12) + shot.hitbox.radius);
        if (hit) {shot.hitIds.add(hit.uid);const mult=effectiveness(a.type||'Normal',hit.element),speedBonus=a.speedScaling?Math.max(.75,Math.min(2,p.speed/Math.max(1,hit.speed||60))):1,dealt=this.damage(hit, Math.round((p.attack + a.damage)*(shot.bonusDamage||1)*speedBonus*combatEffectiveness(mult)),a.type||'Normal');if(a.slow&&!hit.isBoss&&hit.state!=='Dead')hit.slowUntil=this.time+a.slow;this.applyEnemyEffect(hit,a);if(a.lifesteal&&dealt)p.hp=Math.min(p.maxHp,p.hp+Math.round(dealt*a.lifesteal)); if(mult!==1)this.emit('typeEffect',{message:effectivenessText(mult),x:hit.x,y:hit.y});
          if(a.behavior==='wave'){this.emit('impact',{x:hit.x,y:hit.y,vfx:'pmd/0021',size:82});const x=hit.x+shot.vx/a.speed*22,y=hit.y+shot.vy/a.speed*22;if(!hit.isBoss&&walkable(this.map,x,y,hit.radius||12)){hit.x=x;hit.y=y;hit.path=[];hit.staggerUntil=this.time+.28;}}
          else shot.remaining=0;
        }
      }
      if(shot.remaining<=0&&a.splashRadius)for(const e of this.enemies){if(e.state==='Dead'||e.defeated||shot.hitIds.has(e.uid)||distance(e,shot)>a.splashRadius+(e.radius||12)||!lineOfSight(this.map,shot,e))continue;const mult=effectiveness(a.type||'Normal',e.element);this.damage(e,Math.round((p.attack+a.damage*.6)*(shot.bonusDamage||1)*combatEffectiveness(mult)),a.type||'Normal');}
      if(shot.visual&&shot.remaining<=0&&['fireBlast','hydroCannon'].includes(a.id))this.emit('impact',{x:shot.x,y:shot.y,vfx:shot.visual.impact,size:a.splashRadius?Math.max(shot.visual.impactSize,a.splashRadius*2):shot.visual.impactSize});
      else if(shot.remaining<=0&&shot.hitIds.size&&['water','waterPulse','hydroPump'].includes(a.id))this.emit('impact',{x:shot.x,y:shot.y,vfx:'pmd/0021',size:78});
      else if(shot.visual&&this.time>=shot.trailAt){shot.trail.push({x:shot.x,y:shot.y});if(shot.trail.length>shot.visual.trail)shot.trail.shift();shot.trailAt=this.time+.045;}
    }
    this.projectiles = this.projectiles.filter(s => { if(s.remaining>0)return true;this.projectilePool.release(s);return false; });
    this.discovery.reveal(p);
    if(!this.map.scene&&this.time>=this.streamAt){this.streamCreatures();this.streamAt=this.time+.5;}
    // Keep the streamed population alive outside the camera so creatures patrol
    // their territory before the player reaches them.
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateEnemyProjectiles(dt);
  }
  interact(target){
    if(target.kind==='exit'){this.exitInterior();return;}
    if(target.kind==='sign'){this.emit('interaction',{message:target.text});return;}
    if(target.id==='heal'&&this.map.scene){this.player.hp=this.player.maxHp;this.emit('interaction',{message:'Seu Pokémon recuperou toda a vida.'});return;}
    if(target.kind==='shopkeeper'&&this.map.scene){this.emit('openShop');return;}
    if(this.outdoor)return;
    this.outdoor={map:this.map,enemies:this.enemies,discovery:this.discovery,position:{x:target.x,y:target.y+36}};
    this.map=createInterior(target,this.map.seed);this.enemies=[];this.discovery=new Discovery(this.map);this.projectiles=[];this.enemyProjectiles=[];this.activeAttacks=[];this.zones=[];this.pendingShots=[];
    Object.assign(this.player,{x:288,y:365,path:[],target:null,moving:false});this.discovery.reveal(this.player);
    if(['cave','tower'].includes(target.kind)){const e={...WILD_POKEMON[2],uid:1900,x:288,y:180,home:{x:288,y:180},maxHp:40,hp:40,state:'Idle',timer:2,cooldown:0,path:[],facing:{x:0,y:1},hurtbox:{radius:12,layer:32},collisionLayer:4};Object.assign(e,encounterStats(WILD_POKEMON[2],this.outdoor.map,target,e.uid));this.enemies.push(e);}
    this.emit('interaction',{message:'F para interagir. A saída fica ao sul.'});
  }
  exitInterior(){if(!this.outdoor)return;const saved=this.outdoor;this.map=saved.map;this.enemies=saved.enemies;this.discovery=saved.discovery;Object.assign(this.player,saved.position,{path:[],target:null,moving:false});this.outdoor=null;this.projectiles=[];this.enemyProjectiles=[];this.activeAttacks=[];this.zones=[];this.pendingShots=[];this.pendingInteraction=null;this.emit('interaction',{message:'De volta a Aurora.'});}
  streamCreatures() {
    const p=this.player,near=[];
    for(const e of this.enemies){
      if(e.horde){if(distance(e.home,p)<1800)near.push(e);else e.unloadedAt=this.time;continue;}
      if(e.uid<2000||distance(e.home,p)<1800){near.push(e);continue;}
      this.dormant.set(e.uid,{hp:e.hp,state:e.state,timer:e.timer,unloaded:this.time});this.creaturePool.release(e);
    }
    this.enemies=near;
    const ids=new Set(near.map(e=>e.uid)),cs=24*32;
    for(const guard of this.bossGuards||[]){
      if(ids.has(guard.uid)||distance(guard.home,p)>=1800)continue;
      if(guard.unloadedAt&&guard.state==='Dead')guard.timer=Math.max(0,guard.timer-(this.time-guard.unloadedAt));
      guard.unloadedAt=0;this.enemies.push(guard);ids.add(guard.uid);
    }
    for(let cy=Math.floor(p.y/cs)-2;cy<=Math.floor(p.y/cs)+2;cy++)for(let cx=Math.floor(p.x/cs)-2;cx<=Math.floor(p.x/cs)+2;cx++)for(const spawn of this.map.chunks.get(`${cx},${cy}`)?.spawns||[]){
      if(this.enemies.length>=48||ids.has(spawn.uid)||distance(spawn,p)>1500)continue;
      const saved=this.dormant.get(spawn.uid),species=WILD_POKEMON.find(s=>s.id===spawn.species)||{...WILD_POKEMON[0],...CREATURES[spawn.species],drop:spawn.reward,xp:25,aggro:155,chaseRange:400,leash:620,wanderRadius:96,range:40,respawn:18};
      const stats=encounterStats(species,this.map,spawn,spawn.uid),hp=stats.maxHp;
      const dead=saved?.state==='Dead'&&this.time-saved.unloaded<saved.timer;
      const entity=this.creaturePool.take({...species,...spawn,...stats,id:spawn.species,skills:enemySkillSet(species.element,stats.level),maxHp:hp,hp:dead?0:saved?.state==='Dead'?hp:saved?.hp||hp,home:{x:spawn.x,y:spawn.y},state:dead?'Dead':'Idle',timer:dead?saved.timer-(this.time-saved.unloaded):.15+(spawn.uid%12)*.11,cooldown:0,path:[],facing:{x:0,y:1},moving:false,slowUntil:0,staggerUntil:0});
      entity.hurtbox={radius:entity.radius,layer:32};entity.collisionLayer=4;entity.navigation={maxPathNodes:1500};
      this.enemies.push(entity);ids.add(entity.uid);
    }
  }
  randomRespawnPoint(e){
    const region=this.map.regions.find(r=>r.id===e.zoneId);if(!region)return e.home;
    const serial=(e.respawnSerial||0)+1;e.respawnSerial=serial;
    for(let attempt=0;attempt<80;attempt++){
      const random=salt=>{const n=Math.sin((e.uid+serial*97+attempt*31+salt)*127.1+(this.spawnEpoch||0)*.013)*43758.5453;return n-Math.floor(n);};
      const x=(Math.floor(region.x+(random(1)-.5)*region.rx*1.7)+.5)*32,y=(Math.floor(region.y+(random(2)-.5)*region.ry*1.7)+.5)*32;
      const tileX=Math.floor(x/32),tileY=Math.floor(y/32),regionIndex=this.map.regions.indexOf(region);
      if(this.map.biome[tileY]?.[tileX]!==regionIndex||!walkable(this.map,x,y,e.radius||12)||distance({x,y},this.player)<230)continue;
      if(Math.hypot(x-REGION.spawn.x,y-REGION.spawn.y)<575||this.enemies.some(other=>other!==e&&other.isBoss&&Math.hypot(x-other.x,y-other.y)<540))continue;
      if(this.enemies.some(other=>other!==e&&other.state!=='Dead'&&Math.hypot(x-other.home.x,y-other.home.y)<105))continue;
      return{x,y};
    }
    return e.home;
  }
  updateEnemyProjectiles(dt){
    const p=this.player;
    this.enemyProjectiles=this.enemyProjectiles.filter(shot=>{
      if(p.dead||shot.remaining<=0)return false;
      const from={x:shot.x,y:shot.y},length=Math.min(shot.remaining,shot.speed*dt),to={x:shot.x+shot.vx*length,y:shot.y+shot.vy*length};
      if(!clearSegment(this.map,from,to,3))return false;
      Object.assign(shot,to);shot.remaining-=length;
      if(distance(shot,p)>p.hurtbox.radius+8)return shot.remaining>0;
      const buffDefense=(p.buffs||[]).reduce((sum,b)=>sum+(b.defenseBonus||0),0);
      const amount=Math.max(1,Math.round(shot.damage-p.defense-buffDefense));p.hp=Math.max(0,p.hp-amount);
      p.hitStart=this.time;p.hitUntil=this.time+.2;this.emit('hurt',{x:p.x,y:p.y,amount,vfx:shot.vfx});
      if(p.hp===0){p.dead=true;p.deathStart=this.time;p.respawnIn=3;p.path=[];p.moving=false;p.target=null;this.projectiles=[];this.emit('death');}
      return false;
    });
  }
  updateEnemy(e, dt) {
    const p = this.player; e.timer -= dt; e.cooldown = Math.max(0, e.cooldown - dt);const speedMultiplier=(e.debuffs||[]).filter(b=>b.until>this.time).reduce((value,b)=>value*(b.speedMultiplier||1),1),moveDt=(this.time<(e.slowUntil||0)?dt*.52:dt)*speedMultiplier;
    if (e.state === 'Dead') {
      if (e.isBoss && e.defeated && e.timer <= 0) { Object.assign(e, e.home, { hp: e.maxHp, state: 'Idle', phase: 1, defeated: false, timer: 2, path: [], telegraph: null, attackIndex:0, attackVfx:null, attackUntil:0 }); this.emit('bossRespawn'); }
      else if (e.isBoss) return;
      if (e.timer <= 0 && distance(p, e.home) > 170) {const home=e.horde?e.home:this.randomRespawnPoint(e);const species=WILD_POKEMON.find(s=>s.id===e.id)||e;const stats=encounterStats(species,this.map,{...e,...home},e.uid,{horde:e.horde,respawn:e.respawnSerial||0});Object.assign(e,home,stats,{home:{...home},hp:stats.maxHp,skills:enemySkillSet(e.element,stats.level),state:'Idle',timer:2,path:[]});}
      return;
    }
    this.updateEnemyConditions(e);if(e.state==='Dead')return;
    if(!e.isBoss&&this.time<(e.sleepUntil||0)){e.moving=false;e.path=[];return;}
    if(!e.isBoss&&this.time<(e.staggerUntil||0)){e.moving=false;e.path=[];return;}
    const d = distance(p, e);
    if (e.isBoss) { this.updateBoss(e, dt, d); return; }
    if (p.dead || distance(e, e.home) > e.leash) { e.state = 'ReturnToSpawn'; }
    if (e.state === 'ReturnToSpawn') {
      if (!e.path.length&&e.timer<=0) {e.path = findPath(this.map, e, e.home);e.timer=.75;}
      followPath(e, moveDt, this.map);
      if (distance(e, e.home) < 5) { e.hp = e.maxHp; e.state = 'Idle'; e.timer = 2; }
      return;
    }
    if (!p.dead && d < e.aggro && !['Chase', 'Attack'].includes(e.state)) {
      e.state = 'Chase'; e.timer = 0; e.path = [];
    }
    if (e.state === 'Chase' || e.state === 'Attack') {
      if (d > (e.chaseRange||400) || p.dead) { e.state = 'ReturnToSpawn'; e.path = []; return; }
      if (d <= e.range && lineOfSight(this.map, e, p)) {
        e.state = 'Attack'; e.path = []; e.moving = false;
        if (e.cooldown === 0) { const buffDefense=(p.buffs||[]).reduce((sum,b)=>sum+(b.defenseBonus||0),0),enemyAttackMultiplier=(e.debuffs||[]).filter(b=>b.until>this.time).reduce((value,b)=>value*(b.attackMultiplier||1),1),skill=e.skills?.length&&((e.attackCount||0)+1)%3===0?e.skills[Math.floor((e.attackCount||0)/3)%e.skills.length]:null;e.attackCount=(e.attackCount||0)+1;if(skill){this.emit('castVisual',{x:e.x,y:e.y,vfx:skill.vfx,size:66});if(skill.kind==='heal')e.hp=Math.min(e.maxHp,e.hp+Math.round(e.maxHp*.08));}if(e.ranged){const dx=p.x-e.x,dy=p.y-e.y,length=Math.max(1,Math.hypot(dx,dy));this.enemyProjectiles.push({x:e.x,y:e.y,vx:dx/length,vy:dy/length,speed:270,remaining:e.range+32,damage:e.attack*enemyAttackMultiplier*(skill?.power||1),vfx:skill?.vfx||e.projectileVfx||'energy'});e.cooldown=e.cooldownMax||1.7;this.emit('castVisual',{x:e.x,y:e.y,vfx:skill?.vfx||e.projectileVfx||'energy',size:48});return;}if(skill)this.emit('impact',{x:p.x,y:p.y,vfx:skill.vfx,size:skill.kind==='area'?90:60});let amount = Math.max(1, e.attack*enemyAttackMultiplier*(skill?.power||1) - p.defense-buffDefense); if(p.nature==='Calma'&&p.hp/p.maxHp>.7)amount=Math.ceil(amount*.9); if(p.ability==='Couraça Torrencial'&&p.hp/p.maxHp<.35)amount=Math.ceil(amount*.8); p.hp = Math.max(0, p.hp - amount); e.cooldown = e.cooldown || e.cooldownMax || 1.25; this.emit('hurt', { x: p.x, y: p.y, amount });
          p.hitStart = this.time; p.hitUntil = this.time + .2;
          if (p.hp === 0) { p.dead = true; p.deathStart = this.time; p.respawnIn = 3; p.path = []; p.moving = false; p.target = null; this.projectiles = []; this.emit('death'); }
        }
      } else { e.state = 'Chase'; if (e.timer <= 0) { e.path = findPath(this.map, e, p); e.timer = .5; } followPath(e, moveDt, this.map); }
    } else {
      if (!e.path.length && e.timer <= 0) {
        const phase=this.time*.41+e.uid*2.399,roam=e.wanderRadius||96;
        for(let attempt=0;attempt<8&&!e.path.length;attempt++){
          const angle=phase+attempt*2.399963,range=roam*(1-attempt*.065);
          const point={x:e.home.x+Math.cos(angle)*range,y:e.home.y+Math.sin(angle)*range};
          e.path=findPath(this.map,e,point,e.radius,e.navigation||{});
        }
        e.timer=e.path.length?.35:1.1;e.state=e.path.length?'Wander':'Idle';
      }
      followPath(e,moveDt,this.map);
      if(!e.path.length){e.state='Idle';e.timer=Math.min(e.timer,.35);}
    }
  }
  updateBoss(e, dt, d) {
    const p = this.player;
    if(p.dead||d>e.leash){e.telegraph=null;e.attackVfx=null;e.attackUntil=0;e.path=[];e.moving=false;e.state='Idle';return;}
    e.phase = e.hp / e.maxHp <= e.phaseThresholds[1] ? 3 : e.hp / e.maxHp <= e.phaseThresholds[0] ? 2 : 1;
    if(!e.telegraph&&e.attackUntil>this.time){e.moving=false;return;}
    if (e.telegraph) {
      e.telegraph.remaining -= dt;
      if (e.telegraph.remaining <= 0) {
        const hit = bossAttackHits(e.telegraph,p)&&lineOfSight(this.map,e,p);
        if (hit && !p.dead) { const buffDefense=(p.buffs||[]).reduce((sum,b)=>sum+(b.defenseBonus||0),0),amount = Math.max(1, e.telegraph.damage - p.defense-buffDefense); p.hp = Math.max(0, p.hp - amount); this.emit('hurt', { x: p.x, y: p.y, amount }); if (p.hp === 0) { p.dead = true; p.respawnIn = 3; p.deathStart = this.time; this.emit('death'); } }
        e.attackVfx={...e.telegraph,start:this.time};e.attackStart=this.time;e.attackUntil=this.time+.65;e.attackAnimation=e.telegraph.animation;e.hitUntil=0;e.cooldown=e.telegraph.recovery;
        this.emit('bossImpact', { x: e.telegraph.x, y: e.telegraph.y, radius: e.telegraph.radius,attack:e.telegraph.id }); e.telegraph = null;
      }
      return;
    }
    if (p.dead) { e.state = 'Idle'; e.path = []; return; }
    if (d > e.leash) { e.state = 'Idle'; e.path = []; return; }
    if (d < e.aggro) {
      e.state = d <= e.range ? 'Attack' : 'Chase';
      if (d <= e.range && e.cooldown <= 0) {
        e.telegraph=prepareBossAttack(e,p,e.phase);e.path=[];e.moving=false;e.attackVfx=null;
        e.facing={x:Math.cos(e.telegraph.angle),y:Math.sin(e.telegraph.angle)};e.attackFacing={...e.facing};
        e.cooldown=e.telegraph.remaining+e.telegraph.recovery;this.emit('bossTelegraph',{...e.telegraph,phase:e.phase});
      } else if (d > e.range) { if (e.timer <= 0) { e.path = findPath(this.map, e, p); e.timer = .4; } followPath(e, dt, this.map); }
    } else { e.state = 'Idle'; }
  }
}


