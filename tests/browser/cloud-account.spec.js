import { test, expect } from '@playwright/test';

test('cloud save returns after reload and does not bleed into another account', async ({page}) => {
  const users=new Map(),saves=new Map();
  await page.route('**/supabase-config.js',route=>route.fulfill({contentType:'text/javascript',body:`export const SUPABASE_URL='https://fake.supabase.co';export const SUPABASE_ANON_KEY='${'a'.repeat(48)}';`}));
  await page.route('https://fake.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    if(method==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'*'}});return;}
    const email=request.postDataJSON()?.email;
    let status=200,body={};
    if(url.pathname==='/auth/v1/signup'){
      if(users.has(email)){status=422;body={msg:'Usuário já existe.'};}
      else{const id=`00000000-0000-4000-8000-${String(users.size+1).padStart(12,'0')}`,user={id,email,user_metadata:request.postDataJSON().data};users.set(email,user);body={access_token:`token-${id}`,refresh_token:`refresh-${id}`,expires_in:3600,user};}
    }else if(url.pathname==='/auth/v1/token'){
      const user=users.get(email);if(!user){status=400;body={msg:'Credenciais incorretas.'};}
      else body={access_token:`token-${user.id}`,refresh_token:`refresh-${user.id}`,expires_in:3600,user};
    }else{
      const id=(request.headers().authorization||'').replace('Bearer token-','');
      const user=[...users.values()].find(candidate=>candidate.id===id);
      if(!user){status=401;body={message:'Sessão inválida'};}
      else if(url.pathname==='/auth/v1/user')body=user;
      else if(url.pathname==='/rest/v1/game_saves'&&method==='GET')body=saves.has(id)?[saves.get(id)]:[];
      else if(url.pathname==='/rest/v1/game_saves'&&method==='POST'){const data=request.postDataJSON();saves.set(id,{world:data.world,account:data.account});body=null;}
      else{status=404;body={message:'Rota desconhecida'};}
    }
    await route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:body===null?'':JSON.stringify(body)});
  });

  await page.goto('/');
  await page.locator('#auth-user').fill('primeiro');
  await page.locator('#auth-password').fill('senha12345');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#new-game-setup')).toBeVisible();
  await page.locator('#trainer-nick').fill('Treinador A');
  await page.locator('[data-egg="0"]').click();
  await expect.poll(()=>saves.size).toBe(1);

  await page.reload();
  await expect(page.locator('#hub-active')).toBeVisible();
  await expect(page.locator('#account-details')).toContainText('Treinador A');

  await page.locator('[data-hub="account"]').click();
  await page.locator('#create-another-account').click();
  await page.locator('#auth-user').fill('segundo');
  await page.locator('#auth-password').fill('outrasenha');
  await page.locator('#auth-submit').click();
  await expect(page.locator('#new-game-setup')).toBeVisible();
  await expect(page.locator('#hub-active')).toBeHidden();
  expect(saves.size).toBe(1);
});
