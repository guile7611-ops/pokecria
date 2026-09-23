import test from 'node:test';
import assert from 'node:assert/strict';
import {ABILITIES,CANONICAL_LEARNSETS,CREATURES,LEARNSETS,LEARNSET_PHASES,LEARNSET_SOURCES,SPECIES_LEVEL_LEARNSETS,XP_CURVE} from '../public/data.js';
import {LEVEL_LEARNSETS,LEVEL_LEARNSET_VERSIONS} from '../public/level-learnsets.js';
import {LEVEL_MOVE_METADATA} from '../public/level-move-metadata.js';
import {LEGENDS_ZA_AVAILABLE,LEGENDS_ZA_LEARNSETS,LEGENDS_ZA_MOVE_METADATA} from '../public/legends-za-data.js';
import {Simulation} from '../public/simulation.js';

const levelTo=(sim,level)=>{while(sim.player.level<level)sim.gainXP(XP_CURVE[sim.player.level]);};

test('Legends Z-A is the sole canonical level-up source',()=>{
 assert.deepEqual(Object.keys(LEGENDS_ZA_LEARNSETS).sort(),Object.keys(CREATURES).sort());
 assert.ok(LEGENDS_ZA_AVAILABLE.length>0);
 assert.equal(LEGENDS_ZA_MOVE_METADATA['flare-blitz'].type,'fire');
 assert.equal(LEGENDS_ZA_MOVE_METADATA['mud-shot'].type,'ground');
 assert.ok(CANONICAL_LEARNSETS.blaziken.some(row=>row.move==='brave-bird'&&row.ability==='braveBird'));
 assert.ok(CANONICAL_LEARNSETS.swampert.some(row=>row.move==='sludge-wave'&&row.ability==='sludgeWave'));
 for(const [id,rows] of Object.entries(LEARNSETS))for(const row of rows)assert.ok(ABILITIES[row.ability],`${id}: ${row.ability}`);
});

test('three audited phases cover every species with its own sourced level learnset',()=>{
 const roster=Object.keys(CREATURES).sort(),phased=LEARNSET_PHASES.flat();
 assert.deepEqual(LEARNSET_PHASES.map(batch=>batch.length),[52,52,52]);
 assert.deepEqual(phased.slice().sort(),roster);assert.equal(new Set(phased).size,roster.length);
 for(const id of roster){assert.ok(LEARNSET_SOURCES[id],id);assert.ok(SPECIES_LEVEL_LEARNSETS[id].length,id);for(const row of SPECIES_LEVEL_LEARNSETS[id])assert.ok(ABILITIES[row.ability],`${id}: ${row.move}`);}
});

test('old generic non-starter slots migrate to that species level-up moves',()=>{
 const generic=['neutralPulse','recover','impact','starBurst'];
 const sim=new Simulation('bulbasaur',{activePokemon:{id:'pidgey',name:'Pidgey',level:30,xp:0,hp:50,maxHp:50,knownMoves:[...generic],slots:[...generic],attributes:{},evolutionHistory:[]}});
 assert.equal(sim.player.moveLoadoutVersion,2);assert.ok(sim.player.knownMoves.includes('gust'));
 assert.equal(sim.player.knownMoves.some(id=>generic.includes(id)),false);
 assert.equal(sim.player.slots.some(id=>generic.includes(id)),false);
});

test('Torchic gains Z-A Flame Charge and Combusken later learns Blaze Kick',()=>{
 const sim=new Simulation('torchic');levelTo(sim,9);
 assert.ok(sim.player.knownMoves.includes('flameCharge'));
 levelTo(sim,44);
 assert.equal(sim.player.id,'blaziken');
 assert.ok(sim.player.knownMoves.includes('blazeKick'));
 assert.ok(sim.equipMove('blazeKick',2));
 sim.time=sim.player.evolutionUntil;
 const foe=sim.enemies[0];Object.assign(foe,{x:sim.player.x+25,y:sim.player.y,hp:500,maxHp:500,defense:0,state:'Idle',defeated:false});
 const before=foe.hp;
 assert.ok(sim.command({type:'cast',slot:2,x:foe.x,y:foe.y}));
 assert.ok(foe.hp<before);
 assert.equal(sim.events.filter(e=>e.type==='slash'&&e.vfx===ABILITIES.blazeKick.vfx).length,1);
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

test('a high-level evolved capture recovers its Z-A lineage of implemented level moves',()=>{
 const sim=new Simulation('torchic',{pc:[{captureId:'capture-blaziken',id:'blaziken',name:'Blaziken',level:60,xp:0,hp:500,maxHp:500,knownMoves:[],slots:[null,null,null,null],attributes:{},evolutionHistory:[]}]});
 assert.ok(sim.selectCaptured('capture-blaziken'));
 for(const move of ['ember','flameCharge','blazeKick','flareBlitz','braveBird'])assert.ok(sim.player.knownMoves.includes(move),move);
 assert.equal(sim.player.level,60);
});

test('learning a move early does not unlock the third or fourth shortcut early',()=>{
 const sim=new Simulation('torchic');levelTo(sim,9);
 assert.ok(sim.player.knownMoves.includes('flameCharge'));
 assert.equal(sim.equipMove('flameCharge',2),false);
 levelTo(sim,10);assert.ok(sim.equipMove('flameCharge',2));
 assert.equal(sim.equipMove('flameCharge',3),false);
 levelTo(sim,25);assert.ok(sim.equipMove('flameCharge',3));
});

