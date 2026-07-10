-- Midnight Chhaya · phase 21 · order tracking
--
-- Adds tracking fields to orders so the merchant can:
--   1. Mark an order as shipped with a tracking id + courier partner
--   2. Mark it as delivered
-- Every status change triggers a customer-facing email.
--
-- Safe to re-run.

alter table public.orders
  add column if not exists tracking_id     text,
  add column if not exists courier_partner text,
  add column if not exists tracking_url    text,
  add column if not exists shipped_at      timestamptz,
  add column if not exists delivered_at    timestamptz;

notify pgrst, 'reload schema';
