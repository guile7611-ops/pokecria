import test from 'node:test';
import assert from 'node:assert/strict';
import {ABILITIES,CANONICAL_LEARNSETS,CREATURES,LEARNSETS,XP_CURVE} from '../public/data.js';
import {LEVEL_LEARNSETS_GEN9} from '../public/level-learnsets-gen9.js';
import {LEVEL_MOVE_METADATA_GEN9} from '../public/level-move-metadata-gen9.js';
import {Simulation} from '../public/simulation.js';

const levelTo=(sim,level)=>{while(sim.player.level<level)sim.gainXP(XP_CURVE[sim.player.level]);};

test('Gen 9 level tables cover every playable species and retain move types beyond its own',()=>{
 assert.deepEqual(Object.keys(LEVEL_LEARNSETS_GEN9).sort(),Object.keys(CREATURES).sort());
 assert.deepEqual(Object.keys(LEVEL_MOVE_METADATA_GEN9).sort(),[...new Set(Object.values(LEVEL_LEARNSETS_GEN9).flat().map(row=>row.move))].sort());
 assert.equal(LEVEL_MOVE_METADATA_GEN9['double-kick'].type,'fighting');
 assert.equal(LEVEL_MOVE_METADATA_GEN9['mud-shot'].type,'ground');
 assert.ok(CANONICAL_LEARNSETS.blaziken.some(row=>row.move==='double-kick'&&row.ability==='doubleKick'));
 assert.ok(CANONICAL_LEARNSETS.swampert.some(row=>row.move==='mud-shot'&&row.ability==='mudShot'));
 for(const [id,rows] of Object.entries(LEARNSETS))for(const row of rows)assert.ok(ABILITIES[row.ability],`${id}: ${row.ability}`);
});

test('Torchic gains canonical Flame Charge, then Combusken learns Fighting Double Kick',()=>{
 const sim=new Simulation('torchic');levelTo(sim,9);
 assert.ok(sim.player.knownMoves.includes('flameCharge'));
 levelTo(sim,16);
 assert.equal(sim.player.id,'combusken');
 assert.ok(sim.player.knownMoves.includes('doubleKick'));
 assert.ok(sim.equipMove('doubleKick',2));
 sim.time=sim.player.evolutionUntil;
 const foe=sim.enemies[0];Object.assign(foe,{x:sim.player.x+25,y:sim.player.y,hp:500,maxHp:500,defense:0,state:'Idle',defeated:false});
 const before=foe.hp;
 assert.ok(sim.command({type:'cast',slot:2,x:foe.x,y:foe.y}));
 assert.ok(foe.hp<before);
 assert.equal(sim.events.filter(e=>e.type==='slash'&&e.vfx===ABILITIES.doubleKick.vfx).length,2);
});

test('Mud Shot joins the learned moves after evolving to Marshtomp and slows on impact',()=>{
 const sim=new Simulation('mudkip');levelTo(sim,16);
 assert.equal(sim.player.id,'marshtomp');
 assert.ok(sim.player.knownMoves.includes('mudShot'));
 assert.ok(sim.equipMove('mudShot',2));
 sim.time=sim.player.evolutionUntil;
 const foe=sim.enemies[0];Object.assign(foe,{x:sim.player.x+36,y:sim.player.y,hp:500,maxHp:500,defense:0,state:'Idle',defeated:false});
 assert.ok(sim.command({type:'cast',slot:2,x:foe.x,y:foe.y}));
 for(let i=0;i<8;i++)sim.step(.025);
 assert.ok(foe.hp<500);
 assert.ok(foe.slowUntil>sim.time);
});

test('Take Down recoils while Absorb heals only from damage dealt',()=>{
 const sim=new Simulation('mudkip');
 const foe=sim.enemies[0];Object.assign(foe,{x:sim.player.x+28,y:sim.player.y,hp:500,maxHp:500,defense:0,state:'Idle',defeated:false});
 sim.player.hp=sim.player.maxHp;
 assert.ok(sim.cast(ABILITIES.takeDown,{x:foe.x,y:foe.y}));
 assert.ok(foe.hp<500);
 assert.ok(sim.player.hp<sim.player.maxHp);
 sim.time+=ABILITIES.absorb.cooldown;
 assert.ok(sim.cast(ABILITIES.absorb,{x:foe.x,y:foe.y}));
 for(let i=0;i<8;i++)sim.step(.025);
 assert.ok(sim.player.hp>sim.player.maxHp-10);
});

test('a high-level evolved capture recovers its whole lineage of implemented level moves',()=>{
 const sim=new Simulation('torchic',{pc:[{captureId:'capture-blaziken',id:'blaziken',name:'Blaziken',level:43,xp:0,hp:500,maxHp:500,knownMoves:[],slots:[null,null,null,null],attributes:{},evolutionHistory:[]}]});
 assert.ok(sim.selectCaptured('capture-blaziken'));
 for(const move of ['ember','flameCharge','doubleKick','blazeKick'])assert.ok(sim.player.knownMoves.includes(move),move);
 assert.equal(sim.player.level,43);
});

test('learning a move early does not unlock the third or fourth shortcut early',()=>{
 const sim=new Simulation('torchic');levelTo(sim,9);
 assert.ok(sim.player.knownMoves.includes('flameCharge'));
 assert.equal(sim.equipMove('flameCharge',2),false);
 levelTo(sim,10);assert.ok(sim.equipMove('flameCharge',2));
 assert.equal(sim.equipMove('flameCharge',3),false);
 levelTo(sim,25);assert.ok(sim.equipMove('flameCharge',3));
});
