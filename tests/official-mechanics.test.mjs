import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatedStats,ensureOfficialTraining,mapMovementSpeed,NATURES,officialDamage,STAT_KEYS} from '../public/official-mechanics.js';
import {OFFICIAL_POKEMON_DATA} from '../public/official-pokemon-data.js';

test('official data covers every playable species with six base stats and abilities',async()=>{
 const {CREATURES}=await import('../public/data.js');
 for(const id of Object.keys(CREATURES)){assert.ok(OFFICIAL_POKEMON_DATA[id],id);for(const stat of STAT_KEYS)assert.ok(OFFICIAL_POKEMON_DATA[id].baseStats[stat]>0,`${id}:${stat}`);assert.ok(OFFICIAL_POKEMON_DATA[id].abilities.length>0,id);}
});

test('official stat formula applies IV, EV and nature modifiers',()=>{
 const neutral=calculatedStats('mudkip',50,Object.fromEntries(STAT_KEYS.map(key=>[key,31])),{attack:252},'hardy');
 const adamant=calculatedStats('mudkip',50,Object.fromEntries(STAT_KEYS.map(key=>[key,31])),{attack:252},'adamant');
 assert.equal(neutral.hp,125);assert.equal(neutral.attack,122);assert.equal(adamant.attack,134);assert.ok(adamant.spAttack<neutral.spAttack);
});

test('training migration produces legal persistent IVs, EVs, nature and ability',()=>{
 const pokemon={id:'mudkip',captureId:'capture-1',attributes:{vitality:90,power:90,guard:90,agility:90}};ensureOfficialTraining(pokemon);
 assert.ok(NATURES[pokemon.nature]);assert.ok(OFFICIAL_POKEMON_DATA.mudkip.abilities.some(row=>row.id===pokemon.ability));assert.ok(STAT_KEYS.every(key=>pokemon.ivs[key]>=0&&pokemon.ivs[key]<=31&&pokemon.evs[key]>=0&&pokemon.evs[key]<=252));assert.ok(STAT_KEYS.reduce((sum,key)=>sum+pokemon.evs[key],0)<=510);
});

test('Speed increases map walking through a bounded curve and immunities deal zero',()=>{
 assert.ok(mapMovementSpeed(120)>mapMovementSpeed(40));assert.ok(mapMovementSpeed(9999)<=142);assert.equal(officialDamage({level:50,power:100,attack:100,defense:100,effectiveness:0}),0);
});
