import { CREATURES, EVOLUTIONS, XP_CURVE } from './data.js';
import {calculatedStats,ensureOfficialTraining,mapMovementSpeed} from './official-mechanics.js';

export function nextEvolution(creatureId, player=null) {
 const choices=EVOLUTIONS.filter(e=>e.creatureId===creatureId&&e.method==='level');
 if(player){const natureAliases={calm:'Calma',serious:'Serena',timid:'Tímida'};const nature=natureAliases[player.nature]||player.nature;const conditional=choices.find(e=>e.natures?.includes(nature));if(conditional)return conditional;}
 return choices.find(e=>!e.natures)??choices[0]??null;
}
export function evolutionLine(creatureId) {
  const base = CREATURES[creatureId]?.baseCreature;
  if (!base) return [];
  const line = [{ id: base, requiredLevel: 1 }];
  let current = base;
  for (let step = 0; step < Object.keys(CREATURES).length; step++) {
    const evolution = nextEvolution(current); if (!evolution) break;
    line.push({ id: evolution.targetCreatureId, requiredLevel: evolution.requiredLevel }); current = evolution.targetCreatureId;
  }
  return line;
}
export function applyStats(player) {
  ensureOfficialTraining(player);const stats=calculatedStats(player.id,player.level,player.ivs,player.evs,player.nature);
  if(!stats)return;Object.assign(player,{maxHp:stats.hp,attack:stats.attack,defense:stats.defense,spAttack:stats.spAttack,spDefense:stats.spDefense,speed:stats.speed,movementSpeed:mapMovementSpeed(stats.speed)});
}
export function applyEvolutions(player, time) {
  const events = [];
  for (let step = 0; step < Object.keys(CREATURES).length; step++) {
    const evolution = nextEvolution(player.id,player);
    if (!evolution || player.level < evolution.requiredLevel) break;
    const from = player.id, old = CREATURES[from], target = CREATURES[evolution.targetCreatureId];
    const healthRatio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
    Object.assign(player, { id: target.id, name: target.name, element: target.element, stage: target.stage, projectile: target.projectile });
    applyStats(player); player.hp = player.dead ? 0 : Math.min(player.maxHp, Math.ceil(player.maxHp * healthRatio));
    if (player.slots[0] === old.projectile) {
      player.slots[0] = target.projectile;
      player.cooldowns[target.projectile] = Math.max(player.cooldowns[target.projectile] || 0, player.cooldowns[old.projectile] || 0);
      delete player.cooldowns[old.projectile];
    }
    const record = { from, to: target.id, level: player.level, requiredLevel: evolution.requiredLevel, time };
    player.evolutionHistory.push(record); player.evolutionStart = time; player.evolutionUntil = time + 1.6;
    events.push(record);
  }
  return events;
}
export function xpToLevel(player, targetLevel) {
  if (!Number.isFinite(targetLevel)) return 0;
  const target = Math.max(player.level, Math.floor(targetLevel));
  if (target === player.level) return 0;
  let total = -player.xp;
  for (let level = player.level; level < target; level++) total += XP_CURVE[level];
  return total;
}
