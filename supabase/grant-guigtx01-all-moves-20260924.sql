begin;

do $$
declare
  matching_users integer;
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'ensure_pokemon_grants_on_save'
      and tgrelid = 'public.game_saves'::regclass
      and tgenabled <> 'D'
  ) then
    raise exception 'Gift persistence trigger missing';
  end if;

  select count(*) into matching_users
  from public.profiles
  where lower(username::text) = lower('guigtx01');

  if matching_users <> 1 then
    raise exception 'Expected exactly one guigtx01 profile, found %', matching_users;
  end if;
end $$;

insert into public.pokemon_grants (user_id, grant_id, specimen)
select user_id, 'qa-guigtx01-all-moves-20260924', '{"captureId":"qa-guigtx01-all-moves-20260924","id":"ampharos","name":"Ampharos de Testes","element":"Electric","level":100,"xp":0,"hp":300,"maxHp":300,"attack":180,"defense":180,"spAttack":220,"spDefense":200,"speed":150,"movementSpeed":118,"nature":"modest","ability":"static","ivs":{"hp":31,"attack":31,"defense":31,"spAttack":31,"spDefense":31,"speed":31},"evs":{"hp":0,"attack":0,"defense":0,"spAttack":0,"spDefense":0,"speed":0},"attributePoints":99,"attributes":{"vitality":0,"power":0,"guard":0,"agility":0},"attributeSystemVersion":1,"moveLoadoutVersion":2,"evolutionHistory":[],"knownMoves":["leaf","bloom","ember","water","recover","vineBurst","solarBeam","flamethrower","inferno","aquaWave","hydroCannon","razorLeaf","solarSeed","flame","fireBlast","waterPulse","hydroPump","growth","poisonPowder","smokescreen","fireSpin","tailWhip","rapidSpin","synthesis","flameWheel","iceFang","crunch","megaDrain","agility","sandAttack","peck","mudSlap","whirlpool","protect","doubleKick","mudShot","blazeKick","tackle","scratch","quickAttack","bite","takeDown","rockThrow","absorb","gigaDrain","neutralPulse","impact","starBurst","harden","ironDefense","bulkUp","teleport","poisonSting","stringShot","bugBite","stunSpore","sleepPowder","supersonic","aerialAce","gust","growl","leer","screech","scaryFace","hypnosis","toxic","yawn","leechSeed","amnesia","defenseCurl","lightScreen","detect","focusEnergy","rainDance","doubleEdge","suckerPunch","aquaTail","bodySlam","slash","pound","fireFang","furySwipes","bubbleBeam","confusion","thunderShock","discharge","electroBall","aquaJet","aquaRing","bonemerang","braveBird","bugBuzz","bulldoze","bulletPunch","calmMind","darkPulse","dragonBreath","dragonClaw","drainingKiss","earthPower","flareBlitz","hurricane","icyWind","ironHead","leafBlade","liquidation","mysticalFire","psybeam","reflect","sludgeWave","swordsDance","thunder","thunderWave","vineWhip","wingAttack","bounce","breakingSwipe","brutalSwing","charge","charm","confuseRay","cottonGuard","curse","disarmingVoice","doubleTeam","dragonRush","drillRun","dynamicPunch","falseSwipe","featherDance","flipTurn","futureSight","gigaImpact","haze","headSmash","headbutt","heatCrash","heavySlam","hyperBeam","infestation","ironTail","knockOff","lavaPlume","leafStorm","leafage","leechLife","lick","lunge","magicalLeaf","megahorn","metalClaw","metalSound","muddyWater","nastyPlot","nightSlash","outrage","overheat","perishSong","phantomForce","pinMissile","poisonFang","poisonJab","powerGem","powerUpPunch","psychoCut","psyshock","roar","rockBlast","rockTomb","safeguard","sandTomb","shadowClaw","shadowSneak","snarl","stickyWeb","stoneEdge","toxicSpikes","twister","waterGun","whirlwind","wish","zapCannon","acid","acrobatics","airCutter","ancientPower","armThrust","aromatherapy","assurance","astonish","axeKick","batonPass","bellyDrum","blizzard","block","brine","chargeBeam","clearSmog","closeCombat","coil","comeuppance","copycat","counter","covet","crabhammer","crossPoison","defog","dig","disable","doubleHit","dragonDance","drainPunch","dreamEater","drillPeck","echoedVoice","eerieImpulse","electricTerrain","encore","endeavor","endure","eruption","explosion","extrasensory","extremeSpeed","fakeOut","fakeTears","feint","firePunch","flail","fling","focusPunch","followMe","forcePalm","foulPlay","furyAttack","furyCutter","grassyTerrain","gravity","guillotine","gunkShot","gyroBall","hammerArm","headlongRush","heatWave","helpingHand","highJumpKick","howl","hyperVoice","icePunch","iceShard","incinerate","laserFocus","lockOn","lowKick","lowSweep","machPunch","magnetRise","magneticFlux","meanLook","megaKick","megaPunch","mimic","mirrorCoat","mist","moonlight","nightShade","nobleRoar","nuzzle","payback","petalBlizzard","petalDance","playRough","pluck","poisonGas","poisonTail","powderSnow","psychUp","quash","quickGuard","quiverDance","ragePowder","razorShell","rest","retaliate","reversal","rockPolish","rollout","roost","sandstorm","seedBomb","seismicToss","selfDestruct","shellSmash","skyAttack","slackOff","slam","smackDown","smog","soak","spark","splash","spore","stealthRock","stomp","sunnyDay","superFang","swagger","sweetScent","swift","switcheroo","tailwind","taunt","tearfulLook","teeterDance","thief","thrash","throatChop","thunderFang","thunderPunch","torment","triAttack","tripleKick","uTurn","uproar","vacuumWave","voltTackle","waterSpout","waveCrash","wideGuard","willOWisp","withdraw","wonderRoom","woodHammer","workUp","worrySeed","zenHeadbutt","thunderbolt","iceBeam","shadowBall","psychic","earthquake","rockSlide","sludgeBomb","dragonPulse","moonblast","flashCannon","xScissor","brickBreak","airSlash","surf","waterfallMove","cut","strength","fly","rockSmash","flashMove","dive","auraSphere","energyBall","flameCharge"],"slots":["earthquake","surf","muddyWater","flamethrower"]}'::jsonb
from public.profiles
where lower(username::text) = lower('guigtx01')
on conflict (user_id, grant_id) do update
set specimen = excluded.specimen;

update public.game_saves as saves
set world = saves.world,
    updated_at = now()
from public.profiles as profiles
where profiles.user_id = saves.user_id
  and lower(profiles.username::text) = lower('guigtx01');

commit;

select
  profiles.username,
  grants.specimen ->> 'name' as pokemon,
  (grants.specimen ->> 'level')::integer as level,
  jsonb_array_length(grants.specimen -> 'knownMoves') as move_count,
  exists (
    select 1
    from jsonb_array_elements(coalesce(saves.world -> 'pc', '[]'::jsonb)) as pc_entry(specimen)
    where pc_entry.specimen ->> 'captureId' = grants.grant_id
  ) as in_pc
from public.pokemon_grants as grants
join public.profiles as profiles on profiles.user_id = grants.user_id
left join public.game_saves as saves on saves.user_id = grants.user_id
where grants.grant_id = 'qa-guigtx01-all-moves-20260924';
