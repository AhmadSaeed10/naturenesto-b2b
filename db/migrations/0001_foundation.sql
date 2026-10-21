-- Foundation: extensions, shared helpers, staff roles, audit log and rate limits.
--
-- Plain Postgres (Neon). There is no Supabase auth, storage or row level security here:
-- authorisation is enforced in server code (requireStaff and the data layer), and the
-- database keeps the audit trail and the role-change guard. See docs/NEON.md.

create extension if not exists pg_trgm;

create schema if not exists private;

create type public.staff_role as enum ('owner', 'admin', 'editor', 'support');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- The acting user. The server sets it for the length of a transaction:
--   select set_config('app.user_id', '<uuid>', true);
-- It is null for trusted server maintenance (seed, migrations, checkout, rate limits).
create or replace function private.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- Staff -------------------------------------------------------------------------------
-- profiles.id is the id of the auth user. The foreign key to the auth tables is added in
-- the auth phase, once those tables exist.
create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  role public.staff_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where role is not null;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.staff_role not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index staff_invites_email_key on public.staff_invites (lower(email));
create trigger staff_invites_updated_at before update on public.staff_invites
  for each row execute function public.set_updated_at();

create or replace function private.my_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = private.current_user_id();
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = private.current_user_id() and role is not null
  );
$$;

create or replace function private.has_role(roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = any (roles) from public.profiles where id = private.current_user_id()),
    false
  );
$$;

-- Only owners may change roles freely; admins may not touch owners.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;
  -- Server side maintenance (no acting user) is trusted.
  if private.current_user_id() is null then
    return new;
  end if;
  if private.has_role(array['owner']::public.staff_role[]) then
    return new;
  end if;
  if private.has_role(array['admin']::public.staff_role[])
     and old.role is distinct from 'owner'
     and new.role is distinct from 'owner' then
    return new;
  end if;
  raise exception 'not allowed to change this role' using errcode = '42501';
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Audit log ------------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role public.staff_role,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (actor_id, actor_role, action, table_name, record_id, before, after)
  values (
    private.current_user_id(),
    private.my_staff_role(),
    lower(tg_op),
    tg_table_name,
    rec ->> 'id',
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger profiles_audit after insert or update or delete on public.profiles
  for each row execute function public.audit_row();
create trigger staff_invites_audit after insert or update or delete on public.staff_invites
  for each row execute function public.audit_row();

-- Rate limits ------------------------------------------------------------------------------
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, window_start)
);
create index rate_limits_window_idx on public.rate_limits (window_start);

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  total integer;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, win, 1)
  on conflict (key, window_start)
    do update set hits = public.rate_limits.hits + 1, updated_at = now()
  returning hits into total;
  return total <= p_limit;
end;
$$;
