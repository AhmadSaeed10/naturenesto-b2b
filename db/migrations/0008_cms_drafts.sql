-- Unpublished homepage edits live in their own table, so a published section row never
-- carries draft copy. Read and written by content staff only (enforced in server code).
create table public.page_section_drafts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null unique references public.page_sections (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger page_section_drafts_updated_at before update on public.page_section_drafts
  for each row execute function public.set_updated_at();
create trigger page_section_drafts_audit after insert or update or delete on public.page_section_drafts
  for each row execute function public.audit_row();

-- Lookups the storefront makes on every uncached request.
create index if not exists blog_posts_tags_idx on public.blog_posts using gin (tags);
create index if not exists faq_items_position_idx on public.faq_items (status, position);
