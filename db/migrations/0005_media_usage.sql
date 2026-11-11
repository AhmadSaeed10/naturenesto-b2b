-- How many records point at each media asset. The media library shows it and refuses to
-- delete anything in use. Security invoker: counts only rows the caller can see, and staff
-- see every row in these tables.
create or replace function public.media_usage(p_media_ids uuid[])
returns table (media_id uuid, uses bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id,
    (select count(*) from public.product_images x where x.media_id = m.id)
    + (select count(*) from public.collections x where x.image_id = m.id)
    + (select count(*) from public.blog_posts x where x.cover_media_id = m.id)
    + (select count(*) from public.workshops x where x.cover_media_id = m.id)
    + (select count(*) from public.services x where x.cover_media_id = m.id)
    + (select count(*) from public.gift_bundles x where x.cover_media_id = m.id)
    + (select count(*) from public.site_settings x where x.logo_media_id = m.id)
  from unnest(p_media_ids) as m (id);
$$;

create index if not exists media_assets_created_idx on public.media_assets (created_at desc);
