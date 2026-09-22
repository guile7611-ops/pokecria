import {CANONICAL_LEARNSETS,ABILITIES} from '../public/data.js';

const rows=Object.values(CANONICAL_LEARNSETS).flat();
const moves=new Map();
for(const row of rows){
  const item=moves.get(row.move)||{species:0,ability:row.ability};
  item.species++;
  moves.set(row.move,item);
}
const ready=[...moves].filter(([,entry])=>entry.ability&&ABILITIES[entry.ability]);
const missing=[...moves].filter(([,entry])=>!entry.ability||!ABILITIES[entry.ability]).sort((a,b)=>b[1].species-a[1].species||a[0].localeCompare(b[0]));
const coveredSpecies=Object.values(CANONICAL_LEARNSETS).filter(set=>set.some(row=>row.ability&&ABILITIES[row.ability])).length;
console.log(`${Object.keys(CANONICAL_LEARNSETS).length} espécies · ${moves.size} golpes por nível · ${ready.length} funcionais · ${coveredSpecies} espécies com ao menos um golpe canônico funcional`);
console.log('Próximos golpes por abrangência:');
for(const [name,entry] of missing.slice(0,30))console.log(`${name.padEnd(22)} ${entry.species} espécies`);
