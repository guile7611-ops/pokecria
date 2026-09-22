import { composeChunk } from './tools/chunk-composer.mjs';
import { handleOnline } from './online-server.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
export const server = http.createServer(async (req, res) => {
  try {
    const url=new URL(req.url,'http://localhost');
    if(await handleOnline(req,res,url))return;
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const name = decodeURIComponent(url.pathname);
    if(name==='/supabase-config.js'&&process.env.VERDANT_TEST_MODE==='1'){
      res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}).end('export const SUPABASE_URL=""; export const SUPABASE_ANON_KEY="";');return;
    }
    if(name==='/api/tile-chunk'){
      const q=url.searchParams,seed=Number(q.get('seed')),cx=Number(q.get('cx')),cy=Number(q.get('cy')),lod=Number(q.get('lod')),layer=q.get('layer')||'ground',scene=q.get('scene')||'';
      if(!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isInteger(cx)||cx<0||cx>20||!Number.isInteger(cy)||cy<0||cy>15||![0,1,2].includes(lod)||!['ground','overview'].includes(layer)||scene.length>100){res.writeHead(400).end('Invalid tile chunk');return;}
      const body=await composeChunk({seed,cx,cy,lod,layer,scene});res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'private, max-age=3600'}).end(req.method==='HEAD'?undefined:body);return;
    }
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Arquivo não encontrado'); }
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Verdant: http://localhost:${port}`));
}
