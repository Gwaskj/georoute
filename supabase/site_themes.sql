-- ============================================================
-- GeoRoute: site_themes table
-- Run this once in the Supabase SQL Editor.
-- Requires is_admin() from setup.sql / patch_rls_and_schema.sql.
-- ============================================================

create table if not exists public.site_themes (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  is_active      boolean not null default false,
  config         jsonb not null default '{}'::jsonb,
  seasonal_start date,
  seasonal_end   date,
  priority       integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table public.site_themes enable row level security;

create policy "Anyone can read site themes"
  on public.site_themes for select using (true);

create policy "Admins can manage site themes"
  on public.site_themes for all
  using  (public.is_admin())
  with check (public.is_admin());

-- ─── Seed: Default theme ─────────────────────────────────────
insert into public.site_themes (name, is_active, priority, config) values (
  'Default',
  true,
  0,
  '{
    "colorPrimary":          "#4f46e5",
    "colorSecondary":        "#06b6d4",
    "colorAccent":           "#f97316",
    "colorBackground":       "#0f172a",
    "colorBackgroundMuted":  "#1e293b",
    "colorCard":             "#1e293b",
    "colorTextPrimary":      "#f1f5f9",
    "colorTextSecondary":    "#94a3b8",
    "colorBorder":           "#334155",
    "fontHeading":           "system-ui",
    "fontBody":              "system-ui",
    "borderRadius":          "md",
    "effect":                "none",
    "effectIntensity":       50,
    "effectColor":           "#ffffff",
    "logoDoodle":            "none",
    "logoDoodleColor":       "#ff0000"
  }'::jsonb
);

select 'site_themes table ready' as status;
