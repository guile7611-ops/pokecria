import {writeFile} from 'node:fs/promises';
import {CREATURES} from '../public/data.js';

// Snapshot of Scarlet/Violet level-up learnsets. Run again when adding species.
// https://pokeapi.co/docs/v2#pokemon
const version='scarlet-violet';
const species=Object.keys(CREATURES).sort();
const result={};
let cursor=0;
async function worker(){
  while(cursor<species.length){
    const id=species[cursor++];
    const response=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);
    const pokemon=await response.json();
    result[id]=pokemon.moves.flatMap(({move,version_group_details})=>version_group_details
      .filter(detail=>detail.version_group.name===version&&detail.move_learn_method.name==='level-up')
      .map(detail=>({level:detail.level_learned_at,move:move.name})))
      .sort((a,b)=>a.level-b.level||a.move.localeCompare(b.move));
  }
}
await Promise.all(Array.from({length:8},worker));
const ordered=Object.fromEntries(species.map(id=>[id,result[id]]));
await writeFile('public/level-learnsets-gen9.js',`// Generated from PokéAPI ${version} level-up data. Do not edit by hand.\nexport const LEVEL_LEARNSETS_GEN9 = ${JSON.stringify(ordered,null,2)};\n`);
const moveNames=[...new Set(Object.values(ordered).flat().map(row=>row.move))].sort();
const moveData={};cursor=0;
async function moveWorker(){
  while(cursor<moveNames.length){
    const name=moveNames[cursor++];
    const response=await fetch(`https://pokeapi.co/api/v2/move/${name}`);
    if(!response.ok)throw Error(`${name}: HTTP ${response.status}`);
    const move=await response.json(),meta=move.meta||{};
    moveData[name]={type:move.type.name,category:move.damage_class.name,power:move.power,accuracy:move.accuracy,priority:move.priority,
      target:move.target.name,ailment:meta.ailment?.name||'none',effectChance:move.effect_chance,
      drain:meta.drain||0,healing:meta.healing||0,flinchChance:meta.flinch_chance||0,
      statChance:meta.stat_chance||0,minHits:meta.min_hits,maxHits:meta.max_hits};
  }
}
await Promise.all(Array.from({length:8},moveWorker));
await writeFile('public/level-move-metadata-gen9.js',`// Generated from PokéAPI move data for the ${version} level-up catalogue.\nexport const LEVEL_MOVE_METADATA_GEN9 = ${JSON.stringify(Object.fromEntries(moveNames.map(name=>[name,moveData[name]])),null,2)};\n`);
console.log(`Imported ${species.length} species, ${moveNames.length} distinct level-up moves and their combat metadata.`);
