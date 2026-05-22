-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Move "women" from its own category to a chains sub-filter
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Supersedes the earlier setup-women-category.sql. Instead of 'women'
-- being a category alongside chains/keychains/bracelets/rings, products
-- now live under `chains` with a separate `for_women` boolean flag.
-- The storefront treats /collections?cat=chains&audience=women as the
-- filtered view.
--
-- Order matters:
--   1. Move any products previously saved as category='women' back to
--      'chains' so the about-to-be-tightened constraint passes.
--   2. Add the for_women column (defaults to false).
--   3. Flag those moved products as for_women = true.
--   4. Tighten the category check back to the original four values.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Reclassify any women-category rows
update public.products
  set category = 'chains'
  where category = 'women';

-- 2. Add the audience flag
alter table public.products
  add column if not exists for_women boolean not null default false;

-- 3. Mark the reclassified rows as for_women
update public.products
  set for_women = true
  where slug = 'dangle-white-flower';

-- 4. Restore the original category check
alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets'));
