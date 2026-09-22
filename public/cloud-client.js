import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const SESSION_KEY = 'verdant-cloud-session';
const configured = /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 30;
const normalize = value => String(value || '').trim().toLowerCase();
const internalEmail = username => `${normalize(username)}@accounts.verdant.invalid`;

class CloudClient {
  constructor(){
    this.enabled = configured;
    this.session = null;
    this.saveTimer = 0;
    try { this.session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
  }
  async bootstrap(){
    if(!this.enabled||!this.session)return null;
    try{
      if(!this.session.expires_at||this.session.expires_at*1000<Date.now()+60000)await this.refresh();
      const user=await this.call('/auth/v1/user',{headers:this.headers(true)});
      if(user?.id!==this.session.user?.id)throw Error('Sessão inválida');
      return this.session;
    }catch{this.signOut();return null;}
  }
  async refresh(){
    if(!this.session?.refresh_token)throw Error('Sessão expirada');
    const data=await this.call('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:this.headers(),body:JSON.stringify({refresh_token:this.session.refresh_token})});
    return this.remember(data);
  }
  headers(auth=false){
    return {'Content-Type':'application/json', apikey:SUPABASE_ANON_KEY, ...(auth&&this.session?.access_token?{Authorization:`Bearer ${this.session.access_token}`}:{})};
  }
  async call(path, options={}){
    if(!this.enabled) throw Error('Supabase não configurado.');
    const response=await fetch(`${SUPABASE_URL}${path}`,options);
    const data=response.status===204?null:await response.json().catch(()=>null);
    if(!response.ok)throw Error(data?.msg||data?.message||data?.error_description||data?.error||'Falha no servidor.');
    return data;
  }
  remember(session){this.session={...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+(session.expires_in||3600)};localStorage.setItem(SESSION_KEY,JSON.stringify(this.session));return this.session;}
  async signUp(username,password){
    const data=await this.call('/auth/v1/signup',{method:'POST',headers:this.headers(),body:JSON.stringify({email:internalEmail(username),password,data:{username:normalize(username)}})});
    if(!data.access_token)throw Error('Desative a confirmação de e-mail no Supabase para usar login somente com usuário.');
    return this.remember(data);
  }
  async signIn(username,password){
    const data=await this.call('/auth/v1/token?grant_type=password',{method:'POST',headers:this.headers(),body:JSON.stringify({email:internalEmail(username),password})});
    return this.remember(data);
  }
  signOut(){clearTimeout(this.saveTimer);this.session=null;localStorage.removeItem(SESSION_KEY);}
  async loadGame(){
    if(!this.session?.access_token)return null;
    if(this.session.expires_at*1000<Date.now()+60000)await this.refresh();
    const rows=await this.call('/rest/v1/game_saves?select=world,account&limit=1',{headers:this.headers(true)});
    return rows?.[0]||null;
  }
  queueSave(world,account){
    if(!this.enabled||!this.session?.user?.id)return;
    clearTimeout(this.saveTimer);
    this.saveTimer=setTimeout(()=>this.saveGame(world,account).catch(error=>window.dispatchEvent(new CustomEvent('verdant-cloud-error',{detail:error.message}))),700);
  }
  async saveGame(world,account,keepalive=false){
    if(!this.session?.user?.id)return;
    if(this.session.expires_at*1000<Date.now()+60000)await this.refresh();
    await this.call('/rest/v1/game_saves?on_conflict=user_id',{method:'POST',keepalive,headers:{...this.headers(true),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:this.session.user.id,world,account,updated_at:new Date().toISOString()})});
  }
}

export const cloud = new CloudClient();
