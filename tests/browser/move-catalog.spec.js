import {test,expect} from '@playwright/test';

test('the move repertoire shows individual animated previews without equipping locked moves',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#auth-user').fill('repertorio');await page.locator('#auth-password').fill('senha12345');await page.locator('#auth-submit').click();
 await page.locator('#trainer-nick').fill('Colecionador');await page.locator('[data-egg="0"]').click();const joined=page.waitForResponse(response=>response.url().endsWith('/api/online/join'));await page.locator('#start').click();const token=(await (await joined).json()).token;
 await page.locator('#info-open').click();
 const catalog=page.locator('.move-catalog');await expect(catalog).toContainText('24 GOLPES');
 await catalog.locator('summary').click();await expect(catalog.locator('.move-catalog-grid article')).toHaveCount(24);
 await expect(catalog).toContainText('Terremoto');await expect(catalog).toContainText('Surfar');
 const visual=catalog.locator('.move-preview').first();await expect(visual).toHaveCSS('background-image',/vfx\/pmd\/0019\.png/);
 const response=await page.request.get('/assets/sprites/vfx/pmd/0019.png');expect(response.ok()).toBeTruthy();
 await expect(page.locator('[data-move="thunderbolt"]')).toHaveCount(0);
 expect(errors).toEqual([]);
 await page.request.post('/api/online/leave',{headers:{'x-verdant-session':token},data:{}});
});
