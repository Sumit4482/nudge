-- Nudge proof wall. Run this once in the Supabase SQL editor.
-- Everything is private by default. Only rows you share, and only after their publish_at time, can be read by the public website.

create extension if not exists pgcrypto;

-- One row per proof you choose to share.
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_title text not null,
  tag text not null check (tag in ('fit', 'study', 'life')),
  caption text,
  minutes int not null default 0,
  xp int not null default 0,
  image_path text not null unique,
  is_public boolean not null default true,
  publish_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Only totals, never titles or times: streak, level, xp and counts per day.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak int not null default 0,
  level int not null default 1,
  xp int not null default 0,
  week_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_counts (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  n int not null default 0,
  primary key (user_id, day)
);

-- Cheers from visitors. Insert only, no reading.
create table if not exists public.cheers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

alter table public.proofs enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_counts enable row level security;
alter table public.cheers enable row level security;

-- The signed-in owner can do anything with their own rows.
drop policy if exists "owner proofs" on public.proofs;
create policy "owner proofs" on public.proofs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owner profile" on public.profiles;
create policy "owner profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owner counts" on public.daily_counts;
create policy "owner counts" on public.daily_counts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Visitors may add a cheer and nothing else.
drop policy if exists "anyone can cheer" on public.cheers;
create policy "anyone can cheer" on public.cheers for insert to anon, authenticated with check (true);

-- What the public website can read. These views run as the table owner and expose only safe columns and rows.
create or replace view public.public_proofs with (security_invoker = false) as
  select id, task_title, tag, caption, minutes, xp, image_path, created_at
  from public.proofs
  where is_public and publish_at <= now();

create or replace view public.public_stats with (security_invoker = false) as
  select streak, level, xp, week_count, updated_at from public.profiles order by updated_at desc limit 1;

create or replace view public.public_daily as
  select day, n from public.daily_counts where day > current_date - 90;

create or replace view public.public_cheers with (security_invoker = false) as
  select count(*)::int as total from public.cheers;

grant select on public.public_proofs, public.public_stats, public.public_daily, public.public_cheers to anon, authenticated;
grant insert on public.cheers to anon, authenticated;

-- Photo storage: a public "wall" bucket. Anyone can look, only you can write inside your own folder.
insert into storage.buckets (id, name, public) values ('wall', 'wall', true) on conflict (id) do nothing;

drop policy if exists "wall read" on storage.objects;
create policy "wall read" on storage.objects for select using (bucket_id = 'wall');
drop policy if exists "wall owner write" on storage.objects;
create policy "wall owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'wall' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "wall owner update" on storage.objects;
create policy "wall owner update" on storage.objects for update to authenticated
  using (bucket_id = 'wall' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "wall owner delete" on storage.objects;
create policy "wall owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'wall' and (storage.foldername(name))[1] = auth.uid()::text);
