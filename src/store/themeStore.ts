import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import {
  SiteTheme,
  ThemeConfig,
  DEFAULT_CONFIG,
  resolveActiveTheme,
} from "@/lib/theme-types";

interface ThemeState {
  themes: SiteTheme[];
  activeConfig: ThemeConfig;
  loaded: boolean;
  loadThemes: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themes: [],
  activeConfig: DEFAULT_CONFIG,
  loaded: false,

  loadThemes: async () => {
    const { data, error } = await supabase
      .from("site_themes")
      .select("*")
      .order("priority", { ascending: false });

    if (error || !data) return;

    const themes = data as SiteTheme[];
    const active = resolveActiveTheme(themes);
    set({
      themes,
      activeConfig: active ? { ...DEFAULT_CONFIG, ...active.config } : DEFAULT_CONFIG,
      loaded: true,
    });
  },
}));
