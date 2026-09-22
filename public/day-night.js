// One shared wall-clock cycle keeps every online client in the same phase.
export const DAY_LENGTH_MS=24*60*1000;
export const NIGHT_SPECIES=new Set(['hoothoot','noctowl','murkrow','honchkrow','spinarak','ariados','gastly','haunter','gengar','zubat','golbat','crobat','houndour','houndoom']);

export function worldDaylight(now=Date.now()){
 const phase=((now%DAY_LENGTH_MS)+DAY_LENGTH_MS)%DAY_LENGTH_MS/DAY_LENGTH_MS;
 const hour=(6+phase*24)%24;
 // A short dawn and dusk soften the transition without affecting spawn rules.
 const darkness=hour>=18?Math.min(1,(hour-18)/1.5):hour<6?1:hour<7.5?Math.max(0,(7.5-hour)/1.5):0;
 return {hour,isNight:hour>=18||hour<6,darkness};
}

export function nightVision(daylight,viewportWidth,viewportHeight,indoors=false){
 const strength=indoors?0:Math.max(0,Math.min(1,daylight.darkness||0)),shortSide=Math.max(320,Math.min(viewportWidth||0,viewportHeight||0));
 return {strength,innerRadius:Math.round(shortSide*(.38-.23*strength)),outerRadius:Math.round(shortSide*(.76-.33*strength))};
}

export function spawnAvailable(spawn,now=Date.now()){
 return spawn.time!=='night'||worldDaylight(now).isNight;
}
