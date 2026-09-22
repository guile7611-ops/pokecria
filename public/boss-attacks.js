// Each regional boss can override this four-attack cycle.
export const DEFAULT_BOSS_ATTACKS=Object.freeze([
 {id:'slam',name:'Impacto Sísmico',shape:'circle',vfx:'earth',animation:'Attack',windup:.9,recovery:.8,damage:1},
 {id:'cleave',name:'Lâminas Selvagens',shape:'cone',vfx:'slash',animation:'Attack',windup:.8,recovery:.65,damage:.85},
 {id:'beam',name:'Raio Solar',shape:'line',vfx:'energy',animation:'Shoot',windup:1.25,recovery:1,damage:1.25},
 {id:'shockwave',name:'Onda de Choque',shape:'circle',vfx:'energy',animation:'Attack',windup:1,recovery:.9,damage:1.1,radius:115},
]);
export const FOREST_BOSS_ATTACKS=Object.freeze([
 {id:'root-ring',name:'Raízes Vorazes',shape:'circle',vfx:'leaf',animation:'Attack',windup:1.35,recovery:.7,damage:.9},
 {id:'thorn-fan',name:'Leque de Espinhos',shape:'cone',vfx:'leaf',animation:'Shoot',windup:.7,recovery:.7,damage:1},
 {id:'solar-lance',name:'Lança Solar',shape:'line',vfx:'energy',animation:'Shoot',windup:1.45,recovery:1.1,damage:1.35},
 {id:'spore-bloom',name:'Explosão de Esporos',shape:'circle',vfx:'leaf',animation:'Attack',windup:1.15,recovery:.85,damage:1.1,radius:120},
]);
export const VOLCANO_BOSS_ATTACKS=Object.freeze([
 {id:'eruption',name:'Erupção da Caldeira',shape:'circle',vfx:'fire',animation:'Attack',windup:1.25,recovery:.9,damage:1.25},
 {id:'flame-sweep',name:'Varredura de Chamas',shape:'cone',vfx:'fire',animation:'Shoot',windup:.65,recovery:.8,damage:1.05},
 {id:'magma-beam',name:'Rio de Magma',shape:'line',vfx:'fire',animation:'Shoot',windup:1,recovery:1,damage:1.4},
 {id:'ember-storm',name:'Tempestade de Brasas',shape:'circle',vfx:'fire',animation:'Shoot',windup:1.05,recovery:.9,damage:1.15,radius:125},
]);
export const TIDAL_BOSS_ATTACKS=Object.freeze([
 {id:'tidal-crash',name:'Muralha das Marés',shape:'cone',vfx:'pmd/0251',animation:'Shoot',windup:1.15,recovery:.8,damage:1.05},
 {id:'shell-quake',name:'Impacto do Casco',shape:'circle',vfx:'pmd/0021',animation:'Attack',windup:.85,recovery:.8,damage:1.2,radius:112},
 {id:'hydro-lance',name:'Canhão Hidro',shape:'line',vfx:'pmd/0081',animation:'Shoot',windup:1.35,recovery:1,damage:1.45},
 {id:'undertow',name:'Redemoinho Abissal',shape:'circle',vfx:'pmd/0058',animation:'Shoot',windup:1.25,recovery:.9,damage:1.1,radius:132},
]);
export const GRANITE_BOSS_ATTACKS=Object.freeze([
 {id:'stone-fall',name:'Queda de Rochas',shape:'circle',vfx:'pmd/0221',animation:'Attack',windup:1.15,recovery:.8,damage:1.25,radius:116},
 {id:'sand-fan',name:'Tempestade de Areia',shape:'cone',vfx:'pmd/0117',animation:'Shoot',windup:.75,recovery:.7,damage:.95},
 {id:'granite-rift',name:'Fenda Sísmica',shape:'line',vfx:'pmd/0259',animation:'Attack',windup:1.2,recovery:1.1,damage:1.5},
 {id:'dark-crush',name:'Mandíbula Sombria',shape:'circle',vfx:'pmd/0122',animation:'Attack',windup:.9,recovery:.8,damage:1.35,radius:108},
]);
export const ASTRAL_BOSS_ATTACKS=Object.freeze([
 {id:'psychic-orbit',name:'Órbita Psíquica',shape:'circle',vfx:'pmd/0017',animation:'Shoot',windup:1.3,recovery:.75,damage:1.1,radius:125},
 {id:'moon-fan',name:'Leque Lunar',shape:'cone',vfx:'pmd/0160',animation:'Shoot',windup:.85,recovery:.8,damage:1.05},
 {id:'mind-lance',name:'Lança Mental',shape:'line',vfx:'pmd/0203',animation:'Shoot',windup:1.45,recovery:1,damage:1.4},
 {id:'starfall',name:'Chuva de Estrelas',shape:'circle',vfx:'pmd/0160',animation:'Attack',windup:1.1,recovery:.95,damage:1.2,radius:138},
]);

