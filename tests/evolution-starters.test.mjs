import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {xpToLevel,nextEvolution} from '../public/progression.js';
const lines=[
 ['chikorita',16,'bayleef',32,'meganium'],['cyndaquil',14,'quilava',36,'typhlosion'],['totodile',18,'croconaw',30,'feraligatr'],
 ['treecko',16,'grovyle',36,'sceptile'],['torchic',16,'combusken',36,'blaziken'],['mudkip',16,'marshtomp',36,'swampert']
];
for(const [base,first,middle,second,final] of lines)test(`${base} evolves immediately at ${first} and ${second}`,()=>{
 const sim=new Simulation(base),p=sim.player;sim.gainXP(xpToLevel(p,first));assert.equal(p.level,first);assert.equal(p.id,middle);assert.ok(p.evolutionUntil>sim.time);assert.equal(sim.command({type:'move',x:p.x+30,y:p.y}),false);
 sim.time=p.evolutionUntil+.01;sim.gainXP(xpToLevel(p,second));assert.equal(p.level,second);assert.equal(p.id,final);assert.equal(nextEvolution(p.id),null);assert.deepEqual(p.evolutionHistory.map(e=>e.to),[middle,final]);
});
