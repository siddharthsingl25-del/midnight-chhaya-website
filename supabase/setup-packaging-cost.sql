-- Midnight Chhaya · phase 13 · per-order packaging override
--
-- Until now packaging was always the global ₹12.50 default for every
-- order. This column lets a specific order override that — useful when:
--   - a cash sale was hand-off (no packaging at all → set to 0)
--   - a bigger box / extra wrap pushed the real cost higher
--   - a friend got a discount and you ate the packaging cost
--
-- NULL = use the global PACKAGING_COST_PER_ORDER default.
-- Any non-null value (including 0) overrides it for that order.
--
-- Safe to re-run.

alter table public.orders
  add column if not exists packaging_cost integer;

notify pgrst, 'reload schema';
