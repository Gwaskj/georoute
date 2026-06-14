-- ============================================================
-- GeoRoute CMS: page_content table
-- Run this once in the Supabase SQL Editor.
-- Requires is_admin() from setup.sql / patch_rls_and_schema.sql.
-- ============================================================

create table if not exists public.page_content (
  page_id    text primary key,
  blocks     jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.page_content enable row level security;

create policy "Anyone can read page content"
  on public.page_content for select using (true);

create policy "Admins can manage page content"
  on public.page_content for all
  using  (public.is_admin())
  with check (public.is_admin());

-- ─── Seed: Home page ────────────────────────────────────────
insert into public.page_content (page_id, blocks) values ('home', $json$[
  {
    "id": "hero",
    "type": "hero",
    "visible": true,
    "data": {
      "badge": "Route Planning Platform",
      "title": "Smarter Route Planning",
      "titleAccent": "For High‑Performing Teams",
      "subtitle": "Plan schedules, assign staff, and generate optimised routes — all in one beautifully simple dashboard designed for speed and clarity.",
      "primaryCtaText": "Get Started Free",
      "primaryCtaUrl": "/scheduler",
      "secondaryCtaText": "View Pricing",
      "secondaryCtaUrl": "/pricing"
    }
  },
  {
    "id": "features",
    "type": "features",
    "visible": true,
    "data": {
      "title": "Powerful Tools, Beautifully Designed",
      "subtitle": "Everything your team needs to plan, schedule, and execute routes efficiently.",
      "items": [
        { "id": "f1", "title": "Drag-and-Drop Scheduling", "description": "Build and adjust your team's day in seconds with a clean, intuitive timeline.", "gradient": "teal" },
        { "id": "f2", "title": "Optimised Route Planning", "description": "Generate the fastest route instantly — saving time, fuel, and stress.", "gradient": "indigo" },
        { "id": "f3", "title": "Team-Ready Dashboard", "description": "See every appointment, location, and route at a glance.", "gradient": "purple" },
        { "id": "f4", "title": "Real-Time Updates", "description": "Make changes on the fly and instantly update your team.", "gradient": "emerald" }
      ]
    }
  },
  {
    "id": "map_preview",
    "type": "map_preview",
    "visible": true,
    "data": {
      "title": "See Your Day at a Glance",
      "subtitle": "A clean visual overview of your team's routes — pins, paths, and all.",
      "imageUrl": "/fake-map.png",
      "imageAlt": "Route map preview"
    }
  },
  {
    "id": "cta",
    "type": "cta",
    "visible": true,
    "data": {
      "title": "Start Planning Smarter Today",
      "subtitle": "Join teams who save hours every week with automated scheduling and optimised routing.",
      "primaryBtnText": "Get Started Free",
      "primaryBtnUrl": "/scheduler",
      "secondaryBtnText": "View Pricing",
      "secondaryBtnUrl": "/pricing"
    }
  }
]$json$::jsonb)
on conflict (page_id) do nothing;

-- ─── Seed: Pricing page header ───────────────────────────────
insert into public.page_content (page_id, blocks) values ('pricing', $json$[
  {
    "id": "header",
    "type": "pricing_header",
    "visible": true,
    "data": {
      "title": "Simple pricing for growing teams",
      "subtitle": "Start free, then upgrade when you're ready to scale."
    }
  }
]$json$::jsonb)
on conflict (page_id) do nothing;

select 'page_content table ready' as status;
