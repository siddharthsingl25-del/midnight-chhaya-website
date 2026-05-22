-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Add the "White Moon Bling" pendant (women's chains)
-- Run AFTER supabase/setup-women-as-chains-filter.sql.
-- Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.products (
  slug, name, category, price,
  short_description, description,
  materials, dimensions, images,
  exclusive, featured, for_women, display_order
) values (
  'white-moon-bling',
  'White Moon Bling',
  'chains',
  300,
  'Pavé crescent moon with three falling stars.',
  'A mother-of-pearl crescent rimmed in tiny clear crystals, with three slim chains of stars and rhinestones falling beneath like a meteor shower frozen mid-air. Delicate, dressy, made to catch lamplight.',
  ARRAY['Silver-tone alloy','Mother-of-pearl','Clear crystals']::text[],
  null,
  ARRAY['/products/white-moon-bling-1.webp']::text[],
  false, false, true, 101
)
on conflict (slug) do update set
  category = excluded.category,
  for_women = excluded.for_women;

insert into public.inventory (slug, stock) values
  ('white-moon-bling', 0)
on conflict (slug) do nothing;
