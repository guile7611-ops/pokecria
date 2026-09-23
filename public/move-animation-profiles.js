import {EXTERNAL_MOVE_VFX} from './external-move-vfx.js';
// Shared animation vocabulary for the runtime, the VFX builder and the audit.
// The profile is deliberately derived from gameplay data instead of species so
// newly imported moves automatically receive a fitting visual language.
export const SUPPORTED_MOVE_MOTIFS=new Set([
 'lightning','ice','shadow','psychic','quake','rocks','sludge','dragon','moon','steel','cross','punch','wind','wave','surf','muddyWater','waterfall','slash','impact','feathers','shatter','flash','bubbles','aura','seed','flame','leaf','leaves','vines','beam','jet','rising','spores','dust','smoke','sun','drain','petals','spark','blast','spiral','wheel','drop','rings','crosses','shield','streaks','arc','beak','splat','fang','jaws','doubleKick','mudShot','blazeKick','tackle','scratch','quickAttack','takeDown','rockThrow','absorb','gigaDrain','growl','leer','screech','scaryFace','hypnosis','toxic','yawn','leechSeed','amnesia','defenseCurl','lightScreen','detect','focusEnergy','rainDance','doubleEdge','suckerPunch','aquaTail','bodySlam','pound','fireFang','furySwipes','bubbleBeam','confusion','thunderShock','discharge','electroBall','harden','ironDefense','bulkUp','teleport','poisonSting','stringShot','bugBite','stunSpore','sleepPowder','supersonic','aerialAce','gust','stars'
]);

const exact={
 flameWheel:'wheel',fireSpin:'spiral',flamethrower:'flame',fireBlast:'blast',inferno:'blast',hydroPump:'jet',hydroCannon:'jet',waterPulse:'rings',bubbleBeam:'bubbleBeam',aquaRing:'rings',aquaTail:'aquaTail',muddyWater:'muddyWater',sandTomb:'spiral',rockTomb:'rocks',rockSlide:'rocks',rockBlast:'rockThrow',stoneEdge:'rocks',earthquake:'quake',earthPower:'quake',bulldoze:'quake',iceFang:'fang',fireFang:'fireFang',poisonFang:'fang',crunch:'jaws',bite:'jaws',doubleKick:'doubleKick',blazeKick:'blazeKick',quickAttack:'quickAttack',takeDown:'takeDown',doubleEdge:'doubleEdge',bodySlam:'bodySlam',suckerPunch:'suckerPunch',furySwipes:'furySwipes',rockThrow:'rockThrow',mudShot:'mudShot',absorb:'absorb',gigaDrain:'gigaDrain',megaDrain:'drain',leechLife:'drain',drainingKiss:'drain',growl:'growl',leer:'leer',screech:'screech',scaryFace:'scaryFace',hypnosis:'hypnosis',toxic:'toxic',yawn:'yawn',leechSeed:'leechSeed',amnesia:'amnesia',defenseCurl:'defenseCurl',lightScreen:'lightScreen',reflect:'lightScreen',detect:'detect',focusEnergy:'focusEnergy',rainDance:'rainDance',thunderShock:'thunderShock',thunderbolt:'lightning',thunder:'lightning',thunderWave:'lightning',discharge:'discharge',electroBall:'electroBall',charge:'lightning',harden:'harden',ironDefense:'ironDefense',bulkUp:'bulkUp',teleport:'teleport',poisonSting:'poisonSting',stringShot:'stringShot',bugBite:'bugBite',stunSpore:'stunSpore',sleepPowder:'sleepPowder',supersonic:'supersonic',aerialAce:'aerialAce',airSlash:'slash',gust:'gust',whirlwind:'wind',hurricane:'wind',braveBird:'feathers',wingAttack:'feathers',fly:'feathers',peck:'beak',cut:'slash',xScissor:'cross',brickBreak:'punch',rockSmash:'punch',bulletPunch:'punch',dynamicPunch:'punch',powerUpPunch:'punch',auraSphere:'aura',dragonClaw:'slash',shadowClaw:'slash',metalClaw:'slash',psychoCut:'slash',nightSlash:'slash',leafBlade:'slash',falseSwipe:'slash',scratch:'scratch',tackle:'tackle',pound:'pound',surf:'surf',waterfallMove:'waterfall',whirlpool:'spiral',aquaJet:'jet',waterGun:'jet',liquidation:'wave',dive:'wave',leaf:'leaf',leafage:'leaf',razorLeaf:'leaves',magicalLeaf:'leaves',leafStorm:'leaves',vineWhip:'vines',vineBurst:'vines',solarSeed:'seed',energyBall:'seed',solarBeam:'beam',petalDance:'petals',bloom:'petals',growth:'rising',synthesis:'sun',poisonPowder:'spores',smokescreen:'smoke',sandAttack:'dust',mudSlap:'splat',protect:'shield',safeguard:'shield',rapidSpin:'wheel',agility:'streaks',tailWhip:'arc',recover:'crosses',moonblast:'moon',flashCannon:'steel',ironHead:'steel',ironTail:'steel',metalSound:'steel',psychic:'psychic',psybeam:'psychic',psyshock:'psychic',futureSight:'psychic',confusion:'confusion',shadowBall:'shadow',darkPulse:'shadow',phantomForce:'shadow',shadowSneak:'shadow',curse:'shadow',nastyPlot:'shadow',sludgeBomb:'sludge',sludgeWave:'sludge',poisonJab:'poisonSting',toxicSpikes:'poisonSting',dragonBreath:'dragon',dragonRush:'dragon',outrage:'dragon',twister:'dragon',hyperBeam:'beam',chargeBeam:'beam',flashMove:'flash',strength:'impact',gigaImpact:'impact',headbutt:'impact',headSmash:'impact',heavySlam:'impact',heatCrash:'impact',flareBlitz:'blazeKick',flameCharge:'blazeKick',overheat:'blast',lavaPlume:'blast',mysticalFire:'flame',ember:'spark',flame:'flame',water:'drop',neutralPulse:'rings',impact:'impact',starBurst:'stars'
};

