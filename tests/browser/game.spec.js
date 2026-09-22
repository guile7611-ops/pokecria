import { test, expect } from '@playwright/test';

async function observeRenderer(page) {
  await page.evaluate(async () => {
    const { Renderer } = await import('/renderer.js');
    const draw = Renderer.prototype.draw;
    Renderer.prototype.draw = function (...args) {
      draw.apply(this, args);
      const p = this.sim.player;
      window.gameForTest = this.sim;
      window.observedFrame = { x: p.x, y: p.y, id: p.id, path: p.path.map(point => ({ ...point })), facing: { ...p.facing }, camera: { ...this.camera }, zoom: this.zoom, width: this.width, height: this.height };
    };
  });
  await page.waitForFunction(() => window.observedFrame);
}

test('enters world, moves, casts, pauses and resets without browser errors', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('button', { name: 'Entrar na floresta' })).toBeVisible();
  await page.screenshot({ path: 'docs/welcome.png' });
  await page.getByRole('button', { name: 'Entrar na floresta' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#hotbar button')).toHaveCount(4);
  await expect(page.locator('#slot-1')).toContainText('Nível 2');
  await expect(page.locator('#slot-2')).toContainText('Nível 10');
  await expect(page.locator('#slot-3')).toContainText('Ultimate · Nível 25');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(700); await page.keyboard.up('ArrowRight');
  await expect(page.locator('#goal-move')).toHaveClass(/done/);
  await page.mouse.move(900, 480); await page.keyboard.press('q'); await expect(page.locator('#slot-0 .cooldown')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#pause-screen')).toBeVisible();
  const cooldown = await page.locator('#slot-0 .cooldown').textContent(); await page.waitForTimeout(300); await expect(page.locator('#slot-0 .cooldown')).toHaveText(cooldown);
  await page.getByRole('button', { name: 'Continuar explorando' }).click();
  await page.keyboard.press('m'); await expect(page.locator('.minimap')).toHaveClass(/map-expanded/); await page.keyboard.press('m');
  await page.screenshot({ path: 'docs/gameplay.png' });
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Recomeçar sessão' }).click();
  await expect(page.locator('#hp-text')).toHaveText('100 / 100'); await expect(page.locator('#xp-text')).toHaveText('0 / 45 XP');
  await expect(page.locator('#goal-move')).not.toHaveClass(/done/);
  expect(errors).toEqual([]);
});

test('browser simulation completes combat loop and wall blocks projectiles', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { Simulation } = await import('/simulation.js');
    const sim = new Simulation();
    for (const e of sim.enemies.slice(0, 2)) {
      Object.assign(e, { x: sim.player.x + 70, y: sim.player.y, home: { x: sim.player.x + 70, y: sim.player.y } });
      sim.command({ type: 'target', id: e.uid });
      for (let i = 0; i < 360; i++) sim.step(1 / 60);
    }
    const kills = sim.kills, level = sim.player.level, slots = [...sim.player.slots];
    sim.player.x = 770; sim.player.y = 350;
    Object.assign(sim.enemies[2], { x: 980, y: 350, home: { x: 980, y: 350 } });
    const before = sim.enemies[2].hp;
    sim.command({ type: 'cast', slot: 0, x: 980, y: 350 });
    for (let i = 0; i < 90; i++) sim.step(1 / 60);
    return { kills, level, slots, wallBlocked: sim.enemies[2].hp === before, projectiles: sim.projectiles.length };
  });
  expect(result).toEqual({ kills: 2, level: 2, slots: ['leaf', 'bloom', null, null], wallBlocked: true, projectiles: 0 });
});

