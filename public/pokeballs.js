export const POKEBALLS = Object.freeze([
  {id:'poke',name:'Poké Bola',rarity:'Comum',price:100,multiplier:1},
  {id:'great',name:'Super Bola',rarity:'Incomum',price:250,multiplier:1.5},
  {id:'ultra',name:'Ultra Bola',rarity:'Rara',price:600,multiplier:2.2},
  {id:'dusk',name:'Bola Sombria',rarity:'Épica',price:900,multiplier:2.5,caveMultiplier:3.5},
  {id:'master',name:'Master Bola',rarity:'Lendária',price:null,multiplier:Infinity}
]);
export const pokeballById = id => POKEBALLS.find(ball=>ball.id===id)||POKEBALLS[0];
export function pokeballCaptureChance(base,level,ballId,biome){
  const ball=pokeballById(ballId);
  if(ball.id==='master')return 1;
  const multiplier=ball.caveMultiplier&&biome==='cave'?ball.caveMultiplier:ball.multiplier;
  return Math.min(.95,Math.max(.08,base-(level-1)*.008)*multiplier);
}
