import {PoiDefinitions} from './world-definition.js';
export const CITY_SAFE_ZONES=PoiDefinitions.filter(p=>p.kind==='village').map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,radius:370}));
export function cityAt(point,scene='world'){if(scene&&scene!=='world')return null;return CITY_SAFE_ZONES.find(z=>Math.hypot(point.x-z.x,point.y-z.y)<=z.radius)||null;}
export const inCity=(point,scene='world')=>!!cityAt(point,scene);
export const safePlayer=p=>!p||((p.scene&&p.scene!=='world')?true:inCity(p,'world'));
export const CITY_HEAL_PER_SECOND=.15;
