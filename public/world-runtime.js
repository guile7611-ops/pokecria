export class MinHeap {
 constructor(){this.items=[];}
 get length(){return this.items.length;}
 push(item){const a=this.items;let i=a.length;a.push(item);while(i>0){const p=(i-1)>>1;if(a[p].score<=item.score)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.items,top=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;}return top;}
}
export class ObjectPool {
 constructor(limit=128){this.free=[];this.limit=limit;}
 take(data){return Object.assign(this.free.pop()||{},data);}
 release(item){if(this.free.length<this.limit){for(const k of Object.keys(item))delete item[k];this.free.push(item);}}
}
export class Discovery {
 constructor(map, saved=[],savedCols=Math.ceil(map.cols/8)){this.map=map;this.size=8;this.cols=Math.ceil(map.cols/8);this.rows=Math.ceil(map.rows/8);this.seen=new Set(saved.map(n=>Math.floor(n/savedCols)*this.cols+n%savedCols).filter(n=>Number.isInteger(n)&&n>=0&&n<this.cols*this.rows));this.current=new Set();this.last='';}
 reveal(p){const x=Math.floor(p.x/32/8),y=Math.floor(p.y/32/8),key=`${x},${y}`;if(key===this.last)return;this.last=key;this.current.clear();for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=5&&x+dx>=0&&x+dx<this.cols&&y+dy>=0&&y+dy<this.rows){const id=(y+dy)*this.cols+x+dx;this.current.add(id);this.seen.add(id);}}
 state(x,y){const id=Math.floor(y/256)*this.cols+Math.floor(x/256);return this.current.has(id)?'CURRENT':this.seen.has(id)?'DISCOVERED':'UNKNOWN';}
}
export function loadWorldSave(storage){try{const s=JSON.parse(storage?.getItem('aurora-world-v2')||'null'),candidate=JSON.parse(storage?.getItem('aurora-inventory')||'null'),inventory=candidate&&typeof candidate.items==='object'?candidate:null;if(s&&Number.isInteger(s.seed)&&s.seed>=0&&s.seed<=4294967295)return {...s,seed:s.seed,seen:Array.isArray(s.seen)?s.seen:[],pc:Array.isArray(s.pc)?s.pc:[],inventory:inventory||s.inventory};if(inventory)return{seed:123456,seen:[],pc:[],inventory};}catch{}return {seed:123456,seen:[],pc:[]};}
export function saveWorld(storage,sim){try{sim.syncActivePokemon?.();const inventory=sim.inventory,world={seed:(sim.outdoor?.map||sim.map).seed,seen:[...(sim.outdoor?.discovery||sim.discovery).seen],discoveryCols:(sim.outdoor?.discovery||sim.discovery).cols,inventory,capturePlan:sim.capturePlan,pc:sim.pc,activePokemon:sim.activeSnapshot?.()||null};storage?.setItem('aurora-inventory',JSON.stringify(inventory));storage?.setItem('aurora-world-v2',JSON.stringify(world));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('verdant-world-save',{detail:world}));return true;}catch{return false;}}
