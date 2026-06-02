-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Generic variant system for keychains (phase 8)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Generalizes the existing chain_options table so it can hold both
-- chains (for necklaces) AND cars (for race-car keychains). Each row
-- now carries a kind:
--   • 'chain' — attaches to chain-category products (existing rows)
--   • 'car'   — attaches to keychain-category products (new)
--
-- Same stock + price-modifier + image columns. The selector component
-- on the storefront filters by kind based on the product's category.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.chain_options
  add column if not exists kind text not null default 'chain';

alter table public.chain_options
  drop constraint if exists chain_options_kind_check;

alter table public.chain_options
  add constraint chain_options_kind_check
  check (kind in ('chain', 'car'));

create index if not exists chain_options_kind_idx
  on public.chain_options (kind);
