-- ─────────────────────────────────────────────────────────────────────────────
-- Midnight Chhaya · Products + Chains tables (phase 2 of inventory work)
-- Run this once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- This adds:
--   1. public.products       — full product catalog (replaces data/products.ts)
--   2. public.chain_options  — chain variants (replaces data/chains.ts)
--   3. RLS: public can SELECT, only service_role can INSERT/UPDATE/DELETE
--   4. Seed inserts for the 31 current products + 5 chains so nothing is lost.
--
-- After running this:
--   - Create a public Storage bucket called `media` (one-click in dashboard)
--   - The admin UI takes over from here
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Products ----------------------------------------------------------------
create table if not exists public.products (
  slug              text primary key,
  name              text not null,
  category          text not null check (category in ('rings','chains','keychains','bracelets')),
  price             integer,  -- INR rupees; null = "Inquire"
  short_description text not null default '',
  description       text not null default '',
  materials         text[] not null default '{}',
  dimensions        text,
  images            text[] not null default '{}',
  exclusive         boolean not null default false,
  featured          boolean not null default false,
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "anon read products" on public.products;
create policy "anon read products" on public.products
  for select to anon, authenticated
  using (true);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_featured_idx on public.products (featured) where featured = true;
create index if not exists products_exclusive_idx on public.products (exclusive) where exclusive = true;

-- 2. Chain options -----------------------------------------------------------
create table if not exists public.chain_options (
  id              text primary key,
  name            text not null,
  image           text not null,
  price_modifier  integer not null default 0,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.chain_options enable row level security;

drop policy if exists "anon read chains" on public.chain_options;
create policy "anon read chains" on public.chain_options
  for select to anon, authenticated
  using (true);
-- Seed products
insert into public.products (slug, name, category, price, short_description, description, materials, dimensions, images, exclusive, featured, display_order) values
  ('crow-talon-ring', 'Crow Talon Ring', 'rings', 4800, 'Hand-forged silver, blackened.', 'A talon coiled around the finger — cast in solid sterling silver, oxidised to deep slate, then polished only at the high points. Wear it as a relic.', ARRAY['Oxidised sterling silver']::text[], 'Adjustable, fits sizes 5–9', ARRAY['https://picsum.photos/seed/mc-talon-1/900/1100','https://picsum.photos/seed/mc-talon-2/900/1100','https://picsum.photos/seed/mc-talon-3/900/1100']::text[], false, false, 0),
  ('vesper-signet', 'Vesper Signet', 'rings', 6400, 'Onyx set in antique brass.', 'An evening-hour signet — flat onyx face on a brass band aged with patina. Heavy in the hand, quiet on the eye.', ARRAY['Brass','Black onyx']::text[], 'Size 6 / 7 / 8', ARRAY['https://picsum.photos/seed/mc-vesper-1/900/1100','https://picsum.photos/seed/mc-vesper-2/900/1100']::text[], false, false, 1),
  ('red-cross-chain', 'Red Cross Chain', 'chains', 300, 'Filigree silver cross, single red stone.', 'A small cathedral worn at the throat — an ornate silver cross etched with filigree and curls, a single red stone set at the heart. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Red crystal']::text[], NULL, ARRAY['/products/red-cross-chain-1-v2.jpg']::text[], false, false, 2),
  ('spike-red-chain', 'Spike Red Chain', 'chains', 300, 'Heart of red set in a silver sunburst.', 'A burning heart wreathed in silver spikes — a sacred-heart pendant crowned with flame and set with a deep red stone. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Red crystal']::text[], NULL, ARRAY['/products/spike-red-chain-1-v2.jpg']::text[], false, false, 3),
  ('pinteresty-cross-charm', 'Pinteresty Cross Charm', 'chains', 300, 'Flame-cut tribal cross on a box chain.', 'A cross carved in tongues of flame — sharp silver tribal curves cut into the form of a gothic crucifix. Worn long on a heavy box chain.', ARRAY['Silver-tone alloy']::text[], NULL, ARRAY['/products/pinteresty-cross-charm-1-v2.jpg']::text[], false, false, 4),
  ('chunky-red-heart-charm', 'Chunky Red Heart Charm', 'chains', 300, 'Deep red heart bound in silver thorns.', 'A sacred-heart relic — a heavy red glass heart wrapped in a crown of silver thorns and crowned with a small cross. Hangs from a heavy box chain.', ARRAY['Silver-tone alloy','Red enamel glass']::text[], NULL, ARRAY['/products/chunky-red-heart-charm-1-v2.jpg']::text[], false, true, 5),
  ('red-flame-cross', 'Red Flame Cross', 'chains', 300, 'Crucifix wrapped in red enamel flame.', 'A silver cross caught mid-burn — wrapped in tongues of deep red enamel that lick upward and trail down into a long flame. Worn on a fine snake chain.', ARRAY['Silver-tone alloy','Red enamel']::text[], NULL, ARRAY['/products/red-flame-cross-1-v2.jpg']::text[], false, false, 6),
  ('pink-cross-charm', 'Pink Pookie Cross', 'chains', 300, 'Silver cross set in pink, blue, yellow crystals.', 'A small reliquary cross studded all over in coloured stones — pink centre, blue and yellow at the points, with a small silver heart framing the heart stone. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Mixed crystals']::text[], NULL, ARRAY['/products/pink-cross-charm-1-v2.jpg']::text[], false, false, 7),
  ('pookie-cross-charm', 'Black Pookie Cross', 'chains', 300, 'Pink and onyx-black crystals on silver.', 'Soft and sharp at once — a silver cross set with pink stones at the inner rim and small jet-black crystals at the cardinal points. A heart frames the centre. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Pink and black crystals']::text[], NULL, ARRAY['/products/pookie-cross-charm-1-v2.jpg']::text[], false, false, 8),
  ('red-rose-cross-charm', 'Red Rose Cross Charm', 'chains', 300, 'Silver roses framing a red heart.', 'A cross of silver roses with a single red glass heart at the centre — three blooms at the arms and one trailing below. Hangs from a heavy box chain.', ARRAY['Silver-tone alloy','Red glass']::text[], NULL, ARRAY['/products/red-rose-cross-charm-1-v2.jpg']::text[], false, true, 9),
  ('red-chrome-cross', 'Red Chrome Cross', 'chains', 300, 'Fleur-de-lis cross with a hot pink stone.', 'A fleur-de-lis crucifix in polished silver — four lily heads tipping each arm of the cross, a single hot pink stone burning at the centre. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Pink crystal']::text[], NULL, ARRAY['/products/red-chrome-cross-1-v2.jpg']::text[], false, false, 10),
  ('red-chrome-heart', 'Red Chrome Heart', 'chains', 300, 'Filigree heart caging a red stone, cherub below.', 'An old reliquary heart — deep red glass cradled inside a silver filigree cage, crowned with a small flame and finished with a tiny cherub at the foot. Hangs from a heavy box chain.', ARRAY['Silver-tone alloy','Red glass']::text[], NULL, ARRAY['/products/red-chrome-heart-1-v2.jpg']::text[], false, false, 11),
  ('gothic-butterfly', 'Gothic Butterfly', 'chains', 300, 'White butterfly inside a red filigree heart.', 'A pale enamel butterfly trapped inside a red glass heart — framed by a curling silver filigree edge. Hangs from a fine snake chain.', ARRAY['Silver-tone alloy','Red and white enamel']::text[], NULL, ARRAY['/products/gothic-butterfly-1-v2.jpg']::text[], false, false, 12),
  ('spider-charm', 'Spider Charm', 'chains', 250, 'Stainless steel spider, polished edges.', 'A small silver spider with long curved legs — cut from polished stainless steel, light enough to forget you''re wearing it. Pairs with any of our chains.', ARRAY['Stainless steel']::text[], NULL, ARRAY['/products/spider-charm-1.jpg']::text[], false, false, 13),
  ('rose-cross', 'Rose Cross', 'chains', 300, 'Antique silver cross wrapped in a single rose.', 'A gothic cross in oxidised silver — fluted arms curling outward, a single full-bloom rose crowning the centre. Heavy in the hand, soft in detail.', ARRAY['Oxidised silver-tone alloy']::text[], NULL, ARRAY['/products/rose-cross-1.jpg']::text[], false, false, 14),
  ('dragon-cross', 'Dragon Cross', 'chains', 300, 'Crucifix coiled by a silver dragon, skull at the heart.', 'An ornate Celtic-patterned cross with a small skull medallion at the centre — a silver dragon coils around its arms, body looping behind and tail trailing down. Heavy detail, small piece.', ARRAY['Oxidised silver-tone alloy']::text[], NULL, ARRAY['/products/dragon-cross-1.jpg','/products/dragon-cross-2.jpg']::text[], false, true, 15),
  ('clover-cross', 'Clover Cross', 'chains', 300, 'Fleur-de-lis cross with diamond-faceted tips.', 'A heraldic silver cross — every arm capped with a clover-shaped fleur-de-lis around a faceted diamond point, a small floral medallion at the centre. Antique-finished.', ARRAY['Oxidised silver-tone alloy']::text[], NULL, ARRAY['/products/clover-cross-1.jpg']::text[], false, false, 16),
  ('black-star', 'Majnu Black Star', 'chains', 250, 'Asymmetric jet star in a silver frame.', 'A lopsided five-point star — deep black enamel set inside a polished silver frame with a long, drawn-out lower point. Small, sharp, distinctly off-balance.', ARRAY['Silver-tone alloy','Black enamel']::text[], NULL, ARRAY['/products/black-star-1.jpg']::text[], false, false, 17),
  ('sword-heart-charm', 'Sword Heart Charm', 'chains', 280, 'Red heart run through by a skull-hilt dagger.', 'A small dagger driven straight through a deep red enamel heart — twisted silver grip, tiny skull at the pommel, blade tip exposed below. The classic tattoo motif, made small.', ARRAY['Silver-tone alloy','Red enamel']::text[], NULL, ARRAY['/products/sword-heart-charm-1.jpg']::text[], false, false, 18),
  ('stone-cross', 'Stone Cross', 'chains', 280, 'Silver cross paved in clear crystals.', 'A small silver crucifix with flared fleur tips — every arm and the centre paved with clear crystals that catch every light. Delicate, deliberate, sharp at the edges.', ARRAY['Silver-tone alloy','Clear crystals']::text[], NULL, ARRAY['/products/stone-cross-1.jpg']::text[], false, false, 19),
  ('melting-heart', 'Melting Heart', 'chains', 250, 'Caged purple heart with dripping silver tears.', 'A dark amethyst-toned heart caught inside a tangle of silver thorns, mounted on a padlock-shaped bail with molten silver tears running off the bottom edge. Strange and small.', ARRAY['Silver-tone alloy','Purple-black resin']::text[], NULL, ARRAY['/products/melting-heart-1.jpg']::text[], false, false, 20),
  ('star-charm', 'Star Charm', 'chains', 200, 'Jet-black star in a silver frame.', 'A small five-point star — matte black enamel inside a polished silver bezel. Simple, clean, sits well alongside any of the cross charms.', ARRAY['Silver-tone alloy','Black enamel']::text[], NULL, ARRAY['/products/star-charm-1.jpg']::text[], false, false, 21),
  ('skeleton-cross', 'Skeleton Cross', 'chains', 250, 'Red enamel cross with a silver skeleton crucified across it.', 'A blood-red cross with a small silver skeleton draped across the centre — head bowed, ribs and limbs hand-detailed. Memento mori, made wearable.', ARRAY['Silver-tone alloy','Red enamel']::text[], NULL, ARRAY['/products/skeleton-cross-1.jpg']::text[], false, false, 22),
  ('spider-medallion', 'Spider Medallion', 'chains', 200, 'Etched spider on a black enamel coin.', 'A circular pendant — silver spider etched onto a glossy black enamel face, framed by a polished silver bezel. Small, neat, instantly recognisable.', ARRAY['Silver-tone alloy','Black enamel']::text[], NULL, ARRAY['/products/spider-medallion-1.jpg']::text[], false, false, 23),
  ('blue-butterfly-moon', 'Blue Butterfly Moon', 'chains', 300, 'Iridescent blue moon, white rose, silver drips.', 'A small piece with a lot happening — an opalescent blue moonstone cabochon, a pale white rose set into a crescent of silver, butterfly-wing flourishes at the top, and molten silver tears running off the lower edge.', ARRAY['Silver-tone alloy','Moonstone-effect resin','Resin rose']::text[], NULL, ARRAY['/products/blue-butterfly-moon-1.jpg']::text[], false, true, 24),
  ('black-heart-cross', 'Black Heart Cross', 'chains', 280, 'Molten gunmetal cross with a faceted black heart.', 'A cross cast as if poured molten — soft wavy edges in dark gunmetal silver, a single faceted jet-black heart set at the centre. Heavier than it looks.', ARRAY['Gunmetal silver-tone alloy','Black crystal']::text[], NULL, ARRAY['/products/black-heart-cross-1.jpg']::text[], false, false, 25),
  ('wraith-cuff', 'Wraith Cuff', 'bracelets', 5400, 'Hand-hammered oxidised cuff.', 'A heavy hand-hammered cuff in oxidised silver — pulled open just enough to slip on, then closes against the wrist with a soft, deliberate weight.', ARRAY['Oxidised sterling silver']::text[], 'Inner Ø 60mm, adjustable', ARRAY['https://picsum.photos/seed/mc-wraith-1/900/1100','https://picsum.photos/seed/mc-wraith-2/900/1100']::text[], false, false, 26),
  ('shadow-wrap-bracelet', 'Shadow Wrap', 'bracelets', 3600, 'Black cord wrap with brass charm.', 'Triple-wrap waxed cord with a small brass medallion, aged to a deep gold-brown. Slim, quiet, made for everyday.', ARRAY['Waxed cotton cord','Aged brass']::text[], 'Wraps 3× · adjustable 14–18cm', ARRAY['https://picsum.photos/seed/mc-shadow-w-1/900/1100','https://picsum.photos/seed/mc-shadow-w-2/900/1100']::text[], false, false, 27),
  ('car-keychain', 'Race Car Keychain', 'keychains', 50, 'Mini diecast race car — random colour, sent as one.', 'A pocket-size diecast race car on a steel split-ring. Each keychain ships in a random colour and livery — the design you receive will not be the one shown in the photo. One car per order.', ARRAY['Diecast metal','Steel ring']::text[], NULL, ARRAY['/products/car-keychain-1.jpg']::text[], false, false, 28),
  ('iron-thorn-keychain', 'Iron Thorn Keychain', 'keychains', 1800, 'Blackened spike on a brass ring.', 'A single blackened spike on a heavy brass ring — small, sharp, satisfying in the pocket. Hand-finished one by one.', ARRAY['Oxidised silver','Brass']::text[], 'Spike 40mm · ring Ø 32mm', ARRAY['https://picsum.photos/seed/mc-thorn-k-1/900/1100','https://picsum.photos/seed/mc-thorn-k-2/900/1100']::text[], false, false, 29),
  ('relic-keychain', 'Relic Keychain', 'keychains', 2200, 'Engraved tag on antique brass.', 'A small engraved brass tag — a single word, your choice, hand-stamped at the bench. Sold in small batches.', ARRAY['Antique brass']::text[], 'Tag 22 × 36mm', ARRAY['https://picsum.photos/seed/mc-relic-k-1/900/1100','https://picsum.photos/seed/mc-relic-k-2/900/1100']::text[], true, false, 30)
on conflict (slug) do nothing;

-- Seed chain options
insert into public.chain_options (id, name, image, price_modifier, display_order) values
  ('box-24', 'Box chain · 24"', '/chains/box-24.jpg', 0, 0),
  ('snake-22', 'Snake chain · 22" · 2mm', '/chains/snake-22.jpg', 0, 1),
  ('flat-snake-20', 'Flat snake chain · 20"', '/chains/flat-snake-20.jpg', 0, 2),
  ('silver-flat-snake-18', 'Silver flat snake chain · 18"', '/chains/silver-flat-snake-18.jpg', 0, 3),
  ('flat-22', 'Stainless steel flat chain · 22"', '/chains/flat-22.jpg', 0, 4)
on conflict (id) do nothing;
