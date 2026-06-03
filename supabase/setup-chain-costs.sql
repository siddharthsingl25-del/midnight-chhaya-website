-- Midnight Chhaya · phase 12 · chain cost prices
--
-- Each chain option (silver thick, gold thin, etc.) costs the merchant
-- a different amount to source. Without this column, COGS on any order
-- with a chain variant only counted the base product cost, never the
-- chain cost, undercounting expenses.
--
-- Safe to re-run.

alter table public.chain_options
  add column if not exists cost_price integer;

notify pgrst, 'reload schema';
