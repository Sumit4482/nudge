-- Push notifications for cheers, and a private cheers list for you. Run after 002_cheers.sql.
-- Sends an Expo push notification for each cheer.

create extension if not exists pg_net;

-- Safe on a project that already ran an older 002 with the unused Telegram step.
drop trigger if exists cheers_notify on public.cheers;
drop function if exists public.cheers_notify();
drop table if exists private.secrets;

-- Your phone's Expo push token. Only the signed-in owner can add or remove it.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
drop policy if exists "owner tokens" on public.push_tokens;
create policy "owner tokens" on public.push_tokens for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Only you (the one signed-in account) can read the list of cheers, and only the safe columns.
grant select (id, name, created_at) on public.cheers to authenticated;
drop policy if exists "owner reads cheers" on public.cheers;
create policy "owner reads cheers" on public.cheers for select to authenticated using (true);

-- Push a notification through Expo for every cheer. A failed push never blocks the cheer.
create or replace function public.cheers_notify() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.push_tokens) then
    return new;
  end if;
  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := (
        select jsonb_agg(jsonb_build_object(
          'to', token,
          'title', 'A cheer for you 💛',
          'body', case when new.name is null then 'Someone cheered you on.' else new.name || ' cheered you on.' end,
          'sound', 'default',
          'channelId', 'cheers',
          'data', jsonb_build_object('kind', 'cheer')
        ))
        from public.push_tokens
      )
    );
  exception when others then
    null;
  end;
  return new;
end $$;

create trigger cheers_notify after insert on public.cheers for each row execute function public.cheers_notify();
