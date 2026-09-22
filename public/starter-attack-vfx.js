// The nine starter lines share combat rules but have distinct attack art.
// Each registered move has separate cast, travel and impact sprite sheets.
export const STARTER_ATTACKS={
 bulbasaur:['leaf','razorLeaf','solarSeed','vineBurst','solarBeam'],
 chikorita:['leaf','razorLeaf','solarSeed','vineBurst','solarBeam'],
 treecko:['leaf','razorLeaf','solarSeed','vineBurst','solarBeam'],
 charmander:['ember','flame','fireBlast','flamethrower','inferno'],
 cyndaquil:['ember','flame','fireBlast','flamethrower','inferno'],
 torchic:['ember','flame','fireBlast','flamethrower','inferno'],
 squirtle:['water','waterPulse','hydroPump','aquaWave','hydroCannon'],
 totodile:['water','waterPulse','hydroPump','aquaWave','hydroCannon'],
 mudkip:['water','waterPulse','hydroPump','whirlpool','hydroCannon'],
};

const LARGE=new Set(['solarBeam','inferno','hydroCannon']);
const MEDIUM=new Set(['vineBurst','flamethrower','aquaWave','whirlpool','fireBlast','hydroPump','solarSeed']);
// Curated, manually identified frames from Mystery Dungeon: Explorers of Sky.
// The IDs refer to move_VFX/<id>/000/ in the credited source archive.
import {PMD_TRAVEL,PMD_IMPACT} from './pmd-attack-vfx.js';
export function starterAttackVisual(species,moveId){
 if(!STARTER_ATTACKS[species]?.includes(moveId))return null;
 const root=`starters/${species}/${moveId}`;
 return {cast:`${root}-cast`,travel:PMD_TRAVEL[moveId]?`pmd/${PMD_TRAVEL[moveId]}`:`${root}-travel`,impact:PMD_IMPACT[moveId]?`pmd/${PMD_IMPACT[moveId]}`:`${root}-impact`,
  travelSize:LARGE.has(moveId)?72:MEDIUM.has(moveId)?54:40,
  castSize:LARGE.has(moveId)?108:MEDIUM.has(moveId)?88:70,
  impactSize:LARGE.has(moveId)?166:MEDIUM.has(moveId)?120:88,
  trail:LARGE.has(moveId)?4:MEDIUM.has(moveId)?3:2};
}
