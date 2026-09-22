export const RARITIES={common:{name:'Comum',factor:1},uncommon:{name:'Incomum',factor:1.15},rare:{name:'Raro',factor:1.35},epic:{name:'Épico',factor:1.6},legendary:{name:'Lendário',factor:1.9},mythic:{name:'Mítico',factor:2.2},elite:{name:'Elite',factor:1.9},boss:{name:'Boss',factor:2.8}};
export function encounterStats(species,map,position,uid,{boss=false,horde=false}={}){
 const region=map.regions[map.biome[Math.floor(position.y/32)]?.[Math.floor(position.x/32)]]||map.regions[0];
 const distance=Math.hypot(position.x-240,position.y-560),band=1+Math.floor(distance/700);
 const roll=((Math.imul(uid+1,1103515245)^map.seed)>>>0)%100;
 const rarity=boss?'boss':horde?'elite':roll===0?'mythic':roll<3?'legendary':roll<8?'epic':roll<20?'rare':roll<42?'uncommon':'common';
 const low=Math.max(region.level[0],band,Number(position.level)||1),high=Math.max(low+2,region.level[1]);
 const level=boss?high+4:horde?high+1:low+(uid%Math.min(3,high-low+1));
 const f=RARITIES[rarity].factor,scale=1+(level-1)*.16;
 return {level,rarity,rarityName:RARITIES[rarity].name,spawnRarity:species.rarity||'common',spawnRarityName:RARITIES[species.rarity||'common'].name,regionId:region.id,
  hp:Math.round(species.hp*scale*f),maxHp:Math.round(species.hp*scale*f),attack:Math.round((species.attack+(level-1)*1.7)*f),defense:Math.round((species.defense+(level-1)*.65)*f),
  xp:Math.round(species.xp*(1+(level-1)*.3)*f),money:Math.round((3+level*3)*f),drop:species.drop||(boss?'Relíquia do Guardião':region.reward),dropCount:rarity==='common'?1:2};
}
export function cleanInventory(value){const items={};for(const [name,count]of Object.entries(value?.items||{}))if(name.length<100&&Number.isSafeInteger(count)&&count>0)items[name]=Math.min(count,999999);return {money:Number.isSafeInteger(value?.money)&&value.money>=0?Math.min(value.money,999999999):0,items};}
