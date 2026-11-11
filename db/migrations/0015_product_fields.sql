-- Fuller product data, all optional: short description, specifications, what is included,
-- hand picked related products, shipping facts, a publish date, and per variant barcode and image.
-- save_product and duplicate_product are replaced to carry the new fields. The new keys are only
-- applied when the payload has them, so the CSV import leaves stored values alone.

alter table public.products
  add column short_description text,
  add column specs jsonb not null default '[]'::jsonb,
  add column included text[] not null default '{}',
  add column related_handles text[] not null default '{}',
  add column requires_shipping boolean not null default true,
  add column package_dims jsonb not null default '{}'::jsonb,
  add column publish_at timestamptz;

alter table public.product_variants
  add column barcode text,
  add column image_media_id uuid references public.media_assets (id) on delete set null;

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
    insert into public.products (title, handle, description, status, vendor, product_type, tags, seo_title, seo_description, care,
      short_description, specs, included, related_handles, requires_shipping, package_dims, publish_at)
    values (
      p ->> 'title', p ->> 'handle', p -> 'description',
      (p ->> 'status')::public.product_status,
      nullif(p ->> 'vendor', ''), nullif(p ->> 'product_type', ''),
      coalesce(array(select jsonb_array_elements_text(p -> 'tags')), '{}'),
      nullif(p ->> 'seo_title', ''), nullif(p ->> 'seo_description', ''),
      coalesce(p -> 'care', '{}'::jsonb),
      nullif(p ->> 'short_description', ''),
      coalesce(p -> 'specs', '[]'::jsonb),
      coalesce(array(select jsonb_array_elements_text(p -> 'included')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p -> 'related_handles')), '{}'),
      coalesce((p ->> 'requires_shipping')::boolean, true),
      coalesce(p -> 'package_dims', '{}'::jsonb),
      nullif(p ->> 'publish_at', '')::timestamptz
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
      -- Callers that do not send care (the CSV import) keep what is stored.
      care = case when p ? 'care' then p -> 'care' else care end,
      short_description = case when p ? 'short_description' then nullif(p ->> 'short_description', '') else short_description end,
      specs = case when p ? 'specs' then p -> 'specs' else specs end,
      included = case when p ? 'included' then coalesce(array(select jsonb_array_elements_text(p -> 'included')), '{}') else included end,
      related_handles = case when p ? 'related_handles' then coalesce(array(select jsonb_array_elements_text(p -> 'related_handles')), '{}') else related_handles end,
      requires_shipping = case when p ? 'requires_shipping' then (p ->> 'requires_shipping')::boolean else requires_shipping end,
      package_dims = case when p ? 'package_dims' then p -> 'package_dims' else package_dims end,
      publish_at = case when p ? 'publish_at' then nullif(p ->> 'publish_at', '')::timestamptz else publish_at end,
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
        barcode = case when v_variant ? 'barcode' then nullif(v_variant ->> 'barcode', '') else barcode end,
        image_media_id = case when v_variant ? 'image_media_id' then nullif(v_variant ->> 'image_media_id', '')::uuid else image_media_id end,
        position = v_position
      where id = v_variant_id and product_id = v_id;
      if not found then
        raise exception 'variant does not belong to this product' using errcode = '22023';
      end if;
    else
      insert into public.product_variants (
        product_id, title, sku, price, compare_at_price, cost, weight_g, option_values,
        track_inventory, allow_backorder, low_stock_threshold, position, stock, barcode, image_media_id
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
        v_position, 0,
        nullif(v_variant ->> 'barcode', ''),
        nullif(v_variant ->> 'image_media_id', '')::uuid
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

  insert into public.products (title, handle, description, status, vendor, product_type, tags, seo_title, seo_description, care,
    short_description, specs, included, related_handles, requires_shipping, package_dims)
  values (v_source.title || ' (copy)', v_handle, v_source.description, 'draft', v_source.vendor,
    v_source.product_type, v_source.tags, v_source.seo_title, v_source.seo_description, v_source.care,
    v_source.short_description, v_source.specs, v_source.included, v_source.related_handles,
    v_source.requires_shipping, v_source.package_dims)
  returning id into v_new;

  insert into public.product_options (product_id, name, values, position)
  select v_new, name, values, position from public.product_options where product_id = p_id;
  insert into public.product_variants (product_id, title, price, compare_at_price, cost, weight_g,
    option_values, track_inventory, allow_backorder, low_stock_threshold, position, stock, barcode, image_media_id)
  select v_new, title, price, compare_at_price, cost, weight_g, option_values, track_inventory,
    allow_backorder, low_stock_threshold, position, 0, barcode, image_media_id
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
