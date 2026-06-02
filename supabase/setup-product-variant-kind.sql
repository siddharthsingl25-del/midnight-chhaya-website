-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Per-product variant picker (phase 9)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Adds a variant_kind column on public.products so the merchant can
-- opt each product into the variant picker individually instead of
-- the picker auto-enabling for every chain / keychain.
--
--   • variant_kind = NULL    → no picker on the detail page
--   • variant_kind = 'chain' → shows the Chain picker
--   • variant_kind = 'car'   → shows the Car picker
--
-- For backward compat the storefront falls back to 'chain' when
-- category='chains' AND variant_kind is null, so existing chain
-- products keep their picker without a data migration.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists variant_kind text;

alter table public.products
  drop constraint if exists products_variant_kind_check;

alter table public.products
  add constraint products_variant_kind_check
  check (variant_kind is null or variant_kind in ('chain', 'car'));
