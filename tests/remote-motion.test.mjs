import test from 'node:test';
import assert from 'node:assert/strict';
import {setRemoteTarget,advanceRemote} from '../public/remote-motion.js';
import {Renderer} from '../public/renderer.js';

test('remote movement advances between network updates and snaps only on respawn',()=>{
 const remote={x:100,y:100,targetX:100,targetY:100,velocityX:0,velocityY:0,networkAt:1000,scene:'world',hp:100};
 setRemoteTarget(remote,{x:116,y:100,scene:'world',hp:100,moving:true},1160);
 const positions=[];
 for(let time=1176;time<=1296;time+=16){advanceRemote(remote,.016,time);positions.push(remote.x);}
 assert.ok(positions.every((x,index)=>index===0||x>positions[index-1]));
 assert.ok(remote.x>116,'prediction should carry motion beyond the latest packet');
 setRemoteTarget(remote,{x:950,y:100,scene:'world',hp:100,moving:false},1320);
 assert.equal(remote.x,950);
 remote.hp=0;
 setRemoteTarget(remote,{x:240,y:560,scene:'world',hp:100,moving:false},1480);
 assert.deepEqual([remote.x,remote.y],[240,560]);
});

test('defeated remote players disappear, and local faint animation ends before respawn',()=>{
 const renderer={sim:{time:10}};
 assert.equal(Renderer.prototype.actor.call(renderer,{remote:true,hp:0,state:'Idle'},false),null);
 assert.equal(Renderer.prototype.actor.call(renderer,{dead:true,deathStart:9,hp:0},true),null);
});
