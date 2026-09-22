export function setRemoteTarget(entity,player,now){
  const next={x:player.x,y:player.y};
  if(!Number.isFinite(next.x)||!Number.isFinite(next.y))return;
  const teleport=entity.scene!==player.scene||entity.hp<=0&&player.hp>0;
  if(teleport){Object.assign(entity,{x:next.x,y:next.y,targetX:next.x,targetY:next.y,velocityX:0,velocityY:0,networkAt:now});return;}
  const dx=next.x-entity.targetX,dy=next.y-entity.targetY;
  if(Math.hypot(dx,dy)>.05){
    const elapsed=Math.max(.05,Math.min(.5,(now-(entity.networkAt??now))/1000));
    entity.velocityX=player.moving?Math.max(-260,Math.min(260,dx/elapsed)):0;
    entity.velocityY=player.moving?Math.max(-260,Math.min(260,dy/elapsed)):0;
    entity.targetX=next.x;entity.targetY=next.y;entity.networkAt=now;
  }else if(!player.moving){entity.velocityX=0;entity.velocityY=0;entity.networkAt=now;}
}

export function advanceRemote(entity,dt,now){
  if(!Number.isFinite(entity.targetX)||!Number.isFinite(entity.targetY))return;
  const age=Math.max(0,Math.min(.2,(now-(entity.networkAt??now))/1000));
  const x=entity.targetX+(entity.velocityX||0)*age,y=entity.targetY+(entity.velocityY||0)*age;
  const blend=1-Math.exp(-Math.max(0,dt)*14);
  const dx=x-entity.x,dy=y-entity.y,d=Math.hypot(dx,dy);
  const speed=Math.min(620,Math.max(200,Math.hypot(entity.velocityX||0,entity.velocityY||0)*1.25+d*1.5));
  const step=Math.min(d*blend,speed*Math.min(Math.max(0,dt),.05));
  if(d>0){entity.x+=dx/d*step;entity.y+=dy/d*step;}
  if(Math.hypot(x-entity.x,y-entity.y)<.2){entity.x=x;entity.y=y;}
}
