-- Cheers v2: optional visitor name and server-side limits.
-- Run once in the Supabase SQL editor, after 001_proofs.sql.

-- A visitor may leave a short name. The ip_hash is a one-way hash used only for rate limiting.
alter table public.cheers add column if not exists name text;
alter table public.cheers add column if not exists ip_hash text;

-- Limits enforced in the database, so they cannot be skipped from a browser:
--   one cheer per minute per visitor address, and at most 60 cheers per hour in total.
create or replace function public.cheers_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  hdr json;
  ip text;
begin
  begin
    hdr := current_setting('request.headers', true)::json;
  exception when others then
    hdr := null;
  end;
  ip := coalesce(nullif(hdr->>'cf-connecting-ip', ''), nullif(split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1), ''), 'unknown');
  new.ip_hash := md5(ip || ':nudge');
  new.created_at := now();
  new.name := left(nullif(btrim(regexp_replace(coalesce(new.name, ''), '[[:cntrl:]]', '', 'g')), ''), 30);
  if exists (select 1 from public.cheers where ip_hash = new.ip_hash and created_at > now() - interval '60 seconds') then
    raise exception 'too_fast';
  end if;
  if (select count(*) from public.cheers where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'busy';
  end if;
  return new;
end $$;

drop trigger if exists cheers_guard on public.cheers;
create trigger cheers_guard before insert on public.cheers for each row execute function public.cheers_guard();
