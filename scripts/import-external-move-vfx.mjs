import sharp from 'sharp';
import {readFile,readdir,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {basename,extname,resolve} from 'node:path';
import {ABILITIES} from '../public/data.js';

const sourceRoot=process.env.MOVE_SOURCE_ROOT;
if(!sourceRoot)throw new Error('Defina MOVE_SOURCE_ROOT para a pasta que contém gen3/ e ebdx/.');
const project=resolve(import.meta.dirname,'..'),output=resolve(project,'public/assets/sprites/vfx/moves'),audioOutput=resolve(project,'public/assets/audio/moves/external');
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
async function files(path){try{return (await readdir(path,{recursive:true,withFileTypes:true})).filter(row=>row.isFile()).map(row=>resolve(row.parentPath,row.name));}catch{return [];}}
const genFiles=(await files(resolve(sourceRoot,'gen3'))).filter(file=>extname(file).toLowerCase()==='.png'&&!/background|status |super shiny|shiny/i.test(basename(file)));
const genAudio=(await files(resolve(sourceRoot,'gen3'))).filter(file=>['.ogg','.wav','.mp3'].includes(extname(file).toLowerCase()));
const ebdxFiles=await files(resolve(sourceRoot,'ebdx'));
const rbByName=new Map(ebdxFiles.filter(file=>extname(file).toLowerCase()==='.rb'&&/move animations/i.test(file)).map(file=>[normalize(basename(file,'.rb')),file]));
const graphicsByName=new Map(ebdxFiles.filter(file=>extname(file).toLowerCase()==='.png'&&/animations[\\/]moves/i.test(file)).map(file=>[normalize(basename(file,'.png')),file]));
const genByName=new Map(genFiles.map(file=>[normalize(basename(file,'.png')),file]));
const genAudioByName=new Map(genAudio.map(file=>[normalize(basename(file,extname(file))),file]));
const ebdxAudioByName=new Map(ebdxFiles.filter(file=>['.ogg','.wav','.mp3'].includes(extname(file).toLowerCase())).map(file=>[normalize(basename(file,extname(file))),file]));
const keysFor=ability=>[ability.officialMove,ability.id,ability.name].map(normalize).filter(Boolean);
const transparent={r:0,g:0,b:0,alpha:0};
async function writeRetry(path,data){let last;for(let attempt=0;attempt<30;attempt++){try{await writeFile(path,data);return;}catch(error){last=error;await new Promise(resolve=>setTimeout(resolve,40+attempt*12));}}throw last;}

async function gen3Sheet(file){
 const meta=await sharp(file).metadata(),cell=meta.height===192&&meta.width%192===0?192:Math.min(meta.height,meta.width),columns=Math.max(1,Math.floor(meta.width/cell)),rows=Math.max(1,Math.floor(meta.height/cell)),total=columns*rows,frames=[];
 for(let t=0;t<8;t++){const index=Math.min(total-1,Math.floor(t*total/8)),left=(index%columns)*cell,top=Math.floor(index/columns)*cell;const {data,info}=await sharp(file).extract({left,top,width:cell,height:cell}).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i]>=252&&data[i+1]>=252&&data[i+2]>=252)data[i+3]=0;frames.push(await sharp(data,{raw:info}).resize(64,64,{fit:'contain',kernel:'nearest',background:transparent}).png().toBuffer());}
 return {sheet:await sharp({create:{width:512,height:64,channels:4,background:transparent}}).composite(frames.map((input,index)=>({input,left:index*64,top:0}))).png().toBuffer(),frames:total,resources:[basename(file)]};
}

function referencedGraphics(source){
 const refs=[];for(const match of source.matchAll(/["']([^"']+)["']/g)){const raw=match[1],key=normalize(basename(raw));if(graphicsByName.has(key)&&!/_bg|background/i.test(raw))refs.push({key,file:graphicsByName.get(key),at:match.index});}
 return [...new Map(refs.map(ref=>[ref.key,ref])).values()].slice(0,2);
}
function cropAfter(source,ref){const tail=source.slice(ref.at,ref.at+1000),match=tail.match(/src_rect\.set\([^,]+,[^,]+,\s*(\d+)\s*,\s*(\d+)\s*\)/);return match?{width:Number(match[1]),height:Number(match[2])}:null;}
async function ebdxAssetFrame(source,ref,t,index,behavior){
 const meta=await sharp(ref.file).metadata(),declared=cropAfter(source,ref);let region,frames=1;
 if(declared&&declared.width<=meta.width&&declared.height<=meta.height){const cols=Math.max(1,Math.floor(meta.width/declared.width)),rows=Math.max(1,Math.floor(meta.height/declared.height));frames=cols*rows;const frame=(t+index*2)%frames;region={left:(frame%cols)*declared.width,top:Math.floor(frame/cols)*declared.height,width:declared.width,height:declared.height};}
 else if(meta.height&&meta.width%meta.height===0&&meta.width/meta.height<=12){frames=meta.width/meta.height;const frame=(t+index)%frames;region={left:frame*meta.height,top:0,width:meta.height,height:meta.height};}
 const extracted=region?await sharp(ref.file).extract(region).png().toBuffer():ref.file,{data,info}=await sharp(extracted).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i]>=248&&data[i+1]>=248&&data[i+2]>=248)data[i+3]=0;const input=sharp(data,{raw:info}).trim({background:transparent});const pulse=behavior==='area'||behavior==='zone'?42+t*2:behavior==='direct'?44+Math.round(Math.sin((t+1)/9*Math.PI)*12):48;
 return {input:await input.resize(pulse,pulse,{fit:'contain',kernel:'nearest',background:transparent}).png().toBuffer(),frames};
}
async function ebdxSheet(file,ability){
 const source=await readFile(file,'utf8'),refs=referencedGraphics(source);if(!refs.length)return null;const rendered=[],frameCounts=new Set();
 for(let t=0;t<8;t++){const parts=[];for(let i=0;i<refs.length;i++){const result=await ebdxAssetFrame(source,refs[i],t,i,ability.behavior);frameCounts.add(result.frames);const offset=(i-(refs.length-1)/2)*8,travel=['projectile','beam','channel','wave'].includes(ability.behavior)?Math.round((t-3.5)*1.4):0;parts.push({input:result.input,left:Math.max(0,Math.min(20,10+offset+travel)),top:Math.max(0,Math.min(20,10-offset))});}rendered.push(await sharp({create:{width:64,height:64,channels:4,background:transparent}}).composite(parts).png().toBuffer());}
 return {sheet:await sharp({create:{width:512,height:64,channels:4,background:transparent}}).composite(rendered.map((input,index)=>({input,left:index*64,top:0}))).png().toBuffer(),frames:[...frameCounts].reduce((a,b)=>a+b,0),resources:refs.map(ref=>basename(ref.file))};
}

