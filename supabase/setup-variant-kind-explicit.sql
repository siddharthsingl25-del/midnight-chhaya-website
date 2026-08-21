-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Make variant_kind the single source of truth
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Background: setup-product-variant-kind.sql shipped a backward-compat
-- fallback — the storefront forced the chain picker on whenever
-- category='chains' AND variant_kind IS NULL. Side effect: picking
-- "No picker" in /admin → Products did nothing for chains-category
-- products, because their saved NULL was reinterpreted as 'chain'.
--
-- The storefront fallback is now gone (ProductDetail.tsx, ProductCard.tsx),
-- so NULL genuinely means "no picker" for every category. This backfill
-- writes the old implicit default down explicitly, so existing chain
-- products keep the picker they have today.
--
--   • variant_kind = NULL     → no picker anywhere
--   • variant_kind = 'chain'  → Chain picker
--   • variant_kind = 'car'    → Car picker
--   • variant_kind = 'color'  → Colour picker
--   • variant_kind = 'cable'  → Cable picker
--
-- After running this, "No picker" works for chains products too — set it
-- per product in /admin → Products.
-- ─────────────────────────────────────────────────────────────────────────────

update public.products
   set variant_kind = 'chain'
 where category = 'chains'
   and variant_kind is null;
