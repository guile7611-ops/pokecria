import {NEW_SPAWN_RULES} from './roster-expansion.js';
import {canSpawnSpecies} from './evolution-rules.js';
import {CREATURES} from './data.js';
import {normalizeTypes} from './type-system.js';
const HABITAT_TYPES=Object.fromEntries(Object.entries(CREATURES).map(([id,species])=>[id,normalizeTypes(species.element)]));
// A matching type is necessary but not sufficient: species must also be in the region's explicit roster.
// Exceptions describe habitat rather than type (e.g. psychic Pokémon in sacred groves).
export const HABITATS={
 village:{types:['Normal','Flying']},field:{types:['Normal','Flying','Electric','Fighting','Dark'],allow:['ralts']},
 forest:{types:['Grass','Bug','Flying'],allow:['bonsly','pichu']},dense:{types:['Grass','Bug'],allow:['abra','ralts','kirlia','slakoth','vigoroth','slaking']},
 meadow:{types:['Grass','Electric','Normal','Fighting','Psychic','Fairy']},grove:{types:['Grass','Bug','Psychic','Fairy'],allow:['slakoth','vigoroth','slaking']},
 swamp:{types:['Poison','Water','Grass','Ghost','Bug']},mangrove:{types:['Poison','Water','Grass','Ghost','Bug']},
 lake:{types:['Water']},beach:{types:['Water']},volcano:{types:['Fire','Rock','Ground']},ash:{types:['Fire','Rock','Ground']},
 desert:{types:['Ground','Fire','Flying','Dark','Psychic']},rock:{types:['Rock','Ground','Steel','Fighting'],allow:['zubat','golbat','crobat','absol','bagon','shelgon']},
 ruins:{types:['Ghost','Psychic','Electric','Rock']},conifer:{types:['Flying','Electric','Rock','Ground','Dark','Ice']},
 tundra:{types:['Ice','Flying'],allow:['hoothoot','noctowl','murkrow','honchkrow','swinub','piloswine']},steppe:{types:['Electric','Normal','Flying']},
 cave:{types:['Rock','Ground','Ghost','Steel','Fighting'],allow:['zubat','golbat','crobat','absol','bagon','shelgon']},
 highland:{types:['Rock','Ground','Flying','Steel','Ice','Dark','Dragon']},
};
export function habitatAllows(biome,id){const rule=HABITATS[biome];return canSpawnSpecies(id)&&!!rule&&!rule.deny?.includes(id)&&(rule.allow?.includes(id)||HABITAT_TYPES[id]?.some(type=>rule.types.includes(type)));}
// Shared canonical scene ids: different entrances to a system never create individual worlds.
export const LAYER_SYSTEMS=[
 {id:'crystal-depths',name:'Galerias de Cristal',kind:'cave',cols:144,rows:112,portals:['segredo-agua','gruta','mina'],species:['zubat','golbat','geodude','graveler','aron','lairon','machop','larvitar'],baseUid:100000},
 {id:'root-depths',name:'Raízes Submersas',kind:'cave',cols:160,rows:120,portals:['cripta','gruta-brumas','gruta-petalas'],species:['zubat','golbat','gastly','haunter','geodude','graveler'],baseUid:110000},
 {id:'ember-depths',name:'Túneis de Obsidiana',kind:'cave',cols:144,rows:128,portals:['gruta-cinzas','gruta-neve'],species:['geodude','graveler','golem','aron','lairon','aggron','larvitar','pupitar'],baseUid:120000},
 {id:'aurora-peaks',name:'Altos de Aurora',kind:'mountain',cols:160,rows:128,portals:['subida-granito','subida-boreal','subida-leste','subida-cinzas'],species:['geodude','graveler','golem','spearow','fearow','murkrow','honchkrow','aron','lairon','larvitar','pupitar'],baseUid:130000},
];
for(const [id,rule] of Object.entries(NEW_SPAWN_RULES))for(const system of LAYER_SYSTEMS)if(rule.layers?.includes(system.id))system.species.push(id);
export const layerForPortal=id=>LAYER_SYSTEMS.find(s=>s.id===id||s.portals.includes(id));
