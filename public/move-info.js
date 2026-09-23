export function baseDamageLabel(move){
 if(Number.isFinite(move.damage)&&move.damage>0)return `Dano base: ${move.damage}${['channel','zone','rolling','whip'].includes(move.behavior)?' por acerto':''}`;
 if(Number.isFinite(move.power)&&move.power>0)return `Poder base: ${move.power}${['channel','zone','rolling','whip'].includes(move.behavior)?' por acerto':''}`;
 if(Number.isFinite(move.healing)&&move.healing>0)return `Cura: ${move.healing}`;
 return 'Sem dano';
}
