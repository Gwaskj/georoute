// src/store/settingsStore.ts
import { create } from "zustand";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";
import {
  DEFAULT_COUNTRY,
  isCountryCode,
  type CountryCode,
} from "@/lib/geo/countries";
import { clearPostcodeCache } from "@/lib/postcode/validate";

export interface GlobalSettings {
  officePostcode: string;
  dayStart: string;
  dayEnd: string;
  /**
   * Which country's addresses this workspace plans in, ISO 3166-1 alpha-2.
   *
   * Decides which geocoder answers, what the postcode field is called, and how
   * a postcode is validated. Part of the routing cache key too, because
   * postcode formats repeat across countries.
   */
  country: CountryCode;
}

interface SettingsState {
  settings: GlobalSettings;
  loaded: boolean;
  setOfficePostcode: (postcode: string) => void;
  setDayStart: (time: string) => void;
  setDayEnd: (time: string) => void;
  setCountry: (country: CountryCode) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: GlobalSettings = {
  officePostcode: "",
  dayStart: "06:00",
  dayEnd: "22:00",
  country: DEFAULT_COUNTRY,
};

function withDefaults(parsed: Partial<GlobalSettings> | null | undefined): GlobalSettings {
  if (!parsed) return { ...defaultSettings };
  return {
    officePostcode: parsed.officePostcode ?? defaultSettings.officePostcode,
    dayStart: parsed.dayStart ?? defaultSettings.dayStart,
    dayEnd: parsed.dayEnd ?? defaultSettings.dayEnd,
    // A workspace saved before countries existed is a UK one.
    country: isCountryCode(parsed.country) ? parsed.country : defaultSettings.country,
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

  setCountry: (country) => {
    set((s) => ({ settings: { ...s.settings, country } }));
    // Cached checks belong to the previous country: the same characters can be
    // a real postcode in one place and nonsense in another, and a remembered
    // verdict would be applied to the wrong one.
    clearPostcodeCache();
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
