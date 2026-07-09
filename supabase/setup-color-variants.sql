-- Midnight Chhaya · phase 19 · Colour variants
--
-- Extends the existing chain-option / car-picker infrastructure to
-- also support colour swatches. New "kind" value: 'color'.
--   • chain_options.kind gains 'color' alongside 'chain' and 'car'
--   • products.variant_kind accepts 'color' too
--
-- With this, the merchant can:
--   1. Create colour variants in the Chains admin tab (kind = Color)
--   2. Set a product's variant_kind = 'color' to expose the picker
--
-- Safe to re-run.

alter table public.chain_options
  drop constraint if exists chain_options_kind_check;

alter table public.chain_options
  add constraint chain_options_kind_check
  check (kind in ('chain', 'car', 'color'));

alter table public.products
  drop constraint if exists products_variant_kind_check;

alter table public.products
  add constraint products_variant_kind_check
  check (variant_kind is null or variant_kind in ('chain', 'car', 'color'));

notify pgrst, 'reload schema';
