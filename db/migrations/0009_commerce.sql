-- Commerce: customers, carts, orders, discounts, shipping, tax and payments.
-- Money is paisa. Carts and order creation are server only (after zod validation and rate
-- limits); customers read their own rows and staff manage the rest, both enforced in server code.

create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded', 'partially_refunded');
create type public.fulfillment_status as enum ('unfulfilled', 'partial', 'fulfilled');
create type public.discount_kind as enum ('percentage', 'fixed', 'free_shipping');

-- Customers ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text not null check (char_length(email) <= 320),
  full_name text check (full_name is null or char_length(full_name) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  accepts_marketing boolean not null default false,
  tags text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_email_key on public.customers (lower(email)) where deleted_at is null;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 200),
  phone text not null check (char_length(phone) between 7 and 40),
  line1 text not null check (char_length(line1) between 1 and 300),
  line2 text check (line2 is null or char_length(line2) <= 300),
  area text check (area is null or char_length(area) <= 200),
  city text not null check (char_length(city) between 1 and 120),
  province text check (province is null or char_length(province) <= 120),
  postal_code text check (postal_code is null or char_length(postal_code) <= 20),
  country text not null default 'PK',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);

-- Shipping, tax, payment methods --------------------------------------------------------
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- Lower case city names; the default zone catches every other city.
  cities text[] not null default '{}',
  is_default boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index shipping_zones_one_default on public.shipping_zones (is_default) where is_default;

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  price integer not null check (price >= 0),
  free_over integer check (free_over is null or free_over >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipping_rates_zone_idx on public.shipping_rates (zone_id);

create table public.tax_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  prices_include_tax boolean not null default true,
  -- Basis points: 1700 is 17 percent.
  rate_bps integer not null default 0 check (rate_bps between 0 and 10000),
  label text not null default 'Tax',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null,
  instructions text,
  enabled boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Discounts ---------------------------------------------------------------------------
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9_-]{3,32}$'),
  kind public.discount_kind not null,
  -- Percent (1 to 100) for percentage codes, paisa for fixed codes, unused for free shipping.
  value integer not null default 0 check (value >= 0),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  used_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_percentage check (kind <> 'percentage' or value between 1 and 100)
);
create unique index discount_codes_code_key on public.discount_codes (upper(code));

-- Carts (server only) -----------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  -- The httpOnly cookie holds this token, never the id.
  token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'converted', 'abandoned')),
  discount_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carts_customer_idx on public.carts (customer_id);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index cart_items_variant_idx on public.cart_items (variant_id);

-- Orders ------------------------------------------------------------------------------
create sequence public.order_number_seq start with 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.order_number_seq'),
  -- Lets a guest open their order page without an account; shown only in their link.
  access_token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  email text not null,
  phone text not null,
  full_name text not null,
  shipping_address jsonb not null,
  notes text check (notes is null or char_length(notes) <= 1000),
  currency text not null default 'PKR',
  subtotal integer not null check (subtotal >= 0),
  discount_total integer not null default 0 check (discount_total >= 0),
  shipping_total integer not null default 0 check (shipping_total >= 0),
  tax_total integer not null default 0 check (tax_total >= 0),
  total integer not null check (total >= 0),
  discount_code text,
  payment_method text not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status, placed_at desc);
create index orders_email_idx on public.orders (lower(email));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshot at the time of purchase.
  title text not null,
  variant_title text,
  sku text,
  image_url text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid default private.current_user_id(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);
create index order_status_history_actor_idx on public.order_status_history (actor_id);

create table public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text,
  tracking_number text,
  tracking_url text check (tracking_url is null or tracking_url ~ '^https://'),
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fulfillments_order_idx on public.fulfillments (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  amount integer not null check (amount >= 0),
  reference text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refunds_order_idx on public.refunds (order_id);

create table public.discount_applications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  code text not null,
  kind public.discount_kind not null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index discount_applications_order_idx on public.discount_applications (order_id);

-- Triggers on every table ------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers', 'addresses', 'shipping_zones', 'shipping_rates', 'tax_settings', 'payment_methods',
    'discount_codes', 'carts', 'cart_items', 'orders', 'order_items', 'order_status_history',
    'fulfillments', 'payments', 'refunds', 'discount_applications'
  ] loop
    execute format(
      'create trigger %1$I_updated_at before update on public.%1$I
         for each row execute function public.set_updated_at()', t);
  end loop;
  -- Carts change on every click and are not admin data, so they are not audited.
  foreach t in array array[
    'customers', 'addresses', 'shipping_zones', 'shipping_rates', 'tax_settings', 'payment_methods',
    'discount_codes', 'orders', 'order_items', 'order_status_history', 'fulfillments', 'payments',
    'refunds', 'discount_applications'
  ] loop
    execute format(
      'create trigger %1$I_audit after insert or update or delete on public.%1$I
         for each row execute function public.audit_row()', t);
  end loop;
end;
$$;

-- Placeholder store configuration; client to confirm (editable in Admin > Settings).
insert into public.tax_settings (prices_include_tax, rate_bps, label) values (true, 0, 'GST');
insert into public.payment_methods (code, name, instructions, enabled, position) values
  ('cod', 'Cash on delivery', 'Pay in cash when your order arrives.', true, 0),
  ('bank_transfer', 'Bank transfer', 'We will share our account details after you place the order.', false, 1);
with lahore as (
  insert into public.shipping_zones (name, cities, position) values ('Lahore', array['lahore'], 0) returning id
), punjab as (
  insert into public.shipping_zones (name, cities, position) values (
    'Rest of Punjab',
    array['rawalpindi', 'faisalabad', 'multan', 'gujranwala', 'sialkot', 'sargodha', 'bahawalpur', 'sahiwal', 'sheikhupura', 'kasur', 'okara', 'gujrat', 'jhelum'],
    1
  ) returning id
), rest as (
  insert into public.shipping_zones (name, is_default, position) values ('Rest of Pakistan', true, 2) returning id
)
insert into public.shipping_rates (zone_id, name, price, free_over)
select id, 'Standard delivery', 25000, 1500000 from lahore
union all select id, 'Standard delivery', 40000, 1500000 from punjab
union all select id, 'Standard delivery', 60000, 1500000 from rest;
