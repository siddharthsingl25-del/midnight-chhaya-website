-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Add the "Dangle White Flower" pendant
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run: on conflict do nothing on the slug.
--
-- Pre-req: supabase/setup-women-category.sql must have been applied
-- so the 'women' category passes the check constraint.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.products (
  slug, name, category, price,
  short_description, description,
  materials, dimensions, images,
  exclusive, featured, display_order
) values (
  'dangle-white-flower',
  'Dangle White Flower',
  'women',
  300,
  'Clear quartz rose on a silver thorn stem.',
  'A translucent quartz rose perched on a slim silver stem of twisting thorns and leaves — softness held against sharpness. Worn long; reads delicate from a distance, gothic up close.',
  ARRAY['Silver-tone alloy','Clear quartz']::text[],
  null,
  ARRAY['/products/dangle-white-flower-1.webp']::text[],
  false,
  false,
  99
)
on conflict (slug) do nothing;

-- Seed inventory so the product is buyable. Start at 0 (sold out) —
-- the admin can set the real number in /admin → Stock.
insert into public.inventory (slug, stock) values
  ('dangle-white-flower', 0)
on conflict (slug) do nothing;
