export type Effect =
  | "none"
  | "snow"
  | "rain"
  | "confetti"
  | "fireflies"
  | "stars"
  | "hearts"
  | "leaves";

export type LogoDoodle =
  | "none"
  | "santa-hat"
  | "party-hat"
  | "halo"
  | "hearts"
  | "shamrock"
  | "fireworks"
  | "top-hat"
  | "flowers"
  | "spider-web";

export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl";

export interface ThemeConfig {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorBackgroundMuted: string;
  colorCard: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorBorder: string;

  fontHeading: string;
  fontBody: string;

  borderRadius: BorderRadius;

  effect: Effect;
  effectIntensity: number;
  effectColor: string;

  logoDoodle: LogoDoodle;
  logoDoodleColor: string;
}

export interface SiteTheme {
  id: string;
  name: string;
  is_active: boolean;
  config: ThemeConfig;
  seasonal_start: string | null;
  seasonal_end: string | null;
  priority: number;
  created_at: string;
}

export const DEFAULT_CONFIG: ThemeConfig = {
  colorPrimary: "#4f46e5",
  colorSecondary: "#06b6d4",
  colorAccent: "#f97316",
  colorBackground: "#0f172a",
  colorBackgroundMuted: "#1e293b",
  colorCard: "#1e293b",
  colorTextPrimary: "#f1f5f9",
  colorTextSecondary: "#94a3b8",
  colorBorder: "#334155",
  fontHeading: "system-ui",
  fontBody: "system-ui",
  borderRadius: "md",
  effect: "none",
  effectIntensity: 50,
  effectColor: "#ffffff",
  logoDoodle: "none",
  logoDoodleColor: "#ff0000",
};

export const BORDER_RADIUS_MAP: Record<BorderRadius, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "20px",
};

export const FONT_OPTIONS = [
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Roboto", value: "'Roboto', system-ui, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', system-ui, sans-serif" },
  { label: "Poppins", value: "'Poppins', system-ui, sans-serif" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
];

/** Checks if today falls within the seasonal range (year-agnostic: uses month/day only) */
export function isSeasonallyActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const today = new Date();
  const mm = today.getMonth() + 1;
  const dd = today.getDate();

  const [, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);

  const current = mm * 100 + dd;
  const startVal = sm * 100 + sd;
  const endVal = em * 100 + ed;

  if (startVal <= endVal) {
    return current >= startVal && current <= endVal;
  }
  // Wraps across year boundary (e.g. Dec 31 → Jan 3)
  return current >= startVal || current <= endVal;
}

/** Resolves which theme to display: seasonal > active > default */
export function resolveActiveTheme(themes: SiteTheme[]): SiteTheme | null {
  // Find highest-priority seasonal match
  const seasonal = themes
    .filter((t) => isSeasonallyActive(t.seasonal_start, t.seasonal_end))
    .sort((a, b) => b.priority - a.priority)[0];

  if (seasonal) return seasonal;

  // Fall back to explicitly active theme
  return themes.find((t) => t.is_active) ?? null;
}
