import { test, expect } from '@playwright/test';

test('two trainers meet, form a guild and see shared XP fill the bar', async ({ browser, request }) => {
  const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
  try{
    const pages=await Promise.all(contexts.map(c=>c.newPage()));
    const names=['LuaOnline','SolOnline'],tokens=[];
    for(let i=0;i<2;i++){
      const page=pages[i];await page.goto('/');
      await page.locator('#auth-user').fill(`online_${i}`);
      await page.locator('#auth-password').fill('senha12345');
      await page.locator('#auth-submit').click();
      await page.locator('#trainer-nick').fill(names[i]);
      await page.locator('[data-egg="0"]').click();
      const joined=page.waitForResponse(response=>response.url().endsWith('/api/online/join'));
      await page.locator('#start').click();
      tokens.push((await (await joined).json()).token);
    }
    await expect(pages[0].locator('.remote-player').filter({hasText:'SolOnline'}).locator('.sprite-name')).toContainText('SolOnline');
    await expect(pages[0].locator('.remote-player').filter({hasText:'SolOnline'}).locator('.sprite-hp')).toBeVisible();
    await expect(pages[0].locator('.player-sprite:not(.remote-player) .sprite-name')).toContainText('LuaOnline');
    await pages[0].locator('#info-open').click();
    await expect(pages[0].locator('.guild-section')).toContainText('SolOnline');
    await pages[0].locator('[data-guild-invite]').click();
    await pages[1].locator('#info-open').click();
    await expect(pages[1].locator('.guild-invite')).toContainText('LuaOnline');
    await pages[1].locator('[data-guild-reply="yes"]').click();
    await expect(pages[0].locator('.guild-section')).toContainText('Guilda com 2 membro(s)');
    await pages[1].locator('#info-close').click();
    const before=await pages[1].locator('#xp-fill').evaluate(el=>el.getBoundingClientRect().width);
    const send=(path,token)=>request.post(`/api/online/${path}`,{headers:{'x-verdant-session':token},data:{uid:987654,damage:8,xp:80}});
    await send('wild-hit',tokens[1]);await send('wild-hit',tokens[0]);await send('wild-kill',tokens[0]);
    await expect(pages[1].locator('#xp-text')).toContainText('40 / 45 XP');
    await expect.poll(()=>pages[1].locator('#xp-fill').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(before);
  }finally{await Promise.all(contexts.map(c=>c.close()));}
});

test('a remote skill sends its casting animation and projectile to another trainer', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('#auth-user').fill('spectator_online');
  await page.locator('#auth-password').fill('senha12345');
  await page.locator('#auth-submit').click();
  await page.locator('#trainer-nick').fill('Observador');
  await page.locator('[data-egg="0"]').click();
  const joined=page.waitForResponse(response=>response.url().endsWith('/api/online/join'));
  await page.locator('#start').click();
  const localToken=(await (await joined).json()).token;
  const join=await request.post('/api/online/join',{data:{nick:'Atacante',pokemon:'bulbasaur'}});
  const remote=await join.json();
  try{
    const remoteSprite=page.locator('.remote-player').filter({hasText:'Atacante'});await expect(remoteSprite).toBeVisible();
    const remoteBox=await remoteSprite.boundingBox();await page.mouse.move(remoteBox.x+remoteBox.width/2,remoteBox.y+remoteBox.height/2);
    await expect(page.locator('#world')).toHaveClass(/attack-cursor/);
    const startX=(await remoteSprite.boundingBox()).x;
    await request.post('/api/online/state',{headers:{'x-verdant-session':remote.token},data:{x:440,y:560,hp:100,maxHp:100,scene:'world',moving:true}});
    await expect.poll(async()=>(await remoteSprite.boundingBox()).x).toBeGreaterThan(startX+5);
    const midX=(await remoteSprite.boundingBox()).x;await page.waitForTimeout(60);
    expect((await remoteSprite.boundingBox()).x).toBeGreaterThan(midX);
    const animation=page.locator('.remote-player[data-animation="Shoot"]').filter({hasText:'Atacante'}).waitFor({state:'visible',timeout:3000});
    const projectile=page.locator('.world-sprite[style*="vfx/pmd/0129.png"]').first().waitFor({state:'visible',timeout:3000});
    const cast=await request.post('/api/online/skill',{headers:{'x-verdant-session':remote.token},data:{ability:'leaf',x:400,y:560}});
    expect(cast.ok()).toBeTruthy();
    await Promise.all([animation,projectile]);
    expect(await page.locator('.player-panel .meter.xp').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(10);
    await page.route('**/api/online/state',route=>route.abort());
    const state=(token,x)=>request.post('/api/online/state',{headers:{'x-verdant-session':token},data:{x,y:560,hp:100,maxHp:100,scene:'world'}});
    await state(localToken,930);await state(remote.token,900);
    await page.waitForTimeout(2500);
    const hit=await request.post('/api/online/skill',{headers:{'x-verdant-session':remote.token},data:{ability:'leaf',x:930,y:560}});
    expect((await hit.json()).victims.length).toBe(1);
    await expect(page.locator('#hp-text')).not.toHaveText('100 / 100');
  }finally{await request.post('/api/online/leave',{headers:{'x-verdant-session':remote.token},data:{}});}
});
