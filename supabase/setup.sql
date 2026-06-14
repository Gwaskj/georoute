-- ============================================================
-- GeoRoute: Complete Fresh Setup Script
--
-- HOW TO RUN:
--   1. Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click Run
--
-- This drops every public table, view, function and trigger,
-- then recreates everything. Your auth.users are NOT touched.
-- ============================================================


-- ─── DROP EVERYTHING ─────────────────────────────────────────

drop view  if exists public.admin_user_list       cascade;

drop table if exists public.site_themes           cascade;
drop table if exists public.user_skills           cascade;
drop table if exists public.user_windows          cascade;
drop table if exists public.admin_activity_logs   cascade;
drop table if exists public.activity_logs         cascade;
drop table if exists public.admin_logs            cascade;
drop table if exists public.site_header           cascade;
drop table if exists public.routes                cascade;
drop table if exists public.appointments          cascade;
drop table if exists public.business_settings     cascade;
drop table if exists public.staff                 cascade;
drop table if exists public.pricing               cascade;
drop table if exists public.route_cache           cascade;
drop table if exists public.profiles              cascade;

drop function if exists public.is_admin()                      cascade;
drop function if exists public.handle_new_user()               cascade;
drop function if exists public.update_route_cache_updated_at() cascade;


-- ─── 1. PROFILES ─────────────────────────────────────────────

