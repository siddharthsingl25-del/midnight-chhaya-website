-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya inventory schema + seed
-- Run this once in Supabase → SQL Editor → New Query → paste → Run.
-- Safe to re-run: every statement is idempotent (does nothing if already done).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Inventory table -----------------------------------------------------------
create table if not exists public.inventory (
  slug         text primary key,
  stock        integer not null default 0 check (stock >= 0),
  updated_at   timestamptz not null default now()
);

-- 2. Row-level security: public can READ stock, only the secret key can WRITE
alter table public.inventory enable row level security;

drop policy if exists "anon read stock" on public.inventory;
create policy "anon read stock" on public.inventory
  for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies → blocked from anon.
-- The service_role key (our server) bypasses RLS so writes go through there.

-- 3. Atomic decrement RPC -----------------------------------------------------
-- Used at checkout. Atomically subtracts qty from a product's stock if there's
-- enough; raises an exception otherwise so the order is rejected.
create or replace function public.decrement_stock(p_slug text, p_qty integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_stock integer;
begin
  update public.inventory
  set stock = stock - p_qty,
      updated_at = now()
  where slug = p_slug
    and stock >= p_qty
  returning stock into new_stock;

  if not found then
    raise exception 'Insufficient stock for %', p_slug using errcode = 'P0001';
  end if;

  return new_stock;
end;
$$;

-- 4. Seed all current product slugs with stock = 0 ----------------------------
insert into public.inventory (slug, stock) values
  ('black-heart-cross',       0),
  ('black-star',              0),
  ('blue-butterfly-moon',     0),
  ('car-keychain',            0),
  ('chunky-red-heart-charm',  0),
  ('clover-cross',            0),
  ('crow-talon-ring',         0),
  ('dragon-cross',            0),
  ('gothic-butterfly',        0),
  ('iron-thorn-keychain',     0),
  ('melting-heart',           0),
  ('pink-cross-charm',        0),
  ('pinteresty-cross-charm',  0),
  ('pookie-cross-charm',      0),
  ('red-chrome-cross',        0),
  ('red-chrome-heart',        0),
  ('red-cross-chain',         0),
  ('red-flame-cross',         0),
  ('red-rose-cross-charm',    0),
  ('relic-keychain',          0),
  ('rose-cross',              0),
  ('shadow-wrap-bracelet',    0),
  ('skeleton-cross',          0),
  ('spider-charm',            0),
  ('spider-medallion',        0),
  ('spike-red-chain',         0),
  ('star-charm',              0),
  ('stone-cross',             0),
  ('sword-heart-charm',       0),
  ('vesper-signet',           0),
  ('wraith-cuff',             0)
on conflict (slug) do nothing;
