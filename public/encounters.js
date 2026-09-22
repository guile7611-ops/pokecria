import {calculatedStats,mapMovementSpeed} from './official-mechanics.js';

export const RARITIES={common:{name:'Comum',factor:1},uncommon:{name:'Incomum',factor:1.15},rare:{name:'Raro',factor:1.35},epic:{name:'Épico',factor:1.6},legendary:{name:'Lendário',factor:1.9},mythic:{name:'Mítico',factor:2.2},elite:{name:'Elite',factor:1.9},boss:{name:'Boss',factor:2.8}};
const roll01=(uid,seed,salt=0)=>((Math.imul((uid+salt+1)>>>0,2654435761)^Math.imul((seed+salt)>>>0,2246822519))>>>0)/4294967296;
export function encounterStats(species,map,position,uid,{boss=false,horde=false,respawn=0}={}){
 const region=map.regions[map.biome[Math.floor(position.y/32)]?.[Math.floor(position.x/32)]]||map.regions[0];
 const distance=Math.hypot(position.x-240,position.y-560),band=1+Math.floor(distance/700);
 const roll=((Math.imul(uid+1,1103515245)^map.seed)>>>0)%100;
 const rarity=boss?'boss':horde?'elite':roll===0?'mythic':roll<3?'legendary':roll<8?'epic':roll<20?'rare':roll<42?'uncommon':'common';
 const evolved=Number(position.minLevel)>1;
 const low=Math.max(region.level[0],band,Number(position.minLevel)||1,region.id==='vulcao'&&evolved?40:1);
 const high=Math.max(low+2,region.level[1],region.id==='vulcao'?(evolved?80:70):low+Math.max(4,Math.round(low*.32)));
 const random=roll01(uid+respawn*7919,map.seed,Math.floor(position.x/32)+Math.floor(position.y/32)*131);
 const level=boss?high+Math.max(5,Math.round(high*.1)):low+Math.floor(random*(high-low+1));
 const f=RARITIES[rarity].factor,ivs=Object.fromEntries(['hp','attack','defense','spAttack','spDefense','speed'].map((key,index)=>[key,Math.floor(roll01(uid+respawn*3571,map.seed,index)*32)]));
 const official=calculatedStats(species.id,level,ivs,{},'hardy');
 // Rarity controls availability and rewards. Species, level, IVs and nature
 // control battle stats; bosses retain an explicit encounter multiplier.
 const battleScale=boss?1.85:horde?1.12:1;
 const fallbackScale=1+(level-1)*.13+(level-1)**2*.001;
 const combat=official||{hp:species.hp*fallbackScale,attack:species.attack+(level-1)*1.55,defense:species.defense+(level-1)*.62,spAttack:species.attack+(level-1)*1.55,spDefense:species.defense+(level-1)*.62,speed:species.speed||70};
 return {level,rarity,rarityName:RARITIES[rarity].name,spawnRarity:species.rarity||'common',spawnRarityName:RARITIES[species.rarity||'common'].name,regionId:region.id,
  ivs,hp:Math.round(combat.hp*battleScale),maxHp:Math.round(combat.hp*battleScale),attack:Math.round(combat.attack*battleScale),defense:Math.round(combat.defense*battleScale),spAttack:Math.round(combat.spAttack*battleScale),spDefense:Math.round(combat.spDefense*battleScale),speed:combat.speed,movementSpeed:mapMovementSpeed(combat.speed),
  xp:Math.round(species.xp*(1+(level-1)*.36+(level-1)**2*.006)*f),money:Math.round((3+level*2.5+level**2*.025)*f),drop:species.drop||(boss?'Relíquia do Guardião':region.reward),dropCount:boss?2:1,
  dropChance:boss?1:horde?.1:({common:.18,uncommon:.22,rare:.27,epic:.34,legendary:.42,mythic:.5}[rarity]||.18)};
}
export function cleanInventory(value){const items={};for(const [name,count]of Object.entries(value?.items||{}))if(name.length<100&&Number.isSafeInteger(count)&&count>0)items[name]=Math.min(count,999999);return {money:Number.isSafeInteger(value?.money)&&value.money>=0?Math.min(value.money,999999999):0,items};}
