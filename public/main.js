import { MapController } from './map-controller.js';
import { loadWorldSave, saveWorld } from './world-runtime.js';
import { WorldView } from './world-view.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { OnlineClient } from './online-client.js';
import { ABILITIES, KEYS, STARTERS, CREATURES, WILD_POKEMON, XP_CURVE, REGION } from './data.js';
import {MOVE_CATALOG} from './move-catalog.js';
import {baseDamageLabel} from './move-info.js';
import { nextEvolution, evolutionLine } from './progression.js';
import {TYPES,effectiveness,normalizeTypes} from './type-system.js';
import {cloud} from './cloud-client.js';
const $ = id => document.getElementById(id);
await cloud.bootstrap();
let cloudGame=null;
if(cloud.enabled&&cloud.session){try{cloudGame=await cloud.loadGame();}catch{cloud.signOut();}}
let worldSave = cloud.enabled?(cloudGame?.world||{seed:REGION.seed,seen:[],pc:[]}):loadWorldSave(localStorage);
worldSave.seed=REGION.seed;
if(!cloud.enabled)try{const legacy=JSON.parse(localStorage.getItem('aurora-inventory')||'null');if(legacy&&!worldSave.inventory)worldSave.inventory=legacy;}catch{}
let account=cloud.enabled?cloudGame?.account||null:null;
if(!cloud.enabled)try{account=JSON.parse(localStorage.getItem('aurora-account')||'null');}catch{}
if(!account&&worldSave.activePokemon?.id)account={createdAt:Date.now(),starterId:worldSave.activePokemon.baseCreature||worldSave.activePokemon.id,legacy:true};
let credentials;try{credentials=JSON.parse(localStorage.getItem('aurora-credentials')||'null');}catch{}
if(cloud.enabled){credentials=cloud.session?.user?{username:cloud.session.user.user_metadata?.username||cloud.session.user.email?.split('@')[0]||'treinador',cloud:true}:null;}
let signedIn=cloud.enabled?!!cloud.session?.access_token:!!credentials&&sessionStorage.getItem('aurora-auth')===credentials.username;
let authMode=credentials?'login':'register';
const safeText=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function passwordDigest(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt),iterations:150000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
let selectedStarter = worldSave.activePokemon?.id&&CREATURES[worldSave.activePokemon.id]?worldSave.activePokemon.id:'bulbasaur';
let sim = new Simulation(selectedStarter, worldSave);
if(account&&worldSave.activePokemon&&!sim.pc.some(p=>p.captureId===(worldSave.activePokemon.captureId||`starter-${account.starterId}`))){const snap={...sim.activeSnapshot(),captureId:worldSave.activePokemon.captureId||`starter-${account.starterId}`};sim.player.captureId=snap.captureId;sim.pc.unshift(snap);}
const renderer = new Renderer($('world'), sim);
renderer.playerNick=account?.nick||credentials?.username||'Treinador';
window.addEventListener('verdant-world-save',event=>cloud.queueSave(event.detail,account));
function restoreWorld(nextWorld){
  worldSave={...nextWorld,seed:REGION.seed};
  localStorage.setItem('aurora-world-v2',JSON.stringify(worldSave));
  if(worldSave.inventory)localStorage.setItem('aurora-inventory',JSON.stringify(worldSave.inventory));
  selectedStarter=worldSave.activePokemon?.id&&CREATURES[worldSave.activePokemon.id]?worldSave.activePokemon.id:'bulbasaur';
  sim=new Simulation(selectedStarter,worldSave);renderer.sim=sim;renderer.worldView.dispose();renderer.worldView=new WorldView(sim.map);renderer.camera={...REGION.spawn};renderer.effects=[];renderer.networkEffects=[];renderer.remoteEntities.clear();
}
const cameraZoom=$('camera-zoom');
const savedCameraZoom=Number(localStorage.getItem('aurora-camera-zoom'));
cameraZoom.value=String(renderer.setZoom(Number.isFinite(savedCameraZoom)&&savedCameraZoom>0?savedCameraZoom:1.45));
cameraZoom.addEventListener('input',()=>{renderer.setZoom(cameraZoom.value);localStorage.setItem('aurora-camera-zoom',String(renderer.zoom));held=false;pointerDirty=false;});
const online = new OnlineClient({
  roster: ({players,safeRadius})=>{
    const current=new Set();
    for(const player of players){if(player.id===online.id)continue;current.add(player.id);let entity=renderer.remoteEntities.get(player.id);
      if(!entity){entity={uid:`remote-${player.id}`,id:player.pokemon,name:player.nick,x:player.x,y:player.y,targetX:player.x,targetY:player.y,hp:player.hp,maxHp:player.maxHp,level:player.level,scene:player.scene,moving:false,facing:{x:0,y:1},remote:true,state:'Idle'};renderer.remoteEntities.set(player.id,entity);}
      const attacking=entity.attackUntil>sim.time;
      if(entity.scene!==player.scene||Math.hypot(player.x-entity.x,player.y-entity.y)>500){entity.x=player.x;entity.y=player.y;}
      Object.assign(entity,{id:player.pokemon,name:player.nick,targetX:player.x,targetY:player.y,hp:player.hp,maxHp:player.maxHp,level:player.level,scene:player.scene,moving:player.moving,facing:player.facing||{x:0,y:1},rolling:player.rolling,guildId:player.guildId});
      if(player.attackActive){if(!attacking)entity.attackStart=sim.time;entity.attackUntil=sim.time+.24;entity.attackAnimation=player.attackAnimation||'Attack';entity.attackFacing=player.attackFacing||entity.facing;}
    }
    for(const id of renderer.remoteEntities.keys())if(!current.has(id))renderer.remoteEntities.delete(id);
    if($('info').open)renderGuild();
  },
  combat:({from,ability,behavior,vfx,castVfx,impactVfx,castSize,travelSize,impactSize,duration:effectDuration,charge,x,y,aimX,aimY,radius,targets})=>{
    if(from===online.id)return;
    const entity=renderer.remoteEntities.get(from);
    if(entity){entity.attackStart=sim.time;entity.attackUntil=sim.time+.45;entity.attackAnimation=['area','direct'].includes(behavior)?'Attack':'Shoot';entity.attackFacing={x:(aimX-x)/Math.max(1,Math.hypot(aimX-x,aimY-y)),y:(aimY-y)/Math.max(1,Math.hypot(aimX-x,aimY-y))};}
    const moving=['projectile','wave'].includes(behavior),duration=moving?Math.max(.25,Math.min(1.6,Math.hypot(aimX-x,aimY-y)/(ABILITIES[ability]?.speed||400))):.55;
    if(['channel','beam','whip','zone'].includes(behavior)){renderer.networkEffects.push({from,ability,behavior,vfx,castVfx,impactVfx,x,y,aimX,aimY,time:sim.time,duration:behavior==='beam'?(charge||.7)+.42:effectDuration||.4,charge:charge||0,size:travelSize||64,impactSize:impactSize||100,castSize:castSize||75});return;}
    if(castVfx)renderer.networkEffects.push({from,ability,behavior:'stationary',vfx:castVfx,x,y,aimX:x,aimY:y,time:sim.time,duration:.5,size:castSize});
    renderer.networkEffects.push({from,ability,behavior,vfx,x,y,aimX,aimY,time:sim.time,duration,size:behavior==='wave'?116:travelSize||(behavior==='area'?Math.max(64,Math.min(220,radius*2)):64),trail:castVfx&&moving?3:0});
    if(impactVfx&&['fireBlast','hydroCannon'].includes(ability))renderer.networkEffects.push({from,ability,behavior:'stationary',vfx:impactVfx,x:aimX,y:aimY,aimX,aimY,time:sim.time+(moving?duration:0),duration:.65,size:impactSize});
    if(['water','waterPulse','hydroPump','aquaWave'].includes(ability))for(const id of targets||[]){const target=online.players.find(player=>player.id===id);if(!target)continue;const travelTime=Math.hypot(target.x-x,target.y-y)/(ABILITIES[ability]?.speed||370);renderer.networkEffects.push({from,ability,behavior:'stationary',vfx:'pmd/0021',x:target.x,y:target.y,aimX:target.x,aimY:target.y,time:sim.time+travelTime,duration:.6,size:82});}
  },
  'pvp-hit':({nick,damage,hp,ability})=>{sim.player.hp=Math.min(sim.player.hp,hp);sim.player.hitStart=sim.time;sim.player.hitUntil=sim.time+.25;if(ability==='basic')renderer.effects.push({x:sim.player.x,y:sim.player.y,time:sim.time,vfx:'slash'});note(`${nick} causou ${damage} de dano!`);if(sim.player.hp<=0&&!sim.player.dead){sim.player.dead=true;sim.player.respawnIn=3;sim.player.path=[];sim.player.target=null;}},
  'pvp-result':({targetId,nick,damage,ability})=>{const entity=renderer.remoteEntities.get(targetId);if(entity){entity.hitStart=sim.time;entity.hitUntil=sim.time+.25;}note(`Você atingiu ${nick}: ${damage} de dano.`);},
  'guild-invite':({fromNick})=>{note(`${fromNick} convidou você para uma guilda. Abra H.`);if($('info').open)renderGuild();},
  'guild-joined':({nick})=>{note(`Guilda formada com ${nick}!`);if($('info').open)renderGuild();},
  'guild-xp':({xp,from})=>{sim.gainXP(xp);saveWorld(localStorage,sim);note(`+${xp} XP compartilhado com ${from}.`);},
  'wild-hit':({uid,damage})=>{const e=sim.enemies.find(v=>v.uid===uid&&v.state!=='Dead');if(e){e.hp=Math.max(0,e.hp-damage);if(e.hp===0){e.state='Dead';e.timer=e.respawn||13;e.deathStart=sim.time;}}},
  'wild-kill':({uid})=>{const e=sim.enemies.find(v=>v.uid===uid&&v.state!=='Dead');if(e){e.hp=0;e.state='Dead';e.timer=e.respawn||13;e.deathStart=sim.time;}},
  'boss-state':({uid,hp,maxHp,respawnAt})=>{const e=sim.enemies.find(v=>v.uid===uid&&v.isBoss);if(!e)return;e.maxHp=maxHp||e.maxHp;e.hp=Math.max(0,Math.min(e.maxHp,hp));if(e.hp<=0){e.state='Dead';e.defeated=true;e.timer=Math.max(0,(respawnAt-Date.now())/1000);e.deathStart=sim.time;e.path=[];e.telegraph=null;}else if(e.state==='Dead'||e.defeated){e.state='Idle';e.defeated=false;e.timer=2;e.path=[];}},
  error:()=>{},
});
const maps = new MapController(renderer, seed => {
  const player=sim.player;sim.syncActivePokemon(); worldSave={seed,seen:[],inventory:sim.inventory,pc:sim.pc,capturePlan:sim.capturePlan,activePokemon:sim.activeSnapshot()}; const fresh=new Simulation(selectedStarter,worldSave);
  Object.assign(fresh.player,player,REGION.spawn,{path:[],target:null,moving:false,dead:false,hp:player.maxHp});
  sim=fresh;renderer.sim=sim;renderer.worldView.dispose();renderer.worldView=new WorldView(sim.map);renderer.camera={...REGION.spawn};saveWorld(localStorage,sim);
});
renderer.mapController=maps;
setInterval(()=>{if(account)saveWorld(localStorage,sim);},10000);
window.addEventListener('pagehide',()=>{if(account){saveWorld(localStorage,sim);if(cloud.enabled)cloud.saveGame(loadWorldSave(localStorage),account,true).catch(()=>{});}online.leave();});
let started = false, paused = false, sound = false, audio, toastUntil = 0, captureAlertTimer, moved = false, accumulator = 0;
let pointer = { x: innerWidth / 2, y: innerHeight / 2 }, held = false, lastMove = 0, pointerDirty = false;
const arrows = new Set();
function showCaptureAlert(specimen){
 const alert=$('capture-alert');
 $('capture-alert-portrait').src=`/assets/pokemon/${specimen.id}/portrait.png`;
 $('capture-alert-portrait').alt=specimen.name;
 $('capture-alert-name').textContent=`${specimen.name} · Nv. ${specimen.level}`;
 alert.hidden=false;alert.classList.remove('leaving');
 clearTimeout(captureAlertTimer);
 captureAlertTimer=setTimeout(()=>{alert.classList.add('leaving');setTimeout(()=>alert.hidden=true,250);},3400);
}
function renderBag(){const bag=sim.inventory;$('bag-money').textContent=`${bag.money.toLocaleString('pt-BR')} moedas`;$('bag-items').replaceChildren();const entries=Object.entries(bag.items);if(!entries.length)$('bag-items').textContent='Sua mochila está vazia. Derrote Pokémon para recolher itens e moedas.';for(const [name,count]of entries){const row=document.createElement('div');row.className='bag-item';const title=document.createElement('span'),quantity=document.createElement('strong');title.textContent=name;quantity.textContent='× '+count;row.append(title,quantity);$('bag-items').append(row);}const select=$('capture-species');if(!select.options.length)for(const p of WILD_POKEMON){const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} · ${p.rarityName}`;select.append(o);}select.value=sim.capturePlan.speciesId;$('capture-enabled').checked=sim.capturePlan.enabled;}
function toggleBag(){if($('bag').open){$('bag').close();return;}held=false;arrows.clear();sim.player.path=[];sim.player.target=null;renderBag();$('bag').showModal();}
$('bag-open').onclick=toggleBag;$('bag-close').onclick=()=>$('bag').close();
$('capture-species').onchange=()=>{sim.configureCapture($('capture-species').value,$('capture-enabled').checked);saveWorld(localStorage,sim);};$('capture-enabled').onchange=()=>{sim.configureCapture($('capture-species').value,$('capture-enabled').checked);saveWorld(localStorage,sim);};
function renderPC(){const filters={species:$('pc-species').value,nature:$('pc-nature').value,ability:$('pc-ability').value};for(const [id,key] of [['pc-species','id'],['pc-nature','nature'],['pc-ability','ability']]){const el=$(id),value=el.value,first=el.options[0];el.replaceChildren(first);for(const v of [...new Set(sim.pc.map(p=>p[key]))].sort()){const o=document.createElement('option');o.value=v;o.textContent=key==='id'?(CREATURES[v]?.name||v):v;el.append(o);}el.value=value;}const sort=$('pc-sort').value;const list=sim.pc.filter(p=>(!filters.species||p.id===filters.species)&&(!filters.nature||p.nature===filters.nature)&&(!filters.ability||p.ability===filters.ability)).sort((a,b)=>(b[sort]||0)-(a[sort]||0));$('pc-list').innerHTML=list.length?list.map(p=>`<article class="pc-card"><img src="/assets/pokemon/${p.id}/portrait.png" alt=""><div><strong>${p.name} · Nv. ${p.level}</strong><span>${p.rarityName||'Comum'} · ${p.nature} · ${p.ability}</span><small>HP ${p.maxHp} · ATQ ${p.attack} · DEF ${p.defense} · VEL ${p.speed}</small></div><button data-capture="${p.captureId}" ${p.captureId===sim.player.captureId?'disabled':''}>${p.captureId===sim.player.captureId?'EM USO':'ESCOLHER'}</button></article>`).join(''):'<p>Nenhum Pokémon capturado com estes filtros.</p>';document.querySelectorAll('[data-capture]').forEach(b=>b.onclick=()=>{if(sim.selectCaptured(b.dataset.capture)){selectedStarter=sim.player.id;saveWorld(localStorage,sim);renderHub();note(`${sim.player.name} agora acompanha você.`);}});}
for(const id of ['pc-species','pc-nature','pc-ability','pc-sort'])$(id).onchange=renderPC;
$('shop-close').onclick=()=>$('shop').close();$('buy-pokeball').onclick=()=>{if(sim.buyPokeballs()){renderBag();saveWorld(localStorage,sim);note('Poké Bola comprada.');}else note('Moedas insuficientes.');};
function renderInfo(){const p=sim.player,a=p.attributes||{},nature={Calma:'Aumenta a resistência: recebe 10% menos dano quando está com mais de 70% de HP.',Brava:'Aumenta o dano dos ataques básicos em 10%, mas reduz a defesa em 1.',Serena:'Aumenta a velocidade de movimento em 8% e reduz o tempo de recarga em 3%.'}[p.nature]||'Uma natureza equilibrada, sem modificadores negativos.',ability={Clorofila:'Em áreas de floresta, ganha 12% de velocidade e recupera 1% do HP máximo a cada 5 segundos.', 'Chama do Sol':'Ataques de fogo causam 15% mais dano quando o HP está abaixo de 50%.','Couraça Torrencial':'Ao ficar abaixo de 35% de HP, recebe 20% menos dano por 4 segundos; recarga de 12 segundos.'}[p.ability]||'Habilidade passiva exclusiva deste Pokémon.';if(!$('info-body'))return;$('info-title').textContent=`${p.name} · Nv. ${p.level}`;$('info-body').innerHTML=`<div class="info-identity"><img src="/assets/pokemon/${p.id}/portrait.png" alt=""><div><b>${p.nature}</b><small>Natureza</small><p class="info-description">${nature}</p><b>${p.ability}</b><small>Habilidade única</small><p class="info-description">${ability}</p></div></div><p class="info-section-title"><img src="/assets/ui/stats.png" alt=""> Atributos</p><p class="info-points">Pontos disponíveis: <strong>${p.attributePoints||0}</strong></p><div class="attributes">${[['vitality','Vitalidade',p.maxHp],['power','Poder',p.attack],['guard','Defesa',p.defense],['agility','Agilidade',p.speed]].map(([id,label,value])=>`<div class="attribute"><span><b>${label}</b><small>${value}</small></span><button data-attribute="${id}" ${p.attributePoints?'':'disabled'}>+1</button></div>`).join('')}</div><div class="info-stats"><span>HP máximo <b>${p.maxHp}</b></span><span>Ataque <b>${p.attack}</b></span><span>Defesa <b>${p.defense}</b></span><span>Velocidade <b>${p.speed}</b></span><span>XP <b>${p.xp}</b></span></div>`;document.querySelectorAll('[data-attribute]').forEach(b=>b.onclick=()=>{if(sim.investAttribute(b.dataset.attribute)){renderInfo();renderMoves();addTypeInfo();renderGuild();saveWorld(localStorage,sim);}});}
function addTypeInfo(){const p=sim.player,types=normalizeTypes(p.element),weak=TYPES.filter(t=>types.some(def=>effectiveness(t,def)>1)),resist=TYPES.filter(t=>types.every(def=>effectiveness(t,def)<1)),el=document.createElement('p');el.className='type-matchups';el.innerHTML=`<span class="info-section-title"><img src="/assets/ui/types.png" alt=""> Tipagens</span><b>Fraquezas:</b> ${weak.join(', ')||'Nenhuma'}<br><b>Resistências:</b> ${resist.join(', ')||'Nenhuma'}`;$('info-body').append(el);}
function renderMoves(){
 const p=sim.player,section=document.createElement('section');section.className='move-manager';
 section.innerHTML=`<p class="info-section-title">GOLPES APRENDIDOS</p><small>Escolha em qual atalho cada golpe ficará equipado. O dano final também depende de ATQ, defesa, tipagem e quantidade de acertos.</small><div class="move-list">${(p.knownMoves||[]).map(id=>{const a=ABILITIES[id],equipped=p.slots.indexOf(id),style={area:'Área',zone:'Área persistente',channel:'Canalização',beam:'Raio carregado',whip:'Chicote',wave:'Onda',rolling:'Controle',buff:'Buff',heal:'Cura',direct:'Contato',projectile:'Projétil'}[a.behavior]||'Golpe';return `<article class="move-card ${equipped>=0?'equipped':''}"><div><b>${a.name}</b><span>${a.type||'Normal'} · ${style} · ${a.cooldown}s</span><strong class="move-power">${baseDamageLabel(a)}</strong><small>${a.description}</small></div><div class="move-slots">${KEYS.map((key,index)=>`<button data-move="${id}" data-move-slot="${index}" ${equipped===index?'disabled':''}>${key}</button>`).join('')}</div></article>`}).join('')}</div>`;
 $('info-body').append(section);
 section.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{if(sim.equipMove(button.dataset.move,Number(button.dataset.moveSlot))){renderInfo();renderMoves();addTypeInfo();renderGuild();saveWorld(localStorage,sim);note(`${ABILITIES[button.dataset.move].name} equipado em ${KEYS[button.dataset.moveSlot]}.`);}});
 const catalog=document.createElement('details');catalog.className='move-catalog';catalog.innerHTML=`<summary>REPERTÓRIO FUTURO · ${MOVE_CATALOG.length} GOLPES</summary><p>Golpes preparados para futuros sistemas de MT e MH. Ainda não podem ser equipados.</p><div class="move-catalog-grid">${MOVE_CATALOG.map(move=>`<article><span class="move-preview" style="background-image:url('/assets/sprites/vfx/${ABILITIES[move.id].vfx}.png')"></span><div><b>${move.name}</b><small>${move.type} · ${move.category} · ${move.source}</small><strong class="move-power">${baseDamageLabel(move)}</strong><small>${move.description}</small></div></article>`).join('')}</div>`;$('info-body').append(catalog);
}
function renderGuild(){if(!$('info-body'))return;$('info-body').querySelector('.guild-section')?.remove();const section=document.createElement('section');section.className='guild-section';const members=online.players.filter(p=>p.id!==online.id&&p.guildId&&p.guildId===online.guildId),others=online.players.filter(p=>p.id!==online.id&&p.scene===(sim.map.scene||'world'));
  section.innerHTML=`<h3>GUILDA E JOGADORES</h3><p>${online.token?`${online.players.length} online · ${online.guildId?`Guilda com ${members.length+1} membro(s)`:'Sem guilda'}`:'Entre no mundo para ver outros jogadores.'}</p>${online.pendingInvite?`<div class="guild-invite">Convite de ${safeText(online.pendingInvite.fromNick)}<div><button data-guild-reply="yes">Aceitar</button> <button data-guild-reply="no">Recusar</button></div></div>`:''}<div>${others.map(p=>`<div class="guild-player"><span>${safeText(p.nick)} · ${safeText(p.pokemon)} · Nv. ${p.level}${p.guildId&&p.guildId===online.guildId?' · SUA GUILDA':''}</span>${p.guildId&&p.guildId===online.guildId?'':`<button data-guild-invite="${p.id}">Convidar</button>`}</div>`).join('')||'<small>Nenhum outro jogador nesta área.</small>'}</div><small>Fora da Vila, clique em outro jogador para atacar. Membros da guilda não podem se atacar e compartilham XP quando ambos atingem a mesma criatura.</small>`;
  $('info-body').append(section);section.querySelectorAll('[data-guild-invite]').forEach(button=>button.onclick=()=>online.request('guild/invite',{targetId:button.dataset.guildInvite}).then(()=>note('Convite de guilda enviado.')).catch(error=>note(error.message)));section.querySelectorAll('[data-guild-reply]').forEach(button=>button.onclick=()=>online.request('guild/reply',{accept:button.dataset.guildReply==='yes'}).then(()=>{online.pendingInvite=null;renderGuild();}).catch(error=>note(error.message)));
}
function toggleInfo(){if($('info').open){$('info').close();return;}held=false;arrows.clear();sim.player.path=[];sim.player.target=null;renderInfo();renderMoves();addTypeInfo();renderGuild();$('info').showModal();}
$('info-open').onclick=toggleInfo;$('info-close').onclick=()=>$('info').close();
const hotbar = $('hotbar');
const missionsToggle = $('missions-toggle');
if (missionsToggle) missionsToggle.onclick = () => {
  const panel = $('objectives'), collapsed = panel.classList.toggle('collapsed');
  missionsToggle.setAttribute('aria-expanded', String(!collapsed));
  missionsToggle.querySelector('b').textContent = collapsed ? 'Abrir ▾' : 'Recolher ▴';
};
function openHub(tab='play') {if(started){held=false;arrows.clear();paused=true;saveWorld(localStorage,sim);}$('pause-screen').hidden=true;$('welcome').hidden=false;$('hud').hidden=true;selectHub(tab);renderHub();}
function selectHub(tab){if(!signedIn&&tab==='pokemon')tab='play';for(const button of document.querySelectorAll('[data-hub]'))button.setAttribute('aria-selected',String(button.dataset.hub===tab));for(const name of ['play','account','pokemon','options'])$(`hub-${name}`).hidden=name!==tab;if(tab==='pokemon')renderPC();}
function renderHub(){
  const ready=!!account&&signedIn,p=sim.player,displayName=safeText(account?.nick||credentials?.username||'Treinador');
  $('welcome').classList.toggle('has-journey',ready);
  $('hub-auth').hidden=signedIn;$('new-game-setup').hidden=!signedIn||!!account;
  $('egg-result').hidden=$('egg-result').hidden||!signedIn;
  $('start').hidden=!ready;$('hub-active').hidden=!ready;
  $('hub-play-label').textContent=account?'CONTINUAR':'NOVO JOGO';
  $('hub-play-title').textContent=!signedIn?'Bem-vindo a Aurora.':ready?'Continue sua jornada.':'Uma nova jornada começa.';
  $('hub-play-copy').textContent=!signedIn?(credentials||cloud.enabled?'Entre na sua conta para continuar ou crie outra.':'Crie sua conta para começar a aventura.'):(ready?'Seu companheiro está pronto para explorar Aurora.':'Escolha um nick e um dos três ovos. Um dos nove iniciais nascerá para você.');
  $('auth-register-tab').hidden=false;$('auth-login-tab').hidden=!cloud.enabled&&!credentials;
  $('auth-submit').textContent=authMode==='login'?'ENTRAR':'CRIAR CONTA';
  $('auth-password').autocomplete=authMode==='login'?'current-password':'new-password';
  $('hub-trainer-level').textContent=ready?`POKÉMON NV. ${p.level} · ${sim.inventory.money} MOEDAS`:signedIn?'AGUARDANDO PRIMEIRO OVO':'AGUARDANDO CONTA';
  document.querySelector('.trainer-copy strong').textContent=signedIn?(account?.nick||credentials.username).toUpperCase():'NOVO TREINADOR';
  $('hub-party').innerHTML=ready?`<div class="party-label">SEU COMPANHEIRO</div><div class="party-member"><img src="/assets/pokemon/${p.id}/portrait.png" alt=""><span><strong>${p.name}</strong><small>NV. ${p.level} · ${p.element}</small><i><em style="width:${Math.max(0,Math.min(100,p.hp/p.maxHp*100))}%"></em></i></span></div><div class="party-count">${sim.pc.length} POKÉMON NO PC</div>`:'<div class="party-empty">Sua equipe aparecerá aqui depois que o ovo chocar.</div>';
  if(ready){$('hub-active').innerHTML=`<img src="/assets/pokemon/${p.id}/portrait.png" alt=""><div><small>POKÉMON ATIVO</small><strong>${p.name} · Nv. ${p.level}</strong><span>${p.element}</span></div>`;$('start').textContent=started?'CONTINUAR JOGANDO →':'CONTINUAR →';}
  const created=account?.createdAt?new Date(account.createdAt).toLocaleDateString('pt-BR'):'—';
  $('account-details').innerHTML=signedIn?`<div><span>Usuário</span><strong>${safeText(credentials.username)}</strong></div><div><span>Nick do treinador</span><strong>${displayName}</strong></div><div><span>Início da jornada</span><strong>${created}</strong></div><div><span>Pokémon no PC</span><strong>${sim.pc.length}</strong></div><div><span>Pokémon ativo</span><strong>${ready?`${p.name} · Nv. ${p.level}`:'Aguardando ovo'}</strong></div><div><span>Moedas</span><strong>${sim.inventory.money}</strong></div>`:'<div><span>Acesso</span><strong>Crie sua conta ou entre para ver o progresso.</strong></div>';
  $('create-another-account').textContent=signedIn?'CRIAR OUTRA CONTA':'CRIAR CONTA';
}
for(const button of document.querySelectorAll('[data-hub]'))button.onclick=()=>selectHub(button.dataset.hub);
$('auth-register-tab').onclick=()=>{authMode='register';renderHub();};
$('auth-login-tab').onclick=()=>{authMode='login';renderHub();};
$('create-another-account').onclick=async()=>{await online.leave();cloud.signOut();started=false;paused=false;signedIn=false;account=null;credentials=null;worldSave={seed:REGION.seed,seen:[],pc:[]};restoreWorld(worldSave);renderer.playerNick='Treinador';authMode='register';sessionStorage.removeItem('aurora-auth');$('hud').hidden=true;$('welcome').hidden=false;selectHub('play');renderHub();$('auth-user').value='';$('auth-password').value='';$('auth-user').focus();};
$('auth-form').onsubmit=async event=>{
  event.preventDefault();
  const username=$('auth-user').value.trim(),password=$('auth-password').value,message=$('auth-message');
  if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)){message.textContent='Use 3 a 20 letras, números ou _. ';return;}
  if(password.length<6){message.textContent='A senha precisa ter ao menos 6 caracteres.';return;}
  $('auth-submit').disabled=true;
  try{
    if(authMode==='register'){
      if(cloud.enabled){await cloud.signUp(username,password);credentials={username,cloud:true};}
      else{const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))),digest=await passwordDigest(password,salt);credentials={username,salt,digest};}
      await online.leave();started=false;paused=false;account=null;localStorage.removeItem('aurora-account');localStorage.removeItem('aurora-world-v2');localStorage.removeItem('aurora-inventory');
      localStorage.setItem('aurora-credentials',JSON.stringify(credentials));
      worldSave={seed:REGION.seed,seen:[],pc:[]};selectedStarter='bulbasaur';sim=new Simulation(selectedStarter,worldSave);renderer.sim=sim;renderer.worldView.dispose();renderer.worldView=new WorldView(sim.map);renderer.camera={...REGION.spawn};renderer.effects=[];renderer.networkEffects=[];renderer.remoteEntities.clear();renderer.playerNick=username;
    }else{
      if(cloud.enabled){
        await cloud.signIn(username,password);credentials={username,cloud:true};localStorage.setItem('aurora-credentials',JSON.stringify(credentials));
        const remote=await cloud.loadGame();account=remote?.account||null;if(account)localStorage.setItem('aurora-account',JSON.stringify(account));else localStorage.removeItem('aurora-account');restoreWorld(remote?.world||{seed:REGION.seed,seen:[],pc:[]});renderer.playerNick=account?.nick||username;
      }else if(!credentials||credentials.username!==username||credentials.digest!==await passwordDigest(password,credentials.salt)){message.textContent='Usuário ou senha incorretos.';return;}
    }
    signedIn=true;sessionStorage.setItem('aurora-auth',credentials.username);message.textContent='';$('auth-password').value='';renderHub();selectHub('play');
  }catch(error){message.textContent=error.message||'Não foi possível entrar.';}finally{$('auth-submit').disabled=false;}
};
for(const button of document.querySelectorAll('[data-egg]'))button.onclick=()=>{
  if(!signedIn||account)return;
  const nick=$('trainer-nick').value.trim();
  if(nick.length<2||nick.length>20){$('trainer-nick').setCustomValidity('Escolha um nick de 2 a 20 caracteres.');$('trainer-nick').reportValidity();return;}
  $('trainer-nick').setCustomValidity('');
  const values=new Uint32Array(1);crypto.getRandomValues(values);const starter=Object.values(STARTERS)[values[0]%Object.keys(STARTERS).length];
  selectedStarter=starter.id;account={createdAt:Date.now(),starterId:starter.id,egg:Number(button.dataset.egg),nick};
  renderer.playerNick=nick;
  localStorage.setItem('aurora-account',JSON.stringify(account));
  sim=new Simulation(starter.id,{seed:worldSave.seed,seen:worldSave.seen,inventory:worldSave.inventory,pc:worldSave.pc||[]});
  sim.player.captureId=`starter-${starter.id}`;sim.pc.unshift({...sim.activeSnapshot(),captureId:sim.player.captureId});
  renderer.sim=sim;renderer.worldView.dispose();renderer.worldView=new WorldView(sim.map);
  $('egg-result').hidden=false;$('egg-result').innerHTML=`<img src="/assets/pokemon/${starter.id}/portrait.png" alt=""><div><small>SEU OVO CHOCOU!</small><strong>${starter.name}</strong><span>${starter.element}</span></div>`;
  saveWorld(localStorage,sim);renderHub();
};
renderHub();
function resetSession() {
  sim.syncActivePokemon();worldSave={seed:sim.map.seed,seen:[...(sim.outdoor?.discovery||sim.discovery).seen],inventory:sim.inventory,pc:sim.pc,capturePlan:sim.capturePlan,activePokemon:sim.player.id===selectedStarter?sim.activeSnapshot():null}; sim = new Simulation(selectedStarter,worldSave); renderer.sim = sim; renderer.effects = []; sim.events = [];
  moved = false; paused = false; accumulator = 0; held = false; pointerDirty = false; lastMove = 0; arrows.clear();
  renderer.playerNick=account?.nick||credentials?.username||'Treinador';$('player-name').textContent = renderer.playerNick; $('player-element').textContent = `✦ ${sim.player.name.toUpperCase()} · ${sim.player.element.toUpperCase()}`;
  $('player-portrait').src = `/assets/pokemon/${selectedStarter}/portrait.png`; $('player-portrait').alt = sim.player.name;
  $('player-name').dataset.species = selectedStarter;
  renderInfo();
}
for (let i = 0; i < 4; i++) {
  const button = document.createElement('button'); button.className = 'slot'; button.id = `slot-${i}`;
  button.innerHTML = `<span class="bind">${KEYS[i]}</span><span class="glyph"></span><span class="name"></span><span class="power"></span><span class="cooldown" hidden></span>`;
  button.addEventListener('click', () => cast(i)); hotbar.append(button);
}
function note(message) { $('toast').textContent = message; toastUntil = sim.time + 4; }
function beep(type) {
  if (!sound) return;
  audio ??= new AudioContext(); audio.resume();
  if (type === 'evolve') {
    for (const [i, frequency] of [523, 659, 784, 1046].entries()) {
      const voice = audio.createOscillator(), volume = audio.createGain(), start = audio.currentTime + i * .12;
      voice.connect(volume); volume.connect(audio.destination); voice.frequency.value = frequency;
      volume.gain.setValueAtTime(.035, start); volume.gain.exponentialRampToValueAtTime(.001, start + .3); voice.start(start); voice.stop(start + .3);
    }
    return;
  }
  const osc = audio.createOscillator(), gain = audio.createGain(); osc.connect(gain); gain.connect(audio.destination);
  const f = { cast: 390, hurt: 110, kill: 620, level: 880, learn: 740, heal: 520 }[type]; if (!f) return;
  osc.type = 'sine'; osc.frequency.setValueAtTime(f, audio.currentTime); osc.frequency.exponentialRampToValueAtTime(f * .6, audio.currentTime + .15);
  gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .2); osc.start(); osc.stop(audio.currentTime + .2);
}
function setPause(value) { if (!started || sim.player.dead) return; paused = value; held = false; arrows.clear(); $('pause-screen').hidden = !paused; }
function rivalAt(aim,radius=30){for(const [id,entity] of renderer.remoteEntities){if(entity.scene!==(sim.map.scene||'world')||entity.hp<=0||Math.hypot(entity.x-aim.x,entity.y-16-aim.y)>=radius)continue;const player=online.players.find(candidate=>candidate.id===id);if(player)return player;}return null;}
function cast(slot) {
  if (!started || paused || sim.player.dead) return;
  const a = ABILITIES[sim.player.slots[slot]];
  if (!a) { note(slot === 1 ? 'A recuperação é desbloqueada no nível 2.' : 'Slot reservado para futuras habilidades.'); return; }
  const aim = renderer.worldPoint(pointer.x, pointer.y);
  const aimedEnemy=a.behavior==='direct'?sim.enemies.find(e=>e.state!=='Dead'&&Math.hypot(e.x-aim.x,e.y-16-aim.y)<27):null;
  if(aimedEnemy)sim.command({type:'target',id:aimedEnemy.uid});
  const rival=a.behavior==='direct'&&online.token?rivalAt(aim):null;
  const used=sim.command({ type: 'cast', slot, ...aim, remoteTarget:rival?{x:rival.x,y:rival.y,radius:12}:null });
  if(used&&online.token)online.request('skill',{ability:a.id,x:aim.x,y:aim.y}).catch(error=>{if(!/recarga/i.test(error.message))note(error.message);});
  if (!used && a.behavior === 'heal' && sim.player.hp === sim.player.maxHp) note('Sua vida já está completa.');
}
$('start').onclick = () => { if(!account||!signedIn)return;if(!started)resetSession();started=true;paused=false;$('welcome').hidden=true;$('hud').hidden=false;online.join({nick:renderer.playerNick,pokemon:sim.player.id}).catch(error=>note(`Online indisponível: ${error.message}`)); };
setInterval(()=>{if(started&&online.token){const p=sim.player;online.update({nick:renderer.playerNick,pokemon:p.id,level:p.level,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,scene:sim.map.scene||'world',moving:p.moving,facing:p.facing,attackActive:p.attackUntil>sim.time,attackAnimation:p.attackAnimation,attackFacing:p.attackFacing});}},160);
$('resume').onclick = () => setPause(false);
$('restart').onclick = () => { resetSession(); $('pause-screen').hidden = true; note('Uma nova jornada começa.'); };
$('change-starter').onclick=()=>openHub('pokemon');
$('hub-sound').onclick=()=>{sound=!sound;$('hub-sound').textContent=sound?'Desativar som':'Ativar som';beep('learn');};
function updatePointerCursor(){const aim=renderer.worldPoint(pointer.x,pointer.y),enemy=sim.enemies.some(e=>e.state!=='Dead'&&Math.hypot(e.x-aim.x,e.y-16-aim.y)<27);$('world').classList.toggle('attack-cursor',enemy||!!rivalAt(aim));}
$('world').addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; pointerDirty = true; updatePointerCursor(); });
function moveAtPointer(select = true) {
  const aim = renderer.worldPoint(pointer.x, pointer.y);
  const rival=select&&rivalAt(aim);
  if(rival){held=false;online.request('pvp',{targetId:rival.id}).then(()=>{const p=sim.player,d=Math.hypot(rival.x-p.x,rival.y-p.y)||1;p.attackFacing={x:(rival.x-p.x)/d,y:(rival.y-p.y)/d};p.attackAnimation='Attack';p.attackStart=sim.time;p.attackUntil=sim.time+.45;}).catch(error=>note(error.message));return;}
  const entrance=select&&sim.map.interactions?.find(i=>Math.hypot(i.x-aim.x,i.y-aim.y)<28);
  if(entrance){sim.command({type:'interact',id:entrance.id});held=false;return;}
  const target = select && sim.enemies.find(e => e.state !== 'Dead' && Math.hypot(e.x - aim.x, e.y - 16 - aim.y) < 27);
  if (target) { sim.command({ type: 'target', id: target.uid }); held = false; }
  else if (sim.command({ type: 'move', ...aim })) moved = true;
}
$('world').addEventListener('pointerdown', e => {
  if (!started || paused || maps.expanded || sim.player.dead || e.button !== 0) return;
  arrows.clear(); pointer = { x: e.clientX, y: e.clientY }; pointerDirty = false;
  held = true; lastMove = sim.time; $('world').setPointerCapture(e.pointerId); moveAtPointer();
});
window.addEventListener('pointerup', () => { held = false; });
window.addEventListener('pointercancel', () => { held = false; pointerDirty = false; });
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('blur', () => { held = false; arrows.clear(); if (started && !sim.player.dead) setPause(true); });
window.addEventListener('keydown', e => {
  if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;
  const key = e.key.toUpperCase();
  if(key==='B'&&started&&!e.repeat){toggleBag();return;}
  if(key==='H'&&started&&!e.repeat){toggleInfo();return;}
  if(key==='P'&&started&&!e.repeat){openHub('pokemon');return;}
  if(key==='S'&&started&&!paused){e.preventDefault();held=false;pointerDirty=false;arrows.clear();sim.inputVector=null;sim.player.path=[];sim.player.target=null;sim.player.moving=false;return;}
  if($('bag').open)return;
  if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', ' '].includes(key)) e.preventDefault();
  if (key.startsWith('ARROW') && !e.repeat && started && !paused) { arrows.add(key); held = false; }
  if(key==='SHIFT')sim.player.running=true;
  if (e.repeat) return;
  if(key==='F3'){e.preventDefault();renderer.debug=!renderer.debug;}
  if(key==='F'&&started&&!paused)sim.command({type:'interact'});
  if (key === 'ESCAPE') {if(!$('welcome').hidden&&started){$('start').click();}else if(maps.expanded)maps.toggle();else setPause(!paused);}
  if (key === 'M' && started) {maps.toggle();held=false;arrows.clear();}
  if (key === '0' && started) {renderer.setZoom(.55);cameraZoom.value=String(renderer.zoom);}
  if (key === '1' && started) {renderer.setZoom(1.45);cameraZoom.value=String(renderer.zoom);}
  if (KEYS.includes(key)) cast(KEYS.indexOf(key));
});
window.addEventListener('keyup', e => {arrows.delete(e.key.toUpperCase());if(e.key==='Shift')sim.player.running=false;});
function updateUI() {
  $('bag-open').hidden=!started;
  $('bag-open').querySelector('span').textContent='B · Mochila';
  $('info-open').hidden=!started;
  const p = sim.player;
  if ($('player-name').dataset.species !== p.id) {
    $('player-name').dataset.species = p.id; $('player-name').textContent = renderer.playerNick; $('player-element').textContent = `✦ ${p.name.toUpperCase()} · ${p.element.toUpperCase()}`;
    $('player-portrait').src = `/assets/pokemon/${p.id}/portrait.png`; $('player-portrait').alt = p.name;
  }
  $('level').textContent = `NV. ${String(p.level).padStart(2, '0')}`; $('hp-fill').style.width = `${p.hp / p.maxHp * 100}%`; $('hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  const nextXp=XP_CURVE[p.level];$('xp-fill').style.width = `${Math.min(100,p.xp/nextXp*100)}%`;$('xp-text').textContent=`${p.xp} / ${nextXp} XP`;
  for (let i = 0; i < 4; i++) {
    const el = $(`slot-${i}`), a = ABILITIES[p.slots[i]], cd = a ? p.cooldowns[a.id] || 0 : 0;
    el.classList.toggle('locked', !a); el.querySelector('.glyph').textContent = a ? (i === 3 ? '✦' : ({Grass:'❧',Fire:'♨',Water:'≈',Ground:'◆',Flying:'➶',Ice:'❄',Dark:'◐',Psychic:'✧',Poison:'☣',Normal:'●'}[a.type]||'◇')) : '♢'; el.querySelector('.glyph').style.color = a?.color || ''; el.querySelector('.name').textContent = a?.name || ['','Nível 2','Nível 10','Ultimate · Nível 25'][i];
    el.querySelector('.power').textContent=a?(a.damage>0?`DMG ${a.damage}`:a.healing?`CURA ${a.healing}`:'SUPORTE'):'';
    el.title = a ? `${KEYS[i]} · ${baseDamageLabel(a)} · ${a.description} Recarga: ${a.cooldown}s` : `Desbloqueia no nível ${[1,2,10,25][i]}`;
    el.setAttribute('aria-label', el.title); const cover = el.querySelector('.cooldown'); cover.hidden = cd <= 0; cover.textContent = cd.toFixed(1);
  }
  $('goal-move').classList.toggle('done', moved); $('goal-kills').classList.toggle('done', sim.kills >= 2); $('goal-kills').querySelector('b').textContent = `${Math.min(2, sim.kills)} / 2`; $('goal-quest').classList.toggle('done', sim.quest.complete); $('goal-quest').querySelector('b').textContent = `${Math.min(sim.quest.goal, sim.quest.progress)} / ${sim.quest.goal}`; $('goal-level').classList.toggle('done', p.level >= 2);
  if (p.level >= 2&&ABILITIES[p.slots[1]]) $('objective-note').textContent = `${ABILITIES[p.slots[1]].name} desbloqueado! Use W para recuperar vida.`;
  else $('objective-note').textContent = 'Uma nova habilidade espera por você.';
  const target = sim.enemies.find(e => e.uid === p.target && e.state !== 'Dead'); $('target-panel').hidden = !target;
  if (target) $('target-panel').innerHTML = `${target.name} · Nv. ${target.level||1}<div class="meter"><div style="width:${target.hp / target.maxHp * 100}%;height:100%"></div></div><small>HP ${Math.ceil(target.hp)}/${target.maxHp}</small>`;
  $('death-screen').hidden = !p.dead; $('respawn-text').textContent = `Retornando à clareira em ${Math.max(1, Math.ceil(p.respawnIn || 0))}…`;
  $('toast').style.opacity = sim.time < toastUntil ? '1' : '0'; renderer.minimap($('minimap'));
}
let previous = performance.now();
let lastHudUpdate=0;
function frame(now) {
  const dt = Math.min((now - previous) / 1000, .1); previous = now;
  if (started && !paused) {
    accumulator += dt;
    while (accumulator >= 1 / 60) {
      sim.inputVector=null;
      if (!sim.player.dead) {
        // A stationary cursor must not create new destinations as the camera moves.
        if (held && pointerDirty && sim.time - lastMove > .08) { moveAtPointer(false); lastMove = sim.time; pointerDirty = false; }
        const x = Number(arrows.has('ARROWRIGHT')) - Number(arrows.has('ARROWLEFT')), y = Number(arrows.has('ARROWDOWN')) - Number(arrows.has('ARROWUP'));
        sim.inputVector=x||y?{x,y}:null;
      }
      sim.step(1 / 60);if(sim.inputVector&&sim.player.moving)moved=true;accumulator -= 1 / 60;
    }
    for (const e of sim.events.splice(0)) {
      if(online.token&&e.type==='damage'&&Number.isInteger(e.uid)){const target=sim.enemies.find(v=>v.uid===e.uid);online.request('wild-hit',{uid:e.uid,damage:e.amount,isBoss:!!target?.isBoss,maxHp:target?.maxHp,respawn:target?.respawn}).catch(()=>{});}
      if(online.token&&e.type==='kill'&&Number.isInteger(e.uid))online.request('wild-kill',{uid:e.uid,xp:e.xp}).catch(()=>{});
      if (['damage', 'hurt', 'kill', 'heal', 'slash','area','buff','castVisual','impact'].includes(e.type)) renderer.effects.push(e);
      if(e.type==='interaction')note(e.message);
      if(e.type==='openShop'){$('shop').showModal();note('Loja aberta.');}
      if(e.type==='loot'){note(`+${e.count} ${e.item} · +${e.money} moedas`);try{localStorage.setItem('aurora-inventory',JSON.stringify(sim.inventory));}catch{}renderBag();}
      if(e.type==='captureThrow')note(`Poké Bola lançada em ${e.name}…`);
      if(e.type==='captureFail')note(`${e.name} escapou da Poké Bola.`);
      if(e.type==='captureThrow'){saveWorld(localStorage,sim);renderBag();}
      if(e.type==='captured'){note(`${e.name} capturado e enviado ao PC!`);showCaptureAlert(e.specimen);renderPC();saveWorld(localStorage,sim);}
      if(e.type==='typeEffect'&&e.message)note(e.message);
      if (e.type === 'level') note(`Nível ${e.level} alcançado!`);
      if (e.type === 'evolve'){note(`${CREATURES[e.from].name} evoluiu para ${CREATURES[e.to].name}!\n${ABILITIES[CREATURES[e.to].projectile].name} disponível em Q.`);saveWorld(localStorage,sim);}
      if (e.type === 'bossTelegraph') note(`${e.name}! ${e.shape === 'circle' ? 'Saia do círculo.' : e.shape === 'cone' ? 'Saia da frente do boss.' : 'Desvie para o lado do raio.'}`);
      if (e.type === 'bossDefeated') note('Guardião derrotado! A clareira está segura.');
      if (e.type === 'drop') note(`Drop encontrado: ${e.item}.`);
      if (e.type === 'questComplete') note(`Clareira limpa! +${e.xp} XP.`);
      if (e.type === 'learn') note(`Nível ${sim.player.level} · ${e.name} aprendido!\nAbra H para organizar os golpes.`);
      if (e.type === 'respawn') note('Você renasceu. Sua jornada continua.'); beep(e.type);
    }
  }
  renderer.draw(paused ? 0 : dt, started);if(started&&now-lastHudUpdate>=80){updateUI();lastHudUpdate=now;}requestAnimationFrame(frame);
}
requestAnimationFrame(frame);





