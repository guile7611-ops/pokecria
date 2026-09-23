import {test,expect} from '@playwright/test';

test('fire gallery shows every current fire move with three animation phases',async({page})=>{
 await page.goto('/attack-effects.html?type=Fire');
 await expect(page.locator('#count')).toContainText('21 golpes exibidos');
 const inferno=page.locator('.card').filter({hasText:'Inferno'});
 await expect(inferno).toBeVisible();
 await expect(inferno.locator('.impact')).toHaveCSS('background-image',/moves\/inferno\.png/);
 await expect(page.locator('.card').filter({hasText:'Lança-chamas'}).locator('.travel')).toHaveCSS('background-image',/moves\/flamethrower\.png/);
 await page.locator('#type').selectOption('all');
 await expect(page.locator('#count')).toContainText('360 golpes exibidos');
});

test('water and grass galleries show distinct sprites and base damage',async({page})=>{
 await page.goto('/attack-effects.html?type=Water');
 await expect(page.locator('.card').filter({hasText:'Pulso d’água'}).locator('.travel')).toHaveCSS('background-image',/moves\/waterPulse\.png/);
 await expect(page.locator('.card').filter({hasText:'Onda d’Água'}).locator('.travel')).toHaveCSS('background-image',/pmd\/0251\.png/);
 await expect(page.locator('.card').filter({hasText:'Pulso d’água'}).locator('.power')).toContainText('Dano base:');
 await page.locator('#type').selectOption('Grass');
 await expect(page.locator('.card').filter({hasText:'Semente solar'}).locator('.travel')).toHaveCSS('background-image',/pmd\/0145\.png/);
 await expect(page.locator('.card').filter({hasText:'Bola de Energia'}).locator('.travel')).toHaveCSS('background-image',/moves\/energyBall\.png/);
});
