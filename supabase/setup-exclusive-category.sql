-- Allow 'exclusive' as a valid product category so the admin can save
-- products with category = 'exclusive'.
-- Idempotent — safe to re-run.

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets','earbuds','glasses','wallets','exclusive'));
