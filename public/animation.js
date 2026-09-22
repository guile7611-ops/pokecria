import { SPRITE_DEFINITIONS } from './sprite-data.js';
import {GROUNDING} from './sprite-grounding.js';
export { SPRITE_DEFINITIONS };
// Verified against the original sheets: south, southeast, east, northeast, north, northwest, west, southwest.
export const DIRECTIONS = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];
export function facingDirection(facing) {
  const index = (Math.round(Math.atan2(facing.x, facing.y) / (Math.PI / 4)) + 8) % 8;
  return DIRECTIONS[index];
}
export function animationState(entity, time) {
  if (entity.dead) return 'Faint';
  if (entity.hitUntil > time) return 'Hurt';
  if (entity.attackUntil > time) return entity.attackAnimation || 'Attack';
  if (entity.moving) return entity.running?'Run':'Walk';
  return 'Idle';
}
export function animationFrame(entity, time, startTime = 0) {
  const state = animationState(entity, time), definition = SPRITE_DEFINITIONS[entity.id];
  const facing = ['Attack', 'Shoot'].includes(state) ? entity.attackFacing ?? entity.facing : entity.facing;
  const direction = facingDirection(facing);
  if (!definition) return { direction, state };
  const animation = definition.animations[state==='Run'?'Walk':state], loop = state === 'Walk'||state==='Run';
  const start = state === 'Faint' ? entity.deathStart : state === 'Hurt' ? entity.hitStart : ['Attack', 'Shoot'].includes(state) ? entity.attackStart : startTime;
  const total = animation.durations.reduce((sum, duration) => sum + duration, 0);
  let tick = Math.max(0, time - (start ?? 0)) * 60 * (state==='Run'?1.5:1);
  if (['Attack', 'Shoot'].includes(state)) tick = Math.max(0, time - (start ?? 0)) / .45 * total;
  tick = state === 'Idle' ? 0 : loop ? tick % total : Math.min(tick, total - .001);
  let column = 0;
  while (column < animation.durations.length - 1 && tick >= animation.durations[column]) tick -= animation.durations[column++];
  const row = animation.rows === 1 ? 0 : DIRECTIONS.indexOf(direction);
  const sourcePivot=animation.pivots[row][column],groundY=GROUNDING[entity.id]?.[state==='Run'?'Walk':state]?.[row]?.[column];
  return { state, direction, row, column, animation, pivot: groundY===undefined?sourcePivot:{x:sourcePivot.x,y:groundY}, scale: definition.scale };
}
