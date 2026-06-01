// src/store/customWindowStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";

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
  });
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
    set({ windows });
    return windowObj;
  },

  updateWindow: (id, updates) => {
    const windows = get().windows.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    );

    persistFree(windows);
    set({ windows });
  },

  deleteWindow: (id) => {
    const windows = get().windows.filter((w) => w.id !== id);
    persistFree(windows);
    set({ windows });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.windows?.length) {
      useCustomWindowStore.getState().setWindows(data.windows);
    }
  });
}
