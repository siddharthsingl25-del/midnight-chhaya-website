-- Store the customer's delivery address on the pending_orders row so
-- the Razorpay webhook safety net can recover a full order (address
-- included) if the customer's browser closes before /api/payment/verify
-- runs from the browser.
--
-- Idempotent — safe to re-run.

alter table public.pending_orders
  add column if not exists delivery_address text not null default '';
