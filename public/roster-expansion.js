// Regional forms and Mega Evolutions are separate future mechanics.
export const NEW_FAMILIES=[
 ['growlithe','arcanine'],['tyrogue','hitmonlee','hitmonchan','hitmontop'],['bonsly','sudowoodo'],['gligar','gliscor'],['swinub','piloswine','mamoswine'],['riolu','lucario'],['seedot','nuzleaf','shiftry'],['slakoth','vigoroth','slaking'],['pichu','pikachu','raichu'],['nosepass','probopass'],['shuppet','banette'],['absol'],['bagon','shelgon','salamence'],['gallade'],
];
export const NEW_SPECIES=NEW_FAMILIES.flat();
export const NEW_SPAWN_RULES={
 growlithe:{rarity:'uncommon',regions:['vulcao','deserto','cinzas'],time:'day'},arcanine:{rarity:'rare'},
 tyrogue:{rarity:'rare',regions:['encosta','campos'],time:'day'},hitmonlee:{rarity:'epic'},hitmonchan:{rarity:'epic'},hitmontop:{rarity:'epic'},
 bonsly:{rarity:'uncommon',regions:['encosta','bosque'],time:'day'},sudowoodo:{rarity:'rare'},
 gligar:{rarity:'rare',regions:['encosta','deserto'],layers:['aurora-peaks'],time:'night'},gliscor:{rarity:'epic'},
 swinub:{rarity:'uncommon',regions:['neve','norte'],time:'any'},piloswine:{rarity:'rare',regions:['neve'],layers:['aurora-peaks'],time:'any'},mamoswine:{rarity:'epic'},
 riolu:{rarity:'rare',regions:['encosta','pradaria'],time:'day'},lucario:{rarity:'epic'},
 seedot:{rarity:'common',regions:['bosque','mata','jardim-leste'],time:'day'},nuzleaf:{rarity:'rare',regions:['mata','jardim-leste'],time:'day'},shiftry:{rarity:'epic'},
 slakoth:{rarity:'uncommon',regions:['mata','jardim-leste'],time:'day'},vigoroth:{rarity:'rare',regions:['mata','jardim-leste'],time:'day'},slaking:{rarity:'epic',regions:['jardim-leste'],time:'day'},
 pichu:{rarity:'rare',regions:['bosque','estepe','pradaria'],time:'day'},pikachu:{rarity:'epic'},raichu:{rarity:'legendary'},
 nosepass:{rarity:'uncommon',regions:['encosta','caverna'],layers:['crystal-depths','ember-depths'],time:'any'},probopass:{rarity:'rare'},
 shuppet:{rarity:'uncommon',regions:['ruinas','pantano','mangue'],layers:['root-depths'],time:'night'},banette:{rarity:'rare',regions:['ruinas','mangue'],layers:['root-depths'],time:'night'},
 absol:{rarity:'epic',regions:['norte','encosta'],layers:['aurora-peaks'],time:'night'},
 bagon:{rarity:'rare',regions:['encosta'],layers:['crystal-depths','aurora-peaks'],time:'day'},shelgon:{rarity:'epic',layers:['crystal-depths','aurora-peaks'],time:'day'},salamence:{rarity:'legendary',layers:['aurora-peaks'],time:'day'},gallade:{rarity:'epic'},
};
