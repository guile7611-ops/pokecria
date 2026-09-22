import {OFFICIAL_POKEMON_DATA} from './official-pokemon-data.js';

export const STAT_KEYS=['hp','attack','defense','spAttack','spDefense','speed'];
export const NATURES={
 hardy:{name:'Hardy',up:null,down:null},lonely:{name:'Lonely',up:'attack',down:'defense'},brave:{name:'Brave',up:'attack',down:'speed'},adamant:{name:'Adamant',up:'attack',down:'spAttack'},naughty:{name:'Naughty',up:'attack',down:'spDefense'},
 bold:{name:'Bold',up:'defense',down:'attack'},docile:{name:'Docile',up:null,down:null},relaxed:{name:'Relaxed',up:'defense',down:'speed'},impish:{name:'Impish',up:'defense',down:'spAttack'},lax:{name:'Lax',up:'defense',down:'spDefense'},
 timid:{name:'Timid',up:'speed',down:'attack'},hasty:{name:'Hasty',up:'speed',down:'defense'},serious:{name:'Serious',up:null,down:null},jolly:{name:'Jolly',up:'speed',down:'spAttack'},naive:{name:'Naive',up:'speed',down:'spDefense'},
 modest:{name:'Modest',up:'spAttack',down:'attack'},mild:{name:'Mild',up:'spAttack',down:'defense'},quiet:{name:'Quiet',up:'spAttack',down:'speed'},bashful:{name:'Bashful',up:null,down:null},rash:{name:'Rash',up:'spAttack',down:'spDefense'},
 calm:{name:'Calm',up:'spDefense',down:'attack'},gentle:{name:'Gentle',up:'spDefense',down:'defense'},sassy:{name:'Sassy',up:'spDefense',down:'speed'},careful:{name:'Careful',up:'spDefense',down:'spAttack'},quirky:{name:'Quirky',up:null,down:null},
};
const natureIds=Object.keys(NATURES),legacyNature={Calma:'calm',Brava:'brave',Serena:'serious','Audaz':'bold','Tímida':'timid'};
const hash=value=>{let h=2166136261;for(const char of String(value))h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;};
export const officialData=id=>OFFICIAL_POKEMON_DATA[id];
export function officialNature(value,seed='pokemon'){const id=NATURES[value]?value:legacyNature[value];return id||natureIds[hash(seed)%natureIds.length];}
export function officialAbility(id,value,seed='pokemon'){
 const choices=OFFICIAL_POKEMON_DATA[id]?.abilities||[];
 if(choices.some(row=>row.id===value))return value;
 const regular=choices.filter(row=>!row.hidden),pool=regular.length?regular:choices;
 return pool[hash(seed)%Math.max(1,pool.length)]?.id||value||'none';
}
export function ensureOfficialTraining(pokemon,seed=pokemon.captureId||pokemon.id){
 pokemon.nature=officialNature(pokemon.nature,seed);
 pokemon.ability=officialAbility(pokemon.id,pokemon.ability,seed);
 pokemon.ivs??=Object.fromEntries(STAT_KEYS.map((key,index)=>[key,hash(`${seed}:iv:${index}`)%32]));
 pokemon.evs??={hp:Math.min(252,(pokemon.attributes?.vitality||0)*4),attack:Math.min(252,(pokemon.attributes?.power||0)*4),defense:Math.min(252,(pokemon.attributes?.guard||0)*4),spAttack:0,spDefense:0,speed:Math.min(252,(pokemon.attributes?.agility||0)*4)};
 for(const key of STAT_KEYS){pokemon.ivs[key]=Math.max(0,Math.min(31,Math.floor(Number(pokemon.ivs[key])||0)));pokemon.evs[key]=Math.max(0,Math.min(252,Math.floor(Number(pokemon.evs[key])||0)));}
 const total=STAT_KEYS.reduce((sum,key)=>sum+pokemon.evs[key],0);if(total>510){let excess=total-510;for(const key of [...STAT_KEYS].reverse()){const take=Math.min(excess,pokemon.evs[key]);pokemon.evs[key]-=take;excess-=take;}}
 return pokemon;
}
export function calculatedStats(id,level,ivs={},evs={},nature='hardy'){
 const base=OFFICIAL_POKEMON_DATA[id]?.baseStats;if(!base)return null;const lv=Math.max(1,Math.floor(level||1)),n=NATURES[officialNature(nature)];
 const value=key=>{const raw=Math.floor(((2*base[key]+(ivs[key]||0)+Math.floor((evs[key]||0)/4))*lv)/100)+5;return Math.floor(raw*(n.up===key?1.1:n.down===key?0.9:1));};
 return {hp:Math.floor(((2*base.hp+(ivs.hp||0)+Math.floor((evs.hp||0)/4))*lv)/100)+lv+10,attack:value('attack'),defense:value('defense'),spAttack:value('spAttack'),spDefense:value('spDefense'),speed:value('speed')};
}
// Battle Speed influences traversal through a compressed curve. This keeps the
// stat meaningful without letting high-level Pokémon cross the map instantly.
export function mapMovementSpeed(speed){return Math.max(66,Math.min(142,Math.round(52+Math.sqrt(Math.max(1,speed))*6.2)));}
export function officialDamage({level,power,attack,defense,stab=1,effectiveness=1,random=1}){if(effectiveness===0)return 0;return Math.max(1,Math.floor((Math.floor(Math.floor((2*level/5+2)*power*attack/Math.max(1,defense))/50)+2)*stab*effectiveness*random));}