const rules=[
 [/fang|bite|crunch/i,'jaws'],[/punch|palm|karate|combat|break/i,'punch'],[/kick/i,'doubleKick'],[/claw|slash|cut|swipe|scissor|blade/i,'slash'],[/head|slam|impact|tackle|strength|crash|press|throw/i,'impact'],
 [/rock|stone|boulder|gem/i,'rocks'],[/quake|earth|ground|bulldoze|magnitude/i,'quake'],[/mud|sand/i,'mudShot'],[/ice|frost|blizzard|snow|avalanche/i,'ice'],[/thunder|volt|electric|spark|shock|zap/i,'lightning'],
 [/flame|fire|blaze|burn|heat|ember|inferno|lava/i,'flame'],[/water|hydro|aqua|surf|bubble|scald/i,'wave'],[/leaf|grass|seed|wood|branch/i,'leaves'],[/vine|whip/i,'vines'],[/petal|flower|bloom/i,'petals'],[/spore|powder/i,'spores'],
 [/poison|sludge|acid|venom|toxic/i,'sludge'],[/psych|mind|confus|extrasens|future/i,'psychic'],[/shadow|ghost|nightmare|hex|phantom|dark|snarl/i,'shadow'],[/dragon|draco|wyrm/i,'dragon'],[/moon|fairy|dazzl|charm|kiss/i,'moon'],[/steel|metal|iron|gear/i,'steel'],
 [/wind|gust|air|hurricane|tornado/i,'wind'],[/wing|feather|bird|fly|peck/i,'feathers'],[/bug|web|string|sting|infest|horn/i,'bugBite'],[/drain|absorb|leech/i,'drain'],[/heal|recover|wish|synthesis|rest/i,'crosses'],[/shield|guard|protect|barrier|reflect|screen/i,'shield'],
 [/dance|agility|speed|quick|rush/i,'streaks'],[/growl|roar|voice|song|sound|screech/i,'supersonic'],[/sleep|yawn|hypno|dream/i,'hypnosis'],[/teleport|vanish/i,'teleport'],[/spin|roll|wheel/i,'wheel'],[/beam|cannon|ray/i,'beam'],[/pulse|ring|wave/i,'rings']
];

