-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Finance module (phase 11)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run.
--
-- Adds the data needed to compute per-order profit and track P&L:
--
--   1. products.cost_price      — what each unit costs the merchant to
--                                 source / make (INR rupees, nullable).
--                                 Used as COGS for profit calculation.
--   2. orders.payment_method    — 'online' (Razorpay) or 'cash' (friend
--                                 sale, in-person, etc.) so cash orders
--                                 enter the same ledger.
--   3. orders.merchant_cost     — optional override for the actual cost
--                                 the merchant bore on this specific
--                                 order (shipping paid to courier,
--                                 packaging, etc.). Null = use defaults.
--   4. public.expenses          — non-order expenses, categorised
--                                 (advertising / collab / restock /
--                                 packaging / other).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists cost_price integer;

alter table public.orders
  add column if not exists payment_method text not null default 'online';

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('online', 'cash'));

alter table public.orders
  add column if not exists merchant_cost integer;

-- Cash orders don't have a Razorpay payment id. Relax the NOT NULL +
-- UNIQUE on razorpay_payment_id so a friend-paying-in-cash row can be
-- inserted with NULL. The unique constraint still rejects duplicates
-- across all NON-NULL values (Postgres unique treats NULLs as distinct).
alter table public.orders
  alter column razorpay_payment_id drop not null;

alter table public.orders
  alter column razorpay_order_id drop not null;

create table if not exists public.expenses (
  id            bigserial primary key,
  category      text not null
                check (category in ('advertising','collab','restock','shipping','packaging','other')),
  amount        integer not null check (amount >= 0),
  description   text not null default '',
  occurred_at   date not null default current_date,
  created_at    timestamptz not null default now()
);

alter table public.expenses enable row level security;
-- service_role only — never expose financial data to anon.

create index if not exists expenses_occurred_at_idx on public.expenses (occurred_at desc);
create index if not exists expenses_category_idx    on public.expenses (category);

notify pgrst, 'reload schema';
