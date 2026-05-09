import { create } from "zustand";

export interface CustomWindow {
  id: string;
  name: string;
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
  minGapToNext: number; // minutes, default 0
}

interface CustomWindowState {
  windows: CustomWindow[];
  setWindows: (windows: CustomWindow[]) => void;
  addWindow: (data: Omit<CustomWindow, "id">) => CustomWindow;
  updateWindow: (id: string, updates: Partial<CustomWindow>) => void;
  deleteWindow: (id: string) => void;
}

const STORAGE_KEY = "georoute_custom_windows";

function loadInitial(): CustomWindow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomWindow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(windows: CustomWindow[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
  } catch {}
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

if (typeof window !== "undefined") {
  const initial = loadInitial();
  if (initial.length) {
    useCustomWindowStore.getState().setWindows(initial);
  }
}
