import {test,expect} from '@playwright/test';

test('fire gallery shows all eight attacks with the animated Inferno sheet',async({page})=>{
 await page.goto('/attack-effects.html?type=Fire');
 await expect(page.locator('#count')).toContainText('8 golpes exibidos');
 const inferno=page.locator('.card').filter({hasText:'Inferno'});
 await expect(inferno).toBeVisible();
 await expect(inferno.locator('.sprite')).toHaveCSS('background-image',/pmd\/0028\.png/);
 await expect(page.locator('.card').filter({hasText:'Lança-chamas'}).locator('.sprite')).toHaveCSS('background-image',/pmd\/0016\.png/);
 await page.locator('#type').selectOption('all');
 await expect(page.locator('#count')).toContainText('61 golpes exibidos');
});

test('water and grass galleries show distinct sprites and base damage',async({page})=>{
 await page.goto('/attack-effects.html?type=Water');
 await expect(page.locator('.card').filter({hasText:'Pulso d’água'}).locator('.sprite')).toHaveCSS('background-image',/pmd\/0081\.png/);
 await expect(page.locator('.card').filter({hasText:'Onda d’Água'}).locator('.sprite')).toHaveCSS('background-image',/pmd\/0251\.png/);
 await expect(page.locator('.card').filter({hasText:'Pulso d’água'}).locator('.power')).toContainText('Dano base:');
 await page.locator('#type').selectOption('Grass');
 await expect(page.locator('.card').filter({hasText:'Semente solar'}).locator('.sprite')).toHaveCSS('background-image',/pmd\/0145\.png/);
 await expect(page.locator('.card').filter({hasText:'Bola de Energia'}).locator('.sprite')).toHaveCSS('background-image',/pmd\/0067\.png/);
});
