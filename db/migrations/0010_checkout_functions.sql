-- Pricing and order placement. One function computes totals so the checkout preview and
-- the placed order can never disagree. Only server actions (after zod validation
-- and rate limits) call these; they are never exposed to the browser.

create or replace function private.cart_totals(p_cart_id uuid, p_code text, p_city text, p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lines jsonb;
  v_subtotal integer;
  v_unavailable jsonb;
  v_code public.discount_codes;
  v_discount integer := 0;
  v_free_shipping boolean := false;
  v_discount_error text;
  v_shipping integer;
  v_zone text;
  v_rate public.shipping_rates;
  v_tax public.tax_settings;
  v_tax_total integer := 0;
  v_used integer;
begin
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'variant_id', v.id,
      'product_id', p.id,
      'handle', p.handle,
      'title', p.title,
      'variant_title', v.title,
      'sku', v.sku,
      'unit_price', v.price,
      'compare_at_price', v.compare_at_price,
      'quantity', ci.quantity,
      'line_total', v.price * ci.quantity,
      'stock', v.stock,
      'track_inventory', v.track_inventory,
      'allow_backorder', v.allow_backorder,
      'available', p.status = 'active' and p.deleted_at is null,
      'image', (
        select coalesce(m.external_url, m.storage_path)
        from public.product_images pi join public.media_assets m on m.id = pi.media_id
        where pi.product_id = p.id order by pi.position limit 1
      )
    ) order by ci.created_at), '[]'::jsonb)
  into v_lines
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id
  where ci.cart_id = p_cart_id;

  select coalesce(sum((l ->> 'line_total')::integer), 0)
  into v_subtotal
  from jsonb_array_elements(v_lines) l
  where (l ->> 'available')::boolean;

  select coalesce(jsonb_agg(l -> 'variant_id'), '[]'::jsonb)
  into v_unavailable
  from jsonb_array_elements(v_lines) l
  where not (l ->> 'available')::boolean
     or ((l ->> 'track_inventory')::boolean and not (l ->> 'allow_backorder')::boolean
         and (l ->> 'stock')::integer < (l ->> 'quantity')::integer);

  -- Discount ----------------------------------------------------------------------------
  if nullif(btrim(p_code), '') is not null then
    select * into v_code from public.discount_codes where upper(code) = upper(btrim(p_code));
    if not found or not v_code.active then
      v_discount_error := 'invalid';
    elsif (v_code.starts_at is not null and v_code.starts_at > now())
       or (v_code.ends_at is not null and v_code.ends_at < now()) then
      v_discount_error := 'expired';
    elsif v_subtotal < v_code.min_subtotal then
      v_discount_error := 'min_subtotal';
    elsif v_code.usage_limit is not null and v_code.used_count >= v_code.usage_limit then
      v_discount_error := 'limit';
    else
      if v_code.per_customer_limit is not null and p_email is not null then
        select count(*) into v_used from public.orders
        where upper(discount_code) = upper(v_code.code) and lower(email) = lower(p_email) and status <> 'cancelled';
        if v_used >= v_code.per_customer_limit then
          v_discount_error := 'limit';
        end if;
      end if;
      if v_discount_error is null then
        if v_code.kind = 'percentage' then
          v_discount := (v_subtotal * v_code.value) / 100;
        elsif v_code.kind = 'fixed' then
          v_discount := least(v_code.value, v_subtotal);
        else
          v_free_shipping := true;
        end if;
      end if;
    end if;
  end if;

  -- Shipping: the zone listing the city, else the default zone. Unknown until a city is given.
  if nullif(btrim(p_city), '') is not null then
    select r.* into v_rate
    from public.shipping_rates r
    join public.shipping_zones z on z.id = r.zone_id
    where r.active
      and (lower(btrim(p_city)) = any (z.cities)
           or (z.is_default and not exists (
             select 1 from public.shipping_zones z2 where lower(btrim(p_city)) = any (z2.cities))))
    order by (lower(btrim(p_city)) = any (z.cities)) desc, r.price
    limit 1;
    if found then
      select name into v_zone from public.shipping_zones where id = v_rate.zone_id;
      v_shipping := case
        when v_free_shipping then 0
        when v_rate.free_over is not null and v_subtotal - v_discount >= v_rate.free_over then 0
        else v_rate.price
      end;
    end if;
  end if;

  -- Tax: included in prices by default; otherwise added on the discounted subtotal.
  select * into v_tax from public.tax_settings limit 1;
  if found and not v_tax.prices_include_tax and v_tax.rate_bps > 0 then
    v_tax_total := ((v_subtotal - v_discount) * v_tax.rate_bps) / 10000;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'unavailable', v_unavailable,
    'subtotal', v_subtotal,
    'discount', jsonb_build_object(
      'code', case when v_discount_error is null and v_code.id is not null then v_code.code end,
      'kind', case when v_discount_error is null then v_code.kind end,
      'amount', v_discount,
      'free_shipping', v_free_shipping,
      'error', v_discount_error
    ),
    'shipping', v_shipping,
    'shipping_zone', v_zone,
    'tax', v_tax_total,
    'tax_included', coalesce(v_tax.prices_include_tax, true),
    'total', v_subtotal - v_discount + coalesce(v_shipping, 0) + v_tax_total
  );
end;
$$;

