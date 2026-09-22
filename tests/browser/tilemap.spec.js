import {test,expect} from '@playwright/test';
async function enter(page){await page.addInitScript(()=>{localStorage.setItem('aurora-credentials',JSON.stringify({username:'qa_teste',salt:[],digest:''}));localStorage.setItem('aurora-account',JSON.stringify({createdAt:Date.now(),starterId:'bulbasaur',nick:'QA'}));sessionStorage.setItem('aurora-auth','qa_teste');});await page.goto('/');await page.locator('#start').click();await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js');const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...a){draw.apply(this,a);window.qa=this;};});await page.waitForFunction(()=>window.qa);}
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
test('remote player renders smoothly beyond the bridge and disappears when defeated',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await enter(page);
 await page.evaluate(async()=>{const r=window.qa,{setRemoteTarget}=await import('/remote-motion.js');window.qaRemoteTarget=setRemoteTarget;r.remoteEntities.delete=()=>false;Object.assign(r.sim.player,{x:900,y:560,hp:100000,maxHp:100000,path:[]});r.camera={x:900,y:560};r.remoteEntities.set('friend',{uid:'remote-friend',id:'bulbasaur',name:'Amigo',x:752,y:560,targetX:752,targetY:560,networkAt:performance.now(),velocityX:0,velocityY:0,hp:100,maxHp:100,level:10,scene:'world',moving:true,facing:{x:1,y:0},remote:true,state:'Idle'});});
 await expect(page.locator('.remote-player')).toBeVisible();
 const positions=[];
 for(const x of [800,848,896,944,992,1040,1088]){
  await page.evaluate(x=>{const r=window.qa,e=r.remoteEntities.get('friend');window.qaRemoteTarget(e,{x,y:560,hp:100,scene:'world',moving:true},performance.now());},x);
  await page.waitForTimeout(180);
  positions.push(await page.evaluate(()=>window.qa.remoteEntities.get('friend').x));
  await expect(page.locator('.remote-player')).toBeVisible();
 }
 assertRemoteProgress(positions);
 await page.evaluate(()=>{window.qa.remoteEntities.get('friend').hp=0;});
 await expect(page.locator('.remote-player')).toHaveCount(0);
 await page.evaluate(()=>{const e=window.qa.remoteEntities.get('friend');window.qaRemoteTarget(e,{x:1000,y:560,hp:100,scene:'world',moving:false},performance.now());e.hp=100;});
 await expect(page.locator('.remote-player')).toBeVisible();
 expect(errors).toEqual([]);
});
function assertRemoteProgress(positions){expect(positions.every((x,index)=>index===0||x>positions[index-1])).toBe(true);expect(positions.at(-1)).toBeGreaterThan(1040);}
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

