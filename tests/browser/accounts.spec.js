import {test,expect} from '@playwright/test';

test('a player can replace a temporary local account with a new registration',async({page})=>{
 await page.goto('/');
 await page.locator('#auth-user').fill('primeira_conta');
 await page.locator('#auth-password').fill('senha12345');
 await page.locator('#auth-submit').click();
 await expect(page.locator('#new-game-setup')).toBeVisible();
 await page.locator('#trainer-nick').fill('Primeiro');
 await page.locator('[data-egg="0"]').click();
 await page.locator('[data-hub="account"]').click();
 await expect(page.locator('#create-another-account')).toHaveText('CRIAR OUTRA CONTA');
 await page.locator('#create-another-account').click();
 await expect(page.locator('#hub-auth')).toBeVisible();
 await expect(page.locator('#auth-register-tab')).toBeVisible();
 await page.locator('#auth-user').fill('segunda_conta');
 await page.locator('#auth-password').fill('outrasenha');
 await page.locator('#auth-submit').click();
 await expect(page.locator('#new-game-setup')).toBeVisible();
 const saved=await page.evaluate(()=>({credentials:JSON.parse(localStorage.getItem('aurora-credentials')),account:localStorage.getItem('aurora-account'),world:localStorage.getItem('aurora-world-v2')}));
 expect(saved.credentials.username).toBe('segunda_conta');
 expect(saved.account).toBeNull();
 expect(saved.world).toBeNull();
});
