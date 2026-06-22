"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { ThemeConfig, BORDER_RADIUS_MAP } from "@/lib/theme-types";
import ParticleCanvas from "@/components/effects/ParticleCanvas";

/** Apply a ThemeConfig to the document root as CSS custom properties. */
function applyTheme(config: ThemeConfig) {
  const r = document.documentElement;
  r.style.setProperty("--theme-primary", config.colorPrimary);
  r.style.setProperty("--theme-secondary", config.colorSecondary);
  r.style.setProperty("--theme-accent", config.colorAccent);
  r.style.setProperty("--theme-bg", config.colorBackground);
  r.style.setProperty("--theme-bg-muted", config.colorBackgroundMuted);
  r.style.setProperty("--theme-card", config.colorCard);
  r.style.setProperty("--theme-text", config.colorTextPrimary);
  r.style.setProperty("--theme-text-muted", config.colorTextSecondary);
  r.style.setProperty("--theme-border", config.colorBorder);
  r.style.setProperty(
    "--theme-radius",
    BORDER_RADIUS_MAP[config.borderRadius] ?? "8px"
  );
  r.style.setProperty("--theme-font-heading", config.fontHeading);
  r.style.setProperty("--theme-font-body", config.fontBody);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeConfig, loaded, loadThemes } = useThemeStore();

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  useEffect(() => {
    if (loaded) applyTheme(activeConfig);
  }, [activeConfig, loaded]);

  return (
    <>
      {children}
      {loaded && activeConfig.effect !== "none" && (
        <ParticleCanvas
          effect={activeConfig.effect}
          intensity={activeConfig.effectIntensity}
          color={activeConfig.effectColor}
        />
      )}
    </>
  );
}
