import { readFile, writeFile } from 'node:fs/promises';
const file='public/sprites.html';
let html=await readFile(file,'utf8');
html=html.replace('<title>Sprites — iniciais de Kanto</title>','<title>Sprites — Pokémon do jogo</title>')
 .replace('<h1>Bulbasaur, Charmander e Squirtle</h1><p>Sprites originais de Mystery Dungeon, com oito direções e os tempos de cada quadro.</p>','<h1>Galeria de Pokémon</h1><p>Sprites de Mystery Dungeon, com oito direções e os tempos de cada quadro.</p>');
await writeFile(file,html);
