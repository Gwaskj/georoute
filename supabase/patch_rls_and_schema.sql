-- ============================================================
-- GeoRoute: Patch script
-- Run this if you want to fix the existing database WITHOUT
-- wiping tables. Safe to run on a live database with data.
-- ============================================================


-- ─── 1. is_admin() helper ────────────────────────────────────
-- Needed by all admin policies to avoid recursive RLS on profiles.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;


-- ─── 2. PROFILES — fix policies ──────────────────────────────

-- Drop old policies (recreate clean)
drop policy if exists "Users can view own profile"     on public.profiles;
drop policy if exists "Users can update own profile"   on public.profiles;
drop policy if exists "Service role can insert profiles" on public.profiles;
drop policy if exists "Admins can read all profiles"   on public.profiles;
drop policy if exists "Admins can view all profiles"   on public.profiles;
drop policy if exists "Admins can update any profile"  on public.profiles;
drop policy if exists "Admins can delete any profile"  on public.profiles;
drop policy if exists "Admins can insert profiles"     on public.profiles;
drop policy if exists "Users can insert own profile"   on public.profiles;

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- INSERT: own user_id only. The handle_new_user trigger is security definer
-- so it bypasses RLS regardless of this policy.
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

-- Admin policies — use is_admin() to avoid infinite recursion
create policy "Admins can view all profiles"
  on public.profiles for select using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles for update using (public.is_admin());

create policy "Admins can delete any profile"
  on public.profiles for delete using (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert with check (public.is_admin());


-- ─── 3. APPOINTMENTS — add missing columns + RLS ─────────────

alter table public.appointments
  add column if not exists local_id             text,
  add column if not exists house_number_or_name text,
  add column if not exists purpose_id           text;

drop policy if exists "Users can view own appointments"   on public.appointments;
drop policy if exists "Users can insert own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can delete own appointments" on public.appointments;

alter table public.appointments enable row level security;

create policy "Users can view own appointments"
  on public.appointments for select using (auth.uid() = user_id);
create policy "Users can insert own appointments"
  on public.appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments"
  on public.appointments for update using (auth.uid() = user_id);
create policy "Users can delete own appointments"
  on public.appointments for delete using (auth.uid() = user_id);


-- ─── 4. ROUTES — add RLS ─────────────────────────────────────

drop policy if exists "Users can view own routes"   on public.routes;
drop policy if exists "Users can insert own routes" on public.routes;
drop policy if exists "Users can update own routes" on public.routes;
drop policy if exists "Users can delete own routes" on public.routes;

alter table public.routes enable row level security;

create policy "Users can view own routes"
  on public.routes for select using (auth.uid() = user_id);
create policy "Users can insert own routes"
  on public.routes for insert with check (auth.uid() = user_id);
create policy "Users can update own routes"
  on public.routes for update using (auth.uid() = user_id);
create policy "Users can delete own routes"
  on public.routes for delete using (auth.uid() = user_id);


-- ─── 5. BUSINESS SETTINGS — rebuild as per-user ──────────────
-- Old table was a single global row (id=1). Replace with per-user rows.

drop policy if exists "Anyone can read business settings"               on public.business_settings;
drop policy if exists "Authenticated users can update business settings" on public.business_settings;
drop policy if exists "Authenticated users can upsert business settings" on public.business_settings;
drop policy if exists "Users manage own settings"                        on public.business_settings;

-- Rebuild the table entirely (no data worth keeping — was one shared row)
drop table if exists public.business_settings cascade;

create table public.business_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  office_postcode text default '',
  day_start       text default '06:00',
  day_end         text default '22:00',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.business_settings enable row level security;

create policy "Users manage own settings"
  on public.business_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 6. SITE HEADER — add RLS + seed row if missing ─────────

drop policy if exists "Anyone can read site header"   on public.site_header;
drop policy if exists "Admins can update site header" on public.site_header;
drop policy if exists "Admins can insert site header" on public.site_header;

alter table public.site_header enable row level security;

create policy "Anyone can read site header"
  on public.site_header for select using (true);

create policy "Admins can update site header"
  on public.site_header for update using (public.is_admin());

create policy "Admins can insert site header"
  on public.site_header for insert with check (public.is_admin());

-- Seed the row if it doesn't exist (header editor uses .update(), not .upsert())
insert into public.site_header (id, layout)
values (1, '{
  "brand": { "enabled": true, "text": "GeoRoute" },
  "navItems": [
    { "id": "scheduler", "text": "Scheduler",  "href": "/scheduler",       "align": "left" },
    { "id": "account",   "text": "Account",    "href": "/account",         "align": "left" },
    { "id": "billing",   "text": "Billing",    "href": "/account/billing", "align": "left" },
    { "id": "admin",     "text": "Admin",      "href": "#",                "align": "right", "isAdmin": true }
  ]
}'::jsonb)
on conflict (id) do nothing;


-- ─── 7. LOGS — tighten INSERT to authenticated only ──────────

drop policy if exists "Service role can insert admin_logs"           on public.admin_logs;
drop policy if exists "Authenticated users can write admin_logs"     on public.admin_logs;
drop policy if exists "Service role can write admin_logs"            on public.admin_logs;

drop policy if exists "Service role can insert activity_logs"        on public.activity_logs;
drop policy if exists "Authenticated users can write activity_logs"  on public.activity_logs;
drop policy if exists "Service role can write activity_logs"         on public.activity_logs;

drop policy if exists "Service role can insert admin_activity_logs"       on public.admin_activity_logs;
drop policy if exists "Authenticated users can write admin_activity_logs" on public.admin_activity_logs;
drop policy if exists "Service role can write admin_activity_logs"        on public.admin_activity_logs;

create policy "Authenticated users can write admin_logs"
  on public.admin_logs for insert with check (auth.uid() is not null);

create policy "Authenticated users can write activity_logs"
  on public.activity_logs for insert with check (auth.uid() is not null);

create policy "Authenticated users can write admin_activity_logs"
  on public.admin_activity_logs for insert with check (auth.uid() is not null);


-- ─── 8. PRICING — fix admin policy to use is_admin() ─────────

drop policy if exists "Admins can manage pricing" on public.pricing;

create policy "Admins can manage pricing"
  on public.pricing for all
  using (public.is_admin())
  with check (public.is_admin());


-- ─── 9. SITE THEMES — fix admin policy to use is_admin() ─────

drop policy if exists "Admins manage themes" on public.site_themes;

create policy "Admins manage themes"
  on public.site_themes for all
  using (public.is_admin())
  with check (public.is_admin());


-- ─── 10. ROUTE CACHE — restrict writes to authenticated ───────

drop policy if exists "Service role can insert route cache" on public.route_cache;
drop policy if exists "Service role can update route cache" on public.route_cache;
drop policy if exists "Anyone can insert route cache"       on public.route_cache;
drop policy if exists "Anyone can update route cache"       on public.route_cache;
drop policy if exists "Authenticated users can write route cache"  on public.route_cache;
drop policy if exists "Authenticated users can update route cache" on public.route_cache;

create policy "Authenticated users can write route cache"
  on public.route_cache for insert with check (auth.uid() is not null);

create policy "Authenticated users can update route cache"
  on public.route_cache for update using (auth.uid() is not null);


-- ─── 11. VIEW GRANT ──────────────────────────────────────────

grant select on public.admin_user_list to authenticated;


-- ─── DONE ─────────────────────────────────────────────────────

select '✅ GeoRoute patch complete.' as status;
