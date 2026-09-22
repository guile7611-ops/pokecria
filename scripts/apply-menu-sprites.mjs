import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');
const replacements = [
  ['<span class="brand-mark">✧</span>', '<img class="brand-mark" src="/assets/ui/battle.png" alt="">'],
  ['<button id="sound" title="Ativar ou desativar efeitos sonoros" aria-label="Ativar som">Som desligado</button><button id="pause" aria-label="Pausar jogo">Ⅱ</button>', '<button id="sound" class="icon-action" title="Ativar ou desativar efeitos sonoros" aria-label="Ativar som"><img src="/assets/ui/settings.png" alt=""><span>Som desligado</span></button><button id="pause" class="icon-action" aria-label="Pausar jogo"><img src="/assets/ui/pause.png" alt=""><span>Ⅱ</span></button>'],
  ['<div class="mini-heading"><span>FLORESTA DE AURORA</span><kbd>M</kbd></div>', '<div class="mini-heading"><span><img src="/assets/ui/map.png" alt=""> FLORESTA DE AURORA</span><kbd>M</kbd></div>'],
  ['<div class="welcome-symbol">✧</div>', '<div class="welcome-symbol"><img src="/assets/ui/battle.png" alt="Emblema de aventura"></div>'],
  ['<div class="modal panel"><p class="eyebrow">RESPIRE UM POUCO</p>', '<div class="modal panel"><img class="modal-sprite" src="/assets/ui/pause.png" alt=""><p class="eyebrow">RESPIRE UM POUCO</p>'],
  ['<dialog id="bag" class="bag"><header><h2>Mochila</h2>', '<dialog id="bag" class="bag"><header><h2><img class="heading-sprite" src="/assets/ui/bag.png" alt="">Mochila</h2>'],
  ['<dialog id="info" class="info"><header><h2 id="info-title">Pokémon</h2>', '<dialog id="info" class="info"><header><h2><img class="heading-sprite" src="/assets/ui/info.png" alt=""><span id="info-title">Pokémon</span></h2>'],
];
for (const [before, after] of replacements) {
  if (!html.includes(before)) throw new Error(`Markup not found: ${before}`);
  html = html.replace(before, after);
}
await writeFile(file, html);
