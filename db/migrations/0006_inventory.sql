-- Inventory: every stock change goes through adjust_stock(), which logs who changed what
-- and why. Variants carry their own low stock threshold.

alter table public.product_variants
  add column low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0);

create type public.stock_reason as enum (
  'initial', 'received', 'correction', 'damaged', 'returned', 'sold', 'import', 'other'
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  delta integer not null check (delta <> 0),
  stock_after integer not null,
  reason public.stock_reason not null,
  note text check (note is null or char_length(note) <= 300),
  actor_id uuid default private.current_user_id(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventory_adjustments_variant_idx on public.inventory_adjustments (variant_id, created_at desc);
create index inventory_adjustments_actor_idx on public.inventory_adjustments (actor_id);
create trigger inventory_adjustments_updated_at before update on public.inventory_adjustments
  for each row execute function public.set_updated_at();

-- Rows are written by adjust_stock(); the log is append only. Callers must already have
-- checked the actor's role (owner, admin or editor) in server code.
create or replace function public.adjust_stock(
  p_variant_id uuid,
  p_delta integer,
  p_reason public.stock_reason,
  p_note text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if p_delta = 0 then
    select stock into v_stock from public.product_variants where id = p_variant_id;
    return v_stock;
  end if;

  update public.product_variants
     set stock = stock + p_delta
   where id = p_variant_id
  returning stock into v_stock;
  if not found then
    raise exception 'variant not found or not allowed' using errcode = '42501';
  end if;

  insert into public.inventory_adjustments (variant_id, delta, stock_after, reason, note)
  values (p_variant_id, p_delta, v_stock, p_reason, nullif(btrim(p_note), ''));
  return v_stock;
end;
$$;
