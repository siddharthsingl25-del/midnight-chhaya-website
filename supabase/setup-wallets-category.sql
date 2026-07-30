-- Allow 'wallets' as a valid product category.
-- Extends the CHECK constraint on products.category so the admin can
-- save wallet products without a "check violation" error.
--
-- Idempotent — safe to re-run.

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets','earbuds','glasses','wallets'));
