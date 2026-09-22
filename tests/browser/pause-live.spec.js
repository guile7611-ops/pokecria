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
  const hpBefore=await page.evaluate(()=>{const sim=window.liveSimulation,p=sim.player,e=sim.enemies.find(enemy=>!enemy.isBoss);p.hp=p.maxHp=999;Object.assign(e,{x:p.x+22,y:p.y,home:{x:p.x+22,y:p.y},state:'Idle',aggro:155,chaseRange:400,range:40,cooldown:0,timer:0,path:[]});return p.hp;});
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-screen')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.liveSimulation.player.hp)).toBeLessThan(hpBefore);
  const pauseTime=await page.evaluate(()=>window.liveSimulation.time);
  await expect.poll(()=>page.evaluate(()=>window.liveSimulation.time)).toBeGreaterThan(pauseTime+.25);
  await page.locator('#change-starter').click();
  await expect(page.locator('#welcome')).toBeVisible();
  const hubTime=await page.evaluate(()=>window.liveSimulation.time);
  await expect.poll(()=>page.evaluate(()=>window.liveSimulation.time)).toBeGreaterThan(hubTime+.25);
});
