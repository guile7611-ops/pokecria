import test from 'node:test';
import assert from 'node:assert/strict';
import {officialDamage} from '../public/official-mechanics.js';
import {Simulation} from '../public/simulation.js';
import {ABILITIES} from '../public/data.js';
import {existsSync} from 'node:fs';

function setup(starter='charmander',offsets=[70]){
 const sim=new Simulation(starter),p=sim.player;
 sim.enemies=offsets.map((offset,index)=>({...sim.enemies[0],uid:100+index,id:'test-'+index,name:'Alvo',element:'Normal',x:p.x+offset,y:p.y,home:{x:p.x+offset,y:p.y},hp:1000,maxHp:1000,defense:0,radius:12,hurtbox:{radius:12,layer:32},state:'Idle',defeated:false,timer:100,aggro:0,leash:2000,path:[]}));
 return {sim,p,enemies:sim.enemies};
}
const step=(sim,seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)sim.step(.05);};

test('Ice Fang lunges into melee, closes jaws, and briefly chills its target',()=>{
 const {sim,p,enemies:[e]}=setup('totodile',[70]);const oldX=p.x;
 assert.equal(sim.cast(ABILITIES.iceFang,{x:e.x,y:e.y}),true);
 assert.ok(p.x>oldX);assert.ok(e.hp<1000);assert.equal(sim.projectiles.length,0);
 assert.ok(e.slowUntil>sim.time);assert.ok(e.staggerUntil>sim.time);
 assert.ok(sim.events.some(event=>event.type==='slash'&&event.vfx==='moves/iceFang'));
});

test('Ice Fang can cast toward an online player without a wild target',()=>{
 const {sim,p}=setup('totodile',[]),x=p.x+65,hp=p.hp;
 assert.equal(sim.command({type:'cast',slot:2,x,y:p.y,remoteTarget:{x,y:p.y,radius:12}}),false);
 p.level=10;p.slots[2]='iceFang';
 assert.equal(sim.command({type:'cast',slot:2,x,y:p.y,remoteTarget:{x,y:p.y,radius:12}}),true);
 assert.ok(p.x<x);assert.equal(p.hp,hp);assert.ok(p.cooldowns.iceFang>0);
 assert.ok(sim.events.some(event=>event.type==='slash'&&event.vfx==='moves/iceFang'));
});

test('Take Down and Rock Smash approach a selected wild target and strike once in range',()=>{
 for(const id of ['takeDown','rockSmash']){
  const {sim,p,enemies:[e]}=setup('mudkip',[170]);
  sim.updateEnemy=()=>{};p.slots[0]=id;
  const originalHp=e.hp;
  assert.equal(sim.command({type:'cast',slot:0,x:e.x,y:e.y,targetId:e.uid}),'queued',`${id} should begin pursuit`);
  assert.equal(e.hp,originalHp,`${id} should not hit from afar`);
  for(let i=0;i<120&&e.hp===originalHp;i++)sim.step(.05);
  assert.ok(e.hp<originalHp,`${id} should connect after approaching`);
  assert.equal(p.pendingCast,null);
  assert.equal(sim.events.filter(event=>event.type==='queuedCast'&&event.ability===id).length,1);
 }
});

test('a new movement command cancels a queued melee skill',()=>{
 const {sim,p,enemies:[e]}=setup('mudkip',[170]);
 sim.updateEnemy=()=>{};p.slots[0]='rockSmash';
 assert.equal(sim.command({type:'cast',slot:0,x:e.x,y:e.y,targetId:e.uid}),'queued');
 sim.command({type:'move',x:p.x,y:p.y+70});
 assert.equal(p.pendingCast,null);
 assert.equal(p.target,null);
});

test('every configured move can be equipped, cast through the player command, and load its effect',()=>{
 for(const id of Object.keys(ABILITIES).filter(id=>id!=='basic')){
  const a=ABILITIES[id];assert.ok(a,`${id} must have a combat definition`);
  assert.ok(existsSync(new URL(`../public/assets/sprites/vfx/${a.vfx}.png`,import.meta.url)),`${id} must have an effect sprite`);
  const {sim,p,enemies:[e]}=setup('swampert',[58]);
  sim.updateEnemy=()=>{};p.level=100;p.knownMoves=[id];
  assert.equal(sim.equipMove(id,0),true,`${id} must equip`);
  if(a.behavior==='heal')p.hp=p.maxHp-40;
  const aim=a.behavior==='teleport'?{x:p.x+100,y:p.y}:{x:e.x,y:e.y};
  assert.equal(sim.command({type:'cast',slot:0,...aim,targetId:e.uid}),true,`${id} must cast from Q`);
  assert.ok(p.cooldowns[id]>0,`${id} must start cooldown`);
  assert.ok(sim.events.some(event=>event.type==='cast'&&event.ability===id),`${id} must report a cast`);
 }
});

