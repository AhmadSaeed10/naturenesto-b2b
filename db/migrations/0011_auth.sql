-- Authentication tables for Better Auth (magic link and optional password), plus the foreign
-- keys that tie staff, customers and audit columns to a signed in user.
--
-- Table and column names are snake_case and ids are uuid, mapped in src/lib/auth/schema.ts.
-- Better Auth owns these tables: do not write to them from application code.

create table public.auth_user (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  email_verified boolean not null default false,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auth_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_user (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index auth_session_user_id_idx on public.auth_session (user_id);

create table public.auth_account (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_user (id) on delete cascade,
  account_id text not null,
  provider_id text not null,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index auth_account_user_id_idx on public.auth_account (user_id);

create table public.auth_verification (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index auth_verification_identifier_idx on public.auth_verification (identifier);

-- Every new auth user gets a profile. A pending staff invite for the same email decides the
-- role, and is marked accepted. Customers get a profile with no role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited public.staff_role;
begin
  select role into invited from public.staff_invites
    where lower(email) = lower(new.email) and accepted_at is null;

  insert into public.profiles (id, email, role) values (new.id, new.email, invited);

  if invited is not null then
    update public.staff_invites set accepted_at = now() where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on public.auth_user
  for each row execute function public.handle_new_user();

-- Deleting a user removes their profile; history keeps the id but not the link.
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references public.auth_user (id) on delete cascade;
alter table public.media_assets
  add constraint media_assets_created_by_fkey foreign key (created_by) references public.auth_user (id) on delete set null;
alter table public.inventory_adjustments
  add constraint inventory_adjustments_actor_id_fkey foreign key (actor_id) references public.auth_user (id) on delete set null;
alter table public.customers
  add constraint customers_user_id_fkey foreign key (user_id) references public.auth_user (id) on delete set null;
