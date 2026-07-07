-- Midnight Chhaya · phase 15 · Chrome Earbuds category
--
-- Adds 'earbuds' to the allowed set of product categories. The old
-- check constraint is dropped and re-created so it accepts the new
-- value alongside the existing four (rings, chains, keychains, bracelets).
--
-- Safe to re-run.

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets','earbuds'));

notify pgrst, 'reload schema';
