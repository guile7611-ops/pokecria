import {test,expect} from '@playwright/test';

test('opening pause and the hub keeps the world simulation running',async({page})=>{
  await page.goto('/');
  await page.locator('#auth-user').fill(`pause${Date.now()}`);
  await page.locator('#auth-password').fill('senha12345');
  await page.locator('#auth-submit').click();
  await page.locator('#trainer-nick').fill('Explorador');
  await page.locator('[data-egg="0"]').click();
  await page.evaluate(async()=>{
    const {Renderer}=await import('/renderer.js');
    const draw=Renderer.prototype.draw;
    Renderer.prototype.draw=function(...args){draw.apply(this,args);window.liveSimulation=this.sim;};
  });
  await page.locator('#start').click();
  await page.waitForFunction(()=>window.liveSimulation?.time>0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-screen')).toBeVisible();
  const pauseTime=await page.evaluate(()=>window.liveSimulation.time);
  await expect.poll(()=>page.evaluate(()=>window.liveSimulation.time)).toBeGreaterThan(pauseTime+.25);
  await page.locator('#change-starter').click();
  await expect(page.locator('#welcome')).toBeVisible();
  const hubTime=await page.evaluate(()=>window.liveSimulation.time);
  await expect.poll(()=>page.evaluate(()=>window.liveSimulation.time)).toBeGreaterThan(hubTime+.25);
});
