import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');
const footer = '<div class="mini-footer"><span><i></i> Área de exploração</span><span id="coords">0, 0</span></div>';
const drawer = `${footer}<button id="missions-toggle" class="missions-toggle" aria-expanded="true" aria-controls="objectives"><span>◇ MISSÕES</span><b>Recolher ▴</b></button>`;
if (!html.includes('id="missions-toggle"')) {
  if (!html.includes(footer)) throw new Error('Minimap footer not found');
  html = html.replace(footer, drawer).replace('<aside class="objectives panel">', '<aside id="objectives" class="objectives panel">');
}
await writeFile(file, html);
