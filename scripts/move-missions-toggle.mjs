import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');
html = html.replace(/<button id="missions-toggle"[\s\S]*?<\/button>/, '');
html = html.replace(/<aside id="objectives" class="objectives panel">([\s\S]*?)<\/aside>/, (_, content) =>
  `<aside id="objectives" class="objectives panel"><button id="missions-toggle" class="missions-toggle" aria-expanded="true" aria-controls="objectives-body"><span>◇ MISSÕES</span><b>Recolher ▴</b></button><div id="objectives-body" class="objectives-body">${content}</div></aside>`
);
await writeFile(file, html);
