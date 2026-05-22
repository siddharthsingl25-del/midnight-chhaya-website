-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Orders table (phase 3)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- This adds:
--   1. public.orders          — one row per paid Razorpay order
--   2. RLS: nobody but service_role touches this (PII)
--   3. Generated column `order_number` = 'MC-' + zero-padded id
--      → human-friendly reference (MC-00001, MC-00042, …) the customer
--        quotes in support; the merchant can look it up here.
--
-- The id column starts at 1. If you want orders to look more established
-- (e.g. start from MC-01000), run:
--   alter sequence public.orders_id_seq restart with 1000;
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id                   bigserial primary key,
  order_number         text generated always as ('MC-' || lpad(id::text, 5, '0')) stored,
  razorpay_payment_id  text not null unique,
  razorpay_order_id    text not null,
  customer_name        text not null default '',
  customer_email       text not null default '',
  customer_phone       text not null default '',
  customer_instagram   text not null default '',
  delivery_address     text not null default '',
  items                jsonb not null default '[]'::jsonb,
  subtotal             integer not null default 0,
  shipping             integer not null default 0,
  total                integer not null default 0,
  notes                text not null default '',
  status               text not null default 'paid'
                       check (status in ('paid','shipped','delivered','refunded','cancelled')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.orders enable row level security;

-- No anon policies → public cannot read or write orders.
-- Only service_role (server-side) touches this table.

create index if not exists orders_payment_id_idx on public.orders (razorpay_payment_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
