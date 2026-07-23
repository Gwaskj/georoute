"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import {
  SiteTheme,
  ThemeConfig,
  DEFAULT_CONFIG,
  FONT_OPTIONS,
  Effect,
  LogoDoodle,
  BorderRadius,
  isSeasonallyActive,
  resolveActiveTheme,
} from "@/lib/theme-types";
import SeasonalDoodle from "@/components/effects/SeasonalDoodle";

// ─── Constants ──────────────────────────────────────────────────────────────

const EFFECTS: { value: Effect; label: string; icon: string }[] = [
  { value: "none", label: "None", icon: "○" },
  { value: "snow", label: "Snow", icon: "❄" },
  { value: "rain", label: "Rain", icon: "🌧" },
  { value: "confetti", label: "Confetti", icon: "🎊" },
  { value: "fireflies", label: "Fireflies", icon: "✨" },
  { value: "stars", label: "Stars", icon: "⭐" },
  { value: "hearts", label: "Hearts", icon: "♥" },
  { value: "leaves", label: "Leaves", icon: "🍃" },
];

const DOODLES: { value: LogoDoodle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "santa-hat", label: "Santa Hat" },
  { value: "party-hat", label: "Party Hat" },
  { value: "halo", label: "Halo" },
  { value: "hearts", label: "Hearts" },
  { value: "shamrock", label: "Shamrock" },
  { value: "fireworks", label: "Fireworks" },
  { value: "top-hat", label: "Top Hat" },
  { value: "flowers", label: "Flowers" },
  { value: "spider-web", label: "Spider Web" },
];

