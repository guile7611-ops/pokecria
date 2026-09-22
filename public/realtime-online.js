import {cloud} from './cloud-client.js';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './supabase-config.js';
import {ABILITIES,CREATURES,REGION} from './data.js';
import {effectiveness,combatEffectiveness} from './type-system.js';
import {starterAttackVisual} from './starter-attack-vfx.js';

const safe=player=>!player||player.scene!=='world'||Math.hypot(player.x-REGION.spawn.x,player.y-REGION.spawn.y)<=340;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clean=value=>String(value||'').trim().slice(0,24);

export class RealtimeOnline {
  constructor(handlers={}){this.handlers=handlers;this.id=crypto.randomUUID();this.token=null;this.players=[];this.guildId=null;this.pendingInvite=null;this.channel=null;this.client=null;this.state=null;this.stateSeq=0;this.lastTrack=0;this.lastBroadcast=0;this.lastAttack=0;this.lastSkills=new Map();this.ownHits=new Set();this.bosses=new Map();this.wilds=new Map();this.remoteStates=new Map();}
  roster(){
    if(!this.channel)return;
    const version=player=>Number.isSafeInteger(player?.seq)?player.seq:-1;
    const now=Date.now(),present=new Map();
    for(const player of Object.values(this.channel.presenceState()).flat())if(player?.id&&version(player)>=version(present.get(player.id)))present.set(player.id,player);
    for(const [id,player] of this.remoteStates)if(!present.has(id)&&now-player.seenAt>15000)this.remoteStates.delete(id);
    this.players=[...[...present.values()].map(player=>{let remote=this.remoteStates.get(player.id);if(version(player)>version(remote)){remote={...player,seenAt:now};this.remoteStates.set(player.id,remote);}const latest=version(remote)>=version(player)?remote:player;return {...player,...latest,guildId:player.guildId||remote?.guildId||null,spawnEpoch:player.spawnEpoch};}),...[...this.remoteStates.values()].filter(player=>!present.has(player.id))];
    const self=this.players.find(player=>player.id===this.id);
    if(self?.guildId)this.guildId=self.guildId;
    const epochs=this.players.filter(player=>player.scene==='world'&&Number.isInteger(player.spawnEpoch)).map(player=>player.spawnEpoch);
    if(epochs.length&&this.state){const shared=Math.min(...epochs);if(shared!==this.state.spawnEpoch){this.state.spawnEpoch=shared;this.handlers.world?.({spawnEpoch:shared});this.track(true);}}
    this.handlers.roster?.({players:this.players,safeRadius:340});
  }
  async join(state){
    if(this.token)return;
    if(!cloud.session?.user?.id)throw Error('Entre na sua conta para jogar online.');
    const {createClient}=await import('/vendor/supabase.js');
    this.client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    this.state={id:this.id,nick:clean(state.nick),pokemon:state.pokemon,level:1,x:REGION.spawn.x,y:REGION.spawn.y,hp:100,maxHp:100,scene:'world',moving:false,facing:{x:0,y:1},guildId:null,spawnEpoch:0,seq:0};
    this.channel=this.client.channel('aurora-world-v2',{config:{presence:{key:this.id},broadcast:{self:false,ack:true}}});
    this.channel.on('presence',{event:'sync'},()=>this.roster());
    this.channel.on('broadcast',{event:'game'},({payload})=>this.receive(payload));
    try{
      await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Tempo esgotado ao conectar ao mundo.')),12000);this.channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);reject(Error('Canal online indisponível.'));}});});
      this.token=this.id;
      await this.track(true);
      this.roster();
      this.send('boss-sync-request',{}).catch(()=>{});
      this.send('wild-sync-request',{}).catch(()=>{});
    }catch(error){this.token=null;await this.client.removeChannel(this.channel).catch(()=>{});this.channel=null;throw error;}
  }
  async track(force=false){
    if(!this.channel||!this.state)return;
    if(!force&&Date.now()-this.lastTrack<1000)return;
    this.lastTrack=Date.now();
    const result=await this.channel.track({...this.state,guildId:this.guildId});
    if(result!=='ok'){this.handlers.error?.();throw Error('Não foi possível anunciar sua presença online.');}
  }
  update(state){if(!this.token)return;Object.assign(this.state,state,{guildId:this.guildId,seq:++this.stateSeq});const self=this.players.find(player=>player.id===this.id);if(self)Object.assign(self,this.state);const time=Date.now();if(time-this.lastBroadcast>=100){this.lastBroadcast=time;this.send('player-state',{state:{...this.state}}).catch(()=>this.handlers.error?.());}this.track().catch(()=>this.handlers.error?.());}
  async send(type,data={},targetId=null){
    if(!this.channel)throw Error('Você está desconectado.');
    const result=await this.channel.send({type:'broadcast',event:'game',payload:{type,from:this.id,targetId,...data}});
    if(result!=='ok')throw Error('Não foi possível enviar a ação online.');
  }
  receive(message){
    if(!message||message.from===this.id||message.targetId&&message.targetId!==this.id)return;
    const sender=this.players.find(player=>player.id===message.from);
    if(message.type==='player-state'){
      if(Number.isSafeInteger(message.state?.seq)&&message.state.seq<Math.max(this.remoteStates.get(message.from)?.seq??-1,sender?.seq??-1))return;
      const state={...sender,...message.state,id:message.from,seenAt:Date.now()};this.remoteStates.set(message.from,state);
      if(sender)Object.assign(sender,state);else this.players.push(state);
      this.handlers.roster?.({players:this.players,safeRadius:340});return;
    }
    if(message.type==='boss-sync-request'){for(const state of this.bosses.values())this.send('boss-state',state,message.from).catch(()=>{});return;}
    if(message.type==='wild-sync-request'){for(const state of this.wilds.values())if(state.respawnAt>Date.now()||state.hp>0)this.send('wild-state',state,message.from).catch(()=>{});return;}
    if(message.type==='wild-state'){this.wilds.set(message.uid,message);this.handlers['wild-state']?.(message);return;}
    if(message.type==='boss-state'){this.bosses.set(message.uid,message);this.handlers['boss-state']?.(message);return;}
    if(message.type==='wild-hit'&&message.isBoss){this.bosses.set(message.uid,message);this.handlers['boss-state']?.(message);return;}
    if(message.type==='wild-hit')this.wilds.set(message.uid,{uid:message.uid,hp:message.hp,maxHp:message.maxHp,respawnAt:message.hp<=0?Date.now()+(message.respawn||13)*1000:0});
    if(message.type==='wild-kill')this.wilds.set(message.uid,{uid:message.uid,hp:0,respawnAt:Date.now()+(message.respawn||13)*1000});
    if(message.type==='wild-kill'&&sender?.guildId&&sender.guildId===this.guildId&&this.ownHits.delete(message.uid))this.handlers['guild-xp']?.({xp:Math.floor((message.xp||0)/2),from:sender.nick});
    if(message.type==='guild-invite')this.pendingInvite={fromId:message.from,fromNick:message.fromNick};
    if(message.type==='guild-joined'){this.guildId=message.guildId;this.pendingInvite=null;this.state.guildId=this.guildId;this.state.seq=++this.stateSeq;this.track(true).catch(()=>{});}
    if(message.type==='pvp-hit'&&message.targetId===this.id){this.state.hp=Math.max(0,(this.state.hp||0)-message.damage);message.hp=this.state.hp;}
    this.handlers[message.type]?.(message);
  }
  async request(path,data={}){
    if(!this.token)throw Error('Você está desconectado.');
    if(path==='wild-hit'){
      this.ownHits.add(data.uid);
      if(data.isBoss){const state={uid:data.uid,hp:data.hp??Math.max(0,(this.bosses.get(data.uid)?.hp??data.maxHp)-data.damage),maxHp:data.maxHp,respawnAt:data.hp===0?Date.now()+(data.respawn||45)*1000:0,isBoss:true};this.bosses.set(data.uid,state);await this.send('boss-state',state);}
      else {this.wilds.set(data.uid,{uid:data.uid,hp:data.hp,maxHp:data.maxHp,respawnAt:data.hp<=0?Date.now()+(data.respawn||13)*1000:0});await this.send('wild-hit',data);}
      return {ok:true};
    }
    if(path==='wild-kill'){this.wilds.set(data.uid,{uid:data.uid,hp:0,respawnAt:Date.now()+(data.respawn||13)*1000});await this.send('wild-kill',data);return {ok:true};}
    if(path==='guild/invite'){
      const target=this.players.find(player=>player.id===data.targetId);if(!target)throw Error('Jogador indisponível.');
      await this.send('guild-invite',{fromNick:this.state.nick},target.id);return {ok:true};
    }
    if(path==='guild/reply'){
      if(!this.pendingInvite)throw Error('Convite expirado.');
      const invite=this.pendingInvite;this.pendingInvite=null;
      if(!data.accept)return {ok:true,accepted:false};
      this.guildId=this.players.find(player=>player.id===invite.fromId)?.guildId||crypto.randomUUID();
      this.state.guildId=this.guildId;this.state.seq=++this.stateSeq;
      await this.track(true);await this.send('guild-joined',{guildId:this.guildId,nick:this.state.nick},invite.fromId);
      this.handlers['guild-joined']?.({guildId:this.guildId,nick:invite.fromNick});return {ok:true,accepted:true,guildId:this.guildId};
    }
    if(path==='pvp'){
      const target=this.players.find(player=>player.id===data.targetId),self=this.state;
      if(!target||target.scene!==self.scene)throw Error('Jogador indisponível.');
      if(safe(self)||safe(target))throw Error('PvP desativado na safe zone.');
      if(this.guildId&&this.guildId===target.guildId)throw Error('Membros da guilda não podem se atacar.');
      if(distance(self,target)>110)throw Error('Aproxime-se do jogador.');
      if(Date.now()-this.lastAttack<850)throw Error('Ataque indisponível.');
      this.lastAttack=Date.now();const damage=Math.max(2,Math.min(50,Math.round(8+self.level*1.3)));
      await this.send('pvp-hit',{nick:self.nick,damage,ability:'basic'},target.id);
      await this.send('combat',{ability:'basic',behavior:'direct',vfx:'slash',x:self.x,y:self.y,aimX:target.x,aimY:target.y,targets:[target.id]});
      this.handlers['pvp-result']?.({targetId:target.id,nick:target.nick,damage,ability:'basic'});
      return {ok:true,damage};
    }
    if(path==='skill')return this.skill(data);
    throw Error('Ação online desconhecida.');
  }
  async skill(data){
    const ability=ABILITIES[data.ability],self=this.state;
    if(!ability||ability.catalogOnly||self.level<(ability.level||1))throw Error('Golpe ainda não desbloqueado.');
    if(Date.now()-(this.lastSkills.get(ability.id)||0)<Math.max(350,ability.cooldown*1000-150))throw Error('Golpe em recarga.');
    this.lastSkills.set(ability.id,Date.now());
    const distanceToAim=Math.hypot(data.x-self.x,data.y-self.y),unit={x:(data.x-self.x)/Math.max(1,distanceToAim),y:(data.y-self.y)/Math.max(1,distanceToAim)},range=ability.range||150,reach=Math.min(range,distanceToAim);
    const impact=ability.selfCentered?{x:self.x,y:self.y}:{x:self.x+unit.x*reach,y:self.y+unit.y*reach};
    const victims=[];
    if(!safe(self)&&!['heal','buff','rolling','teleport'].includes(ability.behavior))for(const target of this.players){
      if(target.id===this.id||target.scene!==self.scene||safe(target)||this.guildId&&this.guildId===target.guildId)continue;
      const along=(target.x-self.x)*unit.x+(target.y-self.y)*unit.y,cross=Math.abs((target.x-self.x)*unit.y-(target.y-self.y)*unit.x),behavior=ability.behavior;
      const hit=['area','zone','debuff'].includes(behavior)?distance(target,impact)<=(ability.radius||30)+14:behavior==='direct'?along>=0&&along<=range+14&&distance(self,target)<=range+14&&cross<32:along>=0&&along<=range+14&&cross<(behavior==='channel'?26+along*.32:behavior==='wave'?(ability.width||40)+14:behavior==='beam'?35:behavior==='whip'?37:23);
      if(!hit)continue;
      if(behavior==='debuff'){victims.push({id:target.id,damage:0});await this.send('pvp-status',{nick:self.nick,ability:ability.id},target.id);continue;}
      const raw=effectiveness(ability.type||'Normal',CREATURES[target.pokemon]?.element||'Normal');if(raw===0)continue;
      const damage=Math.max(1,Math.min(180,Math.round(((CREATURES[self.pokemon]?.attack||13)+self.level*2+(ability.damage||0))*combatEffectiveness(raw)-(CREATURES[target.pokemon]?.defense||2))));
      victims.push({id:target.id,damage});await this.send('pvp-hit',{nick:self.nick,damage,ability:ability.id},target.id);
      this.handlers['pvp-result']?.({targetId:target.id,nick:target.nick,damage,ability:ability.id});
    }
    const visual=starterAttackVisual(CREATURES[self.pokemon]?.baseCreature||self.pokemon,ability.id);
    await this.send('combat',{ability:ability.id,behavior:ability.behavior,vfx:visual?.travel||ability.vfx||`moves/${ability.id}`,castVfx:visual?.cast,impactVfx:visual?.impact,castSize:visual?.castSize,travelSize:visual?.travelSize,impactSize:visual?.impactSize,duration:ability.duration||0,charge:ability.charge||0,x:self.x,y:self.y,aimX:impact.x,aimY:impact.y,radius:ability.radius||0,targets:victims.map(v=>v.id)});
    return {ok:true,victims};
  }
  async leave(){if(!this.token)return;this.token=null;try{await this.channel?.untrack();await this.client?.removeChannel(this.channel);}finally{this.channel=null;this.client=null;this.players=[];this.remoteStates.clear();this.wilds.clear();this.guildId=null;this.pendingInvite=null;}}
}
