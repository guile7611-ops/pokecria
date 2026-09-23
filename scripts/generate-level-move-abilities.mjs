import {writeFile} from 'node:fs/promises';
import {CREATURES,ABILITIES} from '../public/data.js';
import {LEVEL_LEARNSETS} from '../public/level-learnsets.js';
import {LEVEL_MOVE_METADATA} from '../public/level-move-metadata.js';
import {LEGENDS_ZA_LEARNSETS,LEGENDS_ZA_MOVE_METADATA} from '../public/legends-za-data.js';
import {GENERATED_LEVEL_MOVE_ABILITIES as PREVIOUS_GENERATED} from '../public/generated-level-move-abilities.js';

const camel=slug=>slug.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
const title=slug=>slug.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
const typeName=type=>({normal:'Normal',fire:'Fire',water:'Water',electric:'Electric',grass:'Grass',ice:'Ice',fighting:'Fighting',poison:'Poison',ground:'Ground',flying:'Flying',psychic:'Psychic',bug:'Bug',rock:'Rock',ghost:'Ghost',dragon:'Dragon',dark:'Dark',steel:'Steel',fairy:'Fairy'}[type]||'Normal');
const aliases={'water-gun':'water','razor-leaf':'razorLeaf','solar-beam':'solarBeam','water-pulse':'waterPulse','hydro-pump':'hydroPump','mud-slap':'mudSlap','ice-fang':'iceFang','mega-drain':'megaDrain','poison-powder':'poisonPowder','rapid-spin':'rapidSpin','double-kick':'doubleKick','mud-shot':'mudShot','blaze-kick':'blazeKick','quick-attack':'quickAttack','take-down':'takeDown','rock-throw':'rockThrow','giga-drain':'gigaDrain','waterfall':'waterfallMove'};
const sources=new Map();
for(const id of Object.keys(CREATURES)){
 const za=LEGENDS_ZA_LEARNSETS[id]||[],rows=za.length?za:LEVEL_LEARNSETS[id]||[],source=za.length?'legends-za':'official-fallback';
 for(const row of rows)if(!sources.has(row.move))sources.set(row.move,source);
}
const existing=new Set(Object.keys(ABILITIES));
for(const move of PREVIOUS_GENERATED)existing.delete(move.id);
const buffAttack=new Set(['belly-drum','howl','work-up','dragon-dance','quiver-dance','coil','psych-up','laser-focus']);
const buffDefense=new Set(['withdraw','stockpile','cosmic-power','magnetic-flux','rock-polish','shell-smash','wide-guard','quick-guard','endure']);
const buffSpeed=new Set(['tailwind','rock-polish','dragon-dance','quiver-dance','shell-smash']);
const heals=new Set(['roost','moonlight','rest','slack-off','aromatherapy']);
const debuffs=new Set(['sweet-scent','disable','soak','poison-gas','swagger','eerie-impulse','defog','taunt','mean-look','torment','quash','smog','clear-smog','noble-roar','fake-tears','teeter-dance','worry-seed','block','mimic','tearful-look','will-o-wisp','sandstorm','gravity']);
const areas=new Set(['eruption','self-destruct','explosion','hyper-voice','uproar','mist','clear-smog','heat-wave','petal-blizzard','water-spout','earthquake','blizzard','sandstorm']);
const projectiles=new Set(['swift','acid','smack-down','spark','charge-beam','echoed-voice','extrasensory','night-shade','incinerate','seed-bomb','brine','vacuum-wave','powder-snow','ice-shard','air-cutter','nuzzle','gunk-shot']);
const motifFor=(slug,type,category)=>{
 if(/fang|bite|crunch/.test(slug))return 'fang';if(/punch|arm-thrust|hammer-arm/.test(slug))return 'punch';if(/kick/.test(slug))return 'doubleKick';
 if(/slash|cut|claw|fury-cutter|cross-poison|razor-shell|throat-chop/.test(slug))return 'slash';if(/rock|smack|ancient-power/.test(slug))return 'rocks';
 if(/wave|voice|uproar|screech|roar/.test(slug))return 'wave';if(/dance|terrain|room|screen|guard|block|defog|mist/.test(slug))return 'aura';
 if(/beam|cannon|spout/.test(slug))return 'beam';if(/ball|bomb|pulse|gem|power/.test(slug))return 'aura';if(/spin|rollout/.test(slug))return 'wheel';
 return {Fire:'flame',Water:'wave',Electric:'lightning',Grass:'leaf',Ice:'ice',Fighting:'punch',Poison:'sludge',Ground:'quake',Flying:'wind',Psychic:'psychic',Bug:'cross',Rock:'rocks',Ghost:'shadow',Dragon:'dragon',Dark:'shadow',Steel:'steel',Fairy:'moon',Normal:category==='status'?'aura':'impact'}[type]||'stars';
};
const generated=[];
for(const [slug,source] of [...sources].sort(([a],[b])=>a.localeCompare(b))){
 const id=aliases[slug]||camel(slug);if(existing.has(id))continue;
 const raw={...(LEVEL_MOVE_METADATA[slug]||{}),...(LEGENDS_ZA_MOVE_METADATA[slug]||{})},category=String(raw.category||'status').toLowerCase(),type=typeName(raw.type),power=Number.isFinite(raw.power)?raw.power:null,accuracy=Number.isFinite(raw.accuracy)?raw.accuracy:null;
 let behavior=category==='status'?(heals.has(slug)?'heal':debuffs.has(slug)?'debuff':'buff'):(areas.has(slug)?'area':projectiles.has(slug)||category==='special'?'projectile':'direct');
 const move={id,name:raw.name||title(slug),type,category,power,accuracy,behavior,officialMove:slug,officialSource:source,motif:motifFor(slug,type,category)};
 if(behavior==='projectile')Object.assign(move,{range:360,speed:420,cooldown:Math.max(3.5,Math.min(12,3+(power||50)/18))});
 if(behavior==='direct')Object.assign(move,{range:82,lunge:power>=90?28:14,cooldown:Math.max(3,Math.min(11,2.5+(power||50)/19))});
 if(behavior==='area')Object.assign(move,{radius:power>=100?145:115,range:areas.has(slug)&&!['self-destruct','explosion','eruption'].includes(slug)?250:0,selfCentered:!['heat-wave','petal-blizzard'].includes(slug),cooldown:Math.max(7,Math.min(16,6+(power||70)/20))});
 if(behavior==='heal')Object.assign(move,{healing:raw.healing>0?Math.max(25,Math.round(raw.healing*.8)):46,range:0,cooldown:13});
 if(behavior==='buff'){const specialized=buffAttack.has(slug)||buffDefense.has(slug)||buffSpeed.has(slug);Object.assign(move,{duration:8,cooldown:12,attackMultiplier:buffAttack.has(slug)||!specialized?1.18:undefined,defenseBonus:buffDefense.has(slug)?8:undefined,speedMultiplier:buffSpeed.has(slug)?1.3:undefined});}
 if(behavior==='debuff'){
  const specialized=['eerie-impulse','noble-roar','sweet-scent','fake-tears','tearful-look','poison-gas','will-o-wisp','block'].includes(slug);
  Object.assign(move,{range:250,radius:100,duration:7,cooldown:10,
   attackMultiplier:slug==='will-o-wisp'?.5:['eerie-impulse','noble-roar'].includes(slug)?.72:undefined,
   defenseMultiplier:(['sweet-scent','fake-tears','tearful-look'].includes(slug)||!specialized)?.72:undefined,
   poison:slug==='poison-gas',ailment:slug==='will-o-wisp'?'burn':undefined,speedMultiplier:slug==='block'?.45:undefined});
 }
 move.description=`Adaptação em tempo real de ${move.name}, preservando tipo, categoria e poder oficiais.`;
 generated.push(move);
}
await writeFile('public/generated-level-move-abilities.js',`// Generated from the official level-up registry. Do not edit by hand.\nexport const GENERATED_LEVEL_MOVE_ABILITIES=${JSON.stringify(generated,null,2)};\n`);
console.log(`Generated ${generated.length} missing level-up move implementations.`);
