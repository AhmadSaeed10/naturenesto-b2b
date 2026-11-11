-- Customer reviews for the product page. Keyed by product handle so sample (catalogue)
-- products can be reviewed too. Reviews publish straight away; staff hide or delete them.

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 10 and 2000),
  author_name text not null check (char_length(author_name) between 1 and 80),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_reviews_handle_idx on public.product_reviews (handle, created_at desc)
  where status = 'published';
create index product_reviews_created_idx on public.product_reviews (created_at desc);

create trigger product_reviews_updated_at before update on public.product_reviews
  for each row execute function public.set_updated_at();
-- Inserts come from anonymous visitors, so only staff changes (hide, delete) are audited.
create trigger product_reviews_audit after update or delete on public.product_reviews
  for each row execute function public.audit_row();
