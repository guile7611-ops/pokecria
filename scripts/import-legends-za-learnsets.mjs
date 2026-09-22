import {writeFile} from 'node:fs/promises';
import {CREATURES} from '../public/data.js';

const species=Object.keys(CREATURES).sort(),learnsets={},metadata={};let cursor=0;
const clean=text=>String(text).replace(/<[^>]+>/g,'').replaceAll('&mdash;','—').replaceAll('&#8734;','∞').replaceAll('&infin;','∞').replaceAll('&amp;','&').trim();
async function worker(){
 while(cursor<species.length){
  const id=species[cursor++],response=await fetch(`https://pokemondb.net/pokedex/${id}`,{headers:{'User-Agent':'Mozilla/5.0 pokecria-data-import/1.0'}});
  if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);const html=await response.text();
  const marker=`learns the following moves in Pokémon Legends: Z-A at the levels specified.`;let start=html.indexOf(marker);
  if(start<0){learnsets[id]=[];continue;}start=html.indexOf('<tbody>',start);const end=html.indexOf('</tbody>',start),body=html.slice(start,end);
  const rows=[];for(const match of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)){const cells=[...match[1].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)].map(cell=>({attrs:cell[1],html:cell[2]}));if(cells.length<6)continue;
   const moveMatch=cells[1].html.match(/href="\/move\/([^"]+)"[^>]*>([^<]+)</),typeMatch=cells[2].html.match(/type-([a-z-]+)/),category=cells[3].attrs.match(/data-sort-value="([^"]+)"/i)?.[1];if(!moveMatch||!typeMatch||!category)continue;
   const move=moveMatch[1],power=Number(clean(cells[4].html)),accuracy=Number(clean(cells[5].html));rows.push({level:Number(clean(cells[0].html)),move});metadata[move]={...(metadata[move]||{}),name:clean(moveMatch[2]),type:typeMatch[1],category,power:Number.isFinite(power)?power:null,accuracy:Number.isFinite(accuracy)?accuracy:null,source:'pokemon-legends-za'};
  }
  if(!rows.length)throw Error(`${id}: empty Pokémon Legends: Z-A level-up table`);learnsets[id]=rows;
 }
}
await Promise.all(Array.from({length:6},worker));
await writeFile('public/legends-za-data.js',`// Generated exclusively from Pokémon Legends: Z-A level-up tables on PokémonDB.\nexport const LEGENDS_ZA_LEARNSETS = ${JSON.stringify(Object.fromEntries(species.map(id=>[id,learnsets[id]])),null,2)};\nexport const LEGENDS_ZA_MOVE_METADATA = ${JSON.stringify(Object.fromEntries(Object.entries(metadata).sort(([a],[b])=>a.localeCompare(b))),null,2)};\nexport const LEGENDS_ZA_AVAILABLE = ${JSON.stringify(species.filter(id=>learnsets[id].length),null,2)};\n`);
console.log(`Imported ${species.filter(id=>learnsets[id].length).length}/${species.length} Pokémon and ${Object.keys(metadata).length} distinct Legends: Z-A level-up moves.`);
