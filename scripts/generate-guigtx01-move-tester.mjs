import { writeFile } from 'node:fs/promises';
import { ABILITIES } from '../public/data.js';

const knownMoves = Object.keys(ABILITIES).filter(id => id !== 'basic');
const slots = ['earthquake', 'surf', 'muddyWater', 'flamethrower'];
for (const id of slots) if (!knownMoves.includes(id)) throw new Error(`Golpe inicial ausente: ${id}`);

const specimen = {
  captureId: 'qa-guigtx01-all-moves-20260924',
  id: 'ampharos',
  name: 'Ampharos de Testes',
  element: 'Electric',
  level: 100,
  xp: 0,
  hp: 300,
  maxHp: 300,
  attack: 180,
  defense: 180,
  spAttack: 220,
  spDefense: 200,
  speed: 150,
  movementSpeed: 118,
  nature: 'modest',
  ability: 'static',
  ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  attributePoints: 99,
  attributes: { vitality: 0, power: 0, guard: 0, agility: 0 },
  attributeSystemVersion: 1,
  moveLoadoutVersion: 2,
  evolutionHistory: [],
  knownMoves,
  slots,
};

const json = JSON.stringify(specimen).replaceAll("'", "''");
const sql = `begin;

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
select user_id, '${specimen.captureId}', '${json}'::jsonb
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
where grants.grant_id = '${specimen.captureId}';
`;

await writeFile(new URL('../supabase/grant-guigtx01-all-moves-20260924.sql', import.meta.url), sql);
console.log(`SQL gerado com ${knownMoves.length} golpes equipáveis.`);
