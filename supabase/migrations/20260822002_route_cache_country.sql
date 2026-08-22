-- Give the route cache a country.
--
-- route_cache is unique on (origin_postcode, destination_postcode), which was
-- sound while every postcode in it was British. It stops being sound the moment
-- a second country is supported: "3000" is a real postcode in Melbourne and in
-- several other places, and a four-digit code means something different in
-- Australia and New Zealand. Without a country in the key, the first lookup to
-- land wins and every later one is served a travel time from the wrong
-- continent -- silently, and with a cached answer that looks authoritative.
--
-- Existing rows are all GB. Every one of them was written by a UK-only
-- geocoder, so backfilling the column with 'GB' is a statement of fact rather
-- than an assumption.

alter table public.route_cache
  add column if not exists country text not null default 'GB';

-- The old constraint has to go before the new one can mean anything.
alter table public.route_cache
  drop constraint if exists route_cache_unique_pair;

alter table public.route_cache
  add constraint route_cache_unique_pair
  unique (country, origin_postcode, destination_postcode);

-- The lookup index has to match the new key or every read falls back to a scan.
drop index if exists public.idx_route_cache_pair;

create index if not exists idx_route_cache_pair
  on public.route_cache (country, origin_postcode, destination_postcode);

comment on column public.route_cache.country is
  'ISO 3166-1 alpha-2 of the country both postcodes belong to. Part of the '
  'unique key: postcode formats repeat across countries, so a pair is only '
  'meaningful alongside the country it was looked up in.';
