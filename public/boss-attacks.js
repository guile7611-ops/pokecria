// Every boss inherits this editable three-attack cycle unless it supplies its own.
export const DEFAULT_BOSS_ATTACKS=Object.freeze([
 {id:'slam',name:'Impacto Sísmico',shape:'circle',vfx:'earth',animation:'Attack',windup:.9,recovery:.8,damage:1},
 {id:'cleave',name:'Lâminas Selvagens',shape:'cone',vfx:'slash',animation:'Attack',windup:.8,recovery:.65,damage:.85},
 {id:'beam',name:'Raio Solar',shape:'line',vfx:'energy',animation:'Shoot',windup:1.25,recovery:1,damage:1.25},
]);
export function prepareBossAttack(boss,target,phase){
 const attacks=boss.attacks||DEFAULT_BOSS_ATTACKS,index=boss.attackIndex||0,attack=attacks[index%attacks.length];boss.attackIndex=index+1;
 const angle=Math.atan2(target.y-boss.y,target.x-boss.x);
 return {...attack,x:attack.shape==='circle'?target.x:boss.x,y:attack.shape==='circle'?target.y:boss.y,angle,
  radius:phase===3?110:phase===2?85:65,length:attack.shape==='line'?260:125,width:attack.shape==='line'?48:160,
  damage:(boss.attack+phase*3)*attack.damage,remaining:attack.windup*(phase===3?.75:1)};
}
export function bossAttackHits(attack,point){
 if(attack.shape==='circle')return Math.hypot(point.x-attack.x,point.y-attack.y)<=attack.radius;
 const dx=point.x-attack.x,dy=point.y-attack.y,c=Math.cos(attack.angle),s=Math.sin(attack.angle),along=dx*c+dy*s,across=Math.abs(-dx*s+dy*c);
 return along>=0&&along<=attack.length&&across<=attack.width/2*(attack.shape==='cone'?along/attack.length:1);
}
