-- Midnight Chhaya · Cable variants (C Type / Lightning)
--
-- Extends chain_options.kind + products.variant_kind to allow 'cable'
-- so the chrome earphone product can offer a cable-type picker
-- (Type-C or Lightning) at checkout — same infrastructure that
-- powers chain, car, and colour pickers.
--
-- Safe to re-run.

alter table public.chain_options
  drop constraint if exists chain_options_kind_check;

alter table public.chain_options
  add constraint chain_options_kind_check
  check (kind in ('chain', 'car', 'color', 'cable'));

alter table public.products
  drop constraint if exists products_variant_kind_check;

alter table public.products
  add constraint products_variant_kind_check
  check (variant_kind is null or variant_kind in ('chain', 'car', 'color', 'cable'));

notify pgrst, 'reload schema';
