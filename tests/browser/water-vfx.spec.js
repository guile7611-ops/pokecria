import {test,expect} from '@playwright/test';

test('Surf expands as a field while Muddy Water travels as a layered current',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('aurora-credentials',JSON.stringify({username:'qa_water',salt:[],digest:''}));localStorage.setItem('aurora-account',JSON.stringify({createdAt:Date.now(),starterId:'mudkip',nick:'QA Água'}));sessionStorage.setItem('aurora-auth','qa_water');});
 await page.goto('/');await page.locator('#start').click();
 await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js'),draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...args){draw.apply(this,args);window.qa=this;};});
 await page.waitForFunction(()=>window.qa);
 await page.evaluate(()=>{const r=window.qa,s=r.sim,p=s.player;Object.assign(p,{x:820,y:610,path:[],hp:9999,maxHp:9999});r.camera={x:p.x,y:p.y};r.effects.push({type:'area',ability:'surf',x:p.x+155,y:p.y-55,time:s.time,size:290,duration:20});r.networkEffects.push({from:'qa-remote',ability:'muddyWater',behavior:'wave',vfx:'moves/muddyWater',x:p.x-245,y:p.y+100,aimX:p.x+135,aimY:p.y+100,time:s.time,duration:20,size:154,trail:3});});
 await expect.poll(()=>page.locator('.world-sprite').evaluateAll(nodes=>nodes.map(node=>node.style.backgroundImage).filter(value=>value.includes('surfPool')).length)).toBeGreaterThan(0);
 await expect.poll(()=>page.locator('.world-sprite').evaluateAll(nodes=>nodes.map(node=>node.style.backgroundImage).filter(value=>value.includes('muddyCurrent')).length)).toBeGreaterThan(1);
 for(const asset of ['surfPool','surf','muddyCurrent','muddyWater'])expect(await page.evaluate(asset=>fetch(`/assets/sprites/vfx/moves/${asset}.png`).then(response=>response.ok),asset)).toBe(true);
 await page.waitForTimeout(250);
 await page.screenshot({path:'docs/water-moves-new.png'});
});
