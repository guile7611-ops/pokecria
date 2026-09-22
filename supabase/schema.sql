create extension if not exists citext;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  world jsonb not null default '{}'::jsonb,
  account jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;

create policy "profiles visible to authenticated players" on public.profiles for select to authenticated using (true);
create policy "players update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "players read own save" on public.game_saves for select to authenticated using (auth.uid() = user_id);
create policy "players create own save" on public.game_saves for insert to authenticated with check (auth.uid() = user_id);
create policy "players update own save" on public.game_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create function public.create_player_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_player_profile();
