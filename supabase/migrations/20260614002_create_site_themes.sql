-- Site themes table
create table if not exists site_themes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  is_active     boolean not null default false,
  config        jsonb not null default '{}',
  seasonal_start date,
  seasonal_end   date,
  priority      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists site_themes_active_idx on site_themes(is_active);
create index if not exists site_themes_seasonal_idx on site_themes(seasonal_start, seasonal_end);

alter table site_themes enable row level security;

-- Anyone can read themes (needed for public site styling)
create policy "Public can read themes"
  on site_themes for select using (true);

-- Only admins can write
create policy "Admins manage themes"
  on site_themes for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

-- Seed the built-in themes
insert into site_themes (name, is_active, priority, seasonal_start, seasonal_end, config) values

('Default', true, 0, null, null, '{
  "colorPrimary": "#4f46e5",
  "colorSecondary": "#06b6d4",
  "colorAccent": "#f97316",
  "colorBackground": "#0f172a",
  "colorBackgroundMuted": "#1e293b",
  "colorCard": "#1e293b",
  "colorTextPrimary": "#f1f5f9",
  "colorTextSecondary": "#94a3b8",
  "colorBorder": "#334155",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "md",
  "effect": "none",
  "effectIntensity": 50,
  "effectColor": "#ffffff",
  "logoDoodle": "none",
  "logoDoodleColor": "#ff0000"
}'),

('Light', false, 0, null, null, '{
  "colorPrimary": "#4f46e5",
  "colorSecondary": "#0891b2",
  "colorAccent": "#ea580c",
  "colorBackground": "#ffffff",
  "colorBackgroundMuted": "#f8fafc",
  "colorCard": "#ffffff",
  "colorTextPrimary": "#0f172a",
  "colorTextSecondary": "#475569",
  "colorBorder": "#e2e8f0",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "md",
  "effect": "none",
  "effectIntensity": 50,
  "effectColor": "#4f46e5",
  "logoDoodle": "none",
  "logoDoodleColor": "#4f46e5"
}'),

('Christmas', false, 10, '2024-12-01', '2024-12-31', '{
  "colorPrimary": "#dc2626",
  "colorSecondary": "#16a34a",
  "colorAccent": "#fbbf24",
  "colorBackground": "#0c1a0e",
  "colorBackgroundMuted": "#14261a",
  "colorCard": "#14261a",
  "colorTextPrimary": "#f0fdf4",
  "colorTextSecondary": "#86efac",
  "colorBorder": "#166534",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "md",
  "effect": "snow",
  "effectIntensity": 60,
  "effectColor": "#ffffff",
  "logoDoodle": "santa-hat",
  "logoDoodleColor": "#dc2626"
}'),

('Halloween', false, 10, '2024-10-15', '2024-10-31', '{
  "colorPrimary": "#ea580c",
  "colorSecondary": "#7c3aed",
  "colorAccent": "#fbbf24",
  "colorBackground": "#0c0a0e",
  "colorBackgroundMuted": "#1a0f1e",
  "colorCard": "#1a0f1e",
  "colorTextPrimary": "#fef3c7",
  "colorTextSecondary": "#c4b5fd",
  "colorBorder": "#4c1d95",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "md",
  "effect": "fireflies",
  "effectIntensity": 40,
  "effectColor": "#ea580c",
  "logoDoodle": "spider-web",
  "logoDoodleColor": "#7c3aed"
}'),

('Valentine''s Day', false, 10, '2024-02-10', '2024-02-18', '{
  "colorPrimary": "#e11d48",
  "colorSecondary": "#db2777",
  "colorAccent": "#f43f5e",
  "colorBackground": "#1a0a0f",
  "colorBackgroundMuted": "#1f0f15",
  "colorCard": "#1f0f15",
  "colorTextPrimary": "#fdf2f8",
  "colorTextSecondary": "#fbcfe8",
  "colorBorder": "#9d174d",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "lg",
  "effect": "hearts",
  "effectIntensity": 40,
  "effectColor": "#f43f5e",
  "logoDoodle": "hearts",
  "logoDoodleColor": "#f43f5e"
}'),

('New Year', false, 10, '2024-12-31', '2025-01-03', '{
  "colorPrimary": "#ca8a04",
  "colorSecondary": "#854d0e",
  "colorAccent": "#fbbf24",
  "colorBackground": "#0a0a14",
  "colorBackgroundMuted": "#111127",
  "colorCard": "#111127",
  "colorTextPrimary": "#fef9c3",
  "colorTextSecondary": "#fde68a",
  "colorBorder": "#713f12",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "md",
  "effect": "confetti",
  "effectIntensity": 70,
  "effectColor": "#fbbf24",
  "logoDoodle": "party-hat",
  "logoDoodleColor": "#ca8a04"
}'),

('Spring', false, 5, '2024-03-15', '2024-05-31', '{
  "colorPrimary": "#16a34a",
  "colorSecondary": "#0891b2",
  "colorAccent": "#f472b6",
  "colorBackground": "#0c1a10",
  "colorBackgroundMuted": "#14261a",
  "colorCard": "#14261a",
  "colorTextPrimary": "#f0fdf4",
  "colorTextSecondary": "#bbf7d0",
  "colorBorder": "#15803d",
  "fontHeading": "system-ui",
  "fontBody": "system-ui",
  "borderRadius": "lg",
  "effect": "leaves",
  "effectIntensity": 30,
  "effectColor": "#4ade80",
  "logoDoodle": "flowers",
  "logoDoodleColor": "#f472b6"
}');
