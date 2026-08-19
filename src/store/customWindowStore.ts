// src/store/customWindowStore.ts
import { create } from "zustand";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";

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
}

/**
 * Windows used to be debounced on their way to Supabase, to keep a slider
 * drag from firing a round trip per frame. Writing to the local store is cheap
 * enough that the timer only added a window in which the last edit was still
 * unsaved, so it has gone.
 */
async function persist(windows: CustomWindow[]) {
  await updateSchedulerData((d) => ({ ...d, windows }));
}

export const useCustomWindowStore = create<CustomWindowState>((set, get) => ({
  windows: [],

  setWindows: (windows) => {
    persist(windows);
    set({ windows });
  },

  addWindow: (data) => {
    const windowObj: CustomWindow = {
      id: crypto.randomUUID(),
      ...data,
    };

    const windows = [...get().windows, windowObj];
    persist(windows);
    set({ windows });
    return windowObj;
  },

  updateWindow: (id, updates) => {
    const windows = get().windows.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    );

    persist(windows);
    set({ windows });
  },

  deleteWindow: (id) => {
    const windows = get().windows.filter((w) => w.id !== id);
    persist(windows);
    set({ windows });
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
  loadFreeSchedulerData().then((data) => {
    const store = useCustomWindowStore.getState();

    if (data?.windows?.length) {
      store.setWindows(data.windows);
      return;
    }

    // Seed the defaults in one write. Adding them one at a time meant four
    // saves where the last one had to win, which is a race worth not having.
    store.setWindows(
      DEFAULT_WINDOWS.map((w) => ({ id: crypto.randomUUID(), ...w }))
    );
  });
}
