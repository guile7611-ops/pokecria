import { composeChunk } from '../tools/chunk-composer.mjs';

export default async function handler(req,res){
  try{
    if(!['GET','HEAD'].includes(req.method)){res.status(405).end();return;}
    const q=req.query||{}, seed=Number(q.seed),cx=Number(q.cx),cy=Number(q.cy),lod=Number(q.lod),layer=q.layer||'ground',scene=q.scene||'';
    if(!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isInteger(cx)||cx<0||cx>31||!Number.isInteger(cy)||cy<0||cy>19||![0,1,2].includes(lod)||!['ground','overview'].includes(layer)||String(scene).length>100){res.status(400).end('Invalid tile chunk');return;}
    const body=await composeChunk({seed,cx,cy,lod,layer,scene:String(scene)});
    res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');res.status(200).end(req.method==='HEAD'?undefined:body);
  }catch{res.status(500).end('Tile generation failed');}
}
