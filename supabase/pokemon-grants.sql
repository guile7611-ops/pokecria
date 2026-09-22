-- Administered Pokémon gifts remain in a player's PC across stale cloud saves.
create table if not exists public.pokemon_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  grant_id text not null,
  specimen jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, grant_id),
  constraint specimen_has_capture_id check (nullif(specimen ->> 'captureId', '') is not null)
);

alter table public.pokemon_grants enable row level security;

create or replace function public.ensure_pokemon_grants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  gift record;
  stored_pc jsonb := coalesce(new.world -> 'pc', '[]'::jsonb);
begin
  for gift in select specimen from public.pokemon_grants where user_id = new.user_id loop
    if not exists (
      select 1 from jsonb_array_elements(stored_pc) as pc_entry(specimen)
      where pc_entry.specimen ->> 'captureId' = gift.specimen ->> 'captureId'
    ) then
      stored_pc := stored_pc || jsonb_build_array(gift.specimen);
    end if;
  end loop;
  new.world := jsonb_set(coalesce(new.world, '{}'::jsonb), '{pc}', stored_pc, true);
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ensure_pokemon_grants_on_save' and tgrelid = 'public.game_saves'::regclass) then
    create trigger ensure_pokemon_grants_on_save
    before insert or update of world on public.game_saves
    for each row execute function public.ensure_pokemon_grants();
  end if;
end;
$$;
