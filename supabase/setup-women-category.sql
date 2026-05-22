-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Add "women" category (phase 5)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Drops the existing check constraint on public.products.category and
-- re-adds it including the new 'women' value, so the admin can save
-- products under that category.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('rings','chains','keychains','bracelets','women'));
