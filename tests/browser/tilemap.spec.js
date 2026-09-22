import {test,expect} from '@playwright/test';
async function enter(page){await page.goto('/');await page.locator('#start').click();await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js');const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...a){draw.apply(this,a);window.qa=this;};});await page.waitForFunction(()=>window.qa);}
test('mouse route crosses the village bridge without a freeze or detached selection ring',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await page.evaluate(()=>{const r=window.qa;Object.assign(r.sim.player,{x:752,y:560,path:[],hp:100000,maxHp:100000});r.camera={x:752,y:560};});
 for(const x of [1008,752,1008]){
  const point=await page.evaluate(x=>{const r=window.qa;return {x:(x-r.camera.x)*r.zoom+r.width/2,y:(560-r.camera.y)*r.zoom+r.height/2};},x);
  await page.mouse.click(point.x,point.y);
  await expect.poll(()=>page.evaluate(x=>Math.abs(window.qa.sim.player.x-x),x),{timeout:10000}).toBeLessThan(3);
 }
 expect(await page.locator('.player-sprite').evaluate(e=>getComputedStyle(e,'::after').content)).toBe('none');
 expect(errors).toEqual([]);await page.screenshot({path:'docs/bridge-fixed.png'});
});
test('raster world animates water, exposes debug and enters houses through F',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await expect.poll(()=>page.locator('#world .tile-sector img').evaluateAll(imgs=>imgs.length>0&&imgs.every(i=>i.complete&&i.naturalWidth>0)),{timeout:30000}).toBe(true);
 expect(await page.locator('canvas').count()).toBe(0);
 const frame=()=>page.locator('#world .tile-sector img').first().evaluate(e=>getComputedStyle(e).transform);
 const before=await frame();await expect.poll(frame).not.toBe(before);
 await page.keyboard.press('F3');await expect(page.locator('.debug-legend')).toBeVisible();await expect(page.locator('.debug-body').first()).toBeVisible();
 await page.evaluate(()=>{const s=window.qa.sim,d=s.map.interactions.find(i=>i.kind==='house');Object.assign(s.player,{x:d.x,y:d.y+10,path:[]});});
 await page.keyboard.press('f');await expect.poll(()=>page.evaluate(()=>Boolean(window.qa.sim.map.scene))).toBe(true);
 await expect.poll(()=>page.locator('#world .tile-sector img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),{timeout:30000}).toBe(true);
 await page.evaluate(()=>Object.assign(window.qa.sim.player,{x:288,y:410,path:[]}));await page.keyboard.press('f');await expect.poll(()=>page.evaluate(()=>Boolean(window.qa.sim.map.scene))).toBe(false);
 expect(errors).toEqual([]);
});
test('sprite depth changes across a tree and asset gallery loads actual PNGs',async({page})=>{
 await enter(page);
 const root=await page.evaluate(()=>{const r=window.qa,o=r.sim.map.objects.find(o=>o.kind==='tree');r.sim.enemies=[];Object.assign(r.sim.player,{x:o.x,y:o.y-30,path:[]});r.camera={x:o.x,y:o.y};return o.y;});
 await expect.poll(()=>page.locator('#world .player-sprite').evaluate(e=>Number(e.style.zIndex))).toBeLessThan(10000+root);
 await page.evaluate(y=>{window.qa.sim.player.y=y+30;},root);
 await expect.poll(()=>page.locator('#world .player-sprite').evaluate(e=>Number(e.style.zIndex))).toBeGreaterThan(10000+root);
 await page.goto('/art-library.html');await expect(page.locator('#tiles img')).toHaveCount(64);
 await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),{timeout:30000}).toBe(true);
 await expect(page.locator('#effects .effect')).toHaveCount(16);
});

