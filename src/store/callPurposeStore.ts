import { create } from "zustand";

export interface CallPurpose {
  id: string;
  name: string;   // e.g. Breakfast, Lunch, Tea
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
}

interface CallPurposeState {
  purposes: CallPurpose[];
  setPurposes: (purposes: CallPurpose[]) => void;
  addPurpose: (data: Omit<CallPurpose, "id">) => CallPurpose;
  updatePurpose: (id: string, updates: Partial<CallPurpose>) => void;
  deletePurpose: (id: string) => void;
}

const STORAGE_KEY = "georoute_call_purposes";

function loadInitialPurposes(): CallPurpose[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CallPurpose[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPurposes(purposes: CallPurpose[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(purposes));
  } catch {
    // ignore
  }
}

export const useCallPurposeStore = create<CallPurposeState>((set, get) => ({
  purposes: [],
  setPurposes: (purposes) => {
    persistPurposes(purposes);
    set({ purposes });
  },
  addPurpose: (data) => {
    const purpose: CallPurpose = {
      id: crypto.randomUUID(),
      ...data,
    };
    const purposes = [...get().purposes, purpose];
    persistPurposes(purposes);
    set({ purposes });
    return purpose;
  },
  updatePurpose: (id, updates) => {
    const purposes = get().purposes.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    persistPurposes(purposes);
    set({ purposes });
  },
  deletePurpose: (id) => {
    const purposes = get().purposes.filter((p) => p.id !== id);
    persistPurposes(purposes);
    set({ purposes });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialPurposes();
  if (initial.length) {
    useCallPurposeStore.getState().setPurposes(initial);
  }
}
