import {test,expect} from '@playwright/test';
test('wild labels show levels and loot appears in persistent backpack',async({page})=>{
 await page.goto('/');await page.locator('#auth-user').fill('mochila_teste');await page.locator('#auth-password').fill('senha12345');await page.locator('#auth-submit').click();await page.locator('#trainer-nick').fill('Teste');await page.locator('[data-egg="0"]').click();await page.locator('#start').click();
 await page.evaluate(async()=>{const {Renderer}=await import('/renderer.js');const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(...a){draw.apply(this,a);window.bagQA=this;};});await page.waitForFunction(()=>window.bagQA);
 await expect(page.locator('#world .creature-sprite .sprite-name').first()).toContainText('Nv.');
 const loot=await page.evaluate(()=>{const s=window.bagQA.sim,e=s.enemies.find(enemy=>!enemy.isBoss&&enemy.state!=='Dead');e.dropChance=1;s.damage(e,99999);return {item:e.drop,count:e.dropCount,money:s.inventory.money};});
 await page.keyboard.press('b');await expect(page.locator('#bag')).toBeVisible();await expect(page.locator('#bag-money')).toContainText(String(loot.money));await expect(page.locator('#bag-items')).toContainText(loot.item);await expect(page.locator('#bag-items')).toContainText('× '+loot.count);
 await page.screenshot({path:'docs/inventory.png'});await page.locator('#bag-close').click();await page.reload();await page.locator('#start').click();await page.keyboard.press('b');await expect(page.locator('#bag-items')).toContainText(loot.item);await expect(page.locator('#bag-money')).toContainText(String(loot.money));
});
