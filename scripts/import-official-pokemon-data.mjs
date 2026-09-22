import {writeFile} from 'node:fs/promises';
import {CREATURES} from '../public/data.js';

const species=Object.keys(CREATURES).sort(),result={};let cursor=0;
async function worker(){
 while(cursor<species.length){
  const id=species[cursor++],response=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);
  const pokemon=await response.json(),stats=Object.fromEntries(pokemon.stats.map(row=>[row.stat.name,row.base_stat]));
  result[id]={baseStats:{hp:stats.hp,attack:stats.attack,defense:stats.defense,spAttack:stats['special-attack'],spDefense:stats['special-defense'],speed:stats.speed},abilities:pokemon.abilities.sort((a,b)=>a.slot-b.slot).map(row=>({id:row.ability.name,hidden:row.is_hidden}))};
 }
}
await Promise.all(Array.from({length:8},worker));
await writeFile('public/official-pokemon-data.js',`// Generated from PokéAPI. Canonical Pokémon base stats and abilities.\nexport const OFFICIAL_POKEMON_DATA = ${JSON.stringify(Object.fromEntries(species.map(id=>[id,result[id]])),null,2)};\n`);
console.log(`Imported official stats and abilities for ${species.length} Pokémon.`);
