// src/store/settingsStore.ts
import { create } from "zustand";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";

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
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: GlobalSettings = {
  officePostcode: "",
  dayStart: "06:00",
  dayEnd: "22:00",
};

function withDefaults(parsed: Partial<GlobalSettings> | null | undefined): GlobalSettings {
  if (!parsed) return { ...defaultSettings };
  return {
    officePostcode: parsed.officePostcode ?? defaultSettings.officePostcode,
    dayStart: parsed.dayStart ?? defaultSettings.dayStart,
    dayEnd: parsed.dayEnd ?? defaultSettings.dayEnd,
  };
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

  /**
   * Pro users used to read this from business_settings, keyed by user_id. It
   * was the last thing a customer typed that we still held: an office
   * postcode is their own address rather than a client's, but there was no
   * reason to keep it once everything around it went local.
   *
   * Nothing is carried over from the old sessionStorage key. That copy died
   * with the tab anyway, and starting blank is the honest state now that the
   * row it mirrored no longer exists.
   */
  loadSettings: async () => {
    const data = await loadFreeSchedulerData();
    set({ settings: withDefaults(data?.settings), loaded: true });
  },

  saveSettings: async () => {
    const { settings } = get();
    await updateSchedulerData((d) => ({ ...d, settings }));
  },
}));
