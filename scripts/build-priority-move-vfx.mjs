import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const output=resolve(import.meta.dirname,'../public/assets/sprites/vfx/priority');
const moves=['leaf','ember','hydroCannon','aquaWave','solarSeed','flame','fireBlast','waterPulse','vineBurst','smokescreen','fireSpin','bite','iceFang','sandAttack','mudSlap'];
const palettes={
 leaf:['#efffb1','#79df56','#167143'],ember:['#fff3a1','#ff9c2f','#d92d1f'],hydroCannon:['#f2ffff','#6ee9ff','#0877c9'],aquaWave:['#edffff','#53d9ff','#0874bc'],
 solarSeed:['#ffffbd','#a7ef54','#2a8c42'],flame:['#fff0a0','#ff7b24','#c91e1e'],fireBlast:['#fff3a3','#ff8428','#bc171d'],waterPulse:['#f4ffff','#72e9ff','#176bc3'],
 vineBurst:['#eaff9b','#65c950','#17683d'],smokescreen:['#d9dce3','#777b86','#292b35'],fireSpin:['#fff4a3','#ff7b21','#b91620'],bite:['#f1ecff','#8d78ad','#2d203d'],iceFang:['#f5ffff','#8eeaff','#2784cf'],sandAttack:['#fff0aa','#d5aa62','#8a633d'],mudSlap:['#ecd19d','#94623f','#4d3025']
};
const C=(x,y,r,c,o=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
const R=(x,y,w,h,c,o=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="${o}"/>`;
const P=(points,c,o=1)=>`<polygon points="${points}" fill="${c}" opacity="${o}"/>`;
const Q=(d,c,w=3,fill='none',o=1)=>`<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter" opacity="${o}"/>`;
const ring=(x,y,r,c,w=3,o=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;
const ray=(angle,r1,r2,c,w=3)=>{const a=angle*Math.PI/180;return Q(`M ${32+Math.cos(a)*r1} ${32+Math.sin(a)*r1} L ${32+Math.cos(a)*r2} ${32+Math.sin(a)*r2}`,c,w)};
const rays=(count,r1,r2,c,w=3,offset=0)=>Array.from({length:count},(_,i)=>ray(offset+i*360/count,r1,r2,c,w)).join('');
const flecks=(t,c,count=8)=>Array.from({length:count},(_,i)=>{const a=(i*137+t*31)*Math.PI/180,r=13+(i*11+t*4)%18;return C(32+Math.cos(a)*r,32+Math.sin(a)*r,1+i%2,c,.9)}).join('');
const leaf=(x,y,s,a,b,rotation=0)=>`<g transform="rotate(${rotation} ${x} ${y})">${P(`${x-s},${y} ${x-2},${y-s*.65} ${x+s},${y} ${x+2},${y+s*.65}`,b)}${Q(`M ${x-s+2} ${y} L ${x+s-2} ${y}`,a,2)}</g>`;
const shard=(x,y,s,a,b,rotation=0)=>`<g transform="rotate(${rotation} ${x} ${y})">${P(`${x},${y-s} ${x+s*.48},${y} ${x},${y+s} ${x-s*.48},${y}`,b)}${Q(`M ${x} ${y-s+2} L ${x} ${y+s-2}`,a,2)}</g>`;
const smoke=(x,y,s,a,b,o=1)=>C(x-s*.35,y,s*.72,b,o)+C(x+s*.28,y-s*.18,s*.62,b,o)+C(x,y-s*.35,s*.58,a,o*.82);
const jaws=(t,a,b,c,open=1)=>{const gap=5+open*7;return P(`8,${32-gap} 20,10 28,${27-gap} 36,8 56,${31-gap} 44,${32-gap/2} 56,${33+gap} 36,56 28,${37+gap} 20,54 8,${32+gap} 19,32`,c)+P(`14,${31-gap} 23,17 29,${29-gap} 36,15 50,${31-gap} 39,32 50,${33+gap} 36,49 29,${35+gap} 23,47 14,${33+gap} 24,32`,b)+[20,30,42].map((x,i)=>P(`${x-3},${29-gap+i%2*2} ${x+3},${29-gap+i%2*2} ${x},${36-gap}`,a)+P(`${x-3},${35+gap-i%2*2} ${x+3},${35+gap-i%2*2} ${x},${28+gap}`,a)).join('');};

function cast(id,t,[a,b,c]){
 const pulse=Math.sin((t+1)*Math.PI/9),r=9+t*2.2;
 if(id==='vineBurst')return Q(`M 7 58 Q 17 ${35-t} 30 48 Q 42 ${25+t} 58 34`,c,8)+Q(`M 7 58 Q 17 ${35-t} 30 48 Q 42 ${25+t} 58 34`,b,4)+[0,1,2].map(i=>leaf(18+i*15,45-i*5,5,a,b,t*20+i*35)).join('');
 if(id==='smokescreen')return smoke(24,39,13,a,b,.78)+smoke(40,34,15,a,c,.86)+smoke(31,23,10,a,b,.65)+flecks(t,c,7);
 if(id==='fireSpin')return [0,1,2].map(i=>{const q=t*.45+i*Math.PI*2/3;return P(`${32+Math.cos(q)*18},${32+Math.sin(q)*12-9} ${27+Math.cos(q)*18},${36+Math.sin(q)*12} ${37+Math.cos(q)*18},${36+Math.sin(q)*12}`,i?b:c)}).join('')+ring(32,35,9+t*1.5,a,3);
 if(id==='bite')return jaws(t,a,b,c,.9-t*.09);
 if(id==='iceFang')return jaws(t,a,b,c,.8-t*.07)+[0,1,2].map((i)=>shard(18+i*14,11+(i%2)*8,5+i,a,b,t*18+i*25)).join('');
 if(id==='sandAttack')return [0,1,2,3].map(i=>Q(`M 8 48 Q ${21+i*7} ${39-i*8-t} ${48+i*3} ${40-i*6}`,i%2?b:c,4)).join('')+flecks(t,a,13);
 if(id==='mudSlap')return C(32,39,10+t*.7,c)+C(25,30,6,b)+C(40,27,5,b)+[0,1,2].map(i=>C(16+i*16,14+(i%2)*7,2+i,a)).join('');
 if(id==='hydroCannon')return ring(32,32,8+t*2,c,5)+ring(32,32,15+t*2,b,3)+ring(32,32,24-t*.8,a,2)+C(32,32,7+t*.7,a)+flecks(t,b,12);
 if(id==='aquaWave')return Q(`M 4 45 Q 16 ${24-t} 28 40 Q 43 ${17+t*.4} 61 32 L 61 54 L 4 54 Z`,c,3,b)+Q(`M 4 44 Q 16 ${23-t} 28 40 Q 43 ${17+t*.4} 61 32`,a,4)+C(19,19+t,2,a)+C(49,14+t*2,3,b);
 if(id==='solarSeed')return C(32,32,7+t,c)+C(29,28,4+t*.45,a)+rays(8,10+t,21+t*.7,b,3,t*11)+[0,1,2,3].map(i=>leaf(32+Math.cos(i*Math.PI/2)*22,32+Math.sin(i*Math.PI/2)*22,5,a,b,t*18+i*90)).join('');
 if(id==='fireBlast')return rays(5,4,17+t,c,8,t*9)+rays(5,3,21+t*.7,b,4,t*9)+C(32,32,7+t*.5,a)+flecks(t,b,10);
 if(id==='waterPulse')return [0,1,2].map(i=>ring(32,32,6+i*7+(t%3),i%2?b:a,3,1-i*.15)).join('')+C(32,32,7+t*.35,c)+C(28,27,3,a);
 if(id==='leaf')return [0,1,2].map((i)=>leaf(32+Math.cos(i*2.1+t*.25)*(8+i*4),32+Math.sin(i*2.1+t*.25)*(8+i*4),7,a,i?b:c,t*24+i*55)).join('')+ring(32,32,r,a,2,.65);
 if(id==='ember')return [0,1,2,3].map((i)=>{const q=(i*90+t*21)*Math.PI/180;return C(32+Math.cos(q)*(8+i*2),32+Math.sin(q)*(8+i*2),3+i%2,i%2?b:c)}).join('')+C(32,32,5+t*.45,a)+flecks(t,b,8);
 return P(`18,52 20,31 26,37 30,${11+t} 37,29 45,17 49,39 53,53`,c)+P(`25,51 29,33 35,39 39,23 46,48`,b)+P('31,49 35,38 40,50',a)+ring(32,34,r,b,2,.55);
}

function travel(id,t,[a,b,c]){
 const pulse=Math.sin((t+1)*Math.PI/9);
 if(id==='vineBurst')return Q(`M 0 20 Q 14 ${6+t} 28 25 Q 45 ${47-t} 64 17`,c,9)+Q(`M 0 20 Q 14 ${6+t} 28 25 Q 45 ${47-t} 64 17`,b,4)+Q(`M 0 47 Q 17 ${28-t} 34 45 Q 48 ${58-t} 64 37`,c,8)+Q(`M 0 47 Q 17 ${28-t} 34 45 Q 48 ${58-t} 64 37`,b,3)+[12,29,47,58].map((x,i)=>leaf(x,18+(i%2)*27,5,a,b,t*22+i*40)).join('');
 if(id==='smokescreen')return smoke(18,38,15,a,b,.72)+smoke(36,29,18,a,c,.86)+smoke(52,39,13,a,b,.68)+flecks(t,c,9);
 if(id==='fireSpin')return [0,1,2,3].map((i)=>{const q=t*.52+i*Math.PI/2,r=11+i*4;return P(`${32+Math.cos(q)*r},${32+Math.sin(q)*r-9} ${27+Math.cos(q)*r},${38+Math.sin(q)*r} ${38+Math.cos(q)*r},${36+Math.sin(q)*r}`,i%2?b:c)}).join('')+ring(32,34,22,a,3,.8);
 if(id==='bite')return jaws(t,a,b,c,.45+Math.abs(3.5-t)*.12);
 if(id==='iceFang')return jaws(t,a,b,c,.42+Math.abs(3.5-t)*.1)+[0,1,2,3].map((i)=>shard(14+i*13,12+(i%2)*39,5+i%2,a,b,t*24+i*32)).join('');
 if(id==='sandAttack')return P('0,49 13,27 27,37 39,17 64,35 64,58 0,58',c,.72)+[0,1,2,3,4].map(i=>C(10+i*12,17+(i*9+t*4)%29,2+i%2,i%2?a:b,.9)).join('');
 if(id==='mudSlap')return C(35,34,18,c)+C(29,27,11,b)+C(24,22,4,a)+[0,1,2,3].map(i=>C(9+i*15,14+(i*11+t*5)%35,3+i%2,i%2?b:c)).join('');
 if(id==='leaf')return leaf(32,32,22,a,b,t*32)+leaf(15,18,7,a,c,-t*41)+leaf(50,47,7,a,c,t*37)+Q(`M 1 ${37+t%4} Q 20 ${20-t%3} 62 31`,c,3,'none',.75);
 if(id==='ember')return P(`8,41 13,25 19,31 23,12 31,27 39,8 42,29 51,18 57,43`,c)+P(`17,42 23,28 30,35 37,18 44,39 51,31 53,44`,b)+P('27,41 33,31 40,43',a)+flecks(t,b,9);
 if(id==='hydroCannon')return P(`0,${18-pulse*3} 16,23 29,18 45,23 64,27 64,41 45,45 29,40 16,45 0,${46+pulse*3}`,c)+P('0,26 23,27 36,23 62,30 62,38 36,42 23,37 0,38',b)+R(0,30,64,7,a)+[13,31,49].map((x,i)=>ring(x,34,7+i%2,a,2,.75)).join('');
 if(id==='aquaWave')return Q(`M 0 45 Q 13 ${12-t%4} 28 37 Q 43 ${10+t%4} 64 28 L 64 58 L 0 58 Z`,c,4,b)+Q(`M 0 44 Q 13 ${12-t%4} 28 37 Q 43 ${10+t%4} 64 28`,a,5)+[12,32,53].map((x,i)=>C(x,12+(i*9+t*5)%24,2+i%2,a)).join('');
 if(id==='solarSeed')return C(32,32,15,c)+C(32,32,11,b)+C(27,26,5,a)+rays(8,14,26,a,3,t*12)+[0,1,2,3].map(i=>leaf(32+Math.cos(i*Math.PI/2+t*.18)*23,32+Math.sin(i*Math.PI/2+t*.18)*23,5,a,b,t*18+i*90)).join('');
 if(id==='flame')return Q(`M 2 39 Q 13 ${16-t%3} 25 34 Q 36 ${7+t%4} 47 31 Q 56 ${17-t%3} 63 25 L 63 48 Q 50 39 40 51 Q 25 38 12 49 Z`,c,3,b)+Q(`M 4 39 Q 16 23 27 37 Q 39 16 51 34 Q 58 26 62 30`,a,4)+flecks(t,b,7);
 if(id==='fireBlast')return rays(5,5,28,c,10,t*7)+rays(5,4,25,b,5,t*7)+rays(5,4,19,a,3,t*7)+C(32,32,8,a)+flecks(t,b,7);
 return C(32,32,18,c)+C(32,32,14,b)+C(27,26,6,a)+[0,1,2].map(i=>ring(32,32,21+i*5+(t%3),i%2?a:b,2,.8-i*.18)).join('')+flecks(t,a,5);
}

function impact(id,t,[a,b,c]){
 const grow=8+t*2.3,fade=1-t*.055;
 if(id==='vineBurst')return Q(`M 3 58 Q 14 ${8+t} 31 34 Q 47 ${56-t} 62 7`,c,10)+Q(`M 3 58 Q 14 ${8+t} 31 34 Q 47 ${56-t} 62 7`,b,4)+Q(`M 2 10 Q 19 ${55-t} 35 30 Q 49 ${4+t} 63 56`,c,9)+Q(`M 2 10 Q 19 ${55-t} 35 30 Q 49 ${4+t} 63 56`,b,3)+[0,1,2,3].map(i=>leaf(12+i*14,13+(i%2)*38,6,a,b,t*31+i*44)).join('');
 if(id==='smokescreen')return smoke(14,39,17,a,b,.72)+smoke(31,29,22,a,c,.88)+smoke(50,39,18,a,b,.76)+smoke(39,15,13,a,c,.65)+flecks(t,c,12);
 if(id==='fireSpin')return [0,1,2,3,4,5].map((i)=>{const q=t*.48+i*Math.PI/3,r=15+t*1.3;return P(`${32+Math.cos(q)*r},${32+Math.sin(q)*r-12} ${26+Math.cos(q)*r},${39+Math.sin(q)*r} ${39+Math.cos(q)*r},${37+Math.sin(q)*r}`,i%2?b:c)}).join('')+ring(32,36,20+t,a,4)+flecks(t,b,8);
 if(id==='bite')return jaws(t,a,b,c,Math.max(.06,.65-t*.09))+rays(6,20,28,b,2,t*12);
 if(id==='iceFang')return jaws(t,a,b,c,Math.max(.05,.6-t*.08))+[0,1,2,3,4,5].map((i)=>{const q=i*Math.PI/3+t*.08;return shard(32+Math.cos(q)*(18+t),32+Math.sin(q)*(15+t),6+i%2,a,b,t*26+i*30)}).join('')+C(32,32,8,a,.72);
 if(id==='sandAttack')return P('0,56 8,35 18,45 28,22 38,43 50,17 64,51 64,62 0,62',c,.72)+[0,1,2,3,4,5,6].map(i=>C(6+i*9,12+(i*13+t*5)%39,2+i%3,i%2?a:b,fade)).join('');
 if(id==='mudSlap')return C(32,35,11+t*2.2,c,.85)+[0,1,2,3,4,5,6,7].map(i=>{const q=i*Math.PI/4+t*.08,r=10+t*2.2+i%2*5;return C(32+Math.cos(q)*r,35+Math.sin(q)*r*.75,3+i%3,i%2?b:c,fade)}).join('')+flecks(t,a,8);
 if(id==='leaf')return [0,1,2,3,4].map((i)=>leaf(32+Math.cos(i*1.257)*grow,32+Math.sin(i*1.257)*grow,9,a,i%2?b:c,t*42+i*72)).join('')+[0,1,2].map(i=>Q(`M ${6+i*9} ${55-i*7} Q ${24+i*6} ${18-i*2} ${50+i*4} ${9+i*8}`,i%2?b:a,3)).join('');
 if(id==='ember')return [0,1,2,3,4,5].map(i=>{const q=(i*60+t*16)*Math.PI/180,r=5+t*3+i%2*4;return C(32+Math.cos(q)*r,32+Math.sin(q)*r,3+i%3,i%2?b:c,fade)}).join('')+C(32,35,9+t,a,.75);
 if(id==='hydroCannon')return Q(`M 0 47 Q 11 ${11-t} 24 39 Q 37 ${4+t} 48 34 Q 57 ${15-t*.5} 64 24 L 64 61 L 0 61 Z`,c,5,b)+Q(`M 0 46 Q 12 ${10-t} 25 38 Q 38 ${5+t} 49 34 Q 58 16 64 24`,a,5)+[6,18,34,50,60].map((x,i)=>C(x,9+(i*13+t*7)%28,3+i%2,a)).join('');
 if(id==='aquaWave')return Q(`M 0 48 Q 14 ${18-t} 28 41 Q 43 ${9+t*.6} 64 31 L 64 60 L 0 60 Z`,c,4,b)+Q(`M 0 47 Q 14 ${18-t} 28 41 Q 43 ${9+t*.6} 64 31`,a,5)+flecks(t,a,8);
 if(id==='solarSeed')return C(32,41,7+t,c)+Q(`M 32 42 Q 30 23 32 ${9-t} M 31 30 Q 15 23 8 ${12+t} M 33 32 Q 48 21 57 ${9+t}`,b,5)+Q('M 32 42 L 32 13',a,2)+[0,1,2,3].map(i=>leaf(14+i*12,12+(i%2)*30,6,a,i%2?b:c,t*25+i*50)).join('');
 if(id==='flame')return [0,1,2,3,4].map(i=>{const x=5+i*13;return P(`${x},59 ${x+2},${38-(t+i)%8} ${x+7},45 ${x+10},${13+(t+i)%15} ${x+14},43 ${x+16},59`,i%2?b:c)}).join('')+Q('M 2 57 Q 31 47 62 57',a,4)+flecks(t,a,8);
 if(id==='fireBlast')return rays(5,6,grow+13,c,10,t*10)+rays(5,4,grow+9,b,5,t*10)+rays(5,3,grow+5,a,3,t*10)+C(32,32,9+t,a)+flecks(t,b,12);
 return [0,1,2,3].map(i=>ring(32,32,7+i*8+t*1.2,i%2?a:b,3,1-i*.18)).join('')+[0,1,2,3,4].map(i=>{const q=(i*72+t*12)*Math.PI/180;return C(32+Math.cos(q)*(18+t*2),32+Math.sin(q)*(18+t*2),2+i%2,c)}).join('');
}

await mkdir(output,{recursive:true});
for(const id of moves)for(const phase of ['cast','travel','impact']){
 const frames=Array.from({length:8},(_,t)=>`<g transform="translate(${t*64} 0)">${phase==='cast'?cast(id,t,palettes[id]):phase==='travel'?travel(id,t,palettes[id]):impact(id,t,palettes[id])}</g>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="64" viewBox="0 0 512 64">${frames}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(resolve(output,`${id}-${phase}.png`));
}
console.log(`Built ${moves.length*3} priority move sheets.`);
