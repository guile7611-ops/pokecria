import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {CREATURES,EVOLUTIONS} from '../public/data.js';
import {Simulation} from '../public/simulation.js';
import {NEW_SPECIES,NEW_SPAWN_RULES} from '../public/roster-expansion.js';
import {CONDITIONAL_EVOLUTIONS,canSpawnSpecies} from '../public/evolution-rules.js';
import {SpawnZoneDefinitions} from '../public/world-definition.js';
import {CITY_SAFE_ZONES,inCity} from '../public/safe-zones.js';
import {LAYER_SYSTEMS} from '../public/world-habitats.js';
import {generateLayer,populateLayer} from '../public/layer-generator.js';
import {SPRITE_DEFINITIONS} from '../public/sprite-data.js';

test('requested families are playable and have complete Mystery Dungeon sprites',()=>{
 assert.equal(NEW_SPECIES.length,33);
 for(const id of NEW_SPECIES){
  assert.ok(CREATURES[id],`${id} is missing from the roster`);
  assert.ok(existsSync(new URL(`../public/assets/pokemon/${id}/portrait.png`,import.meta.url)),`${id}/portrait.png`);
  for(const animation of ['Idle','Walk','Attack','Shoot','Hurt'])assert.ok(SPRITE_DEFINITIONS[id]?.animations?.[animation],`${id}/${animation}`);
 }
});

test('every requested species has authored rarity, habitat and time data',()=>{
 for(const id of NEW_SPECIES){
  const rule=NEW_SPAWN_RULES[id];assert.ok(rule?.rarity,`${id} needs rarity`);
  if(canSpawnSpecies(id))assert.ok(rule.regions?.length||rule.layers?.length,`${id} needs a habitat`);
  if(canSpawnSpecies(id))assert.ok(['day','night','any'].includes(rule.time),`${id} needs a spawn time`);
 }
});

test('conditional evolutions never enter surface or layer encounter pools',()=>{
 const surface=new Set(SpawnZoneDefinitions.flatMap(zone=>zone.species.map(entry=>entry.id)));
 for(const id of CONDITIONAL_EVOLUTIONS)assert.equal(surface.has(id),false,`${id} entered a surface pool`);
 for(const system of LAYER_SYSTEMS){
  const map=populateLayer(generateLayer(system,8484));
  for(const spawn of map.spawns)assert.equal(CONDITIONAL_EVOLUTIONS.has(spawn.species),false,`${spawn.species} entered ${system.id}`);
 }
 for(const [from,to] of [['haunter','gengar'],['growlithe','arcanine'],['riolu','lucario'],['pichu','pikachu'],['nosepass','probopass']]){
  const rule=EVOLUTIONS.find(entry=>entry.creatureId===from&&entry.targetCreatureId===to);
  assert.equal(rule?.method,'special');
 }
});

test('level evolutions remain automatic while special evolutions stay locked',()=>{
 const seedot=new Simulation('seedot');seedot.gainXP(100000);assert.equal(seedot.player.id,'nuzleaf');
 const bagon=new Simulation('bagon');bagon.gainXP(1000000);assert.equal(bagon.player.id,'salamence');
 const growlithe=new Simulation('growlithe');growlithe.gainXP(1000000);assert.equal(growlithe.player.id,'growlithe');
});

test('all cities suppress wild spawns and heal protected players',()=>{
 const sim=new Simulation('bulbasaur',{spawnEpoch:9191,safeZones:true});
 assert.ok(CITY_SAFE_ZONES.length>=8);
 assert.ok(sim.map.spawns.every(spawn=>!inCity(spawn)));
 sim.player.hp=Math.max(1,sim.player.maxHp-20);const before=sim.player.hp;sim.step(.5);assert.ok(sim.player.hp>before);
 const enemy={...sim.enemies[0],x:sim.player.x+12,y:sim.player.y,home:{x:sim.player.x+12,y:sim.player.y},hp:100,maxHp:100,state:'Idle'};
 assert.equal(sim.damage(enemy,50),0);assert.equal(enemy.hp,100);
});

test('shop displays and refreshes the player coin balance',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../public/main.js',import.meta.url),'utf8');
 assert.match(html,/id="shop-money"/);assert.match(main,/renderShopWallet\(\)/);assert.match(main,/Saldo:.*moedas/);
});
