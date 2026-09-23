import {access} from 'node:fs/promises';
import {ABILITIES,CREATURES,LEARNSETS,LEARNSET_PHASES,LEARNSET_SOURCES,SPECIES_LEVEL_LEARNSETS,STARTERS} from '../public/data.js';

const roster=Object.keys(CREATURES).sort(),phased=LEARNSET_PHASES.flat();
if(LEARNSET_PHASES.length!==3||new Set(phased).size!==roster.length||phased.slice().sort().join('|')!==roster.join('|'))throw Error('Os três lotes de learnsets não cobrem o elenco exatamente uma vez.');
for(const id of roster){
 const source=LEARNSET_SOURCES[id],official=SPECIES_LEVEL_LEARNSETS[id]||[],playable=LEARNSETS[id]||[];
 if(!source)throw Error(`${id}: fonte oficial de aprendizado ausente`);
 if(!official.length)throw Error(`${id}: tabela de golpes por nível ausente`);
 for(const row of official){
  if(!Number.isInteger(row.level)||row.level<0)throw Error(`${id}: nível inválido para ${row.move}`);
  if(!row.ability||!ABILITIES[row.ability])throw Error(`${id}: ${row.move} não possui implementação`);
 }
 if(!playable.length)throw Error(`${id}: nenhum golpe jogável registrado`);
 if(!STARTERS[id]&&playable.some(row=>['neutralPulse','impact','starBurst'].includes(row.ability)))throw Error(`${id}: molde genérico reapareceu no learnset`);
}
for(const move of Object.values(ABILITIES))if(move.id!=='basic')await access(new URL(`../public/assets/sprites/vfx/${move.vfx}.png`,import.meta.url));
console.log(`Learnsets validados: ${roster.length} espécies em ${LEARNSET_PHASES.map(batch=>batch.length).join('+')} · ${new Set(Object.values(SPECIES_LEVEL_LEARNSETS).flat().map(row=>row.move)).size} golpes.`);
