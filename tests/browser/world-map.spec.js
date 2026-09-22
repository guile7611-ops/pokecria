import { test, expect } from '@playwright/test';
async function enter(page){await page.goto('/');await page.locator('#start').click();await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js');const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...args){draw.apply(this,args);window.testRenderer=this;};});await page.waitForFunction(()=>window.testRenderer);}
test('world atlas zooms and pans actual world coordinates, selects regions and closes cleanly',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await page.keyboard.press('m');await expect(page.locator('.minimap')).toHaveClass(/map-expanded/);
 const before=await page.evaluate(()=>({zoom:window.testRenderer.mapController.zoom,x:window.testRenderer.sim.player.x,gameZoom:window.testRenderer.zoom}));
 const box=await page.locator('#minimap').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,-450);
 await expect.poll(()=>page.evaluate(()=>window.testRenderer.mapController.zoom)).toBeGreaterThan(before.zoom);
 const center=await page.evaluate(()=>window.testRenderer.mapController.x);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+80,box.y+box.height*.5+30,{steps:5});await page.mouse.up();
 expect(await page.evaluate(()=>window.testRenderer.mapController.x)).toBeLessThan(center);
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);await expect(page.locator('#map-selection')).not.toHaveText('Selecione uma região ou um lugar descoberto.');
 expect(await page.evaluate(()=>window.testRenderer.zoom)).toBe(before.gameZoom);
 await page.locator('#map-world').click();await page.locator('#map-fog').click();
 await page.waitForFunction(()=>Object.values(window.testRenderer.worldView.images).every(img=>img.naturalWidth>0));
 await page.screenshot({path:'docs/world-atlas.png'});
 const render=await page.evaluate(()=>({same:window.testRenderer.worldView.map===window.testRenderer.sim.map,canvasCount:document.querySelectorAll('#world canvas,#minimap canvas').length,sectorWidth:parseFloat(getComputedStyle(document.querySelector('.tile-sector')).width)}));expect(render.same).toBe(true);expect(render.canvasCount).toBe(0);expect(render.sectorWidth).toBe(768);
 await page.keyboard.press('m');await expect(page.locator('.minimap')).not.toHaveClass(/map-expanded/);
 await page.screenshot({path:'docs/world-village.png'});expect(errors).toEqual([]);
});
test('seed regeneration preserves Pokémon progression and saves discovery',async({page})=>{
 await enter(page);await page.evaluate(()=>window.testRenderer.sim.gainXP(45));await page.keyboard.press('m');await page.locator('#world-seed').fill('98765');await page.locator('#world-regenerate').click();
 await expect.poll(()=>page.evaluate(()=>window.testRenderer.sim.map.seed)).toBe(98765);expect(await page.evaluate(()=>window.testRenderer.sim.player.level)).toBe(2);
 await page.locator('#world-save').click();await page.reload();await page.locator('#start').click();await page.keyboard.press('m');await expect(page.locator('#world-seed')).toHaveValue('98765');
});
test('camera zoom slider preserves movement and atlas retains player focus control',async({page})=>{
 await enter(page);await expect(page.locator('.camera-controls')).toBeVisible();
 const start=await page.evaluate(()=>({x:window.testRenderer.sim.player.x,y:window.testRenderer.sim.player.y}));
 await page.locator('#camera-zoom').fill('0.55');await expect.poll(()=>page.evaluate(()=>window.testRenderer.zoom)).toBe(.55);
 await page.evaluate(()=>document.activeElement.blur());await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');
 await expect.poll(()=>page.evaluate(p=>window.testRenderer.sim.player.x>p.x,start)).toBeTruthy();
 await page.locator('#camera-zoom').fill('2.2');await expect.poll(()=>page.evaluate(()=>window.testRenderer.zoom)).toBe(2.2);
 await page.keyboard.press('m');await page.locator('#map-player').click();expect(await page.evaluate(()=>window.testRenderer.mapController.follow)).toBe(true);
});
test('nearby boss uses its Pokémon sprite on the minimap',async({page})=>{
 await enter(page);await page.evaluate(()=>{const r=window.testRenderer,b=r.sim.enemies.find(e=>e.isBoss);Object.assign(r.sim.player,{x:b.x-120,y:b.y});r.sim.discovery.reveal(r.sim.player);r.mapController.lastDraw=0;r.mapController.draw();});
 await expect(page.locator('#minimap .map-boss img')).toHaveAttribute('src',/\/assets\/pokemon\/.+\/portrait\.png/);
 await expect(page.locator('#minimap .map-boss small')).toContainText('Nv.');
});
