import {NEW_SPAWN_RULES} from './roster-expansion.js';
import {EVOLUTION_RULES,canSpawnSpecies} from './evolution-rules.js';
// All coordinates are in tiles. These authored shapes are independent of seed.
export const WorldSeed = 123456;
export const WorldDefinition = {
  id: 'aurora-v3', name: 'Arquipélago de Aurora', cols: 720, rows: 440, tile: 32, chunkSize: 24,
  coast: [[2,6],[22,3],[48,9],[64,27],[91,38],[114,25],[131,9],[170,17],[190,35],[223,21],[260,10],[294,28],[313,54],[344,37],[373,46],[391,77],[418,82],[431,109],[413,128],[442,157],[453,188],[430,202],[448,227],[416,242],[403,272],[370,287],[354,314],[324,307],[306,280],[277,290],[260,269],[232,293],[206,278],[183,309],[151,318],[140,285],[111,271],[84,284],[67,263],[90,237],[69,214],[42,206],[30,177],[48,147],[35,119],[57,96],[37,76],[16,60],[2,40]],
  islands: [[[396,118],[451,99],[482,38],[545,16],[612,42],[685,96],[703,160],[676,219],[700,284],[664,362],[602,414],[521,418],[468,371],[415,312],[390,246]] ,[[408,298],[429,283],[446,291],[451,311],[435,326],[416,320]], [[29,246],[44,237],[55,250],[48,265],[30,263]]],
  ridges: [ [[128,38],[159,51],[188,43],[218,54],[249,36],[281,51],[305,75]], [[344,74],[365,101],[349,129],[370,151],[359,179]], [[125,184],[140,206],[128,232]] ],
  rivers: [ { width: 2.6, points: [[217,53],[208,70],[224,88],[207,110],[188,126],[202,148],[224,170],[231,197],[258,215],[268,240],[260,269]] }, { width: 1.7, points: [[294,60],[278,81],[288,99],[268,117],[241,127],[219,151]] }, { width: 1.4, points: [[141,58],[132,82],[149,99],[170,112],[183,125]] } ],
  lakes: [ { x:190,y:126,rx:25,ry:18 }, { x:291,y:205,rx:15,ry:10 }, { x:100,y:167,rx:10,ry:15 } ],
};
const region = (id,name,biome,x,y,rx,ry,level,species,reward) => ({id,name,biome,x,y,rx,ry,level,species,reward, difficulty: level[0] < 4 ? 'Tranquila' : level[0] < 8 ? 'Moderada' : 'Perigosa'});
export const RegionDefinitions = [
  region('vila','Vila Aurora','village',13,18,17,19,[1,2],['pidgey','rattata','sentret'],'Abrigo e suprimentos'),
  region('bosque','Bosque dos Brotos','forest',47,40,32,26,[1,3],['caterpie','metapod','weedle','kakuna','pidgey','oddish','spinarak','bulbasaur','chikorita','treecko'],'Fibra de Seda'),
  region('campos','Campos do Vento','field',100,95,55,49,[2,4],['pidgey','pidgeotto','rattata','raticate','spearow','fearow','sentret','furret','mareep','flaaffy','poochyena','mightyena','ralts','makuhita'],'Pena Brisa'),
  region('mata','Mata Esmeralda','dense',159,87,35,28,[4,7],['caterpie','metapod','butterfree','weedle','kakuna','beedrill','oddish','gloom','vileplume','bellossom','paras','parasect','shroomish','breloom','abra','ralts','kirlia'],'Sementes antigas'),
  region('lago','Bacia da Lua','lake',190,132,37,30,[3,6],['psyduck','golduck','poliwag','poliwhirl','poliwrath','politoed','wooper','quagsire','lotad','lombre','ludicolo','wailmer','carvanha','squirtle','totodile','mudkip'],'Pérola da Lua'),
  region('norte','Coroa Boreal','conifer',235,43,91,27,[8,12],['hoothoot','noctowl','murkrow','honchkrow','mareep','flaaffy','ampharos','spearow','fearow','larvitar','pupitar'],'Cristal da serra'),
  region('encosta','Passos de Granito','rock',352,123,36,64,[8,12],['geodude','graveler','golem','machop','machoke','machamp','cubone','marowak','zubat','golbat','crobat','aron','lairon','aggron','makuhita','hariyama'],'Minério antigo'),
  region('vulcao','Caldeira Rubra','volcano',387,205,46,32,[40,70],['slugma','magcargo','geodude','graveler','cubone','marowak','numel','camerupt','torkoal','houndour','houndoom','charmander','cyndaquil','torchic'],'Fragmento de brasa'),
  region('deserto','Mar de Âmbar','desert',322,255,51,28,[7,10],['cubone','marowak','spearow','fearow','poochyena','mightyena','drowzee','hypno','numel','camerupt','houndour','charmander','cyndaquil','torchic'],'Vidro do deserto'),
  region('pantano','Pântano dos Sussurros','swamp',114,215,36,37,[6,9],['wooper','quagsire','lotad','lombre','ludicolo','oddish','gloom','spinarak','ariados','gastly','haunter','carvanha'],'Musgo luminoso'),
  region('pradaria','Pradaria das Flores','meadow',185,240,49,41,[4,7],['mareep','flaaffy','ampharos','oddish','gloom','bellossom','sentret','furret','shroomish','breloom','abra','kadabra','ralts','kirlia','gardevoir','makuhita'],'Pólen dourado'),
  region('ruinas','Vale dos Reis','ruins',280,110,36,29,[6,9],['drowzee','hypno','gastly','haunter','gengar','magnemite','magneton','magnezone','voltorb','electrode','abra','kadabra','alakazam','ralts','kirlia','gardevoir','larvitar'],'Relíquia dos reis'),
  region('caverna','Grutas de Cristal','cave',330,86,14,12,[7,10],['zubat','golbat','crobat','geodude','graveler','golem','machop','machoke','machamp','gastly','haunter','gengar','aron','lairon','larvitar','pupitar','tyranitar'],'Cristal azul'),
  region('costa','Costa das Marés','beach',189,293,47,17,[3,6],['krabby','kingler','horsea','seadra','kingdra','psyduck','golduck','poliwag','poliwhirl','poliwrath','politoed','wailmer','wailord','carvanha','sharpedo'],'Concha azul'),
  region('mangue','Manguezal das Brumas','mangrove',467,293,55,66,[1,100],['wooper','quagsire','spinarak','ariados','oddish','gloom','gastly','haunter','lotad','lombre'],'Musgo luminoso'),
  region('estepe','Estepe dos Trovões','steppe',508,151,69,76,[1,100],['mareep','flaaffy','ampharos','magnemite','magneton','voltorb','electrode','spearow','fearow','sentret'],'Pena Brisa'),
  region('neve','Taiga do Alvorecer','tundra',555,56,63,37,[1,100],['hoothoot','noctowl','murkrow','honchkrow','spearow','fearow'],'Cristal da serra'),
  region('cinzas','Terras das Cinzas','ash',626,204,62,80,[1,100],['numel','camerupt','slugma','magcargo','torkoal','houndour','houndoom','geodude','graveler'],'Fragmento de brasa'),
  region('jardim-leste','Bosque das Pétalas','grove',571,342,82,61,[1,100],['oddish','gloom','bellossom','shroomish','breloom','paras','parasect','ralts','kirlia','gardevoir','treecko'],'Pólen dourado'),
];
for(const [id,rule] of Object.entries(NEW_SPAWN_RULES))for(const region of RegionDefinitions)if(rule.regions?.includes(region.id))region.species.push(id);
const poi = (id,name,kind,x,y,region,secret=false) => ({id,name,kind,x:x*32,y:y*32,region,secret,level:RegionDefinitions.find(r=>r.id===region)?.level.join('–') || '1–3'});
export const PoiDefinitions = [
  poi('posto-leste','Refúgio das Brisas','village',476,154,'estepe'),
  poi('farol-brumas','Farol das Brumas','tower',455,275,'mangue'),
  poi('gruta-brumas','Gruta das Brumas','cave',475,335,'mangue'),
  poi('gruta-petalas','Gruta das Pétalas','cave',558,358,'jardim-leste'),
  poi('jardim-leste','Santuário das Pétalas','ruins',600,355,'jardim-leste'),
  poi('forja','Forja das Cinzas','camp',632,236,'cinzas'),
  poi('gruta-cinzas','Fenda das Cinzas','cave',648,174,'cinzas'),
  poi('neve','Abrigo Boreal','village',548,61,'neve'),
  poi('gruta-neve','Gruta Boreal','cave',590,79,'neve'),
  poi('subida-boreal','Escarpa Boreal','gate',568,95,'neve'),
  poi('subida-leste','Escarpa dos Trovões','gate',545,170,'estepe'),
  poi('subida-granito','Escarpa de Granito','gate',363,114,'encosta'),
  poi('subida-cinzas','Escarpa das Cinzas','gate',617,263,'cinzas'),
  poi('vila-aurora','Vila Aurora','village',8,17,'vila'), poi('arena-guardiao','Santuário do Guardião','boss',61,49,'bosque'),
  poi('bosque','Clareira dos Brotos','camp',53,44,'bosque'), poi('posto','Estalagem do Vento','village',101,99,'campos'),
  poi('templo','Templo das Raízes','ruins',151,91,'mata'), poi('lago','Porto da Lua','village',174,146,'lago'),
  poi('ilha','Ilha do Oráculo','ruins',190,126,'lago',true), poi('arena-mar','Trono das Marés','boss',214,145,'lago'), poi('cachoeira','Véu da Lua','waterfall',208,76,'norte'),
  poi('segredo-agua','Gruta sob o Véu','cave',202,73,'norte',true), poi('passo','Portão Boreal','gate',245,59,'norte'),
  poi('torre','Torre da Vigília','tower',281,70,'norte'), poi('ruinas','Cidadela dos Reis','ruins',280,112,'ruinas'),
  poi('gruta','Gruta de Cristal','cave',330,86,'caverna'), poi('vale','Refúgio da Serra','camp',350,138,'encosta'), poi('arena-granito','Bastião de Granito','boss',344,153,'encosta'),
  poi('mina','Mina Esquecida','cave',373,163,'encosta'), poi('vulcao','Cratera do Sol','boss',389,208,'vulcao'),
  poi('oasis','Oásis de Âmbar','village',311,250,'deserto'), poi('dunas','Altar das Dunas','ruins',344,272,'deserto'),
  poi('brejo','Cabanas do Brejo','village',104,214,'pantano'), poi('cripta','Cripta Afogada','cave',125,234,'pantano',true),
  poi('jardim','Jardim das Estrelas','camp',180,245,'pradaria'), poi('arena-astral','Observatório Astral','boss',197,249,'pradaria'), poi('porto','Porto das Marés','village',175,290,'costa'),
  poi('bosque-secreto','Bosque Silencioso','ruins',144,116,'mata',true), poi('praia','Enseada das Conchas','camp',91,259,'costa'),
];
// Curved roads connect the authored POIs. Side paths form loops and secrets.
export const RoadDefinitions = [
 [[350,138],[407,143],[445,158],[476,154],[518,152],[545,170],[591,179],[648,174]],
 [[476,154],[493,111],[518,91],[548,61],[590,79],[568,95],[530,119],[518,152]],
 [[389,208],[421,238],[455,275],[475,335],[516,356],[558,358],[600,355],[634,314],[617,263],[632,236],[648,174]],
 [[476,154],[468,220],[455,275]], [[545,170],[561,230],[548,286],[558,358]],
 [[311,250],[379,286],[422,316],[475,335]], [[350,138],[363,114]],

 [[8,17],[18,17],[27,17],[33,24],[43,31],[53,44],[66,64],[87,82],[101,99]],
 [[53,44],[57,47],[61,49]],
 [[101,99],[121,92],[151,91],[164,106],[174,146]],
 [[151,91],[178,80],[202,73],[208,76],[229,68],[245,59],[265,64],[281,70],[307,76],[330,86]],
 [[174,146],[196,156],[220,155],[249,137],[280,112],[311,100],[330,86]],
 [[280,112],[309,122],[332,128],[350,138],[360,155],[373,163],[384,184],[389,208]],
 [[389,208],[374,235],[344,272],[325,264],[311,250],[277,246],[241,249],[211,257],[180,245]],
 [[101,99],[87,135],[82,177],[104,214],[130,242],[155,250],[180,245],[172,267],[175,290]],
 [[174,146],[163,177],[174,211],[180,245]],
 [[104,214],[94,233],[91,259]], [[104,214],[118,223],[125,234]], [[151,91],[143,104],[144,116]],
 [[174,146],[165,146],[165,138],[178,130],[190,126]],
 [[196,156],[208,153],[214,145]], [[350,138],[347,145],[344,153]], [[180,245],[190,245],[197,249]],
];
export const BiomeDefinitions = {
 mangrove:{color:'#426e69',tree:.1},steppe:{color:'#b4af69',tree:.015},tundra:{color:'#c8dfdd',tree:.08},ash:{color:'#756663',tree:.005},grove:{color:'#86a76c',tree:.16},highland:{color:'#a5b8bc',tree:.01},

 field: {color:'#88aa52',tree:.025}, forest:{color:'#608e48',tree:.18}, dense:{color:'#3f7847',tree:.36}, village:{color:'#91a764',tree:0}, meadow:{color:'#9cb860',tree:.02},
 conifer:{color:'#769383',tree:.14}, rock:{color:'#a09b80',tree:.025}, volcano:{color:'#65544c',tree:0}, desert:{color:'#d6b873',tree:0}, swamp:{color:'#567f68',tree:.12},
 lake:{color:'#80a774',tree:.08}, ruins:{color:'#98a278',tree:.08}, cave:{color:'#7d8585',tree:.01}, beach:{color:'#dfca91',tree:.006},
};
export const TerrainDefinitions = { ground:0, tree:1, water:2, mountain:3, sand:4, swamp:5, volcanic:6, road:7, bridge:8, cave:9, structure:10, passage:11 };
export const WALKABLE = new Set([0,4,5,6,7,8,9,11]);
export const StructureDefinitions = PoiDefinitions.flatMap(p => {
 const x=p.x/32,y=p.y/32;
 const base = {poi:p.id,region:p.region};
 if(p.kind==='village') return [
  {...base,id:p.id+'-heal',kind:'heal',x:x-2.5,y:y-4,w:3,h:2.5}, {...base,id:p.id+'-shop',kind:'shop',x:x+3.8,y:y-3.3,w:2.7,h:2.3},
  {...base,id:p.id+'-home',kind:'house',x:x-3,y:y+3.5,w:2.4,h:2}, {...base,id:p.id+'-hall',kind:'hall',x:x+5,y:y+4,w:3.4,h:2.7},
  {...base,id:p.id+'-gate',kind:'gate',x:x+8,y:y+.5,w:2,h:1}, {...base,id:p.id+'-well',kind:'well',x:x+.7,y:y-1,w:1,h:1},
 ];
 return [{...base,id:p.id,kind:p.kind,x,y:y-2,w:p.kind==='boss'?5:3,h:p.kind==='boss'?2:2.5}];
});
export const SpawnRarityDefinitions={
 common:{name:'Comum',weight:100,captureChance:.68},uncommon:{name:'Incomum',weight:28,captureChance:.48},rare:{name:'Raro',weight:2.5,captureChance:.29},
 epic:{name:'Épico',weight:.3,captureChance:.15},legendary:{name:'Lendário',weight:.03,captureChance:.07},mythic:{name:'Mítico',weight:.004,captureChance:.035},
};
const BaseRare=new Set(['abra','gastly','magnemite','voltorb','cubone','murkrow','larvitar','ralts','torkoal','bulbasaur','charmander','squirtle','chikorita','cyndaquil','totodile','treecko','torchic','mudkip']);
const BaseUncommon=new Set(['spearow','paras','psyduck','poliwag','machop','drowzee','horsea','mareep','slugma','lotad','shroomish','carvanha','wailmer','houndour']);
const EvolutionParent=Object.fromEntries(EVOLUTION_RULES.map(r=>[r.targetCreatureId,r.creatureId]));
export const EvolutionMinimumLevel=Object.fromEntries(EVOLUTION_RULES.filter(r=>r.method==='level').map(r=>[r.targetCreatureId,r.requiredLevel]));
export function speciesRarity(id){if(NEW_SPAWN_RULES[id]?.rarity)return NEW_SPAWN_RULES[id].rarity;let base=id,stage=0;while(EvolutionParent[base]&&stage<4){base=EvolutionParent[base];stage++;}const start=BaseRare.has(base)?2:BaseUncommon.has(base)?1:0;return ['common','uncommon','rare','epic','legendary','mythic'][Math.min(5,start+stage)];}
export const SpawnZoneDefinitions = RegionDefinitions.filter(r=>r.biome!=='village').map(r=>({id:r.id,region:r.id,level:r.level,species:r.species.filter(canSpawnSpecies).map(id=>{const rarity=speciesRarity(id);let stage=0,parent=id;while(EvolutionParent[parent]&&stage<4){parent=EvolutionParent[parent];stage++;}return{id,rarity,weight:SpawnRarityDefinitions[rarity].weight*(stage===0?1:stage===1?.45:.25),minLevel:EvolutionMinimumLevel[id]||1};}),count:Math.max(12,Math.min(27,Math.round(r.rx*r.ry/145)+(r.biome==='dense'?4:0))),reward:r.reward}));
// Local areas remain editable independently of their enclosing region.
export const AreaDefinitions = PoiDefinitions.map(p=>({id:p.id+'-area',region:p.region,x:p.x/32,y:p.y/32,rx:p.kind==='village'?11:6,ry:p.kind==='village'?8:5,biome:p.kind==='cave'?'cave':p.kind==='ruins'?'ruins':'clearing',secret:p.secret,entrance:[p.x/32,p.y/32+3],exit:[p.x/32+4,p.y/32],reward:p.secret?'Relíquia escondida':'Descoberta regional'}));
for (const r of RegionDefinitions) {
 r.areas=AreaDefinitions.filter(a=>a.region===r.id).map(a=>a.id);
 r.entrances=AreaDefinitions.filter(a=>a.region===r.id).map(a=>a.entrance);
 r.exits=AreaDefinitions.filter(a=>a.region===r.id).map(a=>a.exit);
}