// EBDX Earthquake is choreography-only: the Ruby animation darkens and shakes
// the whole scene and plays Earth4 + rock1, but references no image asset.
// Preserve that choreography while supplying a field-scale crack/debris layer.
async function earthquakeSheet(){
 const frames=[],branches=[[-1.48,29],[-.82,27],[-.24,30],[.43,28],[1.02,30],[1.62,27],[2.27,29],[2.88,26]];
 for(let frame=0;frame<8;frame++){
  const progress=(frame+1)/8,paths=branches.map(([angle,length],index)=>{const turn=(index%2?1:-1)*.28,x1=32+Math.cos(angle)*length*.36*progress,y1=32+Math.sin(angle)*length*.24*progress,x2=32+Math.cos(angle+turn)*length*.7*progress,y2=32+Math.sin(angle+turn)*length*.54*progress,x3=32+Math.cos(angle-turn*.35)*length*progress,y3=32+Math.sin(angle-turn*.35)*length*.8*progress;return `<polyline points="32,32 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}"/>`;}).join('');
  const rocks=frame<2?'':branches.slice(0,Math.min(8,frame+2)).map(([angle],index)=>{const distance=(13+index%3*5)*progress,x=32+Math.cos(angle)*distance,y=32+Math.sin(angle)*distance*.72,size=1.5+(index%2);return `<rect x="${(x-size).toFixed(1)}" y="${(y-size).toFixed(1)}" width="${(size*2).toFixed(1)}" height="${(size*1.5).toFixed(1)}" transform="rotate(${index*27} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;}).join(''),opacity=frame===7?.35:1;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g opacity="${opacity}" fill="none" stroke="#24120c" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter">${paths}</g><g opacity="${opacity}" fill="none" stroke="#d28a3e" stroke-width="1.4" stroke-linecap="square">${paths}</g><g opacity="${opacity}" fill="#4a2818" stroke="#e4a151" stroke-width="1">${rocks}</g><ellipse cx="32" cy="33" rx="${(5+progress*11).toFixed(1)}" ry="${(2+progress*4).toFixed(1)}" fill="none" stroke="#f0b864" stroke-width="${frame<5?2:1}" opacity="${Math.max(0,.72-frame*.08)}"/></svg>`;
  frames.push(await sharp(Buffer.from(svg)).png().toBuffer());
 }
 return {sheet:await sharp({create:{width:512,height:64,channels:4,background:transparent}}).composite(frames.map((input,index)=>({input,left:index*64,top:0}))).png().toBuffer(),frames:70,resources:['EARTHQUAKE.rb · scene shake/darkening','field crack overlay']};
}

await mkdir(output,{recursive:true});await mkdir(audioOutput,{recursive:true});const manifest={};
for(const ability of Object.values(ABILITIES)){
 if(ability.id==='basic')continue;const keys=keysFor(ability);let result,source,sourceCode,audioFile;
 const genKey=keys.find(key=>genByName.has(key));if(genKey){result=await gen3Sheet(genByName.get(genKey));source='gen3';audioFile=genAudioByName.get(genKey);}
 if(!result){const rbKey=keys.find(key=>rbByName.has(key));if(rbKey){const rb=rbByName.get(rbKey);sourceCode=await readFile(rb,'utf8');result=await ebdxSheet(rb,ability);if(!result&&ability.id==='earthquake')result=await earthquakeSheet();source='ebdx';const sounds=[...sourceCode.matchAll(/pbSEPlay\(["']([^"']+)/g)].map(match=>normalize(basename(match[1])));audioFile=sounds.map(key=>ebdxAudioByName.get(key)).find(Boolean);}}
 if(!result)continue;await writeRetry(resolve(output,`${ability.id}.png`),result.sheet);let audio;if(audioFile){audio=`${ability.id}${extname(audioFile).toLowerCase()}`;await copyFile(audioFile,resolve(audioOutput,audio));}manifest[ability.id]={source,frames:result.frames,resources:result.resources,...audio&&{audio}};
}
const module=`// Generated by scripts/import-external-move-vfx.mjs.\nexport const EXTERNAL_MOVE_VFX=${JSON.stringify(manifest,null,2)};\n`;
await writeFile(resolve(project,'public/external-move-vfx.js'),module);
console.log(`Imported ${Object.keys(manifest).length} exact move resources (${Object.values(manifest).filter(row=>row.source==='gen3').length} Gen 3, ${Object.values(manifest).filter(row=>row.source==='ebdx').length} EBDX).`);
