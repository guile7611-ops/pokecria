import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../public/simulation.js';
import {collidersIn} from '../public/collisions.js';
import {walkable} from '../public/world.js';

test('Charizard guards use only species authored for the volcanic region',()=>{
  const sim=new Simulation(),boss=sim.enemies.find(enemy=>enemy.isBoss&&enemy.id==='charizard');
  const guards=sim.enemies.filter(enemy=>enemy.bossUid===boss.uid);
  const volcanicSpecies=new Set(sim.map.regions.find(region=>region.id==='vulcao').species);
  assert.equal(guards.length,6);
  assert.ok(guards.every(enemy=>volcanicSpecies.has(enemy.id)));
  assert.ok(guards.every(enemy=>!enemy.element.includes('Grass')&&!enemy.element.includes('Grama')));
  assert.equal(sim.map.spawns.length,0,'ordinary volcanic encounters are created dynamically');
});

test('magma rocks are solid objects for player and creature navigation',()=>{
  const sim=new Simulation(),rocks=sim.map.objects.filter(object=>object.kind==='lava');
  assert.ok(rocks.length>0);
  for(const rock of rocks.slice(0,20)){
    const center={x:rock.x,y:rock.y-17};
    assert.ok([...collidersIn(sim.map,center.x-1,center.y-1,center.x+1,center.y+1)].some(collider=>collider.id===rock.uid));
    assert.equal(walkable(sim.map,center.x,center.y,11),false);
  }
});
