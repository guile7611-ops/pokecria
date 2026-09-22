import { cp, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('public/vendor', { recursive: true });
await build({entryPoints:['scripts/realtime-vendor-entry.js'],outfile:'public/vendor/supabase.js',bundle:true,format:'esm',platform:'browser',minify:true});
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true, force: true });
const url=process.env.VITE_SUPABASE_URL;
const key=process.env.VITE_SUPABASE_ANON_KEY;
if(Boolean(url)!==Boolean(key))throw Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY juntos.');
if(url)await writeFile('dist/supabase-config.js',`export const SUPABASE_URL=${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY=${JSON.stringify(key)};\n`);
console.log(`Build concluído (${url?'Supabase via ambiente':'configuração pública do projeto'}).`);
