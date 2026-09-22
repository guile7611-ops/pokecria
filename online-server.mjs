import {safePlayer as safe} from './public/safe-zones.js';
import { randomUUID } from 'node:crypto';
import { ABILITIES, CREATURES } from './public/data.js';
import {starterAttackVisual} from './public/starter-attack-vfx.js';
import { effectiveness } from './public/type-system.js';

const SPAWN = { x: 240, y: 560 };
export const SAFE_RADIUS = 340;
const players = new Map();
const wildHits = new Map();
const killedWild = new Map();
// Boss health and respawn belong to the room, never to an individual client.
const bossStates = new Map();
const now = () => Date.now();
const json = (res, status, data) => res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
const publicPlayer = p => ({ id:p.id, nick:p.nick, pokemon:p.pokemon, level:p.level, x:p.x, y:p.y, hp:p.hp, maxHp:p.maxHp, scene:p.scene, moving:p.moving, facing:p.facing, attackActive:now()<p.attackUntil, attackAnimation:p.attackAnimation, attackFacing:p.attackFacing, rolling:p.hp>0&&now()<(p.rollingUntil||0), guildId:p.guildId });
const send = (p, type, data) => { if (p.stream && !p.stream.destroyed) p.stream.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`); };
const all = type => { const list=[...players.values()].map(publicPlayer); for(const p of players.values())send(p,type,{players:list,safeRadius:SAFE_RADIUS}); };
const broadcastBoss=(scene,state)=>{for(const p of players.values())if(p.scene===scene)send(p,'boss-state',state);};
const auth = req => players.get(req.headers['x-verdant-session']);
async function body(req) {
  let raw='';
  for await(const chunk of req){ raw+=chunk; if(raw.length>4096)throw Error('Payload grande'); }
  return JSON.parse(raw||'{}');
}
const clean = value => String(value||'').trim().slice(0,24).replace(/[^\p{L}\p{N}_ -]/gu,'');
function leave(p){if(!p)return;p.stream?.end();players.delete(p.token);for(const other of players.values())if(other.invite?.fromId===p.id)other.invite=null;all('roster');}
function rollingContacts(p){
 const time=now(),ability=ABILITIES.flameWheel;
 if(time>=(p.rollingUntil||0)||p.hp<=0||safe(p))return [];
 const victims=[];
 for(const target of players.values()){
  if(target.id===p.id||target.scene!==p.scene||target.hp<=0||safe(target)||p.guildId&&p.guildId===target.guildId)continue;
  if(Math.hypot(p.x-target.x,p.y-target.y)>ability.radius+14||time<(p.rollingHits.get(target.id)||0))continue;
  const typeBonus=effectiveness(ability.type,CREATURES[target.pokemon]?.element||'Normal');
  if(typeBonus===0)continue;
  p.rollingHits.set(target.id,time+ability.hitInterval*1000);
  const damage=Math.max(1,Math.min(180,Math.round(((CREATURES[p.pokemon]?.attack||13)+p.level*2+ability.damage)*typeBonus-(CREATURES[target.pokemon]?.defense||2))));
  target.hp=Math.max(0,target.hp-damage);
  victims.push({id:target.id,damage,hp:target.hp});
  send(target,'pvp-hit',{from:p.id,nick:p.nick,damage,hp:target.hp,ability:ability.id});send(p,'pvp-result',{targetId:target.id,nick:target.nick,damage,hp:target.hp,ability:ability.id});
  for(const other of players.values())if(other.scene===p.scene)send(other,'combat',{from:p.id,ability:ability.id,behavior:'direct',vfx:ability.vfx,x:p.x,y:p.y,aimX:target.x,aimY:target.y,targets:[target.id]});
 }
 return victims;
}
function skillHits(p,ability,impact,unit){
 const victims=[];if(safe(p)||p.hp<=0||['heal','buff','rolling'].includes(ability.behavior))return victims;
 const range=Math.max(1,ability.range||150),radius=ability.radius||30;
 for(const target of players.values()){
  if(target.id===p.id||target.scene!==p.scene||target.hp<=0||safe(target)||p.guildId&&p.guildId===target.guildId)continue;
  const along=(target.x-p.x)*unit.x+(target.y-p.y)*unit.y,cross=Math.abs((target.x-p.x)*unit.y-(target.y-p.y)*unit.x);
  const behavior=ability.behavior,hit=['area','zone'].includes(behavior)?Math.hypot(target.x-impact.x,target.y-impact.y)<=radius+14:behavior==='direct'?Math.hypot(target.x-p.x,target.y-p.y)<=range+14&&cross<32:behavior==='channel'?along>=0&&along<=range+14&&cross<=26+along*.32:along>=0&&along<=range+14&&cross<(behavior==='wave'?(ability.width||40)+14:behavior==='beam'?35:behavior==='whip'?37:23);
  if(!hit)continue;
  const typeBonus=effectiveness(ability.type||'Normal',CREATURES[target.pokemon]?.element||'Normal');
  if(typeBonus===0)continue;
  const damage=Math.max(1,Math.min(180,Math.round(((CREATURES[p.pokemon]?.attack||13)+p.level*2+(ability.damage||0))*typeBonus-(CREATURES[target.pokemon]?.defense||2))));
  target.hp=Math.max(0,target.hp-damage);victims.push({id:target.id,x:target.x,y:target.y,damage,hp:target.hp});
  send(target,'pvp-hit',{from:p.id,nick:p.nick,damage,hp:target.hp,ability:ability.id});send(p,'pvp-result',{targetId:target.id,nick:target.nick,damage,hp:target.hp,ability:ability.id});
 }
 return victims;
}
setInterval(()=>{
  const time=now();
  for(const p of players.values())if(time-p.lastSeen>20000)leave(p);
  for(const p of players.values()){
    p.activeSkills=p.activeSkills.filter(active=>active.until>time&&p.hp>0&&p.scene===active.scene);
    for(const active of p.activeSkills){if(time<active.nextTick)continue;const ability=ABILITIES[active.id];skillHits(p,ability,active.impact,active.unit);active.ticks++;active.nextTick=time+(ability.hitInterval||.16)*1000;
      if(ability.behavior==='beam'||ability.behavior==='whip'&&active.ticks>=1)active.until=0;
    }
  }
  for(const [key,value] of wildHits)if(time-value.time>15000)wildHits.delete(key);
  for(const [key,value] of killedWild)if(time-value>15000)killedWild.delete(key);
  for(const [key,state] of bossStates)if(state.hp<=0&&state.respawnAt<=time){state.hp=state.maxHp;state.respawnAt=0;broadcastBoss(key.split(':')[0],state);}
  all('roster');
},80).unref();

export async function handleOnline(req,res,url){
  if(!url.pathname.startsWith('/api/online/'))return false;
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET'&&url.pathname==='/api/online/events'){
    const p=players.get(url.searchParams.get('token'));
    if(!p){json(res,401,{error:'Sessão inválida'});return true;}
    p.stream?.end();p.stream=res;p.lastSeen=now();
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});
    res.write(': conectado\n\n');send(p,'roster',{players:[...players.values()].map(publicPlayer),safeRadius:SAFE_RADIUS});for(const [key,state] of bossStates)if(key.startsWith(`${p.scene}:`))send(p,'boss-state',state);
    req.on('close',()=>{if(p.stream===res)p.stream=null;});return true;
  }
  if(req.method!=='POST'){json(res,405,{error:'Método inválido'});return true;}
  try{
    const data=await body(req);
    if(url.pathname==='/api/online/join'){
      const nick=clean(data.nick),pokemon=clean(data.pokemon);
      if(nick.length<2||!pokemon){json(res,400,{error:'Nome ou Pokémon inválido'});return true;}
      const id=randomUUID(),token=randomUUID();
      const p={id,token,nick,pokemon,level:1,x:SPAWN.x,y:SPAWN.y,hp:100,maxHp:100,scene:'world',moving:false,facing:{x:0,y:1},attackUntil:0,attackAnimation:'Attack',attackFacing:{x:0,y:1},rollingUntil:0,rollingHits:new Map(),activeSkills:[],guildId:null,invite:null,lastSeen:now(),lastAttack:0,lastSkills:new Map(),stream:null};
      players.set(token,p);json(res,200,{id,token,seed:123456,safeRadius:SAFE_RADIUS});all('roster');return true;
    }
    const p=auth(req);if(!p){json(res,401,{error:'Sessão inválida'});return true;}p.lastSeen=now();
    if(url.pathname==='/api/online/leave'){leave(p);json(res,200,{ok:true});return true;}
    if(url.pathname==='/api/online/state'){
      const x=Number(data.x),y=Number(data.y);
      if(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<=15360&&y<=10880){p.x=x;p.y=y;}
      p.scene=clean(data.scene)||'world';p.pokemon=clean(data.pokemon)||p.pokemon;p.nick=clean(data.nick)||p.nick;
      p.level=Math.max(1,Math.floor(Number(data.level)||1));p.maxHp=Math.max(1,Math.min(999999999,Number(data.maxHp)||100));
      const reportedHp=Number(data.hp);if(Number.isFinite(reportedHp))p.hp=Math.max(0,Math.min(p.maxHp,reportedHp));p.moving=!!data.moving;
      if(Number.isFinite(data.facing?.x)&&Number.isFinite(data.facing?.y))p.facing={x:Math.max(-1,Math.min(1,data.facing.x)),y:Math.max(-1,Math.min(1,data.facing.y))};
      if(data.attackActive){p.attackUntil=now()+220;p.attackAnimation=data.attackAnimation==='Shoot'?'Shoot':'Attack';if(Number.isFinite(data.attackFacing?.x)&&Number.isFinite(data.attackFacing?.y))p.attackFacing=data.attackFacing;}
      const rollingVictims=rollingContacts(p);
      json(res,200,{ok:true,hp:p.hp,rollingVictims});return true;
    }
    if(url.pathname==='/api/online/pvp'){
      const target=[...players.values()].find(v=>v.id===data.targetId);
      if(!target||target.id===p.id){json(res,404,{error:'Jogador indisponível'});return true;}
      if(p.scene!==target.scene||safe(p)||safe(target)){json(res,403,{error:'PvP desativado na safe zone'});return true;}
      if(p.guildId&&p.guildId===target.guildId){json(res,403,{error:'Membros da guilda não podem se atacar'});return true;}
      if(Math.hypot(p.x-target.x,p.y-target.y)>110){json(res,400,{error:'Aproxime-se do jogador'});return true;}
      if(now()-p.lastAttack<850||p.hp<=0||target.hp<=0){json(res,429,{error:'Ataque indisponível'});return true;}
      p.lastAttack=now();const damage=Math.max(2,Math.min(50,Math.round(8+p.level*1.3)));target.hp=Math.max(0,target.hp-damage);
      p.attackUntil=now()+450;p.attackAnimation='Attack';p.attackFacing={x:(target.x-p.x)/Math.max(1,Math.hypot(target.x-p.x,target.y-p.y)),y:(target.y-p.y)/Math.max(1,Math.hypot(target.x-p.x,target.y-p.y))};
      for(const other of players.values())if(other.scene===p.scene)send(other,'combat',{from:p.id,ability:'basic',behavior:'direct',vfx:'slash',x:p.x,y:p.y,aimX:target.x,aimY:target.y,targets:[target.id]});
      send(target,'pvp-hit',{from:p.id,nick:p.nick,damage,hp:target.hp});send(p,'pvp-result',{targetId:target.id,nick:target.nick,damage,hp:target.hp});
      json(res,200,{ok:true,damage,hp:target.hp});return true;
    }
    if(url.pathname==='/api/online/skill'){
      const ability=ABILITIES[data.ability],x=Number(data.x),y=Number(data.y);
      if(!ability||!Number.isFinite(x)||!Number.isFinite(y)||p.hp<=0){json(res,400,{error:'Golpe inválido'});return true;}
      if(ability.catalogOnly||(ability.level||1)>p.level){json(res,403,{error:'Golpe ainda não desbloqueado'});return true;}
      if(now()-(p.lastSkills.get(ability.id)||0)<Math.max(350,ability.cooldown*1000-150)){json(res,429,{error:'Golpe em recarga'});return true;}
      p.lastSkills.set(ability.id,now());p.attackUntil=now()+Math.max(450,(ability.charge||0)*1000);p.attackAnimation=['area','direct','rolling','whip'].includes(ability.behavior)?'Attack':'Shoot';
      if(ability.behavior==='rolling'){p.rollingUntil=now()+ability.duration*1000;p.rollingHits.clear();}
      const distance=Math.hypot(x-p.x,y-p.y),unit={x:(x-p.x)/Math.max(1,distance),y:(y-p.y)/Math.max(1,distance)};p.attackFacing=unit;
      const range=Math.max(1,ability.range||150),reach=Math.min(range,distance),impact=ability.selfCentered||['heal','buff'].includes(ability.behavior)?{x:p.x,y:p.y}:{x:p.x+unit.x*reach,y:p.y+unit.y*reach};
      const victims=ability.behavior==='beam'?[]:skillHits(p,ability,impact,unit);
      if(['channel','zone','beam','whip'].includes(ability.behavior))p.activeSkills.push({id:ability.id,impact,unit,scene:p.scene,nextTick:now()+(ability.behavior==='beam'?(ability.charge||.7):ability.hitInterval||.16)*1000,until:now()+(ability.duration||ability.charge||.3)*1000+250,ticks:0});
      const visual=starterAttackVisual(CREATURES[p.pokemon]?.baseCreature||p.pokemon,ability.id);
      const vfx=visual?.travel||ability.vfx||`moves/${ability.id}`;
      const combat={from:p.id,ability:ability.id,behavior:ability.behavior,vfx,castVfx:visual?.cast,impactVfx:visual?.impact,castSize:visual?.castSize,travelSize:visual?.travelSize,impactSize:visual?.impactSize,duration:ability.duration||0,charge:ability.charge||0,x:p.x,y:p.y,aimX:impact.x,aimY:impact.y,radius:ability.radius||0,targets:victims.map(v=>v.id)};
      for(const other of players.values())if(other.scene===p.scene)send(other,'combat',combat);
      json(res,200,{ok:true,victims});return true;
    }
    if(url.pathname==='/api/online/guild/invite'){
      const target=[...players.values()].find(v=>v.id===data.targetId);
      if(!target||target.id===p.id){json(res,404,{error:'Jogador indisponível'});return true;}
      if(p.guildId&&p.guildId===target.guildId){json(res,400,{error:'Já estão na mesma guilda'});return true;}
      if(target.guildId){json(res,400,{error:'Esse jogador já está em uma guilda'});return true;}
      target.invite={fromId:p.id,fromNick:p.nick,expires:now()+60000};send(target,'guild-invite',target.invite);json(res,200,{ok:true});return true;
    }
    if(url.pathname==='/api/online/guild/reply'){
      const invite=p.invite;p.invite=null;
      if(!invite||invite.expires<now()){json(res,400,{error:'Convite expirou'});return true;}
      const leader=[...players.values()].find(v=>v.id===invite.fromId);
      if(!leader||!data.accept){json(res,200,{ok:true,accepted:false});return true;}
      leader.guildId ||=randomUUID();p.guildId=leader.guildId;send(leader,'guild-joined',{nick:p.nick,guildId:p.guildId});send(p,'guild-joined',{nick:leader.nick,guildId:p.guildId});all('roster');json(res,200,{ok:true,accepted:true,guildId:p.guildId});return true;
    }
    if(url.pathname==='/api/online/wild-hit'){
      const uid=Number(data.uid);if(!Number.isInteger(uid)||uid<0||uid>10000000){json(res,400,{error:'Criatura inválida'});return true;}
      const key=`${p.scene}:${uid}`,entry=wildHits.get(key)||{hits:new Map(),time:now()};entry.hits.set(p.id,{guildId:p.guildId,time:now()});entry.time=now();wildHits.set(key,entry);
      const damage=Math.max(0,Math.min(500,Number(data.damage)||0));
      if(data.isBoss){
        const maxHp=Math.max(1,Math.min(999999,Number(data.maxHp)||1)),state=bossStates.get(key)||{uid,hp:maxHp,maxHp,respawnAt:0};
        state.maxHp=maxHp;if(state.hp>0){state.hp=Math.max(0,state.hp-damage);if(state.hp===0)state.respawnAt=now()+Math.max(1000,Math.min(300000,(Number(data.respawn)||45)*1000));}bossStates.set(key,state);broadcastBoss(p.scene,state);json(res,200,{ok:true,boss:state});return true;
      }
      for(const other of players.values())if(other.id!==p.id&&other.scene===p.scene)send(other,'wild-hit',{uid,damage,from:p.id});
      json(res,200,{ok:true});return true;
    }
    if(url.pathname==='/api/online/wild-kill'){
      const uid=Number(data.uid),key=`${p.scene}:${uid}`;if(!Number.isInteger(uid)||killedWild.has(key)){json(res,200,{ok:false});return true;}
      killedWild.set(key,now());const xp=Math.max(0,Math.min(1000,Number(data.xp)||0)),entry=wildHits.get(key);
      for(const other of players.values())if(other.id!==p.id&&other.scene===p.scene){send(other,'wild-kill',{uid});if(p.guildId&&other.guildId===p.guildId&&entry?.hits.has(other.id))send(other,'guild-xp',{uid,xp:Math.max(1,Math.round(xp*.5)),from:p.nick});}
      wildHits.delete(key);json(res,200,{ok:true});return true;
    }
    json(res,404,{error:'Rota não encontrada'});return true;
  }catch{json(res,400,{error:'Requisição inválida'});return true;}
}
