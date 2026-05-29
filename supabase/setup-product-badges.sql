-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Product badge graphics (phase 7)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Each product can carry either:
--   • a short text label (e.g. NEW, BEST SELLER, LIMITED)  OR
--   • a custom image overlay (PNG/SVG sticker uploaded to Storage)
-- Rendered in the top-left of the product card. If both are set the
-- image takes precedence. If neither is set, no badge shows.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists badge_text text,
  add column if not exists badge_image text;
