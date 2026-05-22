-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Add the "Dangle Pink Flower" pendant
-- Run this AFTER supabase/setup-women-as-chains-filter.sql.
-- Safe to re-run.
--
-- Lives in the chains category with the for_women flag set, so it
-- appears under both /collections?cat=chains and the "Women" sub-filter
-- /collections?cat=chains&audience=women.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.products (
  slug, name, category, price,
  short_description, description,
  materials, dimensions, images,
  exclusive, featured, for_women, display_order
) values (
  'dangle-pink-flower',
  'Dangle Pink Flower',
  'chains',
  300,
  'Soft pink rose on a silver thorn stem.',
  'A blush pink resin rose perched on a slim silver stem of twisting thorns and leaves — softness held against sharpness. Sister piece to the clear-quartz version; reads delicate from a distance, gothic up close.',
  ARRAY['Silver-tone alloy','Pink resin']::text[],
  null,
  ARRAY['/products/dangle-pink-flower-1.webp']::text[],
  false, false, true, 100
)
on conflict (slug) do update set
  category = excluded.category,
  for_women = excluded.for_women;

-- Seed inventory so the product shows in /admin → Stock. Start at 0.
insert into public.inventory (slug, stock) values
  ('dangle-pink-flower', 0)
on conflict (slug) do nothing;
