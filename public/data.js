import {MOVE_CATALOG} from './move-catalog.js';
import {LEVEL_LEARNSETS} from './level-learnsets.js';
import {LEVEL_MOVE_ABILITIES} from './level-move-abilities.js';
import {ZA_MOVE_ABILITIES} from './za-move-abilities.js';
import {PMD_MOVE_SPRITES} from './pmd-attack-vfx.js';
import {LEGENDS_ZA_LEARNSETS,LEGENDS_ZA_MOVE_METADATA} from './legends-za-data.js';
import {SpawnRarityDefinitions,speciesRarity} from './world-definition.js';
const BASE_PLAYER = { hp: 100, attack: 13, defense: 2, speed: 76, radius: 11, hpPerLevel: 9, attackPerLevel: 2 };
export const STARTERS = {
  bulbasaur: { ...BASE_PLAYER, id: 'bulbasaur', name: 'Bulbasaur', element: 'Planta / Veneno', projectile: 'leaf', recovery: 'bloom', third: 'vineBurst', ultimate: 'solarBeam' },
  charmander: { ...BASE_PLAYER, id: 'charmander', name: 'Charmander', element: 'Fogo', projectile: 'ember', recovery: 'recover', third: 'flamethrower', ultimate: 'inferno' },
  squirtle: { ...BASE_PLAYER, id: 'squirtle', name: 'Squirtle', element: 'Água', projectile: 'water', recovery: 'recover', third: 'aquaWave', ultimate: 'hydroCannon' },
  chikorita: { ...BASE_PLAYER, id: 'chikorita', name: 'Chikorita', element: 'Grama', projectile: 'leaf', recovery: 'bloom', third: 'vineBurst', ultimate: 'solarBeam' },
  cyndaquil: { ...BASE_PLAYER, id: 'cyndaquil', name: 'Cyndaquil', element: 'Fogo', projectile: 'ember', recovery: 'recover', third: 'flamethrower', ultimate: 'inferno' },
  totodile: { ...BASE_PLAYER, id: 'totodile', name: 'Totodile', element: 'Água', projectile: 'water', recovery: 'recover', third: 'aquaWave', ultimate: 'hydroCannon' },
  treecko: { ...BASE_PLAYER, id: 'treecko', name: 'Treecko', element: 'Grama', projectile: 'leaf', recovery: 'bloom', third: 'vineBurst', ultimate: 'solarBeam' },
  torchic: { ...BASE_PLAYER, id: 'torchic', name: 'Torchic', element: 'Fogo', projectile: 'ember', recovery: 'recover', third: 'flamethrower', ultimate: 'inferno' },
  mudkip: { ...BASE_PLAYER, id: 'mudkip', name: 'Mudkip', element: 'Água', projectile: 'water', recovery: 'recover', third: 'aquaWave', ultimate: 'hydroCannon' },
};
export const PLAYER = STARTERS.bulbasaur;
export const CREATURES = {
  bulbasaur: { ...STARTERS.bulbasaur, baseCreature: 'bulbasaur', stage: 0 },
  ivysaur: { ...STARTERS.bulbasaur, id: 'ivysaur', name: 'Ivysaur', baseCreature: 'bulbasaur', stage: 1, hp: 125, attack: 18, defense: 4, projectile: 'razorLeaf' },
  venusaur: { ...STARTERS.bulbasaur, id: 'venusaur', name: 'Venusaur', baseCreature: 'bulbasaur', stage: 2, hp: 165, attack: 26, defense: 7, projectile: 'solarSeed' },
  charmander: { ...STARTERS.charmander, baseCreature: 'charmander', stage: 0 },
  charmeleon: { ...STARTERS.charmander, id: 'charmeleon', name: 'Charmeleon', baseCreature: 'charmander', stage: 1, hp: 120, attack: 20, defense: 3, projectile: 'flame' },
  charizard: { ...STARTERS.charmander, id: 'charizard', name: 'Charizard', element: 'Fogo / Voador', baseCreature: 'charmander', stage: 2, hp: 150, attack: 30, defense: 5, projectile: 'fireBlast' },
  squirtle: { ...STARTERS.squirtle, baseCreature: 'squirtle', stage: 0 },
  wartortle: { ...STARTERS.squirtle, id: 'wartortle', name: 'Wartortle', baseCreature: 'squirtle', stage: 1, hp: 135, attack: 17, defense: 5, projectile: 'waterPulse' },
  blastoise: { ...STARTERS.squirtle, id: 'blastoise', name: 'Blastoise', baseCreature: 'squirtle', stage: 2, hp: 185, attack: 24, defense: 8, projectile: 'hydroPump' },
  chikorita: { ...STARTERS.chikorita, baseCreature: 'chikorita', stage: 0 },
  bayleef: { ...STARTERS.chikorita, id:'bayleef',name:'Bayleef',baseCreature:'chikorita',stage:1,hp:128,attack:18,defense:5,projectile:'razorLeaf' },
  meganium: { ...STARTERS.chikorita, id:'meganium',name:'Meganium',baseCreature:'chikorita',stage:2,hp:168,attack:25,defense:8,projectile:'solarSeed' },
  cyndaquil: { ...STARTERS.cyndaquil, baseCreature: 'cyndaquil', stage: 0 },
  quilava: { ...STARTERS.cyndaquil, id:'quilava',name:'Quilava',baseCreature:'cyndaquil',stage:1,hp:119,attack:21,defense:4,projectile:'flame' },
  typhlosion: { ...STARTERS.cyndaquil, id:'typhlosion',name:'Typhlosion',baseCreature:'cyndaquil',stage:2,hp:152,attack:31,defense:6,projectile:'fireBlast' },
  totodile: { ...STARTERS.totodile, baseCreature: 'totodile', stage: 0 },
  croconaw: { ...STARTERS.totodile, id:'croconaw',name:'Croconaw',baseCreature:'totodile',stage:1,hp:138,attack:20,defense:6,projectile:'waterPulse' },
  feraligatr: { ...STARTERS.totodile, id:'feraligatr',name:'Feraligatr',baseCreature:'totodile',stage:2,hp:182,attack:30,defense:8,projectile:'hydroPump' },
  treecko: { ...STARTERS.treecko, baseCreature: 'treecko', stage: 0 },
  grovyle: { ...STARTERS.treecko, id:'grovyle',name:'Grovyle',baseCreature:'treecko',stage:1,hp:116,attack:21,defense:4,projectile:'razorLeaf' },
  sceptile: { ...STARTERS.treecko, id:'sceptile',name:'Sceptile',baseCreature:'treecko',stage:2,hp:151,attack:31,defense:6,projectile:'solarSeed' },
  torchic: { ...STARTERS.torchic, baseCreature: 'torchic', stage: 0 },
  combusken: { ...STARTERS.torchic, id:'combusken',name:'Combusken',element:'Fogo / Lutador',baseCreature:'torchic',stage:1,hp:121,attack:23,defense:4,projectile:'flame' },
  blaziken: { ...STARTERS.torchic, id:'blaziken',name:'Blaziken',element:'Fogo / Lutador',baseCreature:'torchic',stage:2,hp:156,attack:34,defense:6,projectile:'fireBlast' },
  mudkip: { ...STARTERS.mudkip, baseCreature: 'mudkip', stage: 0 },
  marshtomp: { ...STARTERS.mudkip, id:'marshtomp',name:'Marshtomp',element:'Água / Terra',baseCreature:'mudkip',stage:1,hp:140,attack:21,defense:6,projectile:'waterPulse' },
  swampert: { ...STARTERS.mudkip, id:'swampert',name:'Swampert',element:'Água / Terra',baseCreature:'mudkip',stage:2,hp:188,attack:31,defense:9,projectile:'hydroPump' },
};
export const EVOLUTIONS = [
  { creatureId: 'bulbasaur', targetCreatureId: 'ivysaur', requiredLevel: 16, method: 'level' },
  { creatureId: 'ivysaur', targetCreatureId: 'venusaur', requiredLevel: 32, method: 'level' },
  { creatureId: 'charmander', targetCreatureId: 'charmeleon', requiredLevel: 16, method: 'level' },
  { creatureId: 'charmeleon', targetCreatureId: 'charizard', requiredLevel: 36, method: 'level' },
  { creatureId: 'squirtle', targetCreatureId: 'wartortle', requiredLevel: 16, method: 'level' },
  { creatureId: 'wartortle', targetCreatureId: 'blastoise', requiredLevel: 36, method: 'level' },
  { creatureId: 'chikorita', targetCreatureId: 'bayleef', requiredLevel: 16, method: 'level' },
  { creatureId: 'bayleef', targetCreatureId: 'meganium', requiredLevel: 32, method: 'level' },
  { creatureId: 'cyndaquil', targetCreatureId: 'quilava', requiredLevel: 14, method: 'level' },
  { creatureId: 'quilava', targetCreatureId: 'typhlosion', requiredLevel: 36, method: 'level' },
  { creatureId: 'totodile', targetCreatureId: 'croconaw', requiredLevel: 18, method: 'level' },
  { creatureId: 'croconaw', targetCreatureId: 'feraligatr', requiredLevel: 30, method: 'level' },
  { creatureId: 'treecko', targetCreatureId: 'grovyle', requiredLevel: 16, method: 'level' },
  { creatureId: 'grovyle', targetCreatureId: 'sceptile', requiredLevel: 36, method: 'level' },
  { creatureId: 'torchic', targetCreatureId: 'combusken', requiredLevel: 16, method: 'level' },
  { creatureId: 'combusken', targetCreatureId: 'blaziken', requiredLevel: 36, method: 'level' },
  { creatureId: 'mudkip', targetCreatureId: 'marshtomp', requiredLevel: 16, method: 'level' },
  { creatureId: 'marshtomp', targetCreatureId: 'swampert', requiredLevel: 36, method: 'level' },
];
export const ABILITIES = {
  basic: { id: 'basic', name: 'Ataque básico', behavior: 'direct', damage: 0, power:40, category:'Physical', range: 62, cooldown: .65, color: '#f4e8ad' },
  leaf: { id: 'leaf', name: 'Folha cortante', behavior: 'projectile', damage: 12, range: 300, speed: 370, cooldown: 2.4, pellets:1, level: 1, slot: 0, color: '#bcf57b', description: 'Dispara uma folha cortante rápida.' },
  bloom: { id: 'bloom', name: 'Florescer', behavior: 'heal', healing: 32, range: 0, cooldown: 9, level: 2, slot: 1, color: '#84efd6', description: 'Restaura 32 pontos de vida.' },
  ember: { id: 'ember', name: 'Brasa', behavior: 'projectile', damage: 12, range: 300, speed: 370, cooldown: 2.4, pellets:2, spread:.12, pelletScale:.65, level: 1, slot: 0, color: '#ffac5f', description: 'Lança duas brasas que se separam no ar.' },
  water: { id: 'water', name: 'Jato d’água', behavior: 'projectile', damage: 12, range: 300, speed: 370, cooldown: 2.4, splashRadius:30, level: 1, slot: 0, color: '#7ae2ff', description: 'Uma gota veloz respinga em inimigos próximos.' },
  recover: { id: 'recover', name: 'Recuperar', behavior: 'heal', healing: 32, range: 0, cooldown: 9, level: 2, slot: 1, color: '#84efd6', description: 'Recuperação do protótipo: restaura 32 pontos de vida.' },
  vineBurst: { id: 'vineBurst', name: 'Rajada de Vinhas', behavior: 'whip', damage: 27, range: 220, cooldown: 5, level: 10, slot: 2, color: '#78e85f', description: 'Duas vinhas chicoteiam uma faixa à frente.' },
  solarBeam: { id: 'solarBeam', name: 'Raio Solar', behavior: 'beam', damage: 55, range: 470, charge:.7, cooldown: 14, level: 25, slot: 3, color: '#efff72', description: 'Concentra luz e dispara um raio que atravessa os alvos.' },
  flamethrower: { id: 'flamethrower', name: 'Lança-chamas', behavior: 'channel', damage: 13, range: 310, duration:1.2, hitInterval:.24, cooldown: 5, level: 10, slot: 2, color: '#ff7b45', description: 'Mantém um cone de chamas por 1,2 segundo e acerta repetidamente.' },
  inferno: { id: 'inferno', name: 'Inferno', behavior: 'zone', damage: 22, radius:125, range:400, duration:2.6, hitInterval:.5, cooldown: 14, level: 25, slot: 3, color: '#ffdb56', description: 'Uma coluna de fogo envolve a área e queima repetidamente.' },
  aquaWave: { id: 'aquaWave', name: 'Onda d’Água', behavior: 'wave', damage: 26, range: 380, speed: 260, width:46, cooldown: 5, level: 10, slot: 2, color: '#59d9ff', description: 'Uma frente de água atravessa vários inimigos e os empurra.' },
  hydroCannon: { id: 'hydroCannon', name: 'Canhão Hidro', behavior: 'projectile', damage: 54, range: 480, speed: 530, charge:.4, splashRadius:85, cooldown: 14, level: 25, slot: 3, color: '#8eefff', description: 'Carrega um canhão de água que explode em uma grande área.' },
};
export const LEARNSET = [{ level: 1, ability: 'leaf', slot: 0 }, { level: 2, ability: 'bloom', slot: 1 }];
// Real-time adaptations for this prototype, not canonical move-learning tables.
Object.assign(ABILITIES, {
  razorLeaf: { ...ABILITIES.leaf, id: 'razorLeaf', name: 'Folha navalha', damage: 20, pellets:5, spread:.16, pelletScale:.46, description: 'Espalha cinco folhas afiadas em leque.' },
  solarSeed: { ...ABILITIES.leaf, id: 'solarSeed', name: 'Semente solar', damage: 34, range: 340, pellets:1, color: '#e0f38a', description: 'Lança uma semente vegetal energizada.' },
  flame: { ...ABILITIES.ember, id: 'flame', name: 'Chama intensa', damage: 22, description: 'Projétil de fogo reforçado de Charmeleon.' },
  fireBlast: { ...ABILITIES.ember, id: 'fireBlast', name: 'Explosão de fogo', damage: 38, range: 340, description: 'Projétil de fogo poderoso de Charizard.' },
  waterPulse: { ...ABILITIES.water, id: 'waterPulse', name: 'Pulso d’água', damage: 20, description: 'Projétil aquático reforçado de Wartortle.' },
  hydroPump: { ...ABILITIES.water, id: 'hydroPump', name: 'Hidro bomba', damage: 35, range: 350, description: 'Disparo aquático poderoso de Blastoise.' },
  growth:{id:'growth',name:'Crescimento',behavior:'buff',type:'Normal',cooldown:12,duration:8,attackMultiplier:1.3,color:'#79c95a',vfx:'buff',description:'Aumenta o poder dos ataques em 30% por 8 segundos.'},
  poisonPowder:{id:'poisonPowder',name:'Pó Venenoso',behavior:'debuff',type:'Poison',poison:true,duration:8,radius:105,range:250,cooldown:7,color:'#ba65d2',vfx:'debuff',description:'Espalha pó que envenena os alvos na área por 8 segundos.'},
  smokescreen:{id:'smokescreen',name:'Cortina de Fumaça',behavior:'buff',type:'Normal',cooldown:12,duration:7,defenseBonus:5,color:'#8b8c91',vfx:'buff',description:'Cria fumaça e aumenta a defesa em 5 por 7 segundos.'},
  fireSpin:{id:'fireSpin',name:'Giro de Fogo',behavior:'area',type:'Fire',damage:25,radius:115,range:285,cooldown:8,color:'#ff7950',vfx:'fire',description:'Forma um círculo de fogo que atinge todos na área.'},
  tailWhip:{id:'tailWhip',name:'Chicote de Cauda',behavior:'buff',type:'Normal',cooldown:11,duration:7,attackMultiplier:1.18,speedMultiplier:1.18,color:'#e5c78d',vfx:'buff',description:'Aumenta ataque e velocidade em 18% por 7 segundos.'},
  rapidSpin:{id:'rapidSpin',name:'Giro Rápido',behavior:'area',type:'Normal',damage:23,radius:95,range:0,cooldown:6,color:'#d8e5ea',vfx:'wind',selfCentered:true,description:'Gira e atinge todos os inimigos próximos.'},
  synthesis:{id:'synthesis',name:'Síntese',behavior:'heal',type:'Grass',healing:48,range:0,cooldown:13,color:'#9bea75',vfx:'heal',description:'Recupera 48 pontos de vida.'},
  flameWheel:{id:'flameWheel',name:'Roda de Fogo',behavior:'rolling',type:'Fire',damage:16,radius:27,duration:4,hitInterval:.45,range:0,cooldown:10,speedMultiplier:1.35,color:'#ff7c42',selfCentered:true,description:'Vira uma roda de fogo por 4 segundos. Continue se movendo para atingir inimigos por contato.'},
  iceFang:{id:'iceFang',name:'Presa de Gelo',behavior:'direct',type:'Ice',damage:31,range:83,lunge:26,stagger:.25,slow:1.5,cooldown:5,color:'#96e8ff',vfx:'pmd/0155',description:'Avança e morde um alvo próximo; o gelo reduz seus movimentos por 1,5 segundo.'},
  crunch:{id:'crunch',name:'Mordida',behavior:'direct',type:'Dark',damage:38,range:78,lunge:18,stagger:.35,cooldown:6,color:'#78678c',vfx:'pmd/0122',description:'Uma mordida corpo a corpo que interrompe brevemente o alvo.'},
  megaDrain:{id:'megaDrain',name:'Mega Dreno',behavior:'projectile',type:'Grass',damage:24,range:330,speed:390,cooldown:6,color:'#78df76',vfx:'leaf',lifesteal:.35,description:'Drena energia; cura 35% do dano causado.'},
  agility:{id:'agility',name:'Agilidade',behavior:'buff',type:'Psychic',cooldown:11,duration:8,speedMultiplier:1.45,color:'#e9a8f3',vfx:'buff',description:'Aumenta a velocidade em 45% por 8 segundos.'},
  sandAttack:{id:'sandAttack',name:'Ataque de Areia',behavior:'area',type:'Ground',damage:12,radius:120,range:240,cooldown:7,color:'#d4b06e',vfx:'earth',description:'Levanta areia e atinge vários inimigos.'},
  peck:{id:'peck',name:'Bicada',behavior:'direct',type:'Flying',damage:25,range:70,cooldown:4,color:'#e3e7ec',vfx:'wind',description:'Ataque voador rápido contra um alvo próximo.'},
  mudSlap:{id:'mudSlap',name:'Tapa de Lama',behavior:'area',type:'Ground',damage:18,radius:90,range:250,cooldown:6,color:'#b89362',vfx:'earth',description:'Arremessa lama e acerta uma pequena área.'},
  whirlpool:{id:'whirlpool',name:'Redemoinho',behavior:'zone',type:'Water',damage:12,radius:105,range:300,duration:2.8,hitInterval:.55,cooldown:8,color:'#52cfee',description:'Cria um vórtice persistente que puxa e fere os inimigos.'},
  protect:{id:'protect',name:'Proteção',behavior:'buff',type:'Normal',cooldown:14,duration:5,defenseBonus:9,color:'#9de7c1',vfx:'buff',description:'Cria uma barreira e aumenta a defesa em 9 por 5 segundos.'},
  doubleKick:{id:'doubleKick',name:'Chute Duplo',behavior:'direct',type:'Fighting',damage:11,hits:2,range:79,cooldown:4.5,motif:'doubleKick',color:'#f6a76c',description:'Dois chutes consecutivos de tipo Lutador.'},
  mudShot:{id:'mudShot',name:'Tiro de Lama',behavior:'projectile',type:'Ground',damage:19,range:330,speed:390,slow:2,cooldown:5,motif:'mudShot',color:'#b69363',description:'Dispara lama e reduz o movimento do alvo por 2 segundos.'},
  blazeKick:{id:'blazeKick',name:'Chute Ígneo',behavior:'direct',type:'Fire',damage:38,range:82,lunge:20,stagger:.25,cooldown:6,motif:'blazeKick',color:'#ff944b',description:'Um chute em chamas que interrompe brevemente o alvo.'},
  tackle:{id:'tackle',name:'Investida',behavior:'direct',type:'Normal',damage:12,range:72,lunge:13,cooldown:2.8,motif:'tackle',color:'#ead8b1',description:'Avança e atinge um alvo próximo.'},
  scratch:{id:'scratch',name:'Arranhão',behavior:'direct',type:'Normal',damage:12,range:73,cooldown:2.8,motif:'scratch',color:'#eee1bd',description:'Três garras riscam o alvo.'},
  quickAttack:{id:'quickAttack',name:'Ataque Rápido',behavior:'direct',type:'Normal',damage:15,range:105,lunge:38,cooldown:3.5,motif:'quickAttack',color:'#ececdb',description:'Uma investida veloz alcança alvos um pouco mais distantes.'},
  bite:{id:'bite',name:'Mordida',behavior:'direct',type:'Dark',damage:17,range:78,stagger:.2,cooldown:4,motif:'jaws',color:'#b0a2c7',description:'Morde e interrompe brevemente o alvo.'},
  takeDown:{id:'takeDown',name:'Derrubar',behavior:'direct',type:'Normal',damage:27,range:88,lunge:24,recoil:.18,cooldown:5.5,motif:'takeDown',color:'#d9b987',description:'Uma colisão forte que também causa dano ao usuário.'},
  rockThrow:{id:'rockThrow',name:'Lançamento de Rocha',behavior:'projectile',type:'Rock',damage:17,range:330,speed:355,cooldown:4.5,motif:'rockThrow',color:'#bca184',description:'Lança uma rocha sólida contra o alvo.'},
  absorb:{id:'absorb',name:'Absorver',behavior:'projectile',type:'Grass',damage:10,range:310,speed:400,lifesteal:.5,cooldown:4.5,motif:'absorb',color:'#90e88f',description:'Drena energia e cura metade do dano causado.'},
  gigaDrain:{id:'gigaDrain',name:'Gigadreno',behavior:'projectile',type:'Grass',damage:31,range:350,speed:400,lifesteal:.5,cooldown:7,motif:'gigaDrain',color:'#70e5a0',description:'Um dreno mais forte que recupera metade do dano causado.'},
});
for(const [id,type] of Object.entries({leaf:'Grass',razorLeaf:'Grass',solarSeed:'Grass',vineBurst:'Grass',solarBeam:'Grass',ember:'Fire',flame:'Fire',fireBlast:'Fire',flamethrower:'Fire',inferno:'Fire',water:'Water',waterPulse:'Water',hydroPump:'Water',aquaWave:'Water',hydroCannon:'Water',bloom:'Grass',recover:'Normal'}))if(ABILITIES[id])ABILITIES[id].type=type;
Object.assign(ABILITIES, {
 neutralPulse:{...ABILITIES.leaf,id:'neutralPulse',name:'Pulso',type:'Normal',color:'#f3dba5',description:'Dispara energia concentrada.'},
 impact:{...ABILITIES.vineBurst,id:'impact',name:'Impacto',type:'Normal',color:'#ffd77a',description:'Um golpe concentrado de grande força.'},
 starBurst:{...ABILITIES.solarBeam,id:'starBurst',name:'Explosão Estelar',type:'Normal',color:'#fff2a8',description:'Ultimate: libera uma poderosa rajada de energia.'},
});
for(const move of LEVEL_MOVE_ABILITIES)ABILITIES[move.id]={...move,color:'#d9e8ff'};
for(const move of ZA_MOVE_ABILITIES)ABILITIES[move.id]={...move,color:'#d9e8ff'};
for(const move of MOVE_CATALOG)ABILITIES[move.id]={...move,vfx:`moves/${move.id}`,catalogOnly:true,color:'#d9e8ff'};
// Each equipped move has its own pre-rendered animation sheet, including
// legacy starter moves. The catalog uses the same path convention.
for(const ability of Object.values(ABILITIES))if(ability.id!=='basic')ability.vfx=PMD_MOVE_SPRITES[ability.id]?`pmd/${PMD_MOVE_SPRITES[ability.id]}`:`moves/${ability.id}`;
export const LEARNSETS = Object.fromEntries(Object.values(CREATURES).map(s => [s.id, [{ level: 1, ability: s.projectile, slot: 0 }, { level: 2, ability: s.recovery, slot: 1 }, { level: 10, ability: s.third, slot: 2 }, { level: 25, ability: s.ultimate, slot: 3 }]]));
const starterMoves={
 bulbasaur:[[1,'leaf',0],[2,'bloom',1],[5,'growth'],[7,'poisonPowder'],[10,'vineBurst',2],[15,'synthesis'],[25,'solarBeam',3]],
 charmander:[[1,'ember',0],[2,'recover',1],[5,'smokescreen'],[8,'fireSpin'],[10,'flamethrower',2],[15,'flameWheel'],[25,'inferno',3]],
 squirtle:[[1,'water',0],[2,'recover',1],[5,'tailWhip'],[8,'rapidSpin'],[10,'aquaWave',2],[15,'protect'],[25,'hydroCannon',3]],
 chikorita:[[1,'leaf',0],[2,'bloom',1],[5,'growth'],[8,'poisonPowder'],[10,'vineBurst',2],[15,'synthesis'],[25,'solarBeam',3]],
 cyndaquil:[[1,'ember',0],[2,'recover',1],[5,'smokescreen'],[8,'flameWheel'],[10,'flamethrower',2],[15,'agility'],[25,'inferno',3]],
 totodile:[[1,'water',0],[2,'recover',1],[5,'tailWhip'],[8,'iceFang'],[10,'aquaWave',2],[15,'crunch'],[25,'hydroCannon',3]],
 treecko:[[1,'leaf',0],[2,'bloom',1],[5,'megaDrain'],[8,'agility'],[10,'vineBurst',2],[15,'synthesis'],[25,'solarBeam',3]],
 torchic:[[1,'ember',0],[2,'recover',1],[5,'sandAttack'],[8,'peck'],[10,'flamethrower',2],[15,'agility'],[25,'inferno',3]],
 mudkip:[[1,'water',0],[2,'recover',1],[5,'mudSlap'],[8,'protect'],[10,'whirlpool',2],[15,'aquaWave'],[25,'hydroCannon',3]],
};
for(const [id,rows] of Object.entries(starterMoves))LEARNSETS[id]=rows.map(([level,ability,slot])=>({level,ability,slot}));
export const xpForLevel=level=>{level=Math.max(0,Math.floor(Number(level)||0));return level===0?0:45+(level-1)*25+5*(level-1)*(level-2)/2;};
// Compatibility with existing consumers while allowing any positive level.
export const XP_CURVE=new Proxy([],{get(target,key,receiver){if(typeof key==='string'&&/^\d+$/.test(key))return xpForLevel(Number(key));return Reflect.get(target,key,receiver);}});
export const SPAWN_RARITIES = SpawnRarityDefinitions;
const wild=(id,name,element,rarity,hp,attack,defense,speed,drop)=>({id,name,element,rarity,rarityName:SPAWN_RARITIES[rarity].name,hp,attack,defense,speed,radius:12,xp:25,drop,range:40,aggro:155,chaseRange:400,leash:620,wanderRadius:96,cooldown:1.25,respawn:13});
export const WILD_POKEMON = [
 wild('caterpie','Caterpie','Bug','common',38,7,1,61,'Fibra de Seda'),
 wild('weedle','Weedle','Bug / Poison','common',37,8,1,62,'Ferrão'),
 wild('pidgey','Pidgey','Normal / Flying','common',34,9,1,82,'Pena Brisa'),
 wild('rattata','Rattata','Normal','common',40,10,2,76,'Dente Pequeno'),
 wild('spearow','Spearow','Normal / Flying','uncommon',42,12,2,88,'Pena Aguda'),
 wild('zubat','Zubat','Poison / Flying','common',39,9,2,90,'Asa Sombria'),
 wild('oddish','Oddish','Grass / Poison','common',45,10,3,55,'Folha Aromática'),
 wild('paras','Paras','Bug / Grass','uncommon',48,12,3,50,'Cogumelo'),
 wild('psyduck','Psyduck','Water','uncommon',52,12,3,66,'Pena Molhada'),
 wild('poliwag','Poliwag','Water','uncommon',44,11,2,78,'Bolha Clara'),
 wild('abra','Abra','Psychic','rare',38,15,1,96,'Pó Psíquico'),
 wild('machop','Machop','Fighting','uncommon',58,15,4,58,'Faixa de Treino'),
 wild('geodude','Geodude','Rock / Ground','common',62,13,7,42,'Pedra Dura'),
 wild('magnemite','Magnemite','Electric / Steel','rare',50,15,7,64,'Ímã'),
 wild('gastly','Gastly','Ghost / Poison','rare',42,16,2,85,'Essência Sombria'),
 wild('drowzee','Drowzee','Psychic','uncommon',55,13,4,54,'Pó de Sonho'),
 wild('krabby','Krabby','Water','common',46,14,5,67,'Casco'),
 wild('voltorb','Voltorb','Electric','rare',44,15,3,105,'Núcleo Elétrico'),
 wild('cubone','Cubone','Ground','rare',57,15,6,50,'Osso Antigo'),
 wild('horsea','Horsea','Water','uncommon',43,12,3,72,'Escama Azul'),
 wild('sentret','Sentret','Normal','common',41,9,2,73,'Cauda Macia'),
 wild('hoothoot','Hoothoot','Normal / Flying','common',45,10,3,70,'Pena Noturna'),
 wild('spinarak','Spinarak','Bug / Poison','common',42,10,3,64,'Fio Venenoso'),
 wild('mareep','Mareep','Electric','uncommon',49,12,4,62,'Lã Estática'),
 wild('wooper','Wooper','Water / Ground','common',53,10,4,48,'Lodo Azul'),
 wild('murkrow','Murkrow','Dark / Flying','rare',47,16,3,91,'Pena Negra'),
 wild('slugma','Slugma','Fire','uncommon',51,14,5,35,'Magma Vivo'),
 wild('poochyena','Poochyena','Dark','common',45,12,3,75,'Pelo Escuro'),
 wild('lotad','Lotad','Water / Grass','uncommon',50,10,4,52,'Folha-d’água'),
 wild('shroomish','Shroomish','Grass','uncommon',54,11,5,47,'Esporo'),
 wild('ralts','Ralts','Psychic / Fairy','uncommon',42,12,2,58,'Fragmento Psíquico'),
 wild('kirlia','Kirlia','Psychic / Fairy','rare',58,18,4,75,'Fita Psíquica'),
 wild('gardevoir','Gardevoir','Psychic / Fairy','rare',82,27,7,88,'Cristal Empático'),
 wild('aron','Aron','Steel / Rock','common',62,13,10,35,'Placa de Ferro'),
 wild('lairon','Lairon','Steel / Rock','uncommon',84,20,14,43,'Minério Reforçado'),
 wild('aggron','Aggron','Steel / Rock','rare',112,31,20,50,'Armadura Antiga'),
 wild('carvanha','Carvanha','Water / Dark','uncommon',49,18,2,78,'Presa Serrilhada'),
 wild('sharpedo','Sharpedo','Water / Dark','rare',78,29,5,102,'Barbatana Navalha'),
 wild('wailmer','Wailmer','Water','uncommon',92,15,5,45,'Óleo Marinho'),
 wild('wailord','Wailord','Water','rare',150,24,8,52,'Pérola Abissal'),
 wild('larvitar','Larvitar','Rock / Ground','rare',64,19,8,48,'Fragmento de Rocha'),
 wild('pupitar','Pupitar','Rock / Ground','rare',88,24,13,52,'Casulo Rochoso'),
 wild('tyranitar','Tyranitar','Rock / Dark','rare',128,35,17,61,'Núcleo da Tempestade'),
 wild('numel','Numel','Fire / Ground','common',57,14,5,38,'Carvão Quente'),
 wild('camerupt','Camerupt','Fire / Ground','rare',99,28,10,42,'Rocha Vulcânica'),
 wild('torkoal','Torkoal','Fire','rare',92,22,16,30,'Casco Fumegante'),
 wild('houndour','Houndour','Dark / Fire','uncommon',48,17,4,72,'Presa Queimada'),
 wild('houndoom','Houndoom','Dark / Fire','rare',76,28,7,95,'Chifre Sombrio'),
 wild('makuhita','Makuhita','Fighting','common',72,16,5,36,'Faixa Pesada'),
 wild('hariyama','Hariyama','Fighting','rare',118,30,9,46,'Palma de Mestre'),
];
WILD_POKEMON.push(
 wild('metapod','Metapod','Bug','uncommon',52,7,9,30,'Casulo Verde'),wild('butterfree','Butterfree','Bug / Flying','rare',68,21,6,78,'Pó de Asas'),
 wild('kakuna','Kakuna','Bug / Poison','uncommon',50,8,9,31,'Casulo Dourado'),wild('beedrill','Beedrill','Bug / Poison','rare',70,25,5,82,'Ferrão Real'),
 wild('pidgeotto','Pidgeotto','Normal / Flying','uncommon',62,18,6,86,'Pena Longa'),wild('pidgeot','Pidgeot','Normal / Flying','rare',86,27,9,101,'Pluma do Vendaval'),
 wild('raticate','Raticate','Normal','uncommon',68,21,6,92,'Presa Robusta'),wild('fearow','Fearow','Normal / Flying','rare',78,26,7,108,'Pena Lance'),
 wild('golbat','Golbat','Poison / Flying','uncommon',75,21,7,98,'Asa Venenosa'),wild('crobat','Crobat','Poison / Flying','rare',96,29,10,125,'Presa Noturna'),
 wild('gloom','Gloom','Grass / Poison','uncommon',72,18,8,48,'Néctar Sombrio'),wild('vileplume','Vileplume','Grass / Poison','rare',98,28,12,54,'Pétala Gigante'),wild('bellossom','Bellossom','Grass','rare',91,26,13,58,'Flor Solar'),
 wild('parasect','Parasect','Bug / Grass','rare',91,26,13,42,'Cogumelo Ancião'),wild('golduck','Golduck','Water','rare',91,27,10,92,'Gema Aquática'),
 wild('poliwhirl','Poliwhirl','Water','uncommon',72,19,8,90,'Espiral Azul'),wild('poliwrath','Poliwrath','Water / Fighting','rare',104,31,14,78,'Punho Espiral'),wild('politoed','Politoed','Water','rare',96,27,12,82,'Coroa da Chuva'),
 wild('kadabra','Kadabra','Psychic','uncommon',61,27,5,105,'Colher Mental'),wild('alakazam','Alakazam','Psychic','rare',82,38,8,120,'Colher Arcana'),
 wild('machoke','Machoke','Fighting','uncommon',92,27,11,55,'Cinto de Força'),wild('machamp','Machamp','Fighting','rare',124,38,15,65,'Faixa do Campeão'),
 wild('graveler','Graveler','Rock / Ground','uncommon',94,27,17,38,'Rocha Compacta'),wild('golem','Golem','Rock / Ground','rare',126,38,22,48,'Núcleo de Pedra'),
 wild('magneton','Magneton','Electric / Steel','uncommon',78,28,16,76,'Tríplice Ímã'),wild('magnezone','Magnezone','Electric / Steel','rare',108,37,21,72,'Núcleo Magnético'),
 wild('haunter','Haunter','Ghost / Poison','uncommon',66,28,6,105,'Gás Espectral'),wild('gengar','Gengar','Ghost / Poison','rare',92,39,9,118,'Sombra Condensada'),
 wild('hypno','Hypno','Psychic','rare',96,27,13,73,'Pêndulo Hipnótico'),wild('kingler','Kingler','Water','rare',98,34,16,72,'Pinça Real'),
 wild('electrode','Electrode','Electric','rare',76,28,8,130,'Núcleo Volátil'),wild('marowak','Marowak','Ground','rare',91,29,15,58,'Osso de Batalha'),
 wild('seadra','Seadra','Water','uncommon',72,24,11,92,'Escama Espinhosa'),wild('kingdra','Kingdra','Water / Dragon','rare',105,34,15,98,'Escama de Dragão'),
 wild('furret','Furret','Normal','uncommon',82,20,8,98,'Cauda Listrada'),wild('noctowl','Noctowl','Normal / Flying','uncommon',89,22,10,82,'Pena Lunar'),
 wild('ariados','Ariados','Bug / Poison','uncommon',78,24,10,58,'Teia Rubra'),wild('flaaffy','Flaaffy','Electric','uncommon',73,21,10,58,'Lã Rosa'),wild('ampharos','Ampharos','Electric','rare',106,32,14,65,'Orbe de Luz'),
 wild('quagsire','Quagsire','Water / Ground','uncommon',101,23,13,42,'Lodo Denso'),wild('honchkrow','Honchkrow','Dark / Flying','rare',102,34,10,88,'Pluma do Chefe'),
 wild('magcargo','Magcargo','Fire / Rock','rare',104,30,20,32,'Casco de Lava'),wild('mightyena','Mightyena','Dark','uncommon',82,25,9,85,'Presa Alfa'),
 wild('lombre','Lombre','Water / Grass','uncommon',75,18,10,55,'Folha Dançarina'),wild('ludicolo','Ludicolo','Water / Grass','rare',103,29,14,76,'Sombrero Tropical'),wild('breloom','Breloom','Grass / Fighting','rare',88,32,9,78,'Esporo de Combate')
);
for(const starter of Object.values(STARTERS))WILD_POKEMON.push(wild(starter.id,starter.name,starter.element, 'rare',48,11,3,72,'Essência Elemental'));
for(const species of WILD_POKEMON){
 if(STARTERS[species.id])continue;
 const primary=species.element.split(' / ')[0], moves=primary==='Grass'?['leaf','bloom','vineBurst','solarBeam']:primary==='Fire'?['ember','recover','flamethrower','inferno']:primary==='Water'?['water','recover','aquaWave','hydroCannon']:['neutralPulse','recover','impact','starBurst'];
 CREATURES[species.id]??={...BASE_PLAYER,...species,hp:Math.max(80,species.hp+35),attack:Math.max(11,species.attack),defense:species.defense,baseCreature:species.id,stage:0,projectile:moves[0],recovery:moves[1],third:moves[2],ultimate:moves[3]};
 LEARNSETS[species.id]=moves.map((ability,slot)=>({level:[1,2,10,25][slot],ability,slot}));
}
// Canonical level-up rows supplement legacy sets until every move has combat
// behavior and art. An unavailable move is never silently equipped.
const canonicalMoveIds={
  'water-gun':'water','razor-leaf':'razorLeaf','solar-beam':'solarBeam',
  'flamethrower':'flamethrower','fire-spin':'fireSpin','flame-wheel':'flameWheel',
  'water-pulse':'waterPulse','hydro-pump':'hydroPump','mud-slap':'mudSlap',
  'ice-fang':'iceFang','mega-drain':'megaDrain','poison-powder':'poisonPowder',
  'rapid-spin':'rapidSpin','double-kick':'doubleKick','mud-shot':'mudShot',
  'blaze-kick':'blazeKick',
  'quick-attack':'quickAttack','take-down':'takeDown','rock-throw':'rockThrow',
  'giga-drain':'gigaDrain',
};
for(const id of Object.keys(ABILITIES))canonicalMoveIds[id.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)]??=id;
for(const move of MOVE_CATALOG)canonicalMoveIds[move.officialName.toLowerCase().replaceAll(' ','-')]=move.id;
for(const [slug,metadata] of Object.entries(LEGENDS_ZA_MOVE_METADATA)){
 const ability=ABILITIES[canonicalMoveIds[slug]];if(!ability)continue;
 Object.assign(ability,{power:metadata.power,accuracy:metadata.accuracy,category:metadata.category,officialMove:slug,officialSource:'legends-za'});
}
export const CANONICAL_LEARNSETS=Object.fromEntries(Object.entries(LEGENDS_ZA_LEARNSETS).map(([id,rows])=>[
  id,rows.map(row=>({...row,ability:canonicalMoveIds[row.move]}))
]));
for(const [id,rows] of Object.entries(CANONICAL_LEARNSETS)){
  if(!LEARNSETS[id])continue;
  const existing=new Set(LEARNSETS[id].map(row=>`${row.level}:${row.ability}`));
  for(const row of rows){
    if(!row.ability||!ABILITIES[row.ability])continue;
    ABILITIES[row.ability].catalogOnly=false;
    if(existing.has(`${row.level}:${row.ability}`))continue;
    LEARNSETS[id].push({level:row.level,ability:row.ability,canonical:true});
    existing.add(`${row.level}:${row.ability}`);
  }
  LEARNSETS[id].sort((a,b)=>a.level-b.level);
}
const additionalEvolutionLines = [
 ['caterpie','metapod',7],['metapod','butterfree',10],['weedle','kakuna',7],['kakuna','beedrill',10],
 ['pidgey','pidgeotto',18],['pidgeotto','pidgeot',36],['rattata','raticate',20],['spearow','fearow',20],
 ['zubat','golbat',22],['golbat','crobat',36],['oddish','gloom',21],['gloom','vileplume',36],['paras','parasect',24],
 ['psyduck','golduck',33],['poliwag','poliwhirl',25],['poliwhirl','poliwrath',36],['abra','kadabra',16],['kadabra','alakazam',36],
 ['machop','machoke',28],['machoke','machamp',40],['geodude','graveler',25],['graveler','golem',40],
 ['magnemite','magneton',30],['magneton','magnezone',45],['gastly','haunter',25],['haunter','gengar',40],
 ['drowzee','hypno',26],['krabby','kingler',28],['voltorb','electrode',30],['cubone','marowak',28],
 ['horsea','seadra',32],['seadra','kingdra',44],['sentret','furret',15],['hoothoot','noctowl',20],['spinarak','ariados',22],
 ['mareep','flaaffy',15],['flaaffy','ampharos',30],['wooper','quagsire',20],['murkrow','honchkrow',36],
 ['slugma','magcargo',38],['poochyena','mightyena',18],['lotad','lombre',14],['lombre','ludicolo',36],['shroomish','breloom',23],
 ['ralts','kirlia',20],['kirlia','gardevoir',30],
 ['aron','lairon',32],['lairon','aggron',42],
 ['carvanha','sharpedo',30],['wailmer','wailord',40],
 ['larvitar','pupitar',30],['pupitar','tyranitar',55],
 ['numel','camerupt',33],['houndour','houndoom',24],['makuhita','hariyama',24],
];
for(const [from,to,requiredLevel] of additionalEvolutionLines){
 EVOLUTIONS.push({creatureId:from,targetCreatureId:to,requiredLevel,method:'level'});
 const base=CREATURES[from].baseCreature||from;
 CREATURES[from].baseCreature=base;
 CREATURES[to].baseCreature=base;
 CREATURES[to].stage=(CREATURES[from].stage||0)+1;
}
EVOLUTIONS.unshift(
 {creatureId:'gloom',targetCreatureId:'bellossom',requiredLevel:36,method:'level',natures:['Calma','Serena','Tímida']},
 {creatureId:'poliwhirl',targetCreatureId:'politoed',requiredLevel:36,method:'level',natures:['Calma','Serena','Tímida']},
);
for(const [id,base,stage] of [['bellossom','oddish',2],['politoed','poliwag',2]])Object.assign(CREATURES[id],{baseCreature:base,stage});
for(const species of WILD_POKEMON){species.rarity=speciesRarity(species.id);species.rarityName=SPAWN_RARITIES[species.rarity].name;}
const rangedSpecies=new Set(['oddish','gloom','vileplume','bellossom','psyduck','golduck','poliwag','poliwhirl','horsea','seadra','kingdra','abra','kadabra','alakazam','magnemite','magneton','magnezone','gastly','haunter','gengar','voltorb','electrode','mareep','flaaffy','ampharos','slugma','magcargo','numel','camerupt','ralts','kirlia','gardevoir','wailmer','wailord','bulbasaur','chikorita','treecko','charmander','cyndaquil','torchic','squirtle','totodile','mudkip']);
for(const species of WILD_POKEMON)if(rangedSpecies.has(species.id)){species.ranged=true;species.range=185;const primary=species.element.split(' / ')[0];species.projectileVfx=primary==='Fire'||primary==='Fogo'?'fire':primary==='Water'||primary==='Água'?'water':primary==='Grass'||primary==='Grama'||primary==='Planta'?'leaf':'energy';}
export const ENEMY = WILD_POKEMON[0];
export const BOSS = { id: 'venusaur', name: 'Guardião da Clareira', hp: 420, attack: 16, defense: 6, speed: 54, radius: 24, xp: 180, range: 245, aggro: 420, leash: 580, movementRadius: 360, regenerationRate: .1, cooldown: 1.2, respawn: 45, isBoss: true, phaseThresholds: [.66, .33] };
export { PoiDefinitions as POIS, RegionDefinitions as MACRO_REGIONS, SpawnZoneDefinitions as SPAWN_ZONES } from './world-definition.js';
export const REGION = { name: 'Arquipélago de Aurora', subtitle: 'UM MUNDO A EXPLORAR', tile: 32, cols: 480, rows: 340, seed: 123456, spawn: { x: 240, y: 560 }, spawnZones: [{ x: 460, y: 545 }, { x: 1040, y: 700 }, { x: 1800, y: 1180 }] };
export const KEYS = ['Q', 'W', 'E', 'R'];