test('all contact moves approach a distant selected enemy',()=>{
 for(const id of Object.keys(ABILITIES)){
  if(ABILITIES[id]?.behavior!=='direct')continue;
  const {sim,p,enemies:[e]}=setup('swampert',[170]);
  sim.updateEnemy=()=>{};e.element='Fire';p.level=100;p.slots[0]=id;
  const initial=e.hp;
  assert.equal(sim.command({type:'cast',slot:0,x:e.x,y:e.y,targetId:e.uid}),'queued',`${id} should queue while out of range`);
  for(let i=0;i<120&&e.hp===initial;i++)sim.step(.05);
  assert.ok(e.hp<initial,`${id} should hit after approaching`);
 }
});

test('Flamethrower is a sustained cone with repeat hits and no projectile',()=>{
 const {sim,enemies:[e]}=setup('charmander',[90]);
 assert.ok(sim.cast(ABILITIES.flamethrower,{x:e.x,y:e.y}));assert.equal(sim.projectiles.length,0);
 step(sim,.08);const first=e.hp;assert.ok(first<1000);
 step(sim,.55);assert.ok(e.hp<first);assert.ok(sim.activeAttacks.some(a=>a.id==='flamethrower'));
 step(sim,1);assert.equal(sim.activeAttacks.some(a=>a.id==='flamethrower'),false);
});

test('Solar Beam charges before piercing two aligned targets',()=>{
 const {sim,enemies}=setup('bulbasaur',[75,120]);
 assert.ok(sim.cast(ABILITIES.solarBeam,{x:sim.player.x+450,y:sim.player.y}));
 step(sim,.55);assert.equal(enemies[0].hp,1000);assert.equal(enemies[1].hp,1000);
 step(sim,.2);assert.ok(enemies[0].hp<1000);assert.ok(enemies[1].hp<1000);assert.equal(sim.projectiles.length,0);
});

test('Inferno erupts in a persistent area while Whirlpool pulls targets inward',()=>{
 const fire=setup('charmander',[80]),target=fire.enemies[0];
 assert.ok(fire.sim.cast(ABILITIES.inferno,{x:target.x,y:target.y}));assert.equal(target.hp,1000);
 step(fire.sim,.05);const first=target.hp;assert.ok(first<1000);step(fire.sim,.6);assert.ok(target.hp<first);assert.equal(fire.sim.zones[0].id,'inferno');
 const water=setup('mudkip',[85]),v=water.enemies[0],center={x:water.p.x+60,y:water.p.y};
 assert.ok(water.sim.cast(ABILITIES.whirlpool,center));const x=v.x;step(water.sim,.05);assert.ok(v.x<x);assert.ok(v.hp<1000);
});

test('Aqua Wave crosses and pushes more than one target',()=>{
 const {sim,p,enemies}=setup('squirtle',[75,130]);
 const original=enemies.map(e=>e.x);assert.ok(sim.cast(ABILITIES.aquaWave,{x:p.x+350,y:p.y}));
 step(sim,.3);assert.ok(enemies.every(e=>e.hp<1000));assert.ok(enemies.some((e,i)=>e.x>original[i]));
});

test('Vine Burst lashes twice along a short line',()=>{
 const {sim,p,enemies:[e]}=setup('bulbasaur',[90]);
 assert.ok(sim.cast(ABILITIES.vineBurst,{x:p.x+200,y:p.y}));assert.equal(sim.projectiles.length,0);
 step(sim,.05);const first=e.hp;assert.ok(first<1000);step(sim,.2);assert.ok(e.hp<first);
});

test('area and persistent attacks respect walls between the effect and target',()=>{
 const {sim,p,enemies:[e]}=setup('mudkip',[64]);
 const grid=Array.from({length:12},()=>Uint8Array.from({length:12},()=>0));
 grid[5][6]=3;
 sim.map={tile:32,grid,scene:'combat-test'};
 Object.assign(p,{x:160,y:176});Object.assign(e,{x:224,y:176,hp:1000,maxHp:1000});
 assert.equal(sim.cast(ABILITIES.rapidSpin,{x:p.x,y:p.y}),true);
 assert.equal(e.hp,1000,'an area attack must not pass through a wall');
 assert.equal(sim.cast(ABILITIES.whirlpool,{x:p.x,y:p.y}),true);
 sim.updateSpecialAttacks();
 assert.equal(e.hp,1000,'a persistent zone must not pass through a wall');
 p.cooldowns.whirlpool=0;
 assert.equal(sim.cast(ABILITIES.whirlpool,{x:e.x,y:e.y}),false,'zone center behind a wall is not targetable');
 assert.equal(sim.cast(ABILITIES.sandAttack,{x:e.x,y:e.y}),false,'area center behind a wall is not targetable');
});

