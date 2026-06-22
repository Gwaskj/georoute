// src/store/customWindowStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";
import { supabase } from "@/lib/supabase/client";

export interface CustomWindow {
  id: string;
  name: string;
  start: string;
  end: string;
  minGapToNext: number;
}

interface CustomWindowState {
  windows: CustomWindow[];
  setWindows: (windows: CustomWindow[]) => void;
  addWindow: (data: Omit<CustomWindow, "id">) => CustomWindow;
  updateWindow: (id: string, updates: Partial<CustomWindow>) => void;
  deleteWindow: (id: string) => void;
  loadFromSupabase: () => Promise<void>;
}

async function isPro(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.is_pro === true;
}

async function persistFree(windows: CustomWindow[]) {
  const data = (await loadFreeSchedulerData()) ?? {
    staff: [],
    appointments: [],
    routes: [],
    windows: [],
  };

  await saveFreeSchedulerData({
    staff: data.staff ?? [],
    appointments: data.appointments ?? [],
    routes: data.routes ?? [],
    windows,
    skills: data.skills ?? [],
    officePostcode: data.officePostcode ?? "",
    selectedStaffIds: data.selectedStaffIds ?? [],
    visits: data.visits ?? [],
  });
}

let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSync: CustomWindow[] | null = null;

function scheduleSyncPro(windows: CustomWindow[]) {
  _pendingSync = windows;
  if (_syncTimer) return;
  _syncTimer = setTimeout(async () => {
    _syncTimer = null;
    const wins = _pendingSync!;
    _pendingSync = null;
    const pro = await isPro();
    if (pro) await persistPro(wins);
  }, 300);
}

async function persistPro(windows: CustomWindow[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: delError } = await supabase
    .from("user_windows")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    console.error("Failed to clear pro windows:", delError);
    return;
  }

  if (windows.length === 0) return;

  const { error: insError } = await supabase.from("user_windows").insert(
    windows.map((w) => ({
      user_id: user.id,
      local_id: w.id,
      name: w.name,
      start_time: w.start,
      end_time: w.end,
      min_gap_to_next: w.minGapToNext,
    }))
  );

  if (insError) {
    console.error("Failed to insert pro windows:", insError);
  }
}

export const useCustomWindowStore = create<CustomWindowState>((set, get) => ({
  windows: [],

  setWindows: (windows) => {
    persistFree(windows);
    set({ windows });
  },

  addWindow: (data) => {
    const windowObj: CustomWindow = {
      id: crypto.randomUUID(),
      ...data,
    };

    const windows = [...get().windows, windowObj];
    persistFree(windows);
    scheduleSyncPro(windows);
    set({ windows });
    return windowObj;
  },

  updateWindow: (id, updates) => {
    const windows = get().windows.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    );

    persistFree(windows);
    scheduleSyncPro(windows);
    set({ windows });
  },

  deleteWindow: (id) => {
    const windows = get().windows.filter((w) => w.id !== id);
    persistFree(windows);
    scheduleSyncPro(windows);
    set({ windows });
  },

  loadFromSupabase: async () => {
    const pro = await isPro();
    if (!pro) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_windows")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    const seen = new Set<string>();
    const mapped: CustomWindow[] = data
      .filter((row) => {
        const id = row.local_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row) => ({
        id: row.local_id,
        name: row.name ?? "",
        start: row.start_time ?? "00:00",
        end: row.end_time ?? "00:00",
        minGapToNext: row.min_gap_to_next ?? 0,
      }));

    set({ windows: mapped });
  },
}));

const DEFAULT_WINDOWS: Omit<CustomWindow, "id">[] = [
  { name: "Breakfast", start: "07:00", end: "09:30", minGapToNext: 120 },
  { name: "Lunch",     start: "11:30", end: "14:00", minGapToNext: 120 },
  { name: "Tea",       start: "15:00", end: "17:30", minGapToNext: 120 },
  { name: "Bedtime",   start: "19:00", end: "22:00", minGapToNext: 0   },
];

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then(async (data) => {
    const store = useCustomWindowStore.getState();

    // Pro users: load from Supabase
    const pro = await isPro();
    if (pro) {
      await store.loadFromSupabase();
      // Re-read current state — store snapshot above is stale after set()
      if (useCustomWindowStore.getState().windows.length === 0) {
        DEFAULT_WINDOWS.forEach((w) => useCustomWindowStore.getState().addWindow(w));
      }
      return;
    }

    // Free users: load from session, seed defaults if empty
    if (data?.windows?.length) {
      store.setWindows(data.windows);
    } else {
      DEFAULT_WINDOWS.forEach((w) => store.addWindow(w));
    }
  });
}
