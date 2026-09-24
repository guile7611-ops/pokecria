import {test,expect} from '@playwright/test';

test('expanded map keeps only the current detail level while zooming both ways',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('aurora-credentials',JSON.stringify({username:'qa_map_zoom',salt:[],digest:''}));localStorage.setItem('aurora-account',JSON.stringify({createdAt:Date.now(),starterId:'bulbasaur',nick:'QA Mapa'}));sessionStorage.setItem('aurora-auth','qa_map_zoom');});
 await page.goto('/');await page.locator('#start').click();await page.keyboard.press('m');await expect(page.locator('.minimap')).toHaveClass(/map-expanded/);
 const detailLevels=()=>page.locator('#minimap .tile-sector img').evaluateAll(images=>[...new Set(images.map(image=>new URL(image.src).searchParams.get('lod')))].sort());
 await expect.poll(detailLevels).toEqual(['2']);
 for(let i=0;i<15;i++)await page.locator('#map-in').click();
 await expect.poll(detailLevels).toEqual(['0']);
 for(let i=0;i<15;i++)await page.locator('#map-out').click();
 await expect.poll(detailLevels).toEqual(['2']);
 await page.screenshot({path:'test-results/map-zoom-stable.png'});
});