test('splash damage does not cross walls',()=>{
 const {sim,p,enemies:[e]}=setup('squirtle',[64]);
 const grid=Array.from({length:12},()=>Uint8Array.from({length:12},()=>0));
 grid[5][6]=3;
 sim.map={tile:32,grid,scene:'combat-test'};
 Object.assign(p,{x:160,y:176});Object.assign(e,{x:224,y:176,hp:1000,maxHp:1000});
 sim.discovery.reveal=()=>{};sim.updateEnemy=()=>{};
 assert.equal(sim.cast(ABILITIES.water,{x:e.x,y:e.y}),true);
 step(sim,.4);
 assert.equal(e.hp,1000);
});

test('every configured move can be cast and produces its declared combat effect',()=>{
 for(const [id,a] of Object.entries(ABILITIES)){
  const offset=a.behavior==='rolling'?28:60;
  const {sim,p,enemies:[e]}=setup('charmander',[offset]);
  e.element='Fogo';
  sim.updateEnemy=()=>{};
  if(a.behavior==='heal')p.hp=p.maxHp-50;
  const startHp=e.hp,playerHp=p.hp,startX=p.x;
  assert.equal(sim.cast(a,{x:e.x,y:e.y}),true,`${id} should cast`);
  if(a.behavior==='buff')assert.ok(p.buffs.some(buff=>buff.id===id),`${id} should apply a buff`);
  if(a.behavior==='debuff')assert.ok(e.debuffs?.some(effect=>effect.id===id)||e.sleepUntil||e.yawnAt||e.poison||e.leech||e.slowUntil||e.staggerUntil,`${id} should apply a condition`);
  step(sim,2);
  if(a.behavior==='heal')assert.ok(p.hp>playerHp,`${id} should heal`);
  else if(['buff','debuff','cleanse'].includes(a.behavior)||a.statusOnly)continue;
  else if(a.behavior==='teleport')assert.notEqual(p.x,startX,`${id} should relocate the player`);
  else assert.ok(e.hp<startHp,`${id} should damage a target in range`);
 }
});

test('damaging moves cannot hit beyond their range and area radius',()=>{
 for(const [id,a] of Object.entries(ABILITIES)){
  if(!Number.isFinite(a.damage)||a.behavior==='rolling')continue;
  const {sim,p,enemies:[e]}=setup('charmander',[60]);
  const grid=Array.from({length:20},()=>Uint8Array.from({length:120},()=>0));
  sim.map={tile:32,grid,scene:'combat-test'};
  Object.assign(p,{x:160,y:176});
  const reach=(a.range||0)+(a.radius||0)+(a.splashRadius||0)+100;
  Object.assign(e,{x:p.x+reach,y:p.y,hp:1000,maxHp:1000});
  sim.discovery.reveal=()=>{};sim.updateEnemy=()=>{};
  sim.cast(a,{x:e.x,y:e.y});step(sim,3);
  assert.equal(e.hp,1000,`${id} must not hit outside its declared reach`);
 }
});

test('type immunity blocks damage, hit events, and rewards',()=>{
 const normal=setup('charmander',[60]);
 normal.enemies[0].element='Fantasma';
 assert.equal(normal.sim.cast(ABILITIES.basic,normal.enemies[0]),true);
 assert.equal(normal.enemies[0].hp,1000);
 assert.equal(normal.sim.events.some(event=>event.type==='damage'),false);
 const electric=setup('charmander',[60]);
 electric.enemies[0].element='Terra';
 electric.sim.updateEnemy=()=>{};
 assert.equal(electric.sim.cast(ABILITIES.thunderbolt,electric.enemies[0]),true);
 step(electric.sim,.5);
 assert.equal(electric.enemies[0].hp,1000);
 assert.equal(electric.sim.kills,0);
});

test('type advantage and defense produce whole-number combat damage',()=>{
 const {sim,p,enemies:[e]}=setup('charmander',[60]);
 e.element='Grama';e.defense=5;
 const expected=officialDamage({level:p.level,power:ABILITIES.flameCharge.power,attack:p.attack,defense:e.defense,stab:1.5,effectiveness:2,random:.925});
 assert.equal(sim.cast(ABILITIES.flameCharge,e),true);
 assert.equal(1000-e.hp,expected);
 assert.equal(Number.isInteger(e.hp),true);
});