const typeDefaults={Normal:'impact',Fire:'flame',Water:'wave',Electric:'lightning',Grass:'leaves',Ice:'ice',Fighting:'punch',Poison:'sludge',Ground:'quake',Flying:'wind',Psychic:'psychic',Bug:'bugBite',Rock:'rocks',Ghost:'shadow',Dragon:'dragon',Dark:'shadow',Steel:'steel',Fairy:'moon'};
const soundByType={Normal:'impact',Fire:'fire',Water:'water',Electric:'electric',Grass:'grass',Ice:'ice',Fighting:'impact',Poison:'poison',Ground:'ground',Flying:'flying',Psychic:'psychic',Bug:'bug',Rock:'ground',Ghost:'dark',Dragon:'dragon',Dark:'dark',Steel:'steel',Fairy:'psychic'};

export function animationProfileFor(ability){
 if(!ability||ability.id==='basic')return {motif:'impact',sound:'impact',source:'native',quality:'native',fallback:true};
 const key=String(ability.id),label=`${key} ${ability.name||''}`;
 let motif=exact[key];
 if(!motif)motif=rules.find(([pattern])=>pattern.test(label))?.[1];
 // Imported catalog rows historically used "aura", "impact" and "stars" as
 // placeholders. They are intentionally ignored here so behavior/type can
 // choose a meaningful composition instead of making dozens of moves alike.
 if(!motif&&SUPPORTED_MOVE_MOTIFS.has(ability.motif)&&!['aura','impact','stars'].includes(ability.motif))motif=ability.motif;
 if(!motif){
  if(['heal'].includes(ability.behavior))motif='crosses';
  else if(['buff'].includes(ability.behavior))motif=ability.type==='Steel'?'ironDefense':'rising';
  else if(['debuff'].includes(ability.behavior))motif='screech';
  else if(['beam','channel'].includes(ability.behavior))motif='beam';
  else if(ability.behavior==='zone')motif=ability.type==='Water'?'spiral':'rings';
  else motif=typeDefaults[ability.type]||'impact';
 }
 const behavior=ability.behavior||'direct',large=Number(ability.radius)>=70||Number(ability.power)>=100||['beam','channel','area','zone'].includes(behavior);
 const external=EXTERNAL_MOVE_VFX[ability.id];
 return {
  motif,
  sound:behavior==='heal'?'heal':behavior==='buff'?'buff':behavior==='debuff'?'debuff':soundByType[ability.type]||'impact',
  source:external?.source|| (ability.vfx?.startsWith('pmd/')?'pmd+adaptive':'adaptive'),quality:external?'external-exact':ability.vfx?.startsWith('pmd/')?'sprite+adaptive':'adaptive',fallback:false,
  castSize:large?92:behavior==='direct'?58:70,
  travelSize:large?68:behavior==='projectile'?44:56,
  impactSize:large?Math.max(112,Number(ability.radius||0)*2):behavior==='direct'?74:88,
  trail:['projectile','wave'].includes(behavior)?(large?4:3):0,
  rotate:['slash','feathers','rocks','beak','aerialAce'].includes(motif)
 };
}

export function moveAnimationVisual(ability){
 if(!ability||ability.id==='basic')return null;
 const profile=animationProfileFor(ability),local=`moves/${ability.id}`,external=EXTERNAL_MOVE_VFX[ability.id],pmd=ability.vfx?.startsWith('pmd/');
 if(external)return {cast:local,travel:local,impact:local,castSize:profile.castSize,travelSize:profile.travelSize,impactSize:profile.impactSize,trail:profile.trail,rotate:profile.rotate,motif:profile.motif,sound:profile.sound,external:external.source};
 const impact=pmd&&!['projectile','wave','beam','channel'].includes(ability.behavior)?ability.vfx:local;
 return {cast:local,travel:ability.vfx||local,impact,castSize:profile.castSize,travelSize:profile.travelSize,impactSize:profile.impactSize,trail:profile.trail,rotate:profile.rotate,motif:profile.motif,sound:profile.sound};
}

export const MOVE_AUDIO_FILES={
 impact:'impact.ogg',fire:'fire.ogg',water:'water.ogg',electric:'electric.ogg',grass:'grass.ogg',ice:'ice.ogg',ground:'ground.ogg',flying:'flying.mp3',psychic:'psychic.ogg',poison:'poison.ogg',dark:'dark.ogg',steel:'steel.ogg',bug:'bug.ogg',dragon:'dragon.ogg',heal:'heal.ogg',buff:'buff.ogg',debuff:'debuff.ogg'
};
