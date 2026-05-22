-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Add the "Dangle White Flower" pendant
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
  'dangle-white-flower',
  'Dangle White Flower',
  'chains',
  300,
  'Clear quartz rose on a silver thorn stem.',
  'A translucent quartz rose perched on a slim silver stem of twisting thorns and leaves — softness held against sharpness. Worn long; reads delicate from a distance, gothic up close.',
  ARRAY['Silver-tone alloy','Clear quartz']::text[],
  null,
  ARRAY['/products/dangle-white-flower-1.webp']::text[],
  false, false, true, 99
)
on conflict (slug) do update set
  category = excluded.category,
  for_women = excluded.for_women;

-- Seed inventory so the product shows in /admin → Stock. Start at 0.
insert into public.inventory (slug, stock) values
  ('dangle-white-flower', 0)
on conflict (slug) do nothing;