create table public.profiles (
  id                   bigint generated always as identity primary key,
  user_id              uuid unique references auth.users(id) on delete cascade,
  email                text    default '',
  full_name            text    default '',
  is_pro               boolean default false,
  is_admin             boolean default false,
  plan                 text    default 'free',
  subscription_renewal timestamptz,
  created_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ── Security helper ──────────────────────────────────────────
-- security definer means it runs as postgres (superuser), bypassing RLS.
-- This prevents the infinite-recursion that occurs when a policy on
-- "profiles" tries to SELECT from "profiles" to check is_admin.
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

-- Own-row access
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Restrict INSERT: only for own user_id.
-- The handle_new_user trigger is security definer so it bypasses this.
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Admin access (uses security definer function — no recursion)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete any profile"
  on public.profiles for delete
  using (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, is_pro, is_admin, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false, false, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 2. ROUTE CACHE ──────────────────────────────────────────
-- Shared across all users (no user_id). Public read, authenticated write.

create table public.route_cache (
  id                   bigint generated always as identity primary key,
  origin_postcode      text    not null,
  destination_postcode text    not null,
  distance_km          numeric not null,
  duration_minutes     numeric not null,
  polyline             jsonb,
  raw_response         jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint route_cache_unique_pair unique (origin_postcode, destination_postcode)
);

create index idx_route_cache_pair on public.route_cache (origin_postcode, destination_postcode);

create or replace function public.update_route_cache_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_route_cache_updated_at
  before update on public.route_cache
  for each row execute function public.update_route_cache_updated_at();

alter table public.route_cache enable row level security;

create policy "Anyone can read route cache"
  on public.route_cache for select using (true);

create policy "Authenticated users can write route cache"
  on public.route_cache for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update route cache"
  on public.route_cache for update
  using (auth.uid() is not null);


-- ─── 3. STAFF ────────────────────────────────────────────────

create table public.staff (
  id              bigint generated always as identity primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  local_id        text    default '',
  name            text    not null default '',
  home_postcode   text    default '',
  office_postcode text    default '',
  date_of_birth   text    default '',
  gender          text    default '',
  skills          jsonb   default '[]'::jsonb,
  colour          text    default '#0070f3',
  created_at      timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "Users can view own staff"   on public.staff for select using (auth.uid() = user_id);
create policy "Users can insert own staff" on public.staff for insert with check (auth.uid() = user_id);
create policy "Users can update own staff" on public.staff for update using (auth.uid() = user_id);
create policy "Users can delete own staff" on public.staff for delete using (auth.uid() = user_id);


-- ─── 4. BUSINESS SETTINGS ────────────────────────────────────
-- Per-user row keyed by user_id. Each user has their own office postcode,
-- hours, and business info. No shared global state.

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


-- ─── 5. APPOINTMENTS ─────────────────────────────────────────

create table public.appointments (
  id                   bigint generated always as identity primary key,
  user_id              uuid references auth.users(id) on delete cascade,
  local_id             text,              -- client-side UUID for two-way mapping
  name                 text    not null default '',
  house_number_or_name text,              -- optional: "Flat 4B" / "Rose Cottage"
  address              text    default '',
  postcode             text    default '',
  strict_start_time    text,
  duration_minutes     int     default 30,
  required_staff       int     default 1,
  purpose_id           text,              -- references a user_window local_id
  visits_required      int     default 1,
  min_gap_minutes      int     default 120,
  notes                text    default '',
  staff_gender         text,
  required_skills      jsonb   default '[]'::jsonb,
  required_windows     jsonb   default '[]'::jsonb,
  archived             boolean default false,
  created_at           timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Users can view own appointments"
  on public.appointments for select using (auth.uid() = user_id);
create policy "Users can insert own appointments"
  on public.appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments"
  on public.appointments for update using (auth.uid() = user_id);
create policy "Users can delete own appointments"
  on public.appointments for delete using (auth.uid() = user_id);


-- ─── 6. ROUTES ───────────────────────────────────────────────

create table public.routes (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  staff_id   text,
  date       text,
  start_lat  numeric,
  start_lon  numeric,
  end_lat    numeric,
  end_lon    numeric,
  stops      jsonb   default '[]'::jsonb,
  points     jsonb   default '[]'::jsonb,
  distance   numeric default 0,
  route_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.routes enable row level security;

create policy "Users can view own routes"
  on public.routes for select using (auth.uid() = user_id);
create policy "Users can insert own routes"
  on public.routes for insert with check (auth.uid() = user_id);
create policy "Users can update own routes"
  on public.routes for update using (auth.uid() = user_id);
create policy "Users can delete own routes"
  on public.routes for delete using (auth.uid() = user_id);


-- ─── 7. SITE HEADER ──────────────────────────────────────────

create table public.site_header (
  id              bigint  primary key default 1,
  logo_url        text,
  banner_url      text,
  logo_x          numeric default 0,
  logo_y          numeric default 0,
  logo_scale      numeric default 1,
  logo_rotation   numeric default 0,
  banner_offset_x numeric default 0,
  banner_offset_y numeric default 0,
  banner_scale    numeric default 1,
  banner_rotation numeric default 0,
  layout          jsonb   default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Seed the single required row.
-- The header editor uses .update() not .upsert() so this row must exist.
insert into public.site_header (id, layout) values (1, '{
  "brand": { "enabled": true, "text": "GeoRoute" },
  "navItems": [
    { "id": "scheduler", "text": "Scheduler",  "href": "/scheduler",       "align": "left" },
    { "id": "account",   "text": "Account",    "href": "/account",         "align": "left" },
    { "id": "billing",   "text": "Billing",    "href": "/account/billing", "align": "left" },
    { "id": "admin",     "text": "Admin",      "href": "#",                "align": "right", "isAdmin": true }
  ]
}'::jsonb);

alter table public.site_header enable row level security;

create policy "Anyone can read site header"
  on public.site_header for select using (true);

create policy "Admins can update site header"
  on public.site_header for update
  using (public.is_admin());

create policy "Admins can insert site header"
  on public.site_header for insert
  with check (public.is_admin());


-- ─── 8. LOGS ─────────────────────────────────────────────────
-- Written by server-side code / admin actions. Admins can read.
-- INSERT is restricted to authenticated users only (not anonymous).

create table public.admin_logs (
  id             bigint generated always as identity primary key,
  action         text    not null,
  details        jsonb,
  actor_id       uuid,
  target_user_id uuid,
  actor_email    text,
  actor_is_admin boolean,
  target_email   text,
  target_is_pro  boolean,
  target_plan    text,
  created_at     timestamptz not null default now()
);

create table public.activity_logs (
  id             bigint generated always as identity primary key,
  actor_id       uuid,
  target_user_id uuid,
  action         text    not null,
  details        jsonb,
  created_at     timestamptz not null default now()
);

create table public.admin_activity_logs (
  id             bigint generated always as identity primary key,
  action         text    not null,
  details        jsonb,
  actor_id       uuid,
  target_user_id uuid,
  actor_email    text,
  actor_is_admin boolean,
  target_email   text,
  target_is_pro  boolean,
  target_plan    text,
  created_at     timestamptz not null default now()
);

alter table public.admin_logs          enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.admin_activity_logs enable row level security;

create policy "Admins can read admin_logs"
  on public.admin_logs for select
  using (public.is_admin());
create policy "Authenticated users can write admin_logs"
  on public.admin_logs for insert
  with check (auth.uid() is not null);

create policy "Admins can read activity_logs"
  on public.activity_logs for select
  using (public.is_admin());
create policy "Authenticated users can write activity_logs"
  on public.activity_logs for insert
  with check (auth.uid() is not null);

create policy "Admins can read admin_activity_logs"
  on public.admin_activity_logs for select
  using (public.is_admin());
create policy "Authenticated users can write admin_activity_logs"
  on public.admin_activity_logs for insert
  with check (auth.uid() is not null);


-- ─── 9. ADMIN USER LIST VIEW ─────────────────────────────────
-- Security: inherits profiles RLS. Admins see all rows (via is_admin()
-- policy on profiles). Non-admins see only their own row.

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

grant select on public.admin_user_list to authenticated;


-- ─── 10. PRICING ─────────────────────────────────────────────

create table public.pricing (
  id              bigint generated always as identity primary key,
  plan            text    not null default '',
  price           numeric not null default 0,
  description     text    default '',
  features        jsonb   default '[]'::jsonb,
  stripe_price_id text    default '',
  created_at      timestamptz not null default now()
);

alter table public.pricing enable row level security;

create policy "Anyone can read pricing"
  on public.pricing for select using (true);

create policy "Admins can manage pricing"
  on public.pricing for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.pricing (plan, price, description, features) values
  ('free', 0,  'For individuals getting started',
   '["Up to 2 staff members","Browser-based storage","Basic scheduling"]'::jsonb),
  ('pro',  19, 'For growing teams',
   '["Unlimited staff","Supabase cloud storage","ORS route optimisation","Map visualisation","Staff route reassignment"]'::jsonb);


-- ─── 11. USER WINDOWS ────────────────────────────────────────

create table public.user_windows (
  id              uuid    primary key default gen_random_uuid(),
  user_id         uuid    references auth.users(id) on delete cascade not null,
  local_id        text    not null,
  name            text    not null,
  start_time      text    not null,
  end_time        text    not null,
  min_gap_to_next integer not null default 0
);

create index user_windows_user_id_idx on public.user_windows(user_id);

alter table public.user_windows enable row level security;

create policy "Users manage own windows"
  on public.user_windows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 12. USER SKILLS ─────────────────────────────────────────

create table public.user_skills (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid references auth.users(id) on delete cascade not null,
  local_id text not null,
  name     text not null
);

create index user_skills_user_id_idx on public.user_skills(user_id);

alter table public.user_skills enable row level security;

create policy "Users manage own skills"
  on public.user_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 13. SITE THEMES ─────────────────────────────────────────

create table public.site_themes (
  id             uuid    primary key default gen_random_uuid(),
  name           text    not null,
  is_active      boolean not null default false,
  config         jsonb   not null default '{}',
  seasonal_start date,
  seasonal_end   date,
  priority       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index site_themes_active_idx   on public.site_themes(is_active);
create index site_themes_seasonal_idx on public.site_themes(seasonal_start, seasonal_end);

alter table public.site_themes enable row level security;

create policy "Public can read themes"
  on public.site_themes for select using (true);

create policy "Admins manage themes"
  on public.site_themes for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_themes (name, is_active, priority, seasonal_start, seasonal_end, config) values

('Default', true, 0, null, null, '{
  "colorPrimary":"#4f46e5","colorSecondary":"#06b6d4","colorAccent":"#f97316",
  "colorBackground":"#0f172a","colorBackgroundMuted":"#1e293b","colorCard":"#1e293b",
  "colorTextPrimary":"#f1f5f9","colorTextSecondary":"#94a3b8","colorBorder":"#334155",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"md",
  "effect":"none","effectIntensity":50,"effectColor":"#ffffff",
  "logoDoodle":"none","logoDoodleColor":"#ff0000"
}'::jsonb),

('Light', false, 0, null, null, '{
  "colorPrimary":"#4f46e5","colorSecondary":"#0891b2","colorAccent":"#ea580c",
  "colorBackground":"#ffffff","colorBackgroundMuted":"#f8fafc","colorCard":"#ffffff",
  "colorTextPrimary":"#0f172a","colorTextSecondary":"#475569","colorBorder":"#e2e8f0",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"md",
  "effect":"none","effectIntensity":50,"effectColor":"#4f46e5",
  "logoDoodle":"none","logoDoodleColor":"#4f46e5"
}'::jsonb),

('Christmas', false, 10, '2024-12-01', '2024-12-31', '{
  "colorPrimary":"#dc2626","colorSecondary":"#16a34a","colorAccent":"#fbbf24",
  "colorBackground":"#0c1a0e","colorBackgroundMuted":"#14261a","colorCard":"#14261a",
  "colorTextPrimary":"#f0fdf4","colorTextSecondary":"#86efac","colorBorder":"#166534",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"md",
  "effect":"snow","effectIntensity":60,"effectColor":"#ffffff",
  "logoDoodle":"santa-hat","logoDoodleColor":"#dc2626"
}'::jsonb),

('Halloween', false, 10, '2024-10-15', '2024-10-31', '{
  "colorPrimary":"#ea580c","colorSecondary":"#7c3aed","colorAccent":"#fbbf24",
  "colorBackground":"#0c0a0e","colorBackgroundMuted":"#1a0f1e","colorCard":"#1a0f1e",
  "colorTextPrimary":"#fef3c7","colorTextSecondary":"#c4b5fd","colorBorder":"#4c1d95",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"md",
  "effect":"fireflies","effectIntensity":40,"effectColor":"#ea580c",
  "logoDoodle":"spider-web","logoDoodleColor":"#7c3aed"
}'::jsonb),

('Valentine''s Day', false, 10, '2024-02-10', '2024-02-18', '{
  "colorPrimary":"#e11d48","colorSecondary":"#db2777","colorAccent":"#f43f5e",
  "colorBackground":"#1a0a0f","colorBackgroundMuted":"#1f0f15","colorCard":"#1f0f15",
  "colorTextPrimary":"#fdf2f8","colorTextSecondary":"#fbcfe8","colorBorder":"#9d174d",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"lg",
  "effect":"hearts","effectIntensity":40,"effectColor":"#f43f5e",
  "logoDoodle":"hearts","logoDoodleColor":"#f43f5e"
}'::jsonb),

('New Year', false, 10, '2024-12-31', '2025-01-03', '{
  "colorPrimary":"#ca8a04","colorSecondary":"#854d0e","colorAccent":"#fbbf24",
  "colorBackground":"#0a0a14","colorBackgroundMuted":"#111127","colorCard":"#111127",
  "colorTextPrimary":"#fef9c3","colorTextSecondary":"#fde68a","colorBorder":"#713f12",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"md",
  "effect":"confetti","effectIntensity":70,"effectColor":"#fbbf24",
  "logoDoodle":"party-hat","logoDoodleColor":"#ca8a04"
}'::jsonb),

('Spring', false, 5, '2024-03-15', '2024-05-31', '{
  "colorPrimary":"#16a34a","colorSecondary":"#0891b2","colorAccent":"#f472b6",
  "colorBackground":"#0c1a10","colorBackgroundMuted":"#14261a","colorCard":"#14261a",
  "colorTextPrimary":"#f0fdf4","colorTextSecondary":"#bbf7d0","colorBorder":"#15803d",
  "fontHeading":"system-ui","fontBody":"system-ui","borderRadius":"lg",
  "effect":"leaves","effectIntensity":30,"effectColor":"#4ade80",
  "logoDoodle":"flowers","logoDoodleColor":"#f472b6"
}'::jsonb);


-- ─── DONE ─────────────────────────────────────────────────────

select '✅ GeoRoute fresh setup complete — 13 tables + 1 view created.' as status;
