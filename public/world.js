import { terrainPassable, collidersIn } from './collisions.js';
import { REGION } from './data.js';
import { generateWorld } from './map-generator.js';
import { WALKABLE } from './world-definition.js';
import { MinHeap } from './world-runtime.js';
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const cellKey = (x, y) => `${x},${y}`;
const worldCache = new Map();
export function createMap(seed = REGION.seed, spawnEpoch = 0) {
  const key=`${seed}:${spawnEpoch}`;
  if (!worldCache.has(key)) { if (worldCache.size > 3) worldCache.clear(); worldCache.set(key, generateWorld({ ...REGION, seed, spawnSeed:(seed^Math.imul(spawnEpoch,2654435761))>>>0 })); }
  return worldCache.get(key);
}
export function walkable(map, x, y, radius = 11, profile = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  for (let cy = Math.floor((y - radius) / map.tile); cy <= Math.floor((y + radius) / map.tile); cy++)
    for (let cx = Math.floor((x - radius) / map.tile); cx <= Math.floor((x + radius) / map.tile); cx++)
      if (!terrainPassable(map,cx,cy,profile)) return false;
  for(const o of collidersIn(map,x-radius,y-radius,x+radius,y+radius))if(x+radius>o.x&&x-radius<o.x+o.w&&y+radius>o.y&&y-radius<o.y+o.h)return false;
  return true;
}
export function clearSegment(map, start, end, radius = 11, profile = {}) {
  if (!walkable(map, start.x, start.y, radius, profile) || !walkable(map, end.x, end.y, radius, profile)) return false;
  // Test the swept body against expanded obstacle boxes, including tiny corner
  // intersections that fixed-distance samples can miss.
  const dx = end.x - start.x, dy = end.y - start.y, t = map.tile;
  for (let y = Math.floor((Math.min(start.y, end.y) - radius) / t); y <= Math.floor((Math.max(start.y, end.y) + radius) / t); y++) {
    for (let x = Math.floor((Math.min(start.x, end.x) - radius) / t); x <= Math.floor((Math.max(start.x, end.x) + radius) / t); x++) {
      if (terrainPassable(map,x,y,profile)) continue;
      let enter = 0, leave = 1;
      for (const [origin, delta, min, max] of [[start.x, dx, x * t - radius, (x + 1) * t + radius], [start.y, dy, y * t - radius, (y + 1) * t + radius]]) {
        if (delta === 0) { if (origin < min || origin > max) { enter = 2; break; } }
        else { const a = (min - origin) / delta, b = (max - origin) / delta; enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b)); }
      }
      if (enter <= leave) return false;
    }
  }
  for(const o of collidersIn(map,Math.min(start.x,end.x)-radius,Math.min(start.y,end.y)-radius,Math.max(start.x,end.x)+radius,Math.max(start.y,end.y)+radius)){
    let enter=0,leave=1;
    for(const [origin,delta,min,max]of[[start.x,dx,o.x-radius,o.x+o.w+radius],[start.y,dy,o.y-radius,o.y+o.h+radius]]){
      if(delta===0){if(origin<=min||origin>=max){enter=2;break;}}else{const a=(min-origin)/delta,b=(max-origin)/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));}
    }
    if(enter<=leave)return false;
  }
  return true;
}
export function findPath(map, start, end, radius = start.radius ?? 11, profile = start.navigation || {}) {
  if (!walkable(map, start.x, start.y, radius, profile) || !Number.isFinite(end.x) || !Number.isFinite(end.y)) return [];
  if (!walkable(map, end.x, end.y, radius, profile)) {
    const x = Math.floor(end.x / map.tile), y = Math.floor(end.y / map.tile);
    if (!terrainPassable(map,x,y,profile)) return [];
    // Keep edge clicks in their intended tile, with enough room for the body.
    const margin = radius + .01;
    end = { x: Math.max(x * map.tile + margin, Math.min(end.x, (x + 1) * map.tile - margin)), y: Math.max(y * map.tile + margin, Math.min(end.y, (y + 1) * map.tile - margin)) };
    if (!walkable(map, end.x, end.y, radius, profile)) return [];
  }
  if (clearSegment(map, start, end, radius, profile)) return [{ x: end.x, y: end.y }];
  const sx = Math.floor(start.x / map.tile), sy = Math.floor(start.y / map.tile);
  const ex = Math.floor(end.x / map.tile), ey = Math.floor(end.y / map.tile);
  const startKey = cellKey(sx, sy), goalKey = cellKey(ex, ey);
  const queue = new MinHeap(), parents = new Map([[startKey, null]]), cost = new Map([[startKey, 0]]), visited = new Set();
  queue.push({ x: sx, y: sy, score: 0 });
  const point = (x, y) => cellKey(x, y) === startKey ? start : cellKey(x, y) === goalKey ? end : { x: (x + .5) * map.tile, y: (y + .5) * map.tile };
  while (queue.length) {
    // AI searches must not monopolize a frame when a target is inaccessible.
    if(visited.size >= (profile.maxPathNodes ?? 30000)) return [];
    const { x, y } = queue.pop(), currentKey = cellKey(x, y);
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    if (x === ex && y === ey) {
      const result = []; let key = cellKey(x, y);
      while (parents.get(key) !== null) {
        const [cx, cy] = key.split(',').map(Number);
        result.push(point(cx, cy)); key = parents.get(key);
      }
      result.reverse();
      // String-pull only across a swept body, never merely a center-line ray.
      const smooth = []; let anchor = start, index = 0;
      while (index < result.length) {
        let furthest = index;
        for (let j = index + 1; j < result.length; j++) { if (clearSegment(map, anchor, result[j], radius, profile)) furthest = j; else break; }
        smooth.push({ ...result[furthest] }); anchor = result[furthest]; index = furthest + 1;
      }
      return smooth;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy, key = cellKey(nx, ny);
      if (visited.has(key) || !terrainPassable(map,nx,ny,profile)) continue;
      if (dx && dy && (!terrainPassable(map,nx,y,profile) || !terrainPassable(map,x,ny,profile))) continue;
      const from = point(x, y), to = point(nx, ny);
      if (!clearSegment(map, from, to, radius, profile)) continue;
      const nextCost = cost.get(currentKey) + distance(from, to);
      if (nextCost < (cost.get(key) ?? Infinity)) {
        cost.set(key, nextCost); parents.set(key, currentKey);
        queue.push({ x: nx, y: ny, score: nextCost + distance(to, end) });
      }
    }
  }
  return [];
}
export function findPathNearObstacle(map,start,end,radius=start.radius??11,profile=start.navigation||{}){
  const direct=findPath(map,start,end,radius,profile);
  if(direct.length||!Number.isFinite(end.x)||!Number.isFinite(end.y))return direct;
  const cx=Math.floor(end.x/map.tile),cy=Math.floor(end.y/map.tile);
  // Water and other impassable terrain are not structure clicks.
  if(!terrainPassable(map,cx,cy,profile))return [];
  const candidates=[],seen=new Set(),margin=radius+.01;
  for(let ring=0;ring<=7;ring++)for(let y=cy-ring;y<=cy+ring;y++)for(let x=cx-ring;x<=cx+ring;x++){
    if(Math.max(Math.abs(x-cx),Math.abs(y-cy))!==ring||!terrainPassable(map,x,y,profile))continue;
    const left=x*map.tile+margin,right=(x+1)*map.tile-margin,top=y*map.tile+margin,bottom=(y+1)*map.tile-margin;
    if(left>right||top>bottom)continue;
    for(const point of [{x:Math.max(left,Math.min(right,end.x)),y:Math.max(top,Math.min(bottom,end.y))},{x:(x+.5)*map.tile,y:(y+.5)*map.tile}]){
      const key=`${point.x},${point.y}`;
      if(seen.has(key)||!walkable(map,point.x,point.y,radius,profile))continue;
      seen.add(key);candidates.push({point,score:distance(point,end),travel:distance(point,start)});
    }
  }
  candidates.sort((a,b)=>a.score-b.score||a.travel-b.travel);
  for(const candidate of candidates.slice(0,32)){
    const path=findPath(map,start,candidate.point,radius,profile);
    if(path.length)return path;
  }
  return [];
}
export function lineOfSight(map, a, b) {
  const n = Math.ceil(distance(a, b) / 8);
  for (let i = 1; i <= n; i++) if (!walkable(map, a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, 0)) return false;
  return true;
}
export function followPath(entity, dt, map, movementMultiplier=1) {
  let budget = entity.speed * movementMultiplier * (entity.running?1.5:1) * (entity.buffs||[]).reduce((value,b)=>value*(b.speedMultiplier||1),1) * dt;
  entity.moving = false;
  while (entity.path.length && budget > 0) {
    const next = entity.path[0], d = distance(entity, next);
    if (d < .1) { entity.path.shift(); continue; }
    const step = Math.min(budget, d), x = entity.x + (next.x - entity.x) / d * step, y = entity.y + (next.y - entity.y) / d * step;
    if (!clearSegment(map, entity, { x, y }, entity.radius, entity.navigation || {})) {
      entity.path = findPath(map, entity, entity.path.at(-1));
      break;
    }
    entity.facing = { x: (next.x - entity.x) / d, y: (next.y - entity.y) / d };
    entity.x = x; entity.y = y; entity.moving = true; budget -= step;
    if (step === d) entity.path.shift();
  }
}
