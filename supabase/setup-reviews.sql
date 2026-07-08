-- Midnight Chhaya · phase 16 · Reviews gallery
--
-- Public-read table of review screenshot images. The merchant uploads
-- screenshots (Instagram DMs, WhatsApp messages, tagged posts, etc.)
-- from admin; the /reviews page renders them in a grid.
--
-- Safe to re-run.

create table if not exists public.reviews (
  id            bigserial primary key,
  image_url     text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Public read: anyone can see the reviews page.
drop policy if exists "reviews readable by all" on public.reviews;
create policy "reviews readable by all"
  on public.reviews for select
  using (true);

create index if not exists reviews_display_order_idx
  on public.reviews (display_order asc, id desc);

notify pgrst, 'reload schema';
