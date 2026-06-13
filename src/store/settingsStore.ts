// src/store/settingsStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

export interface GlobalSettings {
  officePostcode: string;
  dayStart: string;
  dayEnd: string;
}

interface SettingsState {
  settings: GlobalSettings;
  loaded: boolean;
  setOfficePostcode: (postcode: string) => void;
  setDayStart: (time: string) => void;
  setDayEnd: (time: string) => void;
  loadSettings: (isFree: boolean) => Promise<void>;
  saveSettings: (isFree: boolean) => Promise<void>;
}

const STORAGE_KEY = "georoute_global_settings";

const defaultSettings: GlobalSettings = {
  officePostcode: "",
  dayStart: "06:00",
  dayEnd: "22:00",
};

function loadFromSession(): GlobalSettings {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return {
      officePostcode: parsed.officePostcode ?? defaultSettings.officePostcode,
      dayStart: parsed.dayStart ?? defaultSettings.dayStart,
      dayEnd: parsed.dayEnd ?? defaultSettings.dayEnd,
    };
  } catch {
    return { ...defaultSettings };
  }
}

function saveToSession(settings: GlobalSettings) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings },
  loaded: false,

  setOfficePostcode: (postcode) => {
    const cleaned = postcode.trim().toUpperCase();
    set((s) => ({ settings: { ...s.settings, officePostcode: cleaned } }));
  },

  setDayStart: (time) => {
    set((s) => ({ settings: { ...s.settings, dayStart: time } }));
  },

  setDayEnd: (time) => {
    set((s) => ({ settings: { ...s.settings, dayEnd: time } }));
  },

  loadSettings: async (isFree) => {
    if (isFree) {
      const sessionData = loadFromSession();
      set({ settings: sessionData, loaded: true });
      return;
    }

    // Pro/logged-in: load from Supabase
    const { data, error } = await supabase
      .from("business_settings")
      .select("office_postcode, day_start, day_end")
      .eq("id", 1)
      .single();

    if (!error && data) {
      set({
        settings: {
          officePostcode: data.office_postcode ?? "",
          dayStart: data.day_start ?? defaultSettings.dayStart,
          dayEnd: data.day_end ?? defaultSettings.dayEnd,
        },
        loaded: true,
      });
    } else {
      // Fallback to session if Supabase fails
      const sessionData = loadFromSession();
      set({ settings: sessionData, loaded: true });
    }
  },

  saveSettings: async (isFree) => {
    const { settings } = get();

    if (isFree) {
      saveToSession(settings);
      return;
    }

    // Pro: save to Supabase
    await supabase.from("business_settings").upsert(
      {
        id: 1,
        office_postcode: settings.officePostcode,
        day_start: settings.dayStart,
        day_end: settings.dayEnd,
      },
      { onConflict: "id" }
    );
  },
}));