-- Checkout preview for a cart token.
create or replace function public.quote_cart(p jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cart uuid;
begin
  select id into v_cart from public.carts where token = (p ->> 'cart_token')::uuid and status = 'open';
  if v_cart is null then
    return null;
  end if;
  return private.cart_totals(v_cart, p ->> 'discount_code', p ->> 'city', p ->> 'email');
end;
$$;

-- Places an order from an open cart in one transaction: re-prices, checks and decrements
-- stock (rows locked), applies the discount, records history and the pending payment.
create or replace function public.place_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart public.carts;
  v_totals jsonb;
  v_line jsonb;
  v_customer uuid;
  v_order public.orders;
  v_method public.payment_methods;
  v_email text := lower(btrim(p ->> 'email'));
  v_user uuid := nullif(p ->> 'user_id', '')::uuid;
  v_stock integer;
begin
  select * into v_cart from public.carts where token = (p ->> 'cart_token')::uuid and status = 'open' for update;
  if not found then
    raise exception 'cart_missing' using errcode = 'P0001';
  end if;

  -- Lock the variants in a stable order so two checkouts cannot oversell.
  perform 1 from public.product_variants v
  where v.id in (select variant_id from public.cart_items where cart_id = v_cart.id)
  order by v.id for update;

  v_totals := private.cart_totals(v_cart.id, p ->> 'discount_code', p #>> '{address,city}', v_email);
  if jsonb_array_length(v_totals -> 'lines') = 0 then
    raise exception 'cart_empty' using errcode = 'P0001';
  end if;
  if jsonb_array_length(v_totals -> 'unavailable') > 0 then
    raise exception 'unavailable' using errcode = 'P0001', detail = (v_totals -> 'unavailable')::text;
  end if;
  if nullif(p ->> 'discount_code', '') is not null and v_totals #>> '{discount,error}' is not null then
    raise exception 'discount_%', v_totals #>> '{discount,error}' using errcode = 'P0001';
  end if;
  if v_totals -> 'shipping' is null or jsonb_typeof(v_totals -> 'shipping') = 'null' then
    raise exception 'shipping_unavailable' using errcode = 'P0001';
  end if;

  select * into v_method from public.payment_methods where code = p ->> 'payment_method' and enabled;
  if not found then
    raise exception 'payment_method' using errcode = 'P0001';
  end if;

  -- Customer: the signed in account, else the guest record for this email.
  if v_user is not null then
    select id into v_customer from public.customers where user_id = v_user and deleted_at is null;
  end if;
  if v_customer is null then
    select id into v_customer from public.customers where lower(email) = v_email and deleted_at is null;
  end if;
  if v_customer is null then
    insert into public.customers (user_id, email, full_name, phone)
    values (v_user, v_email, p ->> 'full_name', p ->> 'phone')
    returning id into v_customer;
  else
    update public.customers
       set full_name = coalesce(full_name, p ->> 'full_name'),
           phone = coalesce(phone, p ->> 'phone')
     where id = v_customer;
  end if;

  insert into public.orders (
    customer_id, email, phone, full_name, shipping_address, notes,
    subtotal, discount_total, shipping_total, tax_total, total, discount_code, payment_method
  ) values (
    v_customer, v_email, p ->> 'phone', p ->> 'full_name', p -> 'address', nullif(btrim(p ->> 'notes'), ''),
    (v_totals ->> 'subtotal')::integer,
    (v_totals #>> '{discount,amount}')::integer,
    (v_totals ->> 'shipping')::integer,
    (v_totals ->> 'tax')::integer,
    (v_totals ->> 'total')::integer,
    v_totals #>> '{discount,code}',
    v_method.code
  ) returning * into v_order;

  for v_line in select * from jsonb_array_elements(v_totals -> 'lines') loop
    insert into public.order_items (order_id, product_id, variant_id, title, variant_title, sku, image_url, unit_price, quantity, line_total)
    values (
      v_order.id, (v_line ->> 'product_id')::uuid, (v_line ->> 'variant_id')::uuid, v_line ->> 'title',
      nullif(v_line ->> 'variant_title', 'Default'), v_line ->> 'sku', v_line ->> 'image',
      (v_line ->> 'unit_price')::integer, (v_line ->> 'quantity')::integer, (v_line ->> 'line_total')::integer
    );
    if (v_line ->> 'track_inventory')::boolean then
      update public.product_variants set stock = stock - (v_line ->> 'quantity')::integer
       where id = (v_line ->> 'variant_id')::uuid
      returning stock into v_stock;
      insert into public.inventory_adjustments (variant_id, delta, stock_after, reason, note)
      values ((v_line ->> 'variant_id')::uuid, -(v_line ->> 'quantity')::integer, v_stock, 'sold', 'Order #' || v_order.number);
    end if;
  end loop;

  if v_order.discount_code is not null then
    update public.discount_codes set used_count = used_count + 1 where upper(code) = upper(v_order.discount_code);
    insert into public.discount_applications (order_id, code, kind, amount)
    values (v_order.id, v_order.discount_code, (v_totals #>> '{discount,kind}')::public.discount_kind, v_order.discount_total);
  end if;

  insert into public.order_status_history (order_id, status, note) values (v_order.id, 'pending', 'Order placed');
  insert into public.payments (order_id, provider, status, amount) values (v_order.id, v_method.code, 'pending', v_order.total);
  update public.carts set status = 'converted', customer_id = v_customer where id = v_cart.id;

  return jsonb_build_object('order_id', v_order.id, 'number', v_order.number, 'access_token', v_order.access_token, 'total', v_order.total);
end;
$$;
