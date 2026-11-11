-- Area by area staff access and one time invite links.
-- "member" is a staff role whose access is the list in profiles.permissions (products,
-- content, media, orders, customers, reviews). Owners and admins keep full access.
-- A pending invite holds a hashed one time token that expires after 24 hours.

alter type public.staff_role add value if not exists 'member';

alter table public.profiles add column permissions text[] not null default '{}';
alter table public.staff_invites
  add column permissions text[] not null default '{}',
  add column token_hash text,
  add column expires_at timestamptz;
create unique index staff_invites_token_key on public.staff_invites (token_hash)
  where token_hash is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited public.staff_role;
  allowed text[];
begin
  select role, permissions into invited, allowed from public.staff_invites
    where lower(email) = lower(new.email) and accepted_at is null;

  insert into public.profiles (id, email, role, permissions)
    values (new.id, new.email, invited, coalesce(allowed, '{}'));

  if invited is not null then
    update public.staff_invites
      set accepted_at = now(), token_hash = null
      where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;
