-- Midnight Chhaya · phase 20 · Promo codes
--
-- Merchant-managed discount codes (separate from the per-cart recovery
-- codes that the abandoned-cart cron issues). Each code has a
-- global max_uses count; times_used increments only on successful
-- payment, so abandoned checkouts don't burn the code.
--
-- Safe to re-run. Also seeds the SAYAM49 code (₹49 flat off, one-time
-- global use) if it doesn't already exist.

create table if not exists public.promo_codes (
  code             text primary key,
  flat_amount_off  integer not null default 0 check (flat_amount_off >= 0),
  percent_off      integer not null default 0 check (percent_off >= 0 and percent_off <= 100),
  min_subtotal     integer not null default 0 check (min_subtotal >= 0),
  max_uses         integer,             -- null = unlimited
  times_used       integer not null default 0 check (times_used >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.promo_codes enable row level security;
-- service_role only — never expose to anon (code list is private).

-- Seed the SAYAM49 code (safe if it already exists).
insert into public.promo_codes (code, flat_amount_off, max_uses, active)
values ('SAYAM49', 49, 1, true)
on conflict (code) do nothing;

notify pgrst, 'reload schema';
