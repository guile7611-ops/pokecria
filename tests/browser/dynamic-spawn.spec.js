import {test,expect} from '@playwright/test';

async function enter(page){
 await page.addInitScript(()=>{
  localStorage.setItem('aurora-credentials',JSON.stringify({username:'qa_spawn',salt:[],digest:''}));
  localStorage.setItem('aurora-account',JSON.stringify({createdAt:Date.now(),starterId:'bulbasaur',nick:'Spawn QA'}));
  sessionStorage.setItem('aurora-auth','qa_spawn');
 });
 await page.goto('/');
 await page.locator('#start').click();
 await page.evaluate(async()=>{
  const {Renderer}=await import('/renderer.js');
  const draw=Renderer.prototype.draw;
  Renderer.prototype.draw=function(...args){draw.apply(this,args);window.spawnRenderer=this;};
 });
 await page.waitForFunction(()=>window.spawnRenderer);
}

test('player-centred wild population reaches its cap and renders cached PMD icons',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await enter(page);
 const result=await page.evaluate(()=>{
  const renderer=window.spawnRenderer,sim=renderer.sim;
  for(let i=0;i<24;i++)sim.streamCreatures();
  const wild=sim.enemies.filter(enemy=>enemy.dynamicSpawn);
  const first=wild[0];
  Object.assign(sim.player,{x:first.x-120,y:first.y,path:[],target:null});
  renderer.camera={x:first.x,y:first.y};renderer.draw();
  return {
   count:wild.length,
   bosses:sim.enemies.filter(enemy=>enemy.isBoss).length,
   unique:new Set(wild.map(enemy=>`${enemy.x},${enemy.y}`)).size,
   nearest:Math.min(...wild.map(enemy=>Math.hypot(enemy.x-sim.player.x,enemy.y-sim.player.y))),
  };
 });
 expect(result.count).toBe(30);
 expect(result.unique).toBe(30);
 expect(result.bosses).toBeGreaterThan(0);
 await expect(page.locator('.creature-sprite:not(.boss-sprite) .sprite-icon img').first()).toHaveAttribute('src',/\/assets\/pokemon\/.+\/portrait\.png/);
 expect(errors).toEqual([]);
});
