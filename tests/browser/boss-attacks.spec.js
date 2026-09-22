import {test,expect} from '@playwright/test';
test('boss shows three warning shapes and three distinct raster attack animations',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#start').click();
 await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js');const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...a){draw.apply(this,a);window.bossQA=this;window.bossSeen ||= {};for(const id of ['slam','cleave','beam']){const warning=document.querySelector('.boss-telegraph-'+id),effect=document.querySelector('.boss-vfx-'+id);const seen=window.bossSeen[id] ||= {};if(warning)seen.warning=true;if(effect)seen.effect=effect.style.backgroundImage;}};});await page.waitForFunction(()=>window.bossQA);
 await page.evaluate(()=>{const r=window.bossQA,s=r.sim,b=s.boss;s.enemies=[b];Object.assign(s.player,{x:b.x-40,y:b.y,path:[],target:null,hp:100000,maxHp:100000});b.cooldown=0;b.attackIndex=0;r.camera={x:b.x,y:b.y};});
 const sources=[];
 for(const id of ['slam','cleave','beam']){
  await page.waitForFunction(id=>window.bossSeen?.[id]?.warning,id,{timeout:15000});
  await page.waitForFunction(id=>window.bossSeen?.[id]?.effect,id,{timeout:15000});
  sources.push(await page.evaluate(id=>window.bossSeen[id].effect,id));
  await page.screenshot({path:`docs/boss-${id}.png`});
 }
 expect(new Set(sources).size).toBe(3);expect(errors).toEqual([]);
});

