-- ============================================================
-- GeoRoute: Complete Supabase Setup Script
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This drops ALL existing tables and recreates them.
-- ============================================================

-- 0. DROP EVERYTHING FIRST
drop table if exists public.route_cache cascade;
drop table if exists public.staff cascade;
drop table if exists public.business_settings cascade;
drop table if exists public.appointments cascade;
drop table if exists public.routes cascade;
drop table if exists public.site_header cascade;
drop table if exists public.admin_logs cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.admin_activity_logs cascade;
drop table if exists public.admin_user_list cascade;
drop table if exists public.pricing cascade;
drop table if exists public.profiles cascade;
drop function if exists public.update_route_cache_updated_at cascade;

-- ============================================================
-- 1. PROFILES — User profiles linked to auth.users
-- ============================================================
create table if not exists public.profiles (
  id bigint generated always as identity primary key,
  user_id uuid unique references auth.users(id) on delete cascade,
  email text default '',
  full_name text default '',
  is_pro boolean default false,
  is_admin boolean default false,
  plan text default 'free',
  subscription_renewal timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Allow inserts during signup (service_role or trigger handles this)
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, is_pro, is_admin, plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    false,
    false,
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 2. ROUTE CACHE — ORS results shared across all users
-- ============================================================
create table if not exists public.route_cache (
  id bigint generated always as identity primary key,
  origin_postcode text not null,
  destination_postcode text not null,
  distance_km numeric not null,
  duration_minutes numeric not null,
  polyline jsonb,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_cache_unique_pair unique (origin_postcode, destination_postcode)
);

create index if not exists idx_route_cache_pair
  on public.route_cache (origin_postcode, destination_postcode);

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

alter table public.route_cache enable row level security;

create policy "Anyone can read route cache"
  on public.route_cache for select using (true);

create policy "Service role can insert route cache"
  on public.route_cache for insert with check (true);

create policy "Service role can update route cache"
  on public.route_cache for update using (true);

-- ============================================================
-- 3. STAFF — Per-user staff records (pro users)
-- ============================================================
create table if not exists public.staff (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  email text default '',
  color text default '#0070f3',
  home_postcode text default '',
  office_postcode text default '',
  date_of_birth text default '',
  gender text default '',
  skills jsonb default '[]'::jsonb,
  colour text default '#0070f3',
  local_id text default '',
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "Users can view own staff"
  on public.staff for select
  using (auth.uid() = user_id);

create policy "Users can insert own staff"
  on public.staff for insert
  with check (auth.uid() = user_id);

create policy "Users can update own staff"
  on public.staff for update
  using (auth.uid() = user_id);

create policy "Users can delete own staff"
  on public.staff for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 4. BUSINESS SETTINGS — Global settings (single row, id=1)
-- ============================================================
create table if not exists public.business_settings (
  id bigint primary key default 1,
  business_name text default '',
  support_email text default '',
  phone_number text default '',
  enable_notifications boolean default false,
  office_postcode text default '',
  day_start text default '06:00',
  day_end text default '22:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_single_row check (id = 1)
);

insert into public.business_settings (id, office_postcode, day_start, day_end)
values (1, '', '06:00', '22:00')
on conflict (id) do nothing;

-- ============================================================
-- 5. APPOINTMENTS
-- ============================================================
create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  address text default '',
  postcode text default '',
  lat numeric,
  lng numeric,
  strict_start_time text,
  duration_minutes int default 30,
  required_staff int default 1,
  visits_required int default 1,
  min_gap_minutes int default 120,
  notes text default '',
  staff_gender text,
  required_skills jsonb default '[]'::jsonb,
  required_windows jsonb default '[]'::jsonb,
  colour text default '#d00000',
  archived boolean default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. ROUTES
-- ============================================================
create table if not exists public.routes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  staff_id text,
  date text,
  start_lat numeric,
  start_lon numeric,
  end_lat numeric,
  end_lon numeric,
  stops jsonb default '[]'::jsonb,
  points jsonb default '[]'::jsonb,
  distance numeric default 0,
  route_data jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. SITE HEADER — Logo, banner, nav config
-- ============================================================
create table if not exists public.site_header (
  id bigint primary key default 1,
  logo_url text,
  banner_url text,
  logo_x numeric default 0,
  logo_y numeric default 0,
  logo_scale numeric default 1,
  logo_rotation numeric default 0,
  banner_offset_x numeric default 0,
  banner_offset_y numeric default 0,
  banner_scale numeric default 1,
  banner_rotation numeric default 0,
  layout jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. ADMIN LOGS (admin_logs table referenced by admin page)
-- ============================================================
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  action text not null,
  details jsonb,
  actor_id uuid,
  target_user_id uuid,
  actor_email text,
  actor_is_admin boolean,
  target_email text,
  target_is_pro boolean,
  target_plan text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. ACTIVITY LOGS (activity_logs table referenced by logs.ts)
-- ============================================================
create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  target_user_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 10. ADMIN ACTIVITY LOGS (admin_activity_logs referenced by admin/logs page)
-- Could be a view that combines activity_logs + user info
-- For now create as a table with the same columns as admin_logs
create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  action text not null,
  details jsonb,
  actor_id uuid,
  target_user_id uuid,
  actor_email text,
  actor_is_admin boolean,
  target_email text,
  target_is_pro boolean,
  target_plan text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 11. ADMIN USER LIST (admin_user_list referenced by admin/users page)
-- Create as a view that joins auth.users + profiles
-- ============================================================
create or replace view public.admin_user_list as
select
  p.user_id,
  p.email,
  p.full_name,
  p.is_pro,
  p.created_at,
  p.is_admin,
  p.plan,
  p.subscription_renewal
from public.profiles p
order by p.created_at desc;

-- ============================================================
-- 12. PRICING — Pricing plans
-- ============================================================
create table if not exists public.pricing (
  id bigint generated always as identity primary key,
  plan text not null default '',
  price numeric not null default 0,
  description text default '',
  features jsonb default '[]'::jsonb,
  stripe_price_id text default '',
  created_at timestamptz not null default now()
);

-- Insert default plans
insert into public.pricing (plan, price, description, features) values
  ('free', 0, 'For individuals getting started', '["Up to 2 staff members","Browser-based storage","Basic scheduling"]'),
  ('pro', 19, 'For growing teams', '["Unlimited staff","Supabase cloud storage","ORS route optimization","Map visualization","Staff route reassignment"]')
on conflict do nothing;

-- ============================================================
-- DONE
-- ============================================================
select '✅ GeoRoute setup complete! All 12 tables/views created.' as status;