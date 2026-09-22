const skills={
 fire:[['Chama Rápida','fire',1.2],['Onda de Calor','fire',1.35],['Brasa Curativa','fire',.75],['Inferno','fire',1.7]],
 water:[['Jato d’Água','water',1.2],['Redemoinho','water',1.35],['Maré Vital','water',.75],['Hidro Bomba','water',1.7]],
 grass:[['Folha Navalha','leaf',1.2],['Chicote de Vinha','leaf',1.35],['Síntese','leaf',.75],['Raio Solar','energy',1.7]],
 electric:[['Faísca','energy',1.2],['Choque','energy',1.35],['Carga','energy',.75],['Trovão','energy',1.7]],
};
export function enemySkillCount(level){return Math.max(0,Math.min(4,Math.floor(level/20)));}
export function enemySkillSet(element,level){const primary=String(element||'').split(' / ')[0].toLowerCase(),key=({fogo:'fire',água:'water',grama:'grass',planta:'grass',elétrico:'electric'})[primary]||primary;const list=skills[key]||[['Investida','slash',1.2],['Golpe Circular','slash',1.35],['Foco','energy',.75],['Impacto','earth',1.7]];return list.slice(0,enemySkillCount(level)).map(([name,vfx,power],index)=>({name,vfx,power,kind:index===2?'heal':index===1?'area':'strike'}));}