const RADIUS_OPTIONS: { value: BorderRadius; label: string }[] = [
  { value: "none", label: "Square" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Pill" },
];

type Tab = "colors" | "typography" | "effects" | "doodle" | "schedule";

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminThemesPage() {
  const isAdmin = useIsAdmin();
  const [themes, setThemes] = useState<SiteTheme[]>([]);
  const [selected, setSelected] = useState<SiteTheme | null>(null);
  const [draft, setDraft] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [draftName, setDraftName] = useState("");
  const [draftSeasonalStart, setDraftSeasonalStart] = useState("");
  const [draftSeasonalEnd, setDraftSeasonalEnd] = useState("");
  const [draftPriority, setDraftPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("site_themes")
      .select("*")
      .order("priority", { ascending: false });
    if (data) setThemes(data as SiteTheme[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function selectTheme(t: SiteTheme) {
    setSelected(t);
    setDraft({ ...DEFAULT_CONFIG, ...t.config });
    setDraftName(t.name);
    setDraftSeasonalStart(t.seasonal_start ?? "");
    setDraftSeasonalEnd(t.seasonal_end ?? "");
    setDraftPriority(t.priority);
  }

  function newTheme() {
    setSelected(null);
    setDraft({ ...DEFAULT_CONFIG });
    setDraftName("New Theme");
    setDraftSeasonalStart("");
    setDraftSeasonalEnd("");
    setDraftPriority(0);
  }

  const patchDraft = useCallback(<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");

    const payload = {
      name: draftName.trim() || "Untitled",
      config: draft,
      seasonal_start: draftSeasonalStart || null,
      seasonal_end: draftSeasonalEnd || null,
      priority: draftPriority,
    };

    let error;
    if (selected) {
      ({ error } = await supabase.from("site_themes").update(payload).eq("id", selected.id));
    } else {
      ({ error } = await supabase.from("site_themes").insert({ ...payload, is_active: false }));
    }

    setSaving(false);
    if (error) { setStatus("❌ " + error.message); return; }
    setStatus("✅ Saved");
    await load();
    setTimeout(() => setStatus(""), 3000);
  }

  async function activate(id: string) {
    // Deactivate all, then activate this one
    await supabase.from("site_themes").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("site_themes").update({ is_active: true }).eq("id", id);
    await load();
    setStatus("✅ Theme activated");
    setTimeout(() => setStatus(""), 3000);
  }

  async function deleteTheme(id: string) {
    if (!confirm("Delete this theme?")) return;
    await supabase.from("site_themes").delete().eq("id", id);
    setSelected(null);
    setDraft(DEFAULT_CONFIG);
    await load();
  }

  const currentlyActive = useMemo(() => resolveActiveTheme(themes), [themes]);

  if (isAdmin === null) return <div className="p-10 text-slate-400">Checking permissions…</div>;
  if (!isAdmin) return <div className="p-10 text-red-500">Access denied.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Theme Builder</h1>
          <p className="text-xs text-slate-400">
            Create themes, seasonal effects, and logo doodles.
            {currentlyActive && (
              <span className="ml-2 text-emerald-400">
                Active: <strong>{currentlyActive.name}</strong>
                {isSeasonallyActive(currentlyActive.seasonal_start, currentlyActive.seasonal_end) && " (seasonal)"}
              </span>
            )}
          </p>
        </div>
        {status && <span className="text-sm">{status}</span>}
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* ── LEFT SIDEBAR: theme list ── */}
        <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-800">
            <button
              onClick={newTheme}
              className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + New Theme
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {themes.map((t) => {
              const isSeasonal = isSeasonallyActive(t.seasonal_start, t.seasonal_end);
              const isAct = currentlyActive?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTheme(t)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-800 text-sm hover:bg-slate-800 transition-colors ${selected?.id === t.id ? "bg-slate-700" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: (t.config as ThemeConfig).colorPrimary ?? "#4f46e5" }}
                    />
                    <span className="truncate flex-1 font-medium">{t.name}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {isAct && (
                      <span className="text-[10px] bg-emerald-900 text-emerald-300 px-1.5 rounded">
                        Active
                      </span>
                    )}
                    {t.seasonal_start && (
                      <span className={`text-[10px] px-1.5 rounded ${isSeasonal ? "bg-amber-900 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                        {isSeasonal ? "🔄 Now" : "📅 Scheduled"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── CENTRE: editor ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl">
            {/* Theme name + actions */}
            <div className="flex items-center gap-3 mb-6">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-base font-semibold text-slate-100"
                placeholder="Theme name"
              />
              <button
                onClick={save}
                disabled={saving}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {selected && (
                <>
                  <button
                    onClick={() => activate(selected.id)}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => deleteTheme(selected.id)}
                    className="rounded border border-red-700 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 rounded-lg bg-slate-800 p-1">
              {(["colors", "typography", "effects", "doodle", "schedule"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${activeTab === tab ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "colors" && (
              <ColorTab draft={draft} patch={patchDraft} />
            )}
            {activeTab === "typography" && (
              <TypographyTab draft={draft} patch={patchDraft} />
            )}
            {activeTab === "effects" && (
              <EffectsTab draft={draft} patch={patchDraft} />
            )}
            {activeTab === "doodle" && (
              <DoodleTab draft={draft} patch={patchDraft} />
            )}
            {activeTab === "schedule" && (
              <ScheduleTab
                seasonalStart={draftSeasonalStart}
                seasonalEnd={draftSeasonalEnd}
                priority={draftPriority}
                onStart={setDraftSeasonalStart}
                onEnd={setDraftSeasonalEnd}
                onPriority={setDraftPriority}
              />
            )}
          </div>
        </main>

        {/* ── RIGHT: preview ── */}
        <aside className="w-72 flex-shrink-0 border-l border-slate-800 bg-slate-900 p-4 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Live Preview
          </p>
          <ThemePreview config={draft} draftName={draftName} />
        </aside>
      </div>
    </div>
  );
}

// ─── Color Tab ───────────────────────────────────────────────────────────────

function ColorTab({
  draft,
  patch,
}: {
  draft: ThemeConfig;
  patch: <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => void;
}) {
  const colors: { key: keyof ThemeConfig; label: string }[] = [
    { key: "colorPrimary", label: "Primary" },
    { key: "colorSecondary", label: "Secondary" },
    { key: "colorAccent", label: "Accent" },
    { key: "colorBackground", label: "Background" },
    { key: "colorBackgroundMuted", label: "Background (muted)" },
    { key: "colorCard", label: "Card" },
    { key: "colorTextPrimary", label: "Text (primary)" },
    { key: "colorTextSecondary", label: "Text (secondary)" },
    { key: "colorBorder", label: "Border" },
  ];

  return (
    <div className="space-y-4">
      {colors.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <label className="text-sm text-slate-300 flex-1">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draft[key] as string}
              onChange={(e) => patch(key, e.target.value)}
              className="w-10 h-10 rounded border border-slate-700 cursor-pointer bg-transparent p-0.5"
            />
            <input
              type="text"
              value={draft[key] as string}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patch(key, v);
              }}
              className="w-24 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-mono text-slate-200"
            />
          </div>
        </div>
      ))}

      <hr className="border-slate-800" />
      <div>
        <label className="text-sm text-slate-300 block mb-2">Border Radius</label>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => patch("borderRadius", opt.value)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${draft.borderRadius === opt.value ? "border-indigo-500 bg-indigo-900 text-indigo-200" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick palettes */}
      <hr className="border-slate-800" />
      <div>
        <label className="text-sm text-slate-300 block mb-2">Quick Palettes</label>
        <div className="flex gap-2 flex-wrap">
          {QUICK_PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                Object.entries(p.colors).forEach(([k, v]) =>
                  patch(k as keyof ThemeConfig, v as string)
                );
              }}
              className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUICK_PALETTES = [
  {
    name: "Ocean",
    colors: {
      colorPrimary: "#0ea5e9",
      colorSecondary: "#06b6d4",
      colorAccent: "#0284c7",
      colorBackground: "#071e2e",
      colorBackgroundMuted: "#0c2a40",
      colorCard: "#0c2a40",
      colorTextPrimary: "#e0f2fe",
      colorTextSecondary: "#7dd3fc",
      colorBorder: "#164e63",
    },
  },
  {
    name: "Sunset",
    colors: {
      colorPrimary: "#f97316",
      colorSecondary: "#ef4444",
      colorAccent: "#fbbf24",
      colorBackground: "#1c0a00",
      colorBackgroundMuted: "#2d1000",
      colorCard: "#2d1000",
      colorTextPrimary: "#fff7ed",
      colorTextSecondary: "#fed7aa",
      colorBorder: "#7c2d12",
    },
  },
  {
    name: "Midnight",
    colors: {
      colorPrimary: "#8b5cf6",
      colorSecondary: "#6d28d9",
      colorAccent: "#a78bfa",
      colorBackground: "#09090f",
      colorBackgroundMuted: "#12121e",
      colorCard: "#12121e",
      colorTextPrimary: "#f5f3ff",
      colorTextSecondary: "#c4b5fd",
      colorBorder: "#3730a3",
    },
  },
  {
    name: "Forest",
    colors: {
      colorPrimary: "#22c55e",
      colorSecondary: "#16a34a",
      colorAccent: "#84cc16",
      colorBackground: "#071a0f",
      colorBackgroundMuted: "#0d2618",
      colorCard: "#0d2618",
      colorTextPrimary: "#f0fdf4",
      colorTextSecondary: "#86efac",
      colorBorder: "#15803d",
    },
  },
  {
    name: "Rose",
    colors: {
      colorPrimary: "#f43f5e",
      colorSecondary: "#e11d48",
      colorAccent: "#fb7185",
      colorBackground: "#1a060c",
      colorBackgroundMuted: "#250a12",
      colorCard: "#250a12",
      colorTextPrimary: "#fff1f2",
      colorTextSecondary: "#fda4af",
      colorBorder: "#9f1239",
    },
  },
];

// ─── Typography Tab ──────────────────────────────────────────────────────────

function TypographyTab({
  draft,
  patch,
}: {
  draft: ThemeConfig;
  patch: <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {(["fontHeading", "fontBody"] as const).map((key) => (
        <div key={key}>
          <label className="block text-sm text-slate-300 mb-2">
            {key === "fontHeading" ? "Heading Font" : "Body Font"}
          </label>
          <div className="space-y-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => patch(key, f.value)}
                className={`w-full text-left rounded border px-3 py-2.5 transition-colors ${draft[key] === f.value ? "border-indigo-500 bg-indigo-900/30 text-indigo-200" : "border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800"}`}
              >
                <span style={{ fontFamily: f.value }} className="text-base">
                  {f.label}
                </span>
                <span className="block text-xs text-slate-500" style={{ fontFamily: f.value }}>
                  The quick brown fox — 0123456789
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Effects Tab ─────────────────────────────────────────────────────────────

function EffectsTab({
  draft,
  patch,
}: {
  draft: ThemeConfig;
  patch: <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-slate-300 mb-3">Particle Effect</label>
        <div className="grid grid-cols-2 gap-2">
          {EFFECTS.map((e) => (
            <button
              key={e.value}
              onClick={() => patch("effect", e.value)}
              className={`rounded border px-3 py-2.5 text-sm text-left flex items-center gap-2 transition-colors ${draft.effect === e.value ? "border-indigo-500 bg-indigo-900/30 text-indigo-200" : "border-slate-700 text-slate-300 hover:border-slate-600"}`}
            >
              <span className="text-xl w-7 text-center">{e.icon}</span>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {draft.effect !== "none" && (
        <>
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Intensity: {draft.effectIntensity}%
            </label>
            <input
              type="range"
              min={5}
              max={100}
              value={draft.effectIntensity}
              onChange={(e) => patch("effectIntensity", parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Subtle</span>
              <span>Heavy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Particle Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.effectColor}
                onChange={(e) => patch("effectColor", e.target.value)}
                className="w-12 h-12 rounded border border-slate-700 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={draft.effectColor}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                    patch("effectColor", e.target.value);
                }}
                className="w-28 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm font-mono text-slate-200"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Doodle Tab ──────────────────────────────────────────────────────────────

function DoodleTab({
  draft,
  patch,
}: {
  draft: ThemeConfig;
  patch: <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">
        Choose a decoration that appears above the logo — inspired by Google Doodles.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {DOODLES.map((d) => (
          <button
            key={d.value}
            onClick={() => patch("logoDoodle", d.value)}
            className={`rounded border px-3 py-3 text-sm flex items-center gap-3 transition-colors ${draft.logoDoodle === d.value ? "border-indigo-500 bg-indigo-900/30 text-indigo-200" : "border-slate-700 text-slate-300 hover:border-slate-600"}`}
          >
            <div className="w-10 h-8 flex-shrink-0 flex items-center justify-center">
              {d.value !== "none" ? (
                <SeasonalDoodle doodle={d.value} color={draft.logoDoodleColor} />
              ) : (
                <span className="text-slate-500 text-lg">○</span>
              )}
            </div>
            {d.label}
          </button>
        ))}
      </div>

      {draft.logoDoodle !== "none" && (
        <div>
          <label className="block text-sm text-slate-300 mb-2">Doodle Colour</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={draft.logoDoodleColor}
              onChange={(e) => patch("logoDoodleColor", e.target.value)}
              className="w-12 h-12 rounded border border-slate-700 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={draft.logoDoodleColor}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                  patch("logoDoodleColor", e.target.value);
              }}
              className="w-28 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm font-mono text-slate-200"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="rounded border border-slate-700 bg-slate-800 p-6 flex items-center justify-center">
        <LogoPreview
          brandText="GeoRoutes"
          doodle={draft.logoDoodle}
          doodleColor={draft.logoDoodleColor}
          primaryColor={draft.colorPrimary}
        />
      </div>
    </div>
  );
}

// ─── Schedule Tab ────────────────────────────────────────────────────────────

function ScheduleTab({
  seasonalStart,
  seasonalEnd,
  priority,
  onStart,
  onEnd,
  onPriority,
}: {
  seasonalStart: string;
  seasonalEnd: string;
  priority: number;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onPriority: (v: number) => void;
}) {
  const isActive = isSeasonallyActive(seasonalStart, seasonalEnd);

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">
        Seasonal themes auto-activate within the date range (year-agnostic: they use month & day only,
        so they repeat every year). If multiple seasonal themes overlap, the highest priority wins.
      </p>

      <div className="rounded border border-slate-700 bg-slate-800/50 p-4 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-600"}`} />
        <span className="text-sm text-slate-300">
          {isActive ? "This theme would be active today" : "Not currently in its seasonal window"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Season starts (any year)</label>
          <input
            type="date"
            value={seasonalStart}
            onChange={(e) => onStart(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Season ends (any year)</label>
          <input
            type="date"
            value={seasonalEnd}
            onChange={(e) => onEnd(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Priority: {priority} (higher = overrides lower)
        </label>
        <input
          type="range"
          min={0}
          max={20}
          value={priority}
          onChange={(e) => onPriority(parseInt(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0 — low</span>
          <span>20 — high</span>
        </div>
      </div>

      {(!seasonalStart || !seasonalEnd) && (
        <div className="rounded border border-slate-700 bg-slate-800/30 p-3 text-xs text-slate-400">
          💡 Leave the dates empty if you want this to be a manually-activated theme (not auto-seasonal).
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-slate-300 mb-3">Built-in seasonal suggestions</p>
        <div className="space-y-2">
          {SEASONAL_PRESETS.map((s) => (
            <button
              key={s.name}
              onClick={() => {
                onStart(s.start);
                onEnd(s.end);
                onPriority(10);
              }}
              className="w-full text-left rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 flex justify-between"
            >
              <span>{s.icon} {s.name}</span>
              <span className="text-slate-500 text-xs">{s.start.slice(5)} → {s.end.slice(5)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const SEASONAL_PRESETS = [
  { name: "Christmas", icon: "🎄", start: "2024-12-01", end: "2024-12-31" },
  { name: "Halloween", icon: "🎃", start: "2024-10-15", end: "2024-10-31" },
  { name: "Valentine's Day", icon: "💝", start: "2024-02-10", end: "2024-02-18" },
  { name: "New Year", icon: "🎆", start: "2024-12-31", end: "2025-01-03" },
  { name: "St. Patrick's Day", icon: "☘️", start: "2024-03-14", end: "2024-03-17" },
  { name: "Easter / Spring", icon: "🌸", start: "2024-03-15", end: "2024-05-31" },
  { name: "Bonfire Night", icon: "🔥", start: "2024-11-04", end: "2024-11-06" },
  { name: "Summer", icon: "☀️", start: "2024-06-01", end: "2024-09-15" },
];

// ─── Live Preview ─────────────────────────────────────────────────────────────

function ThemePreview({ config, draftName }: { config: ThemeConfig; draftName: string }) {
  return (
    <div
      className="rounded-lg overflow-hidden text-[11px] border"
      style={{
        background: config.colorBackground,
        borderColor: config.colorBorder,
        color: config.colorTextPrimary,
        fontFamily: config.fontBody,
        fontSize: "11px",
      }}
    >
      {/* Mini header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: config.colorBorder, background: config.colorBackgroundMuted }}
      >
        <div className="flex items-center gap-1.5">
          <LogoPreview
            brandText="GeoRoutes"
            doodle={config.logoDoodle}
            doodleColor={config.logoDoodleColor}
            primaryColor={config.colorPrimary}
            small
          />
        </div>
        <div className="flex gap-1.5">
          {["Home", "Scheduler", "Pricing"].map((n) => (
            <span key={n} style={{ color: config.colorTextSecondary }} className="cursor-default">
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Mini hero */}
      <div className="px-3 py-4 text-center">
        <h2
          className="font-bold text-base mb-1"
          style={{ fontFamily: config.fontHeading, color: config.colorTextPrimary }}
        >
          {draftName || "My Theme"}
        </h2>
        <p style={{ color: config.colorTextSecondary }}>Smarter Route Planning</p>
        <button
          className="mt-2 px-3 py-1 text-white text-[10px] font-medium"
          style={{
            background: config.colorPrimary,
            borderRadius: ({ none: "0", sm: "3px", md: "5px", lg: "8px", xl: "12px" })[config.borderRadius] ?? "5px",
          }}
        >
          Get Started
        </button>
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {["Route Planner", "Smart Scheduling"].map((title) => (
          <div
            key={title}
            className="p-2"
            style={{
              background: config.colorCard,
              border: `1px solid ${config.colorBorder}`,
              borderRadius: ({ none: "0", sm: "3px", md: "5px", lg: "8px", xl: "12px" })[config.borderRadius] ?? "5px",
            }}
          >
            <div className="font-medium" style={{ color: config.colorTextPrimary }}>{title}</div>
            <div style={{ color: config.colorTextSecondary }}>Optimise your team's day</div>
          </div>
        ))}
      </div>

      {/* Mini CTA */}
      <div
        className="px-3 py-3 text-center text-white"
        style={{ background: config.colorPrimary }}
      >
        <span className="font-semibold text-[10px]">Start Free Today →</span>
      </div>

      {/* Effect indicator */}
      {config.effect !== "none" && (
        <div
          className="px-3 py-1.5 text-center text-[10px] border-t"
          style={{ borderColor: config.colorBorder, color: config.colorTextSecondary }}
        >
          ✨ {config.effect} effect active
        </div>
      )}
    </div>
  );
}

// ─── Logo with Doodle ─────────────────────────────────────────────────────────

function LogoPreview({
  brandText,
  doodle,
  doodleColor,
  primaryColor,
  small = false,
}: {
  brandText: string;
  doodle: LogoDoodle;
  doodleColor: string;
  primaryColor: string;
  small?: boolean;
}) {
  return (
    <span className="relative inline-flex items-end">
      {doodle !== "none" && (
        <span
          className="absolute pointer-events-none"
          style={{
            top: small ? "-18px" : "-24px",
            left: small ? "-4px" : "-6px",
            transform: small ? "scale(0.55)" : "scale(0.85)",
            transformOrigin: "bottom left",
          }}
        >
          <SeasonalDoodle doodle={doodle} color={doodleColor} />
        </span>
      )}
      <span
        className={`font-bold tracking-tight ${small ? "text-sm" : "text-2xl"}`}
        style={{ color: primaryColor }}
      >
        {brandText}
      </span>
    </span>
  );
}