export const REGIONAL_BOSSES=Object.freeze({
 'arena-guardiao':{uid:1000,id:'venusaur',name:'Guardião da Clareira',attacks:FOREST_BOSS_ATTACKS,guards:['caterpie','weedle','pidgey','caterpie','weedle','pidgey']},
 vulcao:{uid:1001,id:'charizard',name:'Guardião da Caldeira',minLevel:72,hp:560,attack:25,defense:9,speed:68,radius:27,xp:280,attacks:VOLCANO_BOSS_ATTACKS,guards:['slugma','numel','houndour','torkoal','geodude','cubone']},
 'arena-mar':{uid:1002,id:'blastoise',name:'Guardião das Marés',minLevel:34,hp:510,attack:21,defense:12,speed:48,radius:27,xp:240,attacks:TIDAL_BOSS_ATTACKS,guards:['squirtle','krabby','horsea','psyduck','poliwag','wailmer']},
 'arena-granito':{uid:1003,id:'tyranitar',name:'Colosso de Granito',minLevel:58,hp:680,attack:28,defense:17,speed:48,radius:30,xp:340,attacks:GRANITE_BOSS_ATTACKS,guards:['larvitar','pupitar','aron','lairon','geodude','graveler']},
 'arena-astral':{uid:1004,id:'gardevoir',name:'Oráculo Astral',minLevel:42,hp:460,attack:26,defense:9,speed:64,radius:26,xp:290,attacks:ASTRAL_BOSS_ATTACKS,guards:['ralts','kirlia','abra','kadabra','mareep','oddish']},
});
export function prepareBossAttack(boss,target,phase){
 const attacks=boss.attacks||DEFAULT_BOSS_ATTACKS,index=boss.attackIndex||0,attack=attacks[index%attacks.length];boss.attackIndex=index+1;
 const angle=Math.atan2(target.y-boss.y,target.x-boss.x);
 return {...attack,x:attack.shape==='circle'?target.x:boss.x,y:attack.shape==='circle'?target.y:boss.y,angle,
  radius:Math.max(attack.radius||0,phase===3?125:phase===2?100:82),length:attack.shape==='line'?350:220,width:attack.shape==='line'?62:205,
  damage:(boss.attack+phase*3)*attack.damage,remaining:attack.windup*(phase===3?.75:1)};
}
export function bossAttackHits(attack,point){
 if(attack.shape==='circle')return Math.hypot(point.x-attack.x,point.y-attack.y)<=attack.radius;
 const dx=point.x-attack.x,dy=point.y-attack.y,c=Math.cos(attack.angle),s=Math.sin(attack.angle),along=dx*c+dy*s,across=Math.abs(-dx*s+dy*c);
 return along>=0&&along<=attack.length&&across<=attack.width/2*(attack.shape==='cone'?along/attack.length:1);
}
