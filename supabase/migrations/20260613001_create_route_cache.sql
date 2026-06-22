-- Create route_cache table for ORS results
-- This table caches routing data between postcodes so we don't
-- make redundant ORS API calls. The cache is shared across ALL users.

create table if not exists public.route_cache (
  id bigint generated always as identity primary key,
  origin_postcode text not null,
  destination_postcode text not null,
  distance_km numeric not null,
  duration_minutes numeric not null,
  polyline jsonb,                     -- encoded polyline for map display
  raw_response jsonb,                  -- full ORS response for debugging
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Each origin→destination pair should be unique; update on conflict
  constraint route_cache_unique_pair unique (origin_postcode, destination_postcode)
);

-- Index for fast lookups
create index if not exists idx_route_cache_pair
  on public.route_cache (origin_postcode, destination_postcode);

-- Auto-update updated_at on row modification
create or replace function public.update_route_cache_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_route_cache_updated_at
  before update on public.route_cache
  for each row
  execute function public.update_route_cache_updated_at();

-- Enable RLS but allow all authenticated users to read (cache is shared)
alter table public.route_cache enable row level security;

-- Everyone can read the cache
create policy "Anyone can read route cache"
  on public.route_cache
  for select
  using (true);

-- Only the Edge Function (service_role) can insert/update
create policy "Service role can insert route cache"
  on public.route_cache
  for insert
  with check (true);

create policy "Service role can update route cache"
  on public.route_cache
  for update
  using (true);