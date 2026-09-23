import {animationProfileFor,MOVE_AUDIO_FILES} from './move-animation-profiles.js';
import {EXTERNAL_MOVE_VFX} from './external-move-vfx.js';

const buffers=new Map();
async function bufferFor(context,key){
 const file=MOVE_AUDIO_FILES[key]||MOVE_AUDIO_FILES.impact,path=`/assets/audio/moves/${file}`;
 if(!buffers.has(path))buffers.set(path,fetch(path).then(response=>{if(!response.ok)throw new Error(`move audio ${response.status}`);return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes)).catch(()=>null));
 return buffers.get(path);
}
export async function preloadMoveAudio(context){await Promise.all([...new Set(Object.keys(MOVE_AUDIO_FILES))].map(key=>bufferFor(context,key)));}
export async function playMoveAudio(context,ability,volume=.12){
 if(!context||!ability)return;
 const exact=EXTERNAL_MOVE_VFX[ability.id]?.audio,path=exact?`/assets/audio/moves/external/${exact}`:null;
 let buffer;if(path){if(!buffers.has(path))buffers.set(path,fetch(path).then(response=>response.ok?response.arrayBuffer():null).then(bytes=>bytes&&context.decodeAudioData(bytes)).catch(()=>null));buffer=await buffers.get(path);}else buffer=await bufferFor(context,animationProfileFor(ability).sound);if(!buffer)return;
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(context.destination);source.start();
}
export function moveAudioCacheSize(){return buffers.size;}
