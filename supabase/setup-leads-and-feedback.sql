-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Lead-recovery + feedback infrastructure (phase 6)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Adds:
--   1. public.orders.feedback_sent_at      — tracks when the feedback DM was
--      sent, so the cron doesn't re-send.
--   2. public.feedback                     — one row per submitted rating.
--   3. public.pending_orders               — Razorpay orders that were
--      created but never paid for (the customer made it to the checkout
--      modal and bailed). The cron uses this to fire abandoned-cart
--      recovery emails + WhatsApp with a unique discount code.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Feedback tracking on the orders table -----------------------------------
alter table public.orders
  add column if not exists feedback_sent_at timestamptz;

create index if not exists orders_feedback_sent_idx
  on public.orders (feedback_sent_at);

-- 2. Feedback table ----------------------------------------------------------
create table if not exists public.feedback (
  id                  bigserial primary key,
  razorpay_payment_id text not null references public.orders(razorpay_payment_id) on delete cascade,
  rating              integer not null check (rating between 1 and 5),
  comment             text not null default '',
  created_at          timestamptz not null default now()
);

alter table public.feedback enable row level security;
-- service_role only — never expose customer feedback to anon.

create index if not exists feedback_payment_id_idx on public.feedback (razorpay_payment_id);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- 3. Pending (started-but-not-paid) orders -----------------------------------
create table if not exists public.pending_orders (
  razorpay_order_id    text primary key,
  customer_name        text not null default '',
  customer_email       text not null default '',
  customer_phone       text not null default '',
  customer_instagram   text not null default '',
  items                jsonb not null default '[]'::jsonb,
  subtotal             integer not null default 0,
  shipping             integer not null default 0,
  total                integer not null default 0,
  /** Random 8-char code (e.g. BACK10-A1B2C3) tied to this cart only.
   * Generated when the recovery message is sent; validated at checkout. */
  recovery_code        text,
  /** Percentage off when this code is applied. */
  recovery_percent_off integer not null default 10,
  /** When the recovery email / WhatsApp was last fired. NULL = not yet. */
  recovered_at         timestamptz,
  /** When the customer actually completed payment (mirrors orders). */
  completed_at         timestamptz,
  created_at           timestamptz not null default now()
);

alter table public.pending_orders enable row level security;

create index if not exists pending_orders_recovery_code_idx
  on public.pending_orders (recovery_code)
  where recovery_code is not null;

create index if not exists pending_orders_recovered_idx
  on public.pending_orders (recovered_at);

create index if not exists pending_orders_completed_idx
  on public.pending_orders (completed_at);

create index if not exists pending_orders_created_at_idx
  on public.pending_orders (created_at desc);
