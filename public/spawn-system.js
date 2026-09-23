import {spawnAvailable,speciesSpawnTime} from './day-night.js';
import {canSpawnSpecies} from './evolution-rules.js';
import {inCity} from './safe-zones.js';
import {EvolutionMinimumLevel,SpawnRarityDefinitions,SpawnZoneDefinitions,speciesRarity} from './world-definition.js';
import {habitatAllows} from './world-habitats.js';
import {levelRangeAt,pathDistance} from './world-navigation.js';
import {walkable} from './world.js';

export const DEFAULT_SPAWN_CONFIG=Object.freeze({
  radius:1500,
  despawnRadius:1900,
  targetPopulation:30,
  minPlayerDistance:360,
  entitySpacing:92,
  refillInterval:.5,
  refillBatch:2,
  positionAttempts:90,
  recentLocationRadius:150,
  recentLocationCooldown:18,
  rarityWeights:Object.freeze(Object.fromEntries(Object.entries(SpawnRarityDefinitions).map(([id,value])=>[id,value.weight]))),
});

const hash=value=>{let h=2166136261;for(const char of String(value))h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;};
export const spawnRandom=(seed,salt=0)=>{let x=(Number(seed)^Math.imul(salt+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return((x^(x>>>16))>>>0)/4294967296;};
export const sceneSpawnSeed=(map,spawnEpoch,serial)=>hash(`${map.scene||'world'}:${map.seed}:${spawnEpoch}:${serial}`);
export const dynamicSpawnUid=({map,spawnEpoch,serial,x,y,species})=>2000000+(hash(`${map.scene||'world'}:${map.seed}:${spawnEpoch}:${serial}:${Math.floor(x/16)}:${Math.floor(y/16)}:${species}`)%1900000000);

const regionAt=(map,point)=>map.regions[map.biome[Math.floor(point.y/map.tile)]?.[Math.floor(point.x/map.tile)]]||map.regions[0];
const rawEntries=(map,region)=>{
  if(map.layer)return (region.species||[]).map(id=>({id,rarity:speciesRarity(id),minLevel:EvolutionMinimumLevel[id]||1}));
  return SpawnZoneDefinitions.find(zone=>zone.region===region.id)?.species||[];
};
export function eligibleSpawnCandidates(map,point,now=Date.now(),config=DEFAULT_SPAWN_CONFIG){
  const region=regionAt(map,point),range=levelRangeAt(map,point);
  if(!region||!range||(!map.scene&&inCity(point)))return[];
  return rawEntries(map,region).filter(entry=>canSpawnSpecies(entry.id)&&habitatAllows(region.biome,entry.id)&&(entry.minLevel||1)<=range[1]&&spawnAvailable({time:speciesSpawnTime(entry.id)},now)).map(entry=>{
    const rarity=entry.rarity||speciesRarity(entry.id),base=Number(entry.weight)||SpawnRarityDefinitions[rarity]?.weight||1,defaultBase=SpawnRarityDefinitions[rarity]?.weight||1;
    return {...entry,rarity,weight:base*(Number(config.rarityWeights?.[rarity])||defaultBase)/defaultBase,time:speciesSpawnTime(entry.id),region};
  });
}
export function weightedSpawnChoice(entries,roll){
  const total=entries.reduce((sum,entry)=>sum+Math.max(0,Number(entry.weight)||0),0);
  if(!entries.length||total<=0)return null;
  let cursor=Math.max(0,Math.min(.999999999,roll))*total;
  for(const entry of entries){cursor-=Math.max(0,Number(entry.weight)||0);if(cursor<0)return entry;}
  return entries.at(-1);
}
export function findDynamicSpawn({map,player,enemies=[],recent=[],spawnEpoch=0,serial=0,now=Date.now(),config=DEFAULT_SPAWN_CONFIG}){
  const seed=sceneSpawnSeed(map,spawnEpoch,serial),radius=Math.max(config.minPlayerDistance+32,config.radius);
  for(let attempt=0;attempt<config.positionAttempts;attempt++){
    const angle=spawnRandom(seed,attempt*5)*Math.PI*2,unit=Math.sqrt(spawnRandom(seed,attempt*5+1)),distance=config.minPlayerDistance+(radius-config.minPlayerDistance)*unit;
    const x=Math.round((player.x+Math.cos(angle)*distance)/8)*8,y=Math.round((player.y+Math.sin(angle)*distance)/8)*8,point={x,y};
    if(!walkable(map,x,y,12)||!Number.isFinite(pathDistance(map,point))||(!map.scene&&inCity(point)))continue;
    if(enemies.some(enemy=>enemy.state!=='Dead'&&Math.hypot(enemy.x-x,enemy.y-y)<config.entitySpacing+(enemy.radius||12)))continue;
    if(recent.some(entry=>entry.until>now&&Math.hypot(entry.x-x,entry.y-y)<config.recentLocationRadius))continue;
    const entries=eligibleSpawnCandidates(map,point,now,config),choice=weightedSpawnChoice(entries,spawnRandom(seed,attempt*5+2));
    if(!choice)continue;
    const range=levelRangeAt(map,point),level=Math.max(choice.minLevel||1,range[0]+Math.floor(spawnRandom(seed,attempt*5+3)*(range[1]-range[0]+1)));
    return {uid:dynamicSpawnUid({map,spawnEpoch,serial,x,y,species:choice.id}),x,y,zoneId:choice.region.id,species:choice.id,level,minLevel:choice.minLevel||1,reward:choice.region.reward,time:choice.time,spawnRarity:choice.rarity,dynamicSpawn:true};
  }
  return null;
}
