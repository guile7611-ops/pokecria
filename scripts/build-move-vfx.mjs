import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {ABILITIES} from '../public/data.js';

const root=resolve(fileURLToPath(new URL('../public/assets/sprites/vfx/moves/',import.meta.url)));
await mkdir(root,{recursive:true});
const palettes={Normal:['#fff8d6','#e5b96f','#936846'],Fire:['#fff28a','#ff932c','#c93524'],Water:['#e5ffff','#54d9ff','#1176bb'],Electric:['#ffffc2','#ffe343','#c37b10'],Grass:['#efffb0','#84df56','#25945b'],Ice:['#f8ffff','#a3f3ff','#42a9d7'],Fighting:['#ffe7a2','#f18d50','#a34232'],Poison:['#fbd0ff','#cf75dc','#792f9d'],Ground:['#fff0b7','#d5a260','#805735'],Flying:['#ffffff','#c5edfa','#72a2cf'],Psychic:['#ffe7fc','#f194df','#9e51b4'],Bug:['#edff9e','#a6d45b','#538a3b'],Rock:['#f9e9c5','#b99b7b','#6e635a'],Ghost:['#e4d2ff','#9c78d7','#4b386f'],Dragon:['#eeebff','#8e9bf0','#454bb2'],Dark:['#d9d4ed','#8b78a5','#3c345d'],Steel:['#ffffff','#bfdce9','#6e8fa5'],Fairy:['#fff4fc','#ffa8e7','#d76cae']};
const motifs={
 leaf:'leaf',razorLeaf:'leaves',solarSeed:'seed',vineBurst:'vines',solarBeam:'beam',growth:'rising',poisonPowder:'spores',synthesis:'sun',megaDrain:'drain',bloom:'petals',
 ember:'spark',flame:'flame',fireBlast:'blast',flamethrower:'flame',inferno:'blast',fireSpin:'spiral',flameWheel:'wheel',smokescreen:'smoke',
 water:'drop',waterPulse:'rings',hydroPump:'jet',aquaWave:'wave',hydroCannon:'jet',whirlpool:'spiral',
 recover:'crosses',rapidSpin:'wheel',tailWhip:'arc',protect:'shield',agility:'streaks',sandAttack:'dust',peck:'beak',mudSlap:'splat',iceFang:'fang',crunch:'jaws',
 neutralPulse:'rings',impact:'impact',starBurst:'stars',
};
const color=(s)=>s.replaceAll('&','&amp;');
const C=(x,y,r,fill,opacity=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
const L=(x1,y1,x2,y2,stroke,w=3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="square"/>`;
const P=(pts,fill)=>`<polygon points="${pts}" fill="${fill}"/>`;
const R=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const Q=(d,stroke,w=3,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"/>`;
const seed=(id)=>[...id].reduce((a,c)=>((a*33+c.charCodeAt(0))>>>0),5381);
const rand=(n)=>((Math.sin(n*127.1)*43758.5453)%1+1)%1;
const spokes=(n,r1,r2,c,w=2,angle=0)=>Array.from({length:n},(_,i)=>{const a=angle+i*2*Math.PI/n;return L(32+Math.cos(a)*r1,32+Math.sin(a)*r1,32+Math.cos(a)*r2,32+Math.sin(a)*r2,c,w)}).join('');
function draw(motif,t,p,s){
 const [a,b,d]=p,u=Math.sin((t+1)/9*Math.PI),r=4+u*19,z=t*2;
 const dots=(count,rad,fill)=>Array.from({length:count},(_,i)=>{const theta=i*2.399+s*.001+t*.24,rr=rad*(.3+.7*rand(s+i*71));return C(32+Math.cos(theta)*rr,32+Math.sin(theta)*rr,1+(i%3),fill)}).join('');
 switch(motif){
 case 'lightning':return Q(`M 8 ${19+t} L 24 27 L 18 35 L 37 30 L 30 42 L 55 ${28-t}`,b,6)+Q(`M 8 ${19+t} L 24 27 L 18 35 L 37 30 L 30 42 L 55 ${28-t}`,a,2)+spokes(5,17,r+16,b,2,t*.2);
 case 'ice':return P(`32,${8+z} 39,27 55,33 39,38 32,${56-z} 25,38 9,33 25,27`,b)+P(`32,${15+z} 35,30 49,33 35,35 32,${49-z} 29,35 15,33 29,30`,a)+dots(6,23,d);
 case 'shadow':return C(32,32,r+5,d)+C(32,32,r,b)+C(27,26,r*.32,a)+spokes(4,r+4,r+12,d,4,t*.35);
 case 'psychic':return Array.from({length:3},(_,i)=>`<ellipse cx="32" cy="32" rx="${8+i*7+t}" ry="${16+i*4}" fill="none" stroke="${p[i]}" stroke-width="2" transform="rotate(${t*20+i*60} 32 32)"/>`).join('')+C(32,32,5,a);
 case 'quake':return Q(`M 0 43 L 18 38 L 24 ${30-z} L 31 42 L 38 35 L 45 ${36+z} L 64 29`,d,6)+Q(`M 31 42 L 25 54 M 38 35 L 50 49`,b,4)+dots(7,27,b);
 case 'rocks':return Array.from({length:4},(_,i)=>{const x=11+i*14,y=16+((i*9+t*5)%37);return P(`${x},${y} ${x+8},${y-3} ${x+13},${y+5} ${x+6},${y+12} ${x-2},${y+6}`,i%2?b:d)+P(`${x},${y} ${x+8},${y-3} ${x+4},${y+5}`,a)}).join('');
 case 'sludge':return C(32,32,r,b)+C(28,28,r*.55,a)+dots(8,r+14,d)+Array.from({length:3},(_,i)=>C(18+i*14,51-t*2,2+i,b)).join('');
 case 'dragon':return Q(`M 5 32 Q 20 ${8+t} 31 30 T 59 ${25+t}`,b,11)+Q(`M 5 32 Q 20 ${8+t} 31 30 T 59 ${25+t}`,a,4)+P('47,22 60,28 47,36',d);
 case 'moon':return C(32,32,r+2,a)+C(39,24,r+1,b)+spokes(7,r+4,r+13,a,2,t*.15)+dots(5,28,b);
 case 'steel':return P(`9,29 23,22 35,22 55,30 35,38 23,38`,d)+P(`11,29 23,26 36,26 53,30 36,34 23,34`,a)+R(11,29,42,2,b)+spokes(4,20,r+12,a,2);
 case 'cross':return L(11+z,12,53-z,52,b,10)+L(53-z,12,11+z,52,b,10)+L(11+z,12,53-z,52,a,4)+L(53-z,12,11+z,52,a,4);
 case 'punch':return P(`22,8 39,8 43,24 38,37 33,54 25,41 18,28`,d)+P(`25,12 36,12 38,25 32,40 24,27`,b)+L(10,47,20,35,a,3)+L(45,48,55,35,a,3);
 case 'wind':return Q(`M 5 ${19+z} Q 28 5 57 23 M 3 34 Q 35 ${18+z} 61 35 M 8 49 Q 34 35 56 48`,b,4)+Q(`M 8 ${19+z} Q 28 5 55 23`,a,2);
 case 'wave':return Q(`M 2 44 Q 15 ${19-z} 27 38 Q 41 ${8+z} 62 32 L 62 56 Q 32 43 2 55 Z`,b,4,b)+Q(`M 2 43 Q 15 ${19-z} 27 38 Q 41 ${8+z} 62 32`,a,4);
 case 'waterfall':return Array.from({length:4},(_,i)=>Q(`M ${16+i*11} 6 Q ${9+i*12} 31 ${16+i*11} 56`,i%2?a:b,4)).join('')+dots(6,24,a);
 case 'slash':return Q(`M 8 50 Q ${21+z} 19 57 11`,a,6)+Q('M 12 52 Q 28 27 60 14',d,2);
 case 'impact':return C(32,32,r*.55,b)+C(32,32,r*.27,a)+spokes(9,r*.6,r+15,a,3,t*.1);
 case 'feathers':return Array.from({length:5},(_,i)=>{const x=8+i*11,y=7+((i*13+t*7)%45);return Q(`M ${x} ${y} Q ${x+15} ${y+6} ${x+5} ${y+19} Q ${x-3} ${y+9} ${x} ${y}`,b,2,a)}).join('');
 case 'shatter':return P('22,12 46,17 53,39 30,51 12,37',d)+Array.from({length:7},(_,i)=>{const x=32+Math.cos(i)*r,y=32+Math.sin(i)*r;return P(`${x},${y} ${x+5},${y-3} ${x+3},${y+7}`,i%2?a:b)}).join('');
 case 'flash':return C(32,32,7+u*10,a)+spokes(12,7,r+15,a,3,t*.1);
 case 'bubbles':return Array.from({length:10},(_,i)=>{const x=8+rand(s+i)*48,y=54-((t*8+i*11)%50);return `<circle cx="${x}" cy="${y}" r="${2+i%4}" fill="none" stroke="${i%2?a:b}" stroke-width="2"/>`}).join('');
 case 'aura':return C(32,32,r,b)+C(32,32,r*.57,a)+Array.from({length:3},(_,i)=>`<ellipse cx="32" cy="32" rx="${r+6}" ry="${7+i*4}" fill="none" stroke="${a}" stroke-width="2" transform="rotate(${t*30+i*60} 32 32)"/>`).join('');
 case 'seed':return C(32,32,r,b)+C(27,28,r*.4,a)+Array.from({length:4},(_,i)=>P(`${32+Math.cos(i*1.57)*r},${32+Math.sin(i*1.57)*r} ${32+Math.cos(i*1.57+.5)*(r+14)},${32+Math.sin(i*1.57+.5)*(r+14)} ${32+Math.cos(i*1.57-.5)*(r+14)},${32+Math.sin(i*1.57-.5)*(r+14)}`,d)).join('');
 case 'flame':return P(`18,49 18,30 26,35 24,14 35,24 43,8 47,32 52,38 46,54`,d)+P(`24,49 28,31 35,36 38,22 45,44 39,53`,b)+P('29,48 34,36 40,48',a);
 case 'leaf':case 'leaves':return Array.from({length:motif==='leaf'?1:5},(_,i)=>{const theta=i*2.4+t*.25,rad=i?7+i*4:0,x=32+Math.cos(theta)*rad,y=32+Math.sin(theta)*rad;return P(`${x},${y-13} ${x+10},${y} ${x},${y+13} ${x-10},${y}`,i%2?b:a)+L(x,y-9,x,y+9,d,2)}).join('');
 case 'vines':return Q(`M 1 54 Q 16 ${20-z} 31 36 Q 44 ${48-z} 64 10`,d,9)+Q(`M 1 54 Q 16 ${20-z} 31 36 Q 44 ${48-z} 64 10`,b,4)+P('27,31 16,19 30,23',a)+P('43,28 55,24 47,39',a);
 case 'beam':case 'jet':return P(`2,${27-u*4} 59,20 59,44 2,${37+u*4}`,d)+P(`3,29 60,27 60,37 3,35`,b)+L(3,32,61,32,a,3)+dots(4,27,a);
 case 'rising':return Array.from({length:5},(_,i)=>{const x=10+i*11,y=56-((i*9+t*6)%50);return P(`${x},${y} ${x+5},${y-11} ${x+10},${y}`,i%2?a:b)}).join('');
 case 'spores':case 'dust':case 'smoke':return dots(16,12+r,motif==='spores'?b:motif==='smoke'?d:a)+C(32,32,r*.65,b,.5);
 case 'sun':return C(32,32,r*.7,a)+spokes(10,r*.8,r+11,b,3,t*.1);
 case 'drain':return Q(`M 9 30 Q 30 ${5+t} 55 33 Q 34 57 9 30`,b,4)+C(32,32,r*.5,a)+dots(5,20,d);
 case 'petals':return Array.from({length:6},(_,i)=>{const angle=i*60+t*15;return `<ellipse cx="32" cy="${32-r*.65}" rx="5" ry="${r*.65}" fill="${i%2?a:b}" transform="rotate(${angle} 32 32)"/>`}).join('')+C(32,32,5,d);
 case 'spark':return spokes(7,2,r+9,a,3,t*.2)+C(32,32,7,b);
 case 'blast':return spokes(9,6,r+13,d,7,t*.1)+spokes(9,6,r+8,b,3,t*.1)+C(32,32,r*.45,a);
 case 'spiral':return Q(`M 32 32 C ${8-t} 12 8 50 35 53 C 64 56 68 11 28 7`,b,6)+Q(`M 32 32 C ${8-t} 12 8 50 35 53 C 64 56 68 11 28 7`,a,2);
 case 'wheel':return `<g transform="rotate(${t*35} 32 32)"><circle cx="32" cy="32" r="19" fill="none" stroke="${d}" stroke-width="8"/><circle cx="32" cy="32" r="17" fill="none" stroke="${b}" stroke-width="4"/>${spokes(8,4,18,a,3)}${Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4,x=32+Math.cos(angle)*23,y=32+Math.sin(angle)*23,tipX=32+Math.cos(angle)*(30+(i+t)%3),tipY=32+Math.sin(angle)*(30+(i+t)%3);return P(`${x-3},${y-3} ${tipX},${tipY} ${x+3},${y+3}`,i%2?a:b)}).join('')}<circle cx="32" cy="32" r="5" fill="${d}"/></g>`;
 case 'drop':return P(`32,${7+z} 47,34 43,47 32,54 21,47 17,34`,b)+P(`29,${16+z} 36,31 30,41 23,36`,a);
 case 'rings':return [0,1,2].map(i=>`<circle cx="32" cy="32" r="${Math.max(3,(r+i*9)%29)}" fill="none" stroke="${p[i]}" stroke-width="3"/>`).join('');
 case 'crosses':return R(27,11,10,42,b)+R(11,27,42,10,b)+R(29,15,6,34,a)+R(15,29,34,6,a)+spokes(4,24,r+8,a,2);
 case 'shield':return P('32,6 53,15 49,43 32,57 15,43 11,15',d)+P('32,11 48,18 45,40 32,51 19,40 16,18',b)+Q('M 22 31 L 30 39 L 43 23',a,4);
 case 'streaks':return [0,1,2,3].map(i=>L(5,12+i*12,50+z,12+i*12,i%2?a:b,3)).join('');
 case 'arc':return Q(`M 8 49 Q 6 ${7+z} 56 21`,b,8)+Q(`M 8 49 Q 6 ${7+z} 56 21`,a,3);
 case 'beak':return P(`9,23 55,31 10,42 29,32`,b)+P('18,28 51,32 18,36',a);
 case 'splat':return C(32,32,r*.75,b)+spokes(8,r*.5,r+11,d,5,t*.2)+dots(6,27,a);
 case 'fang':{const close=Math.min(15,t*3);return P(`11,${4+close} 25,${9+close} 28,${32+close} 20,${42+close}`,a)+P(`53,${4+close} 39,${9+close} 36,${32+close} 44,${42+close}`,b)+P(`11,${60-close} 25,${55-close} 28,${32-close} 20,${22-close}`,b)+P(`53,${60-close} 39,${55-close} 36,${32-close} 44,${22-close}`,a)+spokes(6,8,r+10,a,2,t*.1)+dots(6,20,b);}
 case 'jaws':{const close=Math.min(15,t*3);return Q(`M 10 ${13+close} L 21 ${22+close} L 28 ${14+close} L 35 ${23+close} L 42 ${13+close} L 54 ${20+close} M 10 ${51-close} L 21 ${42-close} L 28 ${50-close} L 35 ${41-close} L 42 ${51-close} L 54 ${44-close}`,a,5)+C(32,32,r*.4,d);}
 case 'stars':return spokes(10,3,r+12,a,4,t*.1)+C(32,32,r*.5,b)+C(32,32,4,a);
 default:return C(32,32,r,b)+spokes(6,r,r+8,a,2);
 }
}
let count=0;
for(const ability of Object.values(ABILITIES)){
 if(ability.id==='basic')continue;
 const motif=ability.motif||motifs[ability.id]||'stars',palette=palettes[ability.type]||palettes.Normal,s=seed(ability.id);
 const frames=Array.from({length:8},(_,t)=>{const accents=Array.from({length:4},(_,i)=>C(5+Math.floor(rand(s+i*919+t*41)*54),5+Math.floor(rand(s+i*311+t*73)*54),1+(s+i)%2,palette[i%3])).join('');return `<g transform="translate(${t*64} 0)">${draw(motif,t,palette,s)}${accents}</g>`}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="64" viewBox="0 0 512 64">${frames}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(resolve(root,`${ability.id}.png`));count++;
}
console.log(`Generated ${count} individual move animation sheets in ${root}`);
