import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,PLAYER_MOVEMENT_MULTIPLIER} from '../public/simulation.js';
import {STARTERS,WILD_POKEMON,CREATURES} from '../public/data.js';
import {effectiveness,combatEffectiveness} from '../public/type-system.js';
import {REGION} from '../public/data.js';

test('an active Pokémon keeps a modest movement advantage after being captured and reloaded',()=>{
 const sim=new Simulation(),wildSpeed=sim.player.speed;
 const specimen={...sim.activeSnapshot(),captureId:'capture-speed',speed:wildSpeed};
 sim.pc.push(specimen);
 assert.equal(sim.selectCaptured(specimen.captureId),true);
 const start={x:sim.player.x,y:sim.player.y};
 sim.inputVector={x:1,y:0};
 assert.equal(sim.moveWithInput(.1),true);
 assert.ok(Math.abs(sim.player.x-start.x-wildSpeed*.1*PLAYER_MOVEMENT_MULTIPLIER)<.01);
 const reloaded=new Simulation('bulbasaur',{activePokemon:sim.activeSnapshot(),pc:sim.pc});
 const from={x:reloaded.player.x,y:reloaded.player.y};
 reloaded.player.path=[{x:from.x+50,y:from.y}];
 reloaded.streamCreatures=()=>{};
 reloaded.step(.05);
 assert.ok(Math.abs(reloaded.player.x-from.x-wildSpeed*.05*PLAYER_MOVEMENT_MULTIPLIER)<.01);
 assert.equal(reloaded.player.speed,wildSpeed);
});

test('all nine starters appear as wild encounters in suitable authored biomes',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:234});
 for(const id of Object.keys(STARTERS)){
  const spawn=sim.map.spawns.find(s=>s.species===id);
  assert.ok(spawn,`${id} absent from map`);
  assert.ok(['bosque','lago','deserto','vulcao'].includes(spawn.zoneId));
  assert.ok(WILD_POKEMON.some(p=>p.id===id));
 }
});
test('fresh players enter the same world and receive wild state even before it streams in',()=>{
 const first=new Simulation(),second=new Simulation();
 assert.equal(first.spawnEpoch,0);assert.equal(second.spawnEpoch,0);
 assert.deepEqual(first.map.spawns.map(s=>[s.uid,s.species,s.x,s.y]),second.map.spawns.map(s=>[s.uid,s.species,s.x,s.y]));
 const spawn=first.map.spawns.find(s=>s.uid>=2000),respawnAt=Date.now()+12000;
 second.applySharedWildState({uid:spawn.uid,hp:0,respawnAt});
 second.player.x=spawn.x;second.player.y=spawn.y;second.streamCreatures();
 const enemy=second.enemies.find(e=>e.uid===spawn.uid);
 assert.ok(enemy);assert.equal(enemy.state,'Dead');assert.equal(enemy.hp,0);
});
test('starter progression is slower and existing levels rebalance without losing XP',()=>{
 assert.ok(STARTERS.bulbasaur.speed<80);
 assert.ok(STARTERS.bulbasaur.hpPerLevel<12);
 assert.ok(STARTERS.bulbasaur.attackPerLevel<3);
 const snapshot={captureId:'starter-mudkip',id:'marshtomp',name:'Marshtomp',level:28,xp:1891,hp:446,maxHp:464,attack:154,defense:6,speed:105,attributes:{vitality:0,power:0,guard:0,agility:0},evolutionHistory:[],slots:[null,null,null,null],knownMoves:[]};
 const sim=new Simulation('mudkip',{activePokemon:snapshot,pc:[snapshot]});
 assert.equal(sim.player.level,28);assert.equal(sim.player.xp,1891);
 assert.equal(sim.player.speed,CREATURES.marshtomp.speed);
 assert.ok(sim.player.attack<snapshot.attack);
 assert.ok(sim.player.maxHp<snapshot.maxHp);
});
test('official type matchup stays intact while combat compresses the extremes',()=>{
 assert.equal(effectiveness('Fire','Grass'),2);
 assert.equal(combatEffectiveness(2),1.5);
 assert.equal(combatEffectiveness(4),2);
 assert.equal(combatEffectiveness(.25),.5);
 assert.equal(combatEffectiveness(0),0);
});
test('ranged wild Pokémon fire dodgeable projectiles and bosses attack from farther away',()=>{
 const sim=new Simulation(),p=sim.player;
 const species=WILD_POKEMON.find(s=>s.id==='mareep');
 const e={...species,uid:5555,x:REGION.spawn.x+130,y:REGION.spawn.y,home:{x:REGION.spawn.x+130,y:REGION.spawn.y},state:'Chase',timer:0,cooldown:0,skills:[],path:[],hp:100,maxHp:100,level:20};
 sim.enemies=[e];p.hp=p.maxHp=1000;
 sim.updateEnemy(e,.016);
 assert.equal(sim.enemyProjectiles.length,1);
 assert.equal(p.hp,1000);
 for(let i=0;i<40;i++)sim.updateEnemyProjectiles(1/60);
 assert.ok(p.hp<1000);
 const beforeDodge=p.hp;e.cooldown=0;sim.updateEnemy(e,.016);p.y+=85;
 for(let i=0;i<40;i++)sim.updateEnemyProjectiles(1/60);
 assert.equal(p.hp,beforeDodge);
 assert.ok(sim.boss.range>200);
 assert.equal(sim.boss.attacks.length,4);
 const volcano=new Simulation().enemies.find(enemy=>enemy.id==='charizard');
 assert.equal(volcano.attacks.length,4);
 assert.notDeepEqual(volcano.attacks.map(attack=>attack.id),sim.boss.attacks.map(attack=>attack.id));
});
