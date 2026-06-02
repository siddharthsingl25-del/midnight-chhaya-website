-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Manual related-products picker (phase 10)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Adds a related_slugs text[] column on products. When set, the
-- "Related pieces" section at the bottom of a product page renders
-- exactly those products in the chosen order. When null/empty, the
-- existing auto-generated category siblings fall back in.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists related_slugs text[] not null default '{}';

notify pgrst, 'reload schema';
