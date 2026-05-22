-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Chain stock tracking (phase 4)
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Adds per-chain inventory so the admin can see how many physical
-- chains of each style are left, and checkout rejects orders for
-- sold-out chains.
--
--   1. stock column on public.chain_options (default 0, NOT NULL)
--   2. decrement_chain_stock RPC — atomic, mirrors decrement_stock
--   3. Seeds existing chains to stock = 100 so live orders aren't
--      blocked until the merchant updates real numbers in /admin
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.chain_options
  add column if not exists stock integer not null default 0
  check (stock >= 0);

-- Backfill existing rows so the live site keeps accepting chain orders.
-- New rows still default to 0; the admin sets real numbers in /admin.
update public.chain_options
  set stock = 100
  where stock = 0;

create or replace function public.decrement_chain_stock(p_chain_id text, p_qty integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_stock integer;
begin
  update public.chain_options
  set stock = stock - p_qty
  where id = p_chain_id
    and stock >= p_qty
  returning stock into new_stock;

  if not found then
    raise exception 'Insufficient chain stock for %', p_chain_id using errcode = 'P0001';
  end if;

  return new_stock;
end;
$$;