test('a new mouse click overrides a held arrow and does not drift with the camera', async ({ page }) => {
  await page.goto('/'); await page.locator('#start').click(); await observeRenderer(page);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(120);
  const before = await page.evaluate(() => window.observedFrame.x);
  const click = await page.evaluate(() => { const f=window.observedFrame; return {x:(160-f.camera.x)*f.zoom+f.width/2,y:(560-f.camera.y)*f.zoom+f.height/2}; });
  await page.mouse.move(click.x, click.y); await page.mouse.down();
  await page.waitForTimeout(90);
  const first = await page.evaluate(() => window.observedFrame);
  expect(first.x).toBeLessThan(before); expect(first.facing.x).toBeLessThan(0);
  const destination = first.path.at(-1); expect(destination).toBeDefined();
  await page.waitForTimeout(180);
  const later = await page.evaluate(() => window.observedFrame);
  expect(later.path.at(-1)).toEqual(destination);
  await page.mouse.up(); await page.keyboard.up('ArrowRight');
});

test('all starters can be selected and sprite gallery renders every direction', async ({ page }) => {
  const errors = [], failedAssets = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().includes('/assets/') && r.status() >= 400) failedAssets.push(r.url()); });
  for (const [id, name, ability] of [['bulbasaur','Bulbasaur','Folha cortante'],['charmander','Charmander','Brasa'],['squirtle','Squirtle','Jato d’água'],['chikorita','Chikorita','Folha cortante'],['cyndaquil','Cyndaquil','Brasa'],['totodile','Totodile','Jato d’água'],['treecko','Treecko','Folha cortante'],['torchic','Torchic','Brasa'],['mudkip','Mudkip','Jato d’água']]) {
    await page.goto('/'); await page.locator(`[data-starter="${id}"]`).click(); await page.locator('#start').click();
    await expect(page.locator('#player-name')).toHaveText(name); await expect(page.locator('#slot-0')).toContainText(ability);
    await page.keyboard.press('Escape'); await page.locator('#change-starter').click(); await expect(page.locator('#welcome')).toBeVisible();
  }
  await page.goto('/sprites.html'); await expect(page.locator('canvas')).toHaveCount(144); await page.waitForLoadState('networkidle');
  await page.locator('#pause').click(); await page.screenshot({path:'docs/pokemon-sprites.png',fullPage:true});
  expect(errors).toEqual([]); expect(failedAssets).toEqual([]);
});

test('preview evolves all three lines and resets without affecting the game', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/evolutions.html');
  for (const [id, middle, final, level] of [['bulbasaur','Ivysaur','Venusaur',32],['charmander','Charmeleon','Charizard',36],['squirtle','Wartortle','Blastoise',36]]) {
    await page.locator('#starter').selectOption(id);
    await page.locator('#next').click(); await expect(page.locator('#name')).toHaveText(middle); await expect(page.locator('#level')).toContainText('Nível 16');
    await page.locator('#next').click(); await expect(page.locator('#name')).toHaveText(final); await expect(page.locator('#level')).toContainText(`Nível ${level}`);
    await expect(page.locator('#history li')).toHaveCount(2); await expect(page.locator('#next')).toBeDisabled();
    await page.screenshot({path:`docs/evolution-${id}.png`});
  }
  await page.goto('/'); await page.locator('#start').click(); await expect(page.locator('#player-name')).toHaveText('Bulbasaur'); await expect(page.locator('#level')).toHaveText('NV. 01');
  expect(errors).toEqual([]);
});

test('a combat reward evolves the player and updates the actual HUD', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.locator('#start').click(); await observeRenderer(page);
  await page.evaluate(async () => {
    const { xpToLevel } = await import('/progression.js');
    const sim = window.gameForTest, p = sim.player;
    sim.gainXP(xpToLevel(p, 16) - 25);
    const enemy = sim.enemies[0]; Object.assign(enemy, { x: p.x + 40, y: p.y, hp: 1, home: { x: p.x + 40, y: p.y } });
    sim.command({type:'target',id:enemy.uid});
  });
  await expect(page.locator('#player-name')).toHaveText('Ivysaur'); await expect(page.locator('#level')).toHaveText('NV. 16');
  await expect(page.locator('#player-portrait')).toHaveAttribute('src', '/assets/pokemon/ivysaur/portrait.png');
  await expect(page.locator('#slot-0')).toContainText('Folha navalha');
  await expect(page.locator('#slot-2')).toContainText('Rajada de Vinhas');
  await expect(page.locator('#slot-3')).toContainText('Ultimate · Nível 25');
  expect(errors).toEqual([]);
});
