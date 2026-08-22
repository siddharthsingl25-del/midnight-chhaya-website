-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Per-product restock / availability note
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Adds products.restock_note: free text shown to customers on the product
-- page and the product card whenever it is filled in. Editable per product
-- in /admin → Products → "Availability note".
--
--   • restock_note = NULL → nothing shown (this is the default)
--   • any text            → shown in gold on the page and the card
--
-- Clear the note in /admin once the piece is back in stock.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists restock_note text;

-- Current notes the merchant asked for.
update public.products
   set restock_note = 'Restock by 1-5 September'
 where category = 'glasses';

update public.products
   set restock_note = 'Restock in 15 days'
 where category = 'earbuds';
