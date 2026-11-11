-- Product editor writes: one call saves the product with its options, variants, images,
-- manual collections and categories in a single transaction. The caller sets
-- app.user_id first, so the audit triggers record the real actor; the role check (owner,
-- admin, editor) happens in server code. Input is validated by zod before it gets here.
create or replace function public.save_product(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_variant jsonb;
  v_variant_id uuid;
  v_keep uuid[] := '{}';
  v_position integer;
begin
  if v_id is null then
    insert into public.products (title, handle, description, status, vendor, product_type, tags, seo_title, seo_description)
    values (
      p ->> 'title', p ->> 'handle', p -> 'description',
      (p ->> 'status')::public.product_status,
      nullif(p ->> 'vendor', ''), nullif(p ->> 'product_type', ''),
      coalesce(array(select jsonb_array_elements_text(p -> 'tags')), '{}'),
      nullif(p ->> 'seo_title', ''), nullif(p ->> 'seo_description', '')
    )
    returning id into v_id;
  else
    update public.products set
      title = p ->> 'title',
      handle = p ->> 'handle',
      description = p -> 'description',
      status = (p ->> 'status')::public.product_status,
      vendor = nullif(p ->> 'vendor', ''),
      product_type = nullif(p ->> 'product_type', ''),
      tags = coalesce(array(select jsonb_array_elements_text(p -> 'tags')), '{}'),
      seo_title = nullif(p ->> 'seo_title', ''),
      seo_description = nullif(p ->> 'seo_description', ''),
      published_at = case
        when (p ->> 'status') = 'active' then coalesce(published_at, now())
        else published_at
      end
    where id = v_id;
    if not found then
      raise exception 'product not found or not allowed' using errcode = '42501';
    end if;
  end if;

  -- Options are replaced as a whole; they carry no references.
  delete from public.product_options where product_id = v_id;
  insert into public.product_options (product_id, name, values, position)
  select v_id, o ->> 'name', array(select jsonb_array_elements_text(o -> 'values')), ord - 1
  from jsonb_array_elements(coalesce(p -> 'options', '[]')) with ordinality as t (o, ord);

  -- Variants keep their ids (and stock history); stock itself only changes via adjust_stock.
  v_position := 0;
  for v_variant in select * from jsonb_array_elements(coalesce(p -> 'variants', '[]')) loop
    v_variant_id := nullif(v_variant ->> 'id', '')::uuid;
    if v_variant_id is not null then
      update public.product_variants set
        title = v_variant ->> 'title',
        sku = nullif(v_variant ->> 'sku', ''),
        price = (v_variant ->> 'price')::integer,
        compare_at_price = nullif(v_variant ->> 'compare_at_price', '')::integer,
        cost = nullif(v_variant ->> 'cost', '')::integer,
        weight_g = nullif(v_variant ->> 'weight_g', '')::integer,
        option_values = coalesce(v_variant -> 'option_values', '{}'),
        track_inventory = coalesce((v_variant ->> 'track_inventory')::boolean, true),
        allow_backorder = coalesce((v_variant ->> 'allow_backorder')::boolean, false),
        low_stock_threshold = coalesce((v_variant ->> 'low_stock_threshold')::integer, 3),
        position = v_position
      where id = v_variant_id and product_id = v_id;
      if not found then
        raise exception 'variant does not belong to this product' using errcode = '22023';
      end if;
    else
      insert into public.product_variants (
        product_id, title, sku, price, compare_at_price, cost, weight_g, option_values,
        track_inventory, allow_backorder, low_stock_threshold, position, stock
      ) values (
        v_id, v_variant ->> 'title', nullif(v_variant ->> 'sku', ''),
        (v_variant ->> 'price')::integer,
        nullif(v_variant ->> 'compare_at_price', '')::integer,
        nullif(v_variant ->> 'cost', '')::integer,
        nullif(v_variant ->> 'weight_g', '')::integer,
        coalesce(v_variant -> 'option_values', '{}'),
        coalesce((v_variant ->> 'track_inventory')::boolean, true),
        coalesce((v_variant ->> 'allow_backorder')::boolean, false),
        coalesce((v_variant ->> 'low_stock_threshold')::integer, 3),
        v_position, 0
      )
      returning id into v_variant_id;
      if coalesce((v_variant ->> 'initial_stock')::integer, 0) <> 0 then
        perform public.adjust_stock(v_variant_id, (v_variant ->> 'initial_stock')::integer, 'initial');
      end if;
    end if;
    v_keep := v_keep || v_variant_id;
    v_position := v_position + 1;
  end loop;
  delete from public.product_variants where product_id = v_id and id <> all (v_keep);

  -- Images are an ordered list of media references.
  delete from public.product_images where product_id = v_id;
  insert into public.product_images (product_id, media_id, alt, position)
  select v_id, (i ->> 'media_id')::uuid, nullif(i ->> 'alt', ''), ord - 1
  from jsonb_array_elements(coalesce(p -> 'images', '[]')) with ordinality as t (i, ord);

  -- Manual collections only; automatic ones are computed from tags, type and vendor.
  if p ? 'collection_ids' then
    delete from public.collection_products cp
     using public.collections c
     where cp.collection_id = c.id and c.kind = 'manual' and cp.product_id = v_id
       and not (cp.collection_id = any (array(select (jsonb_array_elements_text(p -> 'collection_ids'))::uuid)));
    insert into public.collection_products (collection_id, product_id, position)
    select c.id, v_id,
      coalesce((select max(position) + 1 from public.collection_products x where x.collection_id = c.id), 0)
    from public.collections c
    where c.kind = 'manual'
      and c.id = any (array(select (jsonb_array_elements_text(p -> 'collection_ids'))::uuid))
    on conflict (collection_id, product_id) do nothing;
  end if;

  if p ? 'category_ids' then
    delete from public.product_categories
     where product_id = v_id
       and not (category_id = any (array(select (jsonb_array_elements_text(p -> 'category_ids'))::uuid)));
    insert into public.product_categories (product_id, category_id)
    select v_id, (c)::uuid from jsonb_array_elements_text(p -> 'category_ids') as c
    on conflict (product_id, category_id) do nothing;
  end if;

  return v_id;
end;
$$;

-- Copies a product as a draft with a free handle. SKUs are cleared (they are unique) and
-- stock starts at zero.
create or replace function public.duplicate_product(p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.products;
  v_handle text;
  v_n integer := 1;
  v_new uuid;
begin
  select * into v_source from public.products where id = p_id;
  if not found then
    raise exception 'product not found' using errcode = '42501';
  end if;

  v_handle := left(v_source.handle, 90) || '-copy';
  while exists (select 1 from public.products where handle = v_handle) loop
    v_n := v_n + 1;
    v_handle := left(v_source.handle, 90) || '-copy-' || v_n;
  end loop;

  insert into public.products (title, handle, description, status, vendor, product_type, tags, seo_title, seo_description)
  values (v_source.title || ' (copy)', v_handle, v_source.description, 'draft', v_source.vendor,
    v_source.product_type, v_source.tags, v_source.seo_title, v_source.seo_description)
  returning id into v_new;

  insert into public.product_options (product_id, name, values, position)
  select v_new, name, values, position from public.product_options where product_id = p_id;
  insert into public.product_variants (product_id, title, price, compare_at_price, cost, weight_g,
    option_values, track_inventory, allow_backorder, low_stock_threshold, position, stock)
  select v_new, title, price, compare_at_price, cost, weight_g, option_values, track_inventory,
    allow_backorder, low_stock_threshold, position, 0
  from public.product_variants where product_id = p_id;
  insert into public.product_images (product_id, media_id, alt, position)
  select v_new, media_id, alt, position from public.product_images where product_id = p_id;
  insert into public.product_categories (product_id, category_id)
  select v_new, category_id from public.product_categories where product_id = p_id;
  insert into public.collection_products (collection_id, product_id, position)
  select collection_id, v_new, position from public.collection_products where product_id = p_id;
  return v_new;
end;
$$;
