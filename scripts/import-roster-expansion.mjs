import {writeFile} from 'node:fs/promises';
import {CREATURES} from '../public/data.js';
import {NEW_SPECIES} from '../public/roster-expansion.js';
const ids=[...new Set([...Object.keys(CREATURES),...NEW_SPECIES])].sort();
const data={},chains=new Map();
async function get(url){const r=await fetch(url);if(!r.ok)throw Error(`${url}: ${r.status}`);return r.json();}
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<ids.length){const id=ids[cursor++];const p=await get(`https://pokeapi.co/api/v2/pokemon/${id}`),s=await get(p.species.url);data[id]=p;if(!chains.has(s.evolution_chain.url))chains.set(s.evolution_chain.url,get(s.evolution_chain.url));}}));
const rules=[];
for(const promise of chains.values()){const chain=await promise;const walk=node=>{for(const child of node.evolves_to){if(ids.includes(node.species.name)&&ids.includes(child.species.name)){const details=child.evolution_details;const simple=details.find(d=>d.trigger.name==='level-up'&&d.min_level&&!Object.entries(d).some(([k,v])=>!['trigger','min_level','version_group','is_default'].includes(k)&&v!==null&&v!==false&&v!==''));rules.push({creatureId:node.species.name,targetCreatureId:child.species.name,method:simple?'level':'special',requiredLevel:simple?.min_level??null,conditions:details});}walk(child);}};walk(chain.chain);}
await writeFile('public/evolution-rules.js',`// Imported from https://pokeapi.co/api/v2/evolution-chain/; conditional evolutions remain locked.\nexport const EVOLUTION_RULES=${JSON.stringify(rules,null,2)};\nexport const CONDITIONAL_EVOLUTIONS=new Set(EVOLUTION_RULES.filter(r=>r.method!=='level').map(r=>r.targetCreatureId));\nexport const canSpawnSpecies=id=>!CONDITIONAL_EVOLUTIONS.has(id);\n`);
const stats=Object.fromEntries(ids.map(id=>{const p=data[id],s=Object.fromEntries(p.stats.map(r=>[r.stat.name,r.base_stat]));return[id,{baseStats:{hp:s.hp,attack:s.attack,defense:s.defense,spAttack:s['special-attack'],spDefense:s['special-defense'],speed:s.speed},abilities:p.abilities.sort((a,b)=>a.slot-b.slot).map(r=>({id:r.ability.name,hidden:r.is_hidden}))}]}));
await writeFile('public/official-pokemon-data.js',`// Generated from PokéAPI. Canonical Pokémon base stats and abilities.\nexport const OFFICIAL_POKEMON_DATA = ${JSON.stringify(stats,null,2)};\n`);
await writeFile('public/new-species-data.js',`// Imported from PokéAPI; sprites use the matching National Dex number.\nexport const NEW_SPECIES_DATA=${JSON.stringify(NEW_SPECIES.map(id=>({id,dex:data[id].id,name:id[0].toUpperCase()+id.slice(1),element:data[id].types.map(t=>t.type.name[0].toUpperCase()+t.type.name.slice(1)).join(' / ')})),null,2)};\n`);
console.log(`Imported ${ids.length} species and ${rules.length} evolution rules; conditional: ${rules.filter(r=>r.method!=='level').map(r=>r.targetCreatureId).join(', ')}`);
