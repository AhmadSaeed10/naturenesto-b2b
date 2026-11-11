-- CMS, site settings and navigation. The storefront reads published content; staff see drafts.

create type public.page_section_type as enum (
  'hero', 'tagline', 'value_props', 'how_it_works', 'services', 'banner', 'plants', 'need_help', 'rich_text'
);

-- One row only: the unique `singleton` column stops a second row being inserted.
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  store_name text not null,
  email text not null,
  address text not null,
  phones jsonb not null default '{}'::jsonb,
  announcement jsonb not null default '{}'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  taglines jsonb not null default '{}'::jsonb,
  legal text,
  logo_media_id uuid references public.media_assets (id) on delete set null,
  currency text not null default 'PKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  body jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type public.page_section_type not null,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index page_sections_page_position_idx on public.page_sections (page_id, position);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text,
  body jsonb,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts (status, published_at desc);
create index blog_posts_author_idx on public.blog_posts (author_id);
create index blog_posts_cover_idx on public.blog_posts (cover_media_id);

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text,
  body jsonb,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz check (ends_at is null or starts_at is null or ends_at >= starts_at),
  location text,
  capacity integer check (capacity is null or capacity > 0),
  price integer check (price is null or price >= 0),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workshops_starts_idx on public.workshops (starts_at);
create index workshops_cover_idx on public.workshops (cover_media_id);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer jsonb not null,
  category text,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus (id) on delete cascade,
  parent_id uuid references public.navigation_items (id) on delete cascade,
  label text not null,
  href text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index navigation_items_menu_idx on public.navigation_items (menu_id, position);
create index navigation_items_parent_idx on public.navigation_items (parent_id);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source text not null unique check (source like '/%'),
  destination text not null,
  permanent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_settings_logo_idx on public.site_settings (logo_media_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'pages', 'page_sections', 'blog_posts', 'workshops', 'faq_items',
    'navigation_menus', 'navigation_items', 'redirects'
  ] loop
    execute format(
      'create trigger %1$I_updated_at before update on public.%1$I
         for each row execute function public.set_updated_at()', t);
    execute format(
      'create trigger %1$I_audit after insert or update or delete on public.%1$I
         for each row execute function public.audit_row()', t);
  end loop;
end;
$$;

-- Visibility and write rules live in the data layer. Scheduled publishing: a published row
-- with a future published_at stays hidden until then. Content is editable by editors; store
-- settings and redirects by owners and admins only.
