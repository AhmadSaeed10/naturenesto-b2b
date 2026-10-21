-- Media and catalog. The storefront reads active products and published collections;
-- owners, admins and editors write (enforced in server code). Every write is audited.

create type public.product_status as enum ('draft', 'active', 'archived');
create type public.content_status as enum ('draft', 'published');

-- Media -------------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text unique,
  external_url text,
  mime_type text,
  width integer check (width > 0),
  height integer check (height > 0),
  size_bytes integer check (size_bytes >= 0),
  alt text not null default '',
  decorative boolean not null default false,
  title text,
  created_by uuid default private.current_user_id(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exactly one source: an object in the media bucket, or a file served by the site.
  constraint media_assets_one_source check ((storage_path is null) <> (external_url is null)),
  -- Alt text is required unless the image is explicitly decorative.
  constraint media_assets_alt_required check (decorative or length(btrim(alt)) > 0)
);
create index media_assets_created_by_idx on public.media_assets (created_by);

-- Products ----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description jsonb,
  status public.product_status not null default 'draft',
  vendor text,
  product_type text,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status) where deleted_at is null;
create index products_tags_idx on public.products using gin (tags);
create index products_title_trgm_idx on public.products using gin (title gin_trgm_ops);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  values text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_options_product_idx on public.product_options (product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null default 'Default',
  sku text unique,
  -- Money is stored in paisa (PKR x 100).
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price >= 0),
  cost integer check (cost >= 0),
  stock integer not null default 0,
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  weight_g integer check (weight_g >= 0),
  option_values jsonb not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  alt text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id);
create index product_images_media_idx on public.product_images (media_id);

create table public.product_metafields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  namespace text not null default 'custom',
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, namespace, key)
);

-- Categories (nested) and collections ---------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories (parent_id);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories (category_id);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  kind text not null default 'manual' check (kind in ('manual', 'automatic')),
  -- Automatic rules, for example [{"field": "tag", "op": "contains", "value": "pet-friendly"}]
  rules jsonb not null default '[]',
  sort_order text not null default 'manual'
    check (sort_order in ('manual', 'title', 'price-asc', 'price-desc', 'newest')),
  image_id uuid references public.media_assets (id) on delete set null,
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index collections_image_idx on public.collections (image_id);

create table public.collection_products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);

-- updated_at and audit triggers on every catalog table ----------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'media_assets', 'products', 'product_options', 'product_variants', 'product_images',
    'product_metafields', 'categories', 'product_categories', 'collections', 'collection_products'
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

-- Visibility rules live in the data layer: the storefront reads products that are active and
-- not soft deleted, and collections that are published. Staff see everything.
