-- Midnight Chhaya · phase 18 · Glasses category
--
-- Adds 'glasses' to the allowed set of product categories.
-- Safe to re-run.

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets','earbuds','glasses'));

notify pgrst, 'reload schema';
