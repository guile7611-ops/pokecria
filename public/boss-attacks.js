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
