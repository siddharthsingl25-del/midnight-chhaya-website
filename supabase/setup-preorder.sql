-- Midnight Chhaya · phase 14 · pre-order support
--
-- Adds two columns on products:
--   is_pre_order   — flag: is this product currently in pre-order phase?
--   launch_price   — the eventual "normal" price after launch (INR).
--                    Shown crossed-out beside the current price so the
--                    customer sees the discount they get for buying now.
--
-- The existing `price` column keeps its meaning: what the customer pays
-- right now. When is_pre_order flips off after launch, `price` should
-- be updated to `launch_price` (or whatever you want).
--
-- Safe to re-run.

alter table public.products
  add column if not exists is_pre_order boolean not null default false;

alter table public.products
  add column if not exists launch_price integer;

create index if not exists products_is_pre_order_idx
  on public.products (is_pre_order)
  where is_pre_order = true;

notify pgrst, 'reload schema';
