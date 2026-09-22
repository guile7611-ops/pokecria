import {cloud} from './cloud-client.js';
import {RealtimeOnline} from './realtime-online.js';
export class OnlineClient {
  constructor(handlers={}){if(cloud.enabled)return new RealtimeOnline(handlers);this.handlers=handlers;this.id=null;this.token=null;this.players=[];this.guildId=null;this.pendingInvite=null;this.stream=null;this.sending=false;}
  async request(path,data={}){
    const response=await fetch(`/api/online/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...(this.token?{'x-verdant-session':this.token}:{})},body:JSON.stringify(data)});
    const result=await response.json();if(!response.ok)throw Error(result.error||'Falha de conexão');return result;
  }
  async join(state){if(this.token)return;const {id,token}=await this.request('join',{nick:state.nick,pokemon:state.pokemon});this.id=id;this.token=token;
    this.stream=new EventSource(`/api/online/events?token=${encodeURIComponent(token)}`);
    for(const type of ['roster','combat','pvp-hit','pvp-result','guild-invite','guild-joined','guild-xp','wild-hit','wild-kill','boss-state'])this.stream.addEventListener(type,event=>{
      const data=JSON.parse(event.data);
      if(type==='roster'){this.players=data.players;this.guildId=this.players.find(p=>p.id===this.id)?.guildId||null;}
      if(type==='guild-invite')this.pendingInvite=data;
      if(type==='guild-joined'){this.pendingInvite=null;this.guildId=data.guildId;}
      this.handlers[type]?.(data);
    });
    this.stream.onerror=()=>this.handlers.error?.();
  }
  update(state){if(!this.token||this.sending)return;this.sending=true;this.request('state',state).catch(()=>{}).finally(()=>{this.sending=false;});}
  controlsCreature(){return true;}
  syncCreatures(){}
  async leave(){if(!this.token)return;const token=this.token;this.stream?.close();this.stream=null;this.token=null;try{await fetch('/api/online/leave',{method:'POST',headers:{'Content-Type':'application/json','x-verdant-session':token},body:'{}',keepalive:true});}catch{}}
}
