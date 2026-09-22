import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {STARTER_ATTACKS} from '../public/starter-attack-vfx.js';

const root=resolve(fileURLToPath(new URL('../public/assets/sprites/vfx/starters/',import.meta.url)));
const colors={
 bulbasaur:['#d5ff9b','#56d76b','#19794f'],chikorita:['#f4ffac','#a0df5a','#64a840'],treecko:['#b5ffb0','#27c98b','#067d67'],
 charmander:['#fff3a3','#ff9b39','#d43b2a'],cyndaquil:['#fff8ba','#ffb334','#e44a22'],torchic:['#fff5b2','#ff8137','#b82f32'],
 squirtle:['#ecffff','#78deff','#2384c9'],totodile:['#edffff','#4cc8f8','#14639d'],mudkip:['#f3ffef','#67c9ec','#3977a3']};
const circle=(x,y,r,c,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
const ring=(x,y,r,c,w=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const path=(d,c,w=3,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="round"/>`;
const poly=(p,c)=>`<polygon points="${p}" fill="${c}"/>`;
const ray=(angle,r1,r2,c,w=3)=>{const q=angle*Math.PI/180;return path(`M ${32+Math.cos(q)*r1} ${32+Math.sin(q)*r1} L ${32+Math.cos(q)*r2} ${32+Math.sin(q)*r2}`,c,w)};
const rays=(n,r1,r2,c,w=3,offset=0)=>Array.from({length:n},(_,i)=>ray(i*360/n+offset,r1,r2,c,w)).join('');
const sparks=(t,c,n=7)=>Array.from({length:n},(_,i)=>{const q=(i*137+t*39)*Math.PI/180,r=11+((i*13+t*7)%19);return circle(32+Math.cos(q)*r,32+Math.sin(q)*r,1+i%2,c)}).join('');
const leaf=(x,y,size,a,b,angle=0)=>`<g transform="rotate(${angle} ${x} ${y})">${poly(`${x-size},${y} ${x},${y-size*.7} ${x+size},${y} ${x},${y+size*.7}`,b)}${path(`M ${x-size} ${y} L ${x+size} ${y}`,a,2)}</g>`;
function speciesMark(species,t,[a,b,c],phase){
 const r=phase==='impact'?22:18;
 switch(species){
 case 'bulbasaur':return circle(13,16+t%3,3,c)+circle(49,47-t%3,3,c)+path('M 11 46 Q 23 38 24 50 M 43 12 Q 52 22 56 15',b,3);
 case 'chikorita':return [0,1,2].map(i=>leaf(14+i*18,11+(i%2)*40,5,a,b,t*12+i*45)).join('');
 case 'treecko':return [0,1,2].map(i=>poly(`${7+i*19},${50-i*9} ${13+i*19},${37-i*9} ${17+i*19},${48-i*9}`,i%2?b:c)).join('');
 case 'charmander':return poly(`10,52 13,${43-t%4} 16,48 18,54`,b)+poly(`49,54 52,${42+t%4} 56,50 54,55`,a);
 case 'cyndaquil':return [0,1,2].map(i=>poly(`${8+i*18},55 ${14+i*18},${37-t%5} ${20+i*18},55`,i%2?a:b)).join('');
 case 'torchic':return [0,1,2].map(i=>path(`M ${7+i*20} 53 Q ${12+i*20} ${39-t%5} ${19+i*20} 48`,a,3)).join('');
 case 'squirtle':return ring(32,32,r+4,c,2)+circle(10,14,2,a)+circle(53,51,2,a);
 case 'totodile':return poly('8,12 17,14 13,23',a)+poly('51,47 59,44 54,55',a)+ring(32,32,r,c,2);
 case 'mudkip':return path(`M 5 47 Q 12 ${35+t} 19 47 M 44 17 Q 51 ${6+t} 59 17`,c,3)+circle(9,22,2,b)+circle(55,43,3,b);
 default:return '';
 }
}
function travel(move,t,[a,b,c]){
 const pulse=Math.sin((t+1)*Math.PI/9),size=7+pulse*3;
 switch(move){
 case 'leaf':return leaf(32,32,17,a,b,t*20)+path('M 4 32 L 13 32 M 8 23 L 16 26',c,3);
 case 'razorLeaf':return [0,1,2].map(i=>leaf(20+i*12,23+(i%2)*17,11,a,i%2?b:c,t*30+i*38)).join('');
 case 'solarSeed':return circle(32,32,13,c)+circle(32,32,10,b)+circle(29,29,5,a)+rays(8,13,20,a,3,t*10);
 case 'vineBurst':return path(`M 4 20 Q 19 ${12+t*2} 31 28 Q 43 44 59 22`,c,7)+path(`M 4 42 Q 20 ${51-t*2} 31 36 Q 46 15 59 42`,b,5)+leaf(51,21,9,a,b,-35);
 case 'solarBeam':return poly(`2,${27-pulse*3} 15,25 47,25 62,32 47,39 15,39 2,${37+pulse*3}`,c)+poly('2,29 50,29 62,32 50,35 2,35',b)+path('M 3 32 L 61 32',a,3)+sparks(t,a,5);
 case 'ember':return circle(34,33,size+4,c)+poly(`23,39 25,${25-t%4} 31,30 34,17 41,30 45,39`,b)+circle(34,35,size*.55,a);
 case 'flame':return circle(32,32,12,c)+poly(`17,42 20,22 27,29 32,9 40,28 48,18 48,45`,b)+poly('26,40 32,22 39,41',a);
 case 'fireBlast':return rays(5,3,24,c,9,t*6)+rays(5,2,21,b,4,t*6)+circle(32,32,8,a);
 case 'flamethrower':return poly(`3,29 23,${22-t%4} 27,${13+t%6} 38,25 51,${16-t%5} 61,29 54,${41+t%3} 37,37 24,${44-t%4} 3,37`,c)+poly(`4,31 26,${27+t%3} 33,${19-t%4} 42,30 58,27 52,36 25,37 4,35`,b)+path(`M 7 33 Q 34 ${28+t%5} 56 33`,a,4)+[0,1,2].map(i=>poly(`${21+i*13},35 ${26+i*13},${22-(t+i)%6} ${31+i*13},36`,a)).join('');
 case 'inferno':return circle(32,35,14+t%4,c)+poly(`9,51 15,${27-t%5} 23,37 23,${13+t%4} 32,27 42,${7+t%6} 43,32 52,${22-t%5} 55,52`,c)+poly(`17,49 23,33 29,36 32,${19+t%5} 39,36 48,31 48,51`,b)+circle(32,38,9,a)+rays(7,15,25,b,3,t*14)+sparks(t,a,8);
 case 'water':return poly(`31,10 46,33 43,48 32,53 21,48 18,33`,c)+poly('31,14 41,34 37,44 27,45 23,34',b)+circle(28,27,5,a);
 case 'waterPulse':return circle(32,32,9,b)+[0,1,2].map(i=>ring(32,32,12+i*7+(t%3),i%2?a:c,2)).join('');
 case 'hydroPump':return poly('3,24 44,24 60,30 60,38 44,40 3,40',c)+poly(`3,${28-t%3} 49,29 61,33 49,36 3,36`,b)+path('M 4 32 L 59 32',a,4);
 case 'aquaWave':return path(`M 2 43 Q 18 ${13-t%4} 34 36 Q 47 15 62 30 L 62 54 L 2 54 Z`,c,3,b)+path('M 3 42 Q 18 13 34 36 Q 47 15 62 30',a,4);
 case 'whirlpool':return path(`M 32 31 C 13 17 7 48 33 52 C 65 56 66 17 33 11 C 11 7 9 27 29 31`,c,9)+path(`M 32 31 C 13 17 7 48 33 52 C 65 56 66 17 33 11`,b,4)+circle(32,32,5,a);
 case 'hydroCannon':return poly('1,20 24,25 43,21 63,29 63,40 42,44 23,39 1,44',c)+poly('3,28 36,27 60,31 60,37 34,37 3,36',b)+path('M 3 32 L 62 34',a,5)+circle(53,33,7,a);
 default:return circle(32,32,12,b);
 }
}
function cast(move,t,[a,b,c]){
 const r=5+t*2.4,strong=['solarBeam','inferno','hydroCannon'].includes(move),n=strong?12:7;
 const core=move==='solarBeam'?rays(9,4,r+7,a,2,t*8):move==='inferno'?Array.from({length:5},(_,i)=>poly(`${15+i*8},47 ${18+i*8},${34-t*2} ${22+i*8},48`,i%2?b:c)).join(''):move==='hydroCannon'?[0,1,2].map(i=>ring(32,32,6+i*7+(t%3),i%2?b:a,2)).join(''):rays(n,Math.max(1,r-8),r+6,b,2,t*13);
 return ring(32,32,r,c,strong?4:3)+ring(32,32,Math.max(3,r-5),a,2)+core+circle(32,32,4+t*.45,a)+sparks(t,b,strong?12:6)+`<g transform="translate(22 22) scale(.32)">${travel(move,t,[a,b,c])}</g>`;
}
function impact(move,t,[a,b,c]){
 const spread=5+t*2;
 if(move==='leaf')return leaf(32,32,18-t*.6,a,b,t*27)+path(`M 5 32 L ${14+t} 32`,c,3);
 if(move==='razorLeaf')return [0,1,2,3,4].map(i=>leaf(8+i*12,12+(i%2)*38,6+t*.25,a,i%2?b:c,t*48+i*47)).join('');
 if(move==='vineBurst')return path(`M 0 ${37+t%5} Q 15 6 28 31 Q 48 57 64 ${20-t%4}`,c,10)+path(`M 0 ${37+t%5} Q 15 6 28 31 Q 48 57 64 ${20-t%4}`,b,4)+leaf(47,21,8,a,b,t*22);
 if(move==='solarSeed')return circle(32,32,8+t,c)+circle(30,29,4+t*.4,b)+[0,1,2,3].map(i=>leaf(32+Math.cos(i*1.57)*20,32+Math.sin(i*1.57)*20,5,a,b,t*20+i*90)).join('');
 if(move==='ember')return [0,1,2].map(i=>circle(18+i*14,40-i*7-t*2,3+i%2,i%2?b:a)).join('')+poly(`26,53 29,${35-t%5} 35,44 38,${25-t%4} 43,54`,c);
 if(move==='flame')return poly(`19,57 20,${35-t%6} 27,43 30,${17-t%3} 36,37 46,${26-t%5} 48,57`,c)+poly('27,55 32,34 39,54',b);
 if(move==='flamethrower')return path(`M 0 37 Q 18 ${20+t%5} 31 33 Q 46 ${15-t%4} 64 28 L 64 44 Q 43 39 30 45 Q 13 32 0 46 Z`,c,3,b)+path('M 1 39 Q 28 23 62 34',a,4);
 if(move==='fireBlast')return rays(5,6,26,c,8,t*10)+rays(5,4,23,b,4,t*10)+circle(32,32,6,a);
 if(move==='water')return poly(`32,${8+t} 45,31 43,45 32,52 21,45 19,31`,b)+poly('30,20 35,32 29,39 24,33',a);
 if(move==='waterPulse')return [0,1,2].map(i=>ring(32,32,8+i*8+t*.5,i%2?b:a,3)).join('');
 if(move==='hydroPump')return poly(`0,${25-t%3} 64,25 64,43 0,${42+t%3}`,c)+poly('0,30 64,30 64,37 0,37',b)+path('M 0 33 L 64 33',a,4);
 if(move==='aquaWave')return path(`M 0 44 Q 14 ${12-t%4} 30 37 Q 46 ${15+t%3} 64 27 L 64 57 L 0 57 Z`,c,3,b)+path(`M 0 44 Q 14 ${12-t%4} 30 37 Q 46 ${15+t%3} 64 27`,a,4);
 if(move==='hydroCannon')return path(`M 0 40 Q 12 ${14-t%4} 24 38 Q 39 ${9+t%4} 64 27 L 64 58 L 0 58 Z`,c,5,b)+[10,25,42,56].map((x,i)=>circle(x,12+(i*13+t*6)%23,3+i%2,a)).join('');
 if(['leaf','razorLeaf','vineBurst'].includes(move))return [0,1,2].map(i=>leaf(13+i*19,30+(i%2?spread:-spread),8-t*.3,a,i%2?b:c,t*36+i*70)).join('');
 if(['solarBeam','solarSeed'].includes(move))return path(`M 3 ${26-t*.35} L 61 ${26-t*.35} M 3 ${38+t*.35} L 61 ${38+t*.35}`,c,5)+path('M 3 32 L 61 32',a,7)+[12,31,51].map(x=>circle(x,32,3+t%3,b)).join('');
 if(['ember','flame','flamethrower'].includes(move))return [9,22,36,49].map((x,i)=>poly(`${x},56 ${x-3},${38-t%4} ${x+3},${43-t*2-i%3} ${x+7},${27-t%5} ${x+12},56`,i%2?b:c)).join('')+path(`M 4 55 Q 31 ${41-t%4} 61 54`,a,3);
 if(['inferno','fireBlast'].includes(move))return [0,1,2,3,4,5].map(i=>{const x=6+i*10;return poly(`${x},57 ${x-3},${34-(t+i)%7} ${x+3},${42-t%5} ${x+6},${12+(t+i)%10} ${x+10},${38-t%5} ${x+12},57`,i%2?b:c)}).join('')+sparks(t,a,7);
 if(['water','waterPulse','hydroPump','aquaWave','hydroCannon'].includes(move))return path(`M 1 ${44-t*.6} Q 11 ${16-t%4} 22 38 Q 32 ${10+t%3} 43 33 Q 53 ${14+t%4} 63 28 L 63 57 L 1 57 Z`,c,3,b)+path(`M 1 ${44-t*.6} Q 11 ${16-t%4} 22 38 Q 32 ${10+t%3} 43 33 Q 53 ${14+t%4} 63 28`,a,4)+[12,28,50].map((x,i)=>circle(x,12+(i*11+t*5)%28,2+i%2,a)).join('');
 if(move==='whirlpool')return path(`M 32 31 C ${13-t} 17 7 48 33 52 C 65 56 66 17 33 11 C 11 7 9 27 29 31`,c,9)+path(`M 32 31 C ${13-t} 17 7 48 33 52 C 65 56 66 17 33 11`,a,3);
 return travel(move,t,[a,b,c]);
}
let count=0;
for(const [species,moves] of Object.entries(STARTER_ATTACKS)){
 const directory=resolve(root,species);await mkdir(directory,{recursive:true});const palette=colors[species];
 for(const move of moves)for(const phase of ['cast','travel','impact']){
  const frames=Array.from({length:8},(_,t)=>`<g transform="translate(${t*64} 0)">${phase==='cast'?cast(move,t,palette):phase==='travel'?travel(move,t,palette):impact(move,t,palette)}${speciesMark(species,t,palette,phase)}</g>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="64" viewBox="0 0 512 64">${frames}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(resolve(directory,`${move}-${phase}.png`));count++;
 }
}
console.log(`Generated ${count} starter attack phase sheets`);
