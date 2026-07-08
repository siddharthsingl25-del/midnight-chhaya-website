-- Midnight Chhaya · phase 17 · Cash-on-delivery support
--
-- Extends orders.payment_method to include 'cod'. For COD orders the
-- customer prepays via Razorpay the shipping fee + a flat COD charge,
-- and pays the product subtotal in cash to the courier on delivery.
--
-- New column prepaid_amount stores what the customer actually paid up
-- front via Razorpay:
--   - online → prepaid_amount = total
--   - cod    → prepaid_amount = shipping + cod_charge
--   - cash   → prepaid_amount = null (nothing charged online)
-- Finance uses this to compute the real gateway fee.
--
-- Safe to re-run.

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('online', 'cash', 'cod'));

alter table public.orders
  add column if not exists prepaid_amount integer;

notify pgrst, 'reload schema';
