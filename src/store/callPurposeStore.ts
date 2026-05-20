// src/store/callPurposeStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";

export interface CallPurpose {
  id: string;
  name: string;
  start: string;
  end: string;
}

interface CallPurposeState {
  purposes: CallPurpose[];
  setPurposes: (purposes: CallPurpose[]) => void;
  addPurpose: (data: Omit<CallPurpose, "id">) => CallPurpose;
  updatePurpose: (id: string, updates: Partial<CallPurpose>) => void;
  deletePurpose: (id: string) => void;
}

async function persistFree(purposes: CallPurpose[]) {
  const data = (await loadFreeSchedulerData()) ?? {};
  await saveFreeSchedulerData({ ...data, purposes });
}

export const useCallPurposeStore = create<CallPurposeState>((set, get) => ({
  purposes: [],

  setPurposes: (purposes) => {
    persistFree(purposes);
    set({ purposes });
  },

  addPurpose: (data) => {
    const purpose: CallPurpose = {
      id: crypto.randomUUID(),
      ...data,
    };

    const purposes = [...get().purposes, purpose];
    persistFree(purposes);
    set({ purposes });
    return purpose;
  },

  updatePurpose: (id, updates) => {
    const purposes = get().purposes.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );

    persistFree(purposes);
    set({ purposes });
  },

  deletePurpose: (id) => {
    const purposes = get().purposes.filter((p) => p.id !== id);
    persistFree(purposes);
    set({ purposes });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.purposes?.length) {
      useCallPurposeStore.getState().setPurposes(data.purposes);
    }
  });
}
